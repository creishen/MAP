/* 
  file summary: edit user modal dialog component for updating user profile attributes and rbac role assignments.
  responsibilities: captures updated user name, email, persona role, organization affiliation, scope, and status with validation.
  role in system: launched by UserTable.tsx when administrator clicks the edit action button for a user row.
*/

import React, { useState, useEffect } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { UserRolePersona } from '../../types/audit';
import { UserType, UserProfile } from '../../types/user';
import { UserRoleChecklist } from '../common/UserRoleChecklist';
import { buildRolesFromForm, splitRolesForForm } from '../../utils/userRoleHelpers';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

/**
  what: renders modal for editing an existing organization member or third-party user profile.
  how: pre-populates form state with target user data, validates inputs, checks email uniqueness, and dispatches updateUser to zustand store.
  with what file: src/components/drawers/EditUserModal.tsx loaded by UserTable.tsx.
*/
export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user }) => {
  const { users, updateUser } = useMapStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<UserType>('Organization');
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [operationalRoles, setOperationalRoles] = useState<UserRolePersona[]>(['Submitter']);
  const [organization, setOrganization] = useState('');
  const [departmentOrScope, setDepartmentOrScope] = useState('');
  const [status, setStatus] = useState<UserProfile['status']>('Active');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setUserType(user.userType);
      const { isPlatformAdmin: admin, operationalRoles: ops } = splitRolesForForm(user.roles);
      setIsPlatformAdmin(admin);
      setOperationalRoles(ops);
      setOrganization(user.organization);
      setDepartmentOrScope(user.departmentOrScope);
      setStatus(user.status);
      setErrorMessage('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !organization.trim()) {
      setErrorMessage('Please fill out all required fields (Name, Email, and Organization).');
      return;
    }

    const roles = buildRolesFromForm(isPlatformAdmin, operationalRoles);
    if (roles.length === 0) {
      setErrorMessage('Select at least one platform or operational role for this user.');
      return;
    }

    /* check duplicate email validation excluding current user being edited */
    const existingUser = users.find(
      (u) => u.id !== user.id && u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existingUser) {
      setErrorMessage(`A user with email address "${email.trim()}" already exists in the system.`);
      return;
    }

    const updatedUser: UserProfile = {
      ...user,
      name: name.trim(),
      email: email.trim(),
      roles,
      userType,
      organization: organization.trim(),
      departmentOrScope: departmentOrScope.trim() || (userType === 'Organization' ? 'Internal Operations' : 'External Stakeholder Scope'),
      status,
    };

    updateUser(updatedUser);
    onClose();
  };

  return (
    <div className="map-modal-backdrop d-flex align-items-center justify-content-center p-3">
      <div className="card map-card-custom shadow-lg" style={{ width: '100%', maxWidth: '580px', zIndex: 1100 }}>
        {/* Modal Header */}
        <div className="card-header d-flex align-items-center justify-content-between p-3 border-bottom">
          <div className="fw-bold text-dark fs-6">
            Edit User Profile ({user.id})
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          />
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="card-body p-4 d-flex flex-column gap-3">
            {errorMessage && (
              <div className="alert alert-danger py-2 small mb-0">
                {errorMessage}
              </div>
            )}

            {/* User Type Selection */}
            <div>
              <label className="form-label small fw-semibold text-secondary mb-1">User Classification / Type *</label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="editUserType"
                    id="editUserTypeOrg"
                    checked={userType === 'Organization'}
                    onChange={() => setUserType('Organization')}
                  />
                  <label className="form-check-input-label small text-dark fw-semibold cursor-pointer" htmlFor="editUserTypeOrg">
                    Organization Member
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="editUserType"
                    id="editUserTypeThird"
                    checked={userType === 'Third-Party'}
                    onChange={() => setUserType('Third-Party')}
                  />
                  <label className="form-check-input-label small text-dark fw-semibold cursor-pointer" htmlFor="editUserTypeThird">
                    Third-Party Stakeholder
                  </label>
                </div>
              </div>
            </div>

            {/* Full Name & Email */}
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="edit-user-name">Full Name *</label>
                <input
                  id="edit-user-name"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="e.g. Captain H. Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="edit-user-email">Email Address *</label>
                <input
                  id="edit-user-email"
                  type="email"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Role Entitlements & Organization Name */}
            <div className="row g-3">
              <div className="col-12">
                <UserRoleChecklist
                  isPlatformAdmin={isPlatformAdmin}
                  operationalRoles={operationalRoles}
                  onPlatformAdminChange={setIsPlatformAdmin}
                  onOperationalRolesChange={setOperationalRoles}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="edit-user-org">Organization Name *</label>
                <input
                  id="edit-user-org"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="e.g. Chevron Australia / DNV"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Scope & Status */}
            <div className="row g-3">
              <div className="col-md-7">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="edit-user-scope">Department / Operational Scope</label>
                <input
                  id="edit-user-scope"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="e.g. Vetting Compliance & Statutory Verification"
                  value={departmentOrScope}
                  onChange={(e) => setDepartmentOrScope(e.target.value)}
                />
              </div>

              <div className="col-md-5">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="edit-user-status">Account Status *</label>
                <select
                  id="edit-user-status"
                  className="form-select form-select-sm bg-white text-dark border-secondary"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UserProfile['status'])}
                >
                  <option value="Active">Active</option>
                  <option value="Pending Invitation">Pending Invitation</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="card-footer d-flex align-items-center justify-content-end gap-2 p-3 border-top bg-light">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-warning text-dark fw-semibold"
            >
              Save User Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
