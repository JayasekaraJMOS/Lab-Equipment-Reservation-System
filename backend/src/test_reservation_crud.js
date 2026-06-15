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

function makeReservationQuery(result, populatePaths = []) {
  return {
    populate(path) {
      populatePaths.push(typeof path === 'string' ? path : path.path);
      return this;
    },
    sort() {
      return this;
    },
    lean: async () => result
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

test('students cannot query another user reservation by ID', async () => {
  let queriedReservations = false;
  Reservation.find = () => {
    queriedReservations = true;
    return makeReservationQuery([]);
  };

  const res = response();
  await controller.getReservations({
    query: { equipmentId: String(new mongoose.Types.ObjectId()), userId: 'another-student' },
    user: { id: 'student-id', role: 'student' }
  }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(queriedReservations, false);
});

test('equipment filters do not remove the student ownership filter', async () => {
  let queryFilter;
  Reservation.find = (filter) => {
    queryFilter = filter;
    return makeReservationQuery([]);
  };

  const res = response();
  await controller.getReservations({
    query: { equipmentId: String(new mongoose.Types.ObjectId()) },
    user: { id: 'student-id', role: 'student' }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(queryFilter.user_id, 'student-id');
});

test('student schedule view returns active reservation times without personal details', async () => {
  const equipmentId = new mongoose.Types.ObjectId();
  const reservationId = new mongoose.Types.ObjectId();
  let queryFilter;
  const populatePaths = [];
  Reservation.find = (filter) => {
    queryFilter = filter;
    return makeReservationQuery([{
      _id: reservationId,
      user_id: { _id: new mongoose.Types.ObjectId(), name: 'Private Name', email: 'private@example.edu' },
      equipment_id: {
        _id: equipmentId,
        name: 'Oscilloscope',
        model: 'Model 1',
        category: 'Oscilloscopes',
        lab_id: { name: 'Signal Lab', code: 'LAB-1' }
      },
      start_time: new Date(Date.now() + 60 * 60 * 1000),
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000),
      purpose: 'Private research purpose',
      admin_notes: 'Private staff note',
      status: 'pending'
    }], populatePaths);
  };

  const res = response();
  await controller.getReservations({
    query: { view: 'schedule', equipmentId: String(equipmentId) },
    user: { id: 'student-id', role: 'student' }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(queryFilter.status, { $in: ['pending', 'approved'] });
  assert.equal(String(queryFilter.equipment_id), String(equipmentId));
  assert.deepEqual(populatePaths, ['equipment_id']);
  assert.deepEqual(Object.keys(res.body.reservations[0]).sort(), [
    'end_time',
    'equipment_name',
    'id',
    'start_time',
    'status'
  ]);
  assert.equal(res.body.reservations[0].equipment_name, 'Oscilloscope');
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

test('prevents a student from cancelling a completed reservation', async () => {
  const reservation = makeReservation({ status: 'completed' });
  Reservation.findById = async () => reservation;

  const res = response();
  await controller.updateReservationStatus({
    params: { id: String(reservation._id) },
    body: { status: 'cancelled' },
    user: { id: 'student-id', role: 'student' }
  }, res);

  assert.equal(res.statusCode, 409);
  assert.equal(reservation.status, 'completed');
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
