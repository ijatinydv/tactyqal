INSERT INTO public.categories (name, slug)
VALUES
  ('Getting Started', 'getting-started'),
  ('Building Ideas', 'building-ideas'),
  ('Draft Notes', 'draft-notes');

INSERT INTO public.posts (title, slug, excerpt, content, status, published_at)
VALUES
  (
    'Start With One Useful Question',
    'start-with-one-useful-question',
    'A small, clear question can help a new builder choose a practical first project step.',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Notice a small friction"}]},{"type":"paragraph","content":[{"type":"text","text":"A first project can begin with an everyday task that feels confusing, repetitive, or easy to improve. Write down what happens before choosing a tool or feature."}]},{"type":"paragraph","content":[{"type":"text","text":"Keep the question narrow enough to explore with a sketch, a conversation, or a simple paper prototype. This is a practice prompt, not a promise of a particular result."}]}]}'::jsonb,
    'published',
    now()
  ),
  (
    'Make a First Version Smaller',
    'make-a-first-version-smaller',
    'A short list of essentials helps keep an early project understandable and testable.',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Choose one outcome"}]},{"type":"paragraph","content":[{"type":"text","text":"Describe the one thing a first version should help someone do. Move extra ideas into a later list so they do not hide the first useful interaction."}]},{"type":"paragraph","content":[{"type":"text","text":"A smaller scope is a planning tool. It does not guarantee that a project will be completed or used."}]}]}'::jsonb,
    'published',
    now()
  ),
  (
    'Keep a Build Journal',
    'keep-a-build-journal',
    'A private note can capture what is still uncertain before a project is shared.',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Record the question you are exploring, what you tried, and what you want to learn next. This synthetic draft is included only to demonstrate editorial privacy."}]}]}'::jsonb,
    'draft',
    NULL
  );

INSERT INTO public.post_categories (post_id, category_id)
SELECT post.id, category.id
FROM (VALUES
  ('start-with-one-useful-question', 'getting-started'),
  ('start-with-one-useful-question', 'building-ideas'),
  ('make-a-first-version-smaller', 'building-ideas'),
  ('keep-a-build-journal', 'draft-notes')
) AS relation(post_slug, category_slug)
JOIN public.posts AS post ON post.slug = relation.post_slug
JOIN public.categories AS category ON category.slug = relation.category_slug;
