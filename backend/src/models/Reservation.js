const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  purpose: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  admin_notes: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

reservationSchema.index({ equipment_id: 1, status: 1, start_time: 1, end_time: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
