'use client'

import { cn, toPusherKey } from '@/lib/utils'
import { Message } from '@/lib/validations/message'
import { FC, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import Image from 'next/image'
import { pusherClient } from '@/lib/pusher'

interface messagesProps {
  initialMessages: Message[]
  sessionId: string
  sessionImg: string | null | undefined
  chatPartner: User
  chatId: string
}

const messages: FC<messagesProps> = ({initialMessages, sessionId, chatPartner, sessionImg, chatId }) => {

    useEffect(() => {  ////////////////////////////////////////////////
        pusherClient.subscribe(
            toPusherKey(`chat:${chatId}`)
          )
          const messageHandler = (message: Message) => {
            setMessages((prev) => [message, ...prev])
          }
      
          pusherClient.bind('incoming-message', messageHandler)
      
          return () => {
            pusherClient.unsubscribe(
                toPusherKey(`chat:${chatId}`)
            )
            pusherClient.unbind('incoming-message', messageHandler)
          }
    }, [])

    const [messages, setMessages] = useState<Message[]>(initialMessages) // put the messages in state, so that when user sends a message we can put it in state instead of having to refresh the page or something.

    const scrollDownRef = useRef<HTMLDivElement | null>(null)   // when we send a message we want to automatically scroll to that message so we need to store a reference to that place. 

    const formatTimestamp = (timestamp: number) => {  // format the message time stamp (hour:minute)
        return format(timestamp, 'HH:mm')  // format function is from 'date-fns' package
    }

  return (
    <div 
    id='messages' 
    className='flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch'>
        <div ref={scrollDownRef} />

        {messages.map((message, index) => { 
            const isCurrentUser = message.senderId === sessionId  // determine if the message we are displaying is being sent either by us or the chat partner (important for choosing which side to display the messages or in what colour to display the message)

            const hasNextMessageFromSameUser = messages[index - 1]?.senderId == messages[index].senderId // if there are multiple concurrent messages from the same user, we want the image that is shown is only for the last message, so we want to know if there is a next message from the same user.

            return <div className='chat-message' key={`${message.id}-${message.timestamp}`}>
                <div className={cn('flex items-end', { // conditional rendering depending on who sent the message (the styles in this line are the default styles)
                    'justify-end': isCurrentUser, // so only if isCurrentUser is true then justify-end style will also be applied (if it is current user then the message will be diplayed on right side)
                })}>
                    <div className={cn('flex flex-col space-y-2 text-base max-w-xs mx-2', {
                        'order-1 items-end': isCurrentUser,
                        'order-2 items-start': !isCurrentUser,
                    })}>
                        <span className={cn('px-4 py-2 rounded-lg inline-block', {  // contains the actual message text that we want to show
                            'bg-indigo-600 text-white': isCurrentUser,
                            'bg-gray-200 text-gray-900': !isCurrentUser,
                            'roundeed-br-none': !hasNextMessageFromSameUser && isCurrentUser,  // only the last message has this style
                            'rounded-bl-none': !hasNextMessageFromSameUser && !isCurrentUser,
                        })}>
                            {message.text}{' '} 
                            <span className='ml-2 text-xs text-gray-400'> 
                                {formatTimestamp(message.timestamp)}
                            </span>
                        </span>
                    </div>

                    <div className={cn('relative w-6 h-6', {   // gives an image to each message sender in the chat
                        'order-2': isCurrentUser,    // conditional styles: style only applies if true
                        'order-1': !isCurrentUser, 
                        'invisible': hasNextMessageFromSameUser,
                        })}>
                        <Image 
                            fill
                            src={isCurrentUser ? (sessionImg as string) : chatPartner.image} 
                            alt='Profile picture'
                            referrerPolicy='no-referrer'
                            className='rounded-full'
                        />
                    </div>
                </div>
            </div>
        })}
    </div>
  )
}

export default messages