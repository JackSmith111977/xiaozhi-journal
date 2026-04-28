// AI response generation stub
// Placeholder for AI integration

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'dashscope' | 'local';
  apiKey?: string;
  model?: string;
}

export interface AIResult {
  response: string;
  goldenQuote: string;
  moodLabel: string;
  fromFallback: boolean;
  invalidKey?: boolean;
}

export function getAIConfig(): AIConfig {
  return { provider: 'local' };
}

export async function callAI(
  content: string,
  mood?: number,
  apiKey?: string
): Promise<AIResult> {
  // Stub - returns placeholder response
  console.log('callAI stub called with:', content.substring(0, 50));

  // If apiKey provided, simulate validation
  if (apiKey) {
    // Simulate invalid key if too short
    if (apiKey.length < 10) {
      return {
        response: 'API Key 无效，请检查',
        goldenQuote: '自带 Key，无限可能。',
        moodLabel: '提示',
        fromFallback: true,
        invalidKey: true,
      };
    }
  }

  return {
    response: `AI stub response for mood ${mood}: "${content.substring(0, 30)}..."`,
    goldenQuote: '每一段难熬的时光，都是生活在给你放假。',
    moodLabel: '本地',
    fromFallback: true,
  };
}