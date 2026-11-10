import { useEffect, useState } from 'react';
import { listDocuments } from '../services/documentService.js';
import DownloadButton from './DownloadButton.jsx';

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;

function formatFileSize(bytes) {
  if (bytes < BYTES_PER_KB) {
    return `${bytes} B`;
  }
  if (bytes < BYTES_PER_MB) {
    return `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;
  }
  return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
}

function formatUploadDate(isoDate) {
  return new Date(isoDate).toLocaleString('pt-BR');
}

// refreshKey é incrementado pelo pai para recarregar a lista após um envio.
export default function DocumentList({ owner, refreshKey }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await listDocuments(owner);
        if (isCurrent) {
          setDocuments(data);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(error.message);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, [owner, refreshKey]);

  if (isLoading) {
    return <p>Carregando documentos...</p>;
  }

  if (errorMessage) {
    return <p role="alert">{errorMessage}</p>;
  }

  if (documents.length === 0) {
    return <p>Nenhum documento encontrado.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Tamanho</th>
          <th>Enviado em</th>
          <th>Dono</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((item) => (
          <tr key={item.id}>
            <td>{item.originalName}</td>
            <td>{formatFileSize(item.size)}</td>
            <td>{formatUploadDate(item.uploadedAt)}</td>
            <td>{item.owner}</td>
            <td>
              <DownloadButton documentId={item.id} fileName={item.originalName} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
