/**
 * Fetches non-secret site settings from MongoDB at build time.
 * Run automatically before `next build` when MONGODB_URI is set (e.g. on Vercel).
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '../src/config/baked-settings.json');

const defaults = {
  adminEmail: null,
  stripeCurrency: 'EUR',
  primaryColor: '#EAB308',
  syncedAt: null,
};

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('[sync-build-settings] MONGODB_URI not set — keeping existing baked-settings.json');
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const doc = await db.collection('settings').findOne({});

    const baked = {
      adminEmail: doc?.adminEmail ?? process.env.ADMIN_EMAIL ?? null,
      stripeCurrency: doc?.stripeCurrency ?? 'EUR',
      primaryColor: doc?.primaryColor ?? '#EAB308',
      syncedAt: new Date().toISOString(),
    };

    writeFileSync(outputPath, `${JSON.stringify(baked, null, 2)}\n`, 'utf8');
    console.log('[sync-build-settings] Wrote baked settings to', outputPath);
  } catch (error) {
    console.warn('[sync-build-settings] Failed to sync from MongoDB:', error.message);
    console.warn('[sync-build-settings] Build will continue with existing/default baked settings');
  } finally {
    await client.close();
  }
}

main();
