const bcrypt = require('bcryptjs');
const User = require('./User');
const Lab = require('./Lab');
const Equipment = require('./Equipment');
const Reservation = require('./Reservation');
const MaintenanceLog = require('./MaintenanceLog');

const equipmentData = [
  {
    labIndex: 0,
    name: 'Keysight 4-Channel Digital Storage Oscilloscope',
    category: 'Oscilloscopes',
    model: 'Keysight DSOX2004A',
    serial_number: 'DSO-2026-001',
    status: 'available',
    requires_approval: false,
    max_hours_per_slot: 3,
    description: '70 MHz 4-channel oscilloscope with 50,000 wfms/sec update rate and built-in function generator.',
    specs: 'Bandwidth: 70 MHz | Channels: 4 | Sample Rate: 2 GSa/s | Memory Depth: 1 Mpts',
    image_url: '/equipment/oscilloscope.svg'
  },
  {
    labIndex: 0,
    name: 'Rohde & Schwarz RF Spectrum Analyzer',
    category: 'Spectrum Analyzers',
    model: 'R&S FSH4 (9 kHz to 3.6 GHz)',
    serial_number: 'SA-R&S-0992',
    status: 'available',
    requires_approval: true,
    max_hours_per_slot: 4,
    description: 'Handheld spectrum analyzer for high-frequency RF signal measurements, field testing, and antenna verification.',
    specs: 'Frequency Range: 9 kHz - 3.6 GHz | DANL: -163 dBm | Resolution Bandwidth: 1 Hz to 3 MHz',
    image_url: '/equipment/spectrum-analyzer.svg'
  },
  {
    labIndex: 1,
    name: 'UltiMaker S5 Dual-Extrusion 3D Printer',
    category: 'Rapid Prototyping',
    model: 'UltiMaker S5 Advanced',
    serial_number: '3DP-ULT-502',
    status: 'available',
    requires_approval: false,
    max_hours_per_slot: 6,
    description: 'Industrial-grade dual-extrusion 3D printer for precision engineering prototypes using PLA, ABS, and Tough PLA.',
    specs: 'Build Volume: 330 x 240 x 300 mm | Layer Resolution: up to 20 microns | Filament Diameter: 2.85 mm',
    image_url: '/equipment/3d-printer.svg'
  },
  {
    labIndex: 1,
    name: 'Bantam Tools Desktop CNC PCB Milling Machine',
    category: 'PCB Fabrication',
    model: 'Bantam NextGen Milling',
    serial_number: 'CNC-BTM-881',
    status: 'maintenance',
    requires_approval: true,
    max_hours_per_slot: 2,
    description: 'High-precision desktop CNC mill specifically tailored for rapid double-sided printed circuit board prototyping.',
    specs: 'Spindle Speed: 26,000 RPM | Repeatability: 0.006 mm | Max Travel: 140 x 140 x 32 mm',
    image_url: '/equipment/pcb-mill.svg'
  },
  {
    labIndex: 2,
    name: 'NVIDIA Jetson AGX Orin Developer Kit',
    category: 'AI & Embedded Computing',
    model: 'NVIDIA Orin 64GB',
    serial_number: 'AI-NV-ORIN-01',
    status: 'available',
    requires_approval: false,
    max_hours_per_slot: 4,
    description: 'High-performance AI workstation board delivering up to 275 TOPS for robotics, autonomous machines, and computer vision.',
    specs: 'GPU: 2048-core NVIDIA Ampere | CPU: 12-core Arm Cortex-A78AE | RAM: 64GB LPDDR5',
    image_url: '/equipment/ai-board.svg'
  },
  {
    labIndex: 2,
    name: 'Tektronix Programmable Triple-Output DC Power Supply',
    category: 'Power Electronics',
    model: 'Tektronix PWS4305',
    serial_number: 'PWR-TEK-4305',
    status: 'available',
    requires_approval: false,
    max_hours_per_slot: 3,
    description: 'Precision programmable DC power supply featuring high voltage stability and low ripple noise.',
    specs: 'Voltage Output: 0 - 30V | Current Output: 0 - 5A | Display Accuracy: 0.05%',
    image_url: '/equipment/power-supply.svg'
  }
];

async function seedDatabase({ reset = false } = {}) {
  if (!reset && await User.exists({})) {
    console.log('[Seed] Existing MongoDB data found; skipping sample seed.');
    return;
  }

  console.log('[Seed] Seeding MongoDB with realistic EE4207 lab data...');
  if (reset) {
    await Promise.all([
      Reservation.deleteMany({}),
      MaintenanceLog.deleteMany({}),
      Equipment.deleteMany({}),
      Lab.deleteMany({}),
      User.deleteMany({})
    ]);
  }

  const [student, technician, admin] = await User.create([
    {
      name: 'Alex Chen',
      email: 'student@university.edu',
      password: await bcrypt.hash('student123', 10),
      role: 'student',
      department: 'Electrical & Electronic Engineering'
    },
    {
      name: 'Dr. Robert Vance',
      email: 'tech@university.edu',
      password: await bcrypt.hash('tech123', 10),
      role: 'tech',
      department: 'Department of EEE'
    },
    {
      name: 'Prof. Sarah Jenkins',
      email: 'admin@university.edu',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      department: 'Faculty of Engineering'
    }
  ]);

  const labs = await Lab.create([
    {
      name: 'High-Frequency Signal Lab',
      code: 'LAB-EEE-101',
      location: 'Room 302, Level 3',
      building: 'Engineering Block A',
      supervisor: 'Dr. Vance'
    },
    {
      name: 'Robotics & Prototyping Workshop',
      code: 'LAB-EEE-204',
      location: 'Room 112, Level 1',
      building: 'Innovation Center',
      supervisor: 'Eng. Marcus'
    },
    {
      name: 'Embedded Systems & IoT Lab',
      code: 'LAB-EEE-305',
      location: 'Room 408, Level 4',
      building: 'Engineering Block B',
      supervisor: 'Dr. Jenkins'
    }
  ]);

  const equipment = await Equipment.create(equipmentData.map(({ labIndex, ...item }) => ({
    ...item,
    lab_id: labs[labIndex]._id
  })));

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(12, 0, 0, 0);

  await Reservation.create({
    user_id: student._id,
    equipment_id: equipment[0]._id,
    start_time: start,
    end_time: end,
    purpose: 'EE4207 Microprocessor Signal Analysis Lab Experiment',
    status: 'approved',
    admin_notes: 'Approved by Dr. Vance'
  });

  console.log('[Seed] MongoDB seeding completed successfully.');
  return { student, technician, admin, labs, equipment };
}

if (require.main === module) {
  require('./connect')()
    .then(() => seedDatabase({ reset: true }))
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[Seed Error]', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
