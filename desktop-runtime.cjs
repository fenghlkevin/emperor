const fs = require('node:fs');
const path = require('node:path');

function attachRuntimeDiagnostics(app, window, { onRecoveryFailed = () => {} } = {}) {
  const logPath = path.join(app.getPath('userData'), 'runtime.log');
  let quitting = false;
  let recovered = false;
  const record = (event, details = {}) => {
    try {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      if (fs.existsSync(logPath) && fs.statSync(logPath).size > 1024 * 1024)
        fs.renameSync(logPath, `${logPath}.previous`);
      fs.appendFileSync(logPath, `${JSON.stringify({ at: new Date().toISOString(), event, ...details })}\n`);
    } catch (error) { console.error('无法写入运行日志', error.message); }
  };
  const beforeQuit = () => { quitting = true; };
  app.on('before-quit', beforeQuit);
  window.once('closed', () => { app.removeListener('before-quit', beforeQuit); });
  window.webContents.on('render-process-gone', (_event, details) => {
    record('render-process-gone', details);
    if (quitting || window.isDestroyed() || details.reason === 'clean-exit') return;
    if (recovered) { onRecoveryFailed(logPath); return; }
    recovered = true;
    // The last successful action is already stored; reload never creates a new dynasty.
    record('recover-renderer');
    window.webContents.reload();
  });
  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    if (errorCode !== -3) record('did-fail-load', { errorCode, errorDescription });
  });
  window.webContents.on('console-message', details => {
    if (details.level === 'error' || details.level === 3)
      record('renderer-error', { message: details.message, source: details.sourceId, line: details.lineNumber });
  });
  record('window-start', { version: app.getVersion() });
  return { logPath };
}
module.exports = { attachRuntimeDiagnostics };
