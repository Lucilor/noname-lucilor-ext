import {EXTENSION_AUTHOR, EXTENSION_NAME, EXTENSION_VERSION} from "./const";
import {extendExtensions} from "./extends/extend-extensions";
import {extendGame, extendGamePre} from "./extends/extend-game";
import {extendSkills} from "./extends/extend-skills";
import "./index.scss";
import {initLucilorExt} from "./lucilor-ext-cls";
import {getSkillSet} from "./skills";
import {updateAomiSkills} from "./skills/aomi";
import {getExtensionConfigMenu} from "./views/config-menu/config-menu";
import {introHtml} from "./views/intro/intro";

game.import("extension", (lib, game, ui, get, ai, status) => {
  initLucilorExt(lib, game, ui, get, ai, status);

  return {
    name: EXTENSION_NAME,
    author: EXTENSION_AUTHOR,
    version: EXTENSION_VERSION,
    precontent: () => {
      const obj = {lib, game, ui, get, ai, status};
      for (const key in obj) {
        LucilorExt.setWindowConst(key, (obj as any)[key]);
      }
      const extPath = LucilorExt.assetsUrl;
      const addCss = (dir: string, name: string) => lib.init.css(dir, name);
      addCss(extPath, "extension");
      extendGamePre(lib, game, ui, get, ai, status);
      if (LucilorExt.getConfig("resizeOnStart")) {
        LucilorExt.resize();
      }
    },
    content: () => {
      (window as any).game = game;
      extendGame(lib, game, ui, get, ai, status);
      extendExtensions(lib, game, ui, get, ai, status);
      extendSkills(lib, game, ui, get, ai, status);
      updateAomiSkills();
    },
    config: getExtensionConfigMenu(lib, game, ui, get, ai, status),
    help: {},
    package: {
      character: {
        character: {},
        translate: {}
      },
      card: {
        card: {},
        translate: {},
        list: []
      },
      skill: getSkillSet(lib, game, ui, get, ai, status),
      intro: introHtml,
      diskURL: "",
      forumURL: ""
    },
    files: {character: [], card: [], skill: []}
  };
});
