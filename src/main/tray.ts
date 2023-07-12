import path from "path";
import electron, { app, Menu, MenuItem, MenuItemConstructorOptions, nativeImage } from "electron";

import { isSupport5Ghz } from "./wifi";


function resolvePic(filename:string){
    return app.isPackaged
        ? path.join(process.resourcesPath, 'assets', filename)
        : path.join(__dirname, '../../assets', filename);
}
const iconDict = {
    wifi:resolvePic("wifi.png"),
    nowifi:resolvePic("no_wifi.png"),
    android:resolvePic("android_icon.png"),
};

type TrayIcon = "wifi"| "nowifi" | "android";

export class Tray {
    private _tray : electron.Tray;
    
    public get tray() : electron.Tray {
        return this._tray;
    }
    
    private _menu : Menu;
    private _icon : TrayIcon = "nowifi";

    public set icon(v : TrayIcon) {
        this._icon = v;
        this._tray.setImage(
            nativeImage.createFromPath(iconDict[this._icon])
        );
        // = v!=="nowifi";
    }

    public set wifi(v:boolean){
        this._wifispotenable.checked = v;
    }

    public get wifi(){
        return this._wifispotenable.checked;
    }

    public set autoLaunch(v:boolean){
        this._autolaunch.checked = v;
    }

    public get autoLaunch(){
        return this._autolaunch.checked;
    }

    public get icon(){
        return this._icon;
    }

    private _tooltip:string = "";
    public set tooltip(v : string) {
        this._tray.setToolTip( v );
        this._tooltip = v;
    }

    
    public get tooltip() : string {
        return this._tooltip;
    }
    
    public onWifiEnableMenuClick :(target:Electron.MenuItem)=>void = console.log;
    public onWifiSettingMenuClick :(target:Electron.MenuItem)=>void = console.log;
    public onScanMenuClick :(target:Electron.MenuItem)=>void = console.log;
    public onPairMenuClick :(target:Electron.MenuItem)=>void = console.log;
    public onAutoLaunchMenuClick :(target:Electron.MenuItem)=>void = console.log;
    
    private _autolaunch:MenuItem;

    private _wifispotenable:MenuItem;
    public toggleWifiHotSpot(){
        this._wifispotenable.click();
    }
    constructor(){
        this._tray = new electron.Tray(
            iconDict["nowifi"]
        );
        //this.icon = "nowifi";
        
        this._menu = new Menu();
        var wifispotenable : MenuItem;

        
        this._menu.append(
            new MenuItem(
                {
                    label:"重新扫描",
                    id:"scan",
                    click:(e)=>this.onScanMenuClick(e)
                }
            )
        );
        this._menu.append(
            new MenuItem(
                {
                    label:"设备配对",
                    id:"pair",
                    click:(e)=>this.onPairMenuClick(e)
                }
            )
        );

     
        this._menu.append(
            new MenuItem(
                {
                    type:"separator"
                }
            )
        );
       
                
        this._menu.append(
            this._autolaunch  =  new MenuItem(
            {
                type:"checkbox",
                checked:false,
                click:(e)=>this.onAutoLaunchMenuClick(e),
                label:"开机启动",
                id:"autolaunch",
            }
            )
        );

        this._menu.append(
            this._wifispotenable = wifispotenable = new MenuItem(
            {
                type:"checkbox",
                checked:false,
                click:(e)=>this.onWifiEnableMenuClick(e),
                label:"Wifi热点",
                id:"wifi",
            }
            )
        );

        this._menu.append(
            new MenuItem(
                {
                    type:"separator"
                }
            )
        );
       

        this._menu.append(
            new MenuItem(
                {
                    //type:"checkbox",
                    //checked:false,
                    click:(e)=>this.onWifiSettingMenuClick(e),
                    label:"参数设置",
                    id:"wifi_setting"
                }
            ),
        )

        this._menu.append(
            new MenuItem(
                {
                    //type:"checkbox",
                    //checked:false,
                    click:(e)=>app.exit(),
                    label:"退出",
                    id:"exit"
                }
            ),
        )

        isSupport5Ghz().then(
            supported => wifispotenable.enabled = supported
        );

        this._tray.setContextMenu(
            this._menu
        );
    }

}