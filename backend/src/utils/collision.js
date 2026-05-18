const Reservation = require('../models/Reservation');

async function checkBookingCollision(equipmentId, startTimeISO, endTimeISO, excludeReservationId = null) {
  const reqStart = new Date(startTimeISO).getTime();
  const reqEnd = new Date(endTimeISO).getTime();

  if (!Number.isFinite(reqStart) || !Number.isFinite(reqEnd)) {
    return { hasConflict: true, reason: 'Invalid start or end time format.' };
  }
  if (reqStart >= reqEnd) {
    return { hasConflict: true, reason: 'Reservation start time must be earlier than end time.' };
  }
  if (reqStart < Date.now()) {
    return { hasConflict: true, reason: 'Cannot create reservations in the past.' };
  }

  const query = {
    equipment_id: equipmentId,
    status: { $in: ['pending', 'approved'] }
  };
  if (excludeReservationId) query._id = { $ne: excludeReservationId };

  const existingBookings = await Reservation.find(query)
    .select('start_time end_time status user_id')
    .lean();
  const bufferMs = 15 * 60 * 1000;

  for (const booking of existingBookings) {
    const existingStart = new Date(booking.start_time).getTime() - bufferMs;
    const existingEnd = new Date(booking.end_time).getTime() + bufferMs;
    if (reqStart < existingEnd && reqEnd > existingStart) {
      return {
        hasConflict: true,
        reason: `Time slot conflicts with an existing ${booking.status} reservation (${new Date(booking.start_time).toLocaleTimeString()} - ${new Date(booking.end_time).toLocaleTimeString()}). A 15-minute buffer between slots is enforced.`,
        conflictingBooking: {
          id: String(booking._id),
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          user_id: String(booking.user_id)
        }
      };
    }
  }

  return { hasConflict: false };
}

module.exports = { checkBookingCollision };
