# Content Management Guide

## Overview

This guide explains how to manage all text, copy, and content on the Imajin website without touching code. All content is stored in JSON files that can be edited with any text editor.

**Who This Is For:** Content editors, marketing team, anyone who needs to update website copy

**What You Can Edit:**
- Page headlines and descriptions
- Button labels and messaging
- Navigation menus
- SEO metadata and titles
- Error messages
- Cart and product UI text

---

## Content Files Location

All content files are in: `/config/content/`

```
/config/content/
├── site-metadata.json       # SEO, page titles, site info
├── navigation.json           # Header, footer, breadcrumbs
├── ui-strings.json          # Buttons, labels, common messages
├── validation-messages.json # Error and validation messages
└── pages/
    ├── home.json            # Homepage content
    ├── products-listing.json # Products page content
    └── product-detail.json   # Product detail page content
```

---

## Quick Start

### Basic Editing Workflow

1. **Open the JSON file** you want to edit in a text editor (VS Code, Sublime, even Notepad)
2. **Find the text** you want to change
3. **Edit the text** between the quotation marks
4. **Save the file**
5. **Validate** your changes: `npm run validate:content`
6. **Commit to git** (if everything validates)
7. **Deploy** (changes go live when deployed)

### Example: Changing Homepage Heading

**Before:**
```json
{
  "hero": {
    "heading": "Sculptural LED Lighting"
  }
}
```

**After:**
```json
{
  "hero": {
    "heading": "Premium Modular LED Fixtures"
  }
}
```

Save the file, validate, commit, done!

---

## Content Files Guide

### 1. Site Metadata (`site-metadata.json`)

**What it controls:** SEO titles, descriptions, site-wide information

**Common edits:**
- Update page titles
- Change meta descriptions
- Update contact email
- Modify social media handles

**Example:**
```json
{
  "site": {
    "name": "Imajin",
    "tagline": "Modular LED Fixtures",
    "contact_email": "hello@imajin.ai"
  },
  "meta": {
    "default_title": "Imajin - Modular LED Fixtures",
    "default_description": "Sculptural LED lighting designed in Toronto",
    "keywords": ["LED", "modular lighting", "Toronto"]
  }
}
```

**Tips:**
- Keep titles under 60 characters (Google cuts them off)
- Keep descriptions under 160 characters
- Update the `updated` field at the top when you make changes

---

### 2. Navigation (`navigation.json`)

**What it controls:** Header navigation, footer links, breadcrumb text

**Common edits:**
- Add/remove navigation links
- Change link labels
- Update footer sections
- Modify copyright text

**Example: Adding a new header link**
```json
{
  "header": {
    "nav_items": [
      {
        "id": "shop",
        "label": "Shop",
        "href": "/products",
        "aria_label": "Browse all products"
      },
      {
        "id": "about",
        "label": "About Us",
        "href": "/about",
        "aria_label": "Learn about Imajin"
      }
    ]
  }
}
```

**Copyright with Year:**
The footer copyright automatically inserts the current year:
```json
{
  "copyright": "© {year} Imajin. All rights reserved."
}
```
Result: "© 2025 Imajin. All rights reserved."

---

### 3. UI Strings (`ui-strings.json`)

**What it controls:** All common UI elements - buttons, labels, messages

**Common edits:**
- Button text ("Add to Cart", "Checkout", etc.)
- Cart messaging
- Form labels
- Error messages
- ARIA labels for accessibility

**Example: Cart Strings**
```json
{
  "cart": {
    "heading": "Shopping Cart",
    "empty_state": {
      "heading": "Your cart is empty",
      "message": "Add some products to get started",
      "cta_label": "Browse Products"
    },
    "actions": {
      "checkout": "Checkout",
      "continue_shopping": "Continue Shopping"
    }
  }
}
```

**Dynamic Messages (Templates):**
Some messages have variables in curly braces:
```json
{
  "cart_item": {
    "low_stock_template": "Only {quantity} remaining"
  }
}
```
When displaying, `{quantity}` gets replaced with the actual number: "Only 5 remaining"

---

### 4. Validation Messages (`validation-messages.json`)

**What it controls:** Error messages, form validation, cart warnings

**Common edits:**
- Error message text
- Validation feedback
- Warning messages

**Example:**
```json
{
  "cart_validation": {
    "voltage_mismatch": "Your cart contains both 5v and 24v components. These cannot be mixed in the same fixture.",
    "product_unavailable_template": "{product_name} is no longer available"
  }
}
```

---

### 5. Homepage Content (`pages/home.json`)

**What it controls:** All homepage text and sections

**Common edits:**
- Hero headline and subheading
- Call-to-action buttons
- Value proposition text
- Feature descriptions

**Example:**
```json
{
  "hero": {
    "heading": "Sculptural LED Lighting",
    "subheading": "Modular fixtures designed and manufactured in Toronto",
    "cta_primary": {
      "label": "Shop Founder Edition",
      "href": "/products",
      "aria_label": "Browse Founder Edition collection"
    }
  },
  "value_props": [
    {
      "id": "modular",
      "heading": "Modular Design",
      "description": "Build, expand, and reconfigure your lighting installation"
    },
    {
      "id": "handmade",
      "heading": "Hand-Assembled in Toronto",
      "description": "Each unit is crafted with precision and care"
    }
  ]
}
```

---

### 6. Products Listing (`pages/products-listing.json`)

**What it controls:** Products page heading, filters, section labels

**Common edits:**
- Page heading and subheading
- Filter labels
- Product section headings
- Category descriptions

**Example:**
```json
{
  "page": {
    "heading": "Shop Pre-Made Fixtures",
    "subheading": "Sculptural LED lighting ready for your home"
  },
  "product_sections": [
    {
      "id": "founder",
      "heading": "Founder Edition Collection",
      "description": "Limited run of 1,000 units worldwide"
    }
  ]
}
```

---

### 7. Product Detail (`pages/product-detail.json`)

**What it controls:** Product page labels, badges, notices

**Common edits:**
- Section headings ("Description", "Specifications")
- Badge text ("Limited Edition", "Sold Out")
- Assembly notices
- Variant selector labels

**Example:**
```json
{
  "sections": {
    "description": {
      "heading": "Description"
    },
    "specifications": {
      "heading": "Specifications"
    }
  },
  "badges": {
    "limited_edition": "Limited Edition",
    "sold_out": "Sold Out",
    "requires_assembly": "Requires Assembly"
  }
}
```

---

## JSON Editing Tips

### Understanding JSON Format

JSON is just text with specific formatting rules:

1. **Strings** (text) are in "double quotes"
2. **Objects** are in {curly braces}
3. **Arrays** are in [square brackets]
4. **Commas** separate items (but NOT after the last item)

**Valid:**
```json
{
  "title": "Hello",
  "description": "World"
}
```

**Invalid (missing comma):**
```json
{
  "title": "Hello"
  "description": "World"
}
```

**Invalid (comma after last item):**
```json
{
  "title": "Hello",
  "description": "World",
}
```

### Common Mistakes to Avoid

1. **Forgetting Commas:**
```json
// WRONG - missing comma
{
  "button": "Click Me"
  "link": "/page"
}

// RIGHT
{
  "button": "Click Me",
  "link": "/page"
}
```

2. **Extra Comma at End:**
```json
// WRONG - extra comma
{
  "button": "Click Me",
}

// RIGHT
{
  "button": "Click Me"
}
```

3. **Wrong Quote Type:**
```json
// WRONG - single quotes
{
  'button': 'Click Me'
}

// RIGHT - double quotes
{
  "button": "Click Me"
}
```

4. **Breaking Template Variables:**
```json
// WRONG - broken variable
"message": "Only remaining"

// RIGHT - keep {variable} intact
"message": "Only {quantity} remaining"
```

---

## Validation System

### Running Validation

Before committing changes, always validate:

```bash
npm run validate:content
```

**Success looks like:**
```
✓ site-metadata.json validated successfully
✓ navigation.json validated successfully
✓ ui-strings.json validated successfully
✓ validation-messages.json validated successfully
✓ pages/home.json validated successfully
✓ pages/products-listing.json validated successfully
✓ pages/product-detail.json validated successfully

All content files validated successfully! ✓
```

### Common Validation Errors

**1. JSON Syntax Error**
```
Error: Unexpected token } in JSON at position 45
```
**Fix:** Check for missing/extra commas, missing quotes, unmatched brackets

**2. Missing Required Field**
```
Error: Required field 'heading' is missing
```
**Fix:** Add the missing field to your JSON

**3. Wrong Type**
```
Error: Expected string, received number
```
**Fix:** Wrap numbers in quotes if they should be text

---

## Version Control Best Practices

### Before You Edit

1. **Pull latest changes:** `git pull`
2. **Create a branch:** `git checkout -b update-homepage-copy`

### Making Changes

1. Edit your JSON files
2. Save all changes
3. Validate: `npm run validate:content`
4. Preview changes locally if possible

### Committing Changes

```bash
# Check what changed
git status

# Add your changes
git add config/content/

# Commit with clear message
git commit -m "Update homepage hero heading and CTAs"

# Push to remote
git push origin update-homepage-copy
```

### Commit Message Guidelines

**Good commit messages:**
- `Update homepage hero heading`
- `Add About link to header navigation`
- `Fix typo in cart empty state message`

**Bad commit messages:**
- `Update stuff`
- `Changes`
- `Fix`

---

## Common Content Tasks

### Task 1: Update Homepage Hero

**File:** `config/content/pages/home.json`

**Steps:**
1. Open `home.json`
2. Find the `hero` section
3. Edit `heading`, `subheading`, or `cta_primary.label`
4. Save and validate
5. Commit changes

**Example:**
```json
{
  "hero": {
    "heading": "NEW HEADLINE HERE",
    "subheading": "New subheading text",
    "cta_primary": {
      "label": "Shop Now",
      "href": "/products"
    }
  }
}
```

---

### Task 2: Change Button Text

**File:** `config/content/ui-strings.json`

**Steps:**
1. Open `ui-strings.json`
2. Find the `buttons` section
3. Edit the button label you want to change
4. Save and validate

**Example:**
```json
{
  "buttons": {
    "add_to_cart": "Add to Bag",
    "checkout": "Proceed to Checkout"
  }
}
```

---

### Task 3: Update SEO Metadata

**File:** `config/content/site-metadata.json`

**Steps:**
1. Open `site-metadata.json`
2. Find the `meta` section
3. Edit title, description, or keywords
4. Save and validate

**Example:**
```json
{
  "meta": {
    "default_title": "Imajin - Premium LED Fixtures",
    "default_description": "Hand-crafted modular LED lighting designed in Toronto",
    "keywords": ["LED fixtures", "Toronto", "modular lighting", "sculptural"]
  }
}
```

---

### Task 4: Add Navigation Link

**File:** `config/content/navigation.json`

**Steps:**
1. Open `navigation.json`
2. Find `header.nav_items` array
3. Add a new item (don't forget the comma!)
4. Save and validate

**Example:**
```json
{
  "header": {
    "nav_items": [
      {
        "id": "shop",
        "label": "Shop",
        "href": "/products",
        "aria_label": "Browse all products"
      },
      {
        "id": "portfolio",
        "label": "Portfolio",
        "href": "/portfolio",
        "aria_label": "View our installation portfolio"
      }
    ]
  }
}
```

---

### Task 5: Update Cart Messaging

**File:** `config/content/ui-strings.json`

**Steps:**
1. Open `ui-strings.json`
2. Find the `cart` section
3. Edit the message you want to change
4. Save and validate

**Example:**
```json
{
  "cart": {
    "empty_state": {
      "heading": "Nothing here yet!",
      "message": "Start building your custom lighting installation",
      "cta_label": "Explore Products"
    }
  }
}
```

---

## Troubleshooting

### "Validation Failed" Errors

**Problem:** Validation script reports errors

**Solution:**
1. Read the error message carefully - it tells you which file and what's wrong
2. Check for common JSON syntax errors (missing commas, quotes)
3. Make sure you didn't delete any required fields
4. If stuck, revert your changes and try again: `git checkout config/content/`

---

### "File Not Found" Errors

**Problem:** Can't find a content file

**Solution:**
1. Make sure you're in the project root directory
2. Check the file path: `/config/content/`
3. File names are case-sensitive

---

### Changes Don't Appear on Website

**Problem:** Made changes but don't see them live

**Checklist:**
1. ✓ Did you save the file?
2. ✓ Did validation pass?
3. ✓ Did you commit and push changes?
4. ✓ Did the deployment complete successfully?
5. ✓ Did you hard refresh your browser? (Ctrl+Shift+R / Cmd+Shift+R)

---

### Template Variables Not Working

**Problem:** Text shows `{quantity}` instead of actual number

**Solution:**
- Don't edit template variables - they're automatically replaced by the system
- Keep the curly braces intact: `{variable}`
- If a template isn't working, it might need to be added in code (contact dev team)

---

## Best Practices

### Writing for the Web

1. **Be Concise:** Web users scan, they don't read every word
2. **Front-Load Important Info:** Put key points at the beginning
3. **Use Active Voice:** "We design fixtures" vs "Fixtures are designed by us"
4. **Break Up Text:** Short paragraphs, bullet points, headings

### SEO Best Practices

1. **Title Tags:** Keep under 60 characters
2. **Meta Descriptions:** Keep under 160 characters, include a call-to-action
3. **Keywords:** Use naturally, don't stuff
4. **H1 Tags:** One per page, make it descriptive

### Accessibility

1. **ARIA Labels:** Always fill these in for screen readers
2. **Button Text:** Make it descriptive ("Shop Founder Edition" vs "Click Here")
3. **Alt Text:** Describe images clearly (handled in image configs, not content files)

---

## Advanced: Template Variables

Some strings support dynamic values using `{variable}` syntax.

### Available Variables

**Cart Item Templates:**
- `{quantity}` - Number of items
- `{product_name}` - Name of product
- `{available_quantity}` - Stock remaining

**Navigation:**
- `{year}` - Current year (auto-updated)

**Page Metadata:**
- `{page_title}` - Dynamic page title

### Examples

```json
{
  "low_stock_template": "Only {quantity} left in stock!",
  "product_unavailable_template": "{product_name} is currently unavailable",
  "copyright": "© {year} Imajin. All rights reserved."
}
```

**Result:**
- "Only 3 left in stock!"
- "Founder Edition BLACK is currently unavailable"
- "© 2025 Imajin. All rights reserved."

---

## Getting Help

### Questions or Issues?

1. **Syntax Errors:** Use a JSON validator (jsonlint.com)
2. **Content Questions:** Check this guide or existing files for examples
3. **Technical Issues:** Contact the dev team

### Useful Tools

- **JSON Validator:** https://jsonlint.com
- **Text Editor:** VS Code (free, great for JSON editing)
- **Git Client:** GitHub Desktop (easier than command line)

---

## Appendix: Complete File Schemas

### Minimal Valid Files

If you ever need to recreate a file from scratch, here are the minimum required structures:

**site-metadata.json:**
```json
{
  "version": "1.0",
  "updated": "2025-10-27",
  "site": {
    "name": "Imajin",
    "tagline": "Modular LED Fixtures",
    "description": "Description here",
    "url": "https://www.imajin.ai",
    "contact_email": "hello@imajin.ai",
    "support_email": "support@imajin.ai"
  },
  "meta": {
    "default_title": "Imajin",
    "title_template": "{page_title} | Imajin",
    "default_description": "Description",
    "keywords": [],
    "og_image": "/og-image.jpg",
    "twitter_handle": "@imajin",
    "favicon": "/favicon.ico"
  },
  "pages": {}
}
```

**navigation.json:**
```json
{
  "version": "1.0",
  "updated": "2025-10-27",
  "header": {
    "logo_alt": "Imajin Logo",
    "nav_items": []
  },
  "footer": {
    "sections": [],
    "copyright": "© {year} Imajin",
    "legal_links": []
  },
  "breadcrumbs": {
    "home": "Home"
  }
}
```

---

**Document Created:** 2025-10-27
**Last Updated:** 2025-10-27
**For:** Content editors and marketing team
**Status:** Complete
