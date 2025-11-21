import { kratosFrontend } from '@/lib/auth/kratos';
import { OryFlowForm } from '@/components/auth/OryFlowForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Verify Email - Imajin',
  description: 'Verify your email address',
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { flow?: string };
}) {
  let flow;

  try {
    if (searchParams.flow) {
      const { data } = await kratosFrontend.getVerificationFlow({
        id: searchParams.flow,
      });
      flow = data;
    } else {
      const { data } = await kratosFrontend.createBrowserVerificationFlow();
      redirect(`/auth/verify?flow=${data.id}`);
    }
  } catch (error) {
    redirect('/auth/error?error=FlowExpired');
  }

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto text-center">
        <Heading level={1} className="mb-6">
          Verify Your Email
        </Heading>

        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded mb-6 text-left">
          <p className="font-medium mb-2">Verification email sent</p>
          <p className="text-sm">
            Check your email for a verification code and enter it below.
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <OryFlowForm flow={flow} />
        </div>
      </div>
    </Container>
  );
}
