/**
 * Opens a PDF Blob in a hidden iframe and triggers the browser print dialog.
 * Falls back to opening in a new tab when the iframe approach is blocked
 * (e.g. Firefox, which doesn't render PDFs inside iframes by default).
 *
 * @param {Blob} blob — PDF blob to print
 */
export function printPdfBlob(blob) {
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement('iframe');
  iframe.title = 'pdf-print';
  iframe.style.cssText =
    'position:fixed;visibility:hidden;top:0;left:0;width:1px;height:1px;border:none';
  document.body.appendChild(iframe);

  iframe.addEventListener('load', () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (_) {
      // Fallback: open in new tab so the user can print manually
      window.open(url, '_blank');
    }
  });

  iframe.src = url;

  // Clean up after print dialog (no reliable close event — use a long timeout)
  setTimeout(() => {
    try { document.body.removeChild(iframe); } catch (_) {}
    URL.revokeObjectURL(url);
  }, 120_000);
}
