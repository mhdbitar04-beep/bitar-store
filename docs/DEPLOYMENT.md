# دليل رفع BITAR STORE على سيرفر (Ubuntu 24.04)

المعمارية المقترحة:

- `api.bitarstore.com` ← Laravel (Nginx + PHP-FPM + MySQL)
- `bitarstore.com` ← ملفات React الثابتة (Nginx، أو Vercel/Netlify)

---

## 1) تجهيز السيرفر

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx mysql-server git unzip supervisor \
  php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl \
  php8.3-zip php8.3-bcmath php8.3-intl php8.3-gd
curl -sS https://getcomposer.org/installer | php && sudo mv composer.phar /usr/local/bin/composer
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
```

## 2) قاعدة البيانات

```bash
sudo mysql
CREATE DATABASE bitar_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bitar'@'localhost' IDENTIFIED BY 'كلمة-سر-قوية';
GRANT ALL PRIVILEGES ON bitar_store.* TO 'bitar'@'localhost';
FLUSH PRIVILEGES;
```

## 3) الـ API

```bash
sudo mkdir -p /var/www && cd /var/www
sudo git clone https://github.com/<you>/bitar-store.git
sudo chown -R $USER:www-data bitar-store && cd bitar-store/backend

composer install --no-dev --optimize-autoloader
cp .env.example .env
nano .env
```

القيم المهمة بملف `.env` على السيرفر:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.bitarstore.com
FRONTEND_URL=https://bitarstore.com
DB_DATABASE=bitar_store
DB_USERNAME=bitar
DB_PASSWORD=...
PAYMENT_GATEWAY=stripe
STRIPE_KEY=pk_live_or_test...
STRIPE_SECRET=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...     # من Stripe Dashboard → Webhooks
MAIL_MAILER=smtp                     # لرسائل استعادة كلمة السر
```

```bash
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force          # فقط لو بدك بيانات تجريبية
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan event:cache
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### إعداد Nginx للـ API

`/etc/nginx/sites-available/bitar-api`

```nginx
server {
    listen 80;
    server_name api.bitarstore.com;
    root /var/www/bitar-store/backend/public;
    index index.php;

    client_max_body_size 20M;   # لرفع صور المنتجات

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    }

    location ~* \.(jpg|jpeg|png|webp|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location ~ /\.(?!well-known) { deny all; }
}
```

## 4) الـ Queue والـ Scheduler

الـ Scheduler بيلغي الطلبات غير المدفوعة وبيرجّع المخزون كل ربع ساعة:

```bash
( crontab -l 2>/dev/null; echo "* * * * * cd /var/www/bitar-store/backend && php artisan schedule:run >> /dev/null 2>&1" ) | crontab -
```

عامل الـ Queue عبر Supervisor (للإيميلات):

`/etc/supervisor/conf.d/bitar-worker.conf`

```ini
[program:bitar-worker]
command=php /var/www/bitar-store/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
user=www-data
numprocs=1
autostart=true
autorestart=true
stdout_logfile=/var/www/bitar-store/backend/storage/logs/worker.log
```

```bash
sudo supervisorctl reread && sudo supervisorctl update
```

## 5) الفرونت إند

```bash
cd /var/www/bitar-store/frontend
echo "VITE_API_URL=https://api.bitarstore.com/api/v1" > .env.production
npm ci && npm run build        # الناتج بمجلد dist/
```

`/etc/nginx/sites-available/bitar-web`

```nginx
server {
    listen 80;
    server_name bitarstore.com www.bitarstore.com;
    root /var/www/bitar-store/frontend/dist;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json;

    # الملفات اللي أسماؤها فيها hash بتتخزن سنة كاملة
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA: كل المسارات بترجع لـ index.html
    location / {
        try_files $uri /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bitar-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/bitar-web /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

> بديل للفرونت: ارفع مجلد `frontend` على Vercel أو Netlify، وحط `VITE_API_URL` كمتغير بيئة، وضيف rewrite لكل المسارات على `/index.html`.

## 6) HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bitarstore.com -d www.bitarstore.com -d api.bitarstore.com
```

## 7) Stripe Webhook بالإنتاج

من Stripe Dashboard ← Developers ← Webhooks ← Add endpoint:

- الرابط: `https://api.bitarstore.com/api/v1/webhooks/stripe`
- الأحداث: `payment_intent.succeeded` و `payment_intent.payment_failed`
- انسخ الـ Signing secret وحطه بـ `STRIPE_WEBHOOK_SECRET`، وبعدين نفّذ `php artisan config:cache`

## 8) سكربت التحديث (Deploy)

```bash
cd /var/www/bitar-store && git pull
cd backend && composer install --no-dev --optimize-autoloader \
  && php artisan migrate --force && php artisan optimize && sudo supervisorctl restart bitar-worker
cd ../frontend && npm ci && npm run build
```

## قائمة الأمان قبل الإطلاق

- [ ] `APP_DEBUG=false`، وملف `.env` مش موجود بالـ Git
- [ ] `FRONTEND_URL` هو الدومين الحقيقي، لأن الـ CORS بيعتمد عليه
- [ ] شهادات HTTPS مفعّلة للدومينين
- [ ] نسخ احتياطي يومي للقاعدة: `mysqldump bitar_store | gzip > backup-$(date +%F).sql.gz`
- [ ] تغيير كلمات سر حسابات الأدمن التجريبية (أو عدم تشغيل الـ seed)
