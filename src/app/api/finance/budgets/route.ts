import { NextRequest, NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth-server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { canAccessFinance, canEditFinance } from '@/lib/auth/permissions';

function toDbEntity(e: string): 'US' | 'India' {
  const v = (e || '').toLowerCase();
  return v === 'india' ? 'India' : 'US';
}

function toUiEntity(e: string): 'us' | 'india' {
  return (e || '').toLowerCase() === 'india' ? 'india' : 'us';
}

export async function GET(request: NextRequest) {
  const user = await getUserRole();
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  const entityParam = searchParams.get('entity');

  const supabase = createServiceSupabase();
  let q = supabase
    .from('finance_budgets')
    .select('id, category_id, entity, fiscal_year, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec')
    .not('fiscal_year', 'is', null)
    .eq('fiscal_year', year)
    .order('category_id');

  if (entityParam) {
    const dbEntity = toDbEntity(entityParam);
    q = q.eq('entity', dbEntity);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Array<Record<string, unknown> & { entity?: string }>;
  const normalized = rows.map((row) => ({
    ...row,
    entity: toUiEntity(row.entity || ''),
  }));

  return NextResponse.json(normalized);
}

export async function POST(request: NextRequest) {
  const user = await getUserRole();
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  const { budgets } = body;
  if (!Array.isArray(budgets) || budgets.length === 0) {
    return NextResponse.json({ error: 'budgets array required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  for (const b of budgets) {
    const category_id = b.category_id;
    const entity = toDbEntity(b.entity || 'us');
    const fiscal_year = parseInt(b.fiscal_year, 10);
    if (!category_id || !Number.isFinite(fiscal_year)) {
      return NextResponse.json({ error: 'category_id and fiscal_year required' }, { status: 400 });
    }
    const payload = {
      category_id,
      entity,
      fiscal_year,
      jan: Number(b.jan) || 0,
      feb: Number(b.feb) || 0,
      mar: Number(b.mar) || 0,
      apr: Number(b.apr) || 0,
      may: Number(b.may) || 0,
      jun: Number(b.jun) || 0,
      jul: Number(b.jul) || 0,
      aug: Number(b.aug) || 0,
      sep: Number(b.sep) || 0,
      oct: Number(b.oct) || 0,
      nov: Number(b.nov) || 0,
      dec: Number(b.dec) || 0,
      updated_at: new Date().toISOString(),
    };
    const { error: upsertError } = await supabase
      .from('finance_budgets')
      .upsert(payload, {
        onConflict: 'category_id,entity,fiscal_year',
      });
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, count: budgets.length });
}
