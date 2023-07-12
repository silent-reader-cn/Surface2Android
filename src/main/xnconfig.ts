import * as fs from 'fs';

// 加载配置文件
const configFile = './config.json';
const configData: { [key: string]: any } = fs.existsSync(configFile) ? JSON.parse(fs.readFileSync(configFile, 'utf-8')) : {};

// 创建代理对象
const configProxy = new Proxy(configData, {
  get: (target, property) => {
    return target[property.toString()];
  },
  set: (target, property, value) => {
    target[property.toString()] = value;
    saveConfig();
    return true;
  },
  has: (target, property) => {
    return property in target;
  },
  deleteProperty: (target, property) => {
    delete target[property.toString()];
    saveConfig();
    return true;
  }
});

// 将配置保存到硬盘
function saveConfig() {
  fs.writeFileSync(configFile, JSON.stringify(configData, null, 2), 'utf-8');
}

export default configProxy;
