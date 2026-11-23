import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { DocumentModel } from '../models/Document.js';
import { Candidate } from '../models/Candidate.js';
import { OnboardingTask } from '../models/OnboardingTask.js';
import { isMemoryMode, memoryStore } from '../config/db.js';
import { addChunksToVectorStore } from '../services/rag/vectorStore.js';
import { chunkText } from '../services/documents/chunker.js';

export async function seedInitialData() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('mgr123', 10);
  const employeePassword = await bcrypt.hash('emp123', 10);

  const demoUsers = [
    {
      name: 'Sarah Jenkins',
      email: 'admin@company.com',
      password: adminPassword,
      role: 'HR Admin',
      department: 'Human Resources',
      employeeId: 'EMP-1001',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    },
    {
      name: 'Marcus Vance',
      email: 'manager@company.com',
      password: managerPassword,
      role: 'Manager',
      department: 'Engineering Leadership',
      employeeId: 'EMP-1005',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    },
    {
      name: 'David Chen',
      email: 'employee@company.com',
      password: employeePassword,
      role: 'Employee',
      department: 'Engineering',
      employeeId: 'EMP-1002',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      name: 'Alex Rivera',
      email: 'alex.rivera@company.com',
      password: employeePassword,
      role: 'Employee',
      department: 'Product & Design',
      employeeId: 'EMP-1003',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    }
  ];

  const demoEmployees = [
    {
      employeeId: 'EMP-1001',
      name: 'Sarah Jenkins',
      email: 'admin@company.com',
      department: 'Human Resources',
      role: 'VP of Human Resources',
      joiningDate: '2021-03-15',
      status: 'Active',
      manager: 'Executive Team',
      phone: '+1 (555) 234-5678',
      location: 'New York HQ',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      onboardingProgress: 100
    },
    {
      employeeId: 'EMP-1005',
      name: 'Marcus Vance',
      email: 'manager@company.com',
      department: 'Engineering Leadership',
      role: 'Engineering Director',
      joiningDate: '2021-09-01',
      status: 'Active',
      manager: 'VP of Engineering',
      phone: '+1 (555) 345-6789',
      location: 'San Francisco Hub',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      onboardingProgress: 100
    },
    {
      employeeId: 'EMP-1002',
      name: 'David Chen',
      email: 'employee@company.com',
      department: 'Engineering',
      role: 'Senior Staff Engineer',
      joiningDate: '2022-08-01',
      status: 'Active',
      manager: 'Marcus Vance',
      phone: '+1 (555) 876-5432',
      location: 'San Francisco Hub',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      onboardingProgress: 100
    },
    {
      employeeId: 'EMP-1003',
      name: 'Alex Rivera',
      email: 'alex.rivera@company.com',
      department: 'Product & Design',
      role: 'Lead UI/UX Designer',
      joiningDate: '2026-08-01',
      status: 'Onboarding',
      manager: 'Sarah Jenkins',
      phone: '+1 (555) 432-1098',
      location: 'Remote',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      onboardingProgress: 71
    },
    {
      employeeId: 'EMP-1004',
      name: 'Priya Sharma',
      email: 'priya.sharma@company.com',
      department: 'Engineering',
      role: 'Backend Developer',
      joiningDate: '2026-07-15',
      status: 'Onboarding',
      manager: 'David Chen',
      phone: '+1 (555) 321-7654',
      location: 'Austin Office',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      onboardingProgress: 42
    }
  ];

  // Enterprise Documents Tagged by RBAC Clearance Tier
  const demoDocuments = [
    // TIER 1: ALL EMPLOYEES
    {
      title: 'Employee Handbook 2026',
      originalName: 'Employee_Handbook_2026.pdf',
      fileType: 'PDF',
      fileSize: 2450000,
      category: 'Company Guidelines',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.1',
      effectiveDate: '2026-01-01',
      content: `Section 1: General Code of Conduct
Employees must maintain high standard of professional ethics and mutual respect. Confidentiality of internal project codebases and client data must be strictly preserved.

Section 2: Work Hours and Remote Flexibility
Core business working hours are 9:00 AM to 5:00 PM EST. Employees may work remotely up to 3 days per week with manager approval. Flexible arrival window is between 8:00 AM and 10:00 AM.

Section 3: Equipment & Allowance
Each full-time employee is provided a high-end laptop, ergonomic desk setup allowance of $500, and $100 monthly internet reimbursement.`
    },
    {
      title: 'Paid Leave & Time Off Policy',
      originalName: 'Leave_Policy.pdf',
      fileType: 'PDF',
      fileSize: 1200000,
      category: 'Leave Policy',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '3.0',
      effectiveDate: '2026-01-01',
      content: `Section 3.1: Annual Paid Time Off (PTO)
Full-time employees receive 18 paid leaves per calendar year, accrued monthly at 1.5 days per month. Unused paid leaves can be carried forward up to a maximum limit of 10 days into the following calendar year.

Section 3.2: Sick Leave and Casual Leave
Employees receive 10 paid sick leaves and 6 casual emergency leaves annually. Medical certificate from a licensed practitioner is required for sick leave exceeding 3 consecutive business days.

Section 3.3: Parental & Maternity Leave
Primary caregivers are eligible for 16 weeks of fully paid parental leave. Secondary caregivers receive 6 weeks of fully paid leave.`
    },
    {
      title: 'Medical Insurance & Wellness Benefits',
      originalName: 'Medical_Benefits_2026.pdf',
      fileType: 'PDF',
      fileSize: 1850000,
      category: 'Benefits',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.4',
      effectiveDate: '2026-01-01',
      content: `Section 4.1: Health & Dental Coverage
Company provides comprehensive health insurance covering 100% of the employee premium and 80% of dependent premiums through BlueCross BlueShield. Annual deductible is $500 for individuals and $1,200 for families.

Section 4.2: Mental Health & Wellness Stipend
Employees are entitled to 8 free confidential counseling sessions annually through the Employee Assistance Program (EAP), plus a $60 monthly gym or wellness membership stipend.

Section 4.3: Prescription & Vision Benefits
Generic prescription drugs have a $10 co-pay. Vision coverage includes an annual $250 allowance for prescription glasses or contact lenses.`
    },
    {
      title: 'Work-From-Home & Hybrid Policy',
      originalName: 'Hybrid_Work_Policy.pdf',
      fileType: 'PDF',
      fileSize: 980000,
      category: 'Remote Work',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `Section 5.1: Hybrid Schedule Requirements
Employees in hybrid roles are expected in their designated regional office 2 days per week (typically Tuesday and Thursday for team collaboration).

Section 5.2: International Remote Work
Employees may work internationally from an approved country for up to 30 business days per calendar year with prior manager and People Operations written authorization.`
    },

    // TIER 2: MANAGERS & HR ADMIN ONLY
    {
      title: 'Manager Disciplinary & Performance Improvement Policy',
      originalName: 'Manager_Disciplinary_Guidelines.pdf',
      fileType: 'PDF',
      fileSize: 1420000,
      category: 'Management Guidelines',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Manager', 'HR Admin'],
      version: '1.2',
      effectiveDate: '2026-02-01',
      content: `CONFIDENTIAL: FOR MANAGERS & HR ONLY.
Section 1: Performance Improvement Plans (PIP)
A formal PIP must span 30 to 60 calendar days with weekly documented checkpoints. The employee must meet at least 80% of documented deliverables to exit the PIP successfully. Failure to do so initiates formal separation with standard 2 weeks severance.

Section 2: Disciplinary Warning Framework
Verbal counseling must precede a written warning. Two written warnings within a 12-month window allow the manager to request immediate role reassignment or termination review with HR approval.

Section 3: Mandatory Manager Check-ins
Managers are required to conduct bi-weekly 1:1 sessions and log milestone notes into the internal HRIS quarterly review tracker.`
    },
    {
      title: 'Engineering Department Promotion Bands & Merit Raise Matrix',
      originalName: 'Promotion_Merit_Matrix_2026.pdf',
      fileType: 'PDF',
      fileSize: 1100000,
      category: 'Compensation Strategy',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Manager', 'HR Admin'],
      version: '1.0',
      effectiveDate: '2026-01-15',
      content: `RESTRICTED: MANAGER CLEARANCE REQUIRED.
Section 1: Merit Raise Bands for Q1/Q2
- Rating 'Exceeds Expectations' (Top 15%): 8% to 12% annual salary increase.
- Rating 'Strong Performer' (Middle 70%): 4% to 6% annual salary increase.
- Rating 'Needs Development' (Bottom 15%): 0% increase, eligibility for coaching plan.

Section 2: Engineering Promotion Criteria
Promotion from Senior to Staff Engineer requires demonstrated cross-team architecture ownership, mentoring 2+ engineers, and department head sign-off.`
    },

    // TIER 3: HR ADMIN ONLY (HIGHLY SENSITIVE)
    {
      title: 'Executive Compensation Bands & Retention Bonuses 2026',
      originalName: 'Executive_Comp_Retention_2026.pdf',
      fileType: 'PDF',
      fileSize: 2100000,
      category: 'Executive Payroll & Strategy',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['HR Admin'],
      version: '1.0',
      effectiveDate: '2026-01-01',
      content: `STRICTLY CONFIDENTIAL: HR ADMIN CLEARANCE ONLY. UNAUTHORIZED ACCESS PROHIBITED.
Section 1: C-Suite & VP Compensation Schedules
- Vice President (L8): Base pay $285,000 - $340,000 | Annual target bonus: 35% | Equity grant: $150,000 RSUs vesting over 4 years.
- Senior Vice President (L9): Base pay $350,000 - $425,000 | Annual target bonus: 45% | Equity grant: $300,000 RSUs.
- Executive Committee: Base pay $450,000+ with customized retention packages.

Section 2: Key Personnel Retention Golden Handcuffs
Retention bonuses totaling $1.2M have been allocated for key technical leads subject to 24-month clawback if voluntary departure occurs before Q4 2027.`
    },
    {
      title: 'Confidential Workplace Harassment Investigation & Severance Protocols',
      originalName: 'Harassment_Investigation_Severance_2026.pdf',
      fileType: 'PDF',
      fileSize: 1750000,
      category: 'Legal & Compliance',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['HR Admin'],
      version: '1.1',
      effectiveDate: '2026-01-01',
      content: `STRICTLY CONFIDENTIAL: LEGAL & HR ADMIN ACCESS ONLY.
Section 1: Investigation Protocol for High-Severity Claims
All formal harassment or whistleblower complaints must trigger an independent investigation within 48 business hours led by external legal counsel. Identities of reporting individuals must remain anonymized under whistleblower protection laws.

Section 2: Executive Severance Formulas
In non-cause terminations for Director+ roles, severance defaults to 1 month of base pay per year of service (minimum 3 months, maximum 12 months) subject to mutual NDA and release of claims.`
    },
    // 7. TRAVEL & EXPENSES
    {
      title: 'Travel, Expense & Business Entertainment Policy',
      originalName: 'Travel_Expense_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 1450000,
      category: 'Finance & Travel',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Daily Meals and Per Diem Allowance
Employees traveling on approved company business are eligible for a daily meal per diem of $75 per day for domestic travel and $120 per day for international travel. Alcohol is not reimbursable unless entertaining external clients with VP pre-approval.

Section 2: Air Travel and Booking Class
Domestic flights must be booked in standard economy class at least 14 days in advance. Business class travel is permitted only for non-stop international flights exceeding 6 hours in duration with prior approval from the department VP.

Section 3: Lodging and Hotel Caps
Hotel accommodation reimbursement is capped at $250 per night in major metropolitan areas (New York, San Francisco, London, Tokyo) and $175 per night in all other regions, excluding taxes and resort fees.

Section 4: Expense Submissions and Receipts
All travel expense reports must be submitted via Concur within 30 days of the travel completion date. Itemized receipts are mandatory for any individual business expense exceeding $25.`
    },

    // 8. IT SECURITY & ACCEPTABLE USE
    {
      title: 'IT Security, Acceptable Use & BYOD Policy',
      originalName: 'IT_Security_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 1890000,
      category: 'Information Security',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '3.1',
      effectiveDate: '2026-01-01',
      content: `Section 1: Password Complexity and Multi-Factor Authentication (MFA)
Passwords must be a minimum of 14 characters, containing uppercase, lowercase, numbers, and symbols. Passwords must be rotated every 90 days. Multi-Factor Authentication via company-approved authenticator app or hardware Yubikey is mandatory for all internal corporate tools.

Section 2: Virtual Private Network (VPN) and Public Networks
Employees accessing corporate resources, customer databases, or staging environments remotely must connect through the corporate GlobalProtect VPN. Working from public Wi-Fi networks without an active VPN tunnel is strictly forbidden.

Section 3: Removable Media and Hardware Encryption
External USB storage devices and unencrypted external hard drives are disabled on all company laptops by default to prevent data exfiltration. BitLocker or FileVault full-disk encryption must remain enabled at all times.

Section 4: Incident Reporting and Lost Equipment
Any lost or stolen company equipment, suspected phishing attempt, or unauthorized security breach must be reported immediately to security@company.com within 2 hours of discovery to enable remote device wipe.`
    },

    // 9. ANTI-HARASSMENT & COMPLIANCE
    {
      title: 'Anti-Harassment, Equal Employment & Non-Retaliation Policy',
      originalName: 'Anti_Harassment_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 1100000,
      category: 'Compliance',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.5',
      effectiveDate: '2026-01-01',
      content: `Section 1: Zero-Tolerance Harassment and Discrimination
The company enforces zero tolerance for harassment, bullying, or discrimination based on race, gender, sexual orientation, disability, religion, or age. Violations result in immediate disciplinary action up to termination.

Section 2: Anonymous Reporting Hotline
Employees may report workplace concerns, ethics violations, or harassment anonymously through the 24/7 EthicsPoint hotline at 1-800-555-ETHIC or online at ethics.company.com.

Section 3: Investigation Timelines and Confidentiality
All formal complaints filed with Human Resources are acknowledged within 24 hours and investigated thoroughly within 14 business days. All parties involved are guaranteed confidentiality to the maximum extent possible.

Section 4: Strict Non-Retaliation Protection
Retaliation against any employee who files a good-faith report, participates in an investigation, or opposes unlawful practices is strictly prohibited and constitutes an independent fireable offense.`
    },

    // 10. TUITION REIMBURSEMENT
    {
      title: 'Professional Development & Tuition Reimbursement Policy',
      originalName: 'Tuition_Reimbursement_2026.pdf',
      fileType: 'PDF',
      fileSize: 950000,
      category: 'Professional Development',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.2',
      effectiveDate: '2026-01-01',
      content: `Section 1: Annual Tuition Assistance Allowance
Full-time employees who have completed at least 6 months of continuous service are eligible for up to $2,500 per calendar year in tuition reimbursement for accredited degree programs, professional certifications, or technical courses relevant to their career path.

Section 2: Course Approval and Grade Requirements
Courses must be pre-approved by the employee's direct manager and HR prior to enrollment. To receive reimbursement, employees must achieve a grade of 'B' or higher (or 'Pass' in pass/fail courses) and submit proof of payment within 45 days of course completion.

Section 3: Retention and Repayment Clawback
If an employee voluntarily resigns from the company within 12 months of receiving a tuition reimbursement payout, they must repay 100% of the funds disbursed during that 12-month period.

Section 4: Professional Conference Attendance
Each full-time employee is allotted up to 3 paid professional development days per year and up to $1,500 to attend industry conferences or workshops with department head approval.`
    },

    // 11. REFERRAL BONUS PROGRAM
    {
      title: 'Employee Talent Referral Program',
      originalName: 'Referral_Program_2026.pdf',
      fileType: 'PDF',
      fileSize: 820000,
      category: 'Recruiting',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Referral Bonus Payout Amounts
Employees referring qualified candidates who are hired into full-time roles receive cash referral bonuses: $3,500 for Senior, Staff, and Engineering Management roles; $2,000 for standard engineering and product roles; and $1,500 for all other corporate positions.

Section 2: Payout Milestones and Retention Schedule
Referral bonuses are paid in two equal installments: 50% on the new hire's first regular paycheck, and the remaining 50% after the referred employee successfully completes 90 calendar days of active employment.

Section 3: Candidate Eligibility and Tracking
The candidate must not have been previously interviewed or contacted by company recruiters in the preceding 6 months. Referrals must be submitted through the internal Greenhouse portal before the candidate submits an application.

Section 4: Ineligible Roles and Participants
Hiring managers referring candidates to their own direct reporting teams and members of the People Operations/Talent Acquisition team are ineligible for referral bonus payouts.`
    },

    // 12. SABBATICAL & EXTENDED LEAVE
    {
      title: 'Sabbatical & Extended Unpaid Leave Policy',
      originalName: 'Sabbatical_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 890000,
      category: 'Leave Policy',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Sabbatical Eligibility and Length
Full-time employees who achieve 5 consecutive years of service are eligible for a 4-week fully paid sabbatical. Sabbatical leave must be taken as a single continuous block and must be scheduled at least 6 months in advance with VP approval.

Section 2: Personal Unpaid Leave of Absence
Employees may request an unpaid personal leave of absence for up to 6 months for personal hardship, extended travel, or volunteer missions. Requests require written endorsement from the department head and VP of People Operations.

Section 3: Benefits Continuation During Unpaid Leave
For unpaid leaves exceeding 30 calendar days, the company will maintain healthcare coverage, but the employee must pay 100% of the active group rate premium directly to benefits administration.

Section 4: Job Restoration Guarantee
Employees returning from approved leave of 90 days or fewer are guaranteed restoration to their original role. For leaves between 91 and 180 days, the company will offer an equivalent role if the original position was backfilled.`
    },

    // 13. FSA & HSA GUIDELINES
    {
      title: 'Flexible Spending Accounts (FSA) & HSA Policy',
      originalName: 'FSA_HSA_Guidelines_2026.pdf',
      fileType: 'PDF',
      fileSize: 980000,
      category: 'Benefits',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.1',
      effectiveDate: '2026-01-01',
      content: `Section 1: Health Savings Account (HSA) Contributions
Employees enrolled in the High Deductible Health Plan (HDHP) are eligible for an HSA. The company contributes $500 annually for individual coverage and $1,000 for family coverage, deposited in quarterly installments. Annual IRS contribution limits apply.

Section 2: Healthcare Flexible Spending Account (FSA)
Employees in PPO plans may contribute up to $3,200 pretax per year to a Healthcare FSA. Up to $640 of unused Healthcare FSA funds may roll over into the subsequent plan year; all remaining unused balances are forfeited under IRS guidelines.

Section 3: Dependent Care FSA Limits
Eligible employees may contribute up to $5,000 per household per year to a Dependent Care FSA for qualifying childcare or eldercare expenses. Dependent care funds do not roll over and must be claimed by March 15 following the plan year.

Section 4: Eligible Medical and Wellness Expenses
HSA and Healthcare FSA debit cards may be used for prescription co-pays, dental procedures, vision care, and qualified over-the-counter wellness supplies without tax penalty.`
    },

    // 14. ERGONOMICS & WORKPLACE SAFETY
    {
      title: 'Workplace Health, Safety & Ergonomics Guidelines',
      originalName: 'Workplace_Safety_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 1150000,
      category: 'Health & Safety',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Ergonomic Equipment Stipend
All full-time remote and hybrid employees receive a one-time $500 ergonomic equipment stipend to purchase an ergonomic chair, standing desk converter, monitor arm, or wrist-support keyboard accessories.

Section 2: Virtual Ergonomic Assessments
Employees experiencing musculoskeletal discomfort may request a free 45-minute virtual ergonomic evaluation with a certified ergonomic specialist arranged through the People Operations safety team.

Section 3: Workplace Injury and Workers' Compensation
Any work-related physical injury or repetitive strain condition must be reported to HR and facilities within 24 hours of occurrence. Workers' compensation claims must be filed within 3 business days of medical evaluation.

Section 4: Office Emergency Evacuation and First Aid
Automated External Defibrillators (AEDs) and first aid kits are stationed on each floor adjacent to the central kitchen. Designated fire wardens coordinate semi-annual emergency evacuation drills.`
    },

    // 15. ENGINEERING ON-CALL & OVERTIME
    {
      title: 'Engineering On-Call, Overtime & Incident Response Policy',
      originalName: 'Engineering_OnCall_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 1320000,
      category: 'Engineering Guidelines',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.4',
      effectiveDate: '2026-01-01',
      content: `Section 1: Weekly On-Call Standby Stipends
Software engineers assigned to primary production on-call rotations receive a standby stipend of $450 per 7-day rotation. Secondary backup on-call engineers receive $200 per rotation, regardless of whether alerts are triggered.

Section 2: Incident Response Payouts and Overtime Multipliers
Non-exempt engineers actively responding to Sev-1 or Sev-2 system outages outside standard business hours are compensated at 1.5 times their regular hourly rate, with a guaranteed minimum 1-hour billing increment per page.

Section 3: Mandatory Compensatory Rest Time (Comp Day)
If an engineer on primary on-call spends more than 3 cumulative hours resolving critical production outages between 12:00 AM and 6:00 AM, they are entitled to take the following business day as a paid compensatory rest day.

Section 4: Pager Duty Rotation Caps and Fairness
Engineers cannot be scheduled for primary on-call more frequently than one week out of every four weeks. Teams must maintain a minimum rotation pool of 4 qualified engineers before establishing a 24/7 on-call tier.`
    },

    // 16. INTELLECTUAL PROPERTY & OPEN SOURCE
    {
      title: 'Intellectual Property, Patent & Open Source Policy',
      originalName: 'IP_OpenSource_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 1420000,
      category: 'Legal & Intellectual Property',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.1',
      effectiveDate: '2026-01-01',
      content: `Section 1: Invention Assignment and Work-for-Hire
All inventions, source code, patents, algorithms, and designs conceived, developed, or reduced to practice during employment that relate to company business are the exclusive property of the company under standard work-for-hire provisions.

Section 2: Patent Incentive and Cash Bonus Program
Employees who submit patent disclosure ideas approved by the Patent Review Committee receive a $2,000 cash bonus upon formal USPTO patent application filing, and an additional $3,000 cash award upon patent issuance.

Section 3: Open Source Software Contributions
Employees wishing to contribute code to external open-source projects or release internal tools as open source must obtain written authorization from the Open Source Review Board (OSRB) to protect proprietary secrets.

Section 4: Moonlighting and Personal Projects
Personal side projects are permitted provided they are conducted strictly outside business hours, do not utilize company-issued laptops or cloud infrastructure, and do not compete directly with company product lines.`
    },
    // 17. NEAR-DUPLICATE: CONTRACTOR LEAVE & EXPENSE RESTRICTIONS
    {
      title: 'Contractor, Freelancer & Temporary Worker Guidelines',
      originalName: 'Contractor_Guidelines_2026.pdf',
      fileType: 'PDF',
      fileSize: 850000,
      category: 'Contractor Compliance',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Ineligibility for Paid Leave and PTO
Independent 1099 contractors, staff augmentation workers, and freelance consultants are strictly ineligible for company-paid leave, annual PTO accrual, paid sick leave, or holiday pay. Any time taken away from client deliverables is uncompensated.

Section 2: Equipment and Business Expense Restrictions
Contractors are expected to provide their own personal computing hardware. Company-issued laptops are provided only when mandated by customer security audits. Contractors are not eligible for home office stipends or cell phone allowances.

Section 3: Absence Notification Requirements
Contractors planning planned absences exceeding 2 consecutive business days must notify the supervising engagement manager at least 10 business days in advance to ensure project continuity.`
    },

    // 18. NEAR-DUPLICATE: PART-TIME & INTERN LEAVE
    {
      title: 'Part-Time Staff & Seasonal Intern Benefits Guidelines',
      originalName: 'PartTime_Intern_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 720000,
      category: 'Leave Policy',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.2',
      effectiveDate: '2026-01-01',
      content: `Section 1: Part-Time Employee Paid Sick Leave Accrual
Part-time employees working fewer than 30 hours per week accrue 1 hour of paid sick leave for every 30 hours worked, up to an annual maximum cap of 40 hours. Part-time staff do not accrue standard vacation PTO.

Section 2: Summer Intern Time Off Rules
Seasonal summer interns receive 2 paid personal days during their 12-week internship program. Unused personal days cannot be paid out upon internship conclusion or rolled forward into full-time offers.

Section 3: Healthcare Eligibility for Part-Time Staff
Part-time staff maintaining an average of 25 to 29 weekly hours over a 90-day measurement period are eligible for company medical insurance at standard employee contribution tiers.`
    },

    // 19. NEAR-DUPLICATE: CALIFORNIA STATE LEAVE ADDENDUM
    {
      title: 'California State Specific Employment & Leave Addendum',
      originalName: 'California_Leave_Addendum_2026.pdf',
      fileType: 'PDF',
      fileSize: 910000,
      category: 'Compliance',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.1',
      effectiveDate: '2026-01-01',
      content: `Section 1: California Mandatory Paid Sick Leave (SB 616)
Employees resident in California receive 5 days (40 hours) of mandatory paid sick leave frontloaded annually on January 1st, usable after 90 days of employment for self-care or designated family members.

Section 2: California PTO Payout at Separation
Under California Labor Code Section 227.3, all accrued, unused paid time off is considered earned wages and must be paid out in full on the employee's final paycheck upon voluntary or involuntary termination.

Section 3: California Family Rights Act (CFRA) Leave
Eligible California employees with 12 months of service may take up to 12 weeks of job-protected, unpaid family care and medical leave annually for family bonding or serious health conditions.`
    },

    // 20. VOCABULARY DISTRACTOR: IT ASSET RETURN ON ADMINISTRATIVE LEAVE
    {
      title: 'IT Asset Recovery & Suspension Protocol',
      originalName: 'IT_Asset_Suspension_Protocol.pdf',
      fileType: 'PDF',
      fileSize: 840000,
      category: 'Information Security',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.5',
      effectiveDate: '2026-01-01',
      content: `Section 1: Hardware Custody During Administrative Leave
When an employee is placed on formal administrative leave pending an HR investigation, all company-issued laptops, access badges, and mobile devices must be surrendered to the facilities security desk within 4 hours.

Section 2: Immediate Remote Credential Suspension
IT security will immediately disable Google Workspace, Slack, VPN, and GitHub access upon receiving an automated suspension ticket from People Operations. Email forwarding is redirected to the department VP.

Section 3: Equipment Courier Return Process
For remote employees on leave, IT will dispatch a prepaid, insured FedEx shipping box for safe hardware return within 48 business hours.`
    },

    // 21. VOCABULARY DISTRACTOR: PROCUREMENT APPROVAL MATRIX (MANAGERS ONLY)
    {
      title: 'Procurement & Vendor Approval Authority Matrix',
      originalName: 'Procurement_Authority_Matrix_2026.pdf',
      fileType: 'PDF',
      fileSize: 980000,
      category: 'Finance & Procurement',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Manager', 'HR Admin'],
      version: '3.0',
      effectiveDate: '2026-01-01',
      content: `CONFIDENTIAL: MANAGER CLEARANCE REQUIRED.
Section 1: Spend Approval Thresholds by Role
- Engineering Managers: Authority up to $10,000 for SaaS tools and contractor invoices.
- Directors: Authority up to $50,000 with Finance department sign-off.
- Vice Presidents: Authority up to $250,000 for annual enterprise vendor contracts.

Section 2: Required Purchase Order (PO) Procedures
Any software purchase exceeding $2,500 requires a pre-approved Purchase Order generated in Coupa prior to signing vendor agreements. Split invoicing to bypass approval tiers is strictly prohibited.`
    },

    // 22. DISTRACTOR: PHYSICAL OFFICE SECURITY & BADGES
    {
      title: 'Physical Office Security, Visitor & Badge Policy',
      originalName: 'Office_Security_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 760000,
      category: 'Facilities & Safety',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.3',
      effectiveDate: '2026-01-01',
      content: `Section 1: Mandatory Badge Access and Tailgating Rules
All staff must visibly display their RFID security badges when entering company facilities. Holding open security turnstiles for unbadged individuals (tailgating) constitutes a security violation subject to review.

Section 2: Visitor Registration and Escort Requirements
All external guests, family members, and interview candidates must register at the reception iPad, sign the non-disclosure agreement (NDA), and remain escorted by a full-time employee at all times.

Section 3: After-Hours Office Access and Weekend Security
Employees requiring building access between 8:00 PM and 6:00 AM or on weekends must submit an after-hours request through facilities ticketing at least 24 hours prior.`
    },

    // 23. DISTRACTOR: CUSTOMER SUPPORT REFUND & DISCRETIONARY TIERS
    {
      title: 'Customer Support Escalation & Discretionary Refund Guidelines',
      originalName: 'Support_Escalation_SLA.pdf',
      fileType: 'PDF',
      fileSize: 1050000,
      category: 'Operations',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Support Specialist Discretionary Credits
Tier 1 Customer Support Specialists are authorized to issue discretionary billing credits of up to $100 per customer without managerial sign-off to resolve billing disputes.

Section 2: Escalation to Support Management
Billing disputes exceeding $100 up to $1,000 require written authorization from a Support Operations Lead or Manager within 4 business hours.

Section 3: Response Time SLAs for Enterprise Customers
Enterprise Tier customers are guaranteed an initial ticket response within 15 minutes for Sev-1 critical outages and within 2 hours for standard billing inquiries.`
    },

    // 24. DISTRACTOR: GLOBAL RELOCATION & IMMIGRATION
    {
      title: 'Global Mobility, Relocation & Visa Sponsorship Policy',
      originalName: 'Global_Mobility_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 1250000,
      category: 'Immigration & Relocation',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.2',
      effectiveDate: '2026-01-01',
      content: `Section 1: Corporate Relocation Lump-Sum Allowances
Full-time employees relocating at company request receive a relocation package: $10,000 lump sum for interstate moves and $20,000 for international relocations, plus 30 days of corporate temporary housing.

Section 2: H-1B and O-1 Visa Sponsorship Eligibility
The company sponsors H-1B, TN, and O-1 employment visas for full-time technical and product roles. Legal and filing fees are fully covered by the company through designated immigration counsel.

Section 3: Permanent Residency (Green Card) Sponsorship Timeline
Permanent residency sponsorship (EB-2/EB-3 PERM process) is initiated after an employee completes 12 continuous months of successful performance with manager endorsement.`
    },

    // 25. DISTRACTOR: SALES COMMISSION & QUOTA POLICY
    {
      title: 'Sales Commission & Incentive Compensation Plan',
      originalName: 'Sales_Compensation_Plan_2026.pdf',
      fileType: 'PDF',
      fileSize: 1350000,
      category: 'Sales Guidelines',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '3.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: On-Target Earnings (OTE) and Split Structures
Account Executives operate under a 50/50 base pay to commission split. Commissions are calculated monthly based on closed-won Annual Contract Value (ACV) and paid on the second payroll following deal close.

Section 2: Quota Accelerator Thresholds
Account Executives exceeding 100% of their quarterly quota unlock accelerated commission rates of 1.5x on all subsequent closed revenue during that quarter.

Section 3: Customer Churn Clawback Provisions
If a customer cancels or demands a full refund within 90 days of contract execution, the commission credited on that deal is clawed back against future commission disbursements.`
    },

    // 26. CONFIDENTIAL RBAC: GOLDEN PARACHUTES & CLAWBACKS (HR ADMIN ONLY)
    {
      title: 'Executive Severance, Change-in-Control & Clawback Agreement',
      originalName: 'Executive_Severance_Clawback_2026.pdf',
      fileType: 'PDF',
      fileSize: 1120000,
      category: 'Executive Legal',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['HR Admin'],
      version: '1.0',
      effectiveDate: '2026-01-01',
      content: `STRICTLY CONFIDENTIAL: HR ADMIN CLEARANCE ONLY.
Section 1: Double-Trigger Change in Control Golden Parachutes
In the event of a corporate acquisition or merger, C-suite executives terminated without cause within 12 months receive 18 months of base salary continuation and 100% accelerated equity vesting.

Section 2: Executive Compensation Clawback (Dodd-Frank Compliance)
In the event of an accounting restatement due to material noncompliance, the Board Compensation Committee is legally mandated to recover any excess incentive-based compensation paid to executive officers during the 3 preceding fiscal years.`
    },
    // 27. ETHICS & WHISTLEBLOWER
    {
      title: 'Whistleblower Protection & Ethics Escalation Policy',
      originalName: 'Whistleblower_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 890000,
      category: 'Legal & Ethics',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Protected Disclosure Categories
Employees who report good-faith suspicions of securities fraud, accounting irregularities, environmental hazards, or gross misconduct are classified as Protected Whistleblowers under Sarbanes-Oxley guidelines.

Section 2: Multi-Channel Confidential Reporting
Whistleblower reports may be submitted through the independent Audit Committee portal at audit.company.com or delivered directly to General Counsel. Anonymous reporting is protected by end-to-end encrypted ticketing.

Section 3: Mandatory Audit Committee Notification
Any allegation involving senior directors or financial reporting must be transmitted directly to the Chair of the Audit Committee within 48 hours without alerting executive management.`
    },

    // 28. GIFTS & ANTI-BRIBERY
    {
      title: 'Corporate Gift, Entertainment & Anti-Bribery (FCPA) Policy',
      originalName: 'Anti_Bribery_FCPA_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 920000,
      category: 'Compliance',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '3.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Nominal Gift Thresholds
Employees may not accept or offer individual gifts, favors, or promotional items exceeding a fair market value of $75 from any single vendor, customer, or partner during a calendar year.

Section 2: Foreign Corrupt Practices Act (FCPA) Strict Compliance
Offering, promising, or authorizing anything of value directly or indirectly to foreign government officials or state-owned enterprise employees to secure business advantage is illegal under federal law.

Section 3: Conflict of Interest Disclosure Registry
Any personal relationship, financial interest in a supplier, or outside consulting agreement must be declared annually in the Compliance Disclosure Registry managed by Legal.`
    },

    // 29. SOCIAL MEDIA & PR
    {
      title: 'Social Media, Communications & Public Relations Policy',
      originalName: 'Social_Media_PR_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 780000,
      category: 'Communications',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.2',
      effectiveDate: '2026-01-01',
      content: `Section 1: Official Corporate Spokesperson Exclusivity
Only designated Communications Team members and executive officers are authorized to speak on behalf of the company to journalists, podcast hosts, or financial analysts.

Section 2: Personal Social Media Disclaimers
Employees publishing personal opinions on industry topics on LinkedIn, X, or personal blogs must include the standard disclaimer: 'Views and opinions expressed are solely my own and do not represent my employer.'

Section 3: Leakage of Unannounced Product Features
Posting screenshots of internal Slack channels, Figma mockups, or unannounced roadmap milestones on social media platforms constitutes an intentional breach of company confidentiality.`
    },

    // 30. DATA PRIVACY & GDPR
    {
      title: 'Customer Data Privacy, GDPR & CCPA Compliance Policy',
      originalName: 'Privacy_GDPR_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 1350000,
      category: 'Information Security',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '3.1',
      effectiveDate: '2026-01-01',
      content: `Section 1: Data Subject Access Requests (DSAR)
Customer requests for personal data access, portability, or account deletion under GDPR and CCPA must be routed to privacy@company.com and completed within 30 calendar days.

Section 2: Personally Identifiable Information (PII) Redaction
Customer names, email addresses, credit card tokens, and phone numbers must never be pasted into developer staging logs, bug tracking tickets, or unencrypted analytical data dumps.

Section 3: Third-Party Data Processing Agreements (DPA)
Engineering teams may not transmit customer data to new third-party cloud vendors or AI APIs without an executed Data Processing Agreement reviewed by the Data Protection Officer.`
    },

    // 31. REMOTE WORK TAX & MULTI-STATE
    {
      title: 'Remote Work Tax Nexus & Multi-State Compliance Policy',
      originalName: 'Remote_Tax_Nexus_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 870000,
      category: 'Finance & Tax',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.4',
      effectiveDate: '2026-01-01',
      content: `Section 1: Mandatory Home State Address Notification
Remote employees must maintain an accurate physical residence address with payroll. Moving across state lines triggers state payroll tax withholding updates and corporate employer tax registrations.

Section 2: Working Abroad (Digital Nomad Limitations)
Employees in good standing may work internationally from an approved foreign country for up to 30 cumulative business days per calendar year with advance written approval from their manager and HR.

Section 3: High-Risk Jurisdictions Prohibited
Working remotely from sanctioned countries or jurisdictions without tax treaty agreements is strictly prohibited due to severe corporate legal exposure and export control laws.`
    },

    // 32. GYM & NUTRITION STIPEND
    {
      title: 'Health & Wellness Lifestyle Spending Account (LSA) Guidelines',
      originalName: 'Lifestyle_Spending_Account_2026.pdf',
      fileType: 'PDF',
      fileSize: 690000,
      category: 'Benefits',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.1',
      effectiveDate: '2026-01-01',
      content: `Section 1: Monthly Wellness Allocation
Full-time employees receive a $60 monthly Lifestyle Spending Account credit through the Forma platform to spend on qualified fitness memberships, yoga classes, or wellness subscriptions.

Section 2: Eligible Wellness Categories
Funds may be used for gym passes, home fitness equipment, marathon registration fees, meditation apps (Headspace/Calm), and nutritional counseling sessions.

Section 3: Taxable Fringe Benefit Classification
Unlike Health Savings Accounts, LSA reimbursements are classified as taxable wage benefits under IRS guidelines and appear as imputed income on regular employee W-2 paystubs.`
    },

    // 33. CORPORATE CREDIT CARDS
    {
      title: 'Corporate Credit Card Issuance & Reconciliation SOP',
      originalName: 'Corporate_Card_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 940000,
      category: 'Finance',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.4',
      effectiveDate: '2026-01-01',
      content: `Section 1: Corporate Card Eligibility and Limits
Employees who travel at least twice per quarter or manage departmental software subscriptions are eligible for a corporate credit card with a default monthly limit of $5,000.

Section 2: Strict Ban on Personal Purchases
Using corporate cards for personal expenses is strictly prohibited. Accidental personal transactions must be flagged immediately in Expensify and reimbursed via payroll deduction.

Section 3: Monthly Statement Reconciliation Deadlines
All corporate card charges must be categorized with attached digital receipts by the 10th business day following month-end. Unreconciled accounts are subject to card suspension.`
    },

    // 34. SOFTWARE PROCUREMENT (MANAGERS ONLY)
    {
      title: 'Enterprise Software Procurement & SaaS Management SOP',
      originalName: 'SaaS_Procurement_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 1100000,
      category: 'Procurement',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `CONFIDENTIAL: MANAGER CLEARANCE REQUIRED.
Section 1: Shadow IT Ban and Architecture Approval
Engineering and product managers may not sign up for external developer APIs, database hosts, or generative AI services without approval from the Security Review Board.

Section 2: Contract Auto-Renewal Notifications
Department leads must notify IT Procurement at least 60 days prior to any vendor auto-renewal date to initiate competitive bidding or contract renegotiation.

Section 3: Single Sign-On (SSO) and SCIM Requirements
Any enterprise tool storing employee records or company intellectual property must support SAML 2.0 Single Sign-On and SCIM automated deprovisioning.`
    },

    // 35. DISASTER RECOVERY & CLOSURES
    {
      title: 'Disaster Recovery, Severe Weather & Office Closure Protocol',
      originalName: 'Disaster_Recovery_Protocol_2026.pdf',
      fileType: 'PDF',
      fileSize: 820000,
      category: 'Facilities & Safety',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.2',
      effectiveDate: '2026-01-01',
      content: `Section 1: Severe Weather Facility Closure Authority
The Facilities Director and VP of Operations are the sole authorities empowered to declare physical office closures due to blizzards, hurricanes, or local state emergencies.

Section 2: Emergency Alert Notification Broadcasts
Facility closures, power outages, and emergency safety directives are broadcast simultaneously via the Everbridge mass emergency notification system via SMS and phone.

Section 3: Pay Continuity During Emergency Shutdowns
Non-exempt hourly employees scheduled to work at facilities undergoing emergency weather closures are guaranteed up to 3 days of regular emergency closure pay.`
    },

    // 36. PERFORMANCE REVIEW CYCLE
    {
      title: 'Annual Performance Review, 360 Feedback & Merit Cycle Guide',
      originalName: 'Performance_Review_Guide_2026.pdf',
      fileType: 'PDF',
      fileSize: 1180000,
      category: 'People Operations',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '3.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Bi-Annual Review Timeline
Formal performance reviews occur twice per year: Mid-Year Check-in during July and the Annual Merit Cycle during December. Self-evaluations must be submitted by December 10th.

Section 2: Peer Feedback Nominations and Confidentiality
Employees nominate 3 to 5 cross-functional peer reviewers in CultureAmp. Peer review comments are synthesized anonymously by the direct manager to protect peer relationships.

Section 3: Performance Calibration Committee Standards
To eliminate manager grading bias, department heads participate in calibration committees to standardize rating distributions across team divisions.`
    },

    // 37. SUPPORT TICKET SLAS
    {
      title: 'Customer Support SLA & Incident Triage Matrix',
      originalName: 'Support_SLA_Matrix_2026.pdf',
      fileType: 'PDF',
      fileSize: 960000,
      category: 'Customer Operations',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.3',
      effectiveDate: '2026-01-01',
      content: `Section 1: Severity Level Definitions
- Sev-1 Critical: Core production platform down for all users. Response SLA: 15 minutes.
- Sev-2 Major: Essential customer features degraded without workaround. Response SLA: 1 hour.
- Sev-3 Minor: Non-critical cosmetic bug or general product inquiry. Response SLA: 8 business hours.

Section 2: Incident Commander Escalation Protocols
When a Sev-1 outage is declared, the on-duty support lead immediately pages the Engineering Incident Commander and creates a live war-room Zoom channel.

Section 3: Customer Service Credit Penalty Clauses
If enterprise platform uptime drops below 99.9% in a given month, customers receive a 10% monthly service credit upon formal request within 30 days.`
    },

    // 38. SALES SPIFFS & BONUSES
    {
      title: 'Sales SPIFF, Sales Contest & Quarterly Incentive Rules',
      originalName: 'Sales_SPIFF_Rules_2026.pdf',
      fileType: 'PDF',
      fileSize: 850000,
      category: 'Sales Guidelines',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.5',
      effectiveDate: '2026-01-01',
      content: `Section 1: Quarterly Sales SPIFF Announcements
Special Performance Incentive Funds (SPIFFs) are temporary incentive bonuses sponsored by sales leadership to accelerate strategic product lines or quarterly revenue targets.

Section 2: Deal Validation and Signed Contract Mandate
SPIFF bonuses are payable only upon receipt of fully executed customer contracts and credit approval. Letter of Intent (LOI) documents are strictly ineligible for incentive payouts.

Section 3: Dispute Resolution and Sales VP Discretion
Any commission splits, territorial account disputes, or SPIFF qualification disagreements are reviewed and decided by the VP of Worldwide Sales, whose determination is final.`
    },

    // 39. ENGINEERING CODE STANDARDS
    {
      title: 'Engineering Code Review, CI/CD & Branching Standards',
      originalName: 'Engineering_Standards_2026.pdf',
      fileType: 'PDF',
      fileSize: 1420000,
      category: 'Engineering Guidelines',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '4.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Mandatory Peer Code Review Approvals
All pull requests merging into main must receive at least 2 approvals from senior team members and must pass all automated SonarQube static security checks.

Section 2: Production Deployment Windows and Freezes
Deployments to production environments are restricted to Monday through Thursday between 9:00 AM and 3:00 PM EST. Zero Friday afternoon deployments are permitted.

Section 3: Automated Unit and Integration Test Coverage
Pull requests causing automated code coverage to drop below 80% on core backend microservices are automatically blocked by the GitHub Actions CI pipeline.`
    },

    // 40. COMMUTER & TRANSIT BENEFITS
    {
      title: 'Workplace Commuter Benefits, Parking & Transit Subsidies',
      originalName: 'Commuter_Benefits_2026.pdf',
      fileType: 'PDF',
      fileSize: 760000,
      category: 'Benefits',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.3',
      effectiveDate: '2026-01-01',
      content: `Section 1: Pretax Transit and Vanpool Deductions
Employees commuting to corporate hub offices may deduct up to $315 per month pretax through payroll for qualified public transit passes, commuter trains, or vanpool passes.

Section 2: Electric Vehicle (EV) Charging at Hub Offices
Level-2 EV charging stations are available on a complimentary first-come, first-served basis in company parking structures, with a maximum charging duration of 4 hours per day.

Section 3: Bicycle Commuter Subsidy Program
Employees who commute by bicycle at least 10 days per month receive a $30 monthly bike maintenance credit for tune-ups, helmets, and flat tire repairs.`
    },

    // 41. EXECUTIVE SUCCESSION (CONFIDENTIAL HR ADMIN ONLY)
    {
      title: 'Executive Leadership Succession & Board Governance Plan',
      originalName: 'Executive_Succession_Plan_2026.pdf',
      fileType: 'PDF',
      fileSize: 1650000,
      category: 'Executive Governance',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['HR Admin'],
      version: '1.0',
      effectiveDate: '2026-01-01',
      content: `STRICTLY CONFIDENTIAL: HR ADMIN CLEARANCE ONLY.
Section 1: Emergency CEO Succession Order of Precedence
In the event of sudden CEO incapacitation, executive authority immediately passes to the Chief Operating Officer, followed sequentially by the Chief Financial Officer and General Counsel.

Section 2: Executive Retention Grant Golden Handcuffs
Senior Vice Presidents critical to corporate continuity receive multi-year retention RSUs with double-trigger change-of-control acceleration clauses valued up to 200% of base salary.`
    },


    // 42. 401(K) SAFE HARBOR & ROTH CONVERSION
    {
      title: '401(k) Retirement Plan, Safe Harbor Match & Roth Guidelines',
      originalName: '401k_Plan_Document_2026.pdf',
      fileType: 'PDF',
      fileSize: 1200000,
      category: 'Benefits',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '3.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Company Safe Harbor 4% Matching
The company provides a 100% dollar-for-dollar match on the first 4% of employee salary deferrals through Fidelity Investments. Employer matching contributions are 100% immediately vested with zero tenure vesting cliffs.

Section 2: Pretax Deferrals and Annual IRS Ceilings
Full-time employees may contribute up to the annual IRS elective deferral limit of $23,500. Employees aged 50 and older are eligible for an additional $7,500 catch-up contribution.

Section 3: Mega-Backdoor Roth and In-Plan Conversions
The plan supports after-tax voluntary contributions up to the Section 415(c) limit and automated daily in-plan Roth conversion sweeps without distribution tax penalties.`
    },

    // 43. EMPLOYEE STOCK PURCHASE PLAN (ESPP)
    {
      title: 'Employee Stock Purchase Plan (ESPP) Offering Rules',
      originalName: 'ESPP_Offering_Rules_2026.pdf',
      fileType: 'PDF',
      fileSize: 1100000,
      category: 'Equity & Compensation',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: 15% Purchase Discount and Lookback Provision
Eligible employees may purchase company common stock at a 15% discount to the lower of the fair market value at the enrollment date or the purchase date under Section 423 guidelines.

Section 2: Semi-Annual Offering Periods and Payroll Deductions
Offering periods run semi-annually from January 1 to June 30 and July 1 to December 31. Employees may contribute between 1% and 15% of net base salary up to the $25,000 statutory calendar year cap.

Section 3: Disqualifying vs Qualifying Dispositions
Shares held for at least 2 years from the offering grant date and 1 year from the purchase exercise date qualify for favorable capital gains tax rates upon sale.`
    },

    // 44. BEREAVEMENT & COMPASSIONATE LEAVE
    {
      title: 'Bereavement, Compassionate Travel & Funeral Leave Policy',
      originalName: 'Bereavement_Leave_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 750000,
      category: 'Leave Policy',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.2',
      effectiveDate: '2026-01-01',
      content: `Section 1: Immediate Family Bereavement Allowance
Employees are granted up to 5 consecutive business days of fully paid bereavement leave in the event of the loss of an immediate family member (spouse, child, parent, sibling, or domestic partner).

Section 2: Extended and Non-Immediate Family Bereavement
Up to 3 consecutive paid days are allotted for grandparents, grandchildren, aunts, uncles, or in-laws. Additional unpaid compassionate days may be authorized by HR.

Section 3: Compassionate Travel Expense Subsidies
If travel exceeding 500 miles is required to attend funeral services, employees may expense up to $500 in airfare assistance with department head approval.`
    },

    // 45. JURY DUTY & WITNESS LEAVE
    {
      title: 'Jury Duty, Subpoena Witness & Court Appearance Policy',
      originalName: 'Jury_Duty_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 680000,
      category: 'Compliance',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.1',
      effectiveDate: '2026-01-01',
      content: `Section 1: Paid Jury Duty Wage Continuation
The company provides up to 10 business days of full regular salary continuation when an employee is summoned for mandatory state or federal jury duty.

Section 2: Subpoena and Expert Witness Leaves
Employees subpoenaed as non-party witnesses in civil or criminal proceedings receive paid court leave. Time spent testifying in cases against the company is unpaid.

Section 3: Summons Submission and Verification Proof
Employees must furnish a copy of their jury summons notice to HR within 48 hours of receipt and provide court attendance validation receipts upon return.`
    },

    // 46. VOLUNTEER & COMMUNITY SERVICE
    {
      title: 'Volunteer Time Off (VTO) & Community Outreach Program',
      originalName: 'Volunteer_Time_Off_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 720000,
      category: 'Culture & Leave',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Annual 16-Hour Paid Volunteer Allocation
Each full-time employee receives 16 hours of paid Volunteer Time Off (VTO) per calendar year to support qualified 501(c)(3) nonprofit organizations and community charities.

Section 2: Team Volunteer Days and Group Outings
Departmental managers may schedule designated team volunteer days to partner with local food banks, environmental cleanups, or educational STEM tutoring initiatives.

Section 3: 1-to-1 Corporate Charitable Donation Matching
The company matches employee charitable donations dollar-for-dollar up to a maximum limit of $1,000 per employee per year through the Benevity giving portal.`
    },

    // 47. RTO & ADA REASONABLE ACCOMMODATIONS
    {
      title: 'Workplace Accommodations, ADA & Medical Exemption SOP',
      originalName: 'ADA_Accommodation_SOP_2026.pdf',
      fileType: 'PDF',
      fileSize: 940000,
      category: 'Compliance',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.4',
      effectiveDate: '2026-01-01',
      content: `Section 1: Interactive Process for Medical Accommodations
Employees requesting physical workplace accommodations or hybrid RTO exemptions under the Americans with Disabilities Act (ADA) participate in an interactive review with HR.

Section 2: Qualified Healthcare Provider Documentation
Medical certification must verify functional limitations and suggest appropriate reasonable accommodations without disclosing confidential diagnosis details.

Section 3: Interim Accommodation Protections
While an accommodation review is actively pending, temporary flexible arrangements will remain in place to protect employee wellness and productivity.`
    },

    // 48. SUBSTANCE ABUSE & EAP
    {
      title: 'Drug-Free Workplace, Substance Abuse & Assistance Policy',
      originalName: 'Drug_Free_Workplace_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 820000,
      category: 'Health & Safety',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.3',
      effectiveDate: '2026-01-01',
      content: `Section 1: Prohibition of Intoxicants During Business Hours
The manufacture, distribution, possession, or impairment by alcohol or illegal narcotics on company premises or during client working engagements is prohibited.

Section 2: Confidential Self-Referral and Rehabilitation Leave
Employees seeking assistance for substance dependency may request a confidential medical leave of absence to enter licensed residential rehabilitation programs without employment penalty.

Section 3: Reasonable Suspicion Testing Standards
Observed signs of physical intoxication or dangerous motor impairment in safety-sensitive environments trigger mandatory testing conducted by certified occupational clinics.`
    },

    // 49. REPAIR & HARDWARE REFRESH
    {
      title: 'Hardware Refresh Cycles, Damage & Peripheral Allocation',
      originalName: 'Hardware_Refresh_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 910000,
      category: 'IT Hardware',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.1',
      effectiveDate: '2026-01-01',
      content: `Section 1: 3-Year Laptop Upgrade Lifecycle
Full-time technical employees are issued modern Apple Silicon MacBook Pro or Dell Precision hardware, scheduled for mandatory complete replacement every 36 months.

Section 2: Accidental Damage and AppleCare Protection
All company laptops are covered by AppleCare+ or Dell ProSupport. Accidental liquid spills or screen fractures must be reported to IT ticketing within 24 hours.

Section 3: Purchase of Depreciated Laptops at Separation
Employees in good standing who separate after completing 2 continuous years may purchase their decommissioned laptop for its depreciated book value of $150 after IT wiping.`
    },

    // 50. RELOCATION REPAYMENT NOTE
    {
      title: 'Relocation Expense Repayment & Retention Agreement',
      originalName: 'Relocation_Repayment_Agreement_2026.pdf',
      fileType: 'PDF',
      fileSize: 770000,
      category: 'HR Legal',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.4',
      effectiveDate: '2026-01-01',
      content: `Section 1: 24-Month Prorated Clawback Schedule
Employees receiving relocation allowances execute a promissory note: 100% repayment if voluntarily departing within 12 months, and 50% repayment if departing between 13 and 24 months.

Section 2: Automatic Involuntary Termination Waiver
Repayment obligations are automatically waived in full if the employee is separated due to company restructuring, facility closure, or position elimination without cause.

Section 3: Deductions from Final Wages
To the maximum extent permitted under state labor law, outstanding relocation balances are deducted from final payroll distributions upon resignation.`
    },

    // 51. OVERTIME & NON-EXEMPT HOURS
    {
      title: 'FLSA Overtime, Timekeeping & Meal Break Guidelines',
      originalName: 'FLSA_Overtime_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 850000,
      category: 'Payroll & Compliance',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Non-Exempt Timekeeping and Clocking
Hourly non-exempt employees must accurately record daily start times, lunch breaks, and departure times in ADP Time & Attendance. Off-the-clock work is prohibited.

Section 2: 1.5x Overtime Pay Authorization
Hours worked in excess of 40 hours in a single payroll workweek are compensated at one and one-half times the regular hourly rate. Overtime must be pre-approved by direct supervisors.

Section 3: Mandatory 30-Minute Meal Periods
Non-exempt staff working shifts longer than 5 hours must take an uninterrupted, duty-free 30-minute unpaid meal break prior to the start of the sixth hour.`
    },

    // 52. DRESS CODE & WORKPLACE ATTIRE
    {
      title: 'Workplace Grooming, Attire & Customer-Facing Standards',
      originalName: 'Workplace_Attire_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 640000,
      category: 'Workplace Guidelines',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.2',
      effectiveDate: '2026-01-01',
      content: `Section 1: Everyday Smart Casual Standard
The company operates under a comfortable Smart Casual dress code in hub offices, allowing jeans, sneakers, t-shirts without offensive slogans, and casual footwear.

Section 2: Customer and Investor Presentations
Staff attending formal customer onsite meetings, board sessions, or investment roadshows are required to wear Business Professional or Business Casual attire.

Section 3: Religious and Cultural Accommodations
Grooming and attire accommodations for religious observances, cultural headwear, and medical footwear are automatically protected without exception.`
    },

    // 53. FLEET VEHICLES & GAS MILEAGE
    {
      title: 'Fleet Vehicle Usage, Driving & IRS Mileage Reimbursement',
      originalName: 'Fleet_Mileage_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 730000,
      category: 'Facilities & Travel',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.5',
      effectiveDate: '2026-01-01',
      content: `Section 1: Standard IRS Business Mileage Rate
Employees utilizing personal vehicles for approved business trips (excluding daily home-to-hub commuting) are reimbursed at the official IRS rate of $0.67 per mile.

Section 2: Motor Vehicle Record (MVR) Background Checks
Staff operating corporate fleet vans or rental cars for business deliveries must maintain a valid driver's license and undergo annual DMV background screening.

Section 3: Strict Hands-Free Mobile Device Mandate
Texting, emailing, or holding handheld mobile phones while operating any vehicle on company business is strictly forbidden under corporate safety policies.`
    },

    // 54. SHIFT DIFFERENTIALS & NIGHT WORK
    {
      title: 'Shift Differentials, Night Work & Premium Pay Schedule',
      originalName: 'Shift_Differential_Schedule_2026.pdf',
      fileType: 'PDF',
      fileSize: 690000,
      category: 'Compensation',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Second and Third Shift Premium Pay
Operations and support staff scheduled on second shift (3:00 PM to 11:30 PM) receive an additional 10% hourly premium. Third shift (11:00 PM to 7:30 AM) receives a 15% hourly premium.

Section 2: Weekend Shift Differential Multipliers
Staff working full weekend shifts (Saturday and Sunday) receive an additional $2.50 per hour weekend premium added to their baseline compensation.

Section 3: Holiday Work Double-Time Pay
Employees required to work on designated corporate holidays receive double their standard hourly rate for all hours completed.`
    },

    // 55. MILITARY & NATIONAL GUARD LEAVE
    {
      title: 'USERRA Military Leave & National Guard Duty Policy',
      originalName: 'Military_Leave_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 780000,
      category: 'Leave Policy',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.2',
      effectiveDate: '2026-01-01',
      content: `Section 1: Two-Week Military Pay Differential
Employees called to active military training or National Guard drill receive wage differential pay for up to 10 business days annually, bridging military pay to regular base salary.

Section 2: Long-Term Job Restoration Under USERRA
Uniformed services members on military deployments lasting up to 5 years are guaranteed prompt reemployment with cumulative seniority, pay progression, and retirement credits.

Section 3: Healthcare Continuation for Military Families
Company medical coverage continues for deployed service members and dependents at regular active rates for the first 30 days of active service.`
    },

    // 56. EXECUTIVE AIRCRAFT & PRIVATE CHARTER (STRICTLY CONFIDENTIAL HR ADMIN ONLY)
    {
      title: 'Executive Air Travel, Private Charter & Security Transport SOP',
      originalName: 'Executive_Aircraft_SOP_2026.pdf',
      fileType: 'PDF',
      fileSize: 1250000,
      category: 'Executive Security',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['HR Admin'],
      version: '1.0',
      effectiveDate: '2026-01-01',
      content: `STRICTLY CONFIDENTIAL: HR ADMIN CLEARANCE ONLY.
Section 1: Private Aircraft Authorization Thresholds
Private jet charter travel is authorized exclusively for the Chief Executive Officer and Board Directors when commercial options present severe security exposure or travel delays.

Section 2: Personal Use of Charter Aircraft Imputed Income
Personal non-business guest travel on chartered flights is calculated under the Standard Industry Fare Level (SIFL) formula and reported as taxable imputed wages on the executive's W-2.

Section 3: Armed Executive Close Protection Details
The Board Compensation Committee authorizes dedicated residential physical security and armed executive protection details for the CEO during international travel.`
    },
    // 57. PARENTAL BONDING & LACTATION SUPPORT
    {
      title: 'Lactation Accommodation & New Parent Support Policy',
      originalName: 'Lactation_Support_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 680000,
      category: 'Health & Wellness',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.2',
      effectiveDate: '2026-01-01',
      content: `Section 1: Private Lactation Mother Rooms
Hub offices provide private, sanitary mother rooms equipped with hospital-grade Medela pumps, refrigeration for breastmilk storage, and comfortable ergonomic seating.

Section 2: Reasonable Break Time Protections
Nursing mothers receive reasonable paid break times as frequently as needed for up to 2 years following the birth of a child, fully compliant with PUMP Act regulations.

Section 3: Milk Stork Business Travel Shipping
Employees traveling on approved company business trips may expense the full cost of Milk Stork refrigerated breastmilk shipping services back to their primary residence.`
    },

    // 58. PATENT INCENTIVE & AWARDS
    {
      title: 'Patent Invention Incentive & Monetary Award Program',
      originalName: 'Patent_Award_Program_2026.pdf',
      fileType: 'PDF',
      fileSize: 820000,
      category: 'Legal & Intellectual Property',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Invention Disclosure Submission Bounty
Engineers submitting a novel technical invention disclosure reviewed and approved by the Patent Committee receive an initial $500 disclosure evaluation award.

Section 2: Formal USPTO Filing Milestone Bonus
Upon formal filing of a non-provisional patent application with the US Patent and Trademark Office, each contributing co-inventor receives a $2,000 cash bonus.

Section 3: Patent Issuance Plaque and Cash Award
Upon final patent grant and issuance by the patent office, co-inventors receive an additional $3,000 cash grant and an engraved commemorative patent wall plaque.`
    },

    // 59. BAR DUES & PROFESSIONAL LICENSES
    {
      title: 'Professional Licensing, Bar Dues & CPA Reimbursement SOP',
      originalName: 'Professional_Licensing_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 610000,
      category: 'Professional Development',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.1',
      effectiveDate: '2026-01-01',
      content: `Section 1: Mandatory Job-Required License Coverage
The company reimburses 100% of mandatory annual state bar association dues for corporate legal counsel and state board CPA licensing fees for corporate accounting staff.

Section 2: Continuing Legal and Professional Education (CLE/CPE)
Full-time staff requiring annual continuing education credits to maintain professional standing receive up to $1,000 per year for accredited seminar registration fees.

Section 3: Voluntary Technical Certifications
Optional technical certifications (AWS Solutions Architect, CISSP, PMP) are reimbursable through the standard $2,500 annual professional development tuition program.`
    },

    // 60. SABBATICAL WORKFLOW & COVERAGE
    {
      title: 'Sabbatical Application, Coverage & Re-Entry SOP',
      originalName: 'Sabbatical_Workflow_SOP_2026.pdf',
      fileType: 'PDF',
      fileSize: 740000,
      category: 'Leave Policy',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.3',
      effectiveDate: '2026-01-01',
      content: `Section 1: 6-Month Advance Scheduling Notice
To prevent project disruptions, employees eligible for the 4-week paid sabbatical must submit their formal scheduling request in BambooHR at least 6 months prior.

Section 2: Sabbatical Project Backfill and Delegation
The direct manager coordinates temporary role coverage or cross-training across peer team members prior to sabbatical commencement. Complete laptop disconnection is encouraged.

Section 3: Unused Sabbatical Forfeiture Rules
Sabbatical leave cannot be cashed out, exchanged for wages, or taken as fragmented individual days; it must be completed as a single continuous 4-week absence.`
    },

    // 61. EMPLOYEE RESOURCE GROUPS (ERGS)
    {
      title: 'Employee Resource Groups (ERGs) & Inclusion Budget SOP',
      originalName: 'ERG_Governance_SOP_2026.pdf',
      fileType: 'PDF',
      fileSize: 790000,
      category: 'Culture & Inclusion',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.1',
      effectiveDate: '2026-01-01',
      content: `Section 1: Annual $10,000 Operating Budget
Officially recognized Employee Resource Groups (Women in Tech, Pride Alliance, Black Leadership Network) receive an annual $10,000 operating budget for speaker series and community workshops.

Section 2: Executive Sponsor Guidance Mandate
Every active ERG must be sponsored by a Vice President or C-level executive to provide strategic mentorship and leadership visibility across corporate initiatives.

Section 3: ERG Lead Leadership Recognition
Employees serving as voluntary ERG Chapter Leads receive dedicated performance review recognition and up to 4 hours per month of allotted working hours for community organizing.`
    },

    // 62. DOMESTIC PARTNERS & EXTENDED DEPENDENTS
    {
      title: 'Domestic Partner Healthcare Eligibility & Affidavit SOP',
      originalName: 'Domestic_Partner_Benefits_SOP_2026.pdf',
      fileType: 'PDF',
      fileSize: 730000,
      category: 'Benefits Compliance',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.4',
      effectiveDate: '2026-01-01',
      content: `Section 1: Qualified Domestic Partner Coverage
Full-time employees may enroll same-sex or opposite-sex domestic partners in medical, dental, and vision insurance coverage upon submission of a certified Affidavit of Domestic Partnership.

Section 2: Shared Residency and Financial Interdependence Proof
Proof of mutual financial responsibility requires submission of at least two shared documents: a joint residential lease, joint bank account, or shared utility statement.

Section 3: Federal Imputed Income Tax Implications
Under IRS tax code regulations, employer premium contributions for non-dependent domestic partners cannot be made pretax and are reported as taxable imputed wages.`
    },

    // 63. RETIREE EXTENDED ACCESS
    {
      title: 'Retiree Benefits Continuation, COBRA & Milestone Recognition',
      originalName: 'Retiree_Benefits_Policy_2026.pdf',
      fileType: 'PDF',
      fileSize: 810000,
      category: 'Retirement & Alumni',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: Rule of 70 Retirement Eligibility
Employees whose combined age plus continuous service years equals 70 or greater (with a minimum of 10 years of service) qualify for official corporate Retiree Status.

Section 2: Lifetime Company Alumni Network Privileges
Retirees retain permanent corporate alumni network directory access, invitations to annual investor galas, and retiree company product discounts.

Section 3: COBRA Health Subsidy for Qualified Retirees
Employees meeting Rule of 70 retirement receive 6 months of 50% subsidized COBRA health insurance coverage before transitioning to individual Medicare supplemental plans.`
    },

    // 64. PROMISSORY NOTE & FORGIVENESS SCHEDULE
    {
      title: 'Sign-On Bonus Promissory Note & Forgiveness Schedule',
      originalName: 'SignOn_Bonus_Agreement_2026.pdf',
      fileType: 'PDF',
      fileSize: 690000,
      category: 'Compensation Legal',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '2.0',
      effectiveDate: '2026-01-01',
      content: `Section 1: 12-Month Pro-Rata Forgiveness Vesting
Sign-on cash bonuses are structured as forgivable loans, vesting on a pro-rata monthly basis over 12 continuous months of active employment.

Section 2: Resignation Repayment Notice and Recovery
If an employee resigns prior to completing 12 full months, the unvested balance must be repaid in full within 30 days of the formal separation date.

Section 3: Involuntary Restructuring Forgiveness Exception
If employment is terminated by the company due to corporate workforce reduction, position redundancy, or business shutdown, all repayment obligations are waived.`
    },

    // 65. EXECUTIVE RETIREMENT SUPPLEMENT (CONFIDENTIAL HR ADMIN ONLY)
    {
      title: 'Executive Supplemental Retirement Plan (SERP) Governance',
      originalName: 'SERP_Governance_Document_2026.pdf',
      fileType: 'PDF',
      fileSize: 1350000,
      category: 'Executive Benefits',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['HR Admin'],
      version: '1.0',
      effectiveDate: '2026-01-01',
      content: `STRICTLY CONFIDENTIAL: HR ADMIN CLEARANCE ONLY.
Section 1: Non-Qualified Deferred Compensation Plan (NQDC)
Executive Committee members may defer up to 50% of annual base salary and 100% of executive performance bonuses pretax into top-hat deferred compensation accounts.

Section 2: Rabbi Trust Creditor Protections
SERP deferred compensation balances are held in an irrevocable Rabbi Trust managed by Northern Trust, subject to general corporate creditors only in bankruptcy insolvency.

Section 3: Board Committee Accelerated Distribution
Upon qualifying corporate change-in-control, all accumulated deferred balances are liquidated and disbursed to participating executive officers within 60 calendar days.`
    },

    // 66. INJURY PREVENTION & ERGONOMIC VISITS
    {
      title: 'Ergonomic Evaluation, Repetitive Strain & Safety Protocol',
      originalName: 'Ergonomic_Protocol_2026.pdf',
      fileType: 'PDF',
      fileSize: 720000,
      category: 'Workplace Safety',
      uploadedBy: 'Sarah Jenkins',
      status: 'Indexed',
      accessRoles: ['Employee', 'Manager', 'HR Admin'],
      version: '1.5',
      effectiveDate: '2026-01-01',
      content: `Section 1: Early Intervention Discomfort Reporting
Employees experiencing early signs of carpal tunnel syndrome, tendonitis, or chronic neck strain must notify their People Operations lead to initiate ergonomic adjustments.

Section 2: Certified Ergonomic Specialist Onsite Assessment
Onsite employees receive an individual workstation evaluation, including monitor focal distance measurement, lumbar support adjustments, and desk elevation calibration.

Section 3: Specialized Assistive Equipment Provision
Specialized ergonomic equipment (vertical mice, split mechanical keyboards, anti-fatigue balance boards) are provided directly by Facilities upon specialist recommendation.`
    },
  {
    title: 'Intellectual Property and Invention Assignment Policy',
    category: 'Legal & Compliance',
    allowedRoles: ['Employee', 'Manager', 'HR Admin'],
    content: `All inventions, software code, proprietary designs, documentation, and improvements created by employees during employment or using company equipment are the sole property of the company under work-for-hire doctrine.
Employees must promptly disclose any pre-existing intellectual property, inventions, or patents on Exhibit A upon hire to exempt them from company ownership.
Contributing to public open-source software (OSS) repositories during personal time using personal equipment is permitted, provided it does not incorporate proprietary source code or directly compete with active company product roadmaps.
Engaging in side-projects, commercial software development, or outside consulting during employment requires prior formal disclosure and approval from the Legal and Compliance Department.
Upon termination or resignation, all source code, technical documentation, company repositories, and development credentials must be immediately surrendered.`
  },
  {
    title: 'Workplace Ergonomics and Remote Office Safety Guidelines',
    category: 'Workplace Safety',
    allowedRoles: ['Employee', 'Manager', 'HR Admin'],
    content: `Employees working remotely or in corporate facilities are eligible for a virtual ergonomic desk assessment conducted by certified occupational health specialists.
The company provides a one-time remote setup stipend of $600 to purchase ergonomic task chairs, monitor mounting arms, keyboard trays, or height-adjustable standing desks.
Employees experiencing symptoms of repetitive strain injury (RSI), carpal tunnel syndrome, or chronic lumbar strain must report them to HR Occupational Health within 48 hours for medical workstation accommodation.
Remote employees are responsible for maintaining a hazard-free dedicated workspace, free of tripping hazards, overloaded power strips, and poor ambient lighting.
Annual workstation ergonomic re-assessments can be requested through the Employee Wellness portal under Facilities & Safety.`
  },
  {
    title: 'Progressive Discipline and Performance Improvement Policy',
    category: 'Employee Relations',
    allowedRoles: ['Manager', 'HR Admin'],
    content: `When an employee fails to meet core role expectations or breaches company standards, managers follow progressive discipline: informal coaching, formal verbal counseling, written warning, and a Performance Improvement Plan (PIP).
A formal Performance Improvement Plan (PIP) spans 30, 60, or 90 calendar days and must outline specific measurable milestones, weekly check-in cadences, and clear consequences of non-attainment.
All written warnings and PIP documentation must be reviewed and approved by the HR Business Partner (HRBP) prior to delivery to the employee.
Gross misconduct—including theft, harassment, data exfiltration, or workplace violence—bypasses progressive discipline and results in immediate suspension pending termination for cause.
Employees placed on a PIP maintain the right to submit a formal rebuttal or appeal in writing to Employee Relations within 5 business days of issuance.`
  },
  {
    title: 'Executive Severance and Change in Control Guidelines',
    category: 'Executive Compensation',
    allowedRoles: ['HR Admin'],
    content: `Executive severance benefits apply strictly to Vice President (VP), Senior Vice President (SVP), and C-suite roles terminated without cause or resigning for Good Reason under double-trigger provisions.
Standard executive severance provides 12 to 18 months of base salary continuation, full COBRA healthcare premium reimbursement, and pro-rated target annual bonus.
In the event of a Change in Control (merger, acquisition, or buyout), unvested equity options and restricted stock units (RSUs) accelerate under double-trigger vesting requirements if terminated within 12 months.
All severance disbursements are contingent upon executing a comprehensive mutual release of claims, non-disparagement covenant, and a 12-month post-employment non-solicitation agreement.
Severance agreements incorporate a mandatory clawback provision requiring full forfeiture and repayment in the event of subsequent discovery of willful misconduct or financial misstatement.`
  },

  ];

  const demoCandidates = [
    {
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      role: 'Full Stack Engineer',
      matchScore: 92,
      experienceYears: 4.5,
      experienceText: '4.5 years building distributed React/Node.js microservices and vector RAG pipelines.',
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Docker', 'AWS', 'RAG'],
      education: 'B.Tech in Computer Science',
      strengths: ['Deep expertise in React 18 & Node.js', 'Hands-on RAG & vector embeddings experience'],
      missingSkills: ['Kubernetes'],
      recommendation: 'Strong Match',
      summary: 'Exceptional full-stack candidate with enterprise AI experience. Highly recommended for Senior role.',
      resumeFileName: 'Rohan_Sharma_Resume.pdf',
      jobDescription: 'Looking for a Senior Full Stack Engineer proficient in React, Node.js, and RAG architectures.'
    }
  ];

  const demoOnboardingTasks = [
    {
      employeeId: 'EMP-1003',
      employeeName: 'Alex Rivera',
      title: 'Submit Identity & Tax Documentation',
      description: 'Upload passport, SSN/Government ID, and tax withholding forms.',
      category: 'Compliance',
      status: 'Completed',
      dueDate: '2026-08-02',
      assignedTo: 'HR Team'
    }
  ];

  const isMongoLive = mongoose.connection && mongoose.connection.readyState === 1;

  if (isMongoLive) {
    try {
      await User.deleteMany({});
      await Employee.deleteMany({});
      await DocumentModel.deleteMany({});
      await Candidate.deleteMany({});
      await OnboardingTask.deleteMany({});
      const { DocumentChunk } = await import('../models/DocumentChunk.js');
      await DocumentChunk.deleteMany({});

      await User.insertMany(demoUsers);
      await Employee.insertMany(demoEmployees);
      const insertedDocs = await DocumentModel.insertMany(demoDocuments);
      await Candidate.insertMany(demoCandidates);
      await OnboardingTask.insertMany(demoOnboardingTasks);

      let totalInsertedChunks = 0;
      for (let i = 0; i < insertedDocs.length; i++) {
        const doc = insertedDocs[i];
        const rawContent = demoDocuments[i].content || doc.content;
        const chunks = chunkText(rawContent, 140, 30);
        const count = await addChunksToVectorStore(chunks, doc._id, doc.title, {
          accessRoles: doc.accessRoles,
          version: doc.version,
          effectiveDate: doc.effectiveDate
        });
        totalInsertedChunks += count;
      }
      console.log(`🌱 Seeded MongoDB database with ${insertedDocs.length} documents and ${totalInsertedChunks} vector chunks.`);
    } catch (err) {
      console.error('MongoDB seed error:', err.message);
    }
  } else {
    memoryStore.users = [...demoUsers];
    memoryStore.employees = [...demoEmployees];
    memoryStore.documents = demoDocuments.map((d) => ({ ...d, _id: new mongoose.Types.ObjectId().toString(), chunkCount: 3 }));
    memoryStore.candidates = [...demoCandidates];
    memoryStore.onboardingTasks = [...demoOnboardingTasks];
    memoryStore.documentChunks = [];

    for (const doc of memoryStore.documents) {
      const chunks = chunkText(doc.content, 140, 30);
      await addChunksToVectorStore(chunks, doc._id, doc.title, {
        accessRoles: doc.accessRoles,
        version: doc.version,
        effectiveDate: doc.effectiveDate
      });
    }
    console.log('🌱 Seeded In-Memory store with 3-tier RBAC documents and vector index.');
  }
}
