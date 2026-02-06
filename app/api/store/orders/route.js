import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Debug log helper
function debugLog(...args) {
    try { console.log('[ORDER API DEBUG]', ...args); } catch {}
}


// Update seller order status
export async function POST(request){
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }

        const {orderId, status } = await request.json()

        if (!orderId || !status) {
            return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 })
        }

        // Verify order exists and belongs to this store
        const existingOrder = await prisma.order.findFirst({
            where: { id: orderId, storeId }
        })

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 })
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: { orderItems: { include: { product: true } } }
        })

        return NextResponse.json({ message: "Order Status updated", order: updatedOrder })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Failed to update order status' }, { status: 400 })
    }
}

// Get all orders for a seller
export async function GET(request){
    console.log('[ORDER API ROUTE] Route hit');
    try {
        const { userId } = getAuth(request)
        debugLog('userId from Clerk:', userId);
        const storeId = await authSeller(userId)
        debugLog('storeId from authSeller:', storeId);

        if(!storeId){
            debugLog('Not authorized: no storeId');
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }

        const orders = await prisma.order.findMany({
            where: {storeId},
            include: {user: true, address: true, orderItems: {include: {product: true}}},
            orderBy: {createdAt: 'desc' }
        })
        debugLog('orders found:', orders.length);

        return NextResponse.json({orders})
    } catch (error) {
        console.error('[ORDER API ERROR]', error);
        debugLog('API error:', error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}