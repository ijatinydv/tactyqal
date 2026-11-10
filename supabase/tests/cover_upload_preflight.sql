BEGIN;
SELECT plan(4);
INSERT INTO auth.users (id, email) VALUES ('40000000-0000-4000-8000-000000000004', 'cover-preflight@example.invalid');
CALL private.bootstrap_editor('40000000-0000-4000-8000-000000000004');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000004"}', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000004', true);
SELECT lives_ok(
  $$INSERT INTO storage.objects (bucket_id, name, metadata) VALUES ('covers', auth.uid()::text || '/preflight.webp', '{"mimetype":"image/webp","contentLength":100}'::jsonb)$$,
  'editor upload permission probes accept storage content length metadata'
);
SELECT throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name, metadata) VALUES ('covers', auth.uid()::text || '/oversize.webp', '{"mimetype":"image/webp","contentLength":5242881}'::jsonb)$$,
  '42501', NULL, 'preflight content length cannot bypass the cover size bound'
);
SELECT throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name, metadata) VALUES ('covers', auth.uid()::text || '/disguised.webp', '{"mimetype":"image/svg+xml","contentLength":100}'::jsonb)$$,
  '42501', NULL, 'preflight metadata cannot bypass raster mime restrictions'
);
SELECT throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name, metadata) VALUES ('covers', 'another-editor/preflight.webp', '{"mimetype":"image/webp","contentLength":100}'::jsonb)$$,
  '42501', NULL, 'preflight metadata cannot bypass editor folder ownership'
);
RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
