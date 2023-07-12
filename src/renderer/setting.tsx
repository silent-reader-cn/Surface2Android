import React,{useEffect, useState} from 'react';
import { useForm } from 'react-hook-form';
import { TextField, InputLabel,InputAdornment,FormHelperText,FormControlLabel,FormControl, Switch, Select, MenuItem, Button, Grid } from '@mui/material';
const settingKeys = [
  'adbPath',
  'scrcpyPath',
  'adaptiveResolution',
  'transmissionRate',
  'maxFPS',
  'videoCodec',
  'customDPI',
  'blockWindowsGestures',
  'ssid',
  'password',
  'frequency',
  'disableAutoLock',
  'disableAudio',
  'adaptiveRotation'
];
const SettingPage = () => {
  const [Data,setData] = useState({});
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();
  //console.log(Data);
  const reg = (v:string,o:object={})=>register(v,{...o,onChange:(e)=>{
    window.electron.ipcRenderer.sendMessage('setting', v,watch(v));
    setData(d=>({...d,[v]:watch(v)}));
  }});
  useEffect(() => {
    // 监听 setting 事件，并更新控件的值
    window.electron.ipcRenderer.on('setting', (key:string,value:any) => {
      setValue(key,value);
      setData(d=>({...d,[key]:value}));
    });
    settingKeys.forEach((key) => {
      window.electron.ipcRenderer.sendMessage('setting-sync', key);
    });
  }, [setValue]);
  //console.log(register.fields);
  const onSubmit = (data:any) => {
    // 校验数值是否合法，根据需要进行修改
    if (data.transmissionRate < 1 || data.transmissionRate > 30) {
      alert('传输码率应在1到30之间！');
      return;
    }

    // 发送设置消息给 electron
    Object.entries(data).forEach(([key, value]) => {
      window.electron.ipcRenderer.sendMessage('setting', key, value);
    });
  };

  return (
    <form style={{
      padding:"5vw"
    }} onSubmit={handleSubmit(onSubmit)}>
 <Grid container spacing={2}>
  <Grid item xs={12}>
    <TextField
      label="Adb引用路径"
      {...reg('adbPath')}
      error={!!errors.adbPath}
      helperText={errors.adbPath?.message}
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  </Grid>
  <Grid item xs={12}>
    <TextField
      label="Scrcpy引用路径"
      {...reg('scrcpyPath')}
      error={!!errors.scrcpyPath}
      helperText={errors.scrcpyPath?.message}
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  </Grid>
        
  <Grid item xs={12} sm={3}>
    <TextField
      label="传输码率"
      type="number"
      {...reg('transmissionRate', { valueAsNumber: true })}
      error={!!errors.transmissionRate}
      helperText={errors.transmissionRate?.message}
      fullWidth
      InputProps={{
        endAdornment: <InputAdornment position="end">M</InputAdornment>,
      }}
      InputLabelProps={{ shrink: true }}
    />
  </Grid>
  <Grid item xs={12} sm={3}>
    <TextField
      label="最大FPS"
      type="number"
      {...reg('maxFPS', { valueAsNumber: true })}
      error={!!errors.maxFPS}
      helperText={errors.maxFPS?.message}
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  </Grid>
  <Grid item xs={12} sm={3}>
    <FormControl fullWidth error={!!errors.videoCodec}>
      <InputLabel id="videoCodec-label" sx={{background:"white"}} shrink>视频解码器</InputLabel>
      <Select
        labelId="videoCodec-label"
        {...reg('videoCodec')}
        fullWidth
        value={Data.videoCodec ?? 'h265'}
        InputLabelProps={{ shrink: true }}
      >
        <MenuItem value="h265">h265</MenuItem>
        <MenuItem value="h264">h264</MenuItem>
      </Select>
      {errors.videoCodec && (
        <FormHelperText>{errors.videoCodec.message}</FormHelperText>
      )}
    </FormControl>
  </Grid>

  <Grid item xs={12} sm={3}>
    <TextField
      label="自定义DPI"
      type="number"
      {...reg('customDPI', { valueAsNumber: true })}
      error={!!errors.customDPI}
      helperText={errors.customDPI?.message}
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="SSID"
      {...reg('ssid')}
      error={!!errors.ssid}
      helperText={errors.ssid?.message}
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="密码"
      type="password"
      {...reg('password')}
      error={!!errors.password}
      helperText={errors.password?.message}
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  </Grid>

  <Grid item xs={12} sm={4}>
    <FormControl fullWidth error={!!errors.frequency}>
      <InputLabel id="frequency-label" sx={{background:"white"}} shrink>频段</InputLabel>
      <Select
        labelId="frequency-label"
        {...reg('frequency')}
        fullWidth
        value={Data['frequency'] ?? 2}
        InputLabelProps={{ shrink: true }}
      >
        <MenuItem value={1}>2.4GHz</MenuItem>
        <MenuItem value={2}>5GHz</MenuItem>
      </Select>
      {errors.frequency && (
        <FormHelperText>{errors.frequency.message}</FormHelperText>
      )}
    </FormControl>
  </Grid>

  <Grid item xs={6}>
    <FormControlLabel
      control={<Switch {...reg('blockWindowsGestures')} checked={watch('blockWindowsGestures') ?? false}/>}
      label="屏蔽Windows手势"
      labelPlacement="end"
    />
  </Grid>
  <Grid item xs={6}>
    <FormControlLabel
      control={<Switch {...reg('adaptiveResolution')}  checked={watch('adaptiveResolution') ?? false}/>}
      label="自适应分辨率"
      labelPlacement="end"
    />
  </Grid>
  <Grid item xs={6}>
    <FormControlLabel
      control={<Switch {...reg('disableAutoLock')}  checked={watch('disableAutoLock') ?? false}/>}
      label="关闭自动锁屏"
      labelPlacement="end"
    />
  </Grid>
  <Grid item xs={6}>
    <FormControlLabel
      control={<Switch {...reg('disableAudio')}  checked={watch('disableAudio') ?? false}/>}
      label="不同步声音"
      labelPlacement="end"
    />
  </Grid>
</Grid>

    </form>
  );
};

export default SettingPage;
