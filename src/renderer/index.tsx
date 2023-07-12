import { createRoot } from 'react-dom/client';
import App from './App';
import { QRCode } from './qrcode';
import SettingPage from './setting';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);


// calling IPC exposed from preload script
window.electron.ipcRenderer.once('mode', (mode) => {
  // eslint-disable-next-line no-console
  console.log(mode);
  if(mode === "qrcode")
    root.render(<QRCode />);
  else
    root.render(<SettingPage />);
});
window.electron.ipcRenderer.sendMessage('mode', ['ping']);
