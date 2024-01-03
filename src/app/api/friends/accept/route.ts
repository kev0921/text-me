import { fetchRedis } from "@/helpers/redis"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import {z} from "zod" 

export async function POST(req: Request) {  // handles a post request
    try {
        const body = await req.json()   // access the body content of the request

        const { id: idToAdd } = z.object({ id: z.string() }).parse(body)   // get the id of the user we want to accept or deny

        const session = await getServerSession(authOptions)   // get the server session

        // series of checks to see if the requests are valid
        if(!session) {
            return new Response('Unauthorized', { status: 401 })  // if user is not logged in, then response is unauthorized
        }

        // verify that both users are not already friends
        const isAlreadyFriends = await fetchRedis(
            'sismember',  // is this person a member of this set? (friend set)
            `user:${session.user.id}:friends`,  // for the current user that is logged in, we are looking into the friends document and verifying that the id of the person that they want to add is not already in there.
            idToAdd
        )
        
        // verify that both users are not already friends
        if(isAlreadyFriends) {
            return new Response('Already friends', { status: 400 }) 
        }
        
        // in order to add another user, they must send a friend request
        const hasFriendRequest = await fetchRedis(
            'sismember', 
            `user:${session.user.id}:incoming_friend_requests`, // were going to find out if the id that were trying to add is already in the incomming friend request list
            idToAdd
        )
        
        // in order to add another user, they must send a friend request
        if(!hasFriendRequest) {
            return new Response('No friend request', { status: 400 })
        }

        await db.sadd(`user:${session.user.id}:friends`, idToAdd)  // sadd will add someone to a set. Here, we're inserting the person that we want to add to our friends list.
        
        await db.sadd(`user:${idToAdd}:friend`, session.user.id)  // Inserting the person that accepted the friend request to the requester's friends list.

        await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAdd) // srem will remove someone from a set. After accepting a friend request, we should remove the friend request from the incoming friend requests. 

        return new Response('OK')
    } catch (error) {
        
        if(error instanceof z.ZodError) {
            return new Response('Invalid request payload', { status: 422 })
        }

        return new Response('Invalid request', { status: 400 })
    }
}