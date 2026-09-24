-- Update male profiles with full data
UPDATE profiles SET
  date_of_birth = '1996-03-15', gender = 'male', interested_in = 'women',
  bio = 'მიყვარს მუსიკა და მოგზაურობა. ვეძებ ადამიანს საერთო ინტერესებით.',
  height = 182, occupation = 'ინჟინერი', relationship_intention = 'serious',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.7151, longitude = 44.8271
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_M_1@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1998-07-22', gender = 'male', interested_in = 'women',
  bio = 'სპორტისა და ფიტნესის მოყვარული. ვცდილობ აქტიური ცხოვრება.',
  height = 178, occupation = 'პროგრამისტი', relationship_intention = 'casual',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.6168, longitude = 41.6367
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_M_2@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1995-11-08', gender = 'male', interested_in = 'women',
  bio = 'ვმუშაობ ტექნოლოგიების სფეროში. მიყვარს კინო და ყავა.',
  height = 185, occupation = 'დიზაინერი', relationship_intention = 'serious',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 42.2679, longitude = 42.7189
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_M_3@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '2000-01-30', gender = 'male', interested_in = 'women',
  bio = 'მოგზაურობა ჩემი სისუსტეა. ვეძებ თავგადასავლების მოყვარულს.',
  height = 175, occupation = 'მარკეტოლოგი', relationship_intention = 'not_sure',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.7151, longitude = 44.8271
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_M_4@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1993-05-12', gender = 'male', interested_in = 'women',
  bio = 'მიყვარს ხელოვნება და ფოტოგრაფია. ვცხოვრობ თბილისში.',
  height = 190, occupation = 'ექიმი', relationship_intention = 'serious',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.5495, longitude = 44.9932
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_M_5@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1997-09-25', gender = 'male', interested_in = 'women',
  bio = 'გასტრონომიის მოყვარული. ვამზადებ გემრიელ კერძებს.',
  height = 170, occupation = 'მზარეული', relationship_intention = 'casual',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.9842, longitude = 44.1153
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_M_6@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1994-12-03', gender = 'male', interested_in = 'women',
  bio = 'მიყვარს ბუნება და ლაშქრობა. ვეძებ აქტიურ ადამიანს.',
  height = 180, occupation = 'ფოტოგრაფი', relationship_intention = 'serious',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.7151, longitude = 44.8271
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_M_7@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1999-04-18', gender = 'male', interested_in = 'women',
  bio = 'ვკითხულობ ბევრ წიგნს. მიყვარს ისტორია და კულტურა.',
  height = 188, occupation = 'მასწავლებელი', relationship_intention = 'friendship',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 42.5088, longitude = 41.8709
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_M_8@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1996-08-14', gender = 'male', interested_in = 'women',
  bio = 'მუსიკოსი ვარ. ვუკრავ გიტარაზე. ვეძებ შემოქმედ ადამიანს.',
  height = 172, occupation = 'მუსიკოსი', relationship_intention = 'serious',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.9026, longitude = 45.4731
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_M_9@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1998-02-20', gender = 'male', interested_in = 'women',
  bio = 'ვარ მეწარმე. მიყვარს ფეხბურთი და მეგობრობა.',
  height = 183, occupation = 'ბიზნესმენი', relationship_intention = 'not_sure',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.6168, longitude = 41.6367
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_M_10@siyvaruli.ge');

-- Update female profiles with full data
UPDATE profiles SET
  date_of_birth = '1997-06-10', gender = 'female', interested_in = 'men',
  bio = 'მიყვარს ხელოვნება და დიზაინი. ვეძებ შემოქმედ ადამიანს.',
  height = 168, occupation = 'დიზაინერი', relationship_intention = 'serious',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.7151, longitude = 44.8271
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_F_1@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1999-03-25', gender = 'female', interested_in = 'men',
  bio = 'მოგზაურობა ჩემი სისუსტეა. ვნახულობ ახალ ადგილებს.',
  height = 172, occupation = 'ჟურნალისტი', relationship_intention = 'serious',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.6168, longitude = 41.6367
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_F_2@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1996-11-15', gender = 'female', interested_in = 'men',
  bio = 'ვმუშაობ მარკეტინგში. მიყვარს კინო და თეატრი.',
  height = 165, occupation = 'მარკეტოლოგი', relationship_intention = 'casual',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 42.2679, longitude = 42.7189
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_F_3@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '2000-08-05', gender = 'female', interested_in = 'men',
  bio = 'სპორტისა და იოგას მოყვარული. ვცდილობ ჰარმონიას.',
  height = 170, occupation = 'იოგას მასწავლებელი', relationship_intention = 'serious',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.7151, longitude = 44.8271
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_F_4@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1995-02-18', gender = 'female', interested_in = 'men',
  bio = 'მიყვარს კულინარია და ღვინო. ვამზადებ გემრიელ კერძებს.',
  height = 163, occupation = 'მზარეული', relationship_intention = 'not_sure',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.5495, longitude = 44.9932
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_F_5@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1998-12-20', gender = 'female', interested_in = 'men',
  bio = 'ვკითხულობ წიგნებს. მიყვარს მუსიკა და კონცერტები.',
  height = 175, occupation = 'ბიბლიოთეკარი', relationship_intention = 'serious',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.9842, longitude = 44.1153
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_F_6@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1994-07-30', gender = 'female', interested_in = 'men',
  bio = 'ფოტოგრაფი ვარ. ვეძებ შთაგონების წყაროს.',
  height = 160, occupation = 'ფოტოგრაფი', relationship_intention = 'casual',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.7151, longitude = 44.8271
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_F_7@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1999-10-12', gender = 'female', interested_in = 'men',
  bio = 'მიყვარს ბუნება და კემპინგი. ვეძებ თავგადასავლებს.',
  height = 168, occupation = 'გიდი', relationship_intention = 'friendship',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 42.5088, longitude = 41.8709
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_F_8@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1997-04-22', gender = 'female', interested_in = 'men',
  bio = 'ვარ სტუდენტი. მიყვარს ენები და კულტურა.',
  height = 170, occupation = 'სტუდენტი', relationship_intention = 'serious',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.9026, longitude = 45.4731
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_F_9@siyvaruli.ge');

UPDATE profiles SET
  date_of_birth = '1996-09-08', gender = 'female', interested_in = 'men',
  bio = 'მოდის მოყვარული. მიყვარს შოპინგი და კაფეები.',
  height = 167, occupation = 'სტილისტი', relationship_intention = 'not_sure',
  languages = ARRAY['ქართული','ინგლისური'], profile_completed = true,
  latitude = 41.6168, longitude = 41.6367
WHERE id = (SELECT id FROM auth.users WHERE email = 'fake_F_10@siyvaruli.ge');
