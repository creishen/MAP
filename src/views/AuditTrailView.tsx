/* 
  file summary: immutable audit trail page view displaying searchable regulatory event logs in minimalist light theme.
  responsibilities: presents chronological audit history with user roles, field deltas, event statistics, and search filters with high contrast text.
  role in system: primary audit workspace accessible via sidebar (/audit).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { formatMaritimeDate } from '../utils/formatters';

/**
  what: renders the full-page immutable audit trail view in clean light theme.
  how: fetches auditEvents array from zustand store and renders filterable audit table with field deltas.
  with what file: src/views/AuditTrailView.tsx loaded by App.tsx router.
*/
export const AuditTrailView: React.FC = () => {
  const { auditEvents } = useMapStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredEvents = auditEvents.filter((ev) => {
    const matchesSearch =
      ev.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.targetAsset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.userRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.justificationNotes && ev.justificationNotes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || ev.userRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="d-flex flex-column gap-4">
      {/* Main Audit Card */}
      <div className="card map-card-custom">
        {/* Controls Row */}
        <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <input
              type="text"
              className="form-control form-control-sm bg-white text-dark border-secondary"
              placeholder="Search audit trail by action, asset, role, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '320px' }}
            />
            <select
              className="form-select form-select-sm bg-white text-dark border-secondary"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="ALL">All User Roles</option>
              <option value="Administrator">Administrator</option>
              <option value="C Admin">C Admin</option>
              <option value="Submitter">Submitter</option>
              <option value="Verifier">Verifier</option>
              <option value="Inspector">Inspector</option>
              <option value="Approver">Approver</option>
            </select>
          </div>
          <div className="text-secondary small">
            Showing <strong className="text-dark">{filteredEvents.length}</strong> of {auditEvents.length} logs
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Action Performed</th>
                <th>Target Asset / Identifier</th>
                <th>User Role & Organization</th>
                <th>Field Delta / State Change</th>
                <th>Justification Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => (
                <tr key={ev.id}>
                  <td className="font-mono-code small text-nowrap">{formatMaritimeDate(ev.timestampUtc)}</td>
                  <td>
                    <span className="fw-semibold text-primary">{ev.action}</span>
                  </td>
                  <td>
                    <strong className="text-slate-900">{ev.targetAsset}</strong>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-info text-dark font-mono-code" style={{ fontSize: '0.75rem' }}>
                        {ev.userRole}
                      </span>
                      <span className="text-secondary small">{ev.organization}</span>
                    </div>
                  </td>
                  <td>
                    {ev.fieldDelta ? (
                      <div className="p-2 bg-light rounded font-mono-code small border border-secondary" style={{ fontSize: '0.75rem' }}>
                        <div className="fw-bold text-dark">Field: {ev.fieldDelta.fieldName}</div>
                        <div className="text-danger">Old: {ev.fieldDelta.oldValue}</div>
                        <div className="text-success">New: {ev.fieldDelta.newValue}</div>
                      </div>
                    ) : (
                      <span className="text-muted small">No Field Delta</span>
                    )}
                  </td>
                  <td className="small text-secondary fst-italic">
                    {ev.justificationNotes ? `"${ev.justificationNotes}"` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
