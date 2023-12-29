const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL
const authtoken = process.env.UPSTASH_REDIS_REST_TOKEN

type Command = 'zraange' | 'sismember' | 'get' | 'smembers'

export async function fetchRedis(   // this function helps us interact with the database for weird cacheing behaviour (same functionality as db.ts file)
    command: Command,
    ...args: (string | number)[]  // args is a string or number array
) {
    const commandUrl = `${upstashRedisRestUrl}/${command}/${args.join('/')}` // constructs url we are going to make a fetch request to (this is the format in which we can make requests via the REST api endpoint)

    const response = await fetch(commandUrl, {              // make a request to get the email of the user wants to add
            headers: {
                Authorization: `Bearer ${authtoken}`,  // need to tell upstash we are authorized to make this querry to the database
            },
            cache: 'no-store',   // tell Next.js to never store the result and always delivering fresh data
        })
        
    if(!response.ok) {
        throw new Error(`Error executing Redis command: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result     // return data to the client
}