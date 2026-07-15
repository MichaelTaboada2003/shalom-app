import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

const DEFAULT_PASSWORD = 'Shalom2026!';

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) throw new Error('DATABASE_URL no está definida. Crea .env.local antes de ejecutar el seed.');
  const line = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).find(value => value.startsWith('DATABASE_URL='));
  const value = line?.slice('DATABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
  if (!value) throw new Error('DATABASE_URL no está definida.');
  return value;
}

const sql = neon(readDatabaseUrl());
const seedPassword = process.env.SEED_ADMIN_PASSWORD || DEFAULT_PASSWORD;
const seedUsers = [
  { email: 'seed.admin@shalom.test', name: 'María Shalom', role: 'admin' },
  { email: 'seed.leader@shalom.test', name: 'Daniel Rivera', role: 'leader' },
  { email: 'seed.member@shalom.test', name: 'Valentina Cruz', role: 'member' },
];
const seedMembers = [
  { fullName: 'Ana Sofía Gómez', email: 'ana.gomez@shalom.test', phone: '300 555 0101', birthDate: '1992-08-02', avatarStyle: 'lilac', ministry: 'Música', bio: 'Le encanta recibir a las personas con una canción y una sonrisa.', status: 'active' },
  { fullName: 'Samuel Torres', email: 'samuel.torres@shalom.test', phone: '300 555 0102', birthDate: '1988-07-25', avatarStyle: 'sky', ministry: 'Jóvenes', bio: 'Conecta a los jóvenes de la comunidad con mucha energía.', status: 'active' },
  { fullName: 'Camila Ríos', email: 'camila.rios@shalom.test', phone: '300 555 0103', birthDate: '1996-09-18', avatarStyle: 'mint', ministry: 'Acogida', bio: 'Hace que cada persona nueva se sienta en casa.', status: 'active' },
  { fullName: 'Mateo Salazar', email: 'mateo.salazar@shalom.test', phone: '300 555 0104', birthDate: '1985-11-09', avatarStyle: 'sunset', ministry: 'Logística', bio: 'Siempre tiene una solución práctica para cada retiro.', status: 'active' },
  { fullName: 'Juliana Peña', email: 'juliana.pena@shalom.test', phone: '300 555 0105', birthDate: '1990-12-22', avatarStyle: 'rose', ministry: 'Infantil', bio: 'Cuenta historias que los más pequeños nunca olvidan.', status: 'active' },
  { fullName: 'Tomás Herrera', email: 'tomas.herrera@shalom.test', phone: null, birthDate: null, avatarStyle: 'sky', ministry: 'Comunidad', bio: 'Perfil de ejemplo sin cumpleaños para probar estados vacíos.', status: 'inactive' },
];
const seedChecklists = [
  { title: 'Reunión de comunidad', emoji: '⛪', items: ['Preparar bienvenida', 'Revisar equipo de sonido', 'Compartir roles', 'Cerrar con oración'] },
  { title: 'Retiro Shalom · Demo', emoji: '✦', items: ['Confirmar asistentes', 'Preparar kits', 'Organizar transporte'] },
  { title: 'Ideas para la semana', emoji: '☀', items: ['Llamar a una persona nueva', 'Celebrar un cumpleaños', 'Actualizar el Mundo Shalom'] },
];

async function getOrCreateUser(user, passwordHash) {
  const existing = await sql`SELECT id, email, name, role FROM users WHERE email = ${user.email}`;
  if (existing[0]) return { row: existing[0], created: false };
  const rows = await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${user.email}, ${passwordHash}, ${user.name}, ${user.role})
    RETURNING id, email, name, role
  `;
  return { row: rows[0], created: true };
}

async function getOrCreateMember(member) {
  const existing = await sql`SELECT id FROM members WHERE lower(email) = lower(${member.email}) LIMIT 1`;
  if (existing[0]) return { id: existing[0].id, created: false };
  const rows = await sql`
    INSERT INTO members (full_name, email, phone, birth_date, avatar_style, ministry, bio, status)
    VALUES (${member.fullName}, ${member.email}, ${member.phone}, ${member.birthDate}, ${member.avatarStyle}, ${member.ministry}, ${member.bio}, ${member.status})
    RETURNING id
  `;
  return { id: rows[0].id, created: true };
}

async function getOrCreateChecklist(checklist) {
  const existing = await sql`SELECT id FROM checklists WHERE title = ${checklist.title} LIMIT 1`;
  const checklistId = existing[0]?.id ?? (await sql`
    INSERT INTO checklists (title, emoji) VALUES (${checklist.title}, ${checklist.emoji}) RETURNING id
  `)[0].id;
  const itemCount = await sql`SELECT count(*)::int AS count FROM checklist_items WHERE checklist_id = ${checklistId}`;
  if (Number(itemCount[0].count) === 0) {
    for (const [position, text] of checklist.items.entries()) {
      await sql`INSERT INTO checklist_items (checklist_id, text, position) VALUES (${checklistId}, ${text}, ${position})`;
    }
  }
  return { id: checklistId, created: !existing[0] };
}

async function getOrCreateReminder({ memberId, createdBy, title, daysBefore, subject, message, recipients }) {
  const existing = await sql`SELECT id FROM birthday_reminders WHERE member_id = ${memberId} AND title = ${title} LIMIT 1`;
  const reminderId = existing[0]?.id ?? (await sql`
    INSERT INTO birthday_reminders (member_id, title, days_before, subject, message, active, created_by)
    VALUES (${memberId}, ${title}, ${daysBefore}, ${subject}, ${message}, true, ${createdBy})
    RETURNING id
  `)[0].id;
  for (const recipient of recipients) {
    await sql`
      INSERT INTO birthday_reminder_recipients (reminder_id, email, name)
      VALUES (${reminderId}, ${recipient.email}, ${recipient.name})
      ON CONFLICT (reminder_id, email) DO NOTHING
    `;
  }
  return { id: reminderId, created: !existing[0] };
}

async function seed() {
  const passwordHash = await bcrypt.hash(seedPassword, 12);
  const users = [];
  for (const user of seedUsers) users.push(await getOrCreateUser(user, passwordHash));
  const admin = users.find(({ row }) => row.role === 'admin')?.row;
  const leader = users.find(({ row }) => row.role === 'leader')?.row;
  if (!admin || !leader) throw new Error('No se pudieron preparar los usuarios seed.');

  const members = [];
  for (const member of seedMembers) members.push({ ...member, ...(await getOrCreateMember(member)) });
  for (const checklist of seedChecklists) await getOrCreateChecklist(checklist);

  const ana = members.find(member => member.email === 'ana.gomez@shalom.test');
  const samuel = members.find(member => member.email === 'samuel.torres@shalom.test');
  if (!ana || !samuel) throw new Error('No se pudieron preparar los integrantes seed.');

  await getOrCreateReminder({
    memberId: ana.id,
    createdBy: leader.id,
    title: 'Avisar al equipo de música',
    daysBefore: 7,
    subject: 'Se acerca el cumpleaños de Ana Sofía',
    message: 'Preparemos una nota especial para celebrar a Ana Sofía en la próxima reunión.',
    recipients: [
      { email: 'seed.admin@shalom.test', name: 'María Shalom' },
      { email: 'seed.leader@shalom.test', name: 'Daniel Rivera' },
    ],
  });
  await getOrCreateReminder({
    memberId: samuel.id,
    createdBy: admin.id,
    title: 'Aviso general de cumpleaños',
    daysBefore: 3,
    subject: null,
    message: null,
    recipients: [{ email: 'comunidad@shalom.test', name: 'Equipo Shalom' }],
  });

  console.log('✓ Seed aplicado de forma idempotente.');
  console.log(`  Usuarios demo: ${seedUsers.length}`);
  console.log(`  Integrantes demo: ${seedMembers.length}`);
  console.log(`  Checklists demo: ${seedChecklists.length}`);
  console.log('  Recordatorios demo: 2');
  console.log(`  Login demo: ${seedUsers[0].email} / ${seedPassword}`);
  console.log(`  Login líder: ${seedUsers[1].email} / ${seedPassword}`);
}

seed().catch(error => {
  console.error(`Seed falló: ${error instanceof Error ? error.message : 'error desconocido'}`);
  process.exit(1);
});
