import Firecrawl from '@mendable/firecrawl-js';
import { tool } from 'ai';
import { z } from 'zod';

export const firecrawlScrape = () =>
  tool({
    description:
      'Scrape a single webpage and extract its content in markdown, HTML, or raw HTML format. Use this to get the full content of a specific URL for research, content analysis, or data extraction.',
    inputSchema: z.object({
      url: z.string().url().describe('The URL to scrape'),
      formats: z
        .array(z.enum(['markdown', 'html', 'rawHtml']))
        .optional()
        .default(['markdown'])
        .describe('Output formats for scraped content'),
    }),
    execute: async ({ url, formats = ['markdown'] }) => {
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

        // Scrape returns Document directly (per Firecrawl SDK types)
        const result = await firecrawl.scrape(url, {
          formats: formats as ('markdown' | 'html' | 'rawHtml')[],
        });

        // Document interface: markdown, html, rawHtml, metadata, links, etc.
        const doc = result as {
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
        };

        return {
          success: true,
          url: doc.metadata?.sourceURL || url,
          data: {
            title: doc.metadata?.title,
            description: doc.metadata?.description,
            markdown: doc.markdown,
            html: doc.html,
            rawHtml: doc.rawHtml,
            links: doc.links || [],
            metadata: doc.metadata,
          },
        };
      } catch (error) {
        console.error('Error in firecrawlScrape tool:', error);

        if (error instanceof Error) {
          return {
            error: `Failed to scrape URL: ${error.message}`,
          };
        }

        return {
          error: 'An unexpected error occurred while scraping the URL.',
        };
      }
    },
  });

