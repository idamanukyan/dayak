/**
 * Create (or promote) an admin user.
 *   pnpm --filter @dayak/db exec tsx ../../scripts/add-admin.ts <email> <password> [name]
 * or from repo root:
 *   pnpm tsx scripts/add-admin.ts admin@dayak.am 's3cret' "Coordinator"
 */
import { hash } from '@node-rs/argon2';
import { PrismaClient, Role, Locale } from '@prisma/client';

const prisma = new PrismaClient();
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: add-admin.ts <email> <password> [name]');
    process.exit(1);
  }
  const passwordHash = await hash(password, ARGON);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, passwordHash },
    create: { email, name: name ?? 'Admin', role: Role.ADMIN, locale: Locale.en, passwordHash },
  });
  console.log(`Admin ready: ${user.email} (${user.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
