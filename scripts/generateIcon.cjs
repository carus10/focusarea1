const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ICO file format: multi-size icon from PNG
async function createIco() {
  const inputPng = path.resolve('assets/icon.png');
  const outputIco = path.resolve('assets/icon.ico');
  
  const sizes = [16, 32, 48, 64, 128, 256];
  const images = [];

  for (const size of sizes) {
    const buf = await sharp(inputPng)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    images.push({ size, data: buf });
  }

  // Build ICO binary
  const numImages = images.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dataOffset = headerSize + (dirEntrySize * numImages);

  let currentOffset = dataOffset;
  const dirEntries = [];
  
  for (const img of images) {
    const w = img.size >= 256 ? 0 : img.size;
    const h = img.size >= 256 ? 0 : img.size;
    
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(w, 0);           // width
    entry.writeUInt8(h, 1);           // height
    entry.writeUInt8(0, 2);           // color palette
    entry.writeUInt8(0, 3);           // reserved
    entry.writeUInt16LE(1, 4);        // color planes
    entry.writeUInt16LE(32, 6);       // bits per pixel
    entry.writeUInt32LE(img.data.length, 8);  // image size
    entry.writeUInt32LE(currentOffset, 12);   // offset
    
    dirEntries.push(entry);
    currentOffset += img.data.length;
  }

  // ICO header
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);         // reserved
  header.writeUInt16LE(1, 2);         // type: 1 = ICO
  header.writeUInt16LE(numImages, 4); // number of images

  const buffers = [header, ...dirEntries, ...images.map(i => i.data)];
  const ico = Buffer.concat(buffers);
  
  fs.writeFileSync(outputIco, ico);
  console.log(`ICO created: ${outputIco} (${ico.length} bytes, ${numImages} sizes: ${sizes.join(', ')})`);
}

createIco().catch(err => { console.error(err); process.exit(1); });
