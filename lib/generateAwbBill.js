import jsPDF from "jspdf";

export const generateAwbBill = (awbDetails) => {
    const pdfFormat = awbDetails.pdfSize === 'a5' ? 'a5' : 'a4';
    const doc = new jsPDF({ unit: 'mm', format: pdfFormat, orientation: 'portrait' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = { left: 15, right: 15, top: 15, bottom: 15 };
    let y = margin.top;

    // AWB Bill Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('AIR WAYBILL (AWB)', pageWidth / 2, y, { align: 'center' });
    y += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`AWB Number: ${awbDetails.awbNumber || 'N/A'}`, margin.left, y);
    doc.text(`Order ID: ${awbDetails.orderId || 'N/A'}`, pageWidth - margin.right, y, { align: 'right' });
    y += 8;
    doc.text(`Courier: ${awbDetails.courier || 'N/A'}`, margin.left, y);
    doc.text(`Date: ${awbDetails.date || new Date().toLocaleDateString()}`, pageWidth - margin.right, y, { align: 'right' });
    y += 8;

    // Sender Details
    doc.setFont('helvetica', 'bold');
    doc.text('Sender Details:', margin.left, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(`Name: ${awbDetails.senderName || ''}`, margin.left, y);
    doc.text(`Address: ${awbDetails.senderAddress || ''}`, margin.left, y + 6);
    doc.text(`Phone: ${awbDetails.senderPhone || ''}`, margin.left, y + 12);
    y += 18;

    // Receiver Details
    doc.setFont('helvetica', 'bold');
    doc.text('Receiver Details:', margin.left, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(`Name: ${awbDetails.receiverName || ''}`, margin.left, y);
    doc.text(`Address: ${awbDetails.receiverAddress || ''}`, margin.left, y + 6);
    doc.text(`Phone: ${awbDetails.receiverPhone || ''}`, margin.left, y + 12);
    y += 18;

    // Shipment Details
    doc.setFont('helvetica', 'bold');
    doc.text('Shipment Details:', margin.left, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(`Weight: ${awbDetails.weight || ''} kg`, margin.left, y);
    doc.text(`Dimensions: ${awbDetails.dimensions || ''}`, margin.left, y + 6);
    doc.text(`Contents: ${awbDetails.contents || ''}`, margin.left, y + 12);
    y += 18;

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('This is a system-generated AWB bill.', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    return doc;
};

export const downloadAwbBill = (awbDetails) => {
    const doc = generateAwbBill(awbDetails);
    doc.save(`AWB_${awbDetails.awbNumber || awbDetails.orderId || 'bill'}.pdf`);
};
