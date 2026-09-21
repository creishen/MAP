/* 
  file summary: reusable operational role checklist for user provisioning and edit forms.
  responsibilities: renders platform admin toggle, operational role checkboxes, and segregation-of-duty warnings.
  role in system: used by AddUserModal and EditUserModal.
*/

import React from 'react';
import { UserRolePersona } from '../../types/audit';
import {
  OPERATIONAL_ROLE_OPTIONS,
  getSegregationWarnings,
} from '../../utils/userRoleHelpers';

interface UserRoleChecklistProps {
  isPlatformAdmin: boolean;
  operationalRoles: UserRolePersona[];
  onPlatformAdminChange: (checked: boolean) => void;
  onOperationalRolesChange: (roles: UserRolePersona[]) => void;
}

export const UserRoleChecklist: React.FC<UserRoleChecklistProps> = ({
  isPlatformAdmin,
  operationalRoles,
  onPlatformAdminChange,
  onOperationalRolesChange,
}) => {
  const toggleOperationalRole = (role: UserRolePersona) => {
    if (operationalRoles.includes(role)) {
      onOperationalRolesChange(operationalRoles.filter((r) => r !== role));
      return;
    }
    onOperationalRolesChange([...operationalRoles, role]);
  };

  const previewRoles = [
    ...(isPlatformAdmin ? (['Administrator'] as UserRolePersona[]) : []),
    ...operationalRoles,
  ];
  const sodWarnings = getSegregationWarnings(previewRoles);

  return (
    <div className="d-flex flex-column gap-3">
      <div>
        <label className="form-label small fw-semibold text-secondary mb-2">
          Platform Access
        </label>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="role-platform-admin"
            checked={isPlatformAdmin}
            onChange={(e) => onPlatformAdminChange(e.target.checked)}
          />
          <label className="form-check-label small text-dark fw-semibold" htmlFor="role-platform-admin">
            Platform Administrator (full MAP governance access)
          </label>
        </div>
      </div>

      <div>
        <label className="form-label small fw-semibold text-secondary mb-2">
          Operational Roles (UC-04) *
        </label>
        <div className="row g-2">
          {OPERATIONAL_ROLE_OPTIONS.map(({ role, label }) => (
            <div key={role} className="col-md-6">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`role-${role.replace(/\s+/g, '-').toLowerCase()}`}
                  checked={operationalRoles.includes(role)}
                  onChange={() => toggleOperationalRole(role)}
                />
                <label
                  className="form-check-label small text-dark"
                  htmlFor={`role-${role.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {label}
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="form-text">
          A user may hold multiple operational roles where permitted by segregation-of-duty rules.
        </div>
      </div>

      {sodWarnings.length > 0 && (
        <div className="alert alert-warning py-2 small mb-0">
          <div className="fw-semibold mb-1">Segregation-of-Duty Notice</div>
          <ul className="mb-0 ps-3">
            {sodWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
