import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { runAIAgent } from '../src/services/agentEngine.ts';

export function agentApiPlugin(): Plugin {
  let envConfig: Record<string, string> = {};

  return {
    name: 'agent-api-plugin',
    configResolved(config) {
      // Load environment variables securely on the server side
      envConfig = loadEnv(config.mode, process.cwd(), '');
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        // 1. Status Health Endpoint
        if (url === '/api/agent/status' && req.method === 'GET') {
          const geminiKey = envConfig.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
          const openAiKey = envConfig.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

          const isConfigured = Boolean((geminiKey && geminiKey.trim()) || (openAiKey && openAiKey.trim()));
          const provider = geminiKey ? 'gemini' : openAiKey ? 'openai' : 'none';
          const model = geminiKey
            ? envConfig.GEMINI_MODEL || 'gemini-1.5-flash'
            : openAiKey
            ? envConfig.OPENAI_MODEL || 'gpt-4o-mini'
            : 'deterministic-fallback';

          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              configured: isConfigured,
              provider,
              model,
            })
          );
          return;
        }

        // 2. Chat Agent Execution Endpoint
        if (url === '/api/agent' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const geminiKey = envConfig.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
              const openAiKey = envConfig.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

              // Forward to Agent Engine with server-side API key
              const agentResult = await runAIAgent({
                question: payload.question || '',
                history: payload.history || [],
                inventory: payload.inventory || [],
                simulationDate: payload.simulationDate,
                apiKeyOverride: geminiKey || openAiKey,
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, data: agentResult }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  error: err?.message || 'Internal Agent Error',
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}
