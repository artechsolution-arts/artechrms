# Custom Document Template Guide

## Format Rules

Write your letter in plain text. Wrap every field in `{{double curly braces}}`.

The system accepts **any naming style** — spaces, Title Case, snake_case:

| What you write         | System converts to  | Form label shown to HR    |
|------------------------|---------------------|---------------------------|
| `{{Employee Name}}`    | `{{employee_name}}` | Employee Name             |
| `{{Joining Date}}`     | `{{joining_date}}`  | Joining Date (date picker)|
| `{{employee_name}}`    | unchanged           | Employee Name             |
| `{{joining_date}}`     | unchanged           | Joining Date (date picker)|
| `[Employee Name]`      | `{{employee_name}}` | Employee Name             |

**Use whichever style feels natural in Word.** All three formats work.

---

## Auto-Filled Variables (no HR input needed)

When HR selects an employee, these fill automatically:

| Write any of these                   | Fills with              |
|--------------------------------------|-------------------------|
| `{{Employee Name}}` / `{{employee_name}}` | Full name          |
| `{{Designation}}` / `{{designation}}`     | Job title          |
| `{{Department}}` / `{{department}}`       | Department         |
| `{{Employee ID}}` / `{{employee_id_code}}`| Employee ID code   |
| `{{Work Email}}` / `{{work_email}}`       | Company email      |

---

## Date Fields

Any variable whose name contains **date**, **dob**, or **doj** gets a date picker and
is formatted as DD/MM/YYYY automatically.

Examples: `{{Joining Date}}`, `{{Last Working Date}}`, `{{letter_date}}`, `{{DOB}}`

---

## SAMPLE TEMPLATES (copy into HRMS)

---

### 1. Relieving Letter
*(matches the AR Tech Solutions format)*

```
RELIEVING LETTER

Date: {{Letter Date}}

TO WHOMSOEVER IT MAY CONCERN

This is to certify that Mr./Ms. {{Employee Name}} worked with AR Tech Solutions as a
{{Designation}} from {{Joining Date}} to {{Last Working Date}}.

He/She has been formally relieved from the duties and responsibilities of the
organization with effect from {{Relieving Date}} after completing the required
notice period and knowledge handover.

We appreciate his/her contribution to the organization and wish him/her all the
best for future endeavours.

Yours sincerely,
For AR Tech Solutions

{{HR Name}}
Human Resource Executive
```

**HR fills:** Letter Date, Last Working Date, Relieving Date, HR Name
**Auto-filled:** Employee Name, Designation, Joining Date (from employee record)

---

### 2. Offer Letter

```
Date: {{Offer Date}}

To,
{{Employee Name}}
{{Candidate Address}}

Subject: Offer of Employment – {{Designation}}

Dear {{Employee Name}},

We are pleased to offer you the position of {{Designation}} in our {{Department}}
department at AR Tech Solutions, effective {{Date of Joining}}.

Designation      : {{Designation}}
Department       : {{Department}}
Date of Joining  : {{Date of Joining}}
Annual CTC       : INR {{Annual CTC}} per annum
Probation Period : {{Probation Period}}
Reporting To     : {{Reporting Manager}}

Please sign and return a copy of this letter as your acceptance.

Warm regards,

{{HR Name}}
{{HR Designation}}
Human Resources
AR Tech Solutions
```

---

### 3. Appointment Letter

```
Date: {{Letter Date}}

To,
{{Employee Name}}

Subject: Appointment Letter – {{Designation}}

Dear {{Employee Name}},

With reference to your application and subsequent interview, we are pleased to
appoint you as {{Designation}} in the {{Department}} department at AR Tech Solutions,
effective from {{Date of Joining}}.

Employee ID      : {{Employee ID}}
Designation      : {{Designation}}
Department       : {{Department}}
Date of Joining  : {{Date of Joining}}
Annual CTC       : INR {{Annual CTC}} per annum
Work Location    : {{Work Location}}
Probation Period : 6 months from date of joining
Notice Period    : {{Notice Period}}

Please sign and return a copy of this letter to confirm your acceptance.

For AR Tech Solutions,

{{HR Name}}
{{HR Designation}}
Human Resources
```

---

### 4. Salary Increment Letter

```
Date: {{Letter Date}}

To,
{{Employee Name}}
{{Designation}}, {{Department}}
Employee ID: {{Employee ID}}

Subject: Salary Revision Letter

Dear {{Employee Name}},

Based on your performance review, the management has decided to revise your
compensation effective {{Effective Date}}.

Previous Annual CTC  : INR {{Previous CTC}} per annum
Revised Annual CTC   : INR {{Revised CTC}} per annum
Increment Amount     : INR {{Increment Amount}} per annum
Effective Date       : {{Effective Date}}

We appreciate your dedication and look forward to your continued contributions.

For AR Tech Solutions,

{{HR Name}}
{{HR Designation}}
Human Resources
```

---

### 5. Promotion Letter

```
Date: {{Letter Date}}

To,
{{Employee Name}}
Employee ID: {{Employee ID}}

Subject: Promotion Letter

Dear {{Employee Name}},

We are delighted to inform you that the management has decided to promote you
from {{Current Designation}} to {{New Designation}}, effective {{Effective Date}}.

Current Designation : {{Current Designation}}
New Designation     : {{New Designation}}
Department          : {{Department}}
Effective Date      : {{Effective Date}}
Revised Annual CTC  : INR {{Revised CTC}} per annum

Your new responsibilities will include {{New Responsibilities}}.

Congratulations on this achievement.

For AR Tech Solutions,

{{HR Name}}
{{HR Designation}}
Human Resources
```

---

### 6. Experience Certificate

```
Date: {{Letter Date}}

TO WHOMSOEVER IT MAY CONCERN

This is to certify that {{Employee Name}} (Employee ID: {{Employee ID}}) was
employed with AR Tech Solutions as {{Designation}} in the {{Department}}
department.

Date of Joining  : {{Date of Joining}}
Last Working Day : {{Last Working Day}}
Total Experience : {{Total Experience}}

During the tenure, {{Employee Name}} performed their duties with dedication and
integrity. Their conduct and performance were found satisfactory.

We wish {{Employee Name}} all the best in their future endeavours.

For AR Tech Solutions,

{{HR Name}}
{{HR Designation}}
Human Resources
```

---

### 7. Offer Letter (Internship)

```
Date: {{Offer Date}}

To,
{{Employee Name}}

Subject: Internship Offer Letter

Dear {{Employee Name}},

We are pleased to offer you an internship at AR Tech Solutions.

Duration   : {{Internship Duration}}
Start Date : {{Start Date}}
End Date   : {{End Date}}
Department : {{Department}}
Stipend    : INR {{Stipend}} per month
Mentor     : {{Mentor Name}}

This internship will give you an opportunity to work on {{Project Description}}.

Please confirm your acceptance by {{Confirmation Date}}.

For AR Tech Solutions,

{{HR Name}}
{{HR Designation}}
Human Resources
```

---

### 8. Warning Letter

```
Date: {{Letter Date}}

To,
{{Employee Name}}
{{Designation}}, {{Department}}
Employee ID: {{Employee ID}}

Subject: Written Warning – {{Warning Subject}}

Dear {{Employee Name}},

This letter serves as a formal written warning regarding {{Warning Subject}}.

On {{Incident Date}}, it was observed that {{Incident Description}}.

This is your {{Warning Number}} warning. Continued violation of company policies
may result in further disciplinary action, including termination of employment.

You are expected to immediately adhere to all company policies going forward.

For AR Tech Solutions,

{{HR Name}}
{{HR Designation}}
Human Resources


Employee Acknowledgement:

Name: ____________________  Signature: ____________________  Date: ____________
```

---

### 9. Confirmation Letter (after probation)

```
Date: {{Letter Date}}

To,
{{Employee Name}}
Employee ID: {{Employee ID}}

Subject: Confirmation of Employment

Dear {{Employee Name}},

We are pleased to inform you that upon successful completion of your probation
period, you have been confirmed as a permanent employee of AR Tech Solutions
with effect from {{Confirmation Date}}.

Designation       : {{Designation}}
Department        : {{Department}}
Confirmation Date : {{Confirmation Date}}
Annual CTC        : INR {{Annual CTC}} per annum
Notice Period     : {{Notice Period}}

Congratulations on your confirmation.

For AR Tech Solutions,

{{HR Name}}
{{HR Designation}}
Human Resources
```

---

### 10. No Objection Certificate (NOC)

```
Date: {{Letter Date}}

TO WHOMSOEVER IT MAY CONCERN

Subject: No Objection Certificate

This is to certify that {{Employee Name}}, {{Designation}} in the {{Department}}
department (Employee ID: {{Employee ID}}) is a bonafide employee of AR Tech Solutions.

The Company has no objection to {{Employee Name}} {{NOC Purpose}}.

This certificate is issued at the request of the employee for {{NOC Reason}} purposes only.

For AR Tech Solutions,

{{HR Name}}
{{HR Designation}}
Human Resources
```

---

## How to Add Your Own Template

### Method A — Upload your Word file directly
1. Write your letter in Microsoft Word
2. Use `{{Variable Name}}` wherever HR should fill something in
3. Save as `.docx`
4. In HRMS → Company Docs → Document Templates → New Template → Upload file
5. System detects all `{{variables}}` automatically, converts to snake_case
6. Review detected variables → Save

### Method B — Paste text directly
1. Copy any template above
2. In HRMS → Company Docs → Document Templates → New Template
3. Paste into the Content box
4. Variables are detected live as you type
5. Save

---

## Variable Quick Reference

| You write in Word             | Auto-detected as       | HR sees               |
|-------------------------------|------------------------|-----------------------|
| `{{Employee Name}}`           | `employee_name`        | Auto-filled from record |
| `{{Designation}}`             | `designation`          | Auto-filled           |
| `{{Department}}`              | `department`           | Auto-filled           |
| `{{Employee ID}}`             | `employee_id`          | Auto-filled           |
| `{{Joining Date}}`            | `joining_date`         | Date picker           |
| `{{Last Working Date}}`       | `last_working_date`    | Date picker           |
| `{{Letter Date}}`             | `letter_date`          | Date picker           |
| `{{Annual CTC}}`              | `annual_ctc`           | Text box              |
| `{{HR Name}}`                 | `hr_name`              | Text box              |
| `{{Notice Period}}`           | `notice_period`        | Text box              |
