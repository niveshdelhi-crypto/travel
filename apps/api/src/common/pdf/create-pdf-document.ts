import type PDFKit from "pdfkit";

type PdfDocumentOptions = ConstructorParameters<typeof PDFKit>[0];
type PdfDocumentInstance = InstanceType<typeof PDFKit>;

/**
 * pdfkit is CommonJS (`module.exports = PDFDocument`). With `import PDFDocument from "pdfkit"`
 * TypeScript emits `new pdfkit_1.default()` which throws "default is not a constructor".
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocumentCtor = require("pdfkit") as new (
  options?: PdfDocumentOptions,
) => PdfDocumentInstance;

export function createPdfDocument(options?: PdfDocumentOptions): PdfDocumentInstance {
  return new PDFDocumentCtor(options);
}
