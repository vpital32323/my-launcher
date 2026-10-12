import { useState } from 'react';

export default function Settings({ settings, onChange, onAccountChange }) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const account = settings.account;

  const login = async () => {
    setLoading(true);
    setMsg('');
    const res = await window.api.invoke('auth:microsoft');
    setLoading(false);
    if (!res.ok) setMsg(res.error);
    else onAccountChange();
  };

  const logout = async () => {
    await window.api.invoke('auth:logout');
    onAccountChange();
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Настройки</h2>
          <p>Память, Java и аккаунт.</p>
        </div>
      </div>

      <div className="glass card">
        <div className="setting">
          <div>
            <h3>Оперативная память</h3>
            <p>Сколько ОЗУ выделить игре</p>
          </div>
          <div className="slider-wrap">
            <input
              type="range"
              min="1"
              max="16"
              step="1"
              value={settings.ram}
              onChange={(e) => onChange({ ram: Number(e.target.value) })}
            />
            <b>{settings.ram} ГБ</b>
          </div>
        </div>

        <div className="setting">
          <div>
            <h3>Путь к Java</h3>
            <p>Пусто — используется Java из системы</p>
          </div>
          <input
            className="input wide"
            value={settings.javaPath}
            placeholder="C:\Program Files\Java\jdk-21\bin\javaw.exe"
            onChange={(e) => onChange({ javaPath: e.target.value })}
          />
        </div>

        <div className="setting">
          <div>
            <h3>Аккаунт Microsoft</h3>
            <p>{account ? `Вы вошли как ${account.name}` : 'Без входа игра запускается по нику (оффлайн)'}</p>
          </div>
          {account ? (
            <button className="btn ghost" onClick={logout}>
              Выйти
            </button>
          ) : (
            <button className="btn" onClick={login} disabled={loading}>
              {loading ? 'Ожидание…' : 'Войти'}
            </button>
          )}
        </div>
        {msg && <div className="error">{msg}</div>}

        <div className="setting">
          <div>
            <h3>Папка игры</h3>
            <p>Миры, моды, ресурспаки</p>
          </div>
          <button className="btn ghost" onClick={() => window.api.invoke('folder:open')}>
            Открыть
          </button>
        </div>
      </div>
    </div>
  );
}
