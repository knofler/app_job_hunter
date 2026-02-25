'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RecruiterChatProps {
  sessionId: string;
  jobId?: string;
  resumeIds?: string[];
  workflowContext?: Record<string, unknown>;
}

export default function RecruiterChat({ sessionId, jobId, resumeIds, workflowContext }: RecruiterChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [shouldAutoScroll]);

  // Always scroll to show new user messages immediately
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        // Always scroll to show new user message
        setShouldAutoScroll(true);
        scrollToBottom();
      }
    }
  }, [messages, scrollToBottom]);

  // When streaming starts, disable auto-scroll to prevent jumping
  useEffect(() => {
    if (isStreaming) {
      setShouldAutoScroll(false);
    }
  }, [isStreaming]);

  // When streaming completes, show the full response
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        // Streaming just completed, scroll to show the full response
        setTimeout(() => {
          setShouldAutoScroll(true);
          scrollToBottom();
        }, 100); // Small delay to ensure DOM is updated
      }
    }
  }, [isStreaming, messages, scrollToBottom]);

  // Memoize context display to prevent unnecessary re-renders
  const contextDisplay = useMemo(() => ({
    hasContext: !!(jobId || resumeIds?.length || workflowContext),
    description: jobId || resumeIds?.length || workflowContext ?
      'Context-aware chat with current workflow data' :
      'General recruitment assistance and advice',
    placeholder: jobId || resumeIds?.length || workflowContext ?
      "Ask about the job, resumes, or workflow..." :
      "Ask about recruitment, hiring, or candidates...",
    emptyMessage: jobId || resumeIds?.length || workflowContext ?
      'Ask questions about the selected job, resumes, or workflow results.' :
      'Ask me anything about recruitment, hiring strategies, or candidate evaluation.'
  }), [jobId, resumeIds, workflowContext]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setIsStreaming(true);
    // Force scroll to show the new user message immediately
    setShouldAutoScroll(true);
    setTimeout(() => scrollToBottom(), 10);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
          job_id: jobId,
          resume_ids: resumeIds,
          workflow_context: workflowContext,
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'chunk') {
              accumulated += data.content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant') {
                  return [...prev.slice(0, -1), { role: 'assistant', content: accumulated }];
                }
                return [...prev, { role: 'assistant', content: accumulated }];
              });
            } else if (data.type === 'done') {
              break;
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-base text-foreground">Recruiter Assistant</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {contextDisplay.description}
        </p>
        {contextDisplay.hasContext && (
          <div className="mt-2 flex flex-wrap gap-1">
            {jobId && <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">Job Selected</span>}
            {resumeIds?.length && <span className="inline-block bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-xs font-medium">{resumeIds.length} Resume{resumeIds.length > 1 ? 's' : ''} Selected</span>}
            {workflowContext && <span className="inline-block bg-secondary/10 text-secondary px-2 py-0.5 rounded text-xs font-medium">Workflow Context</span>}
          </div>
        )}
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">{contextDisplay.emptyMessage}</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-white'
                : 'bg-muted text-foreground border border-border'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={contextDisplay.placeholder}
            disabled={loading}
            className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            {loading ? '' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
