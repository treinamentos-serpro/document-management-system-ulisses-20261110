const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const { STORAGE_DIR } = require('../config/env');

// Nome em disco gerado por UUID: não colide e não expõe o nome original.
const diskStorage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(STORAGE_DIR, { recursive: true }, (error) => callback(error, STORAGE_DIR));
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

function resolveFilePath(storedName) {
  return path.join(STORAGE_DIR, storedName);
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
  diskStorage,
  resolveFilePath,
  fileExists,
};
