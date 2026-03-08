-- Seed CONTAINED Australian Tour 2026 events
INSERT INTO events (title, slug, description, event_type, start_date, end_date, location_name, location_address, location_state, is_public, is_featured, max_attendees)
VALUES
  (
    'CONTAINED: Mount Druitt Launch',
    'contained-mount-druitt-launch',
    'The CONTAINED experience launches at Mounty Yarns in Western Sydney. Three shipping containers reveal the reality of youth detention, the therapeutic alternative, and Australia''s possible future. Youth-led storytelling meets immersive advocacy.',
    'launch',
    '2026-04-25 10:00:00+10',
    '2026-04-25 20:00:00+10',
    'Mounty Yarns',
    'Mount Druitt, NSW',
    'NSW',
    true,
    true,
    100
  ),
  (
    'CONTAINED: Reintegration Conference Adelaide',
    'contained-adelaide-reintegration',
    'Bringing the CONTAINED immersive experience to the national Reintegration Conference in Adelaide. Policymakers, practitioners, and people with lived experience walk through three containers that make the case for therapeutic youth justice.',
    'conference',
    '2026-06-15 09:00:00+09:30',
    '2026-06-15 18:00:00+09:30',
    'Adelaide Convention Centre',
    'North Terrace, Adelaide SA',
    'SA',
    true,
    true,
    200
  ),
  (
    'CONTAINED: University of WA',
    'contained-perth-uwa',
    'Academic partnership with the University of Western Australia exploring therapeutic alternatives to youth detention. Researchers, students, and community members experience the CONTAINED containers on campus.',
    'exhibition',
    '2026-08-01 10:00:00+08',
    '2026-08-01 17:00:00+08',
    'University of Western Australia',
    'Crawley, Perth WA',
    'WA',
    true,
    false,
    150
  ),
  (
    'CONTAINED: Tennant Creek',
    'contained-tennant-creek',
    'Community-controlled engagement bringing the CONTAINED experience to the heart of the Northern Territory. First Nations families and leaders shape the conversation about youth justice alternatives that centre culture and community.',
    'exhibition',
    '2026-09-15 10:00:00+09:30',
    '2026-09-15 17:00:00+09:30',
    'Community Space',
    'Tennant Creek, NT',
    'NT',
    true,
    false,
    80
  )
ON CONFLICT (slug) DO NOTHING;
