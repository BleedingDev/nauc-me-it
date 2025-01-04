import { BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems, insertOrUpdateBlock } from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import { SuggestionMenuController, getDefaultReactSlashMenuItems, useCreateBlockNote } from '@blocknote/react'
import { ClientSideSuspense, LiveblocksProvider, RoomProvider, useRoom } from '@liveblocks/react/suspense'
import { createFileRoute } from '@tanstack/react-router'
import { MdQuiz } from 'react-icons/md'
import { Quiz } from '../components/quiz-block'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'
import { LiveblocksYjsProvider } from '@liveblocks/yjs'
import { useEffect, useState } from 'react'
import * as Y from 'yjs'

export const Route = createFileRoute('/editor')({
  component: EditorPage,
  ssr: false,
})

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    quiz: Quiz,
  },
})

const insertQuiz = (editor: typeof schema.BlockNoteEditor) => ({
  title: 'Quiz',
  onItemClick: () => {
    insertOrUpdateBlock(editor, {
      type: 'quiz',
      props: {
        question: 'Some question?',
        answer1: 'Answer 1',
        answer2: 'Answer 2',
        answer3: 'Answer 3',
        answer4: 'Answer 4',
        correctAnswer: 1,
      },
    })
  },
  aliases: ['quiz', 'question', 'test', 'multiple choice', 'single choice'],
  group: 'Others',
  icon: <MdQuiz className='text-blue-500' />,
})

function EditorContent({ doc, provider }: { doc: Y.Doc; provider: LiveblocksYjsProvider }) {
  const editor = useCreateBlockNote({
    schema,
    collaboration: {
      provider,
      fragment: doc.getXmlFragment('document-store'),
      user: {
        name: `User-${Math.floor(Math.random() * 1000)}`,
        // ! Must be in HEX otherwise selection color will not work
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      },
    },
  })

  return (
    <BlockNoteView editor={editor} slashMenu={false} theme='light'>
      <SuggestionMenuController
        triggerCharacter='/'
        getItems={async (query) =>
          filterSuggestionItems([...getDefaultReactSlashMenuItems(editor), insertQuiz(editor)], query)
        }
      />
    </BlockNoteView>
  )
}

function EditorWrapper() {
  const room = useRoom()
  const [doc, setDoc] = useState<Y.Doc>()
  const [provider, setProvider] = useState<LiveblocksYjsProvider>()

  useEffect(() => {
    const yDoc = new Y.Doc()
    const yProvider = new LiveblocksYjsProvider(room, yDoc)
    setDoc(yDoc)
    setProvider(yProvider)

    return () => {
      yDoc?.destroy()
      yProvider?.destroy()
    }
  }, [room])

  if (!doc || !provider) {
    return <div>Setting up collaboration...</div>
  }

  return <EditorContent doc={doc} provider={provider} />
}

function EditorPage() {
  return (
    <LiveblocksProvider publicApiKey={import.meta.env['VITE_LIVEBLOCKS_PUBLIC_API_KEY']}>
      <RoomProvider id='my-room'>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          <EditorWrapper />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
