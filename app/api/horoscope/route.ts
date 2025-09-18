import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

// Map Georgian sign names to English for upstream APIs
const signMap: Record<string, string> = {
  'ვერძი': 'aries',
  'კურო': 'taurus',
  'ტყუპები': 'gemini',
  'კირჩხიბი': 'cancer',
  'ლომი': 'leo',
  'ქალწული': 'virgo',
  'სასწორი': 'libra',
  'მორიელი': 'scorpio',
  'მშვილდოსანი': 'sagittarius',
  'თხის რქა': 'capricorn',
  'მერწყული': 'aquarius',
  'თევზები': 'pisces',
};

function normalizeSign(signParam: string | null): string | null {
  if (!signParam) return null;
  const lower = signParam.toLowerCase();
  // Accept either English or Georgian values
  const geToEn = signMap[signParam as keyof typeof signMap];
  if (geToEn) return geToEn;
  // If already English and valid, pass through
  const valid = Object.values(signMap).includes(lower);
  return valid ? lower : null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const signParam = url.searchParams.get('sign');
    const day = url.searchParams.get('day') || 'today';
    const targetLang = (url.searchParams.get('lang') || 'ka').toLowerCase();

    const sign = normalizeSign(signParam);
    if (!sign) {
      return NextResponse.json({ error: 'Invalid sign' }, { status: 400 });
    }

    // Try any.ge first (Georgian content)
    try {
      const anyUrl = `https://any.ge/horoscope/api/?sign=${encodeURIComponent(sign)}&type=daily&day=${encodeURIComponent(day)}&lang=ge`;
      const res = await fetch(anyUrl, { cache: 'no-store' });
      const text = await res.text();
      // any.ge can return 'null' as a string when unavailable
      if (res.ok && text && text !== 'null') {
        try {
          const data = JSON.parse(text);
          if (data && data.horoscope) {
            // If user asked for English explicitly, provide English by translating back
            if (targetLang === 'en') {
              const back = await translateText(data.horoscope, 'ka', 'en');
              return NextResponse.json({ sign, day, horoscope: back || data.horoscope, source: 'any.ge+translate' }, { status: 200 });
            }
            return NextResponse.json({ sign, day, horoscope: data.horoscope, source: 'any.ge' }, { status: 200 });
          }
        } catch {
          // fallthrough
        }
      }
    } catch {
      // ignore and fall back
    }

    // Fallback: ohmanda.com (English) then translate to target language (default Georgian)
    try {
      const ohUrl = `https://ohmanda.com/api/horoscope/${encodeURIComponent(sign)}/`;
      const ohRes = await fetch(ohUrl, { cache: 'no-store', redirect: 'follow' });
      if (ohRes.ok) {
        const ohJson = await ohRes.json();
        const enText: string | undefined = ohJson?.horoscope;
        if (enText) {
          if (targetLang === 'en') {
            return NextResponse.json({ sign, day, horoscope: enText, source: 'ohmanda' }, { status: 200 });
          }
          const translated = await translateText(enText, 'en', targetLang);
          return NextResponse.json({ sign, day, horoscope: translated || enText, source: translated ? 'ohmanda+translate' : 'ohmanda' }, { status: 200 });
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Simple in-memory cache to avoid repeated translation calls
const translationCache = new Map<string, string>();

function hashText(input: string): string {
  return createHash('sha1').update(input).digest('hex');
}

async function translateText(text: string, from: string, to: string): Promise<string | null> {
  if (from === to) return text;
  const key = `${from}:${to}:${hashText(text)}`;
  const cached = translationCache.get(key);
  if (cached) return cached;

  // Helper: timeout wrapper
  const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}) => {
    const { timeoutMs = 6000, ...rest } = init;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // @ts-ignore
      return await fetch(input, { ...rest, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  };

  // Helper: split long text into chunks under 450 chars (MyMemory limit ~500)
  const splitIntoChunks = (input: string, maxLen = 450): string[] => {
    const sentences = input.match(/[^.!?\n]+[.!?\n]*/g) || [input];
    const chunks: string[] = [];
    let current = '';
    for (const s of sentences) {
      if ((current + s).length > maxLen) {
        if (current) chunks.push(current);
        if (s.length > maxLen) {
          // hard split long sentence by words
          let segment = '';
          for (const w of s.split(/\s+/)) {
            if ((segment + ' ' + w).trim().length > maxLen) {
              if (segment) chunks.push(segment);
              segment = w;
            } else {
              segment = (segment ? segment + ' ' : '') + w;
            }
          }
          if (segment) chunks.push(segment);
          current = '';
        } else {
          current = s;
        }
      } else {
        current += s;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  };

  // Try MyMemory first (chunked)
  try {
    const parts = splitIntoChunks(text);
    const translatedParts: string[] = [];
    for (const part of parts) {
      const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(part)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`;
      const mmRes = await fetchWithTimeout(mmUrl, { cache: 'no-store', timeoutMs: 5000 });
      if (!mmRes.ok) { translatedParts.length = 0; break; }
      const mmJson: any = await mmRes.json();
      const t = (mmJson?.responseData?.translatedText as string | undefined) || '';
      // Detect error message passed through as text
      if (!t || /QUERY LENGTH LIMIT EXCEEDED/i.test(t)) { translatedParts.length = 0; break; }
      translatedParts.push(t);
    }
    if (translatedParts.length === parts.length && translatedParts.length > 0) {
      const full = translatedParts.join(' ');
      translationCache.set(key, full);
      return full;
    }
  } catch {}

  // Fallback to LibreTranslate (single or chunked)
  try {
    const parts = splitIntoChunks(text, 9000); // LT allows larger payloads
    const translatedParts: string[] = [];
    for (const part of parts) {
      const ltRes = await fetchWithTimeout('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: part, source: from, target: to, format: 'text' }),
        timeoutMs: 7000
      });
      if (!ltRes.ok) { translatedParts.length = 0; break; }
      const ltJson: any = await ltRes.json();
      const t = (ltJson?.translatedText as string) || '';
      if (!t) { translatedParts.length = 0; break; }
      translatedParts.push(t);
    }
    if (translatedParts.length === parts.length && translatedParts.length > 0) {
      const full = translatedParts.join(' ');
      translationCache.set(key, full);
      return full;
    }
  } catch {}

  return null;
}


