import { existsSync, readFileSync, writeFileSync } from "fs";
const configPath = "./config.json";

if(!existsSync(configPath)) writeFileSync(configPath,"{}",{
    encoding:"utf-8"
});
const configText = readFileSync(configPath,{
    encoding:"utf-8"
});

const config = JSON.parse( configText );

export default new Proxy(config,{
    set(target,p,newvalue){
        writeFileSync(configPath,
            JSON.stringify(config)
        );
        return Reflect.set(target,p,newvalue);
    }
});