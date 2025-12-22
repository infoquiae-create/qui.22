import html2pdf from 'html2pdf.js';

const COMPANY_NAME = process.env.NEXT_PUBLIC_INVOICE_COMPANY_NAME || "Qui";
const COMPANY_ADDRESS_LINE1 = process.env.NEXT_PUBLIC_INVOICE_ADDRESS_LINE1 || "Dubai, UAE";
const COMPANY_ADDRESS_LINE2 = process.env.NEXT_PUBLIC_INVOICE_ADDRESS_LINE2 || "";
const COMPANY_CONTACT = process.env.NEXT_PUBLIC_INVOICE_CONTACT || "Email: support@qui.ae";
const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
const THANK_YOU_LINE2 = process.env.NEXT_PUBLIC_INVOICE_QUOTE2 || "We hope you love your purchase!";

const formatCurrency = (n) => `${CURRENCY_SYMBOL}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const generateInvoiceHTML = (order) => {
    const orderIdShort = String(order?.id || '').slice(0, 8).toUpperCase();
    const paid = (String(order?.paymentMethod || '').toUpperCase() === 'STRIPE') ? (order?.isPaid ?? true) : (order?.isPaid ?? false);
    
    const subtotal = (order?.orderItems || []).reduce((sum, it) => sum + ((it?.price ?? 0) * (it?.quantity ?? 0)), 0);
    const shippingFee = Number(order?.shippingFee ?? order?.shipping ?? 0);
    let discount = 0;
    if (order?.isCouponUsed && order?.coupon) {
        discount = order.coupon.discountType === 'percentage'
            ? (Number(order.coupon.discount || 0) / 100) * subtotal
            : Number(order.coupon.discount || 0);
    }
    const total = Number(order?.total ?? (subtotal + shippingFee - discount));

    const html = `
<!DOCTYPE html>
<html lang="en" dir="auto">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #${orderIdShort}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        .invoice-container {
            max-width: 210mm;
            height: 297mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 15px;
        }
        .company-info h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        .company-info p {
            font-size: 12px;
            color: #666;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h2 {
            font-size: 32px;
            margin-bottom: 5px;
        }
        .invoice-title p {
            font-size: 12px;
            color: #666;
        }
        .meta-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 20px 0;
            font-size: 13px;
        }
        .meta-item {
            display: flex;
            justify-content: space-between;
        }
        .meta-item strong {
            min-width: 150px;
        }
        .bill-to {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 30px 0;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
        }
        .bill-to-content {
            font-size: 13px;
            line-height: 1.8;
        }
        .tracking-details {
            font-size: 12px;
            line-height: 1.8;
        }
        .tracking-details a {
            color: #0066cc;
            text-decoration: none;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
        }
        thead {
            background: #f5f5f5;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            font-weight: bold;
            background: #f5f5f5;
        }
        td {
            text-align: right;
        }
        td:first-child, th:first-child {
            text-align: center;
        }
        td:nth-child(2), th:nth-child(2) {
            text-align: left;
        }
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            font-size: 13px;
        }
        .totals-content {
            width: 250px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
        }
        .total-row.grand-total {
            font-weight: bold;
            font-size: 16px;
            border-bottom: 2px solid #333;
            padding: 12px 0;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 15px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <h1>${COMPANY_NAME}</h1>
                <p>${COMPANY_ADDRESS_LINE1}, ${COMPANY_ADDRESS_LINE2}</p>
                <p>${COMPANY_CONTACT}</p>
            </div>
            <div class="invoice-title">
                <h2>INVOICE</h2>
                <p>#${orderIdShort}</p>
            </div>
        </div>

        <!-- Meta Info -->
        <div class="meta-row">
            <div>
                <div class="meta-item">
                    <strong>Invoice Date:</strong>
                    <span>${new Date(order?.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
                </div>
                <div class="meta-item">
                    <strong>Payment Method:</strong>
                    <span>${String(order?.paymentMethod || '').toUpperCase()}</span>
                </div>
            </div>
            <div>
                <div class="meta-item">
                    <strong>Payment Status:</strong>
                    <span>${paid ? 'PAID' : 'UNPAID'}</span>
                </div>
                <div class="meta-item">
                    <strong>Order Status:</strong>
                    <span>${String(order?.status || '').replace(/_/g, ' ').toUpperCase()}</span>
                </div>
            </div>
        </div>

        <!-- Bill To & Tracking -->
        <div class="bill-to">
            <div>
                <div class="section-title">BILL TO</div>
                <div class="bill-to-content">
                    <div><strong>${order?.address?.name || 'Customer'}</strong></div>
                    <div>${order?.address?.street || ''}</div>
                    <div>${order?.address?.city || ''}, ${order?.address?.state || ''} - ${order?.address?.zip || ''}</div>
                    <div>${order?.address?.country || 'India'}</div>
                    <div style="margin-top: 8px;">Phone: ${order?.address?.phone || 'N/A'}</div>
                </div>
            </div>
            ${order?.trackingId ? `
            <div>
                <div class="section-title">TRACKING DETAILS</div>
                <div class="tracking-details">
                    <div><strong>Tracking ID:</strong> ${order.trackingId}</div>
                    ${order?.courier ? `<div><strong>Courier:</strong> ${order.courier}</div>` : ''}
                    ${order?.trackingUrl ? `<div><a href="${order.trackingUrl}" target="_blank">Track Order</a></div>` : ''}
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 40px;">#</th>
                    <th>Product Name</th>
                    <th style="width: 60px;">Qty</th>
                    <th style="width: 90px;">Price</th>
                    <th style="width: 100px;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${(order?.orderItems || []).map((item, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td style="text-align: left;">${item?.product?.name || 'Product'}</td>
                    <td>${item?.quantity ?? 0}</td>
                    <td>${formatCurrency(item?.price ?? 0)}</td>
                    <td>${formatCurrency((item?.price ?? 0) * (item?.quantity ?? 0))}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <div class="totals-content">
                <div class="total-row">
                    <strong>Subtotal:</strong>
                    <span>${formatCurrency(subtotal)}</span>
                </div>
                <div class="total-row">
                    <strong>Shipping:</strong>
                    <span>${formatCurrency(shippingFee)}</span>
                </div>
                ${discount > 0 ? `
                <div class="total-row" style="color: #22c55e;">
                    <strong>Discount:</strong>
                    <span>-${formatCurrency(discount)}</span>
                </div>
                ` : ''}
                <div class="total-row grand-total">
                    <strong>TOTAL:</strong>
                    <span>${formatCurrency(total)}</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            ${THANK_YOU_LINE2}
        </div>
    </div>
</body>
</html>
    `;

    return html;
};

export const downloadInvoiceHTML = (order) => {
    const html = generateInvoiceHTML(order);
    const element = document.createElement('div');
    element.innerHTML = html;
    
    const opt = {
        margin: 0,
        filename: `Invoice_${String(order?.id || '').slice(0, 8).toUpperCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
};

export const printInvoiceHTML = (order) => {
    const html = generateInvoiceHTML(order);
    const element = document.createElement('div');
    element.innerHTML = html;
    
    const opt = {
        margin: 0,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).output('dataurlstring').then(url => {
        const printWindow = window.open(url);
        printWindow.print();
    });
};
