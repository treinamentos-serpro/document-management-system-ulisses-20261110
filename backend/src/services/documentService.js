const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');
const fileStorage = require('../repositories/fileStorage');
const { DEFAULT_OWNER } = require('../config/constants');

const DEFAULT_MIME_TYPE = 'application/octet-stream';

function resolveOwner(ownerHeader) {
  return (ownerHeader || '').trim() || DEFAULT_OWNER;
}

// Lista de inclusão: campos internos (como storedName) nunca saem desta camada.
function toPublicMetadata({ id, originalName, size, uploadedAt, owner, mimeType }) {
  return { id, originalName, size, uploadedAt, owner, mimeType };
}

// file é um DTO já convertido pela borda HTTP: { originalName, size, mimeType, storedName }.
function createDocument({ file, owner }) {
  const document = {
    id: randomUUID(),
    originalName: file.originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: resolveOwner(owner),
    mimeType: file.mimeType || DEFAULT_MIME_TYPE,
    storedName: file.storedName,
  };

  documentRepository.save(document);
  return toPublicMetadata(document);
}

function listDocuments(owner) {
  return documentRepository
    .findAllByOwner(resolveOwner(owner))
    .map(toPublicMetadata);
}

// Retorna null quando o documento não existe, pertence a outro dono ou o arquivo sumiu do disco.
async function getDownloadableDocument(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== resolveOwner(owner)) {
    return null;
  }

  const filePath = fileStorage.resolveFilePath(document.storedName);
  if (!filePath || !(await fileStorage.fileExists(filePath))) {
    return null;
  }

  return { metadata: toPublicMetadata(document), filePath };
}


module.exports = {
  createDocument,
  listDocuments,
  getDownloadableDocument,
};
