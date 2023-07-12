import { powershell, run } from "./xnutil";
const profileName = "本地连接";//loopback
//const tetherManager = `[Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager,Windows.Networking.NetworkOperators,ContentType=WindowsRuntime]::CreateFromConnectionProfile([Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime]::GetInternetConnectionProfile())`;
const profile = `[Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime]::GetConnectionProfiles() | where {$_.profilename -eq "${profileName}"}`;
const tetherManager = `[Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager,Windows.Networking.NetworkOperators,ContentType=WindowsRuntime]::CreateFromConnectionProfile((${profile}))`;
type WifiState = WifiProfile&{
    enabled:boolean
};

export async function isWifiHotSpotEnabled() :Promise<boolean>{
    const switch_result = await powershell(
        `${tetherManager}.TetheringOperationalState`
    ) as "Off" | "On";
    const enabled = switch_result.trim() === "On";
    return enabled;
}

export async function getWifiHotSpotState():Promise<WifiState>{
    
    const password = await powershell(
        `${tetherManager}.GetCurrentAccessPointConfiguration().passphrase`
    );
    const band = await powershell(
        `${tetherManager}.GetCurrentAccessPointConfiguration().band`
    );
    const band_int = Number(band) as 0 | 1 | 2;
    if(band_int<0 || band_int>2){
        throw "出现未能理解的band代码";
    }
    const ssid = await powershell(
        `${tetherManager}.GetCurrentAccessPointConfiguration().ssid`
    );
    return {
        enabled:await isWifiHotSpotEnabled(),
        password:password ?? "",
        band: band_int,
        ssid:ssid ?? ""
    };
}

type WifiProfile = {
    ssid:string,
    password:string,
    /**
     * 0 : Auto
     * 1 : 2.4ghz
     * 2 : 5ghz
     */
    band?: 0 | 1 | 2
}

export async function enableWifiHotSpot(setting:WifiProfile) {
    const command = [
        `$conf = ${tetherManager}.GetCurrentAccessPointConfiguration()`,
        `$conf.ssid = "${setting.ssid}"`,
        `$conf.passphrase = "${setting.password}"`,
        `$conf.band = "${setting.band ?? 0}"`,
        `${tetherManager}.ConfigureAccessPointAsync($conf)`,
        `${tetherManager}.StartTetheringAsync()`
    ].join(";");
    await powershell (command);
    return await isWifiHotSpotEnabled();
}

export async function disableWifiHotSpot() {
    await powershell(`${tetherManager}.StopTetheringAsync()`);
    return !(await isWifiHotSpotEnabled());
}

export async function getWifiState() : Promise<WifiState> {
    const rawtxt = await run("netsh","wlan","show","interfaces");
    const enabled = /已连接/.exec(rawtxt) !== null;
    const band = /5 GHz/.exec(rawtxt)!==null?1:2;
    const ssid_raw = /配置文件\s*:\s*(\S+)/.exec(rawtxt);
    const ssid = ssid_raw===null?"":ssid_raw[1];
    return{
        enabled,band,ssid,password:""
    };
}


export async function isSupport5Ghz():Promise<boolean> {
    const rawtxt = await run("netsh","wlan","show","drivers");
    return /5 GHz/.exec(rawtxt)!==null;
}