import inventory from "../data/product-inventory.json";

export const PRODUCT_INVENTORY = inventory;
export const PHYSICAL_PRODUCTS = inventory.products.filter(product => product.included);
export const PHYSICAL_PRODUCT_MAP = new Map(PHYSICAL_PRODUCTS.map(product => [product.code, product]));
