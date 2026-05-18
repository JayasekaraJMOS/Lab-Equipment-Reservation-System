function idOf(value) {
  if (!value) return null;
  return String(value._id || value);
}

function formatLab(lab) {
  if (!lab) return null;
  return {
    id: idOf(lab),
    name: lab.name,
    code: lab.code,
    location: lab.location,
    building: lab.building,
    supervisor: lab.supervisor
  };
}

function formatEquipment(equipment) {
  const lab = equipment.lab_id && typeof equipment.lab_id === 'object'
    ? equipment.lab_id
    : null;

  return {
    id: idOf(equipment),
    lab_id: idOf(equipment.lab_id),
    name: equipment.name,
    category: equipment.category,
    model: equipment.model,
    serial_number: equipment.serial_number,
    status: equipment.status,
    requires_approval: equipment.requires_approval ? 1 : 0,
    max_hours_per_slot: equipment.max_hours_per_slot,
    description: equipment.description,
    specs: equipment.specs,
    image_url: equipment.image_url,
    ...(lab ? {
      lab_name: lab.name,
      lab_code: lab.code,
      lab_location: lab.location,
      supervisor: lab.supervisor
    } : {})
  };
}

function formatReservation(reservation) {
  const equipment = reservation.equipment_id && typeof reservation.equipment_id === 'object'
    ? reservation.equipment_id
    : null;
  const user = reservation.user_id && typeof reservation.user_id === 'object'
    ? reservation.user_id
    : null;
  const lab = equipment && equipment.lab_id && typeof equipment.lab_id === 'object'
    ? equipment.lab_id
    : null;

  return {
    id: idOf(reservation),
    user_id: idOf(reservation.user_id),
    equipment_id: idOf(reservation.equipment_id),
    start_time: reservation.start_time,
    end_time: reservation.end_time,
    purpose: reservation.purpose,
    status: reservation.status,
    admin_notes: reservation.admin_notes,
    created_at: reservation.created_at,
    ...(equipment ? {
      equipment_name: equipment.name,
      equipment_model: equipment.model,
      category: equipment.category
    } : {}),
    ...(lab ? { lab_name: lab.name, lab_code: lab.code } : {}),
    ...(user ? { user_name: user.name, user_email: user.email } : {})
  };
}

module.exports = { formatLab, formatEquipment, formatReservation };
