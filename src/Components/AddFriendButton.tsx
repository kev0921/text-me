"use client"

import { FC, useState } from 'react'
import Button from './ui/Button'
import { addFriendValidator } from '@/lib/validations/add-friend'
import axios, { AxiosError } from 'axios'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

interface AddFriendButtonProps {
  
}

type FormData = z.infer<typeof addFriendValidator>   // make addFriendValidator a Typescript type

const AddFriendButton: FC<AddFriendButtonProps> = ({}) => {
    const [showSuccessState, setShowSuccessState] = useState<boolean>(false) // updates to show whether or not friend request was successful or not

    const { register, handleSubmit, setError, formState: {errors} } = useForm<FormData>({
        resolver: zodResolver(addFriendValidator),   // handles error states for non legit inputs
    })
    
    const addFriend = async (email: string) => {
        try {
            const validatedEmail = addFriendValidator.parse({ email })   // addFriendValidator will ensure email is valid (string and email style)

                await axios.post('/api/friends/add', {  // post request to friends/add endpoint to make friend request
                    email: validatedEmail,
                })

                setShowSuccessState(true)
        } catch (error) {
            if(error instanceof z.ZodError){
                setError('email', { message: error.message })
                return
            }

            if(error instanceof AxiosError) {
                setError('email', { message: error.response?.data })
                return
            }

            setError('email', { message: 'Something went wrong.' })
        }
    }

    const onSubmit = (data: FormData) => {
        addFriend(data.email)
    }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='max-w-sm'>
        <label 
        htmlFor='email' 
        className='block text-sm font-medium leading-6 text-gray-900'>
            Add friend by Email
        </label>

        <div className='mt-2 flex gap-4'>
            <input
            {...register('email')} 
            type='text' 
            className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
            placeholder='you@example.com'/>
            <Button>Add</Button>
        </div>
        <p className='mt-1 text-sm text-red-600'>{errors.email?.message}</p>
        {showSuccessState ? (
            <p className='mt-1 text-sm text-green-600'>Friend request sent</p>
        ) : null}
    </form>
  )
}

export default AddFriendButton