import type { BeastDefinition, BeastEggKind, BeastFaction, BuildPlanId, BuildStat, CollectionDefinition, CombatStats, GemColor, GearSlot, GrowthStat, HuntingDefinition, MountQuality, RechargeProduct, ResourceId, ShopGood } from "./types";

export const RESOURCE_META: Record<ResourceId, { name: string; icon: string }> = {
  gold: { name: "金币", icon: "coins" },
  diamond: { name: "钻石", icon: "gem" },
  chestTicket: { name: "宝箱", icon: "package" },
  challengeTicket: { name: "挑战券", icon: "ticket" },
  soulCore: { name: "魂核", icon: "sparkles" },
  beastEssence: { name: "魔兽精华", icon: "flame" },
  beastEgg: { name: "绿色魔兽蛋", icon: "egg" },
  beastEggBlue: { name: "蓝色魔兽蛋", icon: "egg" },
  beastEggGold: { name: "史诗级魔兽蛋", icon: "egg" },
  beastEggRare: { name: "稀有级魔兽蛋", icon: "egg" },
  experienceSpirit: { name: "旧版精灵余额", icon: "ghost" },
  beastDevourStone: { name: "吞噬晶石", icon: "diamond" },
  beastAwakenStone: { name: "觉醒晶石", icon: "sparkles" },
  beastEnhanceStone: { name: "强化石", icon: "flame" },
  beastBoostCharm: { name: "增率符", icon: "zap" },
  beastProtectCharm: { name: "保护符", icon: "shield" },
  beastRewindStone: { name: "回溯石", icon: "rewind" },
  beastExtraordinaryShard: { name: "超凡魔兽碎片", icon: "puzzle" },
  beastMagicCrystal: { name: "魔晶", icon: "sparkles" },
  beastEggLegendary: { name: "传说级魔兽蛋", icon: "egg" },
  beastEggPerfect: { name: "完美级魔兽蛋", icon: "egg" },
  beastEggExtraordinary: { name: "超凡级魔兽蛋", icon: "egg" },
  petSoulGrass: { name: "炼魂草", icon: "leaf" },
  petSoulFlower: { name: "炼魂花", icon: "sparkles" },
  petSoulFruit: { name: "传说炼魂果", icon: "flame" },
  soulCardTicket: { name: "魂卡券", icon: "cards" },
  soulCardDust: { name: "魂晶", icon: "sparkles" },
  huntingStamina: { name: "捕猎体力", icon: "zap" },
  huntingCoin: { name: "猎人币", icon: "coins" },
  runeShard: { name: "符文碎片", icon: "hexagon" },
  gemTicket: { name: "宝石券", icon: "diamond" },
  mountWhip: { name: "驯兽鞭", icon: "wand" },
  eagleFeather: { name: "鹰羽", icon: "feather" },
  food: { name: "食物", icon: "apple" },
  steak: { name: "肉排", icon: "beef" },
  artifactOre: { name: "神器锻造石", icon: "anvil" },
  flagEssence: { name: "战旗精华", icon: "flag" },
  wildRune: { name: "百变符文", icon: "shuffle" },
  eggHammer: { name: "砸蛋宝锤", icon: "hammer" },
  treasuryKey: { name: "宝库钥匙", icon: "key" },
  goldenSnakeToken: { name: "金蛇福牌", icon: "badge" },
  guildCoin: { name: "联盟币", icon: "shield" },
  merit: { name: "功勋", icon: "medal" },
  trialCoin: { name: "试炼币", icon: "target" }
};

export const SLOTS: { id: GearSlot; name: string }[] = [
  { id: "weapon", name: "武器" }, { id: "helmet", name: "头盔" },
  { id: "shoulder", name: "护肩" }, { id: "armor", name: "衣服" },
  { id: "pants", name: "长裤" }, { id: "boots", name: "战靴" },
  { id: "necklace", name: "项链" }, { id: "ring", name: "戒指" },
  { id: "belt", name: "腰带" }, { id: "gloves", name: "手套" },
  { id: "bracer", name: "护腕" }, { id: "shield", name: "盾牌" }
];

export const QUALITIES = [
  { id: 0, name: "普通", color: "#aeb9c2", multiplier: 0.72 },
  { id: 1, name: "优秀", color: "#57c96a", multiplier: 0.86 },
  { id: 2, name: "精良", color: "#43aaf3", multiplier: 1 },
  { id: 3, name: "稀有", color: "#9f65ee", multiplier: 1.18 },
  { id: 4, name: "史诗", color: "#f0cc3e", multiplier: 1.42 },
  { id: 5, name: "传说", color: "#f28b35", multiplier: 1.72 },
  { id: 6, name: "完美", color: "#ed4b4b", multiplier: 2.08 },
  { id: 7, name: "至尊", color: "#39d5c6", multiplier: 2.52 },
  { id: 8, name: "超凡", color: "#ffd85a", multiplier: 3.08 },
  { id: 9, name: "不朽", color: "#f875dc", multiplier: 3.8 }
];

export const BUILD_PLANS: { id: BuildPlanId; name: string; short: string; primary: BuildStat; secondary: BuildStat; description: string; accent: string }[] = [
  { id: "crit", name: "暴击爆发", short: "暴击", primary: "crit", secondary: "stun", description: "追求单次高伤，优先暴击并补击晕。", accent: "#e75549" },
  { id: "dodge", name: "闪避反击", short: "闪反", primary: "dodge", secondary: "counter", description: "靠闪避规避伤害，再用反击磨损对手。", accent: "#43c7b2" },
  { id: "combo", name: "连击疾攻", short: "连击", primary: "combo", secondary: "crit", description: "用连续攻击放大触发次数和技能收益。", accent: "#e7b94e" },
  { id: "lifesteal", name: "吸血续航", short: "吸血", primary: "lifesteal", secondary: "combo", description: "把输出转为恢复，适合长回合推进。", accent: "#b565d9" },
  { id: "stun", name: "击晕控制", short: "击晕", primary: "stun", secondary: "dodge", description: "压缩对方行动次数，以控制创造优势。", accent: "#5d9fe8" }
];

// The recording confirms dual-stat skins, but not their complete official names.
// Neutral role labels avoid presenting invented lore names as original data.
export const WAR_EAGLE_SKINS: { id: BuildStat; name: string; primary: BuildStat; secondary: BuildStat; art: number; accent: string }[] = [
  { id: "crit", name: "暴击皮肤", primary: "crit", secondary: "stun", art: 0, accent: "#ed654b" },
  { id: "dodge", name: "闪避皮肤", primary: "dodge", secondary: "counter", art: 1, accent: "#43cbbb" },
  { id: "combo", name: "连击皮肤", primary: "combo", secondary: "crit", art: 2, accent: "#efbd43" },
  { id: "lifesteal", name: "吸血皮肤", primary: "lifesteal", secondary: "combo", art: 3, accent: "#c465da" },
  { id: "stun", name: "击晕皮肤", primary: "stun", secondary: "dodge", art: 4, accent: "#67aef3" },
  { id: "counter", name: "反击皮肤", primary: "counter", secondary: "dodge", art: 5, accent: "#68b879" }
];

export const GROWTH_GOALS = [
  { id: "open-10", name: "开箱起步", description: "累计开启 10 个宝箱", target: 10, reward: { diamond: 30, chestTicket: 120 } },
  { id: "equip-4", name: "整装待发", description: "穿戴 4 件装备", target: 4, reward: { gold: 8000, soulCore: 20 } },
  { id: "stage-3", name: "森林周边", description: "通过 3 个试炼关卡", target: 3, reward: { diamond: 50, challengeTicket: 5 } },
  { id: "open-100", name: "百箱试炼", description: "累计开启 100 个宝箱", target: 100, reward: { gold: 50000, soulCardTicket: 20 } },
  { id: "level-5", name: "初露锋芒", description: "主人物达到 5 级", target: 5, reward: { chestTicket: 300, gemTicket: 12 } },
  { id: "vip-1", name: "首次豪充", description: "模拟充值达到 VIP 1", target: 1, reward: { chestTicket: 500, beastEgg: 20, beastEssence: 500, beastDevourStone: 100 } },
  { id: "summon-10", name: "命运召唤", description: "累计召唤 10 次", target: 10, reward: { beastEssence: 50, soulCardTicket: 30 } },
  { id: "hatch-10", name: "魔兽孵化", description: "累计孵化 10 枚魔兽蛋", target: 10, reward: { beastDevourStone: 80, beastEssence: 300 } },
  { id: "beast-compose-3", name: "血脉进阶", description: "累计合成魔兽 3 次", target: 3, reward: { beastEgg: 30, beastEssence: 600 } },
  { id: "refine-1", name: "战魂初炼", description: "完成 1 次战魂精炼", target: 1, reward: { soulCore: 80, gold: 120000 } },
  { id: "gem-compose-3", name: "宝石工匠", description: "累计合成宝石 3 次", target: 3, reward: { gemTicket: 30, diamond: 120 } },
  { id: "stage-20", name: "进入森林", description: "通过 20 个试炼关卡", target: 20, reward: { chestTicket: 1000, artifactOre: 80, flagEssence: 120 } }
] as const;

export const RECHARGE_PRODUCTS: RechargeProduct[] = [
  ...[6, 30, 68, 128, 328, 648].map((amount) => ({
    id: `diamond-${amount}`,
    name: `${amount * 10} 钻石`,
    amountRmb: amount,
    rewards: { diamond: amount * 10 },
    badge: amount >= 328 ? "热卖" : amount === 68 ? "推荐" : undefined,
    firstDouble: true,
    category: "diamond" as const
  })),
  { id: "supply-mount-30", name: "坐骑补给箱", amountRmb: 30, rewards: { mountWhip: 50, food: 160, steak: 100, gold: 300000 }, badge: "培养", category: "supply" },
  { id: "supply-rune-30", name: "符文研修箱", amountRmb: 30, rewards: { runeShard: 1200, wildRune: 5 }, badge: "抽取", category: "supply" },
  { id: "supply-gem-30", name: "宝石工坊箱", amountRmb: 30, rewards: { gemTicket: 120, diamond: 810 }, badge: "合成", category: "supply" },
  { id: "supply-artifact-68", name: "神器锻造箱", amountRmb: 68, rewards: { artifactOre: 300, gold: 680000 }, badge: "锻造", category: "supply" },
  { id: "supply-flag-68", name: "战旗训练箱", amountRmb: 68, rewards: { flagEssence: 500, merit: 200 }, badge: "进度", category: "supply" },
  { id: "supply-beast-68", name: "魔兽孵化箱", amountRmb: 68, rewards: { beastEgg: 100, beastEggBlue: 10, beastEggGold: 3, beastEssence: 1000, beastDevourStone: 300 }, badge: "养成", category: "supply" },
  { id: "supply-event-128", name: "活动通行补给", amountRmb: 128, rewards: { eggHammer: 20, treasuryKey: 20, goldenSnakeToken: 60 }, badge: "兑换", category: "supply" },
  { id: "daily-basic-free", name: "每日免费礼包", amountRmb: 0, rewards: { chestTicket: 10, diamond: 20 }, badge: "免费", category: "daily" },
  { id: "daily-basic-6", name: "每日宝箱礼包", amountRmb: 6, rewards: { chestTicket: 30, runeShard: 5, gemTicket: 2 }, badge: "每日", category: "daily" },
  { id: "daily-basic-12", name: "每日养成礼包", amountRmb: 12, rewards: { diamond: 120, chestTicket: 60, gemTicket: 2 }, badge: "每日", category: "daily" },
  { id: "daily-basic-18", name: "每日魂卡礼包", amountRmb: 18, rewards: { diamond: 180, soulCardTicket: 30, soulCardDust: 60 }, badge: "每日", category: "daily" },
  { id: "daily-basic-30", name: "每日进阶礼包", amountRmb: 30, rewards: { diamond: 300, chestTicket: 100, gemTicket: 5 }, badge: "每日", category: "daily" },
  { id: "daily-68", name: "紫色战魂自选礼包", amountRmb: 68, rewards: { diamond: 680, soulCore: 20 }, badge: "限购5", category: "daily" },
  { id: "daily-198", name: "金色战魂自选礼包", amountRmb: 198, rewards: { diamond: 1980, soulCore: 50 }, badge: "限购5", category: "daily" },
  { id: "daily-648", name: "橙色战魂自选礼包", amountRmb: 648, rewards: { diamond: 6480, soulCore: 100 }, badge: "限购30", category: "daily" },
  { id: "daily-arena-198", name: "群雄功勋礼包", amountRmb: 198, rewards: { diamond: 1980, challengeTicket: 10, merit: 500 }, badge: "群雄", category: "daily" },
  { id: "daily-arena-648", name: "群雄荣耀礼包", amountRmb: 648, rewards: { diamond: 6480, challengeTicket: 30, merit: 2000 }, badge: "群雄", category: "daily" },
  { id: "daily-card-328", name: "魂卡研修礼包", amountRmb: 328, rewards: { diamond: 3280, soulCardTicket: 50, soulCardDust: 300 }, badge: "魂卡", category: "daily" },
  { id: "daily-card-648", name: "魂卡大师礼包", amountRmb: 648, rewards: { diamond: 6480, soulCardTicket: 100, soulCardDust: 800 }, badge: "魂卡", category: "daily" },
  { id: "daily-pet-328", name: "战宠炼魂礼包", amountRmb: 328, rewards: { diamond: 3280, petSoulFlower: 20, petSoulFruit: 5 }, badge: "战宠", category: "daily" },
  { id: "daily-pet-648", name: "战宠觉醒礼包", amountRmb: 648, rewards: { diamond: 6480, petSoulFlower: 50, petSoulFruit: 20 }, badge: "战宠", category: "daily" },
  { id: "daily-beast-328", name: "魔兽成长礼包", amountRmb: 328, rewards: { diamond: 3280, beastEggGold: 1, beastEssence: 2000 }, badge: "魔兽", category: "daily" },
  { id: "daily-beast-648", name: "魔兽升阶礼包", amountRmb: 648, rewards: { diamond: 6480, beastEggGold: 2, beastDevourStone: 1000 }, badge: "魔兽", category: "daily" },
  { id: "daily-treasure-68", name: "秘宝探索礼包", amountRmb: 68, rewards: { diamond: 680, artifactOre: 40, treasuryKey: 10 }, badge: "秘宝", category: "daily" },
  { id: "daily-treasure-198", name: "秘宝进阶礼包", amountRmb: 198, rewards: { diamond: 1980, artifactOre: 120, treasuryKey: 25 }, badge: "秘宝", category: "daily" },
  { id: "daily-treasure-648", name: "秘宝典藏礼包", amountRmb: 648, rewards: { diamond: 6480, artifactOre: 400, treasuryKey: 80 }, badge: "秘宝", category: "daily" },
  { id: "monthly-30", name: "高级月卡", amountRmb: 68, rewards: { diamond: 680, chestTicket: 999 }, badge: "30日", category: "privilege" },
  { id: "lifetime-68", name: "黄金兽宠", amountRmb: 68, rewards: { diamond: 680, petSoulGrass: 60, petSoulFlower: 5 }, badge: "30日", category: "privilege" },
  { id: "fund-98", name: "成长基金", amountRmb: 98, rewards: { diamond: 980, chestTicket: 5000, soulCore: 100 }, badge: "返利", category: "privilege" },
  { id: "pass-128", name: "荣耀战令", amountRmb: 128, rewards: { diamond: 1280, beastEssence: 120, soulCardTicket: 100, flagEssence: 200, artifactOre: 80 }, badge: "豪华", category: "privilege" }
];

export const RECHARGE_PRODUCT_LIMITS: Record<string, number> = {
  "daily-basic-free": 1, "daily-basic-6": 1, "daily-basic-12": 1, "daily-basic-18": 1, "daily-basic-30": 1,
  "daily-68": 5, "daily-198": 5, "daily-648": 30,
  "daily-arena-198": 5, "daily-arena-648": 5, "daily-card-328": 5, "daily-card-648": 5,
  "daily-pet-328": 30, "daily-pet-648": 30, "daily-beast-328": 30, "daily-beast-648": 30,
  "daily-treasure-68": 5, "daily-treasure-198": 5, "daily-treasure-648": 5,
  "supply-mount-30": 1, "supply-rune-30": 1, "supply-gem-30": 1, "supply-artifact-68": 1,
  "supply-flag-68": 1, "supply-beast-68": 1, "supply-event-128": 1,
  "monthly-30": 1, "lifetime-68": 1, "fund-98": 1, "pass-128": 1
};

export const SHOP_GOODS: ShopGood[] = [
  { id: "hot-ticket", name: "挑战券", tab: "diamondHot", currency: "diamond", cost: 80, limit: 5, rewards: { challengeTicket: 1 }, art: 9 },
  { id: "hot-peak-ticket", name: "巅峰挑战券", tab: "diamondHot", currency: "diamond", cost: 100, limit: 5, rewards: { challengeTicket: 1 }, art: 10 },
  { id: "hot-tower-ticket", name: "双塔竞技券", tab: "diamondHot", currency: "diamond", cost: 100, limit: 5, rewards: { soulCardTicket: 1 }, art: 10 },
  { id: "hot-whip", name: "驯兽鞭", tab: "diamondHot", currency: "diamond", cost: 100, limit: 5, rewards: { mountWhip: 5 }, art: 2 },
  { id: "hot-order-ticket", name: "订单刷新券", tab: "diamondHot", currency: "diamond", cost: 30, limit: 5, rewards: { huntingStamina: 5 }, art: 3 },
  { id: "hot-hunt-stone", name: "狩石碎片", tab: "diamondHot", currency: "diamond", cost: 100, limit: 7, rewards: { artifactOre: 20 }, art: 8 },
  { id: "hot-soul-slab", name: "炼魂石板", tab: "diamondHot", currency: "diamond", cost: 10, limit: 50, rewards: { soulCore: 1 }, art: 6 },

  { id: "gold-small", name: "少量金币", tab: "goldWarehouse", currency: "diamond", cost: 20, limit: 20, rewards: { gold: 6_400 }, art: 1 },
  { id: "gold-some", name: "一些金币", tab: "goldWarehouse", currency: "diamond", cost: 40, limit: 20, rewards: { gold: 14_000 }, art: 1 },
  { id: "gold-many", name: "许多金币", tab: "goldWarehouse", currency: "diamond", cost: 100, limit: 20, rewards: { gold: 36_000 }, art: 1 },
  { id: "gold-large", name: "大量金币", tab: "goldWarehouse", currency: "diamond", cost: 200, limit: 20, rewards: { gold: 76_000 }, art: 1 },
  { id: "gold-super", name: "超多金币", tab: "goldWarehouse", currency: "diamond", cost: 400, limit: 20, rewards: { gold: 160_000 }, art: 1 },
  { id: "gold-ocean", name: "海量金币", tab: "goldWarehouse", currency: "diamond", cost: 1000, limit: 20, rewards: { gold: 408_000 }, art: 1 },

  { id: "guild-chest", name: "宝箱", tab: "guild", currency: "guildCoin", cost: 1, limit: 20, rewards: { chestTicket: 100 }, art: 1 },
  { id: "guild-honor", name: "荣耀之血", tab: "guild", currency: "guildCoin", cost: 10, limit: 6, rewards: { beastEssence: 20 }, art: 4 },
  { id: "guild-supply", name: "联盟补给", tab: "guild", currency: "guildCoin", cost: 20, limit: 4, rewards: { chestTicket: 300 }, art: 1 },
  { id: "guild-speed", name: "加速券", tab: "guild", currency: "guildCoin", cost: 15, limit: 5, rewards: { huntingStamina: 10 }, art: 10 },
  { id: "guild-whip", name: "驯兽鞭", tab: "guild", currency: "guildCoin", cost: 40, limit: 2, rewards: { mountWhip: 1 }, art: 2 },
  { id: "guild-food", name: "兽粮", tab: "guild", currency: "guildCoin", cost: 1, limit: 80, rewards: { food: 1 }, art: 2 },

  { id: "merit-artifact", name: "烈火战靴", tab: "merit", currency: "merit", cost: 5000, limit: 1, rewards: { artifactOre: 100 }, art: 8 },
  { id: "merit-legend-stone", name: "传说剑石", tab: "merit", currency: "merit", cost: 1000, limit: 2, rewards: { artifactOre: 50 }, art: 8 },
  { id: "merit-egg", name: "精良级魔兽蛋", tab: "merit", currency: "merit", cost: 600, limit: 1, rewards: { beastEggBlue: 1 }, art: 7 },
  { id: "merit-food", name: "兽粮", tab: "merit", currency: "merit", cost: 400, limit: 10, rewards: { food: 50 }, art: 2 },
  { id: "merit-gem", name: "宝石券", tab: "merit", currency: "merit", cost: 150, limit: 20, rewards: { gemTicket: 1 }, art: 5 },
  { id: "merit-gold", name: "金币", tab: "merit", currency: "merit", cost: 100, limit: 100, rewards: { gold: 10_000 }, art: 1 },
  { id: "merit-east-flag", name: "东吴战旗", tab: "merit", currency: "merit", cost: 300, limit: 1, rewards: { flagEssence: 100 }, art: 9 },
  { id: "merit-blue-flag", name: "曹魏战旗", tab: "merit", currency: "merit", cost: 300, limit: 1, rewards: { flagEssence: 100 }, art: 9 },
  { id: "merit-red-flag", name: "蜀汉战旗", tab: "merit", currency: "merit", cost: 300, limit: 1, rewards: { flagEssence: 100 }, art: 9 },

  { id: "trial-ritual", name: "仪式剑石", tab: "trial", currency: "trialCoin", cost: 200, limit: 1, rewards: { artifactOre: 20 }, art: 8 },
  { id: "trial-origin", name: "塑源石板", tab: "trial", currency: "trialCoin", cost: 200, limit: 10, rewards: { runeShard: 100 }, art: 3 },
  { id: "trial-card", name: "史诗魂卡碎片", tab: "trial", currency: "trialCoin", cost: 450, limit: 2, rewards: { soulCardTicket: 10 }, art: 10 },
  { id: "trial-legend", name: "传说剑石", tab: "trial", currency: "trialCoin", cost: 600, limit: 3, rewards: { artifactOre: 50 }, art: 8 },
  { id: "trial-source", name: "塑魂石板", tab: "trial", currency: "trialCoin", cost: 200, limit: 10, rewards: { runeShard: 100 }, art: 3 },
  { id: "trial-forge", name: "铸魂石板", tab: "trial", currency: "trialCoin", cost: 300, limit: 10, rewards: { soulCore: 10 }, art: 6 }
];

export const GROWTH_PACK_LEVELS = [
  { level: 1, free: { chestTicket: 100 }, premium: { diamond: 300, chestTicket: 500 } },
  { level: 10, free: { chestTicket: 300, gold: 50_000 }, premium: { diamond: 680, soulCore: 30 } },
  { level: 20, free: { gemTicket: 10, runeShard: 50 }, premium: { diamond: 980, beastEssence: 300 } },
  { level: 40, free: { beastEggBlue: 3, petSoulGrass: 100 }, premium: { diamond: 1_680, soulCardTicket: 50 } },
  { level: 60, free: { artifactOre: 30, flagEssence: 60 }, premium: { diamond: 2_680, beastEggGold: 3 } },
  { level: 100, free: { chestTicket: 3_000, soulCore: 100 }, premium: { diamond: 6_480, beastEggPerfect: 1 } }
] as const;

export const VIP_THRESHOLDS = [0, 6, 30, 100, 300, 600, 1000, 2000, 4000, 7000, 10000, 15000, 25000, 40000, 60000, 100000];

export const WAR_SOUL_QUALITIES = [
  { tier: 1, name: "精良级", color: "#3fa7e8", refineCap: 1 },
  { tier: 2, name: "稀有级", color: "#9c62e8", refineCap: 1 },
  { tier: 3, name: "史诗级", color: "#e9c33d", refineCap: 2 },
  { tier: 4, name: "传说级", color: "#ef8c35", refineCap: 2 },
  { tier: 5, name: "完美级", color: "#e84d4d", refineCap: 3 },
  { tier: 6, name: "超凡级", color: "#4bd5cb", refineCap: 3 }
] as const;

const soulNames = [
  ["布朗", "#389ddd"], ["苍云", "#389ddd"],
  ["耶格尔", "#9560df"], ["乌云", "#9560df"],
  ["泰尼", "#e0bd38"], ["尤弥尔", "#e0bd38"], ["夜叉", "#e0bd38"], ["罗刹", "#e0bd38"],
  ["波比", "#e98732"], ["影武者", "#e98732"], ["炎魔", "#e98732"], ["极光", "#e98732"], ["纳塞", "#e98732"],
  ["死神", "#df4949"], ["红莲", "#df4949"], ["波蒙特", "#df4949"], ["阿努比斯", "#df4949"], ["奈尼斯", "#df4949"],
  ["青龙", "#41cfc8"], ["白虎", "#41cfc8"], ["朱雀", "#41cfc8"], ["玄武", "#41cfc8"], ["切茜娅", "#41cfc8"], ["海德拉", "#41cfc8"]
] as const;

export const WAR_SOULS: CollectionDefinition[] = soulNames.map(([name, accent], index) => ({
  id: `soul-${index + 1}`,
  name,
  tier: index < 2 ? 1 : index < 4 ? 2 : index < 8 ? 3 : index < 13 ? 4 : index < 18 ? 5 : 6,
  role: WAR_SOUL_QUALITIES[index < 2 ? 0 : index < 4 ? 1 : index < 8 ? 2 : index < 13 ? 3 : index < 18 ? 4 : 5].name,
  accent,
  skill: name === "青龙"
    ? "神罚天雷：第2回合释放，造成291%伤害并触发5次触电"
    : name === "朱雀"
      ? "圣焰：第2回合释放，造成196%伤害并提高目标受到伤害"
      : name === "乌云"
        ? "野蛮之击、利爪、迅捷"
        : "战斗技能详情待原机图鉴核对",
  skillDamagePct: name === "青龙" ? 291 : name === "朱雀" ? 196 : undefined,
  baseBonusPct: index >= 18 ? { hp: 40, attack: 10, defense: 10 } : index === 3 ? { hp: 15, attack: 4, defense: 4 } : undefined,
  bonus: {}
}));

export const BEAST_QUALITIES = [
  { tier: 1, name: "优秀", color: "#55c56b", composeRate: 0 },
  { tier: 2, name: "精良", color: "#3ba7e6", composeRate: 9000 },
  { tier: 3, name: "稀有", color: "#9860e4", composeRate: 8000 },
  { tier: 4, name: "史诗", color: "#e6bf3d", composeRate: 6000 },
  { tier: 5, name: "传说", color: "#ef8b34", composeRate: 3000 },
  { tier: 6, name: "完美", color: "#e84b4b", composeRate: 2000 },
  { tier: 7, name: "超凡", color: "#45d4c9", composeRate: 1000 },
  { tier: 8, name: "璀璨", color: "#f0a83b", composeRate: 0 }
] as const;

export const BEAST_FACTIONS: { id: BeastFaction; name: string; total: number; color: string; icon: string }[] = [
  { id: "nature", name: "自然系", total: 13, color: "#55a74d", icon: "叶" },
  { id: "element", name: "元素系", total: 17, color: "#338fd1", icon: "潮" },
  { id: "shadow", name: "暗影系", total: 11, color: "#7d4aaa", icon: "影" },
  { id: "legend", name: "传说系", total: 7, color: "#d39827", icon: "曜" }
];

type BeastEggResource = Extract<ResourceId,
  "beastEgg" | "beastEggBlue" | "beastEggRare" | "beastEggGold" | "beastEggLegendary" | "beastEggPerfect" | "beastEggExtraordinary">;

export const BEAST_EGG_TYPES: {
  id: BeastEggKind;
  name: string;
  resource: BeastEggResource;
  tier: number;
  color: string;
  diamondPrice?: number;
  pool: readonly { definitionId: string; weight: number }[];
  status: "recorded" | "official_pool";
}[] = [
  { id: "green", name: "优秀级魔兽蛋", resource: "beastEgg", tier: 1, color: "#68b85f", diamondPrice: 100, status: "recorded", pool: [
    { definitionId: "beast-1", weight: 1 }, { definitionId: "beast-20", weight: 1 }
  ] },
  { id: "blue", name: "精良级魔兽蛋", resource: "beastEggBlue", tier: 2, color: "#4aa7e2", diamondPrice: 100, status: "recorded", pool: [
    { definitionId: "beast-21", weight: 1 }, { definitionId: "beast-4", weight: 1 }
  ] },
  { id: "rare", name: "稀有级魔兽蛋", resource: "beastEggRare", tier: 3, color: "#9d64df", status: "official_pool", pool: [
    { definitionId: "beast-18", weight: 20 }, { definitionId: "beast-22", weight: 20 }, { definitionId: "beast-24", weight: 20 },
    { definitionId: "beast-19", weight: 20 }, { definitionId: "beast-25", weight: 20 }
  ] },
  { id: "yellow", name: "史诗级魔兽蛋", resource: "beastEggGold", tier: 4, color: "#e0b735", diamondPrice: 100, status: "recorded", pool: [
    { definitionId: "beast-26", weight: 1 }, { definitionId: "beast-27", weight: 1 },
    { definitionId: "beast-29", weight: 1 }, { definitionId: "beast-5", weight: 1 }, { definitionId: "beast-30", weight: 1 }
  ] },
  { id: "legendary", name: "传说级魔兽蛋", resource: "beastEggLegendary", tier: 5, color: "#e57d32", status: "official_pool", pool: [
    { definitionId: "beast-31", weight: 40 }, { definitionId: "beast-33", weight: 20 },
    { definitionId: "beast-34", weight: 20 }, { definitionId: "beast-35", weight: 20 }
  ] },
  { id: "perfect", name: "完美级魔兽蛋", resource: "beastEggPerfect", tier: 6, color: "#df4546", status: "official_pool", pool: [
    { definitionId: "beast-8", weight: 16.67 }, { definitionId: "beast-36", weight: 33.33 },
    { definitionId: "beast-6", weight: 33.33 }, { definitionId: "beast-9", weight: 16.67 }
  ] },
  { id: "extraordinary", name: "超凡级魔兽蛋", resource: "beastEggExtraordinary", tier: 7, color: "#33b8c6", status: "official_pool", pool: [
    { definitionId: "beast-10", weight: 33.33 }, { definitionId: "beast-11", weight: 33.33 },
    { definitionId: "beast-14", weight: 16.67 }, { definitionId: "beast-16", weight: 16.67 }
  ] }
];

export const BEAST_MAGIC_CRYSTAL_RATES: Readonly<Record<number, number>> = {
  1: 4, 2: 18, 3: 100, 4: 560, 5: 4800, 6: 9000
};

export const BEAST_EXPERIENCE_SPIRIT_BY_TIER: Readonly<Record<number, string>> = {
  1: "beast-2", 2: "beast-3", 3: "beast-23", 4: "beast-28", 5: "beast-32", 6: "beast-7"
};

interface BeastRow {
  id: string;
  name: string;
  tier: number;
  faction: BeastFaction;
  artIndex: number;
  status: NonNullable<BeastDefinition["sourceStatus"]>;
  role?: string;
  skillName?: string;
  codexForm?: string;
  mergeEligible?: boolean;
  isExperienceSpirit?: boolean;
  codexBonus?: Partial<CombatStats>;
  codexReward: number;
  basePct?: number;
  baseSpeedBonus?: number;
  baseSpeedBonusPct?: number;
}

const beastRows: BeastRow[] = [
  // Exact 13/17/11/7 codex order captured from the current original build.
  { id: "beast-1", name: "风灵", tier: 1, faction: "nature", artIndex: 0, codexReward: 20, codexBonus: { attack: 30, defense: 10 }, status: "confirmed" },
  { id: "beast-21", name: "坚果蝠", tier: 2, faction: "nature", artIndex: 1, codexReward: 30, codexBonus: { attack: 60, defense: 20 }, status: "confirmed" },
  { id: "beast-18", name: "小龙崽", tier: 3, faction: "nature", artIndex: 2, codexReward: 50, codexBonus: { attack: 90, defense: 30 }, status: "confirmed" },
  { id: "beast-22", name: "祝蝠", tier: 3, faction: "nature", artIndex: 3, codexReward: 50, codexBonus: { hp: 450, defense: 30 }, status: "confirmed" },
  { id: "beast-26", name: "小黑龙", tier: 4, faction: "nature", artIndex: 4, codexReward: 100, codexBonus: { attack: 300, defense: 200, lifesteal: 100 }, status: "confirmed" },
  { id: "beast-27", name: "吸血魔灵", tier: 4, faction: "nature", artIndex: 5, codexReward: 100, codexBonus: { hp: 1500, defense: 200, counter: 100 }, status: "confirmed" },
  { id: "beast-31", name: "火龙果", tier: 5, faction: "nature", artIndex: 6, codexReward: 200, codexBonus: { attack: 600, defense: 200, counter: 100, antiCounter: 100 }, status: "confirmed" },
  { id: "beast-8", name: "翡翠龙", tier: 6, faction: "nature", artIndex: 7, codexReward: 500, role: "治疗·击晕", skillName: "翡翠龙疗愈", codexBonus: { attack: 900, defense: 300, lifesteal: 300, antiCrit: 300 }, status: "confirmed" },
  { id: "beast-11", name: "史矛格", tier: 7, faction: "nature", artIndex: 8, codexReward: 1000, codexForm: "初始形态", codexBonus: { hp: 9000, defense: 600, crit: 600, antiCombo: 600 }, status: "confirmed" },
  { id: "beast-37", name: "史矛格", tier: 7, faction: "nature", artIndex: 9, codexReward: 1000, codexForm: "一星形态", basePct: 18, baseSpeedBonus: 300, mergeEligible: false, codexBonus: { attack: 1800, defense: 600, stun: 600, antiLifesteal: 600 }, status: "confirmed" },
  { id: "beast-38", name: "史矛格", tier: 7, faction: "nature", artIndex: 10, codexReward: 1000, codexForm: "二星形态", basePct: 20, baseSpeedBonusPct: 2, mergeEligible: false, codexBonus: { hp: 9000, attack: 1800, lifesteal: 600, antiCounter: 600 }, status: "confirmed" },
  { id: "beast-39", name: "史矛格", tier: 7, faction: "nature", artIndex: 11, codexReward: 1000, codexForm: "三星形态", basePct: 22, baseSpeedBonusPct: 3, mergeEligible: false, codexBonus: { hp: 9000, defense: 600, crit: 600, antiCombo: 600 }, status: "confirmed" },
  { id: "beast-12", name: "黄金史矛格", tier: 8, faction: "nature", artIndex: 12, codexReward: 2000, baseSpeedBonusPct: 4, mergeEligible: false, codexBonus: { attack: 1800, defense: 600, stun: 600, antiLifesteal: 600 }, status: "confirmed" },

  { id: "beast-2", name: "优秀经验精灵", tier: 1, faction: "element", artIndex: 13, codexReward: 20, isExperienceSpirit: true, mergeEligible: false, codexBonus: { hp: 150, defense: 10 }, status: "confirmed" },
  { id: "beast-20", name: "火灵", tier: 1, faction: "element", artIndex: 14, codexReward: 20, codexBonus: { hp: 150, attack: 30 }, status: "confirmed" },
  { id: "beast-3", name: "精良经验精灵", tier: 2, faction: "element", artIndex: 15, codexReward: 30, isExperienceSpirit: true, mergeEligible: false, codexBonus: { hp: 300, defense: 20 }, status: "confirmed" },
  { id: "beast-4", name: "电灵", tier: 2, faction: "element", artIndex: 16, codexReward: 30, codexBonus: { hp: 300, attack: 60 }, status: "confirmed" },
  { id: "beast-23", name: "稀有经验精灵", tier: 3, faction: "element", artIndex: 17, codexReward: 50, isExperienceSpirit: true, mergeEligible: false, codexBonus: { hp: 450, attack: 90 }, status: "confirmed" },
  { id: "beast-24", name: "火元素", tier: 3, faction: "element", artIndex: 18, codexReward: 50, codexBonus: { hp: 450, defense: 30 }, status: "confirmed" },
  { id: "beast-28", name: "史诗经验精灵", tier: 4, faction: "element", artIndex: 19, codexReward: 100, isExperienceSpirit: true, mergeEligible: false, codexBonus: { hp: 1500, defense: 200, combo: 100 }, status: "confirmed" },
  { id: "beast-29", name: "小火龙", tier: 4, faction: "element", artIndex: 20, codexReward: 100, codexBonus: { hp: 1500, defense: 200, dodge: 100 }, status: "confirmed" },
  { id: "beast-32", name: "传说经验精灵", tier: 5, faction: "element", artIndex: 21, codexReward: 200, isExperienceSpirit: true, mergeEligible: false, codexBonus: { hp: 3000, defense: 200, combo: 100, antiCrit: 100 }, status: "confirmed" },
  { id: "beast-33", name: "冰霜龙", tier: 5, faction: "element", artIndex: 22, codexReward: 200, codexBonus: { hp: 3000, attack: 600, dodge: 100, antiLifesteal: 100 }, status: "confirmed" },
  { id: "beast-7", name: "完美经验精灵", tier: 6, faction: "element", artIndex: 23, codexReward: 500, isExperienceSpirit: true, mergeEligible: false, codexBonus: { hp: 4500, defense: 300, dodge: 300, antiLifesteal: 300 }, status: "confirmed" },
  { id: "beast-36", name: "寒冰领主", tier: 6, faction: "element", artIndex: 24, codexReward: 500, codexBonus: { hp: 4500, defense: 300, counter: 300, antiDodge: 300 }, status: "confirmed" },
  { id: "beast-10", name: "雷神", tier: 7, faction: "element", artIndex: 25, codexReward: 1000, role: "治疗·雷击", skillName: "雷电疗愈", codexForm: "初始形态", codexBonus: { hp: 9000, defense: 600, combo: 600, antiStun: 600 }, status: "confirmed" },
  { id: "beast-40", name: "雷神", tier: 7, faction: "element", artIndex: 26, codexReward: 1000, codexForm: "一星形态", basePct: 18, baseSpeedBonus: 300, mergeEligible: false, codexBonus: { hp: 9000, attack: 1800, dodge: 600, antiDodge: 600 }, status: "confirmed" },
  { id: "beast-41", name: "雷神", tier: 7, faction: "element", artIndex: 27, codexReward: 1000, codexForm: "二星形态", basePct: 20, baseSpeedBonusPct: 2, mergeEligible: false, codexBonus: { attack: 1800, defense: 600, counter: 600, antiCrit: 600 }, status: "confirmed" },
  { id: "beast-42", name: "雷神", tier: 7, faction: "element", artIndex: 28, codexReward: 1000, codexForm: "三星形态", basePct: 22, baseSpeedBonusPct: 3, mergeEligible: false, codexBonus: { hp: 9000, defense: 600, combo: 600, antiStun: 600 }, status: "confirmed" },
  { id: "beast-13", name: "九霄雷神", tier: 8, faction: "element", artIndex: 29, codexReward: 2000, baseSpeedBonusPct: 4, mergeEligible: false, codexBonus: { hp: 9000, attack: 1800, dodge: 600, antiDodge: 600 }, status: "confirmed" },

  { id: "beast-19", name: "大眼蝠", tier: 3, faction: "shadow", artIndex: 30, codexReward: 50, codexBonus: { attack: 90, defense: 30 }, status: "confirmed" },
  { id: "beast-25", name: "雪幽灵", tier: 3, faction: "shadow", artIndex: 31, codexReward: 50, codexBonus: { hp: 450, attack: 90 }, status: "confirmed" },
  { id: "beast-5", name: "古拉蝠", tier: 4, faction: "shadow", artIndex: 32, codexReward: 100, codexBonus: { attack: 300, defense: 200, crit: 100 }, status: "confirmed" },
  { id: "beast-30", name: "幽灵法师", tier: 4, faction: "shadow", artIndex: 33, codexReward: 100, codexBonus: { hp: 1500, attack: 300, stun: 100 }, status: "confirmed" },
  { id: "beast-34", name: "电波龙", tier: 5, faction: "shadow", artIndex: 34, codexReward: 200, codexBonus: { hp: 3000, defense: 200, crit: 100, antiCounter: 100 }, status: "confirmed" },
  { id: "beast-6", name: "梦魔", tier: 6, faction: "shadow", artIndex: 35, codexReward: 500, codexBonus: { hp: 4500, attack: 900, dodge: 300, antiCombo: 300 }, status: "confirmed" },
  { id: "beast-14", name: "德古拉", tier: 7, faction: "shadow", artIndex: 36, codexReward: 1000, codexForm: "初始形态", codexBonus: { attack: 1800, defense: 600, counter: 600, antiCrit: 600 }, status: "confirmed" },
  { id: "beast-43", name: "德古拉", tier: 7, faction: "shadow", artIndex: 37, codexReward: 1000, codexForm: "一星形态", basePct: 18, baseSpeedBonus: 300, mergeEligible: false, codexBonus: { hp: 9000, defense: 600, combo: 600, antiStun: 600 }, status: "confirmed" },
  { id: "beast-44", name: "德古拉", tier: 7, faction: "shadow", artIndex: 38, codexReward: 1000, codexForm: "二星形态", basePct: 20, baseSpeedBonusPct: 2, mergeEligible: false, codexBonus: { attack: 1800, defense: 600, counter: 600, antiCrit: 600 }, status: "confirmed" },
  { id: "beast-45", name: "德古拉", tier: 7, faction: "shadow", artIndex: 39, codexReward: 1000, codexForm: "三星形态", basePct: 22, baseSpeedBonusPct: 3, mergeEligible: false, codexBonus: { hp: 9000, defense: 600, combo: 600, antiStun: 600 }, status: "confirmed" },
  { id: "beast-15", name: "血焰德古拉", tier: 8, faction: "shadow", artIndex: 40, codexReward: 2000, baseSpeedBonusPct: 4, mergeEligible: false, codexBonus: { hp: 9000, defense: 600, combo: 600, antiStun: 600 }, status: "confirmed" },

  { id: "beast-35", name: "精灵龙", tier: 5, faction: "legend", artIndex: 41, codexReward: 200, codexBonus: { attack: 600, defense: 200, stun: 100, antiCombo: 100 }, status: "confirmed" },
  { id: "beast-9", name: "幽灵公主", tier: 6, faction: "legend", artIndex: 42, codexReward: 500, role: "击晕·压制", skillName: "幽灵飞扑", codexBonus: { hp: 4500, attack: 900, stun: 300, antiStun: 300 }, status: "confirmed" },
  { id: "beast-16", name: "月之祭司", tier: 7, faction: "legend", artIndex: 43, codexReward: 1000, codexForm: "初始形态", codexBonus: { hp: 9000, attack: 1800, lifesteal: 600, antiCounter: 600 }, status: "confirmed" },
  { id: "beast-46", name: "月之祭司", tier: 7, faction: "legend", artIndex: 44, codexReward: 1000, codexForm: "一星形态", basePct: 18, baseSpeedBonus: 300, mergeEligible: false, codexBonus: { hp: 9000, defense: 600, crit: 600, antiCombo: 600 }, status: "confirmed" },
  { id: "beast-47", name: "月之祭司", tier: 7, faction: "legend", artIndex: 45, codexReward: 1000, codexForm: "二星形态", basePct: 20, baseSpeedBonusPct: 2, mergeEligible: false, codexBonus: { attack: 1800, defense: 600, stun: 600, antiLifesteal: 600 }, status: "confirmed" },
  { id: "beast-48", name: "月之祭司", tier: 7, faction: "legend", artIndex: 46, codexReward: 1000, codexForm: "三星形态", basePct: 22, baseSpeedBonusPct: 3, mergeEligible: false, codexBonus: { hp: 9000, attack: 1800, lifesteal: 600, antiCounter: 600 }, status: "confirmed" },
  { id: "beast-17", name: "暗月祭司", tier: 8, faction: "legend", artIndex: 47, codexReward: 2000, baseSpeedBonusPct: 4, mergeEligible: false, codexBonus: { hp: 9000, defense: 600, crit: 600, antiCombo: 600 }, status: "confirmed" }
];

export const BEASTS: BeastDefinition[] = beastRows.map((item) => ({
  id: item.id,
  name: item.name,
  tier: item.tier,
  faction: item.faction as BeastFaction,
  artIndex: item.artIndex,
  codexBonus: item.codexBonus ?? {},
  codexBonusStatus: "confirmed",
  skillName: item.skillName ?? (item.isExperienceSpirit ? "经验灵技" : "基础战技"),
  role: item.role ?? (item.isExperienceSpirit ? "出战·经验培养" : "魔兽助战"),
  accent: BEAST_QUALITIES[item.tier - 1].color,
  skillInterval: item.name === "古拉蝠" ? 2 : ["翡翠龙", "幽灵公主", "雷神"].includes(item.name) ? 1 : 3,
  skillDamagePct: item.name === "幽灵公主" ? 117 : item.name === "雷神" ? 79 : undefined,
  skillHealPct: item.name === "翡翠龙" ? 98 : item.name === "雷神" ? 112 : undefined,
  skill: item.name === "古拉蝠"
    ? "每2回合行动一次，主动技能提高主角攻击"
    : item.name === "翡翠龙"
      ? "翡翠龙疗愈：每1回合恢复主角攻击98%的生命，攻击+10%，击晕+22%"
      : item.name === "幽灵公主"
        ? "幽灵飞扑：每1回合造成主角攻击117%的伤害，暴击+22%，敌方防御-24%"
        : item.name === "雷神"
          ? "雷电疗愈：每1回合治疗；雷灵珠每3回合追加雷击"
          : item.isExperienceSpirit ? "可出战或助战；拖给任意魔兽时转化为该品质经验" : "出战后按回合释放固定战技",
  baseBonusPct: { hp: item.basePct ?? [0, 2, 4, 6, 8, 10, 12, 15, 24][item.tier], attack: item.basePct ?? [0, 2, 4, 6, 8, 10, 12, 15, 24][item.tier], defense: item.basePct ?? [0, 2, 4, 6, 8, 10, 12, 15, 24][item.tier] },
  bonus: {},
  sourceStatus: item.status,
  codexForm: item.codexForm,
  mergeEligible: item.mergeEligible ?? true,
  isExperienceSpirit: item.isExperienceSpirit,
  codexReward: item.codexReward,
  baseSpeedBonus: item.baseSpeedBonus ?? (item.baseSpeedBonusPct ? undefined : 60 + item.tier * 30),
  baseSpeedBonusPct: item.baseSpeedBonusPct
}));

const beastStarForms = new Map<string, BeastDefinition[]>();
BEASTS.filter((definition) => definition.tier === 7 && definition.mergeEligible === false).forEach((definition) => {
  const forms = beastStarForms.get(definition.name) || [];
  forms.push(definition);
  beastStarForms.set(definition.name, forms.sort((left, right) => left.artIndex - right.artIndex));
});

export function beastDisplayArtIndex(definitionId: string | undefined, stars = 0) {
  const definition = BEASTS.find((item) => item.id === definitionId);
  if (!definition || stars < 1 || definition.tier !== 7 || definition.mergeEligible === false) return definition?.artIndex ?? -1;
  const forms = beastStarForms.get(definition.name) || [];
  return forms[Math.min(stars, forms.length) - 1]?.artIndex ?? definition.artIndex;
}

export const BEAST_EVOLUTIONS: Readonly<Record<string, string>> = {
  "beast-10": "beast-13",
  "beast-11": "beast-12",
  "beast-14": "beast-15",
  "beast-16": "beast-17"
};

export interface BeastCodexSlot {
  id: string;
  faction: BeastFaction;
  tier: number;
  definitionId?: string;
}

// Every one of the 48 recorded codex positions now points to an actual entity.
// Layout-only question-mark cells are rendered by the view and are not data slots.
export const BEAST_CODEX_SLOTS: BeastCodexSlot[] = BEAST_FACTIONS.flatMap((faction) =>
  BEAST_QUALITIES.flatMap((quality) => BEASTS
    .filter((definition) => definition.faction === faction.id && definition.tier === quality.tier)
    .map((definition, index) => ({
      id: `beast-codex-${faction.id}-${quality.tier}-${index + 1}`,
      faction: faction.id,
      tier: quality.tier,
      definitionId: definition.id
    })))
);

export const BEAST_AFFIX_POOL = [
  ["speed", "速度", 5.88], ["hp", "生命", 5.88], ["attack", "攻击", 5.88], ["defense", "防御", 5.88],
  ["lifesteal", "吸血", 2.94], ["counter", "反击", 2.94], ["combo", "连击", 2.94], ["dodge", "闪避", 2.94],
  ["crit", "暴击", 2.94], ["stun", "击晕", 2.94], ["hpBonus", "生命加成", 1.77], ["attackBonus", "攻击加成", 1.77],
  ["defenseBonus", "防御加成", 1.77], ["antiLifesteal", "吸血抗性", 5.88], ["antiDodge", "闪避抗性", 5.88],
  ["antiCrit", "暴击抗性", 5.88], ["antiStun", "击晕抗性", 5.88], ["antiCombo", "连击抗性", 5.88],
  ["antiCounter", "反击抗性", 5.88], ["critDamage", "暴伤", 2.94], ["tenacity", "坚毅", 4.71],
  ["healing", "减疗", 2.94], ["recovery", "恢复", 4.71], ["damageBonus", "重伤", 2.94]
] as const;

export const MOUNT_QUALITIES: { tier: MountQuality; name: string; color: string; mainMax: number; otherMax: number }[] = [
  { tier: 1, name: "优秀", color: "#55c56b", mainMax: 2.2, otherMax: 2.2 },
  { tier: 2, name: "精良", color: "#3ba7e6", mainMax: 3, otherMax: 2.2 },
  { tier: 3, name: "稀有", color: "#9860e4", mainMax: 3, otherMax: 2.2 },
  { tier: 4, name: "史诗", color: "#e6bf3d", mainMax: 3.3, otherMax: 2.2 },
  { tier: 5, name: "完美", color: "#e84b4b", mainMax: 3.6, otherMax: 2.2 }
];

export const MOUNTS: { id: string; name: string; quality: MountQuality; mainStat: GrowthStat; mainName: string; art: number; sourceStatus: "public_name" }[] = [
  { id: "mount-thunder", name: "雷霆", quality: 1, mainStat: "stun", mainName: "击晕", art: 0, sourceStatus: "public_name" },
  { id: "mount-avalanche", name: "雪崩", quality: 2, mainStat: "defenseBonus", mainName: "防御加成", art: 1, sourceStatus: "public_name" },
  { id: "mount-hunter", name: "追猎者", quality: 3, mainStat: "crit", mainName: "暴击", art: 2, sourceStatus: "public_name" },
  { id: "mount-cloud", name: "筋斗云", quality: 4, mainStat: "speed", mainName: "速度", art: 3, sourceStatus: "public_name" }
];

export const MOUNT_DRAW_RATES = {
  normal: [6750, 2800, 350, 100],
  advanced: [0, 7800, 1650, 550]
} as const;

export const RUNES: { id: string; name: string; tier: 1 | 2 | 3; quality: "绿色" | "蓝色" | "橙色"; stat: keyof CombatStats; base: number; art: number; effect: string }[] = [
  { id: "rune-life", name: "生命符文", tier: 1, quality: "绿色", stat: "hp", base: 7800, art: 0, effect: "提高主人物生命" },
  { id: "rune-blood", name: "猎血符文", tier: 1, quality: "绿色", stat: "lifesteal", base: 110, art: 1, effect: "提高吸血，适合持续作战" },
  { id: "rune-thorn", name: "荆棘符文", tier: 1, quality: "绿色", stat: "counter", base: 110, art: 2, effect: "受击时更容易反击" },
  { id: "rune-haste", name: "疾行符文", tier: 1, quality: "绿色", stat: "speed", base: 95, art: 3, effect: "提高速度，争取先手" },
  { id: "rune-revive", name: "复活符文", tier: 2, quality: "蓝色", stat: "recovery", base: 180, art: 4, effect: "提高恢复能力，适合卡关时切换" },
  { id: "rune-fury", name: "狂攻符文", tier: 2, quality: "蓝色", stat: "combo", base: 190, art: 5, effect: "提高连击，增加出手次数" },
  { id: "rune-mirage", name: "幻影符文", tier: 2, quality: "蓝色", stat: "dodge", base: 190, art: 6, effect: "提高闪避，克制爆发流派" },
  { id: "rune-tough", name: "坚韧符文", tier: 2, quality: "蓝色", stat: "tenacity", base: 190, art: 7, effect: "提高坚毅，降低暴击威胁" },
  { id: "rune-holy", name: "神圣符文", tier: 3, quality: "橙色", stat: "damageReduction", base: 260, art: 8, effect: "提高最终减伤，是后期试炼核心符文" },
  { id: "rune-judgment", name: "天罚符文", tier: 3, quality: "橙色", stat: "crit", base: 280, art: 9, effect: "提高暴击，强化爆发" },
  { id: "rune-shackle", name: "禁锢符文", tier: 3, quality: "橙色", stat: "stun", base: 280, art: 10, effect: "提高击晕，压制对方行动" },
  { id: "rune-breaker", name: "破军符文", tier: 3, quality: "橙色", stat: "damageBonus", base: 260, art: 11, effect: "提高最终增伤，适合输出流派" }
];

export const RUNE_DRAW_ITEMS = [
  { id: "orange", name: "橙色符文", rate: 553 },
  { id: "green", name: "绿色符文", rate: 4841 },
  { id: "blue", name: "蓝色符文", rate: 3458 },
  { id: "wild", name: "百变符文", rate: 111 },
  { id: "multi-2", name: "2连抽", rate: 346 },
  { id: "multi-3", name: "3连抽", rate: 346 },
  { id: "multi-5", name: "5连抽", rate: 345 }
] as const;

export const GEM_COLORS: { id: GemColor; name: string; color: string; baseStat: keyof CombatStats; secondary: [keyof CombatStats, keyof CombatStats]; art: number }[] = [
  { id: "red", name: "红色宝石", color: "#e64e46", baseStat: "speed", secondary: ["lifesteal", "counter"], art: 5 },
  { id: "blue", name: "蓝色宝石", color: "#409be7", baseStat: "attack", secondary: ["crit", "stun"], art: 5 },
  { id: "orange", name: "橙色宝石", color: "#ef9e35", baseStat: "hp", secondary: ["combo", "dodge"], art: 5 },
  { id: "green", name: "绿色宝石", color: "#51b869", baseStat: "defense", secondary: ["crit", "combo"], art: 5 }
];

export const GEM_BASE_VALUES: Record<GemColor, number[]> = {
  red: [3, 5, 8, 13, 21, 34, 58, 74],
  blue: [80, 140, 240, 400, 680, 1150, 2016, 2583],
  orange: [180, 300, 500, 820, 1350, 2300, 4224, 5412],
  green: [8, 13, 22, 36, 60, 105, 192, 246]
};

export const ARTIFACTS: { id: string; name: string; quality: 2 | 3 | 4 | 5; stat: keyof CombatStats; base: number; art: number; role: string }[] = [
  { id: "artifact-ares", name: "阿瑞斯之剑", quality: 2, stat: "stun", base: 260, art: 6, role: "击晕" },
  { id: "artifact-feather", name: "天羽羽斩", quality: 3, stat: "crit", base: 320, art: 7, role: "暴击" },
  { id: "artifact-immortal", name: "不灭之刃", quality: 4, stat: "stun", base: 430, art: 8, role: "击晕" },
  { id: "artifact-ocean", name: "海角天涯", quality: 5, stat: "crit", base: 560, art: 9, role: "暴击" }
];

export const FLAG_EXP_ROLLS = [
  { exp: 1, rate: 3000 }, { exp: 2, rate: 2000 }, { exp: 3, rate: 2000 },
  { exp: 5, rate: 1500 }, { exp: 10, rate: 1000 }, { exp: 20, rate: 500 }
] as const;

export const TURNTABLE_POOLS = [
  [
    { name: "宝箱×999", rate: 331, reward: { chestTicket: 999 } },
    { name: "宝石券×5", rate: 514, reward: { gemTicket: 5 } },
    { name: "食物×20", rate: 514, reward: { food: 20 } },
    { name: "宝箱×200", rate: 1440, reward: { chestTicket: 200 } },
    { name: "肉排×20", rate: 1440, reward: { steak: 20 } },
    { name: "宝箱×99", rate: 1440, reward: { chestTicket: 99 } },
    { name: "宝石券×1", rate: 1440, reward: { gemTicket: 1 } },
    { name: "食物×5", rate: 1440, reward: { food: 5 } },
    { name: "肉排×10", rate: 1441, reward: { steak: 10 } }
  ],
  [
    { name: "宝箱×999", rate: 331, reward: { chestTicket: 999 } },
    { name: "魔兽精华×5", rate: 514, reward: { beastEssence: 5 } },
    { name: "符文碎片×20", rate: 514, reward: { runeShard: 20 } },
    { name: "宝石券×5", rate: 1440, reward: { gemTicket: 5 } },
    { name: "宝箱×200", rate: 1440, reward: { chestTicket: 200 } },
    { name: "符文碎片×10", rate: 1440, reward: { runeShard: 10 } },
    { name: "魔兽精华×2", rate: 1440, reward: { beastEssence: 2 } },
    { name: "宝箱×99", rate: 1440, reward: { chestTicket: 99 } },
    { name: "食物×10", rate: 1441, reward: { food: 10 } }
  ]
] as const;

const cardNames = ["破阵", "守城", "疾风", "烈火", "山岳", "潮生", "雷鸣", "月影", "星落", "日耀"];
export const SOUL_CARD_SET_STATS: Record<string, BuildStat> = {
  破阵: "crit", 守城: "counter", 疾风: "combo", 烈火: "stun", 山岳: "dodge",
  潮生: "lifesteal", 雷鸣: "crit", 月影: "dodge", 星落: "combo", 日耀: "stun"
};
export const SOUL_CARDS: CollectionDefinition[] = cardNames.flatMap((setName, setIndex) => [0, 1, 2].map((part) => ({
  id: `card-${setIndex + 1}-${part + 1}`,
  name: `${setName}·${["锋", "心", "印"][part]}`,
  tier: Math.min(6, 1 + Math.floor(setIndex / 2)),
  role: `${setName}套装`,
  accent: ["#5aa9c9", "#a66cc7", "#d39443", "#d05259", "#48a98c"][setIndex % 5],
  skill: `集齐三张激活${setName}共鸣`,
  bonus: part === 0 ? { attack: 18 + setIndex * 3 } : part === 1 ? { hp: 180 + setIndex * 25 } : { defense: 14 + setIndex * 2 }
})));

export const SYSTEM_UPGRADES = [
  { id: "mount", name: "坐骑", unlock: 35, max: 60, resource: "gold" as ResourceId, baseCost: 5000, stat: "speed" as keyof CombatStats },
  { id: "rune", name: "符文", unlock: 40, max: 80, resource: "runeShard" as ResourceId, baseCost: 5, stat: "attack" as keyof CombatStats },
  { id: "gem", name: "宝石", unlock: 40, max: 40, resource: "gemTicket" as ResourceId, baseCost: 2, stat: "hp" as keyof CombatStats },
  { id: "artifact", name: "神器", unlock: 45, max: 50, resource: "diamond" as ResourceId, baseCost: 30, stat: "crit" as keyof CombatStats },
  { id: "flag", name: "战旗", unlock: 45, max: 120, resource: "merit" as ResourceId, baseCost: 8, stat: "defense" as keyof CombatStats },
  { id: "territory", name: "领地", unlock: 30, max: 30, resource: "guildCoin" as ResourceId, baseCost: 10, stat: "hp" as keyof CombatStats }
];

const huntingRows: [string, number][] = [
  ["芝麻兔", 2.19], ["黑羽鸭", 2.19], ["天使猪", 0.73], ["蕉鸭", 1.75], ["绵羊兔", 2.19], ["火箭雀", 0.58], ["崖崖牛", 1.32], ["珍珠雀", 2.19],
  ["小梅花", 3.65], ["梅花鹿", 3.65], ["梅花男爵", 3.65], ["小羊羔", 3.65], ["翠花", 2.92], ["迈克", 2.92], ["白羽鸭", 3.65], ["面粉袋", 1.83],
  ["线团", 1.83], ["香菇", 1.83], ["薄荷", 1.83], ["玫瑰", 1.83], ["棉花团", 1.83], ["木头", 1.1], ["百日菊", 0.37], ["金松子", 0.37],
  ["莲雾", 0.73], ["南瓜", 0.73], ["奇异贝壳", 1.46], ["洋甘菊", 1.46], ["石块", 1.83], ["战鹰鹿", 1.75], ["绿叶鹿", 0.88], ["长毛野猪", 2.19],
  ["蔡狗兔", 1.46], ["恐鸭", 1.46], ["小恶魔", 1.46], ["泥牛", 2.92], ["黄牛", 2.92], ["犹猪", 2.92], ["公鸡", 2.19], ["绿孔雀", 2.19],
  ["黄冠鸡", 2.19], ["旭日新鸡", 0.73], ["金牛", 1.46], ["叶牛", 1.46], ["彩虹牛", 1.46], ["牦牛", 2.92], ["猪", 2.92], ["羊", 2.92],
  ["牛", 2.92], ["雪鹿王", 0.73], ["幻牛", 0.44], ["秃孔雀", 1.46], ["灵魂鹿", 0.44]
];

const huntingCodexStats: GrowthStat[] = [
  "hpBonus", "attackBonus", "defenseBonus", "crit", "dodge",
  "stun", "combo", "counter", "lifesteal", "speed"
];

export const HUNTING_POOL: HuntingDefinition[] = huntingRows.map(([name, rate], index) => {
  const rarity = (rate <= 0.73 ? 3 : rate <= 1.5 ? 2 : 1) as 1 | 2 | 3;
  const stat = huntingCodexStats[index % huntingCodexStats.length];
  const percentage = !["speed"].includes(stat);
  const value = [0, 18, 34, 60][rarity];
  return {
    id: `hunt-${index + 1}`,
    name,
    rate,
    rarity,
    codexStat: stat,
    codexValue: percentage ? value : Math.round(value / 2),
    duplicateValue: [0, 8, 18, 45][rarity]
  };
});

export const OFFICIAL_PROBABILITY_SECTIONS = [
  { title: "坐骑刷新", rows: [["普通：优秀/精良/稀有/史诗", "67.5% / 28% / 3.5% / 1%"], ["高级：精良/稀有/史诗", "78% / 16.5% / 5.5%"], ["升级命中主属性", "66.67%"], ["升级命中其他属性", "33.33%"]] },
  { title: "魔兽合成", rows: [["合成精良（蓝）", "90%"], ["合成稀有（紫）", "80%"], ["合成史诗（黄）", "60%"], ["合成传说（橙）", "30%"], ["合成完美（红）", "20%"], ["合成超凡（青）", "10%"], ["优秀至传说合成失败", "同品质经验精灵"], ["完美合成超凡失败", "完美经验精灵×1、超凡碎片×1；5片合成1只超凡"], ["超凡养成", "消耗其他超凡觉醒至1/2/3星，再提升为对应璀璨"]] },
  { title: "魔兽蛋", rows: [["黄色魔兽蛋", "固定产出史诗品质（原机确认）"], ["稀有级魔兽蛋", "小龙崽/祝蝠/火元素/大眼蝠/雪幽灵 各20%"], ["传说级魔兽蛋", "火龙果40% · 冰霜龙/电波龙/精灵龙各20%"], ["完美级魔兽蛋", "翡翠龙/幽灵公主各16.67% · 寒冰领主/梦魔各33.33%"], ["超凡级魔兽蛋", "雷神/史矛格各33.33% · 德古拉/月之祭司各16.67%"]] },
  { title: "魔晶获取", rows: [["优秀级魔兽合成", "0.04%"], ["精良级魔兽合成", "0.18%"], ["稀有级魔兽合成", "1%"], ["史诗级魔兽合成", "5.6%"], ["传说级魔兽合成", "48%"], ["完美级魔兽合成", "90%"]] },
  { title: "魔兽培养（原机记录）", rows: [["技能洗炼", "金币80,000"], ["随机升级被动", "魔晶×8"], ["优秀经验精灵", "经验+600；高品质经验逐级翻倍"]] },
  { title: "战魂合成", rows: [["投入数量", "越多成功率越高，最高100%"], ["合成失败", "保留主战魂，消耗副战魂"], ["合成成功", "下一品质战魂均分概率"], ["精炼继承", "继承主战魂属性与幸运值"]] },
  { title: "符文抽取", rows: [["绿色符文", "48.41%"], ["蓝色符文", "34.58%"], ["橙色符文", "5.53%"], ["百变符文", "1.11%"], ["2/3/5连抽", "各3.46%"]] },
  { title: "宝石合成", rows: [["红/蓝/橙/绿宝石", "各25%"], ["1~5级升阶", "3颗同级合成1颗随机颜色"], ["6级升7级", "2颗6级宝石定向合成"], ["7级升8级", "3颗7级宝石定向合成"]] },
  { title: "战旗升级", rows: [["1~9级", "100%"], ["10~19级", "90%"], ["20~29级", "80%"], ["30~39级", "70%"], ["40~49级", "60%"], ["50~59级", "50%"], ["60~69级", "40%"], ["70~79级", "30%"], ["80~89级", "20%"], ["90~120级", "10%"]] },
  { title: "战旗进度值", rows: [["+1 / +2 / +3", "30% / 20% / 20%"], ["+5 / +10 / +20", "15% / 10% / 5%"]] },
  { title: "每日转盘", rows: [["宝箱×999", "3.31%"], ["次稀有两项", "各5.14%"], ["其余六项", "各14.40%"], ["完整获取", "9次后必然获得全部9项"]] },
  { title: "魔兽技能洗练", rows: [["优秀/精良", "初70% · 中20% · 高10%"], ["稀有", "初60% · 中25% · 高15%"], ["史诗", "初50% · 中30% · 高20%"], ["传说", "初40% · 中35% · 高25%"], ["完美", "初30% · 中40% · 高30%"], ["超凡", "中45% · 高55%"]] },
  { title: "战宠突变品质", rows: [["炼魂草：绿/蓝/紫/黄", "5% / 3% / 1.5% / 0.5%"], ["炼魂花：蓝/紫/黄/橙", "4% / 5% / 4% / 2%"], ["传说炼魂果：紫/黄/橙/红", "6% / 8% / 4% / 2%"]] },
  { title: "战宠觉醒品质", rows: [["幸运0+", "精良60% · 稀有35% · 史诗5%"], ["幸运500+", "精良40% · 稀有35% · 史诗18% · 完美7%"], ["幸运1500+", "精良20% · 稀有35% · 史诗25% · 完美12% · 超凡/完全觉醒各4%"], ["幸运2000+", "稀有30% · 史诗34% · 完美20% · 超凡/完全觉醒各8%"], ["幸运2500+", "超凡/完全觉醒各50%"]] },
  { title: "宝箱额外产出", rows: [["竞技场门票", "每次开箱3%"], ["一锤定音活动道具", "每次开箱1%"], ["国王宝库道具", "开箱1% · 角斗胜利30% · 领地25%"], ["金蛇送福道具", "开箱1% · 角斗胜利35% · 领地50%"]] },
  { title: "魂卡规则", rows: [["召唤", "同品质魂卡均分概率"], ["合成/置换", "同品质战魂均分概率"], ["魂卡洗练主词条", "四元素攻击/防御/生命与战斗属性"]] }
];

export const EMPTY_STATS: CombatStats = {
  hp: 100, attack: 10, defense: 3, speed: 10,
  lifesteal: 0, crit: 0, dodge: 0, stun: 0, combo: 0, counter: 0,
  antiLifesteal: 0, antiCrit: 0, antiDodge: 0, antiStun: 0, antiCombo: 0, antiCounter: 0,
  critDamage: 0, tenacity: 0, healing: 0, recovery: 0, damageBonus: 0,
  damageReduction: 0, beastStrength: 0
};

export const COMBAT_STAT_META: Record<keyof CombatStats, { name: string; sources: string[] }> = {
  hp: { name: "生命", sources: ["人物升级", "装备与精炼", "战魂/魔兽", "坐骑/宝石/战旗"] },
  attack: { name: "攻击", sources: ["人物升级", "装备与精炼", "战魂/魔兽", "坐骑/神器"] },
  defense: { name: "防御", sources: ["人物升级", "装备与精炼", "战魂/魔兽", "坐骑/宝石/战旗"] },
  speed: { name: "速度", sources: ["人物升级", "装备词条", "魔兽洗练", "坐骑/红宝石"] },
  lifesteal: { name: "吸血", sources: ["装备词条", "战魂精炼", "魔兽洗练", "魂卡/宝石/战旗"] },
  crit: { name: "暴击", sources: ["装备词条", "战魂精炼", "魔兽洗练", "魂卡/宝石/神器/战旗"] },
  dodge: { name: "闪避", sources: ["装备词条", "战魂精炼", "魔兽洗练", "魂卡/宝石/战旗"] },
  stun: { name: "击晕", sources: ["装备词条", "战魂精炼", "魔兽洗练", "魂卡/宝石/神器/战旗"] },
  combo: { name: "连击", sources: ["装备词条", "战魂精炼", "魔兽洗练", "魂卡/宝石/战旗"] },
  counter: { name: "反击", sources: ["装备词条", "战魂精炼", "魔兽洗练", "魂卡/宝石/战旗"] },
  antiLifesteal: { name: "吸血抗性", sources: ["装备词条", "战魂精炼", "魔兽洗练"] },
  antiCrit: { name: "暴击抗性", sources: ["装备词条", "战魂精炼", "魔兽洗练"] },
  antiDodge: { name: "闪避抗性", sources: ["装备词条", "战魂精炼", "魔兽洗练"] },
  antiStun: { name: "击晕抗性", sources: ["装备词条", "战魂精炼", "魔兽洗练"] },
  antiCombo: { name: "连击抗性", sources: ["装备词条", "战魂精炼", "魔兽洗练"] },
  antiCounter: { name: "反击抗性", sources: ["装备词条", "战魂精炼", "魔兽洗练"] },
  critDamage: { name: "暴击伤害", sources: ["装备词条", "战魂精炼", "魔兽洗练"] },
  tenacity: { name: "坚毅", sources: ["装备词条", "战魂精炼", "魔兽洗练"] },
  healing: { name: "疗伤", sources: ["装备词条", "战魂精炼", "魔兽洗练"] },
  recovery: { name: "恢复", sources: ["装备词条", "战魂精炼", "魔兽洗练", "复活符文"] },
  damageBonus: { name: "伤害加成", sources: ["装备词条", "战魂精炼", "魔兽洗练", "战魂技能"] },
  damageReduction: { name: "伤害减免", sources: ["装备词条", "战魂精炼", "魔兽洗练", "神圣符文"] },
  beastStrength: { name: "魔兽强化", sources: ["出战魔兽品质/等级", "装备词条", "魔兽洗练"] }
};
