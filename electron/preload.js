const { contextBridge, ipcRenderer } = require('electron');

const INVOKE = new Set([
  'settings:get', 'settings:save', 'versions:get',
  'game:launch', 'auth:microsoft', 'auth:logout',
  'mods:list', 'mods:toggle', 'mods:add', 'mods:remove',
  'folder:open', 'win:min', 'win:max', 'win:close'
]);
const EVENTS = new Set([
  'launcher:status', 'launcher:progress', 'launcher:running',
  'launcher:closed', 'launcher:error', 'launcher:log'
]);

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, ...args) => {
    if (!INVOKE.has(channel)) throw new Error(`Канал не разрешён: ${channel}`);
    return ipcRenderer.invoke(channel, ...args);
  },
  on: (channel, callback) => {
    if (!EVENTS.has(channel)) throw new Error(`Событие не разрешено: ${channel}`);
    const handler = (_event, data) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  }
});
