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

// ── Cálculo de rota (distância) via CEP ──────────────────
// Origem fixa: Rua Xambrê, Parque Cisper, São Paulo - SP (coordenadas geocodificadas)
const ORIGEM = { lat: -23.4929315, lon: -46.4930230, nome: 'Rua Xambrê, Parque Cisper, São Paulo - SP' }

async function geocode (q) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=' + encodeURIComponent(q)
  const r = await fetch(url, { headers: { 'User-Agent': 'EngenheiroDoProjeto-Propostas/1.0 (contato@engenheirodoprojeto.com.br)' } })
  const j = await r.json()
  if (!j || !j.length) return null
  return { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon), nome: j[0].display_name }
}

ipcMain.handle('geo:rota', async (_, { cep } = {}) => {
  try {
    const cepLimpo = String(cep || '').replace(/\D/g, '')
    if (cepLimpo.length !== 8) return { ok: false, erro: 'CEP inválido (informe 8 dígitos)' }

    let viaCep = null
    try {
      const vr = await fetch('https://viacep.com.br/ws/' + cepLimpo + '/json/')
      const vj = await vr.json()
      if (vj && !vj.erro) viaCep = vj
    } catch (_) {}

    // tenta endereço completo → cidade/UF → CEP puro
    let dest = null
    if (viaCep) {
      const ruaQ = [viaCep.logradouro, viaCep.bairro, viaCep.localidade, viaCep.uf].filter(Boolean).join(', ')
      if (ruaQ) dest = await geocode(ruaQ + ', Brasil')
      if (!dest && viaCep.localidade) dest = await geocode(viaCep.localidade + ', ' + (viaCep.uf || '') + ', Brasil')
    }
    if (!dest) dest = await geocode(cepLimpo + ', Brasil')
    if (!dest) return { ok: false, erro: 'Não foi possível localizar o CEP do cliente' }

    const destNome = viaCep
      ? [viaCep.logradouro, viaCep.bairro, (viaCep.localidade || '') + (viaCep.uf ? '/' + viaCep.uf : '')].filter(Boolean).join(', ')
      : dest.nome

    const ru = `https://router.project-osrm.org/route/v1/driving/${ORIGEM.lon},${ORIGEM.lat};${dest.lon},${dest.lat}?overview=false`
    const rr = await fetch(ru)
    const rj = await rr.json()
    if (!rj || rj.code !== 'Ok' || !rj.routes || !rj.routes.length) return { ok: false, erro: 'Não foi possível calcular a rota' }
    const kmIda = rj.routes[0].distance / 1000
    return { ok: true, kmIda, destino: destNome, origem: ORIGEM.nome }
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
