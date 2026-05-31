export const prerender = true;

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf(lines: string[]) {
  const content = [
    'BT',
    '/F1 18 Tf',
    '72 720 Td',
    `(${escapePdfText(lines[0])}) Tj`,
    '/F1 11 Tf',
    ...lines.slice(1).flatMap((line) => ['0 -24 Td', `(${escapePdfText(line)}) Tj`]),
    'ET',
    '',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

export function GET() {
  const pdf = buildPdf([
    'Marketing Leverage Diagnostic',
    '1. Find the visibility gap: search, local, AI answers, and referrals.',
    '2. Find the conversion gap: calls, forms, pages, and quote paths.',
    '3. Find the follow-up gap: speed-to-lead, nurture, and old opportunities.',
    '4. Find the proof gap: reviews, receipts, attribution, and weekly reporting.',
    '5. Fix the highest-leverage gap before adding more ad spend.',
    '',
    'Buildwise Media installs and operates Ascend for owner-led service businesses.',
  ]);

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="marketing-leverage-diagnostic.pdf"',
    },
  });
}
