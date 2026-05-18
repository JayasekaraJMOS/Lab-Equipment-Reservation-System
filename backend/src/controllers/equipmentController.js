const mongoose = require('mongoose');
const Lab = require('../models/Lab');
const Equipment = require('../models/Equipment');
const Reservation = require('../models/Reservation');
const MaintenanceLog = require('../models/MaintenanceLog');
const { formatLab, formatEquipment } = require('../utils/formatters');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

exports.getAllLabs = async (req, res) => {
  try {
    const labs = await Lab.find().sort({ name: 1 }).lean();
    return res.json({ labs: labs.map(formatLab) });
  } catch (err) {
    console.error('[Labs Error]', err);
    return res.status(500).json({ error: 'Failed to fetch labs.' });
  }
};

exports.getAllEquipment = async (req, res) => {
  try {
    const { category, labId, status, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (labId) {
      if (!isValidId(labId)) return res.status(400).json({ error: 'Invalid lab ID.' });
      filter.lab_id = labId;
    }
    if (search) {
      const escapedSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearch, 'i');
      filter.$or = [{ name: regex }, { model: regex }, { specs: regex }];
    }

    const equipment = await Equipment.find(filter)
      .populate('lab_id', 'name code location supervisor')
      .sort({ name: 1 })
      .lean();
    return res.json({ equipment: equipment.map(formatEquipment) });
  } catch (err) {
    console.error('[Equipment Fetch Error]', err);
    return res.status(500).json({ error: 'Failed to fetch equipment catalog.' });
  }
};

exports.getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid equipment ID.' });

    const equipment = await Equipment.findById(id)
      .populate('lab_id', 'name code location supervisor')
      .lean();
    if (!equipment) return res.status(404).json({ error: 'Equipment not found.' });

    const activeReservations = await Reservation.find({
      equipment_id: id,
      status: { $in: ['pending', 'approved'] }
    }).populate('user_id', 'name').sort({ start_time: 1 }).lean();

    return res.json({
      equipment: formatEquipment(equipment),
      activeReservations: activeReservations.map((reservation) => ({
        id: String(reservation._id),
        start_time: reservation.start_time,
        end_time: reservation.end_time,
        status: reservation.status,
        reserved_by: reservation.user_id ? reservation.user_id.name : 'Unknown User'
      }))
    });
  } catch (err) {
    console.error('[Equipment Details Error]', err);
    return res.status(500).json({ error: 'Failed to fetch equipment details.' });
  }
};

exports.createEquipment = async (req, res) => {
  try {
    const {
      lab_id,
      name,
      category,
      model,
      serial_number,
      status,
      requires_approval,
      max_hours_per_slot,
      description,
      specs,
      image_url
    } = req.body;

    if (!lab_id || !name || !category || !serial_number) {
      return res.status(400).json({ error: 'Lab, name, category, and serial number are required.' });
    }
    if (!isValidId(lab_id)) return res.status(400).json({ error: 'Invalid lab ID.' });
    if (!await Lab.exists({ _id: lab_id })) return res.status(404).json({ error: 'Lab not found.' });

    const equipment = await Equipment.create({
      lab_id,
      name,
      category,
      model: model || 'Standard',
      serial_number,
      status: status || 'available',
      requires_approval: requires_approval === true
        || requires_approval === 1
        || requires_approval === '1'
        || requires_approval === 'true',
      max_hours_per_slot: Number(max_hours_per_slot) || 4,
      description: description || '',
      specs: specs || '',
      image_url: image_url || '/equipment/lab-instrument.svg'
    });

    return res.status(201).json({
      message: 'Equipment added successfully',
      equipmentId: String(equipment._id)
    });
  } catch (err) {
    console.error('[Equipment Create Error]', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Equipment with this serial number already exists.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to add new equipment.' });
  }
};

exports.updateEquipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, issue_description } = req.body;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid equipment ID.' });
    if (!['available', 'maintenance', 'out_of_order'].includes(status)) {
      return res.status(400).json({ error: 'Invalid equipment status.' });
    }

    const equipment = await Equipment.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found.' });

    if (status === 'maintenance' && issue_description) {
      await MaintenanceLog.create({
        equipment_id: equipment._id,
        technician_id: req.user.id,
        issue_description,
        status: 'under_repair'
      });
    }
    return res.json({ message: `Equipment status updated to ${status}.` });
  } catch (err) {
    console.error('[Equipment Status Error]', err);
    return res.status(500).json({ error: 'Failed to update equipment status.' });
  }
};
