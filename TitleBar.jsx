export default function TitleBar() {
  const call = (ch) => window.api.invoke(ch);
  return (
    <div className="titlebar">
      <div className="titlebar-logo">
        <span className="dot" /> My Launcher
      </div>
      <div className="titlebar-buttons">
        <button onClick={() => call('win:min')} aria-label="Свернуть">
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </button>
        <button onClick={() => call('win:max')} aria-label="Развернуть">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="2.2" y="2.2" width="7.6" height="7.6" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
        </button>
        <button className="close" onClick={() => call('win:close')} aria-label="Закрыть">
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  );
}
