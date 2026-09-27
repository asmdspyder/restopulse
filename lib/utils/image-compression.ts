/**
 * Client-side high quality image compression using HTML5 Canvas.
 * Resizes max dimension to 1600px and converts to WebP (fallback JPEG) at 0.8 quality (~150-250KB).
 */
export async function compressChecklistImage(
  file: File | Blob,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.8
): Promise<{ blob: Blob; previewUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Maintain aspect ratio while scaling down
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to get canvas 2d context"));
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Try webp first, fallback to jpeg
      const mimeType = "image/webp";
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to jpeg
            canvas.toBlob(
              (fallbackBlob) => {
                if (!fallbackBlob) {
                  reject(new Error("Image compression failed"));
                  return;
                }
                const previewUrl = URL.createObjectURL(fallbackBlob);
                resolve({ blob: fallbackBlob, previewUrl, width, height });
              },
              "image/jpeg",
              quality
            );
            return;
          }
          const previewUrl = URL.createObjectURL(blob);
          resolve({ blob, previewUrl, width, height });
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}
