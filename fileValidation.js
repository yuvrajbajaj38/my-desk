export const MAX_PDF_BYTES = 50 * 1024 * 1024;

export const validatePdfFile = (file, { maxBytes = MAX_PDF_BYTES } = {}) => {
  if (!file) {
    return { ok: false, message: "No file selected." };
  }

  const name = String(file.name || "").toLowerCase();
  const type = String(file.type || "").toLowerCase();
  const looksLikePdf = type === "application/pdf" || name.endsWith(".pdf");

  if (!looksLikePdf) {
    return { ok: false, message: "Only PDF files are allowed." };
  }

  if (file.size <= 0) {
    return { ok: false, message: "The selected file is empty." };
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      message: `File size exceeds ${(maxBytes / 1024 / 1024).toFixed(0)} MB.`,
    };
  }

  return { ok: true, message: "" };
};
