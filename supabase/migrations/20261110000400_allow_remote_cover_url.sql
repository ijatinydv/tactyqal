-- allow remote http/https cover image URLs in addition to local storage paths
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_cover_path_check;

ALTER TABLE public.posts ADD CONSTRAINT posts_cover_path_check CHECK (
  cover_path IS NULL
  OR (cover_path ~* '^https?://[^\s]+$' AND char_length(cover_path) <= 512)
  OR (cover_path ~ '^[A-Za-z0-9_-]+/[A-Za-z0-9._-]+$' AND cover_path !~ '(^|/)\.\.(/|$)')
);
