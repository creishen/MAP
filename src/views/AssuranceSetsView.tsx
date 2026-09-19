/* 
  file summary: assurance sets view presenting active campaigns list and initiation modal trigger.
  responsibilities: renders AssuranceTable component and connects initiation action trigger in table header.
  role in system: main view for Assurance Sets navigation (/assurance-sets).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { AssuranceTable } from '../components/tables/AssuranceTable';
import { AssuranceModal } from '../components/drawers/AssuranceModal';

/**
  what: renders assurance sets campaign list view.
  how: displays AssuranceTable component with inline controls and toggles AssuranceModal form.
  with what file: src/views/AssuranceSetsView.tsx loaded by App.tsx.
*/
export const AssuranceSetsView: React.FC = () => {
  const { setCurrentHashView } = useMapStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="d-flex flex-column gap-3">
      {/* Assurance Table with inline Search, Export (CSV/PDF), and Initiate buttons */}
      <AssuranceTable
        onSelectSet={(set) => {
          setCurrentHashView('assurance-sets', set.id);
        }}
        onInitiateSet={() => setIsModalOpen(true)}
      />

      {/* Initiation Modal */}
      <AssuranceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
