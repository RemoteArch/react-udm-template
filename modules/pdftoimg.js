/**
 * Convertit un PDF en images PNG côté client
 * Utilise pdf.js pour le rendu des pages
 */

// Variable globale pour partager l'instance pdf.js entre tous les chargements
if (typeof window !== 'undefined' && !window.pdfjsLib) {
  window.pdfjsLib = null;
}

/**
 * Initialise pdf.js avec le worker
 */
export async function initPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  
  const module = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
  window.pdfjsLib = module;
  
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
  
  return window.pdfjsLib;
}

/**
 * Convertit un fichier PDF en tableau d'images PNG (Data URLs)
 * @param {File} file - Fichier PDF
 * @param {Object} options - Options de conversion
 * @param {number} options.scale - Échelle de rendu (défaut: 2)
 * @param {Function} options.onProgress - Callback de progression (pageNum, totalPages)
 * @returns {Promise<string[]>} - Tableau de Data URLs PNG
 */
export async function pdfToImages(file, options = {}) {
  const { scale = 2, onProgress } = options;
  
  const pdfjs = await initPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  const images = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport
    }).promise;
    
    const pngUrl = canvas.toDataURL("image/png");
    images.push(pngUrl);
    
    if (onProgress) {
      onProgress(pageNum, pdf.numPages);
    }
  }
  
  return images;
}

/**
 * Convertit un fichier PDF en tableau de Blobs PNG
 * @param {File} file - Fichier PDF
 * @param {Object} options - Options de conversion
 * @param {number} options.scale - Échelle de rendu (défaut: 2)
 * @param {Function} options.onProgress - Callback de progression
 * @returns {Promise<Blob[]>} - Tableau de Blobs PNG
 */
export async function pdfToBlobs(file, options = {}) {
  const { scale = 2, onProgress } = options;
  
  const pdfjs = await initPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  const blobs = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport
    }).promise;
    
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, "image/png");
    });
    blobs.push(blob);
    
    if (onProgress) {
      onProgress(pageNum, pdf.numPages);
    }
  }
  
  return blobs;
}
