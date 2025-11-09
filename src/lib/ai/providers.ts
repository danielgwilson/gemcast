import { google } from "@ai-sdk/google";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        liteModel,
        titleModel,
        imageModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "chat-model-lite": liteModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
        imageModels: {
          "image-model": imageModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": google("models/gemini-2.5-pro"),
        "chat-model-reasoning": google("models/gemini-2.5-flash"),
        "chat-model-lite": google("models/gemini-2.5-flash-lite"),
        "title-model": google("models/gemini-2.5-flash"),
        "artifact-model": google("models/gemini-2.5-pro"),
      },
      imageModels: {
        "image-model": google.image("imagen-4.0-generate-001"),
      },
    });
