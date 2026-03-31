import './App.css';
import { useEffect, useState } from 'react';
import {
  AgencyStatusPanel,
  BottlenecksPanel,
  CommandFlowPanel,
  ConversationLogPanel,
  DashboardHero,
  HealthPanel,
  OverviewPanel,
  WorkflowGraphPanel,
} from './components/dashboard';
import { loadDashboardData } from './dashboard/loadDashboard';
import { kingdomDashboard } from './dashboard/mockData';
import type { KingdomDashboardData } from './dashboard/types';

function App() {
  const [dashboard, setDashboard] = useState<KingdomDashboardData>(kingdomDashboard);

  useEffect(() => {
    loadDashboardData().then(setDashboard);
  }, []);

  return (
    <div className="app-shell">
      <DashboardHero
        title={dashboard.meta.title}
        subtitle={dashboard.meta.subtitle}
        activeScenario={dashboard.meta.activeScenario}
        ontologyVersion={dashboard.meta.ontologyVersion}
        lastUpdated={dashboard.meta.lastUpdated}
      />

      <main className="dashboard-grid">
        <OverviewPanel overview={dashboard.overview} />
        <HealthPanel health={dashboard.runtimeHealth} />
        <WorkflowGraphPanel
          graph={dashboard.workflowGraph}
          incidents={dashboard.bottlenecks}
          execution={dashboard.execution}
        />
        <AgencyStatusPanel roster={dashboard.agencyRoster} />
        <CommandFlowPanel commands={dashboard.commandFlow} />
        <ConversationLogPanel conversations={dashboard.conversations} />
        <BottlenecksPanel incidents={dashboard.bottlenecks} />
      </main>
    </div>
  );
}

export default App;
