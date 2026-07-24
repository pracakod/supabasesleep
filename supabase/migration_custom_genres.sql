-- ============================================================
-- MIGRACJA: user_custom_genres
-- Uruchom w: Supabase Dashboard → SQL Editor
-- ============================================================

DROP TABLE IF EXISTS public.user_custom_genres CASCADE;

CREATE TABLE public.user_custom_genres (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  min_words   INTEGER NOT NULL CHECK (min_words >= 0),
  max_words   INTEGER NOT NULL CHECK (max_words > 0),
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.user_custom_genres ENABLE ROW LEVEL SECURITY;

-- Użytkownik widzi i zarządza tylko swoimi gatunkami
CREATE POLICY "Owner full access to custom genres" ON public.user_custom_genres
  FOR ALL USING (auth.uid() = user_id);

-- Nadaj uprawnienia
GRANT ALL ON public.user_custom_genres TO authenticated;

NOTIFY pgrst, 'reload schema';
