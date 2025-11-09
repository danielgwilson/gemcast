import Firecrawl from '@mendable/firecrawl-js';
import { tool } from 'ai';
import { z } from 'zod';

export const firecrawlSearch = () =>
  tool({
    description:
      'Search the web and optionally scrape search results. Use this to find relevant web pages, articles, or content based on a search query. Can search across web, news, and images sources.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
      sources: z
        .array(z.enum(['web', 'news', 'images']))
        .optional()
        .default(['web'])
        .describe('Sources to search (web, news, images)'),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe('Maximum number of results to return (default: 10)'),
      scrapeOptions: z
        .object({
          formats: z
            .array(z.enum(['markdown', 'html', 'rawHtml']))
            .optional()
            .default(['markdown']),
        })
        .optional()
        .describe('Options for scraping search results'),
    }),
    execute: async ({
      query,
      sources = ['web'],
      limit = 10,
      scrapeOptions,
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

        // Search returns SearchData with web/news/images arrays
        const result = await firecrawl.search(query, {
          sources: sources.map((s) => ({ type: s })),
          limit,
          scrapeOptions: scrapeOptions
            ? {
                formats: scrapeOptions.formats as (
                  | 'markdown'
                  | 'html'
                  | 'rawHtml'
                )[],
              }
            : undefined,
        });

        // SearchData interface: { web?: Array<SearchResultWeb | Document>, news?: ..., images?: ... }
        const searchResult = result as {
          web?: Array<
            | {
                url: string;
                title?: string;
                description?: string;
                category?: string;
              }
            | {
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
              }
          >;
          news?: Array<{
            title?: string;
            url?: string;
            snippet?: string;
            date?: string;
            imageUrl?: string;
            position?: number;
            category?: string;
          }>;
          images?: Array<{
            title?: string;
            imageUrl?: string;
            imageWidth?: number;
            imageHeight?: number;
            url?: string;
            position?: number;
          }>;
        };

        return {
          success: true,
          query,
          web: searchResult.web || [],
          news: searchResult.news || [],
          images: searchResult.images || [],
          webCount: searchResult.web?.length || 0,
          newsCount: searchResult.news?.length || 0,
          imagesCount: searchResult.images?.length || 0,
        };
      } catch (error) {
        console.error('Error in firecrawlSearch tool:', error);

        if (error instanceof Error) {
          return {
            error: `Failed to search: ${error.message}`,
          };
        }

        return {
          error: 'An unexpected error occurred while searching.',
        };
      }
    },
  });
