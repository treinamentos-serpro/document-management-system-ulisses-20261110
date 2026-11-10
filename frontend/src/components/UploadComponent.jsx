import { useState } from 'react';
import { uploadDocument } from '../services/documentService.js';

export default function UploadComponent({ owner, onUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    // event.currentTarget é limpo pelo React após o await, por isso é guardado antes.
    const form = event.currentTarget;
    if (!selectedFile) {
      setErrorMessage('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const document = await uploadDocument(selectedFile, owner);
      setSuccessMessage(`"${document.originalName}" enviado com sucesso.`);
      setSelectedFile(null);
      form.reset();
      onUploaded?.(document);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section>
      <h2>Enviar documento</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          name="file"
          onChange={(event) => setSelectedFile(event.target.files[0] || null)}
          disabled={isUploading}
        />
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {successMessage && <p role="status">{successMessage}</p>}
    </section>
  );
}
