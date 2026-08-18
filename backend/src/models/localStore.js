const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

let store = null;
let enabled = false;

function newId() {
  return new mongoose.Types.ObjectId().toString();
}

function loadStore() {
  if (store) return store;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return store;
    } catch (e) {
      console.warn('[LocalStore] Error reading existing store.json, re-initializing.', e.message);
    }
  }

  store = createInitialData();
  saveStore();
  return store;
}

function saveStore() {
  if (!store) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

function createInitialData() {
  const labIds = [newId(), newId(), newId()];
  const userIds = [newId(), newId(), newId()];

  const labs = [
    {
      _id: labIds[0],
      name: 'High-Frequency Signal Lab',
      code: 'LAB-EEE-101',
      location: 'Room 302, Level 3',
      building: 'Engineering Block A',
      supervisor: 'Dr. Vance',
      created_at: new Date().toISOString()
    },
    {
      _id: labIds[1],
      name: 'Robotics & Prototyping Workshop',
      code: 'LAB-EEE-204',
      location: 'Room 112, Level 1',
      building: 'Innovation Center',
      supervisor: 'Eng. Marcus',
      created_at: new Date().toISOString()
    },
    {
      _id: labIds[2],
      name: 'Embedded Systems & IoT Lab',
      code: 'LAB-EEE-305',
      location: 'Room 408, Level 4',
      building: 'Engineering Block B',
      supervisor: 'Dr. Jenkins',
      created_at: new Date().toISOString()
    }
  ];

  const users = [
    {
      _id: userIds[0],
      name: 'Alex Chen',
      email: 'student@university.edu',
      password: bcrypt.hashSync('student123', 10),
      role: 'student',
      department: 'Electrical & Electronic Engineering',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      _id: userIds[1],
      name: 'Dr. Robert Vance',
      email: 'tech@university.edu',
      password: bcrypt.hashSync('tech123', 10),
      role: 'tech',
      department: 'Department of EEE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      _id: userIds[2],
      name: 'Prof. Sarah Jenkins',
      email: 'admin@university.edu',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      department: 'Faculty of Engineering',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const equipment = [
    {
      _id: newId(),
      lab_id: labIds[0],
      name: 'Keysight 4-Channel Digital Storage Oscilloscope',
      category: 'Oscilloscopes',
      model: 'Keysight DSOX2004A',
      serial_number: 'DSO-2026-001',
      status: 'available',
      requires_approval: false,
      max_hours_per_slot: 8,
      description: '70 MHz 4-channel oscilloscope with 50,000 wfms/sec update rate and built-in function generator.',
      specs: 'Bandwidth: 70 MHz | Channels: 4 | Sample Rate: 2 GSa/s | Memory Depth: 1 Mpts',
      image_url: '/equipment/oscilloscope.svg'
    },
    {
      _id: newId(),
      lab_id: labIds[0],
      name: 'Rohde & Schwarz RF Spectrum Analyzer',
      category: 'Spectrum Analyzers',
      model: 'R&S FSH4 (9 kHz to 3.6 GHz)',
      serial_number: 'SA-R&S-0992',
      status: 'available',
      requires_approval: true,
      max_hours_per_slot: 8,
      description: 'Handheld spectrum analyzer for high-frequency RF signal measurements, field testing, and antenna verification.',
      specs: 'Frequency Range: 9 kHz - 3.6 GHz | DANL: -163 dBm | Resolution Bandwidth: 1 Hz to 3 MHz',
      image_url: '/equipment/spectrum-analyzer.svg'
    },
    {
      _id: newId(),
      lab_id: labIds[1],
      name: 'UltiMaker S5 Dual-Extrusion 3D Printer',
      category: 'Rapid Prototyping',
      model: 'UltiMaker S5 Advanced',
      serial_number: '3DP-ULT-502',
      status: 'available',
      requires_approval: false,
      max_hours_per_slot: 12,
      description: 'Industrial-grade dual-extrusion 3D printer for precision engineering prototypes using PLA, ABS, and Tough PLA.',
      specs: 'Build Volume: 330 x 240 x 300 mm | Layer Resolution: up to 20 microns | Filament Diameter: 2.85 mm',
      image_url: '/equipment/3d-printer.svg'
    },
    {
      _id: newId(),
      lab_id: labIds[1],
      name: 'Bantam Tools Desktop CNC PCB Milling Machine',
      category: 'PCB Fabrication',
      model: 'Bantam NextGen Milling',
      serial_number: 'CNC-BTM-881',
      status: 'maintenance',
      requires_approval: true,
      max_hours_per_slot: 8,
      description: 'High-precision desktop CNC mill specifically tailored for rapid double-sided printed circuit board prototyping.',
      specs: 'Spindle Speed: 26,000 RPM | Repeatability: 0.006 mm | Max Travel: 140 x 140 x 32 mm',
      image_url: '/equipment/pcb-mill.svg'
    },
    {
      _id: newId(),
      lab_id: labIds[2],
      name: 'NVIDIA Jetson AGX Orin Developer Kit',
      category: 'AI & Embedded Computing',
      model: 'NVIDIA Orin 64GB',
      serial_number: 'AI-NV-ORIN-01',
      status: 'available',
      requires_approval: false,
      max_hours_per_slot: 12,
      description: 'High-performance AI workstation board delivering up to 275 TOPS for robotics, autonomous machines, and computer vision.',
      specs: 'GPU: 2048-core NVIDIA Ampere | CPU: 12-core Arm Cortex-A78AE | RAM: 64GB LPDDR5',
      image_url: '/equipment/ai-board.svg'
    },
    {
      _id: newId(),
      lab_id: labIds[2],
      name: 'Tektronix Programmable Triple-Output DC Power Supply',
      category: 'Power Electronics',
      model: 'Tektronix PWS4305',
      serial_number: 'PWR-TEK-4305',
      status: 'available',
      requires_approval: false,
      max_hours_per_slot: 8,
      description: 'Precision programmable DC power supply featuring high voltage stability and low ripple noise.',
      specs: 'Voltage Output: 0 - 30V | Current Output: 0 - 5A | Display Accuracy: 0.05%',
      image_url: '/equipment/power-supply.svg'
    }
  ];

  const reservations = [];

  return {
    users,
    labs,
    equipment,
    reservations,
    maintenance_logs: []
  };
}

function matchesFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(val)) {
      const anyMatch = val.some((sub) => matchesFilter(doc, sub));
      if (!anyMatch) return false;
      continue;
    }

    const docVal = doc[key];

    if (val && typeof val === 'object' && !(val instanceof RegExp)) {
      if (val.$in && Array.isArray(val.$in)) {
        if (!val.$in.map(String).includes(String(docVal))) return false;
      }
      if (val.$ne !== undefined) {
        if (String(docVal) === String(val.$ne)) return false;
      }
      if (val.$lt !== undefined) {
        if (!(new Date(docVal) < new Date(val.$lt))) return false;
      }
      if (val.$gt !== undefined) {
        if (!(new Date(docVal) > new Date(val.$gt))) return false;
      }
    } else if (val instanceof RegExp) {
      if (!val.test(String(docVal || ''))) return false;
    } else if (val !== undefined) {
      if (String(docVal) !== String(val)) return false;
    }
  }

  return true;
}

function createDocWrapper(collectionName, rawDoc) {
  if (!rawDoc) return null;
  const doc = { ...rawDoc };

  doc.save = async function () {
    const s = loadStore();
    const list = s[collectionName] || [];
    const idx = list.findIndex((item) => String(item._id) === String(doc._id));
    doc.updated_at = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = { ...doc };
    } else {
      list.push({ ...doc });
    }
    s[collectionName] = list;
    saveStore();
    return createDocWrapper(collectionName, list[idx >= 0 ? idx : list.length - 1]);
  };

  doc.deleteOne = async function () {
    const s = loadStore();
    const list = s[collectionName] || [];
    s[collectionName] = list.filter((item) => String(item._id) !== String(doc._id));
    saveStore();
    return { acknowledged: true, deletedCount: 1 };
  };

  return doc;
}

function executePopulate(doc, popOption) {
  if (!doc) return doc;
  const cloned = { ...doc };
  const s = loadStore();

  let pathName = '';
  let selectFields = '';
  let subPopulate = null;

  if (typeof popOption === 'string') {
    pathName = popOption;
  } else if (popOption && typeof popOption === 'object') {
    pathName = popOption.path;
    selectFields = popOption.select || '';
    subPopulate = popOption.populate || null;
  }

  let refCollection = '';
  if (pathName === 'lab_id') refCollection = 'labs';
  else if (pathName === 'equipment_id') refCollection = 'equipment';
  else if (pathName === 'user_id') refCollection = 'users';

  if (refCollection && s[refCollection]) {
    const targetId = String(cloned[pathName]?._id || cloned[pathName] || '');
    const found = s[refCollection].find((item) => String(item._id) === targetId);
    if (found) {
      let populatedObj = { ...found };
      if (subPopulate) {
        populatedObj = executePopulate(populatedObj, subPopulate);
      }
      if (selectFields) {
        const allowed = selectFields.split(/\s+/).filter(Boolean);
        const filtered = { _id: populatedObj._id };
        for (const f of allowed) {
          if (populatedObj[f] !== undefined) filtered[f] = populatedObj[f];
        }
        cloned[pathName] = filtered;
      } else {
        cloned[pathName] = populatedObj;
      }
    }
  }

  return cloned;
}

class LocalQuery {
  constructor(collectionName, filter = {}, single = false) {
    this.collectionName = collectionName;
    this.filter = filter;
    this.single = single;
    this.populates = [];
    this.sortOption = null;
    this.limitCount = null;
    this.isLean = false;
    this.selectFields = null;
  }

  populate(option, select) {
    if (typeof option === 'string' && select) {
      this.populates.push({ path: option, select });
    } else {
      this.populates.push(option);
    }
    return this;
  }

  sort(sortObj) {
    this.sortOption = sortObj;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  lean() {
    this.isLean = true;
    return this;
  }

  select(fields) {
    this.selectFields = fields;
    return this;
  }

  async exec() {
    const s = loadStore();
    const list = s[this.collectionName] || [];
    let results = list.filter((item) => matchesFilter(item, this.filter));

    if (this.sortOption) {
      const [key, dir] = Object.entries(this.sortOption)[0] || [];
      if (key) {
        results.sort((a, b) => {
          let valA = a[key];
          let valB = b[key];
          if (key.includes('time') || key.includes('created')) {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
          }
          if (valA < valB) return dir === -1 ? 1 : -1;
          if (valA > valB) return dir === -1 ? -1 : 1;
          return 0;
        });
      }
    }

    if (this.limitCount && this.limitCount > 0) {
      results = results.slice(0, this.limitCount);
    }

    for (const pop of this.populates) {
      results = results.map((item) => executePopulate(item, pop));
    }

    if (this.selectFields) {
      const tokens = this.selectFields.split(/\s+/).filter(Boolean);
      const plusFields = tokens.filter((f) => f.startsWith('+')).map((f) => f.slice(1));
      const minusFields = tokens.filter((f) => f.startsWith('-')).map((f) => f.slice(1));
      const includeFields = tokens.filter((f) => !f.startsWith('+') && !f.startsWith('-'));

      results = results.map((item) => {
        let res = { ...item };
        if (includeFields.length > 0) {
          res = { _id: item._id };
          for (const f of includeFields) {
            if (item[f] !== undefined) res[f] = item[f];
          }
        }
        for (const pf of plusFields) {
          if (item[pf] !== undefined) res[pf] = item[pf];
        }
        for (const mf of minusFields) {
          delete res[mf];
        }
        return res;
      });
    }

    if (this.single) {
      const item = results[0] || null;
      if (!item) return null;
      return this.isLean ? item : createDocWrapper(this.collectionName, item);
    }

    return this.isLean
      ? results
      : results.map((item) => createDocWrapper(this.collectionName, item));
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

function bindModel(model, collectionName) {
  const origFind = model.find.bind(model);
  const origFindOne = model.findOne.bind(model);
  const origFindById = model.findById.bind(model);
  const origFindByIdAndUpdate = model.findByIdAndUpdate ? model.findByIdAndUpdate.bind(model) : null;
  const origCreate = model.create.bind(model);
  const origExists = model.exists.bind(model);
  const origCount = model.countDocuments.bind(model);
  const origDeleteMany = model.deleteMany.bind(model);
  const origAggregate = model.aggregate ? model.aggregate.bind(model) : null;

  model.find = function (filter) {
    if (!enabled || mongoose.connection.readyState === 1) return origFind(filter);
    return new LocalQuery(collectionName, filter, false);
  };

  model.findOne = function (filter) {
    if (!enabled || mongoose.connection.readyState === 1) return origFindOne(filter);
    return new LocalQuery(collectionName, filter, true);
  };

  model.findById = function (id) {
    if (!enabled || mongoose.connection.readyState === 1) return origFindById(id);
    return new LocalQuery(collectionName, { _id: String(id) }, true);
  };

  model.findByIdAndUpdate = async function (id, update, options = {}) {
    if (!enabled || mongoose.connection.readyState === 1) {
      if (origFindByIdAndUpdate) return origFindByIdAndUpdate(id, update, options);
    }
    const s = loadStore();
    const list = s[collectionName] || [];
    const idx = list.findIndex((item) => String(item._id) === String(id));
    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...update, updated_at: new Date().toISOString() };
    saveStore();
    return createDocWrapper(collectionName, list[idx]);
  };

  model.create = async function (data) {
    if (!enabled || mongoose.connection.readyState === 1) return origCreate(data);
    const s = loadStore();
    const list = s[collectionName] || [];

    if (Array.isArray(data)) {
      const created = data.map((item) => ({
        _id: newId(),
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      list.push(...created);
      s[collectionName] = list;
      saveStore();
      return created.map((item) => createDocWrapper(collectionName, item));
    }

    const created = {
      _id: newId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.push(created);
    s[collectionName] = list;
    saveStore();
    return createDocWrapper(collectionName, created);
  };

  model.exists = async function (filter) {
    if (!enabled || mongoose.connection.readyState === 1) return origExists(filter);
    const s = loadStore();
    const list = s[collectionName] || [];
    const found = list.find((item) => matchesFilter(item, filter));
    return found ? { _id: found._id } : null;
  };

  model.countDocuments = async function (filter = {}) {
    if (!enabled || mongoose.connection.readyState === 1) return origCount(filter);
    const s = loadStore();
    const list = s[collectionName] || [];
    return list.filter((item) => matchesFilter(item, filter)).length;
  };

  model.deleteMany = async function (filter = {}) {
    if (!enabled || mongoose.connection.readyState === 1) return origDeleteMany(filter);
    const s = loadStore();
    const list = s[collectionName] || [];
    const remaining = list.filter((item) => !matchesFilter(item, filter));
    const deletedCount = list.length - remaining.length;
    s[collectionName] = remaining;
    saveStore();
    return { acknowledged: true, deletedCount };
  };

  model.aggregate = async function (pipeline) {
    if (!enabled || mongoose.connection.readyState === 1) {
      if (origAggregate) return origAggregate(pipeline);
    }
    const s = loadStore();
    const list = s[collectionName] || [];
    const groupStage = pipeline.find((stage) => stage.$group);
    if (groupStage) {
      const field = groupStage.$group._id.replace(/^\$/, '');
      const counts = {};
      for (const item of list) {
        const val = item[field];
        counts[val] = (counts[val] || 0) + 1;
      }
      return Object.entries(counts).map(([_id, count]) => ({ _id, count }));
    }
    return [];
  };
}

function enable() {
  enabled = true;
  loadStore();

  const User = require('./User');
  const Lab = require('./Lab');
  const Equipment = require('./Equipment');
  const Reservation = require('./Reservation');
  const MaintenanceLog = require('./MaintenanceLog');

  bindModel(User, 'users');
  bindModel(Lab, 'labs');
  bindModel(Equipment, 'equipment');
  bindModel(Reservation, 'reservations');
  bindModel(MaintenanceLog, 'maintenance_logs');

  console.log('[LocalStore] Persistent file database active at backend/data/store.json');
}

function reseed() {
  store = createInitialData();
  saveStore();
  console.log('[LocalStore] Store re-seeded with demo records.');
}

module.exports = {
  enable,
  reseed,
  isEnabled: () => enabled,
  getStore: () => loadStore()
};
