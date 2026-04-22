// import { useState, useCallback, useEffect } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { useAuthStore } from "@/store/authStore";
// import { GeminiExtraction, Therapist } from "@/types";
// import { useToast } from "@/hooks/useToast";

// export interface LocalMessage {
//   id: string;
//   role: "user" | "assistant";
//   content: string;
//   createdAt: Date;
// }

// const WELCOME_MESSAGE: LocalMessage = {
//   id: "welcome",
//   role: "assistant",
//   content:
//     "Hello! I'm your healthcare scheduling assistant 👋 I'm here to help you find the right therapist. Could you start by telling me what brings you here today?",
//   createdAt: new Date(),
// };

// export function useChat() {
//   const { session } = useAuthStore();
//   const { toast } = useToast();

//   const [messages, setMessages] = useState<LocalMessage[]>([WELCOME_MESSAGE]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isLoadingHistory, setIsLoadingHistory] = useState(true);
//   const [inquiryId, setInquiryId] = useState<string | null>(null);
//   const [extraction, setExtraction] = useState<GeminiExtraction | null>(null);
//   const [matchedTherapists, setMatchedTherapists] = useState<Therapist[]>([]);
//   const [showBooking, setShowBooking] = useState(false);
//   const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(
//     null,
//   );

//   // ── Load existing chat history from DB on mount ───────────────────────────
//   useEffect(() => {
//     if (!session) {
//       setIsLoadingHistory(false);
//       return;
//     }

//     const loadHistory = async () => {
//       setIsLoadingHistory(true);
//       try {
//         const { data, error } = await supabase
//           .from("chat_messages")
//           .select("*")
//           .eq("patient_id", session.user.id)
//           .order("created_at", { ascending: true })
//           .limit(60);

//         if (error) throw error;

//         if (data && data.length > 0) {
//           // Convert DB messages to local format
//           // Strip JSON blocks from assistant messages for display
//           const loaded: LocalMessage[] = data.map((msg) => ({
//             id: msg.id,
//             role: msg.role as "user" | "assistant",
//             content:
//               msg.role === "assistant"
//                 ? msg.content.replace(/\{[\s\S]*?\}(\s*)$/m, "").trim() ||
//                   msg.content
//                 : msg.content,
//             createdAt: new Date(msg.created_at),
//           }));
//           setMessages(loaded);

//           // Restore inquiryId from last message that has one
//           const lastWithInquiry = [...data].reverse().find((m) => m.inquiry_id);
//           if (lastWithInquiry?.inquiry_id) {
//             setInquiryId(lastWithInquiry.inquiry_id);
//           }
//         }
//       } catch (err: any) {
//         console.error("Failed to load chat history:", err);
//         // Non-fatal — user just starts fresh
//       } finally {
//         setIsLoadingHistory(false);
//       }
//     };

//     loadHistory();
//   }, [session]);

//   // ── Send message ─────────────────────────────────────────────────────────
//   const sendMessage = useCallback(
//     async (text: string) => {
//       if (!text.trim() || isLoading || !session) return;

//       // Optimistically add user message to UI
//       const userMsg: LocalMessage = {
//         id: `temp-${Date.now()}`,
//         role: "user",
//         content: text,
//         createdAt: new Date(),
//       };
//       setMessages((prev) => [...prev, userMsg]);
//       setIsLoading(true);

//       try {
//         const { data, error } = await supabase.functions.invoke("handle-chat", {
//           body: {
//             message: text,
//             inquiryId: inquiryId ?? undefined,
//             // NOTE: We no longer send conversationHistory from the client.
//             // The Edge Function loads it directly from the DB — more reliable.
//           },
//           headers: {
//             Authorization: `Bearer ${session.access_token}`,
//           },
//         });

//         if (error) throw error;

//         // Edge Function errors come back as data.error sometimes
//         if (data?.error) throw new Error(data.error);

//         const assistantMsg: LocalMessage = {
//           id: `assistant-${Date.now()}`,
//           role: "assistant",
//           content: data.reply,
//           createdAt: new Date(),
//         };
//         setMessages((prev) => [...prev, assistantMsg]);

//         // Update inquiryId if the edge function created/updated one
//         if (data.inquiryId && data.inquiryId !== inquiryId) {
//           setInquiryId(data.inquiryId);
//         }

//         // Handle extraction
//         if (data.extraction) {
//           setExtraction(data.extraction);
//           if (data.extraction.is_complete === true) {
//             // Small delay so user reads the AI message first
//             setTimeout(() => {
//               findTherapists(data.inquiryId ?? inquiryId);
//             }, 800);
//           }
//         }
//       } catch (err: any) {
//         console.error("sendMessage error:", err);
//         toast({
//           title: "Message failed",
//           description:
//             err.message ?? "Could not reach the AI. Please try again.",
//           variant: "destructive",
//         });
//         // Remove the optimistic user message on failure
//         setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [isLoading, session, inquiryId, toast],
//   );

//   // ── Find matching therapists ──────────────────────────────────────────────
//   const findTherapists = useCallback(
//     async (id: string | null) => {
//       if (!id || !session) return;
//       try {
//         const { data, error } = await supabase.functions.invoke(
//           "find-therapist",
//           {
//             body: { inquiryId: id },
//             headers: { Authorization: `Bearer ${session.access_token}` },
//           },
//         );
//         if (error) throw error;
//         if (data?.error) throw new Error(data.error);

//         const matches: Therapist[] = data.matches ?? [];
//         setMatchedTherapists(matches);

//         const noMatchMsg: LocalMessage = {
//           id: `system-${Date.now()}`,
//           role: "assistant",
//           content:
//             matches.length === 0
//               ? "I wasn't able to find an exact match right now. Our team will review your inquiry and reach out shortly with options."
//               : `Great news! I found ${matches.length} therapist${matches.length > 1 ? "s" : ""} who match your needs. Please review the options below and choose one to book your session.`,
//           createdAt: new Date(),
//         };
//         setMessages((prev) => [...prev, noMatchMsg]);
//       } catch (err: any) {
//         console.error("findTherapists error:", err);
//         toast({
//           title: "Matching failed",
//           description: err.message,
//           variant: "destructive",
//         });
//       }
//     },
//     [session, toast],
//   );

//   // ── Select therapist → open booking modal ─────────────────────────────────
//   const selectTherapist = useCallback((therapist: Therapist) => {
//     setSelectedTherapist(therapist);
//     setShowBooking(true);
//   }, []);

//   // Add this inside useChat(), after the existing selectTherapist:

//   const onBookingSuccess = useCallback((confirmationMessage: string) => {
//     const successMsg: LocalMessage = {
//       id: `booking-success-${Date.now()}`,
//       role: "assistant",
//       content: confirmationMessage,
//       createdAt: new Date(),
//     };
//     setMessages((prev) => [...prev, successMsg]);
//     setShowBooking(false);
//     setMatchedTherapists([]);
//   }, []);

//   // ── Reset / start new conversation ───────────────────────────────────────
//   const resetChat = useCallback(async () => {
//     // Optionally: archive or delete old messages here
//     setMessages([WELCOME_MESSAGE]);
//     setInquiryId(null);
//     setExtraction(null);
//     setMatchedTherapists([]);
//     setShowBooking(false);
//     setSelectedTherapist(null);
//   }, []);

//   return {
//     messages,
//     isLoading,
//     isLoadingHistory,
//     inquiryId,
//     extraction,
//     matchedTherapists,
//     showBooking,
//     selectedTherapist,
//     sendMessage,
//     selectTherapist,
//     setShowBooking,
//     resetChat,
//     onBookingSuccess,
//   };
// }

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/store/authStore'
import { GeminiExtraction, Therapist } from '@/types'
import { useToast } from '@/hooks/useToast'

export interface LocalMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

const WELCOME_MESSAGE: LocalMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm your healthcare scheduling assistant 👋 I'm here to help you find the right therapist. Could you start by telling me what brings you here today?",
  createdAt: new Date(),
}

export function useChat() {
  const { session } = useAuthStore()
  const { toast }   = useToast()

  // Each login gets a unique session key — isolates chat history per session
  const chatSessionId = useRef<string>(
    `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )

  const [messages, setMessages]                     = useState<LocalMessage[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading]                   = useState(false)
  const [inquiryId, setInquiryId]                   = useState<string | null>(null)
  const [extraction, setExtraction]                 = useState<GeminiExtraction | null>(null)
  const [matchedTherapists, setMatchedTherapists]   = useState<Therapist[]>([])
  const [showBooking, setShowBooking]               = useState(false)
  const [selectedTherapist, setSelectedTherapist]   = useState<Therapist | null>(null)

  // Reset everything when session changes (login/logout)
  useEffect(() => {
    chatSessionId.current = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setMessages([WELCOME_MESSAGE])
    setInquiryId(null)
    setExtraction(null)
    setMatchedTherapists([])
    setShowBooking(false)
    setSelectedTherapist(null)
  }, [session?.user?.id])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || !session) return

      const userMsg: LocalMessage = {
        id:        `user-${Date.now()}`,
        role:      'user',
        content:   text,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)

      try {
        const { data, error } = await supabase.functions.invoke('handle-chat', {
          body: {
            message:       text,
            inquiryId:     inquiryId ?? undefined,
            chatSessionId: chatSessionId.current, // pass session ID to edge function
          },
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        if (error) throw error
        if (data?.error) throw new Error(data.error)

        const assistantMsg: LocalMessage = {
          id:        `assistant-${Date.now()}`,
          role:      'assistant',
          content:   data.reply,
          createdAt: new Date(),
        }
        setMessages((prev) => [...prev, assistantMsg])

        if (data.inquiryId && data.inquiryId !== inquiryId) {
          setInquiryId(data.inquiryId)
        }

        if (data.extraction?.is_complete === true) {
          setExtraction(data.extraction)
          setTimeout(() => findTherapists(data.inquiryId ?? inquiryId), 800)
        }

      } catch (err: any) {
        toast({
          title:       'Message failed',
          description: err.message ?? 'Could not reach the AI. Please try again.',
          variant:     'destructive',
        })
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, session, inquiryId, toast]
  )

  const findTherapists = useCallback(
    async (id: string | null) => {
      if (!id || !session) return
      try {
        const { data, error } = await supabase.functions.invoke('find-therapist', {
          body:    { inquiryId: id },
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)

        const matches: Therapist[] = data.matches ?? []
        setMatchedTherapists(matches)

        const msg: LocalMessage = {
          id:        `system-${Date.now()}`,
          role:      'assistant',
          content:   matches.length === 0
            ? "I wasn't able to find an exact match right now, but our team will review your inquiry and reach out shortly."
            : `Great news! I found ${matches.length} therapist${matches.length > 1 ? 's' : ''} who match your needs. Please review the options below and choose one to book your session.`,
          createdAt: new Date(),
        }
        setMessages((prev) => [...prev, msg])
      } catch (err: any) {
        toast({ title: 'Matching failed', description: err.message, variant: 'destructive' })
      }
    },
    [session, toast]
  )

  const selectTherapist = useCallback((therapist: Therapist) => {
    setSelectedTherapist(therapist)
    setShowBooking(true)
  }, [])

  const onBookingSuccess = useCallback((confirmationMessage: string) => {
    const msg: LocalMessage = {
      id:        `booking-${Date.now()}`,
      role:      'assistant',
      content:   confirmationMessage,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, msg])
    setShowBooking(false)
    setMatchedTherapists([])
  }, [])

  const resetChat = useCallback(() => {
    // Generate new session ID — fresh start
    chatSessionId.current = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setMessages([WELCOME_MESSAGE])
    setInquiryId(null)
    setExtraction(null)
    setMatchedTherapists([])
    setShowBooking(false)
    setSelectedTherapist(null)
  }, [])

  return {
    messages,
    isLoading,
    inquiryId,
    extraction,
    matchedTherapists,
    showBooking,
    selectedTherapist,
    sendMessage,
    selectTherapist,
    setShowBooking,
    onBookingSuccess,
    resetChat,
  }
}