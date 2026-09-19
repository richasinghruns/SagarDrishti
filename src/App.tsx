import { useState, useCallback } from 'react';
import { CommandBar } from '@/components/CommandBar';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { VesselIntelligence } from '@/pages/VesselIntelligence';
import { VirtualSpill } from '@/pages/VirtualSpill';
import { Evidence } from '@/pages/Evidence';
import { FuturePrediction } from '@/pages/FuturePrediction';
import { SpillDetection } from '@/pages/SpillDetection';
import { OriginReconstruction } from '@/pages/OriginReconstruction';
import { Alerts } from '@/pages/Alerts';
import { SettingsPage } from '@/pages/Settings';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Vessel } from '@/lib/api';

function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const {
    online,
    vessels,
    totalVessels,
    anomalyCount,
    primeSuspect,
    events,
    refresh,
  } = useDashboardData();

  const handleNavigate = useCallback((p: string) => {
    setPage(p as PageId);
  }, []);

  const handleInvestigate = useCallback(() => {
    refresh();
    setPage('dashboard');
  }, [refresh]);

  const handleVesselClick = useCallback((v: Vessel) => {
    setPage('vessels');
  }, []);

  const primeName = primeSuspect?.name || 'SEA SOLIDARITY';

  return (
    <div className="h-screen flex flex-col bg-bg-base overflow-hidden">
      <CommandBar
        online={online}
        totalVessels={totalVessels}
        onInvestigate={handleInvestigate}
      />
      <Sidebar
        active={page}
        onNavigate={setPage}
        anomalyCount={anomalyCount || 8}
        alertCount={3}
      />
      <main className="flex-1 ml-56 mt-14 overflow-hidden">
        <div key={page} className="h-full animate-fade-in">
          {page === 'dashboard' && (
            <Dashboard
              vessels={vessels}
              totalVessels={totalVessels}
              anomalyCount={anomalyCount}
              primeSuspect={primeSuspect}
              events={events}
              online={online}
              onVesselClick={handleVesselClick}
              onRunSim={() => {}}
              onNavigate={handleNavigate}
            />
          )}
          {page === 'spill-detection' && <SpillDetection />}
          {page === 'origin' && <OriginReconstruction />}
          {page === 'vessels' && (
            <VesselIntelligence vessels={vessels} primeSuspect={primeSuspect} />
          )}
          {page === 'virtual-spill' && (
            <VirtualSpill vessels={vessels} primeSuspectName={primeName} />
          )}
          {page === 'evidence' && <Evidence />}
          {page === 'prediction' && <FuturePrediction />}
          {page === 'alerts' && <Alerts events={events} />}
          {page === 'settings' && <SettingsPage online={online} />}
        </div>
      </main>
    </div>
  );
}

export default App;
