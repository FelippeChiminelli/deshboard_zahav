-- Permite que o app (role anon) leia a tabela casos_vistoria.
-- Execute no Supabase: SQL Editor > New query > Cole e rode.
-- Sem esta política, RLS bloqueia o SELECT e "Em Atraso" fica vazio.

CREATE POLICY "Permitir leitura casos_vistoria"
  ON public.casos_vistoria
  FOR SELECT
  USING (true);
