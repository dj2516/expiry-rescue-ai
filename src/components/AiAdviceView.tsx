import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { ProductItem, ChatMessage } from '../types';
import { queryAiAssistant } from '../services/aiExplanationService';

interface AiAdviceViewProps {
  products: ProductItem[];
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export const AiAdviceView: React.FC<AiAdviceViewProps> = ({
  products,
  initialQuery,
  onClearInitialQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Namaste! I am your **Kirana Expiry AI Advisor**.\n\nI answer your questions using your store's live inventory and actual expiry dates. I will never fabricate prices or stock.\n\nYou can click any question below or type your own question:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRuleBased: true,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'Which products need attention today?',
    'Why is this product at risk?',
    'What should I do with this batch?',
    'What discount would 10% off give me?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);

  const handleSend = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await queryAiAssistant(trimmed, products);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'An error occurred while generating advice. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRuleBased: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputText);
    }
  };

  // Simple renderer for markdown text with bold and bullets
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Check blockquote
      if (line.startsWith('> ')) {
        return (
          <div
            key={idx}
            className="my-2 p-2.5 rounded-lg bg-amber-50 border-l-4 border-amber-400 text-xs text-amber-900"
          >
            {line.replace(/^>\s*/, '')}
          </div>
        );
      }

      // Check header
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 text-sm mt-3 mb-1">
            {line.replace(/^###\s*/, '')}
          </h4>
        );
      }

      // Check bullet
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

  const parseInlineStyles = (content: string) => {
    // Basic bold parsing: **text**
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">AI Advice</h1>
            <p className="text-xs text-slate-500">
              Grounded in your current {products.length} inventory products
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Kirana Calculations</span>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200/80 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Suggested:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-xs font-medium px-3 py-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p>{msg.text}</p>
                ) : (
                  <div>
                    {renderFormattedText(msg.text)}
                    {msg.isRuleBased && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-slate-400" />
                        <span>Rule-based explanation derived from application inventory math</span>
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`text-[9px] mt-1.5 text-right ${
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
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse delay-75"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse delay-150"></div>
              <span className="ml-1 text-[11px]">Analyzing inventory...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-200 bg-white">
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
            placeholder="Ask about inventory, expiry risk, or clearance discounts..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-semibold"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
