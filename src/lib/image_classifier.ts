import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let cachedModel: mobilenet.MobileNet | null = null;

/**
 * Inisialisasi TF.js backend (mengutamakan WebGL untuk GPU acceleration)
 */
async function initTfjs() {
  // Hanya inisialisasi jika berada di lingkungan client/browser
  if (typeof window === 'undefined') return;

  const currentBackend = tf.getBackend();
  if (currentBackend !== 'webgl' && currentBackend !== 'cpu') {
    try {
      // Tunggu ready
      await tf.ready();
      // Coba set backend WebGL
      await tf.setBackend('webgl');
    } catch (e) {
      console.warn('WebGL tidak tersedia di browser ini, menggunakan CPU:', e);
      try {
        await tf.setBackend('cpu');
      } catch (cpuError) {
        console.error('Gagal menginisialisasi CPU backend TF.js:', cpuError);
      }
    }
  }
}

/**
 * Load model MobileNetV2 pretrained untuk ekstraksi fitur
 */
export async function loadMobileNetModel(): Promise<mobilenet.MobileNet> {
  await initTfjs();
  if (cachedModel) return cachedModel;
  
  try {
    cachedModel = await mobilenet.load({
      version: 2,
      alpha: 1.0
    });
    return cachedModel;
  } catch (error) {
    console.error('Gagal memuat model MobileNet:', error);
    throw error;
  }
}

/**
 * Mengekstrak 1024-dimensional vektor embedding dari gambar/canvas/video
 */
export async function getImageEmbedding(
  imageSource: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
): Promise<number[]> {
  const model = await loadMobileNetModel();
  
  // tf.tidy otomatis membuang tensor internal yang tidak dipakai agar tidak memori leak
  return tf.tidy(() => {
    const embedding = model.infer(imageSource, true);
    // Ambil data float array secara sinkronus dari tensor
    const data = embedding.dataSync();
    return Array.from(data) as number[];
  });
}

/**
 * Menghitung Cosine Similarity antara dua vektor float
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface ProductWithEmbedding {
  id: number;
  nama: string;
  foto_embedding?: number[] | number[][] | null;
}

/**
 * Normalisasi embedding tunggal atau ganda menjadi number[][]
 */
export function getEmbeddingsList(embedding: number[] | number[][] | null | undefined): number[][] {
  if (!embedding) return [];
  if (Array.isArray(embedding[0])) {
    return embedding as number[][];
  }
  return [embedding as number[]];
}

/**
 * Mencari kecocokan terdekat antara embedding kamera dengan embedding produk terdaftar
 */
export function findNearestProduct(
  queryEmbedding: number[],
  products: ProductWithEmbedding[]
): { product: ProductWithEmbedding; similarity: number }[] {
  if (!queryEmbedding || queryEmbedding.length === 0 || !products || products.length === 0) {
    return [];
  }

  return products
    .map(product => {
      const embeddings = getEmbeddingsList(product.foto_embedding);
      if (embeddings.length === 0) return null;

      // Ambil nilai kemiripan tertinggi di antara semua embedding gambar produk tersebut
      let maxSimilarity = -1;
      for (const emb of embeddings) {
        const sim = calculateCosineSimilarity(queryEmbedding, emb);
        if (sim > maxSimilarity) {
          maxSimilarity = sim;
        }
      }

      return { product, similarity: maxSimilarity };
    })
    .filter((item): item is { product: ProductWithEmbedding; similarity: number } => item !== null)
    .sort((a, b) => b.similarity - a.similarity);
}
