import Firecrawl from '@mendable/firecrawl-js';
import { tool } from 'ai';
import { z } from 'zod';

export const firecrawlExtract = () =>
  tool({
    description:
      'Extract structured data from web pages using natural language prompts or JSON schemas. Use this to extract specific information like product details, contact info, or any structured data from web pages.',
    inputSchema: z.object({
      urls: z
        .array(z.string().url())
        .describe('URLs to extract data from'),
      prompt: z
        .string()
        .optional()
        .describe(
          'Natural language prompt describing what to extract (e.g., "Extract product name, price, and description")'
        ),
      schema: z
        .record(z.unknown())
        .optional()
        .describe('JSON schema defining the structure to extract'),
      allowExternalLinks: z
        .boolean()
        .optional()
        .default(false)
        .describe('Allow extraction from external links'),
      enableWebSearch: z
        .boolean()
        .optional()
        .default(false)
        .describe('Enable web search for additional context'),
    }),
    execute: async ({
      urls,
      prompt,
      schema,
      allowExternalLinks = false,
      enableWebSearch = false,
    }) => {
      try {
        if (!process.env.FIRECRAWL_API_KEY) {
          return {
            error:
              'Firecrawl API key is not configured. Please contact support.',
          };
        }

        if (!prompt && !schema) {
          return {
            error: 'Either prompt or schema must be provided for extraction.',
          };
        }

        const firecrawl = new Firecrawl({
          apiKey: process.env.FIRECRAWL_API_KEY,
        });

        // Extract returns ExtractResponse with data, status, etc.
        const result = await firecrawl.extract({
          urls,
          prompt,
          schema: schema as Record<string, unknown> | undefined,
          allowExternalLinks,
          enableWebSearch,
          pollInterval: 1,
          timeout: 120,
        });

        // ExtractResponse interface: { success, data, error?, warning?, sources? }
        const extractResult = result as {
          success?: boolean;
          data?: unknown;
          error?: string;
          warning?: string;
          sources?: Record<string, unknown>;
        };

        return {
          success: extractResult.success ?? true,
          data: extractResult.data,
          warning: extractResult.warning,
          sources: extractResult.sources,
          error: extractResult.error,
        };
      } catch (error) {
        console.error('Error in firecrawlExtract tool:', error);

        if (error instanceof Error) {
          return {
            error: `Failed to extract data: ${error.message}`,
          };
        }

        return {
          error: 'An unexpected error occurred while extracting data.',
        };
      }
    },
  });

