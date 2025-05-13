const express = require('express');
const { 
  createAgent, 
  getAgents, 
  getAgentById, 
  updateAgent, 
  deleteAgent 
} = require('../controllers/agent');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// @route   POST /api/agents
// @desc    Create a new agent
// @access  Private (Admin only)
router.post('/', createAgent);

// @route   GET /api/agents
// @desc    Get all agents
// @access  Private (Admin only)
router.get('/', getAgents);

// @route   GET /api/agents/:id
// @desc    Get agent by ID
// @access  Private (Admin only)
router.get('/:id', getAgentById);

// @route   PUT /api/agents/:id
// @desc    Update agent
// @access  Private (Admin only)
router.put('/:id', updateAgent);

// @route   DELETE /api/agents/:id
// @desc    Delete agent
// @access  Private (Admin only)
router.delete('/:id', deleteAgent);

module.exports = router; 