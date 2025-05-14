const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const Agent = require('../models/Agent');
const ListItem = require('../models/ListItem');
const Batch = require('../models/Batch');

// Helper to process Excel files (XLSX, XLS)
const processExcelFile = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
};


exports.uploadAndDistributeList = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    console.log('File uploaded:', req.file.path);
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    // Generate a unique batch ID
    const batchId = uuidv4();
    
    // Parse file based on extension
    let data = [];
    try {
      if (fileExt === '.csv') {
        data = await csv().fromFile(filePath);
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        data = processExcelFile(filePath);
      }
      console.log(`Parsed file data: ${data.length} items found`);
    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(400).json({
        success: false,
        message: `Error parsing file: ${parseError.message}`
      });
    }

    // Validate data structure
    const isValidData = data.length > 0 && data.every(item => 
      item.FirstName !== undefined && 
      item.Phone !== undefined && 
      item.Notes !== undefined
    );

    if (!isValidData) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      
      console.log('Invalid file format. Expected columns not found:', data.length > 0 ? Object.keys(data[0]) : 'No data');
      
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. File must contain FirstName, Phone, and Notes columns'
      });
    }

    // Get all active agents
    const agents = await Agent.find().select('_id name');
    console.log(`Found ${agents.length} agents in the system`);
    
    if (agents.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      
      return res.status(400).json({
        success: false,
        message: 'No agents found. Please add agents before uploading a list'
      });
    }

    // Check if we have at least 5 agents
    if (agents.length < 5) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      
      return res.status(400).json({
        success: false,
        message: `Need at least 5 agents for distribution. You currently have ${agents.length} agent(s). Please add ${5 - agents.length} more agent(s).`
      });
    }

    // Take only the first 5 agents for distribution
    const selectedAgents = agents.slice(0, 5);
    
    // Calculate items per agent (base distribution)
    const itemsPerAgent = Math.floor(data.length / 5);
    const remainingItems = data.length % 5;
    
    let itemsToSave = [];
    let startIndex = 0;
    
    // Distribute items to 5 agents
    for (let i = 0; i < 5; i++) {
      // Calculate items for this agent:
      // - Base items for all agents (itemsPerAgent)
      // - Plus one extra item for the first 'remainingItems' agents
      const extraItem = i < remainingItems ? 1 : 0;
      const itemCount = itemsPerAgent + extraItem;
      
      // Get this agent's portion of the data
      const agentItems = data.slice(startIndex, startIndex + itemCount);
      
      // Create list items for this agent
      const agentListItems = agentItems.map(item => ({
        firstName: item.FirstName,
        phone: item.Phone,
        notes: item.Notes,
        agent: selectedAgents[i]._id,
        batchId
      }));
      
      itemsToSave = [...itemsToSave, ...agentListItems];
      startIndex += itemCount;
    }
    
    // Save all list items to database
    await ListItem.insertMany(itemsToSave);
    
    // Create a new Batch record
    await Batch.create({
      batchId,
      filename: req.file.originalname,
      itemCount: data.length,
      status: 'active',
      distribution: {
        agentsUsed: 5,
        baseItemsPerAgent: itemsPerAgent,
        agentsWithExtraItem: remainingItems
      }
    });
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Return success with distribution summary
    res.status(200).json({
      success: true,
      message: 'List uploaded and distributed successfully',
      batchId,
      totalItems: data.length,
      distribution: {
        agentsUsed: 5,
        baseItemsPerAgent: itemsPerAgent,
        agentsWithExtraItem: remainingItems,
        distributionDetails: [
          ...Array(5).fill().map((_, i) => ({
            agentIndex: i + 1,
            itemCount: itemsPerAgent + (i < remainingItems ? 1 : 0)
          }))
        ]
      }
    });
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};


exports.updateBatchStatus = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { status } = req.body;
    
    if (!['active', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be one of: active, completed, archived'
      });
    }
    
    // Find the batch
    const batch = await Batch.findOne({ batchId });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    // Update batch status
    batch.status = status;
    
    // If status is completed or archived, set completedAt date
    if (status === 'completed' || status === 'archived') {
      batch.completedAt = new Date();
    } else {
      batch.completedAt = undefined;
    }
    
    await batch.save();
    
    res.status(200).json({
      success: true,
      message: `Batch status updated to ${status}`,
      batch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};


exports.deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Find the batch
    const batch = await Batch.findOne({ batchId });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    // Get count of non-completed items
    const activeItemsCount = await ListItem.countDocuments({ 
      batchId, 
      status: { $ne: 'completed' } 
    });
    
    if (activeItemsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete batch with ${activeItemsCount} active items. Complete all tasks or update their status first.`
      });
    }
    
    // Delete all list items in the batch
    await ListItem.deleteMany({ batchId });
    
    // Delete the batch record
    await Batch.deleteOne({ batchId });
    
    res.status(200).json({
      success: true,
      message: `Batch and all related items deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};


exports.getBatches = async (req, res) => {
  try {
    // Get filter parameters
    const { status } = req.query;
    const filter = {};
    
    // Apply status filter if provided
    if (status && ['active', 'completed', 'archived'].includes(status)) {
      filter.status = status;
    }
    
    // Get batches
    const batches = await Batch.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: batches.length,
      batches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};



exports.getListsByAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Check if agent exists
    const agent = await Agent.findById(agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Get all lists for the agent
    const lists = await ListItem.find({ agent: agentId });
    
    res.status(200).json({
      success: true,
      count: lists.length,
      lists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};


exports.getListItemsByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Get all list items for the batch with agent info
    const listItems = await ListItem.find({ batchId }).populate('agent', 'name email mobile');
    
    if (listItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    res.status(200).json({
      success: true,
      count: listItems.length,
      batchId,
      listItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
}; 