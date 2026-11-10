const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { STORAGE_DIR } = require('../config/env');

function ensureStorageDir() {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Retorna null se o caminho escapar do diretório de armazenamento (ex.: "../").
function resolveFilePath(storedName) {
  const filePath = path.resolve(STORAGE_DIR, storedName);
  return filePath.startsWith(STORAGE_DIR + path.sep) ? filePath : null;
}

async function fileExists(filePath) {
  try {
    await fsp.access(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  ensureStorageDir,
  resolveFilePath,
  fileExists,
};
