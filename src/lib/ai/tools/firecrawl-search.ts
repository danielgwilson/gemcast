import Firecrawl from '@mendable/firecrawl-js';
import { tool } from 'ai';
import { z } from 'zod';

type FirecrawlSearchProps = {
  // No session needed - uses API key from env
};

export const firecrawlSearch = ({}: FirecrawlSearchProps) =>
  tool({
    description:
      'Scrape and research web content using Firecrawl to find experts, research topics, and validate podcast ideas. Use this for guest prospecting (scrape LinkedIn profiles, websites), competitor research, and content topic validation. Can scrape specific URLs or map websites to discover content.',
    inputSchema: z.object({
      action: z
        .enum(['scrape', 'map', 'crawl'])
        .describe(
          'Action to perform: "scrape" to scrape a single URL, "map" to discover URLs on a website, "crawl" to crawl a website and extract content'
        ),
      url: z
        .string()
        .url()
        .optional()
        .describe('URL to scrape or map (required for scrape and map actions)'),
      query: z
        .string()
        .optional()
        .describe('Search query or topic (useful for context when scraping)'),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe(
          'Maximum number of pages/URLs to process (default: 10, max: 100)'
        ),
      formats: z
        .array(z.enum(['markdown', 'html', 'rawHtml']))
        .optional()
        .default(['markdown'])
        .describe('Output formats for scraped content'),
    }),
    execute: async ({
      action,
      url,
      query,
      limit = 10,
      formats = ['markdown'],
    }) => {
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

        if (action === 'scrape') {
          if (!url) {
            return {
              error: 'URL is required for scrape action',
            };
          }

          const result = await firecrawl.scrape(url, {
            formats: formats as ('markdown' | 'html' | 'rawHtml')[],
          });

          return {
            success: true,
            action: 'scrape',
            url,
            data: {
              title: result.data?.title || result.metadata?.title,
              description:
                result.data?.description || result.metadata?.description,
              markdown: result.data?.markdown,
              html: result.data?.html,
              links: result.data?.links || [],
              metadata: result.metadata,
            },
          };
        }

        if (action === 'map') {
          if (!url) {
            return {
              error: 'URL is required for map action',
            };
          }

          const result = await firecrawl.map(url, {
            limit: Math.min(limit, 100),
          });

          return {
            success: true,
            action: 'map',
            url,
            links: result.links || [],
            count: result.links?.length || 0,
          };
        }

        if (action === 'crawl') {
          if (!url) {
            return {
              error: 'URL is required for crawl action',
            };
          }

          const result = await firecrawl.crawl(url, {
            limit: Math.min(limit, 100),
            scrapeOptions: {
              formats: formats as ('markdown' | 'html' | 'rawHtml')[],
            },
          });

          return {
            success: true,
            action: 'crawl',
            url,
            data:
              result.data?.map((page: any) => ({
                url: page.sourceURL || page.url,
                title: page.metadata?.title || page.data?.title,
                description:
                  page.metadata?.description || page.data?.description,
                markdown: page.data?.markdown,
                html: page.data?.html,
              })) || [],
            count: result.data?.length || 0,
          };
        }

        return {
          error: `Unknown action: ${action}`,
        };
      } catch (error) {
        console.error('Error in firecrawlSearch tool:', error);

        if (error instanceof Error) {
          return {
            error: `Failed to use Firecrawl: ${error.message}`,
          };
        }

        return {
          error: 'An unexpected error occurred while using Firecrawl.',
        };
      }
    },
  });
