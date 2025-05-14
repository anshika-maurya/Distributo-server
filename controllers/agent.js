const Agent = require('../models/Agent');

exports.createAgent = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, mobile, and password'
      });
    }

    
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: 'An agent with this email already exists'
      });
    }

    
    const agent = await Agent.create({
      name,
      email,
      mobile,
      password
    });

    
    res.status(201).json({
      success: true,
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        mobile: agent.mobile
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};


exports.getAgents = async (req, res) => {
  try {
    
    const agents = await Agent.find().select('-password');

    res.status(200).json({
      success: true,
      count: agents.length,
      agents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};


exports.getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).select('-password');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    res.status(200).json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};


exports.updateAgent = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;
    
    // Find agent by ID
    let agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    
    agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { name, email, mobile },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};


exports.deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    await agent.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
}; 