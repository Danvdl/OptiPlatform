-- Reset admin user with proper bcrypt hash for "admin" password
UPDATE users 
SET password = '$2b$10$rtz2l9IG/pu/SoXgfgLZO.59qn6cfb5KjsLSGvzTy3P16t5jbDlZW'
WHERE username = 'admin';

-- Insert admin user if not exists
INSERT INTO users (username, email, password, role, created_at)
SELECT 'admin', 'admin@example.com', '$2b$10$rtz2l9IG/pu/SoXgfgLZO.59qn6cfb5KjsLSGvzTy3P16t5jbDlZW', 'admin', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Verify the admin user
SELECT id, username, email, role FROM users WHERE username = 'admin';
