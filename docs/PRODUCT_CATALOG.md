# Product Catalog

**Purpose:** This document serves as a product thinking and organizational tool. It captures product ideas, specifications, and business rules to inform implementation. The actual product data will be managed in JSON configuration files that sync to the database.

## Current Product Lineup

### Development Status Legend

- **0** - Noted as TODO (concept stage)
- **1** - POC (Proof of Concept) complete
- **2** - Rendering complete (design finalized)
- **3** - Prototype built
- **4** - Prototype tested
- **5** - Ready to sell

**Note:** Only products with `dev_status = 5` will be displayed on the public site.

---

## Product Categories

### 1. Control Panel Wall Interface

| Product ID     | Name           | Price  | Dev Status | Description         |
| -------------- | -------------- | ------ | ---------- | ------------------- |
| Interface-Case | Interface Case | $18.00 | 0          | Wall interface case |
| Interface-PCB  | Interface PCB  | $15.00 | 0          | Wall interface PCB  |

---

### 2. PCB Panels with LEDs (Material)

| Product ID     | Name             | Price  | Dev Status | Description                                                                       |
| -------------- | ---------------- | ------ | ---------- | --------------------------------------------------------------------------------- |
| Material-5x5-O | 5x5 Opaque Panel | $16.00 | 5          | 150mm, 5×5 prototype PCB from last year (opaque, 30mm spacing)                    |
| Material-8x8-V | 8x8 Void Panel   | $35.00 | 5          | 240mm, 8×8 prototype PCB from this year (negative space cut away, 31.6mm spacing) |

**Notes:**

- Both products are ready to sell (Status 5)
- Material-8x8-V is the current generation (2024)
- Material-5x5-O is legacy/previous generation (2023)

---

### 3. Vertical Spine Connectors

Used to join LED panels together vertically.

| Product ID         | Name                 | Price  | Dev Status | Description                                                        |
| ------------------ | -------------------- | ------ | ---------- | ------------------------------------------------------------------ |
| Connect-4x31.6-5v  | 4-Output Spine (5v)  | $20.00 | 2          | 4 output spine connector for Material-8x8-V units (5v compatible)  |
| Connect-5x31.6-5v  | 5-Output Spine (5v)  | $22.00 | 1          | 5 output spine connector for Material-8x8-V units (5v compatible)  |
| Connect-4x31.6-24v | 4-Output Spine (24v) | $60.00 | 0          | 4 output spine connector for Material-8x8-V units (24v compatible) |
| Connect-5x31.6-24v | 5-Output Spine (24v) | $75.00 | 0          | 5 output spine connector for Material-8x8-V units (24v compatible) |

**Compatibility:**

- All connectors are designed for Material-8x8-V (31.6mm spacing)
- Voltage must match control unit (5v or 24v)

---

### 4. Diffusion Caps

Caps to diffuse LED light on PCB panels.

| Product ID   | Name            | Price | Dev Status | Description                                 |
| ------------ | --------------- | ----- | ---------- | ------------------------------------------- |
| Diffuse-12-C | 12mm Cube Cap   | $0.40 | 4          | 12mm SLA printed cube-shaped diffuser cap   |
| Diffuse-12-S | 12mm Sphere Cap | $0.40 | 2          | 12mm SLA printed sphere-shaped diffuser cap |

**Notes:**

- Price is per cap (customers will need 25 or 64 depending on panel)
- SLA printed (high quality finish)
- Material-5x5-O needs 25 caps per panel
- Material-8x8-V needs 64 caps per panel

---

### 5. Control / Driver Head Units

| Product ID     | Name                    | Price   | Dev Status | Description                                                               |
| -------------- | ----------------------- | ------- | ---------- | ------------------------------------------------------------------------- |
| Control-2-5v   | 2-Output Control (5v)   | $45.00  | 1          | 5v control unit, supports 8-10 Material-8x8-V panels (2 ESP32 outputs)    |
| Control-8-24v  | 8-Output Control (24v)  | $90.00  | 0          | 24v control unit, supports 32-40 Material-8x8-V panels (8 ESP32 outputs)  |
| Control-16-24v | 16-Output Control (24v) | $160.00 | 0          | 24v control unit, supports 64-80 Material-8x8-V panels (16 ESP32 outputs) |

**Specifications:**

- Based on ESP32 microcontroller
- Control-2-5v: Max 8-10 panels
- Control-8-24v: Max 32-40 panels
- Control-16-24v: Max 64-80 panels

---

### 6. Complete Units / Kits

#### Unit-8x8x8-DIY

**Price:** $495.00
**Dev Status:** TBD
**Description:** DIY version of the 5v 8-layer original cube

**Specifications:**

- 8×8×8 configuration (8 layers of Material-8x8-V)
- 5v system (includes Control-2-5v)
- Color: BLACK only
- Customer assembly required
- NO WARRANTY
- NO SERVICE GUARANTEES

**Package Composition:**
This is an example of a "package" product that contains multiple components. The system must support defining package contents in JSON configuration with quantities. Example composition:

- 8× Material-8x8-V panels (BLACK)
- 7× Spine connectors (appropriate voltage)
- 1× Control-2-5v unit
- 512× Diffusion caps (round)
- Right-angle pins (soldering required)
- Assembly instructions

**Implementation Note:** The JSON schema must allow flexible package composition - adding, removing, or modifying included items without code changes. Packages are essentially "meta-products" that reference other products with quantities.

---

#### Unit-8x8x8-Founder (Special Edition)

**Price:** $995.00
**Dev Status:** TBD
**Description:** Fully hand-assembled and packaged 24v 8-layer founder's edition cube

**Specifications:**

- 8×8×8 configuration (8 layers of Material-8x8-V)
- 24v system (upgradeable control options)
- **Expandable to 32 layers** with additional hardware
- 10-YEAR WARRANTY
- ESA certified
- Signed with MJN RWA token hash (NFT)
- Hand-assembled and tested

**Limited Edition Quantities:**

- **BLACK:** 500 units
- **WHITE:** 300 units
- **RED:** 200 units
- **Total:** 1,000 units

**Customization Options:**

- Choice of color (BLACK/WHITE/RED)
- Control unit upgrade options:
  - Default: Control-8-24v (included in base price?)
  - Upgrade: Control-16-24v (+$70?)
- Assembly preference:
  - Fully assembled (default - includes warranty)
  - DIY assembly (voids warranty and service guarantees)

**Package Composition (Example):**
This Founder Edition is another "package" product. The system should support variant-specific package contents. Example for Founder Edition:

- 8× Material-8x8-V panels (color matches variant: BLACK/WHITE/RED)
- 2× Spine connectors (24v)
- 1× Control-8-24v unit (with 2 outputs configured, 6 available for expansion)
- 512× Diffusion caps (round)
- Professional packaging
- Certificate of authenticity
- 10-year warranty documentation

**Implementation Note:** Package contents can vary by variant (e.g., BLACK variant includes black panels). Warranty is a product property, not hardcoded business logic.

---

## Product Relationships & Dependencies

### Voltage Compatibility

**5v System:**

- Material-8x8-V (any quantity)
- Connect-4x31.6-5v or Connect-5x31.6-5v
- Control-2-5v
- Maximum ~8-10 panels

**24v System:**

- Material-8x8-V (any quantity)
- Connect-4x31.6-24v or Connect-5x31.6-24v
- Control-8-24v or Control-16-24v
- Scalable to 64-80 panels

**⚠️ Warning:** Cannot mix 5v and 24v components in same fixture

### Component Dependencies

**If customer buys Material-8x8-V panels:**

- Suggest: Spine connectors (based on quantity)
- Suggest: Control unit appropriate for voltage and scale
- Suggest: Diffusion caps (64 per panel)

**If customer buys spine connectors:**

- Require: Material-8x8-V panels
- Require: Compatible control unit (voltage match)

**If customer buys control unit:**

- Suggest: Appropriate number of panels for capacity
- Suggest: Matching voltage spine connectors

### Quantity Calculations

**Spine Connectors Needed:**

- For vertical stack of N panels: Need (N-1) connectors
- Example: 8 panels in a stack = 7 spine connectors

**Diffusion Caps Needed:**

- Material-5x5-O: 25 caps per panel
- Material-8x8-V: 64 caps per panel

**Control Unit Capacity:**

- Control-2-5v: 8-10 panels max
- Control-8-24v: 32-40 panels max
- Control-16-24v: 64-80 panels max

---

## Business Rules

### Limited Edition Tracking

- Track remaining quantities for each Founder Edition color
- Decrement on successful payment (not cart addition)
- Display "X remaining" or "Sold Out" on product page
- Each unit gets unique MJN token hash

### Warranty

Warranty terms are product-specific and stored in the database schema. Different products can have different warranty periods or no warranty at all. This is managed via product properties, not hardcoded business rules.

### Stripe Integration Notes

- Each product listed above needs corresponding Stripe Product ID
- Variants (colors) for Founder Edition:
  - Option 1: Three separate Stripe products (Unit-8x8x8-Founder-Black, etc.)
  - Option 2: One product with color as metadata (track quantities in our DB)
  - **Recommendation:** Separate products for easier Stripe dashboard management

---

## Notes

- **Color Variants:** All products should be capable of having color variants (or any other variant type). The schema supports this flexibility.
- **Warranty:** Warranty terms are product properties stored in the database, not hardcoded rules.
- **Package Products:** Kits/packages reference other products with quantities. This allows flexible modification of package contents via JSON configuration.
- **Dev Status:** Only show products with `dev_status = 5` on public site. Lower dev_status products can be visible in admin/dev environments.

---

**Document Created:** 2025-10-22
**Last Updated:** 2025-10-23
**Status:** Product thinking document - informs implementation but not prescriptive
