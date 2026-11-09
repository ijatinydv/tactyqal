-- prevent whitespace only article fields from satisfying database required content rules
ALTER TABLE public.posts
  ADD CONSTRAINT posts_title_has_text CHECK (title ~ '[^[:space:]]'),
  ADD CONSTRAINT posts_excerpt_has_text CHECK (excerpt ~ '[^[:space:]]');

-- keep taxonomy labels meaningful even when records bypass application validation
ALTER TABLE public.categories
  ADD CONSTRAINT categories_name_has_text CHECK (name ~ '[^[:space:]]');

-- prevent empty looking contact records from entering the private inbox
ALTER TABLE public.consultation_requests
  ADD CONSTRAINT consultation_name_has_text CHECK (adult_contact_name ~ '[^[:space:]]'),
  ADD CONSTRAINT consultation_relationship_has_text CHECK (relationship ~ '[^[:space:]]');
