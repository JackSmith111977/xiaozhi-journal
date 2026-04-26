import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { callAI } from '@/lib/ai';
import { decryptKey } from '@/lib/encryption';
import { createClient } from '@/lib/supabase/server';
import type { MoodLevel, AIResponse } from '@/types';

const PLATFORM_DAILY_LIMIT = 5;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Atomically increment platform_calls or byok_calls for today's AI usage.
 * NOTE: Race condition is possible in extreme cases (two concurrent requests
 * both pass the pre-check, both increment). Off-by-one is acceptable for MVP.
 */
async function incrementAIUsage(
  supabase: SupabaseClient,
  userId: string,
  today: string,
  currentCalls: number,
  byokCalls: number,
  tier: string,
  useByok: boolean
) {
  if (useByok) {
    // Increment byok_calls for BYOK mode
    const { error: upsertError } = await supabase
      .from('ai_usage')
      .upsert(
        {
          user_id: userId,
          date: today,
          platform_calls: currentCalls,
          byok_calls: byokCalls + 1,
        },
        { onConflict: 'user_id,date' }
      );

    if (upsertError) {
      console.error('[API Route] Failed to increment ai_usage (BYOK):', upsertError.message);
      Sentry.captureException(upsertError);
    }
  } else {
    // Increment platform_calls for platform mode
    const { error: upsertError } = await supabase
      .from('ai_usage')
      .upsert(
        {
          user_id: userId,
          date: today,
          platform_calls: currentCalls + 1,
          byok_calls: byokCalls,
        },
        { onConflict: 'user_id,date' }
      );

    if (upsertError) {
      console.error('[API Route] Failed to increment ai_usage:', upsertError.message);
      Sentry.captureException(upsertError);
    }
  }
}

/**
 * Fetch the user's active BYOK key from the database and decrypt it.
 * Returns null if no active key is found.
 */
async function getUserDecryptedKey(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_key, iv')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  try {
    return await decryptKey(data.encrypted_key, data.iv);
  } catch (err) {
    console.error('[API Route] Failed to decrypt BYOK key:', err);
    return null;
  }
}

/**
 * Update journal record with AI results after a successful AI call.
 * Includes user_id filter as defense-in-depth.
 */
async function updateJournalStatus(
  supabase: SupabaseClient,
  journalId: string,
  userId: string,
  aiResult: AIResponse
) {
  const { error: updateError } = await supabase
    .from('journals')
    .update({
      ai_response: aiResult.response,
      golden_quote: aiResult.goldenQuote,
      mood_label: aiResult.moodLabel,
      status: 'ai_done',
    })
    .eq('id', journalId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('[API Route] Failed to update journal status:', updateError.message);
    Sentry.captureException(updateError);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, mood, id: journalId, useByok } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }
    if (!mood || typeof mood !== 'number' || mood < 1 || mood > 5 || Number.isNaN(mood)) {
      return NextResponse.json({ error: 'mood must be a number 1-5' }, { status: 400 });
    }

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    // Check today's AI usage
    const today = new Date().toISOString().split('T')[0] ?? '';
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('platform_calls, byok_calls, tier')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const platformCalls = usage?.platform_calls ?? 0;
    const byokCalls = usage?.byok_calls ?? 0;
    const tier = usage?.tier ?? 'free';

    // Determine if using BYOK mode
    const isByok = useByok === true;

    // If BYOK but no configured key, fall back to platform AI
    let decryptedKey: string | null = null;
    let effectiveByok = false;

    if (isByok) {
      decryptedKey = await getUserDecryptedKey(supabase, userId);
      if (decryptedKey) {
        effectiveByok = true;
      }
    }

    // Enforce platform daily limit only when NOT using BYOK
    if (!effectiveByok) {
      if (tier === 'free' && platformCalls >= PLATFORM_DAILY_LIMIT) {
        return NextResponse.json(
          { error: '今日 AI 额度已用完，明天再来，或升级到无限版', remainingCalls: 0 },
          { status: 429 }
        );
      }
    }

    const remainingCalls =
      effectiveByok
        ? null
        : tier === 'free'
          ? Math.max(0, PLATFORM_DAILY_LIMIT - platformCalls)
          : null;

    // Call AI with or without BYOK key
    const result = await callAI(
      content.trim(),
      mood as MoodLevel,
      effectiveByok ? decryptedKey! : undefined
    );

    // Handle BYOK invalid key scenario
    if (effectiveByok && result.invalidKey) {
      // Still increment byok_calls to track the attempt
      await incrementAIUsage(supabase, userId, today, platformCalls, byokCalls, tier, true);

      return NextResponse.json({
        response: '小知暂时不在，但你的感受已经保存好了。稍后再来看看想对你说什么吧~',
        goldenQuote: '每一段难熬的时光，都是生活在给你放假。',
        moodLabel: '本地',
        fromFallback: true,
        remainingCalls: null,
        byokMessage: '你的 API Key 似乎不太对，检查一下？也可以先用平台 AI',
      });
    }

    // Update journal status first — data persistence > usage counting
    if (journalId && !result.fromFallback) {
      await updateJournalStatus(supabase, journalId, userId, result);
    }

    // Increment usage counters after journal update
    await incrementAIUsage(supabase, userId, today, platformCalls, byokCalls, tier, effectiveByok);

    return NextResponse.json({
      response: result.response,
      goldenQuote: result.goldenQuote,
      moodLabel: result.moodLabel,
      fromFallback: result.fromFallback,
      remainingCalls,
    });
  } catch (error) {
    console.error('[API Route] Error:', error);
    return NextResponse.json({
      response: '小知暂时不在，但你的感受已经保存好了。稍后再来看看想对你说什么吧~',
      goldenQuote: '每一段难熬的时光，都是生活在给你放假。',
      moodLabel: '本地',
      fromFallback: true,
      remainingCalls: null,
    });
  }
}
