import {SkillSetGetter} from "./types";

export const getReplaceCharacterSkillSet: SkillSetGetter = () => [
  {
    name: "replace",
    isGlobal: true,
    data: {
      charlotte: true,
      superCharlotte: true,
      trigger: {global: "gameStart"},
      silent: true,
      priority: Infinity,
      mark: "character",
      marktext: "<img />",
      intro: {
        mark: (dialog, storage, player) => {
          storage = player.storage;
          const skillName = LucilorExt.getSkillName("replace", true);
          if (storage && storage[skillName]) {
            dialog.add([[storage[skillName]], "character"]);
            const skills = lib.character[storage[skillName]][3];
            for (const skill of skills) {
              const skillNameCN = get.translation(skill);
              const skillInfo = get.skillInfoTranslation(skill, player);
              dialog.add(`<div><div class="skill">【${skillNameCN}】</div><div>${skillInfo}</div></div>`);
            }
          }
          return "";
        },
        content: "content",
        markcount: () => 0
      },
      content: async (event, trigger, player) => {
        const config = LucilorExt.aomiSkillConfig;
        const name = config?.character;
        const names = [player.name1, player.name2].filter((v) => v && v !== name);
        if (player !== game.me || !name || names.length < 1) {
          return;
        }
        const controls = [...names];
        controls.push("取消");
        const {result} = await player.chooseControl(...controls).set("prompt", `是否替换武将牌为${get.translation(name)}？`);
        const control = result.control;
        if (get.mode() === "guozhan") {
          const info = lib.character[control];
          for (const skill of info[3]) {
            player.removeSkill(skill);
          }
          player.addSkill(LucilorExt.getSkillName("aomi"));
          info[3] = [LucilorExt.getSkillName("aomi")];
        } else {
          if (control === player.name) {
            player.reinit(player.name, name);
          } else if (control === player.name2) {
            player.reinit(player.name2, name);
          }
        }
        LucilorExt.skillHelper.updateSingleCharacter(player);
        const reinit = lib.element.player.reinit;
        (player as any).reinit = function (...args: any) {
          reinit.apply(this, args);
          LucilorExt.skillHelper.updateSingleCharacter(this);
        };
      }
    },
    translate: {
      replace: "武将牌"
    }
  }
];
