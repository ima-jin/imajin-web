'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { CartButton } from '@/components/cart/CartButton';
import { CartDrawer } from '@/components/cart/CartDrawer';
import type { Navigation } from '@/config/schema/navigation-schema';
import type { UIStrings } from '@/config/schema/ui-strings-schema';

interface HeaderProps {
  navigation: Navigation;
  uiStrings: UIStrings;
}

export function Header({ navigation, uiStrings }: HeaderProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <Container>
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo-optimized.svg"
                alt={navigation.header.logo_alt}
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.header.nav_items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900"
                  aria-label={item.aria_label}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Cart Button */}
            <div className="flex items-center gap-4">
              <CartButton onClick={() => setIsCartOpen(true)} />
            </div>
          </div>
        </Container>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} uiStrings={uiStrings} />
    </>
  );
}
