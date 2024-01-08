import { fetchRedis } from "./redis"

export const getFriendsByUserId = async (userId: string) => {
    // retrieve friends for the current user
    const friendIds = await fetchRedis('smembers', `user:${userId}:friends`) as string[]     // we want to get the members of the "user:${userId}:friends" set

    // get the user data for each friend
    const friends = await Promise.all( // pass an array of promises and call them all at the same time, since no promise depend on the other (just to speed things up)
        friendIds.map(async (friendId) => {
            const friend = await fetchRedis('get', `user:${friendId}`) as string // fetch all the information that is linked to this certain friend
            const parsedFriend = JSON.parse(friend) as User
            return parsedFriend
        })
    )

    return friends
}