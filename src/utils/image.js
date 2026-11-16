/**
 * src/utils/image.js
 * Browser-side image validation and canvas compression (max 800px wide, JPEG quality 0.7).
 */

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.7;

export function compressItemImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected.'));
      return;
    }
    if (!file.type || !file.type.startsWith('image/')) {
      reject(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed.'));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error('Image file size must be 5 MB or smaller.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the selected image file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file could not be decoded as an image.'));
      img.onload = () => {
        try {
          let targetWidth = img.naturalWidth || img.width;
          let targetHeight = img.naturalHeight || img.height;

          if (targetWidth > MAX_WIDTH) {
            const ratio = MAX_WIDTH / targetWidth;
            targetWidth = MAX_WIDTH;
            targetHeight = Math.round(targetHeight * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Browser canvas compression is unavailable.'));
            return;
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          resolve(dataUrl);
        } catch {
          reject(new Error('Unable to compress the selected image.'));
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}
