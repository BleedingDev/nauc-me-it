import { getTranscript2 } from '@nmit-coursition/ai'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as string

  try {
    const status = await getTranscript2(file)
    console.log(status)

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.log(error)
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
