import './App.css';
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
import { kingdomDashboard } from './dashboard/mockData';

function App() {
  return (
    <div className="app-shell">
      <DashboardHero
        title={kingdomDashboard.meta.title}
        subtitle={kingdomDashboard.meta.subtitle}
        activeScenario={kingdomDashboard.meta.activeScenario}
        ontologyVersion={kingdomDashboard.meta.ontologyVersion}
        lastUpdated={kingdomDashboard.meta.lastUpdated}
      />

      <main className="dashboard-grid">
        <OverviewPanel overview={kingdomDashboard.overview} />
        <HealthPanel health={kingdomDashboard.runtimeHealth} />
        <WorkflowGraphPanel
          graph={kingdomDashboard.workflowGraph}
          incidents={kingdomDashboard.bottlenecks}
          execution={kingdomDashboard.execution}
        />
        <AgencyStatusPanel roster={kingdomDashboard.agencyRoster} />
        <CommandFlowPanel commands={kingdomDashboard.commandFlow} />
        <ConversationLogPanel conversations={kingdomDashboard.conversations} />
        <BottlenecksPanel incidents={kingdomDashboard.bottlenecks} />
      </main>
    </div>
  );
}

export default App;
