import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, ShieldCheck, Sparkles, AlertCircle, Wrench, CheckCircle2 } from 'lucide-react';
import { ProductItem, ChatMessage } from '../types';
import { queryAiAssistant, checkAgentApiStatus, AgentApiStatus } from '../services/aiExplanationService';

interface AiAdviceViewProps {
  products: ProductItem[];
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-1',
  sender: 'assistant',
  text: `Namaste! I am your **Expiry Rescue AI Retail Agent**.\n\nI answer open-ended questions about your store's live inventory, calculate expiry runways, model markdown scenarios, and provide verified guidance using deterministic tools.\n\nAsk any question or pick a suggestion below:`,
  timestamp: 'Just now',
  isRuleBased: true,
};

export const AiAdviceView: React.FC<AiAdviceViewProps> = ({
  products,
  initialQuery,
  onClearInitialQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiStatus, setApiStatus] = useState<AgentApiStatus>({
    configured: false,
    provider: 'deterministic-fallback',
    model: 'rule-engine-v2',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'What is the expiry date of milk?',
    'Which product expires first?',
    'How many products expire in the next seven days?',
    'What would happen if I reduced this product\'s price by 15%?',
    'How much inventory cost is associated with products expiring this week?',
    'Which products have missing expiry dates?',
  ];

  useEffect(() => {
    checkAgentApiStatus().then(setApiStatus).catch(() => {});
  }, []);

  const handleSend = useCallback(async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: timeStr,
    };

    // Append user message immediately and capture current message history for agent context
    setMessages((prev) => {
      const updated = [...prev, userMessage];
      return updated;
    });
    setInputText('');
    setIsTyping(true);

    try {
      // Pass full conversation history to agent for reference resolution ("it", "that product", etc.)
      const response = await queryAiAssistant(trimmed, products, messages);
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'An error occurred while communicating with the agent. Please try again.',
          timestamp: timeStr,
          isRuleBased: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [products, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery, handleSend, onClearInitialQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputText);
    }
  };

  const parseInlineStyles = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-800 border border-slate-200">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('> ')) {
        return (
          <div
            key={idx}
            className="my-2 p-2.5 rounded-lg bg-amber-50/80 border-l-4 border-amber-500 text-xs text-amber-900 leading-relaxed"
          >
            {line.replace(/^>\s*/, '')}
          </div>
        );
      }

      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 text-sm mt-3 mb-1.5">
            {line.replace(/^###\s*/, '')}
          </h4>
        );
      }

      if (line.startsWith('- ')) {
        const bulletText = line.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-800 my-0.5">
            {parseInlineStyles(bulletText)}
          </li>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-xs text-slate-800 leading-relaxed">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden">
      {/* Header Bar with Live AI / Deterministic Status */}
      <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#090e17] text-white flex items-center justify-center shadow-xs shrink-0">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900">AI Advice</h1>
              {apiStatus.configured ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Live LLM: {apiStatus.provider.toUpperCase()} ({apiStatus.model})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-300" title="Add GEMINI_API_KEY in .env for open-ended LLM reasoning">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>Deterministic Tool Engine (Grounded)</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Data-aware agent with function calling across your active {products.length} inventory records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto font-mono">
          <span>Simulation Date: 17/10/2026</span>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div className="px-5 py-2.5 bg-slate-50/40 border-b border-slate-200/70 flex flex-wrap items-center gap-1.5 shrink-0">
        <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          Try asking:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-xs font-medium px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-md border border-slate-200/80 shadow-2xs transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-[#090e17] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-50/90 text-slate-900 border border-slate-200/80 rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p>{msg.text}</p>
                ) : (
                  <div>
                    {renderFormattedText(msg.text)}

                    {/* Show tools executed for transparency */}
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-600">Tools invoked:</span>
                        {msg.toolsUsed.map((tool, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 font-mono text-[9px]"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    {msg.isRuleBased && !msg.toolsUsed?.length && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Calculated deterministically using application inventory math</span>
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`text-[9px] mt-1.5 text-right font-mono ${
                    isUser ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#090e17] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse delay-75" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse delay-150" />
              <span className="ml-1 text-[11px] font-medium text-slate-600">
                Agent inspecting inventory tools...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3.5 sm:p-4 border-t border-slate-200/80 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            id="ai-advice-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything: e.g. 'What is the expiry of milk?', 'Which product expires first?', 'What if I discount bread by 10%?'"
            className="flex-1 px-3.5 py-2.5 bg-slate-50/80 border border-slate-300/80 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-semibold shrink-0"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
