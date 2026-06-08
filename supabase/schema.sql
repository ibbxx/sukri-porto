-- =========================================================
-- SCHEMA: Portfolio Admin Panel — Supabase
-- Jalankan SQL ini di Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =========================================================

-- =========================
-- 1. TABEL: portfolio_items
-- =========================
CREATE TABLE IF NOT EXISTS portfolio_items (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  category       TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'link',
  source_url     TEXT DEFAULT '',
  embed_url      TEXT DEFAULT '',
  thumbnail_url  TEXT DEFAULT '',
  description    TEXT DEFAULT '',
  tags           TEXT[] DEFAULT '{}',
  sort_order     INTEGER DEFAULT 0,
  is_featured    BOOLEAN DEFAULT FALSE,
  featured_thumb TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- 2. TABEL: portfolio_sub_items
-- =========================
CREATE TABLE IF NOT EXISTS portfolio_sub_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   TEXT NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT DEFAULT 'drive_video',
  source_url  TEXT DEFAULT '',
  embed_url   TEXT DEFAULT '',
  folder_url  TEXT DEFAULT '',
  sort_order  INTEGER DEFAULT 0
);

-- =========================
-- 3. TABEL: site_content
-- =========================
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  value      TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- 4. ADMIN ALLOWLIST
-- =========================
-- Setelah schema dijalankan, daftarkan UID admin dari Authentication > Users:
-- INSERT INTO public.admin_users (user_id) VALUES ('ADMIN_USER_UUID');
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_portfolio_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_portfolio_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_portfolio_admin() TO authenticated;

-- =========================
-- 5. AUTO-UPDATE updated_at
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_portfolio_items_updated ON portfolio_items;
CREATE TRIGGER trg_portfolio_items_updated
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_site_content_updated ON site_content;
CREATE TRIGGER trg_site_content_updated
  BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =========================
-- 6. ROW LEVEL SECURITY (RLS)
-- =========================

-- portfolio_items
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read portfolio_items" ON portfolio_items;
DROP POLICY IF EXISTS "Auth insert portfolio_items" ON portfolio_items;
DROP POLICY IF EXISTS "Auth update portfolio_items" ON portfolio_items;
DROP POLICY IF EXISTS "Auth delete portfolio_items" ON portfolio_items;

CREATE POLICY "Public read portfolio_items"
  ON portfolio_items FOR SELECT
  USING (true);

CREATE POLICY "Auth insert portfolio_items"
  ON portfolio_items FOR INSERT
  WITH CHECK (public.is_portfolio_admin());

CREATE POLICY "Auth update portfolio_items"
  ON portfolio_items FOR UPDATE
  USING (public.is_portfolio_admin())
  WITH CHECK (public.is_portfolio_admin());

CREATE POLICY "Auth delete portfolio_items"
  ON portfolio_items FOR DELETE
  USING (public.is_portfolio_admin());

-- portfolio_sub_items
ALTER TABLE portfolio_sub_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read portfolio_sub_items" ON portfolio_sub_items;
DROP POLICY IF EXISTS "Auth insert portfolio_sub_items" ON portfolio_sub_items;
DROP POLICY IF EXISTS "Auth update portfolio_sub_items" ON portfolio_sub_items;
DROP POLICY IF EXISTS "Auth delete portfolio_sub_items" ON portfolio_sub_items;

CREATE POLICY "Public read portfolio_sub_items"
  ON portfolio_sub_items FOR SELECT
  USING (true);

CREATE POLICY "Auth insert portfolio_sub_items"
  ON portfolio_sub_items FOR INSERT
  WITH CHECK (public.is_portfolio_admin());

CREATE POLICY "Auth update portfolio_sub_items"
  ON portfolio_sub_items FOR UPDATE
  USING (public.is_portfolio_admin())
  WITH CHECK (public.is_portfolio_admin());

CREATE POLICY "Auth delete portfolio_sub_items"
  ON portfolio_sub_items FOR DELETE
  USING (public.is_portfolio_admin());

-- site_content
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site_content" ON site_content;
DROP POLICY IF EXISTS "Auth insert site_content" ON site_content;
DROP POLICY IF EXISTS "Auth update site_content" ON site_content;
DROP POLICY IF EXISTS "Auth delete site_content" ON site_content;

CREATE POLICY "Public read site_content"
  ON site_content FOR SELECT
  USING (true);

CREATE POLICY "Auth insert site_content"
  ON site_content FOR INSERT
  WITH CHECK (public.is_portfolio_admin());

CREATE POLICY "Auth update site_content"
  ON site_content FOR UPDATE
  USING (public.is_portfolio_admin())
  WITH CHECK (public.is_portfolio_admin());

CREATE POLICY "Auth delete site_content"
  ON site_content FOR DELETE
  USING (public.is_portfolio_admin());

-- =========================
-- 7. STORAGE BUCKET: media
-- =========================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  TRUE,
  1048576,  -- 1 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload media" ON storage.objects;
DROP POLICY IF EXISTS "Auth update media" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete media" ON storage.objects;

CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Auth upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND public.is_portfolio_admin());

CREATE POLICY "Auth update media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND public.is_portfolio_admin())
  WITH CHECK (bucket_id = 'media' AND public.is_portfolio_admin());

CREATE POLICY "Auth delete media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND public.is_portfolio_admin());

-- =========================
-- 8. DEFAULT SITE CONTENT
-- =========================
INSERT INTO site_content (key, value) VALUES
  ('profile_photo_hero', ''),
  ('profile_photo_about', '')
ON CONFLICT (key) DO NOTHING;

-- =========================
-- 9. INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_portfolio_items_category ON portfolio_items(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_sort ON portfolio_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_featured ON portfolio_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_sub_items_parent ON portfolio_sub_items(parent_id);
