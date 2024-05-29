export const gameHelper = {
  isZhuSkill: (skill: string) => {
    if (lib.skill[skill].zhuSkill) {
      return true;
    }
    const info = get.translation(skill + "_info");
    if (info && info.startsWith("主公技")) {
      return true;
    }
    return false;
  },
  isHiddenSkill: (skill: string) => {
    if (lib.skill[skill].hiddenSkill) {
      return true;
    }
    const info = get.translation(skill + "_info");
    if (info && info.startsWith("隐匿技")) {
      return true;
    }
    return false;
  },
  getStartSkills: (name: string) => {
    const skill = lib.skill[name];
    const result = new Set<string>();
    if (!skill) {
      return Array.from(result);
    }
    const {player, global} = (skill.trigger || {}) as any;
    if (Array.isArray(player)) {
      if (player.includes("enterGame")) {
        result.add(name);
      }
    } else {
      if (player === "enterGame") {
        result.add(name);
      }
    }
    if (Array.isArray(global)) {
      if (global.includes("gameStart")) {
        result.add(name);
      }
    } else {
      if (global === "gameStart") {
        result.add(name);
      }
    }
    const skillInfo = get.skillInfoTranslation(name);
    if (skillInfo.match(/你的第一个/)) {
      result.add(name);
    }
    if (skill.group) {
      for (const subSkillName of Array.isArray(skill.group) ? skill.group : [skill.group]) {
        for (const subStartSkill of LucilorExt.gameHelper.getStartSkills(subSkillName)) {
          result.add(subStartSkill);
        }
      }
    }
    return Array.from(result);
  }
};
