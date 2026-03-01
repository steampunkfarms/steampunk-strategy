-- ============================================================================
-- SEED: Launch Campaigns
-- Run after 001_cogworks_schema.sql
-- ============================================================================

INSERT INTO campaigns (slug, name, tagline, description, species_group, accent_color, icon_emoji, donation_tiers, sort_order, animals_supported) VALUES

-- Cluck Crew
('cluck-crew',
 'The Cluck Crew',
 'Where the hens rule, the roosters reign, and the ducks were never formally invited.',
 'They survived cockfighting rings. Battery cages. Backyard breeding operations gone sideways. And one rooster who arrived via certified mail — long story. Every bird at Steampunk Farms has a past they didn''t choose and a future they absolutely deserve.',
 'poultry',
 '#D4547A',
 '🐔',
 '[
   {"amount": 3, "name": "One Happy Hen", "description": "One chicken. One story. Everything she needs to live her best scratch-and-peck life."},
   {"amount": 9, "name": "Flock Friend", "description": "Three birds depend on you now. That''s Flora and her gossip circle."},
   {"amount": 15, "name": "Cluck Commander", "description": "Five rescued birds, fully fed, fully cared for, fully convinced you''re their favorite person."},
   {"amount": 30, "name": "The Flock Hero", "description": "Ten shelter-rescued residents. An entire wing of the Cluck Crew."}
 ]'::jsonb,
 1,
 0),

-- The Goats That Stare at Hay
('goats-that-stare-at-hay',
 'The Goats That Stare at Hay',
 'They see the hay. They want the hay. They will have the hay.',
 'There is a look a goat gives you when the hay is late. It is not anger. It is not sadness. It is a very specific form of existential judgment that suggests you have failed not just them, but the entire concept of morning routines.',
 'goats',
 '#7B8F3A',
 '🐐',
 '[
   {"amount": 5, "name": "One Goat, One Day", "description": "Two meals for one goat for one day, every month."},
   {"amount": 10, "name": "The Small Herd", "description": "Fifteen goats fed for a day."},
   {"amount": 20, "name": "The Pack", "description": "Thirty goats. Two meals. One day per month."},
   {"amount": 40, "name": "Herd Therapist", "description": "Sixty goats fed. The therapy is hay."},
   {"amount": 80, "name": "The Full Herd", "description": "The entire goat population. One full day. Two meals."},
   {"amount": 560, "name": "One Full Week", "description": "Seven days of hay for every goat. Two meals a day. Every day."},
   {"amount": 2427, "name": "The Full Month", "description": "One complete month of hay for the entire herd."}
 ]'::jsonb,
 2,
 0),

-- Clouder 9
('clouder-9',
 'Clouder 9',
 'They don''t need you. They allow you.',
 'The barn cats of Steampunk Farms did not ask to be rescued. They did not ask for veterinary care, warm sleeping spots, or reliable meals. They did not ask for anything, because cats do not ask. Cats arrive. Cats assess. Cats decide whether you are worth tolerating.',
 'cats',
 '#6B7DB3',
 '🐱',
 '[
   {"amount": 5, "name": "Tolerated", "description": "One cat. Fed. Vetted. Allowed to continue existing in their presence."},
   {"amount": 10, "name": "Acknowledged", "description": "Three cats recognize your contribution. Not verbally. Not physically."},
   {"amount": 15, "name": "Permitted", "description": "Five barn cats are healthier because of you. They will never know your name."},
   {"amount": 25, "name": "Respected", "description": "The entire nightshift. Every cat that patrols after dark."},
   {"amount": 50, "name": "Inner Circle", "description": "The full colony. Every cat on the property. You won''t feel any different. That''s how you know it''s real."}
 ]'::jsonb,
 3,
 0);
