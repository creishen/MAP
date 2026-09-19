/* 
  file summary: root application shell component managing hash routing, top header banner, sidebar navigation, and main view router.
  responsibilities: synchronizes browser window hash location with zustand state and renders active view component with global audit drawer.
  role in system: primary application shell mounted by main.tsx.
*/

import React, { useEffect } from 'react';
import { useMapStore } from './store/useMapStore';
import { HeaderBanner } from './components/layout/HeaderBanner';
import { AppSidebar } from './components/layout/AppSidebar';
import { AuditTrailDrawer } from './components/drawers/AuditTrailDrawer';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { FleetRegistryView } from './views/FleetRegistryView';
import { VesselDetailView } from './views/VesselDetailView';
import { AssuranceSetsView } from './views/AssuranceSetsView';
import { CreateAssuranceSetView } from './views/CreateAssuranceSetView';
import { AssuranceDetailView } from './views/AssuranceDetailView';
import { DocumentLibraryView } from './views/DocumentLibraryView';
import { DocumentDetailView } from './views/DocumentDetailView';
import { VerifierWorkspaceView } from './views/VerifierWorkspaceView';
import { InspectorWorkspaceView } from './views/InspectorWorkspaceView';
import { ApproverDashboardView } from './views/ApproverDashboardView';
import { AuditTrailView } from './views/AuditTrailView';
import './App.css';

/**
  what: renders the root application shell and handles window hash change navigation or login page.
  how: checks isAuthenticated state from store and parses window.location.hash string to update store currentHashView.
  with what file: src/App.tsx mounted by src/main.tsx.
*/
export const App: React.FC = () => {
  const { currentHashView, currentEntityId, setCurrentHashView, isAuthenticated } = useMapStore();

  useEffect(() => {
    /* parse initial hash route on mount */
    const parseHash = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash) {
        const parts = hash.split('/');
        setCurrentHashView(parts[0], parts[1]);
      } else {
        setCurrentHashView('dashboard');
      }
    };

    parseHash();

    const handleHashChange = () => parseHash();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  /* render login view if user is unauthenticated */
  if (!isAuthenticated) {
    return <LoginView />;
  }

  /* view router lookup */
  const renderCurrentView = () => {
    switch (currentHashView) {
      case 'vessels':
        return currentEntityId ? <VesselDetailView vesselId={currentEntityId} /> : <FleetRegistryView />;
      case 'assurance-sets':
        return currentEntityId ? <AssuranceDetailView setId={currentEntityId} /> : <AssuranceSetsView />;
      case 'create-assurance-set':
        return <CreateAssuranceSetView />;
      case 'documents':
        return currentEntityId ? <DocumentDetailView documentId={currentEntityId} /> : <DocumentLibraryView />;
      case 'verifier':
        return <VerifierWorkspaceView />;
      case 'inspector':
        return <InspectorWorkspaceView />;
      case 'approver':
        return <ApproverDashboardView />;
      case 'audit':
        return <AuditTrailView />;
      case 'dashboard':
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="map-app-shell">
      {/* 100vh sidepanel on the left */}
      <AppSidebar />

      {/* right column container with header banner at top and scrollable main content area */}
      <div className="map-right-column">
        <HeaderBanner />
        <main className="map-content-area">{renderCurrentView()}</main>
      </div>

      {/* global immutable audit trail offcanvas drawer */}
      <AuditTrailDrawer />
    </div>
  );
};

export default App;
