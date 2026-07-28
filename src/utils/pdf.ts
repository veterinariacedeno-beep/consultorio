export async function downloadPdf(element: HTMLElement, filename: string): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;
  const options = {
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };
  await html2pdf().set(options).from(element).save();
}
