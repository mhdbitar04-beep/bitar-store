import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { GuestOnly, RequireAdmin, RequireAuth } from '@/components/layout/Guards'
import { RootLayout } from '@/components/layout/RootLayout'

// Route-level code splitting: every page is its own chunk.
const HomePage = lazy(() => import('@/pages/HomePage'))
const ProductsPage = lazy(() => import('@/pages/ProductsPage'))
const ProductPage = lazy(() => import('@/pages/ProductPage'))
const WishlistPage = lazy(() => import('@/pages/WishlistPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const CheckoutSuccessPage = lazy(() => import('@/pages/CheckoutSuccessPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const AdminDashboard = lazy(() => import('@/pages/admin/DashboardPage'))
const AdminProducts = lazy(() => import('@/pages/admin/ProductsPage'))
const AdminProductForm = lazy(() => import('@/pages/admin/ProductFormPage'))
const AdminCategories = lazy(() => import('@/pages/admin/CategoriesPage'))
const AdminCoupons = lazy(() => import('@/pages/admin/CouponsPage'))
const AdminOrders = lazy(() => import('@/pages/admin/OrdersPage'))
const AdminOrderDetail = lazy(() => import('@/pages/admin/OrderDetailPage'))

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/products', element: <ProductsPage /> },
      { path: '/products/:slug', element: <ProductPage /> },
      { path: '/login', element: <GuestOnly><LoginPage /></GuestOnly> },
      { path: '/register', element: <GuestOnly><RegisterPage /></GuestOnly> },
      { path: '/forgot-password', element: <GuestOnly><ForgotPasswordPage /></GuestOnly> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/wishlist', element: <RequireAuth><WishlistPage /></RequireAuth> },
      { path: '/checkout', element: <RequireAuth><CheckoutPage /></RequireAuth> },
      { path: '/checkout/success', element: <RequireAuth><CheckoutSuccessPage /></RequireAuth> },
      { path: '/account', element: <RequireAuth><ProfilePage /></RequireAuth> },
      { path: '/account/orders', element: <RequireAuth><OrdersPage /></RequireAuth> },
      { path: '/account/orders/:number', element: <RequireAuth><OrderDetailPage /></RequireAuth> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin',
    element: <RequireAdmin><AdminLayout /></RequireAdmin>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'products/new', element: <AdminProductForm /> },
      { path: 'products/:id', element: <AdminProductForm /> },
      { path: 'categories', element: <AdminCategories /> },
      { path: 'coupons', element: <AdminCoupons /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'orders/:id', element: <AdminOrderDetail /> },
    ],
  },
])
