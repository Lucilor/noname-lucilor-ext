import {isBetween, timeout} from "@lucilor/utils";
import {ChooseSkillListParams, ChooseSkillsParams, DiscoverAomiSkillParams} from "./types";

export const skillHelper = {
  addSkillLog: (skill: string, player: Player) => {
    player.addSkill(skill);
    player.popup(skill);
    game.log(player, "获得了技能", `#g【${get.translation(skill)}】`);
  },
  removeSkillLog: (skill: string, player: Player) => {
    player.removeSkill(skill);
    player.popup(skill);
    game.log(player, "失去了技能", `#g【${get.translation(skill)}】`);
  },
  getChooseSkillList: (player: Player, params: ChooseSkillListParams) => {
    const {num, filter} = params;
    const skillList: SkillList = [];
    const bannedSkills = new Set<string>();
    const toBan = [player.getSkills(), player.awakenedSkills, LucilorExt.getStorage(player, "usedStartSkills")];
    for (const group of toBan) {
      for (const v of group || []) {
        bannedSkills.add(v);
      }
    }
    const bannedSkillNames = new Set();
    for (const v of bannedSkills) {
      if (lib.skill[v] && !lib.skill[v].sub) {
        bannedSkillNames.add(get.translation(v));
      }
    }
    const filterSkill = (skill: string) => {
      const info = lib.skill[skill];
      if (!info) {
        return false;
      }
      if (LucilorExt.gameHelper.isZhuSkill(skill) || LucilorExt.gameHelper.isHiddenSkill(skill)) {
        return false;
      }
      if (info.trigger && typeof info.trigger === "object" && (info.trigger as any).player === "die") {
        return false;
      }
      if (typeof filter === "function" && !filter(skill, info)) {
        return false;
      }
      return !bannedSkills.has(skill) && !bannedSkillNames.has(get.translation(skill));
    };
    const listAll: SkillList = [];
    const discoveredSkills = LucilorExt.getStorage<SkillList>(player, "discoveredSkills", []);
    const boundsSkills: SkillList = [];
    for (const character of get.gainableCharacters()) {
      const characterSkills = lib.character[character][3];
      const toAdd = characterSkills.slice(0).removeArray(...discoveredSkills.map((v) => v.name));
      if (toAdd.length !== characterSkills.length) {
        for (const skill of toAdd) {
          if (!boundsSkills.find((v) => v.name === skill) && filterSkill(skill)) {
            boundsSkills.push({name: skill, character});
          }
        }
      } else {
        for (const skill of characterSkills) {
          if (!listAll.find((v) => v.name === skill) && filterSkill(skill)) {
            listAll.push({name: skill, character});
          }
        }
      }
    }
    skillList.push(...boundsSkills.slice(0, num));
    if (skillList.length < num) {
      skillList.push(...listAll.randomGets(num - skillList.length));
    }
    return skillList;
  },
  chooseSkills: async (player: Player, params: ChooseSkillsParams) => {
    const {chooseFrom, chooseTo} = params;
    const createButton = (item: SkillList[number], type: any, position: any, noclick: any, node: any) => {
      const {name, character} = item;
      const info = lib.character[character];
      node = ui.create.buttonPresets.character(character, "character", position, noclick);
      const skillnode = ui.create.caption(
        `<div class="text" data-nature=${get.groupnature(info[1], "raw")}m style="font-family: ${
          lib.config.name_font || "xinwei"
        },xinwei">[${get.translation(name)}]</div>`,
        node
      );
      skillnode.style.left = "2px";
      skillnode.style.bottom = "2px";
      node.link = JSON.stringify(item);
      node._customintro = function (uiintro: any) {
        let capt = get.translation(character);
        if (info) {
          const infoSex = info[0];
          if (infoSex && lib.config.show_sex) capt += `&nbsp;&nbsp;${infoSex === "none" ? "无" : lib.translate[infoSex]}`;
          const infoGroup = info[1];
          if (infoGroup && lib.config.show_group) {
            const group = get.is.double(character, true);
            if (Array.isArray(group)) capt += `&nbsp;&nbsp;${group.map((value) => get.translation(value)).join("/")}`;
            else capt += `&nbsp;&nbsp;${lib.translate[infoGroup]}`;
          }
        }
        uiintro.add(capt);

        if (lib.characterTitle[character]) {
          uiintro.addText(get.colorspan(lib.characterTitle[character]));
        }

        for (const skill of info[3]) {
          if (lib.translate[skill + "_info"]) {
            const translation = lib.translate[skill + "_ab"] || get.translation(skill).slice(0, 2);
            const opacity = skill === name ? "1" : "0.5";
            if (lib.skill[skill] && lib.skill[skill].nobracket) {
              uiintro.add(
                `<div style="opacity:${opacity}"><div class="skilln">${get.translation(skill)}</div><div>${get.skillInfoTranslation(
                  skill
                )}</div></div>`
              );
            } else {
              uiintro.add(
                `<div style="opacity:${opacity}"><div class="skill">【${translation}】</div><div>${get.skillInfoTranslation(
                  skill
                )}</div></div>`
              );
            }
            if (lib.translate[skill + "_append"]) {
              uiintro._place_text = uiintro.add(`<div class="text">${lib.translate[skill + "_append"]}</div>`);
            }
          }
        }
      };
      return node;
    };

    const chooseToLabel = params.chooseToLabel || "拥有技能";
    const chooseFromLabel = params.chooseFromLabel || "候选技能";
    let chooseToLabelSuffix = "";
    const limit0 = params.limit;
    let limit: [number, number];
    if (typeof limit0 === "number") {
      chooseToLabelSuffix += `（${limit0}个）`;
      limit = [limit0, limit0];
    } else if (Array.isArray(limit0)) {
      chooseToLabelSuffix += `（${limit0[0]} ~ ${limit0[1]}个）`;
      limit = limit0;
    } else {
      limit = [1, 1];
    }
    if (limit[0] > limit[1]) {
      limit = [limit[1], limit[0]];
    }
    const dialogList = [
      [chooseToLabel + chooseToLabelSuffix, [chooseTo, createButton]],
      [chooseFromLabel || "候选技能", [chooseFrom, createButton]]
    ] as const;
    const {forced} = params;
    const result = await player
      .chooseToMove(forced, `点击将牌移动到${chooseToLabel}或${chooseFromLabel}`)
      .set("list", dialogList)
      // .set("filterMove", function (from: any, to: any, moved: Card[][]) {
      //   if (moved[0].includes(from.link)) {
      //     if (typeof to === "number") {
      //       if (to === 1) {
      //         if (moved[0].length <= limit[0]) {
      //           return false;
      //         }
      //       }
      //       return true;
      //     }
      //   }
      //   if (moved[1].includes(from.link)) {
      //     if (typeof to === "number") {
      //       if (to === 0) {
      //         if (moved[0].length >= limit[1]) {
      //           return false;
      //         }
      //       }
      //       return true;
      //     }
      //   }
      //   return true;
      // })
      .set("filterOk", (moved: [string[], string[]]) => isBetween(moved[0].length, limit[0], limit[1]))
      .set("processAI", () => {
        const skillAll = [...dialogList[0][1][0], ...dialogList[1][1][0]];
        skillAll.sort((a, b) => {
          const rankA = get.skillRank(a.name, "inout");
          const rankB = get.skillRank(b.name, "inout");
          return rankB - rankA;
        });
        const getLinks = (start: number, end?: number) => skillAll.slice(start, end).map((v) => JSON.stringify(v));
        return [getLinks(0, limit[1]), getLinks(limit[1])];
      })
      .forResult();
    if (result.bool) {
      const skills1: SkillList = result.moved[0].map(JSON.parse);
      const skills2: SkillList = result.moved[1].map(JSON.parse);
      return {skills1, skills2};
    } else {
      return null;
    }
  },
  discoverSkill: async (player: Player, params: ChooseSkillsParams) => {
    LucilorExt.skillHelper.updateDiscoveredSkills(player);
    const result = await LucilorExt.skillHelper.chooseSkills(player, params);
    if (!result) {
      return;
    }
    const {skills1, skills2} = result;
    const discoveredSkills = LucilorExt.getStorage<SkillList>(player, "discoveredSkills", []);
    for (const {name, character} of skills1) {
      if (!discoveredSkills.find((v) => v.name === name)) {
        discoveredSkills.push({name, character});
        LucilorExt.skillHelper.addSkillLog(name, player);
      }
    }
    for (const {name} of skills2) {
      const i = discoveredSkills.findIndex((v) => v.name === name);
      if (i >= 0) {
        discoveredSkills.splice(i, 1);
        LucilorExt.skillHelper.removeSkillLog(name, player);
      }
    }
  },
  updateDiscoveredSkills: (player: Player) => {
    let discoveredSkills = LucilorExt.getStorage<SkillList>(player, "discoveredSkills");
    if (!Array.isArray(discoveredSkills)) {
      discoveredSkills = [];
      LucilorExt.setStorage(player, "discoveredSkills", []);
    }
    const skills = player.getSkills(undefined, false, false);
    discoveredSkills = discoveredSkills.filter((skill) => skills.includes(skill.name));
    LucilorExt.setStorage(player, "discoveredSkills", discoveredSkills);
    player.updateMarks();
  },
  updateAomiSkills: async (player: Player) => {
    LucilorExt.skillHelper.updateDiscoveredSkills(player);
    LucilorExt.setStorage(player, "aomi", LucilorExt.getStorage(player, "discoveredSkills"));
    const skill = LucilorExt.getSkillName("aomi");
    player.unmarkSkill(skill);
    player.markSkill(skill);
    await timeout(0);
  },
  discoverAomiSkill: async (player: Player, {filter, isGameStart}: DiscoverAomiSkillParams = {}) => {
    const num = LucilorExt.getStorage(player, "aomi_choose", 0);
    const limit = LucilorExt.getStorage(player, "aomi_max", 0);
    const chooseFrom = LucilorExt.skillHelper.getChooseSkillList(player, {num, filter});
    const chooseTo = LucilorExt.getStorage<SkillList>(player, "discoveredSkills", []);
    const params: ChooseSkillsParams = {limit: [0, limit], chooseFrom, chooseTo, forced: true};
    await LucilorExt.skillHelper.discoverSkill(player, params);
    await LucilorExt.skillHelper.updateAomiSkills(player);
    const skills = LucilorExt.getStorage<SkillList>(player, "discoveredSkills", []).map((v) => v.name);
    LucilorExt.skillHelper.tryUseStartSkills(player, skills, isGameStart);
  },
  tryUseStartSkills: (player: Player, skills: string | string[], isGameStart?: boolean) => {
    const usedStartSkills = LucilorExt.getStorage<string[]>(player, "usedStartSkills", []);
    if (!Array.isArray(skills)) {
      skills = [skills];
    }
    for (const skill of skills) {
      const startSkills = LucilorExt.gameHelper.getStartSkills(skill);
      for (const startSkill of startSkills) {
        if (!usedStartSkills.includes(startSkill)) {
          usedStartSkills.push(startSkill);
          if (!isGameStart) {
            player.useSkill(startSkill);
          }
        }
      }
    }
  },
  getAomiUpgradeCost: (player: Player) => {
    const max = LucilorExt.getStorage(player, "aomi_max", 0);
    return {max: Math.max(2, max), choose: 2, teach: 3};
  },
  getAomiSkillList: (player: Player) => {
    return LucilorExt.getStorage<SkillList>(player, "aomi", []);
  },
  getAomiTeachableSkillList: (player: Player) => {
    return LucilorExt.skillHelper.getAomiSkillList(player).filter((v) => LucilorExt.skillHelper.isSkillTeachable(player, v.name));
  },
  isSkillTeachable: (teacher: Player, skill: string) => {
    return game.hasPlayer((current) => {
      if (current === teacher || current.hasSkill(skill)) {
        return false;
      }
      return true;
    });
  },
  updateSingleCharacter(player: Player) {
    if (!LucilorExt.getConfig("singleCharacter")) {
      return;
    }
    const name2 = player.name2;
    if (get.mode() === "guozhan" || !name2) {
      return;
    }
    const skillName = LucilorExt.getSkillName("replace", true);
    player.node.avatar2.hide();
    player.node.name2.innerHTML = "";
    player.classList.remove("fullskin2");
    player.node.count.classList.remove("p2");
    player.markSkill(skillName);
    player.storage[skillName] = name2;
    const div = document.createElement("div");
    div.setBackground(name2, "character");
    setTimeout(() => {
      const match = div.style.backgroundImage.match(/url\("(.+?)"\)/);
      const mark = player.marks[skillName];
      if (match && mark instanceof HTMLDivElement) {
        mark.classList.add("character-preview-img");
        mark.style.backgroundImage = `url("${match[1]}")`;
      }
    }, 1000);
  },
  updateCardCount(player: Player) {
    let handcardLimitEl: HTMLDivElement;
    const className = LucilorExt.getClassName("handcard-count");
    if (player.node.count.nextElementSibling?.classList.contains(className)) {
      handcardLimitEl = player.node.count.nextElementSibling as any as HTMLDivElement;
    } else {
      handcardLimitEl = document.createElement("div");
      player.node.count.insertAdjacentElement("afterend", handcardLimitEl as any as Element);
      handcardLimitEl.classList.add(className);
    }
    const num = player.countCards("h");
    const limit = player.getHandcardLimit();
    let limitStr = isNaN(limit) ? "0" : limit.toString();
    const hp = Math.max(0, player.hp);
    if (limit > hp) {
      limitStr = LucilorExt.getColoredStr(limitStr, "#62eb62");
    } else if (limit < hp) {
      limitStr = LucilorExt.getColoredStr(limitStr, "#ff2b2b");
    }
    handcardLimitEl.innerHTML = `${num}/${limitStr}`;
  }
};

export type SkillList = {name: string; character: string}[];
