import FriendRequests from '@/Components/FriendRequests'
import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { FC } from 'react'


const page = async () => {
    
    const session = await getServerSession(authOptions)
    if(!session) notFound()

    const incomingSenderIds = (await fetchRedis('smembers',       // find ids of people who sent friend requests to the current logged in user
    `user:${session.user.id}:incoming_friend_requests`            
    )) as string[]      // we're getting back a list of ids which are strings

    const incomingFriendRequests = await Promise.all(     // Promise.all lets us await an array of promises simultaneously so each friend request will be fetched at the same time, not one after another, for better performance
        incomingSenderIds.map(async (senderId) => {
        const sender = await fetchRedis('get', `user:${senderId}`) as string // find string objects of people who sent friend requests to the current logged in user
        const senderParsed = JSON.parse(sender) as User // find User objects of people who sent friend requests to the current logged in user
        return {
            senderId,
            senderEmail: senderParsed.email,
        }
        })
    )

    return (
        <main className='pt-8'>
          <h1 className='font-bold text-5xl mb-8'>Add a friend</h1>
          <div className='flex flex-col gap-4'>  
            <FriendRequests incomingFriendRequests={incomingFriendRequests} sessionId={session.user.id} />  {/* we are going to be using real time features in these friend requests components so we have to make these client side components */}
          </div>
        </main>
      )
}

export default page