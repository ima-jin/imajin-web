import { kratosFrontend } from '@/lib/auth/kratos';
import { OryFlowForm } from '@/components/auth/OryFlowForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/guards';

export const metadata = {
  title: 'Account Settings - Imajin',
  description: 'Manage your account settings',
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { flow?: string };
}) {
  await requireAuth();

  let flow;

  try {
    if (searchParams.flow) {
      const { data } = await kratosFrontend.getSettingsFlow({
        id: searchParams.flow,
      });
      flow = data;
    } else {
      const { data } = await kratosFrontend.createBrowserSettingsFlow();
      redirect(`/auth/settings?flow=${data.id}`);
    }
  } catch (error) {
    redirect('/auth/error?error=FlowExpired');
  }

  return (
    <Container className="py-12">
      <div className="max-w-2xl mx-auto">
        <Heading level={1} className="mb-8">
          Account Settings
        </Heading>

        <div className="space-y-8">
          <section className="bg-white border rounded-lg p-6">
            <Heading level={2} className="mb-4">
              Profile
            </Heading>
            <OryFlowForm flow={flow} />
          </section>

          <section className="bg-white border rounded-lg p-6">
            <Heading level={2} className="mb-4">
              Two-Factor Authentication
            </Heading>
            <p className="text-sm text-gray-600 mb-4">
              Secure your account with time-based one-time passwords (TOTP).
            </p>
            <OryFlowForm flow={flow} />
          </section>
        </div>
      </div>
    </Container>
  );
}
