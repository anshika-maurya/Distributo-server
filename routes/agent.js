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


router.post('/', createAgent);


router.get('/', getAgents);




router.get('/:id', getAgentById);


router.put('/:id', updateAgent);


router.delete('/:id', deleteAgent);

module.exports = router; 