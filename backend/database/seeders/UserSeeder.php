<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Mohammad Bitar',
            'email' => 'admin@bitarstore.test',
        ]);

        $customer = User::factory()->create([
            'name' => 'Demo Customer',
            'email' => 'customer@bitarstore.test',
        ]);

        Address::factory()->for($customer)->create(['is_default' => true, 'label' => 'Home']);

        User::factory(30)->create()->each(
            fn (User $user) => Address::factory()->for($user)->create(['is_default' => true])
        );
    }
}
