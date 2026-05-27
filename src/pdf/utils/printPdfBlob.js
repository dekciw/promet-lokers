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
      window.open(url, '_blank');
    }
  });

  iframe.src = url;

  setTimeout(() => {
    try { document.body.removeChild(iframe); } catch (_) {}
    URL.revokeObjectURL(url);
  }, 120_000);
}
