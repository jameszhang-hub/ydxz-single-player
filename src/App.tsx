import {
  useEffect, useMemo, useRef, useState,
  type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode
} from "react";
import {
  Activity, Archive, Award, BookOpen, Bot, Box, CalendarDays, Check, ChevronLeft,
  ChevronRight, CircleDollarSign, Clock3, Coins, Crown, Dices, Flame, Gem, Gift, Hammer, Heart,
  Home, Info, Layers3, LockKeyhole, Medal, Menu, PackageOpen, PawPrint, ReceiptText, Repeat2, RotateCcw, Settings,
  Shield, ShoppingBag, Sparkles, Square, Swords, Target, Ticket, TrendingUp, Trophy, UserRound,
  UsersRound, WandSparkles, X, Zap
} from "lucide-react";
import { BattleCanvas } from "./BattleCanvas";
import { summarizeBattle, type BattleDamageSource } from "./battleReport";
import { BattlePetView } from "./BattlePetView";
import { BeastView } from "./BeastView";
import {
  BUILD_PLANS, COMBAT_STAT_META, GROWTH_GOALS, HUNTING_POOL, OFFICIAL_PROBABILITY_SECTIONS, QUALITIES,
  RESOURCE_META, SLOTS, SOUL_CARDS, WAR_SOULS
} from "./config";
import {
  EQUIPMENT_REFINE_MAX, calculatePlayerStats, calculatePower, chestQualityWeights, chestUpgradeCost, chestUpgradeRequirement, equipmentRefineCost, equipmentRefineScale, expForLevel,
  goalProgress, heroAppearanceTier, highestGemLevel, hunterExpForLevel, powerContributionLosses, progressionRewardMultiplier, soulCardUpgradeCost, stageEnemy, stageRewardScale, vipLevel
} from "./engine";
import {
  ArtifactView, EventHubView, FlagView, GemView, InventoryView, MountView, RuneView, WarEagleView,
  TerritoryView, TurntableView
} from "./GrowthViews";
import { useGameStore } from "./store";
import { TRIAL_META, trialMonsterAt, trialStageLabel } from "./trial";
import { PackageView, ShopView } from "./ShopView";
import { AtlasArt, fmt, ResourcePill, type AtlasKind } from "./ui";
import { WarSoulView } from "./WarSoulView";
import type { BuildPlanId, BuildStat, CombatStats, EquipmentInstance, GearSlot, ResourceId } from "./types";

type Page = "home" | "play" | "trial" | "arena" | "guild";
type Overlay =
  | "shop" | "packages" | "activities" | "warSouls" | "warSoulPacks" | "beasts" | "battlePets" | "soulCards" | "hunting" | "probability"
  | "profile" | "mount" | "warEagle" | "runes" | "gems" | "artifact" | "flag" | "territory" | "inventory"
  | "turntable" | "events" | "orders" | "settings" | "battle" | "commission" | "strategy" | "twinTowers"
  | "equipment" | "calendar" | null;
type ActiveOverlay = Exclude<Overlay, null>;
type EquipmentSelection = { slot: GearSlot; lootId?: string };
const statNames: Record<BuildStat, string> = { crit: "暴击", dodge: "闪避", combo: "连击", lifesteal: "吸血", stun: "击晕", counter: "反击" };

export function App() {
  const store = useGameStore();
  const [page, setPage] = useState<Page>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [overlayHistory, setOverlayHistory] = useState<ActiveOverlay[]>([]);
  const [inventoryGroup, setInventoryGroup] = useState(0);
  const [equipmentSelection, setEquipmentSelection] = useState<EquipmentSelection>({ slot: "weapon" });
  const stageRef = useRef<HTMLElement | null>(null);
  const overlayScrollPositions = useRef<Partial<Record<ActiveOverlay, number>>>({});

  useEffect(() => { void store.hydrate(); }, []);
  useEffect(() => {
    if (!store.notice) return;
    const timer = window.setTimeout(store.clearNotice, 1800);
    return () => window.clearTimeout(timer);
  }, [store.notice, store.clearNotice]);
  useEffect(() => {
    if (!store.ready || !store.save.automation.autoChest) return;
    const timer = window.setInterval(store.autoChestTick, store.save.automation.speedMode ? 260 : 850);
    return () => window.clearInterval(timer);
  }, [store.ready, store.save.automation.autoChest, store.save.automation.speedMode, store.autoChestTick]);
  useEffect(() => {
    if (!store.ready || !store.save.automation.autoStage) return;
    const timer = window.setInterval(store.autoStageTick, overlay === "battle" ? 4600 : 1150);
    return () => window.clearInterval(timer);
  }, [store.ready, store.save.automation.autoStage, store.autoStageTick, overlay]);

  const stats = useMemo(() => calculatePlayerStats(store.save), [store.save]);
  const power = calculatePower(stats);
  const vip = vipLevel(store.save.totalSpent);
  const closeOverlay = () => { setOverlay(null); setOverlayHistory([]); };
  const openRootOverlay = (value: Overlay) => {
    if (value) overlayScrollPositions.current[value] = 0;
    setOverlayHistory([]);
    setOverlay(value);
  };
  const navigateOverlay = (value: Overlay) => {
    if (!value) { closeOverlay(); return; }
    if (overlay && overlay !== value) {
      overlayScrollPositions.current[overlay] = document.querySelector<HTMLElement>(".overlay-body")?.scrollTop || 0;
      overlayScrollPositions.current[value] = 0;
      setOverlayHistory((history) => [...history, overlay]);
    }
    setOverlay(value);
  };
  const backOverlay = () => {
    const previous = overlayHistory.at(-1);
    if (!previous) { closeOverlay(); return; }
    setOverlayHistory((history) => history.slice(0, -1));
    setOverlay(previous);
  };
  const changePage = (value: Page) => {
    if (value === page) { stageRef.current?.scrollTo({ top: 0 }); return; }
    setPage(value);
  };

  useEffect(() => { stageRef.current?.scrollTo({ top: 0 }); }, [page]);

  if (!store.ready) return <div className="boot-screen"><Sparkles size={34} /><strong>正在唤醒冒险世界</strong></div>;

  return (
    <div className="viewport-shell">
      <main className="game-shell">
        <TopBar level={store.save.player.level} exp={store.save.player.exp} vip={vip} onProfile={() => openRootOverlay("profile")} onShop={() => openRootOverlay("shop")} />
        <section className="page-stage" ref={stageRef}>
          {page === "home" && <HomePage power={power} stats={stats} showNotice={overlay === null} openOverlay={openRootOverlay} openEquipment={(selection) => { setEquipmentSelection(selection); openRootOverlay("equipment"); }} />}
          {page === "play" && <PlayPage openOverlay={openRootOverlay} />}
          {page === "trial" && <TrialPage power={power} onBattle={() => { store.challengeStage(); openRootOverlay("battle"); }} />}
          {page === "arena" && <ArenaPage power={power} onBattle={() => openRootOverlay("battle")} />}
          {page === "guild" && <GuildPage power={power} onBattle={() => openRootOverlay("battle")} />}
        </section>
        <BottomNav page={page} onChange={changePage} />
        {store.notice && !overlay && page !== "home" && <div className="toast" role="status" aria-live="polite"><Sparkles size={16} />{store.notice}</div>}
        {overlay && <OverlayView type={overlay} notice={overlay === "beasts" ? null : store.notice} back={backOverlay} close={closeOverlay} openOverlay={navigateOverlay} power={power} stats={stats} equipmentSelection={equipmentSelection} setEquipmentSelection={setEquipmentSelection} inventoryGroup={inventoryGroup} setInventoryGroup={setInventoryGroup} restoreScrollTop={overlayScrollPositions.current[overlay] || 0} />}
      </main>
    </div>
  );
}

function TopBar({ level, exp, vip, onProfile, onShop }: { level: number; exp: number; vip: number; onProfile: () => void; onShop: () => void }) {
  const save = useGameStore((state) => state.save);
  const needed = expForLevel(level);
  return <header className="top-bar">
    <button className="avatar-button" onClick={onProfile} aria-label="角色详情"><ProgressionAvatar tier={heroAppearanceTier(save)} className="mini" /><span>Lv.{level}</span></button>
    <div className="identity-block"><strong>跃动小子 · {save.player.name}</strong><span className="vip-label">VIP {vip}</span><div className="exp-track"><i style={{ width: `${Math.min(100, exp / needed * 100)}%` }} /></div></div>
    <ResourcePill id="gold" value={save.resources.gold} />
    <button className="resource-button" onClick={onShop} aria-label="打开商城"><Gem size={15} /><strong>{fmt(save.resources.diamond)}</strong><i>+</i></button>
  </header>;
}

function ProgressionAvatar({ tier, className = "" }: { tier: number; className?: string }) {
  const frame = Math.max(0, Math.min(4, tier)) * 25;
  return <div className={`progression-avatar ${className}`} style={{ "--frame": `${frame}%` } as CSSProperties} />;
}


function HomePage({ power, stats, showNotice, openOverlay, openEquipment }: { power: number; stats: ReturnType<typeof calculatePlayerStats>; showNotice: boolean; openOverlay: (value: Overlay) => void; openEquipment: (selection: EquipmentSelection) => void }) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [chestAmount, setChestAmount] = useState<1 | 10 | 100>(10);
  const save = useGameStore((state) => state.save);
  const notice = useGameStore((state) => state.notice);
  const inlineNotice = showNotice ? notice : null;
  const openChest = useGameStore((state) => state.openChest);
  const equipBest = useGameStore((state) => state.equipBest);
  const sellLoot = useGameStore((state) => state.sellLoot);
  const upgradeChest = useGameStore((state) => state.upgradeChest);
  const buyChestTickets = useGameStore((state) => state.buyChestTickets);
  const setAutomation = useGameStore((state) => state.setAutomation);
  const weights = chestQualityWeights(save.chest.level);
  const visibleRates = weights.map((weight, index) => ({ weight, index })).filter((item) => item.weight > 0).slice(-2);
  const cost = chestUpgradeCost(save.chest.level);
  const chestRequirement = chestUpgradeRequirement(save.chest.level);
  const plan = BUILD_PLANS.find((item) => item.id === save.buildPlan)!;
  const shortcuts = [
    { label: "宝石", kind: "system" as AtlasKind, index: 5, overlay: "gems" as Overlay },
    { label: "魔兽", kind: "beast" as AtlasKind, index: 4, overlay: "beasts" as Overlay },
    { label: "符文", kind: "rune" as AtlasKind, index: 0, overlay: "runes" as Overlay },
    { label: "魂卡", kind: "soulCard" as AtlasKind, index: 0, overlay: "soulCards" as Overlay },
    { label: "战魂", kind: "warSoul" as AtlasKind, index: 18, overlay: "warSouls" as Overlay },
    { label: "战宠", kind: "battlePet" as AtlasKind, index: 0, overlay: "battlePets" as Overlay },
    { label: "坐骑", kind: "system" as AtlasKind, index: 0, overlay: "mount" as Overlay },
    { label: "背包", kind: "system" as AtlasKind, index: 6, overlay: "inventory" as Overlay }
  ];
  const chestShortcuts = [
    { label: "战鹰", kind: "warEagle" as AtlasKind, index: 0, overlay: "warEagle" as Overlay },
    { label: "战旗", kind: "system" as AtlasKind, index: 10, overlay: "flag" as Overlay },
    { label: "神器", kind: "system" as AtlasKind, index: 8, overlay: "artifact" as Overlay },
    { label: "捕猎", kind: "hunting" as AtlasKind, index: 4, overlay: "hunting" as Overlay }
  ];
  const openTool = (value: Exclude<Overlay, null>) => {
    setToolsOpen(false);
    openOverlay(value);
  };
  return <div className="home-page">
    <section className="hero-board">
      <button className="lobby-menu-button" onClick={() => setToolsOpen(true)}><Menu size={18} /><b>玩法入口</b></button>
      <button className="power-ribbon" onClick={() => openOverlay("strategy")}><Swords size={17} /><span>战力</span><strong>{fmt(power)}</strong><b style={{ color: plan.accent }}>{plan.short}</b></button>
      <HeroCharacter onClick={() => openOverlay("profile")} />
      <div className="attribute-panel">
        <StatLine label="速度" value={stats.speed} /><StatLine label="生命" value={stats.hp} />
        <StatLine label="攻击" value={stats.attack} /><StatLine label="防御" value={stats.defense} />
        <div className="combat-attrs"><span>吸血 {(stats.lifesteal / 100).toFixed(2)}%</span><span>反击 {(stats.counter / 100).toFixed(2)}%</span><span>连击 {(stats.combo / 100).toFixed(2)}%</span><span>闪避 {(stats.dodge / 100).toFixed(2)}%</span><span>暴击 {(stats.crit / 100).toFixed(2)}%</span><span>击晕 {(stats.stun / 100).toFixed(2)}%</span></div>
        <button onClick={() => openOverlay("profile")}>详细信息 <ChevronRight size={13} /></button>
      </div>
      <div className="equipment-grid">{SLOTS.map((slot, index) => <EquipmentSlot key={slot.id} id={slot.id} name={slot.name} index={index} onClick={() => openEquipment({ slot: slot.id })} />)}</div>
      <div className="system-shortcuts">{shortcuts.map((item) => <button key={item.label} onClick={() => openOverlay(item.overlay)}><AtlasArt kind={item.kind} index={item.index} /><b>{item.label}</b><i /></button>)}</div>
      {toolsOpen && <div className="lobby-tool-sheet" role="dialog" aria-label="玩法入口">
        <header><strong>玩法入口</strong><button aria-label="收起玩法入口" onClick={() => setToolsOpen(false)}><X size={17} /></button></header>
        <div className="lobby-tool-grid">
          <QuickIcon icon={<Gift />} label="福利" badge onClick={() => openTool("activities")} />
          <QuickIcon icon={<ShoppingBag />} label="特惠" badge onClick={() => openTool("packages")} />
          <QuickIcon icon={<ReceiptText />} label="账单" onClick={() => openTool("orders")} />
          <QuickIcon icon={<Activity />} label="活动" badge onClick={() => openTool("events")} />
          <QuickIcon icon={<Settings />} label="设置" onClick={() => openTool("settings")} />
          <QuickIcon icon={<CalendarDays />} label={`第${save.day}天`} onClick={() => openTool("calendar")} />
        </div>
      </div>}
    </section>
    <div className={`ticker ${inlineNotice ? "notice" : ""}`}>{inlineNotice ? <><Sparkles size={12} /><strong>{inlineNotice}</strong></> : <><span>[联盟]</span> 晨星旅团正在集结荒原巨像 · 今日首胜联盟币翻倍</>}</div>
    <GoalStrip />
    <section className={`chest-dock ${save.automation.autoChest ? "is-running" : ""} ${save.loot.length > 0 ? "has-loot" : ""}`}>
      {save.loot.length > 0 ? <section className="loot-tray">
        <header><strong>本次保留 {save.loot.length} 件装备</strong><span>最高：{QUALITIES[Math.max(...save.loot.map((item) => item.quality))].name}</span></header>
        <div className="loot-row">{save.loot.slice(-5).map((item) => <LootChip key={item.id} item={item} onClick={() => openEquipment({ slot: item.slot, lootId: item.id })} />)}</div>
        <div className="loot-actions"><button onClick={sellLoot}>全部出售</button><button className="primary" onClick={equipBest}>按{plan.short}换装</button></div>
      </section> : <>
        <button className="chest-level" onClick={upgradeChest}><span>宝箱 Lv.{save.chest.level}</span><small>{save.chest.level >= 31 ? "已满级" : `${fmt(cost)} 金币 · 开箱进度 ${Math.min(save.chest.progress, chestRequirement)}/${chestRequirement}`}</small></button>
        <div className="chest-side-actions">{chestShortcuts.map((item) => <button key={item.label} onClick={() => openOverlay(item.overlay)}><AtlasArt kind={item.kind} index={item.index} /><b>{item.label}</b><i /></button>)}</div>
        <div className={`chest-core ${save.lastChestSummary ? "has-summary" : ""}`}>
          <div className="chest-amount-switch" aria-label="开箱次数">{([1, 10, 100] as const).map((amount) => <button key={amount} className={chestAmount === amount ? "active" : ""} onClick={() => setChestAmount(amount)}>{amount}次</button>)}</div>
          {save.lastChestSummary && <div className="chest-summary"><span>开 {save.lastChestSummary.opened}</span><span>换装 {save.lastChestSummary.equipped}</span><span>出售 {save.lastChestSummary.sold}</span><b>战力 +{fmt(save.lastChestSummary.powerGain)}</b></div>}
          <button className="chest-art" onClick={() => openChest(chestAmount)} aria-label={`开 ${chestAmount} 次`}><img src={`${import.meta.env.BASE_URL}assets/chest-v2.png`} alt="" /><span><Ticket size={12} />{fmt(save.resources.chestTicket)}</span><strong>开启 {chestAmount} 次</strong>{save.automation.autoChest && <i>委托中</i>}</button>
        </div>
        <div className="chest-tools">
          <button onClick={() => save.automation.autoChest ? setAutomation({ autoChest: false }) : openOverlay("commission")}>{save.automation.autoChest ? <Square size={13} /> : <Repeat2 size={13} />}{save.automation.autoChest ? "停止委托" : "开箱委托"}</button>
          <button onClick={buyChestTickets}><Gem size={13} />60 换 100 宝箱</button>
        </div>
        <div className="rate-strip">{visibleRates.map(({ weight, index }) => <i key={index} style={{ color: QUALITIES[index].color }}>{QUALITIES[index].name} {(weight / 100).toFixed(2)}%</i>)}<button onClick={() => openOverlay("probability")}>全部公示</button></div>
      </>}
    </section>
  </div>;
}

function GoalStrip() {
  const save = useGameStore((state) => state.save);
  const claim = useGameStore((state) => state.claimGoal);
  const goal = GROWTH_GOALS.find((item) => !save.claimedGoals.includes(item.id));
  if (!goal) return <section className="goal-strip complete"><Check /><div><strong>本阶段成长目标已完成</strong><small>继续冲关与收集，打造自己的概率流派</small></div></section>;
  const progress = Math.min(goal.target, goalProgress(save, goal.id));
  const ready = progress >= goal.target;
  return <section className="goal-strip"><TrendingUp /><div><strong>{goal.name}</strong><small>{goal.description}</small><span><i style={{ width: `${progress / goal.target * 100}%` }} /></span></div><b>{progress}/{goal.target}</b><button onClick={() => claim(goal.id)} disabled={!ready}>{ready ? "领取" : "进行中"}</button></section>;
}

function QuickIcon({ icon, label, badge, onClick }: { icon: ReactNode; label: string; badge?: boolean; onClick: () => void }) {
  return <button className="quick-icon" onClick={onClick}>{badge && <i />}<span>{icon}</span><b>{label}</b></button>;
}

function StatLine({ label, value }: { label: string; value: number }) { return <div className="stat-line"><span>{label}</span><strong>{fmt(value)}</strong></div>; }

function HeroCharacter({ onClick }: { onClick: () => void }) {
  const save = useGameStore((state) => state.save);
  const tier = heroAppearanceTier(save);
  const soul = WAR_SOULS.find((item) => item.id === save.collections.deployedWarSoul);
  const labels = ["旅人布衣", "青铜武装", "精钢战甲", "传说辉甲", "至尊幻铠"];
  return <button className={`hero-character appearance-${tier}`} aria-label={`人物外观：${labels[tier]}`} onClick={onClick}>
    <div className="hero-core" />
    {soul && <i className="hero-soul-aura" style={{ "--soul-color": soul.accent } as CSSProperties} />}
    <span>{soul ? `战魂共鸣 · ${soul.name}` : labels[tier]}</span>
  </button>;
}

function EquipmentSlot({ id, name, index, onClick }: { id: GearSlot; name: string; index: number; onClick: () => void }) {
  const item = useGameStore((state) => state.save.equipped[id]);
  return <button aria-label={`${name}${item ? ` Lv.${item.level}` : "未装备"}`} onClick={onClick} className={`equipment-slot q-${item?.quality ?? "empty"}`} style={item ? { "--quality": QUALITIES[item.quality].color } as CSSProperties : undefined}><AtlasArt kind="equipment" index={index} /><small>{item ? `Lv.${item.level}` : name}</small>{item && <i>{QUALITIES[item.quality].name}</i>}</button>;
}

function LootChip({ item, onClick }: { item: { quality: number; slot: GearSlot; score: number }; onClick: () => void }) {
  const index = SLOTS.findIndex((slot) => slot.id === item.slot);
  return <button className="loot-chip" onClick={onClick} style={{ "--quality": QUALITIES[item.quality].color } as CSSProperties}><AtlasArt kind="equipment" index={index} /><b>{SLOTS[index]?.name}</b><small>{fmt(item.score)}</small></button>;
}

const equipmentStatNames: Partial<Record<keyof ReturnType<typeof calculatePlayerStats>, string>> = {
  hp: "生命", attack: "攻击", defense: "防御", speed: "速度",
  lifesteal: "吸血", crit: "暴击", dodge: "闪避", stun: "击晕", combo: "连击", counter: "反击",
  antiLifesteal: "吸血抗性", antiCrit: "暴击抗性", antiDodge: "闪避抗性", antiStun: "击晕抗性",
  antiCombo: "连击抗性", antiCounter: "反击抗性", critDamage: "暴伤", tenacity: "坚毅",
  healing: "疗伤", recovery: "恢复", damageBonus: "最终增伤", damageReduction: "最终减伤"
};

function EquipmentNumbers({ item }: { item?: EquipmentInstance }) {
  if (!item) return <div className="equipment-empty-copy"><Archive /><span>该部位尚未穿戴装备</span></div>;
  return <div className="equipment-number-grid">
    <span><b>速度</b><strong>{fmt(item.stats.speed)}</strong></span><span><b>生命</b><strong>{fmt(item.stats.hp)}</strong></span>
    <span><b>攻击</b><strong>{fmt(item.stats.attack)}</strong></span><span><b>防御</b><strong>{fmt(item.stats.defense)}</strong></span>
    {item.affixes.map((affix, index) => <span className="affix" key={`${affix.stat}-${index}`}><b>{equipmentStatNames[affix.stat] || affix.stat}</b><strong>+{affix.percent ? `${(affix.value / 100).toFixed(2)}%` : fmt(affix.value)}</strong></span>)}
  </div>;
}

function EquipmentDetailView({ selection, select, openGems }: { selection: EquipmentSelection; select: (selection: EquipmentSelection) => void; openGems: () => void }) {
  const save = useGameStore((state) => state.save);
  const equipLootItem = useGameStore((state) => state.equipLootItem);
  const sellLootItem = useGameStore((state) => state.sellLootItem);
  const refine = useGameStore((state) => state.refineEquipment);
  const current = save.equipped[selection.slot];
  const candidate = selection.lootId ? save.loot.find((item) => item.id === selection.lootId) : undefined;
  const active = candidate || current;
  const slotIndex = SLOTS.findIndex((slot) => slot.id === selection.slot);
  const slotName = SLOTS[slotIndex]?.name || "装备";
  const refineLevel = save.gearRefines[selection.slot] || 0;
  const refineCost = equipmentRefineCost(save.player.level, refineLevel);
  const socketCount = Object.keys(save.growthSystems.gems.sockets).length;
  const topGemLevel = highestGemLevel(save);
  const candidates = save.loot.filter((item) => item.slot === selection.slot).sort((a, b) => b.score - a.score);
  const slotStripRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const strip = slotStripRef.current;
    const button = strip?.querySelector<HTMLElement>(`[data-gear-slot="${selection.slot}"]`);
    if (!strip || !button) return;
    strip.scrollTo({ left: button.offsetLeft - (strip.clientWidth - button.offsetWidth) / 2 });
  }, [selection.slot]);
  const powerDelta = useMemo(() => {
    if (!candidate) return 0;
    const before = calculatePower(calculatePlayerStats(save));
    const projected = structuredClone(save);
    projected.equipped[selection.slot] = candidate;
    return calculatePower(calculatePlayerStats(projected)) - before;
  }, [candidate, save, selection.slot]);
  return <div className="equipment-detail-view">
    <section className="equipment-focus">
      <div className={`equipment-focus-art q-${active?.quality ?? "empty"}`} style={active ? { "--quality": QUALITIES[active.quality].color } as CSSProperties : undefined}><AtlasArt kind="equipment" index={Math.max(0, slotIndex)} />{active && <i>Lv.{active.level}</i>}</div>
      <div><span>{candidate ? "新获得" : "当前装备"}</span><h2>{active ? `${QUALITIES[active.quality].name}的${slotName}` : slotName}</h2><small>{candidate ? `替换后战力 ${powerDelta >= 0 ? "+" : ""}${fmt(powerDelta)}` : `部位精炼 +${refineLevel}`}</small></div>
      {active && <b style={{ color: QUALITIES[active.quality].color }}>{QUALITIES[active.quality].name}</b>}
    </section>
    <nav className="equipment-slot-strip" aria-label="装备部位" ref={slotStripRef}>
      {SLOTS.map((slot, index) => {
        const equipped = save.equipped[slot.id];
        const slotRefine = save.gearRefines[slot.id] || 0;
        return <button key={slot.id} data-gear-slot={slot.id} className={selection.slot === slot.id ? "active" : ""} onClick={() => select({ slot: slot.id })} style={equipped ? { "--quality": QUALITIES[equipped.quality].color } as CSSProperties : undefined}><AtlasArt kind="equipment" index={index} /><span>{slot.name}</span>{slotRefine > 0 && <b>+{slotRefine}</b>}</button>;
      })}
    </nav>
    {candidate && <div className="equipment-compare-label"><span>当前装备</span><Repeat2 /><span>新获得</span></div>}
    <section className={`equipment-comparison ${candidate ? "two" : ""}`}>
      {candidate && <div><header><strong>{current ? `${QUALITIES[current.quality].name}${slotName}` : "未穿戴"}</strong><small>{current ? `Lv.${current.level}` : "空部位"}</small></header><EquipmentNumbers item={current} /></div>}
      <div><header><strong>{active ? `${QUALITIES[active.quality].name}${slotName}` : "未穿戴"}</strong><small>{active ? `评分 ${fmt(active.score)}` : "从宝箱获得该部位"}</small></header><EquipmentNumbers item={active} /></div>
    </section>
    {candidate && <div className="equipment-primary-actions"><button onClick={() => { sellLootItem(candidate.id); select({ slot: selection.slot }); }}><Coins />出售 <small>+{fmt(candidate.sellValue)}</small></button><button className="primary" onClick={() => { equipLootItem(candidate.id); select({ slot: selection.slot }); }}><Check />穿戴 <small>{powerDelta >= 0 ? `战力 +${fmt(powerDelta)}` : "保留流派选择"}</small></button></div>}
    <section className="equipment-workbench">
      <header><Hammer /><div><strong>部位精炼 +{refineLevel}/{EQUIPMENT_REFINE_MAX}</strong><small>精炼永久保留在{slotName}部位，换装不会丢失</small></div><b>×{equipmentRefineScale(refineLevel).toFixed(2)}</b></header>
      <button onClick={() => refine(selection.slot)} disabled={!current || refineLevel >= EQUIPMENT_REFINE_MAX}>{refineLevel >= EQUIPMENT_REFINE_MAX ? "精炼已满" : "精炼一次"} <small>{refineLevel >= EQUIPMENT_REFINE_MAX ? "当前部位已达上限" : `${fmt(refineCost)} 金币`}</small></button>
    </section>
    <button className="equipment-gem-link" onClick={openGems}><Gem /><span><strong>宝石镶嵌盘</strong><small>{socketCount ? `已镶嵌 ${socketCount}/20 · 最高 ${topGemLevel} 级` : `${slotName}已穿戴，前往宝石盘补充全局属性`}</small></span><ChevronRight /></button>
    <section className="same-slot-loot"><header><strong>{slotName}待处理装备</strong><span>{candidates.length}件</span></header><div>{candidates.length ? candidates.map((item) => <button key={item.id} onClick={() => select({ slot: selection.slot, lootId: item.id })} className={selection.lootId === item.id ? "selected" : ""} style={{ "--quality": QUALITIES[item.quality].color } as CSSProperties}><AtlasArt kind="equipment" index={Math.max(0, slotIndex)} /><span><strong>{QUALITIES[item.quality].name} · Lv.{item.level}</strong><small>评分 {fmt(item.score)}</small></span><b>{current && item.score > current.score ? "↑" : "·"}</b></button>) : <div className="equipment-empty-copy"><PackageOpen /><span>继续开箱可获得{slotName}</span></div>}</div></section>
  </div>;
}

function PlayPage({ openOverlay }: { openOverlay: (value: Overlay) => void }) {
  const save = useGameStore((state) => state.save);
  const plan = BUILD_PLANS.find((item) => item.id === save.buildPlan)!;
  const systems = [
    { name: "战魂", group: "core", level: 15, kind: "warSoul" as AtlasKind, index: 18, overlay: "warSouls" as Overlay },
    { name: "魔兽", group: "core", level: 40, kind: "beast" as AtlasKind, index: 6, overlay: "beasts" as Overlay },
    { name: "战宠", group: "core", level: 45, kind: "battlePet" as AtlasKind, index: 0, overlay: "battlePets" as Overlay },
    { name: "魂卡", group: "core", level: 25, kind: "soulCard" as AtlasKind, index: 0, overlay: "soulCards" as Overlay },
    { name: "捕猎", group: "adventure", level: 20, kind: "hunting" as AtlasKind, index: 4, overlay: "hunting" as Overlay },
    { name: "双塔奇兵", group: "adventure", level: 25, kind: "soulCard" as AtlasKind, index: 21, overlay: "twinTowers" as Overlay },
    { name: "领地", group: "adventure", level: 30, kind: "growth" as AtlasKind, index: 13, overlay: "territory" as Overlay },
    { name: "坐骑", group: "adventure", level: 35, kind: "system" as AtlasKind, index: 0, overlay: "mount" as Overlay },
    { name: "战鹰", group: "equipment", level: 75, kind: "warEagle" as AtlasKind, index: 0, overlay: "warEagle" as Overlay },
    { name: "符文", group: "equipment", level: 40, kind: "rune" as AtlasKind, index: 8, overlay: "runes" as Overlay },
    { name: "宝石", group: "equipment", level: 30, kind: "system" as AtlasKind, index: 5, overlay: "gems" as Overlay },
    { name: "神器", group: "equipment", level: 45, kind: "system" as AtlasKind, index: 6, overlay: "artifact" as Overlay },
    { name: "战旗", group: "equipment", level: 45, kind: "system" as AtlasKind, index: 10, overlay: "flag" as Overlay }
  ];
  const summaries = [
    { name: "领地拉取", value: `${save.growthSystems.territory.pullsRemaining}/5`, overlay: "territory" as Overlay },
    { name: "坐骑库存", value: `${save.growthSystems.mount.mounts.length}/80`, overlay: "mount" as Overlay },
    { name: "战鹰培养", value: `Lv.${save.growthSystems.warEagle.levels[save.growthSystems.warEagle.activeSkin] || 1}`, overlay: "warEagle" as Overlay },
    { name: "符文装配", value: `${save.growthSystems.runes.equipped.length}/3`, overlay: "runes" as Overlay },
    { name: "最高宝石", value: `${highestGemLevel(save)}级`, overlay: "gems" as Overlay },
    { name: "锻造炉", value: `Lv.${save.growthSystems.artifact.forgeLevel}`, overlay: "artifact" as Overlay },
    { name: "荣耀战旗", value: `Lv.${save.growthSystems.flag.level}`, overlay: "flag" as Overlay }
  ];
  const systemGroups = [
    { id: "core", title: "核心养成", subtitle: "直接构成出战阵容", icon: <Sparkles /> },
    { id: "adventure", title: "探索与收集", subtitle: "获得图鉴和长期资源", icon: <Target /> },
    { id: "equipment", title: "装备强化", subtitle: "补足属性与战斗词条", icon: <Hammer /> }
  ];
  return <div className="content-page play-page"><PageHeading icon={<Dices />} title="玩法" subtitle="收集、构筑与概率养成" />
    <button className="strategy-banner" onClick={() => openOverlay("strategy")} style={{ "--accent": plan.accent } as CSSProperties}><AtlasArt kind="warSoul" index={BUILD_PLANS.findIndex((item) => item.id === save.buildPlan) + 12} /><span><small>当前作战方案</small><strong>{plan.name}</strong><b>{plan.description}</b></span><ChevronRight /></button>
    <div className="feature-grid play-system-groups">{systemGroups.map((group) => <section className={`play-system-group group-${group.id}`} key={group.id}><header><span>{group.icon}</span><div><strong>{group.title}</strong><small>{group.subtitle}</small></div><b>{systems.filter((system) => system.group === group.id).length}</b></header><div className="play-system-grid">{systems.filter((system) => system.group === group.id).map((system) => <button key={system.name} className={`feature-tile feature-${group.id}`} onClick={() => openOverlay(system.overlay)}><AtlasArt kind={system.kind} index={system.index} /><strong>{system.name}</strong><small>{save.player.level < system.level ? `建议 Lv.${system.level}` : "进入玩法"}</small><i>{save.player.level < system.level ? "可体验" : "已开放"}</i></button>)}</div></section>)}</div>
    <section className="play-progress"><h3>今日与永久进度</h3><div>{summaries.map((item) => <button key={item.name} onClick={() => openOverlay(item.overlay)}><span>{item.name}</span><strong>{item.value}</strong><ChevronRight /></button>)}</div></section>
  </div>;
}

function TrialPage({ power, onBattle }: { power: number; onBattle: () => void }) {
  const save = useGameStore((state) => state.save);
  const setAutomation = useGameStore((state) => state.setAutomation);
  const monster = trialMonsterAt(save.player.stage);
  const stageLabel = trialStageLabel(save.player.stage);
  const recommended = calculatePower(stageEnemy(save.player.stage));
  const rewardScale = stageRewardScale(save.player.stage);
  const traits = (["lifesteal", "counter", "combo", "dodge", "crit", "stun"] as BuildStat[])
    .map((stat) => ({ stat, value: monster[stat] }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);
  const stageRewards = {
    gold: Math.round(120 * rewardScale),
    chest: Math.max(1, Math.round(rewardScale / 2)),
    trial: Math.max(20, Math.round(20 * progressionRewardMultiplier(save.player.level, save.day))),
    exp: Math.max(25, Math.round(expForLevel(save.player.level) * .025))
  };
  return <div className="content-page trial-page"><PageHeading icon={<Swords />} title="试炼" subtitle={`第 ${monster.chapter} 章 · 关卡 ${stageLabel}`} />
    <section className="encounter-banner"><div className="enemy-silhouette"><AtlasArt kind="beast" index={monster.id % 48} /></div><span>怪物属性表 {TRIAL_META.version}</span><h2>{monster.chapterName}</h2><div className="trial-enemy-stats"><span><small>生命</small><b>{fmt(monster.hp)}</b></span><span><small>攻击</small><b>{fmt(monster.attack)}</b></span><span><small>防御</small><b>{fmt(monster.defense)}</b></span><span><small>速度</small><b>{fmt(monster.speed)}</b></span></div>{traits.length > 0 && <div className="trial-enemy-traits">{traits.map((item) => <span key={item.stat}>{statNames[item.stat]} {item.value}%</span>)}</div>}<div className="versus-power"><b>我方 {fmt(power)}</b><i>VS</i><b>敌方 {fmt(recommended)}</b></div><div className="trial-actions"><button className="battle-button" onClick={onBattle}><Swords size={18} />开始挑战</button><button className={save.automation.autoStage ? "auto-active" : ""} onClick={() => setAutomation({ autoStage: !save.automation.autoStage })}>{save.automation.autoStage ? <Square /> : <Repeat2 />}{save.automation.autoStage ? "停止推关" : "自动推关"}</button></div><small>自动推关会在首次失败时停止 · 挑战不消耗角斗券</small></section>
    {save.lastBattle && <section className={`last-battle ${save.lastBattle.win ? "win" : "loss"}`}><Trophy /><span><strong>{save.lastBattle.win ? "最近一战胜利" : "最近一战失败"}</strong><small>我方剩余 {fmt(save.lastBattle.playerHp)} · 对方剩余 {fmt(save.lastBattle.enemyHp)}</small></span></section>}
    <section className="stage-path">{Array.from({ length: 9 }, (_, index) => save.player.stage - 4 + index).map((stage) => stage > 0 && <div key={stage} title={`关卡 ${trialStageLabel(stage)}`} className={stage === save.player.stage ? "current" : stage < save.player.stage ? "done" : ""}>{trialStageLabel(stage)}</div>)}</section>
    <section className="trial-reward-panel"><header><span><Gift /><strong>本关胜利奖励</strong></span><small>单机成长配置</small></header><div><span><Coins /><b>{fmt(stageRewards.gold)}</b><small>金币</small></span><span><Box /><b>{fmt(stageRewards.chest)}</b><small>宝箱</small></span><span><Target /><b>{fmt(stageRewards.trial)}</b><small>试炼币</small></span><span><TrendingUp /><b>{fmt(stageRewards.exp)}</b><small>人物经验</small></span></div></section>
  </div>;
}

function ArenaPage({ power, onBattle }: { power: number; onBattle: () => void }) {
  const save = useGameStore((state) => state.save);
  const challengeNpc = useGameStore((state) => state.challengeNpc);
  const candidates = [...save.npcs].sort((a, b) => Math.abs(a.power - power) - Math.abs(b.power - power)).slice(0, 5);
  const minimumPower = Math.min(power, ...candidates.map((npc) => npc.power));
  const maximumPower = Math.max(power, ...candidates.map((npc) => npc.power));
  const powerPosition = (power - minimumPower) / Math.max(1, maximumPower - minimumPower) * 100;
  return <div className="content-page arena-page"><PageHeading icon={<Trophy />} title="群雄逐鹿" subtitle={`积分 ${save.player.arenaRating} · 胜场 ${save.player.arenaWins}`} /><div className="arena-summary"><div><Crown size={28} /><span>本服排名</span><strong>#{Math.max(1, save.npcs.filter((npc) => npc.rating > save.player.arenaRating).length + 1)}</strong></div><div><Ticket size={28} /><span>挑战券</span><strong>{save.resources.challengeTicket}</strong></div><div><Medal size={28} /><span>功勋</span><strong>{save.resources.merit}</strong></div></div><section className="arena-power-range"><header><span>当前匹配区间</span><strong>我方战力 {fmt(power)}</strong></header><div><i style={{ left: `${powerPosition}%` }}><Swords /></i></div><small><b>{fmt(minimumPower)}</b><b>{fmt(maximumPower)}</b></small></section><section className="opponent-list"><header><span><Target />附近对手</span><small>按战力接近度排序</small></header>{candidates.map((npc, index) => {
    const ratio = power / Math.max(1, npc.power);
    const verdict = ratio >= 1.15 ? "优势" : ratio >= 0.88 ? "均势" : "高危";
    return <article key={npc.id} data-npc-power={npc.power}><AtlasArt kind="warSoul" index={index + 8} className="npc-avatar" /><div><strong>{npc.name}</strong><small>Lv.{npc.level} · {npc.guild} · {npc.archetype}</small><b>战力 {fmt(npc.power)} <em className={verdict}>{verdict}</em></b></div><button onClick={() => { challengeNpc(npc.id); onBattle(); }} disabled={save.resources.challengeTicket <= 0}><Swords />{save.resources.challengeTicket > 0 ? "挑战" : "无挑战券"}</button></article>;
  })}</section></div>;
}

function GuildPage({ power, onBattle }: { power: number; onBattle: () => void }) {
  const save = useGameStore((state) => state.save);
  const donate = useGameStore((state) => state.guildDonate);
  const buy = useGameStore((state) => state.guildShopBuy);
  const boss = useGameStore((state) => state.challengeGuildBoss);
  const members = [{ name: save.player.name, power, role: "盟主" }, ...save.npcs.slice(0, 7).map((npc) => ({ name: npc.name, power: npc.power, role: "成员" }))].sort((a, b) => b.power - a.power);
  const donated = save.guild.donatedDay === save.day;
  const purchased = save.guild.shopDay === save.day;
  const canDonate = !donated && save.resources.gold >= 1000;
  const canBuy = !purchased && save.resources.guildCoin >= 100;
  return <div className="content-page guild-page"><PageHeading icon={<UsersRound />} title="联盟" subtitle="晨星旅团 · Lv.6" /><section className="guild-banner"><AtlasArt kind="warSoul" index={18} /><div><span>联盟驻地</span><strong>晨星旅团</strong><b>联盟战力 {fmt(members.reduce((sum, member) => sum + member.power, 0))}</b><small>荒原巨像已击败 {save.guild.bossWins} 次</small></div><Crown /></section><div className="guild-actions"><button onClick={donate} disabled={!canDonate}><Gift /><strong>{donated ? "今日已捐" : canDonate ? "联盟捐献" : "金币不足"}</strong><small>{donated ? "明日刷新" : canDonate ? "1000金币 → 200联盟币" : `还差 ${fmt(1000 - save.resources.gold)} 金币`}</small></button><button onClick={buy} disabled={!canBuy}><ShoppingBag /><strong>{purchased ? "今日已购" : canBuy ? "联盟特供" : "联盟币不足"}</strong><small>{purchased ? "明日刷新" : canBuy ? "100联盟币 → 500宝箱" : `还差 ${fmt(100 - save.resources.guildCoin)} 联盟币`}</small></button><button className="boss" onClick={() => { boss(); onBattle(); }}><Swords /><strong>联盟首领</strong><small>基础80联盟币 · 随成长提升</small></button></div><section className="section-block guild-ranking"><h3><span>成员排行</span><small>{members.length}/30</small></h3>{members.map((member, index) => <div className={`member-row rank-${index + 1}`} key={member.name}><i>{index + 1}</i><span><strong>{member.name}</strong><small>{member.role}</small></span><b>{fmt(member.power)}</b></div>)}</section></div>;
}

function PageHeading({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) { return <header className="page-heading"><span>{icon}</span><div><h1>{title}</h1><p>{subtitle}</p></div></header>; }

function BottomNav({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  const items: { id: Page; name: string; icon: ReactNode }[] = [{ id: "home", name: "副本", icon: <Box /> }, { id: "play", name: "玩法", icon: <Dices /> }, { id: "trial", name: "试炼", icon: <Swords /> }, { id: "arena", name: "角斗场", icon: <Trophy /> }, { id: "guild", name: "联盟", icon: <Shield /> }];
  return <nav className="bottom-nav">{items.map((item) => <button key={item.id} aria-label={item.name} className={page === item.id ? "active" : ""} onClick={() => onChange(item.id)}>{item.icon}<span>{item.name}</span>{item.id !== "home" && <i />}</button>)}</nav>;
}

function OverlayView({ type, notice, back, close, openOverlay, power, stats, equipmentSelection, setEquipmentSelection, inventoryGroup, setInventoryGroup, restoreScrollTop }: { type: ActiveOverlay; notice: string | null; back: () => void; close: () => void; openOverlay: (value: Overlay) => void; power: number; stats: ReturnType<typeof calculatePlayerStats>; equipmentSelection: EquipmentSelection; setEquipmentSelection: (selection: EquipmentSelection) => void; inventoryGroup: number; setInventoryGroup: (index: number) => void; restoreScrollTop: number }) {
  const titles: Record<Exclude<Overlay, null>, string> = {
    shop: "商城", packages: "礼包", activities: "福利活动", warSouls: "战魂", warSoulPacks: "战魂", beasts: "魔兽", battlePets: "战宠", soulCards: "魂卡",
    hunting: "捕猎", probability: "概率公示", profile: "角色详情", mount: "坐骑", warEagle: "战鹰", runes: "符文",
    gems: "宝石", artifact: "神器", flag: "战旗", territory: "领地", inventory: "冒险背包",
    turntable: "每日转盘", events: "限时活动", orders: "模拟充值账单", settings: "设置", battle: "战斗结算",
    commission: "开箱委托", strategy: "流派方案", twinTowers: "双塔奇兵", equipment: "装备详情", calendar: "开服日历"
  };
  const immersive = type === "beasts";
  const edgeSwipe = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [edgeDrag, setEdgeDrag] = useState(0);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: restoreScrollTop }));
    return () => window.cancelAnimationFrame(frame);
  }, [type, restoreScrollTop]);
  const startEdgeSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const panelLeft = event.currentTarget.getBoundingClientRect().left;
    const target = event.target as HTMLElement;
    const interactive = target.closest("button, a, input, select, textarea, [role='button']");
    if (!interactive && event.isPrimary && event.clientX - panelLeft <= 30) {
      edgeSwipe.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };
  const trackEdgeSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = edgeSwipe.current;
    if (!origin || origin.pointerId !== event.pointerId) return;
    const dx = Math.max(0, event.clientX - origin.x);
    const dy = Math.abs(event.clientY - origin.y);
    if (dx > dy) setEdgeDrag(Math.min(118, dx));
  };
  const finishEdgeSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = edgeSwipe.current;
    edgeSwipe.current = null;
    setEdgeDrag(0);
    if (!origin || origin.pointerId !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = Math.abs(event.clientY - origin.y);
    if (dx >= 72 && dx > dy * 1.25) back();
  };
  return <div className="overlay"><div
    className={`overlay-panel ${immersive ? "immersive-overlay" : ""} ${notice ? "has-notice" : ""} ${edgeDrag ? "edge-dragging" : ""}`}
    style={{ "--edge-drag": `${edgeDrag}px` } as CSSProperties}
    data-edge-swipe-back
    onPointerDown={startEdgeSwipe}
    onPointerMove={trackEdgeSwipe}
    onPointerUp={finishEdgeSwipe}
    onPointerCancel={() => { edgeSwipe.current = null; setEdgeDrag(0); }}
  >{!immersive && <header className="overlay-header"><button onClick={back} aria-label="返回"><ChevronLeft /></button><h2>{titles[type]}</h2><button onClick={close} aria-label="关闭"><X /></button></header>}{notice && !immersive && <div className="toast overlay-notice" role="status" aria-live="polite"><Sparkles size={16} /><span>{notice}</span></div>}<div key={type} ref={bodyRef} className={`overlay-body ${immersive ? "immersive-body" : ""}`}>
    {type === "shop" && <ShopView openOrders={() => openOverlay("orders")} />}
    {type === "packages" && <PackageView openOrders={() => openOverlay("orders")} openWarSouls={() => openOverlay("warSoulPacks")} />}
    {type === "activities" && <ActivitiesView openTurntable={() => openOverlay("turntable")} />}
    {type === "calendar" && <CalendarView />}
    {type === "equipment" && <EquipmentDetailView selection={equipmentSelection} select={setEquipmentSelection} openGems={() => openOverlay("gems")} />}
    {type === "warSouls" && <WarSoulView openProbability={() => openOverlay("probability")} />}
    {type === "warSoulPacks" && <WarSoulView openProbability={() => openOverlay("probability")} initialAcquiring />}
    {type === "beasts" && <BeastView onClose={back} />}
    {type === "battlePets" && <BattlePetView openProbability={() => openOverlay("probability")} />}
    {type === "soulCards" && <SoulCardView openTwinTowers={() => openOverlay("twinTowers")} />}
    {type === "hunting" && <HuntingView />}
    {type === "probability" && <ProbabilityView />}
    {type === "profile" && <ProfileView stats={stats} power={power} />}
    {type === "mount" && <MountView />}
    {type === "warEagle" && <WarEagleView />}
    {type === "runes" && <RuneView />}
    {type === "gems" && <GemView />}
    {type === "artifact" && <ArtifactView />}
    {type === "flag" && <FlagView />}
    {type === "territory" && <TerritoryView />}
    {type === "turntable" && <TurntableView />}
    {type === "events" && <EventHubView />}
    {type === "inventory" && <InventoryView openSystem={(id) => openOverlay(id)} activeGroupIndex={inventoryGroup} onGroupChange={setInventoryGroup} />}
    {type === "orders" && <OrdersView />}
    {type === "settings" && <SettingsView openProbability={() => openOverlay("probability")} />}
    {type === "battle" && <BattleView />}
    {type === "commission" && <CommissionView />}
    {type === "strategy" && <StrategyView />}
    {type === "twinTowers" && <TwinTowersView />}
  </div></div></div>;
}

function SoulCardView({ openTwinTowers }: { openTwinTowers?: () => void }) {
  const save = useGameStore((state) => state.save);
  const draw = useGameStore((state) => state.drawCollection);
  const deploy = useGameStore((state) => state.deploy);
  const upgrade = useGameStore((state) => state.upgradeSoulCard);
  const ascend = useGameStore((state) => state.ascendSoulCard);
  const decompose = useGameStore((state) => state.decomposeSoulCardDuplicates);
  const exchange = useGameStore((state) => state.exchangeSoulCardDust);
  const selectScheme = useGameStore((state) => state.selectSoulCardScheme);
  const definitions = SOUL_CARDS;
  const inventory = save.collections.soulCards;
  const [tab, setTab] = useState<"embed" | "skill" | "summon" | "codex">("embed");
  const [roleFilter, setRoleFilter] = useState<"all" | "1" | "2" | "3">("all");
  const [selected, setSelected] = useState(definitions[0].id);
  const active = definitions.find((item) => item.id === selected)!;
  const activeIndex = definitions.findIndex((item) => item.id === selected);
  const owned = inventory[selected];
  const equipped = save.collections.equippedCards.includes(active.id);
  const duplicateCount = definitions.reduce((sum, item) => sum + Math.max(0, (inventory[item.id]?.count || 0) - 1), 0);
  const nextCost = owned ? soulCardUpgradeCost(owned.level, active.tier) : 0;
  const roleKey = (id: string) => id.split("-").at(-1) || "1";
  const roles = [
    { key: "1", name: "攻击", icon: <Swords /> },
    { key: "3", name: "防御", icon: <Shield /> },
    { key: "2", name: "生命", icon: <Heart /> }
  ];
  const setCounts = save.collections.equippedCards.reduce<Record<string, number>>((counts, id) => {
    const card = definitions.find((item) => item.id === id);
    const setName = card?.name.split("·")[0];
    if (setName) counts[setName] = (counts[setName] || 0) + 1;
    return counts;
  }, {});
  const resonance = Object.entries(setCounts).filter(([, count]) => count >= 3);
  const filteredCards = definitions.filter((card) => roleFilter === "all" || roleKey(card.id) === roleFilter);
  const selectAndShow = (id: string, destination: typeof tab = "embed") => { setSelected(id); setTab(destination); };
  return <div className="collection-view soul-card-view">
    <header className="soul-card-head"><div><Layers3 /><span><small>魂卡阵列</small><h2>魂卡</h2></span></div><div><ResourcePill id="soulCardTicket" value={save.resources.soulCardTicket} label /><ResourcePill id="soulCardDust" value={save.resources.soulCardDust} label /></div></header>
    <div className="soul-card-stage">
      {tab === "embed" && <>
        <section className="soul-card-command-bar"><button disabled={!duplicateCount} onClick={() => decompose()}><Archive /><span>魂卡分解</span><b>{duplicateCount}</b></button><div><small>阵列战力</small><strong>{fmt(save.collections.equippedCards.length * 100 + resonance.length * 500)}</strong></div><button onClick={openTwinTowers}><Swords /><span>双塔奇兵</span><ChevronRight /></button></section>
        <section className="card-convoy"><header><span>同名魂卡只能镶嵌 1 张</span><strong>{save.collections.equippedCards.length}/12</strong></header>{roles.map((role) => {
          const rowCards = save.collections.equippedCards.filter((id) => roleKey(id) === role.key).slice(0, 4);
          return <div className="soul-card-formation-row" key={role.key}><span className="soul-card-role">{role.icon}<b>{role.name}</b></span><div>{Array.from({ length: 4 }, (_, index) => { const id = rowCards[index]; if (!id) return <button key={index} className="empty" aria-label={`${role.name}魂卡空位`} onClick={() => { setRoleFilter(role.key as "1" | "2" | "3"); setTab("codex"); }}><span>+</span></button>; const cardIndex = definitions.findIndex((card) => card.id === id); const card = definitions[cardIndex]; const state = inventory[id]; return <button key={id} className={selected === id ? "selected" : ""} onClick={() => setSelected(id)} aria-label={`查看${card.name}`} style={{ "--accent": card.accent } as CSSProperties}><AtlasArt kind="soulCard" index={cardIndex} /><b>Lv.{state?.level || 1}</b><i>−</i></button>; })}</div></div>;
        })}<div className="soul-card-schemes">{[0, 1, 2].map((index) => <button key={index} className={save.collections.activeSoulCardScheme === index ? "active" : ""} onClick={() => selectScheme(index)}>方案{["一", "二", "三"][index]}<small>{save.collections.soulCardSchemes[index].length}/12</small></button>)}</div></section>
        <section className="soul-card-focus" style={{ "--accent": active.accent } as CSSProperties}><AtlasArt kind="soulCard" index={activeIndex} /><div><span>{roles.find((role) => role.key === roleKey(active.id))?.name}魂卡 · {active.role}</span><strong>{active.name}</strong><small>{owned ? `${owned.stage}阶 · Lv.${owned.level} · 库存 ${owned.count}` : "图鉴未解锁"}</small><p>{active.skill}</p></div>{owned ? <div><button className={equipped ? "active" : ""} onClick={() => deploy("soulCards", active.id)}>{equipped ? "卸下" : "镶嵌"}</button><button onClick={() => upgrade(active.id, 1)}>升级<small>{nextCost}魂晶</small></button><button disabled={owned.count - 1 < owned.stage + 1} onClick={() => ascend(active.id)}>升阶</button></div> : <button onClick={() => setTab("summon")}>前往召唤</button>}</section>
      </>}
      {tab === "skill" && <section className="soul-card-skill-page"><div className="soul-skill-wheel"><div>{resonance.slice(0, 3).map(([name, count], index) => <span key={name} className={`node-${index + 1}`}><AtlasArt kind="soulCard" index={Math.max(0, definitions.findIndex((card) => card.name.startsWith(name)))} /><b>{name}</b><small>{count}/3</small></span>)}</div><strong>{resonance.length ? `${resonance.length}组共鸣` : "等待共鸣"}</strong></div><div className="soul-skill-ledger">{save.collections.equippedCards.length ? save.collections.equippedCards.map((id) => { const card = definitions.find((item) => item.id === id)!; const index = definitions.findIndex((item) => item.id === id); return <button key={id} onClick={() => selectAndShow(id)}><AtlasArt kind="soulCard" index={index} /><span><strong>{card.name}</strong><small>{card.skill}</small></span><ChevronRight /></button>; }) : <div className="inline-empty"><Layers3 />尚未镶嵌魂卡</div>}</div></section>}
      {tab === "summon" && <section className="soul-card-summon-page"><div className="soul-card-summon-stage"><AtlasArt kind="soulCard" index={save.counters.summons % definitions.length} /><i /><span>命运召唤</span><strong>魂卡券 {fmt(save.resources.soulCardTicket)}</strong></div><div className="soul-card-summon-actions"><button onClick={() => draw("soulCards", 1)}>召唤 1 次<small>魂卡券 1</small></button><button className="primary" onClick={() => draw("soulCards", 10)}>召唤 10 次<small>魂卡券 10</small></button></div><section className="soul-card-recycle"><button disabled={!duplicateCount} onClick={() => decompose()}><Archive />分解重复 ×{duplicateCount}</button><button disabled={save.resources.soulCardDust < 60} onClick={() => exchange(1)}><Repeat2 />60 魂晶兑换 1 券</button></section></section>}
      {tab === "codex" && <section className="soul-card-codex-page"><div className="soul-card-role-tabs"><button className={roleFilter === "all" ? "active" : ""} onClick={() => setRoleFilter("all")}>全部</button>{roles.map((role) => <button key={role.key} className={roleFilter === role.key ? "active" : ""} onClick={() => setRoleFilter(role.key as "1" | "2" | "3")}>{role.icon}{role.name}</button>)}</div><div className="codex-grid soul-card-codex">{filteredCards.map((item) => { const index = definitions.findIndex((card) => card.id === item.id); const state = inventory[item.id]; const amount = state?.count || 0; return <button className={`codex-card ${selected === item.id ? "selected" : ""} ${amount ? "owned" : "locked"}`} key={item.id} onClick={() => setSelected(item.id)} style={{ "--accent": item.accent } as CSSProperties}><AtlasArt kind="soulCard" index={index} /><strong>{item.name}</strong><small>{amount ? `${state.stage}阶 · Lv.${state.level}` : "未获得"}</small>{amount > 0 && <i>×{amount}</i>}</button>; })}</div><div className="soul-card-codex-detail" style={{ "--accent": active.accent } as CSSProperties}><AtlasArt kind="soulCard" index={activeIndex} /><span><strong>{active.name}</strong><small>{active.skill}</small><b>{owned ? `库存 ${owned.count} · ${owned.stage}阶 · Lv.${owned.level}` : "尚未获得"}</b></span>{owned && <div><button className={equipped ? "active" : ""} onClick={() => deploy("soulCards", active.id)}>{equipped ? "卸下" : "镶嵌"}</button><button onClick={() => upgrade(active.id, 1)}>升级</button><button disabled={owned.count <= 1} onClick={() => decompose(active.id)}>分解</button></div>}</div></section>}
    </div>
    <nav className="soul-card-nav"><button className={tab === "embed" ? "active" : ""} onClick={() => setTab("embed")}><Layers3 />镶嵌</button><button className={tab === "skill" ? "active" : ""} onClick={() => setTab("skill")}><WandSparkles />技能</button><button className={tab === "summon" ? "active" : ""} onClick={() => setTab("summon")}><Sparkles />召唤</button><button className={tab === "codex" ? "active" : ""} onClick={() => setTab("codex")}><BookOpen />图鉴</button></nav>
  </div>;
}

function CommissionView() {
  const save = useGameStore((state) => state.save);
  const setAutomation = useGameStore((state) => state.setAutomation);
  const buyTickets = useGameStore((state) => state.buyChestTickets);
  const plan = BUILD_PLANS.find((item) => item.id === save.buildPlan)!;
  return <div className="commission-view"><section className="commission-status"><PackageOpen /><div><span>剩余宝箱</span><strong>{fmt(save.resources.chestTicket)}</strong><small>{save.automation.autoChest ? "委托正在运行" : `按“${plan.name}”方案自动判断装备`}</small></div><i className={save.automation.autoChest ? "running" : ""}>{save.automation.autoChest ? "运行中" : "已停止"}</i></section>
    <section className="commission-section"><h3>基础条件</h3><label><span>每轮开启</span><select value={save.automation.batch} onChange={(event) => setAutomation({ batch: Number(event.target.value) as 10 | 100 })}><option value={10}>10 个宝箱</option><option value={100}>100 个宝箱</option></select></label><label><span>最低保留品质</span><select value={save.automation.keepQuality} onChange={(event) => setAutomation({ keepQuality: Number(event.target.value) })}>{QUALITIES.slice(2).map((quality) => <option key={quality.id} value={quality.id}>{quality.name}及以上</option>)}</select></label><label><span>优先词条</span><select value={save.automation.targetStat} onChange={(event) => setAutomation({ targetStat: event.target.value as BuildStat })}>{Object.entries(statNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label></section>
    <section className="commission-section"><h3>停止条件</h3><ToggleRow label="出现流派评分更高装备时停止" checked={save.automation.stopOnUpgrade} onChange={(value) => setAutomation({ stopOnUpgrade: value })} /><ToggleRow label={`获得${QUALITIES[save.automation.keepQuality].name}及以上时停止`} checked={save.automation.stopOnQuality} onChange={(value) => setAutomation({ stopOnQuality: value })} /><ToggleRow label="极速委托（约每秒四轮）" checked={save.automation.speedMode} onChange={(value) => setAutomation({ speedMode: value })} /></section>
    <section className="commission-section handling"><h3>自动处理</h3><p><Check />评分更高的装备立即穿戴</p><p><Check />命中优先词条或保留品质的装备进入结果栏</p><p><Check />其余装备自动出售，背包不会无限堆积</p></section>
    {save.lastChestSummary && <section className="commission-report"><strong>上一轮</strong><span>开启 {save.lastChestSummary.opened}</span><span>换装 {save.lastChestSummary.equipped}</span><span>保留 {save.lastChestSummary.kept}</span><span>出售 {save.lastChestSummary.sold}</span><b>战力 +{fmt(save.lastChestSummary.powerGain)}</b></section>}
    <div className="commission-actions"><button onClick={buyTickets}><Gem />补充100宝箱</button><button className={save.automation.autoChest ? "danger" : "primary"} onClick={() => setAutomation({ autoChest: !save.automation.autoChest })}>{save.automation.autoChest ? <Square /> : <Repeat2 />}{save.automation.autoChest ? "停止" : "开始委托"}</button></div>
  </div>;
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="toggle-row"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i /></label>;
}

function StrategyView() {
  const save = useGameStore((state) => state.save);
  const setPlan = useGameStore((state) => state.setBuildPlan);
  const optimize = useGameStore((state) => state.optimizeBuild);
  return <div className="strategy-view"><section className="strategy-intro"><Swords /><div><strong>先选打法，再自动处理装备</strong><small>委托换装会同时计算基础战力与目标词条，三张魂卡技能按流派联动。</small></div></section><div className="plan-list">{BUILD_PLANS.map((plan, index) => <button key={plan.id} className={save.buildPlan === plan.id ? "selected" : ""} onClick={() => setPlan(plan.id)} style={{ "--accent": plan.accent } as CSSProperties}><AtlasArt kind="warSoul" index={index + 12} /><span><strong>{plan.name}</strong><small>{plan.description}</small><b>主属性 {statNames[plan.primary]} · 副属性 {statNames[plan.secondary]}</b></span>{save.buildPlan === plan.id && <Check />}</button>)}</div><section className="build-loadout"><h3>当前联动</h3><div><span>装备委托</span><strong>优先 {statNames[save.automation.targetStat]}</strong></div><div><span>魂卡技能组</span><strong>{save.collections.equippedCards.length}/3</strong></div><div><span>战魂 / 魔兽</span><strong>{save.collections.deployedWarSoul ? "已出战" : "待收集"} / {save.collections.deployedBeast ? "已出战" : "待收集"}</strong></div></section><button className="optimize-button" onClick={optimize}><Zap />一键按流派优化全部阵容</button></div>;
}

function TwinTowersView() {
  const save = useGameStore((state) => state.save);
  const reward = useGameStore((state) => state.rewardTwinTower);
  const ownedIds = SOUL_CARDS.filter((card) => save.collections.soulCards[card.id]?.count).map((card) => card.id);
  const available = ownedIds.length ? ownedIds : SOUL_CARDS.slice(0, 9).map((card) => card.id);
  const [slots, setSlots] = useState(1);
  const [silver, setSilver] = useState(24);
  const [towerHp, setTowerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(80);
  const [wave, setWave] = useState(1);
  const [offerOffset, setOfferOffset] = useState(0);
  const [deployed, setDeployed] = useState<{ id: string; stars: number }[]>([]);
  const [finished, setFinished] = useState<"win" | "loss" | null>(null);
  const [message, setMessage] = useState("选择一张魂卡编入战车，再迎战第一波。");
  const offers = Array.from({ length: 3 }, (_, index) => available[(offerOffset + index) % available.length]);
  const expandCost = 8 + slots * 4;

  const recruit = (id: string) => {
    if (finished) return;
    const existing = deployed.find((card) => card.id === id);
    if (existing) {
      if (existing.stars >= 3 || silver < 5) { setMessage(existing.stars >= 3 ? "该魂卡已满3星。" : "银币不足，升星需要5银币。"); return; }
      setSilver((value) => value - 5);
      setDeployed((cards) => cards.map((card) => card.id === id ? { ...card, stars: card.stars + 1 } : card));
      setMessage("同名魂卡合成成功，战车单位升星。");
      return;
    }
    if (deployed.length >= slots || silver < 4) { setMessage(deployed.length >= slots ? "当前战车槽位已满，请先扩建。" : "银币不足，招募需要4银币。"); return; }
    setSilver((value) => value - 4);
    setDeployed((cards) => [...cards, { id, stars: 1 }]);
    setMessage("魂卡已编入战车。再次招募同名卡可升星。");
  };

  const expand = () => {
    if (slots >= 6) { setMessage("战车已经扩建到6个槽位。" ); return; }
    if (silver < expandCost) { setMessage(`扩建需要${expandCost}银币。`); return; }
    setSilver((value) => value - expandCost);
    setSlots((value) => value + 1);
    setMessage("战车扩建成功，可额外上阵1张魂卡。");
  };

  const refresh = () => {
    if (silver < 2 || finished) { setMessage(finished ? "本局已结束，请重新开局。" : "刷新需要2银币。"); return; }
    setSilver((value) => value - 2);
    setOfferOffset((value) => (value + 3) % available.length);
    setMessage("招募区已刷新。");
  };

  const fightWave = () => {
    if (finished) return;
    if (!deployed.length) { setMessage("至少上阵1张魂卡才能迎战。" ); return; }
    const attack = deployed.reduce((sum, unit) => {
      const card = SOUL_CARDS.find((entry) => entry.id === unit.id)!;
      return sum + (card.tier + unit.stars) * 5;
    }, 0);
    const enemyDamage = Math.max(3, 12 - deployed.length * 2 - deployed.reduce((sum, unit) => sum + unit.stars, 0));
    const nextEnemyHp = Math.max(0, enemyHp - attack);
    const nextTowerHp = Math.max(0, towerHp - enemyDamage);
    setEnemyHp(nextEnemyHp);
    setTowerHp(nextTowerHp);
    setSilver((value) => value + 10);
    setWave((value) => value + 1);
    if (nextEnemyHp <= 0) {
      setFinished("win");
      setMessage(`战车造成${attack}点伤害，敌方塔被摧毁。`);
      reward();
    } else if (nextTowerHp <= 0) {
      setFinished("loss");
      setMessage("我方战车被摧毁，本局失败。");
    } else {
      setMessage(`我方造成${attack}点伤害，承受${enemyDamage}点反击，获得10银币。`);
    }
  };

  const restart = () => {
    setSlots(1); setSilver(24); setTowerHp(100); setEnemyHp(80); setWave(1); setOfferOffset(0); setDeployed([]); setFinished(null);
    setMessage("新一局开始，先选择魂卡编入战车。");
  };

  return <div className="twin-towers-view">
    <section className="towers-arena"><div className="tower-side ally"><Shield /><strong>我方战车</strong><span><i style={{ width: `${towerHp}%` }} /></span><b>{towerHp}/100</b></div><div className="wave-mark"><small>第 {wave} 波</small><strong>VS</strong><span>{finished === "win" ? "胜利" : finished === "loss" ? "失败" : "交战中"}</span></div><div className="tower-side enemy"><Target /><strong>敌方高塔</strong><span><i style={{ width: `${enemyHp / 80 * 100}%` }} /></span><b>{enemyHp}/80</b></div></section>
    <section className="tower-economy"><div><Coins /><span>银币</span><strong>{silver}</strong></div><button onClick={expand} disabled={slots >= 6}><Home />扩建 <small>{slots >= 6 ? "已满" : expandCost}</small></button><button onClick={refresh}><Repeat2 />刷新 <small>2</small></button></section>
    <section className="war-cart"><header><strong>战车编队</strong><span>{deployed.length}/{slots} · 最多6张</span></header><div>{Array.from({ length: 6 }, (_, index) => { const unit = deployed[index]; const cardIndex = unit ? SOUL_CARDS.findIndex((card) => card.id === unit.id) : -1; return <div key={index} className={index < slots ? "unlocked" : "locked"}>{unit ? <><AtlasArt kind="soulCard" index={cardIndex} /><b>{"★".repeat(unit.stars)}</b></> : index < slots ? <span>+</span> : <span>锁</span>}</div>; })}</div></section>
    <section className="recruit-row"><header><span>本轮招募 {ownedIds.length ? "" : "· 演练卡池"}</span><small>4银币上阵 · 同名卡5银币升星</small></header><div>{offers.map((id) => { const card = SOUL_CARDS.find((entry) => entry.id === id)!; const index = SOUL_CARDS.findIndex((entry) => entry.id === id); return <button key={`${id}-${offerOffset}`} onClick={() => recruit(id)}><AtlasArt kind="soulCard" index={index} /><strong>{card.name}</strong><small>{"◆".repeat(card.tier)}</small></button>; })}</div></section>
    <div className={`tower-message ${finished || ""}`}>{finished === "win" ? <Trophy /> : <Info />}<span>{message}</span></div>
    <div className="tower-actions">{finished ? <button className="primary" onClick={restart}><RotateCcw />重新开局</button> : <button className="primary" onClick={fightWave}><Swords />迎战第 {wave} 波</button>}</div>
  </div>;
}

function ActivitiesView({ openTurntable }: { openTurntable: () => void }) {
  const save = useGameStore((state) => state.save);
  const claim = useGameStore((state) => state.claimActivity);
  const claimAll = useGameStore((state) => state.claimAllActivities);
  const rewardScale = progressionRewardMultiplier(save.player.level, save.day);
  const activities = [{ id: "signin", name: `第 ${save.day} 天签到`, desc: "钻石×88 · 宝箱×200", icon: <CalendarDays /> }, { id: "daily", name: "每日活跃", desc: "金币×5万 · 魂核×20 · 挑战券×5", icon: <Activity /> }, { id: "seven", name: "七日豪礼", desc: "钻石×680 · 魔兽精华×80 · 魂卡券×50", icon: <Gift /> }, { id: "mail", name: "本地服邮件", desc: "宝箱×999 · 宝石券×10 · 符文碎片×30", icon: <Archive /> }];
  return <div className="activities-view"><section className="welfare-header"><Gift /><div><span>今日福利 · 成长倍率 ×{rewardScale.toFixed(2)}</span><strong>{activities.filter((item) => !save.claimedActivities.includes(item.id)).length} 项待领取</strong><small>基础奖励随人物等级与开服天数指数增长</small></div><button className="primary" onClick={claimAll}>一键领取</button></section><button className="turntable-entry" onClick={openTurntable}><Dices /><div><strong>每日转盘</strong><small>9次不重复 · 当前 {save.growthSystems.turntable.spinsToday}/9</small></div><ChevronRight /></button>{activities.map((item) => { const claimed = save.claimedActivities.includes(item.id); const locked = item.id === "seven" && save.day < 7; return <article className="activity-card" key={item.id}><span>{item.icon}</span><div><strong>{item.name}</strong><small>{item.desc} · 当前×{rewardScale.toFixed(2)}</small></div><button onClick={() => claim(item.id)} disabled={claimed || locked}>{claimed ? "已领取" : locked ? "第7天" : "领取"}</button></article>; })}<VipRewards /></div>;
}

function CalendarView() {
  const save = useGameStore((state) => state.save);
  const advance = useGameStore((state) => state.advanceDay);
  const week = [
    ["启程", "宝箱与金币"], ["锻造", "装备精炼"], ["试炼", "挑战券补给"], ["召唤", "战魂与魔兽"],
    ["远征", "魂卡材料"], ["工坊", "符文与宝石"], ["庆典", "七日豪礼"]
  ];
  const cycleDay = (save.day - 1) % 7 + 1;
  const outputScale = progressionRewardMultiplier(save.player.level, save.day);
  return <div className="calendar-view">
    <section className="calendar-banner"><Clock3 /><div><span>单机开服进度</span><h2>第 {save.day} 天</h2><small>每日刷新领地、转盘、角斗券与离线收益</small></div><b>产出倍率 ×{outputScale.toFixed(2)}</b></section>
    <section className="calendar-week">{week.map(([name, reward], index) => { const day = index + 1; return <div key={day} className={`${day === cycleDay ? "current" : ""} ${day < cycleDay ? "done" : ""}`}><i>{day}</i><strong>{name}</strong><small>{reward}</small>{day < cycleDay ? <Check /> : day === cycleDay ? <CalendarDays /> : <LockKeyhole />}</div>; })}</section>
    <section className="day-refresh-list"><h3>进入下一天将刷新</h3><div><span><Target />领地拉取 5 次</span><span><Dices />转盘奖池 9 格</span><span><Ticket />挑战券指数补给</span><span><Coins />离线金币倍率</span></div></section>
    <button className="advance-day-button" onClick={advance}><CalendarDays />推进到第 {save.day + 1} 天<small>单机时间控制，不影响系统时间</small></button>
  </div>;
}

function VipRewards() {
  const save = useGameStore((state) => state.save);
  const claim = useGameStore((state) => state.claimVip);
  const claimAll = useGameStore((state) => state.claimAllVip);
  const vip = vipLevel(save.totalSpent);
  return <section className="vip-rewards"><header><h3><Crown />VIP 礼包</h3><button onClick={claimAll}>一键领取</button></header>{Array.from({ length: 15 }, (_, index) => index + 1).map((level) => <div key={level}><b>VIP {level}</b><span>钻石×{level * 120} · 宝箱×{level * 300} · 魂核×{level * 8}</span><button disabled={level > vip || save.claimedVip.includes(level)} onClick={() => claim(level)}>{save.claimedVip.includes(level) ? "已领取" : level > vip ? "未达成" : "领取"}</button></div>)}</section>;
}

function ProfileView({ stats, power }: { stats: ReturnType<typeof calculatePlayerStats>; power: number }) {
  const save = useGameStore((state) => state.save);
  const contributionLosses = useMemo(() => powerContributionLosses(save), [save]);
  const groups: { title: string; keys: (keyof CombatStats)[] }[] = [
    { title: "基础属性", keys: ["hp", "attack", "defense", "speed"] },
    { title: "战斗属性", keys: ["lifesteal", "crit", "dodge", "stun", "combo", "counter"] },
    { title: "战斗抗性", keys: ["antiLifesteal", "antiCrit", "antiDodge", "antiStun", "antiCombo", "antiCounter"] },
    { title: "高级词条", keys: ["critDamage", "tenacity", "healing", "recovery", "damageBonus", "damageReduction", "beastStrength"] }
  ];
  return <div className="profile-view"><section className="profile-hero"><ProgressionAvatar tier={heroAppearanceTier(save)} className="profile-character-avatar" /><div><span>{save.player.name}</span><h2>Lv.{save.player.level} · 战力 {fmt(power)}</h2><small>外观阶段 {heroAppearanceTier(save) + 1}/5 · 主线 {save.player.stage} · 竞技积分 {save.player.arenaRating}</small></div></section>{save.lastGrowth && <section className="growth-receipt"><span>{save.lastGrowth.label}</span><strong>战力 {fmt(save.lastGrowth.powerBefore)} → {fmt(save.lastGrowth.powerAfter)}{save.lastGrowth.levelAfter > save.lastGrowth.levelBefore ? ` · 等级 ${save.lastGrowth.levelBefore} → ${save.lastGrowth.levelAfter}` : ""}</strong></section>}{groups.map((group) => <section className="stat-group" key={group.title}><h3>{group.title}</h3><div className="stats-table">{group.keys.map((key) => { const meta = COMBAT_STAT_META[key]; const percent = !["hp", "attack", "defense", "speed"].includes(key); return <div key={key}><span><b>{meta.name}</b><small>来源：{meta.sources.join(" / ")}</small></span><strong>{percent ? `${(stats[key] / 100).toFixed(2)}%` : fmt(stats[key])}</strong></div>; })}</div></section>)}<section className="power-breakdown"><header><span><h3>战力来源核验</h3><small>按移除系统后的真实战力损失计算</small></span><strong>{fmt(power)}</strong></header><div>{contributionLosses.map((item) => { const share = item.value / Math.max(1, power) * 100; return <span key={item.name}><i style={{ width: `${Math.min(100, share)}%` }} /><b>{item.name}</b><strong>{item.value ? `+${fmt(item.value)} · ${share.toFixed(1)}%` : "未激活"}</strong></span>; })}</div></section></div>;
}

function OrdersView() {
  const save = useGameStore((state) => state.save);
  return <div className="orders-view"><section className="orders-total"><CircleDollarSign /><span>累计“消费”</span><strong>¥{save.totalSpent.toLocaleString()}</strong><small>共 {save.orders.length} 笔本地模拟订单</small></section>{[...save.orders].reverse().map((order) => <article key={order.id}><ReceiptText /><div><strong>{order.productName}</strong><small>{new Date(order.createdAt).toLocaleString("zh-CN")}</small><span>{Object.entries(order.rewards).map(([id, amount]) => `${RESOURCE_META[id as ResourceId].name}×${amount}`).join(" · ")}</span></div><b>¥{order.amountRmb}</b></article>)}{save.orders.length === 0 && <div className="empty-state"><ReceiptText /><strong>还没有模拟充值记录</strong><span>商城内所有档位均为免费本地模拟</span></div>}</div>;
}

function SettingsView({ openProbability }: { openProbability: () => void }) {
  const reset = useGameStore((state) => state.reset);
  const [armed, setArmed] = useState(false);
  return <div className="settings-view"><section><Info /><div><strong>单机与存档</strong><p>全部数据保存在当前浏览器的 IndexedDB 中。没有账号、云同步或真实支付。</p></div></section><section><BookOpen /><div><strong>概率规则</strong><p>抽取使用持久化随机种子，刷新页面不能重抽。宝箱30/31级采用官网公示概率，未确认的规则不会伪装成官方值。</p><button onClick={openProbability}>查看概率公示</button></div></section><section><RotateCcw /><div><strong>重新开始</strong><p>清除角色、资源、账单和收集进度，此操作无法撤销。</p>{armed ? <div className="danger-actions"><button onClick={() => setArmed(false)}>取消</button><button className="danger" onClick={() => void reset()}>确认清除</button></div> : <button onClick={() => setArmed(true)}>清除存档</button>}</div></section></div>;
}

function huntingArtIndex(name: string, fallback: number) {
  if (/灵魂鹿/.test(name)) return 15;
  if (/小恶魔/.test(name)) return 14;
  if (/贝壳|面粉袋|线团|木头|石块/.test(name)) return 13;
  if (/南瓜|莲雾|松子/.test(name)) return 12;
  if (/香菇/.test(name)) return 10;
  if (/孔雀/.test(name)) return 8;
  if (/长毛野猪|犹猪|^猪$/.test(name)) return 7;
  if (/崖崖牛|泥牛|黄牛|金牛|叶牛|彩虹牛|牦牛|^牛$|幻牛/.test(name)) return 6;
  if (/羊羔|^羊$/.test(name)) return 5;
  if (/战鹰/.test(name)) return 9;
  if (/梅花鹿|绿叶鹿|雪鹿王|梅花男爵/.test(name)) return 4;
  if (/火箭雀|珍珠雀/.test(name)) return 3;
  if (/天使猪/.test(name)) return 2;
  if (/鸭|鸡/.test(name)) return 1;
  if (/兔/.test(name)) return 0;
  if (/花|薄荷|玫瑰|棉花|百日菊|洋甘菊|翠花/.test(name)) return 11;
  return fallback % 16;
}

function HuntingView() {
  const save = useGameStore((state) => state.save);
  const hunt = useGameStore((state) => state.hunt);
  const sell = useGameStore((state) => state.sellHuntDuplicates);
  const exchange = useGameStore((state) => state.exchangeHuntingCoins);
  const [tab, setTab] = useState<"hunt" | "codex">("hunt");
  const unlocked = HUNTING_POOL.filter((item) => save.hunting[item.id]).length;
  const duplicates = HUNTING_POOL.reduce((sum, item) => sum + Math.max(0, (save.hunting[item.id] || 0) - 1), 0);
  const needed = hunterExpForLevel(save.hunterLevel);
  const codexLabel = (item: (typeof HUNTING_POOL)[number]) => {
    const labels: Record<string, string> = { hpBonus: "生命", attackBonus: "攻击", defenseBonus: "防御", crit: "暴击", dodge: "闪避", stun: "击晕", combo: "连击", counter: "反击", lifesteal: "吸血", speed: "速度" };
    return `${labels[item.codexStat] || item.codexStat} +${item.codexStat === "speed" ? item.codexValue : `${(item.codexValue / 100).toFixed(2)}%`}`;
  };
  return <div className="hunting-view hunting-rework">
    <section className="hunting-hero"><AtlasArt kind="hunting" index={4} /><div><span>猎人 Lv.{save.hunterLevel}</span><h2>暮光森林</h2><small>出售重复猎物获得经验与猎人币，猎人等级提高出售价值</small><i><b style={{ width: `${Math.min(100, save.hunterExp / needed * 100)}%` }} /></i><em>{save.hunterExp}/{needed}</em></div></section>
    <div className="hunt-tabs"><button className={tab === "hunt" ? "active" : ""} onClick={() => setTab("hunt")}><PawPrint />捕猎</button><button className={tab === "codex" ? "active" : ""} onClick={() => setTab("codex")}><BookOpen />图鉴 {unlocked}/{HUNTING_POOL.length}</button></div>
    {tab === "hunt" && <>
      <div className="hunt-controls"><ResourcePill id="huntingStamina" value={save.resources.huntingStamina} /><ResourcePill id="huntingCoin" value={save.resources.huntingCoin} /><button onClick={() => hunt(1)}>捕猎 1 次</button><button className="primary" onClick={() => hunt(10)}>捕猎 10 次</button></div>
      {save.lastHunt.length > 0 && <section className="hunt-results"><strong>最近捕获</strong><div>{save.lastHunt.map((name, index) => <span key={`${name}-${index}`}>{name}</span>)}</div></section>}
      <section className="hunt-recycle"><div><Archive /><span><strong>重复猎物 ×{duplicates}</strong><small>每种保留 1 份图鉴，其他全部出售</small></span></div><button disabled={!duplicates} onClick={sell}>一键出售</button></section>
      <section className="hunter-shop"><header><Coins /><span><strong>猎人兑换所</strong><small>低级重复物转为长期可用资源</small></span></header><div><button disabled={save.resources.huntingCoin < 50} onClick={() => exchange("stamina")}>体力 ×50<small>猎人币 50</small></button><button className="primary" disabled={save.resources.huntingCoin < 100} onClick={() => exchange("materials")}>稀有材料包<small>猎人币 100</small></button></div></section>
    </>}
    {tab === "codex" && <section className="hunting-codex"><header><BookOpen /><span><strong>永久图鉴属性</strong><small>首次捕获立即生效；出售重复物不会失去解锁</small></span><b>{unlocked}/{HUNTING_POOL.length}</b></header><div>{HUNTING_POOL.map((item, index) => { const amount = save.hunting[item.id] || 0; return <article key={item.id} className={`${amount ? "unlocked" : "locked"} rarity-${item.rarity}`}><AtlasArt kind="hunting" index={huntingArtIndex(item.name, index)} className="hunt-glyph" /><strong>{item.name}</strong><small>{amount ? codexLabel(item) : "未解锁"}</small><i>{item.rate.toFixed(2)}%</i>{amount > 0 && <b>×{amount}</b>}</article>; })}</div></section>}
  </div>;
}

function ProbabilityView() {
  return <div className="probability-view"><section className="probability-note"><Info /><div><strong>公开资料与本地规则分开标注</strong><p>官网概率页、公开攻略及原机截图中可核对的数值优先照录；为保证单机循环完整而补齐的保底、消耗和未公开高阶数据集中列在页面末尾。</p></div></section>{OFFICIAL_PROBABILITY_SECTIONS.map((section) => <section className="probability-section" key={section.title}><h3>{section.title}</h3>{section.rows.map(([name, rate]) => <div key={name}><span>{name}</span><strong>{rate}</strong></div>)}</section>)}<section className="probability-section provisional"><h3>单机平衡规则（非官方公布值）</h3><div><span>坐骑稀有保底</span><strong>连续50次未出稀有，下次至少稀有</strong></div><div><span>坐骑培养 / 符文升级消耗</span><strong>随等级幂次增长</strong></div><div><span>战宠等级曲线与协战节奏</span><strong>培养需求随等级幂次增长；每3回合协战</strong></div><div><span>战魂副魂 1/2/3/4 个</span><strong>25% / 50% / 75% / 100%</strong></div><div><span>普通魔兽蛋售价与物种权重</span><strong>单机体验配置；黄色蛋品阶固定为史诗</strong></div><div><span>魔兽兽栏扩建</span><strong>8格起步，每次解锁2格，钻石成本递增</strong></div><div><span>超凡强化概率与材料消耗</span><strong>单机平衡配置；觉醒本身固定 100%</strong></div><div><span>神器炉等级、品质权重与30次保底</span><strong>按本地长期成长曲线配置</strong></div><div><span>领地资源点品质与刷新权重</span><strong>本地探索产出表</strong></div><div><span>活动道具兑换内容</span><strong>单机确定性资源出口</strong></div></section></div>;
}

function BattleView() {
  const save = useGameStore((state) => state.save);
  const result = save.lastBattle;
  const auto = save.automation.autoStage;
  const challenge = useGameStore((state) => state.challengeStage);
  const setAutomation = useGameStore((state) => state.setAutomation);
  if (!result) return <div className="empty-state"><Swords /><strong>尚无战斗记录</strong></div>;
  const powerRatio = (result.playerPower || 0) / Math.max(1, result.enemyPower || 1);
  const verdict = powerRatio >= 1.15 ? "战力占优" : powerRatio >= 0.88 ? "势均力敌" : "越战挑战";
  const report = summarizeBattle(result);
  const plan = BUILD_PLANS.find((item) => item.id === (result.buildPlan || save.buildPlan)) || BUILD_PLANS[0];
  const playerRate = result.playerCombat?.[plan.primary] ?? calculatePlayerStats(save)[plan.primary];
  const enemyResist = result.enemyResists?.[plan.primary] ?? 0;
  const effectiveRate = Math.max(0, Math.min(10000, playerRate - enemyResist));
  const primaryTriggers = report.triggers[plan.primary];
  const planState = primaryTriggers > 0 ? "success" : effectiveRate <= 0 ? "blocked" : "waiting";
  const planVerdict = primaryTriggers > 0
    ? `${statNames[plan.primary]}实际触发 ${primaryTriggers} 次，当前流派已参与胜负。`
    : effectiveRate <= 0
      ? `${statNames[plan.primary]}被目标抗性完全抵消，需要调整属性或目标。`
      : `${statNames[plan.primary]}本场未触发，属于本次概率结果。`;
  const sourceMeta: { id: BattleDamageSource; label: string; visible: boolean }[] = [
    { id: "player", label: "角色", visible: true },
    { id: "warSoul", label: result.companions?.warSoul || "战魂", visible: Boolean(result.companions?.warSoul) },
    { id: "beast", label: result.companions?.beast || "魔兽", visible: Boolean(result.companions?.beast) },
    { id: "battlePet", label: result.companions?.battlePet || "战宠", visible: Boolean(result.companions?.battlePet) }
  ];
  const sourceRows = sourceMeta.filter((source) => source.visible || report.damage[source.id] > 0);
  const maximumSourceDamage = Math.max(1, ...sourceRows.map((source) => report.damage[source.id]));
  return <div className="battle-view">
    <BattleCanvas result={result} heroTier={heroAppearanceTier(save)} autoMode={auto} />
    <div className={`battle-power-compare ${powerRatio >= 1.15 ? "advantage" : powerRatio >= 0.88 ? "even" : "danger"}`}><span>我方 {fmt(result.playerPower || 0)}</span><b>{verdict}</b><span>敌方 {fmt(result.enemyPower || 0)}</span></div>
    {result.companions && <div className="battle-companions">{result.companions.warSoul && <span><Sparkles />战魂 · {result.companions.warSoul}</span>}{result.companions.beast && <span><PawPrint />魔兽 · {result.companions.beast}</span>}{result.companions.battlePet && <span><Heart />战宠 · {result.companions.battlePet}</span>}</div>}
    <section className="battle-report" data-testid="battle-report"><header><Activity /><span><strong>本场表现</strong><small>{result.stageLabel ? `试炼 ${result.stageLabel} · ` : ""}{report.rounds} 回合</small></span><b>{fmt(report.totalDamage)} 总伤害</b></header><div className="battle-report-metrics"><span><small>承受伤害</small><b>{fmt(report.damageTaken)}</b></span><span><small>有效治疗</small><b>{fmt(report.healing)}</b></span><span><small>剩余生命</small><b>{fmt(result.playerHp)}</b></span></div><div className="battle-damage-sources">{sourceRows.map((source) => <div key={source.id}><span>{source.label}</span><i><b style={{ width: `${report.damage[source.id] / maximumSourceDamage * 100}%` }} /></i><strong>{fmt(report.damage[source.id])}</strong></div>)}</div><div className="battle-trigger-grid">{(Object.entries(statNames) as [BuildStat, string][]).map(([stat, name]) => <span key={stat} className={report.triggers[stat] > 0 ? "active" : ""}><small>{name}</small><b>{report.triggers[stat]}次</b></span>)}</div><div className={`battle-plan-verdict ${planState}`}><Target /><span><strong>{plan.name} · 有效概率 {(effectiveRate / 100).toFixed(1)}%</strong><small>{planVerdict}</small></span></div></section>
    <div className="battle-actions"><button onClick={challenge}><Swords />继续挑战</button><button className={auto ? "auto-active" : ""} onClick={() => setAutomation({ autoStage: !auto })}>{auto ? <Square /> : <Repeat2 />}{auto ? "停止推关" : "自动推关"}</button></div>
    <details className="battle-detail-log"><summary><Trophy /><span>战斗明细</span><b>我方剩余 {fmt(result.playerHp)}</b></summary><section className="battle-log">{result.events.slice(-30).map((event) => <div key={event.id} className={event.type}><i>R{event.round}</i><span>{event.text}</span></div>)}</section></details>
  </div>;
}
