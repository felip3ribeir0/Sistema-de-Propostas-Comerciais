const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs   = require('fs')

let win = null

function createWindow () {
  win = new BrowserWindow({
    width: 1400, height: 900,
    minWidth: 1100, minHeight: 700,
    frame: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false
  })
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  win.once('ready-to-show', () => win.show())
  win.on('closed', () => { win = null })
  Menu.setApplicationMenu(null)
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (!win) createWindow() })

ipcMain.on('win:min',   () => win?.minimize())
ipcMain.on('win:max',   () => win?.isMaximized() ? win.unmaximize() : win?.maximize())
ipcMain.on('win:close', () => win?.close())
ipcMain.handle('win:ismax', () => win?.isMaximized() ?? false)

ipcMain.handle('dlg:save', async (_, { bytes, nome, filtros }) => {
  try {
    const r = await dialog.showSaveDialog(win, {
      defaultPath: nome,
      filters: filtros || [{ name: 'Arquivo', extensions: ['*'] }]
    })
    if (r.canceled || !r.filePath) return { ok: false }
    fs.writeFileSync(r.filePath, Buffer.from(bytes))
    return { ok: true, caminho: r.filePath }
  } catch (e) { return { ok: false, erro: e.message } }
})

ipcMain.handle('dlg:open', async () => {
  try {
    const r = await dialog.showOpenDialog(win, {
      filters: [{ name: 'Proposta Comercial', extensions: ['proposta'] }],
      properties: ['openFile']
    })
    if (r.canceled || !r.filePaths[0]) return { ok: false }
    const txt = fs.readFileSync(r.filePaths[0], 'utf-8')
    return { ok: true, txt, caminho: r.filePaths[0] }
  } catch (e) { return { ok: false, erro: e.message } }
})

ipcMain.handle('pdf:print', async (_, { nome } = {}) => {
  try {
    const data = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'none' }
    })
    const r = await dialog.showSaveDialog(win, {
      defaultPath: nome || 'Proposta_Comercial.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (r.canceled || !r.filePath) return { ok: false }
    fs.writeFileSync(r.filePath, data)
    return { ok: true, caminho: r.filePath }
  } catch (e) { return { ok: false, erro: e.message } }
})
