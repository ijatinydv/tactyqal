-- accept storage preflight content length while preserving final metadata size mime ownership and folder restrictions
ALTER POLICY covers_editor_insert ON storage.objects
WITH CHECK (
  bucket_id = 'covers'
  AND (SELECT private.is_editor())
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp')
  AND lower(COALESCE(metadata ->> 'mimetype', '')) IN ('image/jpeg', 'image/png', 'image/webp')
  AND CASE
    WHEN COALESCE(metadata ->> 'size', metadata ->> 'contentLength') ~ '^[0-9]{1,10}$'
    THEN COALESCE(metadata ->> 'size', metadata ->> 'contentLength')::bigint <= 5242880
    ELSE false
  END
);

-- keep replacement permission probes subject to the same validated metadata bounds as new covers
ALTER POLICY covers_editor_update ON storage.objects
WITH CHECK (
  bucket_id = 'covers'
  AND (SELECT private.is_editor())
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp')
  AND lower(COALESCE(metadata ->> 'mimetype', '')) IN ('image/jpeg', 'image/png', 'image/webp')
  AND CASE
    WHEN COALESCE(metadata ->> 'size', metadata ->> 'contentLength') ~ '^[0-9]{1,10}$'
    THEN COALESCE(metadata ->> 'size', metadata ->> 'contentLength')::bigint <= 5242880
    ELSE false
  END
);
