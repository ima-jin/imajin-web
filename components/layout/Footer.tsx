import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";

/**
 * Footer Component
 *
 * Matches wireframe design:
 * - 4-column layout (Shop, Company, Support, Follow)
 * - Links organized by category
 * - Clean, minimal design
 */
export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Shop */}
          <div>
            <Heading level={4} color="inverse" className="text-sm uppercase tracking-wider mb-4">
              Shop
            </Heading>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors">
                  Founder Edition
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors">
                  Expansion Panels
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors">
                  Controllers
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <Heading level={4} color="inverse" className="text-sm uppercase tracking-wider mb-4">
              Company
            </Heading>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-gray-300 hover:text-white transition-colors">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-gray-300 hover:text-white transition-colors">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <Heading level={4} color="inverse" className="text-sm uppercase tracking-wider mb-4">
              Support
            </Heading>
            <ul className="space-y-3">
              <li>
                <Link href="/installation" className="text-gray-300 hover:text-white transition-colors">
                  Installation Guide
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="text-gray-300 hover:text-white transition-colors">
                  Warranty
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-300 hover:text-white transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow */}
          <div>
            <Heading level={4} color="inverse" className="text-sm uppercase tracking-wider mb-4">
              Follow
            </Heading>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Imajin. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
