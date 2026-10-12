import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Background from './components/Background.jsx';
import TitleBar from './components/TitleBar.jsx';
import Play from './components/Play.jsx';
import Mods from './components/Mods.jsx';
import Settings from './components/Settings.jsx';

const TABS = [
  { id: 'play', label: 'Играть', icon: 'M8 5v14l11-7z' },
  { id: 'mods', label: 'Моды', icon: 'M4 8h16v3H4zM4 13h16v3H4zM7 4h10v3H7zM7 17h10v3H7z' },
  {
    id: 'settings',
    label: 'Настройки',
    icon: 'M12 8a4 4 0 100 8 4 4 0 000-8zm8.5 5.5v-3l-2.1-.6a6.9 6.9 0 00-.7-1.6l1-1.9-2.1-2.1-1.9 1a6.9 6.9 0 00-1.6-.7L12.5 3h-3l-.6 2.1a6.9 6.9 0 00-1.6.7l-1.9-1-2.1 2.1 1 1.9c-.3.5-.5 1-.7 1.6l-2.1.6v3l2.1.6c.2.6.4 1.1.7 1.6l-1 1.9 2.1 2.1 1.9-1c.5.3 1 .5 1.6.7l.6 2.1h3l.6-2.1c.6-.2 1.1-.4 1.6-.7l1.9 1 2.1-2.1-1-1.9c.3-.5.5-1 .7-1.6z'
  }
];

const IDLE = { phase: 'idle', percent: 0, status: '', error: '', logs: [] };

export default function App() {
  const [tab, setTab] = useState('play');
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

  return (
    <div className="app">
      <Background />
      <TitleBar />

      <div className="body">
        <nav className="sidebar glass">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {tab === t.id && <motion.span layoutId="nav-pill" className="nav-pill" />}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d={t.icon} fill="currentColor" />
              </svg>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <main className="content">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              className="screen"
              initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {tab === 'play' && (
                <Play
                  settings={settings}
                  versions={versions.length ? versions : [settings.version]}
                  state={game}
                  onChange={change}
                  onPlay={play}
                />
              )}
              {tab === 'mods' && <Mods />}
              {tab === 'settings' && (
                <Settings settings={settings} onChange={change} onAccountChange={loadSettings} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
