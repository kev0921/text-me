import {z} from "zod"

export const messageValidator = z.object({
    id: z.string(),
    senderId: z.string(),
    text: z.string(),
    timestamp: z.number(),
})

export const messageArrayValidator = z.array(messageValidator)  // want to validate an array of messages rather than just one message.

export type Message = z.infer<typeof messageValidator> // utility function from zod that infers the type of the Message.