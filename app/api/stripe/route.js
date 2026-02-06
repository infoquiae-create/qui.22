import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request){
    try {
        const secret = process.env.STRIPE_SECRET_KEY
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
        if (!secret || !webhookSecret) {
            return NextResponse.json({ error: 'Stripe is disabled (missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET)' }, { status: 503 })
        }

        // Initialize Stripe lazily only when configured
        const stripe = new Stripe(secret)
        const body = await request.text()
        const sig = request.headers.get('stripe-signature')

        const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)

        const handlePaymentIntent = async (paymentIntentId, isPaid) => {
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId
            })

            if (!session.data || !session.data[0]) {
                console.error('No session found for payment intent:', paymentIntentId)
                return
            }

            const {orderIds, userId, appId} = session.data[0].metadata
            
            if(appId !== 'Qui'){
                console.log('Invalid app id:', appId)
                return
            }

            if (!orderIds || !userId) {
                console.error('Missing orderIds or userId in metadata')
                return
            }

            const orderIdsArray = orderIds.split(',')

            if(isPaid){
                // Verify orders exist before updating
                const existingOrders = await prisma.order.findMany({
                    where: { id: { in: orderIdsArray } }
                })

                if (existingOrders.length !== orderIdsArray.length) {
                    console.error('Some orders not found:', { requested: orderIdsArray, found: existingOrders.map(o => o.id) })
                }

                // mark order as paid
                await Promise.all(orderIdsArray.map(async (orderId) => {
                    try {
                        await prisma.order.update({
                            where: { id: orderId },
                            data: { isPaid: true }
                        })
                    } catch (error) {
                        console.error('Error updating order:', orderId, error.message)
                    }
                }))
                
                // delete cart from user
                try {
                    await prisma.user.update({
                        where: { id: userId },
                        data: { cart: {} }
                    })
                } catch (error) {
                    console.error('Error clearing user cart:', userId, error.message)
                }
            }else{
                // Verify orders exist before deleting
                const existingOrders = await prisma.order.findMany({
                    where: { id: { in: orderIdsArray } }
                })

                if (existingOrders.length === 0) {
                    console.log('No orders to delete')
                    return
                }

                // delete order from db
                await Promise.all(orderIdsArray.map(async (orderId) => {
                    try {
                        await prisma.order.delete({
                            where: { id: orderId }
                        })
                    } catch (error) {
                        console.error('Error deleting order:', orderId, error.message)
                    }
                }))
            }
        }

    
        switch (event.type) {
            case 'payment_intent.succeeded': {
                await handlePaymentIntent(event.data.object.id, true)
                break;
            }

            case 'payment_intent.canceled': {
                await handlePaymentIntent(event.data.object.id, false)
                break;
            }
        
            default:
                console.log('Unhandled event type:', event.type)
                break;
        }

        return NextResponse.json({received: true})
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

export const config = {
    api: { bodyparser: false }
}