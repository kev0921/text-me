import { fetchRedis } from "@/helpers/redis"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { toPusherKey } from "@/lib/utils"
import { addFriendValidator } from "@/lib/validations/add-friend"
import { getServerSession } from "next-auth"
import { z } from 'zod'

export async function POST(req: Request) {
    try {
        const body = await req.json() // access the body content of the post request

        const { email: emailToAdd } = addFriendValidator.parse(body.email)  // get the email from the body of the post request and validate the input again

        const idToAdd = (await fetchRedis('get', `user:email:${emailToAdd}`)) as string   // the id to add for the user making the request

        if (!idToAdd) {
            return new Response('This person does not exist.', { status: 400 })   // if the person the user wants to add doesn't exist then request is invalid
        }

        const session = await getServerSession(authOptions)

        if (!session) {
            return new Response('Unauthorized', { status: 401 })  // if there is no session then request is invalid
        }

        if (idToAdd === session.user.id) {
            return new Response('You cannot add yourself as a friend', { status: 400 })   // if you're adding yourself then request is invalid
        }

        const isAlreadyAdded = (await fetchRedis('sismember', `user:${idToAdd}:incoming_friend_requests`, session.user.id)) as 0 | 1  // check if the user(session.user.id) is already a member of the incoming friend request list of the person we are trying to add (user:${idToAdd}:incoming_friend_requests).

        if (isAlreadyAdded) {
            return new Response('This user is already added', { status: 400 })
        }

        const isAlreadyFriends = (await fetchRedis('sismember', `user:${session.user.id}:friends`, idToAdd)) as 0 | 1  // check the friends list of the current logged in user (user:${session.user.id}:friends) to see if the user is already friends with the person they are sending a friend request to (idToAdd).

        if (isAlreadyFriends) {
            return new Response('This user is already your friend', { status: 400 })
        }

        // if all those checks pass, we have a valid request

        await pusherServer.trigger( //
            toPusherKey(`user:${idToAdd}:incoming_friend_requests`),
            'incoming_friend_requests',
            {
              senderId: session.user.id,
              senderEmail: session.user.email,
            }
          )

        await db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id)   // the user that is logged in is going to be put into the incomming friend request list of the user they are trying to add (PUT request)

        return new Response('OK')
    } catch (error) {
        if (error instanceof z.ZodError)  {
            return new Response('Invalid request payload', { status: 422 })
        }
        return new Response('Invalid request', { status: 400 })
    }
}