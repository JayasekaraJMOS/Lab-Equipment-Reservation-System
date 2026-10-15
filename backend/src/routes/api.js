const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const equipmentController = require('../controllers/equipmentController');
const reservationController = require('../controllers/reservationController');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// --- Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);

// --- Labs & Equipment Catalog Routes ---
router.get('/labs', equipmentController.getAllLabs);
router.get('/equipment', equipmentController.getAllEquipment);
router.get('/equipment/:id', equipmentController.getEquipmentById);

// Protected Equipment Routes (Tech & Admin)
router.post('/equipment', authenticateToken, requireRole(['tech', 'admin']), equipmentController.createEquipment);
router.patch('/equipment/:id/status', authenticateToken, requireRole(['tech', 'admin']), equipmentController.updateEquipmentStatus);

// --- Reservation Routes ---
router.get('/reservations', authenticateToken, reservationController.getReservations);
router.post('/reservations', authenticateToken, reservationController.createReservation);
router.patch('/reservations/:id', authenticateToken, reservationController.updateReservation);
router.patch('/reservations/:id/status', authenticateToken, reservationController.updateReservationStatus);
router.delete('/reservations/:id', authenticateToken, reservationController.deleteReservation);

// --- Analytics & System Maintenance Routes ---
router.get('/analytics', authenticateToken, requireRole(['tech', 'admin']), analyticsController.getAnalytics);
router.post('/seed', authenticateToken, requireRole(['admin']), analyticsController.reseedData);

module.exports = router;
