-- Seed Data for Hello Database
-- Run: psql -d hello < supabase/seed.sql

-- Insert demo users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@hello.app', crypt('admin123', gen_salt('bf')), now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'user@hello.app', crypt('user123', gen_salt('bf')), now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'demo@hello.app', crypt('demo123', gen_salt('bf')), now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert user profiles
INSERT INTO public.profiles (id, email, name, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@hello.app', 'Admin User', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'user@hello.app', 'Regular User', 'user'),
  ('33333333-3333-3333-3333-333333333333', 'demo@hello.app', 'Demo User', 'user')
ON CONFLICT (id) DO NOTHING;

-- Insert demo contacts
INSERT INTO public.contacts (user_id, name, phone, email, company)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'John Doe', '+1-555-0001', 'john@example.com', 'Acme Corp'),
  ('11111111-1111-1111-1111-111111111111', 'Jane Smith', '+1-555-0002', 'jane@example.com', 'Tech Inc'),
  ('22222222-2222-2222-2222-222222222222', 'Bob Wilson', '+1-555-0003', 'bob@example.com', 'StartUp LLC')
ON CONFLICT DO NOTHING;

-- Insert demo calls
INSERT INTO public.calls (user_id, contact_id, status, duration, started_at, ended_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 
   (SELECT id FROM contacts WHERE email = 'john@example.com' LIMIT 1),
   'completed', 180, now() - interval '2 hours', now() - interval '2 hours' + interval '3 minutes'),
  ('11111111-1111-1111-1111-111111111111',
   (SELECT id FROM contacts WHERE email = 'jane@example.com' LIMIT 1),
   'completed', 300, now() - interval '1 day', now() - interval '1 day' + interval '5 minutes')
ON CONFLICT DO NOTHING;

COMMIT;
