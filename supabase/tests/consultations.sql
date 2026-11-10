BEGIN;

-- isolate rate counters inside the rolled back test transaction without changing retained demo submissions
TRUNCATE private.consultation_submission_events;

SELECT plan(27);

-- keep test identities and submitted records synthetic and rollback after assertions
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('61000000-0000-4000-8000-000000000001', 'consult-viewer@example.invalid', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
  ('61000000-0000-4000-8000-000000000002', 'consult-editor@example.invalid', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb);
CALL private.bootstrap_editor('61000000-0000-4000-8000-000000000002');

-- require the anonymous role to use the scoped writer rather than table permissions
SELECT ok(NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'consultation_requests' AND 'anon' = ANY(roles)
), 'anonymous role has no direct inquiry row policy');
SELECT ok(has_function_privilege('anon', 'public.submit_consultation(uuid,text,text,text,text,boolean)', 'EXECUTE'), 'anonymous role can invoke the scoped submission function');
SELECT ok(NOT has_function_privilege('authenticated', 'public.submit_consultation(uuid,text,text,text,text,boolean)', 'EXECUTE'), 'authenticated role cannot invoke the public submission function');

SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SELECT set_config('request.jwt.claim.role', 'anon', true);
SELECT set_config('request.jwt.claim.sub', '', true);

SELECT is((SELECT count(*) FROM public.consultation_requests), 0::bigint, 'anonymous users cannot read inquiries directly');
SELECT throws_ok($$SELECT count(*) FROM private.consultation_submission_events$$, '42501', NULL, 'anonymous users cannot inspect private rate-limit identifiers');
SELECT throws_ok($$INSERT INTO public.consultation_requests (adult_contact_name,email,relationship,data_use_acknowledged) VALUES ('Direct','direct@example.invalid','parent_guardian',true)$$, '42501', NULL, 'anonymous users cannot write inquiries directly');
SELECT throws_ok($$SELECT public.submit_consultation(NULL,'Alex','alex@example.invalid','parent_guardian',NULL,true)$$, 'P0001', 'CONSULTATION_INVALID', 'submission function rejects missing idempotency keys');
SELECT throws_ok($$SELECT public.submit_consultation(gen_random_uuid(),'Alex','alex@example.invalid','student',NULL,true)$$, 'P0001', 'CONSULTATION_INVALID', 'submission function rejects non-adult relationships');
SELECT throws_ok($$SELECT public.submit_consultation(gen_random_uuid(),'Alex','alex@example.invalid','parent_guardian',NULL,false)$$, 'P0001', 'CONSULTATION_INVALID', 'submission function requires affirmative acknowledgement');
SELECT throws_ok($$SELECT public.submit_consultation(gen_random_uuid(),' ','alex@example.invalid','parent_guardian',NULL,true)$$, 'P0001', 'CONSULTATION_INVALID', 'submission function rejects blank adult names');

SELECT lives_ok($$SELECT public.submit_consultation('62000000-0000-4000-8000-000000000001','Alex Example','ALEX@example.invalid','parent_guardian','Please share details.',true)$$, 'anonymous function accepts a valid request without exposing the stored record');
SELECT lives_ok($$SELECT public.submit_consultation('62000000-0000-4000-8000-000000000001','Alex Example','alex@example.invalid','parent_guardian','Please share details.',true)$$, 'same key and payload can retry successfully');
SELECT throws_ok($$SELECT public.submit_consultation('62000000-0000-4000-8000-000000000001','Different Person','alex@example.invalid','parent_guardian','Please share details.',true)$$, 'P0001', 'CONSULTATION_IDEMPOTENCY_CONFLICT', 'same idempotency key with changed payload conflicts');
RESET ROLE;
SELECT is((SELECT count(*) FROM public.consultation_requests WHERE idempotency_key = '62000000-0000-4000-8000-000000000001'), 1::bigint, 'idempotent retry creates no second inquiry');
SELECT is((SELECT count(*) FROM private.consultation_submission_events), 1::bigint, 'idempotent retry does not consume another accepted-request counter');
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);

SELECT public.submit_consultation('62000000-0000-4000-8000-000000000002','Alex Example','alex@example.invalid','parent_guardian',NULL,true);
SELECT public.submit_consultation('62000000-0000-4000-8000-000000000003','Alex Example','alex@example.invalid','adult_participant',NULL,true);
SELECT throws_ok($$SELECT public.submit_consultation('62000000-0000-4000-8000-000000000004','Alex Example','alex@example.invalid','parent_guardian',NULL,true)$$, 'P0001', 'CONSULTATION_RATE_LIMIT', 'fourth accepted request for one email is throttled');
SELECT is((
  SELECT count(*) FROM generate_series(1, 27) AS seq(i)
  CROSS JOIN LATERAL (
    SELECT public.submit_consultation(
      pg_catalog.md5('global-' || seq.i::text)::uuid,
      'Global Fixture',
      'global-' || seq.i::text || '@example.invalid',
      'adult_participant',
      NULL,
      true
    ) AS receipt
  ) AS accepted
  WHERE accepted.receipt IS NOT NULL
), 27::bigint, 'durable global allowance accepts requests until the hourly cap');
SELECT throws_ok($$SELECT public.submit_consultation('62000000-0000-4000-8000-000000000031','Global Fixture','global-overflow@example.invalid','adult_participant',NULL,true)$$, 'P0001', 'CONSULTATION_RATE_LIMIT', 'thirty-first accepted request in the hour is throttled globally');

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"61000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '61000000-0000-4000-8000-000000000001', true);
SELECT is((SELECT count(*) FROM public.consultation_requests), 0::bigint, 'viewer cannot read private inquiries');
SELECT lives_ok($$UPDATE public.consultation_requests SET status = 'closed'$$, 'viewer status updates are blocked by row security');
SELECT lives_ok($$DELETE FROM public.consultation_requests$$, 'viewer inquiry deletes are blocked by row security');
SELECT is((SELECT count(*) FROM public.consultation_requests), 0::bigint, 'viewer cannot change or remove private inquiries');

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"61000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '61000000-0000-4000-8000-000000000002', true);
SELECT is((SELECT count(*) FROM public.consultation_requests), 30::bigint, 'editor can read inquiries through row security');
SELECT lives_ok($$UPDATE public.consultation_requests SET status = 'reviewed'$$, 'editor can change inquiry status');
SELECT is((SELECT status FROM public.consultation_requests WHERE idempotency_key = '62000000-0000-4000-8000-000000000001'), 'reviewed', 'editor status change persists');
SELECT lives_ok($$DELETE FROM public.consultation_requests WHERE idempotency_key = '62000000-0000-4000-8000-000000000001'$$, 'editor can delete an inquiry');
SELECT is((SELECT count(*) FROM public.consultation_requests), 29::bigint, 'editor deletion removes the inquiry');

SELECT * FROM finish();
ROLLBACK;
