import type { AIResponse, MoodLevel } from '@/types';

const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

const FALLBACK_QUOTES = [
  '每一段难熬的时光，都是生活在给你放假。',
  '你已经做得很好了，不用逼自己太紧。',
  '允许自己慢下来，也是一种勇气。',
  '今天的风很温柔，就像你一样。',
  '不是所有的答案都需要现在找到。',
  '你的感受很重要，不要忽略它。',
  '哪怕只是撑过了今天，也很了不起。',
  '世界很大，你的烦恼很小，但你的感受同样珍贵。',
  '休息不是偷懒，是给自己充电。',
  '明天又是新的一天，今天先放过自己吧。',
];

const SYSTEM_PROMPT = `你是一个温暖、有个性的朋友，名叫"小知"。用户写日记后，你给出 2-3 句回应：先共情他的感受，再用一个独特的角度帮他重新看待这件事。不要用鸡汤话，要真实有共鸣。最后用一句话提炼这篇日记的"金句"，像一句诗。

请以严格的 JSON 格式返回：
{"response": "共情回应（2-3句）", "goldenQuote": "今日金句", "moodLabel": "情绪标签"}`;

function buildRequestBody(content: string) {
  return JSON.stringify({
    model: 'qwen-turbo',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content },
    ],
    temperature: 0.8,
    max_tokens: 300,
  });
}

function parseAIResponse(text: string, fallbackText?: string): AIResponse | null {
  if (!text) return null;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed.response !== 'string' || typeof parsed.goldenQuote !== 'string' || typeof parsed.moodLabel !== 'string') {
      return null;
    }
    return {
      response: parsed.response || fallbackText || text,
      goldenQuote: parsed.goldenQuote || FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)],
      moodLabel: parsed.moodLabel || '复杂',
      fromFallback: false,
    };
  } catch {
    return null;
  }
}

export async function callAI(content: string, mood: MoodLevel): Promise<AIResponse> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return getFallbackResponse(mood);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const body = buildRequestBody(content);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status}`);
    }

    const data = await res.json();
    const contentText = data.choices?.[0]?.message?.content;
    const parsed = parseAIResponse(contentText);
    if (parsed) return parsed;

    // Retry once with a new timeout
    const retryController = new AbortController();
    const retryTimeout = setTimeout(() => retryController.abort(), 15000);
    const retryRes = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body,
      signal: retryController.signal,
    });

    clearTimeout(retryTimeout);

    if (!retryRes.ok) {
      throw new Error(`Retry failed: ${retryRes.status}`);
    }

    const retryData = await retryRes.json();
    const retryContent = retryData.choices?.[0]?.message?.content;
    const retryParsed = parseAIResponse(retryContent);
    if (retryParsed) return retryParsed;

    return getFallbackResponse(mood);
  } catch {
    clearTimeout(timeout);
    return getFallbackResponse(mood);
  }
}

function getFallbackResponse(mood: MoodLevel): AIResponse {
  return {
    response: '小知暂时不在，但你的感受已经保存好了。稍后再来看看想对你说什么吧~',
    goldenQuote: FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)],
    moodLabel: '本地',
    fromFallback: true,
  };
}
