const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('eletron', {
  minJanela:  ()              => ipcRenderer.send('win:min'),
  maxJanela:  ()              => ipcRenderer.send('win:max'),
  fecharJanela: ()            => ipcRenderer.send('win:close'),
  isMax:      ()              => ipcRenderer.invoke('win:ismax'),
  salvar:     (bytes, nome, filtros) => ipcRenderer.invoke('dlg:save', { bytes, nome, filtros }),
  abrir:      ()              => ipcRenderer.invoke('dlg:open'),
  printToPDF: (nome)          => ipcRenderer.invoke('pdf:print', { nome }),
  calcRota:   (cep)           => ipcRenderer.invoke('geo:rota', { cep })
})
