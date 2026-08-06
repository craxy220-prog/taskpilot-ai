import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types';

const EDGE_FUNCTION_URL = 'https://cgksadcrorettklvytbp.supabase.co/functions/v1/document-ai';

export function useChat(docId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!docId) {
      setMessages([]);
      return;
    }

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('document_id', docId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data as ChatMessage[]);
  }, [docId]);

  async function sendMessage(content: string, documentContent: string) {
    if (!docId || !content.trim() || streaming) return;

    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    setStreaming(true);

    // Save user message
    const { data: userMsg } = await supabase
      .from('chat_messages')
      .insert({
        document_id: docId,
        user_id: userId,
        role: 'user',
        content: content.trim(),
      })
      .select()
      .single();

    if (userMsg) {
      setMessages(prev => [...prev, userMsg as ChatMessage]);
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) throw new Error('No auth token');

      // Build message history for context
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'chat',
          documentContent,
          messages: history,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to get response');
      }

      const data = await res.json();

      // Save assistant message
      const { data: assistantMsg } = await supabase
        .from('chat_messages')
        .insert({
          document_id: docId,
          user_id: userId,
          role: 'assistant',
          content: data.reply,
        })
        .select()
        .single();

      if (assistantMsg) {
        setMessages(prev => [...prev, assistantMsg as ChatMessage]);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        document_id: docId,
        user_id: userId,
        role: 'assistant',
        content: "I'm sorry, I couldn't process that request. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setStreaming(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return {
    messages,
    streaming,
    messagesEndRef,
    fetchMessages,
    sendMessage,
    scrollToBottom,
  };
}