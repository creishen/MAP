/* 
  file summary: master user directory table component matching exact assurance sets table format and header controls layout.
  responsibilities: presents names, emails, role badges, organization scopes, classification badges, export controls, and user addition triggers.
  role in system: main data table component for UserManagementView.tsx.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { UserProfile } from '../../types/user';
import { UserRolePersona } from '../../types/audit';
import { exportToCsv, exportToPdf } from '../../utils/exportHelpers';

interface UserTableProps {
  onAddUser?: () => void;
}

/**
  what: renders master user directory table matching assurance sets table layout.
  how: filters users array by search query, role persona, and user classification, with export to CSV/PDF.
  with what file: src/components/tables/UserTable.tsx loaded by UserManagementView.tsx.
*/
export const UserTable: React.FC<UserTableProps> = ({ onAddUser }) => {
  const { users, updateUserStatus, activePersona } = useMapStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isExportOpen, setIsExportOpen] = useState(false);

  const canManageUsers = activePersona === 'Administrator';

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.organization.toLowerCase().includes(term) ||
      u.departmentOrScope.toLowerCase().includes(term);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesType = typeFilter === 'ALL' || u.userType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesType && matchesStatus;
  });

  const getRoleBadgeClass = (role: UserRolePersona) => {
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

  const getStatusBadgeClass = (status: UserProfile['status']) => {
    switch (status) {
      case 'Active': return 'bg-success text-white';
      case 'Pending Invitation': return 'bg-warning text-dark';
      case 'Inactive': return 'bg-secondary text-white';
      default: return 'bg-light text-dark border';
    }
  };

  const handleExportCsv = () => {
    const exportData = filteredUsers.map((u) => ({
      Name: u.name,
      Email: u.email,
      AssignedRole: u.role,
      Classification: u.userType,
      Organization: u.organization,
      Scope: u.departmentOrScope,
      Status: u.status,
      LastActive: u.lastActive,
    }));
    exportToCsv('Master_User_Directory', exportData);
    setIsExportOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['Name & Email', 'Role', 'Classification', 'Organization & Scope', 'Status'];
    const rows = filteredUsers.map((u) => [
      `${u.name}\n(${u.email})`,
      u.role,
      u.userType,
      `${u.organization}\n${u.departmentOrScope}`,
      u.status,
    ]);
    exportToPdf('Master User Directory Log', headers, rows);
    setIsExportOpen(false);
  };

  return (
    <div className="card map-card-custom">
      {/* Table Header Controls Row: Grouped Search/Filters Left, Grouped Export/Add User Right */}
      <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
        {/* Left Side: Search Box & Filter Dropdowns */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <input
            type="text"
            className="form-control form-control-sm bg-white text-dark border-secondary"
            placeholder="Search Name, Email, Org..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '260px' }}
          />

          <select
            className="form-select form-select-sm bg-white text-dark border-secondary"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="ALL">All Persona Roles</option>
            <option value="Administrator">Administrator</option>
            <option value="Submitter">Submitter</option>
            <option value="Verifier">Verifier</option>
            <option value="Inspector">Inspector</option>
            <option value="Approver">Approver</option>
            <option value="C Admin">C Admin</option>
          </select>

          <select
            className="form-select form-select-sm bg-white text-dark border-secondary"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="ALL">All Classifications</option>
            <option value="Organization">Organization</option>
            <option value="Third-Party">Third-Party</option>
          </select>

          <select
            className="form-select form-select-sm bg-white text-dark border-secondary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '140px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending Invitation">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Opposite (Right) Side: Export & Add User Buttons on corner right of the row */}
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
          {canManageUsers && onAddUser && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={onAddUser}
            >
              + Add / Invite User
            </button>
          )}
        </div>
      </div>

      {/* User Data Table matching Assurance Sets table grid format */}
      <div className="table-responsive">
        <table className="table map-table-custom align-middle mb-0">
          <thead>
            <tr>
              <th>User Name & Email</th>
              <th>Assigned Role</th>
              <th>Classification</th>
              <th>Organization & Scope</th>
              <th>Status</th>
              <th>Last Active</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4 text-muted">
                  No user accounts match your search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="fw-semibold text-dark">{u.name}</div>
                    <div className="small font-mono-code text-muted">{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.userType === 'Organization' ? 'bg-light text-dark border' : 'bg-info text-dark'}`}>
                      {u.userType}
                    </span>
                  </td>
                  <td>
                    <div className="fw-semibold text-dark">{u.organization}</div>
                    <div className="small text-muted">{u.departmentOrScope}</div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="font-mono-code small text-secondary">
                    {u.lastActive}
                  </td>
                  <td className="text-end">
                    {canManageUsers && (
                      u.status === 'Active' ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => updateUserStatus(u.id, 'Inactive')}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => updateUserStatus(u.id, 'Active')}
                        >
                          Activate
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
