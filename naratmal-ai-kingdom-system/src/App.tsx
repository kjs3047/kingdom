import './App.css';
import { agentLabels } from './agents';
import { runChiefAgent } from './chiefAgent';
import { sampleRequests } from './sampleData';

const selectedRequest = sampleRequests[1];
const result = runChiefAgent(selectedRequest);

const controlPlaneSample = {
  totals: {
    totalLogs: 12,
    pendingReview: 3,
    approved: 5,
    blocked: 1,
  },
  recent: [
    {
      id: '1774867000010',
      requester: '폐하',
      reviewStatus: 'revision_requested',
      workflowPhase: 'review_required',
      nextAction: '사헌부 권고 반영 후 재검수 필요',
      reviewRound: 1,
      createdAt: '2026-03-30T14:21:00.000Z',
      message: '외부 제출용 소개 문구를 다듬어라',
    },
    {
      id: '1774867000004',
      requester: '폐하',
      reviewStatus: 'approved',
      workflowPhase: 'approved',
      nextAction: '출고 또는 최종 전달 가능',
      reviewRound: 2,
      createdAt: '2026-03-30T13:58:00.000Z',
      message: '투자자용 한 장 제안서 검수 완료본',
    },
    {
      id: '1774866999988',
      requester: '폐하',
      reviewStatus: 'not_required',
      workflowPhase: 'draft',
      nextAction: '내부 검토 또는 다음 작업으로 진행 가능',
      reviewRound: 0,
      createdAt: '2026-03-30T13:21:00.000Z',
      message: '텔레그램 브리지 구조를 점검해라',
    },
  ],
};

function App() {
  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__badge">Operational MVP · chief_agent orchestration</div>
        <h1>나랏말 AI 왕국 시스템</h1>
        <p>
          왕의 요청을 영의정이 받고, 내부 기관 라우팅과 검수 규칙에 따라 처리하는 실제 동작형 MVP
          구조.
        </p>
      </header>

      <main className="layout">
        <section className="panel panel--wide control-panel">
          <div className="panel__title-row">
            <h2>운영 제어면</h2>
            <span className="hero__badge">control plane</span>
          </div>
          <div className="summary-grid summary-grid--four">
            <div>
              <strong>총 로그</strong>
              <span>{controlPlaneSample.totals.totalLogs}</span>
            </div>
            <div>
              <strong>검수 대기</strong>
              <span>{controlPlaneSample.totals.pendingReview}</span>
            </div>
            <div>
              <strong>승인 완료</strong>
              <span>{controlPlaneSample.totals.approved}</span>
            </div>
            <div>
              <strong>차단</strong>
              <span>{controlPlaneSample.totals.blocked}</span>
            </div>
          </div>
          <div className="task-list">
            {controlPlaneSample.recent.map((item) => (
              <article key={item.id} className="card">
                <div className="panel__title-row">
                  <h3>{item.message}</h3>
                  <span className={`status-badge status-badge--${item.reviewStatus}`}>{item.reviewStatus}</span>
                </div>
                <p>
                  요청자: {item.requester} · 라운드: {item.reviewRound} · 단계: {item.workflowPhase}
                </p>
                <small>
                  다음 조치: {item.nextAction} · {item.createdAt}
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>입력 요청</h2>
          <div className="request-box">{selectedRequest.message}</div>
          <ul>
            <li>첨부파일: {selectedRequest.attachments?.join(', ') ?? '없음'}</li>
            <li>외부 제출물: {selectedRequest.externalDelivery ? '예' : '아니오'}</li>
            <li>민감 여부: {selectedRequest.sensitive ? '예' : '아니오'}</li>
          </ul>
        </section>

        <section className="panel">
          <h2>영의정 브리핑</h2>
          <p>{result.briefing}</p>
          <div className="summary-grid">
            <div>
              <strong>분류</strong>
              <span>{result.routing.category}</span>
            </div>
            <div>
              <strong>주관 기관</strong>
              <span>{agentLabels[result.routing.leadAgent]}</span>
            </div>
            <div>
              <strong>보조 기관</strong>
              <span>
                {result.routing.supportAgents.length
                  ? result.routing.supportAgents.map((agent) => agentLabels[agent]).join(', ')
                  : '없음'}
              </span>
            </div>
            <div>
              <strong>검수 필요</strong>
              <span>{result.routing.reviewRequired ? '예' : '아니오'}</span>
            </div>
          </div>
        </section>

        <section className="panel panel--wide review-panel">
          <div className="panel__title-row">
            <h2>사헌부 검수 현황</h2>
            <span className={`status-badge status-badge--${result.review.status}`}>{result.review.status}</span>
          </div>
          <div className="summary-grid">
            <div>
              <strong>워크플로 단계</strong>
              <span>{result.workflow.phase}</span>
            </div>
            <div>
              <strong>다음 조치</strong>
              <span>{result.workflow.nextAction}</span>
            </div>
          </div>
          {result.revisionSummary ? <div className="revision-summary">{result.revisionSummary}</div> : null}
          <div className="review-list">
            {(result.review.actionItems ?? []).map((item) => (
              <article key={item.code} className="review-item">
                <div className="review-item__header">
                  <strong>{item.title}</strong>
                  <span className={`severity-pill severity-pill--${item.severity}`}>{item.severity}</span>
                </div>
                <p>{item.detail}</p>
                <small>{item.code}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel--wide">
          <h2>기관 호출 순서</h2>
          <div className="task-list">
            {result.routing.tasks.map((task, index) => (
              <article key={`${task.agent}-${index}`} className="card">
                <h3>
                  {index + 1}. {agentLabels[task.agent]}
                </h3>
                <p>{task.reason}</p>
                <small>{task.inputSummary}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel--wide">
          <h2>기관 결과</h2>
          <div className="task-list">
            {result.results.map((agentResult) => (
              <article key={agentResult.agent} className="card">
                <h3>{agentLabels[agentResult.agent]}</h3>
                <p>{agentResult.summary}</p>
                <ul>
                  {agentResult.output.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel--wide final-panel">
          <h2>최종 보고</h2>
          <p>{result.finalMessage}</p>
        </section>
      </main>
    </div>
  );
}

export default App;
