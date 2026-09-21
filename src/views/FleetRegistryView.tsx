/* 
  file summary: fleet registry master page rendering the list of vessels and registration action trigger.
  responsibilities: presents VesselTable component and handles trigger to open VesselModal for registering new vessels.
  role in system: primary view for Fleet Master navigation (/vessels).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { VesselTable } from '../components/tables/VesselTable';
import { VesselModal } from '../components/drawers/VesselModal';
import { filterVesselsForPersona } from '../utils/rbacHelpers';

/**
  what: renders the fleet master registry page.
  how: displays VesselTable with All Fleet Vessels vs Chartered Vessels tabs and opens VesselModal.
  with what file: src/views/FleetRegistryView.tsx loaded by App.tsx.
*/
export const FleetRegistryView: React.FC = () => {
  const { setCurrentHashView, setActiveVesselId, vessels, assuranceSets, activePersona } = useMapStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'chartered'>(
    activePersona === 'C Admin' ? 'chartered' : 'all'
  );

  const charteredVessels = filterVesselsForPersona(vessels, assuranceSets, 'C Admin');
  const charteredCount = charteredVessels.length;

  const handleVesselRegistered = (vesselId: string) => {
    setActiveVesselId(vesselId);
    setCurrentHashView('vessels', vesselId);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Tab Bar: All Fleet Vessels vs Chartered Vessels */}
      <div className="card map-card-custom p-3 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h4 className="fw-bold text-primary m-0">Vessel Fleet Master</h4>
            <div className="text-secondary small">
              {activeTab === 'all'
                ? 'Comprehensive directory of vessels registered across marine providers & operators'
                : 'Active chartered vessels under assurance monitoring, documents, and physical inspections'}
            </div>
          </div>

          {activePersona === 'C Admin' && (
            <div className="nav nav-pills bg-light p-1 rounded-3 border">
              <button
                type="button"
                className={`nav-link btn-sm font-mono-code px-3 py-1.5 ${activeTab === 'all' ? 'active bg-primary text-white fw-semibold' : 'text-secondary'}`}
                style={{ fontSize: '0.8rem' }}
                onClick={() => setActiveTab('all')}
              >
                All Fleet Vessels ({vessels.length})
              </button>
              <button
                type="button"
                className={`nav-link btn-sm font-mono-code px-3 py-1.5 ${activeTab === 'chartered' ? 'active bg-primary text-white fw-semibold' : 'text-secondary'}`}
                style={{ fontSize: '0.8rem' }}
                onClick={() => setActiveTab('chartered')}
              >
                Chartered Vessels ({charteredCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vessels Table with inline Search, Export (CSV/PDF), and Register buttons */}
      <VesselTable
        filterMode={activeTab}
        onSelectVessel={(vessel) => {
          setCurrentHashView('vessels', vessel.id);
        }}
        onRegisterVessel={() => setIsModalOpen(true)}
      />

      {/* Vessel Registration Modal */}
      <VesselModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegistered={handleVesselRegistered}
      />
    </div>
  );
};
