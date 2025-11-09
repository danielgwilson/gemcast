import Firecrawl from '@mendable/firecrawl-js';
import { tool } from 'ai';
import { z } from 'zod';

export const firecrawlCrawl = () =>
  tool({
    description:
      'Crawl an entire website and extract content from multiple pages. Use this to comprehensively gather content from a website, blog, or documentation site. The crawl will discover and scrape pages automatically.',
    inputSchema: z.object({
      url: z.string().url().describe('The root URL to start crawling from'),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe('Maximum number of pages to crawl (default: 10, max: 100)'),
      formats: z
        .array(z.enum(['markdown', 'html', 'rawHtml']))
        .optional()
        .default(['markdown'])
        .describe('Output formats for scraped content'),
      excludePaths: z
        .array(z.string())
        .optional()
        .describe('URL patterns to exclude from crawling'),
      includePaths: z
        .array(z.string())
        .optional()
        .describe('URL patterns to include in crawling'),
    }),
    execute: async ({
      url,
      limit = 10,
      formats = ['markdown'],
      excludePaths,
      includePaths,
    }) => {
      try {
        if (!process.env.FIRECRAWL_API_KEY) {
          return {
            error:
              'Firecrawl API key is not configured. Please add FIRECRAWL_API_KEY to your .env.local file. You can get an API key from https://firecrawl.dev',
          };
        }

        const firecrawl = new Firecrawl({
          apiKey: process.env.FIRECRAWL_API_KEY,
        });

        // Crawl is a waiter that blocks until completion
        // Returns CrawlJob: { status, data: Document[], total, completed, etc. }
        const result = await firecrawl.crawl(url, {
          limit: Math.min(limit, 100),
          pollInterval: 1,
          timeout: 120,
          excludePaths: excludePaths || undefined,
          includePaths: includePaths || undefined,
          scrapeOptions: {
            formats: formats as ('markdown' | 'html' | 'rawHtml')[],
          },
        });

        // CrawlJob interface: { status, data: Document[], total, completed, creditsUsed, etc. }
        const crawlResult = result as {
          status: 'scraping' | 'completed' | 'failed' | 'cancelled';
          data: Array<{
            markdown?: string;
            html?: string;
            rawHtml?: string;
            metadata?: {
              title?: string;
              description?: string;
              sourceURL?: string;
              [key: string]: unknown;
            };
            links?: string[];
            [key: string]: unknown;
          }>;
          total?: number;
          completed?: number;
        };

        return {
          success: true,
          url,
          status: crawlResult.status,
          data: Array.isArray(crawlResult.data)
            ? crawlResult.data.map((page) => ({
                url: page.metadata?.sourceURL || url,
                title: page.metadata?.title,
                description: page.metadata?.description,
                markdown: page.markdown,
                html: page.html,
                rawHtml: page.rawHtml,
                links: page.links || [],
                metadata: page.metadata,
              }))
            : [],
          count: Array.isArray(crawlResult.data) ? crawlResult.data.length : 0,
          total: crawlResult.total,
          completed: crawlResult.completed,
        };
      } catch (error) {
        console.error('Error in firecrawlCrawl tool:', error);

        if (error instanceof Error) {
          return {
            error: `Failed to crawl website: ${error.message}`,
          };
        }

        return {
          error: 'An unexpected error occurred while crawling the website.',
        };
      }
    },
  });
