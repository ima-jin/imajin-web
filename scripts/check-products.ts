import { getDb } from "../db/index.js";
import { products, variants } from "../db/schema.js";

async function checkProducts() {
  const db = getDb();

  const prods = await db.select().from(products);
  const vars = await db.select().from(variants);

  console.log("Total products:", prods.length);
  console.log("Total variants:", vars.length);
  console.log("Products with hasVariants=true:", prods.filter(p => p.hasVariants).length);

  const founderProduct = prods.find(p => p.hasVariants === true);
  if (founderProduct) {
    console.log("\nFounder product found:", founderProduct.id);
    console.log("Variants for founder:", vars.filter(v => v.productId === founderProduct.id).length);
    console.log("\nFounder media:");
    console.log(JSON.stringify(founderProduct.media, null, 2));
  } else {
    console.log("\nNo product with hasVariants=true found!");
  }

  process.exit(0);
}

checkProducts();
