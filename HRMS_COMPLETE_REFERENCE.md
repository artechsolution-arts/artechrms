# ArTech HRMS — Complete Application Reference

> **Stack:** FastAPI + SQLAlchemy + PostgreSQL (backend) · React + TailwindCSS (frontend) · MinIO (files)  
> **Roles:** SuperAdmin · HR · CEO · Employee

---

## Table of Contents

1. [Authentication & Users](#1-authentication--users)
2. [Employee Management](#2-employee-management)
3. [Leave Management](#3-leave-management)
4. [Attendance](#4-attendance)
5. [Payroll](#5-payroll)
6. [Appraisals](#6-appraisals)
7. [Recruitment](#7-recruitment)
8. [Onboarding & Offboarding](#8-onboarding--offboarding)
9. [Resignations](#9-resignations)
10. [Expense Claims](#10-expense-claims)
11. [Asset Management](#11-asset-management)
12. [Document Management](#12-document-management)
13. [Status Sheet & Work Mode](#13-status-sheet--work-mode)
14. [Announcements & Holidays](#14-announcements--holidays)
15. [Biometric Integration](#15-biometric-integration)
16. [Social Media Posting](#16-social-media-posting)
17. [Permissions & Admin](#17-permissions--admin)
18. [Reports & AI](#18-reports--ai)
19. [Employee Self-Service Portal](#19-employee-self-service-portal)
20. [API Endpoint Index](#20-api-endpoint-index)

---

## 1. Authentication & Users

### Table: `users`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| username | String(100) unique | Login username |
| email | String(200) unique | Also accepted at login |
| full_name | String(200) | |
| hashed_password | String(255) | bcrypt |
| role | String(50) | SuperAdmin · HR · CEO · Employee |
| is_active | Boolean | Deactivated users cannot login |
| created_at | DateTime | |
| updated_at | DateTime | |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| Login (username or email) | All | `POST /api/auth/login` |
| First-time setup (create SuperAdmin) | Anyone (only when 0 users) | `POST /api/auth/setup` |
| Verify token | All | `POST /api/auth/verify` |
| Change own password | All | `POST /api/auth/change-password` |
| Create user | SuperAdmin | `POST /api/auth/create-user` |
| List users | SuperAdmin | `GET /api/auth/users` |
| Check setup needed | Anyone | `GET /api/auth/needs-setup` |

**Rate limit:** Login is limited to **10 attempts per minute per IP** (brute-force protection).

---

## 2. Employee Management

### Table: `departments`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(200) unique | |
| parent_id | Integer FK → departments | For nested structure |
| created_at | DateTime | |

### Table: `designations`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(200) unique | Job title |
| description | String(500) | |
| created_at | DateTime | |

### Table: `employees`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | String(50) unique | Employee code e.g. EMP001 |
| first_name | String(100) | |
| last_name | String(100) | |
| full_name | String(200) | |
| email | String(200) unique | Work email |
| mobile | String(20) | |
| gender | String(10) | Male · Female · Other |
| date_of_birth | Date | |
| date_of_joining | Date | |
| status | String(20) | Active · Inactive · Left |
| department_id | FK → departments | |
| designation_id | FK → designations | |
| reports_to_id | FK → employees | Reporting manager |
| employment_type | String(50) | Full-time · Part-time · Contract · Intern |
| notice_period_days | Integer | |
| probation_period_days | Integer | |
| office_address | String(500) | |
| residential_address | String(500) | |
| bank_name | String(100) | |
| bank_account_no | String(50) | |
| bank_ifsc | String(20) | |
| bank_branch | String(100) | |
| aadhar_no | String(20) | |
| pan_no | String(20) | |
| biometric_id | String(30) | eSSL/ZK device enrollment ID |
| user_id | FK → users | Linked login account |
| profile_photo | String(500) | MinIO URL |
| basic_salary | Float | |
| hra_percent | Float | Default 40.0% |
| special_allowance | Float | |
| ca_allowance | Float | Conveyance allowance |
| lta | Float | Leave travel allowance |
| other_allowance | Float | |
| pf_applicable | Integer | 0 = No, 1 = Yes |
| esi_applicable | Integer | 0 = No, 1 = Yes |
| pt_state | String(50) | Professional tax state |
| education | JSON | [{degree, institution, start_year, end_year, grade}] |
| experience | JSON | [{company, role, from_year, to_year, description}] |
| created_at | DateTime | |
| updated_at | DateTime | |

### Table: `profile_update_logs`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| changes | JSON | {field: new_value} |
| changed_at | DateTime | |
| seen_by_hr | Boolean | HR acknowledgement flag |

### Table: `employee_history`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| change_type | String(100) | Joining · Transfer · Promotion · Demotion · Department Change · Role Change · Status Change |
| from_department | String(200) | |
| to_department | String(200) | |
| from_designation | String(200) | |
| to_designation | String(200) | |
| effective_date | Date | |
| salary_before | Float | |
| salary_after | Float | |
| last_working_date | Date | On status change to Left |
| remarks | Text | |
| created_by | String(200) | |
| created_at | DateTime | |

### Table: `emergency_contacts`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| name | String(200) | |
| relationship_type | String(100) | Spouse · Parent · Sibling etc. |
| phone | String(30) | |
| email | String(200) | |
| is_primary | Boolean | |
| created_at | DateTime | |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List employees (search, filter, paginate) | HR, CEO, SuperAdmin | `GET /api/employees` |
| Get employee detail | HR, CEO | `GET /api/employees/{id}` |
| Create employee | HR | `POST /api/employees` |
| Update employee | HR | `PUT /api/employees/{id}` |
| Delete employee | HR | `DELETE /api/employees/{id}` |
| Upload profile photo | HR | `POST /api/employees/{id}/photo` |
| List departments | All | `GET /api/employees/departments` |
| Create department | HR | `POST /api/employees/departments` |
| Update department | HR | `PUT /api/employees/departments/{id}` |
| Delete department | HR | `DELETE /api/employees/departments/{id}` |
| List designations | All | `GET /api/employees/designations` |
| Create designation | HR | `POST /api/employees/designations` |
| Update designation | HR | `PUT /api/employees/designations/{id}` |
| Delete designation | HR | `DELETE /api/employees/designations/{id}` |
| Get emergency contacts | HR | `GET /api/hrm/employees/{id}/emergency-contacts` |
| Add emergency contact | HR | `POST /api/hrm/employees/{id}/emergency-contacts` |
| Update emergency contact | HR | `PUT /api/hrm/emergency-contacts/{id}` |
| Delete emergency contact | HR | `DELETE /api/hrm/emergency-contacts/{id}` |
| Get employee history | HR | `GET /api/hrm/employees/{id}/history` |
| Add history record | HR | `POST /api/hrm/employees/{id}/history` |
| Update history record | HR | `PUT /api/hrm/employees/{id}/history/{record_id}` |
| Delete history record | HR | `DELETE /api/hrm/employees/{id}/history/{record_id}` |
| Get profile update notifications | HR | `GET /api/notifications` |
| Mark profile update seen | HR | `POST /api/notifications/profile-update/{log_id}/seen` |

**Query parameters for employee list:** `search`, `department_id`, `status`, `joined_month`, `page`, `page_size`, `all`

---

## 3. Leave Management

### Table: `leave_types`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(100) unique | e.g. Casual Leave, Sick Leave |
| max_leaves | Float | Max days per year |
| is_carry_forward | Boolean | |
| is_paid | Boolean | |
| created_at | DateTime | |

### Table: `leave_policies`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| leave_type_id | FK → leave_types unique | One policy per type |
| prorate_on_joining | Boolean | Pro-rata accrual on joining |
| prorate_cutoff_day | Integer | Day of month (default 15) |
| leaves_before_cutoff | Float | Days if joined before cutoff (default 2.0) |
| leaves_after_cutoff | Float | Days if joined after cutoff (default 1.0) |
| carry_forward_max | Float | 0 = unlimited |
| encashment_allowed | Boolean | |
| min_service_days | Integer | Minimum days before employee can apply |
| created_at | DateTime | |

### Table: `leave_applications`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| leave_type_id | FK → leave_types | |
| from_date | Date | |
| to_date | Date | |
| total_days | Float | |
| half_day | Boolean | |
| leave_category | String(20) | Planned · Unplanned |
| reason | Text | |
| status | String(30) | Pending · Approved · Rejected · Cancellation Requested · Cancelled · Edit Requested |
| cancellation_reason | Text | |
| pending_from_date | Date | Proposed new date (edit request) |
| pending_to_date | Date | |
| pending_total_days | Float | |
| edit_reason | Text | |
| approved_by | FK → users | |
| created_at | DateTime | |
| updated_at | DateTime | |

### Table: `leave_balances`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| leave_type_id | FK → leave_types | |
| year | Integer | |
| allocated | Float | Total days allocated |
| used | Float | Days consumed |
| carried_forward | Float | From previous year |
| — | — | Unique: employee + leave_type + year |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List leave types | All | `GET /api/leaves/types` |
| Create leave type | HR | `POST /api/leaves/types` |
| Update leave type | HR | `PUT /api/leaves/types/{id}` |
| Delete leave type | HR | `DELETE /api/leaves/types/{id}` |
| Get leave policy | HR | `GET /api/leaves/types/{id}/policy` |
| Update leave policy | HR | `PUT /api/leaves/types/{id}/policy` |
| List all leave applications | HR, CEO | `GET /api/leaves` |
| Apply for leave (HR on behalf) | HR | `POST /api/leaves` |
| Approve leave | HR, CEO | `PUT /api/leaves/{id}/approve` |
| Reject leave | HR, CEO | `PUT /api/leaves/{id}/reject` |
| Approve cancellation | HR | `PUT /api/leaves/{id}/approve-cancel` |
| Reject cancellation | HR | `PUT /api/leaves/{id}/reject-cancel` |
| Approve date-change request | HR | `PUT /api/leaves/{id}/approve-edit` |
| Reject date-change request | HR | `PUT /api/leaves/{id}/reject-edit` |
| Delete leave | HR | `DELETE /api/leaves/{id}` |
| List leave balances | HR | `GET /api/hrm/leave-balances` |
| Allocate leave (one employee) | HR | `POST /api/hrm/leave-balances/allocate` |
| Allocate leave (all employees) | HR | `POST /api/hrm/leave-balances/allocate-all` |
| Get employee's balances | HR | `GET /api/hrm/leave-balances/employee/{id}` |

**Email notifications:** Employee receives an email when leave is Approved or Rejected (if SMTP is configured).

**Leave workflow:**
```
Employee applies → Pending → HR Approves/Rejects
                           → Employee requests cancel → HR approves/rejects cancel
                           → Employee requests date change → HR approves/rejects edit
```

---

## 4. Attendance

### Table: `attendance`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| date | Date | |
| status | String(20) | Present · Absent · On Leave · Half Day · WFH |
| in_time | String(10) | HH:MM format |
| out_time | String(10) | |
| working_hours | Float | |
| late_entry | Boolean | |
| early_exit | Boolean | |
| created_at | DateTime | |
| — | — | Unique: employee_id + date |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List attendance (filter by employee, month, year) | HR, CEO | `GET /api/leaves/attendance` |
| Create/import attendance record | HR | `POST /api/leaves/attendance` |
| Update attendance record | HR | `PUT /api/leaves/attendance/{id}` |
| View own attendance | Employee | `GET /api/portal/attendance` |
| Generate attendance report | HR | `POST /api/reports/attendance` |

---

## 5. Payroll

### Table: `payroll_rules` (singleton — id = 1)

| Field | Type | Notes |
|---|---|---|
| pf_enabled | Boolean | |
| esi_enabled | Boolean | |
| hra_enabled | Boolean | |
| pf_employee_rate | Float | Default 12.0% |
| pf_employee_cap | Float | Default ₹1800 |
| pf_employer_rate | Float | Default 12.0% |
| pf_employer_cap | Float | Default ₹1800 |
| esi_employee_rate | Float | Default 0.75% |
| esi_employer_rate | Float | Default 3.25% |
| esi_wage_ceiling | Float | Default ₹21000 |
| pt_enabled | Boolean | Professional Tax |
| default_hra_percent | Float | Default 40.0% |
| lop_enabled | Boolean | Loss of Pay |
| lop_basis | String(20) | calendar · working |
| gratuity_enabled | Boolean | |
| gratuity_rate | Float | Default 4.81% |
| bonus_enabled | Boolean | |
| bonus_rate | Float | Default 8.33% |
| bonus_wage_ceil | Float | Default ₹7000 |
| use_salary_structure | Boolean | |
| basic_pct | Float | Default 50% |
| hra_pct | Float | Default 20% |
| ca_pct | Float | Default 12.33% |
| others_pct | Float | Default 17.67% |
| custom_components | JSON | [{name, component_type, calc_type, value}] |
| updated_at | DateTime | |

### Table: `salary_components`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(100) unique | |
| abbr | String(20) | Short code |
| component_type | String(20) | Earning · Deduction |
| amount | Float | Fixed amount |
| formula | String(500) | Dynamic formula |
| is_tax | Integer | |
| created_at | DateTime | |

### Table: `salary_structures`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(200) unique | |
| is_active | Integer | |
| components | JSON | [{component_id, amount, formula}] |
| created_at | DateTime | |

### Table: `salary_slips`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| slip_id | String(50) unique | e.g. SLIP-2025-01-001 |
| employee_id | FK → employees | |
| month | Integer | 1–12 |
| year | Integer | |
| start_date | Date | |
| end_date | Date | |
| gross_pay | Float | |
| total_deduction | Float | |
| net_pay | Float | |
| earnings | JSON | [{name, amount}] |
| deductions | JSON | [{name, amount}] |
| status | String(20) | Draft · Submitted |
| payroll_entry_id | FK → payroll_entries | |
| created_at | DateTime | |

### Table: `payroll_entries`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| month | Integer | |
| year | Integer | |
| company | String(200) | |
| status | String(20) | Draft · Submitted |
| total_employees | Integer | |
| total_gross | Float | |
| total_net | Float | |
| notes | Text | |
| created_at | DateTime | |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| Get payroll rules | HR | `GET /api/payroll/rules` |
| Update payroll rules | HR | `PUT /api/payroll/rules` |
| List salary components | HR | `GET /api/payroll/components` |
| Create salary component | HR | `POST /api/payroll/components` |
| Delete salary component | HR | `DELETE /api/payroll/components/{id}` |
| Run payroll (generate slips for month) | HR | `POST /api/payroll/run` |
| Preview salary slip | HR | `GET /api/payroll/preview/{emp_id}` |
| List salary slips | HR | `GET /api/payroll/slips` |
| Create slip manually | HR | `POST /api/payroll/slips` |
| Get slip detail | HR | `GET /api/payroll/slips/{id}` |
| Download slip PDF | HR, Employee | `GET /api/payroll/slips/{id}/pdf` |
| List payroll entries | HR | `GET /api/payroll/entries` |
| Create payroll entry | HR | `POST /api/payroll/entries` |
| View own salary slips | Employee | `GET /api/portal/salary-slips` |
| View own slip detail | Employee | `GET /api/portal/salary-slips/{id}` |

---

## 6. Appraisals

### Table: `appraisals`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| period | String(50) | e.g. H1 2025, Annual 2025 |
| goals | JSON | [{title, weight, target}] |
| self_eval | JSON | {scores:[{idx, score, comments}], overall_comments, submitted_at} |
| hr_eval | JSON | Same structure |
| manager_eval | JSON | |
| ceo_eval | JSON | |
| business_eval | JSON | |
| biz_head_eval | JSON | |
| self_score | Float | 1–5 scale |
| hr_score | Float | |
| manager_score | Float | |
| ceo_score | Float | |
| business_score | Float | |
| biz_head_score | Float | |
| total_score | Float | Weighted average |
| perf_documents | JSON | [{id, name, url, uploaded_by, uploaded_at}] |
| status | String(30) | Goals Set → Self Evaluated → HR Evaluated → Manager Evaluated → CEO Evaluated → Completed |
| reviewer_comments | Text | |
| created_at | DateTime | |
| updated_at | DateTime | |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List appraisals | HR, CEO | `GET /api/appraisals` |
| Get appraisal detail | HR, CEO, Employee | `GET /api/appraisals/{id}` |
| Create appraisal (set goals) | HR | `POST /api/appraisals` |
| Update goals | HR | `PUT /api/appraisals/{id}/goals` |
| Submit manager evaluation | HR/Manager | `PUT /api/appraisals/{id}/manager-eval` |
| Submit business evaluation | HR | `PUT /api/appraisals/{id}/business-eval` |
| Submit business head evaluation | HR | `PUT /api/appraisals/{id}/biz-head-eval` |
| Submit HR evaluation | HR | `PUT /api/appraisals/{id}/hr-eval` |
| Submit CEO evaluation | CEO | `PUT /api/appraisals/{id}/ceo-eval` |
| Upload performance document | HR, Employee | `POST /api/appraisals/{id}/documents/upload` |
| Delete performance document | HR | `DELETE /api/appraisals/{id}/documents/{doc_id}` |
| Delete appraisal | HR | `DELETE /api/appraisals/{id}` |
| Submit self evaluation | Employee | `PUT /api/portal/appraisals/{id}/self-eval` |
| View own appraisals | Employee | `GET /api/portal/appraisals` |

---

## 7. Recruitment

### Table: `job_openings`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| title | String(200) | Job title |
| department_id | FK → departments | |
| designation_id | FK → designations | |
| no_of_positions | Integer | |
| status | String(20) | Open · Closed |
| closes_on | Date | |
| description | Text | Job description |
| expected_ctc | Float | |
| attachment_url | String(500) | JD document |
| attachment_name | String(200) | |
| social_platforms | JSONB | Platforms to post on |
| created_at | DateTime | |

### Table: `job_applicants`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(200) | |
| email | String(200) | |
| phone | String(20) | |
| job_opening_id | FK → job_openings | |
| status | String(20) | Applied · Screening · Interview · Offered · Rejected · Hired |
| resume_url | String(500) | |
| cover_letter | Text | |
| notes | Text | HR notes |
| created_at | DateTime | |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List job openings | HR | `GET /api/recruitment/openings` |
| Create job opening | HR | `POST /api/recruitment/openings` |
| Upload JD attachment | HR | `POST /api/recruitment/openings/{id}/attachment` |
| Close job opening | HR | `PUT /api/recruitment/openings/{id}/close` |
| Delete job opening | HR | `DELETE /api/recruitment/openings/{id}` |
| List applicants | HR | `GET /api/recruitment/applicants` |
| Add applicant | HR | `POST /api/recruitment/applicants` |
| Update applicant status | HR | `PUT /api/recruitment/applicants/{id}/status` |

---

## 8. Onboarding & Offboarding

### Table: `onboarding_checklists`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees unique | |
| items | JSON (Text) | {item_key: {done, done_at, note}} |
| created_at | DateTime | |
| updated_at | DateTime | |

**Predefined checklist sections:**
- `pre_joining` — Pre-joining formalities
- `documents` — Document collection
- `statutory` — PF, ESI, PT enrollment
- `setup` — System access, email, equipment

### Table: `offboarding_checklists`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees unique | |
| items | JSON (Text) | {item_key: {done, done_at, note}} |
| created_at | DateTime | |
| updated_at | DateTime | |

**Predefined checklist sections:**
- `exit_initiation` — Resignation acceptance, LWD confirmation
- `knowledge_transfer` — Handover documents
- `asset_return` — Laptop, access cards, keys
- `access_revocation` — Email, systems, credentials
- `settlement` — Final salary, F&F
- `exit_documents` — Experience letter, relieving letter

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List onboarding checklists | HR | `GET /api/onboarding/list` |
| Get employee's checklist | HR | `GET /api/onboarding/{emp_id}` |
| Mark item done/undone | HR | `PUT /api/onboarding/{emp_id}/item` |
| Toggle section collapse | HR | `PUT /api/onboarding/{emp_id}/section` |
| Get checklist history | HR | `GET /api/onboarding/{emp_id}/history` |
| List offboarding checklists | HR | `GET /api/onboarding/offboarding/list` |
| Get employee's offboarding | HR | `GET /api/onboarding/offboarding/{emp_id}` |
| Initiate offboarding | HR | `POST /api/onboarding/offboarding/{emp_id}/initiate` |
| Mark offboarding item done | HR | `PUT /api/onboarding/offboarding/{emp_id}/item` |
| List HR documents (offer letters etc.) | HR | `GET /api/onboarding/{emp_id}/hr-docs` |
| Upload HR document | HR | `POST /api/onboarding/{emp_id}/hr-docs/upload/{doc_key}` |
| Delete HR document | HR | `DELETE /api/onboarding/{emp_id}/hr-docs/{doc_key}` |

---

## 9. Resignations

### Table: `resignations`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| reason | Text | |
| last_working_date | Date | Requested by employee |
| notice_period_days | Integer | |
| status | String(20) | Pending · Approved · Rejected · Withdrawn |
| hr_remarks | Text | |
| approved_last_working_date | Date | HR-confirmed LWD |
| actioned_by | FK → users | |
| actioned_at | DateTime | |
| created_at | DateTime | |
| updated_at | DateTime | |

### Table: `notice_period_config` (singleton)

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| rules | JSONB | {employment_type: days} |

**Default rules:** Full-time=60 days · Part-time=15 · Contract=15 · Intern=15

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List resignations | HR | `GET /api/resignations` |
| Approve resignation | HR | `PUT /api/resignations/{id}/approve` |
| Reject resignation | HR | `PUT /api/resignations/{id}/reject` |
| Get notice period config | HR | `GET /api/notice-period-config` |
| Update notice period config | HR | `PUT /api/notice-period-config` |
| Submit resignation | Employee | `POST /api/portal/resignation` |
| Withdraw resignation | Employee | `DELETE /api/portal/resignation/{id}` |
| View own resignation | Employee | `GET /api/portal/resignation` |

---

## 10. Expense Claims

### Table: `expense_claims`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| claim_date | Date | |
| expense_type | String(100) | Travel · Food · Accommodation · Equipment · Medical · Training · Other |
| amount | Float | |
| description | Text | |
| receipt_url | String(500) | Uploaded receipt |
| status | String(30) | Pending · Approved · Rejected · Paid |
| approved_by | FK → users | |
| approved_on | Date | |
| remarks | Text | HR remarks on approval/rejection |
| created_at | DateTime | |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List all expense claims | HR | `GET /api/hrm/expenses` |
| Approve expense | HR | `PUT /api/hrm/expenses/{id}/approve` |
| Reject expense | HR | `PUT /api/hrm/expenses/{id}/reject` |
| Delete expense | HR | `DELETE /api/hrm/expenses/{id}` |
| View own expenses | Employee | `GET /api/portal/expenses` |
| Submit expense claim | Employee | `POST /api/portal/expenses` |

---

## 11. Asset Management

### Table: `employee_assets`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| asset_name | String(200) | e.g. Dell Latitude 5520 |
| asset_type | String(100) | Laptop · Mobile · Vehicle · Furniture · Other |
| serial_number | String(100) | |
| allocated_date | Date | |
| returned_date | Date | |
| condition | String(20) | Good · Fair · Poor |
| notes | String(500) | |
| status | String(30) | Allocated · Returned |
| created_at | DateTime | |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List all assets | HR | `GET /api/hrm/assets` |
| Allocate asset | HR | `POST /api/hrm/assets` |
| Mark asset returned | HR | `PUT /api/hrm/assets/{id}/return` |
| Delete asset record | HR | `DELETE /api/hrm/assets/{id}` |
| View own assets | Employee | via employee portal |

---

## 12. Document Management

### Table: `employee_documents`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| document_type | String(100) | Aadhaar · PAN · Passport · Offer Letter · Certificate etc. |
| document_name | String(300) | |
| file_url | String(500) | MinIO path |
| uploaded_at | DateTime | |

### Table: `document_requests`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| doc_type | String(100) | Experience Letter · Salary Certificate · NOC etc. |
| remarks | Text | |
| status | String(20) | Pending · Fulfilled |
| requested_at | DateTime | |
| fulfilled_at | DateTime | |
| file_url | String(500) | Fulfilled document |
| file_name | String(200) | |

### Table: `letterhead_template` (singleton)

| Field | Type | Notes |
|---|---|---|
| company_name | String | |
| tagline | String | |
| address | Text | |
| phone | String | |
| email | String | |
| website | String | |
| logo_url | String | |
| footer_image_url | String | |
| signature_url | String | |
| watermark_url | String | |
| font_family | String | |
| primary_color | String | Hex color |
| header_height | Integer | px |
| footer_height | Integer | px |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| Get employee documents | HR | `GET /api/hrm/employees/{id}/documents` |
| Upload employee document | HR | `POST /api/hrm/employees/{id}/documents` |
| Delete employee document | HR | `DELETE /api/hrm/documents/{id}` |
| List document requests | HR | `GET /api/hrm/document-requests` |
| Upload fulfilled document | HR | `POST /api/hrm/document-requests/{id}/upload` |
| List company docs | HR | `GET /api/hrm/company-docs` |
| Upload company doc | HR | `POST /api/hrm/company-docs/upload` |
| Download company doc | All | `GET /api/hrm/company-docs/{filename}` |
| Delete company doc | HR | `DELETE /api/hrm/company-docs/{filename}` |
| Get letterhead template | HR | `GET /api/hrm/letterhead-template` |
| Update letterhead template | HR | `PUT /api/hrm/letterhead-template` |
| Upload logo | HR | `POST /api/hrm/letterhead-template/logo` |
| Upload footer image | HR | `POST /api/hrm/letterhead-template/footer-image` |
| Upload signature | HR | `POST /api/hrm/letterhead-template/signature` |
| Upload watermark | HR | `POST /api/hrm/letterhead-template/watermark` |
| Preview letterhead | HR | `POST /api/hrm/letterhead-template/preview` |
| Get letter fields | HR | `GET /api/hrm/letter-fields` |
| Generate letter | HR | `POST /api/hrm/letters/generate` |
| Download generated letter | HR | `GET /api/hrm/letters/download/{filename}` |
| Request document | Employee | `POST /api/portal/documents` |
| View own documents | Employee | `GET /api/portal/documents` |

---

## 13. Status Sheet & Work Mode

### Table: `status_entries`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| task_id | String(20) | Task identifier |
| entry_date | Date | |
| task_name | Text | |
| due_date | Date | |
| status | String(50) | In Progress etc. |
| percent_complete | Integer | 0–100 |
| created_at | DateTime | |
| updated_at | DateTime | |

### Table: `work_mode_entries`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| leave_id | FK → leave_applications | Linked leave if applicable |
| entry_date | Date | |
| work_mode | String(50) | WFH · Planned Leave · Sick Leave · Casual Leave |
| reason | String(300) | |
| duration | String(30) | Full-Day · Half-Day (Morning) · Half-Day (Afternoon) |
| status | String(20) | Pending · Approved · Rejected |
| hr_remarks | Text | |
| created_at | DateTime | |
| updated_at | DateTime | |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List status entries (all) | HR | `GET /api/hrm/status` |
| Update status entry | HR | `PUT /api/hrm/status/{id}` |
| List work mode entries | HR | `GET /api/hrm/work-mode` |
| Approve WFH/mode | HR | `PUT /api/hrm/work-mode/{id}/approve` |
| Reject WFH/mode | HR | `PUT /api/hrm/work-mode/{id}/reject` |
| View own status | Employee | `GET /api/portal/status` |
| Update own status entry | Employee | `PUT /api/portal/status/{id}` |
| View own work mode | Employee | `GET /api/portal/work-mode` |
| Submit WFH/mode | Employee | `POST /api/portal/work-mode` |
| Delete own work mode entry | Employee | `DELETE /api/portal/work-mode/{id}` |

---

## 14. Announcements & Holidays

### Table: `announcements`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| title | String(300) | |
| content | Text | |
| priority | String(20) | Low · Medium · High |
| is_active | Boolean | |
| created_by | String(200) | |
| created_at | DateTime | |
| expires_on | Date | Auto-hides after this date |

### Table: `holidays`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(200) | |
| date | Date | |
| holiday_type | String(50) | Public · Optional · Restricted |
| description | String(500) | |
| created_at | DateTime | |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List announcements | All | `GET /api/hrm/announcements` |
| Create announcement | HR | `POST /api/hrm/announcements` |
| Update announcement | HR | `PUT /api/hrm/announcements/{id}` |
| Delete announcement | HR | `DELETE /api/hrm/announcements/{id}` |
| List holidays | All | `GET /api/hrm/holidays` |
| Create holiday | HR | `POST /api/hrm/holidays` |
| Delete holiday | HR | `DELETE /api/hrm/holidays/{id}` |

---

## 15. Biometric Integration

### Table: `biometric_devices`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(100) | e.g. Main Entrance |
| ip_address | String(50) | |
| port | Integer | Default 4370 (ZK protocol) |
| password | Integer | Device password (default 0) |
| location | String(120) | |
| is_active | Boolean | |
| last_sync_at | DateTime | |
| last_status | String(200) | Last sync result message |
| created_at | DateTime | |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| List devices | HR | `GET /api/biometric/devices` |
| Add device | HR | `POST /api/biometric/devices` |
| Update device | HR | `PUT /api/biometric/devices/{id}` |
| Delete device | HR | `DELETE /api/biometric/devices/{id}` |
| Test connection | HR | `POST /api/biometric/devices/{id}/test` |
| Get enrolled users on device | HR | `GET /api/biometric/devices/{id}/users` |
| Manual sync | HR | `POST /api/biometric/sync` |

**Auto-sync:** Runs every N minutes (configured via `BIOMETRIC_SYNC_INTERVAL_MIN` env var). Backfills `BIOMETRIC_SYNC_BACKFILL_DAYS` of missed records.

---

## 16. Social Media Posting

### Table: `social_accounts`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| platform | String(50) | LinkedIn · Facebook · Instagram |
| account_name | String(200) | |
| account_id | String(200) | Platform-assigned ID |
| access_token | Text | OAuth token |
| refresh_token | Text | |
| token_expires_at | DateTime | |
| page_id | String(200) | Facebook page ID |
| page_name | String(200) | |
| ig_user_id | String(200) | Instagram Business Account ID |
| is_active | Boolean | |
| created_at | DateTime | |

### Table: `social_posts`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| job_opening_id | FK → job_openings | |
| platform | String(50) | |
| social_account_id | FK → social_accounts | |
| post_id | String(200) | Platform post ID |
| post_url | String(500) | |
| status | String(50) | pending · posted · failed |
| error_message | Text | |
| posted_at | DateTime | |
| created_at | DateTime | |

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| Get social config | HR | `GET /api/social/config` |
| List connected accounts | HR | `GET /api/social/accounts` |
| Connect LinkedIn | HR | `GET /api/social/auth/linkedin` |
| LinkedIn OAuth callback | System | `GET /api/social/callback/linkedin` |
| Connect Facebook | HR | `GET /api/social/auth/facebook` |
| Facebook OAuth callback | System | `GET /api/social/callback/facebook` |
| Disconnect account | HR | `DELETE /api/social/accounts/{id}` |
| Post job to social | HR | `POST /api/social/post/{job_opening_id}` |
| Get post history | HR | `GET /api/social/posts/{job_opening_id}` |

---

## 17. Permissions & Admin

### Table: `role_permissions`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| role | String(50) unique | HR · CEO · Employee |
| allowed_features | JSONB | {feature_key: true/false} |
| updated_at | DateTime | |

**Feature keys — Employee Portal:**
`emp-dashboard`, `start-journey`, `my-profile`, `my-leaves`, `my-attendance`, `my-salary`, `my-appraisals`, `my-assets`, `my-documents`, `my-status`, `my-work-mode`, `my-edit-requests`, `my-resignation`, `my-announcements`, `my-holidays`

**Feature keys — HR:**
All employee features plus: `dashboard`, `employees`, `departments`, `designations`, `work-mode-sheet`, `leave-types`, `leave-balances`, `holidays`, `announcements`, `assets`, `salary-slips`, `payroll-entry`, `payroll-rules`, `onboarding`, `job-openings`, `applicants`, `appraisals`, `edit-requests`, `resignations`, `document-requests`, `status-sheets`, `company-docs`, `reports`

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| Get dashboard stats | HR, CEO | `GET /api/dashboard` |
| Get admin stats | SuperAdmin | `GET /api/admin-panel/stats` |
| List users (admin) | SuperAdmin | `GET /api/admin-panel/users` |
| Create user (admin) | SuperAdmin | `POST /api/admin-panel/users` |
| Update user | SuperAdmin | `PUT /api/admin-panel/users/{id}` |
| Reset user password | SuperAdmin | `POST /api/admin-panel/users/{id}/reset-password` |
| Delete user | SuperAdmin | `DELETE /api/admin-panel/users/{id}` |
| Get all permissions | SuperAdmin | `GET /api/admin-panel/permissions` |
| Update all permissions | SuperAdmin | `PUT /api/admin-panel/permissions` |
| Get role permissions | SuperAdmin | `GET /api/admin-panel/permissions/{role}` |
| Get own permissions | Employee | `GET /api/portal/my-permissions` |

---

## 18. Reports & AI

### Operations

| Operation | Who | Endpoint |
|---|---|---|
| Generate attendance report | HR | `POST /api/reports/attendance` |
| List reports | HR | `GET /api/reports` |
| Get report detail | HR | `GET /api/reports/{id}` |
| AI chat assistant | HR, CEO | `POST /api/ai/chat` |
| AI insights | HR, CEO | `GET /api/ai/insights` |
| Health check (DB ping) | System | `GET /health` |
| Real-time notifications (SSE) | All | `GET /api/notifications/stream` |

---

## 19. Employee Self-Service Portal

All routes under `/api/portal/` — access controlled by role permissions.

### Table: `edit_requests`

| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| employee_id | FK → employees | |
| request_type | String(50) | Leave · Status Sheet · Attendance · Other |
| target_date | Date | |
| description | Text | What needs to be corrected |
| reason | Text | |
| status | String(20) | Pending · Approved · Rejected |
| hr_remarks | Text | |
| created_at | DateTime | |
| resolved_at | DateTime | |
| resolved_by | FK → users | |

### Portal Operations

| Feature | Operation | Endpoint |
|---|---|---|
| **Dashboard** | View personal summary | `GET /api/portal/dashboard` |
| **Profile** | View own profile | `GET /api/portal/profile` |
| **Profile** | Update own profile | `PATCH /api/portal/profile` |
| **Profile** | Upload own photo | `POST /api/portal/profile/photo` |
| **Start Journey** | View onboarding status | `GET /api/portal/start-journey` |
| **Start Journey** | Update journey step | `PUT /api/portal/start-journey/step` |
| **Start Journey** | Upload step document | `POST /api/portal/start-journey/upload/{step_key}` |
| **Start Journey** | Download step document | `GET /api/portal/start-journey/download/{step_key}` |
| **Leaves** | Apply for leave | `POST /api/portal/leaves` |
| **Leaves** | View own leaves | `GET /api/portal/leaves` |
| **Leaves** | Cancel leave | `DELETE /api/portal/leaves/{id}` |
| **Leaves** | Request cancellation | `POST /api/portal/leaves/{id}/cancel-request` |
| **Leaves** | Request date change | `POST /api/portal/leaves/{id}/edit-request` |
| **Leaves** | View leave balances | `GET /api/portal/leave-balances` |
| **Leaves** | View leave types | `GET /api/portal/leave-types` |
| **Attendance** | View own attendance | `GET /api/portal/attendance` |
| **Salary** | View own salary slips | `GET /api/portal/salary-slips` |
| **Appraisals** | View own appraisals | `GET /api/portal/appraisals` |
| **Appraisals** | Submit self evaluation | `PUT /api/portal/appraisals/{id}/self-eval` |
| **Assets** | View allocated assets | via employee record |
| **Documents** | Request a document | `POST /api/portal/documents` |
| **Documents** | View own documents | `GET /api/portal/documents` |
| **Status Sheet** | View own status | `GET /api/portal/status` |
| **Status Sheet** | Update entry | `PUT /api/portal/status/{id}` |
| **Work Mode** | Submit WFH/leave mode | `POST /api/portal/work-mode` |
| **Work Mode** | View own work modes | `GET /api/portal/work-mode` |
| **Work Mode** | Delete entry | `DELETE /api/portal/work-mode/{id}` |
| **Edit Requests** | Submit edit request | `POST /api/portal/edit-requests` |
| **Edit Requests** | View own requests | `GET /api/portal/edit-requests` |
| **Resignation** | Submit resignation | `POST /api/portal/resignation` |
| **Resignation** | Withdraw resignation | `DELETE /api/portal/resignation/{id}` |
| **Resignation** | View own resignation | `GET /api/portal/resignation` |
| **Expenses** | Submit expense claim | `POST /api/portal/expenses` |
| **Expenses** | View own claims | `GET /api/portal/expenses` |

---

## 20. API Endpoint Index

### Base URL: `/api`

| Method | Path | Module | Who |
|---|---|---|---|
| POST | `/auth/login` | Auth | All |
| POST | `/auth/setup` | Auth | Anyone (first time) |
| POST | `/auth/verify` | Auth | All |
| POST | `/auth/change-password` | Auth | All |
| POST | `/auth/create-user` | Auth | SuperAdmin |
| GET | `/auth/users` | Auth | SuperAdmin |
| GET | `/auth/needs-setup` | Auth | Anyone |
| GET | `/employees` | Employees | HR, CEO |
| POST | `/employees` | Employees | HR |
| GET | `/employees/{id}` | Employees | HR, CEO |
| PUT | `/employees/{id}` | Employees | HR |
| DELETE | `/employees/{id}` | Employees | HR |
| POST | `/employees/{id}/photo` | Employees | HR |
| GET | `/employees/departments` | Employees | All |
| POST | `/employees/departments` | Employees | HR |
| PUT | `/employees/departments/{id}` | Employees | HR |
| DELETE | `/employees/departments/{id}` | Employees | HR |
| GET | `/employees/designations` | Employees | All |
| POST | `/employees/designations` | Employees | HR |
| PUT | `/employees/designations/{id}` | Employees | HR |
| DELETE | `/employees/designations/{id}` | Employees | HR |
| GET | `/leaves/types` | Leaves | All |
| POST | `/leaves/types` | Leaves | HR |
| PUT | `/leaves/types/{id}` | Leaves | HR |
| DELETE | `/leaves/types/{id}` | Leaves | HR |
| GET | `/leaves/types/{id}/policy` | Leaves | HR |
| PUT | `/leaves/types/{id}/policy` | Leaves | HR |
| GET | `/leaves` | Leaves | HR, CEO |
| POST | `/leaves` | Leaves | HR |
| PUT | `/leaves/{id}/approve` | Leaves | HR, CEO |
| PUT | `/leaves/{id}/reject` | Leaves | HR, CEO |
| PUT | `/leaves/{id}/approve-cancel` | Leaves | HR |
| PUT | `/leaves/{id}/reject-cancel` | Leaves | HR |
| PUT | `/leaves/{id}/approve-edit` | Leaves | HR |
| PUT | `/leaves/{id}/reject-edit` | Leaves | HR |
| DELETE | `/leaves/{id}` | Leaves | HR |
| GET | `/leaves/attendance` | Attendance | HR |
| POST | `/leaves/attendance` | Attendance | HR |
| PUT | `/leaves/attendance/{id}` | Attendance | HR |
| GET | `/payroll/rules` | Payroll | HR |
| PUT | `/payroll/rules` | Payroll | HR |
| GET | `/payroll/components` | Payroll | HR |
| POST | `/payroll/components` | Payroll | HR |
| DELETE | `/payroll/components/{id}` | Payroll | HR |
| POST | `/payroll/run` | Payroll | HR |
| GET | `/payroll/preview/{emp_id}` | Payroll | HR |
| GET | `/payroll/slips` | Payroll | HR |
| POST | `/payroll/slips` | Payroll | HR |
| GET | `/payroll/slips/{id}` | Payroll | HR, Employee |
| GET | `/payroll/slips/{id}/pdf` | Payroll | HR, Employee |
| GET | `/payroll/entries` | Payroll | HR |
| POST | `/payroll/entries` | Payroll | HR |
| GET | `/appraisals` | Appraisals | HR, CEO |
| POST | `/appraisals` | Appraisals | HR |
| GET | `/appraisals/{id}` | Appraisals | HR, CEO, Employee |
| PUT | `/appraisals/{id}/goals` | Appraisals | HR |
| PUT | `/appraisals/{id}/self-eval` | Appraisals | HR (admin) |
| PUT | `/appraisals/{id}/hr-eval` | Appraisals | HR |
| PUT | `/appraisals/{id}/manager-eval` | Appraisals | HR |
| PUT | `/appraisals/{id}/ceo-eval` | Appraisals | CEO |
| PUT | `/appraisals/{id}/business-eval` | Appraisals | HR |
| PUT | `/appraisals/{id}/biz-head-eval` | Appraisals | HR |
| POST | `/appraisals/{id}/documents/upload` | Appraisals | HR |
| DELETE | `/appraisals/{id}/documents/{doc_id}` | Appraisals | HR |
| DELETE | `/appraisals/{id}` | Appraisals | HR |
| GET | `/recruitment/openings` | Recruitment | HR |
| POST | `/recruitment/openings` | Recruitment | HR |
| POST | `/recruitment/openings/{id}/attachment` | Recruitment | HR |
| PUT | `/recruitment/openings/{id}/close` | Recruitment | HR |
| DELETE | `/recruitment/openings/{id}` | Recruitment | HR |
| GET | `/recruitment/applicants` | Recruitment | HR |
| POST | `/recruitment/applicants` | Recruitment | HR |
| PUT | `/recruitment/applicants/{id}/status` | Recruitment | HR |
| GET | `/resignations` | Resignations | HR |
| PUT | `/resignations/{id}/approve` | Resignations | HR |
| PUT | `/resignations/{id}/reject` | Resignations | HR |
| GET | `/hrm/announcements` | HRM | All |
| POST | `/hrm/announcements` | HRM | HR |
| PUT | `/hrm/announcements/{id}` | HRM | HR |
| DELETE | `/hrm/announcements/{id}` | HRM | HR |
| GET | `/hrm/holidays` | HRM | All |
| POST | `/hrm/holidays` | HRM | HR |
| DELETE | `/hrm/holidays/{id}` | HRM | HR |
| GET | `/hrm/leave-balances` | HRM | HR |
| POST | `/hrm/leave-balances/allocate` | HRM | HR |
| POST | `/hrm/leave-balances/allocate-all` | HRM | HR |
| GET | `/hrm/leave-balances/employee/{id}` | HRM | HR |
| GET | `/hrm/expenses` | HRM | HR |
| POST | `/hrm/expenses` | HRM | HR |
| PUT | `/hrm/expenses/{id}/approve` | HRM | HR |
| PUT | `/hrm/expenses/{id}/reject` | HRM | HR |
| DELETE | `/hrm/expenses/{id}` | HRM | HR |
| GET | `/hrm/assets` | HRM | HR |
| POST | `/hrm/assets` | HRM | HR |
| PUT | `/hrm/assets/{id}/return` | HRM | HR |
| DELETE | `/hrm/assets/{id}` | HRM | HR |
| GET | `/hrm/employees/{id}/history` | HRM | HR |
| POST | `/hrm/employees/{id}/history` | HRM | HR |
| PUT | `/hrm/employees/{id}/history/{rec_id}` | HRM | HR |
| DELETE | `/hrm/employees/{id}/history/{rec_id}` | HRM | HR |
| GET | `/hrm/employees/{id}/emergency-contacts` | HRM | HR |
| POST | `/hrm/employees/{id}/emergency-contacts` | HRM | HR |
| PUT | `/hrm/emergency-contacts/{id}` | HRM | HR |
| DELETE | `/hrm/emergency-contacts/{id}` | HRM | HR |
| GET | `/hrm/employees/{id}/documents` | HRM | HR |
| POST | `/hrm/employees/{id}/documents` | HRM | HR |
| DELETE | `/hrm/documents/{id}` | HRM | HR |
| GET | `/hrm/document-requests` | HRM | HR |
| POST | `/hrm/document-requests/{id}/upload` | HRM | HR |
| GET | `/hrm/company-docs` | HRM | HR |
| POST | `/hrm/company-docs/upload` | HRM | HR |
| GET | `/hrm/company-docs/{filename}` | HRM | All |
| DELETE | `/hrm/company-docs/{filename}` | HRM | HR |
| GET | `/hrm/status` | HRM | HR |
| PUT | `/hrm/status/{id}` | HRM | HR |
| GET | `/hrm/work-mode` | HRM | HR |
| PUT | `/hrm/work-mode/{id}/approve` | HRM | HR |
| PUT | `/hrm/work-mode/{id}/reject` | HRM | HR |
| GET | `/hrm/edit-requests` | HRM | HR |
| PUT | `/hrm/edit-requests/{id}/approve` | HRM | HR |
| PUT | `/hrm/edit-requests/{id}/reject` | HRM | HR |
| GET | `/hrm/letterhead-template` | HRM | HR |
| PUT | `/hrm/letterhead-template` | HRM | HR |
| POST | `/hrm/letterhead-template/logo` | HRM | HR |
| POST | `/hrm/letterhead-template/footer-image` | HRM | HR |
| POST | `/hrm/letterhead-template/signature` | HRM | HR |
| POST | `/hrm/letterhead-template/watermark` | HRM | HR |
| POST | `/hrm/letterhead-template/preview` | HRM | HR |
| GET | `/hrm/letter-fields` | HRM | HR |
| POST | `/hrm/letters/generate` | HRM | HR |
| GET | `/hrm/letters/download/{filename}` | HRM | HR |
| GET | `/hrm/team-leaves` | HRM | HR, CEO |
| GET | `/biometric/devices` | Biometric | HR |
| POST | `/biometric/devices` | Biometric | HR |
| PUT | `/biometric/devices/{id}` | Biometric | HR |
| DELETE | `/biometric/devices/{id}` | Biometric | HR |
| POST | `/biometric/devices/{id}/test` | Biometric | HR |
| GET | `/biometric/devices/{id}/users` | Biometric | HR |
| POST | `/biometric/sync` | Biometric | HR |
| GET | `/social/accounts` | Social | HR |
| GET | `/social/auth/linkedin` | Social | HR |
| GET | `/social/auth/facebook` | Social | HR |
| DELETE | `/social/accounts/{id}` | Social | HR |
| POST | `/social/post/{job_id}` | Social | HR |
| GET | `/social/posts/{job_id}` | Social | HR |
| GET | `/dashboard` | Dashboard | HR, CEO |
| GET | `/admin-panel/stats` | Admin | SuperAdmin |
| GET | `/admin-panel/users` | Admin | SuperAdmin |
| POST | `/admin-panel/users` | Admin | SuperAdmin |
| PUT | `/admin-panel/users/{id}` | Admin | SuperAdmin |
| POST | `/admin-panel/users/{id}/reset-password` | Admin | SuperAdmin |
| DELETE | `/admin-panel/users/{id}` | Admin | SuperAdmin |
| GET | `/admin-panel/permissions` | Admin | SuperAdmin |
| PUT | `/admin-panel/permissions` | Admin | SuperAdmin |
| GET | `/admin-panel/permissions/{role}` | Admin | SuperAdmin |
| GET | `/notice-period-config` | Config | HR |
| PUT | `/notice-period-config` | Config | HR |
| GET | `/notifications` | Notifications | All |
| GET | `/notifications/stream` | Notifications | All (SSE) |
| POST | `/notifications/profile-update/{id}/seen` | Notifications | HR |
| POST | `/reports/attendance` | Reports | HR |
| GET | `/reports` | Reports | HR |
| POST | `/ai/chat` | AI | HR, CEO |
| GET | `/ai/insights` | AI | HR, CEO |
| GET | `/health` | Health | System |
| GET | `/portal/my-permissions` | Portal | Employee |
| GET | `/portal/dashboard` | Portal | Employee |
| GET | `/portal/profile` | Portal | Employee |
| PATCH | `/portal/profile` | Portal | Employee |
| POST | `/portal/profile/photo` | Portal | Employee |
| GET | `/portal/start-journey` | Portal | Employee |
| PUT | `/portal/start-journey/step` | Portal | Employee |
| POST | `/portal/start-journey/upload/{key}` | Portal | Employee |
| GET | `/portal/start-journey/download/{key}` | Portal | Employee |
| GET | `/portal/leaves` | Portal | Employee |
| POST | `/portal/leaves` | Portal | Employee |
| DELETE | `/portal/leaves/{id}` | Portal | Employee |
| POST | `/portal/leaves/{id}/cancel-request` | Portal | Employee |
| POST | `/portal/leaves/{id}/edit-request` | Portal | Employee |
| GET | `/portal/leave-balances` | Portal | Employee |
| GET | `/portal/leave-types` | Portal | Employee |
| GET | `/portal/attendance` | Portal | Employee |
| GET | `/portal/salary-slips` | Portal | Employee |
| GET | `/portal/salary-slips/{id}` | Portal | Employee |
| GET | `/portal/appraisals` | Portal | Employee |
| PUT | `/portal/appraisals/{id}/self-eval` | Portal | Employee |
| POST | `/portal/appraisals/{id}/documents/upload` | Portal | Employee |
| DELETE | `/portal/appraisals/{id}/documents/{id}` | Portal | Employee |
| GET | `/portal/expenses` | Portal | Employee |
| POST | `/portal/expenses` | Portal | Employee |
| GET | `/portal/documents` | Portal | Employee |
| POST | `/portal/documents` | Portal | Employee |
| GET | `/portal/status` | Portal | Employee |
| PUT | `/portal/status/{id}` | Portal | Employee |
| GET | `/portal/work-mode` | Portal | Employee |
| POST | `/portal/work-mode` | Portal | Employee |
| DELETE | `/portal/work-mode/{id}` | Portal | Employee |
| GET | `/portal/edit-requests` | Portal | Employee |
| POST | `/portal/edit-requests` | Portal | Employee |
| GET | `/portal/resignation` | Portal | Employee |
| POST | `/portal/resignation` | Portal | Employee |
| DELETE | `/portal/resignation/{id}` | Portal | Employee |
| GET | `/portal/team-leaves` | Portal | Employee |
| GET | `/portal/notice-period-rules` | Portal | Employee |
| GET | `/onboarding/list` | Onboarding | HR |
| GET | `/onboarding/{emp_id}` | Onboarding | HR |
| PUT | `/onboarding/{emp_id}/item` | Onboarding | HR |
| PUT | `/onboarding/{emp_id}/section` | Onboarding | HR |
| GET | `/onboarding/{emp_id}/history` | Onboarding | HR |
| GET | `/onboarding/offboarding/list` | Onboarding | HR |
| GET | `/onboarding/offboarding/{emp_id}` | Onboarding | HR |
| POST | `/onboarding/offboarding/{emp_id}/initiate` | Onboarding | HR |
| PUT | `/onboarding/offboarding/{emp_id}/item` | Onboarding | HR |
| GET | `/onboarding/{emp_id}/hr-docs` | Onboarding | HR |
| POST | `/onboarding/{emp_id}/hr-docs/upload/{key}` | Onboarding | HR |
| DELETE | `/onboarding/{emp_id}/hr-docs/{key}` | Onboarding | HR |

---

## Database Tables Summary

| Table | Purpose |
|---|---|
| users | Login accounts for all roles |
| employees | Core employee records |
| departments | Org structure |
| designations | Job titles |
| emergency_contacts | Employee emergency contacts |
| employee_documents | Uploaded employee docs |
| employee_history | Promotion/transfer/salary change log |
| profile_update_logs | Employee self-update notifications |
| leave_types | Configurable leave categories |
| leave_policies | Rules per leave type |
| leave_applications | Leave requests and approvals |
| leave_balances | Per-employee per-year allocation |
| attendance | Daily attendance records |
| holidays | Company holiday calendar |
| payroll_rules | Global payroll configuration |
| salary_components | Earning/deduction components |
| salary_structures | Grouped component templates |
| salary_slips | Individual monthly payslips |
| payroll_entries | Monthly batch payroll runs |
| appraisals | Multi-stage performance reviews |
| job_openings | Active/closed job postings |
| job_applicants | Candidate tracking |
| resignations | Resignation requests |
| notice_period_config | Notice period rules by employment type |
| onboarding_checklists | New hire task lists |
| offboarding_checklists | Exit task lists |
| document_requests | Employee document requests |
| edit_requests | Employee record correction requests |
| expense_claims | Employee expense reimbursement |
| employee_assets | Company asset allocation |
| announcements | Company-wide notices |
| role_permissions | Feature access per role |
| biometric_devices | eSSL/ZK attendance devices |
| social_accounts | LinkedIn/Facebook/Instagram OAuth tokens |
| social_posts | Job posting history |
| status_entries | Daily task status sheet |
| work_mode_entries | WFH/leave work mode declarations |
| letterhead_template | Company letter template settings |

---

*Last updated: June 2026 — ArTech HRMS v1.0*
