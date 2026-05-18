const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  lab_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  model: { type: String, default: 'Standard' },
  serial_number: { type: String, required: true, unique: true, trim: true },
  status: { type: String, enum: ['available', 'maintenance', 'out_of_order'], default: 'available' },
  requires_approval: { type: Boolean, default: false },
  max_hours_per_slot: { type: Number, default: 4 },
  description: { type: String, default: '' },
  specs: { type: String, default: '' },
  image_url: { type: String, default: '' }
});

module.exports = mongoose.model('Equipment', equipmentSchema);
