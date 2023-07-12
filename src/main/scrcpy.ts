import { run } from "./xnutil";

export interface ScrcpyOption {
    // Device
    serial?:string,
    usb?:Boolean,
    tcpip?:Number | Boolean,
    stayAwake?:Boolean,
    screenOff?:Boolean,
    screenOffStart?:Boolean,
    screenOffStop?:Boolean,
    // Media
    maxSize?:Number,
    videoBitRate?:String,
    audioBitRate?:String,
    fps?:Number,
    videoCodec?:"h265" | "h264" | "av1",
    audioCodec?:"opus" | "aac" | "raw" ,//list-encoders
    rotation?: 0|1|2|3,
    audioBuffer?:Number,
    videoBuffer?:Number,//ms
    // Window
    title?:String,
    x?:Number,
    y?:Number,
    width?:Number,
    height?:Number,
    borderLess?:Boolean,
    fullScreen?:Boolean,
    alwaysOnTop?:Boolean,
    noAudio?:Boolean
  };
  
export async function scrcpy(path:string,options:ScrcpyOption){
    try{
    return await run(path,...([
        ["--no-audio",options.noAudio],
        ['-s',options.serial],
        ['-d',options.usb],
        ['-e',options.tcpip],
        ['--tcpip',options.tcpip],
        ['--stay-awake',options.stayAwake],
        ['--turn-screen-off',options.screenOff],
        ['--power-off-on-close',options.screenOffStop],
        ['--no-power-on',options.screenOffStart],
        ['-m',options.maxSize],
        ['-b',options.videoBitRate],
        ['--max-fps',options.fps],
        ['--video-codec',options.videoCodec],
        ['--rotation',options.rotation],
        //['--lock-video-orientation',options.rotation],
        ['--audio-codec',options.audioCodec],
        ['--audio-buffer',options.audioBuffer],
        ['--display-buffer',options.videoBuffer],
        ['--audio-bit-rate',options.audioBitRate],
        ['--window-title',options.title],
        ['--window-x',options.x],
        ['--window-y',options.y],
        ['--window-width',options.width],
        ['--window-height',options.height],
        ['--fullscreen',options.fullScreen],
        ['--always-on-top',options.alwaysOnTop],
        ['--window-borderless',options.borderLess]
    ].filter(([k,v])=>v!==undefined).map(([k,v])=>typeof v==="boolean"?(v?[k]:[]):[k,(v?.toString())])).flat().map(
        v=>v!.toString().replace(/[\r\n]/g,"")
    )
    );
}catch(e){
    console.log(e);
    return;
}
}