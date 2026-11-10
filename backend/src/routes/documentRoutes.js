const express = require('express');
const documentController = require('../controllers/documentController');
const { handleUploadFile } = require('../middlewares/uploadMiddleware');
const { validateOwnerHeader } = require('../middlewares/ownerHeaderMiddleware');

const router = express.Router();

// Valida o dono antes do upload, para não gravar arquivo de uma requisição rejeitada.
router.use(validateOwnerHeader);
router.post('/upload', handleUploadFile, documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;
