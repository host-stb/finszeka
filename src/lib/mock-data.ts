import { CompanyReport, CompanySummary, Month, MONTHS, ReportRow } from "./types";

// ---------------------------------------------------------------------------
// Bu dosya SADECE demo/geliştirme amaçlıdır. Gerçek FastAPI (satzeka / Logo)
// bağlandığında bu veriler kullanılmaz — bkz. src/app/api/report/route.ts ve
// proje kökündeki README.md.
// ---------------------------------------------------------------------------

type ItemDef = {
  label: string;
  faaliyet: "Faaliyet İçi" | "Faaliyet Dışı";
  values: Partial<Record<Month, number>>;
};

type CategoryDef = {
  label: string;
  items: ItemDef[];
};

function sumMonths(
  rows: { values: Partial<Record<Month, number | null>> }[]
): Partial<Record<Month, number>> {
  const out: Partial<Record<Month, number>> = {};
  for (const m of MONTHS) {
    let sum = 0;
    let any = false;
    for (const r of rows) {
      const v = r.values[m];
      if (v != null) {
        sum += v;
        any = true;
      }
    }
    if (any) out[m] = Math.round(sum * 100) / 100;
  }
  return out;
}

function buildCategory(id: string, def: CategoryDef): ReportRow[] {
  const itemRows: ReportRow[] = def.items.map((item, i) => ({
    id: `${id}-item-${i}`,
    label: item.label,
    faaliyet: item.faaliyet,
    kind: "item",
    values: item.values,
  }));
  const categoryRow: ReportRow = {
    id: `${id}-cat`,
    label: def.label,
    kind: "category",
    values: sumMonths(itemRows),
  };
  return [categoryRow, ...itemRows];
}

function buildTotal(id: string, categoryRows: ReportRow[][]): ReportRow {
  const categoryTotals = categoryRows.map((rows) => rows[0]);
  return {
    id: `${id}-total`,
    label: "GİRDİLER TOPLAM",
    kind: "total",
    values: sumMonths(categoryTotals),
  };
}

// ---------------------------------------------------------------------------
// HOLİMER
// ---------------------------------------------------------------------------

function holimerReport(): CompanyReport {
  const pazaryeri = buildCategory("hol-pazaryeri", {
    label: "PAZARYERİ",
    items: [
      {
        label: "Holistikmarket - Amazon",
        faaliyet: "Faaliyet İçi",
        values: { Ocak: 20116.5, Nisan: 40301.64, Mayıs: 63246.66, Haziran: 50547.8 },
      },
      {
        label: "Holistikmarket - Hepsiburada",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 783712.9,
          Şubat: 542920.6,
          Mart: 556495.6,
          Nisan: 636199.58,
          Mayıs: 408017.41,
          Haziran: 273943.46,
        },
      },
      {
        label: "Holistikmarket - N11",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 11244.2,
          Şubat: 5185.8,
          Mart: 11581.47,
          Nisan: 8621.03,
          Mayıs: 892.07,
          Haziran: 1111.5,
        },
      },
      {
        label: "Holistikmarket - Pazarama",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 60439.65,
          Şubat: 15695.07,
          Mart: 28218.81,
          Nisan: 18674.77,
          Mayıs: 10554.31,
          Haziran: 13888.5,
        },
      },
      {
        label: "Holistikmarket - PttAVM",
        faaliyet: "Faaliyet İçi",
        values: { Ocak: 70051.98, Şubat: 2951.15, Mart: 3055.39, Haziran: 1196.0 },
      },
      {
        label: "Holistikmarket - Trendyol",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 2753654.1,
          Şubat: 1530141.9,
          Mart: 2276854.65,
          Nisan: 2425137.1,
          Mayıs: 1411786.72,
          Haziran: 965728.74,
        },
      },
    ],
  });

  const eticaret = buildCategory("hol-eticaret", {
    label: "E-TİCARET",
    items: [
      {
        label: "Destekurunleri.com e-ticaret",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 4272384.9,
          Şubat: 3685757.8,
          Mart: 4727482.51,
          Nisan: 3838486.14,
          Mayıs: 2726620.23,
          Haziran: 3140662.15,
        },
      },
      {
        label: "Holistik e-ticaret",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 9401132.7,
          Şubat: 7628189.0,
          Mart: 8789302.69,
          Nisan: 8285977.93,
          Mayıs: 6633075.88,
          Haziran: 6159881.48,
        },
      },
    ],
  });

  const cariSatis = buildCategory("hol-cari", {
    label: "CARİ SATIŞ",
    items: [
      {
        label: "Diğer",
        faaliyet: "Faaliyet Dışı",
        values: {
          Ocak: 112711.86,
          Şubat: 114080.66,
          Mart: 123571.02,
          Nisan: 1765680.69,
          Mayıs: 616216.17,
          Haziran: 15596.47,
        },
      },
      {
        label: "Diğer-Bina Kira",
        faaliyet: "Faaliyet Dışı",
        values: {
          Ocak: 771037.6,
          Şubat: 10000.0,
          Mart: 404525.9,
          Nisan: 404422.4,
          Mayıs: 405710.8,
          Haziran: 404816.1,
        },
      },
      {
        label: "Gıda Takviyesi",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 353643.6,
          Şubat: 186515.1,
          Mart: 222624.5,
          Nisan: 201140.9,
          Mayıs: 127080.7,
          Haziran: 214906.2,
        },
      },
      { label: "Hammadde", faaliyet: "Faaliyet İçi", values: {} },
      {
        label: "Medikal Cihaz",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 55833.33,
          Şubat: 919090.73,
          Mart: 3126477.28,
          Nisan: 2622034.48,
          Mayıs: 645444.5,
          Haziran: 78487.0,
        },
      },
      {
        label: "Akapunktur İğneleri",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 165504.76,
          Şubat: 188870.79,
          Mart: 260841.85,
          Nisan: 252874.83,
          Mayıs: 197792.51,
          Haziran: 304446.3,
        },
      },
      {
        label: "Medikal Sarf Malzemeleri",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 1565563.81,
          Şubat: 1324364.56,
          Mart: 601389.87,
          Nisan: 872245.83,
          Mayıs: 1360407.68,
          Haziran: 854865.3,
        },
      },
      {
        label: "Teknik",
        faaliyet: "Faaliyet İçi",
        values: { Şubat: 29635.21, Mayıs: 104847.95 },
      },
      {
        label: "Kitap",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 77170.05,
          Şubat: 36716.65,
          Mart: 55393.77,
          Nisan: 35198.98,
          Mayıs: 21830.66,
          Haziran: 16843.2,
        },
      },
    ],
  });

  const anfora = buildCategory("hol-anfora", {
    label: "Anfora Sağlık Hizmetleri İnşaat Turizm Sanayi Ticaret Limited Şirketi",
    items: [{ label: "Diğer", faaliyet: "Faaliyet İçi", values: { Nisan: 2150000, Mayıs: 1250000 } }],
  });
  const ebVital = buildCategory("hol-ebvital", {
    label: "EB Vital Turizm Tarım İnşaat Anonim Şirketi",
    items: [{ label: "Gıda Takviyesi", faaliyet: "Faaliyet İçi", values: { Mart: 1098681.71 } }],
  });
  const fwIlac = buildCategory("hol-fwilac", {
    label: "Fw İlaç A.Ş.",
    items: [
      { label: "Diğer", faaliyet: "Faaliyet Dışı", values: { Ocak: 74642.9, Nisan: 91377.3 } },
      {
        label: "Gıda Takviyesi",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 2417282.2,
          Şubat: 1074245.9,
          Mart: 816460.7,
          Nisan: 782833.9,
          Mayıs: 704934.9,
          Haziran: 735676.1,
        },
      },
    ],
  });
  const saglikTek = buildCategory("hol-saglikteknoloji", {
    label: "Sağlık Teknolojileri",
    items: [{ label: "Diğer", faaliyet: "Faaliyet Dışı", values: { Ocak: 445.0, Nisan: 233693.74 } }],
  });

  const grupFirmalarChildren = [...anfora, ...ebVital, ...fwIlac, ...saglikTek];
  const grupFirmalarCategory: ReportRow = {
    id: "hol-grup-cat",
    label: "GRUP FİRMALAR",
    kind: "category",
    values: sumMonths([anfora[0], ebVital[0], fwIlac[0], saglikTek[0]]),
  };

  const categoryTops = [pazaryeri[0], eticaret[0], cariSatis[0], grupFirmalarCategory];
  const total: ReportRow = {
    id: "hol-total",
    label: "GİRDİLER TOPLAM",
    kind: "total",
    values: sumMonths(categoryTops),
  };

  return {
    companyId: "holimer",
    companyName: "Holimer",
    period: "2026",
    columnTitle: "HOLİMER GELİRLER",
    generatedAt: new Date().toISOString(),
    rows: [
      ...pazaryeri,
      ...eticaret,
      ...cariSatis,
      grupFirmalarCategory,
      ...grupFirmalarChildren,
      total,
    ],
  };
}

// ---------------------------------------------------------------------------
// FW İLAÇ A.Ş.
// ---------------------------------------------------------------------------

function fwReport(): CompanyReport {
  const cariSatis = buildCategory("fw-cari", {
    label: "CARİ SATIŞ",
    items: [
      { label: "Diğer", faaliyet: "Faaliyet Dışı", values: { Ocak: 74642.9, Nisan: 91377.3 } },
      {
        label: "Gıda Takviyesi",
        faaliyet: "Faaliyet İçi",
        values: {
          Ocak: 2417282.2,
          Şubat: 1074245.9,
          Mart: 816460.7,
          Nisan: 782833.9,
          Mayıs: 704934.9,
          Haziran: 735676.1,
        },
      },
      { label: "Kitap", faaliyet: "Faaliyet İçi", values: { Mart: 12500.0, Mayıs: 8300.5 } },
    ],
  });

  const grupFirmalar = buildCategory("fw-grup", {
    label: "GRUP FİRMALAR",
    items: [
      { label: "Holimer'e Aktarım", faaliyet: "Faaliyet İçi", values: { Nisan: 350000, Mayıs: 210000 } },
    ],
  });

  const total = buildTotal("fw", [cariSatis, grupFirmalar]);

  return {
    companyId: "fw",
    companyName: "FW",
    period: "2026",
    columnTitle: "FW İLAÇ GELİRLER",
    generatedAt: new Date().toISOString(),
    rows: [...cariSatis, ...grupFirmalar, total],
  };
}

// ---------------------------------------------------------------------------
// STB VITAL (Sağlık Teknolojileri)
// ---------------------------------------------------------------------------

function stbVitalReport(): CompanyReport {
  const cariSatis = buildCategory("stb-cari", {
    label: "CARİ SATIŞ",
    items: [
      { label: "Diğer", faaliyet: "Faaliyet Dışı", values: { Ocak: 445.0, Nisan: 233693.74 } },
      { label: "Medikal Cihaz", faaliyet: "Faaliyet İçi", values: { Mart: 18500.0, Mayıs: 9450.0 } },
    ],
  });

  const total = buildTotal("stb", [cariSatis]);

  return {
    companyId: "stb-vital",
    companyName: "STB Vital",
    period: "2026",
    columnTitle: "STB VITAL GELİRLER",
    generatedAt: new Date().toISOString(),
    rows: [...cariSatis, total],
  };
}

const REPORT_BUILDERS: Record<string, () => CompanyReport> = {
  holimer: holimerReport,
  fw: fwReport,
  "stb-vital": stbVitalReport,
};

export const MOCK_COMPANIES: CompanySummary[] = [
  { id: "holimer", name: "Holimer" },
  { id: "fw", name: "FW" },
  { id: "stb-vital", name: "STB Vital" },
];

export function getMockReport(companyId: string): CompanyReport | null {
  const builder = REPORT_BUILDERS[companyId];
  if (!builder) return null;
  return builder();
}
