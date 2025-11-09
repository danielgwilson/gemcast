import { tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import {
  createGoogleDoc,
  createTextFile,
  findOrCreateFolder,
  getDriveClient,
} from '@/lib/google/drive';

type GoogleDriveWriteProps = {
  session: Session;
};

export const googleDriveWrite = ({ session }: GoogleDriveWriteProps) =>
  tool({
    description:
      'Create folders and files in Google Drive. Use this to set up podcast folder structures, save episode templates, briefing docs, outlines, show notes, and other production assets.',
    inputSchema: z.object({
      action: z
        .enum(['create_folder', 'create_doc', 'create_file', 'setup_podcast_folders'])
        .describe(
          'Action to perform: "create_folder" to create a folder, "create_doc" to create a Google Doc, "create_file" to create a text file, "setup_podcast_folders" to create the standard podcast folder structure',
        ),
      folderName: z
        .string()
        .optional()
        .describe('Name of the folder to create (for create_folder)'),
      parentFolderId: z
        .string()
        .optional()
        .describe('Parent folder ID (optional, defaults to root)'),
      title: z
        .string()
        .optional()
        .describe('Document/file title (for create_doc and create_file)'),
      content: z
        .string()
        .optional()
        .describe('Document/file content (for create_doc and create_file)'),
      fileName: z
        .string()
        .optional()
        .describe('File name (for create_file)'),
      mimeType: z
        .string()
        .optional()
        .describe('MIME type for file (defaults to text/plain for create_file)'),
    }),
    execute: async ({ action, folderName, parentFolderId, title, content, fileName, mimeType }) => {
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

        if (action === 'setup_podcast_folders') {
          // Create main Podcast folder
          const podcastFolder = await findOrCreateFolder(drive, 'Podcast');

          if (!podcastFolder || !podcastFolder.id) {
            return {
              error: 'CRITICAL: Failed to create Podcast folder. The operation did not succeed.',
            };
          }

          // Create subfolders
          const brandingFolder = await findOrCreateFolder(drive, '01_Branding', podcastFolder.id);
          const episodesFolder = await findOrCreateFolder(drive, '02_Episodes', podcastFolder.id);
          const marketingFolder = await findOrCreateFolder(drive, '03_Marketing_Assets', podcastFolder.id);

          // Validate all folders were created
          if (!brandingFolder?.id || !episodesFolder?.id || !marketingFolder?.id) {
            return {
              error: 'CRITICAL: Failed to create one or more subfolders. Some folders may not have been created.',
            };
          }

          return {
            success: true,
            action: 'setup_podcast_folders',
            folders: {
              podcast: {
                id: podcastFolder.id,
                name: podcastFolder.name,
              },
              branding: {
                id: brandingFolder.id,
                name: brandingFolder.name,
              },
              episodes: {
                id: episodesFolder.id,
                name: episodesFolder.name,
              },
              marketing: {
                id: marketingFolder.id,
                name: marketingFolder.name,
              },
            },
          };
        }

        if (action === 'create_folder') {
          if (!folderName) {
            return {
              error: 'folderName is required for create_folder',
            };
          }

          const folder = await findOrCreateFolder(drive, folderName, parentFolderId);

          if (!folder || !folder.id) {
            return {
              error: 'CRITICAL: Folder creation failed - no folder ID returned. The folder was NOT created.',
            };
          }

          return {
            success: true,
            action: 'create_folder',
            folder: {
              id: folder.id,
              name: folder.name,
            },
          };
        }

        if (action === 'create_doc') {
          if (!title || !content) {
            return {
              error: 'title and content are required for create_doc',
            };
          }

          const doc = await createGoogleDoc(drive, {
            title,
            content,
            parentFolderId,
          });

          if (!doc || !doc.id) {
            return {
              error: 'CRITICAL: Document creation failed - no document ID returned. The document was NOT created.',
            };
          }

          if (!doc.webViewLink) {
            return {
              error: `CRITICAL: Document creation incomplete - document ID ${doc.id} exists but has no web view link. The document may not be accessible.`,
            };
          }

          return {
            success: true,
            action: 'create_doc',
            document: {
              id: doc.id,
              name: doc.name,
              webViewLink: doc.webViewLink,
            },
          };
        }

        if (action === 'create_file') {
          if (!fileName || !content) {
            return {
              error: 'fileName and content are required for create_file',
            };
          }

          const file = await createTextFile(drive, {
            name: fileName,
            content,
            parentFolderId,
            mimeType,
          });

          if (!file || !file.id) {
            return {
              error: 'CRITICAL: File creation failed - no file ID returned. The file was NOT created.',
            };
          }

          if (!file.webViewLink) {
            return {
              error: `CRITICAL: File creation incomplete - file ID ${file.id} exists but has no web view link. The file may not be accessible.`,
            };
          }

          return {
            success: true,
            action: 'create_file',
            file: {
              id: file.id,
              name: file.name,
              webViewLink: file.webViewLink,
            },
          };
        }

        return {
          error: `Unknown action: ${action}`,
        };
      } catch (error) {
        console.error('Error in googleDriveWrite tool:', error);

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
                'RESOURCE NOT FOUND: The requested Drive resource does not exist or is not accessible.',
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
            error: `DRIVE OPERATION FAILED: ${errorMessage}. The operation did not succeed.`,
          };
        }

        return {
          error:
            'DRIVE OPERATION FAILED: An unexpected error occurred. The operation did not succeed.',
        };
      }
    },
  });

