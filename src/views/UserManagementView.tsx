/* 
  file summary: user management view component for administrator role to manage organization members and third-party users.
  responsibilities: presents summary KPI cards, tabbed user list table, role filters, CSV/PDF export, and launches AddUserModal.
  role in system: main view for user governance navigation (/users) accessible by Administrator persona.
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { UserProfile, UserType } from '../types/user';
import { AddUserModal } from '../components/drawers/AddUserModal';
import { exportToCsv, exportToPdf } from '../utils/exportHelpers';

/**
  what: renders user management view for organization and third-party users.
  how: lists users from zustand store, filters by category/search/role, provides export to CSV/PDF, and opens AddUserModal.
  with what file: src/views/UserManagementView.tsx loaded by App.tsx router.
*/
export const UserManagementView: React.FC = () => {
  const { users, updateUserStatus, activePersona } = useMapStore();
  const [activeTab, setActiveTab] = useState<'ALL' | 'Organization' | 'Third-Party'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const orgUsersCount = users.filter((u) => u.userType === 'Organization').length;
  const thirdPartyUsersCount = users.filter((u) => u.userType === 'Third-Party').length;
  const pendingCount = users.filter((u) => u.status === 'Pending Invitation').length;

  const filteredUsers = users.filter((u) => {
    const matchesTab = activeTab === 'ALL' || u.userType === activeTab;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.organization.toLowerCase().includes(term) ||
      u.departmentOrScope.toLowerCase().includes(term);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesTab && matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Administrator': return 'bg-dark text-white';
      case 'C Admin': return 'bg-info text-dark';
      case 'Submitter': return 'bg-primary text-white';
      case 'Verifier': return 'bg-warning text-dark';
      case 'Inspector': return 'bg-secondary text-white';
      case 'Approver': return 'bg-success text-white';
      default: return 'bg-light text-dark border';
    }
  };

  const handleExportCsv = () => {
    const exportData = filteredUsers.map((u) => ({
      UserName: u.name,
      Email: u.email,
      RolePersona: u.role,
      UserClassification: u.userType,
      Organization: u.organization,
      DepartmentScope: u.departmentOrScope,
      Status: u.status,
      LastActive: u.lastActive,
    }));
    exportToCsv('Organization_and_ThirdParty_Users', exportData);
    setIsExportOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['User Name', 'Email', 'Role', 'Type', 'Organization & Scope', 'Status'];
    const rows = filteredUsers.map((u) => [
      u.name,
      u.email,
      u.role,
      u.userType,
      `${u.organization} (${u.departmentOrScope})`,
      u.status,
    ]);
    exportToPdf('Organization and Third-Party Users Directory', headers, rows);
    setIsExportOpen(false);
  };

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

      {/* Main Users Table Card */}
      <div className="card map-card-custom">
        {/* Filter Navigation Tabs */}
        <div className="border-bottom px-3 pt-2 bg-light d-flex align-items-center justify-content-between">
          <ul className="nav nav-tabs border-bottom-0">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link text-start py-2 px-3 fw-semibold ${activeTab === 'ALL' ? 'active text-primary' : 'text-secondary'}`}
                onClick={() => setActiveTab('ALL')}
              >
                All Users ({users.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link text-start py-2 px-3 fw-semibold ${activeTab === 'Organization' ? 'active text-primary' : 'text-secondary'}`}
                onClick={() => setActiveTab('Organization')}
              >
                Organization Members ({orgUsersCount})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link text-start py-2 px-3 fw-semibold ${activeTab === 'Third-Party' ? 'active text-primary' : 'text-secondary'}`}
                onClick={() => setActiveTab('Third-Party')}
              >
                Third-Party Stakeholders ({thirdPartyUsersCount})
              </button>
            </li>
          </ul>
        </div>

        {/* Table Controls Header: Grouped Search/Filter Left, Grouped Export/Add Right */}
        <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
          {/* Left: Search Box & Role Dropdown Filter */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            <input
              type="text"
              className="form-control form-control-sm bg-white text-dark border-secondary"
              placeholder="Search user name, email, organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '280px' }}
            />
            <select
              className="form-select form-select-sm bg-white text-dark border-secondary"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="ALL">All Persona Roles</option>
              <option value="Administrator">Administrator</option>
              <option value="Submitter">Submitter</option>
              <option value="Verifier">Verifier</option>
              <option value="Inspector">Inspector</option>
              <option value="Approver">Approver</option>
              <option value="C Admin">C Admin</option>
            </select>
          </div>

          {/* Right: Export & Add User Buttons on corner right of the row */}
          <div className="d-flex align-items-center gap-2 ms-auto">
            {/* Export Dropdown */}
            <div className="dropdown position-relative">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-dark dropdown-toggle"
                onClick={() => setIsExportOpen(!isExportOpen)}
              >
                Export Data
              </button>
              {isExportOpen && (
                <ul className="dropdown-menu dropdown-menu-light show position-absolute end-0 mt-1 shadow border" style={{ zIndex: 1050 }}>
                  <li>
                    <button type="button" className="dropdown-item small" onClick={handleExportCsv}>
                      Export as CSV (.csv)
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item small" onClick={handleExportPdf}>
                      Export as PDF (.pdf)
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* Add User Action Button */}
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              + Add / Invite User
            </button>
          </div>
        </div>

        {/* User Accounts Table */}
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>User Name & Email</th>
                <th>Assigned Role</th>
                <th>User Classification</th>
                <th>Organization & Scope</th>
                <th>Status</th>
                <th>Last Active</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    No user accounts match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u: UserProfile) => (
                  <tr key={u.id}>
                    <td>
                      <div className="fw-bold text-primary">{u.name}</div>
                      <div className="small text-muted font-mono-code">{u.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.userType === 'Organization' ? 'bg-light text-dark border' : 'bg-info-subtle text-info-emphasis border border-info-subtle'}`}>
                        {u.userType}
                      </span>
                    </td>
                    <td className="small">
                      <div className="fw-semibold text-dark">{u.organization}</div>
                      <div className="text-secondary" style={{ fontSize: '0.78rem' }}>{u.departmentOrScope}</div>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'Active' ? 'bg-success text-white' : u.status === 'Pending Invitation' ? 'bg-warning text-dark' : 'bg-secondary text-white'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="font-mono-code small text-secondary">
                      {u.lastActive}
                    </td>
                    <td className="text-end">
                      {u.status === 'Active' ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-1 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => updateUserStatus(u.id, 'Inactive')}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success py-1 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => updateUserStatus(u.id, 'Active')}
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Invite User Modal */}
      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
