const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');
const fileStorage = require('../repositories/fileStorage');

const DEFAULT_OWNER = 'anonimo';
const DEFAULT_MIME_TYPE = 'application/octet-stream';

function resolveOwner(ownerHeader) {
  const owner = typeof ownerHeader === 'string' ? ownerHeader.trim() : '';
  return owner || DEFAULT_OWNER;
}

// storedName é interno e não é exposto na API.
function toPublicMetadata({ storedName, ...metadata }) {
  return metadata;
}

// O multer decodifica o nome original como latin1; reinterpreta como UTF-8.
function decodeOriginalName(originalName) {
  return Buffer.from(originalName, 'latin1').toString('utf8');
}

function createDocument({ file, ownerHeader }) {
  const document = {
    id: randomUUID(),
    originalName: decodeOriginalName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: resolveOwner(ownerHeader),
    mimeType: file.mimetype || DEFAULT_MIME_TYPE,
    storedName: file.filename,
  };

  documentRepository.save(document);
  return toPublicMetadata(document);
}

function listDocuments(ownerHeader) {
  return documentRepository
    .findAllByOwner(resolveOwner(ownerHeader))
    .map(toPublicMetadata);
}

// Retorna null quando o documento não existe ou o arquivo sumiu do disco.
async function getDownloadableDocument(id) {
  const document = documentRepository.findById(id);
  if (!document) {
    return null;
  }

  const filePath = fileStorage.resolveFilePath(document.storedName);
  if (!(await fileStorage.fileExists(filePath))) {
    return null;
  }

  return { metadata: toPublicMetadata(document), filePath };
}

module.exports = {
  createDocument,
  listDocuments,
  getDownloadableDocument,
};
