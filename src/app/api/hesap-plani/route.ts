import { NextRequest, NextResponse } from "next/server";
import { createHesapPlaniKalemi, listHesapPlani } from "@/lib/hesap-plani-store";
import { validateHesapPlaniGirdi } from "@/lib/hesap-plani-validate";

// fs kullandığımız için Node.js runtime zorunlu (Edge'de çalışmaz).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tüm hesap planı kalemlerini (kod'a göre sıralı) döner. */
export async function GET() {
  try {
    const data = await listHesapPlani();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[api/hesap-plani] liste okunamadı:", err);
    return NextResponse.json({ error: "Hesap planı okunamadı" }, { status: 500 });
  }
}

/** Yeni bir hesap planı kalemi ekler. Gövde: { kod, ad, anaGrup, tanim, raporKategorisi? } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = validateHesapPlaniGirdi(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  try {
    const data = await createHesapPlaniKalemi(result.girdi);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("[api/hesap-plani] kayıt eklenemedi:", err);
    return NextResponse.json({ error: "Kayıt eklenemedi" }, { status: 500 });
  }
}
