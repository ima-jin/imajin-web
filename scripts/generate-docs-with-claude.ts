/**
 * AI-Powered Documentation Generator (Incremental)
 *
 * Workflow:
 * 1. Detect which source files changed (git diff)
 * 2. Map changed files to affected TypeDoc modules
 * 3. Run TypeDoc to extract JSDoc comments
 * 4. Load brand voice guidelines and project context
 * 5. Use Claude to generate docs ONLY for changed modules
 * 6. Preserve existing docs for unchanged modules
 * 7. Regenerate index with all modules
 *
 * Usage:
 *   npm run docs:generate                    # Incremental (changed files only)
 *   npm run docs:generate -- --full          # Full regeneration (all modules)
 *   FORCE_FULL=true npm run docs:generate   # Full regeneration (env var)
 */

import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const TYPEDOC_JSON = 'docs/api/typedoc-data.json';
const BRAND_VOICE_GUIDE = 'docs/BRAND_VOICE_GUIDE.md';
const CLAUDE_MD = 'claude.md';
const OUTPUT_DIR = 'docs/api/generated';

// Check for full regeneration flag
const FORCE_FULL = process.argv.includes('--full') || process.env.FORCE_FULL === 'true';

interface TypeDocFunction {
  name: string;
  comment?: {
    summary?: Array<{ text: string }>;
    blockTags?: Array<{ tag: string; content: Array<{ text: string }> }>;
  };
  signatures?: Array<{
    parameters?: Array<{ name: string; type: unknown; comment?: unknown }>;
    type?: unknown;
  }>;
}

interface TypeDocModule {
  name: string;
  children?: TypeDocFunction[];
}

interface TypeDocOutput {
  children?: TypeDocModule[];
}

/**
 * Detect changed files using git diff
 */
function getChangedFiles(): string[] {
  try {
    // Get changed files between HEAD and previous commit
    // Falls back to all files if not in a git repo or no previous commit
    const output = execSync('git diff --name-only HEAD~1 HEAD 2>/dev/null || echo ""', {
      encoding: 'utf-8',
    }).trim();

    if (!output) {
      console.log('⚠️  No git history detected, treating as first run');
      return [];
    }

    const files = output.split('\n').filter(Boolean);
    return files;
  } catch (error) {
    console.log('⚠️  Could not detect git changes, will do full regeneration');
    return [];
  }
}

/**
 * Check if critical files changed (forces full regeneration)
 */
function shouldForceFullRegeneration(changedFiles: string[]): boolean {
  const criticalFiles = [
    'docs/BRAND_VOICE_GUIDE.md',
    'claude.md',
    'scripts/generate-docs-with-claude.ts',
    'typedoc.json',
  ];

  return changedFiles.some(file =>
    criticalFiles.some(critical => file.includes(critical))
  );
}

/**
 * Map changed files to affected TypeDoc modules
 */
function mapFilesToModules(changedFiles: string[]): Set<string> {
  const affectedModules = new Set<string>();

  for (const file of changedFiles) {
    // Only care about TypeScript files in lib/
    if (!file.startsWith('lib/') || !file.endsWith('.ts')) {
      continue;
    }

    // Extract module path from file path
    // Example: lib/services/order-service.ts → services/order-service
    const modulePath = file
      .replace(/^lib\//, '')
      .replace(/\.ts$/, '')
      .replace(/\/index$/, ''); // Handle index files

    affectedModules.add(modulePath);
  }

  return affectedModules;
}

/**
 * Get list of existing generated doc files
 */
function getExistingModules(): Set<string> {
  const existing = new Set<string>();

  if (!fs.existsSync(OUTPUT_DIR)) {
    return existing;
  }

  const files = fs.readdirSync(OUTPUT_DIR);
  for (const file of files) {
    if (file.endsWith('.md') && file !== 'README.md') {
      // Convert filename back to module name
      // Example: services-order-service.md → services/order-service
      const moduleName = file
        .replace(/\.md$/, '')
        .replace(/-/g, '/');
      existing.add(moduleName);
    }
  }

  return existing;
}

/**
 * Run TypeDoc to generate JSON output
 */
function runTypeDoc(): void {
  console.log('🔍 Running TypeDoc to extract API data...');
  try {
    execSync('npx typedoc', { stdio: 'inherit' });
    console.log('✅ TypeDoc extraction complete\n');
  } catch (error) {
    console.error('❌ TypeDoc failed:', error);
    process.exit(1);
  }
}

/**
 * Load file content
 */
function loadFile(filePath: string): string {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Load TypeDoc JSON output
 */
function loadTypeDocData(): TypeDocOutput {
  const content = loadFile(TYPEDOC_JSON);
  return JSON.parse(content) as TypeDocOutput;
}

/**
 * Group functions by module/service
 */
function groupByModule(data: TypeDocOutput): Record<string, TypeDocFunction[]> {
  const grouped: Record<string, TypeDocFunction[]> = {};

  if (!data.children) return grouped;

  for (const module of data.children) {
    if (module.children && module.children.length > 0) {
      grouped[module.name] = module.children;
    }
  }

  return grouped;
}

/**
 * Filter modules to only those that need regeneration
 */
function filterModulesToRegenerate(
  allModules: Record<string, TypeDocFunction[]>,
  changedModules: Set<string>
): Record<string, TypeDocFunction[]> {
  const filtered: Record<string, TypeDocFunction[]> = {};

  for (const [moduleName, functions] of Object.entries(allModules)) {
    // Check if this module matches any changed module
    // Supports both exact match and parent directory match
    // Example: services/order-service matches both:
    //   - services/order-service (exact)
    //   - services (parent directory)
    const isAffected = Array.from(changedModules).some(changed =>
      moduleName === changed || moduleName.startsWith(changed + '/')
    );

    if (isAffected) {
      filtered[moduleName] = functions;
    }
  }

  return filtered;
}

/**
 * Generate documentation using Claude
 */
async function generateDocsWithClaude(
  modules: Record<string, TypeDocFunction[]>,
  brandVoice: string,
  projectContext: string
): Promise<Record<string, string>> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const docs: Record<string, string> = {};

  console.log('🤖 Generating documentation with Claude...\n');

  for (const [moduleName, functions] of Object.entries(modules)) {
    console.log(`   📝 Processing: ${moduleName}...`);

    const prompt = `You are Dr. Wordsmith, the technical writer for Imajin LED Platform.

Generate comprehensive API reference documentation for the **${moduleName}** module.

## Context Files

### Brand Voice Guide
${brandVoice}

### Project Context (CLAUDE.md excerpt)
${projectContext}

## TypeDoc Data (Structured API Information)
${JSON.stringify(functions, null, 2)}

## Your Task

Generate a complete, publication-ready markdown documentation file for this module that:

1. **Captures Imajin's brand voice** - Professional, maker-friendly, no fluff
2. **Is technically accurate** - Match the actual code behavior
3. **Is developer-focused** - Real examples, clear explanations, progressive complexity
4. **Follows the structure template** from the brand voice guide

## Required Sections

### Module Overview
- What this module does
- Why it exists (problem it solves)
- When to use it

### Functions Reference
For each function:
- Clear one-sentence summary
- Purpose explanation (2-3 sentences)
- Parameters table with types and descriptions
- Return value with context
- Real, runnable code example
- Error handling guidance
- Implementation notes (architectural decisions, trade-offs)

### Common Patterns
- Typical usage workflows
- Best practices
- Things to watch out for

### Related Modules
- How this fits into the bigger picture
- Links to related documentation

## Output Format

Pure markdown. No preamble, no "Here's the documentation...", just start with the H1 title.

Use code blocks with language tags (\`\`\`typescript, \`\`\`json, etc.).

Write in Imajin's voice: confident, technical, maker-friendly, no marketing fluff.

Begin:`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        docs[moduleName] = content.text;
        console.log(`   ✅ Generated ${moduleName} (${content.text.length} chars)\n`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to generate ${moduleName}:`, error);
      throw error;
    }
  }

  return docs;
}

/**
 * Convert module name to filename
 */
function moduleToFilename(moduleName: string): string {
  return `${moduleName.replace(/\//g, '-')}.md`;
}

/**
 * Write generated docs to markdown files
 */
function writeDocs(docs: Record<string, string>): void {
  console.log('💾 Writing documentation files...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const [moduleName, content] of Object.entries(docs)) {
    const fileName = moduleToFilename(moduleName);
    const filePath = path.join(OUTPUT_DIR, fileName);

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`   ✅ ${fileName}`);
  }
}

/**
 * Generate index file with navigation (includes all modules, not just regenerated)
 */
function generateIndex(allModules: string[]): void {
  console.log('\n📚 Generating index...');

  // Sort modules alphabetically
  const sortedModules = allModules.sort();

  // Group by category (top-level directory)
  const grouped: Record<string, string[]> = {};
  for (const module of sortedModules) {
    const category = module.split('/')[0];
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(module);
  }

  // Generate index content
  let indexContent = `# Imajin Platform API Reference

**Auto-generated documentation** - Last updated: ${new Date().toISOString().split('T')[0]}

## Modules by Category

`;

  for (const [category, modules] of Object.entries(grouped)) {
    indexContent += `\n### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    for (const module of modules) {
      const fileName = moduleToFilename(module);
      indexContent += `- [${module}](./${fileName})\n`;
    }
  }

  indexContent += `\n---

**Documentation generated by:**
- TypeDoc (JSDoc extraction)
- Claude Sonnet 4 (content generation)
- Dr. Wordsmith (brand voice consistency)

**Generation mode:** ${FORCE_FULL ? 'Full regeneration' : 'Incremental (changed modules only)'}

**Brand voice:** Professional, maker-friendly, technically accurate, no fluff.
`;

  const indexPath = path.join(OUTPUT_DIR, 'README.md');
  fs.writeFileSync(indexPath, indexContent, 'utf-8');
  console.log('   ✅ README.md (index)');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Imajin Documentation Generator (Incremental)\n');
  console.log('='.repeat(50));
  console.log('\n');

  // Validate API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable not set');
    console.error('   Set it with: export ANTHROPIC_API_KEY=sk-...');
    process.exit(1);
  }

  try {
    // Step 1: Detect changes
    console.log('🔍 Detecting changes...');
    const changedFiles = getChangedFiles();
    const criticalFilesChanged = shouldForceFullRegeneration(changedFiles);

    if (FORCE_FULL) {
      console.log('⚡ Full regeneration requested (--full flag)\n');
    } else if (criticalFilesChanged) {
      console.log('⚡ Critical files changed, forcing full regeneration');
      console.log('   (brand voice guide, claude.md, or script itself)\n');
    } else if (changedFiles.length === 0) {
      console.log('⚡ No git history or first run, doing full regeneration\n');
    } else {
      console.log(`📝 ${changedFiles.length} files changed:`);
      changedFiles.slice(0, 10).forEach(f => console.log(`   - ${f}`));
      if (changedFiles.length > 10) {
        console.log(`   ... and ${changedFiles.length - 10} more`);
      }
      console.log('\n');
    }

    // Step 2: Run TypeDoc
    runTypeDoc();

    // Step 3: Load data
    console.log('📖 Loading project context...');
    const typeDocData = loadTypeDocData();
    const brandVoice = loadFile(BRAND_VOICE_GUIDE);
    const projectContext = loadFile(CLAUDE_MD).slice(0, 5000);
    console.log('✅ Context loaded\n');

    // Step 4: Group by module
    const allModules = groupByModule(typeDocData);
    const allModuleNames = Object.keys(allModules);

    // Step 5: Determine which modules to regenerate
    let modulesToRegenerate: Record<string, TypeDocFunction[]>;
    let regenerateCount: number;

    if (FORCE_FULL || criticalFilesChanged || changedFiles.length === 0) {
      // Full regeneration
      modulesToRegenerate = allModules;
      regenerateCount = allModuleNames.length;
      console.log(`📦 Full regeneration: ${regenerateCount} modules\n`);
    } else {
      // Incremental regeneration
      const changedModules = mapFilesToModules(changedFiles);

      if (changedModules.size === 0) {
        console.log('ℹ️  No module source files changed (only non-lib/ files)');
        console.log('   Skipping documentation generation\n');
        console.log('='.repeat(50));
        console.log('✅ No regeneration needed');
        return;
      }

      modulesToRegenerate = filterModulesToRegenerate(allModules, changedModules);
      regenerateCount = Object.keys(modulesToRegenerate).length;

      console.log(`📦 Incremental regeneration: ${regenerateCount} modules`);
      console.log('\n   Changed modules:');
      Object.keys(modulesToRegenerate).forEach(name => console.log(`   - ${name}`));
      console.log('\n');

      const existingCount = allModuleNames.length - regenerateCount;
      if (existingCount > 0) {
        console.log(`   ♻️  Preserving ${existingCount} unchanged modules\n`);
      }
    }

    // Step 6: Generate docs with Claude (only for changed modules)
    const newDocs = await generateDocsWithClaude(
      modulesToRegenerate,
      brandVoice,
      projectContext
    );

    // Step 7: Write to files
    writeDocs(newDocs);

    // Step 8: Get all module names (existing + new)
    const existingModules = getExistingModules();
    const allFinalModules = new Set([...existingModules, ...Object.keys(newDocs)]);

    // Step 9: Generate index with all modules
    generateIndex(Array.from(allFinalModules));

    // Step 10: Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Documentation generation complete!');
    console.log(`📂 View docs at: ${OUTPUT_DIR}/README.md`);
    console.log(`\n💰 Cost savings: ${FORCE_FULL || criticalFilesChanged ? '0%' : `~${Math.round((1 - regenerateCount / allModuleNames.length) * 100)}%`} (regenerated ${regenerateCount}/${allModuleNames.length} modules)`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
