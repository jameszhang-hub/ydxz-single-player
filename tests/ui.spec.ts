import { expect, test, type Page } from "@playwright/test";

async function openLobbyTool(page: Page, label: string | RegExp) {
  await page.getByRole("button", { name: "玩法入口", exact: true }).click();
  await page.getByRole("dialog", { name: "玩法入口" }).getByRole("button", { name: label }).click();
}

async function fundGrowth(page: Page) {
  await openLobbyTool(page, "特惠");
  await page.getByRole("button", { name: /疯狂十连充/ }).click();
  await expect(page.getByText(/十连模拟充值到账/)).toBeVisible();
  await page.getByRole("button", { name: "关闭" }).click();
}

async function expectAndCloseFeature(page: Page, heading: string) {
  if (heading === "魔兽") {
    await expect(page.locator(".beast-rebuild-root")).toBeVisible();
    await page.getByRole("button", { name: "退出魔兽" }).click();
    return;
  }
  await expect(page.locator(".overlay-header").getByRole("heading", { name: heading, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "关闭" }).click();
}

test("core mobile loop stays usable", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("无畏旅人")).toBeVisible();
  await expect(page.getByRole("button", { name: "开 10 次" })).toBeVisible();
  expect(await page.locator(".page-stage").evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
  const lobbyGeometry = await page.evaluate(() => {
    const box = (selector: string) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height } : null;
    };
    const overlaps = (a: DOMRect, b: DOMRect) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const hero = document.querySelector(".hero-board")!.getBoundingClientRect();
    const equipment = [...document.querySelectorAll(".equipment-slot")].map((element) => element.getBoundingClientRect());
    const systems = [...document.querySelectorAll(".system-shortcuts button")].map((element) => element.getBoundingClientRect());
    const chest = document.querySelector(".chest-art")!.getBoundingClientRect();
    const sideActions = [...document.querySelectorAll(".chest-side-actions button")].map((element) => element.getBoundingClientRect());
    const tools = [...document.querySelectorAll(".chest-tools button")].map((element) => element.getBoundingClientRect());
    const rate = document.querySelector(".rate-strip")!.getBoundingClientRect();
    const nonOverlapPairs = [
      [".lobby-menu-button", ".hero-character"],
      [".hero-character", ".power-ribbon"],
      [".power-ribbon", ".attribute-panel"]
    ].map(([first, second]) => [document.querySelector(first)!.getBoundingClientRect(), document.querySelector(second)!.getBoundingClientRect()]);
    return {
      hero: box(".hero-board"), chest: box(".chest-art"),
      equipmentInside: equipment.every((rect) => rect.left >= hero.left && rect.right <= hero.right && rect.top >= hero.top && rect.bottom <= hero.bottom && rect.width >= 42 && rect.height >= 42),
      systemsInside: systems.every((rect) => rect.left >= hero.left && rect.right <= hero.right && rect.top >= hero.top && rect.bottom <= hero.bottom && rect.width >= 42 && rect.height >= 42),
      heroControlsClear: nonOverlapPairs.every(([first, second]) => overlaps(first, second) === 0),
      chestClear: sideActions.every((rect) => overlaps(rect, chest) === 0) && tools.every((rect) => overlaps(rect, rate) === 0)
    };
  });
  expect(lobbyGeometry.hero?.height).toBeGreaterThan(300);
  expect(lobbyGeometry.chest?.width).toBeGreaterThan(160);
  expect(lobbyGeometry.equipmentInside).toBe(true);
  expect(lobbyGeometry.systemsInside).toBe(true);
  expect(lobbyGeometry.heroControlsClear).toBe(true);
  expect(lobbyGeometry.chestClear).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("home.png"), fullPage: true });

  await openLobbyTool(page, "特惠");
  await expect(page.getByRole("heading", { name: "礼包" })).toBeVisible();
  await expect(page.getByRole("button", { name: /疯狂十连充/ })).toBeVisible();
  await page.waitForTimeout(250);
  expect(await page.locator(".overlay-body").evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("packages.png"), fullPage: true });
  await page.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "打开商城" }).click();
  await expect(page.getByRole("heading", { name: "商城" })).toBeVisible();
  await page.getByRole("button", { name: "钻石仓库", exact: true }).click();
  await page.getByRole("button", { name: /680 钻石/ }).click();
  await expect(page.getByText(/首个档位奖励额外发放一次/)).toBeVisible();
  await page.getByRole("button", { name: /免费模拟 ¥68/ }).click();
  await expect(page.getByText(/模拟到账成功/)).toBeVisible();
  expect(await page.evaluate(() => {
    const notice = document.querySelector(".overlay-notice")!.getBoundingClientRect();
    const body = document.querySelector(".overlay-body")!.getBoundingClientRect();
    return Math.abs(notice.bottom - body.top) <= 1;
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("shop.png"), fullPage: true });

  await page.getByRole("button", { name: "关闭" }).click();
  await page.getByRole("button", { name: "开 10 次" }).click();
  await expect(page.getByText(/本次保留 10 件装备/)).toBeVisible();
  const resultLayout = await page.evaluate(() => {
    const dock = document.querySelector(".chest-dock")!.getBoundingClientRect();
    const tray = document.querySelector(".chest-dock > .loot-tray")!.getBoundingClientRect();
    return {
      contained: tray.left >= dock.left && tray.right <= dock.right && tray.top >= dock.top && tray.bottom <= dock.bottom,
      chestCount: document.querySelectorAll(".chest-art").length,
      sideActionCount: document.querySelectorAll(".chest-side-actions").length,
      toastCount: document.querySelectorAll(".toast").length
    };
  });
  expect(resultLayout.contained).toBe(true);
  expect(resultLayout.chestCount).toBe(0);
  expect(resultLayout.sideActionCount).toBe(0);
  expect(resultLayout.toastCount).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("home-loot.png"), fullPage: true });
  await page.getByRole("button", { name: /按暴击换装/ }).click();
  await expect(page.getByText(/已按当前流派换装/)).toBeVisible();
  await expect(page.locator(".chest-art")).toBeVisible();
  expect(await page.evaluate(() => {
    const overlap = (a: DOMRect, b: DOMRect) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return overlap(document.querySelector(".chest-summary")!.getBoundingClientRect(), document.querySelector(".chest-art")!.getBoundingClientRect()) === 0;
  })).toBe(true);
  await page.getByRole("button", { name: "角色详情" }).click();
  await expect(page.getByText("战力来源核验")).toBeVisible();
  await expect(page.locator(".power-breakdown").getByText("装备")).toBeVisible();
  await expect(page.locator(".power-breakdown > div span i").first()).toBeAttached();
  await page.waitForTimeout(2750);
  await page.locator(".overlay-body").evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await page.screenshot({ path: testInfo.outputPath("profile.png"), fullPage: true });
  const panelBox = await page.locator(".overlay-panel").boundingBox();
  if (!panelBox) throw new Error("overlay panel is not visible");
  await page.mouse.move(panelBox.x + 2, panelBox.y + panelBox.height * .56);
  await page.mouse.down();
  await page.mouse.move(panelBox.x + 110, panelBox.y + panelBox.height * .57, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".overlay-panel")).toHaveCount(0);
});

test("lobby remains playable on a compact phone", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Compact viewport is covered once.");
  const viewports = [{ width: 320, height: 667 }, { width: 360, height: 667 }, { width: 375, height: 667 }, { width: 375, height: 740 }, { width: 390, height: 844 }, { width: 393, height: 852 }, { width: 430, height: 932 }];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(await page.locator(".page-stage").evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
    await expect(page.getByRole("button", { name: "开 10 次" })).toBeInViewport();
    expect(await page.evaluate(() => {
      const overlap = (a: DOMRect, b: DOMRect) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const pairs = [
        [rect(".lobby-menu-button"), rect(".hero-character")],
        [rect(".hero-character"), rect(".power-ribbon")],
        [rect(".power-ribbon"), rect(".attribute-panel")],
        [rect(".attribute-panel"), rect(".equipment-grid")],
        [rect(".attribute-panel"), rect(".system-shortcuts")]
      ];
      const equipment = [...document.querySelectorAll(".equipment-slot")].map((element) => element.getBoundingClientRect());
      const systems = [...document.querySelectorAll(".system-shortcuts button")].map((element) => element.getBoundingClientRect());
      return pairs.every(([first, second]) => overlap(first, second) === 0) && equipment.every((box) => box.width >= 40 && box.height >= 40) && systems.every((box) => box.width >= 40 && box.height >= 38);
    })).toBe(true);
    if (viewport.width === 320 || (viewport.width === 375 && viewport.height === 667)) await page.screenshot({ path: testInfo.outputPath(`home-${viewport.width}.png`), fullPage: true });
    await page.getByRole("button", { name: "玩法入口", exact: true }).click();
    const menu = page.getByRole("dialog", { name: "玩法入口" });
    await expect(menu).toBeInViewport();
    expect(await menu.locator(".quick-icon").evaluateAll((buttons) => buttons.every((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44;
    }))).toBe(true);
    if (viewport.width === 320 || (viewport.width === 375 && viewport.height === 667)) await page.screenshot({ path: testInfo.outputPath(`menu-${viewport.width}.png`), fullPage: true });
  }
});

test("one-hand action docks remain usable on a compact phone", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Compact one-hand geometry is covered once.");
  await page.setViewportSize({ width: 320, height: 667 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.documentElement.style.setProperty("--safe-bottom", "34px"));
  await page.locator(".system-shortcuts").getByRole("button", { name: /^战宠$/ }).click();
  const petGeometry = await page.evaluate(() => {
    const body = document.querySelector(".overlay-body")!.getBoundingClientRect();
    const tabs = document.querySelector(".pet-tabs")!.getBoundingClientRect();
    const action = document.querySelector(".pet-main-actions")!.getBoundingClientRect();
    const buttons = [...document.querySelectorAll(".pet-tabs button, .pet-main-actions button")].map((element) => element.getBoundingClientRect());
    return {
      noHorizontalOverflow: document.querySelector(".battle-pet-view")!.scrollWidth <= body.width + 1,
      docked: Math.abs(tabs.bottom - body.bottom) <= 1,
      lowerAction: action.top >= body.top + body.height * .5 && action.bottom <= tabs.top + 1,
      fingerSized: buttons.every((button) => button.height >= 44),
      safeAreaReserved: tabs.height >= 88
    };
  });
  expect(petGeometry).toEqual({ noHorizontalOverflow: true, docked: true, lowerAction: true, fingerSized: true, safeAreaReserved: true });
  await page.waitForTimeout(250);
  await page.screenshot({ path: testInfo.outputPath("battle-pet-one-hand-320.png"), fullPage: true });

  const panelBox = await page.locator(".overlay-panel").boundingBox();
  if (!panelBox) throw new Error("overlay panel is not visible");
  await page.mouse.move(panelBox.x + 2, panelBox.y + panelBox.height * .52);
  await page.mouse.down();
  await page.mouse.move(panelBox.x + 100, panelBox.y + panelBox.height * .53, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".overlay-panel")).toHaveCount(0);

  await page.getByRole("button", { name: "打开商城" }).click();
  await expect(page.getByRole("heading", { name: "商城", exact: true })).toBeVisible();
  expect(await page.evaluate(() => {
    const body = document.querySelector(".overlay-body")!.getBoundingClientRect();
    const tabs = document.querySelector(".commerce-bottom-tabs")!.getBoundingClientRect();
    const shelves = document.querySelector(".shop-shelves, .diamond-shelves")!.getBoundingClientRect();
    return Math.abs(tabs.bottom - body.bottom) <= 1
      && tabs.height >= 100
      && shelves.bottom >= tabs.top
      && [...document.querySelectorAll(".commerce-bottom-tabs button")].every((button) => button.getBoundingClientRect().height >= 44);
  })).toBe(true);
  await page.waitForTimeout(250);
  await page.screenshot({ path: testInfo.outputPath("shop-one-hand-320.png"), fullPage: true });
});

test("compact inventory and artifact controls keep their usable geometry", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Compact growth-system geometry is covered once.");
  await page.setViewportSize({ width: 320, height: 667 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".system-shortcuts").getByRole("button", { name: "背包", exact: true }).click();
  await page.locator(".inventory-category-strip").getByRole("button", { name: /魔兽材料/ }).click();
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => {
    const view = document.querySelector(".inventory-view") as HTMLElement;
    const body = document.querySelector(".overlay-body") as HTMLElement;
    const grid = document.querySelector(".inventory-resource-grid") as HTMLElement;
    const buttons = [...document.querySelectorAll(".inventory-category-strip button")];
    return view.scrollWidth <= body.clientWidth + 1
      && getComputedStyle(grid).gridTemplateColumns.split(" ").length === 1
      && buttons.every((button) => button.getBoundingClientRect().height >= 44);
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("inventory-320.png"), fullPage: true });
  await page.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "玩法", exact: true }).click();
  await page.locator(".feature-grid").getByRole("button", { name: /^神器/ }).click();
  await expect(page.locator(".artifact-selector button")).toHaveCount(4);
  expect(await page.evaluate(() => {
    const view = document.querySelector(".artifact-view") as HTMLElement;
    const body = document.querySelector(".overlay-body") as HTMLElement;
    const selectors = [...document.querySelectorAll(".artifact-selector button")];
    const actions = [...document.querySelectorAll(".artifact-focus button")];
    return view.scrollWidth <= body.clientWidth + 1
      && selectors.every((button) => button.getBoundingClientRect().height >= 44)
      && actions.every((button) => button.getBoundingClientRect().height >= 44);
  })).toBe(true);
  await page.waitForTimeout(250);
  await page.screenshot({ path: testInfo.outputPath("artifact-320.png"), fullPage: true });
});

test("nested overlays return to their parent and primary pages reset scroll", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".system-shortcuts").getByRole("button", { name: "背包", exact: true }).click();
  await page.locator(".inventory-category-strip").getByRole("button", { name: /魔兽材料/ }).click();
  await page.getByRole("button", { name: "前往魔兽", exact: true }).click();
  await expect(page.locator(".beast-rebuild-root")).toBeVisible();
  await page.getByRole("button", { name: "退出魔兽" }).click();
  await expect(page.getByRole("heading", { name: "冒险背包", exact: true })).toBeVisible();
  await expect(page.locator(".inventory-category-strip button.active")).toContainText("魔兽材料");

  await page.getByRole("button", { name: "前往魔兽", exact: true }).click();
  await page.getByRole("button", { name: "退出魔兽" }).click();
  await page.getByRole("button", { name: "关闭" }).click();
  await expect(page.locator(".overlay-panel")).toHaveCount(0);

  await page.locator(".equipment-grid").getByRole("button", { name: /^武器/ }).click();
  await page.locator(".equipment-gem-link").click();
  await expect(page.locator(".overlay-header").getByRole("heading", { name: "宝石", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "返回" }).click();
  await expect(page.getByRole("heading", { name: "装备详情", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "关闭" }).click();

  await openLobbyTool(page, "特惠");
  await page.locator(".overlay-body").evaluate((element) => { element.scrollTop = 180; });
  const packageScroll = await page.locator(".overlay-body").evaluate((element) => element.scrollTop);
  expect(packageScroll).toBeGreaterThan(0);
  await page.getByRole("button", { name: "账单", exact: true }).evaluate((element: HTMLElement) => element.click());
  await expect(page.getByRole("heading", { name: "模拟充值账单", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "返回" }).click();
  await expect(page.getByRole("heading", { name: "礼包", exact: true })).toBeVisible();
  await expect.poll(() => page.locator(".overlay-body").evaluate((element) => element.scrollTop)).toBe(packageScroll);
  await page.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "角色详情" }).click();
  const overlayBox = await page.locator(".overlay-panel").boundingBox();
  if (!overlayBox) throw new Error("overlay panel is not visible");
  await page.mouse.move(overlayBox.x + 2, overlayBox.y + overlayBox.height * .45);
  await page.mouse.down();
  await page.mouse.move(overlayBox.x + 52, overlayBox.y + overlayBox.height * .45, { steps: 5 });
  await expect(page.locator(".overlay-panel.edge-dragging")).toBeVisible();
  await page.mouse.up();
  await expect(page.locator(".overlay-panel")).toBeVisible();
  await expect(page.locator(".overlay-panel.edge-dragging")).toHaveCount(0);
  await page.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "玩法", exact: true }).click();
  await page.locator(".page-stage").evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect(await page.locator(".page-stage").evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "试炼", exact: true }).click();
  await expect.poll(() => page.locator(".page-stage").evaluate((element) => element.scrollTop)).toBe(0);
  await page.getByRole("button", { name: "玩法", exact: true }).click();
  await page.locator(".page-stage").evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await page.getByRole("button", { name: "玩法", exact: true }).click();
  await expect.poll(() => page.locator(".page-stage").evaluate((element) => element.scrollTop)).toBe(0);
});

test("all home controls and backpack links have truthful destinations", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const quickEntries = [
    ["福利", "福利活动"], ["特惠", "礼包"], ["账单", "模拟充值账单"],
    ["活动", "限时活动"], ["设置", "设置"], ["第1天", "开服日历"]
  ] as const;
  for (const [label, heading] of quickEntries) {
    await page.getByRole("button", { name: "玩法入口", exact: true }).click();
    await page.getByRole("dialog", { name: "玩法入口" }).getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "关闭" }).click();
  }

  const shortcuts = [
    ["宝石", "宝石"], ["魔兽", "魔兽"], ["战宠", "战宠"], ["符文", "符文"], ["魂卡", "魂卡"],
    ["战魂", "战魂"], ["坐骑", "坐骑"], ["战鹰", "战鹰"], ["战旗", "战旗"], ["神器", "神器"],
    ["捕猎", "捕猎"], ["背包", "冒险背包"]
  ] as const;
  for (const [label, heading] of shortcuts) {
    await page.locator(".home-page").getByRole("button", { name: label, exact: true }).click();
    await expectAndCloseFeature(page, heading);
  }

  for (const slot of ["武器", "头盔", "护肩", "衣服", "长裤", "战靴", "项链", "戒指", "腰带", "手套", "护腕", "盾牌"]) {
    await page.locator(".equipment-grid").getByRole("button", { name: new RegExp(`^${slot}`) }).click();
    await expect(page.getByRole("heading", { name: "装备详情", exact: true })).toBeVisible();
    await expect(page.locator(".equipment-gem-link")).toContainText("宝石镶嵌盘");
    await page.getByRole("button", { name: "关闭" }).click();
  }

  const inventoryRoutes = [
    ["坐骑补给", "前往坐骑", "坐骑"], ["战鹰材料", "前往战鹰", "战鹰"], ["符文材料", "前往符文", "符文"], ["宝石材料", "前往宝石", "宝石"],
    ["魔兽材料", "前往魔兽", "魔兽"], ["战宠材料", "前往战宠", "战宠"], ["战魂材料", "前往战魂", "战魂"], ["魂卡养成", "前往魂卡", "魂卡"],
    ["捕猎兑换", "前往捕猎", "捕猎"], ["神器材料", "前往神器", "神器"], ["战旗材料", "前往战旗", "战旗"], ["活动道具", "前往活动", "限时活动"]
  ] as const;
  for (const [category, label, heading] of inventoryRoutes) {
    await page.locator(".system-shortcuts").getByRole("button", { name: "背包", exact: true }).click();
    await page.locator(".inventory-category-strip").getByRole("button", { name: new RegExp(`^${category}`) }).click();
    await page.getByRole("button", { name: label, exact: true }).click();
    await expectAndCloseFeature(page, heading);
    if (heading === "魔兽") {
      await expect(page.getByRole("heading", { name: "冒险背包", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "关闭" }).click();
    }
  }

  await page.getByRole("button", { name: "角斗场", exact: true }).click();
  await expect(page.getByRole("heading", { name: "群雄逐鹿", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "联盟", exact: true }).click();
  await expect(page.getByRole("heading", { name: "联盟", exact: true })).toBeVisible();
});

test("equipment owns its detail workflow and links to the global gem board", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await fundGrowth(page);
  await page.getByRole("button", { name: "开 10 次" }).click();
  await page.locator(".loot-chip").first().click();
  await expect(page.getByRole("heading", { name: "装备详情" })).toBeVisible();
  await expect(page.getByText("新获得").first()).toBeVisible();
  await expect(page.locator(".equipment-comparison.two")).toBeVisible();
  await page.locator(".equipment-primary-actions").getByRole("button", { name: /^穿戴/ }).click();
  await page.getByRole("button", { name: /精炼一次/ }).click();
  await expect(page.locator(".equipment-workbench strong").filter({ hasText: "精炼 +1" })).toBeVisible();
  await expect(page.locator(".equipment-slot-strip button")).toHaveCount(12);
  await expect(page.locator(".equipment-slot-strip button.active")).toHaveCount(1);
  await page.locator(".equipment-slot-strip button").last().click();
  await expect(page.locator(".equipment-slot-strip button.active")).toContainText("盾牌");
  await expect.poll(() => page.evaluate(() => {
    const strip = document.querySelector(".equipment-slot-strip")!.getBoundingClientRect();
    const active = document.querySelector(".equipment-slot-strip button.active")!.getBoundingClientRect();
    return active.left >= strip.left - 1 && active.right <= strip.right + 1;
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("equipment.png") });
  await page.locator(".equipment-gem-link").click();
  await expect(page.locator(".overlay-header").getByRole("heading", { name: "宝石", exact: true })).toBeVisible();
  await expect(page.locator(".gem-lanes button.selected")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("equipment-gem.png"), fullPage: true });
});

test("navigation and battle overlay render", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /试炼/ }).last().click();
  await expect(page.getByRole("heading", { name: "试炼" })).toBeVisible();
  await expect(page.getByText("第 1 章 · 关卡 1-1")).toBeVisible();
  await expect(page.getByText("怪物属性表 v148 (2025-04-03)")).toBeVisible();
  await expect(page.locator(".trial-enemy-stats")).toContainText(/生命1,000攻击250防御50速度100/);
  await page.getByRole("button", { name: /开始挑战/ }).click();
  await expect(page.getByRole("heading", { name: "战斗结算" })).toBeVisible();
  await expect(page.locator(".overlay")).toBeVisible();
  await expect(page.locator(".battle-stage .battlefield")).toBeVisible();
  await expect(page.locator(".battle-sprite.hero")).toBeVisible();
  await expect(page.locator(".battle-sprite.enemy")).toBeVisible();
  await expect(page.locator(".battle-companion-sprite.battle-pet")).toBeVisible();
  await expect(page.locator(".battle-companions")).toContainText("战宠");
  await expect(page.locator(".fighter-hud.player small")).toHaveText("Lv.1");
  await expect(page.locator(".battle-power-compare")).toContainText(/我方.+敌方/);
  await expect(page.getByTestId("battle-report")).toContainText(/本场表现.+总伤害/);
  await expect(page.locator(".battle-plan-verdict")).toContainText(/暴击爆发 · 有效概率/);
  await expect(page.locator(".battle-round small")).not.toHaveText(/^0\//);
  await expect.poll(async () => Number((await page.locator(".battle-round strong").textContent()) || 0)).toBeGreaterThanOrEqual(2);
  await page.screenshot({ path: testInfo.outputPath("battle.png") });
  await page.getByTestId("battle-report").scrollIntoViewIfNeeded();
  expect(await page.locator(".overlay-body").evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("battle-report.png") });
});

test("primary navigation pages keep distinct playable layouts", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  for (const [name, selector, screenshot] of [
    ["玩法", ".feature-grid", "play-page.png"],
    ["试炼", ".encounter-banner", "trial-page.png"],
    ["角斗场", ".opponent-list", "arena-page.png"],
    ["联盟", ".guild-banner", "guild-page.png"]
  ] as const) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(selector)).toBeVisible();
    expect(await page.locator(".page-stage").evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(screenshot), fullPage: true });
  }
  await page.getByRole("button", { name: "玩法", exact: true }).click();
  await expect(page.locator(".play-system-group")).toHaveCount(3);
  await expect(page.locator(".play-system-grid .feature-tile")).toHaveCount(13);
  await page.getByRole("button", { name: "试炼", exact: true }).click();
  await expect(page.locator(".trial-reward-panel > div > span")).toHaveCount(4);
  await page.getByRole("button", { name: "角斗场", exact: true }).click();
  await expect(page.locator(".arena-power-range")).toBeVisible();
  await page.getByRole("button", { name: "联盟", exact: true }).click();
  await expect(page.locator(".guild-ranking")).toBeVisible();
});

test("guild daily actions expose prerequisites and completion states", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "联盟", exact: true }).click();
  await expect(page.getByRole("button", { name: /金币不足/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /联盟币不足/ })).toBeDisabled();

  await page.getByRole("button", { name: "副本", exact: true }).click();
  await fundGrowth(page);
  await page.getByRole("button", { name: "联盟", exact: true }).click();
  await page.getByRole("button", { name: /联盟捐献/ }).click();
  await expect(page.getByRole("button", { name: /今日已捐.*明日刷新/ })).toBeDisabled();
  await page.getByRole("button", { name: /联盟特供/ }).click();
  await expect(page.getByRole("button", { name: /今日已购.*明日刷新/ })).toBeDisabled();
});

test("arena opponent level and shown power remain truthful in combat", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "角斗场", exact: true }).click();
  const opponent = page.locator(".opponent-list article").first();
  const shownPower = Number(await opponent.getAttribute("data-npc-power"));
  const levelText = await opponent.locator("small").textContent();
  const level = Number(levelText?.match(/Lv\.(\d+)/)?.[1]);
  expect(shownPower).toBeGreaterThan(0);
  expect(level).toBeGreaterThan(0);
  await opponent.getByRole("button", { name: "挑战" }).click();
  await expect(page.getByRole("heading", { name: "战斗结算" })).toBeVisible();
  await expect(page.locator(".fighter-hud.enemy small")).toHaveText(`Lv.${level}`);
  const actualPower = Number(await page.locator(".battle-power-compare").evaluate((element) => {
    const text = element.querySelector("span:last-child")?.textContent || "";
    const value = Number(text.replace(/[^\d.万亿]/g, "").replace("亿", "e8").replace("万", "e4"));
    return value;
  }));
  expect(actualPower).toBeGreaterThan(0);
  expect(Math.abs(actualPower - shownPower) / shownPower).toBeLessThan(0.025);
});

test("official probability center is reachable", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "全部公示" }).click();
  await expect(page.getByRole("heading", { name: "概率公示" })).toBeVisible();
  await expect(page.getByText("符文抽取")).toBeVisible();
  await expect(page.getByText("90~120级")).toBeVisible();
});

test("welfare and server-day controls open distinct screens", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openLobbyTool(page, "福利");
  await expect(page.getByRole("heading", { name: "福利活动" })).toBeVisible();
  await expect(page.locator(".welfare-header")).toBeVisible();
  await expect(page.locator(".calendar-banner")).toHaveCount(0);
  await page.getByRole("button", { name: "关闭" }).click();
  await openLobbyTool(page, /第1天/);
  await expect(page.getByRole("heading", { name: "开服日历" })).toBeVisible();
  await expect(page.locator(".calendar-banner")).toBeVisible();
  await expect(page.locator(".welfare-header")).toHaveCount(0);
});

test("commission and strategy automate repetitive play", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openLobbyTool(page, "特惠");
  await page.getByRole("button", { name: /疯狂十连充/ }).click();
  await expect(page.getByText(/十连模拟充值到账/)).toBeVisible();
  await page.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: /战力/ }).click();
  await expect(page.getByRole("heading", { name: "流派方案" })).toBeVisible();
  await page.getByRole("button", { name: /闪避反击/ }).click();
  await page.getByRole("button", { name: /一键按流派优化/ }).click();
  await page.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "开箱委托" }).click();
  await expect(page.getByRole("heading", { name: "开箱委托" })).toBeVisible();
  await page.getByLabel("极速委托（约每秒四轮）").check();
  await page.getByRole("button", { name: "开始委托" }).click();
  await expect(page.getByText("运行中")).toBeVisible();
  await page.waitForTimeout(650);
  await expect(page.getByText(/上一轮/)).toBeVisible();
  await page.getByRole("button", { name: "停止", exact: true }).click();
});

test("every gameplay feature entry opens a real view", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "玩法", exact: true }).click();
  const entries = [
    ["战魂", "战魂"], ["捕猎", "捕猎"], ["魔兽", "魔兽"], ["战宠", "战宠"], ["魂卡", "魂卡"], ["双塔奇兵", "双塔奇兵"],
    ["领地", "领地"], ["坐骑", "坐骑"], ["战鹰", "战鹰"], ["符文", "符文"],
    ["宝石", "宝石"], ["神器", "神器"], ["战旗", "战旗"]
  ] as const;
  for (const [buttonName, heading] of entries) {
    await page.locator(".feature-grid").getByRole("button", { name: new RegExp(`^${buttonName}`) }).click();
    if (heading === "魔兽") await expect(page.locator(".beast-rebuild-root")).toBeVisible();
    else await expect(page.locator(".overlay-header").getByRole("heading", { name: heading, exact: true })).toBeVisible();
    expect(await page.locator(".overlay-body").evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    if (heading === "魔兽") await page.getByRole("button", { name: "退出魔兽" }).click();
    else await page.getByRole("button", { name: "关闭" }).click();
  }
});

test("mount has refresh pity stable deployment and escalating training", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await fundGrowth(page);
  await page.getByRole("button", { name: "玩法", exact: true }).click();
  await page.locator(".feature-grid").getByRole("button", { name: /^坐骑/ }).click();
  await expect(page.getByRole("heading", { name: "坐骑", exact: true })).toBeVisible();
  await expect(page.getByText("67.5%")).toBeVisible();
  await page.locator(".mount-draw-panel .system-action-grid button").first().click();
  await expect(page.getByText(/普通刷新：/)).toBeVisible();
  await page.locator(".mount-draw-panel .system-action-grid button").nth(3).click();
  const recycle = page.getByRole("button", { name: /一键遣散/ });
  await expect(recycle).toBeEnabled();
  await recycle.click();
  await expect(page.locator(".toast").getByText(/遣散重复坐骑/)).toBeVisible();
  const inactiveMount = page.locator(".stable-roster button:not(.active)").first();
  if (await inactiveMount.count()) {
    await inactiveMount.click();
    await page.getByRole("button", { name: "设为出战" }).click();
  } else {
    await page.locator(".stable-roster button.active").click();
  }
  await page.getByRole("button", { name: /升级 1 次/ }).click();
  await expect(page.getByText(/提升 1 级/)).toBeVisible();
  await expect(page.getByText(/战力 \+/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("mount.png"), fullPage: true });
});

test("runes and gems use their published draw and synthesis loops", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await fundGrowth(page);
  await page.getByRole("button", { name: "玩法", exact: true }).click();
  await page.locator(".feature-grid").getByRole("button", { name: /^符文/ }).click();
  await expect(page.locator(".rune-list article")).toHaveCount(12);
  await page.locator(".rune-workshop-nav").getByRole("button", { name: "祈愿" }).click();
  await page.getByRole("button", { name: /抽取 1 次/ }).click();
  await expect(page.getByText(/符文抽取完成/)).toBeVisible();
  await page.locator(".rune-workshop-nav").getByRole("button", { name: "装配" }).click();
  await page.locator(".rune-list article.owned button").first().click();
  await page.locator(".rune-detail-sheet").getByRole("button", { name: "装配" }).click();
  await expect(page.getByText(/已装配|已卸下/)).toBeVisible();
  expect(await page.evaluate(() => {
    const body = document.querySelector(".overlay-body")!.getBoundingClientRect();
    const tabs = document.querySelector(".rune-workshop-nav")!.getBoundingClientRect();
    return Math.abs(tabs.bottom - body.bottom) <= 1;
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("runes.png"), fullPage: true });
  await page.getByRole("button", { name: "关闭" }).click();

  await page.locator(".feature-grid").getByRole("button", { name: /^宝石/ }).click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: testInfo.outputPath("gems-socket.png") });
  await page.locator(".gem-workshop-nav").getByRole("button", { name: "购买" }).click();
  await page.getByRole("button", { name: "购买 10 个" }).click();
  await expect(page.getByText(/宝石袋开启/)).toBeVisible();
  await page.locator(".gem-workshop-nav").getByRole("button", { name: "镶嵌" }).click();
  await page.getByRole("button", { name: /一键镶嵌/ }).click();
  await expect(page.locator(".toast").getByText(/一键镶嵌/)).toBeVisible();
  await page.getByRole("button", { name: /全部卸下/ }).click();
  await expect(page.locator(".toast").getByText(/已一键卸下/)).toBeVisible();
  await page.locator(".gem-workshop-nav").getByRole("button", { name: "合成" }).click();
  await expect(page.locator(".gem-compose-preview")).toBeVisible();
  await expect(page.locator(".gem-compose-rules > div > span")).toHaveCount(4);
  await page.getByRole("button", { name: /随机合成/ }).click();
  await expect(page.getByText(/合成成功/)).toBeVisible();
  expect(await page.evaluate(() => {
    const body = document.querySelector(".overlay-body")!.getBoundingClientRect();
    const tabs = document.querySelector(".gem-workshop-nav")!.getBoundingClientRect();
    return Math.abs(tabs.bottom - body.bottom) <= 1;
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("gems.png"), fullPage: true });
});

test("artifact flag and territory each complete a distinct progression action", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await fundGrowth(page);
  await page.getByRole("button", { name: "玩法", exact: true }).click();
  await page.locator(".feature-grid").getByRole("button", { name: /^神器/ }).click();
  await page.getByRole("button", { name: /锻造 1 次/ }).click();
  await expect(page.getByText(/锻造完成/)).toBeVisible();
  await expect(page.getByText(/战力 \+/)).toBeVisible();
  await expect(page.locator(".artifact-selector button")).toHaveCount(4);
  await expect(page.locator(".artifact-focus")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("artifact.png"), fullPage: true });
  await page.getByRole("button", { name: "关闭" }).click();

  await page.locator(".feature-grid").getByRole("button", { name: /^战旗/ }).click();
  await page.getByRole("button", { name: /训练 10 次/ }).click();
  await expect(page.getByText(/战旗训练 10 次/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("flag.png"), fullPage: true });
  await page.getByRole("button", { name: "关闭" }).click();

  await page.locator(".feature-grid").getByRole("button", { name: /^领地/ }).click();
  await page.locator(".territory-map").getByRole("button", { name: /拉取资源/ }).first().click();
  await expect(page.locator(".toast").getByText(/领地拉取/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("territory.png"), fullPage: true });
});

test("turntable backpack and material shop are reachable and usable", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openLobbyTool(page, "福利");
  await page.getByRole("button", { name: /每日转盘/ }).click();
  await page.getByRole("button", { name: "奖池二" }).click();
  await expect(page.getByText("魔兽精华×5")).toBeVisible();
  await expect(page.getByText("0/9")).toBeVisible();
  await page.getByRole("button", { name: /今日免费/ }).click();
  await expect(page.getByText(/每日转盘：获得/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("turntable.png"), fullPage: true });
  await page.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "背包" }).click();
  await expect(page.getByRole("heading", { name: "冒险背包" })).toBeVisible();
  await expect(page.getByText("坐骑补给")).toBeVisible();
  await expect(page.locator(".inventory-category-strip button")).toHaveCount(13);
  await expect(page.locator(".inventory-active-group .resource-pill")).toHaveCount(7);
  await page.locator(".inventory-category-strip").getByRole("button", { name: /魔兽材料/ }).click();
  await expect(page.locator(".inventory-active-group .resource-pill")).toHaveCount(12);
  await page.waitForTimeout(250);
  await page.screenshot({ path: testInfo.outputPath("inventory.png"), fullPage: true });
  await page.getByRole("button", { name: "关闭" }).click();
  await openLobbyTool(page, "特惠");
  await page.getByRole("button", { name: "每日特价", exact: true }).click();
  await page.getByRole("button", { name: /坐骑补给箱/ }).click();
  await page.getByRole("button", { name: /免费模拟 ¥30/ }).click();
  await expect(page.getByText(/模拟到账成功/)).toBeVisible();
});

test("turntable can automate all remaining non-repeat rewards", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile") await page.setViewportSize({ width: 320, height: 667 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await fundGrowth(page);
  await openLobbyTool(page, "福利");
  await page.getByRole("button", { name: /每日转盘/ }).click();
  await page.getByRole("button", { name: "奖池二" }).click();
  await expect(page.locator(".turntable-actions button")).toHaveCount(2);
  await page.getByRole("button", { name: /一键转完/ }).click();
  await expect(page.getByText("9/9")).toBeVisible();
  await expect(page.getByText(/转盘托管完成/)).toBeVisible();
  await expect(page.locator(".turntable-grid > div.claimed")).toHaveCount(9);
  await page.screenshot({ path: testInfo.outputPath("turntable-auto.png"), fullPage: true });
});

test("store shelves support exact diamond tiers stock quantities and refresh", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "打开商城" }).click();
  await expect(page.getByRole("heading", { name: "商城", exact: true })).toBeVisible();
  for (const name of ["钻石热卖", "金币仓库", "钻石仓库", "联盟商店", "功勋商店", "试炼商店"]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "钻石仓库", exact: true }).click();
  await expect(page.locator(".diamond-shelves > button")).toHaveCount(6);
  for (const amount of [60, 300, 680, 1280, 3280, 6480]) await expect(page.getByRole("button", { name: new RegExp(`${amount} 钻石`) })).toBeVisible();
  await page.getByRole("button", { name: /680 钻石/ }).click();
  await page.locator(".commerce-quantity").getByRole("button", { name: "", exact: true }).nth(1).click();
  await expect(page.locator(".commerce-quantity strong")).toHaveText("2");
  await page.getByRole("button", { name: /免费模拟 ¥136/ }).click();
  await expect(page.getByText(/模拟到账成功/)).toBeVisible();

  await page.getByRole("button", { name: "钻石热卖", exact: true }).click();
  await page.getByRole("button", { name: "购买驯兽鞭" }).click();
  await page.locator(".commerce-quantity").getByRole("button", { name: "", exact: true }).nth(1).click();
  await page.getByRole("button", { name: /钻石 200/ }).click();
  await expect(page.getByRole("button", { name: "购买驯兽鞭" })).toContainText("限购 2/5");
  await page.getByRole("button", { name: /免费刷新/ }).click();
  await expect(page.getByRole("button", { name: "购买驯兽鞭" })).toContainText("限购 0/5");
  await page.getByRole("button", { name: "试炼商店", exact: true }).click();
  await expect(page.getByRole("button", { name: "购买仪式剑石" })).toBeVisible();
  expect(await page.locator(".overlay-body").evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("shop-shelves.png"), fullPage: true });
});

test("packages expose distinct daily war-soul growth privilege and monthly flows", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openLobbyTool(page, "特惠");
  await expect(page.getByRole("heading", { name: "礼包", exact: true })).toBeVisible();
  for (const name of ["每日礼包", "战魂礼包", "群雄礼包", "魂卡礼包", "战宠礼包", "魔兽礼包", "秘宝礼包"]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeAttached();
  }
  await page.getByRole("button", { name: "战魂礼包", exact: true }).click();
  await expect(page.locator(".package-row")).toHaveCount(3);
  await expect(page.getByText("限购 0/5").first()).toBeVisible();
  await page.getByRole("button", { name: "进入自选" }).first().click();
  await expect(page.locator(".soul-acquisition-v2")).toBeVisible();
  await expect(page.getByText("今日限购 0/5")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("war-soul-package-entry.png"), fullPage: true });
  await page.getByRole("button", { name: "关闭" }).click();

  await openLobbyTool(page, "特惠");
  await page.getByRole("button", { name: "成长礼包", exact: true }).click();
  const levelOne = page.locator(".growth-pack-row").first();
  await levelOne.getByRole("button", { name: "领取" }).click();
  await expect(levelOne.getByRole("button").first()).toBeDisabled();
  await page.getByRole("button", { name: /免费模拟 ¥98/ }).click();
  await page.locator(".commerce-confirm").getByRole("button", { name: /免费模拟 ¥98/ }).click();
  await expect(page.getByText(/模拟到账成功/)).toBeVisible();
  await levelOne.getByRole("button", { name: "领取" }).click();
  await page.getByRole("button", { name: "特权", exact: true }).click();
  await expect(page.getByText("高级月卡", { exact: true })).toBeVisible();
  await expect(page.getByText("黄金兽宠", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("privilege-packages.png"), fullPage: true });
});

test("battle pet has distinct training mutation and awakening loops", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".system-shortcuts").getByRole("button", { name: /^战宠$/ }).click();
  await expect(page.getByRole("heading", { name: "战宠", exact: true })).toBeVisible();
  await expect(page.locator(".battle-pet-view")).toBeVisible();
  await expect(page.locator(".pet-skill-slots button")).toHaveCount(0);
  const thumbGeometry = await page.evaluate(() => {
    const body = document.querySelector(".overlay-body")!.getBoundingClientRect();
    const tabs = document.querySelector(".pet-tabs")!.getBoundingClientRect();
    const actions = document.querySelector(".pet-main-actions")!.getBoundingClientRect();
    const buttons = [...document.querySelectorAll(".pet-tabs button, .pet-main-actions button")].map((element) => element.getBoundingClientRect());
    return {
      docked: Math.abs(tabs.bottom - body.bottom) <= 1,
      actionAboveTabs: actions.bottom <= tabs.top + 1,
      actionInLowerHalf: actions.top >= body.top + body.height * .5,
      fingerSized: buttons.every((button) => button.height >= 44)
    };
  });
  expect(thumbGeometry).toEqual({ docked: true, actionAboveTabs: true, actionInLowerHalf: true, fingerSized: true });
  await page.getByRole("button", { name: /单机补给/ }).click();
  await page.getByRole("button", { name: /培养 10 次/ }).click();
  await expect(page.locator(".toast")).toContainText("战宠培养 10 次");
  await expect(page.locator(".toast")).toContainText("战力 +");
  await page.screenshot({ path: testInfo.outputPath("battle-pet-train.png"), fullPage: true });

  await page.locator(".pet-tabs").getByRole("button", { name: "突变", exact: true }).click();
  await expect(page.locator(".pet-skill-slots button")).toHaveCount(4);
  await expect(page.locator(".pet-rate-strip")).toContainText("未突变");
  await expect(page.locator(".pet-rate-strip")).toContainText("90%");
  await page.locator(".pet-material-picker").getByRole("button", { name: /传说炼魂果/ }).click();
  await expect(page.locator(".pet-rate-strip")).toContainText("80%");
  await page.getByRole("button", { name: /突变第 1 槽/ }).click();
  await expect(page.locator(".toast")).toContainText("战宠突变");
  await page.screenshot({ path: testInfo.outputPath("battle-pet-mutation.png"), fullPage: true });

  await page.locator(".pet-tabs").getByRole("button", { name: "觉醒", exact: true }).click();
  await expect(page.locator(".pet-awaken-track > span")).toHaveCount(6);
  await expect(page.locator(".pet-awaken-rates")).toContainText("60%");
  await page.getByRole("button", { name: /觉醒一次/ }).click();
  await expect(page.locator(".toast")).toContainText("战宠觉醒");
  await page.screenshot({ path: testInfo.outputPath("battle-pet-awaken.png"), fullPage: true });
  await page.getByRole("button", { name: "关闭" }).click();
});

test("event exchanges remain usable", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openLobbyTool(page, "特惠");
  await page.getByRole("button", { name: "每日特价", exact: true }).click();
  await page.getByRole("button", { name: /活动通行补给/ }).click();
  await page.getByRole("button", { name: /免费模拟 ¥128/ }).click();
  await page.getByRole("button", { name: "关闭" }).click();
  await openLobbyTool(page, "活动");
  await expect(page.getByRole("heading", { name: "限时活动", exact: true })).toBeVisible();
  expect(await page.locator(".overlay-body").evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.getByRole("button", { name: "魔兽蛋 ×3" }).click();
  await expect(page.locator(".toast").getByText(/定点砸蛋/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("events.png"), fullPage: true });
});

test("twin towers has recruit, economy, combat and expansion decisions", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "玩法", exact: true }).click();
  await page.getByRole("button", { name: /^双塔奇兵/ }).click();
  await expect(page.getByRole("heading", { name: "双塔奇兵" })).toBeVisible();
  await page.getByRole("button", { name: /破阵·锋/ }).click();
  await page.getByRole("button", { name: /迎战第 1 波/ }).click();
  await expect(page.getByText(/我方造成/)).toBeVisible();
  await page.getByRole("button", { name: /扩建/ }).click();
  await expect(page.getByText(/战车扩建成功/)).toBeVisible();
  await expect(page.getByText("1/2 · 最多6张")).toBeVisible();
});

test("war soul supports exact packs, quality refine caps and a five-soul 100% forge", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await fundGrowth(page);
  await page.getByRole("button", { name: "战魂" }).click();
  await expect(page.getByRole("heading", { name: "战魂" })).toBeVisible();
  await page.getByRole("button", { name: /获取战魂/ }).click();
  await page.getByRole("button", { name: /乌云/ }).last().click();
  const buy = page.getByRole("button", { name: /免费模拟 ¥68/ });
  for (let index = 0; index < 5; index += 1) await buy.click();
  await expect(page.getByText("今日限购 5/5")).toBeVisible();
  await page.getByTitle("返回战魂").click();
  await expect(page.locator(".soul-roster button.selected")).toContainText("×5");
  await expect(page.getByRole("button", { name: "已出战" })).toBeDisabled();
  await page.waitForTimeout(3200);
  await page.screenshot({ path: testInfo.outputPath("war-soul-main.png"), fullPage: true });

  await page.locator(".soul-bottom-tabs").getByRole("button", { name: "精炼", exact: true }).click();
  await page.getByRole("button", { name: /一键填满/ }).click();
  await expect(page.locator(".refine-card-v2")).toHaveCount(6);
  await expect(page.locator(".refine-card-v2").first().locator("> div")).toHaveCount(4);
  await page.locator(".overlay-body").evaluate((element) => { element.scrollTop = 0; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: testInfo.outputPath("war-soul-refine.png"), fullPage: true });
  await page.getByTitle(/锁定第 1 组精炼/).click();
  await page.getByRole("button", { name: /一键回退未锁定/ }).click();
  await expect(page.locator(".refine-card-v2")).toHaveCount(1);
  await expect(page.getByText(/一键回退 5 组/)).toBeVisible();
  await page.getByRole("button", { name: /一键填满/ }).click();

  await page.locator(".soul-bottom-tabs").getByRole("button", { name: "合成", exact: true }).click();
  for (let index = 0; index < 3; index += 1) await page.getByRole("button", { name: "增加副战魂" }).click();
  await expect(page.locator(".soul-compose-orbit > i")).toHaveCount(4);
  await expect(page.getByText("100%", { exact: true }).first()).toBeVisible();
  await page.locator(".overlay-body").evaluate((element) => { element.scrollTop = 0; });
  await page.screenshot({ path: testInfo.outputPath("war-soul-compose.png"), fullPage: true });
  await page.getByRole("button", { name: /合成 · 100%/ }).click();
  await expect(page.getByText(/合成成功（100%）/)).toBeVisible();

  await page.locator(".soul-bottom-tabs").getByRole("button", { name: "图鉴", exact: true }).click();
  await expect(page.locator(".soul-codex-group button")).toHaveCount(24);
  for (const name of ["布朗", "尤弥尔", "死神", "阿努比斯", "青龙", "白虎", "朱雀", "玄武", "切茜娅", "海德拉"]) {
    await expect(page.locator(".soul-codex-group button").filter({ hasText: name })).toHaveCount(1);
  }
  await page.screenshot({ path: testInfo.outputPath("war-soul-codex.png"), fullPage: true });
  await page.locator(".overlay-body").evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(page.locator(".soul-codex-group").last().getByText("超凡级", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => {
    const body = document.querySelector(".overlay-body")!.getBoundingClientRect();
    const tabs = document.querySelector(".soul-bottom-tabs")!.getBoundingClientRect();
    return Math.abs(tabs.bottom - body.bottom) <= 1;
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("war-soul-codex-extraordinary.png"), fullPage: true });
});

test("beast rebuild follows the original board, drag, training and codex loop", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "魔兽" }).first().click();
  await expect(page.locator(".beast-rebuild-root")).toBeVisible();
  await expect(page.locator(".original-beast-grid > button")).toHaveCount(16);
  await expect(page.locator(".original-beast-grid > button.locked")).toHaveCount(8);
  await expect(page.locator(".original-egg")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "魔兽图鉴" })).toBeVisible();
  await expect(page.locator(".original-beast-topbar .resource-pill").nth(2)).toHaveAttribute("title", "超凡魔兽碎片");
  await page.waitForTimeout(260);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const selector of [".original-beast-grid", ".original-egg-dock"]) {
    const box = await page.locator(selector).boundingBox();
    if (!box) throw new Error(`${selector} is not visible`);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  }
  await page.screenshot({ path: testInfo.outputPath("beast-board-empty.png") });

  await page.getByRole("button", { name: "玩法说明" }).click();
  await expect(page.locator(".guide-dots > i")).toHaveCount(6);
  for (let index = 0; index < 5; index += 1) await page.getByRole("button", { name: "下一页" }).click();
  await expect(page.getByText("拖动与合成", { exact: true })).toBeVisible();
  await expect(page.getByText(/两只普通同品质魔兽/)).toBeVisible();
  await page.getByRole("button", { name: "关闭玩法说明" }).click();

  await page.getByRole("button", { name: "合成概率说明" }).click();
  await expect(page.getByText("合成超凡级魔兽", { exact: true })).toBeVisible();
  await expect(page.getByText("10%", { exact: true })).toBeVisible();
  await expect(page.getByText("合成史诗级魔兽", { exact: true })).toBeVisible();
  await expect(page.getByText("60%", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("beast-compose-rates.png") });
  await expect(page.getByText(/集齐 5 个碎片可合成 1 只随机基础超凡魔兽/)).toBeVisible();
  await page.getByRole("button", { name: "关闭合成概率说明" }).click();

  await page.getByRole("button", { name: "魔兽空间功能" }).click();
  await expect(page.getByRole("button", { name: "使用5个超凡魔兽碎片合成超凡魔兽" })).toBeDisabled();
  await page.getByRole("button", { name: /单机补给/ }).click();
  await page.getByRole("button", { name: /孵化10枚/ }).click();
  await expect.poll(() => page.locator(".original-beast-grid > button.beast, .original-beast-grid > button.spirit").count()).toBeGreaterThan(0);
  for (let index = 0; index < 4; index += 1) await page.getByRole("button", { name: /扩建兽栏/ }).click();
  await expect(page.locator(".original-beast-grid > button.locked")).toHaveCount(0);
  for (let index = 0; index < 6; index += 1) {
    const occupied = await page.locator(".original-beast-grid > button.beast, .original-beast-grid > button.spirit").count();
    if (occupied === 16) break;
    await page.getByRole("button", { name: /孵化10枚/ }).click();
  }
  await expect(page.locator(".original-beast-grid > button.beast, .original-beast-grid > button.spirit")).toHaveCount(16);
  await page.getByRole("button", { name: "关闭功能" }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: testInfo.outputPath("beast-board-filled.png") });
  await expect(page.locator(".original-beast-grid .piece-count").first()).toHaveText(/^1$/);

  const sourceSlot = page.locator(".original-beast-grid > button.beast").nth(0);
  const targetSlot = page.locator(".original-beast-grid > button.beast").nth(1);
  const sourceBox = await sourceSlot.boundingBox();
  const targetBox = await targetSlot.boundingBox();
  if (!sourceBox || !targetBox) throw new Error("beast slots are not visible for pointer drag");
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await expect(targetSlot).toHaveClass(/drag-target/);
  await page.mouse.up();
  await expect(page.locator(".original-drag-ghost")).toHaveCount(0);
  await expect(page.locator(".beast-inline-notice")).toContainText(/合成成功|合成失败/);

  const deploySource = page.locator(".original-beast-grid > button.beast").first();
  const deployBox = await deploySource.boundingBox();
  const altarBox = await page.locator(".original-altar").boundingBox();
  if (!deployBox || !altarBox) throw new Error("deploy drag targets are not visible");
  await page.mouse.move(deployBox.x + deployBox.width / 2, deployBox.y + deployBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(altarBox.x + altarBox.width / 2, altarBox.y + altarBox.height / 2, { steps: 10 });
  await expect(page.locator(".original-altar")).toHaveClass(/drag-target/);
  await page.mouse.up();
  await expect(page.locator(".original-altar .atlas-art")).toHaveCount(1);
  const returnTarget = page.locator(".original-beast-grid > button.empty").first();
  const returnBox = await returnTarget.boundingBox();
  const deployedBox = await page.locator(".original-altar").boundingBox();
  if (!returnBox || !deployedBox) throw new Error("undeploy drag targets are not visible");
  await page.mouse.move(deployedBox.x + deployedBox.width / 2, deployedBox.y + deployedBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(returnBox.x + returnBox.width / 2, returnBox.y + returnBox.height / 2, { steps: 10 });
  await expect(returnTarget).toHaveClass(/drag-target/);
  await page.mouse.up();
  await expect(page.locator(".original-altar .atlas-art")).toHaveCount(0);

  await page.getByRole("button", { name: "开启史诗级魔兽蛋" }).click();
  await expect(page.locator('.original-beast-grid > button[aria-label*="史诗"]')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath("beast-yellow-egg-epic.png") });

  await page.locator(".original-beast-grid > button.beast").first().click();
  await expect(page.getByText("每级属性成长")).toBeVisible();
  await expect(page.locator(".combat-skill-row button.locked:disabled")).toHaveCount(3);
  await page.locator(".combat-skill-row button.open").click();
  await expect(page.locator(".beast-skill-card")).toBeVisible();
  await page.getByRole("button", { name: "关闭战斗技能详情" }).click();
  await page.screenshot({ path: testInfo.outputPath("beast-detail.png") });
  await page.getByRole("button", { name: "锁定魔兽" }).click();
  await expect(page.getByRole("button", { name: "解除锁定" })).toBeVisible();
  await page.getByRole("button", { name: "解除锁定" }).click();
  await page.getByRole("button", { name: "放入出战格", exact: true }).click();
  await expect(page.getByRole("button", { name: "卸下出战", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "技能洗炼", exact: true }).click();
  await expect(page.getByLabel("官网公示洗炼概率")).toContainText("初级 70%中级 20%高级 10%");
  await page.getByRole("button", { name: /^洗炼/ }).click();
  await expect(page.locator(".beast-inline-notice")).toContainText(/已生成 4 条洗炼结果/);
  await page.getByRole("button", { name: /继续洗炼/ }).click();
  await expect(page.locator(".beast-inline-notice")).toContainText(/已生成 4 条洗炼结果/);
  await page.screenshot({ path: testInfo.outputPath("beast-wash.png") });
  await page.getByRole("button", { name: "替换", exact: true }).click();
  await expect(page.locator(".beast-inline-notice")).toContainText(/已替换/);
  await page.getByRole("button", { name: "魔兽吞噬", exact: true }).click();
  await expect(page.getByRole("button", { name: /吞噬材料位/ })).toHaveCount(5);
  await page.getByRole("button", { name: "一键选择" }).click();
  await expect(page.locator(".devour-materials button.filled")).toHaveCount(5);
  await page.getByRole("button", { name: "吞噬", exact: true }).click();
  await expect(page.locator(".beast-inline-notice")).toContainText(/吞噬 5 只魔兽/);
  await page.getByRole("button", { name: "使用精华", exact: true }).click();
  await expect(page.getByText(/1 精华 = 10 吞噬经验/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("beast-devour.png") });
  await page.getByRole("button", { name: "魔兽升阶", exact: true }).click();
  await expect(page.getByText("升阶条件", { exact: true })).toBeVisible();
  await expect(page.locator(".ascend-requirements > span")).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath("beast-ascend.png") });

  await page.locator(".original-beast-topbar .topbar-back").click();
  await page.getByRole("button", { name: "魔兽助战" }).click();
  await page.locator(".assist-roster button").first().click();
  await expect(page.locator(".original-assist-panel")).toContainText("1/3");
  await page.getByRole("button", { name: "关闭助战" }).click();
  await page.getByRole("button", { name: "魔兽图鉴" }).click();
  await expect(page.locator(".original-faction-orbs > button")).toHaveCount(4);
  await expect(page.locator(".codex-total-stats span")).toHaveCount(16);
  await expect(page.locator(".beast-inline-notice")).toHaveCount(0, { timeout: 4000 });
  await page.screenshot({ path: testInfo.outputPath("beast-codex-root.png") });
  const codexEntries = [
    ["自然系", 8, ["风灵", "坚果蝠", "小龙崽", "祝蝠", "小黑龙", "吸血魔灵", "火龙果", "翡翠龙", "史矛格", "史矛格", "史矛格", "史矛格", "黄金史矛格"]],
    ["元素系", 8, ["优秀经验精灵", "火灵", "精良经验精灵", "电灵", "稀有经验精灵", "火元素", "史诗经验精灵", "小火龙", "传说经验精灵", "冰霜龙", "完美经验精灵", "寒冰领主", "雷神", "雷神", "雷神", "雷神", "九霄雷神"]],
    ["暗影系", 6, ["大眼蝠", "雪幽灵", "古拉蝠", "幽灵法师", "电波龙", "梦魔", "德古拉", "德古拉", "德古拉", "德古拉", "血焰德古拉"]],
    ["传说系", 4, ["精灵龙", "幽灵公主", "月之祭司", "月之祭司", "月之祭司", "月之祭司", "暗月祭司"]]
  ] as const;
  const artPositions: string[] = [];
  for (const [faction, rows, names] of codexEntries) {
    await page.getByRole("button", { name: new RegExp(faction) }).click();
    await expect(page.locator(".original-faction-codex > section")).toHaveCount(rows);
    await expect(page.locator(".original-faction-codex section button")).toHaveCount(names.length);
    expect(await page.locator(".original-faction-codex section button strong").allTextContents()).toEqual([...names]);
    artPositions.push(...await page.locator(".original-faction-codex section button .atlas-art").evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).backgroundPosition)));
    await page.getByRole("button", { name: "返回", exact: true }).click();
  }
  expect(artPositions).toHaveLength(48);
  expect(new Set(artPositions).size).toBe(48);
  await page.getByRole("button", { name: /自然系/ }).click();
  await page.locator(".original-faction-codex button.found").first().click();
  await expect(page.locator(".original-codex-detail")).toBeVisible();
  await expect(page.getByRole("button", { name: "满阶" })).toBeVisible();
  await page.getByRole("button", { name: "满阶" }).click();
  await page.screenshot({ path: testInfo.outputPath("beast-codex-detail.png") });
  await page.getByRole("button", { name: "关闭图鉴详情" }).click();
  await page.screenshot({ path: testInfo.outputPath("beast-codex.png") });
});

test("extraordinary beasts awaken with real materials while ascension stays independent", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "魔兽" }).first().click();
  await page.getByRole("button", { name: "魔兽空间功能" }).click();
  await page.getByRole("button", { name: /单机补给/ }).click();

  const extraordinaryEgg = page.locator(".egg-vault-open").filter({ hasText: "超凡级魔兽蛋" });
  await expect(extraordinaryEgg).toBeEnabled();
  await extraordinaryEgg.click();
  await extraordinaryEgg.click();
  await extraordinaryEgg.click();
  await page.getByRole("button", { name: "关闭功能" }).click();

  const extraordinaryPieces = page.locator('.original-beast-grid > button.beast[aria-label*="超凡"]');
  await expect(extraordinaryPieces).toHaveCount(3);
  await extraordinaryPieces.first().click();
  await expect(page.getByRole("button", { name: "觉醒升星" })).toBeVisible();
  await page.getByRole("button", { name: "觉醒升星" }).click();

  await expect(page.locator(".awaken-material-slots > button:not(.locked)")).toHaveCount(1);
  await expect(page.locator(".awaken-inventory-panel > div > button")).toHaveCount(2);
  await expect(page.locator(".awaken-main-button")).toBeDisabled();
  await page.getByRole("button", { name: "一键放入" }).click();
  await expect(page.locator(".awaken-main-button")).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath("extraordinary-awaken-ready.png") });
  await page.locator(".awaken-main-button").click();
  await expect(page.locator(".awaken-rune > b")).toContainText("1星");
  await expect(page.getByText(/消耗 1 只超凡魔兽觉醒成功/)).toBeVisible();

  await page.getByRole("button", { name: "强化" }).last().click();
  await expect(page.locator(".strength-status-panel")).toContainText("强化等级");
  await expect(page.locator(".strength-status-panel")).toContainText("+0/10");
  await page.screenshot({ path: testInfo.outputPath("extraordinary-strengthen.png") });
  await page.getByRole("button", { name: "返回魔兽详情" }).click();
  await page.getByRole("button", { name: "魔兽升阶" }).click();
  await expect(page.getByRole("button", { name: "升阶", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /觉醒升星是独立培养/ })).toBeVisible();
});

test("soul cards recycle duplicates into three four-slot role rows", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await fundGrowth(page);
  await page.getByRole("button", { name: "玩法", exact: true }).click();
  await page.locator(".feature-grid").getByRole("button", { name: /^魂卡/ }).click();
  await expect(page.locator(".soul-card-formation-row")).toHaveCount(3);
  await expect(page.locator(".soul-card-formation-row > div > button")).toHaveCount(12);
  await page.waitForTimeout(250);
  await page.screenshot({ path: testInfo.outputPath("soul-card-formation.png") });
  await page.locator(".soul-card-nav").getByRole("button", { name: "召唤" }).click();
  for (let index = 0; index < 5; index += 1) await page.getByRole("button", { name: "召唤 10 次" }).click();
  await expect(page.getByText(/10 次魂卡召唤完成/)).toBeVisible();
  const recycle = page.getByRole("button", { name: /分解重复/ });
  await expect(recycle).toBeEnabled();
  await recycle.click();
  await expect(page.getByText(/魂晶 \+/)).toBeVisible();
  await page.locator(".soul-card-nav").getByRole("button", { name: "图鉴" }).click();
  await page.locator(".soul-card-codex .codex-card.owned").first().click();
  await page.locator(".soul-card-codex-detail").getByRole("button", { name: "镶嵌" }).click();
  await expect(page.locator(".soul-card-codex-detail").getByRole("button", { name: "卸下" })).toBeVisible();
  expect(await page.evaluate(() => {
    const body = document.querySelector(".overlay-body")!.getBoundingClientRect();
    const tabs = document.querySelector(".soul-card-nav")!.getBoundingClientRect();
    return Math.abs(tabs.bottom - body.bottom) <= 1;
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("soul-card-loop.png"), fullPage: true });
});

test("hunting unlocks a permanent codex and converts duplicate catches", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "玩法", exact: true }).click();
  await page.locator(".feature-grid").getByRole("button", { name: /^捕猎/ }).click();
  for (let index = 0; index < 10; index += 1) await page.getByRole("button", { name: "捕猎 10 次" }).click();
  await expect(page.getByText(/捕猎完成/)).toBeVisible();
  const sell = page.getByRole("button", { name: "一键出售" });
  await expect(sell).toBeEnabled();
  await sell.click();
  await expect(page.locator(".toast").getByText(/出售重复猎物/)).toBeVisible();
  await page.locator(".hunt-tabs").getByRole("button", { name: /图鉴/ }).click();
  await expect(page.locator(".hunting-codex article.unlocked").first()).toBeVisible();
  await expect(page.locator(".hunting-codex article.unlocked").first()).toContainText(/生命|攻击|防御|暴击|闪避|击晕|连击|反击|吸血|速度/);
  const artPositions = await page.locator(".hunting-codex .hunt-glyph.atlas-art").evaluateAll((nodes) => new Set(nodes.map((node) => (node as HTMLElement).style.backgroundPosition)).size);
  expect(artPositions).toBeGreaterThan(8);
  await page.screenshot({ path: testInfo.outputPath("hunting-codex.png"), fullPage: true });
});
