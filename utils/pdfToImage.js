// utils/pdfToImage.js
import { PDFExtract } from 'pdf-poppler';
import path from 'path';
import fs from 'fs';

export async function convertPDFToImage(pdfPath) {
    const outputDir = path.join(process.cwd(), 'public/images');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const pdfExtract = new PDFExtract();
    const options = { scale: 600, outputDir };

    await pdfExtract.extract(pdfPath, options);

    // Hier kun je de gegenereerde afbeelding(en) verplaatsen naar Firebase Storage
    const imagePaths = fs.readdirSync(outputDir).map(file => path.join('/images', file));
    return imagePaths;
}
