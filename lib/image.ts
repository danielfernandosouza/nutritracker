export type CameraShot = { dataUrl: string; data: string; mediaType: "image/jpeg" };

/** Teto do lado maior da imagem — mantém o upload bem abaixo do limite de `lib/photo.ts`. */
export const MAX_IMAGE_DIMENSION = 1600;
export const IMAGE_JPEG_QUALITY = 0.9;

function toShot(canvas: HTMLCanvasElement): CameraShot {
  const dataUrl = canvas.toDataURL("image/jpeg", IMAGE_JPEG_QUALITY);
  return { dataUrl, data: dataUrl.split(",")[1] ?? "", mediaType: "image/jpeg" };
}

/** Desenha `source` num canvas reduzido para caber em MAX_IMAGE_DIMENSION, preservando a proporção. */
export function drawScaled(source: CanvasImageSource, width: number, height: number): CameraShot | null {
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return toShot(canvas);
}

/**
 * Reduz uma imagem escolhida da galeria/arquivo para o mesmo tamanho da captura pela câmera.
 * Sem isso, uma foto de celular moderno (vários MB) vira um base64 acima do limite aceito pela
 * API, e a refeição era rejeitada no envio.
 */
export function downscaleImageFile(file: File): Promise<CameraShot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("file read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const shot = drawScaled(img, img.naturalWidth, img.naturalHeight);
        if (shot) resolve(shot);
        else reject(new Error("canvas unavailable"));
      };
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
