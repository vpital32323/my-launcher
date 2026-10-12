import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fmt = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} МБ` : `${Math.max(1, Math.round(b / 1024))} КБ`);

export default function Mods() {
  const [mods, setMods] = useState([]);

  const load = useCallback(async () => setMods(await window.api.invoke('mods:list')), []);
  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (name) => {
    await window.api.invoke('mods:toggle', name);
    load();
  };
  const remove = async (name) => {
    await window.api.invoke('mods:remove', name);
    load();
  };
  const add = async () => {
    await window.api.invoke('mods:add');
    load();
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Моды</h2>
          <p>Работают с загрузчиком Fabric. Отключённые моды не загружаются в игру.</p>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={() => window.api.invoke('folder:open')}>
            Открыть папку
          </button>
          <button className="btn" onClick={add}>
            + Добавить
          </button>
        </div>
      </div>

      <div className="list glass">
        {mods.length === 0 && <div className="empty">Модов пока нет. Добавь .jar файлы.</div>}
        <AnimatePresence initial={false}>
          {mods.map((m) => (
            <motion.div
              key={m.name}
              layout
              className="list-item"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
            >
              <div className={`mod-name ${m.enabled ? '' : 'off'}`}>
                {m.name.replace(/\.disabled$/, '')}
                <small>{fmt(m.size)}</small>
              </div>
              <button className={`toggle small ${m.enabled ? 'on' : ''}`} onClick={() => toggle(m.name)}>
                <i />
              </button>
              <button className="icon-btn" onClick={() => remove(m.name)} aria-label="Удалить">
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
