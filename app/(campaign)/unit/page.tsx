import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Unit - Imajin",
  description: "The Unit is a Volumetric Light prototype from Imajin Lighting. 518 individually addressable LEDs float on minimalist grids.",
};

export default function UnitPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <Container>
          <div className="text-center mb-16">
            <Heading level={1} className="text-white text-5xl md:text-7xl font-light mb-8 tracking-tight">
              THE UNIT HAS LANDED
            </Heading>
          </div>

          {/* Unit Image */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden">
              {/* TODO: Replace with actual image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Text className="text-gray-600 text-lg">The Unit Image</Text>
              </div>
            </div>
          </div>

          {/* Subheading */}
          <div className="text-center mb-20">
            <Heading level={2} className="text-white text-3xl md:text-4xl font-light max-w-3xl mx-auto leading-relaxed">
              The Unit is a Volumetric Light prototype from Imajin Lighting.
            </Heading>
          </div>

          {/* Content Sections */}
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Section 1 */}
            <div>
              <Heading level={3} className="text-white text-xl md:text-2xl font-medium mb-4 tracking-wide">
                OUR BUILDING MATERIAL? LIGHT ITSELF
              </Heading>
              <Text className="text-gray-300 text-lg leading-relaxed">
                518 individually addressable LEDs float on minimalist grids. We shave away as much material as possible, so that light itself becomes the construction medium.
              </Text>
            </div>

            {/* Section 2 */}
            <div>
              <Heading level={3} className="text-white text-xl md:text-2xl font-medium mb-4 tracking-wide">
                INTERACTIVE AND ALIVE
              </Heading>
              <Text className="text-gray-300 text-lg leading-relaxed">
                The Unit can respond to your voice and movement. The patterns pulse with organic depth. It speaks in standard lighting protocols, but thinks in Three Dimensional Space.
              </Text>
            </div>

            {/* Section 3 */}
            <div>
              <Heading level={3} className="text-white text-xl md:text-2xl font-medium mb-4 tracking-wide">
                OPEN SOURCE LIBRARY OF LIGHT PATTERNS
              </Heading>
              <Text className="text-gray-300 text-lg leading-relaxed">
                Our patterns range from subdued-and-practical to simulated acid trips. Users create and share their own patterns. All in a forever-free library.
              </Text>
            </div>

            {/* Section 4 */}
            <div>
              <Heading level={3} className="text-white text-xl md:text-2xl font-medium mb-4 tracking-wide">
                OPEN SOURCE HARDWARE
              </Heading>
              <Text className="text-gray-300 text-lg leading-relaxed">
                Like Arduino or Raspberry Pi, our hardware is totally open source. A creative framework for lighting artists everywhere. We can work directly on design and installation projects, but our goal is to inspire a growing community of designers and experience makers.
              </Text>
            </div>
          </div>

          {/* CTA Links */}
          <div className="max-w-2xl mx-auto mt-20 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:info@imajin.ca">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Email us to collaborate
                </Button>
              </a>
              <a href="https://instagram.com/imajin.ai" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Follow us on IG
                </Button>
              </a>
            </div>
            <div className="text-center">
              <Link href="/updates">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Get updates
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
