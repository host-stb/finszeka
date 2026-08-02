// Gerçek satış verisinde ayrı bir "kategori" alanı olmadığı için, cari hesap
// unvanına bakarak (Trendyol, Hepsiburada, grup firmaları vb.) en iyi çaba
// (best-effort) ile kategori tahmini yapılır. Yakalanamayan tutarlar
// "Diğer (sınıflandırılmamış)" kalemine düşer, böylece kategori toplamları
// her zaman gerçek genel toplamla birebir tutar.
//
// Anahtar kelimeleri Logo'daki gerçek cari unvanlarına göre güncelleyebilirsiniz.

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  {
    category: "Pazaryeri",
    keywords: [
      "trendyol",
      "hepsiburada",
      "amazon",
      "n11",
      "pazarama",
      "pttavm",
      "pazar yeri",
      "pazaryeri",
    ],
  },
  {
    category: "Grup Firmalar",
    keywords: [
      "anfora",
      "vital sağlıklı",
      "vital saglikli",
      "fw ilaç",
      "fw ilac",
      "fw i̇laç",
      "sağlık teknoloji",
      "saglik teknoloji",
    ],
  },
  {
    category: "E-Ticaret",
    keywords: ["ticimax", "holistik.com", "holistikmarket.com", "destekurunleri", "e-ticaret"],
  },
];

export function classifyCari(unvan: string): string {
  const u = unvan.toLocaleLowerCase("tr");
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => u.includes(k))) return rule.category;
  }
  return "Cari Satış";
}
