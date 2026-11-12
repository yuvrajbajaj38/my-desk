import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

export class PdfExtractionError extends Error {
  constructor(message, code = "unknown") {
    super(message);
    this.name = "PdfExtractionError";
    this.code = code;
  }
}

export const SCANNED_PDF_MESSAGE =
  "This PDF has no selectable text, so it looks scanned or image-only. OCR did not run. Retry with a text-based PDF, or use the server parser once OCR is configured.";

export const extractPdfText = async (file, { maxPages = 80 } = {}) => {
  if (!file) {
    throw new PdfExtractionError("No PDF file was provided.", "missing");
  }

  const data = await file.arrayBuffer();
  const pdf = await getDocument({ data }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
    if (text) pages.push(text);
  }

  const fullText = pages.join("\n");
  if (!fullText.trim()) {
    throw new PdfExtractionError(SCANNED_PDF_MESSAGE, "scanned");
  }

  return {
    text: fullText,
    pageCount: pdf.numPages,
    extractedPages: pageCount,
    selectableText: true,
  };
};
