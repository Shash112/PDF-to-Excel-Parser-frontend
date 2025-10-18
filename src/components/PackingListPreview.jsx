import React, { useMemo } from "react";
import * as XLSX from "xlsx";
import CommonHeader from "./CommanHeader";

export default function PackingListPreview({ data, onChange, }) {
  const { header = {}, groups = [], items = [] } = data;

  // ✅ Compute unique HS Codes
  const uniqueHsCodes = useMemo(() => {
    const hsSet = new Set();
    (items || []).forEach((it) => it.hsCode && hsSet.add(it.hsCode));
    (groups || []).forEach((g) =>
      (g.items || []).forEach((it) => it.hsCode && hsSet.add(it.hsCode))
    );
    return Array.from(hsSet);
  }, [items, groups]);

  // ✅ Compute group and total weights
  const { groupWeights, totalNet, totalGross } = useMemo(() => {
    let groupWeights = [];
    let totalNet = 0;
    let totalGross = 0;

    if (groups.length > 0) {
      groupWeights = groups.map((g) => {
        let net = 0;
        (g.items || []).forEach((it) => {
          const qty = parseFloat(it.qty || 0);
          const uw = parseFloat(it.unitWeight || 0);
          net += qty * uw;
        });
        const gross = +(net * 1.04).toFixed(2);
        totalNet += net;
        totalGross += gross;
        return { name: g.name, net: +net.toFixed(2), gross };
      });
    } else {
      (items || []).forEach((it) => {
        const qty = parseFloat(it.qty || 0);
        const uw = parseFloat(it.unitWeight || 0);
        totalNet += qty * uw;
      });
      totalGross = +(totalNet * 1.04).toFixed(2);
    }

    return { groupWeights, totalNet: +totalNet.toFixed(2), totalGross };
  }, [items, groups]);

  // ✅ Existing Excel Export (unchanged)
//   const exportToExcel = () => {
//     const wb = XLSX.utils.book_new();
//     const ws_data = [];

//     ws_data.push(["MSG OILFIELD EQUIPMENT TRADING LLC"]);
//     ws_data.push(["Dubai Industrial City (DIC), Phase 1"]);
//     ws_data.push(["Sai Shuaib 2, Warehouse No: J-04,"]);
//     ws_data.push([" Dubai, United Arab Emirates"]);
//     ws_data.push(["TRN No: 100518964000003"]);
//     ws_data.push([]);
//     ws_data.push(["PACKING LIST"]);
//     ws_data.push([]);
//     ws_data.push(["DATE:", header.orderDate || "", "", "INV. NO:", header.salesOrderNo || "",]);
//     ws_data.push(["S.O. REF:", header.refNo || "", ]);
//     ws_data.push([]);
//     ws_data.push(["CONSIGNEE:", header.buyer || ""]);
//     ws_data.push(["SOLD TO / INVOICED TO:", header.buyer || ""]);
//     ws_data.push(["MODE OF SHIPMENT:", header.modeOfShipment || "", "", "FREIGHT TERMS:", header.freightTerms || "", ]);
//     ws_data.push(["PLACE OF LOADING:", header.placeOfLoading || "", "", "PLACE OF DISCHARGE:", header.placeOfDischarge || "", ]);
//     ws_data.push([]);
//     ws_data.push(["COUNTRY OF ORIGIN:", header.countryOfOrigin || "UAE"]);
//     ws_data.push([]);
//     ws_data.push(["HS CODE:", uniqueHsCodes.join(", ")]);
//     ws_data.push([]);

//     ws_data.push(["SR NO", "DESCRIPTION", "QTY", "UOM", "H.S. CODE", "ORIGIN", "UNIT WEIGHT / KGS", "TOTAL WEIGHT / KGS", ]);

//     let globalNet = 0;
//     let globalGross = 0;

//     if ((data.groups || []).length > 0) {
//       data.groups.forEach((g) => {
//         ws_data.push([]);
//         ws_data.push([`${g.name}`]);

//         let groupNet = 0;
//         g.items.forEach((it, idx) => {
//           const qty = parseFloat(it.qty || 0);
//           const unitWeight = parseFloat(it.unitWeight || 0);
//           const totalWeight = +(qty * unitWeight).toFixed(2);
//           groupNet += totalWeight;

//           ws_data.push([
//             idx + 1,
//             it.description,
//             it.qty,
//             it.unit,
//             it.hsCode,
//             it.origin || "UAE",
//             it.unitWeight || "",
//             totalWeight,
//           ]);
//         });

//         const groupGross = +(groupNet * 1.04).toFixed(2);
//         ws_data.push(["", "", "", "", "", "", "Group Net Weight:", groupNet]);
//         ws_data.push(["", "", "", "", "", "", "Group Gross Weight:", groupGross]);
//         globalNet += groupNet;
//         globalGross += groupGross;
//       });
//     } else {
//       (data.items || []).forEach((it, idx) => {
//         const qty = parseFloat(it.qty || 0);
//         const unitWeight = parseFloat(it.unitWeight || 0);
//         const totalWeight = +(qty * unitWeight).toFixed(2);
//         globalNet += totalWeight;

//         ws_data.push([
//           idx + 1,
//           it.description,
//           it.qty,
//           it.unit,
//           it.hsCode,
//           it.origin || "UAE",
//           it.unitWeight || "",
//           totalWeight,
//         ]);
//       });
//       globalGross = +(globalNet * 1.04).toFixed(2);
//     }

//     ws_data.push([]);
//     ws_data.push(["", "", "", "", "", "", "TOTAL NET WEIGHT (ALL GROUPS):", globalNet]);
//     ws_data.push([ "", "", "", "", "", "", "TOTAL GROSS WEIGHT (ALL GROUPS):", globalGross]);
//     ws_data.push([]);
//     ws_data.push(["PACKING DETAILS", header.packingDetails || ""]);
//     ws_data.push(["SHIPPING MARKS", header.buyer || ""]);
//     ws_data.push([]);

//     const ws = XLSX.utils.aoa_to_sheet(ws_data);
//     ws["!cols"] = [
//       { wch: 6 },
//       { wch: 80 },
//       { wch: 10 },
//       { wch: 10 },
//       { wch: 14 },
//       { wch: 14 },
//       { wch: 16 },
//       { wch: 18 },
//     ];

//     const bold = { font: { bold: true } };
//     ["A1", "A6", "A8", "A16"].forEach((c) => ws[c] && (ws[c].s = bold));

//     ws["!autofilter"] = { ref: "A21:H21" };
//     XLSX.utils.book_append_sheet(wb, ws, "Packing_List");

//     const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     saveAs(
//       new Blob([wbout], { type: "application/octet-stream" }),
//       `Packing_List_${header.salesOrderNo || "Export"}.xlsx`
//     );
//   };

  const showGroups = (groups || []).length > 0;
  const setHeader = (k, v) => onChange({ ...data, header: { ...header, [k]: v } });
  
  return (
    <div className="bg-white border rounded-lg shadow p-6 w-full">
      {/* Header */}
      {/* <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Step 3 — Preview / Print</h2>
        <div className="flex gap-2">
          <button onClick={onPrev} className="px-3 py-1 bg-gray-200 rounded">
            ◀ Back
          </button>
          <button
            onClick={exportToExcel}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            ⬇ Export Excel
          </button>
        </div>
      </div> */}

      {/* Company Header */}
      <CommonHeader
        header={header}
        title="PACKING LIST"
        onChange={onChange}
        uniqueHsCodes={uniqueHsCodes}
        />

      {/* Items / Groups */}
      {!showGroups ? (
        <div className="overflow-x-auto mb-6">
          <table className="w-full border border-gray-400 text-sm">
            <thead className="bg-gray-100">
              <tr className="text-center">
                <th className="border border-gray-400 px-2 py-1 w-10">SR</th>
                <th className="border border-gray-400 px-2 py-1 text-left">DESCRIPTION</th>
                <th className="border border-gray-400 px-2 py-1 w-16">QTY</th>
                <th className="border border-gray-400 px-2 py-1 w-16">UOM</th>
                <th className="border border-gray-400 px-2 py-1 w-24">H.S. CODE</th>
                <th className="border border-gray-400 px-2 py-1 w-20">ORIGIN</th>
                <th className="border border-gray-400 px-2 py-1 w-28">UNIT WEIGHT / KGS</th>
                <th className="border border-gray-400 px-2 py-1 w-28">TOTAL WEIGHT / KGS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="border border-gray-400 px-2 py-1 text-center">{i + 1}</td>
                  <td className="border border-gray-400 px-2 py-1">{it.description}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{it.qty}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{it.unit}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{it.hsCode}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{it.origin}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{it.unitWeight || "—"}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{it.totalWeight || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        (groups || []).map((g, gi) => (
          <div key={g.id} className="mb-8">
            <div className="font-semibold mb-2">
              {g.name}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-400 text-sm">
                <thead className="bg-gray-100">
                  <tr className="text-center">
                    <th className="border border-gray-400 px-2 py-1 w-10">SR</th>
                    <th className="border border-gray-400 px-2 py-1 text-left">DESCRIPTION</th>
                    <th className="border border-gray-400 px-2 py-1 w-16">QTY</th>
                    <th className="border border-gray-400 px-2 py-1 w-16">UOM</th>
                    <th className="border border-gray-400 px-2 py-1 w-24">H.S. CODE</th>
                    <th className="border border-gray-400 px-2 py-1 w-20">ORIGIN</th>
                    <th className="border border-gray-400 px-2 py-1 w-28">UNIT WEIGHT / KGS</th>
                    <th className="border border-gray-400 px-2 py-1 w-28">TOTAL WEIGHT / KGS</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.length === 0 ? (
                    <tr>
                      <td
                        className="border border-gray-400 px-2 py-2 text-center text-gray-500"
                        colSpan={8}
                      >
                        No items in this group.
                      </td>
                    </tr>
                  ) : (
                    g.items.map((it, i) => (
                      <tr key={it.id} className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                        <td className="border border-gray-400 px-2 py-1 text-center">{i + 1}</td>
                        <td className="border border-gray-400 px-2 py-1">{it.description}</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">{it.qty}</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">{it.unit}</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">{it.hsCode}</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">{it.origin}</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">{it.unitWeight || "—"}</td>
                        <td className="border border-gray-400 px-2 py-1 text-center">{it.totalWeight || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ Group Net & Gross Display */}
            <div className="text-right mt-2 text-sm">
              <p>
                <strong>Group Net Weight:</strong>{" "}
                {groupWeights[gi]?.net || 0} KGS
              </p>
              <p>
                <strong>Group Gross Weight:</strong>{" "}
                {(groupWeights[gi]?.gross) || 0} KGS
              </p>
            </div>
          </div>
        ))
      )}

      {/* Packing Details & Marks */}
      <div className="mt-4 border-t border-gray-300 pt-3 text-sm">
        <strong>PACKING DETAILS:</strong>
        <textarea
          rows={2}
          value={header.packingDetails || ""}
          onChange={(e) => setHeader("packingDetails", e.target.value)}
          className="w-full border border-gray-400 rounded p-1 mt-1"
          placeholder="TOTAL OF 1 PACKAGE (4 WOODEN BOX + 8 WOODEN PALLET)"
        />
        <strong className="block mt-4">SHIPPING MARKS:</strong>
        <textarea
          rows={4}
          value={header.buyer || ""}
          onChange={(e) => setHeader("shippingMarks", e.target.value)}
          className="w-full border border-gray-400 rounded p-1 mt-1"
        />
      </div>

      {/* ✅ Total Net & Gross Display (auto-calculated) */}
      <div className="text-right mt-6 text-sm border-t border-gray-300 pt-3">
        <p>
          <strong>Total Net Weight (Auto):</strong> {totalNet.toFixed(2)} KGS
        </p>
        <p>
          <strong>Total Gross Weight (Auto):</strong> {totalGross.toFixed(2)} KGS
        </p>
      </div>
    </div>
  );
}
