import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');

const pdfParse =
  typeof pdfParseModule === 'function'
    ? pdfParseModule
    : typeof pdfParseModule?.default === 'function'
    ? pdfParseModule.default
    : typeof pdfParseModule?.pdfParse === 'function'
    ? pdfParseModule.pdfParse
    : null;

/**
 * @param {{buffer: Buffer, mimeType?: string, originalName?: string}} options
 * @returns {Promise<{text: string, mimeType?: string, originalName?: string}>}
 */
export async function extractTextFromBuffer({ buffer, mimeType, originalName } = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('A valid Buffer is required');
  }

  const ext = originalName
    ? originalName.slice(originalName.lastIndexOf('.')).toLowerCase()
    : '';

  try {
    // ── PDF ────────────────────────────────────────────────────────────────
    if (ext === '.pdf' || (mimeType && mimeType.includes('pdf'))) {
      if (!pdfParse) throw new Error('pdfParse module could not be initialised');
      const parsed = await pdfParse(buffer);
      return {
        text: parsed?.text || '',
        mimeType: 'application/pdf',
        originalName
      };
    }

    // ── DOCX / DOC ─────────────────────────────────────────────────────────
    if (
      ext === '.docx' ||
      ext === '.doc' ||
      (mimeType && mimeType.includes('word'))
    ) {
      const res = await mammoth.extractRawText({ buffer });
      return {
        text: res.value || '',
        mimeType:
          mimeType ||
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalName
      };
    }

    // ── Plain text / JSON fallback ─────────────────────────────────────────
    return {
      text: buffer.toString('utf8'),
      mimeType: mimeType || 'text/plain',
      originalName
    };
  } catch (err) {
    const e = new Error(`Failed to extract text from ${originalName || 'file'}: ${err.message}`);
    e.cause = err;
    throw e;
  }
}

export default { extractTextFromBuffer };