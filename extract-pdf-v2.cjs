const fs = require('fs');
const pdfjsLib = require('pdfjs-dist');

// Use a different worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

async function extractPDFText() {
  const fileBuffer = fs.readFileSync('./hhvsys.pdf');
  const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
  
  console.log('=== PDF SCORECARD FORMAT ===\n');
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join(' ');
    console.log(text);
    console.log('\n--- END OF PAGE ' + i + ' ---\n');
  }
}

extractPDFText().catch(err => console.error('Error:', err));
