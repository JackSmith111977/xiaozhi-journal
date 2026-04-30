import type { AIResponse, MoodLevel } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DASHSCOPE_API_URL =
  'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const AI_MODEL = 'qwen-turbo';
const AI_TIMEOUT_MS = 15_000;

export const SYSTEM_PROMPT = `你是"小知"，一个充满同理心的日记助手。
你的职责是阅读用户的日记内容，给出温暖、有建设性的回应。

请始终用中文回复。

你需要返回一个 JSON 对象，格式如下：
{
  "response": "你对日记内容的回应，温暖且有同理心，2-4句话",
  "goldenQuote": "一句与用户当前心境相关的金句/名言",
  "moodLabel": "一个简短的情绪标签，如'需要释放'、'充满希望'等"
}

只返回 JSON，不要包含任何其他文字。`;

export const FALLBACK_QUOTES: { quote: string; label: string }[] = [
  { quote: '每一段难熬的时光，都是生活在给你放假。', label: '治愈' },
  { quote: '慢慢来，比较快。', label: '从容' },
  { quote: '万物皆有裂痕，那是光照进来的地方。——莱昂纳德·科恩', label: '希望' },
  { quote: '你不必很厉害才能开始，但你必须开始才能变得很厉害。', label: '鼓励' },
  { quote: '生活不是等待暴风雨过去，而是学会在雨中跳舞。', label: '坚强' },
  { quote: '每一个不曾起舞的日子，都是对生命的辜负。——尼采', label: '热爱' },
  { quote: '世界上只有一种英雄主义，就是看清生活的真相之后依然热爱生活。——罗曼·罗兰', label: '勇气' },
  { quote: '你比自己想象的更强大。', label: '自信' },
  { quote: '每一次低谷，都是一次重新出发的机会。', label: '重启' },
  { quote: '允许自己慢慢来，也是一种成长。', label: '温柔' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequestBody(content: string, mood: MoodLevel): string {
  const moodDescriptions: Record<MoodLevel, string> = {
    1: '烦躁/愤怒',
    2: '难过/低落',
    3: '平静/一般',
    4: '开心/愉悦',
    5: '疲惫/倦怠',
  };

  return JSON.stringify({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `我今天的心情是「${moodDescriptions[mood]}」（${mood}/5），我的日记内容如下：\n\n${content}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });
}

function parseAIResponse(text: string): AIResponse {
  // Try to extract JSON from the response (may be wrapped in markdown code blocks)
  let jsonStr = text.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1]!.trim();
  }

  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

  return {
    response: typeof parsed.response === 'string' ? parsed.response : '',
    goldenQuote: typeof parsed.goldenQuote === 'string' ? parsed.goldenQuote : '',
    moodLabel: typeof parsed.moodLabel === 'string' ? parsed.moodLabel : '',
    fromFallback: false,
  };
}

function getFallbackResponse(): AIResponse {
  const pick = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]!;
  return {
    response: '抱歉，暂时无法生成回应。但这里有一句送给你的话：',
    goldenQuote: pick.quote,
    moodLabel: pick.label,
    fromFallback: true,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function callAI(
  content: string,
  mood: MoodLevel,
  apiKeyOverride?: string
): Promise<AIResponse> {
  const apiKey = apiKeyOverride || process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    console.warn('[callAI] DASHSCOPE_API_KEY not set, using fallback');
    return getFallbackResponse();
  }

  const body = buildRequestBody(content, mood);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error('[callAI] DashScope API error:', res.status, res.statusText);
      return getFallbackResponse();
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const aiText = data.choices?.[0]?.message?.content;
    if (!aiText) {
      console.error('[callAI] Empty response from DashScope');
      return getFallbackResponse();
    }

    try {
      return parseAIResponse(aiText);
    } catch (parseErr) {
      console.warn('[callAI] JSON parse failed:', parseErr);
      return getFallbackResponse();
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[callAI] Request failed:', err);
    return getFallbackResponse();
  }
}
