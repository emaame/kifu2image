import * as Cookie from 'js-cookie';

/*
  クッキーの状態とエレメントの状態を同期する。
  エレメントが変化すればコールバックを呼ぶ。
 */

export type SettingType = number | boolean | string;
export type SettingsMap = {[key:string]: SettingType };
export type SettingsDefinition = {[key:string]: [SettingType, Function] };

export class Settings {
    listeners: {[key:string]: Function};
    settings: SettingsMap;

    // load from Cookie
    constructor(definition: SettingsDefinition) {
        this.listeners = {};
        this.settings = Cookie.getJSON('settings') || {};
        for(let key in definition) {
            let [defaultValue, callback] = definition[key];
            let value = (this.settings[key]===undefined) ? defaultValue : this.settings[key];

            this.settings[key] = value;
            this.listeners[key] = callback;

            let element = <HTMLInputElement>document.getElementById(key);
            element.onchange = this.changeListener.bind(this, key, element);
            if      (typeof value === 'boolean') { callback(value); element.checked = value; }
            else if (typeof value === 'number' ) { callback(value); element.textContent = value.toString(); }
            else if (typeof value === 'string' ) { callback(value); element.textContent = value; }
        }
        Cookie.set('settings', this.settings);
    }

    changeListener(key:string, element:HTMLInputElement) {
        switch(typeof this.settings[key]) {
            case 'boolean': { let v = element.checked               ; return this.set(key, v); }
            case 'number' : { let v = parseInt(element.textContent!); return this.set(key, v); }
            case 'string' : { let v = element.textContent!          ; return this.set(key, v); }
        }
    }

    set(key:string, value:SettingType) {
        let element = <HTMLInputElement>document.getElementById(key);
        this.settings[key] = value;
        if      (typeof value === 'boolean') { element.checked = value; }
        else if (typeof value === 'number' ) { element.textContent = value.toString(); }
        else if (typeof value === 'string' ) { element.textContent = value; }
        Cookie.set('settings', this.settings);
        this.listeners[key].call(this, value);
    }
    get(key:string) : SettingType {
        return this.settings[key];
    }

    reset() {
        Cookie.remove('settings', this.settings);
    }
}