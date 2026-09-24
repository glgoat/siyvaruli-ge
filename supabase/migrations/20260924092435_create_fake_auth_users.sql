-- Create 10 male auth users (trigger auto-creates profiles + settings)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
SELECT
  gen_random_uuid(),
  'fake_M_' || i::text || '@siyvaruli.ge',
  crypt('FakeTest123!', gen_salt('bf')),
  now(), now(), now(),
  jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
  jsonb_build_object('first_name', name, 'city', city)
FROM (VALUES
  (1, 'დავითი', 'თბილისი'),
  (2, 'გიორგი', 'ბათუმი'),
  (3, 'საბა', 'ქუთაისი'),
  (4, 'ნიკა', 'თბილისი'),
  (5, 'ლევანი', 'რუსთავი'),
  (6, 'ალექსანდრე', 'გორი'),
  (7, 'ვახტანგი', 'თბილისი'),
  (8, 'მიხეილი', 'ზუგდიდი'),
  (9, 'ზაზა', 'თელავი'),
  (10, 'ბექა', 'ბათუმი')
) AS v(i, name, city)
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'fake_M_' || i::text || '@siyvaruli.ge');

-- Create 10 female auth users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
SELECT
  gen_random_uuid(),
  'fake_F_' || i::text || '@siyvaruli.ge',
  crypt('FakeTest123!', gen_salt('bf')),
  now(), now(), now(),
  jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
  jsonb_build_object('first_name', name, 'city', city)
FROM (VALUES
  (1, 'ანა', 'თბილისი'),
  (2, 'ნინო', 'ბათუმი'),
  (3, 'მარიამი', 'ქუთაისი'),
  (4, 'სოფიო', 'თბილისი'),
  (5, 'ლიკა', 'რუსთავი'),
  (6, 'ელენე', 'გორი'),
  (7, 'თეონა', 'თბილისი'),
  (8, 'ნათია', 'ზუგდიდი'),
  (9, 'ირინა', 'თელავი'),
  (10, 'დალი', 'ბათუმი')
) AS v(i, name, city)
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'fake_F_' || i::text || '@siyvaruli.ge');
