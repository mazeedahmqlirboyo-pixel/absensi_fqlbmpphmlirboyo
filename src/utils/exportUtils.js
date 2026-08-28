import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { formatDateID } from './dates';

export const exportToExcel = (summaryArray, categoryTitle) => {
  // 1. Prepare Main Data
  const mainData = summaryArray.map((row, index) => ({
    'No': index + 1,
    'Nama': row.namaJamiyyah,
    'Lokasi': row.lokasi,
    'Total Jadwal': row.total,
    'Hadir': row.hadir,
    'Alpa': row.tidakHadir,
    'Sering Telat': row.telatCount
  }));

  // 2. Determine Best and Worst (Top 3)
  const sortedBest = [...summaryArray].sort((a, b) => {
    if (b.hadir !== a.hadir) return b.hadir - a.hadir;
    if (a.tidakHadir !== b.tidakHadir) return a.tidakHadir - b.tidakHadir;
    return a.telatCount - b.telatCount;
  });
  const top3Best = sortedBest.slice(0, 3);

  const sortedWorstAlpa = [...summaryArray].sort((a, b) => b.tidakHadir - a.tidakHadir);
  const top3WorstAlpa = sortedWorstAlpa.slice(0, 3).filter(x => x.tidakHadir > 0);

  const sortedWorstTelat = [...summaryArray].sort((a, b) => b.telatCount - a.telatCount);
  const top3WorstTelat = sortedWorstTelat.slice(0, 3).filter(x => x.telatCount > 0);

  const notesData = [
    { 'Kategori': 'Paling Sering Alpa (Terburuk)', 'Nama': top3WorstAlpa.map(w => `${w.namaJamiyyah} (${w.lokasi}) - ${w.tidakHadir} Alpa`).join(', ') || '-' },
    { 'Kategori': 'Paling Sering Telat (Terburuk)', 'Nama': top3WorstTelat.map(w => `${w.namaJamiyyah} (${w.lokasi}) - ${w.telatCount} Telat`).join(', ') || '-' },
    { 'Kategori': 'Paling Rajin Hadir (Terbaik)', 'Nama': top3Best.map(b => `${b.namaJamiyyah} (${b.lokasi})`).join(', ') || '-' }
  ];

  // 3. Create Workbooks
  const wb = XLSX.utils.book_new();
  
  const wsMain = XLSX.utils.json_to_sheet(mainData);
  XLSX.utils.book_append_sheet(wb, wsMain, 'Data Absensi');
  
  const wsNotes = XLSX.utils.json_to_sheet(notesData);
  XLSX.utils.book_append_sheet(wb, wsNotes, 'Catatan Penilaian');

  // 4. Save
  const fileName = `Laporan_Absensi_${categoryTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportToWord = async (summaryArray, categoryTitle) => {
  const sortedBest = [...summaryArray].sort((a, b) => {
    if (b.hadir !== a.hadir) return b.hadir - a.hadir;
    if (a.tidakHadir !== b.tidakHadir) return a.tidakHadir - b.tidakHadir;
    return a.telatCount - b.telatCount;
  });
  const top3Best = sortedBest.slice(0, 3);

  const sortedWorstAlpa = [...summaryArray].sort((a, b) => b.tidakHadir - a.tidakHadir);
  const top3WorstAlpa = sortedWorstAlpa.slice(0, 3).filter(x => x.tidakHadir > 0);

  const sortedWorstTelat = [...summaryArray].sort((a, b) => b.telatCount - a.telatCount);
  const top3WorstTelat = sortedWorstTelat.slice(0, 3).filter(x => x.telatCount > 0);

  // Helper for Table Cells
  const createCell = (text, isHeader = false) => new TableCell({
    children: [new Paragraph({ 
      children: [new TextRun({ text: String(text), bold: isHeader })],
      alignment: AlignmentType.CENTER
    })],
    width: { size: isHeader ? 20 : 20, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    }
  });

  const tableRows = [
    new TableRow({
      children: [
        createCell('No', true),
        createCell('Nama Peserta', true),
        createCell('Lokasi', true),
        createCell('Total', true),
        createCell('Hadir', true),
        createCell('Alpa', true),
        createCell('Sering Telat', true),
      ]
    }),
    ...summaryArray.map((row, idx) => new TableRow({
      children: [
        createCell(idx + 1),
        createCell(row.namaJamiyyah),
        createCell(row.lokasi),
        createCell(row.total),
        createCell(row.hadir),
        createCell(row.tidakHadir),
        createCell(row.telatCount),
      ]
    }))
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `LAPORAN REKAPITULASI ABSENSI`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          text: `Kategori: ${categoryTitle}`,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          text: `Tanggal Cetak: ${formatDateID(new Date().toISOString().split('T')[0])}`,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: "" }), // spacing
        
        // Data Table
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        }),
        
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        
        // Notes Section
        new Paragraph({
          text: "Catatan Penilaian Evaluasi:",
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "1. Peserta Paling Rajin (Terbaik): ", bold: true }),
            new TextRun({ text: top3Best.length > 0 ? top3Best.map(b => `${b.namaJamiyyah} (${b.lokasi})`).join(', ') : "-" })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "2. Peserta Paling Banyak Alpa (Terburuk): ", bold: true }),
            new TextRun({ text: top3WorstAlpa.length > 0 ? top3WorstAlpa.map(w => `${w.namaJamiyyah} (${w.lokasi}) - ${w.tidakHadir} Alpa`).join(', ') : "Tidak ada" })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "3. Peserta Paling Sering Telat (Terburuk): ", bold: true }),
            new TextRun({ text: top3WorstTelat.length > 0 ? top3WorstTelat.map(w => `${w.namaJamiyyah} (${w.lokasi}) - ${w.telatCount} Telat`).join(', ') : "Tidak ada" })
          ]
        }),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Laporan_Absensi_${categoryTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, fileName);
};
