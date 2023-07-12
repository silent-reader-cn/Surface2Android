/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { nativeImage, Tray } from 'electron';
import { run } from './xnutil';
//import { height, width } from 'screenz';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}


export function createDeviceIcon(deviceName:string = "我的安卓设备") {
  const tray = new Tray(
    nativeImage.createFromPath(
      path.join(__dirname ,"../../assets/android_icon.png"
      ) )
    );
  tray.setToolTip(
    `点击切换到 "${deviceName}"`
  );
  return tray;
}

export async function getDeviceSize():Promise<{ width: number; height: number; }>{
  const rawtxt = await run(
    "wmic"
    ,"path",
    "Win32_VideoController",
    "get",
    "VideoModeDescription,CurrentVerticalResolution,CurrentHorizontalResolution",
    "/format:value"
  );
  const width = /CurrentHorizontalResolution=(\d+)/.exec(rawtxt);
  const height = /CurrentVerticalResolution=(\d+)/.exec(rawtxt);
  if(!width || !height)throw "获取分辨率失败";
  return {
    width:Number(width[1]),
    height:Number(height[1])
  };
}

