-- Criar usuario admin: Dimitri Menezes
-- Email: dimitrimenezes01@gmail.com

SELECT supabase_auth_admin.create_user(
  '{"email": "dimitrimenezes01@gmail.com", "password": "jiqui2026", "email_confirm": true}'::jsonb
);
