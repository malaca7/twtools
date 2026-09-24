/**
 * Serviço de Upload de Imagens via CDN Postimages.org
 * Roteado de forma transparente e otimizada pelo bot Discloud (https://twin.discloud.app/api/upload-image),
 * garantindo links diretos permanentes (i.postimg.cc), velocidade de CDN global e ZERO egress/armazenamento no banco Supabase.
 */

export interface PostimagesUploadOptions {
  filename?: string;
  maxDimension?: number;
  quality?: number;
}

/**
 * Comprime e redimensiona imagem via Canvas no navegador (para uploads rápidos e leves)
 */
async function compressImageForUpload(file: File | Blob, maxDimension = 1920, quality = 0.85): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        // Fallback: se falhar carregamento do Image, retorna base64 original
        resolve({
          base64: reader.result as string,
          mimeType: (file as File).type || 'image/png'
        });
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            base64: reader.result as string,
            mimeType: (file as File).type || 'image/png'
          });
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve({ base64: dataUrl, mimeType });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Envia uma imagem para a API Postimages via Bot CDN e retorna o link direto (https://i.postimg.cc/...)
 */
export async function uploadImageToPostimages(file: File | Blob, options: PostimagesUploadOptions = {}): Promise<string> {
  const name = options.filename || (file instanceof File ? file.name : `img_${Date.now()}.jpg`);
  
  // 1. Otimiza a imagem localmente antes do envio
  const { base64, mimeType } = await compressImageForUpload(file, options.maxDimension || 1920, options.quality || 0.85);

  // 2. Envia para o CDN Postimages através do endpoint do Bot
  const res = await fetch('https://twin.discloud.app/api/upload-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: name,
      base64,
      contentType: mimeType
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Falha no upload para CDN (HTTP ${res.status}): ${errorText}`);
  }

  const data = await res.json();
  if (!data.success || !data.url) {
    throw new Error(data.error || 'URL não retornada pelo CDN');
  }

  return data.url;
}
