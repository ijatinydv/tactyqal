BEGIN;

SELECT plan(78);

INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'viewer-fixture@example.invalid',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"editor"}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'editor-fixture@example.invalid',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"viewer"}'::jsonb
  );

SELECT is(
  (SELECT role FROM public.profiles WHERE id = '10000000-0000-4000-8000-000000000001'),
  'viewer',
  'new profiles ignore editor claims in mutable user metadata'
);
SELECT is(
  (SELECT role FROM public.profiles WHERE id = '20000000-0000-4000-8000-000000000002'),
  'viewer',
  'new identities always receive the viewer role'
);

CALL private.bootstrap_editor('20000000-0000-4000-8000-000000000002');

INSERT INTO public.consultation_requests (adult_contact_name, email, relationship, data_use_acknowledged)
VALUES ('Private fixture', 'private-fixture@example.invalid', 'guardian', true);

SELECT is(
  (SELECT role FROM public.profiles WHERE id = '20000000-0000-4000-8000-000000000002'),
  'editor',
  'trusted bootstrap promotes an existing profile'
);

SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SELECT set_config('request.jwt.claim.role', 'anon', true);
SELECT set_config('request.jwt.claim.sub', '', true);

SELECT is((SELECT count(*) FROM public.posts), 2::bigint, 'anonymous reads published posts only');
SELECT is((SELECT count(*) FROM public.posts WHERE slug = 'keep-a-build-journal'), 0::bigint, 'anonymous cannot resolve a draft');
SELECT is((SELECT count(*) FROM public.categories), 2::bigint, 'anonymous cannot see draft-only categories');
SELECT is((SELECT count(*) FROM public.post_categories), 3::bigint, 'anonymous sees published category links only');
SELECT is((SELECT count(*) FROM public.consultation_requests), 0::bigint, 'anonymous cannot read consultation requests');
SELECT lives_ok(
  $$UPDATE public.consultation_requests SET status = 'reviewed' WHERE email = 'private-fixture@example.invalid'$$,
  'anonymous update attempt does not expose or change an inquiry'
);
SELECT is((SELECT count(*) FROM public.consultation_requests WHERE email = 'private-fixture@example.invalid'), 0::bigint, 'anonymous inquiry remains invisible after update attempt');
SELECT lives_ok(
  $$DELETE FROM public.consultation_requests WHERE email = 'private-fixture@example.invalid'$$,
  'anonymous delete attempt does not expose an inquiry'
);
SELECT is((SELECT count(*) FROM public.consultation_requests WHERE email = 'private-fixture@example.invalid'), 0::bigint, 'anonymous inquiry remains invisible after delete attempt');
SELECT throws_ok(
  $$INSERT INTO public.consultation_requests (adult_contact_name, email, relationship, data_use_acknowledged)
    VALUES ('Demo Adult', 'adult@example.invalid', 'guardian', true)$$,
  '42501', NULL, 'anonymous cannot submit consultation requests directly'
);
SELECT throws_ok(
  $$INSERT INTO public.posts (title, slug, excerpt, content)
    VALUES ('Anonymous draft', 'anonymous-draft', 'Blocked direct write', '{"type":"doc","content":[]}'::jsonb)$$,
  '42501', NULL, 'anonymous cannot create editorial content'
);
SELECT throws_ok(
  $$UPDATE public.posts SET title = 'Anonymous change' WHERE slug = 'start-with-one-useful-question'$$,
  '42501', NULL, 'anonymous cannot update editorial content'
);
SELECT throws_ok(
  $$DELETE FROM public.posts WHERE slug = 'start-with-one-useful-question'$$,
  '42501', NULL, 'anonymous cannot delete editorial content'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

SELECT is((SELECT count(*) FROM public.posts), 2::bigint, 'viewer reads published posts only');
SELECT is((SELECT count(*) FROM public.posts WHERE slug = 'keep-a-build-journal'), 0::bigint, 'viewer cannot resolve a draft');
SELECT is((SELECT count(*) FROM public.categories), 2::bigint, 'viewer cannot see draft-only categories');
SELECT is((SELECT count(*) FROM public.post_categories), 3::bigint, 'viewer sees published category links only');
SELECT is((SELECT role FROM public.profiles WHERE id = auth.uid()), 'viewer', 'viewer can read their own database role');
SELECT is((SELECT count(*) FROM public.profiles), 1::bigint, 'viewer cannot read another profile');
SELECT throws_ok(
  $$UPDATE public.profiles SET role = 'editor' WHERE id = auth.uid()$$,
  '42501', NULL, 'viewer cannot self-promote through profile CRUD'
);
SELECT throws_ok(
  $$CALL private.bootstrap_editor('10000000-0000-4000-8000-000000000001')$$,
  '42501', NULL, 'viewer cannot execute the editor bootstrap procedure'
);
SELECT throws_ok(
  $$INSERT INTO public.posts (title, slug, excerpt, content)
    VALUES ('Viewer draft', 'viewer-draft', 'Blocked direct write', '{"type":"doc","content":[]}'::jsonb)$$,
  '42501', NULL, 'viewer cannot create editorial content'
);
SELECT lives_ok(
  $$UPDATE public.posts SET title = 'Viewer changed title' WHERE slug = 'start-with-one-useful-question'$$,
  'viewer update attempt does not change published editorial content'
);
SELECT is((SELECT title FROM public.posts WHERE slug = 'start-with-one-useful-question'), 'Start With One Useful Question', 'viewer post update is filtered by RLS');
SELECT lives_ok(
  $$DELETE FROM public.posts WHERE slug = 'start-with-one-useful-question'$$,
  'viewer delete attempt does not remove published editorial content'
);
SELECT is((SELECT count(*) FROM public.posts WHERE slug = 'start-with-one-useful-question'), 1::bigint, 'viewer post delete is filtered by RLS');
SELECT throws_ok(
  $$INSERT INTO public.categories (name, slug) VALUES ('Viewer category', 'viewer-category')$$,
  '42501', NULL, 'viewer cannot create categories'
);
SELECT throws_ok(
  $$INSERT INTO public.post_categories (post_id, category_id)
    SELECT post.id, category.id FROM public.posts post CROSS JOIN public.categories category
    WHERE post.slug = 'start-with-one-useful-question' AND category.slug = 'getting-started'$$,
  '42501', NULL, 'viewer cannot create category links'
);
SELECT is((SELECT count(*) FROM public.consultation_requests), 0::bigint, 'viewer cannot read consultation requests');
SELECT lives_ok(
  $$UPDATE public.consultation_requests SET status = 'reviewed' WHERE email = 'private-fixture@example.invalid'$$,
  'viewer update attempt does not expose or change an inquiry'
);
SELECT is((SELECT count(*) FROM public.consultation_requests WHERE email = 'private-fixture@example.invalid'), 0::bigint, 'viewer inquiry remains invisible after update attempt');
SELECT lives_ok(
  $$DELETE FROM public.consultation_requests WHERE email = 'private-fixture@example.invalid'$$,
  'viewer delete attempt does not expose an inquiry'
);
SELECT is((SELECT count(*) FROM public.consultation_requests WHERE email = 'private-fixture@example.invalid'), 0::bigint, 'viewer inquiry remains invisible after delete attempt');
SELECT throws_ok(
  $$INSERT INTO public.consultation_requests (adult_contact_name, email, relationship, data_use_acknowledged)
    VALUES ('Demo Adult', 'adult@example.invalid', 'guardian', true)$$,
  '42501', NULL, 'viewer cannot submit consultation requests directly'
);
SELECT throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name, metadata)
    VALUES ('covers', '10000000-0000-4000-8000-000000000001/viewer.png', '{"mimetype":"image/png","size":100}'::jsonb)$$,
  '42501', NULL, 'viewer cannot upload public covers'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);

SELECT is((SELECT count(*) FROM public.posts), 3::bigint, 'editor can read drafts and published posts');
SELECT is((SELECT count(*) FROM public.categories), 3::bigint, 'editor can read draft-only categories');
SELECT is((SELECT count(*) FROM public.post_categories), 4::bigint, 'editor can read every editorial category link');
SELECT is((SELECT status FROM public.consultation_requests WHERE email = 'private-fixture@example.invalid'), 'new', 'editor confirms public inquiry attempts left private data unchanged');
SELECT lives_ok(
  $$INSERT INTO public.posts (title, slug, excerpt, content, author_id)
    VALUES ('Editor test post', 'editor-test-post', 'A bounded test excerpt', '{"type":"doc","content":[]}'::jsonb, auth.uid())$$,
  'editor can create a draft post'
);
SELECT lives_ok(
  $$UPDATE public.posts SET excerpt = 'Updated by editor' WHERE slug = 'editor-test-post'$$,
  'editor can update a post'
);
SELECT ok(
  (SELECT updated_at > created_at FROM public.posts WHERE slug = 'editor-test-post'),
  'post update trigger refreshes timezone-aware modification time'
);
SELECT lives_ok(
  $$INSERT INTO public.categories (name, slug) VALUES ('Editor test category', 'editor-test-category')$$,
  'editor can create a category'
);
SELECT lives_ok(
  $$INSERT INTO public.post_categories (post_id, category_id)
    SELECT post.id, category.id FROM public.posts post CROSS JOIN public.categories category
    WHERE post.slug = 'editor-test-post' AND category.slug = 'editor-test-category'$$,
  'editor can link a post and category'
);
SELECT is((SELECT count(*) FROM public.post_categories WHERE post_id = (SELECT id FROM public.posts WHERE slug = 'editor-test-post')), 1::bigint, 'editor can read managed category links');
SELECT lives_ok(
  $$DELETE FROM public.post_categories WHERE post_id = (SELECT id FROM public.posts WHERE slug = 'editor-test-post')$$,
  'editor can delete a category link'
);
SELECT is((SELECT count(*) FROM public.post_categories WHERE post_id = (SELECT id FROM public.posts WHERE slug = 'editor-test-post')), 0::bigint, 'editor category link delete takes effect');
SELECT lives_ok(
  $$UPDATE public.categories SET name = 'Updated editor category' WHERE slug = 'editor-test-category'$$,
  'editor can update a category'
);
SELECT is((SELECT name FROM public.categories WHERE slug = 'editor-test-category'), 'Updated editor category', 'editor category update takes effect');
SELECT lives_ok(
  $$DELETE FROM public.posts WHERE slug = 'editor-test-post'$$,
  'editor can delete a post'
);
SELECT is((SELECT count(*) FROM public.posts WHERE slug = 'editor-test-post'), 0::bigint, 'editor post delete takes effect');
SELECT lives_ok(
  $$DELETE FROM public.categories WHERE slug = 'editor-test-category'$$,
  'editor can delete a category'
);
SELECT is((SELECT count(*) FROM public.categories WHERE slug = 'editor-test-category'), 0::bigint, 'editor category delete takes effect');
SELECT lives_ok(
  $$INSERT INTO public.consultation_requests (adult_contact_name, email, relationship, data_use_acknowledged)
    VALUES ('Synthetic Adult', 'synthetic@example.invalid', 'guardian', true)$$,
  'editor can create an inquiry record'
);
SELECT lives_ok(
  $$UPDATE public.consultation_requests SET status = 'reviewed' WHERE email = 'synthetic@example.invalid'$$,
  'editor can update an inquiry record'
);
SELECT is((SELECT status FROM public.consultation_requests WHERE email = 'synthetic@example.invalid'), 'reviewed', 'editor reads managed inquiry state');
SELECT lives_ok(
  $$DELETE FROM public.consultation_requests WHERE email = 'synthetic@example.invalid'$$,
  'editor can delete an inquiry record'
);
SELECT throws_ok(
  $$INSERT INTO public.posts (title, slug, excerpt, content)
    VALUES ('Invalid content', 'invalid-content', 'Invalid document', '{"type":"html","content":[]}'::jsonb)$$,
  '23514', NULL, 'database rejects non-document structured content'
);
SELECT lives_ok(
  $$INSERT INTO public.posts (title, slug, excerpt, content)
    VALUES ('Start With One Useful Question', 'same-title-different-slug', 'A repeated title with a unique slug', '{"type":"doc","content":[]}'::jsonb)$$,
  'database allows repeated post titles when slugs remain unique'
);
SELECT throws_ok(
  $$INSERT INTO public.posts (title, slug, excerpt, content)
    VALUES ('Alternate unique slug title', 'start-with-one-useful-question', 'Unique slug check', '{"type":"doc","content":[]}'::jsonb)$$,
  '23505', NULL, 'database enforces unique post slugs'
);
SELECT throws_ok(
  $$INSERT INTO public.posts (title, slug, excerpt, content, status)
    VALUES ('Invalid publication', 'invalid-publication', 'Missing publication time', '{"type":"doc","content":[]}'::jsonb, 'published')
    RETURNING id$$,
  '23514', NULL, 'database rejects published rows without publication time'
);
SELECT throws_ok(
  $$INSERT INTO public.posts (title, slug, excerpt, content, cover_path)
    VALUES ('Invalid cover path', 'invalid-cover-path', 'Unsafe object key', '{"type":"doc","content":[]}'::jsonb, '../private/file.png')$$,
  '23514', NULL, 'database rejects unsafe cover object paths'
);
SELECT throws_ok(
  $$INSERT INTO public.consultation_requests (adult_contact_name, email, relationship, data_use_acknowledged)
    VALUES ('Synthetic Adult', 'not-an-email', 'guardian', true)$$,
  '23514', NULL, 'database validates inquiry email format'
);
SELECT throws_ok(
  $$INSERT INTO public.consultation_requests (adult_contact_name, email, relationship, data_use_acknowledged)
    VALUES ('Synthetic Adult', 'adult@example.invalid', 'guardian', false)$$,
  '23514', NULL, 'database requires data-use acknowledgement'
);
SELECT lives_ok(
  $$INSERT INTO storage.objects (bucket_id, name, metadata)
    VALUES ('covers', auth.uid()::text || '/editor.png', '{"mimetype":"image/png","size":100}'::jsonb)$$,
  'editor can write a valid public cover in their own folder'
);
SELECT lives_ok(
  $$UPDATE storage.objects SET metadata = '{"mimetype":"image/png","size":120}'::jsonb WHERE bucket_id = 'covers' AND name = auth.uid()::text || '/editor.png'$$,
  'editor can update a cover in their own folder'
);
SELECT is((SELECT metadata ->> 'size' FROM storage.objects WHERE bucket_id = 'covers' AND name = auth.uid()::text || '/editor.png'), '120', 'editor cover update takes effect');
SELECT throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name, metadata)
    VALUES ('covers', auth.uid()::text || '/editor.svg', '{"mimetype":"image/svg+xml","size":100}'::jsonb)$$,
  '42501', NULL, 'editor cannot upload unsupported active content'
);
SELECT throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name, metadata)
    VALUES ('covers', auth.uid()::text || '/oversized.png', '{"mimetype":"image/png","size":5242881}'::jsonb)$$,
  '42501', NULL, 'editor cannot upload a cover larger than five mebibytes'
);

RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SELECT set_config('request.jwt.claim.role', 'anon', true);
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT is((SELECT count(*) FROM storage.objects WHERE bucket_id = 'covers'), 1::bigint, 'public covers remain readable after editor upload');
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000002"}', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
SELECT throws_ok(
  $$INSERT INTO public.posts (title, slug, excerpt, content) VALUES (E'\t\n', 'blank-title', 'Valid excerpt', '{"type":"doc","content":[]}'::jsonb)$$,
  '23514', NULL, 'database rejects tab and newline only titles'
);
SELECT throws_ok(
  $$INSERT INTO public.posts (title, slug, excerpt, content) VALUES ('Valid title', 'blank-excerpt', E'\t\n', '{"type":"doc","content":[]}'::jsonb)$$,
  '23514', NULL, 'database rejects tab and newline only excerpts'
);
SELECT throws_ok(
  $$INSERT INTO public.categories (name, slug) VALUES (E'\t\n', 'blank-category')$$,
  '23514', NULL, 'database rejects tab and newline only category names'
);
SELECT throws_ok(
  $$INSERT INTO public.consultation_requests (adult_contact_name, email, relationship, data_use_acknowledged) VALUES (E'\t\n', 'blank@example.invalid', 'guardian', true)$$,
  '23514', NULL, 'database rejects tab and newline only adult names'
);
SELECT throws_ok(
  $$INSERT INTO public.consultation_requests (adult_contact_name, email, relationship, data_use_acknowledged) VALUES ('Valid adult', 'blank@example.invalid', E'\t\n', true)$$,
  '23514', NULL, 'database rejects tab and newline only relationships'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
