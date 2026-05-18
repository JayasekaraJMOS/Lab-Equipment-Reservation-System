const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  location: { type: String, required: true },
  building: { type: String, required: true },
  supervisor: { type: String, default: '' }
});

module.exports = mongoose.model('Lab', labSchema);
