import React, { useState, useMemo } from "react";
import CommonHeader from "./CommanHeader";

export default function InvoicePreview({ data }) {
  const { header = {}, items = [], totals = {}, totalCbm } = data;
  const [priceText] = useState(totals?.subTotalInWords || "AED Zero Only");

  // ✅ Calculate total quantity of all items
  const totalQty = useMemo(() => {
    return (items || []).reduce((sum, it) => sum + parseFloat(it.qty || 0), 0);
  }, [items]);

  
  // ✅ Compute Unique HS Codes (same logic as PackingListPreview)
  const uniqueHsCodes = useMemo(() => {
    const hsSet = new Set();
    (items || []).forEach((it) => it.hsCode && hsSet.add(it.hsCode));
    return Array.from(hsSet);
  }, [items]);

  return (
    <div className="bg-white border rounded-lg shadow p-6 w-full text-sm">
      {/* 🔁 Reuse Common Header Section */}
      <CommonHeader
        header={{ ...header, documentTitle: "INVOICE" }}
        title={"INVOICE"}
        uniqueHsCodes={uniqueHsCodes}
      />

      {/* === Invoice Table === */}
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
              <th className="border border-gray-400 px-2 py-1 w-24">UNIT PRICE / AED</th>
              <th className="border border-gray-400 px-2 py-1 w-24">TOTAL VALUE / AED</th>
            </tr>
          </thead>

          <tbody>
            {(items || []).map((it, i) => (
              <tr
                key={it.id}
                className="even:bg-gray-50 hover:bg-blue-50 transition-colors"
              >
                <td className="border border-gray-400 px-2 py-1 text-center">{i + 1}</td>
                <td className="border border-gray-400 px-2 py-1">{it.description}</td>
                <td className="border border-gray-400 px-2 py-1 text-center">{it.qty}</td>
                <td className="border border-gray-400 px-2 py-1 text-center">{it.unit}</td>
                <td className="border border-gray-400 px-2 py-1 text-center">{it.hsCode}</td>
                <td className="border border-gray-400 px-2 py-1 text-center">
                  {it.origin || "UAE"}
                </td>
                <td className="border border-gray-400 px-2 py-1 text-center">{it.rate}</td>
                <td className="border border-gray-400 px-2 py-1 text-center">{it.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === Totals Section === */}
      <div className="text-right mt-6 text-sm border-t border-gray-300 pt-3">
        <p>
          <strong>Total:</strong> {totals?.subTotal || 0} AED
        </p>
        {/* <p>
          <strong>Total:</strong> {totals?.total || 0} AED
        </p> */}
      </div>

      {/* === Footer Section (Newly Added) === */}
      <div className="mt-6 border border-gray-400 text-sm">
        <table className="w-full border-collapse">
          <tbody>
            {/* TOTAL VALUE IN AED */}
            <tr className="bg-gray-100 font-semibold">
              <td className="border border-gray-400 px-3 py-2 text-right" colSpan={4}>
                TOTAL VALUE IN QTY:
              </td>
              <td className="border border-gray-400 px-3 py-2 text-center w-20">
                {totalQty.toFixed(2)}
              </td>
              <td className="border border-gray-400 px-3 py-2 text-center w-20">
                Nos
              </td>
              <td className="border border-gray-400 px-3 py-2 text-center w-20 " colSpan={3} >
                TOTAL VALUE IN AED:
              </td>
              <td className="border border-gray-400 px-3 py-2 text-right font-bold">
                {totals?.subTotal || "0.00"}
              </td>
            </tr>

            {/* IN WORDS */}
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-left" colSpan={10}>
                <strong>IN WORDS :</strong> {priceText}
              </td>
            </tr>

            {/* PACKING + SHIPPING MARKS */}
            <tr>
              <td
                className="border border-gray-400 px-3 py-2 align-top w-1/2"
                colSpan={5}
              >
                <strong>PACKING DETAILS:</strong>{" "}
                
                {header.packingDetails || ""}
                <br />
                <strong>TOTAL CBM (m³):</strong> {" "}
                {totalCbm?.toFixed(2) || "0.00"}
              </td>

              <td
                className="border border-gray-400 px-3 py-2 align-top w-1/2"
                colSpan={5}
              >
                <strong>SHIPPING MARKS:</strong>
                <br />
                <span className="block">
                  {header.buyer || ""}<br />
                  {header.buyerAddress || ""}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
