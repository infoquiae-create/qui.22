import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncClerkUserWithPrisma } from "@/lib/syncUserWithClerk";


// Add new rating
export async function POST(request){
    try {
        const { userId } = getAuth(request)
        const {orderId, productId, rating, review} = await request.json()

        // Sync user data from Clerk
        await syncClerkUserWithPrisma(userId);

        const order = await prisma.order.findUnique({where: {id: orderId, userId}})

        if(!order){
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

         const isAlreadyRated = await prisma.rating.findFirst({where: {productId, orderId}})

         if(isAlreadyRated){
            return NextResponse.json({ error: "Product already rated" }, { status: 400 })
         }

         const response = await prisma.rating.create({
            data: {userId, productId, rating, review, orderId}
         })

         return NextResponse.json({message: "Rating added successfully", rating: response})

      
    } catch (error) {
        console.error(error);
        
        let errorMessage = error.message;
        if (error.code === 'P2022') {
            errorMessage = 'Invalid field value. Check if product and order exist';
        } else if (error.code === 'P2025') {
            errorMessage = 'Product or order not found';
        }
        
        return NextResponse.json({error: errorMessage}, { status: 400 })
    }
}

// Get all ratings for a user
export async function GET(request){
    try {
        const {userId} = getAuth(request)
        if(!userId){
            return NextResponse.json({error: "Unauthorized"}, { status: 401 })
        }

        // Sync user data from Clerk
        await syncClerkUserWithPrisma(userId);

        const ratings = await prisma.rating.findMany({
            where: {userId}
        })

        return NextResponse.json({ratings})
    } catch (error) {
        console.error(error);
        
        let errorMessage = error.message;
        if (error.code === 'P2022') {
            errorMessage = 'Invalid query parameters';
        }
        
        return NextResponse.json({error: errorMessage}, { status: 400 })
    }
}