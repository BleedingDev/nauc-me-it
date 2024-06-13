import { parseFile, waitUntilJobIsDone, getResult } from '@nmit-coursition/ai'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as Blob

  try {
    const { id, status } = await parseFile(file)
    console.log(id, status)

    const finalStatus = await waitUntilJobIsDone(id, status)
    console.log('Final status:', finalStatus)

    const markdown = await getResult(id)

    return new Response(JSON.stringify(markdown), {
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