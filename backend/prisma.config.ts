import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/models',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seeders/main.seeder.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
