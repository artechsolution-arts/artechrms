-- Jeevan Solutions demo seed
-- Run: psql <connection_url> -f seed_demo.sql

-- ── Wipe ─────────────────────────────────────────────────────
TRUNCATE TABLE
  activity_logs, salary_slips, payroll_entries, employee_assets,
  leave_balances, leave_applications, attendance,
  employees, departments, designations, leave_types,
  holidays, announcements, users, role_permissions, payroll_rules
RESTART IDENTITY CASCADE;

-- ── Users ─────────────────────────────────────────────────────
INSERT INTO users (username, full_name, email, hashed_password, role, is_active) VALUES
  ('superadmin', 'Super Admin',   'superadmin@jeevan.demo', '$2b$12$MIuCvCm.3upABR9a/D7ooekYJIQdB0VpjMZe/etvn51TZzxvL.7Fy', 'SuperAdmin', true),
  ('hr_priya',   'Priya Sharma',  'priya@jeevan.demo',      '$2b$12$reO3rd7afBMrS9wK6cuOROBy.KSx.ph7H7W7oN7ajBTH/6H/q/rvu',  'HR',         true),
  ('ceo_vivek',  'Vivek Jeevan',  'vivek@jeevan.demo',      '$2b$12$woUUg9Ov6XUNf2/jJhsBheDJToliDEk66JKFMJMn31Yx7WmkA91yu',  'CEO',        true),
  ('emp_arjun',  'Arjun Mehta',   'arjun@jeevan.demo',      '$2b$12$EbtPrNEaQyS81Ps07I9uNeIzVX27F0t6MW5CWjX7aqusYjGUjYVU2',  'Employee',   true),
  ('emp_neha',   'Neha Reddy',    'neha@jeevan.demo',       '$2b$12$EbtPrNEaQyS81Ps07I9uNeIzVX27F0t6MW5CWjX7aqusYjGUjYVU2',  'Employee',   true),
  ('emp_rohan',  'Rohan Das',     'rohan@jeevan.demo',      '$2b$12$EbtPrNEaQyS81Ps07I9uNeIzVX27F0t6MW5CWjX7aqusYjGUjYVU2',  'Employee',   true),
  ('emp_kavya',  'Kavya Nair',    'kavya@jeevan.demo',      '$2b$12$EbtPrNEaQyS81Ps07I9uNeIzVX27F0t6MW5CWjX7aqusYjGUjYVU2',  'Employee',   true),
  ('emp_suresh', 'Suresh Pillai', 'suresh@jeevan.demo',     '$2b$12$EbtPrNEaQyS81Ps07I9uNeIzVX27F0t6MW5CWjX7aqusYjGUjYVU2',  'Employee',   true);

-- ── Departments ───────────────────────────────────────────────
INSERT INTO departments (name) VALUES
  ('Engineering'), ('Human Resources'), ('Finance'), ('Operations'), ('Sales');

-- ── Designations ─────────────────────────────────────────────
INSERT INTO designations (name) VALUES
  ('Software Engineer'), ('Senior Software Engineer'), ('Team Lead'),
  ('HR Manager'), ('HR Executive'),
  ('Accounts Manager'),
  ('Operations Manager'), ('Operations Executive'),
  ('Sales Manager'), ('Sales Executive');

-- ── Employees ─────────────────────────────────────────────────
-- dept IDs: Engineering=1, HR=2, Finance=3, Operations=4, Sales=5
-- desig IDs: Soft Eng=1, Sr Soft Eng=2, Team Lead=3, HR Mgr=4, HR Exec=5,
--            Accounts Mgr=6, Ops Mgr=7, Ops Exec=8, Sales Mgr=9, Sales Exec=10
-- user IDs: superadmin=1, hr_priya=2, ceo_vivek=3, emp_arjun=4, emp_neha=5, emp_rohan=6, emp_kavya=7, emp_suresh=8

INSERT INTO employees
  (user_id, employee_id, full_name, first_name, last_name, email, mobile,
   gender, date_of_birth, date_of_joining,
   department_id, designation_id,
   status, basic_salary, hra_percent, special_allowance,
   pf_applicable, esi_applicable, pt_state, employment_type, probation_period_days)
VALUES
  (4, 'JVN-0001', 'Arjun Mehta',   'Arjun',  'Mehta',   'arjun@jeevan.demo',  '9876543210', 'Male',   '1993-06-20', '2022-03-15', 1, 2, 'Active', 55000, 40, 5500,  1, 0, 'Karnataka', 'Full-time', 90),
  (5, 'JVN-0002', 'Neha Reddy',    'Neha',   'Reddy',   'neha@jeevan.demo',   '9876543211', 'Female', '1996-09-14', '2023-01-10', 2, 5, 'Active', 38000, 40, 3800,  1, 1, 'Karnataka', 'Full-time', 90),
  (6, 'JVN-0003', 'Rohan Das',     'Rohan',  'Das',     'rohan@jeevan.demo',  '9876543212', 'Male',   '1997-04-25', '2023-07-01', 1, 1, 'Active', 42000, 40, 4200,  1, 0, 'Karnataka', 'Full-time', 90),
  (7, 'JVN-0004', 'Kavya Nair',    'Kavya',  'Nair',    'kavya@jeevan.demo',  '9876543213', 'Female', '1991-12-03', '2021-11-20', 5, 9, 'Active', 60000, 40, 6000,  1, 0, 'Karnataka', 'Full-time', 90),
  (8, 'JVN-0005', 'Suresh Pillai', 'Suresh', 'Pillai',  'suresh@jeevan.demo', '9876543214', 'Male',   '1994-02-18', '2022-08-05', 4, 8, 'Active', 35000, 40, 3500,  1, 1, 'Karnataka', 'Full-time', 90);

-- ── Leave Types ───────────────────────────────────────────────
INSERT INTO leave_types (name, max_leaves, is_carry_forward, is_paid) VALUES
  ('Casual Leave',    12,  false, true),
  ('Sick Leave',      12,  false, true),
  ('Earned Leave',    15,  true,  true),
  ('Maternity Leave', 130, false, true),
  ('Paternity Leave', 25,  false, true),
  ('Loss of Pay',     0,   false, false);

-- ── Leave Balances (current year) ────────────────────────────
-- emp IDs 1-5, leave type IDs 1-5 (skip Loss of Pay)
INSERT INTO leave_balances (employee_id, leave_type_id, year, allocated, used, carried_forward)
SELECT e.id, lt.id, EXTRACT(YEAR FROM CURRENT_DATE)::int, lt.max_leaves, 0, 0
FROM employees e CROSS JOIN leave_types lt
WHERE lt.max_leaves > 0;

-- ── Holidays (current year) ───────────────────────────────────
INSERT INTO holidays (name, date, holiday_type) VALUES
  ('Republic Day',         make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 1, 26),  'National'),
  ('Holi',                 make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 3, 25),  'National'),
  ('Dr. Ambedkar Jayanti', make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 4, 14),  'National'),
  ('Independence Day',     make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 8, 15),  'National'),
  ('Gandhi Jayanti',       make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 10, 2),  'National'),
  ('Diwali',               make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 11, 12), 'National'),
  ('Christmas',            make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 12, 25), 'National');

-- ── Attendance — last 2 months (weekdays only, simplified) ───
-- We generate one row per weekday per employee for last 60 days.
-- Most days = Present (9h), some WFH, a few Half Day
INSERT INTO attendance (employee_id, date, status, in_time, out_time, working_hours)
SELECT
  e.id,
  d::date,
  CASE (EXTRACT(DOW FROM d)::int + e.id) % 9
    WHEN 0 THEN 'WFH'
    WHEN 8 THEN 'Half Day'
    ELSE 'Present'
  END,
  '09:00',
  CASE (EXTRACT(DOW FROM d)::int + e.id) % 9
    WHEN 8 THEN '14:00'
    ELSE '18:30'
  END,
  CASE (EXTRACT(DOW FROM d)::int + e.id) % 9
    WHEN 0 THEN 8.0
    WHEN 8 THEN 4.5
    ELSE 9.0
  END
FROM employees e
CROSS JOIN generate_series(
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE - INTERVAL '1 day',
  INTERVAL '1 day'
) AS d
WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)   -- skip weekends
  AND d::date NOT IN (
    SELECT date FROM holidays
    WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
  );

-- ── Leave Applications ────────────────────────────────────────
-- leave_type IDs: Casual=1, Sick=2, Earned=3
INSERT INTO leave_applications
  (employee_id, leave_type_id, from_date, to_date, total_days, reason, status)
VALUES
  -- emp 1 (Arjun) — Casual approved last month
  (1, 1,
   date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date + 2,
   date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date + 3,
   2, 'Family function', 'Approved'),
  -- emp 2 (Neha) — Sick approved last month
  (2, 2,
   date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date + 6,
   date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date + 6,
   1, 'Fever — doctor visit', 'Approved'),
  -- emp 3 (Rohan) — Casual approved last month
  (3, 1,
   date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date + 9,
   date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date + 10,
   2, 'Personal work', 'Approved'),
  -- emp 5 (Suresh) — Sick pending
  (5, 2, CURRENT_DATE - 5, CURRENT_DATE - 5, 1, 'Medical appointment', 'Pending'),
  -- emp 4 (Kavya) — Earned leave upcoming pending
  (4, 3, CURRENT_DATE + 7, CURRENT_DATE + 11, 5, 'Annual family vacation', 'Pending'),
  -- emp 1 (Arjun) — Casual upcoming pending
  (1, 1, CURRENT_DATE + 3, CURRENT_DATE + 3,  1, 'Personal errand', 'Pending');

-- ── Salary Slips — last 2 months ─────────────────────────────
INSERT INTO salary_slips
  (slip_id, employee_id, month, year, start_date, end_date,
   gross_pay, total_deduction, net_pay, earnings, deductions, status)
SELECT
  'JVN-' || TO_CHAR(d, 'YYYYMM') || '-' || e.employee_id,
  e.id,
  EXTRACT(MONTH FROM d)::int,
  EXTRACT(YEAR  FROM d)::int,
  date_trunc('month', d)::date,
  (date_trunc('month', d) + INTERVAL '1 month' - INTERVAL '1 day')::date,
  -- gross = basic + hra(40%) + special
  e.basic_salary + ROUND(e.basic_salary * 0.40) + e.special_allowance,
  -- deductions = PF(12%, cap 1800) + PT(200 if gross>=15000)
  LEAST(ROUND(e.basic_salary * 0.12), 1800)
    + CASE WHEN e.basic_salary + ROUND(e.basic_salary * 0.40) + e.special_allowance >= 15000 THEN 200 ELSE 0 END,
  -- net
  e.basic_salary + ROUND(e.basic_salary * 0.40) + e.special_allowance
    - LEAST(ROUND(e.basic_salary * 0.12), 1800)
    - CASE WHEN e.basic_salary + ROUND(e.basic_salary * 0.40) + e.special_allowance >= 15000 THEN 200 ELSE 0 END,
  jsonb_build_object(
    'Basic Salary', e.basic_salary,
    'HRA',          ROUND(e.basic_salary * 0.40),
    'Special Allowance', e.special_allowance
  ),
  jsonb_build_object(
    'Provident Fund',   LEAST(ROUND(e.basic_salary * 0.12), 1800),
    'Professional Tax', CASE WHEN e.basic_salary + ROUND(e.basic_salary * 0.40) + e.special_allowance >= 15000 THEN 200 ELSE 0 END
  ),
  'Generated'
FROM employees e
CROSS JOIN (
  SELECT date_trunc('month', CURRENT_DATE - (n * INTERVAL '1 month')) AS d
  FROM generate_series(1, 2) AS n
) months;

-- ── Employee Assets ───────────────────────────────────────────
INSERT INTO employee_assets
  (employee_id, asset_name, asset_type, serial_number, allocated_date, condition, status)
VALUES
  (1, 'MacBook Pro 14"',  'Laptop', 'MPB-2023-001', '2022-03-15', 'Good', 'Allocated'),
  (1, 'USB-C Hub',        'Other',  'HUB-001',      '2022-03-15', 'Good', 'Allocated'),
  (2, 'Dell Monitor 24"', 'Other',  'MON-001',      '2023-01-10', 'Good', 'Allocated'),
  (3, 'MacBook Air M2',   'Laptop', 'MBA-2023-002', '2023-07-01', 'Good', 'Allocated'),
  (4, 'iPhone 13',        'Mobile', 'IPH-001',      '2021-11-20', 'Good', 'Allocated'),
  (5, 'HP EliteBook',     'Laptop', 'HPL-001',      '2022-08-05', 'Good', 'Allocated');

-- ── Announcements ─────────────────────────────────────────────
INSERT INTO announcements (title, content, priority, is_active) VALUES
  ('Welcome to Jeevan Solutions HRMS!',
   'We have launched our new HR Management System. All employees can now apply for leaves, view salary slips, and track attendance online. Please complete your profile setup by this Friday.',
   'High', true),
  ('Q2 Performance Reviews — July 15',
   'Performance appraisals for Q2 will begin on July 15. Managers should submit their team ratings by July 10. Employees can view their appraisal history under My Appraisals.',
   'Medium', true);

-- ── Payroll Rules (singleton) ─────────────────────────────────
INSERT INTO payroll_rules
  (pf_enabled, esi_enabled, hra_enabled,
   pf_employee_rate, pf_employee_cap, pf_employer_rate, pf_employer_cap,
   esi_employee_rate, esi_employer_rate, esi_wage_ceiling)
VALUES
  (true, true, true, 12.0, 1800.0, 12.0, 1800.0, 0.75, 3.25, 21000.0);

-- ── Feature Permissions ───────────────────────────────────────
INSERT INTO role_permissions (role, allowed_features) VALUES
  ('HR',       '["dashboard","employees","departments","designations","leaves","leave-types","leave-balances","attendance","holidays","announcements","salary-slips","payroll-entry","payroll-rules","assets","job-openings","applicants","appraisals","edit-requests","resignations","onboarding","document-requests","status-sheets","company-docs","work-mode-sheet","reports"]'::jsonb),
  ('CEO',      '["ceo-dashboard","compensation-planner","dashboard","employees","leaves","attendance","salary-slips","payroll-entry","reports","assets","appraisals","announcements","holidays"]'::jsonb),
  ('Employee', '["emp-dashboard","my-profile","my-leaves","my-salary","my-attendance","my-documents","my-status","my-work-mode","my-appraisals","my-announcements","my-holidays","my-assets","my-edit-requests","my-resignation"]'::jsonb);

SELECT 'Seed complete! Employees: ' || COUNT(*) FROM employees;
