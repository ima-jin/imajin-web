import Link from "next/link";

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
    <section className="relative bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Modular LED Fixtures
            <br />
            <span className="text-gray-400">Designed for Creators</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Build custom lighting solutions with our modular LED system.
            Design, manufacture, and install with precision.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/products"
              className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors w-full sm:w-auto text-center"
            >
              Shop Products
            </Link>
            <Link
              href="#featured"
              className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition-colors w-full sm:w-auto text-center"
            >
              Learn More
            </Link>
          </div>

          {/* Key Features */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            <div>
              <h3 className="text-lg font-semibold mb-2">Modular Design</h3>
              <p className="text-gray-400 text-sm">
                Build fixtures from 8x8 panels. Scale from small to large installations.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Professional Quality</h3>
              <p className="text-gray-400 text-sm">
                High-output LEDs with consistent color temperature. Built to last.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">DIY or Assembled</h3>
              <p className="text-gray-400 text-sm">
                Choose DIY kits for hands-on building or fully assembled units ready to install.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
