import './App.css';
import { useEffect, useRef, useState } from 'react';
import {
  AgencyStatusPanel,
  BottlenecksPanel,
  CommandDetailPanel,
  CommandFlowPanel,
  ConversationLogPanel,
  DashboardHero,
  HealthPanel,
  OverviewPanel,
  WorkflowGraphPanel,
} from './components/dashboard';
import { loadDashboardData } from './dashboard/loadDashboard';
import { kingdomDashboard } from './dashboard/mockData';
import { subscribeDashboardStream } from './dashboard/streamDashboard';
import type { KingdomDashboardData } from './dashboard/types';

function App() {
  const [dashboard, setDashboard] = useState<KingdomDashboardData>(kingdomDashboard);
  const [selectedCommandId, setSelectedCommandId] = useState<string | undefined>(undefined);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const selectedCommandRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    selectedCommandRef.current = selectedCommandId;
  }, [selectedCommandId]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async (preserveNode = false) => {
      const data = await loadDashboardData(selectedCommandRef.current);
      if (cancelled) return;
      setDashboard(data);
      setSelectedCommandId((current) => current ?? data.commandFlow[0]?.id);
      if (!preserveNode) {
        setSelectedNodeId(undefined);
      }
    };

    refresh();
    const unsubscribe = subscribeDashboardStream(
      () => selectedCommandRef.current,
      (data) => {
        if (cancelled) return;
        setDashboard(data);
        setSelectedCommandId((current) => current ?? data.commandFlow[0]?.id);
      },
    );
    const interval = window.setInterval(() => {
      refresh(true);
    }, 15000);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadDashboardData(selectedCommandId).then((data) => {
      if (cancelled) return;
      setDashboard(data);
      setSelectedNodeId(undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCommandId]);

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
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
        <AgencyStatusPanel roster={dashboard.agencyRoster} />
        <CommandFlowPanel
          commands={dashboard.commandFlow}
          selectedCommandId={selectedCommandId ?? dashboard.commandFlow[0]?.id}
          onSelect={setSelectedCommandId}
        />
        <ConversationLogPanel conversations={dashboard.conversations} />
        <CommandDetailPanel detail={dashboard.selectedCommand} />
        <BottlenecksPanel incidents={dashboard.bottlenecks} />
      </main>
    </div>
  );
}

export default App;
