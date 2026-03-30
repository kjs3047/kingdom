import './App.css';
import { agentLabels } from './agents';
import { runChiefAgent } from './chiefAgent';
import { sampleRequests } from './sampleData';

const selectedRequest = sampleRequests[1];
const result = runChiefAgent(selectedRequest);

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
