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
    this.productImages = [];
    this.companyLogos = {};
    this.logoDataUrl = null;
    this.firstPageDataUrl = null;
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
      
      // Load product images
      this.productImages = [];
      const productImagePaths = [
        '/images/Product1.jpg',
        '/images/Product2.jpg', 
        '/images/Product3.JPEG',
        '/images/Product4.jpg',
        '/images/Product5.jpg'
      ];
      
      for (let i = 0; i < productImagePaths.length; i++) {
        const imagePath = productImagePaths[i];
        const productImg = await this.imageToBase64(imagePath);
        this.productImages.push(productImg);
        if (!productImg) {
          console.warn(`Product image ${i + 1} failed to load: ${imagePath}`);
        }
      }
      
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
      
      const loadedImages = this.productImages.filter(img => img !== null).length;
      console.log(`Images loaded: ${loadedImages}/5 product images`);
      if (loadedImages < 5) {
        console.warn(`Warning: Only ${loadedImages}/5 product images loaded successfully`);
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

  addProductTable(categoryProducts, categoryName, productImageStartIndex = 0) {
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
          minCellHeight: 22,
          valign: 'middle',
          cellPadding: { top: 2, right: 2, bottom: 2, left: 2 }
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
          // Always prevent default cell drawing for image column
          if (data.section === 'body' && data.column.index === 0) {
            return false;
          }
          
          // For description column, only prevent drawing if it's an object description
          if (data.section === 'body' && data.column.index === 1) {
            const rowIndex = data.row.index;
            const product = categoryProductsForThisPage[rowIndex];
            if (product && product.description && typeof product.description === 'object') {
              return false;
            }
          }
          
          return true;
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
            const imgY = data.cell.y + 2;
            const imgWidth = 18;
            const imgHeight = 18;
            
            // Draw cell background first
            this.doc.setFillColor(255, 255, 255);
            this.doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            
            // Add product image - use the global product index for image mapping
            const globalProductIndex = productImageStartIndex + pageProductStartIndex + rowIndex;
            
            if (this.productImages && this.productImages[globalProductIndex]) {
              const imageData = this.productImages[globalProductIndex];
              
              try {
                this.doc.addImage(imageData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
                console.log(`Image added for product ${globalProductIndex + 1}`);
              } catch (e) {
                console.error(`Failed to add image for product ${globalProductIndex + 1}:`, e.message);
                this.addProductPlaceholder(imgX, imgY, globalProductIndex + 1, imgWidth, imgHeight);
              }
            } else {
              console.log(`No image available for product ${globalProductIndex + 1} (index ${globalProductIndex})`);
              this.addProductPlaceholder(imgX, imgY, globalProductIndex + 1, imgWidth, imgHeight);
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

  renderDescriptionCell(description, cellX, cellY, cellWidth, cellHeight) {
    // Clear the cell background first
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(cellX, cellY, cellWidth, cellHeight, 'F');
    
    if (typeof description === 'string') {
      // Legacy format - render as before
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      
      const lines = description.split('\n');
      const lineHeight = 4;
      const totalTextHeight = lines.length * lineHeight;
      const startY = cellY + (cellHeight - totalTextHeight) / 2 + lineHeight;
      
      lines.forEach((line, index) => {
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
    
    // Collect non-null components
    if (text) components.push({ type: 'text', content: text });
    if (comment) components.push({ type: 'comment', content: comment });
    if (logo) components.push({ type: 'logo', content: logo });
    
    if (components.length === 0) return;
    
    // Calculate spacing
    const padding = 2;
    const availableHeight = cellHeight - (2 * padding);
    const componentHeight = availableHeight / components.length;
    
    // Render each component
    components.forEach((component, index) => {
      const componentY = cellY + padding + (index * componentHeight);
      const componentCenterY = componentY + (componentHeight / 2);
      
      if (component.type === 'text') {
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 0, 0);
        this.doc.text(component.content, cellX + cellWidth / 2, componentCenterY + 2, { align: 'center' });
        
      } else if (component.type === 'comment') {
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(107, 76, 138); // Dark purple color
        this.doc.text(component.content, cellX + cellWidth / 2, componentCenterY + 2, { align: 'center' });
        
      } else if (component.type === 'logo') {
        const logoImg = this.companyLogos && this.companyLogos[component.content];
        if (logoImg) {
          try {
            const logoWidth = Math.min(30, cellWidth - 10);
            const logoHeight = 8;
            const logoX = cellX + (cellWidth - logoWidth) / 2;
            const logoY = componentCenterY - (logoHeight / 2);
            
            this.doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
          } catch (e) {
            console.error(`Error adding company logo ${component.content}:`, e);
            // Fallback to text
            this.doc.setFontSize(9);
            this.doc.setFont('helvetica', 'italic');
            this.doc.setTextColor(107, 76, 138);
            this.doc.text(component.content.replace('logos/', '').replace('.png', ''), cellX + cellWidth / 2, componentCenterY + 2, { align: 'center' });
          }
        } else {
          // Fallback to text when logo is not available
          this.doc.setFontSize(9);
          this.doc.setFont('helvetica', 'italic');
          this.doc.setTextColor(107, 76, 138);
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

  async generatePDF() {
    try {
      console.log('Starting PDF generation...');
      
      // Load images first
      await this.loadImages();
      
      // Add first page
      this.addFirstPage();
      
      // Get unique categories
      const categories = getUniqueCategories();
      
      // Debug: Count total products vs images
      let totalProductCount = 0;
      categories.forEach(category => {
        const categoryProducts = getProductsByCategory(category);
        totalProductCount += categoryProducts.length;
      });
      
      if (totalProductCount > this.productImages.length) {
        console.warn(`WARNING: ${totalProductCount} products but only ${this.productImages.length} images available`);
      }
      
      // Track global product index for image mapping
      let globalProductIndex = 0;
      
      // Generate sections for each category
      for (let catIndex = 0; catIndex < categories.length; catIndex++) {
        const category = categories[catIndex];
        
        const categoryProducts = getProductsByCategory(category);
        const categoryTotal = getCategoryTotal(category);
        
        this.addSectionHeader(category);
        this.addProductTable(categoryProducts, category, globalProductIndex);
        this.addCategoryTotalRow(category, categoryTotal);
        
        globalProductIndex += categoryProducts.length;
        
        if (catIndex < categories.length - 1) {
          this.doc.addPage();
          this.currentY = this.margins.top;
        }
      }
      
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
      console.log('PDF generated successfully');
      
    } catch (error) {
      console.error('PDF generation failed:', error.message);
      alert('Error generating PDF. Check console for details.');
    }
  }
}

export default PDFGenerator;