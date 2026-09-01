import { beforeEach, describe, expect, it } from "vitest";
import { ARTIFACT_MAX_LEVEL, EQUIPMENT_REFINE_MAX, calculatePlayerStats, calculatePower, createInitialSave, GameRng, beastComposeRate } from "./engine";
import { BEASTS } from "./config";
import { normalizeSave, useGameStore } from "./store";

function resetStore() {
  useGameStore.setState({ save: createInitialSave(123456), ready: true, notice: "" });
}

function beastBoardUnitCount() {
  return useGameStore.getState().save.collections.beastBoard.filter(Boolean).length;
}

describe("store progression contracts", () => {
  beforeEach(resetStore);

  it("keeps simulated recharges resource-only instead of skipping character levels", () => {
    const before = useGameStore.getState().save.player;
    useGameStore.getState().frenzyRecharge();
    const after = useGameStore.getState().save.player;
    expect(after.level).toBe(before.level);
    expect(after.exp).toBe(before.exp);
    expect(useGameStore.getState().save.resources.diamond).toBeGreaterThan(60_000);
  });

  it("applies first-double once when buying several diamond packs", () => {
    useGameStore.getState().purchase("diamond-68", 2);
    let save = useGameStore.getState().save;
    expect(save.resources.diamond).toBe(2_040);
    expect(save.totalSpent).toBe(136);
    expect(save.orders.at(-1)).toMatchObject({ productId: "diamond-68", quantity: 2, amountRmb: 136 });

    useGameStore.getState().purchase("diamond-68", 1);
    save = useGameStore.getState().save;
    expect(save.resources.diamond).toBe(2_720);
    expect(save.firstPurchaseProducts).toContain("diamond-68");
  });

  it("clamps deterministic shelf purchases to stock and charges the selected currency", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.diamond = 1_000;
    useGameStore.setState({ save });
    useGameStore.getState().buyShopGood("hot-whip", 3);
    expect(useGameStore.getState().save.resources.diamond).toBe(700);
    expect(useGameStore.getState().save.resources.mountWhip).toBe(15);

    useGameStore.getState().buyShopGood("hot-whip", 3);
    const after = useGameStore.getState().save;
    expect(after.resources.diamond).toBe(500);
    expect(after.resources.mountWhip).toBe(25);
    expect(after.commerce.shopPurchases["hot-whip"]).toBe(5);
  });

  it("gives one free store refresh before escalating the diamond cost", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.diamond = 100;
    save.commerce.shopPurchases["hot-whip"] = 2;
    useGameStore.setState({ save });

    useGameStore.getState().refreshCommerceShop();
    expect(useGameStore.getState().save.resources.diamond).toBe(100);
    expect(useGameStore.getState().save.commerce.shopPurchases).toEqual({});
    useGameStore.getState().refreshCommerceShop();
    expect(useGameStore.getState().save.resources.diamond).toBe(70);
    expect(useGameStore.getState().save.commerce.refreshes).toBe(2);
  });

  it("gates the premium growth track behind the fund while keeping the free track claimable", () => {
    useGameStore.getState().claimGrowthPack(1, false);
    expect(useGameStore.getState().save.commerce.claimedGrowthFree).toContain(1);
    useGameStore.getState().claimGrowthPack(1, true);
    expect(useGameStore.getState().save.commerce.claimedGrowthPremium).not.toContain(1);
    expect(useGameStore.getState().notice).toContain("成长基金");

    useGameStore.getState().purchase("fund-98");
    useGameStore.getState().claimGrowthPack(1, true);
    expect(useGameStore.getState().save.commerce.claimedGrowthPremium).toContain(1);
  });

  it("allows each owned commerce card to claim once per virtual day", () => {
    useGameStore.getState().purchase("monthly-30");
    useGameStore.getState().claimCommerceCard("monthly-30");
    const first = useGameStore.getState().save.resources.diamond;
    useGameStore.getState().claimCommerceCard("monthly-30");
    expect(useGameStore.getState().save.resources.diamond).toBe(first);
    useGameStore.getState().advanceDay();
    useGameStore.getState().claimCommerceCard("monthly-30");
    expect(useGameStore.getState().save.resources.diamond).toBe(first + 60);
  });

  it("enforces the original 5-purchase limit on the purple war-soul pack", () => {
    for (let index = 0; index < 6; index += 1) useGameStore.getState().buyWarSoulPack("soul-3", 68);
    const save = useGameStore.getState().save;
    expect(save.collections.warSouls["soul-3"].count).toBe(5);
    expect(save.commerce.packagePurchases["daily-68"]).toBe(5);
    expect(save.orders.filter((order) => order.productId === "daily-68")).toHaveLength(5);
    expect(useGameStore.getState().notice).toContain("限购 5/5");
  });

  it("turns battle-pet training into escalating permanent combat power", () => {
    useGameStore.getState().claimBattlePetPack();
    const before = useGameStore.getState().save;
    const powerBefore = calculatePower(calculatePlayerStats(before));
    useGameStore.getState().trainBattlePet(10);
    const after = useGameStore.getState().save;
    expect(after.growthSystems.battlePet.level).toBeGreaterThan(1);
    expect(after.resources.petSoulGrass).toBe(490);
    expect(calculatePower(calculatePlayerStats(after))).toBeGreaterThan(powerBefore);
    expect(useGameStore.getState().notice).toContain("战力 +");
  });

  it("keeps a battle-pet mutation pending until the player chooses old or new", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.petSoulGrass = 1;
    let seed = 1;
    while (new GameRng(seed).next() >= 0.1) seed += 1;
    save.rngSeed = seed;
    save.rngDraws = 0;
    const original = structuredClone(save.growthSystems.battlePet.skills[0]);
    useGameStore.setState({ save });

    useGameStore.getState().mutateBattlePet("grass", 0);
    const pending = useGameStore.getState().save.growthSystems.battlePet.pendingSkill;
    expect(pending).toBeDefined();
    expect(useGameStore.getState().save.growthSystems.battlePet.skills[0]).toEqual(original);
    expect(useGameStore.getState().save.resources.petSoulGrass).toBe(0);

    useGameStore.getState().resolveBattlePetMutation(true);
    expect(useGameStore.getState().save.growthSystems.battlePet.pendingSkill).toBeUndefined();
    expect(useGameStore.getState().save.growthSystems.battlePet.skills[0].id).not.toBe(original.id);
  });

  it("uses the official awakening result table and converts failures into luck", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.petSoulFruit = 2;
    let failureSeed = 1;
    while (new GameRng(failureSeed).next() >= 0.6) failureSeed += 1;
    save.rngSeed = failureSeed;
    save.rngDraws = 0;
    useGameStore.setState({ save });
    useGameStore.getState().awakenBattlePet();
    expect(useGameStore.getState().save.growthSystems.battlePet.awakeningQuality).toBe(1);
    expect(useGameStore.getState().save.growthSystems.battlePet.awakeningLuck).toBe(100);

    const retry = structuredClone(useGameStore.getState().save);
    let successSeed = 1;
    while (new GameRng(successSeed).next() < 0.6) successSeed += 1;
    retry.rngSeed = successSeed;
    retry.rngDraws = 0;
    useGameStore.setState({ save: retry });
    useGameStore.getState().awakenBattlePet();
    expect(useGameStore.getState().save.growthSystems.battlePet.awakeningQuality).toBeGreaterThan(1);
    expect(useGameStore.getState().save.growthSystems.battlePet.awakeningLuck).toBe(0);
  });

  it("reserves an equipped gem instead of consuming it as synthesis material", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.growthSystems.gems.inventory["red-1"] = 3;
    save.growthSystems.gems.sockets.weapon = { color: "red", level: 1 };
    useGameStore.setState({ save });
    useGameStore.getState().composeGem(1, "blue");
    expect(useGameStore.getState().save.growthSystems.gems.inventory["red-1"]).toBe(3);
    expect(useGameStore.getState().notice).toContain("需要 3 颗");
  });

  it("composes a war soul from different same-quality materials", () => {
    const save = structuredClone(useGameStore.getState().save);
    const soulState = { count: 1, stage: 1, level: 1, refine: 0, luck: 0, refineStar: 1, refineAttributes: [], refineEntries: [], previousRefineAttributes: [], pendingRefine: [] };
    save.collections.warSouls["soul-1"] = structuredClone(soulState);
    save.collections.warSouls["soul-2"] = { ...structuredClone(soulState), count: 4 };
    useGameStore.setState({ save });
    useGameStore.getState().composeWarSoul("soul-1", 4);
    const after = useGameStore.getState().save;
    expect(after.collections.warSouls["soul-1"].count).toBe(0);
    expect(after.collections.warSouls["soul-2"].count).toBe(0);
    expect(Object.entries(after.collections.warSouls).some(([id, state]) => ["soul-3", "soul-4"].includes(id) && state.count === 1)).toBe(true);
  });

  it("upgrades a rune with different same-level rune materials", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.growthSystems.runes.inventory["rune-life"] = 1;
    save.growthSystems.runes.inventory["rune-revive"] = 2;
    save.resources.runeShard = 100;
    useGameStore.setState({ save });
    useGameStore.getState().upgradeRune("rune-life");
    const runes = useGameStore.getState().save.growthSystems.runes;
    expect(runes.inventory["rune-life"]).toBe(1);
    expect(runes.inventory["rune-revive"]).toBe(0);
    expect(runes.levels["rune-life"]).toBe(2);
  });

  it("upgrades an artifact with different same-rank artifact materials", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.growthSystems.artifact.owned["artifact-ares"] = { count: 1, level: 1 };
    save.growthSystems.artifact.owned["artifact-feather"] = { count: 2, level: 1 };
    save.resources.gold = 100_000;
    useGameStore.setState({ save });
    useGameStore.getState().upgradeArtifact("artifact-ares");
    const artifacts = useGameStore.getState().save.growthSystems.artifact.owned;
    expect(artifacts["artifact-ares"]).toEqual({ count: 1, level: 2 });
    expect(artifacts["artifact-feather"].count).toBe(0);
  });

  it("turns war-soul levels into an exponential paid growth loop", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.warSouls["soul-1"] = { count: 1, stage: 1, level: 1, refine: 0, luck: 0, refineStar: 1, refineAttributes: [], refineEntries: [], previousRefineAttributes: [], pendingRefine: [] };
    save.collections.deployedWarSoul = "soul-1";
    save.resources.gold = 10_000_000;
    save.resources.soulCore = 10_000;
    useGameStore.setState({ save });
    const before = useGameStore.getState().save;
    const powerBefore = before.lastGrowth?.powerAfter || 0;
    useGameStore.getState().upgradeWarSoul("soul-1", 10);
    const after = useGameStore.getState().save;
    expect(after.collections.warSouls["soul-1"].level).toBe(11);
    expect(after.resources.gold).toBeLessThan(10_000_000);
    expect(after.lastGrowth?.powerAfter || 0).toBeGreaterThan(powerBefore);
  });

  it("fills the quality-specific war-soul refinement slots at a flat cost and preserves locked cards", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.warSouls["soul-1"] = { count: 1, stage: 1, level: 1, refine: 0, luck: 0, refineStar: 1, refineAttributes: [], refineEntries: [], previousRefineAttributes: [], pendingRefine: [] };
    save.collections.deployedWarSoul = "soul-1";
    save.resources.gold = 100_000;
    save.resources.soulCore = 100;
    useGameStore.setState({ save });

    useGameStore.getState().rollSoulRefine("soul-1", 10);
    const filled = useGameStore.getState().save.collections.warSouls["soul-1"];
    expect(filled.refineEntries).toHaveLength(5);
    expect(useGameStore.getState().save.resources.gold).toBe(40_000);
    expect(useGameStore.getState().save.resources.soulCore).toBe(100);
    expect(filled.refineEntries.every((entry) => entry.attributes.length === 4)).toBe(true);
    expect(filled.refine).toBe(filled.refineEntries.reduce((sum, entry) => sum + entry.soulPower, 0));
    expect(filled.refineAttributes).toHaveLength(20);

    const keepId = filled.refineEntries[0].id;
    useGameStore.getState().toggleSoulRefineLock("soul-1", keepId);
    useGameStore.getState().rollbackUnlockedSoulRefines("soul-1");
    const rolledBack = useGameStore.getState().save.collections.warSouls["soul-1"];
    expect(rolledBack.refineEntries).toHaveLength(1);
    expect(rolledBack.refineEntries[0]).toMatchObject({ id: keepId, locked: true });
    expect(rolledBack.refineAttributes).toHaveLength(4);
  });

  it("can batch all available same-level gems without consuming sockets", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.growthSystems.gems.inventory["red-1"] = 13;
    save.growthSystems.gems.sockets.weapon = { color: "red", level: 1 };
    useGameStore.setState({ save });
    useGameStore.getState().composeGem(1, "blue", "max");
    const after = useGameStore.getState().save;
    expect(after.growthSystems.gems.inventory["red-1"]).toBe(1);
    expect(after.counters.gemComposes).toBe(4);
  });

  it("hatches into the 16-slot board and merges two equal-tier pieces", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.beastEgg = 2;
    useGameStore.setState({ save });
    useGameStore.getState().hatchBeasts(1);
    expect(useGameStore.getState().save.collections.beastBoard.filter(Boolean)).toHaveLength(1);

    const mergeSave = structuredClone(useGameStore.getState().save);
    mergeSave.collections.beastBoard = Array.from({ length: 16 }, () => null);
    mergeSave.collections.beastBoard[0] = { id: "piece-a", definitionId: "beast-1", tier: 1 };
    mergeSave.collections.beastBoard[1] = { id: "piece-b", definitionId: "beast-1", tier: 1 };
    mergeSave.collections.beasts["beast-1"] = { count: 2, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    mergeSave.rngSeed = 1;
    mergeSave.rngDraws = 0;
    useGameStore.setState({ save: mergeSave });
    useGameStore.getState().mergeBeastSlots(0, 1);
    const after = useGameStore.getState().save;
    expect(after.collections.beastBoard[0]).toBeNull();
    expect(after.collections.beastBoard[1]?.tier).toBe(2);
    expect(after.counters.beastComposes).toBe(1);
  });

  it("merges different species across factions at every normal quality", () => {
    for (let sourceTier = 1; sourceTier <= 6; sourceTier += 1) {
      const source = BEASTS.find((beast) => beast.tier === sourceTier && beast.mergeEligible !== false);
      const target = BEASTS.find((beast) => beast.tier === sourceTier && beast.mergeEligible !== false && beast.faction !== source?.faction);
      expect(source, `tier ${sourceTier} needs a source`).toBeDefined();
      expect(target, `tier ${sourceTier} needs a cross-faction target`).toBeDefined();

      const save = createInitialSave(10_000 + sourceTier);
      const state = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
      save.collections.beastBoard = Array.from({ length: 16 }, () => null);
      save.collections.beastBoard[0] = { id: `source-${sourceTier}`, kind: "beast", definitionId: source!.id, tier: sourceTier };
      save.collections.beastBoard[1] = { id: `target-${sourceTier}`, kind: "beast", definitionId: target!.id, tier: sourceTier };
      save.collections.beasts = {
        [source!.id]: structuredClone(state),
        [target!.id]: structuredClone(state)
      };

      const rate = beastComposeRate(sourceTier + 1) / 10_000;
      let seed = 1;
      while (new GameRng(seed).next() >= rate) seed += 1;
      save.rngSeed = seed;
      save.rngDraws = 0;
      useGameStore.setState({ save, notice: "" });
      useGameStore.getState().mergeBeastSlots(0, 1);

      const result = useGameStore.getState().save.collections.beastBoard[1];
      expect(result?.kind).toBe("beast");
      expect(result?.tier).toBe(sourceTier + 1);
      expect(BEASTS.find((beast) => beast.id === result?.definitionId)?.mergeEligible).not.toBe(false);
      expect(useGameStore.getState().notice).toContain("跨种类同品质合成成功");
      expect(useGameStore.getState().notice).not.toContain("尚未配置");
    }
  });

  it("turns a failed board merge into experience spirits", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.beastBoard[0] = { id: "piece-a", definitionId: "beast-1", tier: 1 };
    save.collections.beastBoard[1] = { id: "piece-b", definitionId: "beast-20", tier: 1 };
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beasts["beast-20"] = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    let seed = 1;
    while (new GameRng(seed).next() < 0.9) seed += 1;
    save.rngSeed = seed;
    save.rngDraws = 0;
    useGameStore.setState({ save });
    useGameStore.getState().mergeBeastSlots(0, 1);
    const after = useGameStore.getState().save;
    expect(after.collections.beastBoard.filter(Boolean)).toHaveLength(1);
    expect(after.collections.beastBoard[1]).toMatchObject({ kind: "spirit", tier: 1, state: { level: 1 } });
    expect(after.resources.experienceSpirit).toBe(0);
    useGameStore.getState().decomposeBeastSlot(1);
    expect(useGameStore.getState().save.collections.beastBoard.filter(Boolean)).toHaveLength(1);
    expect(useGameStore.getState().save.resources.experienceSpirit).toBe(0);
    expect(useGameStore.getState().notice).toContain("不能分解");
  });

  it("preserves both beasts' accumulated ordinary experience on a failed merge", () => {
    const save = structuredClone(useGameStore.getState().save);
    const stateA = { level: 8, exp: 41, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 4, devourExp: 90 };
    const stateB = { level: 5, exp: 17, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 2, devourExp: 35 };
    save.collections.beastBoard[0] = { id: "trained-a", kind: "beast", definitionId: "beast-1", tier: 1, state: structuredClone(stateA) };
    save.collections.beastBoard[1] = { id: "trained-b", kind: "beast", definitionId: "beast-20", tier: 1, state: structuredClone(stateB) };
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, ...structuredClone(stateA) };
    save.collections.beasts["beast-20"] = { count: 1, discovered: true, ...structuredClone(stateB) };
    let seed = 1;
    while (new GameRng(seed).next() < 0.9) seed += 1;
    save.rngSeed = seed;
    save.rngDraws = 0;
    useGameStore.setState({ save });

    useGameStore.getState().mergeBeastSlots(0, 1);

    const spirit = useGameStore.getState().save.collections.beastBoard[1];
    expect(spirit).toMatchObject({ kind: "spirit", tier: 1 });
    expect(spirit?.state?.level).toBeGreaterThan(stateA.level);
    expect(spirit?.state?.devourLevel).toBe(0);
    expect(spirit?.state?.devourExp).toBe(0);
  });

  it("keeps same-quality experience spirits as independent board instances", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.beastBoard[0] = { id: "piece-a", definitionId: "beast-1", tier: 1 };
    save.collections.beastBoard[1] = { id: "piece-b", definitionId: "beast-20", tier: 1 };
    save.collections.beastBoard[2] = { id: "old-spirit", kind: "spirit", definitionId: "beast-2", tier: 1, state: { level: 4, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    save.collections.beasts["beast-2"] = { count: 1, discovered: true, level: 4, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beasts["beast-20"] = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    let seed = 1;
    while (new GameRng(seed).next() < 0.9) seed += 1;
    save.rngSeed = seed;
    save.rngDraws = 0;
    useGameStore.setState({ save });

    useGameStore.getState().mergeBeastSlots(0, 1);

    const spirits = useGameStore.getState().save.collections.beastBoard.filter((piece) => piece?.kind === "spirit");
    expect(spirits).toHaveLength(2);
    expect(useGameStore.getState().save.collections.beastBoard[1]).toMatchObject({ kind: "spirit", tier: 1, state: { level: 1 } });
    expect(useGameStore.getState().save.collections.beastBoard[2]).toMatchObject({ id: "old-spirit", state: { level: 4 } });
  });

  it("awards both a perfect experience spirit and one shard when a perfect merge fails", () => {
    const save = structuredClone(useGameStore.getState().save);
    const state = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beastBoard[0] = { id: "perfect-a", kind: "beast", definitionId: "beast-8", tier: 6 };
    save.collections.beastBoard[1] = { id: "perfect-b", kind: "beast", definitionId: "beast-36", tier: 6 };
    save.collections.beasts["beast-8"] = structuredClone(state);
    save.collections.beasts["beast-36"] = structuredClone(state);
    let seed = 1;
    while (new GameRng(seed).next() < 0.1) seed += 1;
    save.rngSeed = seed;
    save.rngDraws = 0;
    useGameStore.setState({ save });

    useGameStore.getState().mergeBeastSlots(0, 1);

    const after = useGameStore.getState().save;
    expect(after.collections.beastBoard[0]).toBeNull();
    expect(after.collections.beastBoard[1]).toMatchObject({ kind: "spirit", definitionId: "beast-7", tier: 6, state: { level: 1 } });
    expect(after.resources.beastExtraordinaryShard).toBe(1);
    expect(useGameStore.getState().notice).toContain("完美经验精灵 ×1、超凡魔兽碎片 ×1（1/5）");
  });

  it("synthesizes one base extraordinary beast from five shards", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.beastExtraordinaryShard = 5;
    save.collections.beastBoard = Array.from({ length: 16 }, () => null);
    useGameStore.setState({ save });

    useGameStore.getState().synthesizeExtraordinaryBeast();

    const after = useGameStore.getState().save;
    const piece = after.collections.beastBoard[0];
    const definition = BEASTS.find((beast) => beast.id === piece?.definitionId);
    expect(after.resources.beastExtraordinaryShard).toBe(0);
    expect(piece).toMatchObject({ kind: "beast", tier: 7 });
    expect(definition?.mergeEligible).not.toBe(false);
    expect(after.collections.beasts[piece!.definitionId]).toMatchObject({ count: 1, discovered: true });
    expect(useGameStore.getState().notice).toContain("消耗超凡魔兽碎片 ×5");
  });

  it("does not spend extraordinary shards when the unlocked stable is full", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.beastExtraordinaryShard = 5;
    save.collections.beastUnlockedSlots = 8;
    save.collections.beastBoard = Array.from({ length: 16 }, (_, index) => index < 8
      ? { id: `spirit-${index}`, kind: "spirit" as const, definitionId: "", tier: 1, amount: 1 }
      : null);
    useGameStore.setState({ save });

    useGameStore.getState().synthesizeExtraordinaryBeast();

    expect(useGameStore.getState().save.resources.beastExtraordinaryShard).toBe(5);
    expect(useGameStore.getState().notice).toContain("没有空位");
  });

  it("keeps extraordinary beasts separate and sends star growth to awakening", () => {
    const save = structuredClone(useGameStore.getState().save);
    const state = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beastBoard[0] = { id: "extra-a", kind: "beast", definitionId: "beast-10", tier: 7 };
    save.collections.beastBoard[1] = { id: "extra-b", kind: "beast", definitionId: "beast-11", tier: 7 };
    save.collections.beasts["beast-10"] = structuredClone(state);
    save.collections.beasts["beast-11"] = structuredClone(state);
    useGameStore.setState({ save });

    useGameStore.getState().mergeBeastSlots(0, 1);

    expect(useGameStore.getState().save.collections.beastBoard[0]).toMatchObject({ id: "extra-a", definitionId: "beast-10", tier: 7 });
    expect(useGameStore.getState().save.collections.beastBoard[1]).toMatchObject({ id: "extra-b", definitionId: "beast-11", tier: 7 });
    expect(useGameStore.getState().notice).toContain("觉醒升星页面");
  });

  it("feeds one independent experience spirit into ordinary level only", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beasts["beast-23"] = { count: 1, discovered: true, level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beastBoard[0] = { id: "spirit", kind: "spirit", definitionId: "beast-23", tier: 3, state: { level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    save.collections.beastBoard[1] = { id: "beast", kind: "beast", definitionId: "beast-1", tier: 1, state: { level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 3, devourExp: 45 } };
    useGameStore.setState({ save });
    useGameStore.getState().feedBeastSpirit(0, 1);
    const after = useGameStore.getState().save;
    expect(after.collections.beastBoard[0]).toBeNull();
    expect(after.collections.beastBoard[1]?.state?.level).toBeGreaterThan(1);
    expect(after.collections.beastBoard[1]?.state?.devourLevel).toBe(3);
    expect(after.collections.beastBoard[1]?.state?.devourExp).toBe(45);
  });

  it("converts a trained experience spirit's stored level experience when feeding", () => {
    const save = structuredClone(useGameStore.getState().save);
    const spiritState = { level: 6, exp: 25, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 };
    const beastState = { level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beastBoard[0] = { id: "trained-spirit", kind: "spirit", definitionId: "beast-2", tier: 1, state: structuredClone(spiritState) };
    save.collections.beastBoard[1] = { id: "feed-target", kind: "beast", definitionId: "beast-1", tier: 1, state: structuredClone(beastState) };
    save.collections.beasts["beast-2"] = { count: 1, discovered: true, ...structuredClone(spiritState) };
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, ...structuredClone(beastState) };
    useGameStore.setState({ save });

    useGameStore.getState().feedBeastSpirit(0, 1);

    expect(useGameStore.getState().save.collections.beastBoard[1]?.state?.level).toBeGreaterThan(6);
  });

  it("keeps three egg inventories separate and respects the unlocked stable", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.beastEggBlue = 2;
    save.collections.beastUnlockedSlots = 8;
    useGameStore.setState({ save });
    useGameStore.getState().hatchBeasts(1, "blue");
    const after = useGameStore.getState().save;
    expect(after.resources.beastEggBlue).toBe(1);
    expect(after.resources.beastEgg).toBe(6);
    expect(after.collections.beastBoard.filter(Boolean)).toHaveLength(1);
    expect(after.collections.beastBoard.find(Boolean)?.tier).toBe(2);
  });

  it("hatches purple eggs as rare and yellow eggs as epic", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.beastEggRare = 1;
    save.resources.beastEggGold = 1;
    useGameStore.setState({ save });

    useGameStore.getState().hatchBeasts(1, "rare");
    useGameStore.getState().hatchBeasts(1, "yellow");

    const tiers = useGameStore.getState().save.collections.beastBoard.filter(Boolean).map((piece) => piece!.tier).sort();
    expect(tiers).toEqual([3, 4]);
    expect(useGameStore.getState().save.resources.beastEggRare).toBe(0);
    expect(useGameStore.getState().save.resources.beastEggGold).toBe(0);
  });

  it("hatches the available partial stack and supports filling every open beast slot", () => {
    const partial = structuredClone(useGameStore.getState().save);
    partial.resources.beastEgg = 6;
    useGameStore.setState({ save: partial });
    useGameStore.getState().hatchBeasts(10);
    expect(beastBoardUnitCount()).toBe(6);
    expect(useGameStore.getState().save.resources.beastEgg).toBe(0);

    const batch = structuredClone(useGameStore.getState().save);
    batch.collections.beastBoard = Array.from({ length: 16 }, () => null);
    batch.collections.beasts = {};
    batch.collections.beastUnlockedSlots = 16;
    batch.resources.beastEgg = 100;
    useGameStore.setState({ save: batch });
    useGameStore.getState().hatchBeasts(100);
    expect(useGameStore.getState().save.collections.beastBoard.filter(Boolean)).toHaveLength(16);
    expect(beastBoardUnitCount()).toBe(100 - useGameStore.getState().save.resources.beastEgg);
    expect(useGameStore.getState().save.resources.beastEgg).toBeLessThanOrEqual(84);
  });

  it("adds assist power and removes a beast from assist when it deploys", () => {
    const save = structuredClone(useGameStore.getState().save);
    const state = { count: 1, discovered: true, level: 10, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beasts["beast-1"] = structuredClone(state);
    save.collections.beasts["beast-20"] = structuredClone(state);
    save.collections.deployedBeast = "beast-1";
    save.collections.deployedBeastPiece = { id: "deployed", kind: "beast", definitionId: "beast-1", tier: 1, state: { level: 10, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    save.collections.beastBoard[0] = { id: "assist", kind: "beast", definitionId: "beast-20", tier: 1, state: { level: 10, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    useGameStore.setState({ save });
    const before = calculatePower(calculatePlayerStats(save));
    useGameStore.getState().toggleBeastAssist("assist");
    const assisted = useGameStore.getState().save;
    expect(assisted.collections.beastAssists).toEqual(["beast-20"]);
    expect(calculatePower(calculatePlayerStats(assisted))).toBeGreaterThan(before);
    useGameStore.getState().deploy("beasts", "assist");
    expect(useGameStore.getState().save.collections.beastAssists).toEqual([]);
    expect(useGameStore.getState().save.collections.deployedBeastPiece?.id).toBe("assist");
    expect(useGameStore.getState().save.collections.beastBoard[0]?.id).toBe("deployed");
  });

  it("keeps current beast skills until the player accepts a wash result", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.gold = 1_000_000;
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beastBoard[0] = { id: "wash-target", kind: "beast", definitionId: "beast-1", tier: 1, state: { level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    useGameStore.setState({ save });
    useGameStore.getState().rerollBeastAffixes("wash-target");
    let beast = useGameStore.getState().save.collections.beastBoard[0]!.state!;
    expect(beast.affixes).toEqual([]);
    expect(beast.pendingAffixes).toHaveLength(4);
    useGameStore.getState().rerollBeastAffixes("wash-target");
    expect(useGameStore.getState().save.collections.beastBoard[0]!.state!.pendingAffixes).toHaveLength(4);
    useGameStore.getState().resolveBeastAffixes("wash-target", true);
    beast = useGameStore.getState().save.collections.beastBoard[0]!.state!;
    expect(beast.affixes).toHaveLength(4);
    expect(beast.pendingAffixes).toEqual([]);
  });

  it("keeps every passive slot upgrade level when washing and accepting new skills", () => {
    const save = structuredClone(useGameStore.getState().save);
    const affixes = [
      { id: "a", stat: "attack" as const, name: "攻击", value: 80, percent: false, grade: 1 as const, refineLevel: 6, refineCap: 20 },
      { id: "b", stat: "crit" as const, name: "暴击", value: 160, percent: true, grade: 2 as const, refineLevel: 2, refineCap: 20 },
      { id: "c", stat: "hp" as const, name: "生命", value: 900, percent: false, grade: 3 as const, refineLevel: 11, refineCap: 20 },
      { id: "d", stat: "dodge" as const, name: "闪避", value: 210, percent: true, grade: 2 as const, refineLevel: 20, refineCap: 20 }
    ];
    save.resources.gold = 1_000_000;
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, level: 1, exp: 0, stars: 0, affixes: structuredClone(affixes), pendingAffixes: [], devourLevel: 0 };
    save.collections.beastBoard[0] = { id: "wash-levels", kind: "beast", definitionId: "beast-1", tier: 1, state: { level: 1, exp: 0, stars: 0, affixes: structuredClone(affixes), pendingAffixes: [], devourLevel: 0 } };
    useGameStore.setState({ save });

    useGameStore.getState().rerollBeastAffixes("wash-levels");
    expect(useGameStore.getState().save.collections.beastBoard[0]?.state?.pendingAffixes.map((affix) => affix.refineLevel)).toEqual([6, 2, 11, 20]);
    useGameStore.getState().resolveBeastAffixes("wash-levels", true);
    expect(useGameStore.getState().save.collections.beastBoard[0]?.state?.affixes.map((affix) => affix.refineLevel)).toEqual([6, 2, 11, 20]);
  });

  it("spends eight magic crystals, not essence, on a random passive upgrade", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.beastMagicCrystal = 8;
    save.resources.beastEssence = 321;
    save.collections.beasts["beast-1"] = {
      count: 1, discovered: true, level: 1, exp: 0, stars: 0, pendingAffixes: [], devourLevel: 0,
      affixes: [{ id: "passive", stat: "attack", name: "攻击", value: 30, percent: false, grade: 1, refineLevel: 1, refineCap: 20 }]
    };
    save.collections.beastBoard[0] = { id: "skill-target", kind: "beast", definitionId: "beast-1", tier: 1, state: { level: 1, exp: 0, stars: 0, pendingAffixes: [], devourLevel: 0, affixes: [{ id: "passive", stat: "attack", name: "攻击", value: 30, percent: false, grade: 1, refineLevel: 1, refineCap: 20 }] } };
    useGameStore.setState({ save });

    useGameStore.getState().upgradeBeastSkill("skill-target");

    const after = useGameStore.getState().save;
    expect(after.resources.beastMagicCrystal).toBe(0);
    expect(after.resources.beastEssence).toBe(321);
    expect(after.collections.beastBoard[0]?.state?.affixes[0].refineLevel).toBe(2);
  });

  it("lets an experience spirit occupy the independent deploy and assist slots", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.beasts["beast-2"] = { count: 2, discovered: true, level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beastBoard[0] = { id: "spirit-a", kind: "spirit", definitionId: "beast-2", tier: 1, state: { level: 2, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    save.collections.beastBoard[1] = { id: "spirit-b", kind: "spirit", definitionId: "beast-2", tier: 1, state: { level: 3, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    useGameStore.setState({ save });

    useGameStore.getState().deploy("beasts", "spirit-a");
    expect(useGameStore.getState().save.collections.deployedBeastPiece?.id).toBe("spirit-a");
    expect(useGameStore.getState().save.collections.beastBoard[0]).toBeNull();
    useGameStore.getState().toggleBeastAssist("spirit-b");
    expect(useGameStore.getState().save.collections.beastAssistPieceIds).toEqual(["spirit-b"]);
  });

  it("keeps ordinary and devour levels separate for beast and essence devouring", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beastBoard[0] = { id: "beast", kind: "beast", definitionId: "beast-1", tier: 1, state: { level: 7, exp: 11, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    save.collections.beastBoard[1] = { id: "material", kind: "beast", definitionId: "beast-20", tier: 1, state: { level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    save.collections.beasts["beast-20"] = { count: 1, discovered: true, level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beastBoard[2] = { id: "spirit", kind: "spirit", definitionId: "beast-28", tier: 4, state: { level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    save.resources.beastEssence = 5;
    useGameStore.setState({ save });
    useGameStore.getState().devourBeastInstances("beast", ["material"]);
    useGameStore.getState().devourBeastEssence("beast", 5);
    const after = useGameStore.getState().save;
    expect(after.collections.beastBoard[1]).toBeNull();
    expect(after.collections.beastBoard[2]).toEqual(save.collections.beastBoard[2]);
    expect(after.resources.beastEssence).toBe(0);
    expect(after.collections.beastBoard[0]?.state?.level).toBe(7);
    expect(after.collections.beastBoard[0]?.state?.exp).toBe(11);
    expect(after.collections.beastBoard[0]?.state?.devourLevel).toBeGreaterThan(0);
  });

  it("rejects a manual merge when either beast is locked", () => {
    const save = structuredClone(useGameStore.getState().save);
    const state = { count: 1, discovered: true, level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beasts["beast-1"] = structuredClone(state);
    save.collections.beasts["beast-20"] = structuredClone(state);
    save.collections.beastBoard[0] = { id: "locked", kind: "beast", definitionId: "beast-1", tier: 1, protected: true };
    save.collections.beastBoard[1] = { id: "other", kind: "beast", definitionId: "beast-20", tier: 1 };
    useGameStore.setState({ save });
    useGameStore.getState().mergeBeastSlots(0, 1);
    expect(useGameStore.getState().save.collections.beastBoard[0]).toMatchObject({ id: "locked", protected: true });
    expect(useGameStore.getState().save.collections.beastBoard[1]).toMatchObject({ id: "other" });
    expect(useGameStore.getState().notice).toContain("已锁定");
  });

  it("ascends from level and devour requirements and increases deployed power", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, level: 50, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 2, stage: 1 };
    save.collections.beastBoard[0] = { id: "beast", kind: "beast", definitionId: "beast-1", tier: 1 };
    save.collections.deployedBeast = "beast-1";
    useGameStore.setState({ save });
    const before = calculatePower(calculatePlayerStats(save));
    useGameStore.getState().ascendBeast("beast-1");
    const after = useGameStore.getState().save;
    expect(after.collections.beasts["beast-1"].stage).toBe(2);
    expect(calculatePower(calculatePlayerStats(after))).toBeGreaterThan(before);
  });

  it("awakens extraordinary beasts at 100 percent, keeps passives and gates the next star behind +10", () => {
    const save = structuredClone(useGameStore.getState().save);
    const affixes = [{ id: "passive", stat: "attack" as const, name: "攻击", value: 10, percent: false }];
    const mainState = { level: 50, exp: 0, stars: 0, affixes, pendingAffixes: [], devourLevel: 3, devourExp: 0, stage: 2, enhanceLevel: 0 };
    save.collections.beasts["beast-10"] = { count: 1, discovered: true, ...structuredClone(mainState) };
    save.collections.beasts["beast-11"] = { count: 3, discovered: true, level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beastBoard[0] = { id: "extraordinary", kind: "beast", definitionId: "beast-10", tier: 7, state: structuredClone(mainState) };
    save.collections.beastBoard[1] = { id: "material-1", kind: "beast", definitionId: "beast-11", tier: 7, state: { level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    save.resources.beastAwakenStone = 77;
    useGameStore.setState({ save });
    useGameStore.getState().awakenBeast("extraordinary", ["material-1"]);
    expect(useGameStore.getState().save.collections.beastBoard[0]?.state?.stars).toBe(1);
    expect(useGameStore.getState().save.collections.beastBoard[1]).toBeNull();
    expect(useGameStore.getState().save.resources.beastAwakenStone).toBe(77);
    useGameStore.getState().awakenBeast("extraordinary", []);
    expect(useGameStore.getState().save.collections.beastBoard[0]?.state?.stars).toBe(1);
    expect(useGameStore.getState().notice).toContain("强化至 +10");
    const ready = structuredClone(useGameStore.getState().save);
    ready.collections.beastBoard[0]!.state!.enhanceLevel = 10;
    ready.collections.beasts["beast-10"].enhanceLevel = 10;
    ready.collections.beastBoard[1] = { id: "material-2", kind: "beast", definitionId: "beast-11", tier: 7, state: { level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    ready.collections.beastBoard[2] = { id: "material-3", kind: "beast", definitionId: "beast-11", tier: 7, state: { level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    useGameStore.setState({ save: ready });
    useGameStore.getState().awakenBeast("extraordinary", ["material-2", "material-3"]);
    const after = useGameStore.getState().save.collections.beastBoard[0]!.state!;
    expect(after.stars).toBe(2);
    expect(after.enhanceLevel).toBe(0);
    expect(after.stage).toBe(2);
    expect(after.affixes).toEqual(affixes);
    expect(useGameStore.getState().notice).toContain("100%");
  });

  it("raises a fully trained extraordinary beast to its recorded radiant counterpart", () => {
    const save = structuredClone(useGameStore.getState().save);
    const affixes = [{ id: "passive", stat: "attack" as const, name: "攻击", value: 18, percent: false }];
    save.collections.beasts["beast-10"] = { count: 1, discovered: true, level: 72, exp: 300, stars: 3, affixes, pendingAffixes: [], devourLevel: 4, stage: 3, enhanceLevel: 10 };
    save.collections.beasts["beast-11"] = { count: 3, discovered: true, level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.deployedBeast = "beast-10";
    save.collections.deployedBeastPiece = { id: "extraordinary", kind: "beast", definitionId: "beast-10", tier: 7, state: { level: 72, exp: 300, stars: 3, affixes, pendingAffixes: [], devourLevel: 4, devourExp: 0, stage: 3, enhanceLevel: 10 } };
    for (let index = 0; index < 3; index += 1) save.collections.beastBoard[index] = { id: `radiant-material-${index}`, kind: "beast", definitionId: "beast-11", tier: 7, state: { level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    save.resources.beastAwakenStone = 100;
    useGameStore.setState({ save });
    useGameStore.getState().awakenBeast("extraordinary", ["radiant-material-0", "radiant-material-1", "radiant-material-2"]);
    const after = useGameStore.getState().save;
    expect(after.collections.beastBoard[0]).toBeNull();
    expect(after.collections.deployedBeastPiece).toMatchObject({ id: "extraordinary", definitionId: "beast-13", tier: 8, state: { level: 72, devourLevel: 4, stage: 3, stars: 0, enhanceLevel: 0 } });
    expect(after.collections.deployedBeast).toBe("beast-13");
    expect(after.collections.beasts["beast-10"].count).toBe(0);
    expect(after.collections.beasts["beast-13"]).toMatchObject({ count: 1, level: 72, devourLevel: 4, stage: 3, stars: 0, enhanceLevel: 0 });
    expect(after.collections.beasts["beast-13"].affixes).toEqual(affixes);
    expect(after.resources.beastAwakenStone).toBe(100);
    expect(useGameStore.getState().notice).toContain("九霄雷神");
  });

  it("protects a failed strengthening attempt and supports rewind after an unprotected drop", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.beasts["beast-10"] = { count: 1, discovered: true, level: 50, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 3, enhanceLevel: 6 };
    save.collections.beastBoard[0] = { id: "extraordinary", kind: "beast", definitionId: "beast-10", tier: 7 };
    save.resources.beastEnhanceStone = 100;
    save.resources.beastProtectCharm = 1;
    save.resources.beastRewindStone = 100;
    let seed = 1;
    while (new GameRng(seed).next() < 0.48) seed += 1;
    save.rngSeed = seed;
    save.rngDraws = 0;
    useGameStore.setState({ save });
    useGameStore.getState().strengthenBeast("beast-10", false, true);
    expect(useGameStore.getState().save.collections.beasts["beast-10"].enhanceLevel).toBe(6);

    const retry = structuredClone(useGameStore.getState().save);
    retry.rngSeed = seed;
    retry.rngDraws = 0;
    useGameStore.setState({ save: retry });
    useGameStore.getState().strengthenBeast("beast-10", false, false);
    expect(useGameStore.getState().save.collections.beasts["beast-10"].enhanceLevel).toBeLessThan(6);
    expect(useGameStore.getState().save.collections.beasts["beast-10"].rewindAvailable).toBe(true);
    useGameStore.getState().rewindBeastStrength("beast-10");
    expect(useGameStore.getState().save.collections.beasts["beast-10"].enhanceLevel).toBe(6);
  });

  it("auto-merges board instances without touching the separate deployed slot", () => {
    const save = structuredClone(useGameStore.getState().save);
    const state = { count: 1, discovered: true, level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 };
    save.collections.beasts["beast-1"] = structuredClone(state);
    save.collections.beasts["beast-20"] = { ...structuredClone(state), count: 2 };
    save.collections.deployedBeast = "beast-1";
    save.collections.deployedBeastPiece = { id: "deployed", kind: "beast", definitionId: "beast-1", tier: 1, state: { level: 1, exp: 0, stars: 1, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    save.collections.beastBoard[1] = { id: "material-a", kind: "beast", definitionId: "beast-20", tier: 1 };
    save.collections.beastBoard[2] = { id: "material-b", kind: "beast", definitionId: "beast-20", tier: 1 };
    useGameStore.setState({ save });
    useGameStore.getState().autoMergeBeasts();
    const after = useGameStore.getState().save;
    expect(after.collections.deployedBeast).toBe("beast-1");
    expect(after.collections.deployedBeastPiece?.id).toBe("deployed");
    expect(after.collections.beastBoard.some((piece) => piece?.id === "deployed")).toBe(false);
  });

  it("never stacks independent board spirits or turns them into backpack currency", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.beastBoard[0] = { id: "spirit-a", kind: "spirit", definitionId: "beast-2", tier: 1, state: { level: 2, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    save.collections.beastBoard[1] = { id: "spirit-b", kind: "spirit", definitionId: "beast-2", tier: 1, state: { level: 3, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 } };
    useGameStore.setState({ save });
    useGameStore.getState().collectBeastSpirits();
    const after = useGameStore.getState().save;
    expect(after.collections.beastBoard.filter(Boolean)).toHaveLength(2);
    expect(after.collections.beastBoard[0]).toMatchObject({ id: "spirit-a", state: { level: 2 } });
    expect(after.collections.beastBoard[1]).toMatchObject({ id: "spirit-b", state: { level: 3 } });
    expect(after.resources.experienceSpirit).toBe(0);
  });

  it("moves one exact instance into the altar and back to a chosen empty slot", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, level: 12, exp: 34, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 2 };
    save.collections.beastBoard[3] = { id: "exact-instance", kind: "beast", definitionId: "beast-1", tier: 1, state: { level: 12, exp: 34, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 2 } };
    useGameStore.setState({ save });

    useGameStore.getState().deployBeastFromSlot(3);
    expect(useGameStore.getState().save.collections.beastBoard[3]).toBeNull();
    expect(useGameStore.getState().save.collections.deployedBeastPiece).toMatchObject({ id: "exact-instance", state: { level: 12, devourLevel: 2 } });

    useGameStore.getState().returnDeployedBeastToSlot(7);
    expect(useGameStore.getState().save.collections.deployedBeastPiece).toBeUndefined();
    expect(useGameStore.getState().save.collections.beastBoard[7]).toMatchObject({ id: "exact-instance", state: { level: 12, devourLevel: 2 } });
  });

  it("gives duplicate soul cards both an ascension path and a recycling loop", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.collections.soulCards["card-1-1"] = { count: 12, level: 1, stage: 1 };
    useGameStore.setState({ save });
    useGameStore.getState().ascendSoulCard("card-1-1");
    expect(useGameStore.getState().save.collections.soulCards["card-1-1"]).toMatchObject({ count: 10, stage: 2 });
    useGameStore.getState().decomposeSoulCardDuplicates("card-1-1");
    expect(useGameStore.getState().save.resources.soulCardDust).toBe(135);
    useGameStore.getState().exchangeSoulCardDust(1);
    useGameStore.getState().upgradeSoulCard("card-1-1", 1);
    const after = useGameStore.getState().save;
    expect(after.resources.soulCardTicket).toBe(1);
    expect(after.collections.soulCards["card-1-1"].level).toBe(2);
    expect(after.collections.soulCards["card-1-1"].count).toBe(1);
  });

  it("keeps the first hunted item as a power codex and sells only duplicates", () => {
    const save = structuredClone(useGameStore.getState().save);
    const baseline = calculatePower(calculatePlayerStats(save));
    save.hunting["hunt-1"] = 21;
    useGameStore.setState({ save });
    expect(calculatePower(calculatePlayerStats(save))).toBeGreaterThan(baseline);
    useGameStore.getState().sellHuntDuplicates();
    expect(useGameStore.getState().save.hunting["hunt-1"]).toBe(1);
    expect(useGameStore.getState().save.resources.huntingCoin).toBeGreaterThanOrEqual(100);
    useGameStore.getState().exchangeHuntingCoins("materials");
    expect(useGameStore.getState().save.resources.beastEssence).toBeGreaterThan(0);
  });

  it("can equip the strongest available gems and remove them in one action", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.growthSystems.gems.inventory["red-8"] = 1;
    save.growthSystems.gems.inventory["blue-7"] = 2;
    useGameStore.setState({ save });
    useGameStore.getState().autoSocketGems();
    expect(Object.keys(useGameStore.getState().save.growthSystems.gems.sockets)).toHaveLength(3);
    useGameStore.getState().removeAllGems();
    expect(useGameStore.getState().save.growthSystems.gems.sockets).toEqual({});
  });

  it("switches a turntable pool without silently spending the free spin", () => {
    useGameStore.getState().selectTurntablePool(2);
    const table = useGameStore.getState().save.growthSystems.turntable;
    expect(table.pool).toBe(2);
    expect(table.spinsToday).toBe(0);
    expect(table.remaining).toHaveLength(9);
  });

  it("clears the remaining turntable pool in one paid batch after the free spin", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.diamond = 1_000;
    useGameStore.setState({ save });

    useGameStore.getState().spinAllTurntable(1);

    const after = useGameStore.getState();
    expect(after.save.growthSystems.turntable.spinsToday).toBe(9);
    expect(after.save.growthSystems.turntable.remaining).toHaveLength(0);
    expect(after.save.resources.diamond).toBe(760);
    expect(after.save.counters.turntableSpins).toBe(9);
    expect(after.notice).toContain("9 项奖励");
  });

  it("turns activity drops into deterministic progression materials", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.eggHammer = 1;
    save.resources.treasuryKey = 1;
    save.resources.goldenSnakeToken = 3;
    useGameStore.setState({ save });
    useGameStore.getState().redeemEvent("hammer", 1);
    useGameStore.getState().redeemEvent("treasury", 2);
    useGameStore.getState().redeemEvent("golden", 2);
    const after = useGameStore.getState().save;
    expect(after.resources.eggHammer).toBe(0);
    expect(after.resources.treasuryKey).toBe(0);
    expect(after.resources.goldenSnakeToken).toBe(0);
    expect(after.resources.beastEgg).toBeGreaterThan(0);
    expect(after.resources.gold).toBeGreaterThan(300);
    expect(after.resources.artifactOre).toBeGreaterThan(0);
    expect(after.resources.flagEssence).toBeGreaterThan(0);
  });

  it("keeps an existing mount deployed when the 80-slot stable trims old entries", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.growthSystems.mount.mounts = Array.from({ length: 80 }, (_, index) => ({
      id: `old-${index}`,
      definitionId: "mount-thunder",
      quality: 1 as const,
      level: 1,
      attributes: []
    }));
    save.growthSystems.mount.activeId = "old-0";
    save.resources.mountWhip = 10;
    useGameStore.setState({ save });
    useGameStore.getState().drawMount("advanced", 10);
    const stable = useGameStore.getState().save.growthSystems.mount;
    expect(stable.mounts).toHaveLength(80);
    expect(stable.mounts.some((mount) => mount.id === stable.activeId)).toBe(true);
    expect(useGameStore.getState().save.resources.food).toBeGreaterThan(save.resources.food);
  });

  it("recycles duplicate mounts into redraw and training resources", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.growthSystems.mount.mounts = [
      { id: "active", definitionId: "mount-thunder", quality: 1, level: 1, attributes: [] },
      { id: "duplicate-a", definitionId: "mount-thunder", quality: 1, level: 8, attributes: [] },
      { id: "duplicate-b", definitionId: "mount-thunder", quality: 1, level: 2, attributes: [] },
      { id: "unique", definitionId: "mount-avalanche", quality: 2, level: 1, attributes: [] }
    ];
    save.growthSystems.mount.activeId = "active";
    const before = { ...save.resources };
    useGameStore.setState({ save });
    useGameStore.getState().recycleDuplicateMounts();
    const after = useGameStore.getState().save;
    expect(after.growthSystems.mount.mounts.map((mount) => mount.id)).toEqual(["active", "unique"]);
    expect(after.growthSystems.mount.activeId).toBe("active");
    expect(after.resources.mountWhip).toBeGreaterThan(before.mountWhip);
    expect(after.resources.food).toBeGreaterThan(before.food);
    expect(useGameStore.getState().notice).toContain("遣散重复坐骑 2 只");
  });

  it("fills at most five real sockets per gem-color lane and supports deterministic exchange", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.growthSystems.gems.inventory["red-1"] = 7;
    save.resources.gold = 10_000;
    useGameStore.setState({ save });

    useGameStore.getState().autoSocketGems();
    const socketKeys = Object.keys(useGameStore.getState().save.growthSystems.gems.sockets);
    expect(socketKeys).toEqual(["red-0", "red-1", "red-2", "red-3", "red-4"]);

    useGameStore.getState().exchangeGem(1, "red", "blue");
    const after = useGameStore.getState().save;
    expect(after.growthSystems.gems.inventory["red-1"]).toBe(6);
    expect(after.growthSystems.gems.inventory["blue-1"]).toBe(1);
    expect(useGameStore.getState().notice).toContain("置换成功");
  });

  it("keeps four soul cards per role and persists three independent schemes", () => {
    const save = structuredClone(useGameStore.getState().save);
    const attackCards = ["card-1-1", "card-2-1", "card-3-1", "card-4-1", "card-5-1"];
    attackCards.forEach((id) => { save.collections.soulCards[id] = { count: 1, level: 1, stage: 1 }; });
    useGameStore.setState({ save });

    attackCards.forEach((id) => useGameStore.getState().deploy("soulCards", id));
    expect(useGameStore.getState().save.collections.equippedCards).toEqual(attackCards.slice(1));
    expect(useGameStore.getState().save.collections.soulCardSchemes[0]).toEqual(attackCards.slice(1));

    useGameStore.getState().selectSoulCardScheme(1);
    expect(useGameStore.getState().save.collections.equippedCards).toEqual([]);
    useGameStore.getState().deploy("soulCards", attackCards[0]);
    expect(useGameStore.getState().save.collections.soulCardSchemes[1]).toEqual([attackCards[0]]);

    useGameStore.getState().selectSoulCardScheme(0);
    expect(useGameStore.getState().save.collections.equippedCards).toEqual(attackCards.slice(1));
  });

  it("returns eagle feathers when epic-or-better equipment is sold", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.loot = [{
      id: "epic-weapon",
      slot: "weapon",
      level: 20,
      quality: 4,
      stats: { hp: 100, attack: 80, defense: 20, speed: 2 },
      affixes: [],
      score: 500,
      sellValue: 1_000
    }];
    const before = save.resources.eagleFeather;
    useGameStore.setState({ save });

    useGameStore.getState().sellLootItem("epic-weapon");

    expect(useGameStore.getState().save.resources.eagleFeather).toBe(before + 1);
    expect(useGameStore.getState().notice).toContain("鹰羽 +1");
  });

  it("unlocks one war-eagle skin and only grows the active skin through training", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.diamond = 1_000;
    save.resources.eagleFeather = 1_000_000;
    save.resources.gold = 1_000_000_000;
    useGameStore.setState({ save });

    useGameStore.getState().selectWarEagleSkin("dodge");
    const unlocked = useGameStore.getState().save;
    expect(unlocked.resources.diamond).toBe(700);
    expect(unlocked.growthSystems.warEagle.activeSkin).toBe("dodge");
    expect(unlocked.growthSystems.warEagle.levels.dodge).toBe(1);
    const powerBefore = calculatePower(calculatePlayerStats(unlocked));

    useGameStore.getState().upgradeWarEagle(10);
    const trained = useGameStore.getState().save;
    expect(trained.growthSystems.warEagle.levels.dodge).toBe(11);
    expect(trained.growthSystems.warEagle.levels.crit).toBe(1);
    expect(calculatePower(calculatePlayerStats(trained))).toBeGreaterThan(powerBefore);
  });

  it("does not let free resources bypass equipment-refine and artifact caps", () => {
    const save = structuredClone(useGameStore.getState().save);
    save.resources.gold = Number.MAX_SAFE_INTEGER;
    save.equipped.weapon = {
      id: "cap-weapon", slot: "weapon", level: 100, quality: 7,
      stats: { hp: 10_000, attack: 2_000, defense: 800, speed: 100 }, affixes: [], score: 1, sellValue: 1
    };
    save.gearRefines.weapon = EQUIPMENT_REFINE_MAX;
    save.growthSystems.artifact.owned["artifact-ares"] = { count: 1, level: ARTIFACT_MAX_LEVEL };
    save.growthSystems.artifact.owned["artifact-feather"] = { count: 20, level: ARTIFACT_MAX_LEVEL };
    useGameStore.setState({ save });

    useGameStore.getState().refineEquipment("weapon");
    expect(useGameStore.getState().save.gearRefines.weapon).toBe(EQUIPMENT_REFINE_MAX);
    expect(useGameStore.getState().notice).toContain("达到");

    useGameStore.getState().upgradeArtifact("artifact-ares");
    expect(useGameStore.getState().save.growthSystems.artifact.owned["artifact-ares"].level).toBe(ARTIFACT_MAX_LEVEL);
    expect(useGameStore.getState().notice).toContain("最高");
  });

  it("clamps legacy over-cap growth values while preserving the save", () => {
    const save = createInitialSave(24680);
    save.gearRefines.weapon = 999;
    save.growthSystems.battlePet.level = 999;
    save.growthSystems.warEagle.levels.crit = 999;
    save.growthSystems.mount.mounts = [{ id: "legacy-mount", definitionId: "mount-cloud", quality: 4, level: 999, attributes: [] }];
    save.growthSystems.runes.levels["rune-life"] = 999;
    save.growthSystems.gems.sockets["red-0"] = { color: "red", level: 999 };
    save.growthSystems.artifact.owned["artifact-ares"] = { count: 1, level: 999 };
    save.collections.soulCards["card-1-1"] = { count: 1, level: 999, stage: 999 };
    save.collections.beasts["beast-1"] = { count: 1, discovered: true, level: 999, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 999, stage: 999, enhanceLevel: 999 };
    save.collections.beastBoard[0] = { id: "legacy-beast", definitionId: "beast-1", tier: 1, state: { level: 999, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 999, stage: 999, enhanceLevel: 999 } };

    const normalized = normalizeSave(save);

    expect(normalized.gearRefines.weapon).toBe(EQUIPMENT_REFINE_MAX);
    expect(normalized.growthSystems.battlePet.level).toBe(200);
    expect(normalized.growthSystems.warEagle.levels.crit).toBe(80);
    expect(normalized.growthSystems.mount.mounts[0].level).toBe(80);
    expect(normalized.growthSystems.runes.levels["rune-life"]).toBe(20);
    expect(normalized.growthSystems.gems.sockets["red-0"]?.level).toBe(8);
    expect(normalized.growthSystems.artifact.owned["artifact-ares"].level).toBe(ARTIFACT_MAX_LEVEL);
    expect(normalized.collections.soulCards["card-1-1"]).toMatchObject({ level: 60, stage: 6 });
    expect(normalized.collections.beasts["beast-1"]).toMatchObject({ level: 100, devourLevel: 20, stage: 10, enhanceLevel: 10 });
    expect(normalized.collections.beastBoard[0]?.state).toMatchObject({ level: 100, devourLevel: 20, stage: 10, enhanceLevel: 10 });
  });
});
