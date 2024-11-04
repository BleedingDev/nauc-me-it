'use dom'

import { Button } from '@nmit-coursition/ui/design-system'
import { X as DeleteIcon } from 'lucide-react'
import { type DropzoneOptions, useDropzone } from 'react-dropzone'

interface Props extends DropzoneOptions {
  idleMessage?: string
  dropZoneMessage?: string
  className?: string

  // todo: improve composability with mixins
  inputName: string
}

export const FileDropper = ({ dropZoneMessage, idleMessage, inputName, ...forwardedProps }: Props) => {
  const { acceptedFiles, getRootProps, getInputProps, isDragActive } = useDropzone({ ...forwardedProps })

  return (
    <div {...getRootProps()} className='bg-blue-50 rounded-md py-4 px-12'>
      <input name={inputName} {...getInputProps()} />

      <ul className='grid grid-cols-1 gap-2'>
        {acceptedFiles.map((file) => (
          <li key={file.name} className='h-8 w-full relative bg-blue-300 flex items-center justify-center'>
            {file.name}

            <Button
              variant='outline'
              size='lg'
              className='absolute p-0 top-0 -right-1 h-max rounded-full'
              onClick={(e) => {
                /** prevents the button from triggering the input */
                e.stopPropagation()
              }}
            >
              <DeleteIcon size={18} />
            </Button>
          </li>
        ))}
      </ul>

      {isDragActive ? <p>{dropZoneMessage}</p> : <p>{idleMessage}</p>}
    </div>
  )
}
