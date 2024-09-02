'use server'
import { createClient, srt, webvtt } from '@deepgram/sdk'

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || '')

// biome-ignore lint/suspicious/noExplicitAny: Ain't nobody got time for that
export async function getTranscript(file: any, keywords?: string[], language?: string) {
  const { result } = await deepgram.listen.prerecorded.transcribeFile(file, {
    model: 'nova-2',
    smart_format: true,
    utterances: true,
    numerals: true,
    punctuate: true,
    paragraphs: true,
    ...(language ? { language } : { detect_language: true }),
    keywords,
  })

  // TODO: Handle errors, possibly with EffectTS
  if (!result) {
    return { srt: '', vtt: '', raw: '' }
  }

  // * Remove unnecessary metadata
  const vtt = webvtt(result).replace(/WEBVTT\s*\n(?:[\s\S]*?)(?=^(?:\d{2}:)?\d{2}:\d{2})/m, 'WEBVTT\n\n')

  return {
    srt: srt(result),
    vtt,
    raw: result?.results?.channels?.[0]?.alternatives?.[0]?.transcript,
    metadata: result.metadata,
  }
}
