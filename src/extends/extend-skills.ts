import {ObjectOf} from "@lucilor/utils";
import {sample, sampleSize} from "lodash";

export const extendSkills: GameImportFunction = (lib, game, ui, get) => {
  lib.skill["requanfeng_gain"].filter = (event) =>
    event.player.getStockSkills(true, true).filter((skill) => {
      const info = get.info(skill, event.player);
      return info && !info.hiddenSkill && !info.preHidden && !info.zhuSkill && !info.charlotte;
    }).length > 0;
  if (LucilorExt.getConfig("skipMiniGames")) {
    lib.skill["chongxu"].content = async (event, trigger, player) => {
      let score = 5;
      if (score < 3) {
        if (score >= 2) player.draw();
        return;
      }
      const list: string[] = [];
      if (player.countMark("miaojian") < 2 && player.hasSkill("miaojian")) list.push("修改【妙剑】");
      if (player.countMark("shhlianhua") < 2 && player.hasSkill("shhlianhua")) list.push("修改【莲华】");
      let result;
      if (list.length) {
        list.push("全部摸牌");
        result = (
          await player
            .chooseControl(list)
            .set("prompt", "冲虚：修改技能" + (score === 5 ? "并摸一张牌" : "") + "；或摸" + Math.floor(score / 2) + "张牌")
        ).result;
      } else {
        result = {control: "全部摸牌"};
      }
      if (result.control !== "全部摸牌") {
        score -= 3;
        const skill = result.control === "修改【妙剑】" ? "miaojian" : "shhlianhua";
        player.addMark(skill, 1, false);
        game.log(player, "修改了技能", "#g【" + get.translation(skill) + "】");
      }
      if (score > 1) {
        player.draw(Math.floor(score / 2));
      }
    };
    lib.skill["yufeng"].content = async (event, trigger, player) => {
      const result = {win: true, score: 2};
      player.popup(get.cnNumber(result.score) + "分", result.win ? "wood" : "fire");
      game.log(player, "御风飞行", result.win ? "#g成功" : "#y失败");
      game.log(player, "获得了", "#g" + result.score + "分");
      const max = player.countMark("yufeng");
      if (!result.win) {
        if (result.score) player.draw(result.score);
        if (max) player.removeMark("yufeng", max, false);
      } else {
        if (max < 2) player.addMark("yufeng", 1, false);
        const result2 = await player
          .chooseTarget(
            "请选择【御风】的目标",
            [1, result.score],
            (card: Card, player: Player, target: Player) => target !== player && !target.hasSkill("yufeng2")
          )
          .set("ai", (target: Player) => {
            const player = _status.event.player;
            const att = -get.attitude(player, target);
            let attx = att * 2;
            if (att <= 0 || target.hasSkill("xinfu_pdgyingshi")) return 0;
            if (target.hasJudge("lebu")) attx -= att;
            if (target.hasJudge("bingliang")) attx -= att;
            return attx / Math.max(2.25, Math.sqrt(target.countCards("h") + 1));
          })
          .forResult();
        if (result2.bool) {
          result2.targets.sortBySeat();
          player.line(result2.targets, "green");
          game.log(result2.targets, "获得了", "#y“御风”", "效果");
          for (const i of result2.targets) i.addSkill("yufeng2");
          if (result.score > result2.targets.length) player.draw(result.score - result2.targets.length);
        } else player.draw(result.score);
      }
    };
    lib.skill["qiaosi"].content = async (event, trigger, player) => {
      const list2 = ["trick", "trick", sample(["sha", "shan", "tao", "jiu"]), "equip", "equip"];
      const {cards} = event;
      while (list2.length) {
        const filter = list2.shift();
        let card = get.cardPile((x) => {
          if (cards.includes(x)) return false;
          if (typeof filter === "string" && get.type(x, "trick") === filter) return true;
          return false;
        });
        if (card) cards.push(card);
        else {
          card = get.cardPile((x) => !cards.includes(x));
          if (card) cards.push(card);
        }
      }
      if (!cards.length) {
        return;
      }
      event.cards = cards;
      event.num = cards.length;
      await player.showCards(cards);
      player.gain(event.cards, "gain2");
      const result = await player
        .chooseControl()
        .set("choiceList", ["将" + get.cnNumber(event.num) + "张牌交给一名其他角色", "弃置" + get.cnNumber(event.num) + "张牌"])
        .set("ai", () => {
          if (game.hasPlayer((current) => current !== player && get.attitude(player, current) > 2)) return 0;
          return 1;
        })
        .forResult();
      if (result.index !== 0) {
        await player.chooseToDiscard(event.num, true, "he");
        return;
      }
      const result2 = await player
        .chooseCardTarget({
          position: "he",
          filterCard: true,
          selectCard: event.num,
          filterTarget(card, player, target) {
            return player !== target;
          },
          ai1() {
            return 1;
          },
          ai2(target: Player) {
            let att = get.attitude(_status.event.player, target);
            if (target.hasSkillTag("nogain")) att /= 10;
            if (target.hasJudge("lebu")) att /= 5;
            return att;
          },
          prompt: "选择" + get.cnNumber(event.num) + "张牌，交给一名其他角色。",
          forced: true
        })
        .forResult();
      if (result2.bool) {
        const target = result2.targets?.[0];
        if (target && result2.cards) {
          player.give(result2.cards, target);
        }
      }
    };
    lib.skill["olshengong"].content = async (event, trigger, player) => {
      const {cards} = event;
      let card = cards[0];
      let subtype = get.subtype(card);
      if (subtype !== "equip1" && subtype !== "equip2") subtype = "others";
      const card_map = {
        equip1: [
          ["diamond", 13, "bintieshuangji"],
          ["diamond", 1, "wuxinghelingshan"],
          ["spade", 13, "wutiesuolian"],
          ["diamond", 12, "wushuangfangtianji"],
          ["spade", 6, "chixueqingfeng"],
          ["spade", 5, "guilongzhanyuedao"]
        ],
        equip2: [
          ["club", 1, "huxinjing"],
          ["club", 2, "heiguangkai"],
          ["spade", 2, "linglongshimandai"],
          ["club", 1, "hongmianbaihuapao"],
          ["spade", 2, "qimenbagua"],
          ["spade", 9, "guofengyupao"]
        ],
        others: [
          ["diamond", 1, "zhaogujing"],
          ["spade", 5, "sanlve"],
          ["club", 12, "tianjitu"],
          ["spade", 2, "taigongyinfu"],
          ["diamond", 1, "shufazijinguan"],
          ["club", 4, "xuwangzhimian"]
        ]
      };
      const status = _status as any;
      if (!status.olshengong_map) {
        status.olshengong_map = {};
      }
      if (!status.olshengong_maken) {
        status.olshengong_maken = {};
      }
      const olshengong_map: ObjectOf<boolean> = status.olshengong_map;
      const olshengong_maken: ObjectOf<Card> = status.olshengong_maken;
      const list = card_map[subtype as keyof typeof card_map];
      for (let i = 0; i < list.length; i++) {
        const name = list[i][2];
        if (!lib.card[name] || olshengong_map[name]) {
          list.splice(i--, 1);
        }
      }
      if (!list.length) {
        return;
      }
      const result = await player
        .chooseButton(["请选择一种装备牌", [sampleSize(list, 3), "vcard"]], true)
        .set("ai", (button: Button) => get.value({name: button.link[2]}, player, "raw"))
        .forResult();
      const name = result.links[0][2];
      if (olshengong_maken[name]) card = olshengong_maken[name];
      else {
        card = game.createCard2(name, result.links[0][0], result.links[0][1]);
        olshengong_maken[name] = card;
      }
      player.addSkill("olshengong_destroy");
      player.markAuto("olshengong_destroy", [card]);
      if (!game.hasPlayer((current) => current.canEquip(card))) {
        return;
      }
      const result2 = await player
        .chooseTarget(true, "将" + get.translation(card) + "置于一名角色的装备区内", (card: Card, player: Player, target: Player) =>
          target.canEquip(card)
        )
        .set("card", card)
        .set("ai", (target: Player) => get.effect(target, card, player, player))
        .forResult();
      if (result2.bool) {
        olshengong_map[card.name] = true;
        const target = result2.targets[0];
        player.line(target, "green");
        target.$gain2(card);
        game.delayx();
        target.equip(card);
      }
    };
    lib.skill["zhengjing"].content = async (event, trigger, player) => {
      const cards: Card[] = [];
      const names: string[] = [];
      for (let i = 0; i < 4; i++) {
        const card = get.cardPile((carde) => carde.name !== "du" && !names.includes(carde.name));
        if (!card) {
          break;
        }
        cards.push(card);
        names.push(card.name);
      }
      if (!cards.length) {
        game.log(player, "并没有整理出经典");
        player.popup("杯具");
        return;
      }
      await player.showCards(cards, get.translation(player) + "整理出了以下经典");
      game.cardsGotoOrdering(cards);
      const result = await player
        .chooseTarget(true, "将整理出的经典置于一名角色的武将牌上")
        .set("ai", (target: Player) => {
          if (target.hasSkill("xinfu_pdgyingshi")) return 0;
          return -get.attitude(player, target);
        })
        .forResult();
      if (!result.bool) {
        return;
      }
      const target = result.targets[0];
      player.line(target, "thunder");
      let result2;
      if (cards.length === 1) {
        result2 = {bool: true, moved: [cards, []]};
        return;
      } else {
        result2 = await player
          .chooseToMove(true, "整经：请分配整理出的经典")
          .set("list", [["置于" + get.translation(target) + "的武将牌上", cards], ["自己获得"]])
          .set("filterMove", (from: any, to: any, moved: any) => {
            if (moved[0].length === 1 && to === 1 && from.link === moved[0][0]) return false;
            return true;
          })
          .set("filterOk", (moved: any) => moved[0].length > 0)
          .set("processAI", (list: any[][][]) => {
            const cards = list[0][1].slice(0).sort((a, b) => get.value(a) - get.value(b));
            return [cards.splice(0, 1), cards];
          })
          .forResult();
      }
      if (result2.bool) {
        const gives = result2.moved[0];
        const gains = result2.moved[1];
        target.addSkill("zhengjing2");
        target.addToExpansion(gives, "gain2").gaintag.add("zhengjing2");
        if (gains.length) player.gain(gains, "gain2");
      }
    };
  }

  lib.character["sb_liubei"][3] = ["sbrende", "sbjijiang"];
};
