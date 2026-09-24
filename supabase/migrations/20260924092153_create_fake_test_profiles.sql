/*
# Create 20 fake profiles for testing

## Overview
Creates 10 male and 10 female fake profiles with photos, interests, and settings
for testing the discovery feature.

## Notes
1. Creates auth.users entries (trigger auto-creates profiles + user_settings)
2. Updates the auto-created profiles with realistic Georgian data
3. Adds photos from Pexels (public stock photos)
4. Adds random interests for each user
5. All emails: fake_M_XX@siyvaruli.ge / fake_F_XX@siyvaruli.ge
6. Password for all fake users: FakeTest123!
*/

DO $$
DECLARE
  v_user_id uuid;
  v_interest_id uuid;
  v_city_lat float8;
  v_city_lng float8;
  v_random_idx int;
  -- Male data
  male_names text[] := ARRAY['დავითი', 'გიორგი', 'საბა', 'ნიკა', 'ლევანი', 'ალექსანდრე', 'ვახტანგი', 'მიხეილი', 'ზაზა', 'ბექა'];
  male_cities text[] := ARRAY['თბილისი', 'ბათუმი', 'ქუთაისი', 'თბილისი', 'რუსთავი', 'გორი', 'თბილისი', 'ზუგდიდი', 'თელავი', 'ბათუმი'];
  male_dobs text[] := ARRAY['1996-03-15', '1998-07-22', '1995-11-08', '2000-01-30', '1993-05-12', '1997-09-25', '1994-12-03', '1999-04-18', '1996-08-14', '1998-02-20'];
  male_bios text[] := ARRAY[
    'მიყვარს მუსიკა და მოგზაურობა. ვეძებ ადამიანს საერთო ინტერესებით.',
    'სპორტისა და ფიტნესის მოყვარული. ვცდილობ აქტიური ცხოვრება.',
    'ვმუშაობ ტექნოლოგიების სფეროში. მიყვარს კინო და ყავა.',
    'მოგზაურობა ჩემი სისუსტეა. ვეძებ თავგადასავლების მოყვარულს.',
    'მიყვარს ხელოვნება და ფოტოგრაფია. ვცხოვრობ თბილისში.',
    'გასტრონომიის მოყვარული. ვამზადებ გემრიელ კერძებს.',
    'მიყვარს ბუნება და ლაშქრობა. ვეძებ აქტიურ ადამიანს.',
    'ვკითხულობ ბევრ წიგნს. მიყვარს ისტორია და კულტურა.',
    'მუსიკოსი ვარ. ვუკრავ გიტარაზე. ვეძებ შემოქმედ ადამიანს.',
    'ვარ მეწარმე. მიყვარს ფეხბურთი და მეგობრობა.'
  ];
  male_occupations text[] := ARRAY['ინჟინერი', 'პროგრამისტი', 'დიზაინერი', 'მარკეტოლოგი', 'ექიმი', 'მზარეული', 'ფოტოგრაფი', 'მასწავლებელი', 'მუსიკოსი', 'ბიზნესმენი'];
  male_heights int[] := ARRAY[182, 178, 185, 175, 190, 170, 180, 188, 172, 183];
  male_intentions text[] := ARRAY['serious', 'casual', 'serious', 'not_sure', 'serious', 'casual', 'serious', 'friendship', 'serious', 'not_sure'];
  male_photos text[] := ARRAY[
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/14961755/pexels-photo-14961755.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/12871437/pexels-photo-12871437.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/7047890/pexels-photo-7047890.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/15728431/pexels-photo-15728431.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/8638704/pexels-photo-8638704.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/2590287/pexels-photo-2590287.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/6102858/pexels-photo-6102858.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/6670984/pexels-photo-6670984.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/2691608/pexels-photo-2691608.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
  ];
  -- Female data
  female_names text[] := ARRAY['ანა', 'ნინო', 'მარიამი', 'სოფიო', 'ლიკა', 'ელენე', 'თეონა', 'ნათია', 'ირინა', 'დალი'];
  female_cities text[] := ARRAY['თბილისი', 'ბათუმი', 'ქუთაისი', 'თბილისი', 'რუსთავი', 'გორი', 'თბილისი', 'ზუგდიდი', 'თელავი', 'ბათუმი'];
  female_dobs text[] := ARRAY['1997-06-10', '1999-03-25', '1996-11-15', '2000-08-05', '1995-02-18', '1998-12-20', '1994-07-30', '1999-10-12', '1997-04-22', '1996-09-08'];
  female_bios text[] := ARRAY[
    'მიყვარს ხელოვნება და დიზაინი. ვეძებ შემოქმედ ადამიანს.',
    'მოგზაურობა ჩემი სისუსტეა. ვნახულობ ახალ ადგილებს.',
    'ვმუშაობ მარკეტინგში. მიყვარს კინო და თეატრი.',
    'სპორტისა და იოგას მოყვარული. ვცდილობ ჰარმონიას.',
    'მიყვარს კულინარია და ღვინო. ვამზადებ გემრიელ კერძებს.',
    'ვკითხულობ წიგნებს. მიყვარს მუსიკა და კონცერტები.',
    'ფოტოგრაფი ვარ. ვეძებ შთაგონების წყაროს.',
    'მიყვარს ბუნება და კემპინგი. ვეძებ თავგადასავლებს.',
    'ვარ სტუდენტი. მიყვარს ენები და კულტურა.',
    'მოდის მოყვარული. მიყვარს შოპინგი და კაფეები.'
  ];
  female_occupations text[] := ARRAY['დიზაინერი', 'ჟურნალისტი', 'მარკეტოლოგი', 'იოგას მასწავლებელი', 'მზარეული', 'ბიბლიოთეკარი', 'ფოტოგრაფი', 'გიდი', 'სტუდენტი', 'სტილისტი'];
  female_heights int[] := ARRAY[168, 172, 165, 170, 163, 175, 160, 168, 170, 167];
  female_intentions text[] := ARRAY['serious', 'serious', 'casual', 'serious', 'not_sure', 'serious', 'casual', 'friendship', 'serious', 'not_sure'];
  female_photos text[] := ARRAY[
    'https://images.pexels.com/photos/18355488/pexels-photo-18355488.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/5920763/pexels-photo-5920763.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/1310461/pexels-photo-1310461.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/719617/pexels-photo-719617.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/7082205/pexels-photo-7082205.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/39567150/pexels-photo-39567150.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/13140394/pexels-photo-13140394.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/11929000/pexels-photo-11929000.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/18392646/pexels-photo-18392646.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/1890033/pexels-photo-1890033.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
  ];
  interest_keys text[] := ARRAY['music','travel','food','sports','movies','reading','gaming','art','cooking','photography','hiking','yoga','dancing','coffee','wine','pets','nature','fashion','technology','fitness','books','writing','cycling','swimming','running','skiing','climbing','camping','fishing','cars','football','basketball','gym','meditation','gardening','design','history','languages','volunteering','standup','theater','board_games'];
BEGIN
  -- Create 10 male profiles
  FOR i IN 1..10 LOOP
    SELECT lat, lng INTO v_city_lat, v_city_lng FROM (
      VALUES
        ('თბილისი', 41.7151, 44.8271),
        ('ბათუმი', 41.6168, 41.6367),
        ('ქუთაისი', 42.2679, 42.7189),
        ('რუსთავი', 41.5495, 44.9932),
        ('გორი', 41.9842, 44.1153),
        ('ზუგდიდი', 42.5088, 41.8709),
        ('თელავი', 41.9026, 45.4731)
    ) AS c(city, lat, lng)
    WHERE c.city = male_cities[i];

    -- Create auth user (trigger auto-creates profile + user_settings)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      v_user_id,
      'fake_M_' || i || '@siyvaruli.ge',
      crypt('FakeTest123!', gen_salt('bf')),
      now(), now(), now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('first_name', male_names[i], 'city', male_cities[i])
    );

    -- Update the auto-created profile with full data
    UPDATE profiles SET
      first_name = male_names[i],
      date_of_birth = male_dobs[i]::date,
      gender = 'male',
      interested_in = 'women',
      city = male_cities[i],
      bio = male_bios[i],
      height = male_heights[i],
      occupation = male_occupations[i],
      relationship_intention = male_intentions[i],
      languages = ARRAY['ქართული','ინგლისური'],
      profile_completed = true,
      latitude = v_city_lat,
      longitude = v_city_lng,
      last_active = now() - (random() * interval '7 days')
    WHERE id = v_user_id;

    -- Add 3-5 random interests
    FOR j IN 1..(3 + floor(random() * 3)) LOOP
      v_random_idx := 1 + floor(random() * array_length(interest_keys, 1));
      SELECT id INTO v_interest_id FROM interests WHERE key = interest_keys[v_random_idx];
      IF v_interest_id IS NOT NULL THEN
        INSERT INTO user_interests (user_id, interest_id) VALUES (v_user_id, v_interest_id) ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;

    -- Add photo
    INSERT INTO photos (user_id, url, position) VALUES (v_user_id, male_photos[i], 0);
  END LOOP;

  -- Create 10 female profiles
  FOR i IN 1..10 LOOP
    SELECT lat, lng INTO v_city_lat, v_city_lng FROM (
      VALUES
        ('თბილისი', 41.7151, 44.8271),
        ('ბათუმი', 41.6168, 41.6367),
        ('ქუთაისი', 42.2679, 42.7189),
        ('რუსთავი', 41.5495, 44.9932),
        ('გორი', 41.9842, 44.1153),
        ('ზუგდიდი', 42.5088, 41.8709),
        ('თელავი', 41.9026, 45.4731)
    ) AS c(city, lat, lng)
    WHERE c.city = female_cities[i];

    -- Create auth user (trigger auto-creates profile + user_settings)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      v_user_id,
      'fake_F_' || i || '@siyvaruli.ge',
      crypt('FakeTest123!', gen_salt('bf')),
      now(), now(), now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('first_name', female_names[i], 'city', female_cities[i])
    );

    -- Update the auto-created profile with full data
    UPDATE profiles SET
      first_name = female_names[i],
      date_of_birth = female_dobs[i]::date,
      gender = 'female',
      interested_in = 'men',
      city = female_cities[i],
      bio = female_bios[i],
      height = female_heights[i],
      occupation = female_occupations[i],
      relationship_intention = female_intentions[i],
      languages = ARRAY['ქართული','ინგლისური'],
      profile_completed = true,
      latitude = v_city_lat,
      longitude = v_city_lng,
      last_active = now() - (random() * interval '7 days')
    WHERE id = v_user_id;

    -- Add 3-5 random interests
    FOR j IN 1..(3 + floor(random() * 3)) LOOP
      v_random_idx := 1 + floor(random() * array_length(interest_keys, 1));
      SELECT id INTO v_interest_id FROM interests WHERE key = interest_keys[v_random_idx];
      IF v_interest_id IS NOT NULL THEN
        INSERT INTO user_interests (user_id, interest_id) VALUES (v_user_id, v_interest_id) ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;

    -- Add photo
    INSERT INTO photos (user_id, url, position) VALUES (v_user_id, female_photos[i], 0);
  END LOOP;
END $$;
