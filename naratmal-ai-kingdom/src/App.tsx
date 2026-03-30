import './App.css';
import {
  agents,
  architectureLayers,
  extensionPlan,
  implementationSteps,
  promptTemplates,
  routeScenarios,
  routingRules,
} from './data/kingdom';

function App() {
  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__badge">Naratmal AI Kingdom · MVP Blueprint</div>
        <h1>나랏말 AI 왕국</h1>
        <p className="hero__subtitle">
          텔레그램 단일 창구형 UX 위에, 영의정이 내부 기관들을 지휘하는 멀티 에이전트 운영체계.
        </p>
        <div className="hero__chips">
          <span>영의정 = chief_agent</span>
          <span>단일 창구형 MVP</span>
          <span>사헌부 검수 내장</span>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel">
          <h2>개요</h2>
          <div className="stack">
            {architectureLayers.map((layer) => (
              <article key={layer.title} className="card">
                <h3>{layer.title}</h3>
                <p>{layer.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel--wide">
          <h2>조직도 / 에이전트 정의</h2>
          <div className="agent-grid">
            {agents.map((agent) => (
              <article key={agent.englishCode} className="agent-card">
                <div className="agent-card__header">
                  <strong>{agent.koreanName}</strong>
                  <span>{agent.englishCode}</span>
                </div>
                <p className="agent-role">{agent.role}</p>
                <p>{agent.responsibility}</p>
                <div className="agent-meta">
                  <div>
                    <h4>입력</h4>
                    <ul>
                      {agent.inputs.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>출력</h4>
                    <ul>
                      {agent.outputs.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="agent-trigger">
                  <strong>호출 조건:</strong> {agent.trigger}
                </p>
                {agent.reviewRequired ? <span className="review-tag">검수 중점 기관</span> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>기관 라우팅 규칙</h2>
          <ol className="ordered-list">
            {routingRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </section>

        <section className="panel">
          <h2>텔레그램 단일 창구형 MVP 흐름</h2>
          <div className="flow">
            <div>왕 (Telegram User)</div>
            <span>↓</span>
            <div>telegram_gateway</div>
            <span>↓</span>
            <div>영의정 chief_agent</div>
            <span>↓</span>
            <div>승정원 / 주관 기관 / 보조 기관 / 사헌부 검수</div>
            <span>↓</span>
            <div>영의정 최종 통합 응답</div>
          </div>
        </section>

        <section className="panel panel--wide">
          <h2>대표 라우팅 시나리오</h2>
          <div className="scenario-grid">
            {routeScenarios.map((scenario) => (
              <article key={scenario.id} className="scenario-card">
                <div className="scenario-card__top">
                  <h3>{scenario.title}</h3>
                  <span className="scenario-category">{scenario.category}</span>
                </div>
                <p className="scenario-request">“{scenario.userRequest}”</p>
                <p>
                  <strong>주관 기관:</strong> {scenario.lead}
                </p>
                <p>
                  <strong>보조 기관:</strong> {scenario.support.join(', ') || '없음'}
                </p>
                <p>
                  <strong>사헌부 검수:</strong> {scenario.reviewRequired ? '필수' : '선택'}
                </p>
                <ul>
                  {scenario.rationale.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>MVP 구현 순서</h2>
          <ol className="ordered-list">
            {implementationSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="panel panel--wide">
          <h2>핵심 시스템 프롬프트 초안</h2>
          <div className="prompt-list">
            {promptTemplates.map((prompt) => (
              <article key={prompt.agent} className="prompt-card">
                <h3>{prompt.title}</h3>
                <code>{prompt.agent}</code>
                <pre>{prompt.content}</pre>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>향후 독립 에이전트 확장</h2>
          <ul className="ordered-list unordered-list">
            {extensionPlan.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default App;
