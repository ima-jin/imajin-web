import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import type { HomePageContent } from "@/config/schema/page-content-schema";

/**
 * HeroSection Component
 *
 * Homepage hero section with:
 * - Company tagline/value proposition
 * - Call to action buttons
 * - Clean, modern design
 */
interface HeroSectionProps {
  content: HomePageContent["hero"];
}

export default function HeroSection({ content }: HeroSectionProps) {
  return (
    <div className="relative h-[600px] bg-black text-white flex items-center justify-center">
      {/* Background - could add image overlay here later */}
      <Container>
        <div className="text-center max-w-[800px] mx-auto">
          {/* Main Heading */}
          <Heading level={1} color="inverse" className="text-5xl sm:text-6xl font-light tracking-tight mb-5">
            {content.heading}
          </Heading>

          {/* Subheading */}
          <Text size="lg" color="inverse" className="text-xl mb-8 max-w-3xl mx-auto">
            {content.subheading}
          </Text>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link href={content.cta_primary.href} className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full" aria-label={content.cta_primary.aria_label}>
                {content.cta_primary.label}
              </Button>
            </Link>
            <Link href={content.cta_secondary.href} className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full border-2 border-white text-white hover:bg-white hover:text-black" aria-label={content.cta_secondary.aria_label}>
                {content.cta_secondary.label}
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
