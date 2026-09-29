import { hash } from '@node-rs/argon2';
import {
  PrismaClient,
  Role,
  Locale,
  District,
  Language,
  Schedule,
  NannyStatus,
  RequestStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// Approximate district centroids in Yerevan (lat, lng).
const CENTROIDS: Partial<Record<District, [number, number]>> = {
  KENTRON: [40.181, 44.514],
  ARABKIR: [40.204, 44.493],
  KANAKER_ZEYTUN: [40.207, 44.535],
  AJAPNYAK: [40.192, 44.455],
  DAVTASHEN: [40.223, 44.47],
  NOR_NORK: [40.205, 44.562],
  EREBUNI: [40.14, 44.53],
  SHENGAVIT: [40.148, 44.48],
  MALATIA_SEBASTIA: [40.16, 44.46],
  AVAN: [40.223, 44.545],
  NUBARASHEN: [40.115, 44.545],
  NORK_MARASH: [40.175, 44.545],
};

/** Deterministic ±300 m jitter so seeds are reproducible (no Math.random). */
function jitter([lat, lng]: [number, number], n: number): [number, number] {
  const dLat = ((((n * 37) % 60) - 30) / 30) * 0.0027; // ~±300 m
  const dLng = ((((n * 53) % 60) - 30) / 30) * 0.0035;
  return [lat + dLat, lng + dLng];
}

const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

const VERIFIED_NANNIES = [
  { name: 'Անահիտ Գրիգորյան', locale: Locale.hy, district: District.ARABKIR, langs: [Language.HY, Language.RU], exp: 12, summary: 'Փորձառու դայակ, աշխատել է 1–6 տարեկան երեխաների հետ։ Հանգիստ և ուշադիր։' },
  { name: 'Марина Восканян', locale: Locale.ru, district: District.KENTRON, langs: [Language.RU, Language.HY], exp: 8, summary: 'Опытная няня для малышей 0–3 лет. Спокойная, пунктуальная, с рекомендациями.' },
  { name: 'Լուսինե Հակոբյան', locale: Locale.hy, district: District.KANAKER_ZEYTUN, langs: [Language.HY, Language.EN], exp: 5, summary: 'Սիրում է ստեղծագործական խաղեր, խոսում է անգլերեն երեխաների հետ։' },
  { name: 'Гаяне Саркисян', locale: Locale.ru, district: District.NOR_NORK, langs: [Language.RU, Language.HY], exp: 15, summary: 'Более 15 лет опыта, работала в нескольких семьях с детьми школьного возраста.' },
  { name: 'Նարինե Պետրոսյան', locale: Locale.hy, district: District.DAVTASHEN, langs: [Language.HY, Language.RU], exp: 3, summary: 'Երիտասարդ, եռանդուն դայակ 1–3 տարեկան երեխաների համար։' },
  { name: 'Susan Melkonyan', locale: Locale.en, district: District.AJAPNYAK, langs: [Language.EN, Language.HY], exp: 7, summary: 'Warm, reliable nanny experienced with toddlers and preschoolers. Speaks English at home.' },
  { name: 'Զարուհի Մկրտչյան', locale: Locale.hy, district: District.SHENGAVIT, langs: [Language.HY], exp: 20, summary: 'Երկարամյա փորձ, հատկապես նորածինների խնամքում։ Բժշկական նախնական գիտելիքներ։' },
  { name: 'Ирина Даниелян', locale: Locale.ru, district: District.MALATIA_SEBASTIA, langs: [Language.RU, Language.HY], exp: 6, summary: 'Внимательная няня, готова к работе на полный день, есть проверенные рекомендации.' },
  { name: 'Մարիամ Ավագյան', locale: Locale.hy, district: District.EREBUNI, langs: [Language.HY, Language.RU], exp: 9, summary: 'Հմուտ դայակ 3–6 տարեկան երեխաների համար, օգնում է դասերին։' },
  { name: 'Кристина Оганесян', locale: Locale.ru, district: District.AVAN, langs: [Language.RU, Language.EN], exp: 4, summary: 'Молодая няня со знанием английского, любит активные игры на воздухе.' },
  { name: 'Սոնա Բաղդասարյան', locale: Locale.hy, district: District.KENTRON, langs: [Language.HY, Language.RU], exp: 11, summary: 'Հանգիստ բնավորությամբ դայակ, հասանելի է նաև որպես փոխարինող։' },
  { name: 'Անի Խաչատրյան', locale: Locale.hy, district: District.NORK_MARASH, langs: [Language.HY, Language.RU], exp: 2, summary: 'Սկսնակ, բայց խնամքով և պատասխանատու, երեկոյան և հանգստյան օրերի համար։' },
] as const;

async function main() {
  console.log('Seeding Dayak…');

  // Clean (dev only). Order matters for FKs.
  await prisma.requestEvent.deleteMany();
  await prisma.matchRequest.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.reference.deleteMany();
  await prisma.document.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.nannyProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // --- Admin ---
  await prisma.user.create({
    data: {
      email: 'admin@dayak.local',
      name: 'Dayak Admin',
      role: Role.ADMIN,
      locale: Locale.en,
      passwordHash: await hash('admin1234', ARGON),
    },
  });

  // --- Verified nannies ---
  const nannyIds: string[] = [];
  for (let i = 0; i < VERIFIED_NANNIES.length; i++) {
    const n = VERIFIED_NANNIES[i]!;
    const centroid = CENTROIDS[n.district]!;
    const [pLat, pLng] = jitter(centroid, i + 1);
    const user = await prisma.user.create({
      data: {
        email: `nanny${i + 1}@dayak.local`,
        name: n.name,
        role: Role.NANNY,
        locale: n.locale,
        passwordHash: await hash('nanny1234', ARGON),
        nanny: {
          create: {
            status: NannyStatus.VERIFIED,
            district: n.district,
            lat: centroid[0],
            lng: centroid[1],
            publicLat: pLat,
            publicLng: pLng,
            languages: [...n.langs],
            experienceYears: n.exp,
            ageGroups: ['1-3', '3-6'],
            schedules: [Schedule.FULL_DAY, Schedule.HALF_DAY],
            rateHourAmd: 1500 + (i % 4) * 250,
            rateMonthAmd: 200000 + (i % 5) * 25000,
            backupWilling: i % 3 === 0,
            publicSummary: n.summary,
            aiScore: 70 + (i % 25),
            aiFlags: [],
            verifiedAt: new Date(),
          },
        },
      },
      include: { nanny: true },
    });
    if (user.nanny) nannyIds.push(user.nanny.id);
  }

  // --- Nannies under review (with fixture interviews) ---
  for (let i = 0; i < 3; i++) {
    await prisma.user.create({
      data: {
        email: `review${i + 1}@dayak.local`,
        name: ['Թամարա Սիմոնյան', 'Елена Петросян', 'Ruzanna Grigoryan'][i]!,
        role: Role.NANNY,
        locale: [Locale.hy, Locale.ru, Locale.en][i]!,
        passwordHash: await hash('nanny1234', ARGON),
        nanny: {
          create: {
            status: NannyStatus.UNDER_REVIEW,
            district: [District.ARABKIR, District.KENTRON, District.NOR_NORK][i]!,
            languages: [Language.HY, Language.RU],
            experienceYears: 4 + i,
            ageGroups: ['0-1', '1-3'],
            schedules: [Schedule.FULL_DAY],
            rateHourAmd: 1600,
            rateMonthAmd: 240000,
            aiScore: 62 + i * 5,
            aiFlags: i === 0 ? ['gap_in_history'] : [],
            aiSummary: 'Fixture interview summary for admin review (seed data).',
            interviews: {
              create: {
                locale: [Locale.hy, Locale.ru, Locale.en][i]!,
                model: 'seed-fixture',
                completedAt: new Date(),
                transcript: [
                  { role: 'assistant', content: 'Բարև, պատմեք ձեր փորձի մասին։', ts: Date.now() },
                  { role: 'user', content: 'Աշխատել եմ 4 ընտանիքում 5 տարի։', ts: Date.now() },
                ],
                structured: { experience_years: 4 + i, consistency_score: 62 + i * 5 },
              },
            },
            references: {
              create: [
                { name: 'Ref One', phone: '+37491000001', relation: 'parent_employer' },
                { name: 'Ref Two', phone: '+37491000002', relation: 'parent_employer' },
              ],
            },
          },
        },
      },
    });
  }

  // --- Parents ---
  const parentIds: string[] = [];
  for (let i = 0; i < 4; i++) {
    const centroid = CENTROIDS[District.KENTRON]!;
    const user = await prisma.user.create({
      data: {
        email: `parent${i + 1}@dayak.local`,
        name: ['Արմen Family', 'Семья Мкртчян', 'The Baghdasaryans', 'Ընտանիք Հ.'][i]!,
        role: Role.PARENT,
        locale: [Locale.hy, Locale.ru, Locale.en, Locale.hy][i]!,
        phone: `+3749100010${i}`,
        passwordHash: await hash('parent1234', ARGON),
        parent: {
          create: {
            district: [District.KENTRON, District.ARABKIR, District.NOR_NORK, District.DAVTASHEN][i]!,
            lat: centroid[0],
            lng: centroid[1],
            children: [{ ageMonths: 18 + i * 12 }],
            languages: [Language.HY, Language.RU],
          },
        },
      },
      include: { parent: true },
    });
    if (user.parent) parentIds.push(user.parent.id);
  }

  // --- Match requests across statuses ---
  const statuses: RequestStatus[] = [
    RequestStatus.NEW,
    RequestStatus.CONTACTED,
    RequestStatus.INTRO_SCHEDULED,
    RequestStatus.FEE_PENDING,
    RequestStatus.FEE_PAID,
    RequestStatus.ACTIVE,
  ];
  for (let i = 0; i < 6; i++) {
    await prisma.matchRequest.create({
      data: {
        parentId: parentIds[i % parentIds.length]!,
        nannyId: i % 2 === 0 ? nannyIds[i % nannyIds.length]! : null,
        status: statuses[i]!,
        schedule: Schedule.FULL_DAY,
        startWhen: ['this_week', '2_weeks', 'month', 'browsing'][i % 4]!,
        backupImportance: ['very', 'nice', 'no'][i % 3]!,
        message: 'Seed request',
        feePaidAt:
          statuses[i] === RequestStatus.FEE_PAID || statuses[i] === RequestStatus.ACTIVE
            ? new Date()
            : null,
      },
    });
  }

  console.log('Seed complete: 1 admin, 12 verified + 3 under-review nannies, 4 parents, 6 requests.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
