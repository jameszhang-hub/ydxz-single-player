import { describe, expect, it } from "vitest";
import { stageEnemy } from "./engine";
import { TRIAL_META, TRIAL_MONSTERS, trialMonsterAt, trialStageLabel } from "./trial";

describe("captured trial monster table", () => {
  it("keeps the complete v148 source and its intentional id gap", () => {
    expect(TRIAL_META).toMatchObject({ version: "v148 (2025-04-03)", rateUnit: "percent", monsterCount: 1480, chapterCount: 40 });
    expect(TRIAL_MONSTERS).toHaveLength(1480);
    expect(trialMonsterAt(1)).toMatchObject({ id: 1, chapter: 1, step: 1, hp: 1000, attack: 250, defense: 50, speed: 100 });
    expect(trialMonsterAt(200)).toMatchObject({ id: 200, chapter: 8, step: 40 });
    expect(trialMonsterAt(201)).toMatchObject({ id: 301, chapter: 9, step: 1 });
    expect(trialStageLabel(201)).toBe("9-1");
  });

  it("converts source percentages into combat-engine basis points", () => {
    expect(stageEnemy(2).lifesteal).toBe(1000);
    expect(stageEnemy(10)).toMatchObject({ hp: 8160, attack: 1189, defense: 1225, speed: 240, stun: 1100 });
    expect(stageEnemy(190)).toMatchObject({ hp: 506447, attack: 115026, defense: 69065, speed: 10290, crit: 1600, stun: 6000 });
  });
});
