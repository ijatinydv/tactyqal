-- isolate trusted policy helpers from the public data api
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- stores trusted application roles separately from mutable identity metadata
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- stores editorial records with bounded fields and safe structured document content
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(160) NOT NULL CHECK (title = btrim(title) AND char_length(title) BETWEEN 1 AND 160),
  slug varchar(180) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt varchar(320) NOT NULL CHECK (excerpt = btrim(excerpt) AND char_length(excerpt) BETWEEN 1 AND 320),
  content jsonb NOT NULL CHECK (
    jsonb_typeof(content) = 'object'
    AND content ->> 'type' = 'doc'
    AND jsonb_typeof(content -> 'content') = 'array'
    AND octet_length(content::text) <= 262144
  ),
  author_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  cover_path varchar(512) CHECK (
    cover_path IS NULL
    OR (
      cover_path ~ '^[A-Za-z0-9_-]+/[A-Za-z0-9._-]+$'
      AND cover_path !~ '(^|/)\.\.(/|$)'
    )
  ),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'published') = (published_at IS NOT NULL))
);

-- groups posts into bounded public categories without exposing draft-only labels
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL UNIQUE CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 80),
  slug varchar(100) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- links editorial posts and categories while preserving referential integrity
CREATE TABLE public.post_categories (
  post_id uuid NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, category_id)
);

-- protects minimal adult consultation details from public access
CREATE TABLE public.consultation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adult_contact_name varchar(120) NOT NULL CHECK (
    adult_contact_name = btrim(adult_contact_name)
    AND char_length(adult_contact_name) BETWEEN 1 AND 120
  ),
  email varchar(254) NOT NULL CHECK (
    email = btrim(email)
    AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  relationship varchar(80) NOT NULL CHECK (
    relationship = btrim(relationship)
    AND char_length(relationship) BETWEEN 1 AND 80
  ),
  message varchar(1500) CHECK (message IS NULL OR char_length(message) <= 1500),
  data_use_acknowledged boolean NOT NULL CHECK (data_use_acknowledged),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- keep published article browsing bounded as the archive grows
CREATE INDEX posts_published_at_idx ON public.posts (published_at DESC, created_at DESC) WHERE status = 'published';
-- support editorial status filtering without scanning the archive
CREATE INDEX posts_status_created_at_idx ON public.posts (status, created_at DESC);
-- keep author relationship checks efficient during editorial operations
CREATE INDEX posts_author_id_idx ON public.posts (author_id);
-- support category browsing without repeatedly scanning every post link
CREATE INDEX post_categories_category_id_idx ON public.post_categories (category_id, post_id);
-- keep the private inbox efficient as requests accumulate
CREATE INDEX consultation_requests_status_created_at_idx ON public.consultation_requests (status, created_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_requests FORCE ROW LEVEL SECURITY;

-- keeps modification timestamps consistent across direct and administrative writes
CREATE FUNCTION private.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

-- centralizes database owned editor checks for row level security policies
CREATE FUNCTION private.is_editor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.role = 'editor'
  );
$$;

-- creates least privileged profiles for new identities regardless of user metadata
CREATE FUNCTION private.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- provisions editors only through trusted database bootstrap execution contexts
CREATE PROCEDURE private.bootstrap_editor(target_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'trusted bootstrap execution required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET role = 'editor', updated_at = clock_timestamp()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION private.touch_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_editor() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.handle_new_auth_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_editor() TO anon, authenticated, service_role;
REVOKE ALL ON PROCEDURE private.bootstrap_editor(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON PROCEDURE private.bootstrap_editor(uuid) TO service_role;

-- give every new identity a database controlled least privileged profile
CREATE TRIGGER auth_user_profile_after_insert
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_auth_user();

-- keep identity audit timestamps consistent outside application request paths
CREATE TRIGGER profiles_touch_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

-- keep editorial modification times reliable across all authorised write paths
CREATE TRIGGER posts_touch_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

-- preserve category audit times across direct administrative changes
CREATE TRIGGER categories_touch_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

-- record private inbox changes without relying on browser supplied timestamps
CREATE TRIGGER consultation_requests_touch_updated_at
BEFORE UPDATE ON public.consultation_requests
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

-- let signed in users resolve their own role without exposing other identities
CREATE POLICY profiles_read_self
ON public.profiles FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

-- keep drafts private while allowing the public to browse published work
CREATE POLICY posts_read_published_or_editor
ON public.posts FOR SELECT TO anon, authenticated
USING (
  (status = 'published' AND published_at IS NOT NULL AND published_at <= now())
  OR (SELECT private.is_editor())
);

-- confine editorial mutations to database authorised editors
CREATE POLICY posts_editor_manage
ON public.posts FOR ALL TO authenticated
USING ((SELECT private.is_editor()))
WITH CHECK ((SELECT private.is_editor()));

-- avoid exposing unpublished editorial taxonomy through public category reads
CREATE POLICY categories_read_published_or_editor
ON public.categories FOR SELECT TO anon, authenticated
USING (
  (SELECT private.is_editor())
  OR EXISTS (
    SELECT 1
    FROM public.post_categories AS post_category
    JOIN public.posts AS post ON post.id = post_category.post_id
    WHERE post_category.category_id = categories.id
      AND post.status = 'published'
      AND post.published_at IS NOT NULL
      AND post.published_at <= now()
  )
);

-- let trusted editors maintain the article taxonomy
CREATE POLICY categories_editor_manage
ON public.categories FOR ALL TO authenticated
USING ((SELECT private.is_editor()))
WITH CHECK ((SELECT private.is_editor()));

-- keep draft article relationships out of public responses
CREATE POLICY post_categories_read_published_or_editor
ON public.post_categories FOR SELECT TO anon, authenticated
USING (
  (SELECT private.is_editor())
  OR EXISTS (
    SELECT 1
    FROM public.posts AS post
    WHERE post.id = post_categories.post_id
      AND post.status = 'published'
      AND post.published_at IS NOT NULL
      AND post.published_at <= now()
  )
);

-- restrict article classification changes to authorised editors
CREATE POLICY post_categories_editor_manage
ON public.post_categories FOR ALL TO authenticated
USING ((SELECT private.is_editor()))
WITH CHECK ((SELECT private.is_editor()));

-- keep adult contact details accessible only to the editorial team
CREATE POLICY consultation_requests_editor_manage
ON public.consultation_requests FOR ALL TO authenticated
USING ((SELECT private.is_editor()))
WITH CHECK ((SELECT private.is_editor()));

REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.posts, public.categories, public.post_categories FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.consultation_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts, public.categories, public.post_categories TO authenticated;
GRANT SELECT ON public.posts, public.categories, public.post_categories TO anon;
GRANT SELECT ON public.posts, public.categories, public.post_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_requests TO anon, authenticated;

-- make intentionally public editorial media accessible without an account
CREATE POLICY covers_public_read
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'covers');

-- confine new cover uploads to authorised editors and bounded raster media
CREATE POLICY covers_editor_insert
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'covers'
  AND (SELECT private.is_editor())
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp')
  AND lower(COALESCE(metadata ->> 'mimetype', '')) IN ('image/jpeg', 'image/png', 'image/webp')
  AND CASE
    WHEN metadata ->> 'size' ~ '^[0-9]{1,10}$' THEN (metadata ->> 'size')::bigint <= 5242880
    ELSE false
  END
);

-- prevent replacement uploads from escaping ownership and media restrictions
CREATE POLICY covers_editor_update
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'covers'
  AND (SELECT private.is_editor())
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
  bucket_id = 'covers'
  AND (SELECT private.is_editor())
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp')
  AND lower(COALESCE(metadata ->> 'mimetype', '')) IN ('image/jpeg', 'image/png', 'image/webp')
  AND CASE
    WHEN metadata ->> 'size' ~ '^[0-9]{1,10}$' THEN (metadata ->> 'size')::bigint <= 5242880
    ELSE false
  END
);

-- prevent one editor from deleting another editors uploaded media
CREATE POLICY covers_editor_delete
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'covers'
  AND (SELECT private.is_editor())
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);
