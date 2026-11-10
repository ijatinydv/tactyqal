BEGIN;
SELECT plan(4);
SELECT ok(has_function_privilege('service_role','public.wordpress_import_post(jsonb,jsonb)','EXECUTE'),'operational service role can import synthetic records');
SELECT ok(NOT has_function_privilege('anon','public.wordpress_import_post(jsonb,jsonb)','EXECUTE'),'anonymous users cannot execute the import writer');
SELECT ok(NOT has_function_privilege('authenticated','public.wordpress_import_post(jsonb,jsonb)','EXECUTE'),'ordinary signed in accounts cannot execute the import writer');
SELECT is((SELECT prosecdef FROM pg_proc WHERE oid='public.wordpress_import_post(jsonb,jsonb)'::regprocedure),false,'import writer uses caller privileges instead of a definer bypass');
SELECT * FROM finish();
ROLLBACK;
