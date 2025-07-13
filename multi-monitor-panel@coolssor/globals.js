import GObject from 'gi://GObject';
import { extensionInstance } from './extension.js';

export var g = {
    mmPanel: []
};

export function unhideClass(classId) {
    let tmp = extensionInstance.getSettings().get_boolean(classId);
    return tmp;
}

export function copyClass(s, d) {
    if (!s) {
        console.error(`copyClass s undefined for d ${d.name}`)
        return
    }

    let prototype = s.prototype ? s.prototype : Object.getPrototypeOf(s);
    let propertyNames = Reflect.ownKeys(prototype);

    for (let pName of propertyNames.values()) {
        if (typeof pName === "symbol") continue;
        if (d.prototype.hasOwnProperty(pName)) continue;
        if (pName === "prototype") continue;
        if (pName === "constructor") continue;
        let pDesc = Reflect.getOwnPropertyDescriptor(prototype, pName);
        if (typeof pDesc !== 'object') continue;
        Reflect.defineProperty(d.prototype, pName, pDesc);
    }
};
