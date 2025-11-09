"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo, useMemo } from "react";
import type { ChatMessage } from "@/lib/types";
import { getAgentById } from "@/lib/ai/agents";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
};

// Agent-specific suggestions based on their capabilities
const getAgentSuggestions = (agentId: string): string[] => {
  const agent = getAgentById(agentId);
  
  if (!agent) {
    // Fallback for legacy models
    return [
      "What are the advantages of using Next.js?",
      "Write code to demonstrate Dijkstra's algorithm",
      "Help me write an essay about Silicon Valley",
      "What is the weather in San Francisco?",
    ];
  }

  switch (agent.id) {
    case "ida":
      return [
        "Help me brainstorm podcast episode ideas",
        "Create a content strategy for my new podcast",
        "Develop a brand voice for my show",
        "Generate creative themes for my podcast series",
      ];
    case "astra":
      return [
        "Research competitors in my podcast niche",
        "Analyze market trends for my content topic",
        "Validate if my podcast idea has potential",
        "Provide data-driven recommendations for my show",
      ];
    case "ember":
      return [
        "Create a production schedule for my podcast",
        "Help me plan my episode release calendar",
        "Organize my podcast workflow and tasks",
        "Set up a timeline for my next 3 episodes",
      ];
    case "nova":
      return [
        "Help me automate my podcast workflow",
        "Integrate tools for my podcast production",
        "Design a system for managing my episodes",
        "Build automation for my content pipeline",
      ];
    case "zen":
      return [
        "Edit and refine my podcast script",
        "Improve the clarity of my episode outline",
        "Review my content for quality and style",
        "Help me polish my podcast description",
      ];
    case "luna":
      return [
        "Create social media posts for my podcast",
        "Repurpose my episode content for different platforms",
        "Develop an engagement strategy for my audience",
        "Analyze trends for my social media content",
      ];
    default:
      return [
        "What are the advantages of using Next.js?",
        "Write code to demonstrate Dijkstra's algorithm",
        "Help me write an essay about Silicon Valley",
        "What is the weather in San Francisco?",
      ];
  }
};

function PureSuggestedActions({ chatId, sendMessage, selectedModelId }: SuggestedActionsProps) {
  const suggestedActions = useMemo(() => {
    return getAgentSuggestions(selectedModelId);
  }, [selectedModelId]);

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion: string) => {
              window.history.replaceState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={suggestedAction}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }

    return true;
  },
);
