import { readFileSync } from 'fs';
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, Notification, powerSaveBlocker } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import {  createDeviceIcon, getDeviceSize, resolveHtmlPath } from './util';
import { autoWifiConnect, connect, dpi, generateQRCode, getprop,  init,  isConnected,   onAdbServiceDetected,   onDeviceConnected,   onDeviceDetected,   probe,    rotate,  stableProbe,  waitForConnect, waitForDisconnect, waitWifiADB, wm_size } from './adbridge';
import { disconnect, exit, title } from 'process';
import { notify } from './xnelectronutil';
import { ping, restartExplorer, run, sleep, terminateProcess } from './xnutil';
import { scrcpy } from './scrcpy';
import { disableEdgeUI, enableEdgeUI, getAutoRotation, setAutoRotation } from './edgeui';
import { Tray } from './tray';
import { disableWifiHotSpot, enableWifiHotSpot, isWifiHotSpotEnabled } from './wifi';
import { writeFile } from 'fs';
import configProxy from './xnconfig';
import { checkAutoLaunchStatus, disableAutoLaunch, enableAutoLaunch } from './autorun';

//////////////////////////////////////////////////////////////////////////////
const config = configProxy


const adbCachePath = "./adb.cache";
async function refreshTray(tray:Tray,times:number = 3){
  if(times<0)return;
  if(await isConnected()){
    tray.icon = "android";
    tray.tooltip = "点击切换安卓模式"
    return;
  }
  const wifi  = await isWifiHotSpotEnabled();
  tray.wifi = wifi;
  tray.icon = wifi?"wifi":"nowifi";
  tray.tooltip = wifi?'热点已开启':'热点已关闭';
  sleep(500);
  await refreshTray(tray,times-1);
}
app.on("quit",()=>{
  terminateProcess("adb.exe")
})
const InitObserver = (
  async function () {
    try{
    await terminateProcess("adb.exe")
  }catch{
    //notify("重置adb失败,请尝试使用管理员权限运行.");
    //app.exit();
  }
    await init();
    var cache_adbip :string = "";
    onAdbServiceDetected((ipport:string)=>{
      writeFile(adbCachePath,ipport,console.log);
      cache_adbip = ipport;
    });
    const tryConnectCacheAdb = ()=>{
      try {
        connect(cache_adbip);
      } catch (error) {
        
      }
    }
    try {
      cache_adbip = readFileSync(adbCachePath).toString();
      tryConnectCacheAdb();      
    } catch (error) {
      console.log("未成功连接上次端口:",cache_adbip);
    }

    var notified:boolean = false;
    var locking : boolean = false;
    var tray = new Tray();
    
    refreshTray(tray);
    tray.onPairMenuClick = async ()=>{
      const iid = setInterval(tryConnectCacheAdb,1000);
      await showPairCode(generateQRCode())
      clearInterval(iid);
    };
    tray.onWifiSettingMenuClick = createWindow;
    tray.onWifiEnableMenuClick = (menu)=>{
      if(menu.checked)
        enableWifiHotSpot({
          ssid: config.ssid?? "surface2android",
          password:config.password??"s2a123456",
          band:config.frequency??2
        }).then(()=>refreshTray(tray));
      else 
        disableWifiHotSpot().then(()=>refreshTray(tray));
    };
    const checkAutoLaunch = ()=>checkAutoLaunchStatus().then(b=>{tray.autoLaunch=b;});
    checkAutoLaunch();
    tray.onAutoLaunchMenuClick = (menu)=>{
      if(menu.checked)
        disableAutoLaunch();
      else 
        enableAutoLaunch();
      sleep(100).then(checkAutoLaunch)
    };

    try {
    
      enableEdgeUI()
    } catch (error) {
      notify("重置边缘UI失败,请联系开发者")
    }
    
    tray.onScanMenuClick = ()=>{
      probe();
      tryConnectCacheAdb();
      notify("设备已尝试重新扫描,如果仍然无法连接且您已配对设备,请尝试开关wifi无线调试.")
    }

        tray.tray.on("click",async ()=>{
          if(tray.icon!=="android")
            return tray.toggleWifiHotSpot();
          if(locking)return console.log("上个事务还未结束");
          locking=true;
          var orgAutoRotation:1|0 = 0;
          if(config.adaptiveRotationWindows){
            orgAutoRotation = await getAutoRotation();
            setAutoRotation(1);
          }
          if(config.blockWindowsGestures){
          await disableEdgeUI();
          await restartExplorer();}
          const scrSize = await getDeviceSize();
          try {
            if(config.adaptiveResolution)
            await wm_size(
              Math.min(scrSize.width,scrSize.height),
              Math.max(scrSize.height,scrSize.width)
            );
            
            rotate("landscape");
            if(config.customDPI)
            dpi(config.customDPI);
          } catch (error) {
            console.error(error);
          }
          
          const psbID = powerSaveBlocker.start("prevent-display-sleep");
          try {
            
            await scrcpy(config.scrcpyPath,{
              fullScreen:true,
              screenOff:true,
              videoBitRate:config.transmissionRate?`${config.transmissionRate}M`: "6M",
              maxSize:Math.max(scrSize.width,scrSize.height),
              fps:config.maxFPS??60,
              stayAwake:config.disableAutoLock?true:false,
              videoCodec:config.videoCodec ?? "h265",
              noAudio:config.disableAudio,
              rotation:config.adaptiveRotation?1:0
            });
          } catch (error) {
            if(
              (error?.toString().indexOf("Device disconnected") ?? -1)<0
            ){
              console.error( error);
            }
            console.log("SCRCPY设备已断开")
          }
          
          powerSaveBlocker.stop(psbID);
          try {
            
          var mobileSize = await wm_size();
          if(config.adaptiveResolution)
            wm_size(mobileSize.width,mobileSize.height);
        
        rotate("portrait");
        dpi("reset");
          } catch (error) {
            if(
              (error?.toString().indexOf("no devices") ?? -1) < 0
            ){
              console.error(error);
            }
            notify("设备未经重设分辨率断开,这可能导致某些显示问题,请重新连接设备并正常关闭来恢复设备分辨率.");
          }
          
        if(config.blockWindowsGestures){
        await enableEdgeUI();
        if(config.adaptiveRotationWindows)
          await setAutoRotation(orgAutoRotation);
        restartExplorer();}

          locking = false;
          });
    onDeviceConnected({connect:()=>{
      refreshTray(tray)
    },disconnect: async ()=>{
      notified=false;
        refreshTray(tray);
    }});

    autoWifiConnect({
      connect:()=>refreshTray(tray),
      connectFailed:()=>{
        if(!notified)
          notify("如果您是第一次连接设备,请右键托盘图标进行配对.","连接失败");
        notified=true;
      },
      disconnect:connect,
      pair:tryConnectCacheAdb
      //paircodeGenerPrepared:(gencode)=>(getcode = gencode)
    }).catch(console.log);

    onDeviceDetected(()=>{
      stableProbe();
    });
  }
);

app.on("ready",InitObserver);


//////////////////////////////////////////////////////////////////////////////
class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    //.catch(console.log);
};


function showPairCode(pairdata:string){
    // qrcodePair((pairdata)=>{
      const window = new BrowserWindow({
        width:300,height:300,
        frame:false,
        webPreferences: {
          preload: app.isPackaged
            ? path.join(__dirname, 'preload.js')
            : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
      })
      /* window.loadURL(app.isPackaged
        ? path.join(process.resourcesPath, 'assets', 'qrcode.html')
        : path.join(__dirname, '../../assets', 'qrcode.html')
      ); */
      window.webContents.on("ipc-message",(e,channel)=>{
        if(channel==="close")return window.close();
        if(channel==="mode")return window.webContents.send("mode","qrcode");
        if(channel==="qrdata")return window.webContents.send("qrdata",pairdata);
      })
      window.loadURL(resolveHtmlPath("index.html"));
      
      window.show();
      return new Promise<void>((resolve, reject) => {
        waitForConnect().then(()=>{
          resolve();
          try {
            window.close()
          } catch (error) {
            
          }
        })
      })
    // })
    
}

/////////////////////////////////////TEMP CODE////////////////////////////////////

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    title :"参数设置",
    autoHideMenuBar:true,
    width: 524,
    height: 768,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });
  
  const window = mainWindow;
  mainWindow.webContents.on("ipc-message",(e,channel,...args)=>{
    console.log(channel,...args);
    if(channel==="close")return window.close();
    if(channel==="mode")return window.webContents.send("mode","setting");
    if(channel==="setting-sync")return window.webContents.send("setting",args[0],configProxy[args[0]]); 
    if(channel==="setting")
      return config[args[0]]=(NaN ===args[1])?0:args[1]  ;
    //if(channel==="qrdata")return window.webContents.send("qrdata",pairdata);
  })
  mainWindow.loadURL(resolveHtmlPath("index.html"));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  //const menuBuilder = new MenuBuilder(mainWindow);
  //menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    //app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    //createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      //if (mainWindow === null) createWindow();
    });
  })
  //.catch(console.log);
