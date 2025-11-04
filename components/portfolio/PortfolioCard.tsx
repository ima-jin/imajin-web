/**
 * PortfolioCard Component
 *
 * Display card for portfolio products with markdown support
 */

import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Product } from '@/types/product';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { getBestImageUrl } from '@/lib/utils/cloudinary';

interface PortfolioCardProps {
  product: Product;
}

export default function PortfolioCard({ product }: PortfolioCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        {/* Product Image */}
        <div className="relative w-full h-64 bg-gray-100">
          <Image
            src={getBestImageUrl(product.media, 'hero', { width: 600, height: 400 })}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        {/* Product Info */}
        <div className="p-6">
          <Heading level={3} className="mb-3">
            {product.name}
          </Heading>

          {/* Portfolio Copy with Markdown */}
          {product.portfolioCopy && (
            <div className="prose-editorial-sm text-gray-600">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {product.portfolioCopy}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
