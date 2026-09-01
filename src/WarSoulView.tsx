import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowLeft, BookOpen, Check, CircleHelp, Coins, Crown, Gem, Layers3, LockKeyhole,
  Minus, PackageOpen, Plus, RotateCcw, ShieldCheck, Sparkles, Star, Swords, Trash2,
  UnlockKeyhole, WandSparkles, Zap
} from "lucide-react";
import { COMBAT_STAT_META, WAR_SOULS, WAR_SOUL_QUALITIES } from "./config";
import {
  calculatePlayerStats, calculatePower, powerContributionLosses,
  WAR_SOUL_STAGE_THRESHOLDS, warSoulComposeRate, warSoulMaterialCount, warSoulRefineCost,
  warSoulRefineSlotCap, warSoulReplacementMaterialCount, warSoulUpgradeCost
} from "./engine";
import { useGameStore } from "./store";
import { AtlasArt, fmt, ResourcePill } from "./ui";
import type { GrowthAffix, GrowthStat, WarSoulRefineEntry } from "./types";

type SoulTab = "soul" | "refine" | "compose" | "codex";

const tabItems = [
  { id: "soul" as const, label: "战魂", icon: Swords },
  { id: "refine" as const, label: "精炼", icon: WandSparkles },
  { id: "compose" as const, label: "合成", icon: Layers3 },
  { id: "codex" as const, label: "图鉴", icon: BookOpen }
];

const packData = {
  68: { tier: 2, name: "紫色战魂自选礼包", diamond: 680, core: 20, limit: 5 },
  198: { tier: 3, name: "金色战魂自选礼包", diamond: 1980, core: 50, limit: 5 },
  648: { tier: 4, name: "橙色战魂自选礼包", diamond: 6480, core: 100, limit: 30 }
} as const;

const starMeta = [
  { name: "", color: "#777" },
  { name: "白色", color: "#d9d6cf" },
  { name: "绿色", color: "#62bd68" },
  { name: "蓝色", color: "#4ca8dd" },
  { name: "紫色", color: "#a363dc" },
  { name: "黄色", color: "#e2bf43" },
  { name: "橙色", color: "#eb8b36" },
  { name: "红色", color: "#e44e4c" },
  { name: "铂金/彩色", color: "#52d8ce" }
];

function affixValue(affix: GrowthAffix) {
  return affix.percent ? `${(affix.value / 100).toFixed(2)}%` : fmt(affix.value);
}

function skillNames(name: string, tier: number) {
  if (name === "青龙") return ["神罚天雷", "雷灵", "神威", "龙之传承"];
  if (name === "朱雀") return ["圣焰", "业火", "重燃", "离火"];
  if (name === "乌云") return ["野蛮之击", "利爪", "迅捷"];
  return Array.from({ length: tier >= 6 ? 4 : 3 }, (_, index) => index === 0 ? `${name}战魂技` : `战斗技能 ${index + 1}`);
}

function nextStage(stage: number) {
  return Math.min(WAR_SOUL_STAGE_THRESHOLDS.length - 1, stage + 1);
}

function StageMeter({ entries, power, stage, slots }: { entries: WarSoulRefineEntry[]; power: number; stage: number; slots: number }) {
  const targetStage = nextStage(stage);
  const lower = WAR_SOUL_STAGE_THRESHOLDS[stage] || 0;
  const upper = WAR_SOUL_STAGE_THRESHOLDS[targetStage] || lower;
  const progress = stage >= WAR_SOUL_STAGE_THRESHOLDS.length - 1 ? 100 : Math.max(0, Math.min(100, (power - lower) / Math.max(1, upper - lower) * 100));
  return <section className="soul-stage-meter">
    <div><b>{stage}阶</b><span>{stage >= WAR_SOUL_STAGE_THRESHOLDS.length - 1 ? "已满阶" : `${power - lower}/${upper - lower}`}</span><b>{targetStage}阶</b></div>
    <p><i style={{ width: `${progress}%` }} /></p>
    <div className="soul-star-line">{Array.from({ length: slots }, (_, index) => {
      const entry = entries[index];
      return <Star key={entry?.id || index} style={{ "--star-color": entry ? starMeta[entry.starGrade].color : "#847a69" } as CSSProperties} className={entry ? "filled" : "empty"} />;
    })}</div>
  </section>;
}

export function WarSoulView({ openProbability, initialAcquiring = false }: { openProbability: () => void; initialAcquiring?: boolean }) {
  const save = useGameStore((store) => store.save);
  const deploy = useGameStore((store) => store.deploy);
  const buyPack = useGameStore((store) => store.buyWarSoulPack);
  const upgrade = useGameStore((store) => store.upgradeWarSoul);
  const refine = useGameStore((store) => store.rollSoulRefine);
  const toggleLock = useGameStore((store) => store.toggleSoulRefineLock);
  const rollback = useGameStore((store) => store.rollbackSoulAffix);
  const rollbackUnlocked = useGameStore((store) => store.rollbackUnlockedSoulRefines);
  const compose = useGameStore((store) => store.composeWarSoul);
  const replace = useGameStore((store) => store.replaceWarSoul);
  const firstOwned = WAR_SOULS.find((item) => save.collections.warSouls[item.id]?.count)?.id || WAR_SOULS[0].id;
  const [tab, setTab] = useState<SoulTab>("soul");
  const [selected, setSelected] = useState(save.collections.deployedWarSoul || firstOwned);
  const [acquiring, setAcquiring] = useState(initialAcquiring);
  const [packAmount, setPackAmount] = useState<keyof typeof packData>(68);
  const [packSoul, setPackSoul] = useState(WAR_SOULS.find((item) => item.tier === 2)?.id || "soul-3");
  const [subCount, setSubCount] = useState(1);

  const active = WAR_SOULS.find((item) => item.id === selected) || WAR_SOULS[0];
  const activeIndex = WAR_SOULS.findIndex((item) => item.id === active.id);
  const inventoryState = save.collections.warSouls[active.id];
  const state = inventoryState?.count ? inventoryState : undefined;
  const quality = WAR_SOUL_QUALITIES[active.tier - 1];
  const ownedSouls = WAR_SOULS.filter((item) => save.collections.warSouls[item.id]?.count);
  const availableSubCount = warSoulMaterialCount(save, active.id);
  const replacementCount = warSoulReplacementMaterialCount(save, active.id);
  const refineSlotCap = warSoulRefineSlotCap(active.tier);
  const refineCost = state ? warSoulRefineCost(active.tier, state.refineEntries.length) : null;
  const levelCost = state ? warSoulUpgradeCost(state.level, active.tier) : null;
  const totalPower = useMemo(() => calculatePower(calculatePlayerStats(save)), [save]);
  const soulPower = useMemo(() => powerContributionLosses(save).find((item) => item.name === "战魂")?.value || 0, [save]);
  const discoveredCount = Object.keys(save.collections.warSouls).length;
  const materials = WAR_SOULS.filter((item) => item.tier === active.tier).flatMap((item) => {
    const amount = save.collections.warSouls[item.id]?.count || 0;
    const reserved = item.id === active.id || save.collections.deployedWarSoul === item.id ? 1 : 0;
    return Array.from({ length: Math.max(0, amount - reserved) }, () => item);
  });
  const refineTotals = useMemo(() => {
    const totals = new Map<GrowthStat, { name: string; value: number; percent: boolean }>();
    state?.refineAttributes.forEach((affix) => {
      const current = totals.get(affix.stat) || { name: affix.name, value: 0, percent: affix.percent };
      current.value += affix.value;
      totals.set(affix.stat, current);
    });
    return [...totals.values()];
  }, [state?.refineAttributes]);

  useEffect(() => {
    if ((tab === "refine" || tab === "compose") && !save.collections.warSouls[selected]?.count) setSelected(firstOwned);
  }, [firstOwned, save.collections.warSouls, selected, tab]);
  useEffect(() => {
    document.querySelector<HTMLElement>(".overlay-body")?.scrollTo({ top: 0 });
  }, [acquiring, tab]);

  const switchPack = (amount: keyof typeof packData) => {
    setPackAmount(amount);
    setPackSoul(WAR_SOULS.find((item) => item.tier === packData[amount].tier)?.id || "soul-3");
  };

  const changeTab = (next: SoulTab) => {
    setAcquiring(false);
    setTab(next);
  };

  return <div className="war-soul-view war-soul-v2">
    <div className="soul-resource-bar">
      <ResourcePill id="gold" value={save.resources.gold} />
      <ResourcePill id="soulCore" value={save.resources.soulCore} />
      <ResourcePill id="diamond" value={save.resources.diamond} />
      <div className="soul-power"><Swords /><span>战魂战力</span><strong>{fmt(soulPower)}</strong></div>
    </div>

    {tab !== "codex" && !acquiring && <div className="soul-roster" aria-label="已拥有战魂">
      {ownedSouls.length ? ownedSouls.map((item) => {
        const index = WAR_SOULS.findIndex((entry) => entry.id === item.id);
        const amount = save.collections.warSouls[item.id].count;
        return <button key={item.id} className={selected === item.id ? "selected" : ""} onClick={() => setSelected(item.id)} style={{ "--soul-color": item.accent } as CSSProperties}>
          <AtlasArt kind="warSoul" index={index} /><span>{item.name}</span><i>×{amount}</i>
        </button>;
      }) : <button className="empty-soul-entry" onClick={() => setAcquiring(true)}><Plus /><span>获取首个战魂</span></button>}
    </div>}

    {tab === "soul" && (acquiring ? <SoulAcquisition amount={packAmount} soulId={packSoul} onBack={() => setAcquiring(false)} onAmount={switchPack} onSoul={setPackSoul} onBuy={() => { buyPack(packSoul, packAmount); setSelected(packSoul); }} /> : <section className="soul-detail-v2" style={{ "--soul-color": active.accent } as CSSProperties}>
      <div className="soul-scene">
        <button className="soul-help" onClick={openProbability} title="战魂规则"><CircleHelp /></button>
        <button className="soul-acquire-shortcut" onClick={() => setAcquiring(true)}><PackageOpen />获取战魂</button>
        <div className="soul-scene-art"><AtlasArt kind="warSoul" index={activeIndex} /></div>
        <div className="soul-nameplate"><span>{quality.name}</span><h3>{active.name}</h3><b>{state ? `${state.stage}阶 · Lv.${state.level}` : "尚未获得"}</b></div>
      </div>
      <StageMeter entries={state?.refineEntries || []} power={state?.refine || 0} stage={state?.stage || 1} slots={refineSlotCap} />
      <div className="soul-detail-columns">
        <section className="soul-skill-list"><h4>战斗技能</h4>{skillNames(active.name, active.tier).map((name, index) => {
          const unlocked = Boolean(state && state.stage >= [1, 2, 4, 6][index]);
          return <article className={unlocked ? "unlocked" : "locked"} key={name}><i>{index + 1}</i><span><strong>{name}</strong><small>{unlocked ? index === 0 ? active.skill : "随战魂品阶强化" : `${[1, 2, 4, 6][index]}阶解锁`}</small></span></article>;
        })}</section>
        <section className="soul-attribute-list"><h4>属性加成</h4><div><span>生命</span><b>+{active.baseBonusPct?.hp ?? 5 + active.tier * 5}%</b></div><div><span>攻击</span><b>+{active.baseBonusPct?.attack ?? 1 + active.tier * 1.5}%</b></div><div><span>防御</span><b>+{active.baseBonusPct?.defense ?? 1 + active.tier * 1.5}%</b></div><h4>精炼属性</h4>{refineTotals.length ? refineTotals.slice(0, 7).map((entry) => <div key={entry.name}><span>{entry.name}</span><b>+{entry.percent ? `${(entry.value / 100).toFixed(2)}%` : fmt(entry.value)}</b></div>) : <p>精炼后获得固定生命和随机副属性</p>}</section>
      </div>
      <div className="soul-v2-actions">
        <button disabled={!state} onClick={() => upgrade(active.id, 1)}><Plus />升级 1 次</button>
        <button disabled={!state} onClick={() => upgrade(active.id, 10)}><Zap />连续升 10</button>
        <button className="primary" disabled={!state || save.collections.deployedWarSoul === active.id} onClick={() => deploy("warSouls", active.id)}><ShieldCheck />{save.collections.deployedWarSoul === active.id ? "已出战" : "设为出战"}</button>
      </div>
      {state && levelCost && <div className="soul-next-cost"><span>下一级指数消耗</span><b><Coins />{fmt(levelCost.gold)}</b><b><Sparkles />{levelCost.soulCore}</b><em>主人总战力 {fmt(totalPower)}</em></div>}
    </section>)}

    {tab === "refine" && state && <section className="soul-refine-v2">
      <header className="refine-summary-v2"><AtlasArt kind="warSoul" index={activeIndex} /><span><i>{active.name} · {quality.name}</i><strong>{state.stage}阶 · 魂力 {state.refine}</strong><small>幸运值 {state.luck} · {state.refineEntries.length}/{refineSlotCap} 已精炼</small></span><button onClick={openProbability}><CircleHelp />概率</button></header>
      <StageMeter entries={state.refineEntries} power={state.refine} stage={state.stage} slots={refineSlotCap} />
      <div className="refine-slot-grid">{Array.from({ length: refineSlotCap }, (_, index) => {
        const entry = state.refineEntries[index];
        return entry ? <RefineCard key={entry.id} entry={entry} index={index} full={state.refineEntries.length >= refineSlotCap} onLock={() => toggleLock(active.id, entry.id)} onRollback={() => rollback(active.id, entry.id)} /> : <div className="refine-empty-slot" key={`empty-${index}`}><Star /><strong>精炼位 {index + 1}</strong><small>等待精炼</small></div>;
      })}</div>
      <div className="refine-controls-v2">
        {state.refineEntries.length < refineSlotCap ? <>
          <div><span>下一次消耗</span><b><Coins />{fmt(refineCost?.gold || 0)}</b></div>
          <button onClick={() => refine(active.id, 1)}><WandSparkles />精炼 1 次</button>
          <button className="primary" onClick={() => refine(active.id, 10)}><Zap />一键填满</button>
        </> : <><p>锁定要保留的高星属性，再回退其余槽位重新精炼。</p><button className="primary" onClick={() => rollbackUnlocked(active.id)}><RotateCcw />一键回退未锁定</button></>}
      </div>
    </section>}

    {tab === "compose" && state && <section className="soul-compose-v2">
      <header><span><strong>战魂合成</strong><small>主魂保留精炼数值与幸运值</small></span><button onClick={openProbability}><CircleHelp />规则</button></header>
      <div className="soul-compose-orbit">
        <div className="compose-main-soul"><AtlasArt kind="warSoul" index={activeIndex} /><span>主战魂</span><strong>{active.name}</strong></div>
        {Array.from({ length: 4 }, (_, index) => {
          const material = index < subCount ? materials[index] : undefined;
          return <i key={index} className={`${index < subCount ? "required" : ""} ${material ? "filled" : ""}`}>{material ? <AtlasArt kind="warSoul" index={WAR_SOULS.findIndex((item) => item.id === material.id)} /> : <Plus />}<small>{material?.name || (index < subCount ? "缺少" : "副位")}</small></i>;
        })}
        <div className="compose-rate-ring"><strong>{warSoulComposeRate(subCount) / 100}%</strong><span>成功率</span></div>
      </div>
      <div className="compose-material-bar"><span>同品质副魂 <b>{availableSubCount}</b></span><button onClick={() => setSubCount(Math.max(1, Math.min(4, availableSubCount)))}><Check />一键放入</button><div className="stepper"><button aria-label="减少副战魂" onClick={() => setSubCount((value) => Math.max(1, value - 1))}><Minus /></button><strong>{subCount}</strong><button aria-label="增加副战魂" onClick={() => setSubCount((value) => Math.min(4, value + 1))}><Plus /></button></div></div>
      <section className="compose-target-preview"><span>成功后随机获得</span><div>{WAR_SOULS.filter((item) => item.tier === active.tier + 1).map((item) => <i key={item.id}><AtlasArt kind="warSoul" index={WAR_SOULS.findIndex((entry) => entry.id === item.id)} /><b>{item.name}</b></i>)}</div><small>主魂加 4 个同品质副魂共 5 个，成功率 100%；成功候选等概率。</small></section>
      <button className="compose-submit primary" disabled={active.tier >= WAR_SOUL_QUALITIES.length || availableSubCount < subCount} onClick={() => compose(active.id, subCount)}><Layers3 />{active.tier >= WAR_SOUL_QUALITIES.length ? "已达最高品质" : `合成 · ${warSoulComposeRate(subCount) / 100}%`}</button>
      {availableSubCount < subCount && <button className="material-shortcut" onClick={() => { setTab("soul"); setAcquiring(true); }}>副魂不足，前往自选礼包</button>}
      {active.tier >= 5 && <section className="soul-replace-panel"><div><RotateCcw /><span><strong>同品质置换</strong><small>保持当前等级、精炼与幸运值，随机变为其他同品质战魂</small></span></div><p>低一品质战魂 <b>{replacementCount}/1</b></p><button disabled={replacementCount < 1} onClick={() => replace(active.id)}>置换</button></section>}
    </section>}

    {tab === "codex" && <section className="soul-codex-v2">
      <section className={`soul-codex-milestone ${discoveredCount >= 6 ? "unlocked" : ""}`}><Crown /><span><strong>图鉴加成 · 解锁 6 战魂</strong><small>吸血、反击、连击、闪避、暴击、击晕各 +1%</small></span><b>{Math.min(6, discoveredCount)}/6</b></section>
      {WAR_SOUL_QUALITIES.map((entry) => <div className="soul-codex-group" key={entry.tier}><header><i style={{ background: entry.color }} /><strong>{entry.name}</strong><span>{WAR_SOULS.filter((item) => item.tier === entry.tier && save.collections.warSouls[item.id]).length}/{WAR_SOULS.filter((item) => item.tier === entry.tier).length}</span></header><div>{WAR_SOULS.filter((item) => item.tier === entry.tier).map((item) => {
        const index = WAR_SOULS.findIndex((candidate) => candidate.id === item.id);
        const discovered = Boolean(save.collections.warSouls[item.id]);
        return <button key={item.id} className={discovered ? "owned" : "locked"} style={{ "--soul-color": item.accent } as CSSProperties} onClick={() => { setSelected(item.id); setTab("soul"); }}><AtlasArt kind="warSoul" index={index} /><strong>{item.name}</strong><small>{discovered ? `图鉴已解锁${save.collections.warSouls[item.id].count ? ` · ×${save.collections.warSouls[item.id].count}` : ""}` : "未获得"}</small></button>;
      })}</div></div>)}
    </section>}

    <nav className="soul-bottom-tabs">{tabItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => changeTab(item.id)}><Icon /><span>{item.label}</span></button>; })}</nav>
  </div>;
}

function RefineCard({ entry, index, full, onLock, onRollback }: { entry: WarSoulRefineEntry; index: number; full: boolean; onLock: () => void; onRollback: () => void }) {
  const meta = starMeta[entry.starGrade];
  return <article className="refine-card-v2" style={{ "--refine-color": meta.color } as CSSProperties}>
    <header><Star /><strong>{meta.name}</strong><b>魂力 +{entry.soulPower}</b></header>
    {entry.attributes.map((affix) => <div key={affix.id}><span>{affix.name}</span><b>+{affixValue(affix)}</b></div>)}
    <footer><button title={entry.locked ? `解锁第 ${index + 1} 组精炼` : `锁定第 ${index + 1} 组精炼`} onClick={onLock}>{entry.locked ? <LockKeyhole /> : <UnlockKeyhole />}{entry.locked ? "已锁" : "锁定"}</button><button disabled={!full || entry.locked} title={`回退第 ${index + 1} 组精炼`} onClick={onRollback}><Trash2 />回退</button></footer>
  </article>;
}

function SoulAcquisition({ amount, soulId, onBack, onAmount, onSoul, onBuy }: {
  amount: keyof typeof packData;
  soulId: string;
  onBack: () => void;
  onAmount: (amount: keyof typeof packData) => void;
  onSoul: (id: string) => void;
  onBuy: () => void;
}) {
  const save = useGameStore((store) => store.save);
  const pack = packData[amount];
  const purchased = save.commerce.day === save.day ? save.commerce.packagePurchases[`daily-${amount}`] || 0 : 0;
  const choices = WAR_SOULS.filter((item) => item.tier === pack.tier);
  return <section className="soul-acquisition-v2">
    <header><button title="返回战魂" onClick={onBack}><ArrowLeft /></button><span><strong>日常礼包</strong><small>自选战魂与养成资源</small></span><b>刷新 19:59:58</b></header>
    <div className="soul-pack-banner"><PackageOpen /><span><strong>{pack.name}</strong><small>今日限购 {purchased}/{pack.limit}</small></span></div>
    <div className="pack-segmented">{([68, 198, 648] as const).map((value) => <button key={value} className={amount === value ? "active" : ""} onClick={() => onAmount(value)}>¥{value}</button>)}</div>
    <div className="pack-soul-choices">{choices.map((item) => <button key={item.id} className={soulId === item.id ? "selected" : ""} onClick={() => onSoul(item.id)} style={{ "--soul-color": item.accent } as CSSProperties}><AtlasArt kind="warSoul" index={WAR_SOULS.findIndex((entry) => entry.id === item.id)} /><span>{item.name}</span>{soulId === item.id && <Check />}</button>)}</div>
    <div className="pack-rewards"><span><Gem />钻石<b>×{pack.diamond}</b></span><span><Sparkles />魂核<b>×{pack.core}</b></span><span><Crown />自选战魂<b>×1</b></span></div>
    <button className="primary pack-buy" disabled={purchased >= pack.limit} onClick={onBuy}><Gem />{purchased >= pack.limit ? "今日已达限购" : `免费模拟 ¥${amount}`}</button>
  </section>;
}
