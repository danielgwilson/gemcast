import { agents, getDefaultAgent, type AgentId } from "./agents";

export const DEFAULT_CHAT_MODEL: string = getDefaultAgent().id;

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

// Legacy models for backward compatibility
export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Gemini 2.5 Pro",
    description: "Most powerful thinking model with features for complex reasoning",
  },
  {
    id: "chat-model-reasoning",
    name: "Gemini 2.5 Flash",
    description:
      "Balanced model with 1M token context window, optimized for general-purpose tasks",
  },
  {
    id: "chat-model-lite",
    name: "Gemini 2.5 Flash-Lite",
    description:
      "Fastest and most cost-efficient multimodal model with great performance",
  },
];

// Agent-based models (primary interface)
export const agentModels: ChatModel[] = agents.map((agent) => ({
  id: agent.id,
  name: agent.name,
  description: agent.description,
}));
