import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationToCustomer(order, customerEmail, customerName) {
    try {
        if (!customerEmail) {
            console.warn('No customer email provided for order:', order.id);
            return;
        }

        const orderItemsHTML = order.orderItems
            .map(item => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                        ${item.product?.name || 'Product'}
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                        ${item.quantity}
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                        ${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'AED'} ${item.price.toFixed(2)}
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                        ${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'AED'} ${(item.price * item.quantity).toFixed(2)}
                    </td>
                </tr>
            `)
            .join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
                    .content { padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background-color: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; }
                    .total-row { background-color: #f9fafb; font-weight: bold; }
                    .status { display: inline-block; padding: 8px 12px; border-radius: 4px; background-color: #d1fae5; color: #065f46; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Confirmed! 🎉</h1>
                        <p>Thank you for your purchase</p>
                    </div>

                    <div class="content">
                        <p>Hi ${customerName || 'Valued Customer'},</p>
                        
                        <p>We're thrilled to confirm that your order has been successfully placed!</p>

                        <h3>Order Details</h3>
                        <table>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                            <tr>
                                <td>#${order.orderNumber || order.id}</td>
                                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                                <td><span class="status">Confirmed</span></td>
                            </tr>
                        </table>

                        <h3>Items Ordered</h3>
                        <table>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Subtotal</th>
                            </tr>
                            ${orderItemsHTML}
                            <tr class="total-row">
                                <td colspan="3" style="padding: 12px; text-align: right;">Total:</td>
                                <td style="padding: 12px; text-align: right;">
                                    ${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'AED'} ${order.total.toFixed(2)}
                                </td>
                            </tr>
                        </table>

                        <h3>Payment Method</h3>
                        <p>${order.paymentMethod}</p>

                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

                        <p style="color: #6b7280; font-size: 14px;">
                            We'll send you tracking information once your order ships. 
                            If you have any questions, please don't hesitate to contact our support team.
                        </p>

                        <p style="margin-top: 20px;">
                            Best regards,<br>
                            <strong>The Qui Team</strong>
                        </p>
                    </div>

                    <div class="footer">
                        <p>© 2026 Qui. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply directly.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: customerEmail,
            subject: `Order Confirmed - Order #${order.orderNumber || order.id}`,
            html: html
        });

        console.log('Customer order confirmation email sent:', result);
        return result;
    } catch (error) {
        console.error('Error sending customer confirmation email:', error);
    }
}

/**
 * Send order notification email to admin
 */
export async function sendOrderNotificationToAdmin(order, adminEmails = []) {
    try {
        if (!adminEmails || adminEmails.length === 0) {
            console.warn('No admin emails provided for notification');
            return;
        }

        const adminEmailList = typeof adminEmails === 'string' 
            ? adminEmails.split(',').map(e => e.trim()) 
            : adminEmails;

        const orderItemsHTML = order.orderItems
            .map(item => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.product?.name || 'Product'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                        ${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'AED'} ${(item.price * item.quantity).toFixed(2)}
                    </td>
                </tr>
            `)
            .join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
                    .alert { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background-color: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; }
                    .total-row { background-color: #f9fafb; font-weight: bold; }
                    .info-box { background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🛒 New Order Received</h1>
                        <p>Order #${order.orderNumber || order.id}</p>
                    </div>

                    <div class="alert">
                        <strong>⚠️ Action Required:</strong> Please review and process this order.
                    </div>

                    <div class="info-box">
                        <h3 style="margin-top: 0;">Customer Information</h3>
                        <p><strong>Name:</strong> ${order.isGuest ? order.guestName : order.user?.name || 'Unknown'}</p>
                        <p><strong>Email:</strong> ${order.isGuest ? order.guestEmail : order.user?.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${order.isGuest ? order.guestPhone : 'N/A'}</p>
                    </div>

                    <h3>Order Items</h3>
                    <table>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Subtotal</th>
                        </tr>
                        ${orderItemsHTML}
                        <tr class="total-row">
                            <td colspan="2" style="padding: 12px; text-align: right;">Total Amount:</td>
                            <td style="padding: 12px; text-align: right;">
                                ${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'AED'} ${order.total.toFixed(2)}
                            </td>
                        </tr>
                    </table>

                    <div class="info-box">
                        <h3 style="margin-top: 0;">Order Summary</h3>
                        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                        <p><strong>Status:</strong> Pending</p>
                    </div>

                    <div class="footer">
                        <p>© 2026 Qui Admin. This is an automated notification.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send to all admin emails
        const emailPromises = adminEmailList.map(adminEmail =>
            resend.emails.send({
                from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                to: adminEmail,
                subject: `New Order Alert - Order #${order.orderNumber || order.id}`,
                html: html
            })
        );

        const results = await Promise.all(emailPromises);
        console.log('Admin notification emails sent:', results);
        return results;
    } catch (error) {
        console.error('Error sending admin notification email:', error);
    }
}

/**
 * Send both customer and admin emails for a new order
 */
export async function sendOrderEmails(order, customerEmail, customerName, adminEmails) {
    const results = await Promise.all([
        sendOrderConfirmationToCustomer(order, customerEmail, customerName),
        sendOrderNotificationToAdmin(order, adminEmails)
    ]);
    return results;
}
