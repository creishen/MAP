/*
  file summary: clean single-subject permission table (Feature | Create | Read | Update | Delete).
  responsibilities: renders categorized scopes with circular checkboxes; all verbs editable by Super Admin.
  role in system: used by RolesAndPermissionsView for one selected role or one selected user.
*/

import React from 'react';
import {
  CrudAction,
  CrudFlags,
  CRUD_ACTIONS,
  PermissionScopeDefinition,
} from '../../types/permissions';

interface PermissionMatrixProps {
  catalog: PermissionScopeDefinition[];
  getFlags: (scopeKey: string) => CrudFlags;
  onToggle: (scopeKey: string, action: CrudAction, value: boolean) => void;
  readOnly?: boolean;
}

const ACTION_LABEL: Record<CrudAction, string> = {
  create: 'Create',
  read: 'View',
  update: 'Update',
  delete: 'Delete',
};

/**
  what: renders a readable Feature × Create/Read/Update/Delete table for one role or user.
*/
export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  catalog,
  getFlags,
  onToggle,
  readOnly = false,
}) => {
  const categories = Array.from(new Set(catalog.map((s) => s.category)));

  return (
    <div className="map-perm-flat-wrap">
      <table className="map-perm-flat-table">
        <thead>
          <tr>
            <th scope="col" className="map-perm-flat-obj">
              Permission
            </th>
            {CRUD_ACTIONS.map((action) => (
              <th key={action} scope="col" className="map-perm-flat-action">
                {ACTION_LABEL[action]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const scopes = catalog.filter((s) => s.category === category);
            return (
              <React.Fragment key={category}>
                <tr className="map-perm-flat-category">
                  <td colSpan={5}>{category}</td>
                </tr>
                {scopes.map((scope) => {
                  const flags = getFlags(scope.key);
                  return (
                    <tr key={scope.key} className="map-perm-flat-row">
                      <td className="map-perm-flat-obj">
                        <div className="map-perm-flat-label">{scope.label}</div>
                        <div className="map-perm-flat-desc">{scope.description}</div>
                      </td>
                      {CRUD_ACTIONS.map((action) => (
                        <td key={action} className="map-perm-flat-action">
                          <button
                            type="button"
                            className={[
                              'map-perm-circle',
                              flags[action] ? 'is-checked' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={readOnly}
                            title={`${scope.label}: ${ACTION_LABEL[action]}`}
                            aria-label={`${scope.label} ${ACTION_LABEL[action]}`}
                            aria-pressed={flags[action]}
                            onClick={() => {
                              if (readOnly) return;
                              onToggle(scope.key, action, !flags[action]);
                            }}
                          >
                            {flags[action] && (
                              <svg
                                className="map-perm-circle-check"
                                viewBox="0 0 16 16"
                                aria-hidden="true"
                              >
                                <path
                                  fill="currentColor"
                                  d="M6.2 11.4 2.8 8l1.1-1.1 2.3 2.3 5-5L12.3 5.3z"
                                />
                              </svg>
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
