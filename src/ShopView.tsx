import { useMemo, useState, type ReactNode } from "react";
import {
  BadgeDollarSign, Check, Coins, Crown, Gem, Gift, History, LockKeyhole, Minus,
  PackageOpen, Plus, ReceiptText, RefreshCw, Shield, ShoppingBag, Sparkles, Swords,
  Ticket, X, Zap
} from "lucide-react";
import {
  GROWTH_PACK_LEVELS, RECHARGE_PRODUCTS, RECHARGE_PRODUCT_LIMITS, RESOURCE_META,
  SHOP_GOODS, VIP_THRESHOLDS
} from "./config";
import { vipLevel } from "./engine";
import { useGameStore } from "./store";
import { AtlasArt, fmt, ResourcePill } from "./ui";
import type { RechargeProduct, ResourceId, ShopCurrencyTab, ShopGood } from "./types";

const shopTabs: { id: ShopCurrencyTab; name: string; icon: ReactNode }[] = [
  { id: "diamondHot", name: "钻石热卖", icon: <Sparkles /> },
  { id: "goldWarehouse", name: "金币仓库", icon: <Coins /> },
  { id: "diamondWarehouse", name: "钻石仓库", icon: <Gem /> },
  { id: "guild", name: "联盟商店", icon: <Shield /> },
  { id: "merit", name: "功勋商店", icon: <Swords /> },
  { id: "trial", name: "试炼商店", icon: <Ticket /> }
];

const dailyGroups = ["每日礼包", "战魂礼包", "群雄礼包", "魂卡礼包", "战宠礼包", "魔兽礼包", "秘宝礼包"] as const;
type DailyGroup = typeof dailyGroups[number];
type PackageTab = "daily" | "sale" | "growth" | "privilege" | "month";

const groupProducts: Record<Exclude<DailyGroup, "战魂礼包">, string[]> = {
  每日礼包: ["daily-basic-free", "daily-basic-6", "daily-basic-12", "daily-basic-18", "daily-basic-30"],
  群雄礼包: ["daily-arena-198", "daily-arena-648", "supply-flag-68", "supply-event-128"],
  魂卡礼包: ["daily-card-328", "daily-card-648", "supply-rune-30"],
  战宠礼包: ["daily-pet-328", "daily-pet-648"],
  魔兽礼包: ["daily-beast-328", "daily-beast-648", "supply-beast-68"],
  秘宝礼包: ["daily-treasure-68", "daily-treasure-198", "daily-treasure-648", "supply-artifact-68"]
};

function packagePurchasesForToday(productId: string, day: number, commerceDay: number, purchases: Record<string, number>) {
  if (["monthly-30", "lifetime-68", "fund-98", "pass-128"].includes(productId)) return purchases[productId] || 0;
  return commerceDay === day ? purchases[productId] || 0 : 0;
}

function rewardText(rewards: RechargeProduct["rewards"] | ShopGood["rewards"]) {
  return Object.entries(rewards).map(([id, amount]) => `${RESOURCE_META[id as ResourceId].name}×${fmt(Number(amount))}`).join(" · ");
}

function commerceArt(rewards: RechargeProduct["rewards"]) {
  const ids = Object.keys(rewards) as ResourceId[];
  if (ids.includes("diamond")) return 0;
  if (ids.includes("gold")) return 1;
  if (ids.includes("mountWhip")) return 2;
  if (ids.includes("runeShard")) return 3;
  if (ids.includes("beastEssence")) return 4;
  if (ids.includes("gemTicket")) return 5;
  if (ids.includes("soulCore")) return 6;
  if (ids.some((id) => id.startsWith("beastEgg"))) return 7;
  if (ids.includes("artifactOre")) return 8;
  if (ids.includes("flagEssence") || ids.includes("challengeTicket") || ids.includes("merit")) return 9;
  if (ids.includes("soulCardTicket") || ids.includes("soulCardDust")) return 10;
  return 11;
}

function CommerceResources({ active }: { active?: ResourceId }) {
  const save = useGameStore((state) => state.save);
  const ids: ResourceId[] = ["gold", "diamond"];
  if (active && !ids.includes(active)) ids.push(active);
  return <div className="commerce-resource-bar">{ids.map((id) => <ResourcePill key={id} id={id} value={save.resources[id]} label />)}</div>;
}

function MerchantHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return <section className="commerce-merchant">
    <div className="merchant-copy"><span>{subtitle}</span><strong className="merchant-title">{title}</strong><p>今天想带走哪件宝贝？</p></div>
    {children && <div className="merchant-actions">{children}</div>}
  </section>;
}

export function ShopView({ openOrders }: { openOrders: () => void }) {
  const save = useGameStore((state) => state.save);
  const refresh = useGameStore((state) => state.refreshCommerceShop);
  const [tab, setTab] = useState<ShopCurrencyTab>("diamondHot");
  const [good, setGood] = useState<ShopGood | null>(null);
  const [product, setProduct] = useState<RechargeProduct | null>(null);
  const selectedCurrency = tab === "guild" ? "guildCoin" : tab === "merit" ? "merit" : tab === "trial" ? "trialCoin" : "diamond";
  const goods = useMemo(() => {
    const source = SHOP_GOODS.filter((item) => item.tab === tab);
    if (!source.length) return source;
    const offset = save.commerce.shopRotation % source.length;
    return [...source.slice(offset), ...source.slice(0, offset)];
  }, [save.commerce.shopRotation, tab]);
  const refreshCost = save.commerce.refreshes === 0 ? 0 : 30 * Math.pow(2, Math.min(4, save.commerce.refreshes - 1));
  const diamondProducts = RECHARGE_PRODUCTS.filter((item) => item.category === "diamond");

  return <div className="commerce-view shop-commerce-view">
    <MerchantHeader title="商城" subtitle="适度游戏，理性消费">
      <button onClick={openOrders}><ReceiptText />账单</button>
      <button onClick={refresh}><RefreshCw />{refreshCost ? `${refreshCost} 刷新` : "免费刷新"}</button>
    </MerchantHeader>
    <CommerceResources active={selectedCurrency} />
    <div className="shop-refresh-line"><span>虚拟开服第 {save.day} 天</span><strong>{save.commerce.refreshes ? `今日已刷新 ${save.commerce.refreshes} 次` : "本日首次刷新免费"}</strong></div>

    {tab === "diamondWarehouse" ? <section className="diamond-shelves" aria-label="钻石仓库">
      {diamondProducts.map((item) => {
        const first = !save.firstPurchaseProducts.includes(item.id);
        return <button key={item.id} onClick={() => setProduct(item)} aria-label={`${item.name} ¥${item.amountRmb}`}>
          {first && <i>首次双倍</i>}<AtlasArt kind="commerce" index={0} /><strong>钻石</strong><b>×{item.rewards.diamond}</b><span>¥ {item.amountRmb}</span>
        </button>;
      })}
    </section> : <section className="shop-shelves" aria-label={shopTabs.find((item) => item.id === tab)?.name}>
      {goods.map((item) => {
        const purchased = save.commerce.day === save.day ? save.commerce.shopPurchases[item.id] || 0 : 0;
        const remaining = Math.max(0, item.limit - purchased);
        return <button key={item.id} disabled={!remaining} onClick={() => setGood(item)} aria-label={`购买${item.name}`}>
          <span className="shelf-stock">限购 {purchased}/{item.limit}</span>
          <AtlasArt kind="commerce" index={item.art} />
          <strong>{item.name}</strong><small>{rewardText(item.rewards)}</small>
          <b>{RESOURCE_META[item.currency].name} {item.cost.toLocaleString()}</b>
        </button>;
      })}
    </section>}

    <nav className="commerce-bottom-tabs" aria-label="商城分类">{shopTabs.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>{item.icon}<span>{item.name}</span></button>)}</nav>
    {good && <GoodQuantityDialog good={good} close={() => setGood(null)} />}
    {product && <RechargeDialog product={product} close={() => setProduct(null)} />}
  </div>;
}

export function PackageView({ openOrders, openWarSouls }: { openOrders: () => void; openWarSouls: () => void }) {
  const save = useGameStore((state) => state.save);
  const frenzy = useGameStore((state) => state.frenzyRecharge);
  const [tab, setTab] = useState<PackageTab>("daily");
  const [product, setProduct] = useState<RechargeProduct | null>(null);
  const titles: Record<PackageTab, string> = { daily: "日常礼包", sale: "每日特价", growth: "成长礼包", privilege: "特权", month: "月卡" };
  return <div className="commerce-view package-commerce-view">
    <MerchantHeader title={titles[tab]} subtitle="本地模拟到账，不会发生真实支付">
      <button onClick={openOrders}><History />账单</button>
      <button className="merchant-frenzy" onClick={frenzy}><Zap />疯狂十连充</button>
    </MerchantHeader>
    <CommerceResources />
    {tab === "daily" && <DailyPackages selectProduct={setProduct} openWarSouls={openWarSouls} />}
    {tab === "sale" && <DailySale selectProduct={setProduct} />}
    {tab === "growth" && <GrowthPackages selectProduct={setProduct} />}
    {tab === "privilege" && <PrivilegePackages selectProduct={setProduct} />}
    {tab === "month" && <MonthAndVip selectProduct={setProduct} />}
    <nav className="commerce-bottom-tabs package-main-tabs" aria-label="礼包分类">
      <button className={tab === "daily" ? "active" : ""} onClick={() => setTab("daily")}><Gift /><span>日常礼包</span></button>
      <button className={tab === "sale" ? "active" : ""} onClick={() => setTab("sale")}><ShoppingBag /><span>每日特价</span></button>
      <button className={tab === "growth" ? "active" : ""} onClick={() => setTab("growth")}><PackageOpen /><span>成长礼包</span></button>
      <button className={tab === "privilege" ? "active" : ""} onClick={() => setTab("privilege")}><Crown /><span>特权</span></button>
      <button className={tab === "month" ? "active" : ""} onClick={() => setTab("month")}><Ticket /><span>月卡</span></button>
    </nav>
    {product && <RechargeDialog product={product} close={() => setProduct(null)} />}
    <span className="commerce-audit-marker" aria-hidden="true">{save.day}</span>
  </div>;
}

function DailyPackages({ selectProduct, openWarSouls }: { selectProduct: (product: RechargeProduct) => void; openWarSouls: () => void }) {
  const save = useGameStore((state) => state.save);
  const [group, setGroup] = useState<DailyGroup>("每日礼包");
  const products = group === "战魂礼包" ? [] : groupProducts[group].map((id) => RECHARGE_PRODUCTS.find((item) => item.id === id)).filter(Boolean) as RechargeProduct[];
  const warSoulProducts = RECHARGE_PRODUCTS.filter((item) => ["daily-68", "daily-198", "daily-648"].includes(item.id));
  return <div className="daily-package-panel">
    <div className="package-refresh">刷新倒计时 <strong>随虚拟开服日重置</strong></div>
    <div className="daily-package-tabs">{dailyGroups.map((item) => <button key={item} className={group === item ? "active" : ""} onClick={() => setGroup(item)}>{item}</button>)}</div>
    <section className="package-row-list">
      {(group === "战魂礼包" ? warSoulProducts : products).map((item, index) => {
        const purchased = packagePurchasesForToday(item.id, save.day, save.commerce.day, save.commerce.packagePurchases);
        const limit = RECHARGE_PRODUCT_LIMITS[item.id] || 999;
        return <article className="package-row" key={item.id}>
          {group === "战魂礼包" ? <AtlasArt kind="warSoul" index={[2, 4, 8][index] || 2} /> : <AtlasArt kind="commerce" index={commerceArt(item.rewards)} />}
          <div><i>{item.amountRmb ? `¥ ${item.amountRmb}` : "免费"}</i><strong>{item.name}</strong><small>{rewardText(item.rewards)}{group === "战魂礼包" ? " · 自选战魂×1" : ""}</small></div>
          <span>限购 {purchased}/{limit}</span>
          <button disabled={purchased >= limit} onClick={group === "战魂礼包" ? openWarSouls : () => selectProduct(item)}>{group === "战魂礼包" ? "进入自选" : item.amountRmb ? "立即购买" : "免费领取"}</button>
        </article>;
      })}
    </section>
  </div>;
}

function DailySale({ selectProduct }: { selectProduct: (product: RechargeProduct) => void }) {
  const purchase = useGameStore((state) => state.purchase);
  const save = useGameStore((state) => state.save);
  const ids = ["supply-mount-30", "supply-rune-30", "supply-gem-30", "supply-artifact-68", "supply-flag-68", "supply-event-128"];
  const products = ids.map((id) => RECHARGE_PRODUCTS.find((item) => item.id === id)!).filter(Boolean);
  const available = products.filter((item) => packagePurchasesForToday(item.id, save.day, save.commerce.day, save.commerce.packagePurchases) < (RECHARGE_PRODUCT_LIMITS[item.id] || 1));
  return <div className="daily-sale-panel">
    <h3>超值礼包</h3><div className="sale-product-grid">{products.slice(0, 3).map((item) => <SaleProduct key={item.id} product={item} select={selectProduct} />)}</div>
    <h3>限购礼包</h3><div className="sale-product-grid">{products.slice(3).map((item) => <SaleProduct key={item.id} product={item} select={selectProduct} />)}</div>
    <button className="one-click-package" disabled={!available.length} onClick={() => available.forEach((item) => purchase(item.id))}><Zap />一键购买本页 {available.length} 个礼包</button>
  </div>;
}

function SaleProduct({ product, select }: { product: RechargeProduct; select: (product: RechargeProduct) => void }) {
  const save = useGameStore((state) => state.save);
  const purchased = packagePurchasesForToday(product.id, save.day, save.commerce.day, save.commerce.packagePurchases);
  const limit = RECHARGE_PRODUCT_LIMITS[product.id] || 1;
  return <button className="sale-product" disabled={purchased >= limit} onClick={() => select(product)}>
    <AtlasArt kind="commerce" index={commerceArt(product.rewards)} /><strong>{product.name}</strong><small>{rewardText(product.rewards)}</small><span>{purchased}/{limit}</span><b>¥{product.amountRmb}</b>
  </button>;
}

function GrowthPackages({ selectProduct }: { selectProduct: (product: RechargeProduct) => void }) {
  const save = useGameStore((state) => state.save);
  const claim = useGameStore((state) => state.claimGrowthPack);
  const fund = RECHARGE_PRODUCTS.find((item) => item.id === "fund-98")!;
  const unlocked = save.orders.some((order) => order.productId === fund.id);
  return <div className="growth-package-panel">
    <section className="growth-fund-banner"><Crown /><div><strong>成长基金</strong><small>达到等级即可领取免费奖励；模拟开通后解锁进阶轨道</small></div><button disabled={unlocked} onClick={() => selectProduct(fund)}>{unlocked ? "已开通" : "免费模拟 ¥98"}</button></section>
    <div className="growth-track-head"><span>等级</span><b>免费奖励</b><b>进阶奖励</b></div>
    {GROWTH_PACK_LEVELS.map((item) => {
      const freeClaimed = save.commerce.claimedGrowthFree.includes(item.level);
      const premiumClaimed = save.commerce.claimedGrowthPremium.includes(item.level);
      const reached = save.player.level >= item.level;
      return <article className="growth-pack-row" key={item.level}>
        <strong>Lv.{item.level}</strong>
        <div><small>{rewardText(item.free)}</small><button disabled={!reached || freeClaimed} onClick={() => claim(item.level, false)}>{freeClaimed ? <Check /> : reached ? "领取" : "未达成"}</button></div>
        <div className={!unlocked ? "locked" : ""}><small>{rewardText(item.premium)}</small><button disabled={!unlocked || !reached || premiumClaimed} onClick={() => claim(item.level, true)}>{premiumClaimed ? <Check /> : !unlocked ? <LockKeyhole /> : reached ? "领取" : "未达成"}</button></div>
      </article>;
    })}
  </div>;
}

function PrivilegePackages({ selectProduct }: { selectProduct: (product: RechargeProduct) => void }) {
  const cards = ["monthly-30", "lifetime-68"].map((id) => RECHARGE_PRODUCTS.find((item) => item.id === id)!);
  return <div className="privilege-panel">{cards.map((item, index) => <PrivilegeCard key={item.id} product={item} index={index} select={selectProduct} />)}</div>;
}

function PrivilegeCard({ product, index, select }: { product: RechargeProduct; index: number; select: (product: RechargeProduct) => void }) {
  const save = useGameStore((state) => state.save);
  const claim = useGameStore((state) => state.claimCommerceCard);
  const owned = save.orders.some((order) => order.productId === product.id);
  const claimed = save.commerce.cardClaimDays[product.id] === save.day;
  const dailyText = product.id === "monthly-30" ? "每日钻石×60 · 宝箱×100" : "每日炼魂草×60 · 炼魂花×5";
  return <article className={`privilege-card privilege-${index}`}>
    <div><Crown /><span><strong>{product.name}</strong><small>尊享权益 30 天</small></span></div>
    <AtlasArt kind="commerce" index={index ? 11 : 0} />
    <p><b>立即获得</b>{rewardText(product.rewards)}</p><p><b>每日领取</b>{dailyText}</p>
    {owned ? <button disabled={claimed} onClick={() => claim(product.id as "monthly-30" | "lifetime-68")}>{claimed ? "今日已领取" : "领取今日奖励"}</button> : <button onClick={() => select(product)}>免费模拟 ¥{product.amountRmb}</button>}
  </article>;
}

function MonthAndVip({ selectProduct }: { selectProduct: (product: RechargeProduct) => void }) {
  const save = useGameStore((state) => state.save);
  const vip = vipLevel(save.totalSpent);
  const products = ["fund-98", "pass-128"].map((id) => RECHARGE_PRODUCTS.find((item) => item.id === id)!);
  const progress = vip >= 15 ? 100 : (save.totalSpent - VIP_THRESHOLDS[vip]) / Math.max(1, VIP_THRESHOLDS[vip + 1] - VIP_THRESHOLDS[vip]) * 100;
  return <div className="month-vip-panel">
    <section className="vip-commerce-track"><Crown /><strong>VIP {vip}</strong><div><i style={{ width: `${progress}%` }} /></div><span>{vip >= 15 ? "已满级" : `距 VIP ${vip + 1} 还需 ¥${VIP_THRESHOLDS[vip + 1] - save.totalSpent}`}</span></section>
    {products.map((item) => {
      const owned = save.orders.some((order) => order.productId === item.id);
      return <article key={item.id}><AtlasArt kind="commerce" index={commerceArt(item.rewards)} /><div><strong>{item.name}</strong><small>{rewardText(item.rewards)}</small></div><button disabled={owned} onClick={() => selectProduct(item)}>{owned ? "已开通" : `免费模拟 ¥${item.amountRmb}`}</button></article>;
    })}
  </div>;
}

function GoodQuantityDialog({ good, close }: { good: ShopGood; close: () => void }) {
  const save = useGameStore((state) => state.save);
  const buy = useGameStore((state) => state.buyShopGood);
  const purchased = save.commerce.day === save.day ? save.commerce.shopPurchases[good.id] || 0 : 0;
  const max = Math.max(0, Math.min(good.limit - purchased, Math.floor(save.resources[good.currency] / good.cost)));
  const [quantity, setQuantity] = useState(Math.min(1, max));
  return <QuantityDialog title={good.name} art={<AtlasArt kind="commerce" index={good.art} />} quantity={quantity} max={max} setQuantity={setQuantity} close={close} rewards={good.rewards} cost={`${RESOURCE_META[good.currency].name} ${(good.cost * quantity).toLocaleString()}`} confirm={() => { buy(good.id, quantity); close(); }} />;
}

function RechargeDialog({ product, close }: { product: RechargeProduct; close: () => void }) {
  const save = useGameStore((state) => state.save);
  const purchase = useGameStore((state) => state.purchase);
  const purchased = packagePurchasesForToday(product.id, save.day, save.commerce.day, save.commerce.packagePurchases);
  const configuredLimit = RECHARGE_PRODUCT_LIMITS[product.id] || 99;
  const max = Math.max(0, Math.min(99, configuredLimit - purchased));
  const [quantity, setQuantity] = useState(Math.min(1, max));
  const firstDouble = product.firstDouble && !save.firstPurchaseProducts.includes(product.id);
  const rewards = Object.fromEntries(Object.entries(product.rewards).map(([id, amount]) => [id, Number(amount) * quantity + (firstDouble ? Number(amount) : 0)]));
  return <QuantityDialog title={product.name} art={<AtlasArt kind="commerce" index={commerceArt(product.rewards)} />} quantity={quantity} max={max} setQuantity={setQuantity} close={close} rewards={rewards} cost={product.amountRmb ? `免费模拟 ¥${product.amountRmb * quantity}` : "免费领取"} note={firstDouble ? "首个档位奖励额外发放一次；批量购买不会重复翻倍" : "只写入本地存档，不调用支付或发送订单"} confirm={() => { purchase(product.id, quantity); close(); }} />;
}

function QuantityDialog({ title, art, quantity, max, setQuantity, close, rewards, cost, note, confirm }: {
  title: string; art: ReactNode; quantity: number; max: number; setQuantity: (value: number) => void; close: () => void;
  rewards: Partial<Record<ResourceId, number>>; cost: string; note?: string; confirm: () => void;
}) {
  const change = (delta: number) => setQuantity(Math.max(1, Math.min(max, quantity + delta)));
  return <div className="confirm-layer commerce-confirm" role="dialog" aria-label={`确认购买${title}`}>
    <div className="confirm-card"><button className="confirm-close" onClick={close} aria-label="关闭购买确认"><X /></button>{art}<h3>{title}</h3><p>{note || "选择购买数量，奖励会直接发放到本地单机存档。"}</p>
      <div className="commerce-quantity" aria-label="购买数量"><button onClick={() => change(-10)} disabled={quantity <= 1}>-10</button><button onClick={() => change(-1)} disabled={quantity <= 1}><Minus /></button><strong>{quantity}</strong><button onClick={() => change(1)} disabled={quantity >= max}><Plus /></button><button onClick={() => change(10)} disabled={quantity >= max}>+10</button><button onClick={() => setQuantity(max)} disabled={quantity >= max}>最大</button></div>
      <div className="reward-preview">{Object.entries(rewards).map(([id, amount]) => <span key={id}>{RESOURCE_META[id as ResourceId].name}<b>×{fmt(Number(amount))}</b></span>)}</div>
      <div className="confirm-actions"><button onClick={close}>取消</button><button className="primary" disabled={!max || quantity <= 0} onClick={confirm}><BadgeDollarSign />{max ? cost : "已售罄"}</button></div>
    </div>
  </div>;
}
