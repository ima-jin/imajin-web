import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { UpdatesForm } from "@/components/updates/UpdatesForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Updates - Imajin",
  description: "Stay in the loop with Imajin. Get updates on new products, installations, and events.",
};

export default function UpdatesPage() {
  return (
    <main className="min-h-screen bg-black">
      <Container className="py-20 md:py-32">
        <div className="max-w-2xl mx-auto text-center">
          <Heading level={1} className="text-white text-4xl md:text-6xl font-light mb-6">
            Stay in the Loop
          </Heading>
          <Text size="lg" className="text-gray-300 mb-12 leading-relaxed">
            Get updates on new products, installations, and events. No spam, just the good stuff.
          </Text>

          <UpdatesForm />
        </div>
      </Container>
    </main>
  );
}
