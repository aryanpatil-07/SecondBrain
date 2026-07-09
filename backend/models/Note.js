const mongoose = require('mongoose');

const flowNodeSchema = new mongoose.Schema({
  id:    { type: String, required: true },
  label: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  isCurrent: { type: Boolean, default: false },
  parents: [String],
}, { _id: false });

const analysisSchema = new mongoose.Schema({
  score:       { type: Number, min: 0, max: 100, default: null },
  level:       { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: null },
  summary:     { type: String, default: '' },
  strengths:   [String],
  gaps:        [String],
  currentNode: { type: String, default: '' },
  nodes:       [flowNodeSchema],
  analyzedAt:  { type: Date, default: null },
}, { _id: false });

const noteSchema = new mongoose.Schema({
  title:            { type: String, required: true },
  content:          { type: String, default: '' },
  tags:             [String],
  sourceType:       { type: String, enum: ['text', 'image'], default: 'text' },
  imagePath:        { type: String, default: '' },
  imageUrl:         { type: String, default: '' },
  originalFilename: { type: String, default: '' },
  processingStatus: { type: String, enum: ['pending', 'processed', 'needs_review'], default: 'processed' },
  ocrText:          { type: String, default: '' },
  ocrBlocks:        { type: Array, default: [] },
  ocrConfidence:    { type: Number, default: null },
  aiDraft:          { type: String, default: '' },
  analysis:         { type: analysisSchema, default: null },
  createdAt:        { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
