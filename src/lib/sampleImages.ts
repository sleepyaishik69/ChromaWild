export function generateProceduralNotebookSketchSample(): string {
  if (typeof window === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Cream ruled notebook paper
  ctx.fillStyle = '#faf7ee';
  ctx.fillRect(0, 0, 600, 450);

  // Ruled faint lines
  ctx.strokeStyle = 'rgba(180, 190, 210, 0.4)';
  ctx.lineWidth = 1;
  for (let y = 40; y < 450; y += 26) {
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(570, y);
    ctx.stroke();
  }

  // Margin red line
  ctx.strokeStyle = 'rgba(230, 100, 100, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(85, 0);
  ctx.lineTo(85, 450);
  ctx.stroke();

  // Hand-drawn outdoor sketch (pencil and wash)
  ctx.save();
  ctx.translate(330, 220);

  // Soft watercolor green wash
  ctx.fillStyle = 'rgba(64, 145, 108, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 120, 80, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Pencil contour lines
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 110, 70, -0.2, 0, Math.PI * 2);
  ctx.stroke();

  // Midrib and veins in graphite
  ctx.beginPath();
  ctx.moveTo(-100, 15);
  ctx.lineTo(100, -15);
  ctx.stroke();

  ctx.lineWidth = 1;
  for (let i = -70; i < 70; i += 25) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 20, -35);
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 20, 35);
    ctx.stroke();
  }

  ctx.restore();

  // Hand-written annotations in cursive
  ctx.font = 'italic 16px serif';
  ctx.fillStyle = '#4a5568';
  ctx.fillText('Plate IV: Park Foliage Study', 110, 75);
  ctx.fillText('Naturalist Notes: 2B pencil contour, light watercolor wash.', 110, 380);
  ctx.fillText('Observed along a neighborhood path.', 110, 405);

  return canvas.toDataURL('image/png');
}
