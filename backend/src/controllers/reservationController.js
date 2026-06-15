const mongoose = require('mongoose');
const Equipment = require('../models/Equipment');
const Reservation = require('../models/Reservation');
const { checkBookingCollision } = require('../utils/collision');
const { formatReservation } = require('../utils/formatters');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

exports.createReservation = async (req, res) => {
  try {
    const { equipment_id, start_time, end_time, purpose } = req.body;
    if (!equipment_id || !start_time || !end_time || typeof purpose !== 'string' || !purpose.trim()) {
      return res.status(400).json({ error: 'Equipment, start time, end time, and purpose are required.' });
    }
    if (!isValidId(equipment_id)) return res.status(400).json({ error: 'Invalid equipment ID.' });

    const equipment = await Equipment.findById(equipment_id);
    if (!equipment) return res.status(404).json({ error: 'Equipment not found.' });
    if (equipment.status !== 'available') {
      return res.status(400).json({
        error: `Equipment is currently ${equipment.status.replace('_', ' ')} and cannot be reserved.`
      });
    }
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);
    if (!Number.isFinite(startTime.getTime()) || !Number.isFinite(endTime.getTime())) {
      return res.status(400).json({ error: 'Invalid reservation start or end time.' });
    }
    if (endTime - startTime > equipment.max_hours_per_slot * 60 * 60 * 1000) {
      return res.status(400).json({
        error: `Reservations cannot exceed ${equipment.max_hours_per_slot} hours for this equipment.`
      });
    }

    const collisionCheck = await checkBookingCollision(equipment_id, start_time, end_time);
    if (collisionCheck.hasConflict) {
      return res.status(409).json({
        error: collisionCheck.reason,
        details: collisionCheck.conflictingBooking
      });
    }

    const initialStatus = equipment.requires_approval ? 'pending' : 'approved';
    const reservation = await Reservation.create({
      user_id: req.user.id,
      equipment_id,
      start_time: startTime,
      end_time: endTime,
      purpose: purpose.trim(),
      status: initialStatus,
      admin_notes: equipment.requires_approval
        ? 'Awaiting technician approval'
        : 'Auto-approved by system'
    });

    return res.status(201).json({
      message: initialStatus === 'approved'
        ? 'Reservation confirmed and auto-approved!'
        : 'Reservation request submitted. Awaiting supervisor approval.',
      reservationId: String(reservation._id),
      status: initialStatus
    });
  } catch (err) {
    console.error('[Reservation Create Error]', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to create reservation.' });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const { status, equipmentId, userId, date, view } = req.query;
    const isStudent = req.user.role === 'student';
    const isScheduleView = isStudent && view === 'schedule';
    const filter = {};

    if (isScheduleView) {
      if (userId) {
        return res.status(403).json({ error: 'Schedule view does not support user filters.' });
      }
      if (status && !['pending', 'approved'].includes(status)) {
        return res.status(400).json({ error: 'Schedule view only includes active reservations.' });
      }
      filter.status = status || { $in: ['pending', 'approved'] };
    } else if (isStudent) {
      if (userId && userId !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own reservations.' });
      }
      filter.user_id = req.user.id;
    } else if (userId) {
      if (!isValidId(userId)) return res.status(400).json({ error: 'Invalid user ID.' });
      filter.user_id = userId;
    }
    if (status && !isScheduleView) filter.status = status;
    if (equipmentId) {
      if (!isValidId(equipmentId)) return res.status(400).json({ error: 'Invalid equipment ID.' });
      filter.equipment_id = equipmentId;
    }
    if (date) {
      const dayStart = new Date(date);
      if (!Number.isFinite(dayStart.getTime())) {
        return res.status(400).json({ error: 'Invalid reservation date.' });
      }
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      filter.start_time = { $lt: dayEnd };
      filter.end_time = { $gt: dayStart };
    }

    let reservationQuery = Reservation.find(filter).populate({
      path: 'equipment_id',
      select: 'name model category lab_id',
      populate: { path: 'lab_id', select: 'name code' }
    });
    if (!isScheduleView) {
      reservationQuery = reservationQuery.populate('user_id', 'name email');
    }
    const reservations = await reservationQuery.sort({ start_time: -1 }).lean();
    const formattedReservations = reservations.map(formatReservation);
    return res.json({
      reservations: isScheduleView
        ? formattedReservations.map((reservation) => ({
          id: reservation.id,
          equipment_name: reservation.equipment_name,
          start_time: reservation.start_time,
          end_time: reservation.end_time,
          status: reservation.status
        }))
        : formattedReservations
    });
  } catch (err) {
    console.error('[Get Reservations Error]', err);
    return res.status(500).json({ error: 'Failed to fetch reservations.' });
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid reservation ID.' });
    if (!['approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid reservation status.' });
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });

    if (req.user.role === 'student') {
      if (String(reservation.user_id) !== req.user.id) {
        return res.status(403).json({ error: 'You can only cancel your own reservations.' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ error: 'Students are only permitted to cancel reservations.' });
      }
      if (!['pending', 'approved'].includes(reservation.status)) {
        return res.status(409).json({ error: 'Only pending or approved reservations can be cancelled.' });
      }
    }

    reservation.status = status;
    reservation.admin_notes = admin_notes || `Status updated to ${status}`;
    await reservation.save();
    return res.json({ message: `Reservation status updated to ${status}.` });
  } catch (err) {
    console.error('[Reservation Status Error]', err);
    return res.status(500).json({ error: 'Failed to update reservation status.' });
  }
};

exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, purpose } = req.body;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid reservation ID.' });

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });
    if (req.user.role === 'student') {
      if (String(reservation.user_id) !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your own reservations.' });
      }
      if (reservation.status !== 'pending') {
        return res.status(403).json({ error: 'Only pending reservations can be edited. Cancel approved reservations instead.' });
      }
    } else if (!['pending', 'approved'].includes(reservation.status)) {
      return res.status(400).json({ error: 'Only pending or approved reservations can be edited.' });
    }

    const nextStartTime = start_time === undefined ? reservation.start_time : new Date(start_time);
    const nextEndTime = end_time === undefined ? reservation.end_time : new Date(end_time);
    const nextPurpose = purpose === undefined ? reservation.purpose : purpose;
    if (!Number.isFinite(nextStartTime.getTime()) || !Number.isFinite(nextEndTime.getTime())) {
      return res.status(400).json({ error: 'Invalid reservation start or end time.' });
    }
    if (typeof nextPurpose !== 'string' || !nextPurpose.trim()) {
      return res.status(400).json({ error: 'Reservation purpose is required.' });
    }

    const equipment = await Equipment.findById(reservation.equipment_id);
    if (!equipment) return res.status(404).json({ error: 'Equipment not found.' });
    if (nextEndTime - nextStartTime > equipment.max_hours_per_slot * 60 * 60 * 1000) {
      return res.status(400).json({
        error: `Reservations cannot exceed ${equipment.max_hours_per_slot} hours for this equipment.`
      });
    }

    const collisionCheck = await checkBookingCollision(
      reservation.equipment_id,
      nextStartTime,
      nextEndTime,
      reservation._id
    );
    if (collisionCheck.hasConflict) {
      return res.status(409).json({
        error: collisionCheck.reason,
        details: collisionCheck.conflictingBooking
      });
    }

    reservation.start_time = nextStartTime;
    reservation.end_time = nextEndTime;
    reservation.purpose = nextPurpose.trim();
    await reservation.save();
    return res.json({ message: 'Reservation updated successfully.' });
  } catch (err) {
    console.error('[Reservation Update Error]', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to update reservation.' });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid reservation ID.' });

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });
    if (req.user.role === 'student' && String(reservation.user_id) !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reservations.' });
    }
    if (['pending', 'approved'].includes(reservation.status)) {
      return res.status(409).json({ error: 'Cancel or reject an active reservation before deleting it.' });
    }

    await reservation.deleteOne();
    return res.json({ message: 'Reservation deleted successfully.' });
  } catch (err) {
    console.error('[Reservation Delete Error]', err);
    return res.status(500).json({ error: 'Failed to delete reservation.' });
  }
};
