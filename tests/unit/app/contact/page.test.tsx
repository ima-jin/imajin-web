/**
 * Contact Page Tests
 * Phase 2.4.7 - Phase 4
 *
 * Tests for the contact page (app/contact/page.tsx)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactPage from '@/app/contact/page';

describe('ContactPage', () => {
  it('should render contact page', async () => {
    render(await ContactPage());

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should display email: info@imajin.ca', async () => {
    render(await ContactPage());

    // There are multiple instances of the email on the page (one for each contact method)
    const emails = screen.getAllByText('info@imajin.ca');
    expect(emails.length).toBeGreaterThan(0);
    expect(emails[0]).toBeInTheDocument();
  });

  it('should have mailto link for email', async () => {
    render(await ContactPage());

    // There are multiple mailto links on the page, get all of them
    const links = screen.getAllByRole('link', { name: /info@imajin\.ca/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', 'mailto:info@imajin.ca');
  });

  it('should have page heading', async () => {
    render(await ContactPage());

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toMatch(/contact|get in touch|reach us/i);
  });

  it('should use Container layout', async () => {
    const { container } = render(await ContactPage());

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();

    // Container component uses mx-auto and max-w-* classes, check for proper structure
    const hasContainer = container.querySelector('.mx-auto') || container.querySelector('main > div');
    expect(hasContainer).toBeInTheDocument();
  });
});
