const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  technician_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issue_description: { type: String, required: true },
  action_taken: { type: String, default: '' },
  status: { type: String, enum: ['under_repair', 'resolved'], default: 'under_repair' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
