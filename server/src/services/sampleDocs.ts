import { v4 as uuidv4 } from 'uuid';
import { DocumentMetadata, UserRole } from '../types';
import { chunkText } from './chunker';
import { vectorStore } from './vectorStore';

export interface SampleDoc {
  name: string;
  category: 'leave' | 'attendance' | 'benefits' | 'compensation' | 'handbook' | 'general';
  targetRole: UserRole | 'all';
  content: string;
}

export const SAMPLE_POLICIES: SampleDoc[] = [
  {
    name: 'Company Leave & Holiday Policy 2026.txt',
    category: 'leave',
    targetRole: 'all',
    content: `
# GLOBAL HR POLICY: LEAVE & HOLIDAY GUIDELINES 2026

## 1. ANNUAL LEAVE ENTITLEMENTS
Every full-time employee is entitled to the following annual paid leave allocations per calendar year:
- **Casual Leave (CL)**: 12 days per year. Casual leave cannot be carried forward to the next calendar year.
- **Sick Leave (SL)**: 10 days per year. Medical certificates are required for sick leave exceeding 2 consecutive working days.
- **Earned Leave (EL / Vacation)**: 18 days per year. Earned leave accrues monthly at 1.5 days per completed month. A maximum of 10 days of unused Earned Leave can be carried forward to the next year.
- **Maternity Leave**: 26 weeks of fully paid leave for female employees.
- **Paternity Leave**: 2 weeks (10 working days) of fully paid leave for new fathers within 6 months of child's birth.

## 2. OFFICIAL PAID HOLIDAYS 2026
The company observes 10 mandatory paid holidays:
1. New Year's Day (Jan 1)
2. Memorial Day (May 25)
3. Independence Day (July 4)
4. Labor Day (Sept 7)
5. Thanksgiving Day (Nov 26)
6. Day after Thanksgiving (Nov 27)
7. Christmas Eve (Dec 24)
8. Christmas Day (Dec 25)
9. New Year's Eve (Dec 31)
10. Floating Regional Holiday (1 day employee choice)

## 3. LEAVE APPROVAL PROCESS
All leaves must be submitted through the internal HR Portal at least 3 days in advance for Earned Leave. Emergency Sick Leave must be reported to the line manager via email or Slack by 9:30 AM on the day of absence.
`.trim()
  },
  {
    name: 'Attendance & Flexible Remote Work Policy.txt',
    category: 'attendance',
    targetRole: 'all',
    content: `
# ATTENDANCE & HYBRID REMOTE WORK POLICY

## 1. CORE WORKING HOURS
Our standard workweek is 40 hours, Monday through Friday.
- Core business hours are **10:00 AM to 4:00 PM local time**, during which all team members are expected to be reachable via Slack and available for team meetings.
- Flexible start time is permitted between 8:00 AM and 10:00 AM.

## 2. HYBRID REMOTE WORK (WFH)
- Employees are eligible for up to **2 days of Work-From-Home (WFH)** per week after completing their 90-day introductory period.
- Preferred WFH days must be aligned with the team manager to ensure adequate office coverage.
- High-speed internet (minimum 50 Mbps) and a quiet, professional environment are required when working remotely.

## 3. TIME TRACKING & OVERTIME
- Non-exempt staff must log daily hours in the HR Portal.
- Any overtime work beyond 40 hours per week must be pre-approved in writing by the Department Manager. Overtime is compensated at 1.5x standard hourly rate.
`.trim()
  },
  {
    name: 'Employee Health & Perks Benefits Guide 2026.txt',
    category: 'benefits',
    targetRole: 'all',
    content: `
# EMPLOYEE HEALTH & WELLNESS BENEFITS GUIDE

## 1. MEDICAL, DENTAL & VISION INSURANCE
- **Medical Coverage**: 100% premium paid by company for employees, 75% for eligible dependents. Includes comprehensive outpatient, inpatient, and prescription drug coverage up to $500,000 per annum.
- **Dental & Vision**: Fully covered dental checkups twice a year and $300 annual eyewear allowance.
- Enrollment begins on the 1st day of the month following employment start date.

## 2. WELLNESS & FITNESS STIPEND
- All active employees receive a **$50 monthly wellness reimbursement**.
- Eligible expenses: Gym memberships, yoga classes, mental health app subscriptions (Headspace, Calm), or ergonomic home office equipment.

## 3. PROFESSIONAL DEVELOPMENT & TUITION REIMBURSEMENT
- Employees are eligible for **up to $1,000 per calendar year** in tuition and learning reimbursement.
- Covered items: Professional certifications (AWS, PMP, SHRM), online courses (Coursera, Udemy), and technical books.
- Requires manager sign-off prior to purchasing.
`.trim()
  },
  {
    name: 'HR & Management Executive Compensation Guidelines.txt',
    category: 'compensation',
    targetRole: 'hr_admin', // RESTRICTED HR ADMIN DOCUMENT
    content: `
# CONFIDENTIAL: HR ADMIN COMPENSATION & PERFORMANCE REVIEW MANUAL

[RESTRICTED ACCESS: HR EXECUTIVES & MANAGERS ONLY]

## 1. BI-ANNUAL PERFORMANCE REVIEW SCHEDULE
Performance reviews occur twice per year:
- **Mid-Year Review**: June 15 - June 30
- **Year-End Review**: December 1 - December 20

## 2. SALARY REVISION BANDS
Annual salary increases are tied directly to the final rating in the Year-End Review:
- **Rating 5 (Exceeds Expectations)**: 8% to 12% salary raise + 15% annual bonus.
- **Rating 4 (Exceeds Most Expectations)**: 5% to 7.9% salary raise + 10% annual bonus.
- **Rating 3 (Meets Expectations)**: 3% to 4.9% salary raise + 5% annual bonus.
- **Rating 2 (Needs Improvement)**: 0% salary raise. Placed on 30-day Performance Improvement Plan (PIP).
- **Rating 1 (Unsatisfactory)**: Immediate HR review for potential separation.

## 3. EXECUTIVE ESCALATION PROTOCOL
For confidential compensation disputes or severe policy violations, contact the Senior HR Director directly at:
**Email**: hr-executive-escalations@company.internal
**Phone**: +1-800-555-0199 (Ext 404)
`.trim()
  }
];

/**
 * Helper to seed sample company documents into vector store
 */
export function seedSampleDocuments() {
  const seededDocs: DocumentMetadata[] = [];

  for (const sample of SAMPLE_POLICIES) {
    // Check if doc already exists by name
    const existing = vectorStore.getAllDocuments().find((d) => d.name === sample.name);
    if (existing) {
      continue;
    }

    const docId = uuidv4();
    const chunks = chunkText(docId, sample.name, sample.content, {
      roleAccess: sample.targetRole,
      category: sample.category,
      chunkSize: 450,
      chunkOverlap: 80
    });

    const docMeta: DocumentMetadata = {
      id: docId,
      name: sample.name,
      mimeType: 'text/plain',
      size: Buffer.byteLength(sample.content, 'utf-8'),
      uploadDate: new Date().toISOString(),
      chunkCount: chunks.length,
      status: 'indexed',
      targetRole: sample.targetRole,
      category: sample.category
    };

    vectorStore.saveDocumentMetadata(docMeta);
    vectorStore.addChunks(chunks);
    seededDocs.push(docMeta);
  }

  return seededDocs;
}
