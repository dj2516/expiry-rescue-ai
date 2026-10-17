import { ProductItem, ChatMessage, SIMULATION_DATE } from '../types/index';
import { runDeterministicToolFallback, AgentChatMessage } from './agentEngine';

export interface AgentApiStatus {
  configured: boolean;
  provider: string;
  model: string;
}

/**
 * Checks whether server-side LLM provider credentials are configured.
 */
export async function checkAgentApiStatus(): Promise<AgentApiStatus> {
  try {
    const res = await fetch('/api/agent/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Server endpoint not reachable (static preview mode)
  }
  return {
    configured: false,
    provider: 'deterministic-fallback',
    model: 'rule-engine-v2',
  };
}

/**
 * Main query entry point for Expiry Rescue AI chatbot.
 * Dispatches query with conversation history and live inventory to the server-side LLM agent.
 * If server is offline or keys are unconfigured, seamlessly runs deterministic tool fallback.
 */
export async function queryAiAssistant(
  question: string,
  products: ProductItem[],
  history: ChatMessage[] = []
): Promise<ChatMessage> {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Map previous chat messages to agent conversation history
  const agentHistory: AgentChatMessage[] = history
    .filter((m) => m.id !== 'welcome-1') // omit welcome banner
    .map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

  // 1. Attempt to call server-side AI Agent endpoint
  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        history: agentHistory,
        inventory: products,
        simulationDate: SIMULATION_DATE,
      }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: result.data.text,
          timestamp,
          isRuleBased: result.data.isRuleBased,
          toolsUsed: result.data.toolsUsed,
          provider: result.data.provider,
        };
      }
    }
  } catch (err) {
    console.warn('Server /api/agent request failed, falling back to local deterministic tool engine:', err);
  }

  // 2. Client-side deterministic tool engine fallback (100% reliable, zero hallucination)
  const fallbackResult = runDeterministicToolFallback(
    question,
    agentHistory,
    products,
    SIMULATION_DATE
  );

  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    text: fallbackResult.text,
    timestamp,
    isRuleBased: fallbackResult.isRuleBased,
    toolsUsed: fallbackResult.toolsUsed,
    provider: fallbackResult.provider,
  };
}
