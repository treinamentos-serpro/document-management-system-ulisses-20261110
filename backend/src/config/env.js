const path = require('node:path');

const DEFAULT_STORAGE_DIR = path.resolve(__dirname, '../../storage');
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  STORAGE_DIR: path.resolve(process.env.STORAGE_DIR || DEFAULT_STORAGE_DIR),
  MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE) || DEFAULT_MAX_FILE_SIZE,
};
