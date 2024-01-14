'use client'  // whenever using a react hook, we should make this component a client component

import { FC, useRef, useState } from 'react'
import TextAreaAutosize from 'react-textarea-autosize'
import Button from './ui/Button'
import axios from 'axios'
import toast from 'react-hot-toast'

interface ChatInputProps {
  chatPartner: User
  chatId: string
}

const ChatInput: FC<ChatInputProps> = ({chatPartner, chatId}) => {

    const textareaRef = useRef<HTMLTextAreaElement | null>(null) // store a reference of the text area so we can focus on the text area after sending a message.
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [input, setInput] = useState<string>('')  // keep the text area input in state

    const sendMessage = async () => {
        if(!input) return  // if no text input, then we cannot send a message
        setIsLoading(true)

        try {
            await axios.post('/api/message/send', {text: input, chatId }) // make a post request to the endpoint that handles the message sending. First arguement is the api endpoint and second argument is the data we are sending to that endpoint
            setInput('')  // clear the text input
                textareaRef.current?.focus() // after sending the message, it will focus right back to the input text area
        } catch {
            toast.error('Something went wrong. Please try again later')
        } finally {
            setIsLoading(false)
        }
    }

  return <div className='border-t border-gray-200 px-4 pt-4 mb-2 sm:mb-0'>
    <div className='relative flex-1 overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600'>
    <TextAreaAutosize ref={textareaRef} onKeyDown={(e) => {
        if(e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()  // send message after pressing 'Enter'
        }
    }}
    rows={1}
    value={input}
    onChange={(e) => setInput(e.target.value)} // e.target.value contains the text the user typed into the text area.
    placeholder={`Message ${chatPartner.name}`}
    className='block w-full resize-none border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:py-1.5 sm:text-sm sm:leading-6'
    />

        <div onClick={() => textareaRef.current?.focus()} 
        className='py-2' 
        aria-hidden='true'>
            <div className='py-px'>
                <div className='h-9'/>
            </div>
        </div>

        <div className='absolute right-0 bottom-0 flex justify-between py-2 pl-3 pr-2'>
            <div className='flex-shrink-0'>
                <Button isLoading={isLoading} onClick={sendMessage} type='submit'>Send</Button>
            </div>
        </div>
    </div>
  </div>
}

export default ChatInput