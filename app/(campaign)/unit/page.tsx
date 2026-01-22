import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "The Unit - Imajin",
  description: "The Unit is a Volumetric Light prototype from Imajin Lighting. 518 individually addressable LEDs float on minimalist grids.",
};

export default function UnitPage() {
  return (
    <main className={`min-h-screen bg-black ${spaceGrotesk.variable}`}>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <Container>
          {/* Unit Image */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="relative w-full aspect-[16/9]">
              <Image
                src="/images/media/unit-landed.png"
                alt="The Unit Has Landed - Volumetric Light Sculpture"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>

          {/* Subheading */}
          <div className="text-center mb-20">
            <Heading level={2} className="text-white text-2xl md:text-3xl font-normal max-w-3xl mx-auto leading-relaxed font-[family-name:var(--font-space-grotesk)]">
              The Unit is a Volumetric Light prototype from Imajin Lighting.
            </Heading>
          </div>

          {/* Content Sections */}
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Section 1 */}
            <div>
              <Heading level={3} className="text-white text-lg md:text-xl font-medium mb-3 tracking-wide font-[family-name:var(--font-space-grotesk)]">
                OUR BUILDING MATERIAL? LIGHT ITSELF
              </Heading>
              <Text className="text-gray-50 text-base md:text-lg leading-relaxed font-[family-name:var(--font-space-grotesk)]">
                518 individually addressable LEDs float on minimalist grids. We shave away as much material as possible, so that light itself becomes the construction medium.
              </Text>
            </div>

            {/* Section 2 */}
            <div>
              <Heading level={3} className="text-white text-lg md:text-xl font-medium mb-3 tracking-wide font-[family-name:var(--font-space-grotesk)]">
                INTERACTIVE AND ALIVE
              </Heading>
              <Text className="text-gray-50 text-base md:text-lg leading-relaxed font-[family-name:var(--font-space-grotesk)]">
                The Unit can respond to your voice and movement. The patterns pulse with organic depth. It speaks in standard lighting protocols, but thinks in Three Dimensional Space.
              </Text>
            </div>

            {/* Section 3 */}
            <div>
              <Heading level={3} className="text-white text-lg md:text-xl font-medium mb-3 tracking-wide font-[family-name:var(--font-space-grotesk)]">
                OPEN SOURCE LIBRARY OF LIGHT PATTERNS
              </Heading>
              <Text className="text-gray-50 text-base md:text-lg leading-relaxed font-[family-name:var(--font-space-grotesk)]">
                Our patterns range from subdued-and-practical to simulated acid trips. Users create and share their own patterns. All in a forever-free library.
              </Text>
            </div>

            {/* Section 4 */}
            <div>
              <Heading level={3} className="text-white text-lg md:text-xl font-medium mb-3 tracking-wide font-[family-name:var(--font-space-grotesk)]">
                OPEN SOURCE HARDWARE
              </Heading>
              <Text className="text-gray-50 text-base md:text-lg leading-relaxed font-[family-name:var(--font-space-grotesk)]">
                Like Arduino or Raspberry Pi, our hardware is totally open source. A creative framework for lighting artists everywhere. We can work directly on design and installation projects, but our goal is to inspire a growing community of designers and experience makers.
              </Text>
            </div>
          </div>

          {/* CTA Links */}
          <div className="max-w-2xl mx-auto mt-20 text-center">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center font-[family-name:var(--font-space-grotesk)]">
              <a
                href="mailto:info@imajin.ca"
                className="text-gray-300 hover:text-white transition-colors text-lg underline underline-offset-4"
              >
                Email us to collaborate
              </a>
              <a
                href="https://instagram.com/imajin.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors text-lg underline underline-offset-4"
              >
                Follow us on IG
              </a>
              <Link
                href="/updates"
                className="text-gray-300 hover:text-white transition-colors text-lg underline underline-offset-4"
              >
                Get updates
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
