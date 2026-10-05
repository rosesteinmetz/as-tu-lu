-- Politiques UPDATE manquantes
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='books' AND policyname='Insertion livre par propriétaire'
  ) THEN
    CREATE POLICY "Insertion livre par propriétaire" ON books FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='books' AND policyname='Modification livre par propriétaire'
  ) THEN
    CREATE POLICY "Modification livre par propriétaire" ON books FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='books' AND policyname='Suppression livre par propriétaire'
  ) THEN
    CREATE POLICY "Suppression livre par propriétaire" ON books FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;
