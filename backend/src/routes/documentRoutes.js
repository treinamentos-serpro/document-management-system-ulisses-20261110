const express = require('express');
const documentController = require('../controllers/documentController');
const { handleUploadFile } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.post('/upload', handleUploadFile, documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;
