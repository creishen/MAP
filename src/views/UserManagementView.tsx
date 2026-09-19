/* 
  file summary: user management view component for administrator role to manage organization members and third-party users.
  responsibilities: presents summary KPI cards, master UserTable matching assurance table grid format, and launches AddUserModal.
  role in system: main view for user governance navigation (/users) accessible by Administrator persona.
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { UserTable } from '../components/tables/UserTable';
import { AddUserModal } from '../components/drawers/AddUserModal';

/**
  what: renders user management view for organization and third-party users in light theme.
  how: aggregates user stats and displays UserTable component with AddUserModal integration.
  with what file: src/views/UserManagementView.tsx loaded by App.tsx router.
*/
export const UserManagementView: React.FC = () => {
  const { users } = useMapStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const orgUsersCount = users.filter((u) => u.userType === 'Organization').length;
  const thirdPartyUsersCount = users.filter((u) => u.userType === 'Third-Party').length;
  const pendingCount = users.filter((u) => u.status === 'Pending Invitation').length;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Summary KPI Metric Cards */}
      <div className="row g-3">
        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Total Registered Users
            </div>
            <div className="display-6 fw-bold text-primary font-mono-code mt-1">{users.length}</div>
            <div className="text-muted small mt-1">Active & Pending System Accounts</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Organization Members
            </div>
            <div className="display-6 fw-bold text-dark font-mono-code mt-1">{orgUsersCount}</div>
            <div className="text-muted small mt-1">Northwind Marine Internal Users</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Third-Party Stakeholders
            </div>
            <div className="display-6 fw-bold text-info font-mono-code mt-1">{thirdPartyUsersCount}</div>
            <div className="text-muted small mt-1">External Auditors, Verifiers & Clients</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Pending Invitations
            </div>
            <div className="display-6 fw-bold text-warning font-mono-code mt-1">{pendingCount}</div>
            <div className="text-muted small mt-1">Awaiting External Acceptance</div>
          </div>
        </div>
      </div>

      {/* Master User Directory Table matching Assurance Sets table grid format */}
      <UserTable onAddUser={() => setIsModalOpen(true)} />

      {/* Add / Invite User Modal */}
      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
