const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('emperorDesktop',{quit:()=>ipcRenderer.send('emperor:quit')});
