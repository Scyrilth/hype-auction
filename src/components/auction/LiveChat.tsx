"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import Link from "next/link";

import { SendIcon, SmileIcon } from "@/components/icons";
import UserAvatar from "@/components/ui/UserAvatar";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { getProfileHref } from "@/lib/profile-links";
import {
  type ChatMessage,
  enrichChatMessage,
  fetchAuctionMessages,
  sendAuctionMessage,
} from "@/lib/auction-chat";
import { supabase } from "@/lib/supabase";

export default function LiveChat({ auctionId }: { auctionId?: string }) {
  const { publicKey, connected } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(!!auctionId);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  useEffect(() => {
    if (!auctionId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAuctionMessages(auctionId);
        if (!cancelled) {
          setMessages(data);
          requestAnimationFrame(() => scrollToBottom("instant"));
        }
      } catch (error) {
        logSupabaseError("LiveChat: fetch messages", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel(`messages:${auctionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => {
          void enrichChatMessage(payload.new as Record<string, unknown>).then(
            addMessage
          );
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [auctionId, addMessage, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!auctionId || !connected || !publicKey || !input.trim() || sending) {
      return;
    }

    setSending(true);

    try {
      const message = await sendAuctionMessage({
        auctionId,
        walletAddress: publicKey.toBase58(),
        content: input,
      });
      addMessage(message);
      setInput("");
    } catch (error) {
      logSupabaseError("LiveChat: send message", error);
      console.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canChat = connected && publicKey && auctionId;
  const inputPlaceholder = !auctionId
    ? "No active auction"
    : !connected
      ? "Connect wallet to chat"
      : "Say something...";

  return (
    <div className="flex h-full min-h-[16rem] w-full min-w-0 flex-col rounded-2xl border border-border bg-surface lg:min-h-0">
      <div className="shrink-0 border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
        <h3 className="text-sm font-semibold text-white">Live Chat</h3>
      </div>

      <div
        ref={scrollContainerRef}
        className="chat-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 sm:px-4"
      >
        {!auctionId ? (
          <p className="text-center text-sm text-muted">
            Join a live auction to chat.
          </p>
        ) : loading ? (
          <p className="text-center text-sm text-muted">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-2.5">
              <UserAvatar
                walletAddress={msg.wallet_address}
                alt={msg.username}
                size="xs"
                className="mt-0.5"
              />
              <div className="min-w-0">
                <Link
                  href={getProfileHref(msg.profile_username, msg.wallet_address)}
                  className="text-xs font-semibold text-accent transition-colors hover:text-purple-300"
                >
                  {msg.profile_username
                    ? `@${msg.profile_username.replace(/^@+/, "")}`
                    : msg.username}
                </Link>
                <p className="break-words text-sm text-zinc-300">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-border p-2.5 sm:p-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            disabled={!canChat || sending}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            className="text-muted transition-colors hover:text-zinc-300 disabled:opacity-40"
            aria-label="Emoji"
            disabled={!canChat}
          >
            <SmileIcon />
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canChat || sending || !input.trim()}
            className="text-accent transition-colors hover:text-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
