import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Anvil, Archive, ArrowUp, Beef, Bird, Check, ChevronRight, Coins, Dices, Feather, Flag, Gem,
  Hammer, Info, KeyRound, LockKeyhole, Map, PackageOpen, RefreshCw, Shield,
  Sparkles, Swords, Target, Trophy, WandSparkles, Zap
} from "lucide-react";
import {
  ARTIFACTS, GEM_BASE_VALUES, GEM_COLORS, MOUNTS, MOUNT_DRAW_RATES,
  MOUNT_QUALITIES, RESOURCE_META, RUNES, RUNE_DRAW_ITEMS, TURNTABLE_POOLS, WAR_EAGLE_SKINS
} from "./config";
import {
  ARTIFACT_MAX_LEVEL, artifactForgeCost, artifactForgeWeights, artifactMaterialCount, battleFlagRequiredExp, battleFlagSuccessRate,
  gemKey, mountUpgradeCost, runeMaterialCount, runeUpgradeCost, warEagleStatValue, warEagleUpgradeCost
} from "./engine";
import { useGameStore } from "./store";
import { AtlasArt, fmt, ResourcePill } from "./ui";
import type { BuildStat, GemColor, ResourceId } from "./types";

const buildStatNames: Record<BuildStat, string> = {
  crit: "暴击", dodge: "闪避", combo: "连击", lifesteal: "吸血", stun: "击晕", counter: "反击"
};

const territoryArtByReward: Partial<Record<ResourceId, number>> = {
  chestTicket: 4, food: 5, steak: 6, mountWhip: 7, gold: 8,
  runeShard: 9, gemTicket: 10, artifactOre: 11, flagEssence: 12
};

function territoryArtIndex(reward: Partial<Record<ResourceId, number>>) {
  const resource = Object.keys(reward)[0] as ResourceId | undefined;
  return resource ? territoryArtByReward[resource] ?? 13 : 13;
}

function SystemResourceBar({ ids }: { ids: ResourceId[] }) {
  const resources = useGameStore((state) => state.save.resources);
  return <div className="system-resource-bar">{ids.map((id) => <ResourcePill key={id} id={id} value={resources[id]} label />)}</div>;
}

function RuleLine({ children }: { children: ReactNode }) {
  return <div className="rule-line"><Info size={13} /><span>{children}</span></div>;
}

export function MountView() {
  const save = useGameStore((state) => state.save);
  const draw = useGameStore((state) => state.drawMount);
  const select = useGameStore((state) => state.selectMount);
  const upgrade = useGameStore((state) => state.upgradeMount);
  const recycle = useGameStore((state) => state.recycleDuplicateMounts);
  const stable = save.growthSystems.mount;
  const duplicateCount = stable.mounts.length - new Set(stable.mounts.map((mount) => mount.definitionId)).size;
  const [selectedId, setSelectedId] = useState(stable.activeId || stable.mounts.at(-1)?.id || "");
  const selected = stable.mounts.find((item) => item.id === selectedId) || stable.mounts.find((item) => item.id === stable.activeId) || stable.mounts.at(-1);
  const definition = selected ? MOUNTS.find((item) => item.id === selected.definitionId) : undefined;
  const cost = selected ? mountUpgradeCost(selected.level, selected.quality) : null;
  const highRate = MOUNT_DRAW_RATES.advanced;
  return <div className="growth-view mount-view">
    <section className="mount-scene">
      <AtlasArt kind="system" index={definition?.art ?? 0} className="system-scene-art" />
      <div><span>坐骑马厩</span><h2>{definition?.name || "尚未获得坐骑"}</h2><p>{selected ? `${MOUNT_QUALITIES[selected.quality - 1].name} · Lv.${selected.level} · ${definition?.mainName}主属性` : "普通刷新每日首抽免费，高级刷新使用驯兽鞭。"}</p></div>
      {selected && <b style={{ "--quality": MOUNT_QUALITIES[selected.quality - 1].color } as CSSProperties}>{stable.activeId === selected.id ? "出战中" : "待命"}</b>}
    </section>
    <SystemResourceBar ids={["gold", "mountWhip", "food", "steak"]} />
    <section className="mount-draw-panel">
      <header><div><strong>坐骑刷新</strong><small>单机保底：50 次未出稀有，下次至少稀有</small></div><span>保底 {stable.pity}/50</span></header>
      <div className="draw-rate-grid">
        {MOUNT_QUALITIES.slice(0, 4).map((quality, index) => <div key={quality.tier} style={{ color: quality.color }}><strong>{quality.name}</strong><small>普通 {(MOUNT_DRAW_RATES.normal[index] / 100).toFixed(1)}%</small><small>高级 {(highRate[index] / 100).toFixed(1)}%</small></div>)}
      </div>
      <div className="system-action-grid four"><button onClick={() => draw("normal", 1)}><Coins />普通刷新<small>{stable.freeRefreshDay === save.day ? "5,000" : "今日免费"}</small></button><button onClick={() => draw("normal", 10)}><Coins />普通十连<small>50,000</small></button><button className="primary" onClick={() => draw("advanced", 1)}><Zap />高级刷新<small>驯兽鞭 1</small></button><button className="primary" onClick={() => draw("advanced", 10)}><Zap />高级十连<small>驯兽鞭 10</small></button></div>
      {stable.lastDraw.length > 0 && <div className="result-chips">{stable.lastDraw.map((name, index) => <span key={`${name}-${index}`}>{name}</span>)}</div>}
    </section>
    <section className="mount-recycle"><Archive /><div><strong>重复坐骑 ×{duplicateCount}</strong><small>每种保留出战或培养最优的一只，其余转为培养与刷新材料</small></div><button disabled={!duplicateCount} onClick={recycle}>一键遣散</button></section>
    <section className="stable-roster">
      <header><strong>马厩 {stable.mounts.length}/80</strong><span>点击坐骑查看培养</span></header>
      <div>{stable.mounts.length ? [...stable.mounts].reverse().map((mount) => { const item = MOUNTS.find((entry) => entry.id === mount.definitionId)!; return <button key={mount.id} className={`${mount.id === selected?.id ? "selected" : ""} ${mount.id === stable.activeId ? "active" : ""}`} onClick={() => setSelectedId(mount.id)} style={{ "--quality": MOUNT_QUALITIES[mount.quality - 1].color } as CSSProperties}><AtlasArt kind="system" index={item.art} /><strong>{item.name}</strong><small>Lv.{mount.level}</small>{mount.id === stable.activeId && <i>出战</i>}</button>; }) : <div className="inline-empty"><Archive />刷新后获得第一只坐骑</div>}</div>
    </section>
    {selected && definition && cost && <section className="mount-training">
      <header><AtlasArt kind="system" index={definition.art} /><div><strong>{definition.name} · Lv.{selected.level}</strong><small>主属性升级出现率 66.67% · 其他属性 33.33%</small></div></header>
      <div className="affix-ledger">{selected.attributes.map((affix) => <span key={affix.stat}><b>{affix.name}</b><strong>+{(affix.value / 100).toFixed(2)}%</strong></span>)}</div>
      {!selected.attributes.length && <RuleLine>首次升级会生成第一条坐骑属性。</RuleLine>}
      <div className="upgrade-cost"><span>下次消耗</span><b>食物 {cost.food}</b><b>肉排 {cost.steak}</b><b>金币 {fmt(cost.gold)}</b></div>
      <div className="system-action-grid three"><button onClick={() => select(selected.id)} disabled={stable.activeId === selected.id}><Check />{stable.activeId === selected.id ? "已出战" : "设为出战"}</button><button onClick={() => upgrade(selected.id, 1)}><ArrowUp />升级 1 次</button><button className="primary" onClick={() => upgrade(selected.id, 10)}><ArrowUp />连续升级 10 次</button></div>
    </section>}
  </div>;
}

export function WarEagleView() {
  const save = useGameStore((state) => state.save);
  const select = useGameStore((state) => state.selectWarEagleSkin);
  const upgrade = useGameStore((state) => state.upgradeWarEagle);
  const state = save.growthSystems.warEagle;
  const active = WAR_EAGLE_SKINS.find((skin) => skin.id === state.activeSkin) || WAR_EAGLE_SKINS[0];
  const level = state.levels[active.id] || 1;
  const cost = warEagleUpgradeCost(level);
  const primary = warEagleStatValue(level);
  return <div className="growth-view war-eagle-view">
    <section className="war-eagle-hero" style={{ "--eagle-accent": active.accent } as CSSProperties}>
      <AtlasArt kind="warEagle" index={active.art} />
      <div><span>原作 Lv.75 开启 · 单机档开放体验</span><h2>战鹰 · {active.name}</h2><p>切换皮肤改变双属性方向，未出战皮肤不会叠加，避免无脑堆满全部流派。</p></div>
      <b>Lv.{level}/80</b>
    </section>
    <SystemResourceBar ids={["eagleFeather", "gold", "diamond"]} />
    <section className="war-eagle-skins">
      <header><div><strong>战鹰皮肤</strong><small>已解锁 {state.unlockedSkins.length}/{WAR_EAGLE_SKINS.length} · 点击即切换</small></div><Bird /></header>
      <div>{WAR_EAGLE_SKINS.map((skin) => {
        const unlocked = state.unlockedSkins.includes(skin.id);
        const selected = state.activeSkin === skin.id;
        const skinLevel = state.levels[skin.id] || 1;
        return <button key={skin.id} className={`${selected ? "active" : ""} ${unlocked ? "unlocked" : "locked"}`} onClick={() => select(skin.id)} style={{ "--eagle-accent": skin.accent } as CSSProperties}>
          <AtlasArt kind="warEagle" index={skin.art} />
          <span><strong>{skin.name}</strong><small>{buildStatNames[skin.primary]} + {buildStatNames[skin.secondary]}</small></span>
          <b>{unlocked ? selected ? "出战中" : `Lv.${skinLevel}` : "300钻石"}</b>
        </button>;
      })}</div>
    </section>
    <section className="war-eagle-training">
      <header><Feather /><span><strong>{active.name}培养</strong><small>史诗及以上装备出售、自动分解时获得鹰羽</small></span><b>鹰羽 {cost.feathers} · 金币 {fmt(cost.gold)}</b></header>
      <div className="war-eagle-stat-line"><span>{buildStatNames[active.primary]} <b>+{(primary / 100).toFixed(2)}%</b></span><span>{buildStatNames[active.secondary]} <b>+{(primary * .65 / 100).toFixed(2)}%</b></span></div>
      <div className="system-action-grid two"><button disabled={level >= 80} onClick={() => upgrade(1)}><ArrowUp />培养 1 次</button><button className="primary" disabled={level >= 80} onClick={() => upgrade(10)}><ArrowUp />连续培养 10 次</button></div>
      <RuleLine>史诗、传说、完美及以上装备分别按品质返还递增鹰羽；普通装备仍只提供金币和人物经验。</RuleLine>
    </section>
  </div>;
}

export function RuneView() {
  const save = useGameStore((state) => state.save);
  const draw = useGameStore((state) => state.drawRunes);
  const equip = useGameStore((state) => state.equipRune);
  const upgrade = useGameStore((state) => state.upgradeRune);
  const runes = save.growthSystems.runes;
  const [panel, setPanel] = useState<"equip" | "draw">("equip");
  const [selectedId, setSelectedId] = useState(runes.equipped[0] || RUNES.find((rune) => runes.inventory[rune.id])?.id || RUNES[0].id);
  const selected = RUNES.find((rune) => rune.id === selectedId) || RUNES[0];
  const level = runes.levels[selected.id] || 1;
  const amount = runes.inventory[selected.id] || 0;
  const cost = runeUpgradeCost(level);
  const materials = runeMaterialCount(save, selected.id);
  const equipped = runes.equipped.includes(selected.id);
  const currentValue = Math.round(selected.base * Math.pow(1.16, level - 1));
  const nextValue = Math.round(selected.base * Math.pow(1.16, level));
  const runeStatName: Record<string, string> = {
    hp: "生命", attack: "攻击", defense: "防御", speed: "速度", lifesteal: "吸血", counter: "反击",
    combo: "连击", dodge: "闪避", tenacity: "坚毅", recovery: "恢复", damageReduction: "最终减伤",
    crit: "暴击", stun: "击晕", damageBonus: "最终增伤"
  };
  const displayRuneValue = (value: number) => ["hp", "attack", "defense", "speed"].includes(selected.stat) ? fmt(value) : `${(value / 100).toFixed(2)}%`;
  return <div className="growth-view rune-view">
    <header className="rune-workshop-head"><div><WandSparkles /><span><small>Lv.40</small><h2>符文</h2></span></div><SystemResourceBar ids={["runeShard", "wildRune"]} /></header>
    <div className="rune-workshop-stage">
      {panel === "equip" && <>
        <section className="rune-altar"><header><span>出战符文</span><strong>{runes.equipped.length}/3</strong></header><div className="rune-slot-orbit">{Array.from({ length: 3 }, (_, index) => { const id = runes.equipped[index]; const rune = RUNES.find((item) => item.id === id); return <button key={index} className={`${rune ? "filled" : "empty"} slot-${index + 1}`} aria-label={rune ? `查看${rune.name}` : `符文空槽${index + 1}`} onClick={() => rune ? setSelectedId(rune.id) : amount && equip(selected.id)}>{rune ? <><AtlasArt kind="rune" index={rune.art} /><strong>{rune.name}</strong><small>Lv.{runes.levels[id] || 1}</small></> : <><LockKeyhole /><small>空位</small></>}</button>; })}<div className="rune-altar-core"><AtlasArt kind="rune" index={selected.art} /><span>{selected.name}</span></div></div></section>
        <section className="rune-cabinet"><header><strong>符文背包</strong><span>已解锁 {RUNES.filter((rune) => runes.inventory[rune.id]).length}/{RUNES.length}</span></header><div className="rune-list">{RUNES.map((rune) => { const runeAmount = runes.inventory[rune.id] || 0; const runeLevel = runes.levels[rune.id] || 1; const isEquipped = runes.equipped.includes(rune.id); return <article key={rune.id} className={`tier-${rune.tier} ${selected.id === rune.id ? "selected" : ""} ${runeAmount ? "owned" : "locked"}`}><button onClick={() => setSelectedId(rune.id)}><AtlasArt kind="rune" index={rune.art} /><strong>{rune.name}</strong><small>{runeAmount ? `Lv.${runeLevel} · ×${runeAmount}` : "未获得"}</small>{isEquipped && <i>出战</i>}</button></article>; })}</div></section>
        <section className={`rune-detail-sheet tier-${selected.tier}`}><AtlasArt kind="rune" index={selected.art} /><div><span>{selected.quality} · {runeStatName[selected.stat]}</span><strong>{selected.name} · Lv.{level}</strong><p>{selected.effect}</p><div><b>当前 {displayRuneValue(currentValue)}</b><ChevronRight /><b>下级 {level >= 20 ? "已满" : displayRuneValue(nextValue)}</b></div><small>同级素材 {materials}/{cost.copies} · 符文碎片 {save.resources.runeShard}/{cost.shards}</small></div><div><button disabled={!amount} className={equipped ? "active" : ""} onClick={() => equip(selected.id)}>{equipped ? "卸下" : "装配"}</button><button className="primary" disabled={!amount || level >= 20} onClick={() => upgrade(selected.id)}>升级</button></div></section>
      </>}
      {panel === "draw" && <section className="rune-prayer-page"><div className="rune-prayer-scene"><div className="rune-prayer-ring">{RUNE_DRAW_ITEMS.map((item, index) => <span key={item.id} style={{ "--index": index } as CSSProperties}><b>{item.name}</b><small>{(item.rate / 100).toFixed(2)}%</small></span>)}</div><AtlasArt kind="rune" index={8} /><strong>符文祈愿</strong><small>符文碎片 {fmt(save.resources.runeShard)}</small></div><div className="rune-draw"><div className="rune-orbit">{RUNE_DRAW_ITEMS.map((item) => <span key={item.id}><b>{item.name}</b><small>{(item.rate / 100).toFixed(2)}%</small></span>)}</div><div className="system-action-grid two"><button onClick={() => draw(1)}><WandSparkles />抽取 1 次<small>碎片 10</small></button><button className="primary" onClick={() => draw(10)}><WandSparkles />抽取 10 次<small>碎片 100</small></button></div>{runes.lastDraw.length > 0 && <div className="result-chips">{runes.lastDraw.map((name, index) => <span key={`${name}-${index}`}>{name}</span>)}</div>}</div></section>}
    </div>
    <nav className="rune-workshop-nav"><button className={panel === "equip" ? "active" : ""} onClick={() => setPanel("equip")}><Shield />装配</button><button className={panel === "draw" ? "active" : ""} onClick={() => setPanel("draw")}><WandSparkles />祈愿</button></nav>
  </div>;
}

export function GemView() {
  const save = useGameStore((state) => state.save);
  const buy = useGameStore((state) => state.buyGems);
  const compose = useGameStore((state) => state.composeGem);
  const exchange = useGameStore((state) => state.exchangeGem);
  const socketGem = useGameStore((state) => state.socketGem);
  const removeGem = useGameStore((state) => state.removeGem);
  const autoSocket = useGameStore((state) => state.autoSocketGems);
  const removeAll = useGameStore((state) => state.removeAllGems);
  const [panel, setPanel] = useState<"socket" | "shop" | "compose" | "exchange">("socket");
  const [level, setLevel] = useState(save.growthSystems.gems.selectedLevel || 1);
  const [target, setTarget] = useState<GemColor>("blue");
  const [source, setSource] = useState<GemColor>("red");
  const [selectedSlot, setSelectedSlot] = useState("blue-0");
  const gems = save.growthSystems.gems;
  const required = level === 6 ? 2 : 3;
  const socketedCounts = Object.values(gems.sockets).reduce<Record<string, number>>((counts, socket) => {
    if (!socket) return counts;
    const key = gemKey(socket.color, socket.level);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const totalAtLevel = GEM_COLORS.reduce((sum, gem) => {
    const key = gemKey(gem.id, level);
    return sum + Math.max(0, (gems.inventory[key] || 0) - (socketedCounts[key] || 0));
  }, 0);
  const selectedSocket = gems.sockets[selectedSlot];
  const selectedLane = selectedSlot.split("-")[0] as GemColor;
  const targetGem = GEM_COLORS.find((gem) => gem.id === target)!;
  const equipped = Object.values(gems.sockets).filter(Boolean);
  const totals = equipped.reduce((result, socket) => {
    if (!socket) return result;
    const gem = GEM_COLORS.find((item) => item.id === socket.color)!;
    result[gem.baseStat as "hp" | "attack" | "defense" | "speed"] += GEM_BASE_VALUES[gem.id][socket.level - 1] || 0;
    return result;
  }, { hp: 0, attack: 0, defense: 0, speed: 0 });
  const chooseLane = (color: GemColor) => {
    const open = Array.from({ length: 5 }, (_, index) => `${color}-${index}`).find((id) => !gems.sockets[id]);
    setSelectedSlot(open || `${color}-0`);
    setTarget(color);
  };
  const levelTabs = <div className="gem-level-tabs">{Array.from({ length: 8 }, (_, index) => index + 1).map((value) => <button key={value} onClick={() => setLevel(value)} className={level === value ? "active" : ""}>{value}</button>)}</div>;
  const colorShelf = <div className="gem-board">{GEM_COLORS.map((gem) => {
    const key = gemKey(gem.id, level);
    const amount = gems.inventory[key] || 0;
    const available = Math.max(0, amount - (socketedCounts[key] || 0) + (selectedSocket?.color === gem.id && selectedSocket.level === level ? 1 : 0));
    const value = GEM_BASE_VALUES[gem.id][level - 1];
    const selected = selectedSocket?.color === gem.id && selectedSocket.level === level;
    return <article key={gem.id} style={{ "--gem": gem.color } as CSSProperties} className={`${target === gem.id ? "target" : ""} ${selectedLane === gem.id ? "lane-match" : ""}`}>
      <button className="gem-stone" onClick={() => { setTarget(gem.id); chooseLane(gem.id); }}><Gem /><b>×{amount}</b></button>
      <strong>{gem.name}</strong>
      <small>{level}级 · {gem.baseStat === "hp" ? "生命" : gem.baseStat === "attack" ? "攻击" : gem.baseStat === "defense" ? "防御" : "速度"} +{fmt(value)}</small>
      {level >= 4 && <em>{buildStatNames[gem.secondary[0] as BuildStat]} · {buildStatNames[gem.secondary[1] as BuildStat]}</em>}
      {panel === "socket" && <button onClick={() => socketGem(selectedSlot, gem.id, level)} disabled={!available || selected || selectedLane !== gem.id}>{selected ? "已镶嵌" : selectedLane === gem.id ? "镶嵌" : "切换轨道"}</button>}
    </article>;
  })}</div>;
  return <div className="growth-view gem-view">
    <header className="gem-workshop-head"><div><Gem /><span><small>Lv.30</small><h2>宝石</h2></span></div><SystemResourceBar ids={["gemTicket", "gold"]} /></header>
    <div className="gem-workshop-stage">
      {panel === "socket" && <>
        <section className="gem-socket-panel">
          <header><strong>宝石镶嵌</strong><span>{equipped.length}/20</span></header>
          <div className="gem-lanes">{GEM_COLORS.map((gem) => <div key={gem.id} className={selectedLane === gem.id ? "selected" : ""} style={{ "--gem": gem.color } as CSSProperties}>
            <button className="gem-lane-mark" onClick={() => chooseLane(gem.id)}><Gem /><b>{gem.baseStat === "hp" ? "生命" : gem.baseStat === "attack" ? "攻击" : gem.baseStat === "defense" ? "防御" : "速度"}</b></button>
            <div>{Array.from({ length: 5 }, (_, index) => { const id = `${gem.id}-${index}`; const socket = gems.sockets[id]; return <button key={id} aria-label={`${gem.name}第${index + 1}槽${socket ? `${socket.level}级` : "空"}`} className={`${selectedSlot === id ? "selected" : ""} ${socket ? "filled" : ""}`} onClick={() => { setSelectedSlot(id); setTarget(gem.id); if (socket) setLevel(socket.level); }}>{socket ? <><Gem /><b>Lv.{socket.level}</b></> : <span>+</span>}</button>; })}</div>
          </div>)}</div>
          <div className="gem-total-stats"><span>速度 <b>+{fmt(totals.speed)}</b></span><span>生命 <b>+{fmt(totals.hp)}</b></span><span>攻击 <b>+{fmt(totals.attack)}</b></span><span>防御 <b>+{fmt(totals.defense)}</b></span></div>
        </section>
        <section className="gem-inventory-panel"><header><strong>宝石背包</strong><div><button className="primary" onClick={autoSocket}><Zap />一键镶嵌</button><button disabled={!equipped.length} onClick={removeAll}><Archive />全部卸下</button>{selectedSocket && <button onClick={() => removeGem(selectedSlot)}>卸下当前</button>}</div></header>{levelTabs}{colorShelf}</section>
      </>}
      {panel === "shop" && <section className="gem-operation-page gem-shop-page"><div className="gem-bag-art"><PackageOpen /><i><Gem /></i></div><span>随机 1 级宝石袋</span><h3>红、蓝、橙、绿各 25%</h3><p>拥有宝石券 {fmt(save.resources.gemTicket)}</p><div className="system-action-grid two"><button onClick={() => buy(1)}>购买 1 个<small>宝石券 1</small></button><button className="primary" onClick={() => buy(10)}>购买 10 个<small>宝石券 10</small></button></div>{gems.lastResult && <div className="gem-result-line"><Sparkles />{gems.lastResult}</div>}</section>}
      {panel === "compose" && <section className="gem-operation-page gem-compose-page">
        <header><Hammer /><span><strong>{level >= 8 ? "最高等级" : `${level}级合成 ${level + 1}级`}</strong><small>{level < 6 ? `任意同级 ${required} 颗 · 四色各 25%` : `同级 ${required} 颗 · 定向产出`}</small></span><b>{totalAtLevel}/{required}</b></header>
        {levelTabs}
        <div className="gem-color-picker">{GEM_COLORS.map((gem) => <button key={gem.id} className={target === gem.id ? "active" : ""} style={{ "--gem": gem.color } as CSSProperties} onClick={() => setTarget(gem.id)}><Gem />{gem.name.replace("宝石", "")}</button>)}</div>
        {colorShelf}
        <div className="gem-compose-preview" style={{ "--gem": targetGem.color } as CSSProperties}><div><small>投入</small><Gem /><strong>{required} 颗 {level}级宝石</strong><span>当前可合成 {Math.floor(totalAtLevel / required)} 次</span></div><ChevronRight /><div><small>{level < 6 ? "随机产出" : "定向产出"}</small><Gem /><strong>{level >= 8 ? "已达最高等级" : `${level + 1}级${level < 6 ? "随机宝石" : targetGem.name}`}</strong><span>{level < 6 ? "红 · 蓝 · 橙 · 绿 各 25%" : `${targetGem.name} · ${targetGem.baseStat === "hp" ? "生命" : targetGem.baseStat === "attack" ? "攻击" : targetGem.baseStat === "defense" ? "防御" : "速度"}`}</span></div></div>
        <div className="system-action-grid two"><button disabled={level >= 8 || totalAtLevel < required} onClick={() => compose(level, target, "single")}><Sparkles />{level >= 6 ? "定向合成" : "随机合成"}</button><button className="primary" disabled={level >= 8 || totalAtLevel < required} onClick={() => compose(level, target, "max")}><Zap />一键合成 ×{Math.floor(totalAtLevel / required)}</button></div>
        {gems.lastResult && <div className="gem-result-line"><Check />{gems.lastResult}</div>}
        <section className="gem-compose-rules"><header><strong>合成档位</strong><span>当前 {level} 级</span></header><div><span className={level <= 5 ? "active" : ""}><b>1–5级</b><small>3 合 1 · 随机颜色</small></span><span className={level === 6 ? "active" : ""}><b>6级</b><small>2 合 1 · 定向颜色</small></span><span className={level === 7 ? "active" : ""}><b>7级</b><small>3 合 1 · 定向颜色</small></span><span className={level === 8 ? "active" : ""}><b>8级</b><small>最高等级</small></span></div></section>
      </section>}
      {panel === "exchange" && <section className="gem-operation-page gem-exchange-page"><header><RefreshCw /><span><strong>同级置换</strong><small>保留等级，确定转换颜色</small></span></header>{levelTabs}<div className="gem-exchange-flow"><div><small>置换前</small>{GEM_COLORS.map((gem) => <button key={gem.id} className={source === gem.id ? "active" : ""} style={{ "--gem": gem.color } as CSSProperties} onClick={() => setSource(gem.id)}><Gem /><span>{gem.name}</span><b>×{gems.inventory[gemKey(gem.id, level)] || 0}</b></button>)}</div><ChevronRight /><div><small>置换后</small>{GEM_COLORS.map((gem) => <button key={gem.id} className={target === gem.id ? "active" : ""} style={{ "--gem": gem.color } as CSSProperties} onClick={() => setTarget(gem.id)}><Gem /><span>{gem.name}</span></button>)}</div></div><button className="gem-exchange-button primary" onClick={() => exchange(level, source, target)}><RefreshCw />置换 1 颗<small>{fmt(Math.ceil(500 * Math.pow(1.7, Math.max(0, level - 1))))} 金币</small></button>{gems.lastResult && <div className="gem-result-line"><Check />{gems.lastResult}</div>}</section>}
    </div>
    <nav className="gem-workshop-nav"><button className={panel === "socket" ? "active" : ""} onClick={() => setPanel("socket")}><Gem />镶嵌</button><button className={panel === "shop" ? "active" : ""} onClick={() => setPanel("shop")}><PackageOpen />购买</button><button className={panel === "compose" ? "active" : ""} onClick={() => setPanel("compose")}><Hammer />合成</button><button className={panel === "exchange" ? "active" : ""} onClick={() => setPanel("exchange")}><RefreshCw />置换</button></nav>
  </div>;
}

export function ArtifactView() {
  const save = useGameStore((state) => state.save);
  const forge = useGameStore((state) => state.forgeArtifacts);
  const equip = useGameStore((state) => state.equipArtifact);
  const upgrade = useGameStore((state) => state.upgradeArtifact);
  const state = save.growthSystems.artifact;
  const active = ARTIFACTS.find((item) => item.id === state.equipped) || ARTIFACTS[0];
  const [selectedArtifactId, setSelectedArtifactId] = useState(state.equipped || ARTIFACTS[0].id);
  const selectedArtifact = ARTIFACTS.find((item) => item.id === selectedArtifactId) || active;
  const selectedOwned = state.owned[selectedArtifact.id];
  const selectedMaterials = artifactMaterialCount(save, selectedArtifact.id);
  const selectedIsEquipped = state.equipped === selectedArtifact.id;
  const selectedMaxed = Boolean(selectedOwned && selectedOwned.level >= ARTIFACT_MAX_LEVEL);
  const weights = artifactForgeWeights(state.forgeLevel);
  useEffect(() => { if (state.equipped) setSelectedArtifactId(state.equipped); }, [state.equipped]);
  return <div className="growth-view artifact-view">
    <section className="artifact-forge-scene"><AtlasArt kind="system" index={active.art} /><div><span>神器锻造炉 Lv.{state.forgeLevel}</span><h2>{state.equipped ? active.name : "炉火待燃"}</h2><p>锻造提升炉级，炉级越高，高品质神器概率越高。</p><i><b style={{ width: `${state.forgeExp / 5 * 100}%` }} /></i></div><Anvil /></section>
    <SystemResourceBar ids={["artifactOre", "gold"]} />
    <section className="forge-controls"><div className="forge-rate-row">{ARTIFACTS.map((item, index) => <span key={item.id}><b>{item.name}</b><small>{(weights[index] / 100).toFixed(2)}%</small></span>)}</div><div className="system-action-grid two"><button onClick={() => forge(1)}><Hammer />锻造 1 次<small>锻造石 {artifactForgeCost(state.forgeLevel)}</small></button><button className="primary" onClick={() => forge(10)}><Hammer />锻造 10 次<small>连续提升炉级</small></button></div><small className="pity-copy">单机高品质保底 {state.pity}/30 · 炉级权重为本地平衡值</small>{state.lastForge.length > 0 && <div className="result-chips">{state.lastForge.map((name, index) => <span key={`${name}-${index}`}>{name}</span>)}</div>}</section>
    <section className="artifact-rack">
      <header><div><strong>神器库</strong><small>选择神器查看培养状态</small></div><span>{Object.keys(state.owned).length}/{ARTIFACTS.length}</span></header>
      <nav className="artifact-selector" aria-label="神器选择">{ARTIFACTS.map((artifact) => { const owned = state.owned[artifact.id]; return <button key={artifact.id} className={`${selectedArtifact.id === artifact.id ? "active" : ""} ${state.equipped === artifact.id ? "equipped" : ""}`} onClick={() => setSelectedArtifactId(artifact.id)}><AtlasArt kind="system" index={artifact.art} /><span>{artifact.name}</span><b>{owned ? `${owned.level}阶` : "未获得"}</b></button>; })}</nav>
      <div className={`artifact-focus ${selectedIsEquipped ? "equipped" : ""}`}><AtlasArt kind="system" index={selectedArtifact.art} /><div><span>{selectedArtifact.role}神器</span><strong>{selectedArtifact.name}</strong><small>{selectedOwned ? `${selectedOwned.level}/${ARTIFACT_MAX_LEVEL}阶 · 库存 ${selectedOwned.count}` : "尚未锻造"}</small><p>同阶素材 {selectedMaterials}/2</p></div><div><button disabled={!selectedOwned || selectedIsEquipped} onClick={() => equip(selectedArtifact.id)}>{selectedIsEquipped ? <Check /> : <Swords />}{selectedIsEquipped ? "出战中" : "设为出战"}</button><button className="primary" disabled={!selectedOwned || selectedMaxed} onClick={() => upgrade(selectedArtifact.id)}><ArrowUp />{selectedMaxed ? "已满阶" : "同阶升阶"}</button></div></div>
    </section>
  </div>;
}

export function FlagView() {
  const save = useGameStore((state) => state.save);
  const train = useGameStore((state) => state.trainFlag);
  const setStat = useGameStore((state) => state.setFlagStat);
  const flag = save.growthSystems.flag;
  const needed = battleFlagRequiredExp(flag.level);
  const success = battleFlagSuccessRate(flag.level) / 100;
  return <div className="growth-view flag-view">
    <section className="flag-scene"><AtlasArt kind="system" index={10} /><div><span>荣耀战旗</span><h2>Lv.{flag.level}/120</h2><p>防御 +{fmt(flag.level * 310)} · {buildStatNames[flag.selectedStat]} +{(flag.level * .24).toFixed(2)}%</p><i><b style={{ width: `${Math.min(100, flag.progress / needed * 100)}%` }} /></i><small>升级进度 {flag.progress}/{needed}</small></div></section>
    <SystemResourceBar ids={["flagEssence", "merit"]} />
    <section className="flag-rates"><div><Target /><span><small>当前成功率</small><strong>{success.toFixed(0)}%</strong></span></div><div><Trophy /><span><small>最近结果</small><strong>{flag.lastSuccess ? `成功 +${flag.lastGain}` : flag.attempts ? "失败 +0" : "尚未训练"}</strong></span></div><div><Swords /><span><small>累计训练</small><strong>{flag.attempts}</strong></span></div></section>
    <section className="flag-stat-select"><header><strong>战旗主属性</strong><span>切换免费，立即计入主人物</span></header><div>{(Object.keys(buildStatNames) as BuildStat[]).map((stat) => <button key={stat} className={flag.selectedStat === stat ? "active" : ""} onClick={() => setStat(stat)}>{buildStatNames[stat]}</button>)}</div></section>
    <section className="flag-training"><div className="flag-exp-table">{[[1, 30], [2, 20], [3, 20], [5, 15], [10, 10], [20, 5]].map(([exp, rate]) => <span key={exp}><b>+{exp}</b><small>{rate}%</small></span>)}</div><RuleLine>先按当前等级判定升级进度是否成功，成功后再按上表抽取进度值。</RuleLine><div className="system-action-grid two"><button onClick={() => train(1)}><Flag />训练 1 次<small>精华 1</small></button><button className="primary" onClick={() => train(10)}><Flag />训练 10 次<small>自动结算</small></button></div></section>
  </div>;
}

export function TerritoryView() {
  const save = useGameStore((state) => state.save);
  const pull = useGameStore((state) => state.pullTerritory);
  const refresh = useGameStore((state) => state.refreshTerritory);
  const territory = save.growthSystems.territory;
  return <div className="growth-view territory-view">
    <section className="territory-scene"><AtlasArt kind="growth" index={13} /><div><span>边境领地</span><h2>资源采集</h2><p>选择一处资源点拉取，稀有度越高，数量越多。</p></div><b>{territory.pullsRemaining}/5</b></section>
    <SystemResourceBar ids={["chestTicket", "food", "steak", "mountWhip"]} />
    <section className="territory-toolbar"><div><Shield /><span><small>领地声望</small><strong>{territory.reputation}</strong></span></div><div><KeyRound /><span><small>宝库钥匙</small><strong>{save.resources.treasuryKey}</strong></span></div><button onClick={refresh}><RefreshCw />刷新资源点<small>{territory.refreshesRemaining ? "今日免费" : "20钻石"}</small></button></section>
    <section className="territory-map">{territory.offers.map((offer, index) => <article key={offer.id} className={`quality-${offer.quality}`}><div className="map-pin"><AtlasArt kind="growth" index={territoryArtIndex(offer.reward)} /><b>{index + 1}</b></div><span>资源点 {"★".repeat(offer.quality)}</span><h3>{offer.title}</h3><div>{Object.entries(offer.reward).map(([id, amount]) => <p key={id}><strong>{RESOURCE_META[id as ResourceId].name}</strong><b>×{amount}</b></p>)}</div><button className="primary" disabled={!territory.pullsRemaining} onClick={() => pull(offer.id)}><PackageOpen />拉取资源</button></article>)}</section>
    <section className="territory-event-rates"><strong>活动额外掉落</strong><span>宝库钥匙 25% · 每日最多2</span><span>金蛇福牌 50%</span></section>
    {territory.lastClaim && <div className="territory-receipt"><Check /><span>最近拉取：{territory.lastClaim.title}</span></div>}
  </div>;
}

export function TurntableView() {
  const save = useGameStore((state) => state.save);
  const selectPool = useGameStore((state) => state.selectTurntablePool);
  const spin = useGameStore((state) => state.spinTurntable);
  const spinAll = useGameStore((state) => state.spinAllTurntable);
  const table = save.growthSystems.turntable;
  const pool = TURNTABLE_POOLS[table.pool - 1];
  const clearCost = 30 * Math.max(0, table.remaining.length - (table.spinsToday === 0 ? 1 : 0));
  return <div className="growth-view turntable-view">
    <section className="turntable-head"><Dices /><div><span>每日转盘</span><h2>九抽不重复</h2><p>完成9次后必然获得奖池内全部奖励。</p></div><b>{table.spinsToday}/9</b></section>
    <SystemResourceBar ids={["diamond", "chestTicket", "gemTicket", "runeShard"]} />
    <div className="pool-tabs"><button className={table.pool === 1 ? "active" : ""} disabled={table.spinsToday > 0 && table.pool !== 1} onClick={() => selectPool(1)}>奖池一</button><button className={table.pool === 2 ? "active" : ""} disabled={table.spinsToday > 0 && table.pool !== 2} onClick={() => selectPool(2)}>奖池二</button></div>
    <section className="turntable-grid">{pool.map((item, index) => { const claimed = !table.remaining.includes(index); return <div key={item.name} className={claimed ? "claimed" : ""}><span>{claimed ? <Check /> : index === 0 ? <Trophy /> : <GiftIcon index={index} />}</span><strong>{item.name}</strong><small>{(item.rate / 100).toFixed(2)}%</small></div>; })}</section>
    <div className="turntable-actions"><button className="turntable-spin" disabled={!table.remaining.length} onClick={() => spin(table.pool)}><Dices /><span><strong>{table.remaining.length ? table.spinsToday ? "转动一次" : "今日免费" : "今日已完成"}</strong><small>{table.remaining.length ? table.spinsToday ? "30钻石" : "不消耗" : "奖励已领完"}</small></span></button><button className="turntable-spin primary" disabled={!table.remaining.length || save.resources.diamond < clearCost} onClick={() => spinAll(table.pool)}><Zap /><span><strong>一键转完</strong><small>{table.remaining.length ? save.resources.diamond < clearCost ? `还差 ${fmt(clearCost - save.resources.diamond)} 钻石` : `${clearCost} 钻石` : "奖励已领完"}</small></span></button></div>
    {table.lastReward && <div className="turntable-result"><Sparkles /><span>刚刚获得</span><strong>{table.lastReward}</strong></div>}
  </div>;
}

function GiftIcon({ index }: { index: number }) {
  return index % 3 === 0 ? <Gem /> : index % 3 === 1 ? <Coins /> : <PackageOpen />;
}

export function EventHubView() {
  const save = useGameStore((state) => state.save);
  const redeem = useGameStore((state) => state.redeemEvent);
  return <div className="growth-view event-hub-view">
    <section className="event-hero"><AtlasArt kind="growth" index={14} /><div><span>限时活动</span><h2>掉落道具 · 定向兑换</h2><p>活动道具来自开箱、角斗和领地；兑换奖励不再走随机抽卡。</p></div></section>
    <section className="event-lane hammer-event"><AtlasArt kind="growth" index={15} /><div><span>一锤定音</span><h3>定点砸蛋</h3><p>开箱 1% 掉落，每日最多 3 枚。</p><b><Hammer />拥有 {save.resources.eggHammer}</b></div><div><button disabled={!save.resources.eggHammer} onClick={() => redeem("hammer", 1)}>魔兽蛋 ×3</button><button className="primary" disabled={!save.resources.eggHammer} onClick={() => redeem("hammer", 2)}>精灵培养包</button></div></section>
    <section className="event-lane treasury-event"><AtlasArt kind="growth" index={4} /><div><span>国王宝库</span><h3>钥匙开仓</h3><p>开箱 1% · 角斗胜利 30% · 领地 25%，每日最多 2 枚。</p><b><KeyRound />拥有 {save.resources.treasuryKey}</b></div><div><button disabled={!save.resources.treasuryKey} onClick={() => redeem("treasury", 1)}>宝箱 ×500</button><button className="primary" disabled={!save.resources.treasuryKey} onClick={() => redeem("treasury", 2)}>金币 ×10万</button></div></section>
    <section className="event-lane golden-event"><AtlasArt kind="growth" index={12} /><div><span>金蛇送福</span><h3>福牌商店</h3><p>开箱 1% · 角斗胜利 35% · 领地 50%，每次兑换消耗 3 枚。</p><b><Sparkles />拥有 {save.resources.goldenSnakeToken}</b></div><div><button disabled={save.resources.goldenSnakeToken < 3} onClick={() => redeem("golden", 1)}>坐骑培养包</button><button className="primary" disabled={save.resources.goldenSnakeToken < 3} onClick={() => redeem("golden", 2)}>神器战旗包</button></div></section>
    <RuleLine>上述掉落率来自公开概率资料；兑换内容为单机版确定性资源出口，不冒充原作奖励表。</RuleLine>
  </div>;
}

export function InventoryView({ openSystem, activeGroupIndex, onGroupChange }: { openSystem: (id: "mount" | "warEagle" | "runes" | "gems" | "artifact" | "flag" | "territory" | "warSouls" | "beasts" | "battlePets" | "soulCards" | "hunting" | "events") => void; activeGroupIndex: number; onGroupChange: (index: number) => void }) {
  const save = useGameStore((state) => state.save);
  const categoryStripRef = useRef<HTMLElement | null>(null);
  const groups: { title: string; icon: ReactNode; target?: Parameters<typeof openSystem>[0]; action?: string; ids: ResourceId[] }[] = [
    { title: "通用货币", icon: <Coins />, ids: ["gold", "diamond", "chestTicket", "challengeTicket", "merit", "guildCoin", "trialCoin"] },
    { title: "坐骑补给", icon: <Zap />, target: "mount", action: "前往坐骑", ids: ["mountWhip", "food", "steak"] },
    { title: "战鹰材料", icon: <Feather />, target: "warEagle", action: "前往战鹰", ids: ["eagleFeather"] },
    { title: "符文材料", icon: <WandSparkles />, target: "runes", action: "前往符文", ids: ["runeShard", "wildRune"] },
    { title: "宝石材料", icon: <Gem />, target: "gems", action: "前往宝石", ids: ["gemTicket"] },
    { title: "魔兽材料", icon: <Sparkles />, target: "beasts", action: "前往魔兽", ids: ["beastEgg", "beastEggBlue", "beastEggRare", "beastEggGold", "beastEggLegendary", "beastEggPerfect", "beastEggExtraordinary", "beastMagicCrystal", "beastExtraordinaryShard", "beastEssence", "beastDevourStone", "beastEnhanceStone"] },
    { title: "战宠材料", icon: <Zap />, target: "battlePets", action: "前往战宠", ids: ["petSoulGrass", "petSoulFlower", "petSoulFruit"] },
    { title: "战魂材料", icon: <Swords />, target: "warSouls", action: "前往战魂", ids: ["soulCore"] },
    { title: "魂卡养成", icon: <Archive />, target: "soulCards", action: "前往魂卡", ids: ["soulCardTicket", "soulCardDust"] },
    { title: "捕猎兑换", icon: <Target />, target: "hunting", action: "前往捕猎", ids: ["huntingStamina", "huntingCoin"] },
    { title: "神器材料", icon: <Anvil />, target: "artifact", action: "前往神器", ids: ["artifactOre"] },
    { title: "战旗材料", icon: <Flag />, target: "flag", action: "前往战旗", ids: ["flagEssence"] },
    { title: "活动道具", icon: <KeyRound />, target: "events", action: "前往活动", ids: ["eggHammer", "treasuryKey", "goldenSnakeToken"] }
  ];
  const activeGroup = groups[activeGroupIndex] || groups[0];
  const activeTotal = activeGroup.ids.reduce((sum, id) => sum + save.resources[id], 0);
  useEffect(() => {
    const strip = categoryStripRef.current;
    const button = strip?.querySelector<HTMLElement>(`[data-group-index="${activeGroupIndex}"]`);
    if (!strip || !button) return;
    strip.scrollTo({ left: button.offsetLeft - (strip.clientWidth - button.offsetWidth) / 2 });
  }, [activeGroupIndex]);
  return <div className="growth-view inventory-view">
    <section className="inventory-summary"><Archive /><div><span>冒险背包</span><h2>{Object.values(save.resources).reduce((sum, value) => sum + value, 0).toLocaleString()} 件资源</h2><p>装备 {Object.keys(save.equipped).length}/12 · 待处理装备 {save.loot.length}</p></div></section>
    <nav className="inventory-category-strip" aria-label="背包分类" ref={categoryStripRef}>{groups.map((group, index) => <button key={group.title} data-group-index={index} className={activeGroupIndex === index ? "active" : ""} onClick={() => onGroupChange(index)}>{group.icon}<span>{group.title}</span><b>{group.ids.length}</b></button>)}</nav>
    <section className="inventory-active-group"><header>{activeGroup.icon}<div><strong>{activeGroup.title}</strong><small>{activeGroup.ids.length} 类资源 · 共 {fmt(activeTotal)}</small></div>{activeGroup.target && <button onClick={() => openSystem(activeGroup.target!)}>{activeGroup.action}<ChevronRight /></button>}</header><div className="inventory-resource-grid">{activeGroup.ids.map((id) => <article key={id}><ResourcePill id={id} value={save.resources[id]} label /></article>)}</div></section>
    <section className="collection-counts"><div><strong>{Object.keys(save.collections.warSouls).length}</strong><span>战魂图鉴</span></div><div><strong>{Object.values(save.collections.beasts).filter((item) => item.discovered).length}</strong><span>魔兽图鉴</span></div><div><strong>{Object.keys(save.collections.soulCards).length}</strong><span>魂卡图鉴</span></div><div><strong>{save.growthSystems.mount.mounts.length}</strong><span>坐骑库存</span></div></section>
  </div>;
}
