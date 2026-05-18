const categoryImages = {
  Oscilloscopes: '/equipment/oscilloscope.svg',
  'Spectrum Analyzers': '/equipment/spectrum-analyzer.svg',
  'Rapid Prototyping': '/equipment/3d-printer.svg',
  'PCB Fabrication': '/equipment/pcb-mill.svg',
  'AI & Embedded Computing': '/equipment/ai-board.svg',
  'Power Electronics': '/equipment/power-supply.svg'
};

const genericImage = '/equipment/lab-instrument.svg';

export function getEquipmentImageUrl(equipment) {
  const imageUrl = equipment.image_url;
  if (imageUrl && !imageUrl.startsWith('https://images.unsplash.com/')) {
    return imageUrl;
  }
  return categoryImages[equipment.category] || genericImage;
}
