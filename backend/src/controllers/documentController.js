const documentService = require('../services/documentService');

function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado. Envie o arquivo no campo "file".' });
  }

  const document = documentService.createDocument({
    file: req.file,
    ownerHeader: req.get('X-User-Id'),
  });
  return res.status(201).json(document);
}

function listDocuments(req, res) {
  const documents = documentService.listDocuments(req.get('X-User-Id'));
  return res.json(documents);
}

async function downloadDocument(req, res) {
  const downloadable = await documentService.getDownloadableDocument(req.params.id);
  if (!downloadable) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  const { metadata, filePath } = downloadable;
  res.attachment(metadata.originalName);
  res.type(metadata.mimeType);
  return res.sendFile(filePath, (error) => {
    if (error && !res.headersSent) {
      const status = error.status || 500;
      const message = status === 404
        ? 'Arquivo não encontrado.'
        : 'Não foi possível ler o arquivo.';
      res.status(status).json({ error: message });
    }
  });
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};
