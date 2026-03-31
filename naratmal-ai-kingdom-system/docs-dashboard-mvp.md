# Naratmal AI Kingdom Dashboard MVP Design

## Goal

Build a first dashboard that makes the kingdom's ontology-style workflow legible at a glance:

- how a command enters the system
- which agents currently own each step
- where conversations and review loops are happening
- what is blocked or at risk
- whether runtime health is safe enough to ship

The MVP is intentionally mock-data driven. It should prove the information architecture and component model before wiring to live orchestration data.

## Dashboard Model

The dashboard uses a small domain model that can later map to server events:

- `WorkflowGraphNode`: a typed workflow state unit with owner, lane, duration, detail, and screen position
- `WorkflowGraphEdge`: a typed transition between nodes with semantic conditions like `handoff`, `feedback`, or `guardrail`
- `AgentStatus`: current availability, load, queue depth, and active task per kingdom role
- `ConversationThread`: a grouped log of messages between the human, chief agent, specialists, and audit guard
- `CommandFlowItem`: command-level execution summary for queue state and next action
- `BottleneckIncident`: explicit friction points with severity and remediation action
- `RuntimeHealthState`: high-level system signals for operational confidence

This is "ontology-style" in the sense that the dashboard does not only list tasks. It visualizes typed entities and their relationships:

- commands move through graph nodes
- edges describe why transitions happen
- agents own nodes and command slices
- conversations reference workflow nodes
- bottlenecks attach to affected workflow areas
- runtime signals shape release confidence

## Screen Structure

### 1. Hero / Command Surface

Top area for:

- dashboard title
- active scenario
- ontology version
- freshness timestamp

This gives immediate situational context.

### 2. Kingdom Overview

High-signal summary cards for:

- active command count
- review latency
- blocked node count
- runtime drift

This section acts like the dashboard's command center headline.

### 3. Dynamic Workflow Graph

Core visualization for the MVP:

- nodes rendered as stateful workflow cards on a graph canvas
- curved edges showing directional command flow
- visual distinction for `running`, `blocked`, `queued`, and `complete`
- side rail highlighting the active node and the primary blocker

This is the most important panel because it externalizes the hidden orchestration logic.

### 4. Agency Status

Roster panel for:

- current agent availability
- load percentage
- queue depth
- current task

This makes operational pressure visible without leaving the dashboard.

### 5. Command Flow

Compact queue view for:

- command id and title
- requester
- command status
- assigned agents
- next action

This bridges the gap between the graph and concrete execution items.

### 6. Conversation Log

Chronological log grouped by thread:

- human asks
- chief agent interprets
- specialists contribute
- audit guard blocks or approves

Messages can reference the workflow node they belong to, which keeps language and state connected.

### 7. Bottlenecks

Explicit incidents section for:

- severity
- affected area
- remediation action

This prevents blockers from disappearing into the graph.

### 8. Runtime Health

Operational signal cards for:

- heartbeat
- backlog
- guardrail pressure
- memory queue state

This tells the operator whether the orchestration system is stable enough to trust.

## Component Strategy

The implementation should feel close to Tailwind/shadcn patterns while staying inside the repo's current constraints:

- no new UI dependency required
- composition-first components
- panel/card primitives
- tokenized status styling via CSS classes
- typed props for each panel

The MVP component set:

- `DashboardHero`
- `OverviewPanel`
- `WorkflowGraphPanel`
- `AgencyStatusPanel`
- `CommandFlowPanel`
- `ConversationLogPanel`
- `BottlenecksPanel`
- `HealthPanel`

This breakdown keeps panels isolated and makes later live-data integration straightforward.

## Live Data Path After MVP

The next version should replace `mockData.ts` with a server-fed dashboard adapter:

1. ingest orchestration events and review state from the server
2. derive node state and command status projections
3. attach conversation slices from execution logs
4. compute bottlenecks from guardrail failures, queue age, and runtime degradation
5. refresh the dashboard on a timer or streaming event channel

## MVP Non-Goals

- full drag-and-drop graph editing
- real-time websocket streaming
- historical timeline playback
- per-agent drilldown pages
- persistence of user filters

Those can come after the core ontology/dashboard contract is stable.
