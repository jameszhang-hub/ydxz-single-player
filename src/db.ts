import Dexie, { type Table } from "dexie";
import type { GameSaveV1, SimulatedOrder } from "./types";

interface SaveRow { id: "main"; value: GameSaveV1 }
interface SettingRow { key: string; value: unknown }

class GameDatabase extends Dexie {
  saves!: Table<SaveRow, string>;
  orders!: Table<SimulatedOrder, string>;
  settings!: Table<SettingRow, string>;

  constructor() {
    super("ydxz-single-player-v1");
    this.version(1).stores({ saves: "id", orders: "id,createdAt,productId", settings: "key" });
  }
}

export const db = new GameDatabase();

export async function loadSave() {
  return (await db.saves.get("main"))?.value;
}

export async function writeSave(save: GameSaveV1) {
  await db.transaction("rw", db.saves, db.orders, async () => {
    await db.saves.put({ id: "main", value: save });
    if (save.orders.length) await db.orders.bulkPut(save.orders.slice(-25));
  });
}

export async function clearSave() {
  await db.transaction("rw", db.saves, db.orders, async () => {
    await db.saves.clear();
    await db.orders.clear();
  });
}
