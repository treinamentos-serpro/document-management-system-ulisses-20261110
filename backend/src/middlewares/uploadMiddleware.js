const multer = require('multer');
const { MAX_FILE_SIZE } = require('../config/env');
const fileStorage = require('../repositories/fileStorage');

const upload = multer({
  storage: fileStorage.diskStorage,
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
