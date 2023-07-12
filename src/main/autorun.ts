const { app } = require('electron');
const AutoLaunch = require('auto-launch');

export async function enableAutoLaunch() {
  const autoLauncher = new AutoLaunch({
    name: app.getName(), // 应用程序的名称
    path: app.getPath('exe') // 应用程序的可执行文件路径
  });

  await autoLauncher.isEnabled().then(async (isEnabled:boolean) => {
    if (!isEnabled) {
      autoLauncher.enable().then(async () => {
        console.log('开机启动已启用');
      }).catch((err) => {
        console.error('无法启用开机启动', err);
      });
    } else {
      console.log('开机启动已经启用');
    }
  }).catch((err) => {
    console.error('无法检查开机启动状态', err);
  });
}


export async function disableAutoLaunch() {
  const autoLauncher = new AutoLaunch({
    name: app.getName() // 应用程序的名称
  });

  await autoLauncher.isEnabled().then(async (isEnabled:boolean) => {
    if (isEnabled) {
      await autoLauncher.disable().then(() => {
        console.log('开机启动已禁用');
      }).catch((err) => {
        console.error('无法禁用开机启动', err);
      });
    } else {
      console.log('开机启动已经禁用');
    }
  }).catch((err) => {
    console.error('无法检查开机启动状态', err);
  });
}


export async function checkAutoLaunchStatus():Promise<boolean> {
  const autoLauncher = new AutoLaunch({
    name: app.getName() // 应用程序的名称
  });

  try {
    const isEnabled = await autoLauncher.isEnabled();
    return isEnabled;
  } catch (error) {
    console.error('无法检查开机启动状态', error);
    return false;
  }
}
