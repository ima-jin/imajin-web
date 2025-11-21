'use client';

import { LoginFlow, RegistrationFlow, RecoveryFlow, SettingsFlow, VerificationFlow, UiNode } from '@ory/client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

type Flow = LoginFlow | RegistrationFlow | RecoveryFlow | SettingsFlow | VerificationFlow;

interface OryFlowFormProps {
  flow: Flow;
  onSuccess?: (returnTo?: string) => void;
}

export function OryFlowForm({ flow, onSuccess }: OryFlowFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(flow.ui.action, {
        method: flow.ui.method,
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect or callback
        if (onSuccess) {
          onSuccess(data.return_to);
        } else {
          router.push(data.return_to || '/account');
          router.refresh();
        }
      } else if (data.error) {
        setError(data.error.message || 'An error occurred');
      } else if (data.ui) {
        // Flow updated (e.g., validation errors) - reload page
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Global flow messages */}
      {flow.ui.messages?.map((message, idx) => (
        <div
          key={idx}
          className={`px-4 py-3 rounded text-sm ${
            message.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-600'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}
        >
          {message.text}
        </div>
      ))}

      {/* Component error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Render form fields from Ory flow */}
      {flow.ui.nodes.map((node: UiNode) => {
        const attrs = node.attributes as any;
        const isInput = node.type === 'input';
        const isSubmit = isInput && attrs.type === 'submit';
        const isHidden = isInput && attrs.type === 'hidden';
        const isButton = node.type === 'button';

        // Hidden inputs (CSRF token, flow ID)
        if (isHidden) {
          return <input key={attrs.name} {...attrs} />;
        }

        // Submit button
        if (isSubmit || isButton) {
          return (
            <Button
              key={attrs.name}
              type="submit"
              disabled={loading || attrs.disabled}
              className="w-full"
            >
              {loading ? 'Loading...' : (node.meta.label?.text || 'Submit')}
            </Button>
          );
        }

        // Input fields (text, email, password, etc.)
        if (isInput && !isHidden && !isSubmit) {
          return (
            <div key={attrs.name}>
              <Label htmlFor={attrs.name}>
                {node.meta.label?.text || attrs.name}
              </Label>
              <Input
                {...attrs}
                disabled={loading || attrs.disabled}
                className="w-full"
              />
              {/* Field-specific error messages */}
              {node.messages?.map((msg, msgIdx) => (
                <p key={msgIdx} className="text-sm text-red-600 mt-1">
                  {msg.text}
                </p>
              ))}
            </div>
          );
        }

        // Script nodes (for WebAuthn, etc.)
        if (node.type === 'script') {
          return (
            <script
              key={attrs.id}
              src={attrs.src}
              async={attrs.async}
              crossOrigin={attrs.crossorigin}
            />
          );
        }

        return null;
      })}
    </form>
  );
}
