import {EXTENSION_NAME} from "@/const";
import "./extend-game.scss";

export const extendGamePre: GameImportFunction = (...args) => {
  extLibPre(...args);
  extGamePre(...args);
  extGetPre(...args);

  window.addEventListener("keydown", (event) => {
    const {key, altKey} = event;
    if (altKey) {
      if (key === "q") {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const webContents = require("@electron/remote").getCurrentWebContents();
        webContents.toggleDevTools();
      } else if (key === "r") {
        game.reload();
      } else if (key === "`") {
        game.resume();
      }
    }
  });
};

export const extendGame: GameImportFunction = (lib, game) => {
  const aomiSkillConfig = LucilorExt.aomiSkillConfig;
  if (aomiSkillConfig) {
    const character = aomiSkillConfig.character;
    const info = lib.character[character];
    info[2] = 3;
    info[3] = [LucilorExt.getSkillName("aomi")];
    if (Array.isArray(info[4]) && !info[4].includes("forbidai")) {
      info[4] = [...info[4], "forbidai"];
    } else {
      info[4] = ["forbidai"];
    }
    lib.translate[character] = aomiSkillConfig.characterCN;
  }
  if (LucilorExt.getConfig("menuStyles")) {
    (async () => {
      document.body.classList.add(LucilorExt.getClassName("menu"));
      const popupContainer = await LucilorExt.waitForElement(".popup-container");
      if (popupContainer) {
        let observer2: IntersectionObserver;
        const observer = new MutationObserver((entries) => {
          const node = entries.find((e) => e.addedNodes[0])?.addedNodes[0];
          if (node instanceof HTMLElement) {
            observer2?.disconnect();
            observer2 = new IntersectionObserver((entries2) => {
              for (const e of entries2) {
                const {target, intersectionRatio} = e;
                if (target instanceof HTMLElement && intersectionRatio < 1) {
                  const translateY = 100 * (1 - intersectionRatio);
                  target.style.transform = `translate(-200%, -${translateY}%)`;
                }
              }
            });
            observer2.observe(node);
          }
        });
        observer.observe(popupContainer, {childList: true});
      }
      const menu = await LucilorExt.waitForElement(".menu-container > .menu");
      if (menu) {
        const closeBtn = document.createElement("div");
        closeBtn.classList.add("menu-close-btn");
        closeBtn.addEventListener("click", () => {
          menu.parentElement?.click();
        });
        menu.appendChild(closeBtn);
      }

      LucilorExt.waitForSometing(() => ui.roundmenu)
        .then((roundmenu) => {
          const menu = ui.create.div("." + LucilorExt.getClassName("round-menu"), roundmenu);
          menu.addEventListener("click", (event) => {
            event.stopPropagation();
            ui.click.config();
            ui.click.extensionTab(EXTENSION_NAME);
          });
        })
        .catch();
    })();
  }
  if (LucilorExt.getConfig("autoZoom")) {
    const zoom = window.devicePixelRatio || 1;
    game.saveConfig("ui_zoom", zoom);
  }
};

const extLibPre: GameImportFunction = () => {
  // Here goes nothing
};

const extGamePre: GameImportFunction = (lib, game) => {
  if (LucilorExt.getConfig("showCardCount")) {
    document.body.classList.add(LucilorExt.getClassName("show-card-count"));
    window.setInterval(() => {
      for (const player of game.players) {
        LucilorExt.skillHelper.updateCardCount(player);
      }
    }, 100);
  }
};

const extGetPre: GameImportFunction = (lib, game, ui, get) => {
  if (LucilorExt.getConfig("colorfulSkillInfo")) {
    const skillInfoTranslation = get.skillInfoTranslation;
    get.skillInfoTranslation = (name: string, player?: Player, isFromSelf?: boolean) => {
      const arr: [RegExp, string, boolean?][] = [
        [/(非?锁定|限定|觉醒|转换|阵法|主公|使命|主将|副将|隐匿|宗族|持恒)技/, "orange", true],
        [
          /((你|其他角色|每名角色|一名角色|主公)的?(第(.+?)个)?)?((准备|判定|摸牌|出牌|弃牌|结束|此|该|这一?)阶段)(每名角色)?((限([^，。；]+?)次)?((开始|结束)(前|时|后)?)?)/,
          "cyan"
        ],
        [
          /((你|其他角色|每名角色|一名角色|主公)的?(第(.+?)个)?)?(([本此这]局?游戏)|([本此这每]回合)|([本此这每]一?轮(游戏)?)|(每个?选?项))(限([^，。；]+?)次)?((开始|结束|外|内)(前|时|后)?)?/,
          "cyan"
        ],
        [/(每?当|被)([^，。；]+?)(前|时|后)/, "cyan"],
        [/(一名)?(其他)?(角色|你)(死亡|翻面)(前|时|后)/, "cyan"],
        [/[【〖「『“‘]([^，。；]+?)[】〗」』”’]/, "yellow"]
      ];
      const skillTips = LucilorExt.skillTipsHelper.skillTips;
      if (!isFromSelf) {
        const skill = lib.skill[name];
        let derivation = skill?.derivation || [];
        if (typeof derivation === "string") {
          derivation = [derivation];
        }
        for (const name2 of derivation) {
          const key = `${name}->${name2}`;
          skillTips[key] = (get.skillInfoTranslation as any)(name2, player, true);
        }
      }
      let str = skillInfoTranslation(name, player);
      for (const [pattern, color, bold] of arr) {
        const span = document.createElement("span");
        span.style.color = color;
        span.style.fontWeight = bold ? "bold" : "normal";
        span.textContent = "$1";
        str = str.replace(new RegExp(`(${pattern.source})`, "g"), span.outerHTML);
      }
      for (const key in skillTips) {
        let reg: RegExp;
        let matches: RegExpMatchArray | null;
        const [from, to] = key.split("->");
        if (from && to) {
          reg = new RegExp(`(?<=〖)${lib.translate[to]}(?=〗)`, "g");
          matches = str.match(reg);
        } else {
          reg = new RegExp(key, "g");
          matches = str.match(reg);
        }
        if (!matches) {
          continue;
        }
        const span = document.createElement("span");
        span.style.textDecoration = "underline";
        span.style.cursor = "pointer";
        span.textContent = matches[0];
        span.setAttribute("onclick", `LucilorExt.skillTipsHelper.popupSkillTips(event, \`${key}\`)`);
        str = str.replace(reg, span.outerHTML);
      }
      return str;
    };
  }
};
