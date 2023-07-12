import { app } from 'electron';
import { setExternalVBSLocation } from "regedit";

const regedit = require('regedit').promisified;
//请禁用asar或者使用setExternalVBSLocation
const regLoc = 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\EdgeUI\\AllowEdgeSwipe';
const keypath = 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\EdgeUI'
const keyname = 'AllowEdgeSwipe';

const taskbarRegLoc = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\\ExpandableTaskbar';
const taskbarKeyPath = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced'
const taskbarRegName = "ExpandableTaskbar";

const regAutoRotationLoc = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AutoRotation\\Enable';
const regAutoRotationPath = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AutoRotation';
const regAutoRotationName = "Enable";
setExternalVBSLocation('resources/regedit/vbs');
async function createRegistry() {
    try {
        await regedit.createKey(regLoc)
        
    } catch (error) {
        
    }
    try {
        await regedit.createKey(regAutoRotationLoc)
        
    } catch (error) {
        
    }
    try {
        await regedit.createKey(taskbarRegLoc)
        
    } catch (error) {
        
    }
}
async function setEdgeUI(enable:1|0){
    await createRegistry()
    await regedit.putValue(
        {[keypath]:{[keyname]:{
            type:"REG_DWORD",
            value:enable
        }}}
    )

}
export async function setAutoRotation(enable: 0 | 1) {
    await createRegistry();
    await regedit.putValue({
        [regAutoRotationPath]: {
            [regAutoRotationName]: {
                type: 'REG_DWORD',
                value: enable
            }
        }
    });
}
export async function getAutoRotation() {
    const result = await regedit.list(regAutoRotationPath);
    //console.log(result);
    const value = result[regAutoRotationPath].values[regAutoRotationName].value;
    return value;
}

async function setTaskbarExpandable(enable:1|0) {
    await createRegistry()
    await regedit.putValue(
        {[taskbarKeyPath]:{[taskbarRegName]:{
            type:"REG_DWORD",
            value:enable
        }}}
    )
}

export async function disableEdgeUI() {
    await setEdgeUI(0);
    await setTaskbarExpandable(0);
}

export async function enableEdgeUI() {
    await setEdgeUI(1);
    await setTaskbarExpandable(1);
}

