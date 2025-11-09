import Firecrawl from '@mendable/firecrawl-js';
import { tool } from 'ai';
import { z } from 'zod';

export const firecrawlMap = () =>
  tool({
    description:
      'Map a website to discover all URLs quickly. Use this to get a complete list of URLs from a website without scraping the content. Useful for site discovery, sitemap generation, or finding all pages on a site.',
    inputSchema: z.object({
      url: z.string().url().describe('The root URL to map'),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe(
          'Maximum number of URLs to discover (default: 10, max: 100)'
        ),
      search: z
        .string()
        .optional()
        .describe('Search query to filter discovered URLs'),
      sitemap: z
        .enum(['only', 'include', 'skip'])
        .optional()
        .describe('How to handle sitemap (only sitemap, include sitemap, or skip sitemap)'),
    }),
    execute: async ({ url, limit = 10, search, sitemap }) => {
      try {
        if (!process.env.FIRECRAWL_API_KEY) {
          return {
            error:
              'Firecrawl API key is not configured. Please contact support.',
          };
        }

        const firecrawl = new Firecrawl({
          apiKey: process.env.FIRECRAWL_API_KEY,
        });

        // Map returns MapData with links: SearchResultWeb[]
        const result = await firecrawl.map(url, {
          limit: Math.min(limit, 100),
          search,
          sitemap,
        });

        // MapData interface: { links: SearchResultWeb[] }
        // SearchResultWeb: { url: string, title?: string, description?: string, category?: string }
        const mapResult = result as {
          links?: Array<{
            url: string;
            title?: string;
            description?: string;
            category?: string;
          }>;
        };

        return {
          success: true,
          url,
          links: mapResult.links?.map((link) => link.url) || [],
          linksWithMetadata: mapResult.links || [],
          count: mapResult.links?.length || 0,
        };
      } catch (error) {
        console.error('Error in firecrawlMap tool:', error);

        if (error instanceof Error) {
          return {
            error: `Failed to map website: ${error.message}`,
          };
        }

        return {
          error: 'An unexpected error occurred while mapping the website.',
        };
      }
    },
  });

