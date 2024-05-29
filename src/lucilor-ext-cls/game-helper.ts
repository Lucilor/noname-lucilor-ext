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
  getStartSkills: (name: string, excludeNames?: Set<string>) => {
    if (excludeNames?.has(name)) {
      return [];
    }
    const skill = lib.skill[name];
    const result: {name: string; reason: "gameStart" | "enterGame" | "firstTurn"}[] = [];
    if (!skill) {
      return Array.from(result);
    }
    let {global, player} = skill.trigger || {};
    if (typeof global === "string") {
      global = [global];
    }
    if (Array.isArray(global) && global.includes("gameStart")) {
      result.push({name, reason: "gameStart"});
    }
    if (typeof player === "string") {
      player = [player];
    }
    if (Array.isArray(player) && player.includes("enterGame")) {
      result.push({name, reason: "enterGame"});
    }
    const skillInfo = get.skillInfoTranslation(name);
    if (skillInfo.match(/你的第一个/)) {
      result.push({name, reason: "firstTurn"});
    }
    if (!excludeNames) {
      excludeNames = new Set<string>();
    }
    excludeNames.add(name);
    if (skill.group) {
      for (const subSkillName of Array.isArray(skill.group) ? skill.group : [skill.group]) {
        for (const subStartSkill of LucilorExt.gameHelper.getStartSkills(subSkillName, excludeNames)) {
          result.push(subStartSkill);
        }
      }
    }
    return result;
  }
};
