"use client";

import { useRouter } from "next/navigation";
import { memo } from "react";
import { useWindowSize } from "usehooks-ts";
import { getAgentById } from "@/lib/ai/agents";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  selectedModelId,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  selectedModelId?: string;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const agent = selectedModelId ? getAgentById(selectedModelId) : undefined;
  const { width: windowWidth } = useWindowSize();

  return (
    <header 
      className="sticky top-0 z-10 flex items-center gap-2 backdrop-blur-xl bg-background/60 border-b border-border/50 px-2 py-1.5 md:px-2 shadow-sm"
      style={agent ? {
        background: `linear-gradient(135deg, ${agent.color}08 0%, transparent 100%), rgba(var(--background), 0.6)`,
        borderBottomColor: `${agent.color}20`,
      } : {}}
    >
      <SidebarToggle />

      {agent && (
        <div 
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-sm border transition-all"
          style={{
            background: `linear-gradient(135deg, ${agent.color}15 0%, ${agent.color}05 100%)`,
            borderColor: `${agent.color}30`,
          }}
        >
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
            style={{
              background: agent.gradient,
            }}
          >
            {agent.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold leading-tight">{agent.name}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{agent.description}</span>
          </div>
        </div>
      )}

      {(!open || windowWidth < 768) && (
        <Button
          className="order-2 ml-auto h-8 px-2 backdrop-blur-sm bg-background/60 border border-border/50 hover:bg-background/80 md:order-1 md:ml-0 md:h-fit md:px-2 transition-all"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
          variant="outline"
        >
          <PlusIcon />
          <span className="md:sr-only">New Chat</span>
        </Button>
      )}

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          className="order-1 md:order-2"
          selectedVisibilityType={selectedVisibilityType}
        />
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.selectedModelId === nextProps.selectedModelId
  );
});
