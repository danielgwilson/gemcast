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
              'Firecrawl API key is not configured. Please add FIRECRAWL_API_KEY to your .env.local file. You can get an API key from https://firecrawl.dev',
          };
        }

        const firecrawl = new Firecrawl({
          apiKey: process.env.FIRECRAWL_API_KEY,
        });

        // Validate query is not empty
        if (!query || query.trim().length === 0) {
          return {
            error: 'SEARCH FAILED: Query cannot be empty.',
          };
        }

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

        // Validate result exists
        if (!result) {
          return {
            error:
              'SEARCH FAILED: No results returned from search API. The search may have failed.',
          };
        }

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

        // Validate we got at least some results
        const webCount = searchResult.web?.length || 0;
        const newsCount = searchResult.news?.length || 0;
        const imagesCount = searchResult.images?.length || 0;
        const totalCount = webCount + newsCount + imagesCount;

        if (totalCount === 0) {
          return {
            success: true,
            query,
            web: [],
            news: [],
            images: [],
            webCount: 0,
            newsCount: 0,
            imagesCount: 0,
            message:
              'Search completed but no results found. Try refining your search query.',
          };
        }

        return {
          success: true,
          query,
          web: searchResult.web || [],
          news: searchResult.news || [],
          images: searchResult.images || [],
          webCount,
          newsCount,
          imagesCount,
        };
      } catch (error) {
        console.error('Error in firecrawlSearch tool:', error);

        if (error instanceof Error) {
          const errorMessage = error.message || '';

          if (
            errorMessage.includes('API key') ||
            errorMessage.includes('Unauthorized') ||
            errorMessage.includes('401')
          ) {
            return {
              error:
                'AUTHENTICATION FAILED: Invalid Firecrawl API key. Please contact support.',
            };
          }

          if (
            errorMessage.includes('Rate limit') ||
            errorMessage.includes('429') ||
            errorMessage.includes('quota')
          ) {
            return {
              error:
                'RATE LIMIT EXCEEDED: Too many search requests. Please try again later.',
            };
          }

          if (
            errorMessage.includes('Invalid') ||
            errorMessage.includes('400') ||
            errorMessage.includes('Bad Request')
          ) {
            return {
              error: `INVALID REQUEST: ${errorMessage}. Please check your search query and parameters.`,
            };
          }

          return {
            error: `SEARCH OPERATION FAILED: ${errorMessage}. The search did not succeed.`,
          };
        }

        return {
          error:
            'SEARCH OPERATION FAILED: An unexpected error occurred. The search did not succeed.',
        };
      }
    },
  });
