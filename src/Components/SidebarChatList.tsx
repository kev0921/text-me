'use client'

import { chatHrefConstructor } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

interface SidebarChatListProps {
    friends: User[]
    sessionId: string
}

const SidebarChatList: FC<SidebarChatListProps> = ({friends, sessionId}) => {
    const router = useRouter() 
    const pathname = usePathname()  // get the relative path
    const [unseenMessages, setUnseenMessages] = useState<Message[]>([])

    useEffect(() => { // determine if a path(/chat) has been checked by a user
        if(pathname?.includes('chat')) {
            setUnseenMessages((prev) => { // check if a user has seen the mesages or not
                return prev.filter((msg) => !pathname.includes(msg.senderId)) // for each message that the user checks it will take those messages out of state (those messages taken out are "seen").
            })
        }
    }, [pathname]) // this useEffect() hook is run everytime the pathname changes

  return <ul role='list' className='max-h=[25rem] overflow-y-auto -mx-2 space-y-1'>
    {friends.sort().map((friend) => { // determine number of unseen messages for each friend
        const unseenMessagesCount = unseenMessages.filter((unseenMessage) => {  // determine the number of unseen messages for one particular friend.
            return unseenMessage.senderId === friend.id
        }).length

        // for each friend, we want to return a list element
        return <li key={friend.id}>
            <a href={`/dashboard/chat/${chatHrefConstructor( // this url will be the link to the chat id we want to navigate the user to
                sessionId,
                friend.id
            )}`}
            className='text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'>
                {friend.name}
                {unseenMessagesCount > 0 ? (
                    <div className='bg-indigo-600 font-medium text-xs text-white w-4 h-4 rounded-full flex justify-center items-center'>
                        {unseenMessagesCount}
                    </div>
                ) : null}
            </a>
        </li>
    })}
  </ul>
}

export default SidebarChatList