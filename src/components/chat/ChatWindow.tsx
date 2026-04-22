import { useRef, useEffect, KeyboardEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import TherapistCard from "./TherapistCard";
import BookingConfirm from "./BookingConfirm";
import { useChat } from "@/hooks/useChat";
import { Send, RotateCcw } from "lucide-react";

export default function ChatWindow() {
  const {
    messages,
    isLoading,
    inquiryId,
    matchedTherapists,
    showBooking,
    selectedTherapist,
    sendMessage,
    selectTherapist,
    setShowBooking,
    resetChat,
    onBookingSuccess,
  } = useChat();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, matchedTherapists]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div>
          <h2 className="font-semibold text-sm">Therapy Scheduler</h2>
          <p className="text-xs text-muted-foreground">AI-powered matching</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={resetChat}
          title="Start over"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            createdAt={msg.createdAt}
          />
        ))}

        {isLoading && <TypingIndicator />}

        {/* Therapist match cards */}
        {matchedTherapists.length > 0 && !showBooking && (
          <div className="space-y-3 mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
              Matched therapists
            </p>
            {matchedTherapists.map((t) => (
              <TherapistCard
                key={t.id}
                therapist={t}
                onSelect={selectTherapist}
              />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 bg-background">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what brings you here today…"
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            disabled={isLoading}
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {/* Booking modal */}
      {selectedTherapist && inquiryId && (
        <BookingConfirm
          open={showBooking}
          onClose={() => setShowBooking(false)}
          therapist={selectedTherapist}
          inquiryId={inquiryId}
          onSuccess={onBookingSuccess}
        />
      )}
    </div>
  );
}
