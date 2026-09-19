/* 
  file summary: split-screen authentication login page component matching exact mockup design.
  responsibilities: presents marine assurance platform value proposition and 6 interactive role sign-in cards for role-based access.
  role in system: login screen rendered when user is unauthenticated.
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { UserRolePersona } from '../types/audit';

interface RoleOption {
  role: UserRolePersona;
  title: string;
  company: string;
}

/**
  what: renders the split-screen login page with value proposition on left and role sign-in cards on right.
  how: captures user input and triggers login action in zustand store when a role card is selected.
  with what file: src/views/LoginView.tsx loaded by App.tsx.
*/
export const LoginView: React.FC = () => {
  const { login } = useMapStore();
  const [username, setUsername] = useState('j.harding@northwindmarine.com');
  const [password, setPassword] = useState('••••••••••••');

  const roleOptions: RoleOption[] = [
    { role: 'Administrator', title: 'Administrator', company: 'Northwind Marine Pty Ltd' },
    { role: 'C Admin', title: 'C Admin (Client)', company: 'Southern Basin Energy' },
    { role: 'Submitter', title: 'Submitter', company: 'Northwind Marine Pty Ltd' },
    { role: 'Verifier', title: 'Verifier', company: 'Meridian Marine Surveyors' },
    { role: 'Inspector', title: 'Inspector', company: 'Meridian Marine Surveyors' },
    { role: 'Approver', title: 'Approver', company: 'Southern Basin Energy' },
  ];

  return (
    <div className="d-flex w-100 min-vh-100 overflow-hidden">
      {/* left column: dark navy pitch & standards footer */}
      <div
        className="d-flex flex-column justify-content-between p-5 text-white"
        style={{
          width: '45%',
          minWidth: '450px',
          backgroundColor: 'rgb(11, 27, 43)',
        }}
      >
        {/* top brand header */}
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: '#0d9488',
              borderRadius: '6px',
              fontSize: '1.1rem',
            }}
          >
            M
          </div>
          <div className="d-flex flex-column">
            <span className="fw-bold text-white" style={{ fontSize: '1.15rem', letterSpacing: '0.02em', lineHeight: '1.2' }}>
              Marine Assurance Platform
            </span>
            <span className="font-mono-code text-uppercase" style={{ fontSize: '0.675rem', color: '#64748b', letterSpacing: '0.08em' }}>
              MVP · OSV COMPLIANCE
            </span>
          </div>
        </div>

        {/* center main headline & body */}
        <div className="my-auto py-5" style={{ maxWidth: '520px' }}>
          <div className="font-mono-code text-uppercase fw-semibold mb-3" style={{ fontSize: '0.75rem', color: '#38bdf8', letterSpacing: '0.12em' }}>
            SINGLE SOURCE OF TRUTH
          </div>
          <h1 className="fw-bold text-white mb-4" style={{ fontSize: '2.5rem', lineHeight: '1.18', letterSpacing: '-0.02em' }}>
            Vessel and crew certification, verified end to end.
          </h1>
          <p className="lh-lg mb-0" style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Statutory, class and crew certificates in one auditable workflow — extraction, validation, verification, inspection and approval across the Client, Vessel Provider and appointed third parties.
          </p>
        </div>

        {/* bottom maritime standards footer */}
        <div className="d-flex align-items-center gap-5 pt-4 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div>
            <div className="fw-bold text-white font-mono-code" style={{ fontSize: '1.1rem' }}>IMO</div>
            <div className="small" style={{ fontSize: '0.75rem', color: '#64748b' }}>SOLAS · ISM</div>
          </div>
          <div>
            <div className="fw-bold text-white font-mono-code" style={{ fontSize: '1.1rem' }}>STCW</div>
            <div className="small" style={{ fontSize: '0.75rem', color: '#64748b' }}>Crew competency</div>
          </div>
          <div>
            <div className="fw-bold text-white font-mono-code" style={{ fontSize: '1.1rem' }}>AMSA</div>
            <div className="small" style={{ fontSize: '0.75rem', color: '#64748b' }}>Australian standards</div>
          </div>
        </div>
      </div>

      {/* right column: sign in form & role selection cards */}
      <div
        className="d-flex flex-column justify-content-center align-items-center p-5 flex-grow-1"
        style={{ backgroundColor: '#f1f5f9' }}
      >
        <div style={{ width: '100%', maxWidth: '540px' }}>
          {/* header text */}
          <div className="mb-4">
            <h2 className="fw-bold text-dark mb-1" style={{ fontSize: '2rem', color: '#0f172a' }}>
              Sign in
            </h2>
            <div className="font-mono-code small" style={{ fontSize: '0.8rem', color: '#64748b' }}>
              UC-01 · Authenticated role- and permission-based access
            </div>
          </div>

          {/* white login form card */}
          <div
            className="card border-0 shadow-sm p-4 p-md-5 mb-4"
            style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}
          >
            <div className="mb-3">
              <label className="form-label font-mono-code text-uppercase fw-semibold" style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.05em' }}>
                USER NAME
              </label>
              <input
                type="text"
                className="form-control font-mono-code py-2 px-3 border-secondary-subtle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ fontSize: '0.9rem', color: '#0f172a', borderRadius: '6px' }}
              />
            </div>

            <div className="mb-4">
              <label className="form-label font-mono-code text-uppercase fw-semibold" style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.05em' }}>
                PASSWORD
              </label>
              <input
                type="password"
                className="form-control font-mono-code py-2 px-3 border-secondary-subtle"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ fontSize: '0.9rem', color: '#0f172a', borderRadius: '6px' }}
              />
            </div>

            {/* divider line */}
            <div className="d-flex align-items-center my-4">
              <div className="flex-grow-1 border-bottom" style={{ borderColor: '#e2e8f0' }} />
              <span className="px-3 font-mono-code text-uppercase fw-semibold" style={{ fontSize: '0.675rem', color: '#94a3b8', letterSpacing: '0.08em' }}>
                CONTINUE AS
              </span>
              <div className="flex-grow-1 border-bottom" style={{ borderColor: '#e2e8f0' }} />
            </div>

            {/* 2-column role cards grid */}
            <div className="row g-3">
              {roleOptions.map((item) => (
                <div key={item.role} className="col-6">
                  <button
                    type="button"
                    className="w-100 text-start p-3 rounded border bg-white hover-card shadow-sm h-100"
                    style={{
                      borderColor: '#e2e8f0',
                      transition: 'all 0.15s ease-in-out',
                      cursor: 'pointer',
                    }}
                    onClick={() => login(item.role)}
                  >
                    <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                      {item.title}
                    </div>
                    <div className="text-secondary small text-truncate" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {item.company}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* notice text under card */}
          <div className="small lh-base" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Prototype: picking a role signs you in with that role's permissions. You can switch roles at any time from the top bar.
          </div>
        </div>
      </div>
    </div>
  );
};
