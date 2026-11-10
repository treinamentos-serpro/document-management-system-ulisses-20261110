const { randomUUID } = require('node:crypto');
const multer = require('multer');
const { MAX_FILE_SIZE, STORAGE_DIR } = require('../config/env');

// Nome em disco gerado por UUID: não colide e não expõe o nome original.
const diskStorage = multer.diskStorage({
  destination: STORAGE_DIR,
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_FILE_SIZE },
});

const receiveSingleFile = upload.single('file');

// Converte erros do multer em respostas HTTP no formato { error }.
function handleUploadFile(req, res, next) {
  receiveSingleFile(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'O arquivo excede o tamanho máximo permitido.' });
      }
      return res.status(400).json({ error: 'Envie um único arquivo no campo "file".' });
    }

    console.error('Falha ao gravar o arquivo enviado:', error);
    return res.status(500).json({ error: 'Não foi possível gravar o arquivo.' });
  });
}

module.exports = {
  handleUploadFile,
};
