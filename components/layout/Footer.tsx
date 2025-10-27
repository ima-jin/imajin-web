import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { interpolateWithYear } from "@/lib/utils/string-template";
import type { Navigation } from "@/config/schema/navigation-schema";

/**
 * Footer Component
 *
 * Matches wireframe design:
 * - 4-column layout (Shop, Company, Support, Follow)
 * - Links organized by category
 * - Clean, minimal design
 */
interface FooterProps {
  navigation: Navigation;
}

export function Footer({ navigation }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {navigation.footer.sections.map((section) => (
            <div key={section.id}>
              <Heading level={4} color="inverse" className="text-sm uppercase tracking-wider mb-4">
                {section.heading}
              </Heading>
              <ul className="space-y-3">
                {section.links.map((link, index) => (
                  <li key={index}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-white transition-colors"
                        aria-label={link.aria_label}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-gray-300 hover:text-white transition-colors"
                        aria-label={link.aria_label}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>{interpolateWithYear(navigation.footer.copyright)}</p>
          <div className="mt-4 space-x-4">
            {navigation.footer.legal_links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
