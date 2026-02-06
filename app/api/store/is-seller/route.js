import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// Auth Seller
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const isSeller = await authSeller(userId)

        if(!isSeller){
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        const storeInfo = await prisma.store.findUnique({where: {userId}})

        return NextResponse.json({isSeller, storeInfo})
    } catch (error) {
        console.error('Is-seller check error:', error);
        
        let errorMessage = error.message;
        if (error.code === 'P2022') {
            errorMessage = 'Invalid user data';\n        }
        
        return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
}