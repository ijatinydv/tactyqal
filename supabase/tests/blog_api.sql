BEGIN;

SELECT plan(18);

INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('30000000-0000-4000-8000-000000000003', 'blog-api-viewer@example.invalid', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
  ('40000000-0000-4000-8000-000000000004', 'blog-api-editor@example.invalid', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb);

CALL private.bootstrap_editor('40000000-0000-4000-8000-000000000004');

INSERT INTO public.categories (id, name, slug)
VALUES ('50000000-0000-4000-8000-000000000005', 'Blog API fixture', 'blog-api-fixture');

SELECT has_column('public', 'posts', 'cover_alt', 'posts persist bounded cover alt text');
SELECT ok(
  NOT (SELECT prosecdef FROM pg_proc WHERE oid = 'public.blog_save_post(uuid,text,text,text,jsonb,text,text,text,uuid[])'::regprocedure),
  'post/category write function executes as invoker'
);
SELECT ok(
  has_function_privilege('authenticated', 'public.blog_save_post(uuid,text,text,text,jsonb,text,text,text,uuid[])', 'EXECUTE'),
  'authenticated requests can invoke the scoped post writer'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.blog_save_post(uuid,text,text,text,jsonb,text,text,text,uuid[])', 'EXECUTE'),
  'anonymous requests cannot invoke the post writer'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000004', true);

SELECT throws_ok(
  $$SELECT public.blog_save_post(NULL, 'Atomic failure', 'blog-api-atomic-failure', 'A bounded fixture summary', '{"type":"doc","content":[]}'::jsonb, 'draft', NULL, '', ARRAY['90000000-0000-4000-8000-000000000009']::uuid[])$$,
  '23503', NULL, 'missing categories reject the complete write'
);
SELECT ok(
  NOT EXISTS (SELECT 1 FROM public.posts WHERE slug = 'blog-api-atomic-failure'),
  'failed category writes leave no partial post'
);

SELECT lives_ok(
  $$SELECT public.blog_save_post(NULL, 'Draft from API', 'blog-api-draft', 'A bounded fixture summary', '{"type":"doc","content":[]}'::jsonb, 'draft', NULL, 'Draft cover', ARRAY['50000000-0000-4000-8000-000000000005']::uuid[])$$,
  'editor creates a draft and its category link atomically'
);
SELECT is(
  (SELECT author_id FROM public.posts WHERE slug = 'blog-api-draft'),
  '40000000-0000-4000-8000-000000000004'::uuid,
  'new posts use the authenticated actor as author'
);
SELECT is(
  (SELECT cover_alt FROM public.posts WHERE slug = 'blog-api-draft'),
  'Draft cover',
  'post writer persists cover alternative text'
);
SELECT is(
  (SELECT count(*) FROM public.post_categories link JOIN public.posts post ON post.id = link.post_id WHERE post.slug = 'blog-api-draft'),
  1::bigint,
  'new post category links are committed with the post'
);

SELECT lives_ok(
  $$SELECT public.blog_save_post(NULL, 'Published from API', 'blog-api-published', 'A bounded fixture summary', '{"type":"doc","content":[]}'::jsonb, 'published', NULL, '', ARRAY['50000000-0000-4000-8000-000000000005']::uuid[])$$,
  'editor creates a published post'
);
SELECT ok(
  (SELECT published_at IS NOT NULL FROM public.posts WHERE slug = 'blog-api-published'),
  'publishing sets its database publication timestamp'
);
SELECT set_config(
  'blog_test.original_published_at',
  (SELECT published_at::text FROM public.posts WHERE slug = 'blog-api-published'),
  true
);
SELECT lives_ok(
  $$SELECT public.blog_save_post((SELECT id FROM public.posts WHERE slug = 'blog-api-published'), 'Published from API', 'blog-api-published', 'An edited fixture summary', '{"type":"doc","content":[]}'::jsonb, 'published', NULL, '', ARRAY[]::uuid[])$$,
  'editor updates an existing post and its category links atomically'
);
SELECT ok(
  (SELECT published_at = current_setting('blog_test.original_published_at')::timestamptz FROM public.posts WHERE slug = 'blog-api-published'),
  'editing a published post preserves its original publication timestamp'
);
SELECT is(
  (SELECT count(*) FROM public.post_categories link JOIN public.posts post ON post.id = link.post_id WHERE post.slug = 'blog-api-published'),
  0::bigint,
  'category replacement removes prior links in the same update'
);
SELECT lives_ok(
  $$SELECT public.blog_save_post((SELECT id FROM public.posts WHERE slug = 'blog-api-published'), 'Published from API', 'blog-api-published', 'An edited fixture summary', '{"type":"doc","content":[]}'::jsonb, 'draft', NULL, '', ARRAY[]::uuid[])$$,
  'editor can unpublish an article'
);
SELECT ok(
  (SELECT published_at IS NULL FROM public.posts WHERE slug = 'blog-api-published'),
  'unpublishing clears its publication timestamp'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
SELECT throws_ok(
  $$SELECT public.blog_save_post(NULL, 'Viewer denied', 'blog-api-viewer-denied', 'A bounded fixture summary', '{"type":"doc","content":[]}'::jsonb, 'draft', NULL, '', ARRAY[]::uuid[])$$,
  '42501', NULL, 'viewer requests cannot invoke the editorial writer'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
