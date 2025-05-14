const express = require('express');
const { 
  uploadAndDistributeList, 
  getListsByAgent, 
  getBatches, 
  getListItemsByBatch,
  updateBatchStatus,
  deleteBatch
} = require('../controllers/list');
const { requireAuth } = require('../middlewares/auth');
const { handleUploadErrors } = require('../middlewares/upload');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);


router.post('/upload', handleUploadErrors, uploadAndDistributeList);


router.get('/agent/:agentId', getListsByAgent);


router.get('/batches', getBatches);


router.get('/batch/:batchId', getListItemsByBatch);


router.put('/batch/:batchId/status', updateBatchStatus);


router.delete('/batch/:batchId', deleteBatch);

module.exports = router; 