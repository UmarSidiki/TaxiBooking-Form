import type { MetadataRoute } from 'next';

/** Block all paths for every crawler (saves Vercel bandwidth / Fluid CPU from bot traffic). */
const DISALLOW_ALL = '/';

/** Known AI / LLM crawlers (explicit rules in addition to `*`). */
const LLM_AND_AGGRESSIVE_BOTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'Google-Extended',
  'GoogleOther',
  'anthropic-ai',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'Diffbot',
  'FacebookBot',
  'meta-externalagent',
  'Applebot-Extended',
  'ImagesiftBot',
  'Omgilibot',
  'Omgili',
  'YouBot',
  'Amazonbot',
  'Ai2Bot',
  'PhindBot',
  'Timpibot',
  'Webzio-Extended',
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: DISALLOW_ALL,
      },
      ...LLM_AND_AGGRESSIVE_BOTS.map((userAgent) => ({
        userAgent,
        disallow: DISALLOW_ALL,
      })),
    ],
  };
}
