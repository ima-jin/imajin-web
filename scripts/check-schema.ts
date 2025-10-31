import { sql } from "drizzle-orm";
import { getDb } from "@/db";

async function checkSchema() {
  try {
    const db = getDb();

    // Check if products table exists and get its columns
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);

    console.log("Products table columns:");
    console.log(JSON.stringify(result, null, 2));

    // Try a simple insert to see the actual error
    console.log("\nTrying a test insert...");
    try {
      await db.execute(sql`
        INSERT INTO products (
          id, name, description, category, dev_status,
          base_price, is_active, requires_assembly, has_variants,
          is_live, media
        ) VALUES (
          'test-product', 'Test', 'Test product', 'test', 5,
          1000, true, false, false, true, '[]'::jsonb
        )
      `);
      console.log("✓ Test insert succeeded");

      // Clean up
      await db.execute(sql`DELETE FROM products WHERE id = 'test-product'`);
    } catch (insertError: unknown) {
      console.error("✗ Test insert failed:");
      if (insertError instanceof Error) {
        console.error("Error message:", insertError.message);
        console.error("Full error:", insertError);
      } else {
        console.error("Full error:", insertError);
      }
    }
  } catch (error) {
    console.error("Error checking schema:", error);
  } finally {
    process.exit(0);
  }
}

checkSchema();
