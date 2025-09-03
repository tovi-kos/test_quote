import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { data, getProductsByCategory, getUniqueCategories, getCategoryTotal, getLaborData, getTotalLabor } from '../data/products';

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
    this.headerHeight = 45; // Default height, will be updated based on actual image
    this.lightPurpleColor = [242, 237, 247];
    this.maxProductsPerPage = 9;
    this.usableHeight = this.pageHeight - this.headerHeight - this.margins.top - this.margins.bottom - 40;
    
    // Initialize image storage
    this.companyLogos = {};
    this.productImages = {};
    this.logoDataUrl = null;
    this.logoAspectRatio = null; // Store aspect ratio for dynamic height
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
      // Load logo and calculate dynamic height
      this.logoDataUrl = await this.imageToBase64('/images/LOGO.jpeg');
      
      // Calculate header height based on logo aspect ratio
      if (this.logoDataUrl) {
        await this.calculateLogoHeight();
      }
      
      // Load first page
      this.firstPageDataUrl = await this.imageToBase64('/images/firstPage.jpeg');
      
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

  async calculateLogoHeight() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Calculate aspect ratio and set dynamic header height
        this.logoAspectRatio = img.height / img.width;
        // Full page width is 210mm, calculate proportional height
        this.headerHeight = Math.round(210 * this.logoAspectRatio);
        // Update usable height based on new header height
        this.usableHeight = this.pageHeight - this.headerHeight - this.margins.top - this.margins.bottom - 40;
        console.log(`Logo dimensions: ${img.width}x${img.height}, Aspect ratio: ${this.logoAspectRatio}, Header height: ${this.headerHeight}mm`);
        resolve();
      };
      img.onerror = () => {
        console.error('Failed to calculate logo dimensions, using default height');
        resolve();
      };
      img.src = this.logoDataUrl;
    });
  }

  addHeader() {
    if (this.logoDataUrl) {
      try {
        // Use full page width and dynamic height based on image aspect ratio
        this.doc.addImage(this.logoDataUrl, 'JPEG', 0, 0, 210, this.headerHeight);
        console.log(`Added header image with height: ${this.headerHeight}mm`);
      } catch (e) {
        console.error('Error adding logo:', e);
        // Minimal fallback - just set position
        this.currentY = 50; // Default fallback position
        return;
      }
    } else {
      console.warn('Logo image not loaded, skipping header');
      this.currentY = this.margins.top;
      return;
    }
    
    // Position content directly below the dynamic header with minimal gap
    this.currentY = this.headerHeight + 2; // Very small 2mm gap
  }

  addFirstPage() {
    if (this.firstPageDataUrl) {
      try {
        // Add first page image as full page
        this.doc.addImage(this.firstPageDataUrl, 'JPEG', 0, 0, 210, 297);
      } catch (e) {
        console.error('Error adding first page image:', e);
      }
    }
    
    this.doc.addPage();
  }

  addSectionHeader(sectionName) {
    this.addHeader();
    
    // Striped background for section header - matching table margins
    const backgroundX = this.margins.left;
    const backgroundWidth = this.pageWidth - this.margins.left - this.margins.right;
    this.addStripedBackground(backgroundX, this.currentY, backgroundWidth, 12);
    
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
      // For object format, return empty string - we'll custom render in didDrawCell
      // This prevents autoTable from rendering plain text
      return '';
    }
    return '';
  }

  calculateRowHeight(product, cellWidth = 80) {
    // Calculate the required height for a product row
    let maxHeight = 20; // Minimum height for image (16px + padding)
    
    if (product.description) {
      if (typeof product.description === 'string') {
        // Calculate height for wrapped text
        const wrappedLines = this.wrapText(product.description, 11, cellWidth - 8);
        const textHeight = wrappedLines.length * 4.5 + 8; // line height + padding
        maxHeight = Math.max(maxHeight, textHeight);
      } else if (typeof product.description === 'object') {
        // Calculate height for complex description with tighter spacing
        let totalHeight = 2; // top padding
        const { text, comment, logo } = product.description;
        const componentGap = 2; // Gap between components
        
        if (text) {
          const wrappedLines = this.wrapText(text, 11, cellWidth - 8);
          totalHeight += wrappedLines.length * 3.5 + componentGap;
        }
        if (comment) {
          const wrappedLines = this.wrapText(comment, 10, cellWidth - 8);
          totalHeight += wrappedLines.length * 3.5 + componentGap;
        }
        if (logo) {
          totalHeight += 6 + componentGap; // Logo height (6) + gap
        }
        
        totalHeight += 2; // bottom padding
        maxHeight = Math.max(maxHeight, totalHeight);
      }
    }
    
    // Add space for double lines at bottom of row (3px for lines + gap)
    return maxHeight + 4;
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
    // Draw double horizontal lines below the row
    this.doc.setDrawColor(0, 0, 0); // Black color for lines
    this.doc.setLineWidth(0.3); // Slightly thicker for visibility
    // First line at the y position
    this.doc.line(startX, y, endX, y);
    // Second line 0.5 units below (creating double line effect)
    this.doc.line(startX, y + 0.5, endX, y + 0.5);
  }

  addProductTable(categoryProducts, categoryName) {
    const startX = this.margins.left;
    const tableWidth = this.pageWidth - this.margins.left - this.margins.right;
    
    // Calculate row heights for all products
    const rowHeights = categoryProducts.map(product => this.calculateRowHeight(product));
    
    // Create table data with properly formatted numbers and correct currency
    const tableData = categoryProducts.map((product, index) => {
      // For images, we'll use autoTable's content property
      const imageCell = {
        content: '',
        styles: {
          minCellHeight: rowHeights[index]
        }
      };
      
      // For descriptions, provide the actual content
      const descriptionContent = this.formatDescription(product.description);
      
      return [
        imageCell,
        descriptionContent,
        this.formatNumber(product.itemPrice) + ' ILS',
        product.quantity.toString(),
        this.formatNumber(product.total) + ' ILS'
      ];
    });

    // Dynamic page break calculation
    const footerStart = this.pageHeight - 23; // Footer starts at this Y position
    const headerHeight = 10; // Approximate height of table header
    
    let currentProductIndex = 0;
    let totalProducts = categoryProducts.length;
    
    while (currentProductIndex < totalProducts) {
      // Calculate available height on current page
      const availableHeight = footerStart - this.currentY - 5; // 5px buffer before footer
      
      // Determine how many rows will fit on this page
      let rowsOnThisPage = 0;
      let totalHeightUsed = headerHeight; // Start with header height
      
      for (let i = currentProductIndex; i < totalProducts; i++) {
        const rowHeight = rowHeights[i];
        if (totalHeightUsed + rowHeight > availableHeight) {
          // This row won't fit, stop here
          break;
        }
        totalHeightUsed += rowHeight;
        rowsOnThisPage++;
      }
      
      // Check if we need a new page
      let needNewPage = false;
      
      // Case 1: No rows fit on current page
      if (rowsOnThisPage === 0) {
        needNewPage = true;
      }
      // Case 2: This is a continuation of the category (not first batch)
      else if (currentProductIndex > 0) {
        needNewPage = true;
      }
      
      // Add new page if needed and recalculate
      if (needNewPage) {
        this.doc.addPage();
        this.addSectionHeader(categoryName);
        
        // Recalculate available space on the fresh page
        const freshAvailableHeight = footerStart - this.currentY - 5;
        rowsOnThisPage = 0;
        totalHeightUsed = headerHeight;
        
        for (let i = currentProductIndex; i < totalProducts; i++) {
          const rowHeight = rowHeights[i];
          if (totalHeightUsed + rowHeight > freshAvailableHeight) {
            break;
          }
          totalHeightUsed += rowHeight;
          rowsOnThisPage++;
        }
      }
      
      const productsForThisPage = tableData.slice(currentProductIndex, currentProductIndex + rowsOnThisPage);
      const rowHeightsForThisPage = rowHeights.slice(currentProductIndex, currentProductIndex + rowsOnThisPage);
      
      // Capture the current index for use in closures
      const pageProductStartIndex = currentProductIndex;
      const categoryProductsForThisPage = categoryProducts.slice(currentProductIndex, currentProductIndex + rowsOnThisPage);
      
      // Track which rows have had lines drawn to prevent duplicates
      const drawnLines = new Set();
      
      // Page handling is done above in the dynamic calculation
      
      // Configure autoTable with exact styling from Quote.pdf
      try {
        autoTable(this.doc, {
        head: [['Item', 'Description', 'Item Price', 'Qty', 'Total']],
        body: productsForThisPage,
        startY: this.currentY,
        margin: { left: startX, right: this.margins.right },
        tableWidth: tableWidth,
        columnStyles: {
          0: { cellWidth: 48.8, halign: 'center', valign: 'middle' }, // Item column
          1: { cellWidth: 80, halign: 'center', valign: 'top', overflow: 'linebreak' }, // Description - reduced
          2: { cellWidth: 34.2, halign: 'center', valign: 'middle' }, // Item Price - increased
          3: { cellWidth: 11.6, halign: 'center', valign: 'middle' }, // Qty
          4: { cellWidth: 29.4, halign: 'center', valign: 'middle' }  // Total
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
          valign: 'middle',
          cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
          fillColor: [255, 255, 255],
          overflow: 'linebreak'
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
          // Set dynamic row height for body cells
          if (data.row.section === 'body' && data.row.index < rowHeightsForThisPage.length) {
            data.row.height = rowHeightsForThisPage[data.row.index];
          }
          return true;
        },
        didDrawCell: (data) => {
          // Draw consistent horizontal lines after each row (only once per row)
          if (data.column.index === 4) { // Last column
            const rowKey = `${data.row.section}-${data.row.index}`;
            
            if (!drawnLines.has(rowKey)) {
              const lineY = data.cell.y + data.cell.height - 3; // Position lines inside row with gap from content
              const lineStartX = startX;
              const lineEndX = startX + tableWidth;
              
              if (data.row.section === 'head') {
                // Double line after header
                this.drawDoubleHorizontalLine(lineY, lineStartX, lineEndX);
              } else if (data.row.section === 'body') {
                // Double line after each body row
                this.drawDoubleHorizontalLine(lineY, lineStartX, lineEndX);
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
    
    // Calculate spacing with minimal gaps
    const topPadding = 2;
    const componentGap = 2; // Small gap between components
    const maxTextWidth = cellWidth - 8; // Padding for text wrapping
    
    let currentY = cellY + topPadding;
    
    // Render each component sequentially with minimal spacing
    components.forEach((component, index) => {
      
      if (component.type === 'text') {
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 0, 0);
        
        const wrappedLines = this.wrapText(component.content, 11, maxTextWidth);
        const lineHeight = 3.5;
        
        wrappedLines.forEach((line, lineIndex) => {
          this.doc.text(line, cellX + cellWidth / 2, currentY + lineHeight + (lineIndex * lineHeight), { align: 'center' });
        });
        
        currentY += wrappedLines.length * lineHeight + componentGap;
        
      } else if (component.type === 'comment') {
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(58, 25, 82); // #3A1952 color
        
        const wrappedLines = this.wrapText(component.content, 10, maxTextWidth);
        const lineHeight = 3.5;
        
        wrappedLines.forEach((line, lineIndex) => {
          this.doc.text(line, cellX + cellWidth / 2, currentY + lineHeight + (lineIndex * lineHeight), { align: 'center' });
        });
        
        currentY += wrappedLines.length * lineHeight + componentGap;
        
      } else if (component.type === 'logo') {
        const logoImg = this.companyLogos && this.companyLogos[component.content];
        if (logoImg) {
          try {
            const logoWidth = Math.min(20, cellWidth - 20);
            const logoHeight = 6;
            const logoX = cellX + (cellWidth - logoWidth) / 2;
            const logoY = currentY;
            
            this.doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
            currentY += logoHeight + componentGap;
          } catch (e) {
            console.error(`Error adding company logo ${component.content}:`, e);
            // Fallback to text
            this.doc.setFontSize(9);
            this.doc.setFont('helvetica', 'italic');
            this.doc.setTextColor(58, 25, 82);
            this.doc.text(component.content.replace('logos/', '').replace('.png', ''), cellX + cellWidth / 2, currentY + 4, { align: 'center' });
            currentY += 8 + componentGap;
          }
        } else {
          // Fallback to text when logo is not available
          this.doc.setFontSize(9);
          this.doc.setFont('helvetica', 'italic');
          this.doc.setTextColor(58, 25, 82);
          const logoName = component.content.replace('logos/', '').replace('.png', '');
          this.doc.text(logoName, cellX + cellWidth / 2, currentY + 4, { align: 'center' });
          currentY += 8 + componentGap;
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

  addLaborPage() {
    // Add header
    this.addHeader();
    
    // Add section header for Labor
    this.addSectionHeader('Labor');
    
    // Get labor data
    const laborData = getLaborData();
    const laborTotal = getTotalLabor();
    
    // Prepare table data
    const tableData = laborData.map(labor => [
      labor.categoryName,
      labor.description,
      this.formatNumber(labor.price) + ' ILS'
    ]);
    
    const startX = this.margins.left;
    const tableWidth = this.pageWidth - this.margins.left - this.margins.right;
    
    // Track which rows have had lines drawn to prevent duplicates
    const drawnLines = new Set();
    
    // Add the labor table - all items in a single table
    autoTable(this.doc, {
      head: [['Item', 'Description', 'Item Price']],
      body: tableData,
      startY: this.currentY,
      margin: { left: startX, right: this.margins.right },
      tableWidth: tableWidth,
      columnStyles: {
        0: { cellWidth: 70, halign: 'center', valign: 'middle' }, // Item column - expanded
        1: { cellWidth: 74, halign: 'center', valign: 'middle' }, // Description column - reduced
        2: { cellWidth: 60, halign: 'center', valign: 'top' }  // Item Price column - adjusted
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
        cellPadding: { top: 8, right: 3, bottom: 8, left: 3 },
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
      didParseCell: (data) => {
        // Custom font size for category names in body (first column)
        if (data.row.section === 'body' && data.column.index === 0) {
          data.cell.styles.fontSize = 16;
        }
      },
      didDrawCell: (data) => {
        // Draw consistent horizontal lines after each row (only once per row)
        if (data.column.index === 2) { // Last column
          const rowKey = `${data.row.section}-${data.row.index}`;
          
          if (!drawnLines.has(rowKey)) {
            const lineY = data.cell.y + data.cell.height - 2; // Position lines inside row
            const lineStartX = startX;
            const lineEndX = startX + tableWidth;
            
            // Double line after each row (header and body)
            this.drawDoubleHorizontalLine(lineY, lineStartX, lineEndX);
            
            drawnLines.add(rowKey);
          }
        }
      }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 10;
    
    // Add total row for Labor after all rows are rendered
    this.addLaborTotalRow(laborTotal);
  }

  addLaborTotalRow(laborTotal) {
    // Position aligned with table - exact positioning
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    
    // Calculate positions to align with table columns
    const totalLabelX = this.pageWidth - this.margins.right - 55;
    const totalAmountX = this.pageWidth - this.margins.right - 3;
    
    this.doc.text('Total For Labor', totalLabelX, this.currentY, { align: 'right' });
    this.doc.text(this.formatNumber(laborTotal) + ' ILS', totalAmountX, this.currentY, { align: 'right' });
    
    this.currentY += 15;
  }

  addFinancialSummaryPage() {
    // Add header
    this.addHeader();
    
    // Add section header for Financial Summary
    this.addSectionHeader('Financial Summary');
    
    // Calculate all totals needed for the page
    const categories = getUniqueCategories();
    const categoryTotals = {};
    let grandTotal = 0;
    
    // Calculate category totals
    categories.forEach(category => {
      const total = getCategoryTotal(category);
      categoryTotals[category] = total;
      grandTotal += total;
    });
    
    // Add labor total
    const laborTotal = getTotalLabor();
    grandTotal += laborTotal;
    
    // Calculate discount amount
    const discountAmount = (grandTotal * data.discountPercentage) / 100;
    const finalTotal = grandTotal - discountAmount;
    
    // Start displaying the financial summary - move table higher
    this.currentY += 5;
    
    // Add category totals - mapping to the image labels
    const categoryMapping = {
      'Network Equipment': 'Network',
      'Power Systems': 'Alarm System', 
      'Cooling & Ventilation': 'Cameras',
      'Wireless Equipment': 'Audio & Video',
      'Installation Services': 'Access control',
      'Smart Home': 'Home Automation',
      'Security Equipment': 'Lighting Control'
    };
    
    // Prepare table data for Financial Summary including Proposal Total
    const summaryData = [];
    
    // Add categories
    categories.forEach(category => {
      const displayName = categoryMapping[category.trim()] || category;
      const total = categoryTotals[category];
      summaryData.push([displayName, this.formatNumber(total) + ' ILS']);
    });
    
    // Add Labor
    summaryData.push(['Labor', this.formatNumber(laborTotal) + ' ILS']);
    
    // Add Special Discount with negative amount
    summaryData.push([`Special Discount ${data.discountPercentage}%`, '-' + this.formatNumber(discountAmount) + ' ILS']);
    
    // Create right-aligned borderless table
    autoTable(this.doc, {
      body: summaryData,
      startY: this.currentY,
      margin: { left: this.pageWidth * 0.4, right: this.margins.right }, // Right-aligned table
      tableWidth: this.pageWidth * 0.6 - this.margins.right,
      columnStyles: {
        0: { halign: 'right', valign: 'middle', fontStyle: 'bold' }, // Name column
        1: { halign: 'right', valign: 'middle', fontStyle: 'bold' }  // Amount column
      },
      bodyStyles: {
        fontSize: 11, // Reduced from 11 to 10
        font: 'helvetica',
        fontStyle: 'bold',
        textColor: [0, 0, 0], // All text in black
        lineColor: [255, 255, 255], // No lines
        lineWidth: 0,
        cellPadding: { top: 3, right: 5, bottom: 3, left: 5 }, // Reduced padding for tighter spacing
        fillColor: [255, 255, 255] // White background
      },
      theme: 'plain', // No borders
      showHead: false, // No header row
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap',
        halign: 'right',
        valign: 'middle',
        fontStyle: 'bold'
      }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 8;
    
    // Calculate gray line positioning (75% width, starting from right with 5px margin)
    const separatorY = this.currentY;
    const lineEndX = this.pageWidth - this.margins.right - 5; // 5px margin from right
    const lineWidth = this.pageWidth * 0.75; // 75% of page width
    const lineStartX = lineEndX - lineWidth;
    
    // Add thicker, lighter gray separator line
    this.doc.setDrawColor(180, 180, 180); // Lighter gray
    this.doc.setLineWidth(1.0); // Thicker line
    this.doc.line(lineStartX, separatorY, lineEndX, separatorY);
    
    // VAT text above the line, aligned with line start - positioned just above the line
    this.doc.setFontSize(12); // Increased from 10 to 12 for better visibility
    this.doc.setFont('helvetica', 'bold'); // Changed to normal weight to match the reference image
    this.doc.setTextColor(130, 130, 130); // Lighter gray as requested
    this.doc.text('The total price does not include VAT', lineStartX, separatorY - 1.5, { align: 'left' }); // Positioned just above the line
    
    // Add Proposal Total to the main table as the last row with reduced spacing
    this.currentY += 3;
    
    // Create a separate table for Proposal Total with larger font
    autoTable(this.doc, {
      body: [['Proposal Total', this.formatNumber(finalTotal) + ' ILS']],
      startY: this.currentY,
      margin: { left: this.pageWidth * 0.4, right: this.margins.right },
      tableWidth: this.pageWidth * 0.6 - this.margins.right,
      columnStyles: {
        0: { halign: 'right', valign: 'middle', fontStyle: 'bold' },
        1: { halign: 'right', valign: 'middle', fontStyle: 'bold' }
      },
      bodyStyles: {
        fontSize: 14, // Slightly larger for Proposal Total
        font: 'helvetica',
        fontStyle: 'bold',
        textColor: [0, 0, 0],
        lineColor: [255, 255, 255],
        lineWidth: 0,
        cellPadding: { top: 0, right: 5, bottom: 3, left: 5 },
        fillColor: [255, 255, 255]
      },
      theme: 'plain',
      showHead: false,
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap',
        halign: 'right',
        valign: 'middle',
        fontStyle: 'bold'
      }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY;
    
    this.currentY += 30; // Space before payment schedule
    
    // Add Payment Schedule section
    this.addPaymentScheduleTable(finalTotal);
  }

  addPaymentScheduleTable(proposalTotal) {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    
    // Payment Schedule title
    this.doc.text('Payment Schedule', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;
    
    // Prepare payment table data
    const paymentData = data.paymentTerms.map((payment, index) => [
      `Payment ${index + 1}`,
      `${payment.percentageUpfront}% of Proposal Total`,
      this.formatNumber((proposalTotal * payment.percentageUpfront) / 100) + ' ILS',
      payment.descriptionPayment
    ]);
    
    // Add payment schedule table
    autoTable(this.doc, {
      head: [['', '', '', '']],
      body: paymentData,
      startY: this.currentY,
      margin: { left: this.margins.left + 10, right: this.margins.right + 10 },
      tableWidth: this.pageWidth - this.margins.left - this.margins.right - 20,
      columnStyles: {
        0: { cellWidth: 25, halign: 'center', valign: 'middle' },
        1: { cellWidth: 50, halign: 'center', valign: 'middle' },
        2: { cellWidth: 30, halign: 'center', valign: 'middle' },
        3: { cellWidth: 75, halign: 'center', valign: 'middle' }
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [255, 255, 255], // Hide header text
        lineColor: [0, 0, 0],
        lineWidth: 1
      },
      bodyStyles: {
        fontSize: 10,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 1,
        cellPadding: { top: 8, right: 4, bottom: 8, left: 4 },
        fillColor: [255, 255, 255]
      },
      theme: 'grid',
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap',
        halign: 'center',
        valign: 'middle'
      }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addFooter(pageNum, totalPages) {
    const footerY = this.pageHeight - 23;
    
    // Add striped background ONLY for the details row - matching table margins
    const detailsBgX = this.margins.left;
    const detailsBgWidth = this.pageWidth - this.margins.left - this.margins.right;
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
      
      // Add Labor page after all product categories
      this.doc.addPage();
      this.currentY = this.margins.top;
      this.addLaborPage();
      
      // Add Financial Summary page after Labor page
      this.doc.addPage();
      this.currentY = this.margins.top;
      this.addFinancialSummaryPage();
      
      // Add footer to all pages except the first page
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