const { app, BrowserWindow, Menu, globalShortcut, ipcMain } = require('electron')
const compress_images = require("compress-images")

// Set env
process.env.NODE_ENV = 'production'
const isDev = process.env.NODE_ENV !== 'production' ? true : false

let mainWin
let aboutWin

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: isDev ? 1120 : 440,
    // width: 440,
    height: 650,
    minWidth: 370,
    minHeight: 600,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    // resizeble: isDev,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  })
  if (isDev) mainWin.webContents.openDevTools()
  mainWin.loadFile('./app/index.html')
  // mainWin.loadURL(`file://${__dirname}/app/index.html`)
}

function createAboutWindow() {
  aboutWin = new BrowserWindow({
    width: 600,
    height: 300,
    resizeble: false,
    autoHideMenuBar: true
  })
  aboutWin.loadFile('./app/about.html')
  // aboutWin.loadURL(`file://${__dirname}/app/about.html`)
}

ipcMain.on('img:sizeReduce', (e, { imgPath, outputPath, quality }) => {
  compress_images(imgPath, outputPath, { compress_force: true, statistic: false, autoupdate: true }, false,
    { jpg: { engine: "mozjpeg", command: ["-quality", quality - 15] } },
    { png: { engine: "pngquant", command: [`--quality=${quality}-${quality}`, '-o'] } },
    { svg: { engine: "svgo", command: false } },
    { gif: { engine: "gifsicle", command: ["--colors", quality, "--use-col=web"] } },
    function (error, completed) {
      console.log("-------------");
      console.log('error: ', error);
      console.log('completed: ', completed);
      e.reply('reply-size', error)
      // mainWin.webContents.send('reply-size')
      console.log("-------------");
    })
})

ipcMain.on('mainWin:resize', (e, resize) => {
  const [showImg, flexOn] = resize;
  const [posX, posY] = mainWin.getPosition()
  const [curWidth, curHeight] = mainWin.getSize()

  let toLeft = 0
  const SPEED_EXPAND_WIDTH = 100
  const OFFSET_LEFT = 45
  if (showImg) {
    let width = curWidth;
    const id = setInterval(() => {
      width += SPEED_EXPAND_WIDTH
      toLeft += OFFSET_LEFT
      mainWin.setSize(width, curHeight)
      mainWin.setPosition(posX - toLeft, posY)
      if (width >= 1120) { clearInterval(id) }
    }, 1)
  } else {
    let width = !flexOn ? 1120 : curWidth;
    const id = setInterval(() => {
      width -= SPEED_EXPAND_WIDTH
      toLeft += OFFSET_LEFT
      mainWin.setSize(width, curHeight)
      mainWin.setPosition(posX + toLeft, posY)
      if (width <= (!flexOn ? 440 : curWidth)) { clearInterval(id) }
    }, 1)
  }
})

app.on('ready', () => {
  createMainWindow()
  // createAboutWindow()
  const mainMenu = Menu.buildFromTemplate(menu)
  Menu.setApplicationMenu(mainMenu)
  globalShortcut.register('Ctrl+R', () => mainWin.reload())
  mainWin.on('closed', () => mainWin = null)
})

const menu = [
  {
    label: 'File', submenu:
      [
        { role: 'close', accelerator: 'Ctrl+Q' },
        { label: 'About', click: createAboutWindow },
      ],
  },
  {
    label: 'Dev',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { type: 'separator' },
      ...isDev ? { role: 'toggledevtools', label: 'Dev Tools', accelerator: 'Ctrl+D' } : '',
      // { role: 'toggledevtools', label: 'Dev Tools', accelerator: 'Ctrl+D' },
    ]
  }
]