export default function handler(_req: any, res: any) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const isConfigured = Boolean((geminiKey && geminiKey.trim()) || (openAiKey && openAiKey.trim()));
  const provider = geminiKey ? 'gemini' : openAiKey ? 'openai' : 'none';
  const model = geminiKey
    ? process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    : openAiKey
    ? process.env.OPENAI_MODEL || 'gpt-4o-mini'
    : 'deterministic-fallback';

  res.setHeader('Content-Type', 'application/json');
  if (typeof res.status === 'function') {
    res.status(200).json({
      configured: isConfigured,
      provider,
      model,
    });
  } else {
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        configured: isConfigured,
        provider,
        model,
      })
    );
  }
}
