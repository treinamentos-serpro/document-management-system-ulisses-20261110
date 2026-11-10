const documentService = require('../services/documentService');
const { OWNER_HEADER } = require('../config/constants');

// O multer entrega o nome original como latin1; a borda HTTP reinterpreta como UTF-8.
function decodeOriginalName(originalName) {
  return Buffer.from(originalName, 'latin1').toString('utf8');
}

function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado. Envie o arquivo no campo "file".' });
  }

  const document = documentService.createDocument({
    file: {
      originalName: decodeOriginalName(req.file.originalname),
      size: req.file.size,
      mimeType: req.file.mimetype,
      storedName: req.file.filename,
    },
    owner: req.get(OWNER_HEADER),
  });
  return res.status(201).json(document);
}

function listDocuments(req, res) {
  const documents = documentService.listDocuments(req.get(OWNER_HEADER));
  return res.json(documents);
}

async function downloadDocument(req, res) {
  const downloadable = await documentService.getDownloadableDocument(
    req.params.id,
    req.get(OWNER_HEADER),
  );
  if (!downloadable) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  const { metadata, filePath } = downloadable;
  res.attachment(metadata.originalName);
  res.type(metadata.mimeType);
  return res.sendFile(filePath, (error) => {
    if (error && !res.headersSent) {
      // Remove os cabeçalhos de arquivo para não contaminar a resposta de erro JSON.
      res.removeHeader('Content-Disposition');
      res.removeHeader('Content-Type');
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
