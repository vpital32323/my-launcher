import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Background from './components/Background.jsx';
import TitleBar from './components/TitleBar.jsx';
import Play from './components/Play.jsx';
import Mods from './components/Mods.jsx';
import Settings from './components/Settings.jsx';

const IDLE = { phase: 'idle', percent: 0, status: '', error: '', logs: [] };

// Обёртка для вложенных страниц (Моды, Настройки) с кнопкой «Назад»
function Subpage({ onBack, children }) {
  return (
    <div className="subpage">
      <button className="back" onClick={onBack}>
        ← Назад
      </button>
      {children}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('menu');
  const [settings, setSettings] = useState(null);
  const [versions, setVersions] = useState([]);
  const [game, setGame] = useState(IDLE);
  const saveTimer = useRef(null);

  const loadSettings = useCallback(async () => {
    setSettings(await window.api.invoke('settings:get'));
  }, []);

  useEffect(() => {
    loadSettings();
    window.api.invoke('versions:get').then(setVersions);

    const offs = [
      window.api.on('launcher:status', ({ text }) => setGame((g) => ({ ...g, status: text }))),
      window.api.on('launcher:progress', ({ percent }) => setGame((g) => ({ ...g, percent }))),
      window.api.on('launcher:running', () => setGame((g) => ({ ...g, phase: 'running' }))),
      window.api.on('launcher:log', (line) =>
        setGame((g) => ({ ...g, logs: [...g.logs.slice(-30), line.slice(0, 160)] }))
      ),
      window.api.on('launcher:closed', () => setGame((g) => ({ ...IDLE, logs: g.logs }))),
      window.api.on('launcher:error', ({ message }) => setGame({ ...IDLE, error: message }))
    ];
    return () => offs.forEach((off) => off());
  }, [loadSettings]);

  // Esc возвращает в главное меню
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setView('menu');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // мгновенно обновляем интерфейс, на диск сохраняем с небольшой задержкой
  const change = (patch) => {
    setSettings((s) => ({ ...s, ...patch }));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => window.api.invoke('settings:save', patch), 250);
  };

  const play = async () => {
    setGame({ ...IDLE, phase: 'launching', status: 'Подготовка…' });
    await window.api.invoke('settings:save', {
      nick: settings.nick,
      version: settings.version,
      useFabric: settings.useFabric
    });
    await window.api.invoke('game:launch', {
      version: settings.version,
      useFabric: settings.useFabric
    });
  };

  if (!settings) return <div className="app" />;

  const back = () => setView('menu');

  return (
    <div className="app">
      <Background />
      <TitleBar />

      <main className="stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            className="screen"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {view === 'menu' && (
              <Play
                settings={settings}
                versions={versions.length ? versions : [settings.version]}
                state={game}
                onChange={change}
                onPlay={play}
                onNavigate={setView}
              />
            )}
            {view === 'mods' && (
              <Subpage onBack={back}>
                <Mods />
              </Subpage>
            )}
            {view === 'settings' && (
              <Subpage onBack={back}>
                <Settings settings={settings} onChange={change} onAccountChange={loadSettings} />
              </Subpage>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
