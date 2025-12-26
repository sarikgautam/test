const pdfParse = require('pdf-parse').default || require('pdf-parse');
const fs = require('fs');

const dataBuffer = fs.readFileSync('./hhvsys.pdf');

pdfParse(dataBuffer).then(data => {
  console.log('=== PDF SCORECARD FORMAT ===\n');
  console.log(data.text);
}).catch(err => {
  console.error('Error:', err);
});
