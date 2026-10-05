-- Corriger les politiques INSERT pour books
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Insertion livre par propriétaire" ON books;
CREATE POLICY "Insertion livre par propriétaire" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Modification livre par propriétaire" ON books;
CREATE POLICY "Modification livre par propriétaire" ON books
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Suppression livre par propriétaire" ON books;
CREATE POLICY "Suppression livre par propriétaire" ON books
  FOR DELETE USING (auth.uid() = user_id);
