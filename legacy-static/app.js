const STORAGE_KEY = "ydxz-local-v4";

const qualities = [
  { id: "blue", name: "蓝色", bp: 416, color: "#3cb8ff", sell: 900 },
  { id: "purple", name: "紫色", bp: 2700, color: "#9b5cff", sell: 2100 },
  { id: "yellow", name: "黄色", bp: 3800, color: "#ffd84f", sell: 3600 },
  { id: "orange", name: "橙色", bp: 2100, color: "#ff8a2f", sell: 7200 },
  { id: "red", name: "红色", bp: 700, color: "#ff4a40", sell: 12800 },
  { id: "cyan", name: "青色", bp: 200, color: "#23e2d1", sell: 26000 },
  { id: "gold", name: "金色", bp: 80, color: "#ffe46d", sell: 52000 },
  { id: "rainbow", name: "彩色", bp: 4, color: "#ff76ef", sell: 180000 }
];

const slots = ["武器", "头盔", "护肩", "衣服", "裤子", "靴子", "项链", "戒指", "腰带", "手套", "护腕", "盾牌"];
const mainAttrs = ["攻击", "防御", "生命", "速度"];
const battleAttrs = ["吸血", "暴击", "闪避", "击晕", "连击", "反击"];

const shopProducts = [
  { tab: "diamond", price: "¥6", title: "钻石小袋", desc: "钻石 x60", diamond: 60 },
  { tab: "diamond", price: "¥30", title: "钻石钱袋", desc: "钻石 x300", diamond: 300 },
  { tab: "diamond", price: "¥68", title: "钻石宝匣", desc: "钻石 x680", diamond: 680 },
  { tab: "diamond", price: "¥128", title: "钻石木桶", desc: "钻石 x1280", diamond: 1280 },
  { tab: "diamond", price: "¥328", title: "钻石宝库", desc: "钻石 x3280", diamond: 3280 },
  { tab: "diamond", price: "¥648", title: "钻石山", desc: "钻石 x6480", diamond: 6480 },
  { tab: "daily", price: "¥68", title: "每日战魂礼", desc: "钻石 x680 / 自选紫色战魂箱 x1 / 战魂资源 x20", diamond: 680, soulCore: 20, gold: 200000, soulBox: "purple" },
  { tab: "daily", price: "¥198", title: "传说战魂礼", desc: "钻石 x1980 / 自选金色战魂箱 x1 / 战魂资源 x50", diamond: 1980, soulCore: 50, gold: 800000, soulBox: "gold" },
  { tab: "daily", price: "¥648", title: "满额养成礼", desc: "钻石 x6480 / 自选橙色战魂箱 x1 / 战魂资源 x100", diamond: 6480, soulCore: 100, gold: 3000000, soulBox: "orange" }
];

const warTierOrder = ["fine", "rare", "epic", "legend", "perfect", "ancient"];
const warTierMeta = {
  fine: { label: "精良级", maxFeed: 2, core: 12 },
  rare: { label: "稀有级", maxFeed: 3, core: 20 },
  epic: { label: "史诗级", maxFeed: 4, core: 45 },
  legend: { label: "传说级", maxFeed: 5, core: 80 },
  perfect: { label: "完美级", maxFeed: 5, core: 120 },
  ancient: { label: "高阶", maxFeed: 5, core: 160 }
};

const soulBoxMeta = {
  purple: { label: "自选紫色战魂箱", tier: "rare" },
  gold: { label: "自选金色战魂箱", tier: "epic" },
  orange: { label: "自选橙色战魂箱", tier: "legend" }
};

const warSouls = [
  { id: "bulang", name: "布朗", tier: "fine", stage: 1, level: 1, count: 4, stats: ["生命 +8.00%", "防御 +2.00%"], skills: ["第 4 回合护卫", "提高防御"] },
  { id: "cangyun", name: "苍云", tier: "fine", stage: 1, level: 1, count: 4, stats: ["攻击 +2.50%", "速度 +12"], skills: ["第 3 回合云袭", "提高速度"] },
  { id: "yeger", name: "耶格尔", tier: "rare", stage: 2, level: 1, count: 3, stats: ["攻击 +4.50%", "暴击 +2.20%"], skills: ["第 3 回合狩猎", "提高暴击"] },
  { id: "wuyun", name: "乌云", tier: "rare", stage: 3, level: 1, count: 3, stats: ["生命 +15.00%", "攻击 +4.00%", "防御 +4.00%"], skills: ["野蛮之击：攻击提升，5 阶后升级", "利爪：降低回复与防御，5 阶后升级", "迅捷：闪避提升，6 阶后升级"] },
  { id: "taini", name: "泰尼", tier: "epic", stage: 2, level: 1, count: 2, stats: ["生命 +18.00%", "防御 +5.00%", "反击 +3.00%"], skills: ["石肤减伤", "被击时概率反击"] },
  { id: "youmier", name: "尤弥尔", tier: "epic", stage: 2, level: 1, count: 2, stats: ["攻击 +7.50%", "暴击 +5.00%", "速度 +30"], skills: ["第 3 回合冰裂", "提升暴击伤害", "命中后降低速度"] },
  { id: "yacha", name: "夜叉", tier: "epic", stage: 2, level: 1, count: 2, stats: ["攻击 +6.00%", "连击 +3.20%", "暴击 +2.80%"], skills: ["夜袭", "提高连击", "追击残血目标"] },
  { id: "luosha", name: "罗刹", tier: "epic", stage: 2, level: 1, count: 2, stats: ["攻击 +6.50%", "吸血 +3.00%", "反击 +2.50%"], skills: ["第 4 回合斩魂", "吸取生命"] },
  { id: "bobi", name: "波比", tier: "legend", stage: 1, level: 1, count: 1, stats: ["生命 +28.00%", "防御 +8.00%", "闪避抗性 +3.50%"], skills: ["第 4 回合凝胶护盾", "降低受到伤害", "护盾破裂时反弹"] },
  { id: "yingwuzhe", name: "影武者", tier: "legend", stage: 1, level: 1, count: 1, stats: ["攻击 +9.00%", "速度 +42", "连击 +4.00%"], skills: ["第 2 回合影袭", "提高连击概率", "追加一次低伤害攻击"] },
  { id: "yanmo", name: "炎魔", tier: "legend", stage: 1, level: 1, count: 1, stats: ["攻击 +10.00%", "暴击 +4.50%", "生命 +20.00%"], skills: ["第 3 回合喷发", "造成灼烧", "暴击时延长灼烧"] },
  { id: "jiguang", name: "极光", tier: "legend", stage: 1, level: 1, count: 1, stats: ["速度 +60", "闪避 +4.50%", "生命 +22.00%"], skills: ["第 1 回合极光闪", "提高闪避", "闪避后恢复生命"] },
  { id: "nase", name: "纳塞", tier: "legend", stage: 1, level: 1, count: 1, stats: ["攻击 +8.50%", "吸血 +4.00%", "防御 +6.00%"], skills: ["第 5 回合吞噬", "造成伤害并回复", "低血量时效果增强"] },
  { id: "sishen", name: "死神", tier: "perfect", stage: 1, level: 1, count: 0, stats: ["攻击 +13.00%", "暴击 +6.00%", "击晕 +4.00%"], skills: ["第 2 回合收割", "目标生命越低伤害越高"] },
  { id: "honglian", name: "红莲", tier: "perfect", stage: 1, level: 1, count: 0, stats: ["生命 +30.00%", "攻击 +9.00%", "吸血 +4.50%"], skills: ["红莲灼烧", "释放后回复生命"] },
  { id: "bomengte", name: "波蒙特", tier: "perfect", stage: 1, level: 1, count: 0, stats: ["防御 +11.00%", "反击 +5.00%", "生命 +28.00%"], skills: ["第 5 回合壁垒", "反击时减伤"] },
  { id: "anubisi", name: "阿努比斯", tier: "perfect", stage: 1, level: 1, count: 0, stats: ["攻击 +11.00%", "连击 +5.50%", "速度 +50"], skills: ["审判印记", "连击时追加伤害"] },
  { id: "nainisi", name: "奈尼斯", tier: "perfect", stage: 1, level: 1, count: 0, stats: ["生命 +32.00%", "闪避 +5.00%", "防御 +8.00%"], skills: ["幻影庇护", "闪避后恢复"] },
  { id: "qinglong", name: "青龙", tier: "ancient", stage: 10, level: 4, count: 1, stats: ["生命 +40.00%", "攻击 +10.00%", "防御 +10.00%"], skills: ["神罚天雷 Lv.4：第 2 回合释放，冷却 2 回合", "雷灵 Lv.4：释放战魂技能后回复 20% 生命", "神威 Lv.4：战斗开始降低敌方特殊抗性", "龙之传承 Lv.4：攻击和连击时叠加连击与元素增幅"] },
  { id: "baihu", name: "白虎", tier: "ancient", stage: 1, level: 1, count: 0, stats: ["攻击 +10.00%", "暴击 +6.00%", "速度 +60"], skills: ["白虎扑杀", "暴击后追加伤害"] },
  { id: "zhuque", name: "朱雀", tier: "ancient", stage: 10, level: 1, count: 1, stats: ["生命 +40.00%", "攻击 +10.00%", "防御 +10.00%"], skills: ["圣焰 Lv.1：第 2 回合释放，攻击造成 196% 伤害", "业火 Lv.1：攻击时提升全元素增幅", "重燃 Lv.1：死亡时复活并回复生命", "离火 Lv.1：释放技能后回复生命并提升抗性"] },
  { id: "xuanwu", name: "玄武", tier: "ancient", stage: 1, level: 1, count: 0, stats: ["生命 +42.00%", "防御 +12.00%", "反击抗性 +6.00%"], skills: ["玄甲守护", "受到伤害时叠加护盾"] },
  { id: "qiexiya", name: "切茜娅", tier: "ancient", stage: 1, level: 1, count: 0, stats: ["攻击 +12.00%", "连击 +6.00%", "吸血 +5.00%"], skills: ["魅影连舞", "连击时吸血"] },
  { id: "haidela", name: "海德拉", tier: "ancient", stage: 1, level: 1, count: 0, stats: ["生命 +38.00%", "攻击 +11.00%", "击晕 +5.00%"], skills: ["多头撕咬", "概率击晕并追加毒伤"] }
].map((soul) => ({ ...soul, quality: warTierMeta[soul.tier].label, ...soulFlavor(soul.id) }));

function soulFlavor(id) {
  return {
    bulang: { role: "守护型", trigger: "第 4 回合", desc: "低阶护卫战魂，适合前期补生命和防御，精炼后能稳定撑高基础坦度。" },
    cangyun: { role: "疾攻型", trigger: "第 3 回合", desc: "前期开荒型战魂，提供速度和攻击，适合抢先手。" },
    yeger: { role: "猎杀型", trigger: "第 3 回合", desc: "稀有暴击战魂，围绕狩猎标记提高爆发，适合暴击流过渡。" },
    wuyun: { role: "撕裂型", trigger: "普攻强化", desc: "稀有核心战魂之一，兼顾生命、攻击、防御，技能围绕野蛮之击、利爪和迅捷展开。" },
    taini: { role: "壁垒型", trigger: "受击后", desc: "史诗防守战魂，通过石肤和反击稳定消耗对手。" },
    youmier: { role: "冰爆型", trigger: "第 3 回合", desc: "史诗爆发战魂，冰裂后压低速度并提高暴击收益。" },
    yacha: { role: "追击型", trigger: "攻击后", desc: "夜袭型连击战魂，适合连击和收割残血目标。" },
    luosha: { role: "吸血型", trigger: "第 4 回合", desc: "通过斩魂与吸血维持续航，适合长回合对局。" },
    bobi: { role: "护盾型", trigger: "第 4 回合", desc: "传说防守战魂，依靠凝胶护盾减伤并在破盾时反制。" },
    yingwuzhe: { role: "连击型", trigger: "第 2 回合", desc: "传说进攻战魂，影袭后提高连击概率并追加伤害。" },
    yanmo: { role: "灼烧型", trigger: "第 3 回合", desc: "传说火焰战魂，喷发造成灼烧，暴击时延长灼烧收益。" },
    jiguang: { role: "闪避型", trigger: "第 1 回合", desc: "传说机动战魂，极光闪提高闪避，闪避后获得恢复。" },
    nase: { role: "吞噬型", trigger: "第 5 回合", desc: "传说续航战魂，低血量阶段吞噬收益更高。" },
    sishen: { role: "收割型", trigger: "第 2 回合", desc: "完美爆发战魂，目标生命越低，收割伤害越强。" },
    honglian: { role: "灼疗型", trigger: "技能释放后", desc: "完美火焰战魂，兼顾灼烧和生命回复。" },
    bomengte: { role: "反击型", trigger: "第 5 回合", desc: "完美防守战魂，壁垒状态下反击减伤。" },
    anubisi: { role: "审判型", trigger: "连击时", desc: "完美连击战魂，审判印记会在连击时追加伤害。" },
    nainisi: { role: "幻影型", trigger: "闪避后", desc: "完美闪避战魂，幻影庇护让闪避和恢复形成循环。" },
    qinglong: { role: "雷罚型", trigger: "第 2 回合 / 冷却 2 回合", desc: "高阶雷元素战魂，神罚天雷、雷灵、神威和龙之传承围绕触电、连击与元素增幅成长。" },
    baihu: { role: "暴击型", trigger: "暴击后", desc: "高阶爆发战魂，白虎扑杀在暴击后追加压制伤害。" },
    zhuque: { role: "复燃型", trigger: "第 2 回合 / 死亡时", desc: "高阶火元素战魂，圣焰、业火、重燃、离火同时提供增伤、复活和抗性。" },
    xuanwu: { role: "玄甲型", trigger: "受到伤害时", desc: "高阶防守战魂，玄甲守护持续叠加护盾。" },
    qiexiya: { role: "魅影型", trigger: "连击时", desc: "高阶连舞战魂，连击越多吸血收益越高。" },
    haidela: { role: "毒控型", trigger: "攻击时", desc: "高阶控制战魂，多头撕咬可击晕并追加持续毒伤。" }
  }[id] || { role: "战斗型", trigger: "战斗中", desc: "战魂会在指定回合或条件下触发技能，并通过精炼提高整体强度。" };
}

const navItems = [
  ["chest", "宝箱"],
  ["shop", "商城"],
  ["war", "战魂"],
  ["duel", "决斗"],
  ["guild", "公会"]
];

const defaultState = () => ({
  page: "chest",
  shopTab: "diamond",
  warTab: "refine",
  selectedSoul: "",
  composeSoul: "",
  selectedSoulInstance: "",
  composeSoulInstance: "",
  deployedSoulInstance: "",
  composeSelected: [],
  selectedRefineId: "",
  selectedRefineIds: [],
  gold: 872000,
  diamond: 16382,
  soulCore: 3118,
  chestTickets: 317505,
  chestLevel: 30,
  chestProgress: 3,
  power: 1718900000,
  loot: [],
  equipped: makeEquipment("orange", "武器", 138),
  warInventory: Object.fromEntries(warSouls.map((soul) => [soul.id, 0])),
  warOwned: [],
  soulBoxes: { purple: 0, gold: 0, orange: 0 },
  lastSoulDrops: [],
  warStages: Object.fromEntries(warSouls.map((soul) => [soul.id, soul.stage])),
  warLevels: Object.fromEntries(warSouls.map((soul) => [soul.id, soul.level])),
  composeFeed: 2,
  warLuck: 634,
  refineSlots: [],
  refineLines: ["生命 +8373", "坚毅 +2.65%", "防御 +296", "暴击 +3.04%", "击晕 +2.67%", "闪避抗性 +2.54%"],
  log: "进入跃动小子本地服"
});

let soulUidCounter = Date.now();
let refineUidCounter = Date.now();
let state = loadState();
let toastTimer = null;

function defaultRefineSlots() {
  return [
    makeRefineEntry("yellow", ["生命 +8373", "坚毅 +2.65%", "防御 +296", "暴击 +3.04%"], true),
    makeRefineEntry("yellow", ["生命 +9591", "击晕 +2.67%", "闪避抗性 +2.54%", "暴击抗性 +2.90%"], true),
    makeRefineEntry("yellow", ["生命 +9111", "攻击 +547", "恢复 +2.87%", "吸血 +3.13%"], true),
    makeRefineEntry("yellow", ["生命 +9045", "生命 +4447", "威吓 +2.15%", "减疗 +3.06%"], true),
    makeRefineEntry("orange", ["生命 +9327", "暴击 +3.77%", "暴击抗性 +3.87%", "击晕抗性 +3.00%"], true),
    makeRefineEntry("purple", ["生命 +5727", "吸血 +2.58%", "恢复 +2.65%", "连击抗性 +3.10%"], false)
  ];
}

function makeRefineEntry(star, lines, locked = false) {
  return {
    id: `refine-${refineUidCounter += 1}-${Math.random().toString(16).slice(2)}`,
    star,
    lines,
    locked
  };
}

function loadState() {
  try {
    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const next = { ...defaultState(), ...loaded };
    next.warInventory = { ...defaultState().warInventory, ...(loaded.warInventory || {}) };
    next.warOwned = Array.isArray(loaded.warOwned) && loaded.warOwned.length
      ? loaded.warOwned
      : inventoryToInstances(next.warInventory);
    next.warInventory = inventoryFromInstances(next.warOwned, next.warInventory);
    next.warStages = { ...defaultState().warStages, ...(loaded.warStages || {}) };
    next.warLevels = { ...defaultState().warLevels, ...(loaded.warLevels || {}) };
    next.soulBoxes = { ...defaultState().soulBoxes, ...(loaded.soulBoxes || {}) };
    if (!Array.isArray(next.lastSoulDrops)) next.lastSoulDrops = [];
    if (!next.deployedSoulInstance && next.warOwned[0]) next.deployedSoulInstance = next.warOwned[0].uid;
    if (!Array.isArray(next.composeSelected)) next.composeSelected = [];
    if (!Array.isArray(next.selectedRefineIds)) next.selectedRefineIds = [];
    if (!Array.isArray(next.refineSlots)) next.refineSlots = defaultRefineSlots();
    if (!Number.isFinite(next.composeFeed)) next.composeFeed = 2;
    return next;
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function fmt(value) {
  if (value >= 100000000) return `${trim(value / 100000000)}亿`;
  if (value >= 10000) return `${trim(value / 10000)}万`;
  return `${Math.floor(value)}`;
}

function trim(value) {
  return value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2).replace(/\.0+$/, "");
}

function pickQuality() {
  const roll = Math.floor(Math.random() * 10000);
  let sum = 0;
  for (const quality of qualities) {
    sum += quality.bp;
    if (roll < sum) return quality;
  }
  return qualities[qualities.length - 1];
}

function makeEquipment(qualityId, slot, level) {
  const quality = qualities.find((item) => item.id === qualityId) || qualities[0];
  const base = level * (quality.sell / 120);
  const attrs = [
    ["攻击", Math.round(base * (0.6 + Math.random() * 0.8))],
    ["防御", Math.round(base * (0.35 + Math.random() * 0.55))],
    ["生命", Math.round(base * (5 + Math.random() * 4))],
    ["速度", Math.round(15 + Math.random() * 45)]
  ];
  const subAttrs = battleAttrs
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((name) => [name, `${(1.5 + Math.random() * 7).toFixed(2)}%`]);

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    slot,
    level,
    quality: quality.id,
    qualityName: quality.name,
    name: `${quality.name}的${slot}`,
    sell: quality.sell + level * 80,
    attrs,
    subAttrs
  };
}

function openChest(times = 10) {
  if (state.chestTickets < times) {
    showToast("宝箱券不足，商城可补资源");
    return;
  }
  state.chestTickets -= times;
  state.loot = Array.from({ length: times }, () => {
    const quality = pickQuality();
    const slot = slots[Math.floor(Math.random() * slots.length)];
    return makeEquipment(quality.id, slot, 132 + Math.floor(Math.random() * 8));
  });
  state.log = `${times} 倍开箱完成`;
  saveState();
  render();
}

function sellLoot() {
  if (!state.loot.length) {
    showToast("没有可出售装备");
    return;
  }
  const gain = state.loot.reduce((sum, item) => sum + item.sell, 0);
  state.gold += gain;
  state.loot = [];
  state.log = `分解装备获得金币 ${fmt(gain)}`;
  saveState();
  render();
  showToast(`金币 +${fmt(gain)}`);
}

function equipBest() {
  if (!state.loot.length) {
    showToast("先开箱获得装备");
    return;
  }
  const best = state.loot.slice().sort((a, b) => scoreEquipment(b) - scoreEquipment(a))[0];
  state.equipped = best;
  state.power += Math.round(scoreEquipment(best) * 130);
  state.loot = state.loot.filter((item) => item.id !== best.id);
  state.log = `已装备 ${best.name}`;
  saveState();
  render();
  showToast("已穿戴评分最高装备");
}

function scoreEquipment(item) {
  const rank = qualities.findIndex((quality) => quality.id === item.quality) + 1;
  return item.level * 10 + rank * 1600 + item.attrs.reduce((sum, attr) => sum + Number(attr[1]), 0);
}

function soulById(id) {
  return warSouls.find((item) => item.id === id) || warSouls[0];
}

function makeSoulInstance(soulId) {
  const soul = soulById(soulId);
  return {
    uid: `soul-${soulUidCounter += 1}-${Math.random().toString(16).slice(2)}`,
    soulId,
    stage: soul.stage,
    level: soul.level
  };
}

function inventoryToInstances(inventory) {
  return Object.entries(inventory || {}).flatMap(([soulId, count]) =>
    Array.from({ length: Math.max(0, Number(count) || 0) }, () => makeSoulInstance(soulId))
  );
}

function soulFromInstance(instance) {
  return soulById(instance?.soulId);
}

function soulStage(id) {
  const instance = state.warOwned?.find((item) => item.uid === id || item.soulId === id);
  if (instance) return instance.stage;
  return state.warStages?.[id] ?? soulById(id).stage;
}

function soulLevel(id) {
  const instance = state.warOwned?.find((item) => item.uid === id || item.soulId === id);
  if (instance) return instance.level;
  return state.warLevels?.[id] ?? soulById(id).level;
}

function soulCount(id) {
  if (Array.isArray(state.warOwned)) return state.warOwned.filter((item) => item.soulId === id).length;
  return state.warInventory?.[id] ?? soulById(id).count ?? 0;
}

function rebuildWarInventory() {
  state.warInventory = inventoryFromInstances(state.warOwned);
}

function inventoryFromInstances(instances, fallback = {}) {
  const inventory = Object.fromEntries(warSouls.map((soul) => [soul.id, 0]));
  if (Array.isArray(instances) && instances.length) {
    instances.forEach((instance) => {
      if (inventory[instance.soulId] !== undefined) inventory[instance.soulId] += 1;
    });
    return inventory;
  }
  return { ...inventory, ...fallback };
}

function composeNeed(soul) {
  return warTierMeta[soul.tier]?.maxFeed || 3;
}

function composeInputCount(soul, availableCount) {
  const requested = Math.max(2, Number(state.composeFeed) || 2);
  const capped = Math.min(composeNeed(soul), availableCount);
  return Math.max(0, Math.min(requested, capped));
}

function composeChance(soul, inputCount = state.composeFeed || 2) {
  if (inputCount < 2) return 0;
  return Math.min(100, Math.round((inputCount / composeNeed(soul)) * 100));
}

function refineCost() {
  return 12 + Math.floor(state.refineSlots.length / 2) * 3;
}

function refineStarScore() {
  return state.refineSlots.reduce((sum, slot) => {
    if (slot.star === "orange") return sum + 5;
    if (slot.star === "yellow") return sum + 4;
    if (slot.star === "purple") return sum + 3;
    if (slot.star === "blue") return sum + 2;
    return sum;
  }, 0);
}

function refineGrade() {
  const score = refineStarScore();
  if (score >= 38) return { label: "超凡", level: 6, tone: "orange" };
  if (score >= 30) return { label: "完美", level: 5, tone: "gold" };
  if (score >= 22) return { label: "传说", level: 4, tone: "orange" };
  if (score >= 14) return { label: "史诗", level: 3, tone: "purple" };
  if (score >= 7) return { label: "稀有", level: 2, tone: "blue" };
  return { label: "普通", level: 1, tone: "gray" };
}

function refineSummaryLines() {
  if (!state.refineSlots.length) return ["生命 +0", "攻击 +0", "防御 +0", "战斗属性 +0.00%"];
  const lines = state.refineSlots.flatMap((slot) => slot.lines);
  return lines.slice(0, 5);
}

function tierLabel(tier) {
  return warTierMeta[tier]?.label || tier;
}

function tierSouls(tier) {
  return warSouls.filter((soul) => soul.tier === tier);
}

function nextTier(tier) {
  const index = warTierOrder.indexOf(tier);
  if (index < 0 || index >= warTierOrder.length - 1) return null;
  return warTierOrder[index + 1];
}

function randomSoulInTier(tier) {
  const pool = tierSouls(tier);
  return pool[Math.floor(Math.random() * pool.length)] || null;
}

function upgradeChest() {
  const cost = 1600000;
  if (state.gold < cost) {
    showToast("金币不足");
    return;
  }
  state.gold -= cost;
  state.chestProgress += 1;
  if (state.chestProgress >= 5) {
    state.chestLevel += 1;
    state.chestProgress = 0;
    state.log = `宝箱升级至 Lv.${state.chestLevel}`;
    showToast("宝箱升级成功");
  } else {
    state.log = `宝箱升级进度 ${state.chestProgress}/5`;
    showToast("升级进度 +1");
  }
  saveState();
  render();
}

function buyProduct(index) {
  const product = shopProducts.filter((item) => item.tab === state.shopTab)[index];
  if (!product) return;
  state.diamond += product.diamond || 0;
  state.soulCore += product.soulCore || 0;
  state.gold += product.gold || 0;
  if (product.soulBox) state.soulBoxes[product.soulBox] = (state.soulBoxes[product.soulBox] || 0) + 1;
  state.log = `购买成功：${product.title}`;
  saveState();
  render();
  showToast(`${product.title} 已发放`);
}

function openSoulBox(tier, amount = 1) {
  const box = soulBoxMeta[tier];
  if (!box) {
    showToast("战魂箱配置错误");
    return;
  }
  const ownedBoxes = state.soulBoxes[tier] || 0;
  if (ownedBoxes <= 0) {
    showToast("没有可打开的战魂箱");
    return;
  }
  const count = amount === "all" ? ownedBoxes : Math.max(1, Math.min(Number(amount) || 1, ownedBoxes));
  const drops = [];
  for (let index = 0; index < count; index += 1) {
    const soul = randomSoulInTier(box.tier);
    if (!soul) {
      showToast("该战魂箱配置为空");
      return;
    }
    const instance = makeSoulInstance(soul.id);
    state.warOwned.push(instance);
    drops.push({ uid: instance.uid, soulId: soul.id, tier: soul.tier, name: soul.name });
  }
  state.soulBoxes[tier] -= count;
  rebuildWarInventory();
  const latest = drops[drops.length - 1];
  state.selectedSoul = latest.soulId;
  state.composeSoul = latest.soulId;
  state.selectedSoulInstance = latest.uid;
  state.composeSoulInstance = latest.uid;
  if (!state.deployedSoulInstance) state.deployedSoulInstance = latest.uid;
  state.lastSoulDrops = drops.slice(-12);
  state.warTab = "detail";
  state.log = `打开${box.label} x${count}，获得 ${drops.map((drop) => drop.name).join("、")}`;
  saveState();
  render();
  showToast(`获得 ${count} 只战魂`);
}

function refineSoul() {
  const cost = refineCost();
  if (state.soulCore < cost) {
    showToast("战魂资源不足");
    return;
  }
  if (state.refineSlots.length >= 10) {
    showToast("精炼槽已满，先回退一条");
    return;
  }
  state.soulCore -= cost;
  state.warLuck = Math.max(0, state.warLuck + (Math.random() < 0.78 ? 8 + Math.floor(Math.random() * 13) : -Math.floor(Math.random() * 18)));
  state.refineSlots.push(generateRefineSlot());
  state.log = `新增 1 条战魂精炼属性`;
  saveState();
  render();
  showToast("精炼完成");
}

function generateRefineSlot() {
  const luck = state.warLuck || 0;
  const roll = Math.random() * 1000;
  const star = roll < 50 + luck / 18 ? "orange" : roll < 210 + luck / 7 ? "yellow" : roll < 650 ? "purple" : "blue";
  const pool = ["坚毅", "防御", "暴击抗性", "击晕", "闪避抗性", "攻击", "恢复", "吸血", "暴击", "暴击伤害", "击晕抗性", "连击抗性"];
  const scale = star === "orange" ? 1.35 : star === "yellow" ? 1.12 : star === "purple" ? 0.92 : 0.72;
  const lines = [`生命 +${Math.floor((5200 + Math.random() * 4700) * scale)}`];
  while (lines.length < 4) {
    const attr = pool[Math.floor(Math.random() * pool.length)];
    const value = attr === "攻击" || attr === "防御"
      ? `+${Math.floor((240 + Math.random() * 520) * scale)}`
      : `+${(1.7 + Math.random() * 2.3 * scale).toFixed(2)}%`;
    lines.push(`${attr} ${value}`);
  }
  return makeRefineEntry(star, lines, false);
}

function rollbackRefine() {
  const selected = new Set(state.selectedRefineIds || []);
  const removable = state.refineSlots.filter((slot) => selected.has(slot.id) && !slot.locked);
  if (!removable.length) {
    showToast("先选择一个或多个未锁定的精炼槽");
    return;
  }
  const removableIds = new Set(removable.map((slot) => slot.id));
  state.refineSlots = state.refineSlots.filter((slot) => !removableIds.has(slot.id));
  state.selectedRefineId = "";
  state.selectedRefineIds = [];
  state.warLuck = Math.max(0, state.warLuck - 18 * removable.length);
  state.log = `回退 ${removable.length} 条精炼属性`;
  saveState();
  render();
  showToast(`已回退 ${removable.length} 条`);
}

function composeSoul() {
  const selected = getComposeSoul();
  if (!selected) {
    showToast("当前没有可合成的战魂");
    return;
  }
  const soul = selected.soul;
  const next = nextTier(soul.tier);
  if (!next) {
    showToast("该品质暂不能继续合成");
    return;
  }
  const candidates = getOwnedSouls().filter((item) => item.soul.tier === soul.tier);
  const selectedFirst = candidates.find((item) => item.instance.uid === selected.instance.uid) || candidates[0];
  const minInputs = 2;
  const inputCount = composeInputCount(soul, candidates.length);
  const selectedInputs = [selectedFirst, ...candidates.filter((item) => item.instance.uid !== selectedFirst.instance.uid)].slice(0, inputCount);
  const chance = composeChance(soul, selectedInputs.length);
  if (selectedInputs.length < minInputs) {
    showToast(`至少需要 2 只${tierLabel(soul.tier)}战魂`);
    return;
  }
  const success = Math.random() * 100 < chance;
  if (success) {
    const result = randomSoulInTier(next);
    if (!result) {
      showToast("目标品质战魂池为空");
      return;
    }
    const consumedIds = new Set(selectedInputs.map((item) => item.instance.uid));
    state.warOwned = state.warOwned.filter((item) => !consumedIds.has(item.uid));
    const instance = makeSoulInstance(result.id);
    instance.refineGrade = refineGrade().level;
    instance.refineLuck = state.warLuck;
    state.warOwned.push(instance);
    state.selectedSoul = result.id;
    state.composeSoul = result.id;
    state.selectedSoulInstance = instance.uid;
    state.composeSoulInstance = instance.uid;
    state.log = `合成成功，获得${tierLabel(next)} ${result.name}，继承当前精炼水平`;
  } else {
    const consumedIds = new Set(selectedInputs.slice(1).map((item) => item.instance.uid));
    state.warOwned = state.warOwned.filter((item) => !consumedIds.has(item.uid));
    state.selectedSoulInstance = selectedFirst.instance.uid;
    state.composeSoulInstance = selectedFirst.instance.uid;
    state.selectedSoul = selectedFirst.soul.id;
    state.composeSoul = selectedFirst.soul.id;
    const fallback = getOwnedSouls()[0];
    if (!state.selectedSoulInstance && fallback) {
      state.selectedSoulInstance = fallback.instance.uid;
      state.composeSoulInstance = fallback.instance.uid;
      state.selectedSoul = fallback.soul.id;
      state.composeSoul = fallback.soul.id;
    }
    state.log = `合成失败，主战魂保留，副战魂消耗 ${Math.max(0, selectedInputs.length - 1)} 只`;
  }
  rebuildWarInventory();
  saveState();
  render();
  showToast(state.log);
}

function fillCompose() {
  const selected = getComposeSoul();
  if (!selected) {
    showToast("当前没有可放入的战魂");
    return;
  }
  const sameTierCount = getOwnedSouls().filter((item) => item.soul.tier === selected.soul.tier).length;
  state.composeFeed = composeInputCount(selected.soul, sameTierCount);
  saveState();
  render();
  showToast(`已放入 ${state.composeFeed} 只战魂`);
}

function adjustComposeFeed(delta) {
  const selected = getComposeSoul();
  if (!selected) return;
  const sameTierCount = getOwnedSouls().filter((item) => item.soul.tier === selected.soul.tier).length;
  const max = Math.min(composeNeed(selected.soul), sameTierCount);
  const min = sameTierCount >= 2 ? 2 : sameTierCount;
  state.composeFeed = Math.max(min, Math.min(max, (state.composeFeed || 2) + delta));
  saveState();
  render();
}

function deploySoul() {
  const selected = getSelectedSoul();
  if (!selected) {
    showToast("当前没有可出战的战魂");
    return;
  }
  state.deployedSoulInstance = selected.instance.uid;
  state.log = `${selected.soul.name} 已出战`;
  saveState();
  render();
  showToast("已设置出战战魂");
}

function resetState() {
  state = defaultState();
  saveState();
  render();
  showToast("本地服已重置");
}

function setPage(page) {
  state.page = page;
  saveState();
  render();
}

function setShopTab(tab) {
  state.shopTab = tab;
  saveState();
  render();
}

function setWarTab(tab) {
  state.warTab = tab;
  saveState();
  render();
}

function selectSoul(id) {
  state.selectedSoul = id;
  const instance = state.warOwned.find((item) => item.soulId === id);
  state.selectedSoulInstance = instance?.uid || "";
  state.warTab = "codex";
  saveState();
  render();
}

function selectComposeSoul(id) {
  const instance = state.warOwned.find((item) => item.uid === id);
  if (!instance) return;
  state.composeSoul = instance.soulId;
  state.composeSoulInstance = instance.uid;
  const soul = soulFromInstance(instance);
  const sameTierCount = getOwnedSouls().filter((item) => item.soul.tier === soul.tier).length;
  state.composeFeed = Math.min(Math.max(2, sameTierCount), composeNeed(soul));
  saveState();
  render();
}

function render() {
  const root = document.getElementById("app");
  if (state.page === "war") {
    root.innerHTML = `
      <section class="phone-screen war-screen">
        ${renderWarSoul()}
        <div class="toast" id="toast"></div>
      </section>
    `;
  } else {
    root.innerHTML = `
      <section class="phone-screen page-${state.page}">
        ${renderTopBar()}
        ${renderPage()}
        ${renderBottomNav()}
        <div class="toast" id="toast"></div>
      </section>
    `;
  }
  bindActions(root);
}

function renderTopBar() {
  return `
    <header class="topbar">
      <div class="avatar">
        <span>跃</span>
        <b>Lv.134</b>
      </div>
      <div class="profile">
        <div class="name-row">
          <strong>跃动小子</strong>
          <span>S999 本地服</span>
        </div>
        <div class="power">战力 ${fmt(state.power)}</div>
      </div>
      <button class="tiny-reset" data-action="reset">重置</button>
    </header>
    <div class="resource-row">
      <div class="resource"><span>金币</span><b>${fmt(state.gold)}</b></div>
      <div class="resource"><span>钻石</span><b>${fmt(state.diamond)}</b></div>
      <div class="resource"><span>魂核</span><b>${fmt(state.soulCore)}</b></div>
    </div>
  `;
}

function renderPage() {
  if (state.page === "shop") return renderShop();
  if (state.page === "war") return renderWarSoul();
  if (state.page === "duel") return renderLocked("决斗", "基础数值、多回合、六技能概率触发会放在下一轮实现。");
  if (state.page === "guild") return renderLocked("公会", "公会大厅、成员、商店入口先占位，后续接资源系统。");
  return renderChest();
}

function renderChest() {
  return `
    <main class="content chest-page">
      <section class="notice-strip">【玩法】${state.log}</section>
      <section class="hero-field">
        <div class="side-stack left">
          ${sideIcon("商店", "shop")}
          ${sideIcon("战魂", "war")}
          ${sideIcon("领地", "guild")}
        </div>
        <div class="chest-stage">
          <div class="reward-spark s1"></div>
          <div class="reward-spark s2"></div>
          <div class="treasure-chest">
            <div class="chest-lid"></div>
            <div class="chest-lock"></div>
            <div class="chest-body"></div>
          </div>
          <div class="chest-shadow"></div>
        </div>
        <div class="side-stack right">
          ${sideIcon("坐骑", "locked")}
          ${sideIcon("魂卡", "locked")}
          ${sideIcon("神器", "locked")}
        </div>
      </section>
      <section class="chest-panel">
        <div class="panel-title">
          <strong>宝箱 Lv.${state.chestLevel}</strong>
          <span>升级进度 ${state.chestProgress}/5</span>
        </div>
        <div class="rate-row">
          ${qualities.map((item) => `<span class="rate q-${item.id}">${item.name.replace("色", "")} ${(item.bp / 100).toFixed(2)}%</span>`).join("")}
        </div>
        <div class="ticket-row">
          <span>宝箱券 ${fmt(state.chestTickets)}</span>
          <button class="small-btn" data-action="upgradeChest">升级宝箱</button>
        </div>
        <div class="action-row">
          <button class="primary-btn" data-action="openChest">开启 10 次</button>
          <button class="secondary-btn" data-action="sellLoot">全部分解</button>
          <button class="secondary-btn" data-action="equipBest">穿戴最佳</button>
        </div>
      </section>
      ${renderEquipmentArea()}
    </main>
  `;
}

function sideIcon(label, action) {
  return `<button class="side-icon" data-action="${action}"><span>${label.slice(0, 1)}</span><b>${label}</b></button>`;
}

function renderEquipmentArea() {
  const items = state.loot.length ? state.loot : [state.equipped];
  return `
    <section class="loot-panel">
      <div class="panel-title">
        <strong>${state.loot.length ? "开箱结果" : "当前装备"}</strong>
        <span>${state.loot.length ? `${state.loot.length} 件待处理` : state.equipped.name}</span>
      </div>
      <div class="loot-grid">
        ${items.map(renderEquipmentCard).join("")}
      </div>
    </section>
  `;
}

function renderEquipmentCard(item) {
  return `
    <article class="equip-card q-${item.quality}">
      <div class="equip-icon">${item.slot.slice(0, 1)}</div>
      <div class="equip-info">
        <strong>${item.name}</strong>
        <span>等级 ${item.level}　评分 ${fmt(scoreEquipment(item))}</span>
      </div>
    </article>
  `;
}

function renderShop() {
  const products = shopProducts.filter((item) => item.tab === state.shopTab);
  return `
    <main class="content shop-page">
      <section class="page-title">
        <h1>商城</h1>
        <span>本地服自由购买</span>
      </section>
      <div class="tabs">
        <button class="${state.shopTab === "diamond" ? "active" : ""}" data-shop-tab="diamond">钻石仓库</button>
        <button class="${state.shopTab === "daily" ? "active" : ""}" data-shop-tab="daily">每日礼包</button>
      </div>
      <section class="shop-list">
        ${products.map((item, index) => `
          <article class="shop-card">
            <div class="pack-art ${item.tab}">
              <span>${item.tab === "diamond" ? "钻" : "礼"}</span>
            </div>
            <div class="shop-info">
              <strong>${item.title}</strong>
              <p>${item.desc}</p>
            </div>
            <button class="buy-btn" data-buy="${index}">${item.price}</button>
          </article>
        `).join("")}
      </section>
      ${state.shopTab === "daily" ? renderSoulBoxShelf() : ""}
    </main>
  `;
}

function renderSoulBoxShelf() {
  const boxes = [
    ["purple", "自选紫色战魂箱", "可开稀有级"],
    ["gold", "自选金色战魂箱", "可开史诗级"],
    ["orange", "自选橙色战魂箱", "可开传说级"]
  ];
  return `
    <section class="soul-box-shelf">
      ${boxes.map(([tier, label, hint]) => `
        <article class="box-${tier}">
          <strong>${label}</strong>
          <span>${hint}　库存 ${state.soulBoxes[tier] || 0}</span>
          <div class="box-actions">
            <button data-soul-box="${tier}" data-soul-box-count="1">开 1</button>
            <button data-soul-box="${tier}" data-soul-box-count="10">开 10</button>
            <button data-soul-box="${tier}" data-soul-box-count="all">全开</button>
          </div>
        </article>
      `).join("")}
      ${state.lastSoulDrops.length ? `
        <div class="soul-drop-log">
          <b>最近获得</b>
          <div>${state.lastSoulDrops.map((drop) => `<span>${drop.name}</span>`).join("")}</div>
        </div>
      ` : ""}
    </section>
  `;
}

function renderWarSoul() {
  const selected = getSelectedSoul();
  const soul = selected?.soul || null;
  return `
    <main class="war-page war-tab-${state.warTab}">
      ${renderWarTop()}
      <button class="war-help">?</button>
      ${state.warTab === "compose" ? renderSoulCompose() : state.warTab === "codex" ? renderSoulCodex(soul || warSouls[0]) : state.warTab === "detail" ? renderWarMain(selected) : renderSoulRefine(soul)}
      ${renderWarBottomTabs()}
    </main>
  `;
}

function getOwnedSouls() {
  return state.warOwned.map((instance) => ({ instance, soul: soulFromInstance(instance) }));
}

function getSelectedSoul() {
  const owned = getOwnedSouls();
  const found = owned.find((item) => item.instance.uid === state.selectedSoulInstance);
  return found || owned[0] || null;
}

function getComposeSoul() {
  const owned = getOwnedSouls();
  const found = owned.find((item) => item.instance.uid === state.composeSoulInstance);
  return found || owned[0] || null;
}

function renderWarAvatar(soul, extra = "") {
  return `
    <span class="war-avatar ${extra} ${soul.id} ${soulHasArt(soul.id) ? "with-art" : ""}">
      <i>${soulMark(soul.id)}</i>
      <em>${soul.name}</em>
    </span>
  `;
}

function renderCodexPortrait(soul) {
  return `
    <span class="codex-portrait ${soul.id} ${soulHasArt(soul.id) ? "with-art" : ""}">
      <i>${soulMark(soul.id)}</i>
    </span>
  `;
}

function soulHasArt(id) {
  return [
    "bulang", "cangyun", "yeger", "wuyun", "taini", "youmier", "yacha", "luosha",
    "bobi", "yingwuzhe", "yanmo", "jiguang", "nase", "sishen", "honglian", "bomengte",
    "anubisi", "nainisi", "qinglong", "baihu", "zhuque", "xuanwu", "qiexiya", "haidela"
  ].includes(id);
}

function soulMark(id) {
  return {
    bulang: "布",
    cangyun: "云",
    yeger: "猎",
    wuyun: "狼",
    taini: "岩",
    youmier: "冰",
    yacha: "夜",
    luosha: "刹",
    bobi: "泡",
    yingwuzhe: "影",
    yanmo: "炎",
    jiguang: "光",
    nase: "鲨",
    sishen: "镰",
    honglian: "莲",
    bomengte: "盾",
    anubisi: "审",
    nainisi: "幻",
    qinglong: "龙",
    baihu: "虎",
    zhuque: "凤",
    xuanwu: "玄",
    qiexiya: "魅",
    haidela: "蛇"
  }[id] || "魂";
}

function renderWarTop() {
  return `
    <div class="war-resource-bar">
      <div><span class="coin-dot">●</span>${fmt(state.gold)}</div>
      <div><span class="gem-dot">◆</span>${fmt(state.diamond)}</div>
      <div><span class="core-dot">✦</span>${fmt(state.soulCore)}</div>
    </div>
    <button class="war-back" data-action="home">↩</button>
  `;
}

function renderWarMain(selected) {
  const owned = getOwnedSouls();
  if (!owned.length) {
    return `
      <section class="soul-home-panel empty-owned">
        <h1>战魂</h1>
        <p>当前还没有战魂。先去商城购买战魂礼包，打开战魂箱后会出现在这里。</p>
        <div class="empty-actions">
          <button class="war-btn blue" data-action="shopDaily">商城礼包</button>
          <button class="war-btn orange" data-war-tab="codex">查看图鉴</button>
        </div>
      </section>
    `;
  }
  const selectedItem = selected || owned[0];
  const soul = selectedItem.soul;
  const instance = selectedItem.instance;
  const grade = refineGrade();
  const deployed = state.deployedSoulInstance === instance.uid;
  return `
    <section class="soul-home-panel soul-showcase">
      <div class="soul-stage-card">
        ${renderWarAvatar(soul, "giant")}
        <div class="soul-title">
          <div class="soul-title-row">
            <h1>${soul.name}</h1>
            <em class="${deployed ? "deployed" : ""}">${deployed ? "已出战" : "未出战"}</em>
          </div>
          <p>${tierLabel(soul.tier)}　${instance.stage}阶　${soul.role}　同名 x${soulCount(soul.id)}</p>
          <p>触发：${soul.trigger}</p>
        </div>
      </div>
      <div class="soul-desc">${soul.desc}</div>
      <div class="refine-summary-card">
        <b>精炼品阶 ${grade.label}</b>
        <span>幸运值 ${state.warLuck}　精炼评分 ${refineStarScore()}</span>
      </div>
      <div class="soul-stat-lines">
        ${soul.stats.map((stat) => `<span>${stat}</span>`).join("")}
      </div>
      <div class="soul-skill-list">
        ${soul.skills.slice(0, 4).map((skill, index) => `
          <article>
            <b>${index + 1}</b>
            <span>${skill}</span>
          </article>
        `).join("")}
      </div>
      <div class="soul-action-row">
        <button class="war-btn red" data-action="deploySoul">出战</button>
        <button class="war-btn blue" data-war-tab="refine">精炼</button>
        <button class="war-btn orange" data-war-tab="compose">合成</button>
      </div>
    </section>
    ${renderWarSoulStrip(soul)}
  `;
}

function renderSoulMiniDetail(soul) {
  const selected = getSelectedSoul();
  const instance = selected?.instance;
  const grade = refineGrade();
  return `
    <section class="mini-detail">
      <div class="detail-hero compact">
        ${renderWarAvatar(soul, "big")}
        <div>
          <h1>${soul.name}</h1>
          <p>${tierLabel(soul.tier)}　${instance?.stage ?? soulStage(soul.id)}阶　${soul.role}</p>
          <p>精炼品阶 ${grade.label}　${soul.stats.join("　")}</p>
        </div>
      </div>
      <button class="war-btn orange compact-btn" data-action="deploySoul">设为出战</button>
    </section>
  `;
}

function renderSoulRefine(soul) {
  if (!soul) {
    return `
      <section class="soul-home-panel empty-owned">
        <h1>精炼</h1>
        <p>还没有可精炼的战魂。先获得一个战魂。</p>
        <div class="empty-actions">
          <button class="war-btn blue" data-action="shopDaily">商城礼包</button>
          <button class="war-btn orange" data-war-tab="codex">查看图鉴</button>
        </div>
      </section>
    `;
  }
  const slots = [
    ...state.refineSlots,
    ...Array.from({ length: Math.max(0, 10 - state.refineSlots.length) }, () => ({ star: "empty", lines: [], locked: false }))
  ];
  const grade = refineGrade();
  return `
    <section class="war-wood-panel refine-board">
      <div class="refine-head">
        ${renderWarAvatar(soul)}
        <div>
          <strong>${soul.name}精炼</strong>
          <span>品阶 ${grade.label}　评分 ${refineStarScore()}　魂核用于精炼</span>
        </div>
      </div>
      <div class="refine-grid">
        ${slots.map((slot) => renderRefineSlot(slot)).join("")}
      </div>
      <div class="luck-line">幸运值：<b>${state.warLuck}</b></div>
      <div class="refine-cost"><span class="core-dot">✦</span>${refineCost()}</div>
      <div class="war-button-row">
        <button class="war-btn red" data-action="refineRollback">回退</button>
        <button class="war-btn silver" data-action="refineSoul">精炼</button>
      </div>
    </section>
    ${renderWarSoulStrip(soul)}
  `;
}

function renderRefineSlot(slot) {
  if (slot.star === "empty") {
    return `<article class="refine-slot empty"><span></span></article>`;
  }
  return `
    <article class="refine-slot ${slot.star} ${(state.selectedRefineIds || []).includes(slot.id) ? "selected" : ""}" data-refine-id="${slot.id}">
      <i>★</i>
      <div>${slot.lines.map((line) => `<b>${line}</b>`).join("")}</div>
      <em class="${slot.locked ? "locked" : "open"}">${slot.locked ? "锁" : "开"}</em>
    </article>
  `;
}

function renderWarSoulStrip(soul) {
  const owned = getOwnedSouls();
  return `
    <section class="war-owned-strip">
      <div class="strip-scroll">
        ${owned.map((item) => `
          <button class="owned-soul ${item.instance.uid === state.selectedSoulInstance ? "active" : ""}" data-owned-soul="${item.instance.uid}">
            ${renderWarAvatar(item.soul)}
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSoulCompose() {
  const owned = getOwnedSouls();
  if (!owned.length) {
    return `
      <section class="soul-home-panel empty-owned">
        <h1>合成</h1>
        <p>当前没有战魂，无法合成。请先从商城礼包获得战魂。</p>
        <div class="empty-actions">
          <button class="war-btn blue" data-action="shopDaily">商城礼包</button>
          <button class="war-btn orange" data-war-tab="codex">查看图鉴</button>
        </div>
      </section>
    `;
  }
  const selectedItem = getComposeSoul() || owned[0];
  const soul = selectedItem.soul;
  const need = composeNeed(soul);
  const sameTier = owned.filter((item) => item.soul.tier === soul.tier);
  const feed = composeInputCount(soul, sameTier.length);
  const chance = composeChance(soul, feed);
  const next = nextTier(soul.tier);
  const cups = Array.from({ length: 5 }, (_, index) => ({
    filled: index < feed,
    disabled: index >= need,
    label: index === 0 ? "主" : "副"
  }));
  const ready = feed >= 2 && Boolean(next);
  return `
    <section class="compose-stage">
      <button class="get-soul" data-war-tab="codex"><span>获得战魂</span></button>
      <div class="chain-row top-chain">
        ${cups.slice(0, 3).map((cup) => renderComposeCup(cup)).join("")}
      </div>
      <div class="chain-row lower-chain">
        ${cups.slice(3).map((cup) => renderComposeCup(cup)).join("")}
      </div>
      <button class="compose-plus" data-action="composeSoul">+</button>
      <p class="compose-tip">战魂的品质越高，100%合成所需要的战魂数量越多<br>合成失败时主战魂不会被消耗</p>
      <div class="compose-buttons">
        <button class="war-btn blue" data-action="fillCompose">一键放入</button>
        <button class="war-btn orange" data-action="composeSoul">合成</button>
      </div>
    </section>
    <section class="compose-bag">
      <button class="bag-filter">全部⌄</button>
      <div class="compose-inventory">
        ${owned.map((item, index) => `
          <button class="bag-soul ${item.soul.tier === soul.tier ? "same-tier" : "other-tier"} ${item.instance.uid === state.composeSoulInstance ? "selected" : ""}" data-compose-soul="${item.instance.uid}">
            ${renderWarAvatar(item.soul)}
            <b>${index + 1}</b>
          </button>
        `).join("")}
      </div>
      <div class="compose-rate">
        <strong>${soul.name}</strong> ${tierLabel(soul.tier)} → ${next ? tierLabel(next) : "已满级"}<br>
        同级可投入 ${sameTier.length} 只，当前投入
        <button data-action="feedMinus">-</button><b>${feed}</b><button data-action="feedPlus">+</button>
        ${ready ? `成功率 ${chance}%` : "数量不足"}　失败保留主战魂
      </div>
    </section>
  `;
}

function renderComposeCup(cup) {
  return `
    <div class="compose-cup ${cup.filled ? "filled" : ""} ${cup.disabled ? "disabled" : ""}">
      <span>${cup.disabled ? "锁" : cup.filled ? cup.label : "空"}</span>
    </div>
  `;
}

function renderSoulCodex(selected) {
  return `
    <section class="codex-book">
      <div class="codex-selected-note">
        <strong>${selected.name}</strong>
        <span>${tierLabel(selected.tier)}　${selected.role}　${selected.trigger}</span>
        <p>${selected.desc}</p>
      </div>
      ${["ancient", "perfect", "legend", "epic", "rare", "fine"].map((tier) => `
        <div class="codex-tier">
          <h2>${tierLabel(tier)}</h2>
          <div class="codex-grid">
            ${tierSouls(tier).map((soul) => renderCodexCard(soul, selected.id === soul.id)).join("")}
          </div>
        </div>
      `).join("")}
      <button class="codex-boost">图鉴加成　▶</button>
    </section>
  `;
}

function renderCodexCard(soul, selected) {
  const owned = soulCount(soul.id) > 0;
  return `
    <button class="codex-card ${soul.tier} ${selected ? "selected" : ""}" data-soul="${soul.id}">
      <span class="codex-name">${soul.name}</span>
      ${renderCodexPortrait(soul)}
      <small>${soul.role}</small>
      <em>${owned ? "已" : "锁"}</em>
    </button>
  `;
}

function renderSoulDetail(soul) {
  const selected = getSelectedSoul();
  const instance = selected?.instance;
  const grade = refineGrade();
  return `
    <section class="soul-detail-page">
      <div class="detail-hero">
        ${renderWarAvatar(soul, "big")}
        <div>
          <h1>${soul.name}</h1>
          <p>${soul.quality}　${instance?.stage ?? soulStage(soul.id)}阶　${soul.role}</p>
          <p>精炼品阶 ${grade.label}　${soul.stats.join("　")}</p>
        </div>
      </div>
      <div class="skill-scroll">
        ${soul.skills.map((skill, index) => `
          <article>
            <b>${index + 1}</b>
            <span>${skill}</span>
          </article>
        `).join("")}
      </div>
      <button class="war-btn orange upgrade-soul" data-action="deploySoul">设为出战</button>
    </section>
  `;
}

function renderWarBottomTabs() {
  const tabs = [
    ["detail", "战魂"],
    ["refine", "精炼"],
    ["compose", "合成"],
    ["codex", "图鉴"]
  ];
  return `
    <nav class="war-tabs">
      ${tabs.map(([id, label]) => `
        <button class="${state.warTab === id ? "active" : ""}" data-war-tab="${id}">
          <span>${label}</span>
        </button>
      `).join("")}
      <button class="war-return" data-action="home">↩</button>
    </nav>
  `;
}

function renderLocked(title, text) {
  return `
    <main class="content locked-page">
      <section class="page-title">
        <h1>${title}</h1>
        <span>模块占位</span>
      </section>
      <div class="locked-panel">
        <strong>${title}系统</strong>
        <p>${text}</p>
      </div>
    </main>
  `;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav">
      ${navItems.map(([id, label]) => `
        <button class="${state.page === id ? "active" : ""}" data-page="${id}">
          <span>${label.slice(0, 1)}</span>
          <b>${label}</b>
        </button>
      `).join("")}
    </nav>
  `;
}

function bindActions(root) {
  root.onclick = (event) => {
    const target = event.target.closest("[data-page], [data-action], [data-shop-tab], [data-war-tab], [data-soul], [data-owned-soul], [data-compose-soul], [data-refine-id], [data-soul-box], [data-buy]");
    if (!target || !root.contains(target)) return;
    event.preventDefault();
    if (target.dataset.page) setPage(target.dataset.page);
    if (target.dataset.shopTab) setShopTab(target.dataset.shopTab);
    if (target.dataset.warTab) setWarTab(target.dataset.warTab);
    if (target.dataset.soul) selectSoul(target.dataset.soul);
    if (target.dataset.ownedSoul) {
      const instance = state.warOwned.find((item) => item.uid === target.dataset.ownedSoul);
      if (!instance) return;
      state.selectedSoul = instance.soulId;
      state.composeSoul = instance.soulId;
      state.selectedSoulInstance = instance.uid;
      state.composeSoulInstance = instance.uid;
      saveState();
      render();
    }
    if (target.dataset.composeSoul) selectComposeSoul(target.dataset.composeSoul);
    if (target.dataset.refineId) {
      const slot = state.refineSlots.find((item) => item.id === target.dataset.refineId);
      if (!slot || slot.locked) {
        showToast("锁定属性不能回退");
        return;
      }
      const selected = new Set(state.selectedRefineIds || []);
      if (selected.has(slot.id)) selected.delete(slot.id);
      else selected.add(slot.id);
      state.selectedRefineIds = Array.from(selected);
      state.selectedRefineId = state.selectedRefineIds[state.selectedRefineIds.length - 1] || "";
      saveState();
      render();
    }
    if (target.dataset.soulBox) openSoulBox(target.dataset.soulBox, target.dataset.soulBoxCount || 1);
    if (target.dataset.buy) buyProduct(Number(target.dataset.buy));
    if (!target.dataset.action) return;
    const action = target.dataset.action;
    if (action === "shop") setPage("shop");
    if (action === "war") setPage("war");
    if (action === "guild") setPage("guild");
    if (action === "home") setPage("chest");
    if (action === "shopDaily") { state.page = "shop"; state.shopTab = "daily"; saveState(); render(); }
    if (action === "locked") showToast("该功能入口已保留");
    if (action === "openChest") openChest(10);
    if (action === "sellLoot") sellLoot();
    if (action === "equipBest") equipBest();
    if (action === "upgradeChest") upgradeChest();
    if (action === "refineSoul") refineSoul();
    if (action === "refineRollback") rollbackRefine();
    if (action === "composeSoul") composeSoul();
    if (action === "fillCompose") fillCompose();
    if (action === "feedMinus") adjustComposeFeed(-1);
    if (action === "feedPlus") adjustComposeFeed(1);
    if (action === "deploySoul") deploySoul();
    if (action === "reset") resetState();
  };
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1400);
}

render();
