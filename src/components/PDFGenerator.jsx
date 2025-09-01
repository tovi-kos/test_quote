import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getProductsByCategory, getUniqueCategories, getCategoryTotal } from '../data/products';

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
    this.headerHeight = 45;
    this.lightPurpleColor = [242, 237, 247];
    this.rowHeight = 22;
    this.maxProductsPerPage = 9;
    this.usableHeight = this.pageHeight - this.headerHeight - this.margins.top - this.margins.bottom - 40;
    
    // Initialize image storage
    this.companyLogos = {};
    this.productImages = {};
    this.logoDataUrl = null;
    this.firstPageDataUrl = null;
    this.flowerDataUrl = null;
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
        const base64 = canvas.toDataURL('image/jpeg');
        resolve(base64);
      };
      
      img.onerror = (error) => {
        console.error(`Failed to load image: ${url}`);
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
      
      // Load flower image for final page and ITEM column
      this.flowerDataUrl = await this.imageToBase64('/images/ff.jpg');
      console.log('Flower image loaded:', this.flowerDataUrl ? 'SUCCESS' : 'FAILED');
      
      // Load company logos with error handling
      const logoNames = ['aruba', 'araknis', 'cisco', 'hikvision', 'ubiquiti'];
      for (const logoName of logoNames) {
        try {
          const logoImg = await this.imageToBase64(`/images/logos/${logoName}.png`);
          if (logoImg) {
            this.companyLogos[`logos/${logoName}.png`] = logoImg;
          }
        } catch (error) {
          console.warn(`Failed to load logo ${logoName}:`, error);
        }
      }
      
      // Load product images
      const productImageNames = ['Product1.jpg', 'Product2.jpg', 'Product3.JPEG', 'Product4.jpg', 'Product5.jpg', 'Product6.jpg', 'Product7.jpg', 'Product8.jpg'];
      for (const imageName of productImageNames) {
        try {
          const productImg = await this.imageToBase64(`/images/${imageName}`);
          if (productImg) {
            this.productImages[`../images/${imageName}`] = productImg;
            console.log(`Loaded product image: ${imageName}`);
          }
        } catch (error) {
          console.warn(`Failed to load product image ${imageName}:`, error);
        }
      }
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
    
    this.currentY = this.headerHeight + 5;
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
    
    // Striped background for section header - full width
    this.addStripedBackground(0, this.currentY, this.pageWidth, 12);
    
    // Section title with exact font size from Quote.pdf
    this.doc.setFontSize(28);
    this.doc.setFont('Georgia', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(sectionName, 105, this.currentY + 8.5, { align: 'center' });
    
    this.currentY += 16;
  }

  formatNumber(num) {
    // Format number properly without extra spacing
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  formatDescription(description) {
    // Handle both legacy string format and new object format
    if (typeof description === 'string') {
      // Legacy format - return as-is for autoTable to render
      return description;
    } else if (typeof description === 'object' && description !== null) {
      // New object format - return empty string, we'll custom render in didDrawCell
      return '';
    }
    return '';
  }

  addStripedBackground(x, y, width, height) {
    // Draw white background first
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(x, y, width, height, 'F');
    
    // Set line properties for stripes
   this.doc.setDrawColor(229, 219, 228); // #E5DBE4 - soft pink/lilac tone
    this.doc.setLineWidth(0.1); // Slightly thicker for better visibility
    
    // Calculate line spacing - 2mm for proper density in 12mm height
    const lineSpacing = 0.3;
    
    // Start first line near the top of the rectangle
    let currentY = y + 1;
    while (currentY < y + height - 1) {
      this.doc.line(x, currentY, x + width, currentY);
      currentY += lineSpacing;
    }
  }

  drawSingleHorizontalLine(y, startX, endX) {
    // Draw single consistent horizontal line
    this.doc.setDrawColor(200, 200, 200); // Light gray like the alternating rows
    this.doc.setLineWidth(0.3);
    this.doc.line(startX, y, endX, y);
  }

  addProductTable(categoryProducts, categoryName) {
    const startX = this.margins.left;
    const tableWidth = this.pageWidth - this.margins.left - this.margins.right;
    
    // Create table data with properly formatted numbers and correct currency
    const tableData = categoryProducts.map((product, index) => {
      return [
        '', // Image placeholder
        this.formatDescription(product.description),
        this.formatNumber(product.itemPrice) + ' ILS',
        product.quantity.toString(),
        this.formatNumber(product.total) + ' ILS'
      ];
    });

    // Use fixed maximum of 9 products per page
    const maxRowsPerPage = this.maxProductsPerPage;
    
    let currentProductIndex = 0;
    let totalProducts = categoryProducts.length;
    
    while (currentProductIndex < totalProducts) {
      // Determine how many rows to show on this page
      const rowsOnThisPage = Math.min(maxRowsPerPage, totalProducts - currentProductIndex);
      const productsForThisPage = tableData.slice(currentProductIndex, currentProductIndex + rowsOnThisPage);
      
      // Capture the current index for use in closures
      const pageProductStartIndex = currentProductIndex;
      const categoryProductsForThisPage = categoryProducts.slice(currentProductIndex, currentProductIndex + rowsOnThisPage);
      
      // Track which rows have had lines drawn to prevent duplicates
      const drawnLines = new Set();
      
      // If this is not the first page for this category, add header again
      if (currentProductIndex > 0) {
        this.doc.addPage();
        this.addSectionHeader(categoryName);
      }
      
      // Configure autoTable with exact styling from Quote.pdf
      try {
        autoTable(this.doc, {
        head: [['Item', 'Description', 'Item Price', 'Qty', 'Total']],
        body: productsForThisPage,
        startY: this.currentY,
        margin: { left: startX, right: this.margins.right },
        tableWidth: tableWidth,
        columnStyles: {
          0: { cellWidth: 48.8, halign: 'center' }, // Item column
          1: { cellWidth: 87.1, halign: 'center' }, // Description - wider
          2: { cellWidth: 27.1, halign: 'center' }, // Item Price
          3: { cellWidth: 11.6, halign: 'center' }, // Qty
          4: { cellWidth: 29.4, halign: 'center' }  // Total
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
          minCellHeight: 19,
          valign: 'middle',
          cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
          fillColor: [255, 255, 255]
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
          // Let all cells render normally (same approach that fixed images)
          return true;
        },
        didDrawCell: (data) => {
          // Draw consistent horizontal lines after each row (only once per row)
          if (data.column.index === 4) { // Last column
            const rowKey = `${data.row.section}-${data.row.index}`;
            
            if (!drawnLines.has(rowKey)) {
              const lineY = data.cell.y + data.cell.height;
              const lineStartX = startX;
              const lineEndX = startX + tableWidth;
              
              if (data.row.section === 'head') {
                // Single line after header
                this.drawSingleHorizontalLine(lineY, lineStartX, lineEndX);
              } else if (data.row.section === 'body') {
                // Single line after each body row
                this.drawSingleHorizontalLine(lineY, lineStartX, lineEndX);
              }
              
              drawnLines.add(rowKey);
            }
          }
          
          // Add product images in the first column
          if (data.row.section === 'body' && data.column.index === 0) {
            const imgWidth = 16;
            const imgHeight = 16;
            const imgX = data.cell.x + (data.cell.width - imgWidth) / 2;
            const imgY = data.cell.y + (data.cell.height - imgHeight) / 2;
            
            const rowIndex = data.row.index;
            const product = categoryProductsForThisPage[rowIndex];
            
            console.log('Attempting to add product image to cell:', data.cell.x, data.cell.y);
            
            // Get the product image
            let productImg = null;
            if (product && product.image) {
              productImg = this.productImages[product.image];
              console.log(`Looking for product image: ${product.image}, found: ${productImg ? 'YES' : 'NO'}`);
            }
            
            if (productImg) {
              try {
                console.log('Product image data available, adding to PDF...');
                this.doc.addImage(productImg, 'JPEG', imgX, imgY, imgWidth, imgHeight);
                console.log('Product image successfully added to table cell');
              } catch (e) {
                console.error('Failed to add product image to table cell:', e.message);
                this.addProductPlaceholder(imgX, imgY, `Product${rowIndex + 1}`, imgWidth, imgHeight);
              }
            } else {
              console.error('No product image available for:', product?.image);
              this.addProductPlaceholder(imgX, imgY, `Product${rowIndex + 1}`, imgWidth, imgHeight);
            }
          }
          
          // Render description in the second column (only for object descriptions)
          if (data.row.section === 'body' && data.column.index === 1) {
            const rowIndex = data.row.index;
            const product = categoryProductsForThisPage[rowIndex];
            
            if (product && product.description && typeof product.description === 'object') {
              this.renderDescriptionCell(
                product.description,
                data.cell.x,
                data.cell.y,
                data.cell.width,
                data.cell.height
              );
            }
          }
        }
        });
        
      } catch (error) {
        console.error('AutoTable Error:', error.message);
        throw error;
      }
      this.currentY = this.doc.lastAutoTable.finalY + 10;
      currentProductIndex += rowsOnThisPage;
    }
  }

  addProductPlaceholder(x, y, productNum, width = 18, height = 18) {
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(x, y, width, height, 'F');
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.1);
    this.doc.rect(x, y, width, height, 'S');
    this.doc.setFontSize(7);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(`Product ${productNum}`, x + width/2, y + height/2 + 1, { align: 'center' });
  }

  // Helper function to wrap text within a given width
  wrapText(text, fontSize, maxWidth) {
    this.doc.setFontSize(fontSize);
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = this.doc.getTextWidth(testLine);
      
      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, just add it anyway
          lines.push(word);
        }
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  renderDescriptionCell(description, cellX, cellY, cellWidth, cellHeight) {
    // No need to clear background - let autoTable handle cell rendering
    
    if (typeof description === 'string') {
      // Legacy format - render with wrapping
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      
      const maxTextWidth = cellWidth - 8; // Padding
      const wrappedLines = this.wrapText(description, 11, maxTextWidth);
      const lineHeight = 4;
      const totalTextHeight = wrappedLines.length * lineHeight;
      const startY = cellY + (cellHeight - totalTextHeight) / 2 + lineHeight;
      
      wrappedLines.forEach((line, index) => {
        if (line.trim()) {
          this.doc.text(line.trim(), cellX + cellWidth / 2, startY + (index * lineHeight), { align: 'center' });
        }
      });
      return;
    }

    // New object format
    if (!description || typeof description !== 'object') return;
    
    const { text, comment, logo } = description;
    const components = [];
    
    // Collect non-null components in order: text first, comment second, logo last (bottom)
    if (text) components.push({ type: 'text', content: text });
    if (comment) components.push({ type: 'comment', content: comment });
    if (logo) components.push({ type: 'logo', content: logo });
    
    if (components.length === 0) return;
    
    // Calculate spacing
    const padding = 2;
    const availableHeight = cellHeight - (2 * padding);
    const componentHeight = availableHeight / components.length;
    const maxTextWidth = cellWidth - 8; // Padding for text wrapping
    
    // Render each component
    components.forEach((component, index) => {
      const componentY = cellY + padding + (index * componentHeight);
      const componentCenterY = componentY + (componentHeight / 2);
      
      if (component.type === 'text') {
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 0, 0);
        
        const wrappedLines = this.wrapText(component.content, 11, maxTextWidth);
        const lineHeight = 3.5;
        const totalTextHeight = wrappedLines.length * lineHeight;
        const startY = componentY + (componentHeight - totalTextHeight) / 2 + lineHeight;
        
        wrappedLines.forEach((line, lineIndex) => {
          this.doc.text(line, cellX + cellWidth / 2, startY + (lineIndex * lineHeight), { align: 'center' });
        });
        
      } else if (component.type === 'comment') {
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(58, 25, 82); // #3A1952 color
        
        const wrappedLines = this.wrapText(component.content, 10, maxTextWidth);
        const lineHeight = 3.5;
        const totalTextHeight = wrappedLines.length * lineHeight;
        const startY = componentY + (componentHeight - totalTextHeight) / 2 + lineHeight;
        
        wrappedLines.forEach((line, lineIndex) => {
          this.doc.text(line, cellX + cellWidth / 2, startY + (lineIndex * lineHeight), { align: 'center' });
        });
        
      } else if (component.type === 'logo') {
        const logoImg = this.companyLogos && this.companyLogos[component.content];
        if (logoImg) {
          try {
            const logoWidth = Math.min(20, cellWidth - 20);
            const logoHeight = 6;
            const logoX = cellX + (cellWidth - logoWidth) / 2;
            const logoY = componentCenterY - (logoHeight / 2);
            
            this.doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
          } catch (e) {
            console.error(`Error adding company logo ${component.content}:`, e);
            // Fallback to text
            this.doc.setFontSize(9);
            this.doc.setFont('helvetica', 'italic');
            this.doc.setTextColor(58, 25, 82);
            this.doc.text(component.content.replace('logos/', '').replace('.png', ''), cellX + cellWidth / 2, componentCenterY + 2, { align: 'center' });
          }
        } else {
          // Fallback to text when logo is not available
          this.doc.setFontSize(9);
          this.doc.setFont('helvetica', 'italic');
          this.doc.setTextColor(58, 25, 82);
          const logoName = component.content.replace('logos/', '').replace('.png', '');
          this.doc.text(logoName, cellX + cellWidth / 2, componentCenterY + 2, { align: 'center' });
        }
      }
    });
  }

  addCategoryTotalRow(categoryName, categoryTotal) {
    // Position aligned with table - exact positioning from Quote.pdf
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    
    // Calculate positions to align with table columns
    const totalLabelX = this.pageWidth - this.margins.right - 55;
    const totalAmountX = this.pageWidth - this.margins.right - 3;
    
    this.doc.text(`Total For ${categoryName}`, totalLabelX, this.currentY, { align: 'right' });
    this.doc.text(this.formatNumber(categoryTotal) + ' ILS', totalAmountX, this.currentY, { align: 'right' });
    
    this.currentY += 15;
  }

  addFooter(pageNum, totalPages) {
    const footerY = this.pageHeight - 23;
    
    // Add striped background ONLY for the details row
    const detailsBgX = 0; // Full page width
    const detailsBgWidth = this.pageWidth;
    const detailsBgHeight = 12; // Only cover the details line
    
    this.addStripedBackground(detailsBgX, footerY - 2, detailsBgWidth, detailsBgHeight);
    
    // Footer details text
    this.doc.setFontSize(11);
    this.doc.setFont('Georgia', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    // Quote details centered in the middle of the background
    const detailsY = footerY + 5; // Center vertically in the 12mm height background
    this.doc.text('QUOTE#  52400272', 25, detailsY, { align: 'center' });
    this.doc.text('Prepared by: Sim Shapiro', 75, detailsY, { align: 'center' });
    this.doc.text('Date: 10.02.2025', 130, detailsY, { align: 'center' });
    this.doc.text('Modified: 07.07.2025', 185, detailsY, { align: 'center' });
    
    // Page number centered, with more space below the details
    this.doc.setFontSize(11);
    this.doc.text(`Page - ${pageNum} Of ${totalPages}`, 105, footerY + 18, { align: 'center' });
  }

  addFinalPage() {
    // Add a new page for the final "Best of luck" message
    this.doc.addPage();
    
    // Center the content vertically and horizontally
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;
    
    // Add "Best of luck" text
    this.doc.setFontSize(32);
    this.doc.setFont('Georgia', 'bold');
    this.doc.setTextColor(107, 76, 138); // Purple color matching brand
    this.doc.text('Best of luck', centerX, centerY - 40, { align: 'center' });
    
    // Add flower image below the text if available
    if (this.flowerDataUrl) {
      try {
        const imgWidth = 60;
        const imgHeight = 60;
        const imgX = centerX - (imgWidth / 2);
        const imgY = centerY - 10;
        
        this.doc.addImage(this.flowerDataUrl, 'JPEG', imgX, imgY, imgWidth, imgHeight);
      } catch (e) {
        console.error('Failed to add flower image:', e);
      }
    }
  }

  async generatePDF() {
    try {
      console.log('Starting PDF generation...');
      
      // Load images first
      await this.loadImages();
      
      // Add first page
      this.addFirstPage();
      
      // Get unique categories
      const categories = getUniqueCategories();
      
      
      // Generate sections for each category
      for (let catIndex = 0; catIndex < categories.length; catIndex++) {
        const category = categories[catIndex];
        
        const categoryProducts = getProductsByCategory(category);
        const categoryTotal = getCategoryTotal(category);
        
        this.addSectionHeader(category);
        this.addProductTable(categoryProducts, category);
        this.addCategoryTotalRow(category, categoryTotal);
        
        if (catIndex < categories.length - 1) {
          this.doc.addPage();
          this.currentY = this.margins.top;
        }
      }
      
      // Add final "Best of luck" page
      this.addFinalPage();
      
      // Add footer to all pages except the first and final page
      const totalPages = this.doc.internal.getNumberOfPages();
      for (let i = 2; i <= totalPages - 1; i++) {
        this.doc.setPage(i);
        this.addFooter(i - 1, totalPages - 2);
      }
      console.log('Footers added');
      
      // Download the PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      this.doc.save(`Quote_${timestamp}.pdf`);
      console.log('PDF generated successfully');
      
    } catch (error) {
      console.error('PDF generation failed:', error.message);
      alert('Error generating PDF. Check console for details.');
    }
  }
}

export default PDFGenerator;