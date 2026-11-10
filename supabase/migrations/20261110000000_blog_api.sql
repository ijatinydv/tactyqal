ALTER TABLE public.posts
ADD COLUMN cover_alt varchar(200) NOT NULL DEFAULT '';

-- write one post and its category links atomically under the caller's row policies
CREATE FUNCTION public.blog_save_post(
  p_post_id uuid,
  p_title text,
  p_slug text,
  p_excerpt text,
  p_content jsonb,
  p_status text,
  p_cover_path text,
  p_cover_alt text,
  p_category_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  saved_post_id uuid;
  selected_categories uuid[] := COALESCE(p_category_ids, ARRAY[]::uuid[]);
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_editor() THEN
    RAISE EXCEPTION 'editor access required' USING ERRCODE = '42501';
  END IF;

  IF cardinality(selected_categories) > 10
    OR cardinality(selected_categories) <> (
      SELECT count(DISTINCT category_id)::integer
      FROM unnest(selected_categories) AS selected(category_id)
    ) THEN
    RAISE EXCEPTION 'invalid category selection' USING ERRCODE = '22023';
  END IF;

  IF p_post_id IS NULL THEN
    INSERT INTO public.posts (
      title, slug, excerpt, content, author_id, cover_path, cover_alt, status, published_at
    ) VALUES (
      p_title,
      p_slug,
      p_excerpt,
      p_content,
      auth.uid(),
      p_cover_path,
      p_cover_alt,
      p_status,
      CASE WHEN p_status = 'published' THEN clock_timestamp() ELSE NULL END
    )
    RETURNING id INTO saved_post_id;
  ELSE
    UPDATE public.posts AS post
    SET title = p_title,
        slug = p_slug,
        excerpt = p_excerpt,
        content = p_content,
        cover_path = p_cover_path,
        cover_alt = p_cover_alt,
        status = p_status,
        published_at = CASE
          WHEN p_status = 'published' THEN COALESCE(post.published_at, clock_timestamp())
          ELSE NULL
        END
    WHERE post.id = p_post_id
    RETURNING post.id INTO saved_post_id;

    IF saved_post_id IS NULL THEN
      RAISE EXCEPTION 'post not found' USING ERRCODE = 'P0002';
    END IF;

    DELETE FROM public.post_categories WHERE post_id = saved_post_id;
  END IF;

  INSERT INTO public.post_categories (post_id, category_id)
  SELECT saved_post_id, selected.category_id
  FROM unnest(selected_categories) AS selected(category_id);

  RETURN saved_post_id;
END;
$$;

REVOKE ALL ON FUNCTION public.blog_save_post(uuid, text, text, text, jsonb, text, text, text, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.blog_save_post(uuid, text, text, text, jsonb, text, text, text, uuid[]) TO authenticated;
