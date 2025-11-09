import { tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { createDraftEmail, getGmailClient } from '@/lib/google/gmail';

type GmailProps = {
  session: Session;
};

export const gmail = ({ session }: GmailProps) =>
  tool({
    description:
      'Create draft emails in Gmail for guest outreach. Use this to draft personalized outreach emails that the user can review and send. The email will be created as a draft in the user\'s Gmail.',
    inputSchema: z.object({
      to: z
        .string()
        .email()
        .describe('Recipient email address'),
      subject: z
        .string()
        .describe('Email subject line'),
      body: z
        .string()
        .describe('Email body content (HTML supported)'),
      fromName: z
        .string()
        .optional()
        .describe('Sender name (optional, defaults to user\'s Gmail account name)'),
    }),
    execute: async ({ to, subject, body, fromName }) => {
      try {
        if (!session.accessToken) {
          return {
            error:
              'No access token available. Please sign out and sign back in to refresh your Google authentication.',
          };
        }

        // Get Gmail client - this will throw if credentials are missing
        let gmailClient: ReturnType<typeof getGmailClient>;
        try {
          gmailClient = getGmailClient(session);
        } catch (clientError) {
          if (clientError instanceof Error) {
            return {
              error: `Failed to initialize Gmail client: ${clientError.message}`,
            };
          }
          return {
            error: 'Failed to initialize Gmail client: Unknown error',
          };
        }

        // Format body as HTML if it contains HTML tags, otherwise wrap in <p> tags
        const htmlBody = body.includes('<') && body.includes('>')
          ? body
          : `<p>${body.replace(/\n/g, '<br>')}</p>`;

        const draft = await createDraftEmail(gmailClient, {
          to,
          subject,
          body: htmlBody,
          fromName,
        });

        // Validate critical fields
        if (!draft || !draft.id) {
          return {
            error:
              'CRITICAL: Draft email creation failed - no draft ID returned. The draft was NOT created.',
          };
        }

        if (!draft.draftLink) {
          return {
            error: `CRITICAL: Draft email creation incomplete - draft ID ${draft.id} exists but has no draft link. The draft may not be accessible.`,
          };
        }

        return {
          success: true,
          draft: {
            id: draft.id,
            messageId: draft.messageId,
            threadId: draft.threadId,
            draftLink: draft.draftLink,
          },
          message: `Draft email created successfully. You can review and send it from: ${draft.draftLink}`,
        };
      } catch (error) {
        console.error('Error in gmail tool:', error);

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
                'PERMISSION DENIED: Gmail access was denied. Make sure you have granted the necessary Gmail permissions.',
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
            error: `GMAIL OPERATION FAILED: ${errorMessage}. The operation did not succeed.`,
          };
        }

        return {
          error:
            'GMAIL OPERATION FAILED: An unexpected error occurred. The operation did not succeed.',
        };
      }
    },
  });

