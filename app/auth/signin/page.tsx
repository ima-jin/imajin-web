import { kratosFrontend } from '@/lib/auth/kratos';
import { OryFlowForm } from '@/components/auth/OryFlowForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sign In - Imajin',
  description: 'Sign in to your account',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { flow?: string; return_to?: string };
}) {
  let flow;

  try {
    if (searchParams.flow) {
      // Fetch existing flow
      const { data } = await kratosFrontend.getLoginFlow({
        id: searchParams.flow,
      });
      flow = data;
    } else {
      // Create new login flow
      const { data } = await kratosFrontend.createBrowserLoginFlow({
        returnTo: searchParams.return_to || '/account',
      });
      // Redirect to same page with flow ID
      redirect(`/auth/signin?flow=${data.id}`);
    }
  } catch (error) {
    // Flow expired or invalid - redirect to error page
    redirect('/auth/error?error=FlowExpired');
  }

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <Heading level={1} className="text-center mb-8">
          Sign In
        </Heading>

        <div className="bg-white border rounded-lg p-6">
          <OryFlowForm flow={flow} />

          <div className="mt-4 text-sm text-center space-y-2">
            <div>
              <a href="/auth/recovery" className="text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <div>
              Don&apos;t have an account?{' '}
              <a href="/auth/signup" className="text-blue-600 hover:underline">
                Sign up
              </a>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
