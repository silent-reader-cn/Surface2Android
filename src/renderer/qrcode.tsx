import { useEffect, useRef, useState } from "react";
import qrcode from 'qrcode';
import { createRoot } from 'react-dom/client';

export function QRCode(props:{data?:string}){
    const canvas = useRef<any>();
    const [qrData,setQRData] = useState(props.data);
    useEffect(()=>{
        window.electron.ipcRenderer.on("qrdata",(data)=>setQRData(data?.toString() ?? ""));
        window.electron.ipcRenderer.sendMessage("qrdata",);
    },[])
    useEffect(()=>{
        //var canvas = document.getElementById('canvas')
        if(canvas.current && qrData)
            qrcode.toCanvas(canvas.current,qrData ,{
                width:300,height:300//,margin:0
            });
    },[qrData,canvas.current])
    return <canvas ref={canvas} onClick={
        ()=>window.electron.ipcRenderer.sendMessage("close")
    }></canvas>;
}

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<QRCode/>);
