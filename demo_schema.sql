-- Demo DB schema — generated from SQLAlchemy models
-- Apply to Railway demo Postgres before running seed_demo.sql

-- ── Core lookup tables ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    username         VARCHAR(100) NOT NULL,
    email            VARCHAR(200),
    full_name        VARCHAR(200),
    hashed_password  VARCHAR(255) NOT NULL,
    role             VARCHAR(50) DEFAULT 'Employee',
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    parent_id  INTEGER REFERENCES departments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS designations (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Employees ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
    id                    SERIAL PRIMARY KEY,
    employee_id           VARCHAR(50),
    first_name            VARCHAR(100) NOT NULL,
    last_name             VARCHAR(100),
    full_name             VARCHAR(200),
    email                 VARCHAR(200),
    mobile                VARCHAR(20),
    gender                VARCHAR(10),
    date_of_birth         DATE,
    date_of_joining       DATE NOT NULL,
    status                VARCHAR(20) DEFAULT 'Active',
    department_id         INTEGER REFERENCES departments(id),
    designation_id        INTEGER REFERENCES designations(id),
    reports_to_id         INTEGER REFERENCES employees(id),
    employment_type       VARCHAR(50) DEFAULT 'Full-time',
    notice_period_days    INTEGER,
    probation_period_days INTEGER,
    office_address        VARCHAR(500),
    residential_address   VARCHAR(500),
    bank_name             VARCHAR(100),
    bank_account_no       VARCHAR(50),
    bank_ifsc             VARCHAR(20),
    bank_branch           VARCHAR(100),
    aadhar_no             VARCHAR(20),
    pan_no                VARCHAR(20),
    biometric_id          VARCHAR(30),
    user_id               INTEGER REFERENCES users(id),
    profile_photo         VARCHAR(500),
    basic_salary          FLOAT,
    hra_percent           FLOAT DEFAULT 40.0,
    special_allowance     FLOAT DEFAULT 0.0,
    ca_allowance          FLOAT DEFAULT 0.0,
    lta                   FLOAT DEFAULT 0.0,
    other_allowance       FLOAT DEFAULT 0.0,
    pf_applicable         INTEGER DEFAULT 1,
    esi_applicable        INTEGER DEFAULT 1,
    pt_state              VARCHAR(50) DEFAULT 'Karnataka',
    education             JSONB DEFAULT '[]',
    experience            JSONB DEFAULT '[]',
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Leave ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_types (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    max_leaves        FLOAT DEFAULT 0,
    is_carry_forward  BOOLEAN DEFAULT FALSE,
    is_paid           BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_balances (
    id               SERIAL PRIMARY KEY,
    employee_id      INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id    INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year             INTEGER NOT NULL,
    allocated        FLOAT DEFAULT 0,
    used             FLOAT DEFAULT 0,
    carried_forward  FLOAT DEFAULT 0,
    UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_applications (
    id                  SERIAL PRIMARY KEY,
    employee_id         INTEGER NOT NULL REFERENCES employees(id),
    leave_type_id       INTEGER NOT NULL REFERENCES leave_types(id),
    from_date           DATE NOT NULL,
    to_date             DATE NOT NULL,
    total_days          FLOAT DEFAULT 0,
    half_day            BOOLEAN DEFAULT FALSE,
    leave_category      VARCHAR(20) DEFAULT 'Planned',
    reason              TEXT,
    status              VARCHAR(30) DEFAULT 'Pending',
    cancellation_reason TEXT,
    pending_from_date   DATE,
    pending_to_date     DATE,
    pending_total_days  FLOAT,
    edit_reason         TEXT,
    approved_by         INTEGER REFERENCES users(id),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Attendance ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
    id            SERIAL PRIMARY KEY,
    employee_id   INTEGER NOT NULL REFERENCES employees(id),
    date          DATE NOT NULL,
    status        VARCHAR(20) DEFAULT 'Present',
    in_time       VARCHAR(10),
    out_time      VARCHAR(10),
    working_hours FLOAT DEFAULT 0,
    late_entry    BOOLEAN DEFAULT FALSE,
    early_exit    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Payroll ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_entries (
    id               SERIAL PRIMARY KEY,
    month            INTEGER NOT NULL,
    year             INTEGER NOT NULL,
    company          VARCHAR(200) DEFAULT 'Artech Solutions',
    status           VARCHAR(20) DEFAULT 'Draft',
    total_employees  INTEGER DEFAULT 0,
    total_gross      FLOAT DEFAULT 0,
    total_net        FLOAT DEFAULT 0,
    notes            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_slips (
    id               SERIAL PRIMARY KEY,
    slip_id          VARCHAR(50),
    employee_id      INTEGER NOT NULL REFERENCES employees(id),
    month            INTEGER NOT NULL,
    year             INTEGER NOT NULL,
    start_date       DATE,
    end_date         DATE,
    gross_pay        FLOAT DEFAULT 0,
    total_deduction  FLOAT DEFAULT 0,
    net_pay          FLOAT DEFAULT 0,
    earnings         JSONB DEFAULT '[]',
    deductions       JSONB DEFAULT '[]',
    status           VARCHAR(20) DEFAULT 'Draft',
    payroll_entry_id INTEGER REFERENCES payroll_entries(id),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_rules (
    id                   SERIAL PRIMARY KEY,
    pf_enabled           BOOLEAN DEFAULT TRUE,
    esi_enabled          BOOLEAN DEFAULT TRUE,
    hra_enabled          BOOLEAN DEFAULT TRUE,
    pf_employee_rate     FLOAT DEFAULT 12.0,
    pf_employee_cap      FLOAT DEFAULT 1800.0,
    pf_employer_rate     FLOAT DEFAULT 12.0,
    pf_employer_cap      FLOAT DEFAULT 1800.0,
    esi_employee_rate    FLOAT DEFAULT 0.75,
    esi_employer_rate    FLOAT DEFAULT 3.25,
    esi_wage_ceiling     FLOAT DEFAULT 21000.0,
    pt_enabled           BOOLEAN DEFAULT TRUE,
    default_hra_percent  FLOAT DEFAULT 40.0,
    lop_enabled          BOOLEAN DEFAULT FALSE,
    lop_basis            VARCHAR(20) DEFAULT 'calendar',
    gratuity_enabled     BOOLEAN DEFAULT FALSE,
    gratuity_rate        FLOAT DEFAULT 4.81,
    bonus_enabled        BOOLEAN DEFAULT FALSE,
    bonus_rate           FLOAT DEFAULT 8.33,
    bonus_wage_ceil      FLOAT DEFAULT 7000.0,
    use_salary_structure BOOLEAN DEFAULT TRUE,
    basic_pct            FLOAT DEFAULT 50.0,
    hra_pct              FLOAT DEFAULT 20.0,
    ca_pct               FLOAT DEFAULT 12.33,
    others_pct           FLOAT DEFAULT 17.67,
    custom_components    JSONB DEFAULT '[]',
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Assets, Holidays, Announcements ──────────────────────────
CREATE TABLE IF NOT EXISTS employee_assets (
    id             SERIAL PRIMARY KEY,
    employee_id    INTEGER NOT NULL REFERENCES employees(id),
    asset_name     VARCHAR(200) NOT NULL,
    asset_type     VARCHAR(100) NOT NULL,
    serial_number  VARCHAR(100),
    allocated_date DATE NOT NULL,
    returned_date  DATE,
    condition      VARCHAR(20) DEFAULT 'Good',
    notes          VARCHAR(500),
    status         VARCHAR(30) DEFAULT 'Allocated',
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS holidays (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    date          DATE NOT NULL,
    holiday_type  VARCHAR(50) DEFAULT 'National',
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(300) NOT NULL,
    content     TEXT NOT NULL,
    priority    VARCHAR(20) DEFAULT 'Medium',
    is_active   BOOLEAN DEFAULT TRUE,
    created_by  VARCHAR(200),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_on  DATE
);

-- ── Permissions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
    id               SERIAL PRIMARY KEY,
    role             VARCHAR(50) NOT NULL UNIQUE,
    allowed_features JSONB DEFAULT '[]',
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Audit / Activity Log (also in main.py startup) ───────────
CREATE TABLE IF NOT EXISTS activity_logs (
    id          SERIAL PRIMARY KEY,
    actor       VARCHAR(100),
    actor_role  VARCHAR(50),
    action      VARCHAR(50),
    entity_type VARCHAR(100),
    entity_id   VARCHAR(100),
    entity_name VARCHAR(300),
    changes     JSONB,
    ip_address  VARCHAR(50),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Other tables needed by app startup / FK chains ───────────
CREATE TABLE IF NOT EXISTS expense_claims (
    id           SERIAL PRIMARY KEY,
    employee_id  INTEGER NOT NULL REFERENCES employees(id),
    claim_date   DATE NOT NULL,
    expense_type VARCHAR(100) NOT NULL,
    amount       FLOAT NOT NULL,
    description  TEXT,
    receipt_url  VARCHAR(500),
    status       VARCHAR(30) DEFAULT 'Pending',
    approved_by  INTEGER REFERENCES users(id),
    approved_on  DATE,
    remarks      TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_requests (
    id           SERIAL PRIMARY KEY,
    employee_id  INTEGER NOT NULL REFERENCES employees(id),
    doc_type     VARCHAR(100) NOT NULL,
    remarks      TEXT,
    status       VARCHAR(20) DEFAULT 'Pending',
    requested_at TIMESTAMP DEFAULT NOW(),
    fulfilled_at TIMESTAMP,
    file_url     VARCHAR(500),
    file_name    VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS status_entries (
    id               SERIAL PRIMARY KEY,
    employee_id      INTEGER NOT NULL REFERENCES employees(id),
    task_id          VARCHAR(20) NOT NULL,
    entry_date       DATE NOT NULL,
    task_name        TEXT,
    due_date         DATE,
    status           VARCHAR(50) DEFAULT 'In Progress',
    percent_complete INTEGER DEFAULT 0,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appraisals (
    id               SERIAL PRIMARY KEY,
    employee_id      INTEGER NOT NULL REFERENCES employees(id),
    period           VARCHAR(50),
    goals            JSONB DEFAULT '[]',
    self_eval        JSONB,
    hr_eval          JSONB,
    manager_eval     JSONB,
    ceo_eval         JSONB,
    business_eval    JSONB,
    biz_head_eval    JSONB,
    self_score       FLOAT,
    hr_score         FLOAT,
    manager_score    FLOAT,
    ceo_score        FLOAT,
    business_score   FLOAT,
    biz_head_score   FLOAT,
    total_score      FLOAT DEFAULT 0,
    perf_documents   JSONB DEFAULT '[]',
    status           VARCHAR(30) DEFAULT 'Goals Set',
    reviewer_comments TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_openings (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    department_id   INTEGER REFERENCES departments(id),
    designation_id  INTEGER REFERENCES designations(id),
    no_of_positions INTEGER DEFAULT 1,
    status          VARCHAR(20) DEFAULT 'Open',
    closes_on       DATE,
    description     TEXT,
    expected_ctc    FLOAT,
    attachment_url  VARCHAR(500),
    attachment_name VARCHAR(200),
    social_platforms JSONB DEFAULT '[]',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applicants (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(200) NOT NULL,
    email          VARCHAR(200) NOT NULL,
    phone          VARCHAR(20),
    job_opening_id INTEGER NOT NULL REFERENCES job_openings(id),
    status         VARCHAR(20) DEFAULT 'Applied',
    resume_url     VARCHAR(500),
    cover_letter   TEXT,
    notes          TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_checklists (
    id          SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) UNIQUE,
    items       TEXT NOT NULL DEFAULT '{}',
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resignations (
    id                         SERIAL PRIMARY KEY,
    employee_id                INTEGER NOT NULL REFERENCES employees(id),
    reason                     TEXT NOT NULL,
    last_working_date          DATE,
    notice_period_days         INTEGER,
    status                     VARCHAR(20) DEFAULT 'Pending',
    hr_remarks                 TEXT,
    approved_last_working_date DATE,
    actioned_by                INTEGER REFERENCES users(id),
    actioned_at                TIMESTAMP WITH TIME ZONE,
    created_at                 TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                 TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS edit_requests (
    id           SERIAL PRIMARY KEY,
    employee_id  INTEGER NOT NULL REFERENCES employees(id),
    request_type VARCHAR(50) NOT NULL,
    target_date  DATE NOT NULL,
    description  TEXT NOT NULL,
    reason       TEXT NOT NULL,
    status       VARCHAR(20) DEFAULT 'Pending',
    hr_remarks   TEXT,
    created_at   TIMESTAMP DEFAULT NOW(),
    resolved_at  TIMESTAMP,
    resolved_by  INTEGER REFERENCES users(id)
);

-- Tables from main.py startup SQL
CREATE TABLE IF NOT EXISTS notifications (
    id                SERIAL PRIMARY KEY,
    recipient_user_id INTEGER NOT NULL,
    entity_type       VARCHAR(50) NOT NULL,
    entity_id         INTEGER,
    notif_type        VARCHAR(30) NOT NULL DEFAULT 'info',
    title             VARCHAR(300) NOT NULL,
    message           TEXT NOT NULL,
    action            VARCHAR(100),
    priority          VARCHAR(10) DEFAULT 'medium',
    is_read           BOOLEAN DEFAULT FALSE,
    is_cc             BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_workflows (
    id         SERIAL PRIMARY KEY,
    module     VARCHAR(50) UNIQUE NOT NULL,
    levels     JSONB NOT NULL,
    cc_roles   JSONB DEFAULT '[]',
    is_active  BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_requests (
    id                   SERIAL PRIMARY KEY,
    module               VARCHAR(50) NOT NULL,
    entity_id            INTEGER,
    requested_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    current_level        INTEGER DEFAULT 1,
    status               VARCHAR(20) DEFAULT 'pending',
    payload              JSONB,
    remarks              TEXT,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_steps (
    id                  SERIAL PRIMARY KEY,
    approval_request_id INTEGER NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    level               INTEGER NOT NULL,
    approver_role       VARCHAR(50) NOT NULL,
    approver_user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status              VARCHAR(20) DEFAULT 'pending',
    remarks             TEXT,
    actioned_at         TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oauth_states (
    state      VARCHAR(100) PRIMARY KEY,
    platform   VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_documents (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    r2_key      VARCHAR(500) NOT NULL,
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deletion_log (
    id          SERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_name TEXT NOT NULL,
    deleted_by  VARCHAR(100),
    deleted_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    extra       JSONB
);

CREATE TABLE IF NOT EXISTS leave_accrual_log (
    id                 SERIAL PRIMARY KEY,
    year_month         VARCHAR(7) NOT NULL UNIQUE,
    run_at             TIMESTAMP DEFAULT NOW(),
    employees_credited INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hr_reminder_log (
    id             SERIAL PRIMARY KEY,
    reminder_key   VARCHAR(200) NOT NULL UNIQUE,
    sent_at        TIMESTAMP DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_uname    ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_emp_status     ON employees(status);
CREATE INDEX IF NOT EXISTS idx_emp_dept       ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_leave_emp      ON leave_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status   ON leave_applications(status);
CREATE INDEX IF NOT EXISTS idx_leave_dates    ON leave_applications(from_date, to_date);
CREATE INDEX IF NOT EXISTS idx_att_emp_date   ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_att_status     ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_expense_emp    ON expense_claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_stat   ON expense_claims(status);
CREATE INDEX IF NOT EXISTS idx_doc_emp        ON document_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_doc_status     ON document_requests(status);
CREATE INDEX IF NOT EXISTS idx_notif_user     ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read     ON notifications(recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_type     ON notifications(entity_type);
CREATE INDEX IF NOT EXISTS idx_apprv_module   ON approval_requests(module);
CREATE INDEX IF NOT EXISTS idx_apprv_status   ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_step_req       ON approval_steps(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_step_role      ON approval_steps(approver_role, status);
CREATE INDEX IF NOT EXISTS idx_oauth_created  ON oauth_states(created_at);
CREATE INDEX IF NOT EXISTS idx_del_log_type   ON deletion_log(entity_type, deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_act_log_actor  ON activity_logs(actor);
CREATE INDEX IF NOT EXISTS idx_act_log_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_act_log_entity ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_act_log_time   ON activity_logs(created_at DESC);
