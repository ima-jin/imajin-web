'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { CartButton } from '@/components/cart/CartButton';
import { CartDrawer } from '@/components/cart/CartDrawer';

export function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <Container>
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link href="/" className="flex items-center">
              <img
                src="/images/logo-optimized.svg"
                alt="Imajin"
                className="h-8 w-auto"
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/products" className="text-gray-600 hover:text-gray-900">
                Shop
              </Link>
              <Link href="/collections" className="text-gray-600 hover:text-gray-900">
                Collections
              </Link>
              <Link href="/portfolio" className="text-gray-600 hover:text-gray-900">
                Portfolio
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">
                About
              </Link>
            </nav>

            {/* Cart Button */}
            <div className="flex items-center gap-4">
              <CartButton onClick={() => setIsCartOpen(true)} />
            </div>
          </div>
        </Container>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
