/* 
  file summary: system user models and mock user directory for marine assurance platform (map).
  responsibilities: defines SystemUser model and provides mock directory of users categorized by RBAC roles.
  role in system: consumed by stakeholder assignment forms, audit logs, and workflow routing.
*/

import { UserRolePersona } from './audit';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRolePersona;
  organization: string;
  title: string;
}

export const MOCK_SYSTEM_USERS: SystemUser[] = [
  /* submitter role users */
  {
    id: 'USR-SUB-01',
    name: 'M. Chen',
    email: 'm.chen@pacificoceanlogistics.com',
    role: 'Submitter',
    organization: 'Pacific Ocean Logistics Operations',
    title: 'Senior Vessel Operations Lead',
  },
  {
    id: 'USR-SUB-02',
    name: 'E. Ramirez',
    email: 'e.ramirez@northwindmarine.com.au',
    role: 'Submitter',
    organization: 'Northwind Marine Pty Ltd',
    title: 'Fleet Crewing & Compliance Officer',
  },
  {
    id: 'USR-SUB-03',
    name: 'S. Taylor',
    email: 's.taylor@coralmarine.com',
    role: 'Submitter',
    organization: 'Coral Marine Assets Ltd',
    title: 'Marine Operations Coordinator',
  },

  /* verifier role users */
  {
    id: 'USR-VER-01',
    name: 'A. Fontaine',
    email: 'a.fontaine@dnv.com',
    role: 'Verifier',
    organization: 'DNV Compliance Services',
    title: 'Lead Statutory Verification Specialist',
  },
  {
    id: 'USR-VER-02',
    name: 'R. Thorne',
    email: 'r.thorne@lr.org',
    role: 'Verifier',
    organization: "Lloyd's Register Marine",
    title: 'Principal Class Surveyor & Auditor',
  },
  {
    id: 'USR-VER-03',
    name: 'L. Vance',
    email: 'l.vance@abs-group.com',
    role: 'Verifier',
    organization: 'ABS Maritime Inspectorate',
    title: 'Senior Assurance Verifier',
  },

  /* inspector role users */
  {
    id: 'USR-INS-01',
    name: 'N. Technical',
    email: 'n.technical@amsa.gov.au',
    role: 'Inspector',
    organization: 'AMSA Marine Audit Division',
    title: 'Senior Flag State & On-Site Inspector',
  },
  {
    id: 'USR-INS-02',
    name: 'G. Harrison',
    email: 'g.harrison@marineinspect.com',
    role: 'Inspector',
    organization: 'Marine Inspection Bureau',
    title: 'Lead OVID / CMID Accredited Inspector',
  },
  {
    id: 'USR-INS-03',
    name: 'D. Zhao',
    email: 'd.zhao@oceanfleet.com',
    role: 'Inspector',
    organization: 'Ocean Fleet Management Services',
    title: 'Technical Superintendent & Auditor',
  },

  /* approver role users */
  {
    id: 'USR-APP-01',
    name: 'P. Nardelli',
    email: 'p.nardelli@chevron.com',
    role: 'Approver',
    organization: 'Chevron Australia Pty Ltd',
    title: 'Marine Assurance & Vetting Manager',
  },
  {
    id: 'USR-APP-02',
    name: 'K. Osei',
    email: 'k.osei@southernbasin.com.au',
    role: 'Approver',
    organization: 'Southern Basin Energy Operations',
    title: 'Global Head of Offshore Vetting',
  },
  {
    id: 'USR-APP-03',
    name: 'H. Miller',
    email: 'h.miller@inpex.co.jp',
    role: 'Approver',
    organization: 'Inpex Operations Australia',
    title: 'General Manager Marine Chartering',
  },
];
