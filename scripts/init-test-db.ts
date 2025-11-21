/**
 * Initialize test database schema
 * This script creates the database schema directly using SQL
 */

import postgres from 'postgres';

// Hardcode test database connection
const connectionString = 'postgresql://imajin:imajin_dev@localhost:5435/imajin_test';

async function main() {
  console.log('🔧 Initializing test database schema...\n');

  const client = postgres(connectionString);

  try {
    // Check if contacts table exists
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'contacts'
      ) as exists
    `;

    if (result[0].exists) {
      console.log('✅ Test database schema already exists\n');
      await client.end();
      return;
    }

    console.log('Creating schema...\n');

    // Create contacts table
    await client`
      CREATE TABLE contacts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid,
        kind text NOT NULL,
        value text NOT NULL,
        is_primary boolean NOT NULL DEFAULT false,
        is_verified boolean NOT NULL DEFAULT false,
        verified_at timestamp,
        source text NOT NULL,
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT uniq_contacts_value_kind UNIQUE (value, kind)
      )
    `;

    await client`
      CREATE INDEX idx_contacts_user ON contacts(user_id)
    `;
    await client`
      CREATE INDEX idx_contacts_kind ON contacts(kind)
    `;
    await client`
      CREATE INDEX idx_contacts_value ON contacts(value)
    `;

    // Create mailing_lists table
    await client`
      CREATE TABLE mailing_lists (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text UNIQUE NOT NULL,
        name text NOT NULL,
        description text,
        is_default boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `;

    await client`
      CREATE INDEX idx_mailing_lists_slug ON mailing_lists(slug)
    `;

    // Create contact_subscriptions table
    await client`
      CREATE TABLE contact_subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        contact_id uuid NOT NULL,
        mailing_list_id uuid NOT NULL,
        status text NOT NULL,
        opt_in_at timestamp,
        opt_out_at timestamp,
        opt_in_ip text,
        opt_in_user_agent text,
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT uniq_contact_subscription UNIQUE (contact_id, mailing_list_id)
      )
    `;

    await client`
      CREATE INDEX idx_contact_subs_contact ON contact_subscriptions(contact_id)
    `;
    await client`
      CREATE INDEX idx_contact_subs_list ON contact_subscriptions(mailing_list_id)
    `;
    await client`
      CREATE INDEX idx_contact_subs_status ON contact_subscriptions(status)
    `;

    // Create contact_verification_tokens table
    await client`
      CREATE TABLE contact_verification_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        contact_id uuid NOT NULL,
        mailing_list_id uuid NOT NULL,
        token text UNIQUE NOT NULL,
        expires_at timestamp NOT NULL,
        used_at timestamp,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `;

    await client`
      CREATE INDEX idx_verification_tokens_contact ON contact_verification_tokens(contact_id)
    `;
    await client`
      CREATE INDEX idx_verification_tokens_token ON contact_verification_tokens(token)
    `;
    await client`
      CREATE INDEX idx_verification_tokens_expires ON contact_verification_tokens(expires_at)
    `;

    // Seed mailing lists
    await client`
      INSERT INTO mailing_lists (slug, name, description, is_default)
      VALUES
        ('newsletter', 'Newsletter', 'Monthly updates about new products and company news', false),
        ('product-alerts', 'Product Alerts', 'Get notified when new products launch or restock', false),
        ('order-updates', 'Order Updates', 'Transactional emails about your orders (required)', true),
        ('sms-alerts', 'SMS Alerts', 'Urgent notifications via text message', false)
    `;

    console.log('✅ Test database schema created successfully!\n');
  } catch (error) {
    console.error('❌ Failed to initialize test database:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
