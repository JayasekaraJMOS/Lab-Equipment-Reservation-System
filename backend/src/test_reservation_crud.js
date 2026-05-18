const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const testJwtSecret = process.env.JWT_SECRET || 'test-only-secret-that-is-at-least-32-characters';
process.env.JWT_SECRET = testJwtSecret;
const Equipment = require('./models/Equipment');
const Reservation = require('./models/Reservation');
const User = require('./models/User');
const { getJwtSecret } = require('./middleware/auth');
const authController = require('./controllers/authController');
const controller = require('./controllers/reservationController');

const originalFindById = Reservation.findById;
const originalFind = Reservation.find;
const originalEquipmentFindById = Equipment.findById;
const originalUserExists = User.exists;
const originalUserCreate = User.create;

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function makeReservation(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    user_id: 'student-id',
    equipment_id: new mongoose.Types.ObjectId(),
    start_time: new Date(Date.now() + 60 * 60 * 1000),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000),
    purpose: 'Original purpose',
    status: 'pending',
    admin_notes: '',
    ...overrides
  };
}

test.afterEach(() => {
  process.env.JWT_SECRET = testJwtSecret;
  Reservation.findById = originalFindById;
  Reservation.find = originalFind;
  Equipment.findById = originalEquipmentFindById;
  User.exists = originalUserExists;
  User.create = originalUserCreate;
});

test('requires a configured JWT secret of at least 32 characters', () => {
  try {
    delete process.env.JWT_SECRET;
    assert.throws(getJwtSecret, /at least 32 characters/i);
    process.env.JWT_SECRET = 'too-short';
    assert.throws(getJwtSecret, /at least 32 characters/i);
    process.env.JWT_SECRET = 'valid-test-secret-that-is-at-least-32-characters';
    assert.equal(getJwtSecret(), process.env.JWT_SECRET);
  } finally {
    process.env.JWT_SECRET = testJwtSecret;
  }
});

test('updates a pending reservation with validated details', async () => {
  const reservation = makeReservation();
  reservation.save = async function save() {};
  Reservation.findById = async () => reservation;
  Reservation.find = () => ({ select: () => ({ lean: async () => [] }) });
  Equipment.findById = async () => ({ max_hours_per_slot: 4 });

  const res = response();
  await controller.updateReservation({
    params: { id: String(reservation._id) },
    body: {
      start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      purpose: 'Updated purpose'
    },
    user: { id: 'student-id', role: 'student' }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(reservation.purpose, 'Updated purpose');
  assert.match(res.body.message, /updated successfully/i);
});

test('prevents a student from editing another user’s reservation', async () => {
  const reservation = makeReservation({ user_id: 'another-student' });
  Reservation.findById = async () => reservation;

  const res = response();
  await controller.updateReservation({
    params: { id: String(reservation._id) },
    body: { purpose: 'Unauthorized edit' },
    user: { id: 'student-id', role: 'student' }
  }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(reservation.purpose, 'Original purpose');
});

test('prevents deletion of an active reservation', async () => {
  const reservation = makeReservation({ status: 'approved' });
  Reservation.findById = async () => reservation;

  const res = response();
  await controller.deleteReservation({
    params: { id: String(reservation._id) },
    user: { id: 'student-id', role: 'student' }
  }, res);

  assert.equal(res.statusCode, 409);
  assert.match(res.body.error, /cancel or reject/i);
});

test('deletes an inactive reservation owned by the student', async () => {
  const reservation = makeReservation({ status: 'cancelled' });
  let deleted = false;
  reservation.deleteOne = async function deleteOne() {
    deleted = true;
  };
  Reservation.findById = async () => reservation;

  const res = response();
  await controller.deleteReservation({
    params: { id: String(reservation._id) },
    user: { id: 'student-id', role: 'student' }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(deleted, true);
});

test('public registration cannot grant an administrator role', async () => {
  let createdUser;
  User.exists = async () => null;
  User.create = async (data) => {
    createdUser = data;
    return { _id: new mongoose.Types.ObjectId(), ...data };
  };

  const res = response();
  await authController.register({
    body: {
      name: 'New User',
      email: 'new-user@example.edu',
      password: 'secure-password',
      role: 'admin'
    }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(createdUser.role, 'student');
  assert.equal(res.body.user.role, 'student');
});
