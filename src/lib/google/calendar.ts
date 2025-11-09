import { google } from 'googleapis';
import type { Session } from 'next-auth';

/**
 * Get an authenticated Google Calendar client using the user's OAuth access token
 */
export function getCalendarClient(session: Session) {
  if (!session.accessToken) {
    throw new Error('No access token available in session. User may need to re-authenticate.');
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    access_token: session.accessToken,
  });

  return google.calendar({
    version: 'v3',
    auth: oauth2Client,
  });
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  calendar: ReturnType<typeof getCalendarClient>,
  event: {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    attendees?: Array<{ email: string; name?: string }>;
    meetLink?: boolean; // If true, add Google Meet link
  },
) {
  try {
    const eventData: any = {
      summary: event.summary,
      description: event.description || '',
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: 'UTC',
      },
    };

    if (event.location) {
      eventData.location = event.location;
    }

    if (event.attendees && event.attendees.length > 0) {
      eventData.attendees = event.attendees.map((a) => ({
        email: a.email,
        displayName: a.name,
      }));
    }

    // Add Google Meet link if requested
    if (event.meetLink) {
      eventData.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      };
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData,
      conferenceDataVersion: event.meetLink ? 1 : 0,
    });

    // Strict validation: ensure response exists and has required data
    if (!response || !response.data) {
      throw new Error('Failed to create calendar event: Invalid response from Google Calendar API');
    }

    // Critical validation: event ID is required to confirm creation
    if (!response.data.id) {
      throw new Error('Failed to create calendar event: No event ID returned from API. The event was not created.');
    }

    // Validate that we have at least a summary (should match what we sent)
    if (!response.data.summary) {
      throw new Error(`Failed to create calendar event: Event created but missing summary. Event ID: ${response.data.id}`);
    }

    // Validate htmlLink exists (this confirms the event is accessible)
    if (!response.data.htmlLink) {
      throw new Error(`Failed to create calendar event: Event created but missing HTML link. Event ID: ${response.data.id}. The event may not be accessible.`);
    }

    return {
      id: response.data.id,
      summary: response.data.summary,
      start: response.data.start?.dateTime,
      end: response.data.end?.dateTime,
      htmlLink: response.data.htmlLink,
      meetLink: response.data.conferenceData?.entryPoints?.find(
        (ep: any) => ep.entryPointType === 'video',
      )?.uri,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    
    // Extract detailed error information from Google API errors
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as any;
      const status = apiError.response?.status;
      const statusText = apiError.response?.statusText;
      const errorData = apiError.response?.data;
      
      if (status === 401) {
        throw new Error('Authentication failed (401): Invalid or expired access token. Please sign out and sign back in.');
      }
      
      if (status === 403) {
        const reason = errorData?.error?.message || 'Permission denied';
        throw new Error(`Permission denied (403): ${reason}. Make sure Calendar API is enabled and you have granted calendar permissions.`);
      }
      
      if (status === 404) {
        throw new Error('Calendar not found (404): Primary calendar does not exist. Make sure Google Calendar is enabled for your account.');
      }
      
      if (status === 400) {
        const reason = errorData?.error?.message || 'Invalid request';
        throw new Error(`Invalid request (400): ${reason}. Check event data format and required fields.`);
      }
      
      // Include API error details in the message
      const errorMessage = errorData?.error?.message || apiError.message || 'Unknown API error';
      throw new Error(`Google Calendar API error (${status || 'unknown'}): ${errorMessage}`);
    }
    
    if (error instanceof Error) {
      // Ensure error message is clear and actionable
      const errorMessage = error.message || 'Unknown error occurred';
      throw new Error(`Failed to create calendar event: ${errorMessage}`);
    }
    
    throw new Error('Failed to create calendar event: Unknown error occurred');
  }
}

/**
 * List calendar events in a date range
 */
export async function listCalendarEvents(
  calendar: ReturnType<typeof getCalendarClient>,
  timeMin: Date,
  timeMax: Date,
) {
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error listing calendar events:', error);
    throw error;
  }
}

