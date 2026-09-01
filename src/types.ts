export type ResourceId =
  | "gold"
  | "diamond"
  | "chestTicket"
  | "challengeTicket"
  | "soulCore"
  | "beastEssence"
  | "beastEgg"
  | "beastEggBlue"
  | "beastEggGold"
  | "beastEggRare"
  | "experienceSpirit"
  | "beastDevourStone"
  | "beastAwakenStone"
  | "beastEnhanceStone"
  | "beastBoostCharm"
  | "beastProtectCharm"
  | "beastRewindStone"
  | "beastExtraordinaryShard"
  | "beastMagicCrystal"
  | "beastEggLegendary"
  | "beastEggPerfect"
  | "beastEggExtraordinary"
  | "petSoulGrass"
  | "petSoulFlower"
  | "petSoulFruit"
  | "soulCardTicket"
  | "soulCardDust"
  | "huntingStamina"
  | "huntingCoin"
  | "runeShard"
  | "gemTicket"
  | "mountWhip"
  | "eagleFeather"
  | "food"
  | "steak"
  | "artifactOre"
  | "flagEssence"
  | "wildRune"
  | "eggHammer"
  | "treasuryKey"
  | "goldenSnakeToken"
  | "guildCoin"
  | "merit"
  | "trialCoin";

export type Resources = Record<ResourceId, number>;

export interface CombatStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  lifesteal: number;
  crit: number;
  dodge: number;
  stun: number;
  combo: number;
  counter: number;
  antiLifesteal: number;
  antiCrit: number;
  antiDodge: number;
  antiStun: number;
  antiCombo: number;
  antiCounter: number;
  critDamage: number;
  tenacity: number;
  healing: number;
  recovery: number;
  damageBonus: number;
  damageReduction: number;
  beastStrength: number;
}

export type GrowthStat = keyof CombatStats | "hpBonus" | "attackBonus" | "defenseBonus";

export interface GrowthAffix {
  id: string;
  stat: GrowthStat;
  name: string;
  value: number;
  percent: boolean;
  grade?: 1 | 2 | 3;
  refineLevel?: number;
  refineCap?: number;
}

export type GearSlot =
  | "weapon" | "helmet" | "shoulder" | "armor" | "pants" | "boots"
  | "necklace" | "ring" | "belt" | "gloves" | "bracer" | "shield";

export type BuildPlanId = "crit" | "dodge" | "combo" | "lifesteal" | "stun";
export type BuildStat = "crit" | "dodge" | "combo" | "lifesteal" | "stun" | "counter";

export interface GearAffix {
  stat: keyof CombatStats;
  value: number;
  percent: boolean;
}

export interface EquipmentInstance {
  id: string;
  slot: GearSlot;
  level: number;
  quality: number;
  stats: Pick<CombatStats, "hp" | "attack" | "defense" | "speed">;
  affixes: GearAffix[];
  score: number;
  sellValue: number;
}

export interface WarSoulRefineOption {
  id: string;
  star: number;
  resultQuality: string;
  attributes: GrowthAffix[];
}

export interface WarSoulRefineEntry {
  id: string;
  starGrade: number;
  resultQuality: string;
  soulPower: number;
  attributes: GrowthAffix[];
  locked: boolean;
}

export interface WarSoulState {
  count: number;
  stage: number;
  level: number;
  refine: number;
  luck: number;
  refineStar: number;
  refineAttributes: GrowthAffix[];
  refineEntries: WarSoulRefineEntry[];
  previousRefineAttributes: GrowthAffix[];
  pendingRefine: WarSoulRefineOption[];
}

export interface BeastInstanceState {
  level: number;
  exp: number;
  stars: number;
  affixes: GrowthAffix[];
  pendingAffixes: GrowthAffix[];
  devourLevel: number;
  devourExp?: number;
  stage?: number;
  enhanceLevel?: number;
  enhanceBeforeAttempt?: number;
  rewindAvailable?: boolean;
}

export interface BeastState extends BeastInstanceState {
  count: number;
  discovered: boolean;
}

export interface BeastBoardPiece {
  id: string;
  kind?: "beast" | "spirit";
  definitionId: string;
  tier: number;
  state?: BeastInstanceState;
  /** Legacy saves used amount stacks; current saves always keep one beast per slot. */
  amount?: number;
  protected?: boolean;
}

export type BeastFaction = "nature" | "element" | "shadow" | "legend";
export type BeastEggKind = "green" | "blue" | "rare" | "yellow" | "legendary" | "perfect" | "extraordinary";

export interface SoulCardState {
  count: number;
  level: number;
  stage: number;
}

export type MountQuality = 1 | 2 | 3 | 4 | 5;

export interface MountInstance {
  id: string;
  definitionId: string;
  quality: MountQuality;
  level: number;
  attributes: GrowthAffix[];
}

export interface MountSystemState {
  mounts: MountInstance[];
  activeId?: string;
  pity: number;
  freeRefreshDay: number;
  lastDraw: string[];
}

export interface RuneSystemState {
  inventory: Record<string, number>;
  levels: Record<string, number>;
  equipped: string[];
  lastDraw: string[];
}

export type GemColor = "red" | "blue" | "orange" | "green";

export interface GemSocket {
  color: GemColor;
  level: number;
}

export interface GemSystemState {
  inventory: Record<string, number>;
  sockets: Partial<Record<string, GemSocket>>;
  selectedLevel: number;
  lastResult?: string;
}

export interface ArtifactSystemState {
  forgeLevel: number;
  forgeExp: number;
  pity: number;
  owned: Record<string, { count: number; level: number }>;
  equipped?: string;
  lastForge: string[];
}

export interface FlagSystemState {
  level: number;
  progress: number;
  attempts: number;
  selectedStat: BuildStat;
  lastGain: number;
  lastSuccess: boolean;
}

export interface WarEagleSystemState {
  activeSkin: BuildStat;
  unlockedSkins: BuildStat[];
  levels: Partial<Record<BuildStat, number>>;
}

export interface TerritoryOffer {
  id: string;
  title: string;
  quality: 1 | 2 | 3 | 4;
  reward: Partial<Resources>;
}

export interface TerritorySystemState {
  pullsRemaining: number;
  refreshesRemaining: number;
  reputation: number;
  offers: TerritoryOffer[];
  lastClaim?: TerritoryOffer;
}

export interface TurntableSystemState {
  pool: 1 | 2;
  remaining: number[];
  spinsToday: number;
  lastReward?: string;
}

export type BattlePetMutationQuality = 1 | 2 | 3 | 4 | 5 | 6;
export type BattlePetSkillStat = Exclude<keyof CombatStats, "hp" | "attack" | "defense" | "speed" | "beastStrength">;

export interface BattlePetSkillState {
  id: string;
  slot: number;
  name: string;
  category: "属性强化" | "属性抗性" | "特殊效果" | "职业专属";
  stat: BattlePetSkillStat;
  quality: BattlePetMutationQuality;
  value: number;
}

export interface BattlePetSystemState {
  level: number;
  exp: number;
  awakeningLuck: number;
  awakeningQuality: number;
  skills: BattlePetSkillState[];
  pendingSkill?: BattlePetSkillState;
  lastMutation?: string;
  lastAwakening?: string;
}

export interface GrowthSystemsState {
  battlePet: BattlePetSystemState;
  warEagle: WarEagleSystemState;
  mount: MountSystemState;
  runes: RuneSystemState;
  gems: GemSystemState;
  artifact: ArtifactSystemState;
  flag: FlagSystemState;
  territory: TerritorySystemState;
  turntable: TurntableSystemState;
}

export interface CollectionState {
  warSouls: Record<string, WarSoulState>;
  beasts: Record<string, BeastState>;
  soulCards: Record<string, SoulCardState>;
  beastBoard: (BeastBoardPiece | null)[];
  deployedWarSoul?: string;
  deployedBeast?: string;
  deployedBeastPiece?: BeastBoardPiece;
  beastAssists: string[];
  beastAssistPieceIds?: string[];
  beastUnlockedSlots: number;
  equippedCards: string[];
  soulCardSchemes: string[][];
  activeSoulCardScheme: number;
}

export interface SimulatedOrder {
  id: string;
  productId: string;
  productName: string;
  amountRmb: number;
  rewards: Partial<Resources>;
  createdAt: number;
  quantity?: number;
}

export type ShopCurrencyTab = "diamondHot" | "goldWarehouse" | "diamondWarehouse" | "guild" | "merit" | "trial";

export interface ShopGood {
  id: string;
  name: string;
  tab: Exclude<ShopCurrencyTab, "diamondWarehouse">;
  currency: ResourceId;
  cost: number;
  limit: number;
  rewards: Partial<Resources>;
  art: number;
}

export interface CommerceState {
  day: number;
  shopPurchases: Record<string, number>;
  packagePurchases: Record<string, number>;
  shopRotation: number;
  refreshes: number;
  claimedGrowthFree: number[];
  claimedGrowthPremium: number[];
  cardClaimDays: Record<string, number>;
}

export interface CombatEvent {
  id: number;
  round: number;
  actor: "player" | "enemy" | "warSoul" | "beast" | "battlePet" | "system";
  type: "attack" | "crit" | "dodge" | "stun" | "combo" | "counter" | "heal" | "skill" | "defeat";
  value?: number;
  text: string;
}

export interface BattleResult {
  battleId?: string;
  win: boolean;
  playerHp: number;
  enemyHp: number;
  playerMaxHp?: number;
  enemyMaxHp?: number;
  playerPower?: number;
  enemyPower?: number;
  playerLevel?: number;
  enemyLevel?: number;
  enemyName?: string;
  stage?: number;
  stageLabel?: string;
  chapterName?: string;
  sourceVersion?: string;
  buildPlan?: BuildPlanId;
  playerCombat?: Record<BuildStat, number>;
  enemyResists?: Record<BuildStat, number>;
  events: CombatEvent[];
  rewards: Partial<Resources>;
  companions?: { warSoul?: string; beast?: string; beastArtIndex?: number; battlePet?: string; battlePetArtIndex?: number };
}

export interface GrowthReceipt {
  label: string;
  powerBefore: number;
  powerAfter: number;
  levelBefore: number;
  levelAfter: number;
  createdAt: number;
}

export interface NpcPlayer {
  id: string;
  name: string;
  level: number;
  power: number;
  rating: number;
  guild: string;
  archetype: "休闲" | "活跃" | "豪爽" | "冲榜";
}

export interface AutomationSettings {
  autoChest: boolean;
  autoStage: boolean;
  batch: 10 | 100;
  keepQuality: number;
  targetStat: BuildStat;
  stopOnUpgrade: boolean;
  stopOnQuality: boolean;
  speedMode: boolean;
}

export interface ChestSummary {
  opened: number;
  equipped: number;
  kept: number;
  sold: number;
  bestQuality: number;
  powerGain: number;
}

export interface GameSaveV1 {
  schemaVersion: 1;
  createdAt: number;
  updatedAt: number;
  day: number;
  lastSeenAt: number;
  rngSeed: number;
  rngDraws: number;
  player: {
    name: string;
    level: number;
    exp: number;
    stage: number;
    tower: number;
    arenaRating: number;
    arenaWins: number;
  };
  resources: Resources;
  chest: { level: number; progress: number; autoOpen: boolean };
  buildPlan: BuildPlanId;
  automation: AutomationSettings;
  counters: {
    chestsOpened: number;
    stagesWon: number;
    summons: number;
    systemsUpgraded: number;
    beastHatches: number;
    beastComposes: number;
    warSoulComposes: number;
    refines: number;
    mountDraws: number;
    mountUpgrades: number;
    runeDraws: number;
    runeUpgrades: number;
    gemPurchases: number;
    gemComposes: number;
    artifactForges: number;
    flagAttempts: number;
    territoryPulls: number;
    turntableSpins: number;
  };
  claimedGoals: string[];
  lastChestSummary?: ChestSummary;
  equipped: Partial<Record<GearSlot, EquipmentInstance>>;
  gearRefines: Partial<Record<GearSlot, number>>;
  loot: EquipmentInstance[];
  collections: CollectionState;
  beastEggClock: { lastGeneratedAt: number };
  hunting: Record<string, number>;
  hunterLevel: number;
  hunterExp: number;
  lastHunt: string[];
  orders: SimulatedOrder[];
  totalSpent: number;
  claimedVip: number[];
  firstPurchaseProducts: string[];
  commerce: CommerceState;
  claimedActivities: string[];
  upgrades: Record<string, number>;
  growthSystems: GrowthSystemsState;
  eventDrops: { day: number; eggHammers: number; treasuryKeys: number };
  guild: { donatedDay: number; shopDay: number; bossWins: number };
  npcs: NpcPlayer[];
  lastBattle?: BattleResult;
  lastGrowth?: GrowthReceipt;
  fidelityUpgradeV2?: boolean;
  fidelityUpgradeV3?: boolean;
  fidelityUpgradeV4?: boolean;
  fidelityUpgradeV5?: boolean;
  fidelityUpgradeV6?: boolean;
  fidelityUpgradeV7?: boolean;
  fidelityUpgradeV8?: boolean;
  fidelityUpgradeV9?: boolean;
  fidelityUpgradeV10?: boolean;
  fidelityUpgradeV11?: boolean;
  fidelityUpgradeV12?: boolean;
}

export interface RechargeProduct {
  id: string;
  name: string;
  amountRmb: number;
  rewards: Partial<Resources>;
  badge?: string;
  firstDouble?: boolean;
  category: "diamond" | "supply" | "daily" | "privilege";
}

export interface CollectionDefinition {
  id: string;
  name: string;
  tier: number;
  role: string;
  accent: string;
  skill: string;
  bonus: Partial<CombatStats>;
  baseBonusPct?: Partial<Pick<CombatStats, "hp" | "attack" | "defense">>;
  skillInterval?: number;
  skillDamagePct?: number;
  skillHealPct?: number;
  sourceStatus?: "confirmed" | "official_name" | "shape_confirmed" | "quality_inferred";
}

export interface BeastDefinition extends CollectionDefinition {
  faction: BeastFaction;
  artIndex: number;
  codexBonus: Partial<CombatStats>;
  codexBonusStatus?: "confirmed" | "local_balance";
  skillName: string;
  codexForm?: string;
  mergeEligible?: boolean;
  isExperienceSpirit?: boolean;
  codexReward: number;
  baseSpeedBonus?: number;
  baseSpeedBonusPct?: number;
}

export interface HuntingDefinition {
  id: string;
  name: string;
  rate: number;
  rarity: 1 | 2 | 3;
  codexStat: GrowthStat;
  codexValue: number;
  duplicateValue: number;
}
