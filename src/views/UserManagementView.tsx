/* 
  file summary: user management view component supporting role category tabs, user persona isolation, and add user trigger.
  responsibilities: presents role category tabs (inspectors, verifiers, admins), user isolation statistics, and add user trigger.
  role in system: main view for user governance navigation (/users).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { UserTable } from '../components/tables/UserTable';
import { AddUserModal } from '../components/drawers/AddUserModal';
import { filterUsersForPersona } from '../utils/rbacHelpers';

/**
  what: renders user management view for organization and third-party users in light theme.
  how: filters users by persona, provides role category tabs, displays UserTable, and launches AddUserModal.
  with what file: src/views/UserManagementView.tsx loaded by App.tsx router.
*/
export const UserManagementView: React.FC = () => {
  const { users, activePersona } = useMapStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<'ALL' | 'Inspector' | 'Verifier' | 'AdminApprover'>('ALL');

  const visibleUsers = filterUsersForPersona(users, activePersona);

  const orgUsersCount = visibleUsers.filter((u) => u.userType === 'Organization').length;
  const thirdPartyUsersCount = visibleUsers.filter((u) => u.userType === 'Third-Party').length;
  const inspectorsCount = visibleUsers.filter((u) => u.role === 'Inspector').length;
  const verifiersCount = visibleUsers.filter((u) => u.role === 'Verifier').length;

  const isCAdmin = activePersona === 'C Admin';

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Banner Card with Add User Button & Role Category Tab Controls */}
      <div className="card map-card-custom p-4 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h3 className="fw-bold text-primary m-0">User Governance & Team Management</h3>
            <div className="text-secondary small mt-1">
              {isCAdmin
                ? 'Manage your organization personnel, assigned inspectors, and campaign verifiers'
                : 'Full user directory management across organization accounts and third-party stakeholders'}
            </div>
          </div>
        </div>

        {/* Role Separation Sub-Tabs */}
        <div className="nav nav-pills bg-light p-1 rounded-3 border mt-3.5 align-self-start">
          <button
            type="button"
            className={`nav-link btn-sm font-mono-code px-3 py-1.5 ${activeRoleTab === 'ALL' ? 'active bg-primary text-white fw-semibold' : 'text-secondary'}`}
            style={{ fontSize: '0.8rem' }}
            onClick={() => setActiveRoleTab('ALL')}
          >
            All Assigned Personnel ({visibleUsers.length})
          </button>
          <button
            type="button"
            className={`nav-link btn-sm font-mono-code px-3 py-1.5 ${activeRoleTab === 'Inspector' ? 'active bg-primary text-white fw-semibold' : 'text-secondary'}`}
            style={{ fontSize: '0.8rem' }}
            onClick={() => setActiveRoleTab('Inspector')}
          >
            Inspectors ({inspectorsCount})
          </button>
          <button
            type="button"
            className={`nav-link btn-sm font-mono-code px-3 py-1.5 ${activeRoleTab === 'Verifier' ? 'active bg-primary text-white fw-semibold' : 'text-secondary'}`}
            style={{ fontSize: '0.8rem' }}
            onClick={() => setActiveRoleTab('Verifier')}
          >
            Verifiers ({verifiersCount})
          </button>
          <button
            type="button"
            className={`nav-link btn-sm font-mono-code px-3 py-1.5 ${activeRoleTab === 'AdminApprover' ? 'active bg-primary text-white fw-semibold' : 'text-secondary'}`}
            style={{ fontSize: '0.8rem' }}
            onClick={() => setActiveRoleTab('AdminApprover')}
          >
            Admins & Approvers
          </button>
        </div>
      </div>

      {/* Top Summary KPI Metric Cards */}
      <div className="row g-3">
        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Visible Personnel
            </div>
            <div className="display-6 fw-bold text-primary font-mono-code mt-1">{visibleUsers.length}</div>
            <div className="text-muted small mt-1">Authorized Organization & Auditor Accounts</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Organization Members
            </div>
            <div className="display-6 fw-bold text-dark font-mono-code mt-1">{orgUsersCount}</div>
            <div className="text-muted small mt-1">Internal Team Accounts</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Inspectors & Verifiers
            </div>
            <div className="display-6 fw-bold text-info font-mono-code mt-1">{inspectorsCount + verifiersCount}</div>
            <div className="text-muted small mt-1">Assigned Auditors & Compliance Verification</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Third-Party Stakeholders
            </div>
            <div className="display-6 fw-bold text-warning font-mono-code mt-1">{thirdPartyUsersCount}</div>
            <div className="text-muted small mt-1">External Audit & Survey Entities</div>
          </div>
        </div>
      </div>

      {/* Master User Directory Table matching Assurance Sets table grid format */}
      <UserTable
        roleCategoryTab={activeRoleTab}
        onAddUser={() => setIsModalOpen(true)}
      />

      {/* Add / Invite User Modal */}
      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
