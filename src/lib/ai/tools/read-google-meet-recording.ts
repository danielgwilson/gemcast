import { tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import {
  findMeetRecordingsFolder,
  getDriveClient,
  getRecordingDetails,
  getTranscriptForRecording,
  listMeetRecordings,
} from '@/lib/google/drive';

type ReadGoogleMeetRecordingProps = {
  session: Session;
};

export const readGoogleMeetRecording = ({ session }: ReadGoogleMeetRecordingProps) =>
  tool({
    description:
      'Read Google Meet meeting recordings and transcripts from the user\'s Google Drive. ' +
      'This tool can list recent recordings, get transcript content, and retrieve recording metadata. ' +
      'Recordings are stored in the "Meet Recordings" folder in Google Drive.',
    inputSchema: z.object({
      action: z
        .enum(['list', 'get_transcript', 'get_details'])
        .describe(
          'Action to perform: "list" to see recent recordings, "get_transcript" to read a transcript, "get_details" to get recording metadata',
        ),
      recordingId: z
        .string()
        .optional()
        .describe(
          'The Google Drive file ID of the recording (required for get_transcript and get_details actions)',
        ),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe('Maximum number of recordings to list (for list action)'),
    }),
    execute: async ({ action, recordingId, limit = 10 }) => {
      try {
        if (!session.accessToken) {
          return {
            error:
              'No access token available. Please sign out and sign back in to refresh your Google authentication.',
          };
        }

        // Get Drive client - this will throw if credentials are missing
        let drive: ReturnType<typeof getDriveClient>;
        try {
          drive = getDriveClient(session);
        } catch (clientError) {
          if (clientError instanceof Error) {
            return {
              error: `Failed to initialize Drive client: ${clientError.message}`,
            };
          }
          return {
            error: 'Failed to initialize Drive client: Unknown error',
          };
        }

        if (action === 'list') {
          // Find the Meet Recordings folder
          const folder = await findMeetRecordingsFolder(drive);

          if (!folder) {
            return {
              error:
                'Could not find "Meet Recordings" folder in your Google Drive. ' +
                'Make sure you have recorded at least one Google Meet meeting.',
              recordings: [],
            };
          }

          // Validate folder has ID before using it
          if (!folder.id) {
            return {
              error:
                'CRITICAL: Folder found but has no ID. Cannot list recordings.',
            };
          }

          // List recent recordings
          const recordings = await listMeetRecordings(drive, folder.id, limit);

          return {
            success: true,
            action: 'list',
            folderName: folder.name,
            folderId: folder.id,
            recordings: recordings.map((recording) => ({
              id: recording.id,
              name: recording.name,
              mimeType: recording.mimeType,
              createdTime: recording.createdTime,
              webViewLink: recording.webViewLink,
              isVideo: recording.mimeType?.includes('video'),
              isTranscript:
                recording.mimeType === 'application/vnd.google-apps.document',
            })),
            count: recordings.length,
          };
        }

        if (action === 'get_transcript') {
          if (!recordingId) {
            return {
              error: 'recordingId is required for get_transcript action',
            };
          }

          // Find the Meet Recordings folder
          const folder = await findMeetRecordingsFolder(drive);

          if (!folder) {
            return {
              error:
                'Could not find "Meet Recordings" folder in your Google Drive. ' +
                'Make sure you have recorded at least one Google Meet meeting.',
            };
          }

          // Validate folder has ID
          if (!folder.id) {
            return {
              error:
                'CRITICAL: Folder found but has no ID. Cannot retrieve transcript.',
            };
          }

          // Get the transcript
          const transcriptData = await getTranscriptForRecording(
            drive,
            recordingId,
            folder.id,
          );

          if (!transcriptData) {
            return {
              error:
                'TRANSCRIPT NOT FOUND: Could not find a transcript for this recording. ' +
                'Make sure transcription was enabled during the Google Meet recording.',
              recordingId,
            };
          }

          if (!transcriptData.transcript || transcriptData.transcript.length === 0) {
            return {
              error:
                'TRANSCRIPT EMPTY: Transcript found but contains no content.',
              recordingId,
              transcriptId: transcriptData.transcriptId,
            };
          }

          if (!transcriptData.transcriptId) {
            return {
              error:
                'CRITICAL: Transcript data incomplete - missing transcript ID.',
              recordingId,
            };
          }

          return {
            success: true,
            action: 'get_transcript',
            recordingId,
            transcriptId: transcriptData.transcriptId,
            transcriptName: transcriptData.transcriptName,
            transcript: transcriptData.transcript,
            transcriptLength: transcriptData.transcript.length,
          };
        }

        if (action === 'get_details') {
          if (!recordingId) {
            return {
              error: 'recordingId is required for get_details action',
            };
          }

          const details = await getRecordingDetails(drive, recordingId);

          if (!details || !details.id) {
            return {
              error:
                'CRITICAL: Failed to retrieve recording details - no recording ID returned. The recording may not exist or may not be accessible.',
              recordingId,
            };
          }

          return {
            success: true,
            action: 'get_details',
            recording: {
              id: details.id,
              name: details.name,
              mimeType: details.mimeType,
              createdTime: details.createdTime,
              size: details.size,
              webViewLink: details.webViewLink,
              webContentLink: details.webContentLink,
            },
          };
        }

        return {
          error: `Unknown action: ${action}`,
        };
      } catch (error) {
        console.error('Error in readGoogleMeetRecording tool:', error);

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
                'PERMISSION DENIED: Google Drive access was denied. Make sure you have granted the necessary Google Drive permissions.',
            };
          }

          if (
            errorMessage.includes('404') ||
            errorMessage.includes('Not Found') ||
            errorMessage.includes('not found')
          ) {
            return {
              error:
                'RECORDING NOT FOUND: The requested recording does not exist or is not accessible.',
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
            error: `RECORDING OPERATION FAILED: ${errorMessage}. The operation did not succeed.`,
          };
        }

        return {
          error:
            'RECORDING OPERATION FAILED: An unexpected error occurred. The operation did not succeed.',
        };
      }
    },
  });

