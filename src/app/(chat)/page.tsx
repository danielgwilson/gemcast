import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { authOptions } from "../(auth)/auth";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  if (!modelIdFromCookie) {
    return (
      <>
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
          <Chat
            autoResume={false}
            id={id}
            initialChatModel={DEFAULT_CHAT_MODEL}
            initialMessages={[]}
            initialVisibilityType="private"
            isReadonly={false}
            key={id}
          />
        </Suspense>
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <Chat
          autoResume={false}
          id={id}
          initialChatModel={modelIdFromCookie.value}
          initialMessages={[]}
          initialVisibilityType="private"
          isReadonly={false}
          key={id}
        />
      </Suspense>
      <DataStreamHandler />
    </>
  );
}
