import { exec, execFile, execFileSync, execSync, spawn, spawnSync } from "child_process";
import { nanoid } from "nanoid";
import configProxy from "./xnconfig";
import { run, sleep } from "./xnutil";
//const mDnsSd = require('node-dns-sd');
//const { nanoid } = require('nanoid');
const mdns = require('multicast-dns')();
type ConnectListener = {
    connect?:Function,
    connectFailed?:Function,
    disconnect?:Function,
    pair?:Function
};

export async function adb(...commands:string[]):Promise<string> {
    try {
        return await run(configProxy.adbPath,...(commands.length?commands:[""]))
    } catch (error) {
        if(!error?.toString().includes("more than one device"))
            throw error;
        const devs = await devices();
        return await adb("-s",devs[devs.length-1],...commands);    
    }
}
export async function devices() {
    const stdout = await adb("devices") as string;
    const devices = stdout.trim().split('\n').slice(1);
    return devices.map(device => device.split('\t')[0]);
}
export async function shell(...commands:string[]){
    return await adb("shell",...(commands.length?commands:[""]))
}
export async function wm_size(width?:Number,height?:Number)
: Promise<{width:Number,height:Number}> {
    if(width)
        await shell("wm","size",`${width}x${height}`)
    const rawStr =  await shell("wm","size");
    const execResult = /Physical size: (\d+)x(\d+)/.exec(rawStr);
    if(!execResult || execResult?.length<3)throw "error";
    return {
        width:Number( execResult[1]),
        height:Number(execResult[2])
    };
}
export async function dpi(dpi:Number | "reset") {
    await shell("wm","density",dpi.toString())
}
export async function rotate(direction:"landscape"|"portrait") {
    await shell("wm","user-rotation","-d","0", "lock", direction==="landscape"?"1":"0");
}
export async function connect(ip:string,trytimes:number = 10) :Promise<boolean>{
    
    if(trytimes<0)return false;
    try{
        console.log(ip);
        const result = await adb("connect",ip);
        if(result && result.indexOf("failed")>=0)
            return false;
    }catch(e){
        console.log(e);
        await sleep(2500);
        return await connect(ip,trytimes-1);
    }
    return true;
}
export async function disconnect() :Promise<boolean>{
    try{
        await adb("disconnect")
    }catch(e){
        //console.log(e);
        return false;
    }
    return true;
}
export async function tcpip(port:Number) {
    await shell("tcpip",port.toString())
}
export async function getprop():Promise<Object> {
    const data = await shell("getprop");
    const searchResult = Object.fromEntries( data.split("\n").map(line=>{ 
        const lineMatch = /\[([^\]]+)\]:\s+\[([^\]]+)\]/.exec(line);
        if(null === lineMatch)return [];
        return [lineMatch[1],lineMatch[2]];
    }).filter(v=>v.length));
    console.log(searchResult)
    return searchResult;
}
export async function waitForConnect() : Promise<void> {
    await adb("wait-for-device");
}

export async function waitForDisconnect(){
    try {
        await shell()
    } catch (error) {
        
    }
    
}

export async function onDeviceConnected(option:{connect:Function,disconnect:Function}={connect:console.log,disconnect:console.log}) {
  while (true) {
    await waitForConnect();
    console.log("设备已连接");
    option.connect(true);
    await waitForDisconnect();
    console.log("设备已断开");
    option.disconnect(false);
  }
}
export async function pair(host:string,password:string) {
    return await adb(`pair`, host, password);
}

export function onAdbServiceDetected(ondetected:Function = console.log) {
    const listener = (data:{ additionals:any,answers:[{name:string,type:string,data:{port:number,target:string}}]},baseinfo:any)=>{
        if(data &&
            data.answers && 
            data.answers?.length)
        {
            
            const SRV = 
            (data.answers.concat(data.additionals)).find(v=>v.name.indexOf("_adb-tls-connect._tcp.local")>=0 && v.type==="SRV") ;
            if(SRV){
                //console.log(SRV.name);
                //mdns.off("response",listener);
                ondetected (`${baseinfo.address}:${SRV.data.port}`);
            }
        }
    };
    mdns.on('response', listener);
    return ()=>{
        mdns.on('response', listener);
    };
}
export function waitWifiADB(onpair?:Function):Promise<string> {
    const password:string = qrcode_password;
    
    //console.log("等待ADB")
    return new Promise((res,rej)=>{
        const listener = (data:{ additionals:any,answers:[{name:string,type:string,data:{port:number,target:string}}]},{address}:{address:string})=>{
            if(data &&
                data.answers && 
                data.answers?.length)
            {
                //console.log(data)
                const PAIR =(data.answers.concat(data.additionals)).find(v=>v.name.indexOf("_adb-tls-pairing._tcp.local")>=0 && v.type==="SRV") ;
                if(PAIR&&password){
                    console.log(PAIR.name);
                    pair (`${address}:${PAIR.data.port}`,password);
                    try {
                        if (onpair)
                            onpair(PAIR);
                    } catch (error) {
                        
                    }
                    //mDnsSd.stopMonitoring();
                    return probe(); 
                }
    
                const SRV = 
                (data.answers.concat(data.additionals)).find(v=>v.name.indexOf("_adb-tls-connect._tcp.local")>=0 && v.type==="SRV") ;
                if(SRV){
                    console.log(SRV.name);
                    mdns.off("response",listener);
                    res (`${address}:${SRV.data.port}`);
                    //mDnsSd.stopMonitoring(); 
                }
                //("._adb-tls-connect._tcp.local")
            }
        };
        mdns.on('response', listener);
        //mdns.on('response', d=>console.log(JSON.stringify(d)));
        // 
        
        sleep(100).then(probe);
        //写到外面可以防止多次重复配对
        
    })
}
export function probe() {
    mdns.query({
        questions:[{
          name: '_adb-tls-connect._tcp.local',
          //name:"_services._udp.local",
          type: 'PTR'
        }]
    });
    mdns.query({
        questions:[
            {
                name:"_adb-tls-connect._tcp.local",
                type: "A"
            }
        ]
    })
}
/**
 * 永久启用自动连接局域网设备 
 * @param onconnect 当获取到客户端后触发事件,返回内容
 */
export async function autoWifiConnect(
    option:ConnectListener = {}
    ) {
    while(1){
        const ipaddress = await waitWifiADB(option.pair)
        const connectOK = await (connect(ipaddress));
        console.log("connect",connectOK)
        if(!connectOK){
            try {
                (option.connectFailed??console.log)(ipaddress);
            } catch (error) {
                console.log(error);
            }
            continue;
        }
        try {
            (option.connect??console.log)(ipaddress);
        } catch (error) {
            console.log(error);
        }
        await waitForConnect();
        await waitForDisconnect();
        await disconnect();
        console.log(ipaddress);
        try {
            (option.disconnect ?? console.log)(ipaddress);
        } catch (error) {
            console.log(error);
        }
    }
}
/**
 * 重启adb server
 */
export async function init() {
    
    try {
        await adb("kill-server");
    } catch (error) {
        
    }
    
    try{
        await adb("start-server");
    }catch(e){
        if (!e || e?.toString().indexOf("starting now at")<0)
            throw "重启adb失败";
    }
    //await adb("nodaemon","server");
    
}

export async function isConnected():Promise<boolean> {
    const tag = "surface2android";
    try {
        const raw = shell("echo",tag);
        return (await raw).trim() === tag;    
    } catch (error) {
        if(null === /(no devices|device offline)/.exec(error?.toString() ?? ""))
            console.log(error);
    }
    return false;
}



const qrcode_password = nanoid()
export function generateQRCode() {
    const qrcode_name = 'ADB_WIFI_'+nanoid()
    const text = `WIFI:T:ADB;S:${qrcode_name};P:${qrcode_password};;`;
    return text;
}

var stableProbeTimeID:any | number = null;
export function stableProbe() {
    if(null !== stableProbeTimeID)
        clearTimeout(stableProbeTimeID);
    stableProbeTimeID=setTimeout(() => {
            probe();
        }, 100);
}

export function onDeviceDetected(ondetetected=console.log):()=>void {
    
    const evt = function(pack:any){
        //console.log(pack);
        if(pack?.answers?.find((v:any)=>v.name===("Android.local")))
            ondetetected(...arguments);
    };
    const evt_query = function(pack:any) {
        if(pack.questions?.find((v:any)=>v.name==="_mi-connect._udp.local"))
            ondetetected(...arguments);

    }
    mdns.on("response",evt);
    mdns.on("query",evt_query);

    return function(){
        mdns.off("response",evt);
        mdns.off("query",evt_query);

    }
}