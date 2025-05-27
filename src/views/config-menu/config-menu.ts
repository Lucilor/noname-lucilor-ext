import {LucilorExtConfig} from "@/lucilor-ext-cls/types";
import {keyBy, mapValues} from "lodash";

export const getExtensionConfigMenu: GameImportFunction<importExtensionConfig["config"]> = () => {
  const config: Record<keyof LucilorExtConfig, SelectConfigData> = {
    skipMiniGames: {name: "跳过小游戏", intro: "跳过一些磨叽的小游戏", init: false},
    colorfulSkillInfo: {name: "彩色技能描述", intro: "技能描述中的关键字使用彩色显示，且可以显示详细说明", init: false},
    replaceCharacter: {
      name: "武将替换",
      intro: "替换特定的技能，且开局时可以替换武将为该武将",
      init: "none",
      item: {none: "关闭", random: "随机", ...mapValues(keyBy(LucilorExt.aomiSkillConfigs, "character"), "characterCN")}
    },
    singleCharacter: {name: "单将样式", intro: "双将模式下使用单将样式", init: false},
    menuStyles: {name: "菜单美化", intro: "菜单页面使用自定义样式", init: false},
    showCardCount: {name: "显示手牌", intro: "显示手牌数及手牌上限", init: false},
    autoZoom: {name: "自动缩放", intro: "自动设置游戏缩放为系统缩放", init: false}
  };
  return config;
};
