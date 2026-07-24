-- ============================================================
-- STUDIO KSIĄŻKI – Kompletny schemat bazy danych Supabase
-- Uruchom ten skrypt w: Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- CZYSZCZENIE BAZY (dla czystej i powtarzalnej instalacji)
-- ============================================================
DROP VIEW IF EXISTS public.admin_stats CASCADE;
DROP TABLE IF EXISTS public.custom_tags CASCADE;
DROP TABLE IF EXISTS public.research_links CASCADE;
DROP TABLE IF EXISTS public.glossary_terms CASCADE;
DROP TABLE IF EXISTS public.kanban_cards CASCADE;
DROP TABLE IF EXISTS public.timeline_events CASCADE;
DROP TABLE IF EXISTS public.character_relations CASCADE;
DROP TABLE IF EXISTS public.characters CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.chapters CASCADE;
DROP TABLE IF EXISTS public.project_collaborators CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Włącz podstawowe rozszerzenia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: profiles (rozszerza auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT DEFAULT '',
  pseudonym TEXT DEFAULT 'D. K.',
  avatar_url TEXT,
  status TEXT DEFAULT 'free' CHECK (status IN ('free', 'premium', 'blocked')),
  total_words INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR ALL USING (true);

-- Trigger: auto-create profilu po rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, pseudonym)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', ''), 'D. K.');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABELA: projects (projekty/książki)
-- ============================================================
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nowa Książka',
  subtitle TEXT DEFAULT '',
  genre TEXT DEFAULT '',
  description TEXT DEFAULT '',
  cover_url TEXT,
  target_words INTEGER DEFAULT 80000,
  total_words INTEGER DEFAULT 0,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'readonly', 'collaborative')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: project_collaborators
-- ============================================================
CREATE TABLE public.project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'reader' CHECK (role IN ('reader', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ============================================================
-- POMOCNICZE FUNKCJE BEZPIECZEŃSTWA (Security Definer)
-- Zapobiegają nieskończonej rekurzji w regułach RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_project_owner(proj_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = proj_id AND owner_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS i Polityki dla projects
-- ============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access to projects" ON public.projects
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Collaborators can view collaborative projects" ON public.projects
  FOR SELECT USING (
    visibility IN ('readonly', 'collaborative') OR
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = id AND pc.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS i Polityki dla project_collaborators
-- ============================================================
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages collaborators" ON public.project_collaborators
  FOR ALL USING (
    public.is_project_owner(project_id, auth.uid())
  );
CREATE POLICY "Collaborators can view own membership" ON public.project_collaborators
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- TABELA: chapters (rozdziały)
-- ============================================================
CREATE TABLE public.chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nowy Rozdział',
  content TEXT DEFAULT '',
  word_count INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  act TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owner full access to chapters" ON public.chapters
  FOR ALL USING (
    public.is_project_owner(project_id, auth.uid())
  );
CREATE POLICY "Collaborator editor can edit chapters" ON public.chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = project_id AND pc.user_id = auth.uid() AND pc.role = 'editor'
    )
  );
CREATE POLICY "Collaborator reader can view chapters" ON public.chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = project_id AND pc.user_id = auth.uid()
    )
  );

-- Trigger: przelicz word_count projektu
CREATE OR REPLACE FUNCTION public.update_project_words()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects SET
    total_words = (SELECT COALESCE(SUM(word_count), 0) FROM public.chapters WHERE project_id = NEW.project_id),
    updated_at = NOW()
  WHERE id = NEW.project_id;
  UPDATE public.profiles SET
    total_words = (
      SELECT COALESCE(SUM(p.total_words), 0)
      FROM public.projects p WHERE p.owner_id = profiles.id
    )
  WHERE id = (SELECT owner_id FROM public.projects WHERE id = NEW.project_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_chapter_change ON public.chapters;
CREATE TRIGGER on_chapter_change
  AFTER INSERT OR UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_project_words();

-- ============================================================
-- TABELA: characters (postacie)
-- ============================================================
CREATE TABLE public.characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  nickname TEXT DEFAULT '',
  role TEXT DEFAULT 'secondary' CHECK (role IN ('main', 'secondary', 'minor')),
  birth_year INTEGER,
  faction TEXT DEFAULT '',
  appearance TEXT DEFAULT '',
  psychology TEXT DEFAULT '',
  motivations TEXT DEFAULT '',
  secrets TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owner full access to characters" ON public.characters
  FOR ALL USING (
    public.is_project_owner(project_id, auth.uid())
  );
CREATE POLICY "Collaborators access to characters" ON public.characters
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_collaborators pc WHERE pc.project_id = project_id AND pc.user_id = auth.uid())
  );

-- ============================================================
-- TABELA: character_relations (relacje między postaciami)
-- ============================================================
CREATE TABLE public.character_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  from_character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  to_character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  relation_type TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_character_id, to_character_id, relation_type)
);

ALTER TABLE public.character_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owner full access to relations" ON public.character_relations
  FOR ALL USING (
    public.is_project_owner(project_id, auth.uid())
  );

-- ============================================================
-- TABELA: locations (miejsca/lokacje)
-- ============================================================
CREATE TABLE public.locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  location_type TEXT DEFAULT '',
  description TEXT DEFAULT '',
  story_significance TEXT DEFAULT '',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owner full access to locations" ON public.locations
  FOR ALL USING (
    public.is_project_owner(project_id, auth.uid())
  );
CREATE POLICY "Collaborators access to locations" ON public.locations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_collaborators pc WHERE pc.project_id = project_id AND pc.user_id = auth.uid())
  );

-- ============================================================
-- TABELA: timeline_events (oś czasu)
-- ============================================================
CREATE TABLE public.timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  reader_order INTEGER DEFAULT 0,
  world_year INTEGER DEFAULT 0,
  timeline_type TEXT DEFAULT 'present' CHECK (timeline_type IN ('present', 'flashback', 'time_travel', 'alternate')),
  plotline TEXT DEFAULT '',
  plotline_color TEXT DEFAULT '#6366f1',
  character_ids UUID[] DEFAULT '{}',
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owner full access to timeline" ON public.timeline_events
  FOR ALL USING (
    public.is_project_owner(project_id, auth.uid())
  );
CREATE POLICY "Collaborators access to timeline" ON public.timeline_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_collaborators pc WHERE pc.project_id = project_id AND pc.user_id = auth.uid())
  );

-- ============================================================
-- TABELA: kanban_cards (tablica korkowa)
-- ============================================================
CREATE TABLE public.kanban_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#6366f1',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owner full access to kanban" ON public.kanban_cards
  FOR ALL USING (
    public.is_project_owner(project_id, auth.uid())
  );

-- ============================================================
-- TABELA: glossary_terms (słownik świata)
-- ============================================================
CREATE TABLE public.glossary_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT '',
  definition TEXT DEFAULT '',
  related_character_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owner full access to glossary" ON public.glossary_terms
  FOR ALL USING (
    public.is_project_owner(project_id, auth.uid())
  );

-- ============================================================
-- TABELA: research_links (moodboard)
-- ============================================================
CREATE TABLE public.research_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.research_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owner full access to research" ON public.research_links
  FOR ALL USING (
    public.is_project_owner(project_id, auth.uid())
  );

-- ============================================================
-- TABELA: custom_tags (globalne tagi/frakcje/typy)
-- ============================================================
CREATE TABLE public.custom_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('faction', 'location_type', 'glossary_category', 'plotline')),
  value TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, tag_type, value)
);

ALTER TABLE public.custom_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owner full access to tags" ON public.custom_tags
  FOR ALL USING (
    public.is_project_owner(project_id, auth.uid())
  );

-- ============================================================
-- STORAGE BUCKET: book-media
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-media',
  'book-media',
  true,
  157286400, -- 150 MB limit
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Public read access to book-media" ON storage.objects;
CREATE POLICY "Public read access to book-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'book-media');

DROP POLICY IF EXISTS "Authenticated users can upload to book-media" ON storage.objects;
CREATE POLICY "Authenticated users can upload to book-media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'book-media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own objects in book-media" ON storage.objects;
CREATE POLICY "Users can update own objects in book-media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'book-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own objects in book-media" ON storage.objects;
CREATE POLICY "Users can delete own objects in book-media" ON storage.objects
  FOR DELETE USING (bucket_id = 'book-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- WIDOKI dla panelu admina (bez RLS – tylko dla service_role)
-- ============================================================
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) AS total_users,
  (SELECT COUNT(*) FROM public.projects) AS total_projects,
  (SELECT COALESCE(SUM(total_words), 0) FROM public.projects) AS total_words;

-- ============================================================
-- NADAWANIE UPRAWNIEŃ DLA RÓL API
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================================
-- PRZEŁADOWANIE CACHE SCHEMATU POSTGREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
