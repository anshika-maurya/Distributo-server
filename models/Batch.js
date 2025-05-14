const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  
  batchId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  filename: {
    type: String,
    trim: true
  },
  itemCount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  distribution: {
    agentsUsed: Number,
    baseItemsPerAgent: Number,
    agentsWithExtraItem: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Add index for faster queries
batchSchema.index({ status: 1, createdAt: -1 });

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch; 