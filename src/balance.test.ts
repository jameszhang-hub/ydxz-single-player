import { describe, expect, it } from "vitest";
import { BEASTS, BEAST_AFFIX_POOL, COMBAT_STAT_META, EMPTY_STATS, GEM_COLORS, HUNTING_POOL, RUNES, SLOTS, SOUL_CARDS, WAR_SOULS } from "./config";
import {
  ARTIFACT_MAX_LEVEL, EQUIPMENT_REFINE_MAX, GameRng, arenaEnemyStats, artifactStatScale, battleFlagRequiredExp, battleLoadoutFromSave,
  battlePetStatScale, beastStatScale, beastUpgradeCost, calculatePlayerStats, calculatePower, chestUpgradeCost, chestUpgradeRequirement,
  equipmentDecomposeExp, equipmentRefineScale, expForLevel, generateEquipment, grantPlayerExp, mountUpgradeCost, powerContributionLosses, rebalanceEquipment,
  progressionRewardMultiplier, runeUpgradeCost, createInitialSave, generateNpcs, runBattle, soulCardStatScale, stageEnemy, artifactForgeCost, warSoulStatScale
} from "./engine";

describe("long-form progression balance", () => {
  it("makes every later level materially harder and matches the captured Lv.137 scale", () => {
    expect(expForLevel(40)).toBeGreaterThan(13_000);
    expect(expForLevel(80)).toBeGreaterThan(expForLevel(40) * 3);
    expect(expForLevel(137)).toBeGreaterThan(150_000);
    expect(expForLevel(137)).toBeLessThan(165_000);
    expect(expForLevel(180)).toBeGreaterThan(expForLevel(137) * 4);
  });

  it("does not let a thousand starter boxes skip the progression curve", () => {
    const save = createInitialSave(1000);
    const exp = equipmentDecomposeExp(Array.from({ length: 1000 }, () => ({ quality: 0 })));
    grantPlayerExp(save, exp);
    expect(save.player.level).toBeLessThanOrEqual(18);
  });

  it("starts with a visible multi-round fight and preserves captured trial checkpoints", () => {
    const save = createInitialSave(1000);
    const first = runBattle(calculatePlayerStats(save), stageEnemy(1), new GameRng(2026), 1, battleLoadoutFromSave(save));
    expect(first.win).toBe(true);
    expect(first.events.at(-1)!.round).toBeGreaterThanOrEqual(3);
    expect(first.events.at(-1)!.round).toBeLessThanOrEqual(5);
    expect(first.events.some((event) => event.actor === "battlePet")).toBe(true);
    expect(stageEnemy(10).hp).toBeGreaterThan(stageEnemy(9).hp * 1.35);
    expect(stageEnemy(50)).toMatchObject({ hp: 54691, attack: 9262, defense: 8204, speed: 2112 });
    expect(stageEnemy(100)).toMatchObject({ hp: 215266, attack: 18532, defense: 35228, speed: 4512 });
  });

  it("keeps day-one arena opponents plausible and makes shown power match battle power", () => {
    const save = createInitialSave(1000);
    const starterPower = calculatePower(calculatePlayerStats(save));
    const npcs = generateNpcs(2026);
    expect(Math.max(...npcs.map((npc) => npc.level))).toBe(24);
    expect(Math.min(...npcs.map((npc) => npc.level))).toBe(1);
    expect(npcs.some((npc) => npc.power <= starterPower * 1.05)).toBe(true);
    for (const npc of [npcs[0], npcs[12], npcs[31], npcs[49]]) {
      const actual = calculatePower(arenaEnemyStats(npc));
      expect(Math.abs(actual - npc.power) / npc.power).toBeLessThan(0.015);
    }
  });

  it("keeps a captured-level supreme equipment roll in the original order of magnitude", () => {
    const rng = new GameRng(314159);
    let item = generateEquipment(135, 31, rng);
    for (let index = 0; index < 20_000 && item.quality !== 7; index += 1) item = generateEquipment(135, 31, rng);
    expect(item.quality).toBe(7);
    expect(item.stats.hp).toBeGreaterThan(35_000);
    expect(item.stats.hp).toBeLessThan(65_000);
    expect(item.stats.attack).toBeGreaterThan(6_500);
    expect(item.stats.attack).toBeLessThan(12_000);
    expect(item.stats.defense).toBeGreaterThan(2_700);
    expect(item.stats.defense).toBeLessThan(5_200);
    expect(item.stats.speed).toBeGreaterThan(400);
    expect(item.stats.speed).toBeLessThan(1_300);
  });

  it("lands a fully equipped Lv.137 character near the captured four-stat and power scale", () => {
    const save = createInitialSave(1000);
    save.player.level = 137;
    const rng = new GameRng(271828);
    for (const slot of SLOTS) {
      let item = generateEquipment(135, 31, rng);
      while (item.quality !== 7) item = generateEquipment(135, 31, rng);
      save.equipped[slot.id] = { ...item, slot: slot.id };
    }
    const stats = calculatePlayerStats(save);
    const power = calculatePower(stats);
    expect(stats.hp).toBeGreaterThan(1_800_000);
    expect(stats.hp).toBeLessThan(2_300_000);
    expect(stats.attack).toBeGreaterThan(400_000);
    expect(stats.attack).toBeLessThan(560_000);
    expect(stats.defense).toBeGreaterThan(165_000);
    expect(stats.defense).toBeLessThan(215_000);
    expect(stats.speed).toBeGreaterThan(15_000);
    expect(stats.speed).toBeLessThan(20_000);
    expect(power).toBeGreaterThan(25_000_000);
    expect(power).toBeLessThan(31_000_000);
    const losses = Object.fromEntries(powerContributionLosses(save).map((item) => [item.name, item.value]));
    expect(losses.人物等级 / power).toBeGreaterThan(0.55);
    expect(losses.人物等级 / power).toBeLessThan(0.75);
    expect(losses.装备 / power).toBeGreaterThan(0.2);
    expect(losses.装备 / power).toBeLessThan(0.38);
  });

  it("keeps a mature Lv.137 build distributed across permanent systems", () => {
    const save = createInitialSave(1000);
    save.player.level = 137;
    const rng = new GameRng(271828);
    for (const slot of SLOTS) {
      let item = generateEquipment(135, 31, rng);
      while (item.quality !== 7) item = generateEquipment(135, 31, rng);
      save.equipped[slot.id] = { ...item, slot: slot.id };
    }
    const soul = WAR_SOULS.at(-1)!;
    save.collections.warSouls[soul.id] = { count: 1, stage: 1, level: 30, refine: 0, luck: 0, refineStar: 1, refineAttributes: [], refineEntries: [], previousRefineAttributes: [], pendingRefine: [] };
    save.collections.deployedWarSoul = soul.id;
    BEASTS.forEach((beast) => { save.collections.beasts[beast.id] = { count: 1, discovered: true, level: beast === BEASTS.at(-1) ? 30 : 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 }; });
    save.collections.deployedBeast = BEASTS.at(-1)!.id;
    SOUL_CARDS.slice(-3).forEach((card) => { save.collections.soulCards[card.id] = { count: 1, level: 20, stage: 3 }; save.collections.equippedCards.push(card.id); });
    save.growthSystems.mount.mounts = [{ id: "mature-mount", definitionId: "mount-cloud", quality: 4, level: 30, attributes: [] }];
    save.growthSystems.mount.activeId = "mature-mount";
    RUNES.filter((rune) => rune.tier === 3).slice(0, 3).forEach((rune) => { save.growthSystems.runes.inventory[rune.id] = 1; save.growthSystems.runes.levels[rune.id] = 10; save.growthSystems.runes.equipped.push(rune.id); });
    SLOTS.forEach((slot, index) => { save.growthSystems.gems.sockets[slot.id] = { color: GEM_COLORS[index % GEM_COLORS.length].id, level: 8 }; });
    save.growthSystems.artifact.owned["artifact-ocean"] = { count: 1, level: 5 };
    save.growthSystems.artifact.equipped = "artifact-ocean";
    save.growthSystems.flag.level = 80;
    save.growthSystems.territory.reputation = 200;
    HUNTING_POOL.forEach((item) => { save.hunting[item.id] = 1; });
    const power = calculatePower(calculatePlayerStats(save));
    const contributions = powerContributionLosses(save);
    expect(power).toBeGreaterThan(38_000_000);
    expect(power).toBeLessThan(46_000_000);
    expect(contributions.reduce((sum, item) => sum + item.value, 0)).toBe(power);
    expect(contributions.filter((item) => item.value > 0)).toHaveLength(contributions.length);
    expect(Math.max(...contributions.slice(1).map((item) => item.value / power))).toBeLessThan(0.3);
    expect(contributions.find((item) => item.name === "魔兽")!.value / power).toBeGreaterThan(0.12);
    expect(contributions.find((item) => item.name === "魔兽")!.value / power).toBeLessThan(0.22);
    expect(contributions.find((item) => item.name === "人物等级")!.value / power).toBeGreaterThan(0.42);
    expect(contributions.find((item) => item.name === "人物等级")!.value / power).toBeLessThan(0.6);
  });

  it("feeds every new permanent system into the same combat-power calculation", () => {
    const save = createInitialSave(1000);
    const baseline = calculatePower(calculatePlayerStats(save));
    save.growthSystems.mount.mounts.push({ id: "m1", definitionId: "mount-thunder", quality: 1, level: 5, attributes: [] });
    save.growthSystems.mount.activeId = "m1";
    save.growthSystems.runes.inventory["rune-life"] = 1;
    save.growthSystems.runes.levels["rune-life"] = 2;
    save.growthSystems.runes.equipped = ["rune-life"];
    save.growthSystems.gems.inventory["blue-4"] = 1;
    save.growthSystems.gems.sockets.weapon = { color: "blue", level: 4 };
    save.growthSystems.artifact.owned["artifact-ares"] = { count: 1, level: 2 };
    save.growthSystems.artifact.equipped = "artifact-ares";
    save.growthSystems.flag.level = 5;
    save.growthSystems.territory.reputation = 20;
    expect(calculatePower(calculatePlayerStats(save))).toBeGreaterThan(baseline + 100_000);
    const losses = Object.fromEntries(powerContributionLosses(save).map((item) => [item.name, item.value]));
    expect(losses.坐骑).toBeGreaterThan(0);
    expect(losses.符文).toBeGreaterThan(0);
    expect(losses.宝石).toBeGreaterThan(0);
    expect(losses.神器).toBeGreaterThan(0);
    expect(losses.战旗).toBeGreaterThan(0);
    expect(losses.领地).toBeGreaterThan(0);
  });

  it("gives every combat stat visible progression sources and keeps the official beast wash pool", () => {
    Object.keys(EMPTY_STATS).forEach((stat) => {
      const key = stat as keyof typeof EMPTY_STATS;
      expect(COMBAT_STAT_META[key].sources.length).toBeGreaterThanOrEqual(2);
    });
    expect(BEAST_AFFIX_POOL.map(([, name]) => name)).toEqual([
      "速度", "生命", "攻击", "防御", "吸血", "反击", "连击", "闪避", "暴击", "击晕",
      "生命加成", "攻击加成", "防御加成", "吸血抗性", "闪避抗性", "暴击抗性", "击晕抗性",
      "连击抗性", "反击抗性", "暴伤", "坚毅", "减疗", "恢复", "重伤"
    ]);
    expect(BEAST_AFFIX_POOL.reduce((sum, [, , weight]) => sum + weight, 0)).toBeCloseTo(99.99, 2);
  });

  it("turns beast strength into real companion damage", () => {
    const enemy = { ...EMPTY_STATS, hp: 100_000, attack: 1, defense: 0, speed: 1 };
    const normal = runBattle({ ...EMPTY_STATS, hp: 20_000, attack: 1_000, defense: 100, speed: 100 }, enemy, new GameRng(77), 1, { beast: BEASTS[0] });
    const boosted = runBattle({ ...EMPTY_STATS, hp: 20_000, attack: 1_000, defense: 100, speed: 100, beastStrength: 5_000 }, enemy, new GameRng(77), 1, { beast: BEASTS[0] });
    const normalHit = normal.events.find((event) => event.actor === "beast" && event.value)?.value || 0;
    const boostedHit = boosted.events.find((event) => event.actor === "beast" && event.value)?.value || 0;
    expect(boostedHit).toBeGreaterThan(normalHit * 1.4);
  });

  it("raises material costs monotonically instead of flattening late progression", () => {
    expect(mountUpgradeCost(40, 4).food).toBeGreaterThan(mountUpgradeCost(20, 4).food * 5);
    expect(mountUpgradeCost(60, 4).gold).toBeGreaterThan(mountUpgradeCost(40, 4).gold * 3);
    expect(runeUpgradeCost(15).shards).toBeGreaterThan(runeUpgradeCost(5).shards * 4);
    expect(beastUpgradeCost(60, 4).essence).toBeGreaterThan(beastUpgradeCost(20, 4).essence * 10);
    expect(battleFlagRequiredExp(100)).toBeGreaterThan(battleFlagRequiredExp(20) * 5);
    expect(chestUpgradeCost(30)).toBeGreaterThan(chestUpgradeCost(23) * 3);
    expect(artifactForgeCost(40)).toBeGreaterThan(artifactForgeCost(10) * 4);
    expect(progressionRewardMultiplier(100, 10)).toBeGreaterThan(progressionRewardMultiplier(20, 2) * 10);
    expect(chestUpgradeRequirement(30)).toBe(5);
  });

  it("keeps stat output bounded while material costs remain exponential", () => {
    expect(EQUIPMENT_REFINE_MAX).toBe(30);
    expect(ARTIFACT_MAX_LEVEL).toBe(20);
    expect(equipmentRefineScale(30)).toBeGreaterThan(equipmentRefineScale(15));
    expect(equipmentRefineScale(300)).toBe(equipmentRefineScale(30));
    expect(equipmentRefineScale(30)).toBeLessThan(3);
    expect(warSoulStatScale(100)).toBeLessThan(16);
    expect(beastStatScale(100)).toBeLessThan(11);
    expect(soulCardStatScale(60)).toBeGreaterThan(10);
    expect(soulCardStatScale(60)).toBeLessThan(15);
    expect(battlePetStatScale(200)).toBeGreaterThan(100);
    expect(battlePetStatScale(200)).toBeLessThan(150);
    expect(artifactStatScale(200)).toBe(artifactStatScale(ARTIFACT_MAX_LEVEL));
    expect(artifactStatScale(ARTIFACT_MAX_LEVEL)).toBeLessThan(4);
  });

  it("repairs legacy exponential gear without changing its identity or progression", () => {
    const item = generateEquipment(135, 31, new GameRng(8675309));
    const identity = { id: item.id, slot: item.slot, level: item.level, quality: item.quality };
    item.stats = { hp: 900_000_000, attack: 120_000_000, defense: 80_000_000, speed: 20_000_000 };
    item.score = 2_000_000_000;
    rebalanceEquipment(item);
    expect({ id: item.id, slot: item.slot, level: item.level, quality: item.quality }).toEqual(identity);
    expect(item.stats.hp).toBeLessThan(40_000);
    expect(item.stats.attack).toBeLessThan(8_000);
    expect(item.score).toBeLessThan(2_000_000);
  });
});
