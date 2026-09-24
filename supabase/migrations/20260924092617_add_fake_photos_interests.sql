-- Add photos for male profiles
INSERT INTO photos (user_id, url, position)
SELECT u.id, p.url, 0
FROM auth.users u
JOIN (VALUES
  ('fake_M_1@siyvaruli.ge', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_M_2@siyvaruli.ge', 'https://images.pexels.com/photos/14961755/pexels-photo-14961755.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_M_3@siyvaruli.ge', 'https://images.pexels.com/photos/12871437/pexels-photo-12871437.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_M_4@siyvaruli.ge', 'https://images.pexels.com/photos/7047890/pexels-photo-7047890.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_M_5@siyvaruli.ge', 'https://images.pexels.com/photos/15728431/pexels-photo-15728431.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_M_6@siyvaruli.ge', 'https://images.pexels.com/photos/8638704/pexels-photo-8638704.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_M_7@siyvaruli.ge', 'https://images.pexels.com/photos/2590287/pexels-photo-2590287.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_M_8@siyvaruli.ge', 'https://images.pexels.com/photos/6102858/pexels-photo-6102858.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_M_9@siyvaruli.ge', 'https://images.pexels.com/photos/6670984/pexels-photo-6670984.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_M_10@siyvaruli.ge', 'https://images.pexels.com/photos/2691608/pexels-photo-2691608.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')
) AS p(email, url) ON u.email = p.email
WHERE NOT EXISTS (SELECT 1 FROM photos WHERE user_id = u.id);

-- Add photos for female profiles
INSERT INTO photos (user_id, url, position)
SELECT u.id, p.url, 0
FROM auth.users u
JOIN (VALUES
  ('fake_F_1@siyvaruli.ge', 'https://images.pexels.com/photos/18355488/pexels-photo-18355488.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_F_2@siyvaruli.ge', 'https://images.pexels.com/photos/5920763/pexels-photo-5920763.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_F_3@siyvaruli.ge', 'https://images.pexels.com/photos/1310461/pexels-photo-1310461.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_F_4@siyvaruli.ge', 'https://images.pexels.com/photos/719617/pexels-photo-719617.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_F_5@siyvaruli.ge', 'https://images.pexels.com/photos/7082205/pexels-photo-7082205.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_F_6@siyvaruli.ge', 'https://images.pexels.com/photos/39567150/pexels-photo-39567150.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_F_7@siyvaruli.ge', 'https://images.pexels.com/photos/13140394/pexels-photo-13140394.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_F_8@siyvaruli.ge', 'https://images.pexels.com/photos/11929000/pexels-photo-11929000.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_F_9@siyvaruli.ge', 'https://images.pexels.com/photos/18392646/pexels-photo-18392646.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('fake_F_10@siyvaruli.ge', 'https://images.pexels.com/photos/1890033/pexels-photo-1890033.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')
) AS p(email, url) ON u.email = p.email
WHERE NOT EXISTS (SELECT 1 FROM photos WHERE user_id = u.id);

-- Add random interests for all fake profiles
INSERT INTO user_interests (user_id, interest_id)
SELECT u.id, i.id
FROM auth.users u
CROSS JOIN interests i
WHERE u.email LIKE 'fake_%@siyvaruli.ge'
AND i.key IN ('music', 'travel', 'food', 'movies', 'photography', 'coffee', 'nature', 'technology')
AND random() < 0.3
ON CONFLICT DO NOTHING;
