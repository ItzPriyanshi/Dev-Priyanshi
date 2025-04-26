const { createCanvas } = require('canvas');

const meta = {
  name: "canvas",
  version: "1.0.0",
  description: "API endpoint for generating and manipulating canvas images",
  author: "Claude",
  method: "get",
  category: "graphics",
  path: "/canvas"
};

async function onStart({ res, req }) {
  // Extract query parameters with defaults
  const { 
    width = 500, 
    height = 500, 
    text = '', 
    bgColor = 'white', 
    textColor = 'black',
    shape = 'none',
    shapeColor = 'blue',
    format = 'png'
  } = req.query;

  // Validate parameters
  const parsedWidth = parseInt(width);
  const parsedHeight = parseInt(height);
  
  if (isNaN(parsedWidth) || isNaN(parsedHeight) || parsedWidth <= 0 || parsedHeight <= 0) {
    return res.status(400).json({
      status: false,
      error: 'Width and height must be positive numbers'
    });
  }
  
  if (format !== 'png' && format !== 'jpeg') {
    return res.status(400).json({
      status: false,
      error: 'Format must be either png or jpeg'
    });
  }

  try {
    // Create canvas with specified dimensions
    const canvas = createCanvas(parsedWidth, parsedHeight);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, parsedWidth, parsedHeight);

    // Draw shape if requested
    if (shape === 'circle') {
      ctx.fillStyle = shapeColor;
      const radius = Math.min(parsedWidth, parsedHeight) / 3;
      ctx.beginPath();
      ctx.arc(parsedWidth / 2, parsedHeight / 2, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === 'rectangle') {
      ctx.fillStyle = shapeColor;
      const rectWidth = parsedWidth * 0.6;
      const rectHeight = parsedHeight * 0.6;
      ctx.fillRect(
        (parsedWidth - rectWidth) / 2,
        (parsedHeight - rectHeight) / 2,
        rectWidth,
        rectHeight
      );
    } else if (shape === 'triangle') {
      ctx.fillStyle = shapeColor;
      const size = Math.min(parsedWidth, parsedHeight) * 0.6;
      ctx.beginPath();
      ctx.moveTo(parsedWidth / 2, parsedHeight / 2 - size / 2);
      ctx.lineTo(parsedWidth / 2 - size / 2, parsedHeight / 2 + size / 2);
      ctx.lineTo(parsedWidth / 2 + size / 2, parsedHeight / 2 + size / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Add text if provided
    if (text) {
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Calculate font size based on canvas size
      const fontSize = Math.max(12, Math.min(parsedWidth / 20, 48));
      ctx.font = `${fontSize}px Arial`;
      
      ctx.fillText(text, parsedWidth / 2, parsedHeight / 2);
    }

    // Generate image buffer
    const buffer = format === 'png' ? 
      canvas.toBuffer('image/png') : 
      canvas.toBuffer('image/jpeg');

    // Set response headers for image
    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Disposition', `inline; filename="canvas.${format}"`);
    
    // Send image buffer
    return res.send(buffer);
  } catch (error) {
    console.error("Canvas API Error:", error.message);
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

// Additional route for getting canvas as base64 data URL
async function getCanvasAsDataUrl({ res, req }) {
  // Extract query parameters with defaults
  const { 
    width = 500, 
    height = 500, 
    text = '', 
    bgColor = 'white', 
    textColor = 'black',
    shape = 'none',
    shapeColor = 'blue',
    format = 'png'
  } = req.query;

  // Validate parameters
  const parsedWidth = parseInt(width);
  const parsedHeight = parseInt(height);
  
  if (isNaN(parsedWidth) || isNaN(parsedHeight) || parsedWidth <= 0 || parsedHeight <= 0) {
    return res.status(400).json({
      status: false,
      error: 'Width and height must be positive numbers'
    });
  }
  
  if (format !== 'png' && format !== 'jpeg') {
    return res.status(400).json({
      status: false,
      error: 'Format must be either png or jpeg'
    });
  }

  try {
    // Create canvas with specified dimensions
    const canvas = createCanvas(parsedWidth, parsedHeight);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, parsedWidth, parsedHeight);

    // Draw shape if requested
    if (shape === 'circle') {
      ctx.fillStyle = shapeColor;
      const radius = Math.min(parsedWidth, parsedHeight) / 3;
      ctx.beginPath();
      ctx.arc(parsedWidth / 2, parsedHeight / 2, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === 'rectangle') {
      ctx.fillStyle = shapeColor;
      const rectWidth = parsedWidth * 0.6;
      const rectHeight = parsedHeight * 0.6;
      ctx.fillRect(
        (parsedWidth - rectWidth) / 2,
        (parsedHeight - rectHeight) / 2,
        rectWidth,
        rectHeight
      );
    } else if (shape === 'triangle') {
      ctx.fillStyle = shapeColor;
      const size = Math.min(parsedWidth, parsedHeight) * 0.6;
      ctx.beginPath();
      ctx.moveTo(parsedWidth / 2, parsedHeight / 2 - size / 2);
      ctx.lineTo(parsedWidth / 2 - size / 2, parsedHeight / 2 + size / 2);
      ctx.lineTo(parsedWidth / 2 + size / 2, parsedHeight / 2 + size / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Add text if provided
    if (text) {
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Calculate font size based on canvas size
      const fontSize = Math.max(12, Math.min(parsedWidth / 20, 48));
      ctx.font = `${fontSize}px Arial`;
      
      ctx.fillText(text, parsedWidth / 2, parsedHeight / 2);
    }

    // Generate data URL
    const dataUrl = format === 'png' ? 
      canvas.toDataURL('image/png') : 
      canvas.toDataURL('image/jpeg');

    // Return JSON with data URL and metadata
    return res.json({
      status: true,
      width: parsedWidth,
      height: parsedHeight,
      format: format,
      dataUrl: dataUrl,
      timestamp: new Date().toISOString(),
      powered_by: "Canvas API"
    });
  } catch (error) {
    console.error("Canvas API Error:", error.message);
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

module.exports = { 
  meta, 
  onStart,
  routes: [
    { 
      path: "/canvas/dataurl", 
      method: "get", 
      handler: getCanvasAsDataUrl, 
      description: "Get canvas as base64 data URL" 
    }
  ] 
};