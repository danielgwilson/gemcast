import type { InferUITool, UIMessage } from 'ai';
import { z } from 'zod';
import type { ArtifactKind } from '@/components/artifact';
import type { createDocument } from './ai/tools/create-document';
import type { firecrawlScrape } from './ai/tools/firecrawl-scrape';
import type { firecrawlCrawl } from './ai/tools/firecrawl-crawl';
import type { firecrawlMap } from './ai/tools/firecrawl-map';
import type { firecrawlSearch } from './ai/tools/firecrawl-search';
import type { firecrawlExtract } from './ai/tools/firecrawl-extract';
import type { gmail } from './ai/tools/gmail';
import type { getWeather } from './ai/tools/get-weather';
import type { googleCalendar } from './ai/tools/google-calendar';
import type { googleDriveWrite } from './ai/tools/google-drive-write';
import type { googleMeetCreate } from './ai/tools/google-meet-create';
import type { readGoogleMeetRecording } from './ai/tools/read-google-meet-recording';
import type { requestSuggestions } from './ai/tools/request-suggestions';
import type { updateDocument } from './ai/tools/update-document';
import type { Suggestion } from './db/schema';
import type { AppUsage } from './usage';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;
type readGoogleMeetRecordingTool = InferUITool<
  ReturnType<typeof readGoogleMeetRecording>
>;
type googleCalendarTool = InferUITool<ReturnType<typeof googleCalendar>>;
type googleDriveWriteTool = InferUITool<ReturnType<typeof googleDriveWrite>>;
type googleMeetCreateTool = InferUITool<ReturnType<typeof googleMeetCreate>>;
type gmailTool = InferUITool<ReturnType<typeof gmail>>;
type firecrawlScrapeTool = InferUITool<ReturnType<typeof firecrawlScrape>>;
type firecrawlCrawlTool = InferUITool<ReturnType<typeof firecrawlCrawl>>;
type firecrawlMapTool = InferUITool<ReturnType<typeof firecrawlMap>>;
type firecrawlSearchTool = InferUITool<ReturnType<typeof firecrawlSearch>>;
type firecrawlExtractTool = InferUITool<ReturnType<typeof firecrawlExtract>>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  readGoogleMeetRecording: readGoogleMeetRecordingTool;
  googleCalendar: googleCalendarTool;
  googleDriveWrite: googleDriveWriteTool;
  googleMeetCreate: googleMeetCreateTool;
  gmail: gmailTool;
  firecrawlScrape: firecrawlScrapeTool;
  firecrawlCrawl: firecrawlCrawlTool;
  firecrawlMap: firecrawlMapTool;
  firecrawlSearch: firecrawlSearchTool;
  firecrawlExtract: firecrawlExtractTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
