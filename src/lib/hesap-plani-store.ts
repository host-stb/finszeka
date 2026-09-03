// Hesap planı kalemleri için basit dosya tabanlı (JSON) depolama.
//
// Neden veritabanı değil: bu proje şu an hiçbir kendi veritabanına sahip
// değil (gerçek veri FastAPI/Logo'dan salt-okunur çekiliyor). Hesap planı
// ise Aydın'ın elle girdiği/düzenlediği bir referans listesi olduğu için en
// basit çözüm repo içinde bir JSON dosyasında tutmak: yerel geliştirmede
// (bu bilgisayarda) kalıcıdır ve git'e commit edilip deploy edilince canlıya
// da yansır. Vercel gibi salt-okunur/geçici dosya sistemi olan bir ortamda
// çalışırken yapılan bir ekleme/düzenleme, dosya commit edilmediği sürece bir
// sonraki deploy'da kaybolur — bu bilinçli bir basitleştirme (bkz. README.md).

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { HesapPlaniGirdi, HesapPlaniKalemi } from "./hesap-plani-types";

const DATA_PATH = path.join(process.cwd(), "src", "data", "hesap-plani.json");

async function readAll(): Promise<HesapPlaniKalemi[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HesapPlaniKalemi[]) : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    console.error("[hesap-plani-store] veri dosyası okunamadı, boş liste dönülüyor:", err);
    return [];
  }
}

async function writeAll(items: HesapPlaniKalemi[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, `${JSON.stringify(items, null, 2)}\n`, "utf-8");
}

/** Kod'a göre alfabetik/sayısal sıralanmış tüm kalemler. */
export async function listHesapPlani(): Promise<HesapPlaniKalemi[]> {
  const items = await readAll();
  return [...items].sort((a, b) => a.kod.localeCompare(b.kod, "tr", { numeric: true }));
}

export async function createHesapPlaniKalemi(girdi: HesapPlaniGirdi): Promise<HesapPlaniKalemi> {
  const items = await readAll();
  const now = new Date().toISOString();
  const kalem: HesapPlaniKalemi = {
    id: randomUUID(),
    ...girdi,
    olusturmaTarihi: now,
    guncellemeTarihi: now,
  };
  items.push(kalem);
  await writeAll(items);
  return kalem;
}

export async function updateHesapPlaniKalemi(
  id: string,
  girdi: HesapPlaniGirdi
): Promise<HesapPlaniKalemi | null> {
  const items = await readAll();
  const idx = items.findIndex((k) => k.id === id);
  if (idx === -1) return null;

  const guncellenen: HesapPlaniKalemi = {
    ...items[idx],
    ...girdi,
    guncellemeTarihi: new Date().toISOString(),
  };
  items[idx] = guncellenen;
  await writeAll(items);
  return guncellenen;
}

export async function deleteHesapPlaniKalemi(id: string): Promise<boolean> {
  const items = await readAll();
  const next = items.filter((k) => k.id !== id);
  if (next.length === items.length) return false;
  await writeAll(next);
  return true;
}
