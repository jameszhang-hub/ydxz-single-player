import { describe, expect, it } from "vitest";
import { summarizeBattle } from "./battleReport";
import type { BattleResult } from "./types";

describe("battle report", () => {
  it("separates damage sources and counts actual build triggers", () => {
    const result: BattleResult = {
      win: true,
      playerHp: 900,
      enemyHp: 0,
      rewards: {},
      events: [
        { id: 1, round: 1, actor: "player", type: "attack", text: "攻击", value: 100 },
        { id: 2, round: 1, actor: "player", type: "crit", text: "暴击", value: 200 },
        { id: 3, round: 1, actor: "player", type: "combo", text: "连击", value: 50 },
        { id: 4, round: 1, actor: "enemy", type: "attack", text: "攻击", value: 80 },
        { id: 5, round: 1, actor: "player", type: "heal", text: "吸血恢复 20", value: 20 },
        { id: 6, round: 2, actor: "player", type: "dodge", text: "勇者闪避了攻击" },
        { id: 7, round: 2, actor: "player", type: "stun", text: "击晕生效，下次行动跳过" },
        { id: 8, round: 2, actor: "warSoul", type: "skill", text: "战魂技", value: 300 },
        { id: 9, round: 2, actor: "beast", type: "heal", text: "魔兽恢复", value: 10 },
        { id: 10, round: 2, actor: "system", type: "defeat", text: "战斗胜利" }
      ]
    };
    expect(summarizeBattle(result)).toEqual({
      rounds: 2,
      damage: { player: 350, warSoul: 300, beast: 0, battlePet: 0 },
      totalDamage: 650,
      damageTaken: 80,
      healing: 30,
      triggers: { crit: 1, dodge: 1, combo: 1, lifesteal: 1, stun: 1, counter: 0 }
    });
  });
});
