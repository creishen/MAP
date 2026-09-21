/* 
  file summary: header banner component matching mockup layout with breadcrumb title, scenario filter pills, and viewing as persona pills.
  responsibilities: presents top navigation header with active workspace breadcrumb, scenario toggle, and persona role selector pills.
  role in system: top layout header loaded at the root of the app shell.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { UserRolePersona } from '../../types/audit';
import { getBackButtonInfo } from '../../utils/rbacHelpers';

/**
  what: renders top header bar with breadcrumb page title, scenario toggle, and viewing as persona pills matching the mockup design.
  how: computes open page title and context breadcrumb, manages scenario toggle state, and updates active persona on pill click.
  with what file: src/components/layout/HeaderBanner.tsx loaded by App.tsx.
*/
export const HeaderBanner: React.FC = () => {
  const {
    activePersona,
    setActivePersona,
    currentHashView,
    previousHashView,
    previousEntityId,
    currentEntityId,
    setCurrentHashView,
    vessels,
    assuranceSets,
    documents,
  } = useMapStore();

  /* compute dynamic back button info based on active detail view */
  const getHeaderBackInfo = () => {
    switch (currentHashView) {
      case 'vessels':
        return getBackButtonInfo('vessels', 'Fleet Registry', previousHashView, activePersona, previousEntityId);
      case 'documents':
        return getBackButtonInfo('documents', 'Document Library', previousHashView, activePersona, previousEntityId);
      case 'crew':
        return getBackButtonInfo('crew', 'Crew Directory', previousHashView, activePersona, previousEntityId);
      case 'inspection':
        return getBackButtonInfo('inspector', 'Inspections', previousHashView, activePersona, previousEntityId);
      case 'approver':
        return getBackButtonInfo('approver', 'Approval Gate', previousHashView, activePersona, previousEntityId);
      case 'create-assurance-set':
      case 'assurance-sets':
      default:
        return getBackButtonInfo('assurance-sets', 'Assurance Sets', previousHashView, activePersona, previousEntityId);
    }
  };

  const isDetailPage = Boolean(currentEntityId) || currentHashView === 'create-assurance-set';
  const headerBackInfo = getHeaderBackInfo();

  const rolesList: { role: UserRolePersona; label: string }[] = [
    { role: 'Administrator', label: 'Admin' },
    { role: 'C Admin', label: 'C Admin' },
    { role: 'Submitter', label: 'Submitter' },
    { role: 'Verifier', label: 'Verifier' },
    { role: 'Inspector', label: 'Inspector' },
    { role: 'Approver', label: 'Approver' },
  ];

  /* compute active page title and breadcrumb text based on current view */
  const getHeaderTitleDetails = (): { breadcrumb: string; title: string } => {
    switch (currentHashView) {
      case 'vessels': {
        if (currentEntityId) {
          const v = vessels.find((item) => item.id === currentEntityId);
          return {
            breadcrumb: `IMO ${v?.imoNumber || 'FLEET'} · VESSEL PROFILE`,
            title: v ? v.name : 'Vessel Detail',
          };
        }
        return { breadcrumb: 'FLEET MASTER · ASSET REGISTRY', title: 'Fleet registry' };
      }
      case 'assurance-sets': {
        if (currentEntityId) {
          return {
            breadcrumb: '',
            title: 'Assurance Set Detail Page',
          };
        }
        return { breadcrumb: 'AS-2041 · Fleet overview', title: 'Assurance dashboard' };
      }
      case 'documents': {
        if (currentEntityId) {
          const d = documents.find((item) => item.id === currentEntityId);
          return {
            breadcrumb: `CERT ${d?.certificateNo || 'VAULT'} · STATUTORY FILE`,
            title: d ? d.title : 'Document Detail',
          };
        }
        return { breadcrumb: 'STATUTORY VAULT · COMPLIANCE EVIDENCE', title: 'Document Library' };
      }
      case 'verifier':
        return { breadcrumb: 'SURVEYOR WORKSPACE · COMPLIANCE REVIEW', title: 'Verification queue' };
      case 'inspector':
        return { breadcrumb: 'PHYSICAL AUDIT · VISUAL SURVEY', title: 'Physical inspections' };
      case 'approver':
        return { breadcrumb: 'CHARTER AUTHORITY · READINESS SIGN-OFF', title: 'Approvals & readiness' };
      case 'audit':
        return { breadcrumb: 'IMMUTABLE LOGS · CRYPTOGRAPHIC AUDIT', title: 'Audit trail' };
      case 'dashboard':
      default:
        return { breadcrumb: 'AS-2041 · Fleet overview', title: 'Assurance dashboard' };
    }
  };

  const { breadcrumb, title } = getHeaderTitleDetails();

  return (
    <header
      className="map-top-banner d-flex align-items-center justify-content-between px-4 py-3 bg-white border-bottom"
      style={{ minHeight: '64px', borderColor: '#e2e8f0' }}
    >
      {/* left side: back button for any detail page or breadcrumb & page title */}
      <div>
        {isDetailPage ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 fw-semibold"
            onClick={() => setCurrentHashView(headerBackInfo.targetView, headerBackInfo.targetEntityId)}
          >
            {headerBackInfo.label}
          </button>
        ) : (
          <>
            <div className="text-uppercase fw-medium font-mono-code mb-1" style={{ fontSize: '0.675rem', color: '#94a3b8', letterSpacing: '0.06em' }}>
              {breadcrumb}
            </div>
            <h1 className="h4 mb-0 fw-bold text-dark" style={{ fontSize: '1.25rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
              {title}
            </h1>
          </>
        )}
      </div>

      {/* right side: scenario selector & viewing as persona pills */}
      <div className="d-flex align-items-center gap-4">
        {/* viewing as persona selector pills */}
        <div className="d-flex align-items-center gap-2">
          <span className="text-uppercase fw-bold me-1" style={{ fontSize: '0.625rem', color: '#94a3b8', letterSpacing: '0.08em' }}>
            VIEWING AS
          </span>
          <div className="d-flex align-items-center gap-1">
            {rolesList.map((r) => {
              const isActive = activePersona === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${isActive
                    ? 'bg-dark text-white fw-bold shadow-sm'
                    : 'text-secondary bg-transparent border-0 hover-bg-light'
                    }`}
                  style={{ fontSize: '0.75rem', transition: 'all 0.15s ease-in-out' }}
                  onClick={() => setActivePersona(r.role)}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};


