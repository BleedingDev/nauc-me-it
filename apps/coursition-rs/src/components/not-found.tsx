import { Button } from '@douyinfe/semi-ui'
import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className='space-y-2 p-2'>
      <p>The page you are looking for does not exist.</p>
      <p className='flex flex-wrap items-center gap-2'>
        <Button htmlType='button' onClick={() => window.history.back()}>
          Go back
        </Button>
        <Button asChild variant='secondary'>
          <Link to='/'>Home</Link>
        </Button>
      </p>
    </div>
  )
}
