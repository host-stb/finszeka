import { NextRequest, NextResponse } from "next/server";
import { deleteHesapPlaniKalemi, updateHesapPlaniKalemi } from "@/lib/hesap-plani-store";
import { validateHesapPlaniGirdi } from "@/lib/hesap-plani-validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Var olan bir hesap planı kalemini günceller. Gövde: { kod, ad, anaGrup, tanim, raporKategorisi? } */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const result = validateHesapPlaniGirdi(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  try {
    const data = await updateHesapPlaniKalemi(id, result.girdi);
    if (!data) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[api/hesap-plani/:id] kayıt güncellenemedi:", err);
    return NextResponse.json({ error: "Kayıt güncellenemedi" }, { status: 500 });
  }
}

/** Bir hesap planı kalemini siler. */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const ok = await deleteHesapPlaniKalemi(id);
    if (!ok) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error("[api/hesap-plani/:id] kayıt silinemedi:", err);
    return NextResponse.json({ error: "Kayıt silinemedi" }, { status: 500 });
  }
}
