import { AuthError, requireAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

const fail = (error: unknown) => error instanceof AuthError
  ? NextResponse.json({ error: error.message }, { status: error.status })
  : NextResponse.json({ error: 'No fue posible guardar los datos del retiro.' }, { status: 500 });

export async function GET() {
  try {
    await requireAuth();
    const sql = getDb();
    const [activities, movements, raffles, sellers, sales] = await Promise.all([
      sql`SELECT id, name, description, component, created_at AS "createdAt" FROM retreat_activities ORDER BY created_at DESC`,
      sql`SELECT id, activity_id AS "activityId", type, concept, category, amount::float AS amount, movement_date AS date, note FROM retreat_movements ORDER BY movement_date DESC, created_at DESC`,
      sql`SELECT id, activity_id AS "activityId", name, prize, goal::float AS goal, ticket_price::float AS "ticketPrice", ticket_count AS "ticketCount", draw_date AS "drawDate", status, completed_at AS "completedAt", settlement_movement_id AS "settlementMovementId", created_at AS "createdAt" FROM retreat_raffles ORDER BY created_at DESC`,
      sql`SELECT id, raffle_id AS "raffleId", name, phone FROM retreat_raffle_sellers ORDER BY created_at DESC`,
      sql`SELECT id, raffle_id AS "raffleId", seller_id AS "sellerId", tickets, sale_date AS date FROM retreat_raffle_sales ORDER BY sale_date DESC, created_at DESC`,
    ]);
    return NextResponse.json({ activities, movements, raffles, sellers, sales });
  } catch (error) { return fail(error); }
}

async function removeMissing(sql: ReturnType<typeof getDb>, table: string, ids: string[]) {
  const rows = await sql.query(`SELECT id FROM ${table}`);
  const keep = new Set(ids);
  const idsToDelete = rows.map(row => String(row.id)).filter(id => !keep.has(id));
  await Promise.all(idsToDelete.map(id => sql.query(`DELETE FROM ${table} WHERE id = $1`, [id])));
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth();
    const { scope, data } = await request.json();
    if (!Array.isArray(data) || !['activities', 'movements', 'raffles', 'sellers', 'sales'].includes(scope)) return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
    const sql = getDb();

    if (scope === 'activities') {
      for (const item of data) await sql`INSERT INTO retreat_activities (id, name, description, component, created_at, created_by) VALUES (${item.id}, ${item.name}, ${item.description || ''}, ${item.component === 'raffles' ? 'raffles' : 'none'}, ${item.createdAt}, ${user.id}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, component = EXCLUDED.component, updated_at = now()`;
      await removeMissing(sql, 'retreat_activities', data.map(item => item.id));
    }
    if (scope === 'movements') {
      for (const item of data) await sql`INSERT INTO retreat_movements (id, activity_id, type, concept, category, amount, movement_date, note, created_by) VALUES (${item.id}, ${item.activityId || null}, ${item.type}, ${item.concept}, ${item.category}, ${item.amount}, ${item.date}, ${item.note || ''}, ${user.id}) ON CONFLICT (id) DO UPDATE SET activity_id = EXCLUDED.activity_id, type = EXCLUDED.type, concept = EXCLUDED.concept, category = EXCLUDED.category, amount = EXCLUDED.amount, movement_date = EXCLUDED.movement_date, note = EXCLUDED.note`;
      await removeMissing(sql, 'retreat_movements', data.map(item => item.id));
    }
    if (scope === 'raffles') {
      for (const item of data) await sql`INSERT INTO retreat_raffles (id, activity_id, name, prize, goal, ticket_price, ticket_count, draw_date, status, completed_at, settlement_movement_id, created_at, created_by) VALUES (${item.id}, ${item.activityId}, ${item.name}, ${item.prize || ''}, ${item.goal}, ${item.ticketPrice}, ${item.ticketCount}, ${item.drawDate || null}, ${item.status || 'active'}, ${item.completedAt || null}, ${item.settlementMovementId || null}, ${item.createdAt}, ${user.id}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, prize = EXCLUDED.prize, goal = EXCLUDED.goal, ticket_price = EXCLUDED.ticket_price, ticket_count = EXCLUDED.ticket_count, draw_date = EXCLUDED.draw_date, status = EXCLUDED.status, completed_at = EXCLUDED.completed_at, settlement_movement_id = EXCLUDED.settlement_movement_id, updated_at = now()`;
      await removeMissing(sql, 'retreat_raffles', data.map(item => item.id));
    }
    if (scope === 'sellers') {
      for (const item of data) await sql`INSERT INTO retreat_raffle_sellers (id, raffle_id, name, phone) VALUES (${item.id}, ${item.raffleId}, ${item.name}, ${item.phone || ''}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone`;
      await removeMissing(sql, 'retreat_raffle_sellers', data.map(item => item.id));
    }
    if (scope === 'sales') {
      for (const item of data) await sql`INSERT INTO retreat_raffle_sales (id, raffle_id, seller_id, tickets, sale_date) VALUES (${item.id}, ${item.raffleId}, ${item.sellerId}, ${item.tickets}, ${item.date}) ON CONFLICT (id) DO UPDATE SET seller_id = EXCLUDED.seller_id, tickets = EXCLUDED.tickets, sale_date = EXCLUDED.sale_date`;
      await removeMissing(sql, 'retreat_raffle_sales', data.map(item => item.id));
    }
    return NextResponse.json({ ok: true });
  } catch (error) { return fail(error); }
}
