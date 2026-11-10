import { useState } from 'react';
import { downloadDocument } from '../services/documentService.js';

// Dispara o download no navegador a partir do conteúdo recebido.
function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function DownloadButton({ documentId, fileName }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleClick() {
    setIsDownloading(true);
    setErrorMessage('');
    try {
      const blob = await downloadDocument(documentId);
      saveBlob(blob, fileName);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {errorMessage && <span role="alert">{errorMessage}</span>}
    </>
  );
}
