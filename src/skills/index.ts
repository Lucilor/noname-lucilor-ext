import {getAomiSkillSet} from "./aomi";
import {getReplaceCharacterSkillSet} from "./replace-character";
import {SkillSet} from "./types";

export const getSkillSet: GameImportFunction<ExSkillConifgData> = (...args) => {
  const skills: ExSkillConifgData = {skill: {}, translate: {}};
  const importSkillSet = (skillSet: SkillSet) => {
    for (const item of skillSet) {
      const name = LucilorExt.getSkillName(item.name, item.isGlobal);
      skills.skill[name] = item.data;
      for (const key in item.translate) {
        const name2 = LucilorExt.getSkillName(key, item.isGlobal);
        skills.translate[name2] = item.translate[key];
      }
      for (const key in item.tips) {
        LucilorExt.skillTipsHelper.skillTips[key] = item.tips[key];
      }
    }
  };
  importSkillSet(getAomiSkillSet(...args));
  importSkillSet(getReplaceCharacterSkillSet(...args));
  return skills;
};
