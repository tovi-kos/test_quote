// Arial Unicode font loader for jsPDF
// This provides support for Hebrew characters including ₪ symbol

export const loadArialUnicodeFont = (doc) => {
  // We'll use a simpler approach - switch to a built-in font that supports more characters
  // Arial is more likely to support the shekel symbol than Helvetica
  try {
    // First try to use Arial (which is more likely to support Unicode characters)
    doc.setFont('arial', 'normal');
    return true;
  } catch {
    console.warn('Arial font not available, falling back to alternative solution');
    return false;
  }
};

// Helper function to render text with mixed fonts (Helvetica + Unicode support)
export const addTextWithUnicode = (doc, text, x, y, options = {}) => {
  const { align = 'left', style = 'normal' } = options;
  
  // Check if text contains the shekel symbol
  if (text.includes('₪')) {
    // Split the text at the shekel symbol
    const parts = text.split('₪');
    
    let currentX = x;
    const textWidth = doc.getTextWidth(text);
    
    // Adjust starting position based on alignment
    if (align === 'center') {
      currentX = x - textWidth / 2;
    } else if (align === 'right') {
      currentX = x - textWidth;
    }
    
    // Render each part
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        // Add shekel symbol with Arial font
        const currentFont = doc.internal.getFont();
        try {
          doc.setFont('arial', style);
          doc.text('₪', currentX, y);
          currentX += doc.getTextWidth('₪');
        } catch {
          // Fallback: use NIS text
          doc.text('NIS', currentX, y);
          currentX += doc.getTextWidth('NIS');
        }
        // Switch back to original font
        doc.setFont(currentFont.fontName, style);
      }
      
      // Add the text part
      if (parts[i]) {
        doc.text(parts[i], currentX, y);
        currentX += doc.getTextWidth(parts[i]);
      }
    }
  } else {
    // Regular text without special characters
    doc.text(text, x, y, { align });
  }
};