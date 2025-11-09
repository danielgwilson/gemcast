import { tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import {
  createCalendarEvent,
  getCalendarClient,
  listCalendarEvents,
} from '@/lib/google/calendar';

type GoogleCalendarProps = {
  session: Session;
};

export const googleCalendar = ({ session }: GoogleCalendarProps) =>
  tool({
    description:
      'Create and manage Google Calendar events for podcast production schedules. Use this to schedule episodes, prep tasks, recording sessions, and editing tasks. Can create events with Google Meet links for recording sessions.',
    inputSchema: z.object({
      action: z
        .enum(['create_event', 'list_events'])
        .describe(
          'Action to perform: "create_event" to schedule a new event, "list_events" to view upcoming events'
        ),
      summary: z
        .string()
        .optional()
        .describe('Event title/summary (required for create_event)'),
      description: z.string().optional().describe('Event description/details'),
      startTime: z
        .string()
        .optional()
        .describe(
          'Start time in ISO 8601 format (e.g., "2024-12-15T14:00:00Z") - required for create_event'
        ),
      endTime: z
        .string()
        .optional()
        .describe(
          'End time in ISO 8601 format (e.g., "2024-12-15T16:00:00Z") - required for create_event'
        ),
      location: z.string().optional().describe('Event location'),
      attendees: z
        .array(
          z.object({
            email: z.string().email(),
            name: z.string().optional(),
          })
        )
        .optional()
        .describe('List of attendees (for guest episodes)'),
      meetLink: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'Whether to add a Google Meet link to the event (use true for recording sessions)'
        ),
      timeMin: z
        .string()
        .optional()
        .describe('Start of date range for list_events (ISO 8601 format)'),
      timeMax: z
        .string()
        .optional()
        .describe('End of date range for list_events (ISO 8601 format)'),
    }),
    execute: async ({
      action,
      summary,
      description,
      startTime,
      endTime,
      location,
      attendees,
      meetLink,
      timeMin,
      timeMax,
    }) => {
      try {
        if (!session.accessToken) {
          return {
            error:
              'No access token available. Please sign out and sign back in to refresh your Google authentication.',
          };
        }

        // Get calendar client - this will throw if credentials are missing
        let calendar: ReturnType<typeof getCalendarClient>;
        try {
          calendar = getCalendarClient(session);
        } catch (clientError) {
          if (clientError instanceof Error) {
            return {
              error: `Failed to initialize calendar client: ${clientError.message}`,
            };
          }
          return {
            error: 'Failed to initialize calendar client: Unknown error',
          };
        }

        if (action === 'create_event') {
          if (!summary || !startTime || !endTime) {
            return {
              error:
                'summary, startTime, and endTime are required for create_event',
            };
          }

          // Validate dates
          const startDate = new Date(startTime);
          const endDate = new Date(endTime);

          if (Number.isNaN(startDate.getTime())) {
            return {
              error: `Invalid startTime format: ${startTime}. Please use ISO 8601 format (e.g., "2024-12-15T14:00:00Z")`,
            };
          }

          if (Number.isNaN(endDate.getTime())) {
            return {
              error: `Invalid endTime format: ${endTime}. Please use ISO 8601 format (e.g., "2024-12-15T16:00:00Z")`,
            };
          }

          if (endDate <= startDate) {
            return {
              error: 'endTime must be after startTime',
            };
          }

          // Attempt to create the event - this will throw if it fails
          const event = await createCalendarEvent(calendar, {
            summary,
            description,
            startTime: startDate,
            endTime: endDate,
            location,
            attendees,
            meetLink: meetLink ?? false,
          });

          // Double-check critical fields - if any are missing, treat as failure
          if (!event || !event.id) {
            return {
              error:
                'CRITICAL: Event creation failed - no event ID returned. The event was NOT created in your calendar.',
            };
          }

          if (!event.htmlLink) {
            return {
              error: `CRITICAL: Event creation incomplete - event ID ${event.id} exists but has no HTML link. The event may not be accessible.`,
            };
          }

          // Success - return with all event details
          return {
            success: true,
            action: 'create_event',
            event: {
              id: event.id,
              summary: event.summary,
              start: event.start,
              end: event.end,
              htmlLink: event.htmlLink,
              meetLink: event.meetLink,
            },
          };
        }

        if (action === 'list_events') {
          const timeMinDate = timeMin ? new Date(timeMin) : new Date();
          const timeMaxDate = timeMax
            ? new Date(timeMax)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days ahead

          const events = await listCalendarEvents(
            calendar,
            timeMinDate,
            timeMaxDate
          );

          return {
            success: true,
            action: 'list_events',
            events: events.map((event) => ({
              id: event.id,
              summary: event.summary,
              start: event.start?.dateTime || event.start?.date,
              end: event.end?.dateTime || event.end?.date,
              htmlLink: event.htmlLink,
              meetLink: event.conferenceData?.entryPoints?.find(
                (ep) => ep.entryPointType === 'video'
              )?.uri,
            })),
            count: events.length,
          };
        }

        return {
          error: `Unknown action: ${action}`,
        };
      } catch (error) {
        // Always log the full error for debugging
        console.error('Error in googleCalendar tool:', error);

        if (error instanceof Error) {
          const errorMessage = error.message || '';

          // Check for specific Google API errors and return clear, actionable messages
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
                'PERMISSION DENIED: Google Calendar access was denied. Make sure you have granted the necessary Google Calendar permissions and that your Google account has Calendar enabled.',
            };
          }

          if (
            errorMessage.includes('404') ||
            errorMessage.includes('Not Found') ||
            errorMessage.includes('Calendar not found')
          ) {
            return {
              error:
                'CALENDAR NOT FOUND: Your primary Google Calendar does not exist or is not accessible. Make sure Google Calendar is enabled for your account.',
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

          if (
            errorMessage.includes('Invalid request') ||
            errorMessage.includes('400') ||
            errorMessage.includes('Invalid')
          ) {
            return {
              error: `INVALID REQUEST: ${errorMessage}. Please check the event data format and try again.`,
            };
          }

          // For any other error, return the full message so the agent knows what went wrong
          return {
            error: `CALENDAR OPERATION FAILED: ${errorMessage}. The operation did not succeed.`,
          };
        }

        // Fallback for non-Error objects
        return {
          error:
            'CALENDAR OPERATION FAILED: An unexpected error occurred. The operation did not succeed.',
        };
      }
    },
  });
