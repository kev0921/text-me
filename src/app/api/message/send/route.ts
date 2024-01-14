import { fetchRedis } from "@/helpers/redis"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Message, messageValidator } from "@/lib/validations/message"
import { getServerSession } from "next-auth"
import { nanoid } from 'nanoid'

export async function POST(req: Request) {  // sending messages will be handled as a POST request
    try {
        const {text, chatId}: {text: string, chatId: string} = await req.json()  // access the body content of the request (text user wants to send and the chatId the text is being sent into)
        const session = await getServerSession(authOptions)  // get the session

        if(!session) return new Response('Unauthorized', { status: 401 })  // if no session, return error

        const [userId1, userId2] = chatId.split('--')   // get the id of the user and the chat partner (the person the user is chatting to)

        if(session.user.id != userId1 && session.user.id !== userId2) {  // check if the user is one of the user ids
            return new Response('Unauthorized', { status: 401 })
        }

        const friendId = session.user.id === userId1 ? userId2 : userId1   // get the id of the friend you are chatting to. It is either userId1 or userId2
        
        const friendList = await fetchRedis('smembers', `user:${session.user.id}:friends`) as string[]   // get the user's friends list
        const isFriend = friendList.includes(friendId)  // check if the friendId (id of other user they are talking to) is inside the user's friends list

        if(!isFriend) return new Response('Unauthorized', { status: 401 }) // should not be able to communicate with this person if you are not friends with them

        const rawSender = await fetchRedis('get', `user:${session.user.id}`) as string   // get the sender information as a string (needed for notification when a user is receiving a message from a sender)
        const sender = JSON.parse(rawSender) as User   // get the sender information

        const timestamp = Date.now()

        const messageData: Message = {  // object that stores the message we are sending along with other pieces of information
            id: nanoid(),  // nanoid() handles unique id generation
            senderId: session.user.id,  // id of the message sender (current logged in user)
            text,
            timestamp,
        }

        const message = messageValidator.parse(messageData)  // parse the message data

        // everything is valid now, so we can send the message to the other user now
        await db.zadd(`chat:${chatId}:messages`, {  // add the message to a sorted list in the data base (some data persistence)
            score: timestamp,
            member: JSON.stringify(message)  // the message we want to send and store in the data base
        })

        return new Response('OK')
    } catch (error) {
        if(error instanceof Error) {
            return new Response(error.message, { status: 500 })
        }

        return new Response('Internal Server Error', { status: 500 })
    }
}