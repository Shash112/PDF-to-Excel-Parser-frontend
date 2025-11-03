import * as XLSX from "xlsx-js-style";

/**
 * Builds the formatted Excel header with company info and shipment details.
 * @param {object} header - The document header info (orderDate, buyer, etc.)
 * @param {string[]} uniqueHsCodes - Unique HS codes list
 * @param {string} title - The main document title (PACKING LIST, INVOICE)
 * @param {string} origins - Country of origin string
 * @returns {Array[]} Styled 2D array of header rows
 */
export const buildExcelHeader = (header, uniqueHsCodes, title = "", origins) => {
  const rows = [];

  // 🏢 Company Info
  rows.push(["MSG OILFIELD EQUIPMENT TRADING LLC"]);
  rows.push(["Dubai Industrial City (DIC), Phase 1"]);
  rows.push(["Sai Shuaib 2, Warehouse No: J-04"]);
  rows.push(["Dubai, United Arab Emirates"]);
  rows.push(["TRN No: 100518964000003"]);
  rows.push([]);
  rows.push([title]);
  rows.push([]);

  // 📋 Order Details
  rows.push(["DATE:", header.orderDate || "", "", "INV. NO:", header.salesOrderNo || "", "", "S.O. REF:", header.refNo || ""]);
  rows.push([]);
  rows.push(["CONSIGNEE:", `${header.buyer || ""}\n${header.buyerAddress || ""}`, "","" ,"SOLD TO / INVOICED TO:", `${header.buyer || ""}\n${header.buyerAddress || ""}`]);

  rows.push([
    "MODE OF SHIPMENT:",
    header.modeOfShipment || "",
    "", "",
    "FREIGHT TERMS:",
    header.freightTerms || "",
  ]);
  rows.push([
    "PLACE OF LOADING:",
    header.placeOfLoading || "",
    "", "",
    "PLACE OF DISCHARGE:",
    header.placeOfDischarge || "",
  ]);
  rows.push([]);
  rows.push(["COUNTRY OF ORIGIN:", origins || "UAE", "", "", "HS CODE:", uniqueHsCodes.join(", ")]);
  rows.push([]);

  return rows;
};

/**
 * Applies styling and merges for the Excel header section.
 * @param {object} ws - XLSX worksheet
 */
/**
 * Styles and merges header (rows 0–7 → Excel 1–8)
 * so every header row spans columns A–H.
 */
export const styleExcelHeader = (ws) => {
  // 🔹 Merge A→H for rows 0–7
  ws["!merges"] = Array.from({ length: 8 }, (_, i) => ({
    s: { r: i, c: 0 },
    e: { r: i, c: 7 },
  }));

  const range = XLSX.utils.decode_range(ws["!ref"]);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;

      // 🏢 Company Info rows (0–4)
      if (R <= 4) {
        cell.s = {
          font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "1F4E78" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      // 🧾 Spacer row (5)
      else if (R === 5) {
        cell.s = {
          font: { name: "Calibri", sz: 10 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      // 📘 Title row (6)
      else if (R === 6) {
        cell.s = {
          font: { name: "Calibri", sz: 14, bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "305496" } },
          border: {
            top:    { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left:   { style: "thin", color: { rgb: "000000" } },
            right:  { style: "thin", color: { rgb: "000000" } },
          },
        };
      }

      // 🧾 Spacer row (7)
      else if (R === 7) {
        cell.s = {
          font: { name: "Calibri", sz: 10 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "000000" } }, // ✅ Divider under header block
          },
        };
      }
    }
  }
};


