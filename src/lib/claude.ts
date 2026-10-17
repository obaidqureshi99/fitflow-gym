/** Thin wrapper over the Anthropic Messages API. Returns null when no key is set so callers can fall back. */
export async function askClaude(system: string, prompt: string, maxTokens = 700): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: maxTokens, system, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json();
    return data?.content?.[0]?.text ?? null;
  } catch { return null; }
}
