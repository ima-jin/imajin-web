import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { requireAuth } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'MFA Required - Imajin',
  description: 'Multi-factor authentication required',
};

export default async function MFARequiredPage() {
  const session = await requireAuth();

  // If already has MFA, redirect to admin
  if (session.authenticator_assurance_level === 'aal2') {
    redirect('/admin');
  }

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto text-center">
        <Heading level={1} className="mb-6 text-red-600">
          MFA Required
        </Heading>

        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded mb-6 text-left">
          <p className="font-medium mb-2">Administrator accounts require MFA</p>
          <p className="text-sm">
            For security, all admin accounts must have multi-factor authentication enabled.
            Please enable TOTP in your account settings.
          </p>
        </div>

        <Link href="/auth/settings">
          <Button className="w-full">Go to Account Settings</Button>
        </Link>

        <div className="mt-4 text-sm">
          <a href="/auth/signin" className="text-blue-600 hover:underline">
            Sign out
          </a>
        </div>
      </div>
    </Container>
  );
}
