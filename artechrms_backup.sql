--
-- PostgreSQL database dump
--

\restrict 8lCQyAy8XjQZ7oEUHFAdEGE8ChsWf2j0qrcs4fvYADo4OMmuhHJe4C3W0t1Ye53

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying(300) NOT NULL,
    content text NOT NULL,
    priority character varying(20),
    is_active boolean,
    created_by character varying(200),
    created_at timestamp with time zone DEFAULT now(),
    expires_on date
);


--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: appraisals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appraisals (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    period character varying(50),
    goals json,
    total_score double precision,
    status character varying(30),
    reviewer_comments text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    self_eval jsonb,
    manager_eval jsonb,
    business_eval jsonb,
    biz_head_eval jsonb,
    self_score double precision,
    manager_score double precision,
    business_score double precision,
    biz_head_score double precision
);


--
-- Name: appraisals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appraisals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appraisals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appraisals_id_seq OWNED BY public.appraisals.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    date date NOT NULL,
    status character varying(20),
    in_time character varying(10),
    out_time character varying(10),
    working_hours double precision,
    late_entry boolean,
    early_exit boolean,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    parent_id integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: designations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designations (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    description character varying(500),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: designations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.designations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: designations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.designations_id_seq OWNED BY public.designations.id;


--
-- Name: document_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_requests (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    doc_type character varying(100) NOT NULL,
    remarks text,
    status character varying(20),
    requested_at timestamp without time zone,
    fulfilled_at timestamp without time zone,
    file_url character varying(500),
    file_name character varying(200)
);


--
-- Name: document_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.document_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.document_requests_id_seq OWNED BY public.document_requests.id;


--
-- Name: edit_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.edit_requests (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    request_type character varying(50) NOT NULL,
    target_date date NOT NULL,
    description text NOT NULL,
    reason text NOT NULL,
    status character varying(20),
    hr_remarks text,
    created_at timestamp without time zone,
    resolved_at timestamp without time zone,
    resolved_by integer
);


--
-- Name: edit_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.edit_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: edit_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.edit_requests_id_seq OWNED BY public.edit_requests.id;


--
-- Name: emergency_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_contacts (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    name character varying(200) NOT NULL,
    relationship_type character varying(100) NOT NULL,
    phone character varying(30) NOT NULL,
    email character varying(200),
    is_primary boolean,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: emergency_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emergency_contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: emergency_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emergency_contacts_id_seq OWNED BY public.emergency_contacts.id;


--
-- Name: employee_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_assets (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    asset_name character varying(200) NOT NULL,
    asset_type character varying(100) NOT NULL,
    serial_number character varying(100),
    allocated_date date NOT NULL,
    returned_date date,
    condition character varying(20),
    notes character varying(500),
    status character varying(30),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: employee_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_assets_id_seq OWNED BY public.employee_assets.id;


--
-- Name: employee_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_documents (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    document_type character varying(100) NOT NULL,
    document_name character varying(300) NOT NULL,
    file_url character varying(500) NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now()
);


--
-- Name: employee_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_documents_id_seq OWNED BY public.employee_documents.id;


--
-- Name: employee_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_history (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    change_type character varying(100),
    from_department character varying(200),
    to_department character varying(200),
    from_designation character varying(200),
    to_designation character varying(200),
    effective_date date NOT NULL,
    remarks text,
    created_by character varying(200),
    created_at timestamp with time zone DEFAULT now(),
    salary_before double precision,
    salary_after double precision,
    last_working_date date
);


--
-- Name: employee_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_history_id_seq OWNED BY public.employee_history.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_id character varying(50),
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    full_name character varying(200),
    email character varying(200),
    mobile character varying(20),
    gender character varying(10),
    date_of_birth date,
    date_of_joining date NOT NULL,
    status character varying(20),
    department_id integer,
    designation_id integer,
    reports_to_id integer,
    employment_type character varying(50),
    bank_name character varying(100),
    bank_account_no character varying(50),
    user_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    profile_photo character varying(500),
    basic_salary double precision,
    hra_percent double precision DEFAULT 40,
    special_allowance double precision DEFAULT 0,
    lta double precision DEFAULT 0,
    other_allowance double precision DEFAULT 0,
    pf_applicable integer DEFAULT 1,
    esi_applicable integer DEFAULT 1,
    pt_state character varying(50) DEFAULT 'Karnataka'::character varying,
    bank_ifsc character varying(20),
    bank_branch character varying(100),
    aadhar_no character varying(20),
    pan_no character varying(20),
    notice_period_days integer,
    probation_period_days integer,
    office_address text,
    education jsonb DEFAULT '[]'::jsonb,
    experience jsonb DEFAULT '[]'::jsonb,
    residential_address character varying(500)
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: expense_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_claims (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    claim_date date NOT NULL,
    expense_type character varying(100) NOT NULL,
    amount double precision NOT NULL,
    description text,
    receipt_url character varying(500),
    status character varying(30),
    approved_by integer,
    approved_on date,
    remarks text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: expense_claims_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_claims_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_claims_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_claims_id_seq OWNED BY public.expense_claims.id;


--
-- Name: holidays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.holidays (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    date date NOT NULL,
    holiday_type character varying(50),
    description character varying(500),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: holidays_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.holidays_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: holidays_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.holidays_id_seq OWNED BY public.holidays.id;


--
-- Name: job_applicants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_applicants (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    email character varying(200) NOT NULL,
    phone character varying(20),
    job_opening_id integer NOT NULL,
    status character varying(20),
    resume_url character varying(500),
    cover_letter text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: job_applicants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_applicants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_applicants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_applicants_id_seq OWNED BY public.job_applicants.id;


--
-- Name: job_openings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_openings (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    department_id integer,
    designation_id integer,
    no_of_positions integer,
    status character varying(20),
    closes_on date,
    description text,
    expected_ctc double precision,
    created_at timestamp with time zone DEFAULT now(),
    attachment_url character varying(500),
    attachment_name character varying(200),
    social_platforms jsonb DEFAULT '[]'::jsonb
);


--
-- Name: job_openings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_openings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_openings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_openings_id_seq OWNED BY public.job_openings.id;


--
-- Name: leave_accrual_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_accrual_log (
    id integer NOT NULL,
    year_month character varying(7) NOT NULL,
    run_at timestamp without time zone DEFAULT now(),
    employees_credited integer DEFAULT 0
);


--
-- Name: leave_accrual_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leave_accrual_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leave_accrual_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leave_accrual_log_id_seq OWNED BY public.leave_accrual_log.id;


--
-- Name: leave_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_applications (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    leave_type_id integer NOT NULL,
    from_date date NOT NULL,
    to_date date NOT NULL,
    total_days double precision,
    half_day boolean,
    reason text,
    status character varying(30),
    approved_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    leave_category character varying(20) DEFAULT 'Planned'::character varying,
    cancellation_reason text,
    pending_from_date date,
    pending_to_date date,
    pending_total_days double precision,
    edit_reason text
);


--
-- Name: leave_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leave_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leave_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leave_applications_id_seq OWNED BY public.leave_applications.id;


--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_balances (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    leave_type_id integer NOT NULL,
    year integer NOT NULL,
    allocated double precision,
    used double precision,
    carried_forward double precision
);


--
-- Name: leave_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leave_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leave_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leave_balances_id_seq OWNED BY public.leave_balances.id;


--
-- Name: leave_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_policies (
    id integer NOT NULL,
    leave_type_id integer NOT NULL,
    prorate_on_joining boolean DEFAULT false,
    prorate_cutoff_day integer DEFAULT 15,
    leaves_before_cutoff double precision DEFAULT 2.0,
    leaves_after_cutoff double precision DEFAULT 1.0,
    carry_forward_max double precision DEFAULT 0,
    encashment_allowed boolean DEFAULT false,
    min_service_days integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: leave_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leave_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leave_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leave_policies_id_seq OWNED BY public.leave_policies.id;


--
-- Name: leave_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_types (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    max_leaves double precision,
    is_carry_forward boolean,
    is_paid boolean,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: leave_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leave_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leave_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leave_types_id_seq OWNED BY public.leave_types.id;


--
-- Name: letterhead_template; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.letterhead_template (
    id integer NOT NULL,
    company_name character varying,
    tagline character varying,
    logo_filename character varying,
    addr1 character varying,
    addr2 character varying,
    addr3 character varying,
    addr4 character varying,
    phone1 character varying,
    phone2 character varying,
    email character varying,
    website character varying,
    header_color character varying,
    accent_color character varying,
    hr_signatory character varying,
    hr_role character varying,
    updated_at timestamp without time zone DEFAULT now(),
    logo_x_mm double precision DEFAULT 16.0,
    logo_y_mm double precision DEFAULT 10.0,
    logo_size_mm double precision DEFAULT 32.0,
    footer_image_filename character varying,
    logo_w_mm double precision DEFAULT 32.0,
    logo_h_mm double precision DEFAULT 32.0,
    footer_x_mm double precision DEFAULT 0.0,
    footer_y_mm double precision DEFAULT 0.0,
    footer_w_mm double precision DEFAULT 210.0,
    footer_h_mm double precision DEFAULT 62.0,
    signature_filename character varying,
    sig_x_mm double precision DEFAULT 18.0,
    sig_w_mm double precision DEFAULT 40.0,
    sig_h_mm double precision DEFAULT 20.0,
    content_top_mm double precision DEFAULT 58.92,
    body_font character varying(50) DEFAULT 'Helvetica'::character varying,
    body_font_size double precision DEFAULT 10.5,
    body_bold boolean DEFAULT false,
    body_italic boolean DEFAULT false,
    watermark_filename character varying,
    watermark_opacity double precision DEFAULT 0.08,
    watermark_x_mm double precision DEFAULT 45.0,
    watermark_y_mm double precision DEFAULT 88.5,
    watermark_w_mm double precision DEFAULT 120.0,
    watermark_h_mm double precision DEFAULT 120.0
);


--
-- Name: notice_period_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notice_period_config (
    id integer NOT NULL,
    rules jsonb
);


--
-- Name: notice_period_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notice_period_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notice_period_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notice_period_config_id_seq OWNED BY public.notice_period_config.id;


--
-- Name: payroll_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_entries (
    id integer NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    company character varying(200),
    status character varying(20),
    total_employees integer,
    total_gross double precision,
    total_net double precision,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: payroll_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payroll_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payroll_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payroll_entries_id_seq OWNED BY public.payroll_entries.id;


--
-- Name: payroll_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_rules (
    id integer NOT NULL,
    pf_employee_rate double precision DEFAULT 12.0,
    pf_employee_cap double precision DEFAULT 1800.0,
    pf_employer_rate double precision DEFAULT 12.0,
    pf_employer_cap double precision DEFAULT 1800.0,
    esi_employee_rate double precision DEFAULT 0.75,
    esi_employer_rate double precision DEFAULT 3.25,
    esi_wage_ceiling double precision DEFAULT 21000.0,
    pt_enabled boolean DEFAULT true,
    default_hra_percent double precision DEFAULT 40.0,
    lop_enabled boolean DEFAULT false,
    lop_basis character varying(20) DEFAULT 'calendar'::character varying,
    gratuity_enabled boolean DEFAULT false,
    gratuity_rate double precision DEFAULT 4.81,
    bonus_enabled boolean DEFAULT false,
    bonus_rate double precision DEFAULT 8.33,
    bonus_wage_ceil double precision DEFAULT 7000.0,
    custom_components json DEFAULT '[]'::json,
    updated_at timestamp with time zone
);


--
-- Name: payroll_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payroll_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payroll_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payroll_rules_id_seq OWNED BY public.payroll_rules.id;


--
-- Name: profile_update_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_update_logs (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    changes json NOT NULL,
    changed_at timestamp with time zone DEFAULT now(),
    seen_by_hr boolean
);


--
-- Name: profile_update_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profile_update_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profile_update_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profile_update_logs_id_seq OWNED BY public.profile_update_logs.id;


--
-- Name: resignations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resignations (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    reason text NOT NULL,
    last_working_date date,
    notice_period_days integer,
    status character varying(20),
    hr_remarks text,
    approved_last_working_date date,
    actioned_by integer,
    actioned_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: resignations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resignations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resignations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resignations_id_seq OWNED BY public.resignations.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role character varying(50) NOT NULL,
    allowed_features jsonb,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: salary_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_components (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    abbr character varying(20),
    component_type character varying(20),
    amount double precision,
    formula character varying(500),
    is_tax integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: salary_components_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salary_components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salary_components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salary_components_id_seq OWNED BY public.salary_components.id;


--
-- Name: salary_slips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_slips (
    id integer NOT NULL,
    slip_id character varying(50),
    employee_id integer NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    start_date date,
    end_date date,
    gross_pay double precision,
    total_deduction double precision,
    net_pay double precision,
    earnings json,
    deductions json,
    status character varying(20),
    payroll_entry_id integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: salary_slips_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salary_slips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salary_slips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salary_slips_id_seq OWNED BY public.salary_slips.id;


--
-- Name: salary_structures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_structures (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    is_active integer,
    components json,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: salary_structures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salary_structures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salary_structures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salary_structures_id_seq OWNED BY public.salary_structures.id;


--
-- Name: social_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_accounts (
    id integer NOT NULL,
    platform character varying(50) NOT NULL,
    account_name character varying(200),
    account_id character varying(200),
    access_token text,
    refresh_token text,
    token_expires_at timestamp without time zone,
    page_id character varying(200),
    page_name character varying(200),
    ig_user_id character varying(200),
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_accounts_id_seq OWNED BY public.social_accounts.id;


--
-- Name: social_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_posts (
    id integer NOT NULL,
    job_opening_id integer NOT NULL,
    platform character varying(50),
    social_account_id integer,
    post_id character varying(200),
    post_url character varying(500),
    status character varying(50),
    error_message text,
    posted_at timestamp without time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_posts_id_seq OWNED BY public.social_posts.id;


--
-- Name: status_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_entries (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    task_id character varying(20) NOT NULL,
    entry_date date NOT NULL,
    task_name text,
    due_date date,
    status character varying(50),
    percent_complete integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: status_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.status_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: status_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.status_entries_id_seq OWNED BY public.status_entries.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(200),
    full_name character varying(200),
    hashed_password character varying(255) NOT NULL,
    role character varying(50),
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: work_mode_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_mode_entries (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    entry_date date NOT NULL,
    work_mode character varying(50) NOT NULL,
    reason character varying(300),
    duration character varying(30),
    status character varying(20),
    hr_remarks text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    leave_id integer
);


--
-- Name: work_mode_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_mode_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_mode_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_mode_entries_id_seq OWNED BY public.work_mode_entries.id;


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: appraisals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisals ALTER COLUMN id SET DEFAULT nextval('public.appraisals_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: designations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designations ALTER COLUMN id SET DEFAULT nextval('public.designations_id_seq'::regclass);


--
-- Name: document_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_requests ALTER COLUMN id SET DEFAULT nextval('public.document_requests_id_seq'::regclass);


--
-- Name: edit_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edit_requests ALTER COLUMN id SET DEFAULT nextval('public.edit_requests_id_seq'::regclass);


--
-- Name: emergency_contacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_contacts ALTER COLUMN id SET DEFAULT nextval('public.emergency_contacts_id_seq'::regclass);


--
-- Name: employee_assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_assets ALTER COLUMN id SET DEFAULT nextval('public.employee_assets_id_seq'::regclass);


--
-- Name: employee_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents ALTER COLUMN id SET DEFAULT nextval('public.employee_documents_id_seq'::regclass);


--
-- Name: employee_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_history ALTER COLUMN id SET DEFAULT nextval('public.employee_history_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: expense_claims id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims ALTER COLUMN id SET DEFAULT nextval('public.expense_claims_id_seq'::regclass);


--
-- Name: holidays id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holidays ALTER COLUMN id SET DEFAULT nextval('public.holidays_id_seq'::regclass);


--
-- Name: job_applicants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applicants ALTER COLUMN id SET DEFAULT nextval('public.job_applicants_id_seq'::regclass);


--
-- Name: job_openings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_openings ALTER COLUMN id SET DEFAULT nextval('public.job_openings_id_seq'::regclass);


--
-- Name: leave_accrual_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_accrual_log ALTER COLUMN id SET DEFAULT nextval('public.leave_accrual_log_id_seq'::regclass);


--
-- Name: leave_applications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_applications ALTER COLUMN id SET DEFAULT nextval('public.leave_applications_id_seq'::regclass);


--
-- Name: leave_balances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances ALTER COLUMN id SET DEFAULT nextval('public.leave_balances_id_seq'::regclass);


--
-- Name: leave_policies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_policies ALTER COLUMN id SET DEFAULT nextval('public.leave_policies_id_seq'::regclass);


--
-- Name: leave_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_types ALTER COLUMN id SET DEFAULT nextval('public.leave_types_id_seq'::regclass);


--
-- Name: notice_period_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notice_period_config ALTER COLUMN id SET DEFAULT nextval('public.notice_period_config_id_seq'::regclass);


--
-- Name: payroll_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries ALTER COLUMN id SET DEFAULT nextval('public.payroll_entries_id_seq'::regclass);


--
-- Name: payroll_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_rules ALTER COLUMN id SET DEFAULT nextval('public.payroll_rules_id_seq'::regclass);


--
-- Name: profile_update_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_update_logs ALTER COLUMN id SET DEFAULT nextval('public.profile_update_logs_id_seq'::regclass);


--
-- Name: resignations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resignations ALTER COLUMN id SET DEFAULT nextval('public.resignations_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: salary_components id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_components ALTER COLUMN id SET DEFAULT nextval('public.salary_components_id_seq'::regclass);


--
-- Name: salary_slips id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_slips ALTER COLUMN id SET DEFAULT nextval('public.salary_slips_id_seq'::regclass);


--
-- Name: salary_structures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_structures ALTER COLUMN id SET DEFAULT nextval('public.salary_structures_id_seq'::regclass);


--
-- Name: social_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts ALTER COLUMN id SET DEFAULT nextval('public.social_accounts_id_seq'::regclass);


--
-- Name: social_posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts ALTER COLUMN id SET DEFAULT nextval('public.social_posts_id_seq'::regclass);


--
-- Name: status_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_entries ALTER COLUMN id SET DEFAULT nextval('public.status_entries_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: work_mode_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_mode_entries ALTER COLUMN id SET DEFAULT nextval('public.work_mode_entries_id_seq'::regclass);


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcements (id, title, content, priority, is_active, created_by, created_at, expires_on) FROM stdin;
1	QA Test Announcement	This is a QA test announcement	Low	t	\N	2026-05-18 13:55:34.851949+05:30	\N
\.


--
-- Data for Name: appraisals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appraisals (id, employee_id, period, goals, total_score, status, reviewer_comments, created_at, updated_at, self_eval, manager_eval, business_eval, biz_head_eval, self_score, manager_score, business_score, biz_head_score) FROM stdin;
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance (id, employee_id, date, status, in_time, out_time, working_hours, late_entry, early_exit, created_at) FROM stdin;
2	5	2026-05-22	Present	09:07	19:07	10	f	f	2026-05-22 18:07:22.453521+05:30
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, name, parent_id, created_at) FROM stdin;
3	Sales	\N	2026-05-18 12:35:07.362741+05:30
4	Finance	\N	2026-05-18 12:35:07.410316+05:30
6	Digital Marketing	\N	2026-05-19 16:28:38.363382+05:30
7	AI/ML	\N	2026-05-19 16:30:08.978797+05:30
2	HR	\N	2026-05-18 12:35:07.311345+05:30
5	HR Operations	\N	2026-05-18 12:35:07.455258+05:30
11	IT & Engineering	\N	2026-05-19 16:51:53.288543+05:30
\.


--
-- Data for Name: designations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.designations (id, name, description, created_at) FROM stdin;
1	Software Engineer	\N	2026-05-18 12:35:07.504952+05:30
5	Project Manager	\N	2026-05-18 12:35:07.706771+05:30
7	Associate Software Engineer	\N	2026-05-19 16:53:06.162389+05:30
8	Data Analyst	\N	2026-05-19 16:53:50.814148+05:30
9	Digital Marketing Specialist	\N	2026-05-19 16:54:36.0679+05:30
10	Associate Digital Marketing	\N	2026-05-19 16:55:08.342974+05:30
11	Motion Graphic Designer	\N	2026-05-19 16:57:06.019398+05:30
12	Data Scientist	\N	2026-05-19 16:57:22.660999+05:30
13	Associate AI/ML Engineer	\N	2026-05-19 16:58:07.142107+05:30
14	AI/ML Engineer	\N	2026-05-19 16:59:05.936611+05:30
15	UI/UX Designer	\N	2026-05-19 17:02:22.989703+05:30
3	Senior Development	\N	2026-05-18 12:35:07.606311+05:30
19	Human Resource Executive	\N	2026-05-20 15:28:46.218849+05:30
20	Human Resource Associate	\N	2026-05-20 15:28:58.858436+05:30
16	Business Development Associate	\N	2026-05-19 17:05:20.693149+05:30
17	Business Development Executive	\N	2026-05-20 14:28:16.104338+05:30
\.


--
-- Data for Name: document_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_requests (id, employee_id, doc_type, remarks, status, requested_at, fulfilled_at, file_url, file_name) FROM stdin;
1	11	Offer Letter	Can you send me the offer letter	Fulfilled	2026-05-20 13:52:28.060092	2026-05-20 13:53:04.089935	/files/documents/req_1_1779285184.png	Liora.png
3	9	Other	\N	Pending	2026-05-21 05:32:05.471001	\N	\N	\N
2	7	Payslip Copy	For test you can upload any file 	Fulfilled	2026-05-21 05:27:55.403268	2026-05-21 05:33:37.720355	/files/documents/req_2_1779341617.jpg	DMA hiring template.jpg
7	8	Salary Certificate	Need May Moth certification	Pending	2026-05-21 05:35:43.401485	\N	\N	\N
8	8	Experience Letter	\N	Pending	2026-05-21 05:35:51.901051	\N	\N	\N
9	8	Relieving Letter	\N	Pending	2026-05-21 05:36:32.651049	\N	\N	\N
10	8	No Objection Certificate (NOC)	\N	Pending	2026-05-21 05:36:41.06909	\N	\N	\N
11	6	Payslip Copy	\N	Pending	2026-05-21 05:36:45.06485	\N	\N	\N
13	8	Bank Verification Letter	i want my account details for verification	Pending	2026-05-21 05:37:16.655623	\N	\N	\N
14	8	Payslip Copy	Requesting October month pay slip	Pending	2026-05-21 05:38:38.355538	\N	\N	\N
15	8	Other	\N	Fulfilled	2026-05-21 05:38:53.252648	2026-05-21 06:07:51.950697	/files/documents/req_15_1779343671.pdf	ResumeSoumitaSil.pdf
12	6	No Objection Certificate (NOC)	\N	Fulfilled	2026-05-21 05:36:55.1013	2026-05-21 06:08:25.132164	/files/documents/req_12_1779343705.jpg	DMA hiring template.jpg
5	4	Experience Letter	\N	Fulfilled	2026-05-21 05:34:42.694024	2026-05-21 06:08:57.905567	/files/documents/req_5_1779343737.jpg	DMA hiring template.jpg
4	11	Payslip Copy	\N	Fulfilled	2026-05-21 05:32:57.922093	2026-05-21 06:09:25.935289	/files/documents/req_4_1779343765.jpg	DMA hiring template.jpg
16	3	Salary Certificate	\N	Fulfilled	2026-05-21 06:16:03.396286	2026-05-21 06:17:03.248129	/files/documents/req_16_1779344223.pdf	Vallurupalli Keerthana.pdf
17	3	Experience Letter	\N	Fulfilled	2026-05-21 06:18:24.093722	2026-05-21 06:18:41.484058	/files/documents/req_17_1779344321.pdf	foundit_RS_Esakki_Subash_AD Resume.pdf.pdf
6	8	Offer Letter	\N	Fulfilled	2026-05-21 05:35:12.412709	2026-05-21 06:21:09.635155	/files/documents/req_6_1779344469.jpg	DMA hiring template.jpg
18	2	Experience Letter	\N	Fulfilled	2026-05-21 06:23:24.645346	2026-05-21 06:23:55.161582	/files/documents/req_18_1779344635.pdf	ResumeBShirisha.pdf
19	3	No Objection Certificate (NOC)	\N	Fulfilled	2026-05-21 06:25:07.966402	2026-05-21 06:25:15.881702	/files/documents/req_19_1779344715.jpg	DMA hiring template.jpg
20	5	Offer Letter	\N	Fulfilled	2026-05-21 08:28:24.544063	2026-05-21 08:28:53.406335	/files/documents/req_20_1779352133.jpg	anayabanner.jpg
21	2	Extended of Probation Letter	\N	Fulfilled	2026-05-22 08:38:16.517615	2026-05-22 08:38:16.517617	/api/hrm/letters/download/EMP-0002_Extended_of_Probation_Letter_20260522_083816.pdf	EMP-0002_Extended_of_Probation_Letter_20260522_083816.pdf
22	2	Extended of Probation Letter	\N	Fulfilled	2026-05-22 08:46:15.534562	2026-05-22 08:46:15.534563	/api/hrm/letters/download/EMP-0002_Extended_of_Probation_Letter_20260522_084615.pdf	EMP-0002_Extended_of_Probation_Letter_20260522_084615.pdf
23	11	Appointment Letter	\N	Fulfilled	2026-05-22 09:11:47.825111	2026-05-22 09:11:47.825114	/api/hrm/letters/download/EMP-0010_Appointment_Letter_20260522_091147.pdf	EMP-0010_Appointment_Letter_20260522_091147.pdf
24	11	Appointment Letter	\N	Fulfilled	2026-05-22 09:33:17.248939	2026-05-22 09:33:17.248941	/api/hrm/letters/download/EMP-0010_Appointment_Letter_20260522_093317.pdf	EMP-0010_Appointment_Letter_20260522_093317.pdf
25	11	Appointment Letter	\N	Fulfilled	2026-05-22 10:00:24.80058	2026-05-22 10:00:24.800582	/api/hrm/letters/download/EMP-0010_Appointment_Letter_20260522_100024.pdf	EMP-0010_Appointment_Letter_20260522_100024.pdf
26	5	Appointment Letter	\N	Fulfilled	2026-05-22 11:35:38.446433	2026-05-22 11:35:38.446436	/api/hrm/letters/download/EMP-0005_Appointment_Letter_20260522_113538.pdf	EMP-0005_Appointment_Letter_20260522_113538.pdf
27	11	Appointment Letter	\N	Fulfilled	2026-05-22 12:08:22.899487	2026-05-22 12:08:22.899488	/api/hrm/letters/download/EMP-0010_Appointment_Letter_20260522_120822.pdf	EMP-0010_Appointment_Letter_20260522_120822.pdf
28	7	Appointment Letter	\N	Fulfilled	2026-05-22 12:45:40.778192	2026-05-22 12:45:40.778195	/api/hrm/letters/download/EMP-0007_Appointment_Letter_20260522_124540.pdf	EMP-0007_Appointment_Letter_20260522_124540.pdf
\.


--
-- Data for Name: edit_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.edit_requests (id, employee_id, request_type, target_date, description, reason, status, hr_remarks, created_at, resolved_at, resolved_by) FROM stdin;
\.


--
-- Data for Name: emergency_contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.emergency_contacts (id, employee_id, name, relationship_type, phone, email, is_primary, created_at) FROM stdin;
2	2	Sai Tharun	Sibling	6300415069	\N	t	2026-05-20 16:53:54.875601+05:30
3	4	Padmavathi	Parent	8143552387	\N	t	2026-05-20 17:11:02.690489+05:30
4	5	G. Appa Rao	Parent	9177546955	\N	t	2026-05-20 17:13:42.947201+05:30
5	6	Jyoti K. Choudhary	Friend	7620050806	\N	t	2026-05-20 17:24:33.528567+05:30
6	7	kota Manga	Parent	8008975260	\N	t	2026-05-20 17:27:09.190993+05:30
7	8	Ramanujaneshwar. R	Sibling	9000391281	\N	t	2026-05-20 17:38:48.054144+05:30
9	11	A. Jayarama Raju	Sibling	9618415466	\N	t	2026-05-20 17:49:53.104779+05:30
10	12	Srinivas Rao	Parent	9989682095	\N	t	2026-05-20 17:51:25.892885+05:30
11	13	CH. Dayakar	Other	8919137197	\N	t	2026-05-20 18:01:31.870882+05:30
12	14	CH. Jangaiah	Parent	8885553101	\N	t	2026-05-20 18:02:31.064146+05:30
13	15	P. Srinivas Rao	Parent	7794907394	\N	t	2026-05-20 18:10:44.434605+05:30
14	16	Shaika Saifa Banu	Sibling	7661939339	\N	t	2026-05-20 18:11:08.454829+05:30
15	17	S. Savithri	Parent	8885155227	\N	t	2026-05-20 18:26:05.990979+05:30
1	3	Santosh Reddy. Patlolla	Spouse	9632447546	\N	t	2026-05-20 16:51:45.058093+05:30
8	9	K. Bhargav	Sibling	9951288971	\N	t	2026-05-20 17:40:57.736894+05:30
\.


--
-- Data for Name: employee_assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_assets (id, employee_id, asset_name, asset_type, serial_number, allocated_date, returned_date, condition, notes, status, created_at) FROM stdin;
\.


--
-- Data for Name: employee_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_documents (id, employee_id, document_type, document_name, file_url, uploaded_at) FROM stdin;
\.


--
-- Data for Name: employee_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_history (id, employee_id, change_type, from_department, to_department, from_designation, to_designation, effective_date, remarks, created_by, created_at, salary_before, salary_after, last_working_date) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, employee_id, first_name, last_name, full_name, email, mobile, gender, date_of_birth, date_of_joining, status, department_id, designation_id, reports_to_id, employment_type, bank_name, bank_account_no, user_id, created_at, updated_at, profile_photo, basic_salary, hra_percent, special_allowance, lta, other_allowance, pf_applicable, esi_applicable, pt_state, bank_ifsc, bank_branch, aadhar_no, pan_no, notice_period_days, probation_period_days, office_address, education, experience, residential_address) FROM stdin;
3	EMP-0003	Tejaswi	Patlolla	Tejaswi Patlolla	tejaswi.p@artechsolution.co.in	7032647006	Female	1992-06-16	2026-05-13	Active	2	19	\N	Full-time	State Bank Of India	62361549550  	4	2026-05-20 16:14:53.554126+05:30	2026-05-21 09:58:12.85266+05:30	\N	\N	40	0	0	0	1	1	Telangana	SBIN0021461	Saraswathi Nagar, Saidabad, Hyderabad	912744166381	CSMPB4393R	\N	\N	\N	[]	[]	\N
20	EMP-0020	Sunil Kumar 	Akula	Sunil Kumar  Akula	sunilkumar@artechsolution.co.in	7981593859	Male	1988-10-10	2025-07-23	Inactive	3	\N	\N	Full-time	\N	\N	\N	2026-05-21 10:29:33.220338+05:30	2026-05-21 10:30:51.075905+05:30	\N	\N	40	0	0	0	1	1	Karnataka	\N	\N	412108788664	AWVPA6547P	\N	\N	\N	[]	[]	\N
21	EMP-0021	 Vasista	Nuvvula 	Vasista Nuvvula	Vasista.n@artechsolution.co.in	9494948015	Male	2003-04-06	2025-07-01	Active	11	\N	\N	Full-time	\N	\N	\N	2026-05-21 10:34:50.723617+05:30	\N	\N	\N	40	0	0	0	1	1	Telangana	\N	\N	861341011982	CVKPN8303E	\N	\N	\N	[]	[]	\N
18	EMP-0018	Sowmya 	Vadlapatla	Sowmya  Vadlapatla	sowmya.v@artechsolution.co.in	7671056459	Female	1996-06-09	2025-07-21	Inactive	5	19	\N	Full-time	\N	\N	\N	2026-05-21 09:54:00.59444+05:30	2026-05-21 09:54:32.437237+05:30	\N	\N	40	0	0	0	1	1	Karnataka	\N	\N	803977177517	AWKPV2878H	\N	\N	\N	[]	[]	\N
4	EMP-0004	Venkata Santosh	Kuncha	Venkata Santosh Kuncha	santhosh.k@artechsolution.co.in	7661939339	Male	2001-06-13	2025-06-04	Active	6	10	\N	Full-time	Bank of Baroda	24870100017721   	\N	2026-05-20 17:11:02.372524+05:30	2026-05-21 10:58:38.087447+05:30	/files/profiles/emp_4_1779341318.jpg	\N	40	0	0	0	1	1	Telangana	BARB0ONGOLE	Ongole	365504350152	ITKPK5121F	\N	\N	\N	[]	[]	\N
12	EMP-0012	Revanth	Tulabandulla	Revanth Tulabandulla	revanth.t@artechsolution.co.in	8247305724	Male	2004-03-21	2026-01-12	Active	7	13	\N	Full-time	Andhra Bank	111910100251586	\N	2026-05-20 17:51:25.590163+05:30	2026-05-21 10:03:03.424122+05:30	\N	\N	40	0	0	0	1	1	Telangana	UBIN0001119	Kukatpally	464580451594	BUQPT8787A	\N	\N	\N	[]	[]	\N
19	EMP-0019	Kirti Kumar 	Kanukala	Kirti Kumar  Kanukala	Kirti.K@artechsolution.co.in	9949907486	Male	1982-10-18	2026-04-01	Active	3	\N	\N	Full-time	\N	922010060456588	\N	2026-05-21 10:20:44.338618+05:30	\N	\N	\N	40	0	0	0	1	1	Karnataka	UTIB0001114	\N	878821880038	AWZPK8322J	\N	\N	\N	[]	[]	\N
6	EMP-0006	Saifa Banu	Shaik 	Saifa Banu Shaik	Saifa@artechsolution.co.in	7661939339	Female	1999-08-31	2025-06-12	Active	11	15	\N	Full-time	Kotak Mahindra Bank	3945462070	\N	2026-05-20 17:24:33.233889+05:30	2026-05-21 10:05:15.443657+05:30	\N	\N	40	0	0	0	1	1	Telangana	KKBK0007862	Ongole	530341203847	EXFPB3724Q	\N	\N	\N	[]	[]	\N
9	EMP-0009	Surya 	Kedharisetti	Surya  Kedharisetti	surya.k@artechsolution.co.in	 9963430456	Male	2004-06-03	2025-10-08	Active	11	7	\N	Full-time	State Bank Of India	41070224387	\N	2026-05-20 17:40:57.439933+05:30	2026-05-21 10:15:27.713885+05:30	\N	\N	40	0	0	0	1	1	Telangana	SBIN0018881	Konkapalli , Amalapuram	275891443741	NBTPS1421L	\N	\N	\N	[]	[]	\N
22	EMP-0022	Rashmi 	 Badakala	Rashmi   Badakala	rashmi.b@artechsolutions.co.in	6281115448	Female	2000-03-22	2025-12-15	Inactive	2	\N	\N	Full-time	\N	\N	\N	2026-05-21 10:40:36.643356+05:30	2026-05-21 10:40:58.13345+05:30	\N	\N	40	0	0	0	1	1	Telangana	\N	\N	731765817388	EWOPR3903K	\N	\N	\N	[]	[]	\N
5	EMP-0005	Murali Manohar 	 Gedda	Murali Manohar   Gedda	murali.g@artechsolution.co.in	7013757524	Male	1999-06-29	2025-06-19	Active	7	13	7	Full-time	State Bank of India	33285641525   	\N	2026-05-20 17:13:42.702139+05:30	2026-05-22 12:25:44.545291+05:30	/files/profiles/emp_5_1779349429.jpg	\N	40	0	0	0	1	1	Telangana	SBIN0010785	Lalacheruvu	681564665575	CSNPG0410P	\N	\N	\N	[]	[]	\N
7	EMP-0007	Pavan Kumar	Kota	Pavan Kumar Kota	pavankumar.k@artechsolution.co.in	8008845780	Male	1999-09-16	2025-07-14	Active	11	8	\N	Full-time	HDFC Bank	50100484414006	\N	2026-05-20 17:27:08.815658+05:30	2026-05-21 11:31:59.307227+05:30	/files/profiles/emp_7_1779343319.jpeg	\N	40	0	0	0	1	1	Telangana	HDFC0000377	West Marredpally	966490100688	GZZPK4751C	\N	\N	\N	[]	[]	\N
14	EMP-0014	Uma Devi	Cheruku 	Uma Devi Cheruku	umadevi.ch@artechsolution.co.in	8885554116	Female	2000-10-16	2026-01-19	Active	11	12	\N	Full-time	State Bank of India	40840870184 	\N	2026-05-20 18:02:30.735906+05:30	2026-05-21 10:24:29.088985+05:30	\N	\N	40	0	0	0	1	1	Telangana	SBIN0021227	Hastinapuram	880680053713	 CGXPC0033	\N	\N	\N	[]	[]	\N
15	EMP-0015	Naga Datta Sai Syam Sashank	Pathuri	Naga Datta Sai Syam Sashank Pathuri	syam.p@artechsolution.co.in	7780437334	Male	2001-07-12	2026-03-02	Active	7	14	\N	Probation	State Bank Of India	39706031144	\N	2026-05-20 18:10:44.140547+05:30	2026-05-21 10:08:52.869229+05:30	\N	\N	40	0	0	0	1	1	Telangana	SBIN0007827	P and S, Narasaraopet	362304699181	FXDPP4938M	\N	\N	\N	[]	[]	\N
13	EMP-0013	Manasa 	Ganapuram	Manasa  Ganapuram	manasa.g@artechsolution.co.in	7780437334	Female	1999-02-08	2026-02-23	Active	6	11	\N	Probation	State Bank of India	43358736545	\N	2026-05-20 18:01:31.567492+05:30	2026-05-21 10:06:44.457811+05:30	\N	\N	40	0	0	0	1	1	Telangana	SBIN0011110	RTC Complex, Vizianagaram	362304699181	FXDPP4938M	\N	\N	\N	[]	[]	\N
2	EMP-0002	Gouri Sindhu	Usirikapalli	Gouri Sindhu Usirikapalli	sindhu.u@artechsolution.co.in	9182093279	Female	2003-08-22	2026-04-01	Active	2	20	\N	Probation	State Bank of India	42202064677  	3	2026-05-20 15:40:18.906975+05:30	2026-05-21 10:17:11.669681+05:30	\N	\N	40	0	0	0	1	1	Telangana	SBIN0020181	Kodad,Suryapet	8671607403	RPCPS0787G	\N	\N	\N	[]	[]	\N
16	EMP-0016	Saira Banu	Shaik 	Saira Banu Shaik	saira.sk@artechsolution.co.in	7729867866	Female	2001-10-08	2026-04-09	Active	3	16	\N	Probation	Union Bank	330702010169099	\N	2026-05-20 18:11:08.185363+05:30	2026-05-21 10:27:29.223773+05:30	\N	\N	40	0	0	0	1	1	Telangana	UBIN0533076	Ongole	773339495745	RWMPS5898P	\N	\N	\N	[]	[]	\N
17	EMP-0017	Yasaswini 	 Siddabathuni 	Yasaswini   Siddabathuni	yasaswini.s@artechsolution.co.in	9121541468	Female	2003-11-25	2026-04-22	Active	3	17	\N	Probation	Bank of Baroda	24870100010440  	\N	2026-05-20 18:26:05.70266+05:30	2026-05-21 10:28:46.287364+05:30	\N	\N	40	0	0	0	1	1	Telangana	BARB0ONGOLE	Ongole	791406859365	TRMPS7873H	\N	\N	\N	[]	[]	\N
23	EMP-0023	Narendra 	 Pampana 	Narendra   Pampana	narendra.p@artechsolution.co.in	9398244874	Male	1997-03-29	2026-01-23	Inactive	\N	\N	\N	Full-time	\N	\N	\N	2026-05-21 10:46:48.078083+05:30	2026-05-21 10:47:03.934715+05:30	\N	\N	40	0	0	0	1	1	Telangana	\N	\N	826276857675	FNOPP2403L	\N	\N	\N	[]	[]	\N
11	EMP-0010	Ramya 	 Alluri  	Ramya   Alluri	ramya.a@artechsolution.co.in	7702069209	Female	2001-01-16	2026-01-12	Active	11	7	5	Full-time	Canara Bank	110275548053 	\N	2026-05-20 17:49:52.798669+05:30	2026-05-21 18:11:00.221925+05:30	/files/profiles/emp_11_1779341786.jpg	\N	40	0	0	0	1	1	Telangana	CNRB0002854	Kompally, Ranga Reddy	588986386856	GLQPR4118R	\N	\N	\N	[]	[]	Hyderabad
8	EMP-0008	Arun	Nalla	Arun Nalla	arun.n@artechsolution.co.in	9700459278	Male	1987-07-28	2025-09-17	Active	6	9	\N	Full-time	Axis Bank	922010060456588 	\N	2026-05-20 17:38:47.730512+05:30	2026-05-21 11:00:24.188086+05:30	/files/profiles/emp_8_1779341424.jpg	\N	40	0	0	0	1	1	Telangana	UTIB0001114	Bibinagar	978777377610	AMZPN3693B	\N	\N	\N	[]	[]	\N
\.


--
-- Data for Name: expense_claims; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_claims (id, employee_id, claim_date, expense_type, amount, description, receipt_url, status, approved_by, approved_on, remarks, created_at) FROM stdin;
\.


--
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.holidays (id, name, date, holiday_type, description, created_at) FROM stdin;
1	Independence Day	2026-08-15	Public	\N	2026-05-18 13:22:27.974894+05:30
3	New year	2026-01-01	Public	\N	2026-05-21 16:56:40.976081+05:30
4	Sankranti/ Pongal	2026-01-15	Public	\N	2026-05-21 16:57:40.787246+05:30
5	Republic Day	2026-01-26	Public	\N	2026-05-21 16:58:35.18603+05:30
6	Maha Shivaratri	2026-02-15	Optional	\N	2026-05-21 16:59:37.90012+05:30
7	Holi	2026-03-04	Public	\N	2026-05-21 17:00:28.686893+05:30
8	Ugadi	2026-03-19	Public	\N	2026-05-21 17:01:07.953479+05:30
9	Ramzan	2026-03-21	Optional	\N	2026-05-21 17:02:46.259986+05:30
10	Sri Rama Navami	2026-03-27	Optional	\N	2026-05-21 17:03:18.901728+05:30
11	Good Friday	2026-04-03	Optional	\N	2026-05-21 17:03:47.741227+05:30
12	May Day	2026-05-01	Optional	\N	2026-05-21 17:04:13.798043+05:30
13	Bakrid	2026-05-27	Optional	\N	2026-05-21 17:04:48.997934+05:30
14	Telangana Formation Day	2026-06-02	Public	\N	2026-05-21 17:05:26.289031+05:30
15	Vinayaka Chavithi	2026-09-15	Public	\N	2026-05-21 17:06:27.866182+05:30
16	Gandhi Jayanthi	2026-10-02	Public	\N	2026-05-21 17:07:00.104765+05:30
17	Vijaya Dasami	2026-10-20	Public	\N	2026-05-21 17:07:28.647932+05:30
18	Deepavali	2026-11-08	Optional	\N	2026-05-21 17:08:11.593819+05:30
19	Christmas	2026-12-25	Public	\N	2026-05-21 17:08:40.314967+05:30
\.


--
-- Data for Name: job_applicants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_applicants (id, name, email, phone, job_opening_id, status, resume_url, cover_letter, notes, created_at) FROM stdin;
\.


--
-- Data for Name: job_openings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_openings (id, title, department_id, designation_id, no_of_positions, status, closes_on, description, expected_ctc, created_at, attachment_url, attachment_name, social_platforms) FROM stdin;
\.


--
-- Data for Name: leave_accrual_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_accrual_log (id, year_month, run_at, employees_credited) FROM stdin;
1	2026-05	2026-05-21 10:41:32.972172	12
\.


--
-- Data for Name: leave_applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_applications (id, employee_id, leave_type_id, from_date, to_date, total_days, half_day, reason, status, approved_by, created_at, updated_at, leave_category, cancellation_reason, pending_from_date, pending_to_date, pending_total_days, edit_reason) FROM stdin;
1	2	2	2026-05-27	2026-05-27	1	f	sick leave 	Approved	\N	2026-05-20 16:33:38.305577+05:30	2026-05-20 18:59:02.453576+05:30	Planned	\N	\N	\N	\N	\N
2	11	3	2026-05-27	2026-05-27	1	f	Surgery	Rejected	\N	2026-05-20 19:33:51.563322+05:30	2026-05-20 19:34:15.519633+05:30	Planned	\N	\N	\N	\N	\N
4	7	3	2026-05-28	2026-05-31	4	f	Traveling out of station	Rejected	\N	2026-05-21 10:53:10.439348+05:30	2026-05-21 10:55:08.13269+05:30	Planned	\N	\N	\N	\N	\N
6	16	2	2026-05-21	2026-05-22	2	f	Not Feeling well, Feeling sick and nauseous	Rejected	\N	2026-05-21 10:58:56.142791+05:30	2026-05-21 11:00:47.55996+05:30	Planned	\N	\N	\N	\N	\N
5	7	2	2026-05-18	2026-05-19	2	f	sick leave 	Rejected	\N	2026-05-21 10:56:32.605046+05:30	2026-05-21 11:02:05.29723+05:30	Planned	\N	\N	\N	\N	\N
7	9	2	2026-05-22	2026-05-23	2	f	fever	Approved	\N	2026-05-21 11:01:35.545208+05:30	2026-05-21 11:02:19.545065+05:30	Planned	\N	\N	\N	\N	\N
8	8	2	2026-05-25	2026-05-28	4	f	Family Trip	Approved	\N	2026-05-21 11:02:15.201825+05:30	2026-05-21 11:02:25.046241+05:30	Planned	\N	\N	\N	\N	\N
11	6	3	2026-05-27	2026-05-29	3	f	Festival	Rejected	\N	2026-05-21 11:03:03.847298+05:30	2026-05-21 11:03:26.294137+05:30	Planned	\N	\N	\N	\N	\N
10	8	2	2026-05-25	2026-05-25	1	f	\N	Approved	\N	2026-05-21 11:02:31.395357+05:30	2026-05-21 11:03:29.396214+05:30	Planned	\N	\N	\N	\N	\N
9	11	2	2026-05-21	2026-05-22	2	f	Health checkup	Approved	\N	2026-05-21 11:02:31.12128+05:30	2026-05-21 11:04:08.716908+05:30	Planned	\N	\N	\N	\N	\N
13	6	2	2026-05-26	2026-05-26	1	f	sick	Approved	\N	2026-05-21 11:03:46.298342+05:30	2026-05-21 11:04:12.615978+05:30	Planned	\N	\N	\N	\N	\N
12	8	3	2026-05-17	2026-05-18	2	f	\N	Rejected	\N	2026-05-21 11:03:04.800188+05:30	2026-05-21 11:04:17.246808+05:30	Planned	\N	\N	\N	\N	\N
14	6	3	2026-05-26	2026-05-28	3	f	Testing	Rejected	\N	2026-05-21 11:04:27.548713+05:30	2026-05-21 11:07:59.694905+05:30	Planned	\N	\N	\N	\N	\N
16	16	3	2026-05-22	2026-05-23	2	f	Will be busy all day, I will be going out with my family for eid shopping	Rejected	\N	2026-05-21 11:09:09.919562+05:30	2026-05-21 11:14:40.262256+05:30	Planned	\N	\N	\N	\N	\N
15	11	2	2026-05-23	2026-05-23	1	f	\N	Approved	\N	2026-05-21 11:08:04.201062+05:30	2026-05-21 11:14:44.159398+05:30	Planned	\N	\N	\N	\N	\N
17	4	2	2026-05-22	2026-05-22	1	f	Health Issue	Approved	\N	2026-05-21 11:15:59.708832+05:30	2026-05-21 11:18:15.256808+05:30	Planned	\N	\N	\N	\N	\N
18	3	3	2026-05-29	2026-05-29	1	f	Casually	Rejected	\N	2026-05-21 11:26:34.420027+05:30	2026-05-21 11:27:08.793675+05:30	Planned	\N	\N	\N	\N	\N
19	9	2	2026-05-26	2026-05-26	1	f	health isssue	Approved	\N	2026-05-21 11:28:55.088605+05:30	2026-05-21 11:29:13.371499+05:30	Planned	\N	\N	\N	\N	\N
20	7	2	2026-05-14	2026-05-26	13	f	Personal leave	Rejected	\N	2026-05-21 11:31:08.588283+05:30	2026-05-21 11:33:04.512249+05:30	Planned	\N	\N	\N	\N	\N
21	7	3	2026-05-24	2026-05-25	2	f	approve this leave test message 	Approved	\N	2026-05-21 11:44:34.597123+05:30	2026-05-21 13:03:53.893579+05:30	Planned	\N	\N	\N	\N	\N
23	5	3	2026-06-01	2026-06-01	1	f	\N	Approved	\N	2026-05-21 13:23:58.852264+05:30	2026-05-21 13:25:31.259598+05:30	Planned	\N	\N	\N	\N	\N
22	5	3	2026-05-21	2026-05-24	4	f	\N	Cancelled	\N	2026-05-21 13:02:24.389602+05:30	2026-05-21 15:56:01.058373+05:30	Planned	i want to cancel my leaves	\N	\N	\N	\N
24	11	2	2026-05-27	2026-05-27	1	f	Marriage	Approved	\N	2026-05-21 18:16:49.615305+05:30	2026-05-21 18:17:53.566239+05:30	Planned	\N	\N	\N	\N	\N
\.


--
-- Data for Name: leave_balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_balances (id, employee_id, leave_type_id, year, allocated, used, carried_forward) FROM stdin;
6	4	3	2026	0	0	0
7	4	2	2026	24	1	0
8	6	3	2026	0	0	0
9	6	2	2026	24	1	0
10	5	3	2026	0	1	0
11	5	2	2026	24	0	0
12	7	3	2026	0	2	0
13	7	2	2026	24	0	0
14	8	3	2026	0	0	0
15	8	2	2026	24	5	0
16	9	3	2026	0	0	0
17	9	2	2026	24	3	0
18	12	3	2026	0	0	0
19	12	2	2026	24	0	0
20	11	3	2026	0	0	0
22	14	3	2026	0	0	0
23	14	2	2026	24	0	0
24	3	3	2026	0	0	0
25	3	2	2026	24	0	0
26	21	3	2026	0	0	0
27	21	2	2026	24	0	0
28	19	3	2026	0	0	0
29	19	2	2026	24	0	0
30	15	2	2026	24	0	0
31	15	3	2026	0	0	0
32	13	2	2026	24	0	0
33	13	3	2026	0	0	0
34	2	2	2026	24	0	0
35	2	3	2026	0	0	0
36	16	2	2026	24	0	0
37	16	3	2026	0	0	0
38	17	2	2026	24	0	0
39	17	3	2026	0	0	0
21	11	2	2026	24	4	0
\.


--
-- Data for Name: leave_policies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_policies (id, leave_type_id, prorate_on_joining, prorate_cutoff_day, leaves_before_cutoff, leaves_after_cutoff, carry_forward_max, encashment_allowed, min_service_days, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_types (id, name, max_leaves, is_carry_forward, is_paid, created_at) FROM stdin;
2	Earn Leave	24	t	t	2026-05-18 12:35:07.06243+05:30
3	LOP	0	f	f	2026-05-18 12:35:07.112298+05:30
\.


--
-- Data for Name: letterhead_template; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.letterhead_template (id, company_name, tagline, logo_filename, addr1, addr2, addr3, addr4, phone1, phone2, email, website, header_color, accent_color, hr_signatory, hr_role, updated_at, logo_x_mm, logo_y_mm, logo_size_mm, footer_image_filename, logo_w_mm, logo_h_mm, footer_x_mm, footer_y_mm, footer_w_mm, footer_h_mm, signature_filename, sig_x_mm, sig_w_mm, sig_h_mm, content_top_mm, body_font, body_font_size, body_bold, body_italic, watermark_filename, watermark_opacity, watermark_x_mm, watermark_y_mm, watermark_w_mm, watermark_h_mm) FROM stdin;
1	AR TECH SOLUTIONS	Driven By Innovation	logo.png	Flat: 402, 4th Floor, 1-11-254 & 255	Naiks's Vijayasri Nivas, Prakash Nagar,	Begumpet, Hyderabad,	Telangana – 500016	+91 7993013344	+91 7993013355	info@artechsolution.co.in	www.artechsolution.co.in	#1764B4	#01BEB0	Radhika Yalamanchili	Human Resource Executive	2026-05-22 18:03:09.405145	5.425000000000001	0.5	16.25	footer.png	103.5	20.5	28	5	153	34	\N	18	40	20	45	Source Sans 3	9.5	f	f	watermark.png	0.04	45	88.5	120	120
\.


--
-- Data for Name: notice_period_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notice_period_config (id, rules) FROM stdin;
1	{"Intern": 15, "Contract": 15, "Full-time": 60, "Part-time": 15}
\.


--
-- Data for Name: payroll_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_entries (id, month, year, company, status, total_employees, total_gross, total_net, notes, created_at) FROM stdin;
1	5	2026	Artech Solutions	Draft	1	0	73000	\N	2026-05-18 14:13:13.673414+05:30
2	4	2026	Artech Solutions	Draft	1	0	73000	\N	2026-05-20 11:52:08.643894+05:30
3	8	2026	Artech Solutions	Draft	0	0	0	\N	2026-05-21 15:44:22.568442+05:30
\.


--
-- Data for Name: payroll_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_rules (id, pf_employee_rate, pf_employee_cap, pf_employer_rate, pf_employer_cap, esi_employee_rate, esi_employer_rate, esi_wage_ceiling, pt_enabled, default_hra_percent, lop_enabled, lop_basis, gratuity_enabled, gratuity_rate, bonus_enabled, bonus_rate, bonus_wage_ceil, custom_components, updated_at) FROM stdin;
\.


--
-- Data for Name: profile_update_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profile_update_logs (id, employee_id, changes, changed_at, seen_by_hr) FROM stdin;
\.


--
-- Data for Name: resignations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resignations (id, employee_id, reason, last_working_date, notice_period_days, status, hr_remarks, approved_last_working_date, actioned_by, actioned_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, role, allowed_features, updated_at) FROM stdin;
1	Admin	["dashboard", "employees", "departments", "designations", "leaves", "leave-types", "leave-balances", "attendance", "holidays", "announcements", "salary-slips", "payroll-entry", "salary-components", "expenses", "assets", "job-openings", "applicants", "appraisals", "company-docs"]	2026-05-22 13:52:17.15762+05:30
2	Manager	["dashboard", "employees", "leaves", "leave-balances", "attendance", "appraisals", "announcements", "company-docs"]	2026-05-22 13:52:17.15762+05:30
3	HR User	["dashboard", "employees", "leaves", "leave-types", "leave-balances", "attendance", "holidays", "announcements", "company-docs"]	2026-05-22 13:52:17.15762+05:30
4	HR	["dashboard", "employees", "departments", "designations", "leaves", "leave-types", "leave-balances", "attendance", "holidays", "announcements", "salary-slips", "payroll-entry", "salary-components", "expenses", "assets", "job-openings", "applicants", "appraisals", "document-requests", "status-sheets", "work-mode-sheet", "my-profile", "my-leaves", "my-salary", "my-attendance", "my-documents", "my-status", "my-work-mode", "payroll-rules", "resignations", "company-docs"]	2026-05-22 13:52:17.15762+05:30
5	CEO	["dashboard", "employees", "leaves", "leave-balances", "attendance", "holidays", "announcements", "document-requests", "appraisals", "company-docs"]	2026-05-22 13:52:17.15762+05:30
6	Employee	["emp-dashboard", "emp-profile", "emp-leaves", "emp-attendance", "emp-salary", "emp-appraisals", "emp-assets", "emp-documents", "emp-status", "emp-work-mode", "emp-edit-requests", "emp-announcements", "emp-holidays", "emp-resignation", "company-docs"]	2026-05-22 13:52:17.15762+05:30
\.


--
-- Data for Name: salary_components; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salary_components (id, name, abbr, component_type, amount, formula, is_tax, created_at) FROM stdin;
\.


--
-- Data for Name: salary_slips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salary_slips (id, slip_id, employee_id, month, year, start_date, end_date, gross_pay, total_deduction, net_pay, earnings, deductions, status, payroll_entry_id, created_at) FROM stdin;
\.


--
-- Data for Name: salary_structures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salary_structures (id, name, is_active, components, created_at) FROM stdin;
\.


--
-- Data for Name: social_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.social_accounts (id, platform, account_name, account_id, access_token, refresh_token, token_expires_at, page_id, page_name, ig_user_id, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: social_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.social_posts (id, job_opening_id, platform, social_account_id, post_id, post_url, status, error_message, posted_at, created_at) FROM stdin;
\.


--
-- Data for Name: status_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.status_entries (id, employee_id, task_id, entry_date, task_name, due_date, status, percent_complete, created_at, updated_at) FROM stdin;
1	2	TSK001	2026-05-01	\N	\N	In Progress	0	2026-05-20 10:10:39.476985	2026-05-20 10:10:39.476988
2	2	TSK002	2026-05-04	\N	\N	In Progress	0	2026-05-20 10:10:39.483221	2026-05-20 10:10:39.483224
3	2	TSK003	2026-05-05	\N	\N	In Progress	0	2026-05-20 10:10:39.484614	2026-05-20 10:10:39.484617
4	2	TSK004	2026-05-06	\N	\N	In Progress	0	2026-05-20 10:10:39.48588	2026-05-20 10:10:39.485882
5	2	TSK005	2026-05-07	\N	\N	In Progress	0	2026-05-20 10:10:39.48694	2026-05-20 10:10:39.486942
6	2	TSK006	2026-05-08	\N	\N	In Progress	0	2026-05-20 10:10:39.488062	2026-05-20 10:10:39.488064
7	2	TSK007	2026-05-11	\N	\N	In Progress	0	2026-05-20 10:10:39.489185	2026-05-20 10:10:39.489189
8	2	TSK008	2026-05-12	\N	\N	In Progress	0	2026-05-20 10:10:39.490215	2026-05-20 10:10:39.490217
9	2	TSK009	2026-05-13	\N	\N	In Progress	0	2026-05-20 10:10:39.491123	2026-05-20 10:10:39.491125
10	2	TSK010	2026-05-14	\N	\N	In Progress	0	2026-05-20 10:10:39.49197	2026-05-20 10:10:39.491972
11	2	TSK011	2026-05-15	\N	\N	In Progress	0	2026-05-20 10:10:39.492824	2026-05-20 10:10:39.492826
12	2	TSK012	2026-05-18	\N	\N	In Progress	0	2026-05-20 10:10:39.493795	2026-05-20 10:10:39.493797
13	2	TSK013	2026-05-19	\N	\N	In Progress	0	2026-05-20 10:10:39.494875	2026-05-20 10:10:39.494877
14	2	TSK014	2026-05-20	\N	\N	In Progress	0	2026-05-20 10:10:39.496471	2026-05-20 10:10:39.496475
15	2	TSK015	2026-04-01	\N	\N	In Progress	0	2026-05-20 10:10:56.412028	2026-05-20 10:10:56.412031
16	2	TSK016	2026-04-02	\N	\N	In Progress	0	2026-05-20 10:10:56.414075	2026-05-20 10:10:56.414078
17	2	TSK017	2026-04-03	\N	\N	In Progress	0	2026-05-20 10:10:56.415146	2026-05-20 10:10:56.415148
18	2	TSK018	2026-04-06	\N	\N	In Progress	0	2026-05-20 10:10:56.416169	2026-05-20 10:10:56.416171
19	2	TSK019	2026-04-07	\N	\N	In Progress	0	2026-05-20 10:10:56.417127	2026-05-20 10:10:56.417129
20	2	TSK020	2026-04-08	\N	\N	In Progress	0	2026-05-20 10:10:56.418146	2026-05-20 10:10:56.418148
21	2	TSK021	2026-04-09	\N	\N	In Progress	0	2026-05-20 10:10:56.419869	2026-05-20 10:10:56.419871
22	2	TSK022	2026-04-10	\N	\N	In Progress	0	2026-05-20 10:10:56.420975	2026-05-20 10:10:56.420977
23	2	TSK023	2026-04-13	\N	\N	In Progress	0	2026-05-20 10:10:56.421875	2026-05-20 10:10:56.421877
24	2	TSK024	2026-04-14	\N	\N	In Progress	0	2026-05-20 10:10:56.42275	2026-05-20 10:10:56.422751
25	2	TSK025	2026-04-15	\N	\N	In Progress	0	2026-05-20 10:10:56.42351	2026-05-20 10:10:56.423511
26	2	TSK026	2026-04-16	\N	\N	In Progress	0	2026-05-20 10:10:56.424331	2026-05-20 10:10:56.424334
27	2	TSK027	2026-04-17	\N	\N	In Progress	0	2026-05-20 10:10:56.425454	2026-05-20 10:10:56.425456
28	2	TSK028	2026-04-20	\N	\N	In Progress	0	2026-05-20 10:10:56.426475	2026-05-20 10:10:56.426477
29	2	TSK029	2026-04-21	\N	\N	In Progress	0	2026-05-20 10:10:56.427266	2026-05-20 10:10:56.427267
30	2	TSK030	2026-04-22	\N	\N	In Progress	0	2026-05-20 10:10:56.428337	2026-05-20 10:10:56.428341
31	2	TSK031	2026-04-23	\N	\N	In Progress	0	2026-05-20 10:10:56.429273	2026-05-20 10:10:56.429275
32	2	TSK032	2026-04-24	\N	\N	In Progress	0	2026-05-20 10:10:56.430069	2026-05-20 10:10:56.430071
33	2	TSK033	2026-04-27	\N	\N	In Progress	0	2026-05-20 10:10:56.430921	2026-05-20 10:10:56.430922
34	2	TSK034	2026-04-28	\N	\N	In Progress	0	2026-05-20 10:10:56.431789	2026-05-20 10:10:56.431791
35	2	TSK035	2026-04-29	\N	\N	In Progress	0	2026-05-20 10:10:56.432556	2026-05-20 10:10:56.432557
36	2	TSK036	2026-04-30	\N	\N	In Progress	0	2026-05-20 10:10:56.433376	2026-05-20 10:10:56.433378
37	2	TSK037	2026-05-21	\N	\N	In Progress	0	2026-05-20 10:37:08.735326	2026-05-20 10:37:08.735329
38	2	TSK038	2026-05-22	\N	\N	In Progress	0	2026-05-20 10:37:08.742084	2026-05-20 10:37:08.742087
39	2	TSK039	2026-05-25	\N	\N	In Progress	0	2026-05-20 10:37:08.743258	2026-05-20 10:37:08.74326
40	2	TSK040	2026-05-26	\N	\N	In Progress	0	2026-05-20 10:37:08.744344	2026-05-20 10:37:08.744346
41	2	TSK041	2026-05-27	\N	\N	In Progress	0	2026-05-20 10:37:08.745368	2026-05-20 10:37:08.745371
42	2	TSK042	2026-05-28	\N	\N	In Progress	0	2026-05-20 10:37:08.746394	2026-05-20 10:37:08.746396
43	2	TSK043	2026-05-29	\N	\N	In Progress	0	2026-05-20 10:37:08.747472	2026-05-20 10:37:08.747474
44	5	TSK001	2026-05-01	\N	\N	In Progress	0	2026-05-20 13:18:06.812744	2026-05-20 13:18:06.812747
45	5	TSK002	2026-05-04	\N	\N	In Progress	0	2026-05-20 13:18:06.827335	2026-05-20 13:18:06.827338
46	5	TSK003	2026-05-05	\N	\N	In Progress	0	2026-05-20 13:18:06.829422	2026-05-20 13:18:06.829434
47	5	TSK004	2026-05-06	\N	\N	In Progress	0	2026-05-20 13:18:06.831409	2026-05-20 13:18:06.831412
48	5	TSK005	2026-05-07	\N	\N	In Progress	0	2026-05-20 13:18:06.833394	2026-05-20 13:18:06.833399
49	5	TSK006	2026-05-08	\N	\N	In Progress	0	2026-05-20 13:18:06.850017	2026-05-20 13:18:06.85002
50	5	TSK007	2026-05-11	\N	\N	In Progress	0	2026-05-20 13:18:06.85141	2026-05-20 13:18:06.851412
51	5	TSK008	2026-05-12	\N	\N	In Progress	0	2026-05-20 13:18:06.853076	2026-05-20 13:18:06.853079
52	5	TSK009	2026-05-13	\N	\N	In Progress	0	2026-05-20 13:18:06.854914	2026-05-20 13:18:06.854917
53	5	TSK010	2026-05-14	\N	\N	In Progress	0	2026-05-20 13:18:06.856101	2026-05-20 13:18:06.856103
54	5	TSK011	2026-05-15	\N	\N	In Progress	0	2026-05-20 13:18:06.857216	2026-05-20 13:18:06.857218
55	5	TSK012	2026-05-18	\N	\N	In Progress	0	2026-05-20 13:18:06.858319	2026-05-20 13:18:06.858321
56	5	TSK013	2026-05-19	\N	\N	In Progress	0	2026-05-20 13:18:06.859862	2026-05-20 13:18:06.859864
57	5	TSK014	2026-05-20	\N	\N	In Progress	0	2026-05-20 13:18:06.861248	2026-05-20 13:18:06.861251
58	5	TSK015	2026-05-21	\N	\N	In Progress	0	2026-05-20 13:18:06.86345	2026-05-20 13:18:06.863453
59	5	TSK016	2026-05-22	\N	\N	In Progress	0	2026-05-20 13:18:06.865051	2026-05-20 13:18:06.865054
60	5	TSK017	2026-05-25	\N	\N	In Progress	0	2026-05-20 13:18:06.86619	2026-05-20 13:18:06.866192
61	5	TSK018	2026-05-26	\N	\N	In Progress	0	2026-05-20 13:18:06.867592	2026-05-20 13:18:06.867602
62	5	TSK019	2026-05-27	\N	\N	In Progress	0	2026-05-20 13:18:06.868838	2026-05-20 13:18:06.86884
63	5	TSK020	2026-05-28	\N	\N	In Progress	0	2026-05-20 13:18:06.870136	2026-05-20 13:18:06.870139
64	5	TSK021	2026-05-29	\N	\N	In Progress	0	2026-05-20 13:18:06.871541	2026-05-20 13:18:06.871551
65	11	TSK001	2026-05-01	\N	\N	In Progress	0	2026-05-20 13:23:37.200449	2026-05-20 13:23:37.200452
66	11	TSK002	2026-05-04	\N	\N	In Progress	0	2026-05-20 13:23:37.202633	2026-05-20 13:23:37.202635
67	11	TSK003	2026-05-05	\N	\N	In Progress	0	2026-05-20 13:23:37.20365	2026-05-20 13:23:37.203652
68	11	TSK004	2026-05-06	\N	\N	In Progress	0	2026-05-20 13:23:37.204585	2026-05-20 13:23:37.204587
69	11	TSK005	2026-05-07	\N	\N	In Progress	0	2026-05-20 13:23:37.205583	2026-05-20 13:23:37.205584
70	11	TSK006	2026-05-08	\N	\N	In Progress	0	2026-05-20 13:23:37.206521	2026-05-20 13:23:37.206523
71	11	TSK007	2026-05-11	\N	\N	In Progress	0	2026-05-20 13:23:37.207544	2026-05-20 13:23:37.207545
72	11	TSK008	2026-05-12	\N	\N	In Progress	0	2026-05-20 13:23:37.20851	2026-05-20 13:23:37.208511
73	11	TSK009	2026-05-13	\N	\N	In Progress	0	2026-05-20 13:23:37.209428	2026-05-20 13:23:37.20943
74	11	TSK010	2026-05-14	\N	\N	In Progress	0	2026-05-20 13:23:37.210394	2026-05-20 13:23:37.210395
75	11	TSK011	2026-05-15	\N	\N	In Progress	0	2026-05-20 13:23:37.211397	2026-05-20 13:23:37.211399
76	11	TSK012	2026-05-18	\N	\N	In Progress	0	2026-05-20 13:23:37.212292	2026-05-20 13:23:37.212294
80	11	TSK016	2026-05-22	\N	\N	In Progress	0	2026-05-20 13:23:37.2166	2026-05-20 13:23:37.216602
81	11	TSK017	2026-05-25	\N	\N	In Progress	0	2026-05-20 13:23:37.217637	2026-05-20 13:23:37.217639
82	11	TSK018	2026-05-26	\N	\N	In Progress	0	2026-05-20 13:23:37.21858	2026-05-20 13:23:37.218581
83	11	TSK019	2026-05-27	\N	\N	In Progress	0	2026-05-20 13:23:37.21958	2026-05-20 13:23:37.219582
84	11	TSK020	2026-05-28	\N	\N	In Progress	0	2026-05-20 13:23:37.220489	2026-05-20 13:23:37.220491
85	11	TSK021	2026-05-29	\N	\N	In Progress	0	2026-05-20 13:23:37.22471	2026-05-20 13:23:37.224712
77	11	TSK013	2026-05-19	Worked on hrms 	2026-05-19	Completed	100	2026-05-20 13:23:37.213287	2026-05-21 05:34:29.342781
88	6	TSK003	2026-05-05	\N	\N	In Progress	0	2026-05-21 05:22:46.199847	2026-05-21 05:22:46.199849
79	11	TSK015	2026-05-21	Worked on the hrms testing	2026-05-21	Completed	100	2026-05-20 13:23:37.215406	2026-05-21 05:33:47.899054
86	6	TSK001	2026-05-01	Website for Elmas	2026-05-31	On Hold	0	2026-05-21 05:22:46.193809	2026-05-21 05:36:13.016052
87	6	TSK002	2026-05-04	EMS	2026-05-22	In Progress	68	2026-05-21 05:22:46.198059	2026-05-21 05:36:15.252492
89	6	TSK004	2026-05-06	\N	\N	In Progress	0	2026-05-21 05:22:46.201334	2026-05-21 05:22:46.201337
90	6	TSK005	2026-05-07	\N	\N	In Progress	0	2026-05-21 05:22:46.20365	2026-05-21 05:22:46.203653
91	6	TSK006	2026-05-08	\N	\N	In Progress	0	2026-05-21 05:22:46.205149	2026-05-21 05:22:46.205152
92	6	TSK007	2026-05-11	\N	\N	In Progress	0	2026-05-21 05:22:46.206352	2026-05-21 05:22:46.206353
93	6	TSK008	2026-05-12	\N	\N	In Progress	0	2026-05-21 05:22:46.207571	2026-05-21 05:22:46.207577
94	6	TSK009	2026-05-13	\N	\N	In Progress	0	2026-05-21 05:22:46.210155	2026-05-21 05:22:46.210158
95	6	TSK010	2026-05-14	\N	\N	In Progress	0	2026-05-21 05:22:46.211815	2026-05-21 05:22:46.211818
96	6	TSK011	2026-05-15	\N	\N	In Progress	0	2026-05-21 05:22:46.213357	2026-05-21 05:22:46.21336
97	6	TSK012	2026-05-18	\N	\N	In Progress	0	2026-05-21 05:22:46.230867	2026-05-21 05:22:46.230871
98	6	TSK013	2026-05-19	\N	\N	In Progress	0	2026-05-21 05:22:46.23249	2026-05-21 05:22:46.232493
99	6	TSK014	2026-05-20	\N	\N	In Progress	0	2026-05-21 05:22:46.233654	2026-05-21 05:22:46.233656
100	6	TSK015	2026-05-21	\N	\N	In Progress	0	2026-05-21 05:22:46.234839	2026-05-21 05:22:46.234841
101	6	TSK016	2026-05-22	\N	\N	In Progress	0	2026-05-21 05:22:46.236005	2026-05-21 05:22:46.236007
102	6	TSK017	2026-05-25	\N	\N	In Progress	0	2026-05-21 05:22:46.237318	2026-05-21 05:22:46.237321
103	6	TSK018	2026-05-26	\N	\N	In Progress	0	2026-05-21 05:22:46.23859	2026-05-21 05:22:46.238593
104	6	TSK019	2026-05-27	\N	\N	In Progress	0	2026-05-21 05:22:46.239661	2026-05-21 05:22:46.239663
105	6	TSK020	2026-05-28	\N	\N	In Progress	0	2026-05-21 05:22:46.240844	2026-05-21 05:22:46.240848
106	6	TSK021	2026-05-29	\N	\N	In Progress	0	2026-05-21 05:22:46.243221	2026-05-21 05:22:46.243225
108	8	TSK002	2026-05-04	\N	\N	In Progress	0	2026-05-21 05:23:32.064111	2026-05-21 05:23:32.064114
109	8	TSK003	2026-05-05	\N	\N	In Progress	0	2026-05-21 05:23:32.081433	2026-05-21 05:23:32.081436
110	8	TSK004	2026-05-06	\N	\N	In Progress	0	2026-05-21 05:23:32.083166	2026-05-21 05:23:32.083168
111	8	TSK005	2026-05-07	\N	\N	In Progress	0	2026-05-21 05:23:32.084576	2026-05-21 05:23:32.084578
112	8	TSK006	2026-05-08	\N	\N	In Progress	0	2026-05-21 05:23:32.085823	2026-05-21 05:23:32.085825
113	8	TSK007	2026-05-11	\N	\N	In Progress	0	2026-05-21 05:23:32.086995	2026-05-21 05:23:32.086997
114	8	TSK008	2026-05-12	\N	\N	In Progress	0	2026-05-21 05:23:32.088305	2026-05-21 05:23:32.088308
115	8	TSK009	2026-05-13	\N	\N	In Progress	0	2026-05-21 05:23:32.089543	2026-05-21 05:23:32.089545
116	8	TSK010	2026-05-14	\N	\N	In Progress	0	2026-05-21 05:23:32.090609	2026-05-21 05:23:32.090611
117	8	TSK011	2026-05-15	\N	\N	In Progress	0	2026-05-21 05:23:32.091812	2026-05-21 05:23:32.091815
118	8	TSK012	2026-05-18	\N	\N	In Progress	0	2026-05-21 05:23:32.09413	2026-05-21 05:23:32.094133
119	8	TSK013	2026-05-19	\N	\N	In Progress	0	2026-05-21 05:23:32.095864	2026-05-21 05:23:32.095868
120	8	TSK014	2026-05-20	\N	\N	In Progress	0	2026-05-21 05:23:32.097212	2026-05-21 05:23:32.097214
123	8	TSK017	2026-05-25	\N	\N	In Progress	0	2026-05-21 05:23:32.100901	2026-05-21 05:23:32.100904
124	8	TSK018	2026-05-26	\N	\N	In Progress	0	2026-05-21 05:23:32.102248	2026-05-21 05:23:32.102251
125	8	TSK019	2026-05-27	\N	\N	In Progress	0	2026-05-21 05:23:32.103594	2026-05-21 05:23:32.103597
126	8	TSK020	2026-05-28	\N	\N	In Progress	0	2026-05-21 05:23:32.105169	2026-05-21 05:23:32.105172
128	4	TSK001	2026-05-01	\N	\N	In Progress	0	2026-05-21 05:24:31.156183	2026-05-21 05:24:31.156187
129	4	TSK002	2026-05-04	\N	\N	In Progress	0	2026-05-21 05:24:31.158095	2026-05-21 05:24:31.158097
130	4	TSK003	2026-05-05	\N	\N	In Progress	0	2026-05-21 05:24:31.159728	2026-05-21 05:24:31.159735
131	4	TSK004	2026-05-06	\N	\N	In Progress	0	2026-05-21 05:24:31.161848	2026-05-21 05:24:31.161851
132	4	TSK005	2026-05-07	\N	\N	In Progress	0	2026-05-21 05:24:31.163493	2026-05-21 05:24:31.163496
133	4	TSK006	2026-05-08	\N	\N	In Progress	0	2026-05-21 05:24:31.165008	2026-05-21 05:24:31.16501
134	4	TSK007	2026-05-11	\N	\N	In Progress	0	2026-05-21 05:24:31.182702	2026-05-21 05:24:31.182705
135	4	TSK008	2026-05-12	\N	\N	In Progress	0	2026-05-21 05:24:31.184328	2026-05-21 05:24:31.18433
136	4	TSK009	2026-05-13	\N	\N	In Progress	0	2026-05-21 05:24:31.185629	2026-05-21 05:24:31.185631
137	4	TSK010	2026-05-14	\N	\N	In Progress	0	2026-05-21 05:24:31.186825	2026-05-21 05:24:31.186828
138	4	TSK011	2026-05-15	\N	\N	In Progress	0	2026-05-21 05:24:31.187886	2026-05-21 05:24:31.187888
139	4	TSK012	2026-05-18	\N	\N	In Progress	0	2026-05-21 05:24:31.189012	2026-05-21 05:24:31.189015
142	4	TSK015	2026-05-21	\N	\N	In Progress	0	2026-05-21 05:24:31.192561	2026-05-21 05:24:31.192563
143	4	TSK016	2026-05-22	\N	\N	In Progress	0	2026-05-21 05:24:31.194323	2026-05-21 05:24:31.194326
144	4	TSK017	2026-05-25	\N	\N	In Progress	0	2026-05-21 05:24:31.196141	2026-05-21 05:24:31.196143
145	4	TSK018	2026-05-26	\N	\N	In Progress	0	2026-05-21 05:24:31.197757	2026-05-21 05:24:31.19776
146	4	TSK019	2026-05-27	\N	\N	In Progress	0	2026-05-21 05:24:31.199259	2026-05-21 05:24:31.199262
147	4	TSK020	2026-05-28	\N	\N	In Progress	0	2026-05-21 05:24:31.200613	2026-05-21 05:24:31.200616
148	4	TSK021	2026-05-29	\N	\N	In Progress	0	2026-05-21 05:24:31.201896	2026-05-21 05:24:31.201899
150	9	TSK002	2026-05-04	\N	\N	In Progress	0	2026-05-21 05:25:52.7428	2026-05-21 05:25:52.742803
151	9	TSK003	2026-05-05	\N	\N	In Progress	0	2026-05-21 05:25:52.744124	2026-05-21 05:25:52.744126
152	9	TSK004	2026-05-06	\N	\N	In Progress	0	2026-05-21 05:25:52.746406	2026-05-21 05:25:52.746411
153	9	TSK005	2026-05-07	\N	\N	In Progress	0	2026-05-21 05:25:52.74883	2026-05-21 05:25:52.748832
154	9	TSK006	2026-05-08	\N	\N	In Progress	0	2026-05-21 05:25:52.750372	2026-05-21 05:25:52.750375
155	9	TSK007	2026-05-11	\N	\N	In Progress	0	2026-05-21 05:25:52.751717	2026-05-21 05:25:52.75172
156	9	TSK008	2026-05-12	\N	\N	In Progress	0	2026-05-21 05:25:52.752931	2026-05-21 05:25:52.752934
157	9	TSK009	2026-05-13	\N	\N	In Progress	0	2026-05-21 05:25:52.754379	2026-05-21 05:25:52.754382
158	9	TSK010	2026-05-14	\N	\N	In Progress	0	2026-05-21 05:25:52.755473	2026-05-21 05:25:52.755475
159	9	TSK011	2026-05-15	\N	\N	In Progress	0	2026-05-21 05:25:52.756596	2026-05-21 05:25:52.756598
160	9	TSK012	2026-05-18	\N	\N	In Progress	0	2026-05-21 05:25:52.757736	2026-05-21 05:25:52.757738
161	9	TSK013	2026-05-19	\N	\N	In Progress	0	2026-05-21 05:25:52.758835	2026-05-21 05:25:52.758837
162	9	TSK014	2026-05-20	\N	\N	In Progress	0	2026-05-21 05:25:52.760044	2026-05-21 05:25:52.760046
165	9	TSK017	2026-05-25	\N	\N	In Progress	0	2026-05-21 05:25:52.765442	2026-05-21 05:25:52.765445
166	9	TSK018	2026-05-26	\N	\N	In Progress	0	2026-05-21 05:25:52.783337	2026-05-21 05:25:52.783339
167	9	TSK019	2026-05-27	\N	\N	In Progress	0	2026-05-21 05:25:52.784952	2026-05-21 05:25:52.784957
168	9	TSK020	2026-05-28	\N	\N	In Progress	0	2026-05-21 05:25:52.786512	2026-05-21 05:25:52.786514
169	9	TSK021	2026-05-29	\N	\N	In Progress	0	2026-05-21 05:25:52.787774	2026-05-21 05:25:52.787776
172	7	TSK003	2026-05-05	\N	\N	In Progress	0	2026-05-21 05:27:58.456582	2026-05-21 05:27:58.456585
173	7	TSK004	2026-05-06	\N	\N	In Progress	0	2026-05-21 05:27:58.457774	2026-05-21 05:27:58.457778
174	7	TSK005	2026-05-07	\N	\N	In Progress	0	2026-05-21 05:27:58.459284	2026-05-21 05:27:58.459287
175	7	TSK006	2026-05-08	\N	\N	In Progress	0	2026-05-21 05:27:58.461557	2026-05-21 05:27:58.46156
176	7	TSK007	2026-05-11	\N	\N	In Progress	0	2026-05-21 05:27:58.462946	2026-05-21 05:27:58.462952
171	7	TSK002	2026-05-04	jsdbsjdbsjdbsjd	2026-05-18	In Progress	100	2026-05-21 05:27:58.455025	2026-05-21 05:29:37.618803
140	4	TSK013	2026-05-19	Published Meta Ads	2026-05-21	Completed	0	2026-05-21 05:24:31.190308	2026-05-21 05:34:06.10833
149	9	TSK001	2026-05-01	i have worked on CRM application	2026-05-21	Completed	0	2026-05-21 05:25:52.739493	2026-05-21 05:34:07.413888
121	8	TSK015	2026-05-21	Working on ELMAS Keywords	2026-05-20	Completed	30	2026-05-21 05:23:32.098606	2026-05-21 05:40:53.772591
164	9	TSK016	2026-05-22		2026-05-21	In Progress	0	2026-05-21 05:25:52.763774	2026-05-21 05:36:15.252068
122	8	TSK016	2026-05-22	Working on ELMAS Keywords	2026-05-21	Completed	0	2026-05-21 05:23:32.099836	2026-05-21 05:41:02.364938
127	8	TSK021	2026-05-29		2026-05-24	In Progress	0	2026-05-21 05:23:32.106605	2026-05-21 05:43:53.01546
107	8	TSK001	2026-05-01	Holiday	2026-05-31	Pending	0	2026-05-21 05:23:32.061283	2026-05-21 05:43:06.151094
163	9	TSK015	2026-05-21		2026-05-20	In Progress	0	2026-05-21 05:25:52.761745	2026-05-21 05:59:35.845581
177	7	TSK008	2026-05-12	\N	\N	In Progress	0	2026-05-21 05:27:58.4654	2026-05-21 05:27:58.465403
178	7	TSK009	2026-05-13	\N	\N	In Progress	0	2026-05-21 05:27:58.484451	2026-05-21 05:27:58.484454
179	7	TSK010	2026-05-14	\N	\N	In Progress	0	2026-05-21 05:27:58.486232	2026-05-21 05:27:58.486235
180	7	TSK011	2026-05-15	\N	\N	In Progress	0	2026-05-21 05:27:58.487795	2026-05-21 05:27:58.487798
181	7	TSK012	2026-05-18	\N	\N	In Progress	0	2026-05-21 05:27:58.489281	2026-05-21 05:27:58.489283
182	7	TSK013	2026-05-19	\N	\N	In Progress	0	2026-05-21 05:27:58.490509	2026-05-21 05:27:58.490511
183	7	TSK014	2026-05-20	\N	\N	In Progress	0	2026-05-21 05:27:58.491585	2026-05-21 05:27:58.491587
184	7	TSK015	2026-05-21	\N	\N	In Progress	0	2026-05-21 05:27:58.492935	2026-05-21 05:27:58.492937
185	7	TSK016	2026-05-22	\N	\N	In Progress	0	2026-05-21 05:27:58.494346	2026-05-21 05:27:58.494348
186	7	TSK017	2026-05-25	\N	\N	In Progress	0	2026-05-21 05:27:58.495447	2026-05-21 05:27:58.49545
187	7	TSK018	2026-05-26	\N	\N	In Progress	0	2026-05-21 05:27:58.496468	2026-05-21 05:27:58.496471
188	7	TSK019	2026-05-27	\N	\N	In Progress	0	2026-05-21 05:27:58.498639	2026-05-21 05:27:58.498642
189	7	TSK020	2026-05-28	\N	\N	In Progress	0	2026-05-21 05:27:58.500594	2026-05-21 05:27:58.500598
190	7	TSK021	2026-05-29	\N	\N	In Progress	0	2026-05-21 05:27:58.502186	2026-05-21 05:27:58.50219
170	7	TSK001	2026-05-01	hsbhsbjsbs	2026-05-21	Completed	100	2026-05-21 05:27:58.452982	2026-05-21 05:29:16.136133
191	16	TSK001	2026-05-01	\N	\N	In Progress	0	2026-05-21 05:30:17.736899	2026-05-21 05:30:17.736903
192	16	TSK002	2026-05-04	\N	\N	In Progress	0	2026-05-21 05:30:17.740561	2026-05-21 05:30:17.740563
193	16	TSK003	2026-05-05	\N	\N	In Progress	0	2026-05-21 05:30:17.742001	2026-05-21 05:30:17.742003
194	16	TSK004	2026-05-06	\N	\N	In Progress	0	2026-05-21 05:30:17.743261	2026-05-21 05:30:17.743263
195	16	TSK005	2026-05-07	\N	\N	In Progress	0	2026-05-21 05:30:17.74484	2026-05-21 05:30:17.744844
196	16	TSK006	2026-05-08	\N	\N	In Progress	0	2026-05-21 05:30:17.746559	2026-05-21 05:30:17.746562
197	16	TSK007	2026-05-11	\N	\N	In Progress	0	2026-05-21 05:30:17.747821	2026-05-21 05:30:17.747823
198	16	TSK008	2026-05-12	\N	\N	In Progress	0	2026-05-21 05:30:17.749083	2026-05-21 05:30:17.749086
199	16	TSK009	2026-05-13	\N	\N	In Progress	0	2026-05-21 05:30:17.751449	2026-05-21 05:30:17.751452
200	16	TSK010	2026-05-14	\N	\N	In Progress	0	2026-05-21 05:30:17.753105	2026-05-21 05:30:17.753108
201	16	TSK011	2026-05-15	\N	\N	In Progress	0	2026-05-21 05:30:17.754573	2026-05-21 05:30:17.754576
202	16	TSK012	2026-05-18	\N	\N	In Progress	0	2026-05-21 05:30:17.75599	2026-05-21 05:30:17.755993
203	16	TSK013	2026-05-19	\N	\N	In Progress	0	2026-05-21 05:30:17.757616	2026-05-21 05:30:17.757619
204	16	TSK014	2026-05-20	\N	\N	In Progress	0	2026-05-21 05:30:17.758885	2026-05-21 05:30:17.758888
205	16	TSK015	2026-05-21	\N	\N	In Progress	0	2026-05-21 05:30:17.75989	2026-05-21 05:30:17.759892
206	16	TSK016	2026-05-22	\N	\N	In Progress	0	2026-05-21 05:30:17.760958	2026-05-21 05:30:17.76096
207	16	TSK017	2026-05-25	\N	\N	In Progress	0	2026-05-21 05:30:17.7623	2026-05-21 05:30:17.762303
208	16	TSK018	2026-05-26	\N	\N	In Progress	0	2026-05-21 05:30:17.763699	2026-05-21 05:30:17.763702
209	16	TSK019	2026-05-27	\N	\N	In Progress	0	2026-05-21 05:30:17.764881	2026-05-21 05:30:17.764883
210	16	TSK020	2026-05-28	\N	\N	In Progress	0	2026-05-21 05:30:17.766049	2026-05-21 05:30:17.766053
211	16	TSK021	2026-05-29	\N	\N	In Progress	0	2026-05-21 05:30:17.768318	2026-05-21 05:30:17.768321
141	4	TSK014	2026-05-20	Prepared Weekly Social Media Calendar for AR Tech, Scheduled post for AR Tech, Started WIX	2026-05-26	On Hold	15	2026-05-21 05:24:31.191456	2026-05-21 05:32:43.057201
78	11	TSK014	2026-05-20	Worked on hrms and erp fields	2026-05-20	Completed	100	2026-05-20 13:23:37.214365	2026-05-21 05:33:14.098202
212	17	TSK001	2026-05-01	\N	\N	In Progress	0	2026-05-21 05:37:38.504079	2026-05-21 05:37:38.504083
213	17	TSK002	2026-05-04	\N	\N	In Progress	0	2026-05-21 05:37:38.505288	2026-05-21 05:37:38.50529
214	17	TSK003	2026-05-05	\N	\N	In Progress	0	2026-05-21 05:37:38.506405	2026-05-21 05:37:38.506407
215	17	TSK004	2026-05-06	\N	\N	In Progress	0	2026-05-21 05:37:38.507537	2026-05-21 05:37:38.507538
216	17	TSK005	2026-05-07	\N	\N	In Progress	0	2026-05-21 05:37:38.509611	2026-05-21 05:37:38.509616
217	17	TSK006	2026-05-08	\N	\N	In Progress	0	2026-05-21 05:37:38.511451	2026-05-21 05:37:38.511454
218	17	TSK007	2026-05-11	\N	\N	In Progress	0	2026-05-21 05:37:38.512961	2026-05-21 05:37:38.512964
219	17	TSK008	2026-05-12	\N	\N	In Progress	0	2026-05-21 05:37:38.514225	2026-05-21 05:37:38.514227
220	17	TSK009	2026-05-13	\N	\N	In Progress	0	2026-05-21 05:37:38.515339	2026-05-21 05:37:38.515342
221	17	TSK010	2026-05-14	\N	\N	In Progress	0	2026-05-21 05:37:38.516562	2026-05-21 05:37:38.516565
222	17	TSK011	2026-05-15	\N	\N	In Progress	0	2026-05-21 05:37:38.517734	2026-05-21 05:37:38.517736
223	17	TSK012	2026-05-18	\N	\N	In Progress	0	2026-05-21 05:37:38.518765	2026-05-21 05:37:38.518767
224	17	TSK013	2026-05-19	\N	\N	In Progress	0	2026-05-21 05:37:38.52006	2026-05-21 05:37:38.520064
225	17	TSK014	2026-05-20	\N	\N	In Progress	0	2026-05-21 05:37:38.521152	2026-05-21 05:37:38.521154
226	17	TSK015	2026-05-21	\N	\N	In Progress	0	2026-05-21 05:37:38.522188	2026-05-21 05:37:38.52219
227	17	TSK016	2026-05-22	\N	\N	In Progress	0	2026-05-21 05:37:38.523169	2026-05-21 05:37:38.523172
228	17	TSK017	2026-05-25	\N	\N	In Progress	0	2026-05-21 05:37:38.525323	2026-05-21 05:37:38.525327
229	17	TSK018	2026-05-26	\N	\N	In Progress	0	2026-05-21 05:37:38.543022	2026-05-21 05:37:38.543027
230	17	TSK019	2026-05-27	\N	\N	In Progress	0	2026-05-21 05:37:38.54499	2026-05-21 05:37:38.544992
231	17	TSK020	2026-05-28	\N	\N	In Progress	0	2026-05-21 05:37:38.546622	2026-05-21 05:37:38.546624
232	17	TSK021	2026-05-29	\N	\N	In Progress	0	2026-05-21 05:37:38.547853	2026-05-21 05:37:38.547856
233	3	TSK001	2026-05-01	\N	\N	In Progress	0	2026-05-21 06:17:12.113977	2026-05-21 06:17:12.113979
234	3	TSK002	2026-05-04	\N	\N	In Progress	0	2026-05-21 06:17:12.140381	2026-05-21 06:17:12.140384
235	3	TSK003	2026-05-05	\N	\N	In Progress	0	2026-05-21 06:17:12.14228	2026-05-21 06:17:12.142282
236	3	TSK004	2026-05-06	\N	\N	In Progress	0	2026-05-21 06:17:12.144868	2026-05-21 06:17:12.144871
237	3	TSK005	2026-05-07	\N	\N	In Progress	0	2026-05-21 06:17:12.146862	2026-05-21 06:17:12.146868
238	3	TSK006	2026-05-08	\N	\N	In Progress	0	2026-05-21 06:17:12.148931	2026-05-21 06:17:12.148934
239	3	TSK007	2026-05-11	\N	\N	In Progress	0	2026-05-21 06:17:12.150546	2026-05-21 06:17:12.150549
240	3	TSK008	2026-05-12	\N	\N	In Progress	0	2026-05-21 06:17:12.151911	2026-05-21 06:17:12.151914
241	3	TSK009	2026-05-13	\N	\N	In Progress	0	2026-05-21 06:17:12.153069	2026-05-21 06:17:12.153072
242	3	TSK010	2026-05-14	\N	\N	In Progress	0	2026-05-21 06:17:12.154371	2026-05-21 06:17:12.15438
243	3	TSK011	2026-05-15	\N	\N	In Progress	0	2026-05-21 06:17:12.155821	2026-05-21 06:17:12.155823
244	3	TSK012	2026-05-18	\N	\N	In Progress	0	2026-05-21 06:17:12.157085	2026-05-21 06:17:12.157087
245	3	TSK013	2026-05-19	\N	\N	In Progress	0	2026-05-21 06:17:12.1584	2026-05-21 06:17:12.158402
246	3	TSK014	2026-05-20	\N	\N	In Progress	0	2026-05-21 06:17:12.159755	2026-05-21 06:17:12.159758
247	3	TSK015	2026-05-21	\N	\N	In Progress	0	2026-05-21 06:17:12.160835	2026-05-21 06:17:12.160837
248	3	TSK016	2026-05-22	\N	\N	In Progress	0	2026-05-21 06:17:12.162849	2026-05-21 06:17:12.162852
249	3	TSK017	2026-05-25	\N	\N	In Progress	0	2026-05-21 06:17:12.164588	2026-05-21 06:17:12.16459
250	3	TSK018	2026-05-26	\N	\N	In Progress	0	2026-05-21 06:17:12.166302	2026-05-21 06:17:12.166306
251	3	TSK019	2026-05-27	\N	\N	In Progress	0	2026-05-21 06:17:12.184416	2026-05-21 06:17:12.18442
252	3	TSK020	2026-05-28	\N	\N	In Progress	0	2026-05-21 06:17:12.186174	2026-05-21 06:17:12.186177
253	3	TSK021	2026-05-29	\N	\N	In Progress	0	2026-05-21 06:17:12.187549	2026-05-21 06:17:12.187552
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, full_name, hashed_password, role, is_active, created_at, updated_at) FROM stdin;
6	murali.g	murali.g@artechsolution.co.in	Murali  Manohar	$2b$12$TJCsxCWBLr7bvRZbOSCR4e.Dwn2.qiSFprvKriv63tit15rrEA3Oy	Employee	t	2026-05-20 17:13:42.702139+05:30	2026-05-20 17:26:13.648346+05:30
11	ramya.a	ramya.a@artechsolution	Ramya	$2b$12$QlXPVFM47pnGMAd7f60RnOGO6Ie1hHTg/dZfCsUCnWBRXGAzN.6RS	Employee	t	2026-05-20 17:48:44.157216+05:30	2026-05-20 17:48:44.157216+05:30
19	sowmya.v	sowmya.v@artechsolution.co.in	Sowmya  Vadlapatla	$2b$12$.Cw3U3.dOVyExdV7v7wO4.D1xtmCgrSFA0Xzd7lfL8YezYrKXttWi	Employee	t	2026-05-21 09:54:00.59444+05:30	2026-05-21 09:54:00.59444+05:30
20	kirti.k	Kirti.K@artechsolution.co.in	Kirti Kumar  Kanukala	$2b$12$2Yu/hNLWQg6vs1NBJjyy2ekhQIPUKr5qMJZatt2TR5p1m27PyTGOS	Employee	t	2026-05-21 10:20:44.338618+05:30	2026-05-21 10:20:44.338618+05:30
21	sunilkumar	sunilkumar@artechsolution.co.in	Sunil Kumar  Akula	$2b$12$Ms.gqWf.7wAwOFBTbQ8K6.KzvJNs3We4XdzTMpTOi.znvppfhKaR2	Employee	t	2026-05-21 10:29:33.220338+05:30	2026-05-21 10:29:33.220338+05:30
22	vasista.n	Vasista.n@artechsolution.co.in	Vasista Nuvvula	$2b$12$cD0.f5zELkZHxyAtBoneiO3ebmflPmvSx2GA3MvDGMC7WenK.s7GK	Employee	t	2026-05-21 10:34:50.723617+05:30	2026-05-21 10:34:50.723617+05:30
23	rashmi.b	rashmi.b@artechsolutions.co.in	Rashmi   Badakala	$2b$12$MRE4QEgF7pVIn8WMFmaZnuQ6X7Iq0/rzWCqgivrO6eRpm1a.iBT9.	Employee	t	2026-05-21 10:40:36.643356+05:30	2026-05-21 10:40:36.643356+05:30
5	santhosh.k	santhosh.k@artechsolution.co.in	Venkata Santosh K	$2b$12$gf/sQYBJVsZAUTjw82xNUel4pTOBByDGB2W4uaADMb4NeqSLkHQ1G	Employee	t	2026-05-20 17:11:02.372524+05:30	2026-05-21 10:45:27.588427+05:30
7	saifa	Saifa@artechsolution.co.in	Saifa Banu Shaik	$2b$12$B0F/SVRrym2DY/rOxcuKe.iT.z8Q9g6o8/AXqpFDMadqbatL7wO0q	Employee	t	2026-05-20 17:24:33.233889+05:30	2026-05-21 10:45:41.927105+05:30
8	pavankumar.k	pavankumar.k@artechsolution.co.in	pavan kumar k	$2b$12$d14zPczTZyX4dBAhbjvLuukmLbvf.yGDArwrloKcJ8ZUD4bm56KfW	Employee	t	2026-05-20 17:27:08.815658+05:30	2026-05-21 10:45:56.18587+05:30
9	arun.n	arun.n@artechsolution.co.in	Arun Nalla	$2b$12$o9Ii5hYYUprvq.L7d3wACOxyW6uJClOMTnWV8kT6soG/FbrtgJY/G	Employee	t	2026-05-20 17:38:47.730512+05:30	2026-05-21 10:46:31.392363+05:30
10	surya.k	surya.k@artechsolution.co.in	Surya  K	$2b$12$hp7qEeOiRq44mhIyOYb.auBrTsfI.SB/cA7M.wJu9MB8QE5WkT6Ue	Employee	t	2026-05-20 17:40:57.439933+05:30	2026-05-21 10:46:45.795907+05:30
24	narendra.p	narendra.p@artechsolution.co.in	Narendra   Pampana	$2b$12$G8clAZcBuUr9NzyVXqzcY.tx/QwYD6MijW3go8c.KgjuytgvvqZ5W	Employee	t	2026-05-21 10:46:48.078083+05:30	2026-05-21 10:46:48.078083+05:30
12	ramya.	ramya.a@artechsolution.co.in	Ramya   A	$2b$12$Bu471Q/9/3BoZl076U4FPeAENY6/3gPYtVshLNZKlGKsmzS1ZUg.e	Employee	t	2026-05-20 17:49:52.798669+05:30	2026-05-21 10:47:01.691643+05:30
13	revanth.t	revanth.t@artechsolution.co.in	Revanth Tulabandulla	$2b$12$5cpPO/pdH3LJYMI3RNqzTO6JgPp6.qfbaKm9IC8rV8W3U71oZguzC	Employee	t	2026-05-20 17:51:25.590163+05:30	2026-05-21 10:47:16.078733+05:30
14	manasa.g	manasa.g@artechsolution.co.in	Manasa  Ganapuram	$2b$12$8lJ2kcG79bBMNsEDkHhso.0JYXkE1fjsLesxCKgSCkRUF7rCgmhGe	Employee	t	2026-05-20 18:01:31.567492+05:30	2026-05-21 10:47:29.93738+05:30
15	umadevi.ch	umadevi.ch@artechsolution.co.in	Uma Devi Ch	$2b$12$d6I9BfIIabT9e2z9kM.4lONo75mFW7cW0ZsfoEpF/elDDa1jtMQgK	Employee	t	2026-05-20 18:02:30.735906+05:30	2026-05-21 10:47:47.087717+05:30
16	syam.p	syam.p@artechsolution.co.in	Syam Sashank Pathuri	$2b$12$XcfLdgX21.jEv303WdotKOCEHOID6lwFTXaaXg.MaoWw/rHWUzcOO	Employee	t	2026-05-20 18:10:44.140547+05:30	2026-05-21 10:48:01.827202+05:30
18	yasaswini.s	yasaswini.s@artechsolution.co.in	Yasaswini   S	$2b$12$Ms4XNvsEe/nRophCOcFoJ.JD/oa/zuWGaEXyl2Gvvmbp.XHICr3Yi	Employee	t	2026-05-20 18:26:05.70266+05:30	2026-05-21 10:48:16.737229+05:30
17	saira.sk	saira.sk@artechsolution.co.in	Saira   SK	$2b$12$XOdqJxorx62ehVT7jUECNu5iCxsTXFCnr.nwe2S8CBA5lwnp1cpRO	Employee	t	2026-05-20 18:11:08.185363+05:30	2026-05-21 10:48:51.007936+05:30
4	tejaswi.p	tejaswi.p@artechsolution.co.in	Tejaswi P	$2b$12$8Uvr.FD5PEPO8arPLgkhvO1KCW9GfzfjhGxp1y9heesZ8uzLPyKNK	HR	t	2026-05-20 16:13:04.925505+05:30	2026-05-20 16:14:53.554126+05:30
25	radhika.y	radhika.y@artechsolution.co.in	Radhika Y	$2b$12$v49L78Pl.AmCCCnIA1AbD.5kl7Ul8hDHVSml9Ss/j7Rlpy6NtLPpi	CEO	t	2026-05-21 14:38:22.474026+05:30	2026-05-21 14:38:22.474026+05:30
1	admin	admin@artechsolution.co.in	Administrator	$2b$12$yNBsb03EYasUz9qB6Mcq4.rwpxjtaql2kZiN48BP33QEpAbWAJ6q.	SuperAdmin	t	2026-05-18 12:34:02.914741+05:30	2026-05-22 18:58:23.298893+05:30
3	sindhu.u	sindhu.u@artechsolution.co.in	Sindhu U	$2b$12$.wh83Yw.yLU.JRJTpnSezeTA.OcDQA3DtBmWmq701h0nHNHKYHVIm	HR	t	2026-05-18 15:29:49.131202+05:30	2026-05-22 18:59:04.493912+05:30
\.


--
-- Data for Name: work_mode_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_mode_entries (id, employee_id, entry_date, work_mode, reason, duration, status, hr_remarks, created_at, updated_at, leave_id) FROM stdin;
1	2	2026-05-20	PLANNED LEAVE	test	FULL-DAY	Approved	\N	2026-05-20 10:11:17.474336	2026-05-20 12:51:36.235269	\N
14	9	2026-05-22	SICK LEAVE	fever	FULL-DAY	Approved	\N	2026-05-21 05:31:35.560848	2026-05-21 05:32:19.546578	7
15	9	2026-05-23	SICK LEAVE	fever	FULL-DAY	Approved	\N	2026-05-21 05:31:35.560852	2026-05-21 05:32:19.546578	7
16	8	2026-05-25	SICK LEAVE	Family Trip	FULL-DAY	Approved	\N	2026-05-21 05:32:15.218081	2026-05-21 05:32:25.047579	8
17	8	2026-05-26	SICK LEAVE	Family Trip	FULL-DAY	Approved	\N	2026-05-21 05:32:15.218086	2026-05-21 05:32:25.047579	8
18	8	2026-05-27	SICK LEAVE	Family Trip	FULL-DAY	Approved	\N	2026-05-21 05:32:15.218088	2026-05-21 05:32:25.047579	8
19	8	2026-05-28	SICK LEAVE	Family Trip	FULL-DAY	Approved	\N	2026-05-21 05:32:15.218089	2026-05-21 05:32:25.047579	8
22	8	2026-05-25	SICK LEAVE	Sick Leave	FULL-DAY	Approved	\N	2026-05-21 05:32:31.407965	2026-05-21 05:33:29.396915	10
20	11	2026-05-21	SICK LEAVE	Health checkup	FULL-DAY	Approved	\N	2026-05-21 05:32:31.152309	2026-05-21 05:34:08.718988	9
21	11	2026-05-22	SICK LEAVE	Health checkup	FULL-DAY	Approved	\N	2026-05-21 05:32:31.152314	2026-05-21 05:34:08.718988	9
29	6	2026-05-26	SICK LEAVE	sick	FULL-DAY	Approved	\N	2026-05-21 05:33:46.318686	2026-05-21 05:34:12.617162	13
35	6	2026-05-21	WFH	Testing 2	FULL-DAY	Approved	\N	2026-05-21 05:35:13.155673	2026-05-21 05:38:04.897342	\N
33	7	2026-05-21	OTHER	marriage 	FULL-DAY	Approved	\N	2026-05-21 05:34:28.514851	2026-05-21 05:38:23.895661	\N
34	7	2026-05-21	PLANNED LEAVE	medical leave 	HALF-DAY (Morning)	Approved	\N	2026-05-21 05:34:42.796441	2026-05-21 05:39:21.458043	\N
36	7	2026-05-21	CASUAL LEAVE	hsdhsbd	HALF-DAY (Afternoon)	Rejected	No Casual Leave	2026-05-21 05:37:15.126058	2026-05-21 05:39:53.954085	\N
40	4	2026-05-22	SICK LEAVE	Health Issue	FULL-DAY	Approved	\N	2026-05-21 05:45:59.722424	2026-05-21 05:48:15.261555	17
41	3	2026-05-21	CASUAL LEAVE	Family trip	FULL-DAY	Approved	\N	2026-05-21 05:53:03.562851	2026-05-21 05:55:13.569209	\N
37	11	2026-05-23	SICK LEAVE	Sick Leave	FULL-DAY	Approved	Due to work load	2026-05-21 05:38:04.21336	2026-05-21 05:44:44.163573	15
43	9	2026-05-26	SICK LEAVE	health isssue	FULL-DAY	Approved	\N	2026-05-21 05:58:55.121487	2026-05-21 05:59:13.367728	19
59	11	2026-05-21	PLANNED LEAVE	Personal work	HALF-DAY (Morning)	Pending	\N	2026-05-21 06:15:07.482147	2026-05-21 06:15:07.48215	\N
57	7	2026-05-24	CASUAL LEAVE	approve this leave test message 	FULL-DAY	Approved	\N	2026-05-21 06:14:34.613717	2026-05-21 07:33:53.893859	21
58	7	2026-05-25	CASUAL LEAVE	approve this leave test message 	FULL-DAY	Approved	\N	2026-05-21 06:14:34.613723	2026-05-21 07:33:53.893859	21
64	5	2026-06-01	CASUAL LEAVE	Casual Leave	FULL-DAY	Approved	\N	2026-05-21 07:53:58.882529	2026-05-21 07:55:31.260481	23
65	11	2026-05-27	PLANNED LEAVE	Marriage	FULL-DAY	Approved	\N	2026-05-21 12:46:49.658006	2026-05-21 12:47:53.568069	24
\.


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, true);


--
-- Name: appraisals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.appraisals_id_seq', 1, false);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendance_id_seq', 2, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departments_id_seq', 18, true);


--
-- Name: designations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.designations_id_seq', 20, true);


--
-- Name: document_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.document_requests_id_seq', 28, true);


--
-- Name: edit_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.edit_requests_id_seq', 1, false);


--
-- Name: emergency_contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.emergency_contacts_id_seq', 15, true);


--
-- Name: employee_assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_assets_id_seq', 2, true);


--
-- Name: employee_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_documents_id_seq', 1, false);


--
-- Name: employee_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_history_id_seq', 1, false);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employees_id_seq', 23, true);


--
-- Name: expense_claims_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expense_claims_id_seq', 1, true);


--
-- Name: holidays_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.holidays_id_seq', 20, true);


--
-- Name: job_applicants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.job_applicants_id_seq', 1, false);


--
-- Name: job_openings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.job_openings_id_seq', 1, false);


--
-- Name: leave_accrual_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leave_accrual_log_id_seq', 2, true);


--
-- Name: leave_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leave_applications_id_seq', 24, true);


--
-- Name: leave_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leave_balances_id_seq', 39, true);


--
-- Name: leave_policies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leave_policies_id_seq', 1, false);


--
-- Name: leave_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leave_types_id_seq', 5, true);


--
-- Name: notice_period_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notice_period_config_id_seq', 1, false);


--
-- Name: payroll_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payroll_entries_id_seq', 3, true);


--
-- Name: payroll_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payroll_rules_id_seq', 1, false);


--
-- Name: profile_update_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profile_update_logs_id_seq', 1, false);


--
-- Name: resignations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.resignations_id_seq', 1, false);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 6, true);


--
-- Name: salary_components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salary_components_id_seq', 1, false);


--
-- Name: salary_slips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salary_slips_id_seq', 2, true);


--
-- Name: salary_structures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salary_structures_id_seq', 1, false);


--
-- Name: social_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.social_accounts_id_seq', 1, false);


--
-- Name: social_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.social_posts_id_seq', 1, false);


--
-- Name: status_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.status_entries_id_seq', 253, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 25, true);


--
-- Name: work_mode_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_mode_entries_id_seq', 65, true);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: appraisals appraisals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisals
    ADD CONSTRAINT appraisals_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: designations designations_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_name_key UNIQUE (name);


--
-- Name: designations designations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_pkey PRIMARY KEY (id);


--
-- Name: document_requests document_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_requests
    ADD CONSTRAINT document_requests_pkey PRIMARY KEY (id);


--
-- Name: edit_requests edit_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edit_requests
    ADD CONSTRAINT edit_requests_pkey PRIMARY KEY (id);


--
-- Name: emergency_contacts emergency_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_contacts
    ADD CONSTRAINT emergency_contacts_pkey PRIMARY KEY (id);


--
-- Name: employee_assets employee_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_assets
    ADD CONSTRAINT employee_assets_pkey PRIMARY KEY (id);


--
-- Name: employee_documents employee_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_pkey PRIMARY KEY (id);


--
-- Name: employee_history employee_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_history
    ADD CONSTRAINT employee_history_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: expense_claims expense_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_pkey PRIMARY KEY (id);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- Name: job_applicants job_applicants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applicants
    ADD CONSTRAINT job_applicants_pkey PRIMARY KEY (id);


--
-- Name: job_openings job_openings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_openings
    ADD CONSTRAINT job_openings_pkey PRIMARY KEY (id);


--
-- Name: leave_accrual_log leave_accrual_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_accrual_log
    ADD CONSTRAINT leave_accrual_log_pkey PRIMARY KEY (id);


--
-- Name: leave_accrual_log leave_accrual_log_year_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_accrual_log
    ADD CONSTRAINT leave_accrual_log_year_month_key UNIQUE (year_month);


--
-- Name: leave_applications leave_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_applications
    ADD CONSTRAINT leave_applications_pkey PRIMARY KEY (id);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);


--
-- Name: leave_policies leave_policies_leave_type_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_policies
    ADD CONSTRAINT leave_policies_leave_type_id_key UNIQUE (leave_type_id);


--
-- Name: leave_policies leave_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_policies
    ADD CONSTRAINT leave_policies_pkey PRIMARY KEY (id);


--
-- Name: leave_types leave_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_name_key UNIQUE (name);


--
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (id);


--
-- Name: letterhead_template letterhead_template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.letterhead_template
    ADD CONSTRAINT letterhead_template_pkey PRIMARY KEY (id);


--
-- Name: notice_period_config notice_period_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notice_period_config
    ADD CONSTRAINT notice_period_config_pkey PRIMARY KEY (id);


--
-- Name: payroll_entries payroll_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_pkey PRIMARY KEY (id);


--
-- Name: payroll_rules payroll_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_rules
    ADD CONSTRAINT payroll_rules_pkey PRIMARY KEY (id);


--
-- Name: profile_update_logs profile_update_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_update_logs
    ADD CONSTRAINT profile_update_logs_pkey PRIMARY KEY (id);


--
-- Name: resignations resignations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resignations
    ADD CONSTRAINT resignations_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_key UNIQUE (role);


--
-- Name: salary_components salary_components_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_components
    ADD CONSTRAINT salary_components_name_key UNIQUE (name);


--
-- Name: salary_components salary_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_components
    ADD CONSTRAINT salary_components_pkey PRIMARY KEY (id);


--
-- Name: salary_slips salary_slips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_slips
    ADD CONSTRAINT salary_slips_pkey PRIMARY KEY (id);


--
-- Name: salary_slips salary_slips_slip_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_slips
    ADD CONSTRAINT salary_slips_slip_id_key UNIQUE (slip_id);


--
-- Name: salary_structures salary_structures_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_structures
    ADD CONSTRAINT salary_structures_name_key UNIQUE (name);


--
-- Name: salary_structures salary_structures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_structures
    ADD CONSTRAINT salary_structures_pkey PRIMARY KEY (id);


--
-- Name: social_accounts social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_pkey PRIMARY KEY (id);


--
-- Name: social_posts social_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts
    ADD CONSTRAINT social_posts_pkey PRIMARY KEY (id);


--
-- Name: status_entries status_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_entries
    ADD CONSTRAINT status_entries_pkey PRIMARY KEY (id);


--
-- Name: leave_balances uq_leave_balance; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT uq_leave_balance UNIQUE (employee_id, leave_type_id, year);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: work_mode_entries work_mode_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_mode_entries
    ADD CONSTRAINT work_mode_entries_pkey PRIMARY KEY (id);


--
-- Name: ix_announcements_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_announcements_id ON public.announcements USING btree (id);


--
-- Name: ix_appraisals_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_appraisals_employee_id ON public.appraisals USING btree (employee_id);


--
-- Name: ix_appraisals_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_appraisals_id ON public.appraisals USING btree (id);


--
-- Name: ix_attendance_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_attendance_date ON public.attendance USING btree (date);


--
-- Name: ix_attendance_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_attendance_employee_id ON public.attendance USING btree (employee_id);


--
-- Name: ix_attendance_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_attendance_id ON public.attendance USING btree (id);


--
-- Name: ix_departments_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_departments_id ON public.departments USING btree (id);


--
-- Name: ix_designations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_designations_id ON public.designations USING btree (id);


--
-- Name: ix_document_requests_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_document_requests_employee_id ON public.document_requests USING btree (employee_id);


--
-- Name: ix_document_requests_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_document_requests_id ON public.document_requests USING btree (id);


--
-- Name: ix_edit_requests_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_edit_requests_id ON public.edit_requests USING btree (id);


--
-- Name: ix_emergency_contacts_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_emergency_contacts_id ON public.emergency_contacts USING btree (id);


--
-- Name: ix_employee_assets_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_employee_assets_id ON public.employee_assets USING btree (id);


--
-- Name: ix_employee_documents_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_employee_documents_id ON public.employee_documents USING btree (id);


--
-- Name: ix_employee_history_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_employee_history_id ON public.employee_history USING btree (id);


--
-- Name: ix_employees_department_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_employees_department_id ON public.employees USING btree (department_id);


--
-- Name: ix_employees_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_employees_employee_id ON public.employees USING btree (employee_id);


--
-- Name: ix_employees_full_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_employees_full_name ON public.employees USING btree (full_name);


--
-- Name: ix_employees_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_employees_id ON public.employees USING btree (id);


--
-- Name: ix_employees_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_employees_status ON public.employees USING btree (status);


--
-- Name: ix_expense_claims_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_expense_claims_employee_id ON public.expense_claims USING btree (employee_id);


--
-- Name: ix_expense_claims_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_expense_claims_id ON public.expense_claims USING btree (id);


--
-- Name: ix_holidays_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_holidays_id ON public.holidays USING btree (id);


--
-- Name: ix_job_applicants_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_job_applicants_id ON public.job_applicants USING btree (id);


--
-- Name: ix_job_openings_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_job_openings_id ON public.job_openings USING btree (id);


--
-- Name: ix_leave_applications_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_leave_applications_employee_id ON public.leave_applications USING btree (employee_id);


--
-- Name: ix_leave_applications_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_leave_applications_id ON public.leave_applications USING btree (id);


--
-- Name: ix_leave_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_leave_applications_status ON public.leave_applications USING btree (status);


--
-- Name: ix_leave_balances_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_leave_balances_id ON public.leave_balances USING btree (id);


--
-- Name: ix_leave_types_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_leave_types_id ON public.leave_types USING btree (id);


--
-- Name: ix_payroll_entries_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payroll_entries_id ON public.payroll_entries USING btree (id);


--
-- Name: ix_profile_update_logs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_profile_update_logs_id ON public.profile_update_logs USING btree (id);


--
-- Name: ix_resignations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_resignations_id ON public.resignations USING btree (id);


--
-- Name: ix_role_permissions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_role_permissions_id ON public.role_permissions USING btree (id);


--
-- Name: ix_salary_components_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_salary_components_id ON public.salary_components USING btree (id);


--
-- Name: ix_salary_slips_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_salary_slips_employee_id ON public.salary_slips USING btree (employee_id);


--
-- Name: ix_salary_slips_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_salary_slips_id ON public.salary_slips USING btree (id);


--
-- Name: ix_salary_structures_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_salary_structures_id ON public.salary_structures USING btree (id);


--
-- Name: ix_social_accounts_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_social_accounts_id ON public.social_accounts USING btree (id);


--
-- Name: ix_social_posts_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_social_posts_id ON public.social_posts USING btree (id);


--
-- Name: ix_status_entries_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_status_entries_employee_id ON public.status_entries USING btree (employee_id);


--
-- Name: ix_status_entries_entry_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_status_entries_entry_date ON public.status_entries USING btree (entry_date);


--
-- Name: ix_status_entries_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_status_entries_id ON public.status_entries USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: ix_work_mode_entries_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_work_mode_entries_employee_id ON public.work_mode_entries USING btree (employee_id);


--
-- Name: ix_work_mode_entries_entry_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_work_mode_entries_entry_date ON public.work_mode_entries USING btree (entry_date);


--
-- Name: ix_work_mode_entries_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_work_mode_entries_id ON public.work_mode_entries USING btree (id);


--
-- Name: appraisals appraisals_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisals
    ADD CONSTRAINT appraisals_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: attendance attendance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: departments departments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departments(id);


--
-- Name: document_requests document_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_requests
    ADD CONSTRAINT document_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: edit_requests edit_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edit_requests
    ADD CONSTRAINT edit_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: edit_requests edit_requests_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edit_requests
    ADD CONSTRAINT edit_requests_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: emergency_contacts emergency_contacts_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_contacts
    ADD CONSTRAINT emergency_contacts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_assets employee_assets_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_assets
    ADD CONSTRAINT employee_assets_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_documents employee_documents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_history employee_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_history
    ADD CONSTRAINT employee_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: employees employees_designation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_designation_id_fkey FOREIGN KEY (designation_id) REFERENCES public.designations(id);


--
-- Name: employees employees_reports_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_reports_to_id_fkey FOREIGN KEY (reports_to_id) REFERENCES public.employees(id);


--
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expense_claims expense_claims_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: expense_claims expense_claims_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: job_applicants job_applicants_job_opening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applicants
    ADD CONSTRAINT job_applicants_job_opening_id_fkey FOREIGN KEY (job_opening_id) REFERENCES public.job_openings(id);


--
-- Name: job_openings job_openings_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_openings
    ADD CONSTRAINT job_openings_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: job_openings job_openings_designation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_openings
    ADD CONSTRAINT job_openings_designation_id_fkey FOREIGN KEY (designation_id) REFERENCES public.designations(id);


--
-- Name: leave_applications leave_applications_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_applications
    ADD CONSTRAINT leave_applications_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: leave_applications leave_applications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_applications
    ADD CONSTRAINT leave_applications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: leave_applications leave_applications_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_applications
    ADD CONSTRAINT leave_applications_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- Name: leave_balances leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: leave_balances leave_balances_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- Name: leave_policies leave_policies_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_policies
    ADD CONSTRAINT leave_policies_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id) ON DELETE CASCADE;


--
-- Name: profile_update_logs profile_update_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_update_logs
    ADD CONSTRAINT profile_update_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: resignations resignations_actioned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resignations
    ADD CONSTRAINT resignations_actioned_by_fkey FOREIGN KEY (actioned_by) REFERENCES public.users(id);


--
-- Name: resignations resignations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resignations
    ADD CONSTRAINT resignations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: salary_slips salary_slips_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_slips
    ADD CONSTRAINT salary_slips_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: salary_slips salary_slips_payroll_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_slips
    ADD CONSTRAINT salary_slips_payroll_entry_id_fkey FOREIGN KEY (payroll_entry_id) REFERENCES public.payroll_entries(id);


--
-- Name: social_posts social_posts_job_opening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts
    ADD CONSTRAINT social_posts_job_opening_id_fkey FOREIGN KEY (job_opening_id) REFERENCES public.job_openings(id);


--
-- Name: social_posts social_posts_social_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts
    ADD CONSTRAINT social_posts_social_account_id_fkey FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id);


--
-- Name: status_entries status_entries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_entries
    ADD CONSTRAINT status_entries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: work_mode_entries work_mode_entries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_mode_entries
    ADD CONSTRAINT work_mode_entries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: work_mode_entries work_mode_entries_leave_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_mode_entries
    ADD CONSTRAINT work_mode_entries_leave_id_fkey FOREIGN KEY (leave_id) REFERENCES public.leave_applications(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 8lCQyAy8XjQZ7oEUHFAdEGE8ChsWf2j0qrcs4fvYADo4OMmuhHJe4C3W0t1Ye53

