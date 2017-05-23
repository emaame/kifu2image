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
    definition: SettingsDefinition;

    // load from Cookie
    constructor(definition: SettingsDefinition) {
        this.listeners = {};
        this.settings = {};
        this.definition = definition;
        for(let key in definition) {
            let [defaultValue, callback] = definition[key];
            let cookie_val = Cookie.get(key);
            let value = (cookie_val===undefined) ? defaultValue.toString() : cookie_val;

            this.listeners[key] = callback;

            let element = <HTMLInputElement>document.getElementById(key);
            element.onchange = this.changeListener.bind(this, key, element);
            
            switch(typeof defaultValue) {
            case 'boolean': { let v = (value=='true')  ; this.set(key, v); break; }
            case 'number' : { let v = parseFloat(value); this.set(key, v); break; }
            case 'string' : { let v = value            ; this.set(key, v); break; }
            }
        }
    }

    changeListener(key:string, element:HTMLInputElement) {
        let type = typeof this.definition[key][0];
        switch(type) {
            case 'boolean': { let v = element.checked          ; return this.set(key, v); }
            case 'number' : { let v = parseFloat(element.value); return this.set(key, v); }
            case 'string' : { let v = element.value            ; return this.set(key, v); }
        }
    }

    set(key:string, value:SettingType) {
        let element = <HTMLInputElement>document.getElementById(key);
        if      (typeof value === 'boolean') { element.checked = value; }
        else if (typeof value === 'number' ) { element.value = value.toString(); }
        else if (typeof value === 'string' ) { element.value = value; }
        Cookie.set(key, value);
        this.listeners[key].call(this, value);
    }
    get(key:string) : SettingType {
        return this.settings[key];
    }

    reset() {
        for(let key in this.definition) {
            let [defaultValue, callback] = this.definition[key];
            this.set(key, defaultValue);
        }
    }
}