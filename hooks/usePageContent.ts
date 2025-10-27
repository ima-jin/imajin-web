import { loadContentCached } from '@/lib/config/content-loader';
import {
  HomePageContent,
  HomePageContentSchema,
  ProductsListingContent,
  ProductsListingContentSchema,
  ProductDetailContent,
  ProductDetailContentSchema,
} from '@/config/schema/page-content-schema';

/**
 * Load homepage content on the server
 * @returns Homepage content including hero, sections, and CTAs
 *
 * @example
 * ```tsx
 * export default async function HomePage() {
 *   const content = await getHomePageContent();
 *   return <h1>{content.hero.heading}</h1>;
 * }
 * ```
 */
export async function getHomePageContent(): Promise<HomePageContent> {
  return loadContentCached('content/pages/home.json', HomePageContentSchema);
}

/**
 * Load products listing page content on the server
 * @returns Products listing content including filters and sections
 *
 * @example
 * ```tsx
 * export default async function ProductsPage() {
 *   const content = await getProductsListingContent();
 *   return <h1>{content.page.heading}</h1>;
 * }
 * ```
 */
export async function getProductsListingContent(): Promise<ProductsListingContent> {
  return loadContentCached('content/pages/products-listing.json', ProductsListingContentSchema);
}

/**
 * Load product detail page content on the server
 * @returns Product detail content including sections and labels
 *
 * @example
 * ```tsx
 * export default async function ProductDetailPage() {
 *   const content = await getProductDetailContent();
 *   return <h2>{content.sections.description.heading}</h2>;
 * }
 * ```
 */
export async function getProductDetailContent(): Promise<ProductDetailContent> {
  return loadContentCached('content/pages/product-detail.json', ProductDetailContentSchema);
}
