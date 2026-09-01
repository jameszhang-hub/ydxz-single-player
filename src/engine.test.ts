import { describe, expect, it } from "vitest";
import {
  GameRng, battleFlagSuccessRate, battlePetAwakenRates, battlePetExpForLevel, battlePetMutationRates, beastAssistRate, beastComposeRate, beastDevourPreview, beastSkillWashGradeRates, beastSpiritExp, calculatePlayerStats, calculatePower,
  chestQualityWeights, createInitialSave, equipmentPlanScore, generateEquipment, goalProgress,
  grantPlayerExp, rollBeastAffixes, rollWarSoulRefine, runBattle, stageEnemy,
  warSoulComposeRate, warSoulRefineCost, warSoulRefineSlotCap, warSoulRefineWeights
} from "./engine";
import {
  BEASTS, BEAST_CODEX_SLOTS, BEAST_EGG_TYPES, BEAST_EXPERIENCE_SPIRIT_BY_TIER,
  BEAST_FACTIONS, BEAST_MAGIC_CRYSTAL_RATES, BEAST_QUALITIES, EMPTY_STATS,
  HUNTING_POOL, RECHARGE_PRODUCTS, SHOP_GOODS, WAR_SOULS, beastDisplayArtIndex
} from "./config";

describe("probability configuration", () => {
  it("keeps every chest table normalized to 10000 basis points", () => {
    for (let level = 1; level <= 31; level += 1) {
      expect(chestQualityWeights(level).reduce((sum, value) => sum + value, 0)).toBe(10000);
    }
  });

  it("matches the confirmed level 30 and 31 chest tables", () => {
    expect(chestQualityWeights(30)).toEqual([0, 0, 416, 2700, 3800, 2100, 700, 200, 80, 4]);
    expect(chestQualityWeights(31)).toEqual([0, 0, 235, 2300, 4150, 2200, 800, 220, 90, 5]);
  });

  it("uses the transcribed official refine and battle flag rates", () => {
    expect(warSoulRefineWeights(0)).toEqual([0, 0, 0, 0, 0, 0, 1500, 8500]);
    expect(warSoulRefineWeights(2000)).toEqual([0, 380, 3340, 4820, 1440, 20, 0, 0]);
    expect(battleFlagSuccessRate(5)).toBe(10000);
    expect(battleFlagSuccessRate(95)).toBe(1000);
  });

  it("uses the full confirmed beast compose table", () => {
    expect([2, 3, 4, 5, 6, 7].map(beastComposeRate)).toEqual([9000, 8000, 6000, 3000, 2000, 1000]);
    expect(beastComposeRate(8)).toBe(0);
  });

  it("uses the official beast passive wash grade table", () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(beastSkillWashGradeRates)).toEqual([
      [70, 20, 10], [70, 20, 10], [60, 25, 15], [50, 30, 20],
      [40, 35, 25], [30, 40, 30], [0, 45, 55]
    ]);
  });

  it("uses the transcribed official battle-pet mutation and awakening tables", () => {
    expect(battlePetMutationRates("grass")).toEqual([5, 3, 1.5, 0.5, 0, 0]);
    expect(battlePetMutationRates("flower")).toEqual([0, 4, 5, 4, 2, 0]);
    expect(battlePetMutationRates("fruit")).toEqual([0, 0, 6, 8, 4, 2]);
    expect(battlePetAwakenRates(0)).toEqual([60, 35, 5, 0, 0, 0]);
    expect(battlePetAwakenRates(500)).toEqual([40, 35, 18, 7, 0, 0]);
    expect(battlePetAwakenRates(1500)).toEqual([20, 35, 25, 12, 4, 4]);
    expect(battlePetAwakenRates(2000)).toEqual([0, 30, 34, 20, 8, 8]);
    expect(battlePetAwakenRates(2500)).toEqual([0, 0, 0, 0, 50, 50]);
    expect(battlePetExpForLevel(50)).toBeGreaterThan(battlePetExpForLevel(20) * 20);
  });

  it("keeps the captured diamond and gold warehouse tiers exact", () => {
    const diamond = RECHARGE_PRODUCTS.filter((item) => item.category === "diamond");
    expect(diamond.map((item) => [item.amountRmb, item.rewards.diamond])).toEqual([
      [6, 60], [30, 300], [68, 680], [128, 1280], [328, 3280], [648, 6480]
    ]);
    const gold = SHOP_GOODS.filter((item) => item.tab === "goldWarehouse");
    expect(gold.map((item) => [item.name, item.cost, item.rewards.gold])).toEqual([
      ["少量金币", 20, 6400], ["一些金币", 40, 14000], ["许多金币", 100, 36000],
      ["大量金币", 200, 76000], ["超多金币", 400, 160000], ["海量金币", 1000, 408000]
    ]);
    expect(new Set(SHOP_GOODS.map((item) => item.tab))).toEqual(new Set(["diamondHot", "goldWarehouse", "guild", "merit", "trial"]));
  });

  it("keeps the captured tier-5 assist ratio and monotonic local fallback", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(beastAssistRate)).toEqual([4, 6, 8, 10, 12, 14, 16, 18]);
  });

  it("matches the captured level-2 devour preview", () => {
    expect(beastDevourPreview(2)).toEqual({
      red: { chance: 85, speed: 352, attack: 880 },
      blue: { chance: 70.62, hp: 9180, defense: 459 },
      yellow: { chance: 35.15, beastStrength: 0.77, hp: 2310 }
    });
  });

  it("keeps all 48 captured beast codex entries in their four factions", () => {
    const capturedShape = {
      nature: [1, 1, 2, 2, 1, 1, 4, 1],
      element: [2, 2, 2, 2, 2, 2, 4, 1],
      shadow: [0, 0, 2, 2, 1, 1, 4, 1],
      legend: [0, 0, 0, 0, 1, 1, 4, 1]
    } as const;

    expect(BEASTS).toHaveLength(48);
    expect(BEAST_CODEX_SLOTS).toHaveLength(48);
    expect(new Set(BEAST_CODEX_SLOTS.map((slot) => slot.id)).size).toBe(48);
    expect(BEAST_CODEX_SLOTS.every((slot) => Boolean(slot.definitionId))).toBe(true);
    expect(new Set(BEAST_CODEX_SLOTS.map((slot) => slot.definitionId))).toEqual(new Set(BEASTS.map((beast) => beast.id)));
    BEAST_FACTIONS.forEach((faction) => {
      expect(BEAST_CODEX_SLOTS.filter((slot) => slot.faction === faction.id)).toHaveLength(faction.total);
      expect(BEAST_QUALITIES.map((quality) => BEAST_CODEX_SLOTS.filter((slot) => slot.faction === faction.id && slot.tier === quality.tier).length)).toEqual(capturedShape[faction.id]);
    });
    expect(BEAST_QUALITIES.map((quality) => quality.name)).toEqual(["优秀", "精良", "稀有", "史诗", "传说", "完美", "超凡", "璀璨"]);
    expect(BEASTS.find((beast) => beast.id === "beast-36")?.name).toBe("寒冰领主");
    expect(BEASTS.map((beast) => beast.artIndex)).toEqual(Array.from({ length: 48 }, (_, index) => index));
    expect(BEASTS.map((beast) => beast.name)).toEqual([
      "风灵", "坚果蝠", "小龙崽", "祝蝠", "小黑龙", "吸血魔灵", "火龙果", "翡翠龙",
      "史矛格", "史矛格", "史矛格", "史矛格", "黄金史矛格",
      "优秀经验精灵", "火灵", "精良经验精灵", "电灵", "稀有经验精灵", "火元素", "史诗经验精灵",
      "小火龙", "传说经验精灵", "冰霜龙", "完美经验精灵", "寒冰领主", "雷神", "雷神", "雷神",
      "雷神", "九霄雷神", "大眼蝠", "雪幽灵", "古拉蝠", "幽灵法师", "电波龙", "梦魔",
      "德古拉", "德古拉", "德古拉", "德古拉", "血焰德古拉", "精灵龙", "幽灵公主", "月之祭司",
      "月之祭司", "月之祭司", "月之祭司", "暗月祭司"
    ]);
  });

  it("uses the captured star-form art for an owned extraordinary beast", () => {
    expect([0, 1, 2, 3, 4].map((stars) => beastDisplayArtIndex("beast-11", stars))).toEqual([8, 9, 10, 11, 11]);
    expect(beastDisplayArtIndex("beast-10", 2)).toBe(27);
    expect(beastDisplayArtIndex("beast-14", 3)).toBe(39);
    expect(beastDisplayArtIndex("beast-16", 1)).toBe(44);
  });

  it("keeps a real random-result pool behind every normal beast merge tier", () => {
    expect([1, 2, 3, 4, 5, 6].map((tier) => BEASTS.filter((beast) => beast.tier === tier && beast.mergeEligible !== false).length)).toEqual([2, 2, 5, 5, 4, 4]);
    expect(BEASTS.filter((beast) => beast.tier === 7 && beast.mergeEligible !== false).map((beast) => beast.name).sort()).toEqual(["史矛格", "德古拉", "月之祭司", "雷神"].sort());
    expect(BEASTS.filter((beast) => beast.tier === 8 && beast.mergeEligible !== false)).toHaveLength(0);
  });

  it("keeps egg colors, qualities and official special pools aligned", () => {
    const rare = BEAST_EGG_TYPES.find((egg) => egg.id === "rare")!;
    const yellow = BEAST_EGG_TYPES.find((egg) => egg.id === "yellow")!;
    expect(rare.name).toBe("稀有级魔兽蛋");
    expect(rare.tier).toBe(3);
    expect(rare.pool).toHaveLength(5);
    expect(rare.pool.every((entry) => BEASTS.find((beast) => beast.id === entry.definitionId)?.tier === 3)).toBe(true);
    expect(rare.pool.map((entry) => entry.weight)).toEqual([20, 20, 20, 20, 20]);
    expect(yellow.name).toBe("史诗级魔兽蛋");
    expect(yellow.tier).toBe(4);
    expect(yellow.pool.every((entry) => BEASTS.find((beast) => beast.id === entry.definitionId)?.tier === 4)).toBe(true);

    expect(BEAST_EGG_TYPES.find((egg) => egg.id === "legendary")?.pool.map((entry) => entry.weight)).toEqual([40, 20, 20, 20]);
    expect(BEAST_EGG_TYPES.find((egg) => egg.id === "perfect")?.pool.map((entry) => entry.weight)).toEqual([16.67, 33.33, 33.33, 16.67]);
    expect(BEAST_EGG_TYPES.find((egg) => egg.id === "extraordinary")?.pool.map((entry) => entry.weight)).toEqual([33.33, 33.33, 16.67, 16.67]);
  });

  it("uses the recorded experience-spirit identities and official magic-crystal rates", () => {
    expect(Object.values(BEAST_EXPERIENCE_SPIRIT_BY_TIER).map((id) => BEASTS.find((beast) => beast.id === id)?.name)).toEqual([
      "优秀经验精灵", "精良经验精灵", "稀有经验精灵", "史诗经验精灵", "传说经验精灵", "完美经验精灵"
    ]);
    expect(BEAST_MAGIC_CRYSTAL_RATES).toEqual({ 1: 4, 2: 18, 3: 100, 4: 560, 5: 4800, 6: 9000 });
    expect([1, 2, 3, 4, 5, 6].map((tier) => beastSpiritExp(tier))).toEqual([600, 1200, 2400, 4800, 9600, 19200]);
  });

  it("makes war-soul sub-material count reach the confirmed 100% maximum", () => {
    expect([1, 2, 3, 4].map(warSoulComposeRate)).toEqual([2500, 5000, 7500, 10000]);
  });

  it("uses the captured flat war-soul refine cost and the seven-slot epic cap", () => {
    expect(warSoulRefineCost(3, 0)).toEqual({ gold: 12000, soulCore: 0 });
    expect(warSoulRefineCost(3, 6)).toEqual({ gold: 12000, soulCore: 0 });
    expect(warSoulRefineSlotCap(3)).toBe(7);
  });

  it("keeps the transcribed Twilight Forest pool complete and normalized", () => {
    expect(HUNTING_POOL).toHaveLength(53);
    expect(HUNTING_POOL.some((item) => item.name === "雪鹿王" && item.rate === 0.73)).toBe(true);
    const displayedTotal = HUNTING_POOL.reduce((sum, item) => sum + item.rate, 0);
    expect(displayedTotal).toBeGreaterThan(99);
    expect(displayedTotal).toBeLessThan(102);
  });
});

describe("deterministic engines", () => {
  it("creates identical equipment from the same saved seed", () => {
    const first = generateEquipment(30, 30, new GameRng(123456));
    const second = generateEquipment(30, 30, new GameRng(123456));
    expect(first).toEqual(second);
  });

  it("creates identical battles from the same seed", () => {
    const player = { ...EMPTY_STATS, hp: 1200, attack: 180, defense: 60, speed: 80, crit: 1800, combo: 1400 };
    const first = runBattle(player, stageEnemy(8), new GameRng(42), 8);
    const second = runBattle(player, stageEnemy(8), new GameRng(42), 8);
    expect(first).toEqual(second);
  });

  it("persists a valid fresh-save schema", () => {
    const save = createInitialSave(1000);
    expect(save.schemaVersion).toBe(1);
    expect(save.npcs).toHaveLength(50);
    expect(save.resources.chestTicket).toBeGreaterThan(0);
    expect(save.automation.batch).toBe(10);
    expect(save.buildPlan).toBe("crit");
    expect(save.player.level).toBe(1);
    expect(save.collections.deployedWarSoul).toBeUndefined();
    expect(save.collections.warSouls).toEqual({});
    expect(save.collections.beastBoard).toHaveLength(16);
    expect(save.collections.beastBoard.every((slot) => slot === null)).toBe(true);
  });

  it("levels reliably and grants level-up chest resources", () => {
    const save = createInitialSave(1000);
    const tickets = save.resources.chestTicket;
    const gained = grantPlayerExp(save, 50000);
    expect(gained).toBeGreaterThan(0);
    expect(save.player.level).toBeGreaterThan(10);
    expect(save.resources.chestTicket).toBeGreaterThan(tickets);
  });

  it("creates four distinct beast affixes and feeds deployed beast growth into power", () => {
    const save = createInitialSave(1000);
    const before = calculatePower(calculatePlayerStats(save));
    const affixes = rollBeastAffixes(1, new GameRng(77));
    expect(affixes).toHaveLength(4);
    expect(new Set(affixes.map((item) => item.stat)).size).toBe(4);
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes, pendingAffixes: [], devourLevel: 0 };
    save.collections.deployedBeast = "beast-1";
    const deployed = calculatePower(calculatePlayerStats(save));
    save.collections.beasts["beast-1"].level = 20;
    const leveled = calculatePower(calculatePlayerStats(save));
    expect(deployed).toBeGreaterThan(before);
    expect(leveled).toBeGreaterThan(deployed);
    save.collections.beasts["beast-1"].count = 0;
    save.collections.deployedBeast = undefined;
    expect(calculatePower(calculatePlayerStats(save))).toBeGreaterThan(before);
  });

  it("puts named war soul and beast skills into the round log", () => {
    const player = { ...EMPTY_STATS, hp: 12000, attack: 850, defense: 180, speed: 100 };
    const enemy = { ...EMPTY_STATS, hp: 30000, attack: 420, defense: 120, speed: 80 };
    const result = runBattle(player, enemy, new GameRng(25), 1, {
      warSoul: WAR_SOULS.find((item) => item.name === "青龙"),
      beast: BEASTS.find((item) => item.name === "幽灵公主")
    });
    expect(result.companions).toEqual({ warSoul: "青龙", beast: "幽灵公主", beastArtIndex: 42 });
    expect(result.events.some((event) => event.actor === "warSoul" && event.text.includes("青龙"))).toBe(true);
    expect(result.events.some((event) => event.actor === "beast" && event.text.includes("幽灵公主"))).toBe(true);
  });

  it("renders battle-pet growth as a real periodic combat action", () => {
    const player = { ...EMPTY_STATS, hp: 12000, attack: 850, defense: 180, speed: 100 };
    const enemy = { ...EMPTY_STATS, hp: 30000, attack: 120, defense: 120, speed: 80 };
    const result = runBattle(player, enemy, new GameRng(25), 1, { battlePet: { level: 35, quality: 4 } });
    expect(result.companions).toMatchObject({ battlePet: "完美战宠", battlePetArtIndex: 3 });
    expect(result.events.some((event) => event.actor === "battlePet" && event.text.includes("Lv.35"))).toBe(true);
  });

  it("scores target affixes above unrelated affixes for a chosen build", () => {
    const base = generateEquipment(30, 30, new GameRng(123));
    const critical = { ...base, affixes: [{ stat: "crit" as const, value: 200, percent: true }] };
    const defensive = { ...base, affixes: [{ stat: "counter" as const, value: 200, percent: true }] };
    expect(equipmentPlanScore(critical, "crit")).toBeGreaterThan(equipmentPlanScore(defensive, "crit"));
  });

  it("derives growth-goal progress from durable counters", () => {
    const save = createInitialSave(1000);
    save.counters.chestsOpened = 12;
    save.counters.stagesWon = 4;
    expect(goalProgress(save, "open-10")).toBe(12);
    expect(goalProgress(save, "stage-3")).toBe(4);
  });

  it("never returns a refine grade outside the advertised columns", () => {
    const rng = new GameRng(88);
    for (let index = 0; index < 5000; index += 1) {
      expect(rollWarSoulRefine(634, rng).grade).toBeGreaterThanOrEqual(1);
      expect(rollWarSoulRefine(634, rng).grade).toBeLessThanOrEqual(8);
    }
  });
});
