import { runAIAgent } from '../src/services/agentEngine.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    if (typeof res.status === 'function') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    const agentResult = await runAIAgent({
      question: payload.question || '',
      history: payload.history || [],
      inventory: payload.inventory || [],
      simulationDate: payload.simulationDate,
      apiKeyOverride: geminiKey || openAiKey,
    });

    res.setHeader('Content-Type', 'application/json');
    if (typeof res.status === 'function') {
      res.status(200).json({ success: true, data: agentResult });
    } else {
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data: agentResult }));
    }
  } catch (err: any) {
    res.setHeader('Content-Type', 'application/json');
    if (typeof res.status === 'function') {
      res.status(500).json({
        success: false,
        error: err?.message || 'Internal Agent Error',
      });
    } else {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          success: false,
          error: err?.message || 'Internal Agent Error',
        })
      );
    }
  }
}
