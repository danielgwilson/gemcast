import Firecrawl from '@mendable/firecrawl-js';
import { tool } from 'ai';
import { z } from 'zod';

export const firecrawlScrape = tool({
  description:
    'Firecrawl web scraping tool: Scrape a single webpage and extract its content in markdown, HTML, or raw HTML format. Use this to get the full content of a specific URL for research, content analysis, or data extraction. This tool accesses web pages and extracts their content.',
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
            'Firecrawl API key is not configured. Please add FIRECRAWL_API_KEY to your .env.local file. You can get an API key from https://firecrawl.dev',
        };
      }

      const firecrawl = new Firecrawl({
        apiKey: process.env.FIRECRAWL_API_KEY,
      });

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return {
          error: `INVALID URL: "${url}" is not a valid URL format.`,
        };
      }

      // Scrape returns Document directly (per Firecrawl SDK types)
      const result = await firecrawl.scrape(url, {
        formats: formats as ('markdown' | 'html' | 'rawHtml')[],
      });

      // Validate result exists
      if (!result) {
        return {
          error:
            'SCRAPE FAILED: No content returned from scrape API. The page may be inaccessible or the scrape may have failed.',
        };
      }

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

      // Validate we got at least some content
      const hasContent =
        doc.markdown ||
        doc.html ||
        doc.rawHtml ||
        doc.metadata?.title ||
        doc.metadata?.description;

      if (!hasContent) {
        return {
          error:
            'SCRAPE FAILED: Page scraped but no content was extracted. The page may be empty or inaccessible.',
          url: doc.metadata?.sourceURL || url,
        };
      }

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
        const errorMessage = error.message || '';

        if (
          errorMessage.includes('API key') ||
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('401')
        ) {
          return {
            error:
              'AUTHENTICATION FAILED: Invalid Firecrawl API key. Please check that your FIRECRAWL_API_KEY in .env.local is correct. You can get an API key from https://firecrawl.dev',
          };
        }

        if (
          errorMessage.includes('Rate limit') ||
          errorMessage.includes('429') ||
          errorMessage.includes('quota')
        ) {
          return {
            error:
              'RATE LIMIT EXCEEDED: Too many scrape requests. Please try again later.',
          };
        }

        if (
          errorMessage.includes('404') ||
          errorMessage.includes('Not Found') ||
          errorMessage.includes('not found')
        ) {
          return {
            error: `PAGE NOT FOUND: The URL "${url}" could not be found or is not accessible.`,
          };
        }

        if (
          errorMessage.includes('timeout') ||
          errorMessage.includes('Timeout') ||
          errorMessage.includes('timed out')
        ) {
          return {
            error:
              'SCRAPE TIMEOUT: The page took too long to load. Please try again later.',
          };
        }

        return {
          error: `SCRAPE OPERATION FAILED: ${errorMessage}. The scrape did not succeed.`,
        };
      }

      return {
        error:
          'SCRAPE OPERATION FAILED: An unexpected error occurred. The scrape did not succeed.',
      };
    }
  },
});
