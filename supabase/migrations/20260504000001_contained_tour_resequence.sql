-- Contained tour re-sequence: 9 stops, one travelling container, 12-month national rotation.
-- Adelaide → Perth (+ surrounds) → Mparntwe + Tennant → Brisbane → Northern Rivers → Sydney → Canberra → Melbourne → Hobart.
-- Costs in `local_stats` so the tour page can render per-stop cost without a schema change.

BEGIN;

DELETE FROM tour_stops WHERE campaign_slug = 'the-contained';

INSERT INTO tour_stops (campaign_slug, city, state, venue, partner, description, event_slug, date, status, lat, lng, partner_quote, local_stats) VALUES

('the-contained', 'Adelaide', 'SA',
 'Tandanya · Reintegration Puzzle Conference',
 'Justice Reform Initiative + Tandanya',
 'The tour opens at Tandanya alongside the Reintegration Puzzle Conference in late June. Diagrama''s CEO is attending. The container holds the room for two months, the conference week then a month of public open weeks, school groups, and a politicians day.',
 'contained-adelaide-tandanya', '2026-06-15', 'planning', -34.93, 138.60,
 'Talking to Ben about options on Kaurna Yarta for 2026 — Hannah March, JRI',
 '{"window":"Jun–Jul 2026 · 2 months","move":30000,"activation":100000,"stop_total":130000}'::jsonb),

('the-contained', 'Perth + surrounds', 'WA',
 'University of Western Australia + regional drop-in',
 'UWA + Reconciliation WA + Department of Justice WA',
 'Two months in Perth with a regional drop-in to Broome or Kalgoorlie. UWA and Reconciliation WA carry the academic and civic spine. The container becomes the public priming layer for the Department of Justice WA delegated-authority pilot communities.',
 'contained-perth-uwa', '2026-08-01', 'planning', -31.95, 115.86,
 'We can''t wait to have this in Perth!!! — Hayley Passmore, Criminology Lecturer',
 '{"window":"Aug–Sep 2026 · 2 months","move":50000,"activation":170000,"stop_total":220000}'::jsonb),

('the-contained', 'Mparntwe + Tennant Creek', 'NT',
 'Oonchiumpa + community spaces',
 'Oonchiumpa Aboriginal Corporation',
 'Six weeks community-controlled across Mparntwe and Tennant Creek. Oonchiumpa runs a 95% diversion rate through Central Arrernte-designed programs. The container, the build, and the public weeks all happen on community terms.',
 'contained-mparntwe', '2026-10-15', 'confirmed', -23.70, 133.88,
 NULL,
 '{"window":"Oct–Nov 2026 · 6 weeks","move":50000,"activation":120000,"stop_total":170000}'::jsonb),

('the-contained', 'Brisbane', 'QLD',
 'YAC · Youth Advocacy Centre',
 'YAC + EPIC Pathways',
 'YAC is hosting. Queensland has the strongest demand signal nationally, including a sitting state MP asking publicly where the container is touring. One month of public weeks, MP days, and university partnerships.',
 'contained-brisbane', '2026-12-01', 'planning', -27.47, 153.03,
 'We would love to host this at YAC!!! — Katherine Hayes, YAC',
 '{"window":"Dec 2026 · 1 month","move":50000,"activation":90000,"stop_total":140000}'::jsonb),

('the-contained', 'Northern Rivers', 'NSW',
 'The Buttery',
 'The Buttery',
 'A month in the Northern Rivers in partnership with The Buttery. Therapeutic-community lineage, lived-experience pathways, and a regional public the metro circuit does not reach.',
 'contained-northern-rivers', '2027-02-01', 'tentative', -28.81, 153.27,
 NULL,
 '{"window":"Feb 2027 · 1 month","move":25000,"activation":80000,"stop_total":105000}'::jsonb),

('the-contained', 'Sydney', 'NSW',
 'Uniting + University of Sydney',
 'Uniting + USyd',
 'A month in Sydney carried by Uniting''s advocacy team and the University of Sydney. NSW MPs invited on dedicated days. Public access through the city centre.',
 'contained-sydney', '2027-03-01', 'tentative', -33.87, 151.21,
 'Hoping some NSW MPs come and look — Emma Maiden, Director Advocacy, Uniting',
 '{"window":"Mar 2027 · 1 month","move":25000,"activation":90000,"stop_total":115000}'::jsonb),

('the-contained', 'Canberra', 'ACT',
 'Lawns of Parliament House',
 'ACT Inspector of Custodial Services + civic partners',
 'Three weeks on the lawns of Parliament House. ACT government has committed publicly to a new model of care for youth detention. Federal MPs invited, territory-level audience, and the press gallery on its doorstep.',
 'contained-canberra', '2027-04-01', 'tentative', -35.31, 149.13,
 'Lawns of Parliament House? — Margo Marchbank',
 '{"window":"Apr 2027 · 3 weeks","move":20000,"activation":80000,"stop_total":100000}'::jsonb),

('the-contained', 'Melbourne', 'VIC',
 'St Martins Youth Arts Centre',
 'St Martins YAC + RMIT',
 'A month in Melbourne carried by St Martins Youth Arts Centre. Public access, a youth arts collaboration on Room 3, and an academic spine through RMIT. The container lands in the middle of the Melbourne arts season.',
 'contained-melbourne', '2027-05-01', 'tentative', -37.81, 144.96,
 'This needs to be seen in Melbourne. We work with young people — Nadja Kostich, CEO St Martins YAC',
 '{"window":"May 2027 · 1 month","move":30000,"activation":100000,"stop_total":130000}'::jsonb),

('the-contained', 'Hobart', 'TAS',
 'DarkLab / MONA + Prevention Not Detention coalition',
 'DarkLab + Prevention Not Detention Tasmania',
 'The tour closes in Hobart with DarkLab and the Prevention Not Detention coalition. Cultural institution, organised activist coalition, and a Department of Children and Young People contact in one room.',
 'contained-hobart', '2027-06-01', 'tentative', -42.88, 147.33,
 'We will make sure we get as many politicians, public and workers through it — Loic Fery',
 '{"window":"Jun 2027 · 1 month","move":40000,"activation":80000,"stop_total":120000}'::jsonb);

COMMIT;
