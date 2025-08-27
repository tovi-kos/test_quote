import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { products, getTotalForNetwork } from '../data/products';
import { loadArialUnicodeFont } from '../fonts/arial-unicode';

class PDFGenerator {
  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = 210;
    this.pageHeight = 297;
    // Margins matching Quote.pdf exactly
    this.margins = {
      top: 15,
      right: 2.99,
      bottom: 25,
      left: 2.99
    };
    this.currentY = this.margins.top;
    this.headerHeight = 55;
    this.lightPurpleColor = [242, 237, 247];
    
    // Initialize Unicode font support for ₪ symbol
    this.unicodeFontLoaded = loadArialUnicodeFont(this.doc);
  }

  async imageToBase64(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = () => {
        console.log(`Failed to load image: ${url}`);
        resolve(null);
      };
      img.src = url;
    });
  }

  async loadImages() {
    try {
      // Load logo
      this.logoDataUrl = await this.imageToBase64('/images/LOGO.jpeg');
      
      // Load first page
      this.firstPageDataUrl = await this.imageToBase64('/images/firstPage.jpeg');
      
      // Load product images
      this.productImages = [];
      for (let i = 1; i <= 5; i++) {
        const productImg = await this.imageToBase64(`/images/Product${i}.jpg`);
        this.productImages.push(productImg);
      }
      
      console.log('Images loaded:', {
        logo: !!this.logoDataUrl,
        firstPage: !!this.firstPageDataUrl,
        products: this.productImages.map((img, i) => `Product${i+1}: ${!!img}`)
      });
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }

  addHeader() {
    if (this.logoDataUrl) {
      try {
        this.doc.addImage(this.logoDataUrl, 'JPEG', 0, 0, 210, this.headerHeight);
      } catch (e) {
        console.error('Error adding logo:', e);
        this.drawFallbackHeader();
      }
    } else {
      this.drawFallbackHeader();
    }
    
    this.currentY = this.headerHeight + 10;
  }

  drawFallbackHeader() {
    this.doc.setFillColor(242, 237, 247);
    this.doc.ellipse(105, 30, 85, 25, 'F');
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('PELES SMART HOME LTD', 140, 20);
    this.doc.text('516897360 .נ.ח', 140, 25);
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('077-8040608', 140, 32);
    this.doc.text('sales@peles-sh.com', 140, 37);
    this.doc.text('www.peles-sh.com', 140, 42);
    this.doc.text('19 King David St, Jerusalem', 140, 47);
    
    this.doc.setFontSize(22);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(107, 76, 138);
    this.doc.text('PELES', 35, 30);
    this.doc.setFontSize(12);
    this.doc.text('SMART HOME', 35, 37);
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('B"H', 10, 15);
  }

  addFirstPage() {
    if (this.firstPageDataUrl) {
      try {
        this.doc.addImage(this.firstPageDataUrl, 'JPEG', 0, 0, 210, 297);
      } catch (e) {
        console.error('Error adding first page:', e);
        this.drawFallbackFirstPage();
      }
    } else {
      this.drawFallbackFirstPage();
    }
    
    this.doc.addPage();
  }

  drawFallbackFirstPage() {
    this.doc.setFillColor(242, 237, 247);
    this.doc.rect(0, 0, 210, 297, 'F');
    
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(107, 76, 138);
    this.doc.text('PELES', 105, 100, { align: 'center' });
    this.doc.setFontSize(20);
    this.doc.text('SMART HOME', 105, 115, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Price Quote', 105, 150, { align: 'center' });
  }

  addSectionHeader(sectionName) {
    this.addHeader();
    
    // Light purple background for section header - full width
    this.doc.setFillColor(...this.lightPurpleColor);
    this.doc.rect(0, this.currentY, this.pageWidth, 12, 'F');
    
    // Section title with exact font size from Quote.pdf
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(sectionName, 105, this.currentY + 8.5, { align: 'center' });
    
    this.currentY += 16;
  }

  formatNumber(num) {
    // Format number properly without extra spacing
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Helper method to render text with ₪ symbol using proper font
  addTextWithShekel(text, x, y, options = {}) {
    const { align = 'left', size = 11, style = 'normal' } = options;
    
    // Set font size first
    this.doc.setFontSize(size);
    
    if (text.includes('₪')) {
      const parts = text.split('₪');
      let currentX = x;
      
      // Calculate total width for alignment
      const totalWidth = this.doc.getTextWidth(text.replace('₪', 'NIS')); // Approximate width
      
      if (align === 'center') {
        currentX = x - totalWidth / 2;
      } else if (align === 'right') {
        currentX = x - totalWidth;
      }
      
      // Render each part
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          // Add shekel symbol
          const currentFont = this.doc.internal.getFont().fontName;
          
          try {
            // Try to use Arial for the shekel symbol
            this.doc.setFont('arial', style);
            this.doc.text('₪', currentX, y);
            currentX += this.doc.getTextWidth('₪');
          } catch {
            // Fallback to NIS if Arial/Unicode doesn't work
            this.doc.setFont('helvetica', style);
            this.doc.text('NIS', currentX, y);
            currentX += this.doc.getTextWidth('NIS');
          }
          
          // Switch back to original font
          this.doc.setFont(currentFont, style);
        }
        
        // Add the text part
        if (parts[i]) {
          this.doc.text(parts[i], currentX, y);
          currentX += this.doc.getTextWidth(parts[i]);
        }
      }
    } else {
      // Regular text without shekel symbol
      this.doc.text(text, x, y, { align });
    }
  }

  drawDoubleHorizontalLine(y, startX, endX) {
    // Draw perfect double horizontal line like in Quote.pdf
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    // First line
    this.doc.line(startX, y, endX, y);
    // Second line
    this.doc.setLineWidth(0.3);
    this.doc.line(startX, y + 1, endX, y + 1);
  }

  addProductTable() {
    const startX = this.margins.left;
    const tableWidth = this.pageWidth - this.margins.left - this.margins.right;
    
    // Create table data with properly formatted numbers and correct currency
    const tableData = products.map((product) => {
      return [
        '', // Image placeholder
        product.description,
        this.formatNumber(product.itemPrice),
        product.quantity.toString(),
        this.formatNumber(product.total) + ' NIS' // Will be replaced with ₪ in didDrawCell
      ];
    });

    // Configure autoTable with exact styling from Quote.pdf
    autoTable(this.doc, {
      head: [['Item', 'Description', 'Item Price', 'Qty', 'Total']],
      body: tableData,
      startY: this.currentY,
      margin: { left: startX, right: this.margins.right },
      tableWidth: tableWidth,
      columnStyles: {
        0: { cellWidth: 50.23, halign: 'center' }, // Item column - narrower
        1: { cellWidth: 89.57, halign: 'center' },   // Description - wider
        2: { cellWidth: 27.87, halign: 'center' },  // Item Price
        3: { cellWidth: 11.94, halign: 'center' }, // Qty
        4: { cellWidth: 29.86, halign: 'center' }   // Total
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 11,
        font: 'helvetica',
        lineColor: [255, 255, 255],
        lineWidth: 0,
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 11,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [255, 255, 255],
        lineWidth: 0,
        minCellHeight: 35,
        valign: 'middle',
        cellPadding: { top: 3, right: 2, bottom: 3, left: 2 }
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      theme: 'plain',
      showHead: 'firstPage',
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap',
        halign: 'center',
        valign: 'middle',
        font: 'helvetica'
      },
      willDrawCell: (data) => {
        // Prevent default cell drawing for image column and total column (with ₪)
        if (data.section === 'body' && (data.column.index === 0 || data.column.index === 4)) {
          return false;
        }
      },
      didDrawCell: (data) => {
        // Draw consistent double horizontal lines after every row
        if (data.column.index === 4) { // Last column
          const lineY = data.cell.y + data.cell.height;
          const lineStartX = startX;
          const lineEndX = startX + tableWidth;
          
          if (data.row.section === 'head') {
            // Double line after header
            this.drawDoubleHorizontalLine(lineY, lineStartX, lineEndX);
          } else if (data.row.section === 'body') {
            // Double line after each body row
            this.drawDoubleHorizontalLine(lineY, lineStartX, lineEndX);
          }
        }
        
        // Add product images in the first column
        if (data.row.section === 'body' && data.column.index === 0) {
          const rowIndex = data.row.index;
          const imgX = data.cell.x + 2;
          const imgY = data.cell.y + 3;
          const imgWidth = 26;
          const imgHeight = 28;
          
          // Draw cell background first
          this.doc.setFillColor(255, 255, 255);
          this.doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          
          // Add product image
          if (this.productImages && this.productImages[rowIndex]) {
            try {
              this.doc.addImage(this.productImages[rowIndex], 'JPEG', imgX, imgY, imgWidth, imgHeight);
            } catch (e) {
              console.error(`Error adding product image ${rowIndex + 1}:`, e);
              this.addProductPlaceholder(imgX, imgY, rowIndex + 1, imgWidth, imgHeight);
            }
          } else {
            this.addProductPlaceholder(imgX, imgY, rowIndex + 1, imgWidth, imgHeight);
          }
        }
        
        // Add custom rendering for Total column (column 4) with ₪ symbol
        if (data.row.section === 'body' && data.column.index === 4) {
          const rowIndex = data.row.index;
          const totalValue = products[rowIndex].total;
          const totalText = this.formatNumber(totalValue) + ' ₪';
          
          // Draw cell background first
          this.doc.setFillColor(255, 255, 255);
          this.doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          
          // Set font properties
          this.doc.setFontSize(11);
          this.doc.setFont('helvetica', 'normal');
          this.doc.setTextColor(0, 0, 0);
          
          // Calculate center position
          const centerX = data.cell.x + data.cell.width / 2;
          const centerY = data.cell.y + data.cell.height / 2 + 2;
          
          // Use our custom method to render text with ₪ symbol
          this.addTextWithShekel(totalText, centerX, centerY, { align: 'center', size: 11, style: 'normal' });
        }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addProductPlaceholder(x, y, productNum, width = 26, height = 28) {
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(x, y, width, height, 'F');
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.1);
    this.doc.rect(x, y, width, height, 'S');
    this.doc.setFontSize(7);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(`Product ${productNum}`, x + width/2, y + height/2 + 1, { align: 'center' });
  }

  addTotalRow() {
    const total = getTotalForNetwork();
    
    // Position aligned with table - exact positioning from Quote.pdf
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    
    // Calculate positions to align with table columns
    const totalLabelX = this.pageWidth - this.margins.right - 55;
    const totalAmountX = this.pageWidth - this.margins.right - 3;
    
    this.doc.text('Total For Network', totalLabelX, this.currentY, { align: 'right' });
    this.addTextWithShekel(this.formatNumber(total) + ' ₪', totalAmountX, this.currentY, { align: 'right', size: 11, style: 'bold' });
    
    this.currentY += 15;
  }

  addFooter(pageNum, totalPages) {
    const footerY = this.pageHeight - 23;
    
    // Add light purple background ONLY for the details row
    const detailsBgX = 0; // Full page width
    const detailsBgWidth = this.pageWidth;
    const detailsBgHeight = 12; // Only cover the details line
    
    this.doc.setFillColor(...this.lightPurpleColor);
    this.doc.rect(detailsBgX, footerY - 2, detailsBgWidth, detailsBgHeight, 'F');
    
    // Footer details text
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    // Quote details positioned exactly as in Quote.pdf
    this.doc.text('QUOTE#  52400272', this.margins.left + 2, footerY + 3);
    this.doc.text('Prepared by: Sim Shapiro', 75, footerY + 3);
    this.doc.text('Date: 10.02.2025', 130, footerY + 3);
    this.doc.text('Modified: 07.07.2025', 170, footerY + 3);
    
    // Page number centered, BELOW the details (no background)
    this.doc.setFontSize(11);
    this.doc.text(`Page - ${pageNum} Of ${totalPages}`, 105, footerY + 13, { align: 'center' });
  }

  async generatePDF() {
    try {
      console.log('Starting PDF generation...');
      
      // Load images first
      await this.loadImages();
      console.log('Images processed');
      
      // Add first page
      this.addFirstPage();
      console.log('First page added');
      
      // Add Network section
      this.addSectionHeader('Network');
      console.log('Section header added');
      
      // Add product table
      this.addProductTable();
      console.log('Product table added');
      
      // Add total
      this.addTotalRow();
      console.log('Total row added');
      
      // Add footer to all pages except the first
      const totalPages = this.doc.internal.getNumberOfPages();
      for (let i = 2; i <= totalPages; i++) {
        this.doc.setPage(i);
        this.addFooter(i - 1, totalPages - 1);
      }
      console.log('Footers added');
      
      // Download the PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      this.doc.save(`Quote_${timestamp}.pdf`);
      console.log('PDF saved successfully');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Check console for details.');
    }
  }
}

export default PDFGenerator;