'use client'

import { treaty } from '@elysiajs/eden'
import { Button, Input, Tabs, Textarea } from '@nmit-coursition/ui/design-system'
import { useSignal } from '@preact/signals-react/runtime'
import { useActionState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import type { App } from '../../../../backend/src'
import { FileDropper } from '../../components/fileDropper'
import { StatusDisplay } from '../../components/statusDisplay'
import { TranscriptionResults } from '../../components/transcriptionResults'
import { VideoPlayer } from '../../components/videoPlayer'

const app = treaty<App>(process.env["NEXT_PUBLIC_BACKEND_URL"] || "http://localhost:3000")

const fileSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('file'),
    file: zfd.file(),
    keywords: z.string().optional(),
    language: z.string().optional(),
  }),
  z.object({
    type: z.literal('url'),
    url: z.string().url(),
    keywords: z.string().optional(),
    language: z.string().optional(),
  }),
])

const initialState = {
  raw: '',
  srt: '',
  vtt: '',
  videoSource: '',
}

const statusStates = [
  { key: 'upload', text: 'Uploading media' },
  { key: 'parse', text: 'Transcribing' },
]

export default function Index() {
  const status = useSignal<'idle' | 'upload' | 'parse' | 'done'>('idle')

  const handleSubmit = async (formData: FormData) => {
    try {
      status.value = 'upload'

      const rawFormData = Object.fromEntries(formData.entries())
      const type = formData.has('file') ? 'file' : 'url'
      const parsedData = fileSchema.parse({ type, ...rawFormData })

      const videoSource = parsedData.type === 'file' ? URL.createObjectURL(parsedData.file) : parsedData.url

      status.value = 'parse'
      const keywordsArray = parsedData.keywords ? parsedData.keywords.split(',').map((word) => `${word}:5`) : []
      const output: ('text' | 'vtt' | 'srt')[] = ['text', 'srt', 'vtt']

      const options = {
        headers: {
          authorization: 'PRODPGrFxpGEtrOZfuWhnoJohUYBXuOE',
        },
      }
      const { data, error } =
        parsedData.type == 'file'
          ? await app.v1.parse.media.post(
              {
                file: parsedData.file,
                keywords: keywordsArray,
                language: (parsedData.language || 'en-GB') as any,
                output,
              },
              options,
            )
          : await app.v1.parse['public-media'].post(
              {
                url: parsedData.url,
                keywords: keywordsArray,
                language: (parsedData.language || 'en-GB') as any,
                output,
              },
              options,
            )

      if (error) throw new Error(error.value.description)
      const { text, srt, vtt } = data
      status.value = 'done'
      return { raw: text, srt, vtt, videoSource }
    } catch (error) {
      toast.error(`Something went wrong. Reason: ${error instanceof Error ? error.message : 'Unknown.'}`)
      status.value = 'idle'
      return initialState
    }
  }

  const [state, formAction] = useActionState((_: unknown, formData: FormData) => handleSubmit(formData), initialState)

  return (
    <div className='flex justify-center h-screen'>
      <div className='p-4 max-w-2xl w-full'>
        {status.value === 'idle' && (
          <>
            <h1 className='text-2xl font-bold mb-4'>Upload media</h1>
            <form className='space-y-4' action={formAction}>
              <Tabs
                values={[
                  {
                    value: 'file',
                    displayText: 'File',
                    children: (
                      <FileDropper
                        idleMessage="Drag 'n' drop some files here, or click to select files"
                        dropZoneMessage='Drop the files here ...'
                        inputName='file'
                        maxFiles={1}
                        accept={{ 'video/*': [], 'audio/*': [] }}
                      />
                    ),
                  },
                  {
                    value: 'url',
                    displayText: 'URL',
                    children: (
                      <Input type='url' id='url' name='url' placeholder='Enter media URL' labelText='URL' required />
                    ),
                  },
                ]}
              />
              <div className='flex gap-3 flex-col w-full'>
                <Input
                  type='text'
                  id='language'
                  name='language'
                  placeholder='en-GB'
                  labelText='Language'
                  subText='What is main language of the video. Accepted is two letter keycode, e.g. en, cs.'
                />
                <Textarea
                  label='Difficult words'
                  placeholder='ChatGPT, Claude, Zig'
                  id='keywords'
                  subtext='Unusual words or phrases that may be difficult to transcribe. Separate with commas. Avoid putting common words.'
                />
              </div>
              <div className='flex gap-4'>
                <Button type='submit' className='w-full'>
                  Transcribe
                </Button>
              </div>
            </form>
          </>
        )}
        {status.value !== 'idle' && status.value !== 'done' && (
          <StatusDisplay states={statusStates} status={status.value} />
        )}
        {status.value === 'done' && (
          <Tabs
            listClassName='h-auto'
            triggerClassName='text-lg m-1'
            values={[
              {
                value: 'video',
                displayText: 'Video',
                children: (
                  <div className='w-full aspect-video'>
                    <VideoPlayer source={state.videoSource} subtitles={state.vtt} />
                  </div>
                ),
              },
              {
                value: 'text',
                displayText: 'Text',
                children: <TranscriptionResults raw={state.raw} srt={state.srt} vtt={state.vtt} />,
              },
            ]}
          />
        )}
      </div>
    </div>
  )
}
