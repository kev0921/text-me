import ChatInput from '@/Components/ChatInput'
import Messages from '@/Components/Messages'
import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { messageArrayValidator } from '@/lib/validations/message'
import { getServerSession } from 'next-auth'
import Image from 'next/image'
import { notFound } from 'next/navigation'

// The following generateMetadata functiion was written after the video and is purely optional
export async function generateMetadata({
  params,
}: {
  params: { chatId: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) notFound()
  const [userId1, userId2] = params.chatId.split('--')
  const { user } = session

  const chatPartnerId = user.id === userId1 ? userId2 : userId1
  const chatPartnerRaw = (await fetchRedis(
    'get',
    `user:${chatPartnerId}`
  )) as string
  const chatPartner = JSON.parse(chatPartnerRaw) as User

  return { title: `FriendZone | ${chatPartner.name} chat` }
}

interface PageProps {
  params: {
    chatId: string
  }
}

async function getChatMessages(chatId: string) { // fetches all messages using zrange (gets all messages in a certain chat room)
  try {
    const results: string[] = await fetchRedis( // get a json string of the messages
      'zrange',
      `chat:${chatId}:messages`,  // fetch the messages from that chat id
      0,   // fetch from start index of 0 to the end index of -1
      -1
    )

    const dbMessages = results.map((message) => JSON.parse(message) as Message) // get messages ordered in terms of when it was sent (most recent message at the top)

    const reversedDbMessages = dbMessages.reverse() // display the messages in reverse order since we want the most recent messages to be shown on the bottom of the chat (reverse() is an array method)

    const messages = messageArrayValidator.parse(reversedDbMessages)  // validate these messages to ensure that they are in the format we expect.

    return messages
  } catch (error) {
    notFound()
  }
}

const page = async ({ params }: PageProps) => {
  const { chatId } = params     // destructure the chatId
  const session = await getServerSession(authOptions)  // get the session
  if (!session) notFound()           

  const { user } = session     // destructure the user

  const [userId1, userId2] = chatId.split('--')   // get the userId1 and userId2 from the chatId in the url

  if (user.id !== userId1 && user.id !== userId2) {
    notFound()           // your id has to be one of the user ids
  }

  const chatPartnerId = user.id === userId1 ? userId2 : userId1  // determine the id of the person you are chatting to
  
  const chatPartnerRaw = (await fetchRedis(
    'get',
    `user:${chatPartnerId}`
  )) as string
  const chatPartner = JSON.parse(chatPartnerRaw) as User  // get the chatPartner (User object)
  const initialMessages = await getChatMessages(chatId)   // makes a call to the database for just the chat messages

  return (
    <div className='flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)]'>
      <div className='flex sm:items-center justify-between py-3 border-b-2 border-gray-200'>
        <div className='relative flex items-center space-x-4'>
          <div className='relative'>
            <div className='relative w-8 sm:w-12 h-8 sm:h-12'>
              <Image
                fill
                referrerPolicy='no-referrer'
                src={chatPartner.image}
                alt={`${chatPartner.name} profile picture`}
                className='rounded-full'
              />
            </div>
          </div>

          <div className='flex flex-col leading-tight'>
            <div className='text-xl flex items-center'>
              <span className='text-gray-700 mr-3 font-semibold'>
                {chatPartner.name}
              </span>
            </div>

            <span className='text-sm text-gray-600'>{chatPartner.email}</span>
          </div>
        </div>
      </div>

      <Messages chatPartner={chatPartner} sessionImg={session.user.image} sessionId={session.user.id} initialMessages={initialMessages}/>
      <ChatInput chatId={chatId} chatPartner={chatPartner} />
    </div>
  )
}

export default page