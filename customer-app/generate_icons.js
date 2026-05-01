const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const inputPath = path.join(__dirname, 'assets', 'logo.jpeg');
  
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Error: Could not find "logo.jpeg" in the assets directory.');
    console.log('Please save the image as "logo.jpeg" in the customer-app/assets folder.');
    process.exit(1);
  }

  console.log('🔄 Processing "logo.png"...');

  try {
    // 1. Read the input image
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // 2. Remove white background (make it transparent for Android Adaptive Foreground)
    // We trim the white space, then add a transparent background.
    const transparentLogo = await image
      .trim() // Trims away solid background colors (like white) from edges
      // Add an alpha channel if it doesn't exist to support transparency
      .ensureAlpha()
      .toBuffer();

    // 3. Create Android Adaptive Icon (Foreground)
    // Adaptive icons MUST be 1024x1024. The inner 66% (675x675) is the "Safe Zone".
    // We scale the trimmed transparent logo to fit perfectly inside a 600x600 box, 
    // and place it on a 1024x1024 transparent canvas.
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
      }
    })
    .composite([
      {
        input: await sharp(transparentLogo)
          .resize(600, 600, { fit: 'inside' }) // Fit inside 600x600 to be safely inside the 675px safe zone
          .toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(__dirname, 'assets', 'adaptive-icon.png'));
    
    console.log('✅ Generated assets/adaptive-icon.png (Properly scaled for Android Adaptive Icon safe zone)');

    // 4. Create Standard App Icon (iOS / Fallback)
    // This is a 1024x1024 image with a solid white background.
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // Solid white background
      }
    })
    .composite([
      {
        input: await sharp(transparentLogo)
          .resize(800, 800, { fit: 'inside' }) // Slightly larger for standard icon
          .toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(__dirname, 'assets', 'icon.png'));

    console.log('✅ Generated assets/icon.png (Solid background for iOS & Standard Launcher)');
    console.log('🎉 All icons successfully generated like a professional app!');

  } catch (error) {
    console.error('❌ Failed to process image:', error);
  }
}

generateIcons();
