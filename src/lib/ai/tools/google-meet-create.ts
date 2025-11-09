import { tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { createMeetSpace, getMeetClient } from '@/lib/google/meet';

type GoogleMeetCreateProps = {
  session: Session;
};

export const googleMeetCreate = ({ session }: GoogleMeetCreateProps) =>
  tool({
    description:
      'Create Google Meet spaces/conferences for podcast recording sessions. Use this when scheduling recording events to generate Meet links.',
    inputSchema: z.object({
      accessType: z
        .enum(['OPEN', 'TRUSTED', 'RESTRICTED'])
        .optional()
        .default('OPEN')
        .describe('Access type for the Meet space: OPEN (anyone with link), TRUSTED (domain users), RESTRICTED (invite only)'),
    }),
    execute: async ({ accessType = 'OPEN' }) => {
      try {
        if (!session.accessToken) {
          return {
            error:
              'No access token available. Please sign out and sign back in to refresh your Google authentication.',
          };
        }

        // Get Meet client - this will throw if credentials are missing
        let meet: ReturnType<typeof getMeetClient>;
        try {
          meet = getMeetClient(session);
        } catch (clientError) {
          if (clientError instanceof Error) {
            return {
              error: `Failed to initialize Meet client: ${clientError.message}`,
            };
          }
          return {
            error: 'Failed to initialize Meet client: Unknown error',
          };
        }

        const space = await createMeetSpace(meet, {
          config: {
            accessType: accessType as 'OPEN' | 'TRUSTED' | 'RESTRICTED',
          },
        });

        // Validate critical fields
        if (!space || !space.meetingUri) {
          return {
            error:
              'CRITICAL: Meet space creation failed - no meeting URI returned. The Meet space was NOT created.',
          };
        }

        if (!space.name) {
          return {
            error:
              'CRITICAL: Meet space creation incomplete - meeting URI exists but space name is missing.',
          };
        }

        return {
          success: true,
          space: {
            name: space.name,
            meetingUri: space.meetingUri,
            meetingCode: space.meetingCode,
            accessType: space.config?.accessType,
          },
        };
      } catch (error) {
        console.error('Error in googleMeetCreate tool:', error);

        if (error instanceof Error) {
          const errorMessage = error.message || '';

          if (
            errorMessage.includes('Invalid Credentials') ||
            errorMessage.includes('401') ||
            errorMessage.includes('expired access token') ||
            errorMessage.includes('No access token')
          ) {
            return {
              error:
                'AUTHENTICATION FAILED: Invalid or expired Google access token. Please sign out and sign back in to refresh your Google authentication.',
            };
          }

          if (
            errorMessage.includes('403') ||
            errorMessage.includes('Permission denied') ||
            errorMessage.includes('Permission')
          ) {
            return {
              error:
                'PERMISSION DENIED: Google Meet access was denied. Make sure you have granted the necessary Google Meet permissions.',
            };
          }

          if (
            errorMessage.includes('GOOGLE_CLIENT_ID') ||
            errorMessage.includes('GOOGLE_CLIENT_SECRET') ||
            (errorMessage.includes('Missing') &&
              errorMessage.includes('environment'))
          ) {
            return {
              error:
                'SERVER CONFIGURATION ERROR: Missing Google OAuth credentials on the server. Please contact support.',
            };
          }

          return {
            error: `MEET OPERATION FAILED: ${errorMessage}. The operation did not succeed.`,
          };
        }

        return {
          error:
            'MEET OPERATION FAILED: An unexpected error occurred. The operation did not succeed.',
        };
      }
    },
  });

