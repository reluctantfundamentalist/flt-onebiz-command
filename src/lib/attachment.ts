// Client-side attachment processing for the prototype.
// PNG/JPG => Tesseract.js OCR directly. PDF => pdf.js, trying embedded text
// first and falling back to render + OCR for image-only PDFs.
// No server, no API key — runs in the browser on the Vercel deploy.

export async function processAttachment(
  file: File,
  onProgress?: (msg: string) => void
): Promise<string> {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (isPdf) return ocrPdf(file, onProgress);
  return ocrImage(file, onProgress);
}

async function ocrImage(file: File, onProgress?: (m: string) => void): Promise<string> {
  const { default: Tesseract } = await import("tesseract.js");
  const url = URL.createObjectURL(file);
  try {
    onProgress?.("OCR-ing image…");
    const { data } = await Tesseract.recognize(url, "eng");
    return data.text;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function ocrPdf(file: File, onProgress?: (m: string) => void): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist");
  // v4 is browser-first ESM; worker URL derived from the installed version.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    onProgress?.(`Reading page ${i}/${doc.numPages}…`);
    const page = await doc.getPage(i);
    let pageText = "";
    try {
      const content = await page.getTextContent();
      pageText = content.items.map((it: any) => it.str).join(" ");
    } catch {
      pageText = "";
    }
    if (pageText.trim().length > 20) {
      text += pageText + "\n";
    } else {
      // image-only page: render + OCR
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const { default: Tesseract } = await import("tesseract.js");
      onProgress?.(`OCR-ing page ${i}…`);
      const { data } = await Tesseract.recognize(canvas, "eng");
      text += data.text + "\n";
    }
  }
  return text;
}
