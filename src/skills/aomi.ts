import {keysOf} from "@lucilor/utils";
import {sample} from "lodash";
import {SkillSetGetter} from "./types";

export const getAomiSkillSet: SkillSetGetter = () => [
  {
    name: "aomi",
    data: {
      charlotte: true,
      superCharlotte: true,
      persevereSkill: true,
      mark: true,
      intro: {
        content: (storage, player) => {
          const skills = LucilorExt.getStorage<string[]>(player, "aomi", []);
          const token = LucilorExt.getStorage(player, "aomi_token", 0);
          const max = LucilorExt.getStorage(player, "aomi_max", 0);
          const choose = LucilorExt.getStorage(player, "aomi_choose", 0);
          const reviveCount = LucilorExt.getStorage(player, "aomi_reviveCount", 0);
          const strs: string[] = [];
          if (!skills || skills.length < 1) {
            strs.push("未获得技能");
          } else {
            strs.push("已获得技能：" + LucilorExt.getColoredStr(get.translation(storage), "cyan"));
          }
          const maxStr = LucilorExt.getColoredStr(String(max), "orange");
          const chooseStr = LucilorExt.getColoredStr(String(choose), "deeppink");
          const tokenStr = LucilorExt.getColoredStr(String(token), "lightgreen");
          const avgMaxHp = LucilorExt.getColoredStr(LucilorExt.skillHelper.getAvgMaxHp(player).toFixed(2), "lightgreen");
          const reviveCountStr = LucilorExt.getColoredStr(String(reviveCount), "lightgreen");
          strs.push(`上限：${maxStr}`);
          strs.push(`候选：${chooseStr}`);
          strs.push(`代币：${tokenStr}`);
          strs.push(`体力上限均值：${avgMaxHp}`);
          strs.push(`已使用复活币：${reviveCountStr}`);
          return strs.join("<br>");
        }
      },
      init: (player) => {
        LucilorExt.setStorage(player, "aomi", []);
        LucilorExt.setStorage(player, "aomi_token", 0);
        LucilorExt.setStorage(player, "aomi_choose", 3);
        LucilorExt.setStorage(player, "aomi_max", 3);
        LucilorExt.setStorage(player, "aomi_reviveCount", 0);
      },
      ai: {
        threaten: 1.5
      },
      group: LucilorExt.getSubSkillNames("aomi", ["before", "after", "dmgCount", "maxHp", "huishi", "dieBefore"]),
      subSkill: {
        before: {
          trigger: {
            global: "gameStart",
            player: ["phaseBefore"]
          },
          persevereSkill: true,
          priority: Infinity,
          forced: true,
          content: async (event, trigger, player) => {
            await LucilorExt.skillHelper.discoverAomiSkill(event, player);
          }
        },
        after: {
          trigger: {
            player: ["phaseAfter", "turnOverAfter"]
          },
          persevereSkill: true,
          priority: -Infinity,
          forced: true,
          content: async (event, trigger, player) => {
            await LucilorExt.skillHelper.discoverAomiSkill(event, player);
          }
        },
        dmgCount: {
          trigger: {
            player: ["damageAfter", "loseHpAfter"]
          },
          persevereSkill: true,
          forced: true,
          priority: -1,
          content: async (event, trigger, player) => {
            let token0 = LucilorExt.getStorage(player, "aomi_token", 0);
            token0 += trigger.num;
            LucilorExt.setStorage(player, "aomi_token", token0);
            player.say(`奥秘代币：${token0}`);
            let isUpgraded = false;

            while (true) {
              const token = LucilorExt.getStorage(player, "aomi_token", 0);
              const max = LucilorExt.getStorage(player, "aomi_max", 0);
              const choose = LucilorExt.getStorage(player, "aomi_choose", 0);
              const aomiTeachableSkills = LucilorExt.skillHelper.getAomiTeachableSkillList(player);
              const choices: string[] = [];
              const cost = LucilorExt.skillHelper.getAomiUpgradeCost(player);
              const choiceList = [
                `技能库上限+1（当前${max}，消耗${cost.max}代币）`,
                `候选技能数量+1（当前${choose}，消耗${cost.choose}代币）`,
                `令一名其他角色获得技能库中的一个技能（消耗${cost.teach}代币）`
              ];
              const chioceCancel = "不升级";
              const chiocesAll = ["加上限", "加候选", "教别人", chioceCancel] as const;
              const disableChoice = (i: number) => {
                choiceList[i] = `<span style="opacity:0.5">${choiceList[i]}</span>`;
              };
              if (token >= cost.max) {
                choices.push(chiocesAll[0]);
              } else {
                disableChoice(0);
              }
              if (token >= cost.choose) {
                choices.push(chiocesAll[1]);
              } else {
                disableChoice(1);
              }
              if (token >= cost.teach && aomiTeachableSkills.length > 0) {
                choices.push(chiocesAll[2]);
              } else {
                disableChoice(2);
              }
              if (choices.length > 0) {
                choices.push(chioceCancel);
                const title = `消耗代币升级奥秘技能库<br>当前代币：${token}`;
                const result = await player
                  .chooseControl(choices)
                  .set("prompt", title)
                  .set("choiceList", choiceList)
                  .set("ai", () => {
                    const max = LucilorExt.getStorage(player, "aomi_max", 0);
                    const choose = LucilorExt.getStorage(player, "aomi_choose", 0);
                    if (max < choose && choices.includes(chiocesAll[0])) {
                      return chiocesAll[0];
                    }
                    if (choices.includes(chiocesAll[1])) {
                      return chiocesAll[1];
                    }
                    return choices.length > 0 ? choices[0] : chioceCancel;
                  })
                  .forResult();
                const cost2 = LucilorExt.skillHelper.getAomiUpgradeCost(player);
                let isUpgraded2 = false;
                switch (result.control) {
                  case chiocesAll[0]:
                    LucilorExt.setStorageWith(player, "aomi_max", (val: number) => val + 1);
                    LucilorExt.setStorageWith(player, "aomi_token", (val: number) => val - cost2.max);
                    isUpgraded2 = true;
                    break;
                  case chiocesAll[1]:
                    LucilorExt.setStorageWith(player, "aomi_choose", (val: number) => val + 1);
                    LucilorExt.setStorageWith(player, "aomi_token", (val: number) => val - cost2.choose);
                    isUpgraded2 = true;
                    break;
                  case chiocesAll[2]: {
                    const result = await LucilorExt.skillHelper.chooseSkills(player, {
                      chooseFrom: aomiTeachableSkills,
                      chooseFromLabel: "拥有技能",
                      chooseTo: [],
                      chooseToLabel: "教授技能",
                      limit: 1
                    });
                    if (result) {
                      const skillToTeach = result.skills1[0].name;
                      if (skillToTeach) {
                        const result = await player
                          .chooseTarget(choiceList[2], (card: Card, player: Player, target: Player) => {
                            return target !== player && !target.hasSkill(skillToTeach);
                          })
                          .forResult();
                        if (result.bool) {
                          LucilorExt.setStorageWith(player, "aomi_token", (val: number) => val - cost2.teach);
                          player.line(result.targets, "green");
                          const target = result.targets[0];
                          LucilorExt.skillHelper.addSkillLog(skillToTeach, target);
                          LucilorExt.skillHelper.tryUseStartSkills(event, target, [skillToTeach]);
                        }
                      }
                    }
                    break;
                  }
                }
                if (isUpgraded2) {
                  isUpgraded = true;
                } else {
                  break;
                }
              } else {
                break;
              }
            }
            if (isUpgraded) {
              await LucilorExt.skillHelper.discoverAomiSkill(event, player);
            }
          },
          ai: {
            maixie: true,
            maixie_hp: true,
            maihp: true
          }
        },
        maxHp: {
          trigger: {
            global: "roundStart"
          },
          persevereSkill: true,
          forced: true,
          content: async (event, trigger, player) => {
            const maxHp = Math.ceil(LucilorExt.skillHelper.getAvgMaxHp(player));
            if (player.maxHp < maxHp) {
              player.gainMaxHp();
              player.recover();
            } else if (player.maxHp > maxHp) {
              player.loseMaxHp();
            }
          }
        },
        huishi: {
          trigger: {
            global: "gameStart"
          },
          persevereSkill: true,
          forced: true,
          content: async (event, trigger, player: Player) => {
            const shouldRemove = (card: Card) => ["zhuge", "rewrite_zhuge", ""].includes(card.name);
            const toRemove: Card[] = [];
            for (const pile of ["cardPile", "discardPile"] as const) {
              const cards = Array.from(ui[pile].childNodes as NodeListOf<Card>).filter(shouldRemove);
              if (cards.length > 0) {
                toRemove.push(...cards);
                player.$throw(cards, undefined, undefined, undefined);
              }
            }
            for (const player of game.filterPlayer()) {
              const cards = player.getCards("hej", shouldRemove);
              if (cards.length) {
                toRemove.push(...cards);
                player.$throw(cards, undefined, undefined, undefined);
              }
            }
            if (toRemove.length > 0) {
              game.cardsGotoSpecial(toRemove);
              game.log(toRemove, "被移出了游戏");
            }

            let targetIdentity: string | undefined;
            if (player.identity === "zhu") {
              targetIdentity = "zhong";
            } else if (player.identity === "fan") {
              targetIdentity = "fan";
            }
            const target = sample(game.filterPlayer((p) => p.identity === targetIdentity));
            if (target) {
              if (!_status.connectMode) {
                if (player === game.me) {
                  target.setIdentity();
                  target.node.identity.classList.remove("guessing");
                  player.line(target, "green");
                  player.popup(LucilorExt.getSkillName("aomi"));
                }
              } else {
                player
                  .chooseControl("ok")
                  .set("dialog", [`${get.translation(target)}是${get.translation(targetIdentity + "2")}`, [[target.name], "character"]]);
              }
            }
          }
        },
        dieBefore: {
          trigger: {
            global: "dieBefore"
          },
          persevereSkill: true,
          filter: (event, player) => 0 < LucilorExt.getStorage(player, "aomi_max", 0),
          logTarget: "player",
          skillAnimation: true,
          animationColor: "thunder",
          prompt: (event, player) => {
            const name = event.player === player ? "自己" : get.translation(event.player);
            return `是否发动【${get.translation(LucilorExt.getSkillName("aomi"))}】，对${name}使用复活币？`;
          },
          prompt2: (event, player) => {
            const count = 1; // LucilorExt.getStorage(player, "aomi_reviveCount", 0);
            const name = event.player === player ? "自己" : get.translation(event.player);
            let str = "";
            if (count > 0) {
              str = `失去${count}技能库上限并`;
            } else if (count < 0) {
              str = `获得${-count}技能库上限并`;
            }
            return `${str}防止${name}死亡，其弃置判定区内的牌并复原武将牌，然后将体力回复至1并摸3张牌。`;
          },
          check: (event, player) => get.attitude(player, event.player) >= 3,
          content: async (event, trigger, player) => {
            const max = LucilorExt.getStorage(player, "aomi_max", 0);
            if (max < 1) {
              return;
            }
            LucilorExt.setStorageWith(player, "aomi_reviveCount", (val: number) => val + 1);
            LucilorExt.setStorage(player, "aomi_max", max - 1);
            trigger.cancel();
            if (trigger.player.maxHp < 1) {
              trigger.player.maxHp = 1;
            }
            await LucilorExt.skillHelper.discoverAomiSkill(event, player);
            trigger.player.recover(1 - trigger.player.hp);
            trigger.player.discard(trigger.player.getCards("j"));
            trigger.player.turnOver(false);
            trigger.player.link(false);
            trigger.player.draw(3);
            trigger.player.update();
          }
        }
      }
    },
    translate: {
      aomi: "奥秘",
      aomi_info: [
        "持恒技。",
        `<font color="#ff92f9"<b>『学无止境』</b></font><br>锁定技，游戏开始时、回合开始前、回合结束后和你翻面后，休整技能库。你每受到1点伤害（或体力流失）后获得1枚代币，若此时代币足够升级，则升级技能库。`,
        `<font color="#ff92f9"<b>『唯我独尊』</b></font><br>锁定技，每轮开始时，若你的体力上限：大于X，你减1点体力上限；小于X，你加1点体力上限并回复1点体力（X为其他角色的平均体力上限，向上取整）。`,
        `<font color="#ff92f9"<b>『慧识摘星』</b></font><br>锁定技，游戏开始时，你将所有【诸葛连弩】、【元戎精械弩】移出游戏。若你的身份为：主公，你随机得知一名忠臣的身份；反贼，你随机得知一名反贼的身份。`,
        `<font color="#ff92f9"<b>『漫漫路远』</b></font><br>一名角色死亡前，你可以减少1技能库上限（若足够）并防止该角色死亡，其弃置判定区内的牌并复原武将牌，然后将体力回复至1并摸3张牌。`
      ].join("<br>")
    },
    tips: {
      休整技能库: "从候选技能中选择获得或替换技能（若拥有技能多于上限，则需舍弃技能）。",
      升级技能库: "游戏开始时技能库上限为3，候选技能数量为3。升级时可消耗代币选择升级选项。"
    }
  }
];

export const updateAomiSkills = async () => {
  const getSkillAudio = (name: string): string => {
    const skill = lib.skill[name];
    if (!skill) {
      return name;
    }
    const audio = skill.audio;
    if (typeof audio === "string") {
      return getSkillAudio(audio);
    } else {
      return name;
    }
  };
  const audios = LucilorExt.aomiSkillConfig?.audios || {aomi: "", dmgCount: "", dieBefore: ""};
  for (const key of keysOf(audios)) {
    audios[key] = getSkillAudio(audios[key]);
  }
  const aomi = await LucilorExt.waitForSometing(() => LucilorExt.getSkill("aomi"));
  if (aomi) {
    aomi.audio = audios.aomi;
    if (aomi.subSkill) {
      aomi.subSkill.before.audio = audios.aomi;
      aomi.subSkill.after.audio = audios.aomi;
      aomi.subSkill.dmgCount.audio = audios.dmgCount;
      aomi.subSkill.dieBefore.audio = audios.dieBefore;
    }
  }
};
