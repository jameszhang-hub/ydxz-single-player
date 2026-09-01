import { create } from "zustand";
import {
  ARTIFACTS, BEASTS, BEAST_EGG_TYPES, BEAST_EVOLUTIONS, BEAST_EXPERIENCE_SPIRIT_BY_TIER, BEAST_MAGIC_CRYSTAL_RATES,
  BEAST_QUALITIES, BUILD_PLANS, GEM_BASE_VALUES, GEM_COLORS, GROWTH_GOALS, GROWTH_PACK_LEVELS, HUNTING_POOL,
  MOUNTS, QUALITIES, RECHARGE_PRODUCTS, RECHARGE_PRODUCT_LIMITS, RESOURCE_META, RUNES, SHOP_GOODS, SLOTS, SOUL_CARDS, SOUL_CARD_SET_STATS, SYSTEM_UPGRADES,
  TURNTABLE_POOLS, VIP_THRESHOLDS, WAR_EAGLE_SKINS, WAR_SOULS, WAR_SOUL_QUALITIES
} from "./config";
import { clearSave, loadSave, writeSave } from "./db";
import { TRIAL_META, trialMonsterAt, trialStageLabel } from "./trial";
import {
  ARTIFACT_MAX_LEVEL, BATTLE_PET_AWAKEN_QUALITY_NAMES, BATTLE_PET_MUTATION_QUALITY_NAMES, EQUIPMENT_REFINE_MAX, GameRng, arenaEnemyStats, arenaStageForLevel, artifactForgeCost, artifactForgeWeights, artifactMaterialCount, battleFlagRequiredExp, battleFlagSuccessRate,
  battlePetAwakenRates, battlePetExpForLevel, battlePetMutationRates,
  battleLoadoutFromSave, beastAwakenMaterialCount, beastComposeRate, beastRerollCost, calculatePlayerStats, calculatePower,
  chestUpgradeCost, chestUpgradeRequirement, createGrowthSystems, createInitialSave, equipmentDecomposeExp, equipmentPlanScore, equipmentRefineCost,
  beastExpForLevel, beastSpiritExp, expForLevel, gemKey, generateEquipment, generateNpcs, generateTerritoryOffers, generateWarSoulRefineEntry,
  goalProgress, grantPlayerExp, hunterExpForLevel, mountUpgradeCost, progressionRewardMultiplier, rebalanceEquipment, rollBattleFlagExp, rollBeastAffixes,
  rollMountAttribute, rollMountQuality, rollRuneDrawItem, runeMaterialCount, runeUpgradeCost, runBattle, stageEnemy, stageRewardScale,
  regradeWarSoulRefineEntry, soulCardUpgradeCost, vipLevel, WAR_SOUL_REFINE_SLOTS, WAR_SOUL_REFINE_QUALITY_NAMES, WAR_SOUL_STAGE_THRESHOLDS,
  WAR_SOUL_STAR_POWER, warSoulComposeRate, warSoulMaterialCount, warSoulRefineCost, warSoulRefinePower,
  warSoulRefineSlotCap,
  warEagleUpgradeCost, warSoulReplacementMaterialCount, warSoulStageFromPower, warSoulUpgradeCost
} from "./engine";
import type {
  AutomationSettings, BattlePetMutationQuality, BattlePetSkillState, BattlePetSkillStat, BeastBoardPiece, BeastDefinition, BeastEggKind, BeastInstanceState, BeastState, BuildPlanId, BuildStat, CollectionDefinition, GameSaveV1, GemColor,
  GearSlot, MountInstance, RechargeProduct, ResourceId, WarSoulRefineEntry, WarSoulState
} from "./types";

type CollectionKind = "warSouls" | "beasts" | "soulCards";

interface GameStore {
  save: GameSaveV1;
  ready: boolean;
  notice: string;
  hydrate: () => Promise<void>;
  clearNotice: () => void;
  purchase: (productId: string, quantity?: number) => void;
  frenzyRecharge: () => void;
  buyShopGood: (goodId: string, quantity: number) => void;
  refreshCommerceShop: () => void;
  claimGrowthPack: (level: number, premium: boolean) => void;
  claimCommerceCard: (productId: "monthly-30" | "lifetime-68") => void;
  claimVip: (level: number) => void;
  claimAllVip: () => void;
  buyChestTickets: () => void;
  openChest: (count: number) => void;
  autoChestTick: () => void;
  equipBest: () => void;
  equipLootItem: (itemId: string) => void;
  sellLootItem: (itemId: string) => void;
  refineEquipment: (slot: GearSlot) => void;
  optimizeBuild: () => void;
  sellLoot: () => void;
  upgradeChest: () => void;
  setBuildPlan: (id: BuildPlanId) => void;
  setAutomation: (patch: Partial<AutomationSettings>) => void;
  drawCollection: (kind: CollectionKind, count: number) => void;
  upgradeSoulCard: (id: string, count: 1 | 10) => void;
  ascendSoulCard: (id: string) => void;
  decomposeSoulCardDuplicates: (id?: string) => void;
  exchangeSoulCardDust: (count: 1 | 10) => void;
  selectSoulCardScheme: (index: number) => void;
  hunt: (count: number) => void;
  sellHuntDuplicates: () => void;
  exchangeHuntingCoins: (kind: "stamina" | "materials") => void;
  deploy: (kind: CollectionKind, id: string) => void;
  compose: (kind: "warSouls" | "beasts", id: string) => void;
  refineSoul: (id: string) => void;
  buyWarSoulPack: (soulId: string, amountRmb: 68 | 198 | 648) => void;
  upgradeWarSoul: (id: string, count: 1 | 10) => void;
  composeWarSoul: (id: string, subSoulCount: number) => void;
  rollSoulRefine: (id: string, count?: 1 | 10) => void;
  toggleSoulRefineLock: (id: string, entryId: string) => void;
  rollbackSoulAffix: (id: string, entryId: string) => void;
  rollbackUnlockedSoulRefines: (id: string) => void;
  replaceWarSoul: (id: string) => void;
  buyBeastEggs: (count: number, kind?: BeastEggKind) => void;
  hatchBeasts: (count: 1 | 10 | 100, kind?: BeastEggKind) => void;
  moveBeastSlot: (sourceIndex: number, targetIndex: number) => void;
  deployBeastFromSlot: (sourceIndex: number) => void;
  returnDeployedBeastToSlot: (targetIndex: number) => void;
  mergeBeastSlots: (sourceIndex: number, targetIndex: number) => void;
  feedBeastSpirit: (sourceIndex: number, targetIndex: number) => void;
  autoMergeBeasts: () => void;
  organizeBeastBoard: () => void;
  toggleBeastPieceLock: (index: number) => void;
  claimBeastSandboxPack: () => void;
  synthesizeExtraordinaryBeast: () => void;
  composeBeast: (id: string, attempts?: 1 | 10) => void;
  levelBeast: (id: string, count: 1 | 10) => void;
  rerollBeastAffixes: (id: string) => void;
  resolveBeastAffixes: (id: string, accept: boolean) => void;
  upgradeBeastSkill: (id: string) => void;
  devourBeast: (id: string, count?: number) => void;
  devourBeastInstances: (id: string, materialPieceIds: string[]) => void;
  devourBeastEssence: (id: string, amount: number) => void;
  ascendBeast: (id: string) => void;
  decomposeBeastSlot: (index: number) => void;
  collectBeastSpirits: () => void;
  toggleBeastAssist: (id: string) => void;
  unlockBeastSlots: () => void;
  awakenBeast: (id: string, materialPieceIds: string[]) => void;
  strengthenBeast: (id: string, useBoost?: boolean, useProtect?: boolean) => void;
  rewindBeastStrength: (id: string) => void;
  fastForwardBeastEgg: () => void;
  claimBattlePetPack: () => void;
  trainBattlePet: (count: 1 | 10) => void;
  mutateBattlePet: (material: "grass" | "flower" | "fruit", slot: number) => void;
  resolveBattlePetMutation: (accept: boolean) => void;
  awakenBattlePet: () => void;
  drawMount: (mode: "normal" | "advanced", count: 1 | 10) => void;
  selectMount: (id: string) => void;
  upgradeMount: (id: string, count: 1 | 10) => void;
  recycleDuplicateMounts: () => void;
  selectWarEagleSkin: (stat: BuildStat) => void;
  upgradeWarEagle: (count: 1 | 10) => void;
  drawRunes: (count: 1 | 10) => void;
  equipRune: (id: string) => void;
  upgradeRune: (id: string) => void;
  buyGems: (count: 1 | 10) => void;
  composeGem: (level: number, targetColor: GemColor, mode?: "single" | "max") => void;
  socketGem: (slot: string, color: GemColor, level: number) => void;
  removeGem: (slot: string) => void;
  autoSocketGems: () => void;
  removeAllGems: () => void;
  exchangeGem: (level: number, fromColor: GemColor, targetColor: GemColor) => void;
  forgeArtifacts: (count: 1 | 10) => void;
  equipArtifact: (id: string) => void;
  upgradeArtifact: (id: string) => void;
  trainFlag: (count: 1 | 10) => void;
  setFlagStat: (stat: BuildStat) => void;
  pullTerritory: (offerId: string) => void;
  refreshTerritory: () => void;
  selectTurntablePool: (pool: 1 | 2) => void;
  spinTurntable: (pool: 1 | 2) => void;
  spinAllTurntable: (pool: 1 | 2) => void;
  redeemEvent: (event: "hammer" | "treasury" | "golden", choice: 1 | 2) => void;
  upgradeSystem: (id: string) => void;
  challengeStage: () => void;
  autoStageTick: () => void;
  challengeNpc: (npcId: string) => void;
  challengeGuildBoss: () => void;
  rewardTwinTower: () => void;
  guildDonate: () => void;
  guildShopBuy: () => void;
  claimActivity: (id: string) => void;
  claimAllActivities: () => void;
  claimGoal: (id: string) => void;
  advanceDay: () => void;
  reset: () => Promise<void>;
}

let persistQueue = Promise.resolve();
function persist(save: GameSaveV1) {
  persistQueue = persistQueue.then(() => writeSave(save)).catch(() => undefined);
}

function addRewards(save: GameSaveV1, rewards: Partial<Record<ResourceId, number>>) {
  Object.entries(rewards).forEach(([id, amount]) => {
    save.resources[id as ResourceId] += Number(amount || 0);
  });
}

function rollTurntableReward(save: GameSaveV1, pool: 1 | 2, rng: GameRng) {
  const turntable = save.growthSystems.turntable;
  const poolItems = TURNTABLE_POOLS[pool - 1];
  const weights = turntable.remaining.map((index) => poolItems[index].rate);
  let roll = rng.next() * weights.reduce((sum, value) => sum + value, 0);
  let position = weights.length - 1;
  for (let index = 0; index < weights.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) { position = index; break; }
  }
  const itemIndex = turntable.remaining[position];
  const item = poolItems[itemIndex];
  addRewards(save, item.reward);
  turntable.remaining.splice(position, 1);
  turntable.spinsToday += 1;
  turntable.lastReward = item.name;
  save.counters.turntableSpins += 1;
  return item.name;
}

function progressionRewardScale(save: GameSaveV1) {
  return progressionRewardMultiplier(save.player.level, save.day);
}

function addScaledRewards(save: GameSaveV1, rewards: Partial<Record<ResourceId, number>>) {
  const scale = progressionRewardScale(save);
  addRewards(save, Object.fromEntries(Object.entries(rewards).map(([id, amount]) => [id, Math.max(1, Math.round(Number(amount || 0) * scale))])));
}

function rollChestExtraDrops(save: GameSaveV1, rng: GameRng, count: number) {
  if (save.eventDrops.day !== save.day) save.eventDrops = { day: save.day, eggHammers: 0, treasuryKeys: 0 };
  for (let index = 0; index < count; index += 1) {
    if (rng.next() < 0.03) save.resources.challengeTicket += 1;
    if (save.eventDrops.eggHammers < 3 && rng.next() < 0.01) {
      save.resources.eggHammer += 1;
      save.eventDrops.eggHammers += 1;
    }
    if (save.eventDrops.treasuryKeys < 2 && rng.next() < 0.01) {
      save.resources.treasuryKey += 1;
      save.eventDrops.treasuryKeys += 1;
    }
    if (rng.next() < 0.01) save.resources.goldenSnakeToken += 1;
  }
}

function rollArenaExtraDrops(save: GameSaveV1, rng: GameRng) {
  if (save.eventDrops.day !== save.day) save.eventDrops = { day: save.day, eggHammers: 0, treasuryKeys: 0 };
  if (save.eventDrops.treasuryKeys < 2 && rng.next() < 0.3) {
    save.resources.treasuryKey += 1;
    save.eventDrops.treasuryKeys += 1;
  }
  if (rng.next() < 0.35) save.resources.goldenSnakeToken += 1;
}

function soulCardRoleKey(id: string) {
  return id.split("-").at(-1) || "";
}

function normalizeSoulCardLoadout(ids: string[]) {
  const seen = new Set<string>();
  const roleCounts: Record<string, number> = {};
  return ids.filter((id) => {
    if (seen.has(id)) return false;
    const role = soulCardRoleKey(id);
    if ((roleCounts[role] || 0) >= 4) return false;
    seen.add(id);
    roleCounts[role] = (roleCounts[role] || 0) + 1;
    return true;
  }).slice(0, 12);
}

export function normalizeSave(save: GameSaveV1) {
  if (!save.fidelityUpgradeV5) return createInitialSave(save.createdAt || Date.now());
  const defaults = createInitialSave(save.createdAt || Date.now());
  save.resources = { ...defaults.resources, ...(save.resources || {}) };
  if (save.resources.experienceSpirit > 0) {
    save.resources.beastEssence += save.resources.experienceSpirit * 2;
    save.resources.experienceSpirit = 0;
  }
  save.hunting ||= {};
  save.hunterLevel ||= 1;
  save.hunterExp ||= 0;
  save.lastHunt ||= [];
  save.buildPlan ||= defaults.buildPlan;
  save.automation = { ...defaults.automation, ...(save.automation || {}) };
  save.commerce = { ...defaults.commerce, ...(save.commerce || {}) };
  save.commerce.shopPurchases ||= {};
  save.commerce.packagePurchases ||= {};
  save.commerce.claimedGrowthFree ||= [];
  save.commerce.claimedGrowthPremium ||= [];
  save.commerce.cardClaimDays ||= {};
  save.counters = { ...defaults.counters, ...(save.counters || {}) };
  save.claimedGoals ||= [];
  save.gearRefines ||= {};
  Object.entries(save.gearRefines).forEach(([slot, level]) => {
    save.gearRefines[slot as GearSlot] = Math.max(0, Math.min(EQUIPMENT_REFINE_MAX, Math.floor(Number(level) || 0)));
  });
  save.guild = { ...defaults.guild, ...(save.guild || {}) };
  save.eventDrops = { ...defaults.eventDrops, ...(save.eventDrops || {}) };
  save.collections ||= structuredClone(defaults.collections);
  save.collections.warSouls ||= {};
  save.collections.beasts ||= {};
  save.collections.soulCards ||= {};
  save.collections.equippedCards ||= [];
  save.collections.activeSoulCardScheme = Math.max(0, Math.min(2, save.collections.activeSoulCardScheme || 0));
  save.collections.soulCardSchemes ||= [save.collections.equippedCards, [], []];
  save.collections.soulCardSchemes = Array.from({ length: 3 }, (_, index) => normalizeSoulCardLoadout(save.collections.soulCardSchemes[index] || []));
  if (!save.collections.soulCardSchemes[save.collections.activeSoulCardScheme].length && save.collections.equippedCards.length) {
    save.collections.soulCardSchemes[save.collections.activeSoulCardScheme] = normalizeSoulCardLoadout(save.collections.equippedCards);
  }
  save.collections.equippedCards = [...save.collections.soulCardSchemes[save.collections.activeSoulCardScheme]];
  save.collections.beastAssists ||= [];
  save.collections.beastUnlockedSlots ||= 8;
  save.beastEggClock ||= { lastGeneratedAt: Date.now() };
  if (!save.fidelityUpgradeV12) {
    const elapsedDays = Math.max(0, save.day - 1);
    const seed = ((save.createdAt || Date.now()) ^ 0x9e3779b9) >>> 0;
    save.npcs = generateNpcs(seed).map((npc, index) => {
      const level = Math.min(150, npc.level + (index < 12 ? elapsedDays : 0));
      const oldBase = Math.max(1, calculatePower(stageEnemy(arenaStageForLevel(npc.level))));
      const personalityScale = npc.power / oldBase;
      return {
        ...npc,
        level,
        power: Math.round(calculatePower(stageEnemy(arenaStageForLevel(level))) * personalityScale * Math.pow(1.008, elapsedDays)),
        rating: npc.rating + elapsedDays * (index < 10 ? 12 : 3)
      };
    });
  }
  save.growthSystems ||= structuredClone(defaults.growthSystems);
  save.growthSystems.battlePet = { ...defaults.growthSystems.battlePet, ...(save.growthSystems.battlePet || {}) };
  save.growthSystems.battlePet.level = Math.max(1, Math.min(200, save.growthSystems.battlePet.level || 1));
  save.growthSystems.battlePet.awakeningQuality = Math.max(1, Math.min(6, save.growthSystems.battlePet.awakeningQuality || 1));
  save.growthSystems.battlePet.skills ||= structuredClone(defaults.growthSystems.battlePet.skills);
  save.growthSystems.warEagle = { ...defaults.growthSystems.warEagle, ...(save.growthSystems.warEagle || {}) };
  save.growthSystems.warEagle.unlockedSkins ||= ["crit"];
  save.growthSystems.warEagle.levels ||= { crit: 1 };
  Object.entries(save.growthSystems.warEagle.levels).forEach(([stat, level]) => {
    save.growthSystems.warEagle.levels[stat as BuildStat] = Math.max(1, Math.min(80, Math.floor(Number(level) || 1)));
  });
  save.growthSystems.mount = { ...defaults.growthSystems.mount, ...(save.growthSystems.mount || {}) };
  save.growthSystems.mount.mounts ||= [];
  save.growthSystems.mount.mounts.forEach((mount) => { mount.level = Math.max(1, Math.min(80, Math.floor(mount.level || 1))); });
  save.growthSystems.mount.lastDraw ||= [];
  save.growthSystems.runes = { ...defaults.growthSystems.runes, ...(save.growthSystems.runes || {}) };
  save.growthSystems.runes.inventory ||= {};
  save.growthSystems.runes.levels ||= {};
  Object.entries(save.growthSystems.runes.levels).forEach(([id, level]) => {
    save.growthSystems.runes.levels[id] = Math.max(1, Math.min(20, Math.floor(Number(level) || 1)));
  });
  save.growthSystems.runes.equipped ||= [];
  save.growthSystems.runes.lastDraw ||= [];
  save.growthSystems.gems = { ...defaults.growthSystems.gems, ...(save.growthSystems.gems || {}) };
  save.growthSystems.gems.inventory ||= {};
  save.growthSystems.gems.sockets ||= {};
  const migratedGemSockets: typeof save.growthSystems.gems.sockets = {};
  Object.entries(save.growthSystems.gems.sockets).forEach(([slot, socket]) => {
    if (!socket) return;
    if (/^(red|blue|orange|green)-[0-4]$/.test(slot) && !migratedGemSockets[slot]) {
      migratedGemSockets[slot] = { ...socket, level: Math.max(1, Math.min(8, Math.floor(socket.level || 1))) };
      return;
    }
    const openIndex = Array.from({ length: 5 }, (_, index) => index)
      .find((index) => !migratedGemSockets[`${socket.color}-${index}`]);
    if (openIndex !== undefined) migratedGemSockets[`${socket.color}-${openIndex}`] = { ...socket, level: Math.max(1, Math.min(8, Math.floor(socket.level || 1))) };
  });
  save.growthSystems.gems.sockets = migratedGemSockets;
  save.growthSystems.artifact = { ...defaults.growthSystems.artifact, ...(save.growthSystems.artifact || {}) };
  save.growthSystems.artifact.owned ||= {};
  Object.values(save.growthSystems.artifact.owned).forEach((artifact) => {
    artifact.level = Math.max(1, Math.min(ARTIFACT_MAX_LEVEL, Math.floor(artifact.level || 1)));
  });
  save.growthSystems.artifact.lastForge ||= [];
  save.growthSystems.flag = { ...defaults.growthSystems.flag, ...(save.growthSystems.flag || {}) };
  save.growthSystems.territory = { ...defaults.growthSystems.territory, ...(save.growthSystems.territory || {}) };
  save.growthSystems.territory.offers ||= [];
  save.growthSystems.turntable = { ...defaults.growthSystems.turntable, ...(save.growthSystems.turntable || {}) };
  save.growthSystems.turntable.remaining ||= [0, 1, 2, 3, 4, 5, 6, 7, 8];
  Object.entries(save.collections.warSouls).forEach(([id, current]) => {
    const migratedGrade = Math.max(1, Math.min(8, current.refineStar || current.refine || 1));
    const migratedEntries: WarSoulRefineEntry[] = current.refineEntries?.length
      ? current.refineEntries.map((entry, index) => ({
        id: entry.id || `migrated-refine-${id}-${index}`,
        starGrade: Math.max(1, Math.min(8, entry.starGrade || 1)),
        resultQuality: entry.resultQuality || WAR_SOUL_REFINE_QUALITY_NAMES[8 - Math.max(1, Math.min(8, entry.starGrade || 1))],
        soulPower: entry.soulPower || WAR_SOUL_STAR_POWER[Math.max(1, Math.min(8, entry.starGrade || 1))],
        attributes: entry.attributes || [],
        locked: Boolean(entry.locked)
      }))
      : current.refineAttributes?.length ? [{
        id: `migrated-refine-${id}-0`,
        starGrade: migratedGrade,
        resultQuality: WAR_SOUL_REFINE_QUALITY_NAMES[8 - migratedGrade],
        soulPower: WAR_SOUL_STAR_POWER[migratedGrade],
        attributes: current.refineAttributes.slice(0, 4),
        locked: false
      }] : [];
    const normalized = {
      count: current.count || 0,
      stage: Math.max(1, Math.min(WAR_SOUL_STAGE_THRESHOLDS.length - 1, current.stage || 1)),
      level: Math.max(1, Math.min(100, current.level || 1)),
      refine: current.refine || 0,
      luck: current.luck || 0,
      refineStar: current.refineStar || current.refine || 0,
      refineAttributes: current.refineAttributes || [],
      refineEntries: migratedEntries.slice(0, WAR_SOUL_REFINE_SLOTS),
      previousRefineAttributes: current.previousRefineAttributes || [],
      pendingRefine: []
    };
    syncWarSoulRefineState(normalized);
    save.collections.warSouls[id] = normalized;
  });
  const migrationRng = new GameRng(save.rngSeed, save.rngDraws);
  Object.entries(save.collections.soulCards).forEach(([id, current]) => {
    save.collections.soulCards[id] = {
      count: current.count || 0,
      level: Math.max(1, Math.min(60, current.level || 1)),
      stage: Math.max(1, Math.min(6, current.stage || 1))
    };
  });
  Object.entries(save.collections.beasts).forEach(([id, current]) => {
    const definition = BEASTS.find((item) => item.id === id);
    save.collections.beasts[id] = {
      count: current.count || 0,
      discovered: current.discovered ?? true,
      level: Math.max(1, Math.min(100, current.level || 1)),
      exp: current.exp || 0,
      stars: definition?.tier === 7 ? Math.min(3, current.stars ?? 0) : definition?.tier === 8 ? 0 : current.stars ?? 0,
      affixes: (current.affixes?.length ? current.affixes : definition ? rollBeastAffixes(definition.tier, migrationRng) : [])
        .map((affix) => ({ ...affix, refineLevel: Math.min(20, affix.refineLevel || 1), refineCap: 20 })),
      pendingAffixes: (current.pendingAffixes || []).map((affix) => ({ ...affix, refineLevel: Math.min(20, affix.refineLevel || 1), refineCap: 20 })),
      devourLevel: Math.max(0, Math.min(20, current.devourLevel || 0)),
      devourExp: current.devourExp || 0,
      stage: Math.max(1, Math.min(10, current.stage || 1)),
      enhanceLevel: Math.max(0, Math.min(10, current.enhanceLevel || 0)),
      enhanceBeforeAttempt: current.enhanceBeforeAttempt || 0,
      rewindAvailable: Boolean(current.rewindAvailable)
    };
  });
  const legacyStackedBoard = !save.fidelityUpgradeV11;
  const normalizedBoard: (BeastBoardPiece | null)[] = Array.from({ length: 16 }, () => null);
  const overflow: BeastBoardPiece[] = [];
  if (Array.isArray(save.collections.beastBoard)) {
    save.collections.beastBoard.slice(0, 16).forEach((piece, index) => {
      if (!piece) return;
      const definition = BEASTS.find((item) => item.id === piece.definitionId)
        || BEASTS.find((item) => item.id === BEAST_EXPERIENCE_SPIRIT_BY_TIER[piece.tier]);
      if (!definition) return;
      const copies = legacyStackedBoard ? Math.max(1, piece.amount || 1) : 1;
      for (let copy = 0; copy < copies; copy += 1) {
        const instance: BeastBoardPiece = {
          id: copy === 0 && piece.id ? piece.id : `beast-piece-${migrationRng.draws}-${migrationRng.int(1, 999999)}`,
          kind: definition.isExperienceSpirit ? "spirit" : "beast",
          definitionId: definition.id,
          tier: definition.tier,
          state: createBeastInstanceState(definition.tier, migrationRng, piece.state || legacyBeastInstance(save.collections.beasts[definition.id])),
          protected: Boolean(piece.protected)
        };
        if (copy === 0 && !normalizedBoard[index]) normalizedBoard[index] = instance;
        else overflow.push(instance);
      }
    });
  }
  overflow.forEach((piece) => {
    const empty = normalizedBoard.findIndex((entry) => !entry);
    if (empty >= 0) normalizedBoard[empty] = piece;
  });
  if (!normalizedBoard.some(Boolean) && legacyStackedBoard) {
    BEASTS.forEach((definition) => {
      const legacy = save.collections.beasts[definition.id];
      for (let copy = 0; copy < (legacy?.count || 0); copy += 1) {
        const empty = normalizedBoard.findIndex((entry) => !entry);
        if (empty < 0) break;
        const piece = createBeastPiece(definition, migrationRng, legacyBeastInstance(legacy));
        piece.kind = definition.isExperienceSpirit ? "spirit" : "beast";
        normalizedBoard[empty] = piece;
      }
    });
  }
  save.collections.beastBoard = normalizedBoard;

  if (save.collections.deployedBeastPiece) {
    const definition = BEASTS.find((item) => item.id === save.collections.deployedBeastPiece?.definitionId);
    if (definition) {
      save.collections.deployedBeastPiece = {
        ...save.collections.deployedBeastPiece,
        kind: definition.isExperienceSpirit ? "spirit" : "beast",
        tier: definition.tier,
        state: createBeastInstanceState(definition.tier, migrationRng, save.collections.deployedBeastPiece.state || legacyBeastInstance(save.collections.beasts[definition.id])),
        amount: undefined
      };
      save.collections.deployedBeast = definition.id;
    } else {
      save.collections.deployedBeastPiece = undefined;
      save.collections.deployedBeast = undefined;
    }
  } else if (save.collections.deployedBeast) {
    const deployedIndex = save.collections.beastBoard.findIndex((piece) => piece?.definitionId === save.collections.deployedBeast);
    if (deployedIndex >= 0) {
      save.collections.deployedBeastPiece = save.collections.beastBoard[deployedIndex] || undefined;
      save.collections.beastBoard[deployedIndex] = null;
    } else {
      const definition = BEASTS.find((item) => item.id === save.collections.deployedBeast);
      const legacy = definition ? save.collections.beasts[definition.id] : undefined;
      if (definition && legacy?.count) save.collections.deployedBeastPiece = createBeastPiece(definition, migrationRng, legacyBeastInstance(legacy));
      else save.collections.deployedBeast = undefined;
    }
  }

  const legacyAssistIds = save.collections.beastAssists || [];
  const assistPieceIds = save.collections.beastAssistPieceIds?.length
    ? save.collections.beastAssistPieceIds
    : legacyAssistIds.map((definitionId) => save.collections.beastBoard.find((piece) => piece?.definitionId === definitionId)?.id).filter(Boolean) as string[];
  save.collections.beastAssistPieceIds = assistPieceIds
    .filter((id, index, list) => list.indexOf(id) === index && save.collections.beastBoard.some((piece) => piece?.id === id))
    .slice(0, 3);
  save.collections.beastAssists = save.collections.beastAssistPieceIds
    .map((pieceId) => save.collections.beastBoard.find((piece) => piece?.id === pieceId)?.definitionId)
    .filter(Boolean) as string[];

  BEASTS.forEach((definition) => {
    const instances = save.collections.beastBoard.filter((piece) => piece?.definitionId === definition.id) as BeastBoardPiece[];
    if (save.collections.deployedBeastPiece?.definitionId === definition.id) instances.push(save.collections.deployedBeastPiece);
    const count = instances.length;
    const current = save.collections.beasts[definition.id];
    if (current) {
      current.count = count;
      current.discovered = current.discovered || count > 0;
      const strongest = instances.sort((left, right) => (right.state?.level || 1) - (left.state?.level || 1))[0]?.state;
      if (strongest) Object.assign(current, structuredClone(strongest));
    } else if (count > 0) save.collections.beasts[definition.id] = createBeastState(definition.tier, migrationRng, { count });
  });
  const lastOccupied = save.collections.beastBoard.reduce((last, piece, index) => piece ? index : last, -1);
  save.collections.beastUnlockedSlots = Math.max(8, Math.min(16, Math.max(save.collections.beastUnlockedSlots, lastOccupied + 1)));
  save.collections.equippedCards = normalizeSoulCardLoadout(save.collections.equippedCards);
  save.collections.soulCardSchemes[save.collections.activeSoulCardScheme] = [...save.collections.equippedCards];
  save.fidelityUpgradeV2 = true;
  save.fidelityUpgradeV3 = true;
  save.fidelityUpgradeV6 = true;
  save.fidelityUpgradeV7 = true;
  save.fidelityUpgradeV8 = true;
  save.fidelityUpgradeV9 = true;
  save.fidelityUpgradeV10 = true;
  save.fidelityUpgradeV11 = true;
  save.fidelityUpgradeV12 = true;
  if (!save.fidelityUpgradeV4) {
    Object.values(save.equipped).forEach((item) => { if (item) rebalanceEquipment(item); });
    save.loot.forEach(rebalanceEquipment);
    save.player.exp = Math.max(0, Math.min(save.player.exp || 0, expForLevel(save.player.level) - 1));
    save.fidelityUpgradeV4 = true;
  }
  save.rngSeed = migrationRng.state;
  save.rngDraws = migrationRng.draws;
  return save;
}

function createWarSoulState(overrides: Partial<WarSoulState> = {}): WarSoulState {
  const state = { count: 1, stage: 1, level: 1, refine: 0, luck: 0, refineStar: 1, refineAttributes: [], refineEntries: [], previousRefineAttributes: [], pendingRefine: [], ...overrides };
  syncWarSoulRefineState(state);
  return state;
}

function syncWarSoulRefineState(soul: WarSoulState) {
  soul.refineEntries = (soul.refineEntries || []).slice(0, WAR_SOUL_REFINE_SLOTS);
  soul.refineAttributes = soul.refineEntries.flatMap((entry) => structuredClone(entry.attributes));
  soul.refine = warSoulRefinePower(soul.refineEntries);
  soul.stage = warSoulStageFromPower(soul.refine);
  soul.refineStar = soul.stage;
  soul.previousRefineAttributes = [];
  soul.pendingRefine = [];
}

function createBeastState(tier: number, rng: GameRng, overrides: Partial<BeastState> = {}): BeastState {
  return {
    count: 1, discovered: true, level: 1, exp: 0, stars: 0,
    affixes: rollBeastAffixes(tier, rng), pendingAffixes: [], devourLevel: 0,
    devourExp: 0, stage: 1, enhanceLevel: 0, enhanceBeforeAttempt: 0,
    rewindAvailable: false, ...overrides
  };
}

function createBeastInstanceState(tier: number, rng: GameRng, inherited?: Partial<BeastInstanceState>): BeastInstanceState {
  return {
    level: Math.max(1, Math.min(100, inherited?.level || 1)),
    exp: inherited?.exp || 0,
    stars: tier === 7 ? Math.min(3, inherited?.stars ?? 0) : tier === 8 ? 0 : inherited?.stars ?? 0,
    affixes: inherited?.affixes?.length ? inherited.affixes.map((affix) => ({ ...affix, refineCap: 20 })) : rollBeastAffixes(tier, rng),
    pendingAffixes: inherited?.pendingAffixes?.map((affix) => ({ ...affix, refineCap: 20 })) || [],
    devourLevel: Math.max(0, Math.min(20, inherited?.devourLevel || 0)),
    devourExp: inherited?.devourExp || 0,
    stage: Math.max(1, Math.min(10, inherited?.stage || 1)),
    enhanceLevel: Math.max(0, Math.min(10, inherited?.enhanceLevel || 0)),
    enhanceBeforeAttempt: inherited?.enhanceBeforeAttempt || 0,
    rewindAvailable: Boolean(inherited?.rewindAvailable)
  };
}

function legacyBeastInstance(state: BeastState | undefined): Partial<BeastInstanceState> | undefined {
  if (!state) return undefined;
  return {
    level: state.level, exp: state.exp, stars: state.stars,
    affixes: state.affixes, pendingAffixes: state.pendingAffixes,
    devourLevel: state.devourLevel, devourExp: state.devourExp,
    stage: state.stage, enhanceLevel: state.enhanceLevel,
    enhanceBeforeAttempt: state.enhanceBeforeAttempt, rewindAvailable: state.rewindAvailable
  };
}

function createBeastPiece(definition: CollectionDefinition, rng: GameRng, inherited?: Partial<BeastInstanceState>): BeastBoardPiece {
  return {
    id: `beast-piece-${rng.draws}-${rng.int(1, 999999)}`,
    kind: "beast",
    definitionId: definition.id,
    tier: definition.tier,
    state: createBeastInstanceState(definition.tier, rng, inherited)
  };
}

function weightedBeast(pool: readonly { definitionId: string; weight: number }[], rng: GameRng) {
  const available = pool.map((entry) => ({ ...entry, definition: BEASTS.find((item) => item.id === entry.definitionId) }))
    .filter((entry): entry is typeof entry & { definition: BeastDefinition } => Boolean(entry.definition));
  const total = available.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (!available.length || total <= 0) return undefined;
  let roll = rng.next() * total;
  for (const entry of available) {
    roll -= Math.max(0, entry.weight);
    if (roll < 0) return entry.definition;
  }
  return available[available.length - 1].definition;
}

function spiritDefinition(tier: number) {
  return BEASTS.find((item) => item.id === BEAST_EXPERIENCE_SPIRIT_BY_TIER[tier]);
}

function isBeastPiece(piece: BeastBoardPiece | null | undefined): piece is BeastBoardPiece {
  return Boolean(piece && piece.kind !== "spirit" && piece.definitionId);
}

function locateBeastInstance(save: GameSaveV1, key: string) {
  const deployed = save.collections.deployedBeastPiece;
  if (deployed && (deployed.id === key || deployed.definitionId === key)) {
    const definition = BEASTS.find((item) => item.id === deployed.definitionId);
    const state = deployed.state || (definition ? save.collections.beasts[definition.id] : undefined);
    return definition && state ? { piece: deployed, state, definition, index: -1, deployed: true } : undefined;
  }
  const index = save.collections.beastBoard.findIndex((piece) => piece?.id === key);
  const fallbackIndex = index >= 0 ? index : save.collections.beastBoard.findIndex((piece) => piece?.definitionId === key);
  const piece = save.collections.beastBoard[fallbackIndex];
  if (piece) {
    const definition = BEASTS.find((item) => item.id === piece.definitionId);
    const state = piece.state || (definition ? save.collections.beasts[definition.id] : undefined);
    return definition && state ? { piece, state, definition, index: fallbackIndex, deployed: false } : undefined;
  }
  const definition = BEASTS.find((item) => item.id === key);
  const state = definition ? save.collections.beasts[definition.id] : undefined;
  return definition && state ? { piece: undefined, state, definition, index: -2, deployed: false } : undefined;
}

function syncBeastSummary(save: GameSaveV1, definitionId: string, state: BeastInstanceState) {
  const summary = save.collections.beasts[definitionId];
  if (!summary) return;
  if (state.level >= summary.level) Object.assign(summary, structuredClone(state), { count: summary.count, discovered: summary.discovered });
}

function inheritBeastAffixLevels(rolled: ReturnType<typeof rollBeastAffixes>, current: BeastInstanceState["affixes"]) {
  return rolled.map((affix, index) => {
    const level = Math.max(1, Math.min(20, current[index]?.refineLevel || 1));
    let value = affix.value;
    for (let step = 1; step < level; step += 1) {
      value = Math.round(value * 1.085 + (affix.percent ? 8 : 2));
    }
    return { ...affix, value, refineLevel: level, refineCap: 20 };
  });
}

function syncBeastAssistDefinitions(save: GameSaveV1) {
  const pieceIds = (save.collections.beastAssistPieceIds || [])
    .filter((id, index, ids) => ids.indexOf(id) === index && save.collections.beastBoard.some((piece) => piece?.id === id))
    .slice(0, 3);
  save.collections.beastAssistPieceIds = pieceIds;
  save.collections.beastAssists = pieceIds
    .map((id) => save.collections.beastBoard.find((piece) => piece?.id === id)?.definitionId)
    .filter(Boolean) as string[];
}

function deployBeastFromBoard(save: GameSaveV1, sourceIndex: number) {
  if (sourceIndex < 0 || sourceIndex >= save.collections.beastUnlockedSlots) return "只能从已解锁兽栏拖入出战位";
  const selected = save.collections.beastBoard[sourceIndex];
  if (!selected) return "该格位没有魔兽";
  const previous = save.collections.deployedBeastPiece;
  save.collections.beastBoard[sourceIndex] = previous || null;
  save.collections.deployedBeastPiece = selected;
  save.collections.deployedBeast = selected.definitionId;
  save.collections.beastAssistPieceIds = (save.collections.beastAssistPieceIds || []).filter((id) => id !== selected.id);
  syncBeastAssistDefinitions(save);
  const selectedName = BEASTS.find((item) => item.id === selected.definitionId)?.name || "魔兽";
  const previousName = previous ? BEASTS.find((item) => item.id === previous.definitionId)?.name : undefined;
  return previousName ? `${selectedName}已出战，${previousName}返回原格位` : `${selectedName}已拖入出战位`;
}

function returnDeployedBeastToBoard(save: GameSaveV1, targetIndex?: number) {
  const deployed = save.collections.deployedBeastPiece;
  if (!deployed) return "当前出战位为空";
  const index = targetIndex == null
    ? save.collections.beastBoard.findIndex((piece, slot) => slot < save.collections.beastUnlockedSlots && !piece)
    : targetIndex;
  if (index < 0 || index >= save.collections.beastUnlockedSlots) return "没有可用的已解锁兽栏格位";
  if (save.collections.beastBoard[index]) return "请把出战魔兽拖到空格，或把另一只魔兽拖上出战位进行替换";
  save.collections.beastBoard[index] = deployed;
  save.collections.deployedBeastPiece = undefined;
  save.collections.deployedBeast = undefined;
  const name = BEASTS.find((item) => item.id === deployed.definitionId)?.name || "魔兽";
  return `${name}已从出战位拖回第 ${index + 1} 格`;
}

function canAutoConsumeBeast(save: GameSaveV1, piece: BeastBoardPiece | null | undefined) {
  if (!isBeastPiece(piece)) return false;
  if (piece.protected) return false;
  return !save.collections.beastAssistPieceIds?.includes(piece.id);
}

function addWarSoul(save: GameSaveV1, id: string, inherited?: Partial<WarSoulState>) {
  const current = save.collections.warSouls[id];
  if (current) current.count += 1;
  else save.collections.warSouls[id] = createWarSoulState(inherited);
}

function accumulatedBeastLevelExp(state: Partial<BeastInstanceState> | undefined, tier: number) {
  if (!state) return 0;
  const level = Math.max(1, Math.min(100, Math.floor(state.level || 1)));
  let total = Math.max(0, Math.floor(state.exp || 0));
  for (let current = 1; current < level; current += 1) total += beastExpForLevel(current, tier);
  return total;
}

function beastLevelStateFromExp(totalExp: number, tier: number) {
  let level = 1;
  let exp = Math.max(0, Math.floor(totalExp));
  while (level < 100) {
    const needed = beastExpForLevel(level, tier);
    if (exp < needed) break;
    exp -= needed;
    level += 1;
  }
  return { level, exp: level >= 100 ? 0 : exp };
}

function addExperienceSpirit(
  save: GameSaveV1,
  definition: BeastDefinition,
  rng: GameRng,
  slotIndex?: number,
  inherited?: Partial<BeastInstanceState>,
  amount = 1
) {
  let remaining = Math.max(1, amount);
  let preferred = slotIndex;
  const current = save.collections.beasts[definition.id];
  const firstDiscovery = !current?.discovered;
  if (current) {
    current.discovered = true;
  } else save.collections.beasts[definition.id] = createBeastState(definition.tier, rng, { count: 0 });
  if (firstDiscovery) save.resources.diamond += definition.codexReward;
  while (remaining > 0) {
    const targetSlot = preferred != null && !save.collections.beastBoard[preferred]
      ? preferred
      : save.collections.beastBoard.findIndex((piece, index) => index < save.collections.beastUnlockedSlots && !piece);
    if (targetSlot < 0 || targetSlot >= save.collections.beastUnlockedSlots) break;
    const piece = createBeastPiece(definition, rng, inherited);
    piece.kind = "spirit";
    save.collections.beastBoard[targetSlot] = piece;
    save.collections.beasts[definition.id].count += 1;
    if (piece.state) syncBeastSummary(save, definition.id, piece.state);
    remaining -= 1;
    preferred = undefined;
  }
  return remaining === 0;
}

function addBeast(save: GameSaveV1, definition: BeastDefinition, rng: GameRng, slotIndex?: number) {
  if (definition.isExperienceSpirit) return addExperienceSpirit(save, definition, rng, slotIndex);
  const targetSlot = slotIndex != null && !save.collections.beastBoard[slotIndex]
    ? slotIndex
    : save.collections.beastBoard.findIndex((piece, index) => index < save.collections.beastUnlockedSlots && !piece);
  if (targetSlot < 0 || targetSlot >= save.collections.beastUnlockedSlots) return false;
  const current = save.collections.beasts[definition.id];
  const firstDiscovery = !current?.discovered;
  if (current) { current.count += 1; current.discovered = true; }
  else save.collections.beasts[definition.id] = createBeastState(definition.tier, rng);
  if (firstDiscovery) save.resources.diamond += definition.codexReward;
  save.collections.beastBoard[targetSlot] = createBeastPiece(definition, rng);
  return true;
}

function rollBeastMagicCrystal(save: GameSaveV1, sourceTier: number, rng: GameRng) {
  const rate = BEAST_MAGIC_CRYSTAL_RATES[sourceTier] || 0;
  if (!rate || rng.next() * 10000 >= rate) return false;
  save.resources.beastMagicCrystal += 1;
  return true;
}

function removeBeastPiece(save: GameSaveV1, index: number) {
  const piece = save.collections.beastBoard[index];
  if (!piece) return;
  const state = save.collections.beasts[piece.definitionId];
  if (state) state.count = Math.max(0, state.count - 1);
  save.collections.beastAssistPieceIds = (save.collections.beastAssistPieceIds || []).filter((id) => id !== piece.id);
  save.collections.beastAssists = (save.collections.beastAssistPieceIds || [])
    .map((id) => save.collections.beastBoard.find((entry) => entry?.id === id)?.definitionId)
    .filter(Boolean) as string[];
  save.collections.beastBoard[index] = null;
}

function mergeBeastPieces(save: GameSaveV1, sourceIndex: number, targetIndex: number, rng: GameRng) {
  const source = save.collections.beastBoard[sourceIndex];
  const target = save.collections.beastBoard[targetIndex];
  if (!isBeastPiece(source) || !isBeastPiece(target) || sourceIndex === targetIndex) return { ok: false, message: "请选择两只魔兽；经验精灵只能拖给魔兽增加等级经验" };
  if (source.protected || target.protected) return { ok: false, message: "已锁定的魔兽不能参与合成，请先解除保护" };
  const assistIds = new Set(save.collections.beastAssistPieceIds || []);
  if (assistIds.has(source.id) || assistIds.has(target.id)) return { ok: false, message: "助战中的魔兽不能参与合成，请先撤下助战位" };
  if (source.tier !== target.tier) return { ok: false, message: "只有同品质魔兽才能合成" };
  if (source.tier >= 7) return { ok: false, message: "超凡魔兽不能在兽栏合并，请进入详情的觉醒升星页面培养" };
  const sourceDefinition = BEASTS.find((item) => item.id === source.definitionId);
  const targetDefinition = BEASTS.find((item) => item.id === target.definitionId);
  if (!sourceDefinition || !targetDefinition) return { ok: false, message: "魔兽图鉴数据异常" };
  if (sourceDefinition.isExperienceSpirit || targetDefinition.isExperienceSpirit) {
    return { ok: false, message: "经验精灵不能参与合成，只能拖给任意魔兽增加经验" };
  }
  const targetTier = source.tier + 1;
  const nextPool = BEASTS.filter((item) => item.tier === targetTier
    && item.mergeEligible !== false);
  if (!nextPool.length) return { ok: false, message: `${BEAST_QUALITIES[targetTier - 1].name}品质魔兽尚未配置` };
  const rate = beastComposeRate(targetTier);
  const mergeSucceeded = rng.next() * 10000 < rate;
  const magicCrystal = rollBeastMagicCrystal(save, source.tier, rng);
  const magicMessage = magicCrystal ? ` · 获得魔晶 ×1（现有 ${save.resources.beastMagicCrystal}）` : "";
  const inheritedLevelExp = beastLevelStateFromExp(
    accumulatedBeastLevelExp(source.state || save.collections.beasts[source.definitionId], source.tier)
      + accumulatedBeastLevelExp(target.state || save.collections.beasts[target.definitionId], target.tier),
    source.tier
  );
  removeBeastPiece(save, sourceIndex);
  removeBeastPiece(save, targetIndex);
  if (mergeSucceeded) {
    const next = rng.pick(nextPool);
    const mergeKind = source.definitionId === target.definitionId ? "同种类同品质合成" : "跨种类同品质合成";
    addBeast(save, next, rng, targetIndex);
    return {
      ok: true,
      success: true,
      message: `${sourceDefinition.name} + ${targetDefinition.name}：${mergeKind}成功（${rate / 100}%），获得${next.name}${magicMessage}`
    };
  }
  if (source.tier === 6) {
    save.resources.beastExtraordinaryShard += 1;
    const failedSpirit = spiritDefinition(source.tier);
    if (failedSpirit) addExperienceSpirit(save, failedSpirit, rng, targetIndex, inheritedLevelExp);
    return {
      ok: true,
      success: false,
      message: `${sourceDefinition.name} + ${targetDefinition.name}：合成超凡失败（${rate / 100}%），获得完美经验精灵 ×1、超凡魔兽碎片 ×1（${save.resources.beastExtraordinaryShard}/5）${magicMessage}`
    };
  }
  const failedSpirit = spiritDefinition(source.tier);
  if (failedSpirit) addExperienceSpirit(save, failedSpirit, rng, targetIndex, inheritedLevelExp);
  return {
    ok: true,
    success: false,
    message: `${sourceDefinition.name} + ${targetDefinition.name}：合成失败（${rate / 100}%），获得${BEAST_QUALITIES[source.tier - 1].name}经验精灵${magicMessage}`
  };
}

function consumeWarSoulMaterials(save: GameSaveV1, mainId: string, count: number) {
  const main = WAR_SOULS.find((item) => item.id === mainId);
  if (!main || warSoulMaterialCount(save, mainId) < count) return false;
  let remaining = count;
  const candidates = WAR_SOULS.filter((item) => item.tier === main.tier).sort((left, right) => Number(left.id === mainId) - Number(right.id === mainId));
  candidates.forEach((candidate) => {
    if (!remaining) return;
    const state = save.collections.warSouls[candidate.id];
    if (!state) return;
    const reserved = candidate.id === mainId || save.collections.deployedWarSoul === candidate.id ? 1 : 0;
    const used = Math.min(remaining, Math.max(0, state.count - reserved));
    state.count -= used;
    remaining -= used;
  });
  return remaining === 0;
}

function consumeWarSoulReplacementMaterials(save: GameSaveV1, mainId: string, count: number) {
  const main = WAR_SOULS.find((item) => item.id === mainId);
  if (!main || warSoulReplacementMaterialCount(save, mainId) < count) return false;
  let remaining = count;
  WAR_SOULS.filter((item) => item.tier === main.tier - 1).forEach((candidate) => {
    if (!remaining) return;
    const state = save.collections.warSouls[candidate.id];
    if (!state) return;
    const reserved = save.collections.deployedWarSoul === candidate.id ? 1 : 0;
    const used = Math.min(remaining, Math.max(0, state.count - reserved));
    state.count -= used;
    remaining -= used;
  });
  return remaining === 0;
}

function refineWarSoul(save: GameSaveV1, id: string, requested: 1 | 10) {
  const soul = save.collections.warSouls[id];
  const definition = WAR_SOULS.find((item) => item.id === id);
  if (!soul || !definition || !soul.count) return "尚未拥有该战魂";
  const slotCap = warSoulRefineSlotCap(definition.tier);
  if (soul.refineEntries.length >= slotCap) return "精炼槽已满，请锁定要保留的属性后回退重炼";
  const rng = new GameRng(save.rngSeed, save.rngDraws);
  const results: string[] = [];
  let spentGold = 0;
  while (results.length < requested && soul.refineEntries.length < slotCap) {
    const cost = warSoulRefineCost(definition.tier, soul.refineEntries.length);
    if (save.resources.gold < cost.gold) break;
    save.resources.gold -= cost.gold;
    spentGold += cost.gold;
    const entry = generateWarSoulRefineEntry(definition.tier, soul.luck, rng, soul.refineEntries.length);
    soul.refineEntries.push(entry);
    results.push(entry.resultQuality);
    soul.luck = Math.max(0, soul.luck + rng.int(-20, 45));
    save.counters.refines += 1;
  }
  save.rngSeed = rng.state;
  save.rngDraws = rng.draws;
  syncWarSoulRefineState(soul);
  if (!results.length) {
    const cost = warSoulRefineCost(definition.tier, soul.refineEntries.length);
    return `资源不足：下次精炼需要 ${cost.gold.toLocaleString()} 精炼资源`;
  }
  return `完成 ${results.length} 次精炼：${results.join("、")} · 魂力 ${soul.refine} · 消耗 ${spentGold.toLocaleString()} 精炼资源`;
}

function consumeRuneMaterials(save: GameSaveV1, mainId: string, count: number) {
  const level = save.growthSystems.runes.levels[mainId] || 1;
  if (runeMaterialCount(save, mainId) < count) return false;
  let remaining = count;
  RUNES.slice().sort((left, right) => Number(left.id === mainId) - Number(right.id === mainId)).forEach((rune) => {
    if (!remaining || (save.growthSystems.runes.levels[rune.id] || 1) !== level) return;
    const amount = save.growthSystems.runes.inventory[rune.id] || 0;
    const reserved = rune.id === mainId || save.growthSystems.runes.equipped.includes(rune.id) ? 1 : 0;
    const used = Math.min(remaining, Math.max(0, amount - reserved));
    save.growthSystems.runes.inventory[rune.id] = amount - used;
    remaining -= used;
  });
  return remaining === 0;
}

function consumeArtifactMaterials(save: GameSaveV1, mainId: string, count: number) {
  const main = save.growthSystems.artifact.owned[mainId];
  if (!main || artifactMaterialCount(save, mainId) < count) return false;
  let remaining = count;
  ARTIFACTS.slice().sort((left, right) => Number(left.id === mainId) - Number(right.id === mainId)).forEach((artifact) => {
    const state = save.growthSystems.artifact.owned[artifact.id];
    if (!remaining || !state || state.level !== main.level) return;
    const reserved = artifact.id === mainId || save.growthSystems.artifact.equipped === artifact.id ? 1 : 0;
    const used = Math.min(remaining, Math.max(0, state.count - reserved));
    state.count -= used;
    remaining -= used;
  });
  return remaining === 0;
}

function fillBestGemSockets(save: GameSaveV1) {
  const plan = BUILD_PLANS.find((item) => item.id === save.buildPlan) || BUILD_PLANS[0];
  const candidates: { color: GemColor; level: number; score: number }[] = [];
  GEM_COLORS.forEach((gem) => {
    for (let level = 1; level <= 8; level += 1) {
      const amount = save.growthSystems.gems.inventory[gemKey(gem.id, level)] || 0;
      const baseWeight = gem.baseStat === "hp" ? 0.6 : gem.baseStat === "attack" ? 40 : gem.baseStat === "defense" ? 20 : 200;
      const secondary = level >= 4 ? Math.round((level - 3) * 85 + Math.pow(level - 3, 1.35) * 22) : 0;
      const planBonus = gem.secondary.reduce((sum, stat) => sum + (stat === plan.primary ? 150 : stat === plan.secondary ? 60 : 0), 0) * secondary;
      const score = baseWeight * GEM_BASE_VALUES[gem.id][level - 1] + secondary * 170 + planBonus;
      for (let copy = 0; copy < amount; copy += 1) candidates.push({ color: gem.id, level, score });
    }
  });
  candidates.sort((left, right) => right.score - left.score);
  save.growthSystems.gems.sockets = {};
  let socketed = 0;
  GEM_COLORS.forEach((color) => {
    candidates.filter((gem) => gem.color === color.id).slice(0, 5).forEach((gem, index) => {
      save.growthSystems.gems.sockets[`${color.id}-${index}`] = { color: gem.color, level: gem.level };
      socketed += 1;
    });
  });
  return socketed;
}

function mountKeepScore(mount: MountInstance) {
  return mount.level * 1_000_000 + mount.quality * 100_000 + mount.attributes.reduce((sum, affix) => sum + affix.value, 0);
}

function recycleMountInstances(save: GameSaveV1, mounts: MountInstance[]) {
  const scale = progressionRewardMultiplier(save.player.level, save.day);
  const rewards = mounts.reduce((total, mount) => ({
    whip: total.whip + Math.max(1, mount.quality - 1),
    food: total.food + mount.quality * 8,
    steak: total.steak + Math.max(0, mount.quality - 2),
    gold: total.gold + Math.round(800 * mount.quality * Math.pow(1.06, mount.level - 1) * scale)
  }), { whip: 0, food: 0, steak: 0, gold: 0 });
  save.resources.mountWhip += rewards.whip;
  save.resources.food += rewards.food;
  save.resources.steak += rewards.steak;
  save.resources.gold += rewards.gold;
  return rewards;
}

function trimMountStable(save: GameSaveV1) {
  const stable = save.growthSystems.mount;
  const overflow = Math.max(0, stable.mounts.length - 80);
  if (!overflow) return { count: 0, whip: 0, food: 0, steak: 0, gold: 0 };
  const removable = stable.mounts
    .filter((mount) => mount.id !== stable.activeId)
    .sort((left, right) => mountKeepScore(left) - mountKeepScore(right))
    .slice(0, overflow);
  const removeIds = new Set(removable.map((mount) => mount.id));
  stable.mounts = stable.mounts.filter((mount) => !removeIds.has(mount.id));
  const rewards = recycleMountInstances(save, removable);
  return { count: removable.length, ...rewards };
}

function collectionDefinitions(kind: CollectionKind): CollectionDefinition[] {
  return kind === "warSouls" ? WAR_SOULS : kind === "beasts" ? BEASTS : SOUL_CARDS;
}

function collectionCost(kind: CollectionKind): { resource: ResourceId; amount: number } {
  if (kind === "warSouls") return { resource: "soulCore", amount: 10 };
  if (kind === "beasts") return { resource: "beastEssence", amount: 10 };
  return { resource: "soulCardTicket", amount: 1 };
}

function drawDefinition(kind: CollectionKind, rng: GameRng) {
  const roll = rng.next() * 10000;
  const tier = roll < 10 ? 6 : roll < 100 ? 5 : roll < 500 ? 4 : roll < 1500 ? 3 : roll < 4000 ? 2 : 1;
  const pool = collectionDefinitions(kind).filter((item) => item.tier === tier);
  return rng.pick(pool.length ? pool : collectionDefinitions(kind).filter((item) => item.tier === 1));
}

function trimLoot(save: GameSaveV1) {
  if (save.loot.length <= 120) return;
  const overflow = save.loot.splice(0, save.loot.length - 120);
  save.resources.gold += overflow.reduce((sum, item) => sum + item.sellValue, 0);
  grantEquipmentDecomposeRewards(save, overflow);
}

function equipmentEagleFeathers(items: GameSaveV1["loot"]) {
  return items.reduce((total, item) => total + (item.quality >= 4 ? item.quality - 3 : 0), 0);
}

function grantEquipmentDecomposeRewards(save: GameSaveV1, items: GameSaveV1["loot"]) {
  grantPlayerExp(save, equipmentDecomposeExp(items));
  save.resources.eagleFeather += equipmentEagleFeathers(items);
}

function equipLootForPlan(save: GameSaveV1) {
  let equipped = 0;
  let gold = 0;
  const soldItems: typeof save.loot = [];
  save.loot.sort((a, b) => equipmentPlanScore(b, save.buildPlan) - equipmentPlanScore(a, save.buildPlan)).forEach((item) => {
    const current = save.equipped[item.slot];
    if (!current || equipmentPlanScore(item, save.buildPlan) > equipmentPlanScore(current, save.buildPlan)) {
      if (current) { gold += current.sellValue; soldItems.push(current); }
      save.equipped[item.slot] = item;
      equipped += 1;
    } else {
      gold += item.sellValue;
      soldItems.push(item);
    }
  });
  save.resources.gold += gold;
  grantEquipmentDecomposeRewards(save, soldItems);
  save.loot = [];
  return equipped;
}

function optimizeCollections(save: GameSaveV1) {
  const plan = BUILD_PLANS.find((item) => item.id === save.buildPlan) || BUILD_PLANS[0];
  const roleWord: Record<BuildPlanId, string> = { crit: "暴击", dodge: "闪避", combo: "连击", lifesteal: "吸血", stun: "控制" };
  const bestOwned = (definitions: CollectionDefinition[], inventory: Record<string, { count: number }>, preferred: string) =>
    definitions.filter((item) => inventory[item.id]?.count).sort((a, b) => Number(b.role.includes(preferred)) - Number(a.role.includes(preferred)) || b.tier - a.tier)[0];
  const soul = bestOwned(WAR_SOULS, save.collections.warSouls, roleWord[save.buildPlan]);
  const beast = bestOwned(BEASTS, save.collections.beasts, plan.short);
  if (soul) save.collections.deployedWarSoul = soul.id;
  if (beast && save.collections.deployedBeastPiece?.definitionId !== beast.id) {
    const index = save.collections.beastBoard.findIndex((piece) => piece?.definitionId === beast.id);
    if (index >= 0) deployBeastFromBoard(save, index);
  }
  const preferredCards = SOUL_CARDS.filter((card) => {
    const setName = card.name.split("·")[0];
    return save.collections.soulCards[card.id]?.count && SOUL_CARD_SET_STATS[setName] === plan.primary;
  });
  const fallbackCards = SOUL_CARDS.filter((card) => save.collections.soulCards[card.id]?.count && !preferredCards.includes(card)).sort((a, b) => b.tier - a.tier);
  const orderedCards = [...preferredCards, ...fallbackCards];
  save.collections.equippedCards = ["1", "3", "2"].flatMap((role) => orderedCards.filter((card) => soulCardRoleKey(card.id) === role).slice(0, 4).map((card) => card.id));
  save.collections.soulCardSchemes[save.collections.activeSoulCardScheme] = [...save.collections.equippedCards];
  const preferredRunes = RUNES.filter((rune) => save.growthSystems.runes.inventory[rune.id])
    .sort((left, right) => Number(right.stat === plan.primary) * 100 + Number(right.stat === plan.secondary) * 40 + right.tier * 10 - (Number(left.stat === plan.primary) * 100 + Number(left.stat === plan.secondary) * 40 + left.tier * 10));
  save.growthSystems.runes.equipped = preferredRunes.slice(0, 3).map((rune) => rune.id);
  fillBestGemSockets(save);
}

function resolveStage(save: GameSaveV1) {
  const rng = new GameRng(save.rngSeed, save.rngDraws);
  const stage = save.player.stage;
  const trialMonster = trialMonsterAt(stage);
  const result = runBattle(calculatePlayerStats(save), stageEnemy(stage), rng, stageRewardScale(stage), battleLoadoutFromSave(save));
  result.stage = stage;
  result.stageLabel = trialStageLabel(stage);
  result.chapterName = trialMonster.chapterName;
  result.sourceVersion = TRIAL_META.version;
  result.playerLevel = save.player.level;
  result.enemyName = `试炼怪物·${result.stageLabel}`;
  save.lastBattle = result;
  if (result.win) {
    addRewards(save, result.rewards);
    save.resources.trialCoin += Math.max(20, Math.round(20 * progressionRewardScale(save)));
    grantPlayerExp(save, Math.max(25, Math.round(expForLevel(save.player.level) * 0.025)));
    save.player.stage += 1;
    save.counters.stagesWon += 1;
  }
  save.rngSeed = rng.state;
  save.rngDraws = rng.draws;
  return result.win;
}

const ACTIVITY_REWARDS: Record<string, Partial<Record<ResourceId, number>>> = {
  signin: { diamond: 88, chestTicket: 200 },
  daily: { gold: 50000, soulCore: 20, challengeTicket: 5 },
  seven: { diamond: 680, beastEssence: 80, soulCardTicket: 50 },
  mail: { chestTicket: 999, gemTicket: 10, runeShard: 30 }
};

export const useGameStore = create<GameStore>((set, get) => {
  const syncCommerceDay = (save: GameSaveV1) => {
    if (save.commerce.day === save.day) return;
    const permanentIds = new Set(["monthly-30", "lifetime-68", "fund-98", "pass-128"]);
    save.commerce.day = save.day;
    save.commerce.shopPurchases = {};
    save.commerce.packagePurchases = Object.fromEntries(Object.entries(save.commerce.packagePurchases).filter(([id]) => permanentIds.has(id)));
    save.commerce.refreshes = 0;
  };
  const update = (mutator: (save: GameSaveV1) => void | string, notice = "") => {
    const save = structuredClone(get().save);
    const powerBefore = calculatePower(calculatePlayerStats(save));
    const levelBefore = save.player.level;
    const actionNotice = mutator(save) || notice;
    const powerAfter = calculatePower(calculatePlayerStats(save));
    const levelAfter = save.player.level;
    if (powerAfter !== powerBefore || levelAfter !== levelBefore) {
      save.lastGrowth = { label: actionNotice || "成长结算", powerBefore, powerAfter, levelBefore, levelAfter, createdAt: Date.now() };
    }
    const changes = [
      powerAfter > powerBefore ? `战力 +${(powerAfter - powerBefore).toLocaleString()}` : powerAfter < powerBefore ? `战力 ${(powerAfter - powerBefore).toLocaleString()}` : "",
      levelAfter > levelBefore ? `等级 ${levelBefore}→${levelAfter}` : ""
    ].filter(Boolean);
    save.updatedAt = Date.now();
    save.lastSeenAt = Date.now();
    set({ save, notice: [actionNotice, ...changes].filter(Boolean).join(" · ") });
    persist(save);
  };

  return {
    save: createInitialSave(),
    ready: false,
    notice: "",
    hydrate: async () => {
      const stored = await loadSave();
      const save = normalizeSave(stored || createInitialSave());
      const eggIntervals = Math.floor(Math.max(0, Date.now() - save.beastEggClock.lastGeneratedAt) / 21600000);
      if (eggIntervals > 0 && save.resources.beastEgg < 6) {
        const generated = Math.min(6 - save.resources.beastEgg, eggIntervals);
        save.resources.beastEgg += generated;
        save.beastEggClock.lastGeneratedAt += generated * 21600000;
      }
      const minutes = Math.min(720, Math.max(0, (Date.now() - save.lastSeenAt) / 60000));
      const offlineGold = Math.floor(minutes * 2 * Math.pow(1.055, Math.min(200, Math.max(0, save.player.stage - 1))) * Math.pow(1.08, Math.max(0, save.day - 1)));
      if (offlineGold > 0) save.resources.gold += offlineGold;
      save.lastSeenAt = Date.now();
      set({ save, ready: true, notice: offlineGold > 0 ? `挂机收益：金币 +${offlineGold.toLocaleString()}` : "" });
      persist(save);
    },
    clearNotice: () => set({ notice: "" }),
    purchase: (productId, requestedQuantity = 1) => {
      const product = RECHARGE_PRODUCTS.find((item) => item.id === productId);
      if (!product) return;
      update((save) => {
        syncCommerceDay(save);
        const limit = RECHARGE_PRODUCT_LIMITS[product.id] || 999;
        const purchased = save.commerce.packagePurchases[product.id] || 0;
        const quantity = Math.min(Math.max(1, Math.floor(requestedQuantity)), Math.max(0, limit - purchased));
        if (!quantity) return `${product.name}已达到当前购买上限`;
        const firstDouble = product.firstDouble && !save.firstPurchaseProducts.includes(product.id);
        const rewards = Object.fromEntries(Object.entries(product.rewards).map(([id, amount]) => [id, Number(amount) * quantity + (firstDouble ? Number(amount) : 0)])) as Partial<Record<ResourceId, number>>;
        addRewards(save, rewards);
        save.totalSpent += product.amountRmb * quantity;
        save.commerce.packagePurchases[product.id] = purchased + quantity;
        save.orders.push({ id: `order-${Date.now()}-${save.orders.length + 1}`, productId: product.id, productName: quantity > 1 ? `${product.name} ×${quantity}` : product.name, amountRmb: product.amountRmb * quantity, rewards, quantity, createdAt: Date.now() });
        if (!save.firstPurchaseProducts.includes(product.id)) save.firstPurchaseProducts.push(product.id);
        return `模拟到账成功：${product.name}${quantity > 1 ? ` ×${quantity}` : ""}`;
      });
    },
    frenzyRecharge: () => update((save) => {
      for (let index = 0; index < 10; index += 1) {
        const rewards = {
          diamond: 6480, gold: 500000, chestTicket: 1200, soulCore: 200, beastEssence: 500,
          beastEgg: 10, beastEggBlue: 3, beastEggGold: 1, beastDevourStone: 100, soulCardTicket: 20, mountWhip: 50, food: 120,
          steak: 80, eagleFeather: 120, petSoulGrass: 80, petSoulFlower: 30, petSoulFruit: 12, runeShard: 200, gemTicket: 30, artifactOre: 60, flagEssence: 120,
          eggHammer: 20, treasuryKey: 20, goldenSnakeToken: 60, guildCoin: 500, merit: 1000, trialCoin: 1000
        };
        addRewards(save, rewards);
        save.orders.push({ id: `frenzy-${Date.now()}-${index}`, productId: "frenzy-648", productName: `648 豪充连击 ${index + 1}/10`, amountRmb: 648, rewards, createdAt: Date.now() + index });
      }
      save.totalSpent += 6480;
    }, "十连模拟充值到账：资源已全部发放"),
    buyShopGood: (goodId, requestedQuantity) => update((save) => {
      syncCommerceDay(save);
      const good = SHOP_GOODS.find((item) => item.id === goodId);
      if (!good) return "商品已下架";
      const purchased = save.commerce.shopPurchases[good.id] || 0;
      const remaining = Math.max(0, good.limit - purchased);
      const affordable = Math.floor(save.resources[good.currency] / good.cost);
      const quantity = Math.min(Math.max(1, Math.floor(requestedQuantity)), remaining, affordable);
      if (!remaining) return `${good.name}已售罄，刷新后可再次购买`;
      if (!quantity) return `${RESOURCE_META[good.currency].name}不足，需要 ${good.cost.toLocaleString()}`;
      save.resources[good.currency] -= good.cost * quantity;
      addRewards(save, Object.fromEntries(Object.entries(good.rewards).map(([id, amount]) => [id, Number(amount) * quantity])) as Partial<Record<ResourceId, number>>);
      save.commerce.shopPurchases[good.id] = purchased + quantity;
      return `商店购买：${good.name} ×${quantity}`;
    }),
    refreshCommerceShop: () => update((save) => {
      syncCommerceDay(save);
      const cost = save.commerce.refreshes === 0 ? 0 : 30 * Math.pow(2, Math.min(4, save.commerce.refreshes - 1));
      if (save.resources.diamond < cost) return `刷新需要钻石 ${cost}`;
      save.resources.diamond -= cost;
      save.commerce.shopPurchases = {};
      save.commerce.shopRotation += 1;
      save.commerce.refreshes += 1;
      return cost ? `商店已刷新，消耗钻石 ${cost}` : "今日免费刷新完成";
    }),
    claimGrowthPack: (level, premium) => update((save) => {
      const milestone = GROWTH_PACK_LEVELS.find((item) => item.level === level);
      if (!milestone || save.player.level < level) return `角色达到 ${level} 级后可领取`;
      const claimed = premium ? save.commerce.claimedGrowthPremium : save.commerce.claimedGrowthFree;
      if (claimed.includes(level)) return "该档成长奖励已领取";
      if (premium && !save.orders.some((order) => order.productId === "fund-98")) return "请先免费模拟解锁成长基金";
      addRewards(save, milestone[premium ? "premium" : "free"]);
      claimed.push(level);
      return `成长礼包 Lv.${level} ${premium ? "进阶" : "免费"}奖励已领取`;
    }),
    claimCommerceCard: (productId) => update((save) => {
      if (!save.orders.some((order) => order.productId === productId)) return "请先免费模拟开通该权益";
      if (save.commerce.cardClaimDays[productId] === save.day) return "今日权益奖励已领取";
      const rewards = productId === "monthly-30" ? { diamond: 60, chestTicket: 100 } : { petSoulGrass: 60, petSoulFlower: 5 };
      addRewards(save, rewards);
      save.commerce.cardClaimDays[productId] = save.day;
      return `${productId === "monthly-30" ? "高级月卡" : "黄金兽宠"}今日奖励已领取`;
    }),
    claimVip: (level) => update((save) => {
      if (level < 1 || level > vipLevel(save.totalSpent) || save.claimedVip.includes(level)) return;
      addRewards(save, { diamond: level * 120, chestTicket: level * 300, soulCore: level * 8 });
      save.claimedVip.push(level);
    }, `VIP ${level} 礼包已领取`),
    claimAllVip: () => update((save) => {
      const currentVip = vipLevel(save.totalSpent);
      for (let level = 1; level <= currentVip; level += 1) {
        if (save.claimedVip.includes(level)) continue;
        addRewards(save, { diamond: level * 120, chestTicket: level * 300, soulCore: level * 8 });
        save.claimedVip.push(level);
      }
    }, "可领取的 VIP 礼包已全部领取"),
    buyChestTickets: () => update((save) => {
      if (save.resources.diamond < 60) return;
      save.resources.diamond -= 60;
      save.resources.chestTicket += 100;
    }, get().save.resources.diamond >= 60 ? "宝箱 +100" : "钻石不足，请先模拟充值"),
    openChest: (count) => update((save) => {
      if (save.resources.chestTicket < count) return;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const items = Array.from({ length: count }, () => generateEquipment(save.player.level, save.chest.level, rng));
      save.resources.chestTicket -= count;
      save.chest.progress += count;
      save.counters.chestsOpened += count;
      rollChestExtraDrops(save, rng, count);
      save.loot.push(...items);
      save.lastChestSummary = { opened: count, equipped: 0, kept: count, sold: 0, bestQuality: Math.max(...items.map((item) => item.quality)), powerGain: 0 };
      trimLoot(save);
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
    }, get().save.resources.chestTicket >= count ? `${count} 倍开箱完成` : "宝箱不足"),
    autoChestTick: () => {
      const current = get().save;
      if (!current.automation.autoChest) return;
      if (current.resources.chestTicket <= 0) {
        update((save) => { save.automation.autoChest = false; }, "宝箱耗尽，委托已停止");
        return;
      }
      update((save) => {
        const count = Math.min(save.automation.batch, save.resources.chestTicket);
        const beforePower = calculatePower(calculatePlayerStats(save));
        const rng = new GameRng(save.rngSeed, save.rngDraws);
        const items = Array.from({ length: count }, () => generateEquipment(save.player.level, save.chest.level, rng));
        let equipped = 0;
        let kept = 0;
        let sold = 0;
        const decomposed: typeof save.loot = [];
        save.resources.chestTicket -= count;
        save.chest.progress += count;
        save.counters.chestsOpened += count;
        rollChestExtraDrops(save, rng, count);
        items.forEach((item) => {
          const currentItem = save.equipped[item.slot];
          if (!currentItem || equipmentPlanScore(item, save.buildPlan) > equipmentPlanScore(currentItem, save.buildPlan)) {
            if (currentItem) { save.resources.gold += currentItem.sellValue; decomposed.push(currentItem); }
            save.equipped[item.slot] = item;
            equipped += 1;
          } else if (item.quality >= save.automation.keepQuality || item.affixes.some((affix) => affix.stat === save.automation.targetStat)) {
            save.loot.push(item);
            kept += 1;
          } else {
            save.resources.gold += item.sellValue;
            decomposed.push(item);
            sold += 1;
          }
        });
        grantEquipmentDecomposeRewards(save, decomposed);
        const bestQuality = Math.max(...items.map((item) => item.quality));
        save.lastChestSummary = {
          opened: count, equipped, kept, sold, bestQuality,
          powerGain: Math.max(0, calculatePower(calculatePlayerStats(save)) - beforePower)
        };
        if ((save.automation.stopOnUpgrade && equipped > 0) || (save.automation.stopOnQuality && bestQuality >= save.automation.keepQuality)) save.automation.autoChest = false;
        trimLoot(save);
        save.rngSeed = rng.state;
        save.rngDraws = rng.draws;
      });
    },
    equipBest: () => update((save) => {
      const beforePower = calculatePower(calculatePlayerStats(save));
      const held = save.loot.length;
      const equipped = equipLootForPlan(save);
      if (save.lastChestSummary) {
        save.lastChestSummary.equipped = equipped;
        save.lastChestSummary.kept = 0;
        save.lastChestSummary.sold = Math.max(0, held - equipped);
        save.lastChestSummary.powerGain = calculatePower(calculatePlayerStats(save)) - beforePower;
      }
    }, "已按当前流派换装，其余自动出售"),
    equipLootItem: (itemId) => update((save) => {
      const index = save.loot.findIndex((item) => item.id === itemId);
      if (index < 0) return "该装备已不在待处理栏";
      const [item] = save.loot.splice(index, 1);
      const current = save.equipped[item.slot];
      if (current) save.loot.push(current);
      save.equipped[item.slot] = item;
      return `已穿戴${QUALITIES[item.quality].name}${SLOTS.find((slot) => slot.id === item.slot)?.name || "装备"}`;
    }),
    sellLootItem: (itemId) => update((save) => {
      const index = save.loot.findIndex((item) => item.id === itemId);
      if (index < 0) return "该装备已不在待处理栏";
      const [item] = save.loot.splice(index, 1);
      save.resources.gold += item.sellValue;
      grantEquipmentDecomposeRewards(save, [item]);
      const feathers = equipmentEagleFeathers([item]);
      return `装备已出售：金币 +${item.sellValue.toLocaleString()}${feathers ? ` · 鹰羽 +${feathers}` : ""}`;
    }),
    refineEquipment: (slot) => update((save) => {
      if (!save.equipped[slot]) return "该部位尚未穿戴装备";
      const level = save.gearRefines[slot] || 0;
      if (level >= EQUIPMENT_REFINE_MAX) return `该部位精炼已达到 +${EQUIPMENT_REFINE_MAX}`;
      const cost = equipmentRefineCost(save.player.level, level);
      if (save.resources.gold < cost) return `精炼需要金币 ${cost.toLocaleString()}`;
      save.resources.gold -= cost;
      save.gearRefines[slot] = level + 1;
      return `${SLOTS.find((item) => item.id === slot)?.name || "装备"}精炼 +${level + 1}`;
    }),
    optimizeBuild: () => update((save) => {
      equipLootForPlan(save);
      optimizeCollections(save);
    }, "装备、战魂、魔兽与魂卡已按流派优化"),
    sellLoot: () => update((save) => {
      const items = save.loot;
      const feathers = equipmentEagleFeathers(items);
      save.resources.gold += items.reduce((sum, item) => sum + item.sellValue, 0);
      grantEquipmentDecomposeRewards(save, items);
      save.loot = [];
      return `开箱装备已全部出售${feathers ? ` · 鹰羽 +${feathers}` : ""}`;
    }),
    upgradeChest: () => update((save) => {
      if (save.chest.level >= 31) return "宝箱已达到 31 级";
      const cost = chestUpgradeCost(save.chest.level);
      const requirement = chestUpgradeRequirement(save.chest.level);
      if (save.chest.progress < requirement) return `升级前还需开启 ${requirement - save.chest.progress} 个宝箱`;
      if (save.resources.gold < cost) return `金币不足，需要 ${cost.toLocaleString()}`;
      save.resources.gold -= cost;
      save.chest.level += 1;
      save.chest.progress = 0;
      return `宝箱升至 Lv.${save.chest.level}`;
    }),
    setBuildPlan: (id) => update((save) => {
      const plan = BUILD_PLANS.find((item) => item.id === id);
      if (!plan) return;
      save.buildPlan = id;
      save.automation.targetStat = plan.primary;
    }, "流派方案已切换"),
    setAutomation: (patch) => update((save) => {
      save.automation = { ...save.automation, ...patch };
      save.chest.autoOpen = save.automation.autoChest;
    }),
    drawCollection: (kind, count) => {
      if (kind !== "soulCards") {
        update(() => kind === "warSouls" ? "战魂改为自选礼包获取，请进入战魂玩法" : "魔兽改为魔兽蛋孵化，请进入魔兽玩法");
        return;
      }
      const cost = collectionCost(kind);
      update((save) => {
        if (save.resources[cost.resource] < cost.amount * count) return "魂卡券不足";
        const rng = new GameRng(save.rngSeed, save.rngDraws);
        save.resources[cost.resource] -= cost.amount * count;
        save.counters.summons += count;
        for (let index = 0; index < count; index += 1) {
          const definition = drawDefinition(kind, rng);
          const currentItem = save.collections.soulCards[definition.id];
          save.collections.soulCards[definition.id] = currentItem ? { ...currentItem, count: currentItem.count + 1 } : { count: 1, level: 1, stage: 1 };
        }
        save.rngSeed = rng.state;
        save.rngDraws = rng.draws;
        return `${count} 次魂卡召唤完成`;
      });
    },
    upgradeSoulCard: (id, count) => update((save) => {
      const definition = SOUL_CARDS.find((item) => item.id === id);
      const card = save.collections.soulCards[id];
      if (!definition || !card?.count) return "尚未获得该魂卡";
      let upgraded = 0;
      let used = 0;
      while (upgraded < count && card.level < 60) {
        const cost = soulCardUpgradeCost(card.level, definition.tier);
        if (save.resources.soulCardDust < cost) break;
        save.resources.soulCardDust -= cost;
        used += cost;
        card.level += 1;
        upgraded += 1;
      }
      return upgraded ? `${definition.name}提升 ${upgraded} 级，消耗魂晶 ${used}` : card.level >= 60 ? "魂卡已满 60 级" : "魂晶不足";
    }),
    ascendSoulCard: (id) => update((save) => {
      const definition = SOUL_CARDS.find((item) => item.id === id);
      const card = save.collections.soulCards[id];
      if (!definition || !card?.count) return "尚未获得该魂卡";
      if (card.stage >= 6) return "魂卡已达到 6 阶";
      const copies = card.stage + 1;
      if (card.count - 1 < copies) return `升阶需要保留本体并消耗同名魂卡 ${copies} 张`;
      card.count -= copies;
      card.stage += 1;
      return `${definition.name}升至 ${card.stage} 阶，技能与属性倍率提高`;
    }),
    decomposeSoulCardDuplicates: (id) => update((save) => {
      const definitions = id ? SOUL_CARDS.filter((item) => item.id === id) : SOUL_CARDS;
      let cards = 0;
      let dust = 0;
      definitions.forEach((definition) => {
        const state = save.collections.soulCards[definition.id];
        if (!state) return;
        const amount = Math.max(0, state.count - 1);
        if (!amount) return;
        state.count -= amount;
        cards += amount;
        dust += amount * definition.tier * 15;
      });
      save.resources.soulCardDust += dust;
      return cards ? `分解重复魂卡 ${cards} 张，魂晶 +${dust}` : "没有可分解的重复魂卡";
    }),
    exchangeSoulCardDust: (count) => update((save) => {
      const cost = count * 60;
      if (save.resources.soulCardDust < cost) return `再召唤需要魂晶 ${cost}`;
      save.resources.soulCardDust -= cost;
      save.resources.soulCardTicket += count;
      return `魂晶兑换魂卡券 ×${count}`;
    }),
    selectSoulCardScheme: (index) => update((save) => {
      const target = Math.max(0, Math.min(2, Math.floor(index)));
      save.collections.soulCardSchemes[save.collections.activeSoulCardScheme] = [...save.collections.equippedCards];
      save.collections.activeSoulCardScheme = target;
      save.collections.equippedCards = [...save.collections.soulCardSchemes[target]];
      return `已切换魂卡方案 ${target + 1}`;
    }),
    hunt: (count) => update((save) => {
      if (save.resources.huntingStamina < count) return "捕猎体力不足";
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const total = HUNTING_POOL.reduce((sum, item) => sum + item.rate, 0);
      const results: string[] = [];
      let firstUnlocks = 0;
      save.resources.huntingStamina -= count;
      for (let drawIndex = 0; drawIndex < count; drawIndex += 1) {
        let roll = rng.next() * total;
        let caught = HUNTING_POOL[HUNTING_POOL.length - 1];
        for (const item of HUNTING_POOL) {
          roll -= item.rate;
          if (roll <= 0) { caught = item; break; }
        }
        if (!save.hunting[caught.id]) firstUnlocks += 1;
        save.hunting[caught.id] = (save.hunting[caught.id] || 0) + 1;
        const baseEssence = caught.rate < 0.75 ? 5 : caught.rate < 1.5 ? 3 : 1;
        save.resources.beastEssence += Math.max(1, Math.round(baseEssence * progressionRewardScale(save)));
        results.push(caught.name);
      }
      save.lastHunt = results.slice(-10);
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `捕猎完成：${results.slice(-5).join("、")}${firstUnlocks ? ` · 新图鉴 ${firstUnlocks}` : ""}`;
    }),
    sellHuntDuplicates: () => update((save) => {
      let sold = 0;
      let coins = 0;
      HUNTING_POOL.forEach((item) => {
        const amount = Math.max(0, (save.hunting[item.id] || 0) - 1);
        if (!amount) return;
        save.hunting[item.id] -= amount;
        sold += amount;
        coins += Math.round(amount * item.duplicateValue * (1 + (save.hunterLevel - 1) * 0.08));
      });
      if (!sold) return "没有可出售的重复猎物";
      save.resources.huntingCoin += coins;
      save.hunterExp += coins;
      let levels = 0;
      while (save.hunterLevel < 50 && save.hunterExp >= hunterExpForLevel(save.hunterLevel)) {
        save.hunterExp -= hunterExpForLevel(save.hunterLevel);
        save.hunterLevel += 1;
        levels += 1;
      }
      return `出售重复猎物 ${sold} 份，猎人币 +${coins}${levels ? ` · 猎人升 ${levels} 级` : ""}`;
    }),
    exchangeHuntingCoins: (kind) => update((save) => {
      const cost = kind === "stamina" ? 50 : 100;
      if (save.resources.huntingCoin < cost) return `猎人币不足，需要 ${cost}`;
      save.resources.huntingCoin -= cost;
      if (kind === "stamina") {
        save.resources.huntingStamina += 50;
        return "兑换捕猎体力 +50";
      }
      const scale = progressionRewardScale(save);
      save.resources.beastEssence += Math.round(30 * scale);
      save.resources.beastDevourStone += Math.max(3, Math.round(5 * Math.sqrt(scale)));
      return "兑换稀有魔兽材料包";
    }),
    deploy: (kind, id) => update((save) => {
      if (kind === "warSouls" && save.collections.warSouls[id]?.count > 0) save.collections.deployedWarSoul = id;
      if (kind === "beasts") {
        const deployed = save.collections.deployedBeastPiece;
        if (deployed && (deployed.id === id || deployed.definitionId === id)) return returnDeployedBeastToBoard(save);
        const exactIndex = save.collections.beastBoard.findIndex((piece) => piece?.id === id);
        const sourceIndex = exactIndex >= 0
          ? exactIndex
          : save.collections.beastBoard.findIndex((piece, index) => index < save.collections.beastUnlockedSlots && piece?.definitionId === id);
        if (sourceIndex < 0) return "兽栏中没有可拖入出战位的该魔兽";
        return deployBeastFromBoard(save, sourceIndex);
      }
      if (kind === "soulCards" && save.collections.soulCards[id]) {
        if (save.collections.equippedCards.includes(id)) {
          save.collections.equippedCards = save.collections.equippedCards.filter((card) => card !== id);
          save.collections.soulCardSchemes[save.collections.activeSoulCardScheme] = [...save.collections.equippedCards];
          return "魂卡技能已卸下";
        }
        const role = soulCardRoleKey(id);
        let cards = save.collections.equippedCards.filter((card) => card !== id);
        const sameRole = cards.filter((card) => soulCardRoleKey(card) === role);
        if (sameRole.length >= 4) cards = cards.filter((card) => card !== sameRole[0]);
        save.collections.equippedCards = normalizeSoulCardLoadout([...cards, id]);
        save.collections.soulCardSchemes[save.collections.activeSoulCardScheme] = [...save.collections.equippedCards];
      }
    }, "已更新出战配置"),
    compose: (kind) => update(() => kind === "warSouls" ? "请在战魂合成页选择1至5个副战魂" : "请在魔兽棋盘拖动同品质魔兽"),
    refineSoul: (id) => update((save) => refineWarSoul(save, id, 1)),
    buyWarSoulPack: (soulId, amountRmb) => update((save) => {
      syncCommerceDay(save);
      const definition = WAR_SOULS.find((item) => item.id === soulId);
      const pack = {
        68: { tier: 2, diamond: 680, soulCore: 20, name: "紫色战魂自选礼包", limit: 5 },
        198: { tier: 3, diamond: 1980, soulCore: 50, name: "金色战魂自选礼包", limit: 5 },
        648: { tier: 4, diamond: 6480, soulCore: 100, name: "橙色战魂自选礼包", limit: 30 }
      }[amountRmb];
      if (!definition || definition.tier !== pack.tier) return "请选择与礼包品质一致的战魂";
      const productId = `daily-${amountRmb}`;
      const purchased = save.commerce.packagePurchases[productId] || 0;
      if (purchased >= pack.limit) return `${pack.name}今日已达限购 ${pack.limit}/${pack.limit}`;
      const rewards = { diamond: pack.diamond, soulCore: pack.soulCore };
      addRewards(save, rewards);
      addWarSoul(save, soulId);
      if (!save.collections.deployedWarSoul) save.collections.deployedWarSoul = soulId;
      save.totalSpent += amountRmb;
      save.commerce.packagePurchases[productId] = purchased + 1;
      save.orders.push({ id: `soul-pack-${Date.now()}-${save.orders.length}`, productId, productName: `${pack.name}·${definition.name}`, amountRmb, rewards, createdAt: Date.now() });
      return `${definition.name} ×1 与礼包资源已模拟到账`;
    }),
    upgradeWarSoul: (id, count) => update((save) => {
      const definition = WAR_SOULS.find((item) => item.id === id);
      const soul = save.collections.warSouls[id];
      if (!definition || !soul?.count) return "尚未拥有该战魂";
      let upgraded = 0;
      let goldUsed = 0;
      let coreUsed = 0;
      while (upgraded < count && soul.level < 100) {
        const cost = warSoulUpgradeCost(soul.level, definition.tier);
        if (save.resources.gold < cost.gold || save.resources.soulCore < cost.soulCore) break;
        save.resources.gold -= cost.gold;
        save.resources.soulCore -= cost.soulCore;
        goldUsed += cost.gold;
        coreUsed += cost.soulCore;
        soul.level += 1;
        upgraded += 1;
      }
      if (!upgraded) return soul.level >= 100 ? "战魂已达到 100 级" : "金币或魂核不足";
      return `${definition.name}提升 ${upgraded} 级，消耗金币 ${goldUsed.toLocaleString()}、魂核 ${coreUsed}`;
    }),
    composeWarSoul: (id, subSoulCount) => update((save) => {
      const definition = WAR_SOULS.find((item) => item.id === id);
      const source = save.collections.warSouls[id];
      if (!definition || !source?.count) return "尚未拥有该战魂";
      if (definition.tier >= WAR_SOUL_QUALITIES.length) return "当前已是最高品质";
      if (subSoulCount < 1 || subSoulCount > 4) return "副战魂数量必须为 1 至 4（主魂加 4 个副魂共 5 个）";
      if (warSoulMaterialCount(save, id) < subSoulCount) return `保留主魂后，还需要同品质副魂 ${subSoulCount} 个`;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const rate = warSoulComposeRate(subSoulCount);
      const success = rng.next() * 10000 < rate;
      consumeWarSoulMaterials(save, id, subSoulCount);
      let message = `合成失败（${rate / 100}%）：主战魂保留，同品质副魂已消耗`;
      if (success) {
        source.count -= 1;
        const target = rng.pick(WAR_SOULS.filter((item) => item.tier === definition.tier + 1));
        const inheritedEntries = source.refineEntries.map((entry) => regradeWarSoulRefineEntry(entry, target.tier, target.tier === 6));
        const inherited = createWarSoulState({
          stage: source.stage,
          level: source.level,
          luck: source.luck,
          refineEntries: inheritedEntries
        });
        const targetCurrent = save.collections.warSouls[target.id];
        if (targetCurrent) {
          targetCurrent.count += 1;
          if (inherited.refine > targetCurrent.refine) {
            targetCurrent.level = inherited.level;
            targetCurrent.luck = inherited.luck;
            targetCurrent.refineEntries = structuredClone(inherited.refineEntries);
            syncWarSoulRefineState(targetCurrent);
          }
        } else {
          save.collections.warSouls[target.id] = inherited;
        }
        if (save.collections.deployedWarSoul === id) save.collections.deployedWarSoul = target.id;
        const gradeMessage = target.tier === 6 ? "完整继承精炼星级" : "继承数值并按新上限重算星级";
        message = `合成成功（${rate / 100}%）：获得${target.name}，${gradeMessage}`;
      }
      save.counters.warSoulComposes += 1;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return message;
    }),
    rollSoulRefine: (id, count = 1) => update((save) => refineWarSoul(save, id, count)),
    toggleSoulRefineLock: (id, entryId) => update((save) => {
      const soul = save.collections.warSouls[id];
      const entry = soul?.refineEntries.find((item) => item.id === entryId);
      if (!entry) return "该精炼属性不存在";
      entry.locked = !entry.locked;
      return entry.locked ? "已锁定该精炼属性" : "已解除精炼锁定";
    }),
    rollbackSoulAffix: (id, entryId) => update((save) => {
      const soul = save.collections.warSouls[id];
      const definition = WAR_SOULS.find((item) => item.id === id);
      if (!soul || !definition) return "尚未拥有该战魂";
      const slotCap = warSoulRefineSlotCap(definition.tier);
      if (soul.refineEntries.length < slotCap) return `精炼满 ${slotCap} 个槽位后才可回退`;
      const index = soul.refineEntries.findIndex((item) => item.id === entryId);
      if (index < 0) return "该精炼属性不存在";
      if (soul.refineEntries[index].locked) return "该精炼属性已锁定，请先解锁";
      soul.refineEntries.splice(index, 1);
      syncWarSoulRefineState(soul);
      return `已回退第 ${index + 1} 组精炼属性，可重新精炼补位`;
    }),
    rollbackUnlockedSoulRefines: (id) => update((save) => {
      const soul = save.collections.warSouls[id];
      const definition = WAR_SOULS.find((item) => item.id === id);
      if (!soul || !definition) return "尚未拥有该战魂";
      const slotCap = warSoulRefineSlotCap(definition.tier);
      if (soul.refineEntries.length < slotCap) return `精炼满 ${slotCap} 个槽位后才可批量回退`;
      const before = soul.refineEntries.length;
      soul.refineEntries = soul.refineEntries.filter((entry) => entry.locked);
      const removed = before - soul.refineEntries.length;
      if (!removed) return "全部精炼属性都已锁定";
      syncWarSoulRefineState(soul);
      return `一键回退 ${removed} 组未锁定属性，保留 ${soul.refineEntries.length} 组`;
    }),
    replaceWarSoul: (id) => update((save) => {
      const definition = WAR_SOULS.find((item) => item.id === id);
      const source = save.collections.warSouls[id];
      if (!definition || !source?.count) return "尚未拥有该战魂";
      if (definition.tier < 5) return "完美级及以上战魂才可置换";
      const materialCost = 1;
      if (warSoulReplacementMaterialCount(save, id) < materialCost) return `置换需要 ${materialCost} 个低一品质战魂`;
      consumeWarSoulReplacementMaterials(save, id, materialCost);
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const target = rng.pick(WAR_SOULS.filter((item) => item.tier === definition.tier && item.id !== id));
      source.count -= 1;
      const targetCurrent = save.collections.warSouls[target.id];
      const inherited = createWarSoulState({ level: source.level, luck: source.luck, refineEntries: structuredClone(source.refineEntries) });
      if (targetCurrent) {
        targetCurrent.count += 1;
        if (inherited.refine >= targetCurrent.refine) {
          targetCurrent.level = inherited.level;
          targetCurrent.luck = inherited.luck;
          targetCurrent.refineEntries = structuredClone(inherited.refineEntries);
          syncWarSoulRefineState(targetCurrent);
        }
      } else save.collections.warSouls[target.id] = inherited;
      if (save.collections.deployedWarSoul === id) save.collections.deployedWarSoul = target.id;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `置换完成：${definition.name}变为${target.name}，等级、精炼与幸运值保持不变`;
    }),
    buyBeastEggs: (count, kind = "green") => update((save) => {
      const egg = BEAST_EGG_TYPES.find((item) => item.id === kind) || BEAST_EGG_TYPES[0];
      if (egg.diamondPrice == null) return `${egg.name}只能通过活动或专属玩法取得`;
      const cost = count * egg.diamondPrice;
      if (save.resources.diamond < cost) return `钻石不足，需要 ${cost.toLocaleString()}`;
      save.resources.diamond -= cost;
      save.resources[egg.resource] += count;
      return `以单机体验价购买${egg.name} ×${count}`;
    }),
    fastForwardBeastEgg: () => update((save) => {
      if (save.resources.beastEgg >= 6) return "免费蛋库存达到 6 枚，自动产出已暂停";
      save.resources.beastEgg += 1;
      save.beastEggClock.lastGeneratedAt = Date.now();
      return "单机推进 6 小时：绿色魔兽蛋 +1";
    }),
    hatchBeasts: (count, kind = "green") => update((save) => {
      const egg = BEAST_EGG_TYPES.find((item) => item.id === kind) || BEAST_EGG_TYPES[0];
      if (save.resources[egg.resource] < 1) return `${egg.name}不足`;
      if (!egg.pool.length) return `${egg.name}孵化池尚未配置`;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const results: Record<string, number> = {};
      const productionWasPaused = save.resources.beastEgg >= 6;
      let actual = 0;
      while (actual < count && save.resources[egg.resource] > 0) {
        const target = weightedBeast(egg.pool, rng);
        if (!target) break;
        const hasSpace = save.collections.beastBoard.some((piece, index) => index < save.collections.beastUnlockedSlots && !piece);
        if (!hasSpace) break;
        save.resources[egg.resource] -= 1;
        if (!addBeast(save, target, rng)) {
          save.resources[egg.resource] += 1;
          break;
        }
        results[target.name] = (results[target.name] || 0) + 1;
        actual += 1;
      }
      if (!actual) return `${save.collections.beastUnlockedSlots} 个已解锁格位已满，请先合成或解锁兽栏`;
      if (egg.id === "green" && productionWasPaused && save.resources.beastEgg < 6) save.beastEggClock.lastGeneratedAt = Date.now();
      save.counters.beastHatches += actual;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `${egg.name}孵化 ${actual} 枚：${Object.entries(results).map(([name, amount]) => `${name}×${amount}`).join("、")}${actual < count ? " · 兽栏已满" : ""}`;
    }),
    moveBeastSlot: (sourceIndex, targetIndex) => update((save) => {
      const board = save.collections.beastBoard;
      if (sourceIndex === targetIndex) return "魔兽仍在原格位";
      if (sourceIndex < 0 || sourceIndex >= save.collections.beastUnlockedSlots
        || targetIndex < 0 || targetIndex >= save.collections.beastUnlockedSlots) return "只能在已解锁兽栏内移动";
      const source = board[sourceIndex];
      if (!source) return "起始格位没有魔兽";
      const target = board[targetIndex];
      board[targetIndex] = source;
      board[sourceIndex] = target || null;
      return target ? `已交换第 ${sourceIndex + 1} 格与第 ${targetIndex + 1} 格` : `已移动到第 ${targetIndex + 1} 格`;
    }),
    deployBeastFromSlot: (sourceIndex) => update((save) => deployBeastFromBoard(save, sourceIndex)),
    returnDeployedBeastToSlot: (targetIndex) => update((save) => returnDeployedBeastToBoard(save, targetIndex)),
    mergeBeastSlots: (sourceIndex, targetIndex) => update((save) => {
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const result = mergeBeastPieces(save, sourceIndex, targetIndex, rng);
      if (result.ok) save.counters.beastComposes += 1;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return result.message;
    }),
    feedBeastSpirit: (sourceIndex, targetIndex) => update((save) => {
      const spirit = save.collections.beastBoard[sourceIndex];
      const targetPiece = save.collections.beastBoard[targetIndex];
      if (spirit?.kind !== "spirit") return "请拖动经验精灵进行喂养";
      if (sourceIndex === targetIndex || !targetPiece) return "请拖到另一只魔兽上进行培养";
      if (spirit.protected) return "该经验精灵已锁定，请先解除保护";
      if ((save.collections.beastAssistPieceIds || []).includes(spirit.id)) return "助战中的经验精灵不能被喂掉，请先撤下助战位";
      const definition = BEASTS.find((item) => item.id === targetPiece.definitionId);
      const beast = targetPiece.state;
      if (!definition || !beast) return "目标魔兽数据异常";
      const gained = beastSpiritExp(spirit.tier, 1)
        + accumulatedBeastLevelExp(spirit.state || save.collections.beasts[spirit.definitionId], spirit.tier);
      removeBeastPiece(save, sourceIndex);
      beast.exp += gained;
      let levels = 0;
      while (beast.level < 100 && beast.exp >= beastExpForLevel(beast.level, definition.tier)) {
        beast.exp -= beastExpForLevel(beast.level, definition.tier);
        beast.level += 1;
        levels += 1;
      }
      syncBeastSummary(save, definition.id, beast);
      return `${definition.name}吸收${BEAST_QUALITIES[spirit.tier - 1]?.name || ""}经验精灵，普通等级经验 +${gained}${levels ? ` · 普通等级 +${levels}` : ""}`;
    }),
    autoMergeBeasts: () => update((save) => {
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      let attempts = 0;
      let successes = 0;
      while (attempts < 100) {
        const pair = BEAST_QUALITIES.filter((quality) => quality.tier <= 6).map((quality) => save.collections.beastBoard
          .map((piece, index) => ({ piece, index }))
          .filter((entry) => canAutoConsumeBeast(save, entry.piece) && entry.piece!.tier === quality.tier)
          .slice(0, 2))
          .find((entries) => entries.length === 2);
        if (!pair) break;
        const result = mergeBeastPieces(save, pair[0].index, pair[1].index, rng);
        if (!result.ok) break;
        attempts += 1;
        if (result.success) successes += 1;
      }
      save.counters.beastComposes += attempts;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return attempts ? `一键合成 ${attempts} 次：成功 ${successes}，失败 ${attempts - successes}` : "棋盘上没有可合成的同品质魔兽";
    }),
    organizeBeastBoard: () => update((save) => {
      const unlocked = save.collections.beastUnlockedSlots;
      const occupied = save.collections.beastBoard.slice(0, unlocked).filter(Boolean);
      for (let index = 0; index < unlocked; index += 1) save.collections.beastBoard[index] = occupied[index] || null;
      return "兽栏已整理：每格仍保留一只独立魔兽，仅将空格后移";
    }),
    toggleBeastPieceLock: (index) => update((save) => {
      const piece = save.collections.beastBoard[index];
      if (!piece?.definitionId) return "该格位没有可锁定的魔兽";
      piece.protected = !piece.protected;
      return piece.protected ? "魔兽已锁定，不会参与合成" : "魔兽已解除锁定";
    }),
    claimBeastSandboxPack: () => update((save) => {
      save.resources.gold += 8_000_000;
      save.resources.diamond += 18_888;
      save.resources.beastEgg += 300;
      save.resources.beastEggBlue += 40;
      save.resources.beastEggRare += 20;
      save.resources.beastEggGold += 20;
      save.resources.beastEggLegendary += 10;
      save.resources.beastEggPerfect += 6;
      save.resources.beastEggExtraordinary += 3;
      save.resources.beastEssence += 5_000;
      save.resources.beastMagicCrystal += 1_000;
      save.resources.beastDevourStone += 500;
      save.resources.beastEnhanceStone += 1_000;
      save.resources.beastBoostCharm += 60;
      save.resources.beastProtectCharm += 60;
      save.resources.beastRewindStone += 120;
      return "单机魔兽补给已领取：不发生真实支付，可重复领取";
    }),
    synthesizeExtraordinaryBeast: () => update((save) => {
      const cost = 5;
      if (save.resources.beastExtraordinaryShard < cost) {
        return `超凡魔兽碎片不足：当前 ${save.resources.beastExtraordinaryShard}/${cost}`;
      }
      const slotIndex = save.collections.beastBoard.findIndex((piece, index) => index < save.collections.beastUnlockedSlots && !piece);
      if (slotIndex < 0) return "已解锁兽栏没有空位，请先整理或合成魔兽";
      const pool = BEAST_EGG_TYPES.find((egg) => egg.id === "extraordinary")?.pool;
      if (!pool?.length) return "超凡魔兽图鉴数据异常";
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const result = weightedBeast(pool, rng);
      if (!result) return "超凡魔兽图鉴数据异常";
      save.resources.beastExtraordinaryShard -= cost;
      addBeast(save, result, rng, slotIndex);
      save.counters.beastComposes += 1;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `消耗超凡魔兽碎片 ×${cost}，合成${result.name}，已进入第 ${slotIndex + 1} 格`;
    }),
    composeBeast: (id, attempts = 1) => update((save) => {
      const definition = BEASTS.find((item) => item.id === id);
      if (!definition || !save.collections.beasts[id]?.count) return "尚未拥有该魔兽";
      if (definition.tier >= 7) return definition.tier === 7
        ? "超凡魔兽请进入详情的觉醒升星页面培养"
        : "璀璨魔兽已达到录制资料中的最高品质";
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      let completed = 0;
      let successes = 0;
      while (completed < attempts) {
        const pair = save.collections.beastBoard.map((piece, index) => ({ piece, index })).filter((entry) => canAutoConsumeBeast(save, entry.piece) && entry.piece!.tier === definition.tier).slice(0, 2);
        if (pair.length < 2) break;
        const result = mergeBeastPieces(save, pair[0].index, pair[1].index, rng);
        if (!result.ok) break;
        if (result.success) successes += 1;
        completed += 1;
      }
      if (!completed) return `需要棋盘上 2 只${BEAST_QUALITIES[definition.tier - 1].name}品质魔兽`;
      save.counters.beastComposes += completed;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `连续合成 ${completed} 次：成功 ${successes}，失败 ${completed - successes}`;
    }),
    levelBeast: () => update(() => {
      return "普通等级只能通过拖入经验精灵提升；魔兽精华请在吞噬页使用";
    }),
    rerollBeastAffixes: (id) => update((save) => {
      const located = locateBeastInstance(save, id);
      if (!located?.piece) return "尚未拥有该魔兽实例";
      const { definition, state: beast } = located;
      const cost = beastRerollCost(beast.level, definition.tier);
      if (save.resources.gold < cost) return `金币不足，需要 ${cost.toLocaleString()}`;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      save.resources.gold -= cost;
      beast.pendingAffixes = inheritBeastAffixLevels(rollBeastAffixes(definition.tier, rng), beast.affixes);
      syncBeastSummary(save, definition.id, beast);
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `${definition.name}已生成 4 条洗炼结果，被动升级等级保持不变`;
    }),
    resolveBeastAffixes: (id, accept) => update((save) => {
      const located = locateBeastInstance(save, id);
      if (!located?.piece || !located.state.pendingAffixes.length) return "当前没有待处理的洗炼结果";
      const { definition, state: beast } = located;
      if (accept) beast.affixes = beast.pendingAffixes.map((affix) => ({ ...affix }));
      beast.pendingAffixes = [];
      syncBeastSummary(save, definition.id, beast);
      return accept ? `${definition.name}已替换为新的 4 条技能` : `${definition.name}保留了原有 4 条技能`;
    }),
    upgradeBeastSkill: (id) => update((save) => {
      const located = locateBeastInstance(save, id);
      if (!located?.piece || !located.state.affixes.length) return "尚未获得可培养的魔兽技能";
      const { definition, state: beast } = located;
      const available = beast.affixes.filter((item) => (item.refineLevel || 1) < (item.refineCap || 20));
      if (!available.length) return "4 条被动技能均已达到当前等级上限";
      const cost = 8;
      if (save.resources.beastMagicCrystal < cost) return `魔晶不足，需要 ${cost}`;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const affix = rng.pick(available);
      save.resources.beastMagicCrystal -= cost;
      affix.refineLevel = Math.min(affix.refineCap || 20, (affix.refineLevel || 1) + 1);
      affix.value = Math.round(affix.value * 1.085 + (affix.percent ? 8 : 2));
      syncBeastSummary(save, definition.id, beast);
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `${definition.name}随机升级：${affix.name}升至 Lv.${affix.refineLevel}，消耗魔晶 ${cost}`;
    }),
    devourBeast: (id, count = 5) => update((save) => {
      const located = locateBeastInstance(save, id);
      if (!located?.piece) return "尚未拥有该魔兽实例";
      const { definition, state: beast } = located;
      const actual = Math.max(0, Math.min(Math.floor(count), save.resources.beastEssence));
      if (!actual) return "魔兽精华不足";
      save.resources.beastEssence -= actual;
      const gained = actual * 10;
      beast.devourExp = (beast.devourExp || 0) + gained;
      let levels = 0;
      let required = Math.ceil(100 * Math.pow(1.58, beast.devourLevel));
      while (beast.devourLevel < 20 && (beast.devourExp || 0) >= required) {
        beast.devourExp = (beast.devourExp || 0) - required;
        beast.devourLevel += 1;
        levels += 1;
        required = Math.ceil(100 * Math.pow(1.58, beast.devourLevel));
      }
      syncBeastSummary(save, definition.id, beast);
      return `${definition.name}使用魔兽精华 ×${actual}，吞噬经验 +${gained}${levels ? ` · 吞噬等级 +${levels}` : ""}`;
    }),
    devourBeastInstances: (id, materialPieceIds) => update((save) => {
      const target = locateBeastInstance(save, id);
      if (!target?.piece) return "尚未拥有目标魔兽实例";
      const requested = [...new Set(materialPieceIds)].slice(0, 5);
      const materials = requested.map((pieceId) => {
        const index = save.collections.beastBoard.findIndex((piece) => piece?.id === pieceId);
        return { index, piece: index >= 0 ? save.collections.beastBoard[index] : null };
      }).filter((entry) => entry.piece && entry.piece.id !== target.piece!.id);
      if (!materials.length) return "请选择 1 至 5 只兽栏魔兽作为吞噬材料";
      if (materials.some(({ piece }) => piece!.kind === "spirit")) return "经验精灵用于提升普通等级，不能增加吞噬等级";
      if (materials.some(({ piece }) => piece!.protected)) return "已锁定魔兽不能作为吞噬材料";
      if (materials.some(({ piece }) => (save.collections.beastAssistPieceIds || []).includes(piece!.id))) return "助战魔兽不能作为吞噬材料";
      const gained = materials.reduce((sum, { piece }) => sum + Math.round(100 * Math.pow(2, Math.max(0, piece!.tier - 1))), 0);
      materials.sort((left, right) => right.index - left.index).forEach(({ index }) => removeBeastPiece(save, index));
      target.state.devourExp = (target.state.devourExp || 0) + gained;
      let levels = 0;
      let required = Math.ceil(100 * Math.pow(1.58, target.state.devourLevel));
      while (target.state.devourLevel < 20 && (target.state.devourExp || 0) >= required) {
        target.state.devourExp = (target.state.devourExp || 0) - required;
        target.state.devourLevel += 1;
        levels += 1;
        required = Math.ceil(100 * Math.pow(1.58, target.state.devourLevel));
      }
      syncBeastSummary(save, target.definition.id, target.state);
      return `${target.definition.name}吞噬 ${materials.length} 只魔兽，吞噬经验 +${gained}${levels ? ` · 吞噬等级 +${levels}` : ""}`;
    }),
    devourBeastEssence: (id, amount) => update((save) => {
      const target = locateBeastInstance(save, id);
      if (!target?.piece) return "尚未拥有目标魔兽实例";
      const actual = Math.max(0, Math.min(Math.floor(amount), save.resources.beastEssence));
      if (!actual) return "魔兽精华不足";
      save.resources.beastEssence -= actual;
      const gained = actual * 10;
      target.state.devourExp = (target.state.devourExp || 0) + gained;
      let levels = 0;
      let required = Math.ceil(100 * Math.pow(1.58, target.state.devourLevel));
      while (target.state.devourLevel < 20 && (target.state.devourExp || 0) >= required) {
        target.state.devourExp = (target.state.devourExp || 0) - required;
        target.state.devourLevel += 1;
        levels += 1;
        required = Math.ceil(100 * Math.pow(1.58, target.state.devourLevel));
      }
      syncBeastSummary(save, target.definition.id, target.state);
      return `${target.definition.name}使用魔兽精华 ×${actual}，吞噬经验 +${gained}${levels ? ` · 吞噬等级 +${levels}` : ""}`;
    }),
    ascendBeast: (id) => update((save) => {
      const located = locateBeastInstance(save, id);
      if (!located?.piece) return "尚未拥有该魔兽实例";
      const { definition, state: beast } = located;
      const stage = beast.stage || 1;
      if (stage >= 10) return "魔兽已达到当前最高 10 阶";
      const requiredLevel = 50;
      const requiredDevour = stage + 1;
      if (beast.level < requiredLevel) return `升阶需要魔兽等级达到 ${requiredLevel} 级`;
      if (beast.devourLevel < requiredDevour) return `升阶需要吞噬等级达到 ${requiredDevour} 级`;
      beast.stage = stage + 1;
      syncBeastSummary(save, definition.id, beast);
      return `${definition.name}升阶成功：${stage}阶 → ${beast.stage}阶`;
    }),
    decomposeBeastSlot: (index) => update((save) => {
      const piece = save.collections.beastBoard[index];
      if (!piece) return "该格位为空";
      if (piece.kind === "spirit") {
        return "经验精灵不能分解或收进背包，请拖到任意魔兽上用于升级";
      }
      if ((save.collections.beastAssistPieceIds || []).includes(piece.id)) return "助战中的魔兽不能分解，请先撤下助战位";
      if (piece.protected) return "已锁定魔兽不能分解，请先解除保护";
      const definition = BEASTS.find((item) => item.id === piece.definitionId);
      if (!definition) return "魔兽图鉴数据异常";
      removeBeastPiece(save, index);
      save.resources.beastEssence += Math.max(1, definition.tier);
      return `分解${definition.name}：魔兽精华 +${definition.tier}`;
    }),
    collectBeastSpirits: () => update((save) => {
      const count = save.collections.beastBoard.filter((piece) => piece?.kind === "spirit").length;
      return count ? `当前有 ${count} 只独立经验精灵；可互相拖拽提升普通等级` : "兽栏中没有经验精灵";
    }),
    toggleBeastAssist: (id) => update((save) => {
      const exact = save.collections.beastBoard.find((piece) => piece?.id === id);
      const piece = exact || save.collections.beastBoard.find((entry) => entry?.definitionId === id);
      if (!piece) return "兽栏中没有该魔兽";
      const assists = save.collections.beastAssistPieceIds || [];
      if (assists.includes(piece.id)) {
        save.collections.beastAssistPieceIds = assists.filter((pieceId) => pieceId !== piece.id);
        syncBeastAssistDefinitions(save);
        return "已撤下助战魔兽";
      }
      if (assists.length >= 3) return "助战位已满，请先撤下一只魔兽";
      save.collections.beastAssistPieceIds = [...assists, piece.id];
      syncBeastAssistDefinitions(save);
      return `助战 ${save.collections.beastAssistPieceIds.length}/3 已更新`;
    }),
    unlockBeastSlots: () => update((save) => {
      const unlocked = save.collections.beastUnlockedSlots;
      if (unlocked >= 16) return "16 个兽栏格位已全部解锁";
      const cost = 200 * Math.pow(2, Math.max(0, (unlocked - 8) / 2));
      if (save.resources.diamond < cost) return `解锁下一组格位需要 ${cost.toLocaleString()} 钻石`;
      save.resources.diamond -= cost;
      save.collections.beastUnlockedSlots = Math.min(16, unlocked + 2);
      return `兽栏扩建完成：已解锁 ${save.collections.beastUnlockedSlots}/16`;
    }),
    awakenBeast: (id, materialPieceIds) => update((save) => {
      const located = locateBeastInstance(save, id);
      if (!located?.piece) return "尚未拥有该魔兽实例";
      const { definition, state: beast, piece } = located;
      if (definition.tier < 7) return "超凡级魔兽才可继续觉醒";
      const evolutionId = BEAST_EVOLUTIONS[definition.id];
      if (definition.tier >= 8) return "当前璀璨魔兽已达到录制资料中的觉醒上限";
      if (beast.stars > 0 && (beast.enhanceLevel || 0) < 10) return `继续觉醒前需强化至 +10，当前 +${beast.enhanceLevel || 0}`;
      const materialCount = beastAwakenMaterialCount(beast.stars);
      const requested = [...new Set(materialPieceIds)].slice(0, materialCount);
      if (requested.length < materialCount) return `本次觉醒需要 ${materialCount} 只其他超凡魔兽`;
      const materials = requested.map((pieceId) => {
        const index = save.collections.beastBoard.findIndex((entry) => entry?.id === pieceId);
        return { index, piece: index >= 0 ? save.collections.beastBoard[index] : null };
      });
      if (materials.some(({ piece: material }) => !material || material.id === piece.id || material.kind === "spirit" || material.tier !== 7)) {
        return "觉醒材料必须是兽栏中的其他超凡魔兽";
      }
      if (materials.some(({ piece: material }) => material!.protected)) return "已锁定的超凡魔兽不能作为觉醒材料";
      if (materials.some(({ piece: material }) => (save.collections.beastAssistPieceIds || []).includes(material!.id))) return "助战中的超凡魔兽不能作为觉醒材料";
      const evolvedDefinition = definition.tier === 7 && beast.stars >= 3
        ? BEASTS.find((item) => item.id === evolutionId)
        : undefined;
      if (definition.tier === 7 && beast.stars >= 3 && !evolvedDefinition) return "该超凡魔兽的璀璨觉醒路线待实机补证";
      materials.sort((left, right) => right.index - left.index).forEach(({ index }) => removeBeastPiece(save, index));
      if (evolvedDefinition) {
        const existing = save.collections.beasts[evolvedDefinition.id];
        const firstDiscovery = !existing?.discovered;
        const previousSummary = save.collections.beasts[definition.id];
        if (previousSummary) previousSummary.count = Math.max(0, previousSummary.count - 1);
        beast.stars = 0;
        beast.pendingAffixes = [];
        beast.enhanceLevel = 0;
        beast.enhanceBeforeAttempt = 0;
        beast.rewindAvailable = false;
        piece.definitionId = evolvedDefinition.id;
        piece.tier = evolvedDefinition.tier;
        piece.kind = "beast";
        if (existing) {
          existing.count += 1;
          existing.discovered = true;
          syncBeastSummary(save, evolvedDefinition.id, beast);
        } else save.collections.beasts[evolvedDefinition.id] = createBeastState(evolvedDefinition.tier, new GameRng(save.rngSeed, save.rngDraws), { ...structuredClone(beast), count: 1, discovered: true });
        if (firstDiscovery) save.resources.diamond += evolvedDefinition.codexReward;
        if (located.deployed) save.collections.deployedBeast = evolvedDefinition.id;
        syncBeastAssistDefinitions(save);
        return `${definition.name}消耗 ${materialCount} 只超凡魔兽觉醒成功（100%）：品质提升为${evolvedDefinition.name}，等级、升阶、吞噬与被动完整继承`;
      }
      beast.stars += 1;
      beast.enhanceLevel = 0;
      beast.enhanceBeforeAttempt = 0;
      beast.rewindAvailable = false;
      syncBeastSummary(save, definition.id, beast);
      const codexForm = BEASTS.filter((item) => item.name === definition.name && item.tier === 7 && item.mergeEligible === false)
        .sort((left, right) => left.artIndex - right.artIndex)[beast.stars - 1];
      if (codexForm && !save.collections.beasts[codexForm.id]?.discovered) {
        save.collections.beasts[codexForm.id] = {
          ...structuredClone(beast), count: 0, discovered: true, pendingAffixes: []
        };
        save.resources.diamond += codexForm.codexReward;
      }
      return `${definition.name}消耗 ${materialCount} 只超凡魔兽觉醒成功（100%）：升至 ${beast.stars} 星，升阶与被动完整继承`;
    }),
    strengthenBeast: (id, useBoost = false, useProtect = false) => update((save) => {
      const located = locateBeastInstance(save, id);
      if (!located?.piece) return "尚未拥有该魔兽实例";
      const { definition, state: beast } = located;
      if (definition.tier < 7 || beast.stars < 1) return "超凡 1 星后才可强化";
      const current = beast.enhanceLevel || 0;
      if (current >= 10) return "强化已达到 +10";
      const stoneCost = Math.max(1, Math.ceil(Math.pow(1.28, current)));
      if (save.resources.beastEnhanceStone < stoneCost) return `强化石不足，需要 ${stoneCost}`;
      if (useBoost && save.resources.beastBoostCharm < 1) return "增率符不足";
      if (useProtect && save.resources.beastProtectCharm < 1) return "保护符不足";
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const baseRate = Math.max(2000, 9000 - current * 700);
      const rate = Math.min(10000, baseRate + (useBoost ? 2000 : 0));
      save.resources.beastEnhanceStone -= stoneCost;
      if (useBoost) save.resources.beastBoostCharm -= 1;
      if (useProtect) save.resources.beastProtectCharm -= 1;
      beast.enhanceBeforeAttempt = current;
      const success = rng.next() * 10000 < rate;
      if (success) {
        beast.enhanceLevel = current + 1;
        beast.rewindAvailable = false;
      } else if (useProtect) {
        beast.rewindAvailable = false;
      } else {
        const loss = Math.min(current, rng.int(1, 3));
        beast.enhanceLevel = Math.max(0, current - loss);
        beast.rewindAvailable = loss > 0;
      }
      syncBeastSummary(save, definition.id, beast);
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return success
        ? `强化成功（${rate / 100}%）：+${current} → +${beast.enhanceLevel}`
        : useProtect
          ? `强化失败（${rate / 100}%）：保护符生效，仍为 +${current}`
          : `强化失败（${rate / 100}%）：+${current} → +${beast.enhanceLevel}${beast.rewindAvailable ? "，可回溯" : ""}`;
    }),
    rewindBeastStrength: (id) => update((save) => {
      const located = locateBeastInstance(save, id);
      if (!located?.piece) return "尚未拥有该魔兽实例";
      const { definition, state: beast } = located;
      if (!beast.rewindAvailable) return "当前没有可回溯的强化失败记录";
      const target = beast.enhanceBeforeAttempt || 0;
      const cost = Math.max(1, target * 2);
      if (save.resources.beastRewindStone < cost) return `回溯需要回溯石 ${cost}`;
      save.resources.beastRewindStone -= cost;
      beast.enhanceLevel = target;
      beast.rewindAvailable = false;
      syncBeastSummary(save, definition.id, beast);
      return `${definition.name}已回溯至强化 +${target}`;
    }),
    claimBattlePetPack: () => update((save) => {
      save.resources.gold += 5_000_000;
      save.resources.petSoulGrass += 500;
      save.resources.petSoulFlower += 200;
      save.resources.petSoulFruit += 80;
      return "单机战宠补给已领取：炼魂草×500 · 炼魂花×200 · 传说炼魂果×80";
    }),
    trainBattlePet: (count) => update((save) => {
      const pet = save.growthSystems.battlePet;
      if (pet.level >= 200) return "战宠已达到当前 200 级上限";
      if (save.resources.petSoulGrass < count) return `炼魂草不足，需要 ${count}`;
      save.resources.petSoulGrass -= count;
      pet.exp += count * 60;
      const before = pet.level;
      while (pet.level < 200) {
        const needed = battlePetExpForLevel(pet.level);
        if (pet.exp < needed) break;
        pet.exp -= needed;
        pet.level += 1;
      }
      return pet.level > before
        ? `战宠培养 ${count} 次：等级 ${before}→${pet.level}`
        : `战宠培养 ${count} 次：经验 +${count * 60}`;
    }),
    mutateBattlePet: (material, slot) => update((save) => {
      const pet = save.growthSystems.battlePet;
      if (slot < 0 || slot >= pet.skills.length) return "请选择要突变的技能槽";
      const resourceId = material === "grass" ? "petSoulGrass" : material === "flower" ? "petSoulFlower" : "petSoulFruit";
      if (save.resources[resourceId] < 1) return `${material === "grass" ? "炼魂草" : material === "flower" ? "炼魂花" : "传说炼魂果"}不足`;
      save.resources[resourceId] -= 1;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const rates = battlePetMutationRates(material);
      let roll = rng.next() * 100;
      let quality = 0;
      for (let index = 0; index < rates.length; index += 1) {
        roll -= rates[index];
        if (roll < 0) { quality = index + 1; break; }
      }
      if (!quality) {
        pet.pendingSkill = undefined;
        pet.lastMutation = "本次未触发突变";
      } else {
        const category = quality >= 5
          ? rng.pick<BattlePetSkillState["category"]>(["属性强化", "属性抗性", "特殊效果", "职业专属"])
          : rng.pick<BattlePetSkillState["category"]>(["属性强化", "属性抗性", "特殊效果"]);
        const statPool: Record<BattlePetSkillState["category"], BattlePetSkillStat[]> = {
          属性强化: ["crit", "dodge", "combo", "lifesteal", "stun", "counter"],
          属性抗性: ["antiCrit", "antiDodge", "antiCombo", "antiLifesteal", "antiStun", "antiCounter"],
          特殊效果: ["critDamage", "tenacity", "healing", "recovery", "damageBonus", "damageReduction"],
          职业专属: ["crit", "dodge", "combo", "lifesteal", "stun", "counter"]
        };
        const stat = rng.pick(statPool[category]);
        const statName: Record<BattlePetSkillStat, string> = {
          crit: "暴击", dodge: "闪避", combo: "连击", lifesteal: "吸血", stun: "击晕", counter: "反击",
          antiCrit: "暴击抗性", antiDodge: "闪避抗性", antiCombo: "连击抗性", antiLifesteal: "吸血抗性", antiStun: "击晕抗性", antiCounter: "反击抗性",
          critDamage: "暴伤", tenacity: "坚毅", healing: "疗伤", recovery: "恢复", damageBonus: "增伤", damageReduction: "减伤"
        };
        const suffix = category === "属性抗性" ? "抗性" : category === "职业专属" ? "专精" : category === "特殊效果" ? "增幅" : "强化";
        pet.pendingSkill = {
          id: `pet-skill-${Date.now()}-${rng.draws}`,
          slot,
          name: `${statName[stat]}${suffix}`,
          category,
          stat,
          quality: quality as BattlePetMutationQuality,
          value: 70 + quality * 55
        };
        pet.lastMutation = `${BATTLE_PET_MUTATION_QUALITY_NAMES[quality - 1]} · ${pet.pendingSkill.name}`;
      }
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return pet.pendingSkill ? `战宠突变：获得${pet.lastMutation}，请选择保留或替换` : "战宠突变：本次未获得技能，材料已消耗";
    }),
    resolveBattlePetMutation: (accept) => update((save) => {
      const pet = save.growthSystems.battlePet;
      const pending = pet.pendingSkill;
      if (!pending) return "当前没有待处理的突变技能";
      if (accept) pet.skills[pending.slot] = pending;
      pet.pendingSkill = undefined;
      return accept ? `已替换第 ${pending.slot + 1} 个战宠技能：${pending.name}` : "已保留原战宠技能";
    }),
    awakenBattlePet: () => update((save) => {
      const pet = save.growthSystems.battlePet;
      if (pet.awakeningQuality >= 6) return "战宠已经完全觉醒";
      if (save.resources.petSoulFruit < 1) return "战宠觉醒需要传说炼魂果 ×1";
      save.resources.petSoulFruit -= 1;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const rates = battlePetAwakenRates(pet.awakeningLuck);
      let roll = rng.next() * 100;
      let result = rates.length;
      for (let index = 0; index < rates.length; index += 1) {
        roll -= rates[index];
        if (roll < 0) { result = index + 1; break; }
      }
      const before = pet.awakeningQuality;
      if (result > before) {
        pet.awakeningQuality = result;
        pet.awakeningLuck = 0;
        pet.lastAwakening = `品质提升为${BATTLE_PET_AWAKEN_QUALITY_NAMES[result - 1]}`;
      } else {
        pet.awakeningLuck = Math.min(2500, pet.awakeningLuck + 100);
        pet.lastAwakening = `获得${BATTLE_PET_AWAKEN_QUALITY_NAMES[result - 1]}结果，未超过当前品质；幸运 +100`;
      }
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `战宠觉醒：${pet.lastAwakening}`;
    }),
    drawMount: (mode, count) => update((save) => {
      const mountState = save.growthSystems.mount;
      const free = mode === "normal" && count === 1 && mountState.freeRefreshDay !== save.day;
      const goldCost = mode === "normal" ? (free ? 0 : count * 5000) : 0;
      const whipCost = mode === "advanced" ? count : 0;
      if (save.resources.gold < goldCost) return `普通刷新需要金币 ${goldCost.toLocaleString()}`;
      if (save.resources.mountWhip < whipCost) return `高级刷新需要驯兽鞭 ${whipCost}`;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      save.resources.gold -= goldCost;
      save.resources.mountWhip -= whipCost;
      if (free) mountState.freeRefreshDay = save.day;
      const results: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const quality = mountState.pity >= 49 ? 3 : rollMountQuality(mode, rng);
        mountState.pity = quality >= 3 ? 0 : mountState.pity + 1;
        const definition = rng.pick(MOUNTS.filter((item) => item.quality === quality));
        const mount: MountInstance = {
          id: `mount-${Date.now()}-${rng.draws}-${index}`,
          definitionId: definition.id,
          quality,
          level: 1,
          attributes: []
        };
        mount.attributes.push(rollMountAttribute(mount, rng));
        mountState.mounts.push(mount);
        mountState.activeId ||= mount.id;
        results.push(definition.name);
      }
      const overflow = trimMountStable(save);
      if (!mountState.mounts.some((mount) => mount.id === mountState.activeId)) mountState.activeId = mountState.mounts.at(-1)?.id;
      mountState.lastDraw = results.slice(-10);
      save.counters.mountDraws += count;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `${mode === "normal" ? "普通" : "高级"}刷新：${results.join("、")}${overflow.count ? ` · 马厩溢出自动遣散 ${overflow.count} 只，返还驯兽鞭 ${overflow.whip}` : ""}`;
    }),
    selectMount: (id) => update((save) => {
      const mount = save.growthSystems.mount.mounts.find((item) => item.id === id);
      if (!mount) return "该坐骑不在马厩中";
      save.growthSystems.mount.activeId = id;
      const definition = MOUNTS.find((item) => item.id === mount.definitionId)!;
      return `${definition.name}已设为当前坐骑`;
    }),
    upgradeMount: (id, count) => update((save) => {
      const mount = save.growthSystems.mount.mounts.find((item) => item.id === id);
      const definition = mount ? MOUNTS.find((item) => item.id === mount.definitionId) : undefined;
      if (!mount || !definition) return "该坐骑不在马厩中";
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      let upgraded = 0;
      const changes: string[] = [];
      while (upgraded < count && mount.level < 80) {
        const cost = mountUpgradeCost(mount.level, mount.quality);
        if (save.resources.food < cost.food || save.resources.steak < cost.steak || save.resources.gold < cost.gold) break;
        save.resources.food -= cost.food;
        save.resources.steak -= cost.steak;
        save.resources.gold -= cost.gold;
        const rolled = rollMountAttribute(mount, rng);
        const existing = mount.attributes.find((item) => item.stat === rolled.stat);
        if (existing) existing.value += rolled.value;
        else mount.attributes.push(rolled);
        mount.level += 1;
        upgraded += 1;
        changes.push(`${rolled.name}+${(rolled.value / 100).toFixed(2)}%`);
      }
      save.counters.mountUpgrades += upgraded;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return upgraded ? `${definition.name}提升 ${upgraded} 级：${changes.slice(-3).join("、")}` : mount.level >= 80 ? "坐骑已满 80 级" : "食物、肉排或金币不足";
    }),
    recycleDuplicateMounts: () => update((save) => {
      const stable = save.growthSystems.mount;
      const grouped = stable.mounts.reduce<Record<string, MountInstance[]>>((groups, mount) => {
        (groups[mount.definitionId] ||= []).push(mount);
        return groups;
      }, {});
      const recycled = Object.values(grouped).flatMap((mounts) => {
        const ordered = [...mounts].sort((left, right) => {
          if (left.id === stable.activeId) return -1;
          if (right.id === stable.activeId) return 1;
          return mountKeepScore(right) - mountKeepScore(left);
        });
        return ordered.slice(1);
      });
      if (!recycled.length) return "当前没有重复坐骑";
      const recycledIds = new Set(recycled.map((mount) => mount.id));
      stable.mounts = stable.mounts.filter((mount) => !recycledIds.has(mount.id));
      const rewards = recycleMountInstances(save, recycled);
      return `遣散重复坐骑 ${recycled.length} 只：驯兽鞭 +${rewards.whip}、食物 +${rewards.food}、肉排 +${rewards.steak}、金币 +${rewards.gold.toLocaleString()}`;
    }),
    selectWarEagleSkin: (stat) => update((save) => {
      const skin = WAR_EAGLE_SKINS.find((item) => item.id === stat);
      if (!skin) return "战鹰皮肤数据异常";
      const eagle = save.growthSystems.warEagle;
      if (!eagle.unlockedSkins.includes(stat)) {
        const cost = 300;
        if (save.resources.diamond < cost) return `解锁${skin.name}需要钻石 ${cost}`;
        save.resources.diamond -= cost;
        eagle.unlockedSkins.push(stat);
        eagle.levels[stat] = 1;
        eagle.activeSkin = stat;
        return `已解锁并启用${skin.name}`;
      }
      eagle.activeSkin = stat;
      return `${skin.name}已启用，双属性立即生效`;
    }),
    upgradeWarEagle: (count) => update((save) => {
      const eagle = save.growthSystems.warEagle;
      const skin = WAR_EAGLE_SKINS.find((item) => item.id === eagle.activeSkin);
      if (!skin || !eagle.unlockedSkins.includes(eagle.activeSkin)) return "请先选择已解锁的战鹰皮肤";
      let level = eagle.levels[eagle.activeSkin] || 1;
      let upgraded = 0;
      while (upgraded < count && level < 80) {
        const cost = warEagleUpgradeCost(level);
        if (save.resources.eagleFeather < cost.feathers || save.resources.gold < cost.gold) break;
        save.resources.eagleFeather -= cost.feathers;
        save.resources.gold -= cost.gold;
        level += 1;
        upgraded += 1;
      }
      eagle.levels[eagle.activeSkin] = level;
      return upgraded
        ? `${skin.name}提升 ${upgraded} 级，当前 Lv.${level}`
        : level >= 80 ? "当前战鹰皮肤已满 80 级" : "鹰羽或金币不足";
    }),
    drawRunes: (count) => update((save) => {
      const cost = count * 10;
      if (save.resources.runeShard < cost) return `符文碎片不足，需要 ${cost}`;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      save.resources.runeShard -= cost;
      const results: string[] = [];
      const grantDirect = (kind: "green" | "blue" | "orange" | "wild") => {
        if (kind === "wild") {
          save.resources.wildRune += 1;
          results.push("百变符文");
          return;
        }
        const rune = rng.pick(RUNES.filter((item) => item.tier === (kind === "green" ? 1 : kind === "blue" ? 2 : 3)));
        save.growthSystems.runes.inventory[rune.id] = (save.growthSystems.runes.inventory[rune.id] || 0) + 1;
        save.growthSystems.runes.levels[rune.id] ||= 1;
        results.push(rune.name);
      };
      for (let index = 0; index < count; index += 1) {
        const rolled = rollRuneDrawItem(rng);
        if (rolled.id.startsWith("multi-")) {
          const amount = Number(rolled.id.slice(-1));
          results.push(rolled.name);
          for (let bonus = 0; bonus < amount; bonus += 1) {
            const directRoll = rng.next() * 8963;
            grantDirect(directRoll < 553 ? "orange" : directRoll < 5394 ? "green" : directRoll < 8852 ? "blue" : "wild");
          }
        } else grantDirect(rolled.id as "green" | "blue" | "orange" | "wild");
      }
      save.growthSystems.runes.lastDraw = results.slice(-12);
      save.counters.runeDraws += count;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `符文抽取完成：${results.slice(-8).join("、")}`;
    }),
    equipRune: (id) => update((save) => {
      if (!save.growthSystems.runes.inventory[id]) return "尚未获得该符文";
      const equipped = save.growthSystems.runes.equipped;
      if (equipped.includes(id)) {
        save.growthSystems.runes.equipped = equipped.filter((item) => item !== id);
        return "符文已卸下";
      }
      save.growthSystems.runes.equipped = [...equipped.slice(-2), id];
      return `${RUNES.find((item) => item.id === id)?.name || "符文"}已装配`;
    }),
    upgradeRune: (id) => update((save) => {
      const rune = RUNES.find((item) => item.id === id);
      const level = save.growthSystems.runes.levels[id] || 1;
      const amount = save.growthSystems.runes.inventory[id] || 0;
      if (!rune || !amount) return "尚未获得该符文";
      if (level >= 20) return "符文已满 20 级";
      const cost = runeUpgradeCost(level);
      if (runeMaterialCount(save, id) < cost.copies || save.resources.runeShard < cost.shards) return `升级需要同等级副符文 ${cost.copies} 与碎片 ${cost.shards}`;
      consumeRuneMaterials(save, id, cost.copies);
      save.resources.runeShard -= cost.shards;
      save.growthSystems.runes.levels[id] = level + 1;
      save.counters.runeUpgrades += 1;
      return `${rune.name}升至 Lv.${level + 1}`;
    }),
    buyGems: (count) => update((save) => {
      if (save.resources.gemTicket < count) return `宝石券不足，需要 ${count}`;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      save.resources.gemTicket -= count;
      const results: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const gem = GEM_COLORS[rng.int(0, 3)];
        const key = gemKey(gem.id, 1);
        save.growthSystems.gems.inventory[key] = (save.growthSystems.gems.inventory[key] || 0) + 1;
        results.push(gem.name);
      }
      save.growthSystems.gems.lastResult = results.join("、");
      save.counters.gemPurchases += count;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `宝石袋开启：${results.join("、")}`;
    }),
    composeGem: (level, targetColor, mode = "single") => update((save) => {
      if (level < 1 || level >= 8) return "当前等级无法继续合成";
      const required = level === 6 ? 2 : 3;
      const keys = GEM_COLORS.map((gem) => gemKey(gem.id, level));
      const available = (key: string) => {
        const color = key.split("-")[0] as GemColor;
        const reserved = Object.values(save.growthSystems.gems.sockets)
          .filter((socket) => socket?.color === color && socket.level === level).length;
        return Math.max(0, (save.growthSystems.gems.inventory[key] || 0) - reserved);
      };
      const total = keys.reduce((sum, key) => sum + available(key), 0);
      if (total < required) return `需要 ${required} 颗 ${level} 级宝石`;
      const attempts = mode === "max" ? Math.min(1000, Math.floor(total / required)) : 1;
      let remaining = required * attempts;
      keys.sort((a, b) => available(b) - available(a)).forEach((key) => {
        const used = Math.min(remaining, available(key));
        save.growthSystems.gems.inventory[key] = (save.growthSystems.gems.inventory[key] || 0) - used;
        remaining -= used;
      });
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const results: Partial<Record<GemColor, number>> = {};
      for (let index = 0; index < attempts; index += 1) {
        const resultColor = level >= 6 ? targetColor : GEM_COLORS[rng.int(0, 3)].id;
        const resultKey = gemKey(resultColor, level + 1);
        save.growthSystems.gems.inventory[resultKey] = (save.growthSystems.gems.inventory[resultKey] || 0) + 1;
        results[resultColor] = (results[resultColor] || 0) + 1;
      }
      const resultText = GEM_COLORS.filter((gem) => results[gem.id]).map((gem) => `${gem.name}×${results[gem.id]}`).join("、");
      save.growthSystems.gems.selectedLevel = Math.min(8, level + 1);
      save.growthSystems.gems.lastResult = `${attempts}次合成：${level + 1}级 ${resultText}`;
      save.counters.gemComposes += attempts;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `合成成功 ${attempts} 次：${resultText}`;
    }),
    socketGem: (slot, color, level) => update((save) => {
      const laneColor = slot.match(/^(red|blue|orange|green)-[0-4]$/)?.[1] as GemColor | undefined;
      if (laneColor && laneColor !== color) return "该轨道只能镶嵌同色宝石";
      const key = gemKey(color, level);
      const reservedElsewhere = Object.entries(save.growthSystems.gems.sockets)
        .filter(([socketSlot, socket]) => socketSlot !== slot && socket?.color === color && socket.level === level).length;
      if ((save.growthSystems.gems.inventory[key] || 0) <= reservedElsewhere) return "没有可用的该等级宝石";
      save.growthSystems.gems.sockets[slot] = { color, level };
      const name = GEM_COLORS.find((item) => item.id === color)!.name;
      const lanePosition = laneColor ? `${GEM_COLORS.find((item) => item.id === laneColor)?.name}第${Number(slot.at(-1)) + 1}槽` : SLOTS.find((item) => item.id === slot)?.name || "宝石槽";
      return `${level}级${name}已镶入${lanePosition}`;
    }),
    removeGem: (slot) => update((save) => {
      if (!save.growthSystems.gems.sockets[slot]) return "该部位没有宝石";
      delete save.growthSystems.gems.sockets[slot];
      return "宝石已卸下并返回库存";
    }),
    autoSocketGems: () => update((save) => {
      const count = fillBestGemSockets(save);
      return count ? `已按“${BUILD_PLANS.find((item) => item.id === save.buildPlan)?.name}”一键镶嵌 ${count} 颗最优宝石` : "库存中没有可镶嵌宝石";
    }),
    removeAllGems: () => update((save) => {
      const count = Object.keys(save.growthSystems.gems.sockets).length;
      save.growthSystems.gems.sockets = {};
      return count ? `已一键卸下 ${count} 颗宝石` : "当前没有已镶嵌宝石";
    }),
    exchangeGem: (level, fromColor, targetColor) => update((save) => {
      if (fromColor === targetColor) return "请选择不同颜色进行置换";
      const sourceKey = gemKey(fromColor, level);
      const targetKey = gemKey(targetColor, level);
      const reserved = Object.values(save.growthSystems.gems.sockets)
        .filter((socket) => socket?.color === fromColor && socket.level === level).length;
      if ((save.growthSystems.gems.inventory[sourceKey] || 0) <= reserved) return "没有可置换的未镶嵌宝石";
      const goldCost = Math.ceil(500 * Math.pow(1.7, Math.max(0, level - 1)));
      if (save.resources.gold < goldCost) return `置换需要金币 ${goldCost.toLocaleString()}`;
      save.resources.gold -= goldCost;
      save.growthSystems.gems.inventory[sourceKey] -= 1;
      save.growthSystems.gems.inventory[targetKey] = (save.growthSystems.gems.inventory[targetKey] || 0) + 1;
      const sourceName = GEM_COLORS.find((gem) => gem.id === fromColor)!.name;
      const targetName = GEM_COLORS.find((gem) => gem.id === targetColor)!.name;
      save.growthSystems.gems.lastResult = `${level}级${sourceName}置换为${targetName}`;
      return `置换成功：${level}级${targetName}`;
    }),
    forgeArtifacts: (count) => update((save) => {
      const forge = save.growthSystems.artifact;
      const totalCost = Array.from({ length: count }, (_, index) => artifactForgeCost(Math.min(40, forge.forgeLevel + Math.floor((forge.forgeExp + index) / 5)))).reduce((sum, value) => sum + value, 0);
      if (save.resources.artifactOre < totalCost) return `神器锻造石不足，需要 ${totalCost}`;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      save.resources.artifactOre -= totalCost;
      const results: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const weights = artifactForgeWeights(forge.forgeLevel);
        let roll = rng.int(0, 9999);
        let qualityIndex = 0;
        for (; qualityIndex < weights.length; qualityIndex += 1) { roll -= weights[qualityIndex]; if (roll < 0) break; }
        if (forge.pity >= 29) qualityIndex = Math.max(2, qualityIndex);
        const artifact = ARTIFACTS[Math.min(ARTIFACTS.length - 1, qualityIndex)];
        const current = forge.owned[artifact.id];
        forge.owned[artifact.id] = current ? { ...current, count: current.count + 1 } : { count: 1, level: 1 };
        forge.equipped ||= artifact.id;
        forge.pity = artifact.quality >= 4 ? 0 : forge.pity + 1;
        forge.forgeExp += 1;
        if (forge.forgeExp >= 5 && forge.forgeLevel < 40) { forge.forgeExp -= 5; forge.forgeLevel += 1; }
        results.push(artifact.name);
      }
      forge.lastForge = results;
      save.counters.artifactForges += count;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `锻造完成：${results.join("、")}`;
    }),
    equipArtifact: (id) => update((save) => {
      if (!save.growthSystems.artifact.owned[id]?.count) return "尚未获得该神器";
      save.growthSystems.artifact.equipped = id;
      return `${ARTIFACTS.find((item) => item.id === id)?.name || "神器"}已出战`;
    }),
    upgradeArtifact: (id) => update((save) => {
      const artifact = ARTIFACTS.find((item) => item.id === id);
      const state = save.growthSystems.artifact.owned[id];
      if (!artifact || !state) return "尚未获得该神器";
      if (state.level >= ARTIFACT_MAX_LEVEL) return `神器已达到最高 ${ARTIFACT_MAX_LEVEL} 阶`;
      const goldCost = Math.ceil(18000 * Math.pow(1.22, state.level - 1) / 100) * 100;
      if (artifactMaterialCount(save, id) < 2 || save.resources.gold < goldCost) return `升阶需要任意同阶神器素材 2 件与金币 ${goldCost.toLocaleString()}`;
      consumeArtifactMaterials(save, id, 2);
      state.level += 1;
      save.resources.gold -= goldCost;
      return `${artifact.name}升至 ${state.level} 阶`;
    }),
    trainFlag: (count) => update((save) => {
      const flag = save.growthSystems.flag;
      if (flag.level >= 120) return "战旗已满 120 级";
      const attempts = Math.min(count, save.resources.flagEssence);
      if (!attempts) return "战旗精华不足";
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      let successes = 0;
      let totalExp = 0;
      for (let index = 0; index < attempts && flag.level < 120; index += 1) {
        save.resources.flagEssence -= 1;
        flag.attempts += 1;
        flag.lastSuccess = rng.next() * 10000 < battleFlagSuccessRate(flag.level);
        flag.lastGain = flag.lastSuccess ? rollBattleFlagExp(rng) : 0;
        if (flag.lastSuccess) {
          successes += 1;
          totalExp += flag.lastGain;
          flag.progress += flag.lastGain;
          while (flag.progress >= battleFlagRequiredExp(flag.level) && flag.level < 120) {
            flag.progress -= battleFlagRequiredExp(flag.level);
            flag.level += 1;
          }
        }
      }
      save.counters.flagAttempts += attempts;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `战旗训练 ${attempts} 次：成功 ${successes} 次，共获得 ${totalExp} 进度`;
    }),
    setFlagStat: (stat) => update((save) => {
      save.growthSystems.flag.selectedStat = stat;
      return `战旗主属性切换为${stat === "crit" ? "暴击" : stat === "dodge" ? "闪避" : stat === "combo" ? "连击" : stat === "lifesteal" ? "吸血" : stat === "stun" ? "击晕" : "反击"}`;
    }),
    pullTerritory: (offerId) => update((save) => {
      const territory = save.growthSystems.territory;
      const offer = territory.offers.find((item) => item.id === offerId);
      if (!offer) return "该资源点已经刷新";
      if (territory.pullsRemaining <= 0) return "今日领地拉取次数已用完";
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      addRewards(save, offer.reward);
      territory.pullsRemaining -= 1;
      territory.reputation += offer.quality;
      territory.lastClaim = structuredClone(offer);
      if (save.eventDrops.day !== save.day) save.eventDrops = { day: save.day, eggHammers: 0, treasuryKeys: 0 };
      if (save.eventDrops.treasuryKeys < 2 && rng.next() < 0.25) {
        save.resources.treasuryKey += 1;
        save.eventDrops.treasuryKeys += 1;
      }
      if (rng.next() < 0.5) save.resources.goldenSnakeToken += 1;
      const replacement = generateTerritoryOffers(rng, save.player.level)[0];
      territory.offers = territory.offers.map((item) => item.id === offerId ? replacement : item);
      save.counters.territoryPulls += 1;
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `领地拉取：${offer.title}资源已入库`;
    }),
    refreshTerritory: () => update((save) => {
      const territory = save.growthSystems.territory;
      if (territory.refreshesRemaining <= 0 && save.resources.diamond < 20) return "免费刷新已用完，再次刷新需要 20 钻石";
      if (territory.refreshesRemaining > 0) territory.refreshesRemaining -= 1;
      else save.resources.diamond -= 20;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      territory.offers = generateTerritoryOffers(rng, save.player.level);
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return "领地资源点已刷新";
    }),
    selectTurntablePool: (pool) => update((save) => {
      const turntable = save.growthSystems.turntable;
      if (turntable.pool === pool) return `已选择奖池${pool === 1 ? "一" : "二"}`;
      if (turntable.spinsToday > 0) return "今日已开始抽取，明日可切换奖池";
      turntable.pool = pool;
      return `已切换至奖池${pool === 1 ? "一" : "二"}`;
    }),
    spinTurntable: (pool) => update((save) => {
      const turntable = save.growthSystems.turntable;
      if (turntable.pool !== pool) {
        if (turntable.spinsToday > 0) return "今日已选择奖池，明日可切换";
        turntable.pool = pool;
      }
      if (!turntable.remaining.length) return "今日 9 项奖励已经全部获得";
      const cost = turntable.spinsToday === 0 ? 0 : 30;
      if (save.resources.diamond < cost) return `本次转盘需要 ${cost} 钻石`;
      save.resources.diamond -= cost;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const reward = rollTurntableReward(save, pool, rng);
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `每日转盘：获得 ${reward}`;
    }),
    spinAllTurntable: (pool) => update((save) => {
      const turntable = save.growthSystems.turntable;
      if (turntable.pool !== pool) {
        if (turntable.spinsToday > 0) return "今日已选择奖池，明日可切换";
        turntable.pool = pool;
      }
      if (!turntable.remaining.length) return "今日 9 项奖励已经全部获得";
      const totalCost = 30 * Math.max(0, turntable.remaining.length - (turntable.spinsToday === 0 ? 1 : 0));
      if (save.resources.diamond < totalCost) return `一键转完需要 ${totalCost} 钻石`;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const rewards: string[] = [];
      while (turntable.remaining.length) {
        const cost = turntable.spinsToday === 0 ? 0 : 30;
        save.resources.diamond -= cost;
        rewards.push(rollTurntableReward(save, pool, rng));
      }
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      return `转盘托管完成：${rewards.length} 项奖励已全部领取`;
    }),
    redeemEvent: (event, choice) => update((save) => {
      if (event === "hammer") {
        if (save.resources.eggHammer < 1) return "一锤定音道具不足，可通过开箱或活动补给获得";
        save.resources.eggHammer -= 1;
        if (choice === 1) addRewards(save, { beastEgg: 3 });
        else addRewards(save, { beastDevourStone: 25, beastEssence: 30 });
        return choice === 1 ? "定点砸蛋：魔兽蛋 +3" : "定点砸蛋：吞噬晶石 +25 · 魔兽精华 +30";
      }
      if (event === "treasury") {
        if (save.resources.treasuryKey < 1) return "国王宝库钥匙不足";
        save.resources.treasuryKey -= 1;
        if (choice === 1) addRewards(save, { chestTicket: 500 });
        else addRewards(save, { gold: 100000 });
        return choice === 1 ? "国王宝库：宝箱 +500" : "国王宝库：金币 +100,000";
      }
      if (save.resources.goldenSnakeToken < 3) return "金蛇福牌不足，需要 3 枚";
      save.resources.goldenSnakeToken -= 3;
      if (choice === 1) addRewards(save, { mountWhip: 5, food: 30, steak: 20 });
      else addRewards(save, { artifactOre: 8, flagEssence: 20 });
      return choice === 1 ? "金蛇送福：坐骑培养包已兑换" : "金蛇送福：神器战旗包已兑换";
    }),
    upgradeSystem: (id) => {
      const system = SYSTEM_UPGRADES.find((item) => item.id === id);
      if (!system) return;
      const currentLevel = get().save.upgrades[id] || 0;
      const cost = Math.ceil(system.baseCost * Math.pow(1.12, currentLevel));
      update((save) => {
        const level = save.upgrades[id] || 0;
        if (level >= system.max) return;
        if (save.player.level < system.unlock) return `${system.unlock} 级解锁${system.name}`;
        if (save.resources[system.resource] < cost) return "强化材料不足";
        save.resources[system.resource] -= cost;
        if (id === "flag") {
          const rng = new GameRng(save.rngSeed, save.rngDraws);
          if (rng.next() * 10000 < battleFlagSuccessRate(level)) save.upgrades[id] = level + 1;
          save.rngSeed = rng.state;
          save.rngDraws = rng.draws;
        } else {
          save.upgrades[id] = level + 1;
        }
        save.counters.systemsUpgraded += 1;
        return `${system.name}升级结算完成`;
      });
    },
    challengeStage: () => update((save) => { resolveStage(save); }, "试炼战斗已结算"),
    autoStageTick: () => {
      if (!get().save.automation.autoStage) return;
      update((save) => {
        if (!resolveStage(save)) save.automation.autoStage = false;
      });
    },
    challengeNpc: (npcId) => update((save) => {
      const npc = save.npcs.find((item) => item.id === npcId);
      if (!npc || save.resources.challengeTicket <= 0) return;
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const result = runBattle(calculatePlayerStats(save), arenaEnemyStats(npc), rng, stageRewardScale(Math.max(1, npc.level)), battleLoadoutFromSave(save));
      result.stage = arenaStageForLevel(npc.level);
      result.playerLevel = save.player.level;
      result.enemyLevel = npc.level;
      result.enemyName = npc.name;
      save.lastBattle = result;
      save.resources.challengeTicket -= 1;
      save.player.arenaRating += result.win ? 18 : -8;
      if (result.win) { save.player.arenaWins += 1; save.resources.merit += Math.round(10 * progressionRewardScale(save)); rollArenaExtraDrops(save, rng); }
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
    }, "角斗场战斗已结算"),
    challengeGuildBoss: () => update((save) => {
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      const result = runBattle(calculatePlayerStats(save), stageEnemy(save.player.stage + 3), rng, stageRewardScale(save.player.stage + 3), battleLoadoutFromSave(save));
      result.stage = save.player.stage + 3;
      result.playerLevel = save.player.level;
      result.enemyName = "荒原巨像";
      save.lastBattle = result;
      if (result.win) { save.resources.guildCoin += Math.round(80 * progressionRewardScale(save)); save.guild.bossWins += 1; }
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
    }, "联盟首领战已结算"),
    rewardTwinTower: () => update((save) => {
      addScaledRewards(save, { soulCardTicket: 10, merit: 20, trialCoin: 300, gold: 30000 });
    }, "双塔奇兵胜利：魂卡券 +10 · 功勋 +20 · 试炼币 +300"),
    guildDonate: () => update((save) => {
      if (save.guild.donatedDay === save.day || save.resources.gold < 1000) return;
      save.resources.gold -= 1000;
      save.resources.guildCoin += 200;
      save.guild.donatedDay = save.day;
    }, get().save.guild.donatedDay === get().save.day ? "今日已捐献" : get().save.resources.gold < 1000 ? "金币不足" : "捐献完成：联盟币 +200"),
    guildShopBuy: () => update((save) => {
      if (save.guild.shopDay === save.day || save.resources.guildCoin < 100) return;
      save.resources.guildCoin -= 100;
      save.resources.chestTicket += 500;
      save.guild.shopDay = save.day;
    }, get().save.guild.shopDay === get().save.day ? "今日特供已购买" : get().save.resources.guildCoin < 100 ? "联盟币不足，请先捐献" : "联盟特供到账：宝箱 +500"),
    claimActivity: (id) => update((save) => {
      if (save.claimedActivities.includes(id) || (id === "seven" && save.day < 7)) return;
      addScaledRewards(save, ACTIVITY_REWARDS[id] || {});
      save.claimedActivities.push(id);
    }, id === "seven" && get().save.day < 7 ? "第 7 天可领取" : "奖励已领取"),
    claimAllActivities: () => update((save) => {
      Object.keys(ACTIVITY_REWARDS).forEach((id) => {
        if (save.claimedActivities.includes(id) || (id === "seven" && save.day < 7)) return;
        addScaledRewards(save, ACTIVITY_REWARDS[id]);
        save.claimedActivities.push(id);
      });
    }, "当前可领取日常已全部结算"),
    claimGoal: (id) => update((save) => {
      const goal = GROWTH_GOALS.find((item) => item.id === id);
      if (!goal || save.claimedGoals.includes(id) || goalProgress(save, id) < goal.target) return;
      addRewards(save, goal.reward);
      save.claimedGoals.push(id);
    }, "成长目标奖励已领取"),
    advanceDay: () => update((save) => {
      save.day += 1;
      save.claimedActivities = save.claimedActivities.filter((id) => !["signin", "daily", "mail"].includes(id));
      save.resources.huntingStamina = 100;
      save.resources.challengeTicket += Math.round(5 * Math.pow(1.12, save.day - 1));
      if (save.resources.beastEgg < 5) save.resources.beastEgg = Math.min(5, save.resources.beastEgg + Math.round(2 * Math.pow(1.08, save.day - 1)));
      save.beastEggClock.lastGeneratedAt = Date.now();
      save.growthSystems.territory.pullsRemaining = 5;
      save.growthSystems.territory.refreshesRemaining = 1;
      save.growthSystems.turntable.remaining = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      save.growthSystems.turntable.spinsToday = 0;
      save.growthSystems.turntable.lastReward = undefined;
      save.eventDrops = { day: save.day, eggHammers: 0, treasuryKeys: 0 };
      const rng = new GameRng(save.rngSeed, save.rngDraws);
      save.growthSystems.territory.offers = generateTerritoryOffers(rng, save.player.level);
      save.rngSeed = rng.state;
      save.rngDraws = rng.draws;
      save.npcs = save.npcs.map((npc, index) => ({ ...npc, level: Math.min(150, npc.level + (index < 12 ? 1 : 0)), power: Math.round(npc.power * (1.02 + (50 - index) / 1250)), rating: npc.rating + (index < 10 ? 12 : 3) }));
    }, "虚拟服务器已前进一天"),
    reset: async () => {
      await clearSave();
      const save = createInitialSave();
      set({ save, notice: "已开始新的冒险" });
      persist(save);
    }
  };
});

export { VIP_THRESHOLDS };
