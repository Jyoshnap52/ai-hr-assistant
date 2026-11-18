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
    }
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
        const chunks = chunkText(rawContent, 400, 80);
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
      const chunks = chunkText(doc.content, 400, 80);
      await addChunksToVectorStore(chunks, doc._id, doc.title, {
        accessRoles: doc.accessRoles,
        version: doc.version,
        effectiveDate: doc.effectiveDate
      });
    }
    console.log('🌱 Seeded In-Memory store with 3-tier RBAC documents and vector index.');
  }
}
