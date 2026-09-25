/* 
  file summary: fleet registry master page rendering the list of vessels and registration action trigger.
  responsibilities: presents VesselTable component and handles trigger to open VesselModal for registering new vessels.
  role in system: primary view for Fleet Master navigation (/vessels).
*/

import React, { useState, useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';
import { VesselTable } from '../components/tables/VesselTable';
import { VesselModal } from '../components/drawers/VesselModal';
import { filterVesselsForPersona, isAssuranceSetAssignedToPersona, isVesselOwnedByAdmin } from '../utils/rbacHelpers';

/**
  what: renders the fleet master registry page.
  how: displays VesselTable with All Fleet Vessels vs Chartered Vessels tabs and opens VesselModal.
  with what file: src/views/FleetRegistryView.tsx loaded by App.tsx.
*/
export const FleetRegistryView: React.FC = () => {
  const { setCurrentHashView, setActiveVesselId, vessels, assuranceSets, activePersona } = useMapStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'chartered' | 'owned'>(() => {
    if (activePersona === 'Administrator' || activePersona === 'Submitter') {
      return 'owned';
    }
    return 'all';
  });

  useEffect(() => {
    if (activePersona === 'Administrator' || activePersona === 'Submitter') {
      setActiveTab('owned');
    } else {
      setActiveTab('all');
    }
  }, [activePersona]);

  const isVesselChartered = (v: (typeof vessels)[0]) =>
    v.status === 'Under Charter' ||
    assuranceSets.some(
      (set) =>
        set.vesselId === v.id &&
        isAssuranceSetAssignedToPersona(set, 'C Admin')
    );

  const isVesselOwned = isVesselOwnedByAdmin;

  const charteredVessels = vessels.filter((v) => isVesselChartered(v) && v.status !== 'Under Charter');
  const availableVessels = vessels.filter((v) => !isVesselChartered(v) && v.status !== 'Under Charter');
  const charteredCount = charteredVessels.length;
  const availableCount = availableVessels.length;

  const ownedVessels = vessels.filter(isVesselOwned);
  const externalUncharteredVessels = vessels.filter((v) => !isVesselOwned(v) && v.status !== 'Under Charter');
  const ownedCount = ownedVessels.length;
  const externalUncharteredCount = externalUncharteredVessels.length;

  const handleVesselRegistered = (vesselId: string) => {
    setActiveVesselId(vesselId);
    setCurrentHashView('vessels', vesselId);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Tab Bar: All Fleet Vessels vs Chartered Vessels / Owned Vessels */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">

        {activePersona === 'C Admin' && (
          <div className="nav nav-pills bg-light p-1 rounded-3 border">
            <button
              type="button"
              className={`nav-link btn-sm font-mono-code px-3 py-1.5 ${activeTab === 'all' ? 'active bg-primary text-white fw-semibold' : 'text-secondary'}`}
              style={{ fontSize: '0.8rem' }}
              onClick={() => setActiveTab('all')}
            >
              All Fleet Vessels ({availableCount})
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

        {(activePersona === 'Administrator' || activePersona === 'Submitter') && (
          <div className="nav nav-pills bg-light p-1 rounded-3 border">
            <button
              type="button"
              className={`nav-link btn-sm font-mono-code px-3 py-1.5 ${activeTab === 'all' ? 'active bg-primary text-white fw-semibold' : 'text-secondary'}`}
              style={{ fontSize: '0.8rem' }}
              onClick={() => setActiveTab('all')}
            >
              All Fleet Vessels ({externalUncharteredCount})
            </button>
            <button
              type="button"
              className={`nav-link btn-sm font-mono-code px-3 py-1.5 ${activeTab === 'owned' ? 'active bg-primary text-white fw-semibold' : 'text-secondary'}`}
              style={{ fontSize: '0.8rem' }}
              onClick={() => setActiveTab('owned')}
            >
              Owned Vessels ({ownedCount})
            </button>
          </div>
        )}
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
