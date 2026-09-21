/* 
  file summary: sidebar navigation component with role-based access control (rbac) route filtering matching exact mockup styling.
  responsibilities: renders fixed dark navy sidepanel, organisation card, teal dot nav items, and signed in as user section.
  role in system: sidebar navigation component embedded in app layout shell.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { UserRolePersona } from '../../types/audit';

interface NavItem {
  key: string;
  label: string;
  allowedRoles: UserRolePersona[];
  badgeText?: string;
}

/**
  what: renders fixed dark navy sidepanel matching mockup design with organisation card and dot navigation.
  how: checks active persona against nav item permissions, applies teal dot active highlights, and updates store route on click.
  with what file: src/components/layout/AppSidebar.tsx loaded by App.tsx.
*/
export const AppSidebar: React.FC = () => {
  const { activePersona, currentHashView, setCurrentHashView, logout } = useMapStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  /* lookup mock user details based on active persona */
  const getUserInfo = (role: UserRolePersona): { name: string; initials: string } => {
    switch (role) {
      case 'C Admin':
        return { name: 'S. Basin', initials: 'SB' };
      case 'Submitter':
        return { name: 'M. Chen', initials: 'MC' };
      case 'Verifier':
        return { name: 'A. Fontaine', initials: 'AF' };
      case 'Inspector':
        return { name: 'N. Technical', initials: 'NT' };
      case 'Approver':
        return { name: 'P. Nardelli', initials: 'PN' };
      case 'Administrator':
      default:
        return { name: 'K. Osei', initials: 'KO' };
    }
  };

  const userInfo = getUserInfo(activePersona);

  const navItems: NavItem[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      allowedRoles: ['Administrator', 'C Admin', 'Submitter', 'Verifier', 'Inspector', 'Approver'],
    },
    {
      key: 'vessels',
      label: 'Vessels',
      allowedRoles: ['Administrator', 'C Admin', 'Submitter'],
    },
    {
      key: 'assurance-sets',
      label: 'Assurance Sets',
      allowedRoles: ['Administrator', 'C Admin', 'Submitter',],
    },
    {
      key: 'documents',
      label: 'Document Library',
      allowedRoles: ['Administrator', 'Submitter'],
    },
    {
      key: 'crew',
      label: 'Crew Directory',
      allowedRoles: ['Administrator', 'Submitter'],
    },
    {
      key: 'verifier',
      label: 'Verification Queue',
      allowedRoles: ['Administrator'],
      badgeText: '2',
    },
    {
      key: 'inspector',
      label: 'Physical Inspections',
      allowedRoles: ['Administrator'],
    },
    {
      key: 'capa',
      label: 'CAPA Tracker',
      allowedRoles: ['Administrator', 'Inspector'],

    },
    {
      key: 'audit',
      label: 'Immutable Audit Trail',
      allowedRoles: ['Administrator', 'C Admin', 'Submitter', 'Verifier', 'Inspector', 'Approver'],

    },
    {
      key: 'users',
      label: 'User Management',
      allowedRoles: ['Administrator', 'C Admin'],
    },
  ];

  /* filter navigation items based on active persona rbac permissions */
  const visibleItems = navItems.filter((item) => item.allowedRoles.includes(activePersona));

  return (
    <aside className="map-sidebar-nav" style={{ backgroundColor: 'rgb(11, 27, 43)' }}>
      {/* map brand header with teal M logo badge */}
      <div className="d-flex align-items-center gap-3 px-3 py-3 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        <div
          className="d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
          style={{
            width: '34px',
            height: '34px',
            backgroundColor: '#0d9488',
            borderRadius: '6px',
            fontSize: '1rem',
            letterSpacing: '0.02em',
          }}
        >
          M
        </div>
        <div className="d-flex flex-column">
          <span className="fw-bold text-white" style={{ fontSize: '1.05rem', letterSpacing: '0.05em', lineHeight: '1.1' }}>
            MAP
          </span>
          <span className="small text-uppercase" style={{ fontSize: '0.625rem', color: '#64748b', letterSpacing: '0.08em' }}>
            Marine Assurance
          </span>
        </div>
      </div>

      {/* organisation card box */}
      <div
        className="mx-3 my-3 p-3 rounded"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="text-uppercase fw-bold mb-1" style={{ fontSize: '0.625rem', letterSpacing: '0.08em', color: '#64748b' }}>
          Organisation
        </div>
        <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.85rem' }}>
          Northwind Marine Pty Ltd
        </div>
        <div className="text-truncate" style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
          {activePersona === 'C Admin' ? 'Client / Charterer' : 'Vessel Provider / Owner'}
        </div>
      </div>

      {/* main navigation list with dot highlights */}
      <div className="nav flex-column nav-pills px-2">
        {visibleItems.map((item) => {
          const isActive =
            currentHashView === item.key ||
            (item.key === 'assurance-sets' && currentHashView === 'create-assurance-set');
          return (
            <button
              key={item.key}
              type="button"
              className={`nav-link text-start d-flex align-items-center justify-between mb-1 py-2 px-3 ${isActive ? 'fw-semibold' : ''
                }`}
              style={{
                borderRadius: '6px',
                fontSize: '0.85rem',
                backgroundColor: isActive ? '#0e324c' : 'transparent',
                color: isActive ? '#ffffff' : '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
              }}
              onClick={() => setCurrentHashView(item.key)}
            >
              <div className="d-flex align-items-center">
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#38bdf8' : '#475569',
                    marginRight: '10px',
                  }}
                />
                <span>{item.label}</span>
              </div>
              {item.badgeText && (
                <span
                  className={`badge rounded-pill ms-auto ${isActive ? 'bg-primary text-white' : 'bg-warning text-dark'
                    }`}
                  style={{ fontSize: '0.65rem', padding: '0.25em 0.6em' }}
                >
                  {item.badgeText}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* signed in as bottom card section with interactive user menu */}
      <div
        className="mt-auto p-3 border-top position-relative"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div className="text-uppercase fw-bold mb-1" style={{ fontSize: '0.625rem', letterSpacing: '0.08em', color: '#64748b' }}>
          Signed in as
        </div>
        <div
          className="d-flex align-items-center justify-between p-2 rounded cursor-pointer"
          style={{
            backgroundColor: isUserMenuOpen ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            transition: 'background-color 0.15s ease',
            cursor: 'pointer',
          }}
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        >
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <div
              className="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}
            >
              {userInfo.initials}
            </div>
            <div className="d-flex flex-column text-truncate">
              <span className="fw-bold text-white text-truncate" style={{ fontSize: '0.85rem' }}>
                {userInfo.name}
              </span>
              <span className="text-truncate" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {activePersona}
              </span>
            </div>
          </div>
          <span className="text-secondary small ms-1">{isUserMenuOpen ? '▲' : '▼'}</span>
        </div>

        {/* logout popover menu */}
        {isUserMenuOpen && (
          <div
            className="position-absolute bottom-100 start-0 mb-2 ms-2 p-2 rounded shadow-lg border"
            style={{
              width: 'calc(100% - 16px)',
              backgroundColor: '#0b1b2b',
              borderColor: '#1e3a5f',
              zIndex: 1100,
            }}
          >
            <div className="p-2 border-bottom mb-1" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <div className="fw-bold text-white small">{userInfo.name}</div>
              <div className="text-white small" style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{activePersona}</div>
            </div>
            <button
              type="button"
              className="btn btn-sm text-start text-danger w-100 d-flex align-items-center gap-2 py-1 px-2 border-0 bg-transparent hover-bg-dark"
              style={{ fontSize: '0.78rem' }}
              onClick={() => {
                setIsUserMenuOpen(false);
                logout();
              }}
            >
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};


