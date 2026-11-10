-- constrain stored requests to the two adult contact roles accepted by the service
ALTER TABLE public.consultation_requests
  ADD CONSTRAINT consultation_adult_relationship_check
  CHECK (relationship IN ('parent_guardian', 'adult_participant', 'guardian'));

-- retain one retry key per accepted request without exposing it in public receipts
ALTER TABLE public.consultation_requests
  ADD COLUMN idempotency_key uuid NOT NULL DEFAULT gen_random_uuid();

-- reject duplicate keys before a second private inquiry can be stored
ALTER TABLE public.consultation_requests
  ADD CONSTRAINT consultation_requests_idempotency_key_key UNIQUE (idempotency_key);

-- persist only hashed email and acceptance time for durable abuse limits
CREATE TABLE private.consultation_submission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- support hourly per-email checks and age out stale throttling data
CREATE INDEX consultation_submission_events_email_created_idx
  ON private.consultation_submission_events (email_hash, created_at DESC);

-- prevent API roles from reading private durable throttle state
ALTER TABLE private.consultation_submission_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.consultation_submission_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.consultation_submission_events FROM PUBLIC, anon, authenticated, service_role;

-- serialize idempotency and hourly limits before accepting any anonymous request
CREATE FUNCTION public.submit_consultation(
  p_idempotency_key uuid,
  p_adult_contact_name text,
  p_email text,
  p_relationship text,
  p_message text,
  p_data_use_acknowledged boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $function$
DECLARE
  v_email text := pg_catalog.lower(pg_catalog.btrim(p_email));
  v_name text := pg_catalog.btrim(p_adult_contact_name);
  v_relationship text := pg_catalog.btrim(p_relationship);
  v_message text := NULLIF(pg_catalog.btrim(p_message), '');
  v_email_hash text;
  v_existing public.consultation_requests%ROWTYPE;
  v_email_count bigint;
  v_global_count bigint;
  v_receipt uuid;
BEGIN
  IF p_idempotency_key IS NULL
    OR v_name IS NULL OR pg_catalog.char_length(v_name) NOT BETWEEN 1 AND 120
    OR v_email IS NULL OR pg_catalog.char_length(v_email) > 254
    OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR v_relationship IS NULL
    OR v_relationship NOT IN ('parent_guardian', 'adult_participant')
    OR (v_message IS NOT NULL AND pg_catalog.char_length(v_message) > 1500)
    OR p_data_use_acknowledged IS DISTINCT FROM true
  THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CONSULTATION_INVALID';
  END IF;

  v_email_hash := pg_catalog.md5(v_email);
  PERFORM pg_catalog.pg_advisory_xact_lock(702401, 1);

  SELECT * INTO v_existing
  FROM public.consultation_requests
  WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.adult_contact_name = v_name
      AND v_existing.email = v_email
      AND v_existing.relationship = v_relationship
      AND COALESCE(v_existing.message, '') = COALESCE(v_message, '')
      AND v_existing.data_use_acknowledged = p_data_use_acknowledged
    THEN
      RETURN v_existing.id;
    END IF;
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CONSULTATION_IDEMPOTENCY_CONFLICT';
  END IF;

  DELETE FROM private.consultation_submission_events
  WHERE created_at < pg_catalog.now() - INTERVAL '24 hours';

  SELECT pg_catalog.count(*) INTO v_email_count
  FROM private.consultation_submission_events
  WHERE email_hash = v_email_hash
    AND created_at >= pg_catalog.now() - INTERVAL '1 hour';
  SELECT pg_catalog.count(*) INTO v_global_count
  FROM private.consultation_submission_events
  WHERE created_at >= pg_catalog.now() - INTERVAL '1 hour';
  IF v_email_count >= 3 OR v_global_count >= 30 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CONSULTATION_RATE_LIMIT';
  END IF;

  INSERT INTO public.consultation_requests (
    adult_contact_name, email, relationship, message, data_use_acknowledged, idempotency_key
  ) VALUES (
    v_name, v_email, v_relationship, v_message, p_data_use_acknowledged, p_idempotency_key
  ) RETURNING id INTO v_receipt;

  INSERT INTO private.consultation_submission_events (email_hash) VALUES (v_email_hash);
  RETURN v_receipt;
END;
$function$;

-- keep the sole public writer narrow and unavailable to authenticated application callers
REVOKE ALL ON FUNCTION public.submit_consultation(uuid, text, text, text, text, boolean) FROM PUBLIC, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_consultation(uuid, text, text, text, text, boolean) TO anon;
