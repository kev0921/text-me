import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function toPusherKey(key: string) {  //
    return key.replace(/:/g, '__')
}

export function chatHrefConstructor (id1:string, id2:string) {
    const sortedIds = [id1, id2].sort()  // sort the ids
    return `${sortedIds[0]}--${sortedIds[1]}`  // put the two ids in the url for later
}

// everytime we create conditional classes throughout our application this is the function we are going to use