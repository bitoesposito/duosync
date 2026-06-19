-- Demo seed: two users with recurring schedules so the timeline is populated
-- every day (one-time appointments are added via the UI). Recurring repeat_days
-- is a JSON array of weekday ids (1 = Mon … 7 = Sun).

INSERT INTO users (name, created_at) VALUES
  ('utente-1', '2025-01-01T00:00:00.000Z'),
  ('utente-2',   '2025-01-01T00:00:00.000Z');

INSERT INTO recurring_appointments (id, user_id, start_time, end_time, category, description, repeat_days) VALUES
  ('seed-1-sleep', 1, '00:00', '07:00', 'sleep', NULL,   '[1,2,3,4,5,6,7]'),
  ('seed-1-work',  1, '09:00', '12:30', 'other', 'Work', '[1,2,3,4,5]'),
  ('seed-2-sleep',   2, '00:00', '08:00', 'sleep', NULL,   '[1,2,3,4,5,6,7]'),
  ('seed-2-gym',     2, '18:00', '19:30', 'other', 'Gym',  '[1,3,5]');
