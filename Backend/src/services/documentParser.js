import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Pure extraction service: extracts raw text from supported files.
 * - Does NOT perform any AI reasoning or inference.
 * - Deterministic and testable.
 *
 * @param {{filePath:string, mimeType?:string, originalName?:string}} options
 * @returns {Promise<{text:string, mimeType?:string, originalName?:string}>}
 */
export async function extractTextFromFile({ filePath, mimeType, originalName } = {}) {
	if (!filePath) throw new Error('filePath is required');

	const ext = path.extname(filePath).toLowerCase();
	try {
		if (ext === '.pdf' || (mimeType && mimeType.includes('pdf'))) {
			const dataBuffer = await fs.readFile(filePath);
			const parsed = await pdfParse(dataBuffer);
			const text = parsed?.text || '';
			return { text, mimeType: 'application/pdf', originalName };
		}

		if (ext === '.docx' || ext === '.doc' || (mimeType && mimeType.includes('word'))) {
			const buffer = await fs.readFile(filePath);
			const res = await mammoth.extractRawText({ buffer });
			return { text: res.value || '', mimeType: mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', originalName };
		}

		// Fallback to plain text read
		const txt = await fs.readFile(filePath, { encoding: 'utf8' });
		return { text: txt, mimeType: mimeType || 'text/plain', originalName };
	} catch (err) {
		const e = new Error(`Failed to extract text: ${err.message}`);
		e.cause = err;
		throw e;
	}
}

export default { extractTextFromFile };
