/* 
  file summary: assurance sets view presenting active campaigns list and initiation page trigger.
  responsibilities: renders AssuranceTable component and connects initiation action navigation to create-assurance-set page.
  role in system: main view for Assurance Sets navigation (/assurance-sets).
*/

import React from 'react';
import { useMapStore } from '../store/useMapStore';
import { AssuranceTable } from '../components/tables/AssuranceTable';

/**
  what: renders assurance sets campaign list view.
  how: displays AssuranceTable component with inline controls and navigates to create-assurance-set page route.
  with what file: src/views/AssuranceSetsView.tsx loaded by App.tsx.
*/
export const AssuranceSetsView: React.FC = () => {
  const { setCurrentHashView } = useMapStore();

  return (
    <div className="d-flex flex-column gap-3">
      {/* Assurance Table with inline Search, Export (CSV/PDF), and Initiate buttons */}
      <AssuranceTable
        onSelectSet={(set) => {
          setCurrentHashView('assurance-sets', set.id);
        }}
        onInitiateSet={() => setCurrentHashView('create-assurance-set')}
      />
    </div>
  );
};
