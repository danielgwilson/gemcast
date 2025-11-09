import { z } from "zod";
import { agents } from "@/lib/ai/agents";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
  mediaType: z.enum(["image/jpeg", "image/png"]),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

// Create enum from agent IDs and legacy model IDs
const agentIds = agents.map(a => a.id) as [string, ...string[]];
const legacyModelIds = ["chat-model", "chat-model-reasoning", "chat-model-lite"] as const;
const allModelIds = [...agentIds, ...legacyModelIds] as [string, ...string[]];

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    role: z.enum(["user"]),
    parts: z.array(partSchema),
  }),
  selectedChatModel: z.enum(allModelIds),
  selectedVisibilityType: z.enum(["public", "private"]),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
