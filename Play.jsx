import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLIENT_NAME, CLIENT_TAGLINE } from '../config.js';

const ICONS = {
  play: 'M8 5v14l11-7z',
  version:
    'M12 2l9 5v10l-9 5-9-5V7l9-5zm0 2.3L5.5 7.9 12 11.5l6.5-3.6L12 4.3zM5 9.6v6.8l6 3.3v-6.8L5 9.6zm14 0l-6 3.3v6.8l6-3.3V9.6z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z',
  loader: 'M13 2L4 14h6l-1 8 9-12h-6z',
  mods: 'M12 3l9 5-9 5-9-5 9-5zm-7.5 8.2L12 15.4l7.5-4.2L21 12l-9 5-9-5 1.5-.8zm0 4L12 19.4l7.5-4.2L21 16l-9 5-9-5 1.5-.8z',
  settings:
    'M12 8a4 4 0 100 8 4 4 0 000-8zm8.5 5.5v-3l-2.1-.6a6.9 6.9 0 00-.7-1.6l1-1.9-2.1-2.1-1.9 1a6.9 6.9 0 00-1.6-.7L12.5 3h-3l-.6 2.1a6.9 6.9 0 00-1.6.7l-1.9-1-2.1 2.1 1 1.9c-.3.5-.5 1-.7 1.6l-2.1.6v3l2.1.6c.2.6.4 1.1.7 1.6l-1 1.9 2.1 2.1 1.9-1c.5.3 1 .5 1.6.7l.6 2.1h3l.6-2.1c.6-.2 1.1-.4 1.6-.7l1.9 1 2.1-2.1-1-1.9c.3-.5.5-1 .7-1.6z',
  exit: 'M10 3H5a2 2 0 00-2 2v14a2 2 0 002 2h5v-2H5V5h5zm7.6 4.6L16.2 9l2 2H9v2h9.2l-2 2 1.4 1.4L22 12z',
  chevron: 'M9 5l7 7-7 7-1.4-1.4L13.2 12 7.6 6.4z'
};

function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#logo-grad)" />
      <path
        d="M17 14H47V21H36V43H47V50H17V43H28V21H17Z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Одна кнопка меню: иконка слева, подпись, значение справа
function MenuButton({
  icon,
  label,
  value,
  onClick,
  primary,
  disabled,
  center,
  delay = 0,
  children
}) {
  const clickable = !!onClick && !disabled;
  const classes = [
    'mbtn',
    primary ? 'primary' : '',
    center ? 'center' : '',
    disabled ? 'disabled' : '',
    clickable || children ? 'live' : ''
  ].join(' ');

  return (
    <motion.div
      className={classes}
      role="button"
      tabIndex={disabled ? -1 : 0}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={clickable ? onClick : undefined}
      onKeyDown={(e) => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) onClick();
      }}
    >
      {children?.fill}
      <span className="mbtn-icon">
        <Icon d={icon} size={15} />
      </span>
      <span className="mbtn-label">{label}</span>
      {value !== undefined && <span className="mbtn-value">{value}</span>}
      {children?.right}
      {children?.overlay}
    </motion.div>
  );
}

export default function Play({ settings, versions, state, onChange, onPlay, onNavigate }) {
  const { phase, percent, status, error } = state;
  const busy = phase !== 'idle';
  const account = settings.account;
  const [editingNick, setEditingNick] = useState(false);

  const playLabel = { idle: 'Играть', launching: 'Запуск…', running: 'Игра запущена' }[phase];
  const fillWidth = phase === 'running' ? '100%' : phase === 'launching' ? `${percent}%` : '0%';
  const statusText =
    phase === 'launching'
      ? `${status || 'Подготовка…'} · ${percent}%`
      : phase === 'running'
        ? 'Minecraft запущен'
        : '';

  const playerName = account?.name || settings.nick || 'Player';
  const chipStatus = { idle: 'Готов к запуску', launching: 'Запуск…', running: 'В игре' }[phase];

  return (
    <div className="menu">
      <motion.div
        className="logo"
        initial={{ opacity: 0, y: -14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="logo-row">
          <LogoMark />
          <h1>{CLIENT_NAME}</h1>
        </div>
        <p>{CLIENT_TAGLINE}</p>
      </motion.div>

      <div className="mlist">
        <MenuButton
          primary
          icon={ICONS.play}
          label={playLabel}
          onClick={onPlay}
          disabled={busy}
          delay={0.05}
        >
          {{
            fill: <div className="mbtn-fill" style={{ width: fillWidth }} />,
            right: !busy && (
              <span className="mbtn-chevron">
                <Icon d={ICONS.chevron} size={16} />
              </span>
            )
          }}
        </MenuButton>

        <MenuButton
          icon={ICONS.version}
          label="Версия"
          value={settings.version}
          disabled={busy}
          delay={0.1}
        >
          {{
            overlay: (
              <select
                className="mbtn-select"
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
            )
          }}
        </MenuButton>

        <MenuButton
          icon={ICONS.user}
          label={account ? 'Аккаунт' : 'Ник'}
          value={editingNick && !account ? undefined : account ? account.name : settings.nick || 'Введите ник'}
          disabled={busy}
          onClick={account ? undefined : () => setEditingNick(true)}
          delay={0.15}
        >
          {{
            right:
              editingNick && !account ? (
                <input
                  className="mbtn-input"
                  autoFocus
                  value={settings.nick}
                  maxLength={16}
                  placeholder="Steve"
                  onChange={(e) => onChange({ nick: e.target.value })}
                  onBlur={() => setEditingNick(false)}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                />
              ) : null
          }}
        </MenuButton>

        <MenuButton
          icon={ICONS.loader}
          label="Загрузчик"
          value={settings.useFabric ? 'Fabric' : 'Vanilla'}
          disabled={busy}
          onClick={() => onChange({ useFabric: !settings.useFabric })}
          delay={0.2}
        >
          {{
            right: <span className={`mswitch ${settings.useFabric ? 'on' : ''}`} />
          }}
        </MenuButton>

        <MenuButton icon={ICONS.mods} label="Моды" onClick={() => onNavigate('mods')} delay={0.25}>
          {{
            right: (
              <span className="mbtn-chevron">
                <Icon d={ICONS.chevron} size={16} />
              </span>
            )
          }}
        </MenuButton>

        <div className="mrow">
          <MenuButton
            center
            icon={ICONS.settings}
            label="Настройки"
            onClick={() => onNavigate('settings')}
            delay={0.3}
          />
          <MenuButton
            center
            icon={ICONS.exit}
            label="Выход"
            onClick={() => window.api.invoke('win:close')}
            delay={0.35}
          />
        </div>
      </div>

      <div className="menu-status">{statusText}</div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="error menu-error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="foot-left">
        {CLIENT_NAME} · Minecraft {settings.version}
        {settings.useFabric ? ' · Fabric' : ''}
      </div>

      <div className="chip">
        <span className="chip-avatar">{playerName.charAt(0).toUpperCase()}</span>
        <span className="chip-text">
          <b>{playerName}</b>
          <small>{chipStatus}</small>
        </span>
      </div>
    </div>
  );
}
