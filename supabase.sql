-- Pedidos de Frascos: tabla donde se guardan ventas, facturas y configuración.
-- Pegalo entero en Supabase → SQL Editor → New query → Run.

create table if not exists public.frascos_docs (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  col        text not null,          -- 'ventas', 'facturas' o 'meta'
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, col, id)
);

-- Cada usuario ve y modifica solamente sus propios datos.
alter table public.frascos_docs enable row level security;

drop policy if exists "frascos ver"    on public.frascos_docs;
drop policy if exists "frascos crear"  on public.frascos_docs;
drop policy if exists "frascos editar" on public.frascos_docs;
drop policy if exists "frascos borrar" on public.frascos_docs;

create policy "frascos ver"    on public.frascos_docs for select using (auth.uid() = user_id);
create policy "frascos crear"  on public.frascos_docs for insert with check (auth.uid() = user_id);
create policy "frascos editar" on public.frascos_docs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "frascos borrar" on public.frascos_docs for delete using (auth.uid() = user_id);

-- Para que la compu y el celu se actualicen solos al cargar algo.
do $$ begin
  alter publication supabase_realtime add table public.frascos_docs;
exception when duplicate_object then null; end $$;
