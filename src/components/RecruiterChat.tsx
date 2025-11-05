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
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Recruiter Assistant</h3>
        <p className="text-sm text-gray-600">
          {contextDisplay.description}
        </p>
        {contextDisplay.hasContext && (
          <div className="mt-2 text-xs text-gray-500">
            {jobId && <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">Job Selected</span>}
            {resumeIds?.length && <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-1">{resumeIds.length} Resume{resumeIds.length > 1 ? 's' : ''} Selected</span>}
            {workflowContext && <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded">Workflow Context Available</span>}
          </div>
        )}
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">
              {contextDisplay.emptyMessage}
            </p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={contextDisplay.placeholder}
            disabled={loading}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
