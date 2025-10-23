import { db } from "./index";
import { products, variants, productDependencies, productSpecs, portfolioItems } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Seed Products
    console.log("📦 Seeding products...");
    await db.insert(products).values([
      {
        id: "Material-8x8-V",
        name: "8x8 Void Panel",
        description: "Modular LED panel with 64 individually addressable LEDs",
        category: "material",
        devStatus: 5,
        basePrice: 3500, // $35.00
        isActive: true,
        requiresAssembly: false,
        hasVariants: false,
      },
      {
        id: "Control-2-5v",
        name: "2-Output Control (5v)",
        description: "ESP32-based control unit for small fixtures (8-10 panels)",
        category: "control",
        devStatus: 1,
        basePrice: 4500, // $45.00
        isActive: false, // Not ready for sale yet
        requiresAssembly: false,
        hasVariants: false,
      },
      {
        id: "Control-8-24v",
        name: "8-Output Control (24v)",
        description: "Scalable control unit for large fixtures (64-80 panels)",
        category: "control",
        devStatus: 5,
        basePrice: 12500, // $125.00
        isActive: true,
        requiresAssembly: false,
        hasVariants: false,
      },
      {
        id: "Connect-4x31.6-5v",
        name: "4-Lane Spine Connector (5v)",
        description: "Connector for linking Material-8x8-V panels in 5v systems",
        category: "connector",
        devStatus: 5,
        basePrice: 1500, // $15.00
        isActive: true,
        requiresAssembly: false,
        hasVariants: false,
      },
      {
        id: "Connect-4x31.6-24v",
        name: "4-Lane Spine Connector (24v)",
        description: "Connector for linking Material-8x8-V panels in 24v systems",
        category: "connector",
        devStatus: 5,
        basePrice: 1500, // $15.00
        isActive: true,
        requiresAssembly: false,
        hasVariants: false,
      },
      {
        id: "Diffuse-12-C",
        name: "Diffusion Cap (Clear)",
        description: "Round diffusion caps for individual LEDs",
        category: "diffuser",
        devStatus: 5,
        basePrice: 10, // $0.10 each (typically sold in packs)
        isActive: true,
        requiresAssembly: false,
        hasVariants: false,
      },
      {
        id: "Unit-8x8x8-Founder",
        name: "Founder Edition Cube",
        description: "Limited edition 8x8x8 cube with MJN NFT token and 10-year warranty",
        category: "kit",
        devStatus: 5,
        basePrice: 99500, // $995.00
        isActive: true,
        requiresAssembly: false,
        hasVariants: true,
      },
      {
        id: "Kit-DIY-8x8x8",
        name: "DIY 8x8x8 Cube Kit",
        description: "Self-assembly kit for 8x8x8 cube fixture",
        category: "kit",
        devStatus: 5,
        basePrice: 75000, // $750.00
        isActive: true,
        requiresAssembly: true,
        hasVariants: false,
      },
    ]);

    // Seed Variants (for Founder Edition)
    console.log("🎨 Seeding variants...");
    await db.insert(variants).values([
      {
        id: "Unit-8x8x8-Founder-Black",
        productId: "Unit-8x8x8-Founder",
        stripeProductId: "prod_founder_black", // Replace with real Stripe ID
        variantType: "color",
        variantValue: "BLACK",
        priceModifier: 0,
        isLimitedEdition: true,
        maxQuantity: 500,
        soldQuantity: 0,
      },
      {
        id: "Unit-8x8x8-Founder-White",
        productId: "Unit-8x8x8-Founder",
        stripeProductId: "prod_founder_white", // Replace with real Stripe ID
        variantType: "color",
        variantValue: "WHITE",
        priceModifier: 0,
        isLimitedEdition: true,
        maxQuantity: 300,
        soldQuantity: 0,
      },
      {
        id: "Unit-8x8x8-Founder-Red",
        productId: "Unit-8x8x8-Founder",
        stripeProductId: "prod_founder_red", // Replace with real Stripe ID
        variantType: "color",
        variantValue: "RED",
        priceModifier: 0,
        isLimitedEdition: true,
        maxQuantity: 200,
        soldQuantity: 0,
      },
    ]);

    // Seed Product Dependencies
    console.log("🔗 Seeding product dependencies...");
    await db.insert(productDependencies).values([
      {
        productId: "Connect-4x31.6-5v",
        dependsOnProductId: "Material-8x8-V",
        dependencyType: "requires",
        message: "Requires Material-8x8-V panels to connect",
      },
      {
        productId: "Connect-4x31.6-5v",
        dependsOnProductId: "Control-2-5v",
        dependencyType: "voltage_match",
        message: "Must use with 5v control unit",
      },
      {
        productId: "Connect-4x31.6-24v",
        dependsOnProductId: "Material-8x8-V",
        dependencyType: "requires",
        message: "Requires Material-8x8-V panels to connect",
      },
      {
        productId: "Connect-4x31.6-24v",
        dependsOnProductId: "Control-8-24v",
        dependencyType: "voltage_match",
        message: "Must use with 24v control unit",
      },
      {
        productId: "Material-8x8-V",
        dependsOnProductId: "Diffuse-12-C",
        dependencyType: "suggests",
        message: "Recommended: 64 diffusion caps per panel",
        metadata: { quantityRatio: 64 },
      },
      {
        productId: "Connect-4x31.6-5v",
        dependsOnProductId: "Connect-4x31.6-24v",
        dependencyType: "incompatible",
        message: "Cannot mix 5v and 24v components in same fixture",
      },
    ]);

    // Seed Product Specs
    console.log("📋 Seeding product specs...");
    await db.insert(productSpecs).values([
      // Material-8x8-V specs
      {
        productId: "Material-8x8-V",
        specKey: "dimensions",
        specValue: "240 x 240",
        specUnit: "mm",
        displayOrder: 1,
      },
      {
        productId: "Material-8x8-V",
        specKey: "led_count",
        specValue: "64",
        specUnit: "LEDs",
        displayOrder: 2,
      },
      {
        productId: "Material-8x8-V",
        specKey: "spacing",
        specValue: "31.6",
        specUnit: "mm",
        displayOrder: 3,
      },
      {
        productId: "Material-8x8-V",
        specKey: "led_type",
        specValue: "WS2812B",
        specUnit: null,
        displayOrder: 4,
      },

      // Control-2-5v specs
      {
        productId: "Control-2-5v",
        specKey: "voltage",
        specValue: "5",
        specUnit: "v",
        displayOrder: 1,
      },
      {
        productId: "Control-2-5v",
        specKey: "max_panels",
        specValue: "8-10",
        specUnit: "panels",
        displayOrder: 2,
      },
      {
        productId: "Control-2-5v",
        specKey: "outputs",
        specValue: "2",
        specUnit: "ESP32 outputs",
        displayOrder: 3,
      },

      // Control-8-24v specs
      {
        productId: "Control-8-24v",
        specKey: "voltage",
        specValue: "24",
        specUnit: "v",
        displayOrder: 1,
      },
      {
        productId: "Control-8-24v",
        specKey: "max_panels",
        specValue: "64-80",
        specUnit: "panels",
        displayOrder: 2,
      },
      {
        productId: "Control-8-24v",
        specKey: "outputs",
        specValue: "8",
        specUnit: "ESP32 outputs",
        displayOrder: 3,
      },

      // Founder Edition specs
      {
        productId: "Unit-8x8x8-Founder",
        specKey: "dimensions",
        specValue: "240 x 240 x 240",
        specUnit: "mm",
        displayOrder: 1,
      },
      {
        productId: "Unit-8x8x8-Founder",
        specKey: "total_leds",
        specValue: "384",
        specUnit: "LEDs",
        displayOrder: 2,
      },
      {
        productId: "Unit-8x8x8-Founder",
        specKey: "warranty",
        specValue: "10",
        specUnit: "years",
        displayOrder: 3,
      },
      {
        productId: "Unit-8x8x8-Founder",
        specKey: "nft_included",
        specValue: "Yes",
        specUnit: null,
        displayOrder: 4,
      },
    ]);

    // Seed Portfolio Items (sample)
    console.log("🖼️ Seeding portfolio items...");
    await db.insert(portfolioItems).values([
      {
        slug: "sample-installation-toronto",
        title: "Sample Installation - Toronto",
        description: "A stunning LED installation at a Toronto venue",
        content:
          "This is sample content for a portfolio item. In production, this would contain detailed information about the installation.",
        category: "installation",
        location: "Toronto, ON",
        year: 2024,
        featuredImageUrl: null, // Add Cloudinary URL when available
        isPublished: true,
        isFeatured: true,
        displayOrder: 1,
      },
    ]);

    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
