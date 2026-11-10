// Metadados mantidos em memória nesta fase (RNF-02).
const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findById(id) {
  return documents.get(id) || null;
}

function findAllByOwner(owner) {
  return [...documents.values()].filter((document) => document.owner === owner);
}

module.exports = {
  save,
  findById,
  findAllByOwner,
};
