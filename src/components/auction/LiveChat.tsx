"use client";

import { SendIcon, SmileIcon } from "@/components/icons";

const messages = [
  {
    user: "Whal3dad",
    avatar: "from-orange-400 to-red-500",
    text: "Let's gooo! 🔥",
  },
  {
    user: "CardKing",
    avatar: "from-yellow-400 to-amber-500",
    text: "Grail card right here",
  },
  {
    user: "NFTsniper",
    avatar: "from-green-400 to-emerald-500",
    text: "Need this for the collection",
  },
  {
    user: "SolStacker",
    avatar: "from-blue-400 to-indigo-500",
    text: "bid bid bid",
  },
  {
    user: "HypeBeast",
    avatar: "from-pink-400 to-rose-500",
    text: "PSA 10 is insane value",
  },
  {
    user: "DegenDave",
    avatar: "from-purple-400 to-violet-500",
    text: "LFG 🚀",
  },
];

export default function LiveChat() {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Live Chat</h3>
      </div>

      <div className="chat-scroll flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3" style={{ maxHeight: "340px" }}>
        {messages.map((msg) => (
          <div key={msg.user} className="flex gap-2.5">
            <div
              className={`mt-0.5 h-7 w-7 shrink-0 rounded-full bg-gradient-to-br ${msg.avatar}`}
            />
            <div>
              <p className="text-xs font-semibold text-accent">{msg.user}</p>
              <p className="text-sm text-zinc-300">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
          <input
            type="text"
            placeholder="Say something..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
          />
          <button
            type="button"
            className="text-muted transition-colors hover:text-zinc-300"
            aria-label="Emoji"
          >
            <SmileIcon />
          </button>
          <button
            type="button"
            className="text-accent transition-colors hover:text-purple-400"
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
