import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";

/**
 * HeroSection Component
 *
 * Homepage hero section with:
 * - Company tagline/value proposition
 * - Call to action buttons
 * - Clean, modern design
 */
export function HeroSection() {
  return (
    <div className="relative h-[600px] bg-black text-white flex items-center justify-center">
      {/* Background - could add image overlay here later */}
      <Container>
        <div className="text-center max-w-[800px] mx-auto">
          {/* Main Heading */}
          <Heading level={1} color="inverse" className="text-5xl sm:text-6xl font-light tracking-tight mb-5">
            Sculptural LED Lighting for Modern Spaces
          </Heading>

          {/* Subheading */}
          <Text size="lg" color="inverse" className="text-xl mb-8 max-w-3xl mx-auto">
            Pre-made modular fixtures designed in Toronto. Ready to transform your home.
          </Text>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link href="/products" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full">
                Shop Pre-Made Fixtures
              </Button>
            </Link>
            <Link href="#portfolio" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full border-2 border-white text-white hover:bg-white hover:text-black">
                View Portfolio
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
