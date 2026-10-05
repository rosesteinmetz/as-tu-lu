-- Force correct policies
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique livres" ON books;
DROP POLICY IF EXISTS "Insertion livre par propriétaire" ON books;
DROP POLICY IF EXISTS "Modification livre par propriétaire" ON books;
DROP POLICY IF EXISTS "Suppression livre par propriétaire" ON books;

CREATE POLICY "Lecture publique livres" ON books FOR SELECT USING (true);
CREATE POLICY "Insertion livre par propriétaire" ON books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modification livre par propriétaire" ON books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppression livre par propriétaire" ON books FOR DELETE USING (auth.uid() = user_id);
