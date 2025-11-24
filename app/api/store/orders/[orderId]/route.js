import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Update order status and tracking details
export async function PUT(request, { params }) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);
        const orderId = params.orderId;

        const { status, trackingId, trackingUrl, courier } = await request.json();

        // Verify the order belongs to this store
        const existingOrder = await prisma.order.findFirst({
            where: {
                id: orderId,
                storeId: storeId
            },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                },
                orderItems: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
        }

        // Prepare update data
        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (trackingId !== undefined) updateData.trackingId = trackingId;
        if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl;
        if (courier !== undefined) updateData.courier = courier;

        // Update the order
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData
        });

        // Send email notification if status changed or tracking added
        if (status || trackingId) {
            try {
                // Call email notification API
                await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/order-status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        orderId: updatedOrder.id,
                        email: existingOrder.user.email,
                        customerName: existingOrder.user.name,
                        status: updatedOrder.status,
                        trackingId: updatedOrder.trackingId,
                        trackingUrl: updatedOrder.trackingUrl,
                        courier: updatedOrder.courier,
                        orderItems: existingOrder.orderItems
                    })
                });
            } catch (emailError) {
                console.error('Email notification failed:', emailError);
                // Continue even if email fails
            }
        }

        return NextResponse.json({ 
            success: true, 
            order: updatedOrder,
            message: 'Order updated successfully'
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 400 });
    }
}

// Delete order
export async function DELETE(request, { params }) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);
        const orderId = params.orderId;

        // Verify the order belongs to this store
        const existingOrder = await prisma.order.findFirst({
            where: {
                id: orderId,
                storeId: storeId
            }
        });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
        }

        // Delete the order
        await prisma.order.delete({
            where: { id: orderId }
        });

        return NextResponse.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Failed to delete order' }, { status: 400 });
    }
}
