import { motion, AnimatePresence } from 'framer-motion';
import { CLIENT_NAME, CLIENT_TAGLINE } from '../config.js';

export default function Play({ settings, versions, state, onChange, onPlay }) {
  const { phase, percent, status, error, logs } = state;
  const busy = phase !== 'idle';
  const account = settings.account;

  const label = {
    idle: 'ИГРАТЬ',
    launching: 'ЗАПУСК…',
    running: 'ИГРА ЗАПУЩЕНА'
  }[phase];

  return (
    <div className="play">
      <div className="hero">
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {CLIENT_NAME}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {CLIENT_TAGLINE}
        </motion.p>
      </div>

      <motion.div
        className="panel glass"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence>
          {busy && (
            <motion.div
              className="progress-wrap"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="progress">
                <motion.div
                  className="progress-fill"
                  animate={{ width: phase === 'running' ? '100%' : `${percent}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                />
              </div>
              <div className="progress-text">
                <span>{phase === 'running' ? 'Minecraft работает' : status}</span>
                <span>{phase === 'running' ? '' : `${percent}%`}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="controls">
          <label className="field">
            <span>{account ? 'Аккаунт Microsoft' : 'Ник'}</span>
            {account ? (
              <div className="input readonly">{account.name}</div>
            ) : (
              <input
                className="input"
                value={settings.nick}
                maxLength={16}
                disabled={busy}
                onChange={(e) => onChange({ nick: e.target.value })}
                placeholder="Steve"
              />
            )}
          </label>

          <label className="field">
            <span>Версия</span>
            <select
              className="input"
              value={settings.version}
              disabled={busy}
              onChange={(e) => onChange({ version: e.target.value })}
            >
              {versions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="field fabric">
            <span>Загрузчик</span>
            <button
              className={`toggle ${settings.useFabric ? 'on' : ''}`}
              disabled={busy}
              onClick={() => onChange({ useFabric: !settings.useFabric })}
            >
              <i />
              <b>{settings.useFabric ? 'Fabric' : 'Vanilla'}</b>
            </button>
          </label>

          <motion.button
            className={`play-btn ${busy ? 'busy' : ''}`}
            disabled={busy}
            onClick={onPlay}
            whileHover={busy ? {} : { scale: 1.04 }}
            whileTap={busy ? {} : { scale: 0.97 }}
          >
            <span className="shine" />
            <span className="play-label">{label}</span>
          </motion.button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {logs.length > 0 && (
        <div className="log glass">
          {logs.slice(-6).map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
