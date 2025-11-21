import { kratosFrontend } from '@/lib/auth/kratos';
import { OryFlowForm } from '@/components/auth/OryFlowForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sign Up - Imajin',
  description: 'Create your account',
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: { flow?: string };
}) {
  let flow;

  try {
    if (searchParams.flow) {
      const { data } = await kratosFrontend.getRegistrationFlow({
        id: searchParams.flow,
      });
      flow = data;
    } else {
      const { data } = await kratosFrontend.createBrowserRegistrationFlow();
      redirect(`/auth/signup?flow=${data.id}`);
    }
  } catch (error) {
    redirect('/auth/error?error=FlowExpired');
  }

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <Heading level={1} className="text-center mb-8">
          Sign Up
        </Heading>

        <div className="bg-white border rounded-lg p-6">
          <OryFlowForm flow={flow} />

          <div className="mt-4 text-sm text-center">
            Already have an account?{' '}
            <a href="/auth/signin" className="text-blue-600 hover:underline">
              Sign in
            </a>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-4 text-center">
          Password must be at least 10 characters.
        </p>
      </div>
    </Container>
  );
}
