import {ObjectOf} from "@lucilor/utils";

export const menuHelper = {
  导出数据: () => {
    LucilorExt.exportData(null, "noname_config.json");
  },
  导入数据: (lowPerf?: boolean) => {
    LucilorExt.importData((data) => {
      if (lowPerf) {
        data.config.ui_zoom = "";
        data.config.player_height_nova = "short";
        const skinset = data.config.qhly_skinset;
        if (skinset) {
          const replace = (obj: ObjectOf<string>) => {
            for (const key in obj) {
              obj[key] = obj[key].replaceAll("动态", "");
            }
          };
          replace(skinset.audioReplace);
          replace(skinset.skin);
        }
      }
      return data;
    });
  },
  导出武将配置: async () => {
    const data = await LucilorExt.getGameData({
      configFilter: (key, value) => {
        if (key === "characters") {
          return true;
        }
        if (key.endsWith("_banned")) {
          return Array.isArray(value) && value.length > 0;
        }
        return false;
      }
    });
    LucilorExt.exportData(data, "noname_config.json");
  },
  开启十周年UI: async () => {
    const data = await LucilorExt.getGameData();
    data.config.link_style2 = "mark";
    data.config.border_style = "default";
    for (const ext of ["十周年UI", "特效测试", "皮肤切换"]) {
      const key = `extension_${ext}_enable`;
      if (key in data.config) {
        data.config[key] = true;
      }
    }
    await LucilorExt.setGameData(data);
    if (confirm("已开启，是否重启？")) {
      game.reload();
    }
  },
  关闭十周年UI: async () => {
    const data = await LucilorExt.getGameData();
    data.config.link_style2 = "chain";
    data.config.border_style = "auto";
    for (const ext of ["十周年UI", "特效测试", "皮肤切换"]) {
      const key = `extension_${ext}_enable`;
      if (key in data.config) {
        data.config[key] = false;
      }
    }
    await LucilorExt.setGameData(data);
    if (confirm("已关闭，是否重启？")) {
      game.reload();
    }
  }
};
