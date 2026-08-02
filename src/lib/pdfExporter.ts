import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GraphData } from '@/types/graph';

export async function exportGraphToPDF(
  graphData: GraphData,
  containerElement: HTMLElement
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CorpGraph 3D — Intelligence Report', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 45, 16);

  // Executive Summary Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Target Company: ${graphData.targetCompany.name}`, 14, 38);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Description: ${graphData.targetCompany.description}`, 14, 44);
  doc.text(`Wikidata QID: ${graphData.targetCompany.wikidataId}`, 14, 50);

  // Capture 3D WebGL Canvas snapshot
  try {
    let imgData: string | null = null;
    const canvasEl = containerElement.querySelector('canvas') as HTMLCanvasElement | null;

    if (canvasEl) {
      imgData = canvasEl.toDataURL('image/png');
    }

    if (!imgData) {
      const renderedCanvas = await html2canvas(containerElement, {
        backgroundColor: '#090d16',
        useCORS: true,
      });
      imgData = renderedCanvas.toDataURL('image/png');
    }

    if (imgData) {
      doc.addImage(imgData, 'PNG', 14, 56, 182, 100);
    }
  } catch (err) {
    console.error('Failed to capture graph image for PDF:', err);
    doc.setFillColor(30, 41, 59);
    doc.rect(14, 56, 182, 100, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('3D Graph Snapshot Unavailable', 70, 105);
  }

  // Entity Breakdown Table
  let yPos = 166;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Connected Entities Breakdown (${graphData.nodes.length} total):`, 14, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Entity Name', 14, yPos);
  doc.text('Type', 95, yPos);
  doc.text('Description / Details', 135, yPos);

  yPos += 3;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, yPos, pageWidth - 14, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);

  graphData.nodes.forEach((node) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;

      // Repeat Table Header on new page
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Entity Name', 14, yPos);
      doc.text('Type', 95, yPos);
      doc.text('Description / Details', 135, yPos);
      yPos += 3;
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
    }

    doc.text(node.name.substring(0, 40), 14, yPos);
    doc.text(node.type.toUpperCase(), 95, yPos);
    doc.text((node.description || 'Connected Entity').substring(0, 35), 135, yPos);
    yPos += 6;
  });

  // Footer for all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`CorpGraph 3D Intelligence Report | Page ${i} of ${pageCount}`, 14, 288);
  }

  doc.save(`${graphData.targetCompany.name}_CorpGraph3D_Report.pdf`);
}
