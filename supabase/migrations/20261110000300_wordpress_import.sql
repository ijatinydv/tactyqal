-- preserve import identity and source publication details without changing editorial authorship
ALTER TABLE public.posts
  ADD COLUMN imported_source_provider text CHECK (imported_source_provider IS NULL OR char_length(imported_source_provider) BETWEEN 1 AND 2200),
  ADD COLUMN imported_source_id text CHECK (imported_source_id IS NULL OR char_length(imported_source_id) BETWEEN 1 AND 40),
  ADD COLUMN imported_source_url text CHECK (imported_source_url IS NULL OR char_length(imported_source_url) BETWEEN 1 AND 2048),
  ADD COLUMN imported_published_at timestamptz,
  ADD COLUMN imported_author text CHECK (imported_author IS NULL OR char_length(imported_author) BETWEEN 1 AND 160),
  ADD CONSTRAINT posts_import_identity_pair_check CHECK ((imported_source_provider IS NULL) = (imported_source_id IS NULL));

-- prevent repeat imports from duplicating an existing source record
CREATE UNIQUE INDEX posts_import_identity_idx
  ON public.posts (imported_source_provider, imported_source_id)
  WHERE imported_source_provider IS NOT NULL;

-- atomically insert a draft and its categories while leaving manual posts untouched
CREATE OR REPLACE FUNCTION public.wordpress_import_post(p_post jsonb, p_categories jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_post_id uuid;
  v_category jsonb;
  v_category_id uuid;
BEGIN
  IF jsonb_typeof(p_post) <> 'object' OR jsonb_typeof(p_categories) <> 'array' THEN
    RAISE EXCEPTION 'Invalid import payload';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.posts
    WHERE imported_source_provider = p_post ->> 'source_provider'
      AND imported_source_id = p_post ->> 'source_id'
  ) THEN
    RETURN 'skipped';
  END IF;

  IF EXISTS (SELECT 1 FROM public.posts WHERE slug = p_post ->> 'slug') THEN
    RETURN 'slug_conflict';
  END IF;

  BEGIN
    INSERT INTO public.posts (
      title, slug, excerpt, content, status, published_at,
      imported_source_provider, imported_source_id, imported_source_url,
      imported_published_at, imported_author
    ) VALUES (
      p_post ->> 'title', p_post ->> 'slug', p_post ->> 'excerpt', p_post -> 'content', 'draft', NULL,
      p_post ->> 'source_provider', p_post ->> 'source_id', p_post ->> 'source_url',
      (p_post ->> 'imported_published_at')::timestamptz, p_post ->> 'imported_author'
    )
    ON CONFLICT (imported_source_provider, imported_source_id)
      WHERE imported_source_provider IS NOT NULL
      DO NOTHING
    RETURNING id INTO v_post_id;

    IF v_post_id IS NULL THEN
      RETURN 'skipped';
    END IF;

    FOR v_category IN SELECT value FROM jsonb_array_elements(p_categories)
    LOOP
      INSERT INTO public.categories (name, slug)
      VALUES (v_category ->> 'name', v_category ->> 'slug')
      ON CONFLICT (slug) DO NOTHING;

      SELECT id INTO v_category_id FROM public.categories WHERE slug = v_category ->> 'slug';
      IF v_category_id IS NULL THEN
        RAISE EXCEPTION 'Import category could not be resolved';
      END IF;
      INSERT INTO public.post_categories (post_id, category_id) VALUES (v_post_id, v_category_id);
    END LOOP;
  EXCEPTION
    WHEN unique_violation THEN
      IF EXISTS (
        SELECT 1 FROM public.posts
        WHERE imported_source_provider = p_post ->> 'source_provider'
          AND imported_source_id = p_post ->> 'source_id'
      ) THEN
        RETURN 'skipped';
      END IF;
      RETURN 'slug_conflict';
  END;

  RETURN 'inserted';
END;
$$;

REVOKE ALL ON FUNCTION public.wordpress_import_post(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wordpress_import_post(jsonb, jsonb) TO service_role;
