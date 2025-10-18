import React from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { saveAs } from "file-saver";

export default function StickerGenerator({ items = [] }) {

const generateStickerPDF = async () => {
  if (!items || items.length === 0) {
    alert("No items found!");
    return;
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ✅ Try loading MSG logo
  let logoImg;
  try {
    const logoBytes = await fetch("https://www.msgoilfield.com/logo.png").then((r) => r.arrayBuffer());
    logoImg = await pdfDoc.embedPng(logoBytes);
  } catch {
    console.warn("⚠️ MSG logo not loaded.");
  }

  // ✅ Reusable QR code
  const qrUrl = await QRCode.toDataURL("https://www.msgoilfield.com");
  const qrBytes = await fetch(qrUrl).then((res) => res.arrayBuffer());
  const qrImage = await pdfDoc.embedPng(qrBytes);

  // === Generate Each Page ===
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const page = pdfDoc.addPage([210, 148]); // A6 landscape
    const { width, height } = page.getSize();

    const pad = 14;
    const fontSize = 7; // ✅ Uniform font for all text
    const lineHeight = 9;
    let y = height - pad - 5;

    // HEADER
    page.drawText("Dubai Petroleum Establishment", { x: pad, y, size: fontSize, font });
    y -= lineHeight;
    page.drawText("PO Number: DPE-004968-152", { x: pad, y, size: fontSize, font });
    y -= lineHeight;
    page.drawText(`ITEM NO: ${i + 1}`, { x: pad, y, size: fontSize, font });
    y -= lineHeight;

    // ✅ Logo top-right
    if (logoImg) {
      const logoDims = logoImg.scale(0.07);
      page.drawImage(logoImg, {
        x: width - logoDims.width - 15,
        y: height - logoDims.height - 8,
        width: logoDims.width,
        height: logoDims.height,
      });
    }

    // ✅ Text wrapping helper
    const wrapText = (text, font, fontSize, maxWidth) => {
      const words = (text || "").split(" ");
      const lines = [];
      let line = "";
      words.forEach((word) => {
        const test = (line + " " + word).trim();
        if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      });
      if (line) lines.push(line);
      return lines;
    };

    // ✅ Footer info
    const footerLines = [
      `PO QTY: ${item.qty || "No Data"}`,
      "HEAT NUMBER: No Data",
      "MAKE: No Data",
      "CERTIFICATE NO: No Data",
      "Remarks: None",
    ];

    const footerBlockHeight = footerLines.length * lineHeight + 10;
    // const availableHeight = y - pad - footerBlockHeight;

    const descLines = wrapText(item.description || "No Description", font, fontSize, width - pad * 2 - 20);

    // ✅ Draw description safely within available height
    for (const line of descLines) {
      if (y - lineHeight < pad + footerBlockHeight) break;
      y -= lineHeight;
      page.drawText(line, { x: pad, y, size: fontSize, font });
    }

    // GAP before footer
    y = pad + footerBlockHeight;

    // ✅ Draw footer bottom-up (for consistent spacing)
    let fy = pad + 5;
    footerLines.forEach((line) => {
      page.drawText(line, { x: pad, y: fy, size: fontSize, font });
      fy += lineHeight;
    });

    // ✅ QR code bottom-right
    const qrSize = 35;
    page.drawImage(qrImage, {
      x: width - qrSize - 20,
      y: pad,
      width: qrSize,
      height: qrSize,
    });
  }

  // ✅ Save file
  const pdfBytes = await pdfDoc.save();
  saveAs(new Blob([pdfBytes], { type: "application/pdf" }), "MSG_Stickers.pdf");
};


  return (
    <div className="bg-white border p-4 rounded-lg shadow w-full max-w-md">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        🏷️ Dubai Petroleum Sticker Generator
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        Generates one PDF with each item on a separate page.
      </p>

      <button
        onClick={generateStickerPDF}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Generate Sticker PDF
      </button>
    </div>
  );
}
