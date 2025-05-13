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

// @route   POST /api/lists/upload
// @desc    Upload and distribute list
// @access  Private (Admin only)
router.post('/upload', handleUploadErrors, uploadAndDistributeList);

// @route   GET /api/lists/agent/:agentId
// @desc    Get lists by agent
// @access  Private (Admin only)
router.get('/agent/:agentId', getListsByAgent);

// @route   GET /api/lists/batches
// @desc    Get all batches
// @access  Private (Admin only)
router.get('/batches', getBatches);

// @route   GET /api/lists/batch/:batchId
// @desc    Get list items by batch
// @access  Private (Admin only)
router.get('/batch/:batchId', getListItemsByBatch);

// @route   PUT /api/lists/batch/:batchId/status
// @desc    Update batch status
// @access  Private (Admin only)
router.put('/batch/:batchId/status', updateBatchStatus);

// @route   DELETE /api/lists/batch/:batchId
// @desc    Delete a batch and its list items
// @access  Private (Admin only)
router.delete('/batch/:batchId', deleteBatch);

module.exports = router; 