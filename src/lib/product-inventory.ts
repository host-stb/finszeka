import inventory from "../data/product-inventory.json";

export const PRODUCT_INVENTORY = inventory;
export const PHYSICAL_PRODUCTS = inventory.products.filter(product => product.included);
export const PHYSICAL_PRODUCT_MAP = new Map(PHYSICAL_PRODUCTS.map(product => [product.code, product]));

export const PRODUCT_BRANDS = [
  { key: "more-than", label: "More Than" },
  { key: "smart-caps", label: "Smart Caps" },
  { key: "raw-material", label: "Raw Material" },
  { key: "other", label: "Diğer Ürünler" },
] as const;
export type ProductBrand = typeof PRODUCT_BRANDS[number]["key"];

export function productBrand(code: string): ProductBrand {
  const product = PHYSICAL_PRODUCT_MAP.get(code);
  if (!product) return "other";
  // ADEK + Smart Caps probiotic is a mixed-brand bundle.
  if (code === "152MM.05.01.001" || code === "152MM.04.01.004") return "other";
  const names = product.logoNames.join(" ");
  if (/RAW\s+MATER[Iİ]AL/i.test(names)) return "raw-material";
  const moreThan = /MORE\s+THAN/i.test(names);
  const smartCaps = /SMART\s+CAPS/i.test(names);
  if (moreThan === smartCaps) return "other";
  return moreThan ? "more-than" : "smart-caps";
}

export function groupProductsByBrand<T extends { code: string }>(products: readonly T[]) {
  return PRODUCT_BRANDS.map(brand => ({
    ...brand,
    products: products.filter(product => productBrand(product.code) === brand.key),
  }));
}
