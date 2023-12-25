import AddFriendButton from '@/Components/AddFriendButton'
import { FC } from 'react'

const page: FC = ({}) => {
  return <main className='pt-8'>
    <h1 className='font-bold text05xl mb-8'>Add friends</h1>
    <AddFriendButton />
  </main>
}

export default page