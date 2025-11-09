import { motion } from "framer-motion";
import { agents, getAgentById } from "@/lib/ai/agents";

export const Greeting = ({ selectedModelId }: { selectedModelId?: string }) => {
  // Try to find agent by ID, fallback to default agent if not found (e.g., legacy model ID)
  const agent = selectedModelId ? getAgentById(selectedModelId) : undefined;
  
  // If still no agent (legacy model selected), use default
  const displayAgent = agent || (agents && agents.length > 0 ? agents[0] : null);
  
  // Safety check - if no agent available, return early with fallback
  if (!displayAgent) {
    return (
      <div className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8">
        <div className="font-semibold text-xl md:text-2xl">Hello there!</div>
        <div className="text-xl text-zinc-500 md:text-2xl">How can I help you today?</div>
      </div>
    );
  }
  
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
      >
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm border-2 shadow-lg"
          style={{
            background: displayAgent.gradient,
            borderColor: `${displayAgent.color}40`,
          }}
        >
          {displayAgent.icon}
        </div>
        <div>
          <div className="font-semibold text-xl md:text-2xl">
            Hello! I'm {displayAgent.name}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {displayAgent.description}
          </div>
        </div>
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-lg text-muted-foreground md:text-xl backdrop-blur-sm bg-background/40 rounded-xl p-4 border border-border/50"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        style={{
          background: `linear-gradient(135deg, ${displayAgent.color}08 0%, transparent 100%), rgba(var(--background), 0.4)`,
          borderColor: `${displayAgent.color}20`,
        }}
        transition={{ delay: 0.4 }}
      >
        <div className="font-medium mb-2">I can help you with:</div>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {displayAgent.capabilities.map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};
