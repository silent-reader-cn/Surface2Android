import { execFile, spawn, spawnSync } from "child_process";
import { promisify } from "util";
export function sleep(timems : number):Promise<void> {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, timems);
    })
}
/**
 * 等待运行完成并返回stdout的运行内容
 * @param path 路径
 * @param args 命令行参数
 * @returns stdout文本内容
 */
export async function run(path:string,...args:string[]):Promise<string>{
    console.log("run",...arguments);
    try {
        const {stdout,stderr} = await (promisify(execFile)(path,args,{
            encoding:"utf-8"
        }));
        if(stderr.length)throw stderr;
        return stdout;
    } catch (error) {
        throw error
    }
    
}

export async function ping(host:string,timeout:Number = 100):Promise<Boolean> {
    try {
        const result = await run("ping","-n","1","-w",timeout.toString(),host);
        return result.search("0%")>=0;
    } catch (error) {
        return false;
    }
}

export async function terminateProcess(processName:string) {
    return await run("taskkill","/f","/im",processName);
}

export async function restartExplorer() {
    try {
        await terminateProcess("explorer.exe")

      } catch (error) {
        
      }
      
      try {
        await run("explorer.exe")
      } catch (error) {
        
      }
}

export async function powershell(command:string) {
    try {
        return await run(
            "powershell.exe"
            , "-Command"
            ,command
        );
    } catch (error) {
        if((error?.toString()?.indexOf("access is denied") ?? -1)>0)
            console.log("需要管理员权限运行powershell命令",command);
    } 
}