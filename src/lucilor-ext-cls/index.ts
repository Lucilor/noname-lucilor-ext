import {isTypeOf, keysOf, ObjectOf} from "@lucilor/utils";
import csstype from "csstype";
import {sample} from "lodash";
import {EXTENSION_NAME, EXTENSION_VERSION} from "../const";
import {gameHelper} from "./game-helper";
import {menuHelper} from "./menu-helper";
import {skillHelper} from "./skill-helper";
import {SkillTipsHelper} from "./skill-tips-helper";
import {AomiSkillConfig, GameData, GameDataExportOptions, LucilorExtConfig, WaitForSometingOpts} from "./types";

export class LucilorExtCls {
  version = EXTENSION_VERSION;
  assetsUrl: string;

  skillHelper = skillHelper;
  menuHelper = menuHelper;
  skillTipsHelper: SkillTipsHelper;
  gameHelper = gameHelper;

  constructor(lib: Library) {
    this.assetsUrl = lib.assetURL + "extension/" + EXTENSION_NAME + "/";
    this.skillTipsHelper = new SkillTipsHelper(lib);
  }

  get aomiSkillConfigOptions() {
    const result: {character: string; characterCN: string; skills: string[]; skins?: string[]}[] = [];
    for (const [character, info] of Object.entries(lib.character)) {
      const characterCN = get.translation(character);
      const sex = info[0];
      const skills = info[3];
      if (sex !== "female" || skills.length < 3) {
        continue;
      }
      const item: (typeof result)[number] = {character, characterCN, skills: skills.slice()};
      result.push(item);
    }
    return result;
  }
  aomiSkillConfigs: AomiSkillConfig[] = [
    {
      character: "caojinyu",
      characterCN: "曹金玉",
      audios: {
        aomi: "xianjing",
        dmgCount: "yuqi",
        dieBefore: "shanshen"
      }
    },
    {
      character: "ol_wangrong",
      characterCN: "OL王荣",
      audios: {
        aomi: "olfengzi",
        dmgCount: "oljizhan",
        dieBefore: "olfusong"
      }
    },
    {
      character: "jin_yanghuiyu",
      characterCN: "晋羊徽瑜",
      audios: {
        aomi: "caiyuan",
        dmgCount: "huirong",
        dieBefore: "ciwei"
      }
    },
    {
      character: "jin_zhangchunhua",
      characterCN: "晋张春华",
      audios: {
        aomi: "huishi",
        dmgCount: "qingleng",
        dieBefore: "xuanmu"
      }
    }
  ];
  private _randonAomiSkillConfigName: string | null = null;
  get aomiSkillConfig() {
    const configs = this.aomiSkillConfigs;
    let name = LucilorExt.getConfig("replaceCharacter");
    if (name === "random") {
      if (this._randonAomiSkillConfigName) {
        name = this._randonAomiSkillConfigName;
      } else {
        this._randonAomiSkillConfigName = sample(configs)?.character || null;
        if (this._randonAomiSkillConfigName) {
          name = this._randonAomiSkillConfigName;
        } else {
          return null;
        }
      }
    }
    const config = configs.find((item) => item.character === name);
    return config || null;
  }

  getSkillName(name: string, isGlobal = false) {
    return `${isGlobal ? "_" : ""}${EXTENSION_NAME}_${name}`;
  }

  getSkillNames(names: string[], isGlobal = false) {
    return names.map((name) => this.getSkillName(name, isGlobal));
  }

  getSubSkillName(parentName: string, name: string, isGlobal = false) {
    return `${this.getSkillName(`${parentName}_${name}`, isGlobal)}`;
  }

  getSubSkillNames(parentName: string, names: string[], isGlobal = false) {
    return names.map((name) => this.getSubSkillName(parentName, name, isGlobal));
  }

  getSkill(name: string, isGlobal = false): Skill | null {
    return lib.skill[this.getSkillName(name, isGlobal)] || null;
  }

  getStorage<T = any>(player: Player, name: string, defaultValue?: T, isGlobal = false): T {
    const name2 = this.getSkillName(name, isGlobal);
    if (player.storage[name2] === undefined && defaultValue !== undefined) {
      player.storage[name2] = defaultValue;
    }
    return player.storage[name2];
  }

  setStorage<T = any>(player: Player, name: string, value: T, isGlobal = false) {
    const name2 = this.getSkillName(name, isGlobal);
    player.storage[name2] = value;
  }

  setStorageWith<T = any>(player: Player, name: string, valueFn: (val: T) => T, isGlobal = false) {
    const value = LucilorExt.getStorage<T>(player, name, undefined, isGlobal);
    LucilorExt.setStorage(player, name, valueFn(value), isGlobal);
  }

  getDB<T = any>(type: string, id?: string | null) {
    return new Promise<T>((resolve) => game.getDB(type, id, (data: any) => resolve(data)));
  }

  putDB<T = any>(type: string, id: string, data: T) {
    return new Promise<void>((resolve) => game.putDB(type, id, data, () => resolve()));
  }

  deleteDB(type: string, id: string) {
    return new Promise<void>((resolve) => game.deleteDB(type, id, () => resolve()));
  }

  async getGameData(options?: GameDataExportOptions) {
    const {configFilter} = options || {};
    let config = await this.getDB("config", null);
    const data = await this.getDB("data", null);
    if (typeof configFilter === "function") {
      const config2: ObjectOf<any> = {};
      for (const key in config) {
        if (configFilter(key, config[key])) {
          config2[key] = config[key];
        }
      }
      config = config2;
    }
    const result = {config, data};
    return result;
  }

  async setGameData(data: GameData) {
    const {config, data: data2} = data;
    const ps: Promise<void>[] = [];
    for (const key in config) {
      const p = this.putDB("config", key, config[key]);
      ps.push(p);
      lib.config[key] = config[key];
    }
    if (Array.isArray(config.extensions)) {
      (config.extensions as string[]).sort((v) => (v === EXTENSION_NAME ? 1 : 0));
    }
    for (const key in data2) {
      const p = this.putDB("data", key, data2[key]);
      ps.push(p);
    }
    await Promise.all(ps);
  }

  async exportData(data?: GameData | null, name = "noname.json") {
    if (!data) {
      data = await this.getGameData();
    }
    game.export(JSON.stringify(data), name);
  }

  async importData(dataTransform?: (data: GameData) => GameData) {
    await new Promise<void>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
          let data = JSON.parse(String(event.target?.result));
          if (dataTransform) {
            data = dataTransform(data);
          }
          await this.setGameData(data);
          resolve();
        };
        reader.readAsText(file);
      };
      input.click();
    });
    if (confirm("导入完成，是否重启？")) {
      game.reload();
    }
  }

  resize() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const remote = require("@electron/remote");
    const win = remote.getCurrentWindow();
    const screen = remote.screen;
    const screenSize = screen.getPrimaryDisplay().workAreaSize;
    win.setSize(Math.min(1920, screenSize.width), Math.min(1080, screenSize.height));
    win.center();
  }

  getConfig<T extends keyof LucilorExtConfig>(key: T): LucilorExtConfig[T] {
    return game.getExtensionConfig(EXTENSION_NAME, key);
  }

  setConfig<T extends keyof LucilorExtConfig>(key: T, value: LucilorExtConfig[T]) {
    game.saveExtensionConfig(EXTENSION_NAME, key, value);
  }

  hasExtension(name: string, checkVars?: string | string[]) {
    if (typeof checkVars === "string") {
      checkVars = [checkVars];
    }
    let result: boolean = lib.config.extensions?.includes(name) && lib.config[`extension_${name}_enable`];
    if (result && checkVars) {
      for (const v of checkVars) {
        const path = v.split(".");
        let target: any = window;
        let targetFound = true;
        for (const p of path) {
          if (p in target) {
            target = target[p];
          } else {
            targetFound = false;
            break;
          }
        }
        if (!targetFound) {
          result = false;
          break;
        }
      }
    }
    return result;
  }

  async waitForSometing<T>(getter: () => T | null, opts?: WaitForSometingOpts) {
    const defaultOpts: Required<WaitForSometingOpts> = {
      interval: 500,
      timeout: 10000
    };
    const {interval, timeout} = {...defaultOpts, ...opts};
    return new Promise<NonNullable<T>>((resolve, reject) => {
      const val = getter();
      if (!isTypeOf(val, ["undefined", "null", "NaN"])) {
        resolve(val as NonNullable<T>);
      } else {
        const i = setInterval(() => {
          const val2 = getter();
          if (val2) {
            clearInterval(i);
            resolve(val2);
          }
        }, interval);
        setTimeout(() => {
          clearInterval(i);
          reject(new Error("Timeout!"));
        }, timeout);
      }
    });
  }

  waitForExtension(name: string, checkVars?: string | string[], opts?: WaitForSometingOpts) {
    return this.waitForSometing(() => this.hasExtension(name, checkVars) || null, opts);
  }

  waitForElement(selector: string, container: ParentNode = document, opts?: WaitForSometingOpts) {
    return this.waitForSometing(() => container.querySelector(selector), opts);
  }

  isFileExist(path: string) {
    return new Promise<boolean>((resolve) => {
      if (lib.node && lib.node.fs) {
        try {
          const stat = lib.node.fs.statSync(__dirname + "/" + path);
          resolve(!!stat);
        } catch {
          resolve(false);
          return;
        }
      } else {
        resolveLocalFileSystemURL(
          lib.assetURL + path,
          () => resolve(true),
          () => resolve(false)
        );
      }
    });
  }

  setWindowConst<T>(name: string, value: T) {
    Reflect.defineProperty(window, name, {get: () => value, set: () => null, enumerable: true, configurable: true});
  }

  getClassName(name: string) {
    return `${EXTENSION_NAME}-${name}`;
  }

  getStyledStr(str: string, style: csstype.Properties = {}) {
    const span = document.createElement("span");
    span.innerHTML = str;
    for (const key of keysOf(style)) {
      (span.style as any)[key] = style[key];
    }
    return span.outerHTML;
  }

  getColoredStr(str: string, color: csstype.Property.Color) {
    return this.getStyledStr(str, {color});
  }
}

export const initLucilorExt: GameImportFunction<void> = (lib) => {
  const LucilorExt = new LucilorExtCls(lib);
  LucilorExt.setWindowConst("LucilorExt", LucilorExt);
};
