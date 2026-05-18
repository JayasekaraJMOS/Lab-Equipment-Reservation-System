const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Reservation = require('../models/Reservation');
const seedDatabase = require('../models/seed');

async function countByField(Model, field, values) {
  const rows = await Model.aggregate([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } }
  ]);
  return Object.fromEntries(values.map((value) => [
    value,
    rows.find((row) => row._id === value)?.count || 0
  ]));
}

exports.getAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalEquipment, totalReservations, equipmentByStatus, reservationsByStatus, recent] =
      await Promise.all([
        User.countDocuments(),
        Equipment.countDocuments(),
        Reservation.countDocuments(),
        countByField(Equipment, 'status', ['available', 'maintenance', 'out_of_order']),
        countByField(Reservation, 'status', ['pending', 'approved', 'rejected', 'completed', 'cancelled']),
        Reservation.find()
          .populate('equipment_id', 'name')
          .populate('user_id', 'name')
          .sort({ created_at: -1 })
          .limit(5)
          .lean()
      ]);

    const activeReservationsCount = reservationsByStatus.approved + reservationsByStatus.pending;
    const utilizationRate = totalEquipment > 0
      ? Math.round((activeReservationsCount / totalEquipment) * 100)
      : 0;

    return res.json({
      summary: {
        totalUsers,
        totalEquipment,
        totalReservations,
        utilizationRate,
        pendingApprovals: reservationsByStatus.pending,
        underMaintenance: equipmentByStatus.maintenance
      },
      equipmentByStatus,
      reservationsByStatus,
      recentActivity: recent.map((reservation) => ({
        id: String(reservation._id),
        equipment: reservation.equipment_id ? reservation.equipment_id.name : 'Unknown Equipment',
        user: reservation.user_id ? reservation.user_id.name : 'Unknown User',
        status: reservation.status,
        startTime: reservation.start_time,
        endTime: reservation.end_time
      }))
    });
  } catch (err) {
    console.error('[Analytics Error]', err);
    return res.status(500).json({ error: 'Failed to fetch analytics metrics.' });
  }
};

exports.reseedData = async (req, res) => {
  try {
    await seedDatabase({ reset: true });
    return res.json({ message: 'Database reset and re-seeded with original sample data.' });
  } catch (err) {
    console.error('[Database Reseed Error]', err);
    return res.status(500).json({ error: 'Failed to reset database.' });
  }
};
