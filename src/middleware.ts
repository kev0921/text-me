// intercepts the login request by redirecting a logged in user to the dashboard instead of directing it to the log in page
import { LucideLockKeyhole } from 'lucide-react'
import { getToken } from 'next-auth/jwt'
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    async function middleware(req) {
        const pathname = req.nextUrl.pathname   // determine the current path the user is on

        // Manage route protection
        const isAuth = await getToken({ req })  // determine if user is already authenticated. Decrypts the json web token.
        const isLoginPage = pathname.startsWith('/login') // determine if the user is trying to navigate to the login page.

        const sensitiveRoutes = ['/dashboard']  // determine the sensitive routes. No body should be able to access the dashboard if they are not logged in. Add to list to add more sensitive routes.
        const isAccessingSensitiveRoute = sensitiveRoutes.some((route) => pathname.startsWith(route))   // determine if user is accessing a sensitive route. For example, if the path name included dashboard, then this value would be TRUE. 

        if (isLoginPage) {  // determine if user is navigating to the login page
            if(isAuth) {   // determine if user is authenticated
                return NextResponse.redirect(new URL('/dashboard', req.url))  // redirect the user to the dashboard page.
            }

            return NextResponse.next()  // if not authenticated, then middleware would just pass along the request and let the user access the login page.
        }

        if(!isAuth && isAccessingSensitiveRoute) {
            return NextResponse.redirect(new URL('/login', req.url))  // redirect user to login page if user is not authenticated and wants to access a sensitive route
        }

        if(pathname === '/') {
            return NextResponse.redirect(new URL('/dashboard', req.url))  // redirect user to the dashboard if path is equal to the home page.
        }
    }, {
        callbacks: { // this is a work around for handling redirects on auth pages
            async authorized() {
                return true   // we return true so the middleware function above is always called. Otherwise, we would get an infinite redirect and an error in the browser telling us that this page is redirecting us too often.
            }
        }
    }
)

// this config will determine which routes the middleware would be run on.
export const config = {
    matcher: ['/', '/login', '/dashboard/:path*']  // :path* means any path
}