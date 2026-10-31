-- MediFind demo data. Run AFTER schema.sql, in Supabase SQL Editor.

insert into public.medicines (generic_name, brand_name, strength, form, category, description) values
  ('Paracetamol',   'Napa',      '500 mg', 'Tablet',  'Pain & fever', 'Common pain and fever reliever.'),
  ('Paracetamol',   'Ace',       '500 mg', 'Tablet',  'Pain & fever', 'Common pain and fever reliever.'),
  ('Omeprazole',    'Seclo',     '20 mg',  'Capsule', 'Gastric',      'Reduces stomach acid.'),
  ('Omeprazole',    'Losectil',  '20 mg',  'Capsule', 'Gastric',      'Reduces stomach acid.'),
  ('Esomeprazole',  'Maxpro',    '20 mg',  'Tablet',  'Gastric',      'Reduces stomach acid.'),
  ('Fexofenadine',  'Fexo',      '120 mg', 'Tablet',  'Allergy',      'Antihistamine for allergy symptoms.'),
  ('Montelukast',   'Monas',     '10 mg',  'Tablet',  'Allergy',      'Used for allergic rhinitis and asthma.'),
  ('Cetirizine',    'Alatrol',   '10 mg',  'Tablet',  'Allergy',      'Antihistamine for allergy symptoms.');

-- Demo pharmacies (owner_id is null, already approved)
insert into public.pharmacies (name, address, phone, opening_hours, latitude, longitude, status) values
  ('City Care Pharmacy',    'Dhanmondi, Dhaka', '01700-000001', '8:00 AM - 11:00 PM', 23.7461, 90.3742, 'approved'),
  ('Health Plus Pharmacy',  'Gulshan, Dhaka',   '01700-000002', '9:00 AM - 10:00 PM', 23.7925, 90.4078, 'approved'),
  ('Mirpur Medi Point',     'Mirpur, Dhaka',    '01700-000003', '24 hours',           23.8069, 90.3687, 'approved'),
  ('Uttara Family Pharmacy','Uttara, Dhaka',    '01700-000004', '8:00 AM - 10:00 PM', 23.8759, 90.3795, 'approved'),
  ('Motijheel Drug House',  'Motijheel, Dhaka', '01700-000005', '9:00 AM - 9:00 PM',  23.7330, 90.4172, 'approved');

-- Random stock so you get a mix of in stock / low stock / out of stock
insert into public.inventory (pharmacy_id, medicine_id, quantity, low_stock_threshold, batch_no, expiry_date)
select p.id, m.id,
       (random() * 60)::int,
       10,
       'B-' || substr(md5(random()::text), 1, 5),
       current_date + (30 + (random() * 500)::int)
from public.pharmacies p
cross join public.medicines m
where p.owner_id is null;
