import { kratosFrontend } from '@/lib/auth/kratos';
import { OryFlowForm } from '@/components/auth/OryFlowForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Reset Password - Imajin',
  description: 'Reset your password',
};

export default async function RecoveryPage({
  searchParams,
}: {
  searchParams: { flow?: string };
}) {
  let flow;

  try {
    if (searchParams.flow) {
      const { data } = await kratosFrontend.getRecoveryFlow({
        id: searchParams.flow,
      });
      flow = data;
    } else {
      const { data } = await kratosFrontend.createBrowserRecoveryFlow();
      redirect(`/auth/recovery?flow=${data.id}`);
    }
  } catch (error) {
    redirect('/auth/error?error=FlowExpired');
  }

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <Heading level={1} className="text-center mb-8">
          Reset Password
        </Heading>

        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-4">
            Enter your email address and we&apos;ll send you a recovery code.
          </p>

          <OryFlowForm flow={flow} />

          <div className="mt-4 text-sm text-center">
            <a href="/auth/signin" className="text-blue-600 hover:underline">
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
