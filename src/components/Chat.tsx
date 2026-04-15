import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Send, MoreVertical, DollarSign, Smile } from "lucide-react";
import { cn } from "../lib/utils";

interface Message {
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type?: "chat" | "donation";
  amount?: number;
}

interface ChatProps {
  streamId: string;
  currentUser: { uid: string; displayName: string };
  onDonation?: (data: any) => void;
}

export default function Chat({ streamId, currentUser, onDonation }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io();
    const socket = socketRef.current;

    socket.emit("join-stream", { 
      streamId, 
      userId: currentUser.uid, 
      userName: currentUser.displayName 
    });

    socket.on("receive-message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("receive-donation", (data: any) => {
      setMessages((prev) => [...prev, { ...data, type: "donation" }]);
      onDonation?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [streamId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;

    const messageData: Message = {
      userId: currentUser.uid,
      userName: currentUser.displayName,
      message: input,
      timestamp: Date.now(),
      type: "chat",
    };

    socketRef.current.emit("send-message", { ...messageData, streamId });
    setInput("");
  };

  return (
    <div className="bg-surface-container-low rounded-xl flex flex-col h-full border border-outline-variant/5 overflow-hidden">
      <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container">
        <h2 className="font-headline font-bold text-sm flex items-center gap-2">
          Live Chat
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_#ff97b8]"></span>
        </h2>
        <MoreVertical className="w-4 h-4 text-on-surface-variant cursor-pointer" />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-20">
            <Smile className="w-12 h-12 mb-2" />
            <p className="text-[10px] uppercase tracking-widest font-bold">
              Waiting for stream...
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.type === "donation" && "bg-tertiary/10 p-2 rounded-lg border border-tertiary/20")}>
            <div className={cn("w-8 h-8 rounded-full flex-shrink-0", msg.type === "donation" ? "bg-tertiary" : "bg-primary/20")} />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-bold", msg.type === "donation" ? "text-tertiary" : "text-primary")}>
                  {msg.userName}
                </span>
                {msg.type === "donation" && (
                  <span className="text-[10px] font-black bg-tertiary text-on-tertiary px-1.5 rounded">
                    ${msg.amount}
                  </span>
                )}
              </div>
              <p className="text-sm text-on-surface-variant leading-tight">
                {msg.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-surface-container border-t border-outline-variant/10">
        <div className="relative flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="w-full bg-surface-container-low h-12 rounded-lg border-none focus:ring-1 focus:ring-primary pr-12 text-sm px-4"
            placeholder="Send a message"
            type="text"
          />
          <button
            onClick={sendMessage}
            className="absolute right-2 p-2 text-primary hover:text-primary-fixed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
