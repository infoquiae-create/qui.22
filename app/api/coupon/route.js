import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// Verify coupon
export async function POST(request){
    try {
        const {userId, has} = getAuth(request)
        const { code, cartTotal, productIds, storeId } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const coupon = await prisma.coupon.findUnique({
            where: {
                code: code.toUpperCase(),
                expiresAt: {gt: new Date()},
                isActive: true
            }
        })

        if (!coupon){
            return NextResponse.json({ error: "Coupon not found or expired" }, { status: 404 })
        }

        // Check if coupon belongs to the store (if store-specific)
        if (coupon.storeId && storeId && coupon.storeId !== storeId) {
            return NextResponse.json({ error: "This coupon is not valid for this store" }, { status: 400 })
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 })
        }

        // Check if for new users only
        if(coupon.forNewUser){
            const userOrders = await prisma.order.findMany({where: {userId}})
            if(userOrders.length > 0){
                return NextResponse.json({ error: "Coupon valid for new users only" }, { status: 400 })
            }
        }

        // Check if for first order only
        if(coupon.firstOrderOnly){
            const storeOrders = coupon.storeId 
                ? await prisma.order.findMany({where: {userId, storeId: coupon.storeId}})
                : await prisma.order.findMany({where: {userId}})
            
            if(storeOrders.length > 0){
                return NextResponse.json({ error: "Coupon valid for first order only" }, { status: 400 })
            }
        }

        // Check if one time per user
        if(coupon.oneTimePerUser){
            const usedOrders = await prisma.order.findMany({
                where: {
                    userId,
                    isCouponUsed: true,
                    coupon: {
                        path: ['code'],
                        equals: coupon.code
                    }
                }
            })
            
            if(usedOrders.length > 0){
                return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 })
            }
        }

        // Check for member-only coupon
        if (coupon.forMember){
            const hasPlusPlan = has({plan: 'plus'})
            if(!hasPlusPlan){
                return NextResponse.json({ error: "Coupon valid for members only" }, { status: 400 })
            }
        }

        // Check minimum price
        if (cartTotal && coupon.minPrice > 0 && cartTotal < coupon.minPrice) {
            return NextResponse.json({ 
                error: `Minimum cart value of AED${coupon.minPrice} required` 
            }, { status: 400 })
        }

        // Check minimum product count
        if (productIds && coupon.minProductCount && productIds.length < coupon.minProductCount) {
            return NextResponse.json({ 
                error: `Minimum ${coupon.minProductCount} products required` 
            }, { status: 400 })
        }

        // Check specific products
        if (coupon.specificProducts && coupon.specificProducts.length > 0 && productIds) {
            const hasValidProduct = productIds.some(id => coupon.specificProducts.includes(id))
            if (!hasValidProduct) {
                return NextResponse.json({ 
                    error: "This coupon is not valid for the products in your cart" 
                }, { status: 400 })
            }
        }

        return NextResponse.json({coupon})
    } catch (error) {
        console.error('Coupon error:', error);
        
        let errorMessage = error.message;
        if (error.code === 'P2022') {
            errorMessage = 'Invalid coupon data';
        } else if (error.code === 'P2002') {
            errorMessage = 'Coupon code already exists';
        }
        
        return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
}