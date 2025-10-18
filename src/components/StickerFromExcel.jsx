import React, { useState } from "react";
import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { saveAs } from "file-saver";

export default function StickerFromExcel() {
  const [items, setItems] = useState([]);

  // 🟢 Handle Excel Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Normalize keys (trim & lowercase)
        const normalize = (obj) => {
          const newObj = {};
          Object.keys(obj).forEach((k) => {
            newObj[k.trim().toLowerCase()] = obj[k];
          });
          return newObj;
        };

        const normalizedRows = json.map(normalize);

        // Detect potential column names
        const descKeys = [
          "description",
          "item description",
          "desc",
          "description of item",
          "material description",
        ];
        const qtyKeys = ["qty", "quantity", "q.t.y", "order qty", "po qty"];
        const codeKeys = ["item code", "code", "material code"];

        // Find first match for column names
        const findCol = (row, keys) =>
          Object.keys(row).find((k) =>
            keys.some((key) => k.includes(key))
          );

        const validItems = normalizedRows
          .map((row, i) => {
            const descCol = findCol(row, descKeys);
            const qtyCol = findCol(row, qtyKeys);
            const codeCol = findCol(row, codeKeys);

            const desc = descCol ? row[descCol] : "";
            const qty = qtyCol ? row[qtyCol] : "";
            const code = codeCol ? row[codeCol] : "";

            if (!desc || desc.toString().trim() === "") return null;

            return {
              id: i + 1,
              description: desc,
              qty: qty || "",
              itemCode: code || "",
            };
          })
          .filter(Boolean);

        console.log("✅ Parsed items:", validItems);

        if (validItems.length === 0) {
          alert("No valid items found in Excel file!");
          setItems([]);
        } else {
          setItems(validItems);
        }
      } catch (err) {
        console.error("❌ Excel parsing failed:", err);
        alert("Failed to parse Excel. Please check file format.");
        setItems([]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 🧩 Wrap text for long descriptions
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

  // 🏷 Generate Sticker PDF
  const generateStickerPDF = async () => {
    if (!items.length) {
      alert("Please upload a valid Excel file first.");
      return;
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // ✅ Load logo
    let logoImg;
    try {
      const logoBytes = await fetch("https://www.msgoilfield.com/logo.png").then((r) =>
        r.arrayBuffer()
      );
      logoImg = await pdfDoc.embedPng(logoBytes);
    } catch {
      console.warn("⚠️ MSG logo not loaded.");
    }

    // ✅ QR setup
    const qrUrl = await QRCode.toDataURL("https://www.msgoilfield.com");
    const qrBytes = await fetch(qrUrl).then((r) => r.arrayBuffer());
    const qrImage = await pdfDoc.embedPng(qrBytes);

    const pad = 12;
    const fontSize = 6.8;
    const lineHeight = 8.5;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const page = pdfDoc.addPage([210, 148]); // A6 landscape
      const { width, height } = page.getSize();
      let y = height - pad - 3;

      // Header
      page.drawText("Dubai Petroleum Establishment", {
        x: pad,
        y,
        size: fontSize + 0.5,
        font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
      page.drawText("PO Number: DPE-004968-152", { x: pad, y, size: fontSize, font });
      y -= lineHeight;
      page.drawText(`ITEM NO: ${i + 1}`, { x: pad, y, size: fontSize, font });
      y -= lineHeight;
      if (it.itemCode)
        page.drawText(`ITEM CODE: ${it.itemCode}`, { x: pad, y, size: fontSize, font });
      y -= lineHeight;

      // Logo
      if (logoImg) {
        const logoDims = logoImg.scale(0.065);
        page.drawImage(logoImg, {
          x: width - logoDims.width - 15,
          y: height - logoDims.height - 8,
          width: logoDims.width,
          height: logoDims.height,
        });
      }

      // Description
      const availableWidth = width - pad * 2 - 25;
      const descLines = wrapText(it.description, font, fontSize, availableWidth);

      const footerLines = [
        `PO QTY: ${it.qty || "No Data"}`,
        "HEAT NUMBER: No Data",
        "MAKE: No Data",
        "CERTIFICATE NO: No Data",
        "Remarks: None",
      ];

      const footerBlockHeight = footerLines.length * lineHeight + 10;
      const availableHeight = y - pad - footerBlockHeight;

      for (const line of descLines) {
        if (y - lineHeight < pad + footerBlockHeight) break;
        y -= lineHeight;
        page.drawText(line, { x: pad, y, size: fontSize, font });
      }

      // Footer bottom-up
      let fy = pad + 5;
      footerLines.forEach((line) => {
        page.drawText(line, { x: pad, y: fy, size: fontSize, font });
        fy += lineHeight;
      });

      // QR Code
      const qrSize = 30;
      page.drawImage(qrImage, {
        x: width - qrSize - 18,
        y: pad,
        width: qrSize,
        height: qrSize,
      });
    }

    const pdfBytes = await pdfDoc.save();
    saveAs(new Blob([pdfBytes], { type: "application/pdf" }), "MSG_Stickers.pdf");
  };

  return (
    <div className="bg-white border p-6 rounded-lg shadow w-full max-w-lg mx-auto mt-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🏷️ Generate Stickers from Excel
      </h2>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="block w-full mb-4"
      />

      {items.length > 0 ? (
        <div className="text-sm text-green-700 font-medium mb-3">
          ✅ {items.length} item{items.length > 1 ? "s" : ""} detected.
        </div>
      ) : (
        <div className="text-sm text-gray-500 mb-3">
          Upload Excel file to extract items.
        </div>
      )}

      <button
        onClick={generateStickerPDF}
        disabled={items.length === 0}
        className={`px-4 py-2 rounded text-white w-full transition ${
          items.length === 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        Generate Sticker PDF
      </button>
    </div>
  );
}
