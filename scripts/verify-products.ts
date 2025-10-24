#!/usr/bin/env tsx

import { db } from "@/db";
import { products, variants } from "@/db/schema";

async function verifyProducts() {
  console.log("🔍 Verifying products in database...\n");

  const allProducts = await db.select().from(products);
  const allVariants = await db.select().from(variants);

  console.log(`📦 Total products: ${allProducts.length}`);
  console.log(`🎨 Total variants: ${allVariants.length}\n`);

  console.log("Products by dev_status:");
  for (let status = 0; status <= 5; status++) {
    const count = allProducts.filter((p) => p.devStatus === status).length;
    if (count > 0) {
      console.log(`  Status ${status}: ${count} products`);
    }
  }

  console.log("\nProducts ready to sell (dev_status = 5):");
  const readyProducts = allProducts.filter((p) => p.devStatus === 5);
  readyProducts.forEach((p) => {
    console.log(`  - ${p.id}: ${p.name} ($${(p.basePrice / 100).toFixed(2)})`);
  });

  if (allVariants.length > 0) {
    console.log("\nVariants:");
    allVariants.forEach((v) => {
      console.log(`  - ${v.id}: ${v.variantValue} (${v.maxQuantity || "unlimited"} max)`);
    });
  }

  process.exit(0);
}

verifyProducts();
