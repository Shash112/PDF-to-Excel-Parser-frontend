import React, { useState, useMemo, useEffect } from "react";
import CommonHeader from "./CommanHeader";
import numberToWords from "number-to-words";

export default function InvoicePreview({ data, onChange }) {
  const { header = {}, items = [], totals = {} } = data;
  const [priceText, setPriceText] = useState("");

  useEffect(() => {
    (() => {
      try {
        // 🧹 Step 1: Convert to string and clean unwanted chars
        const raw = (totals?.total ?? "").toString();
        const cleaned = raw.replace(/[^0-9.]/g, ""); // ✅ keep only digits & decimal

        // 🧮 Step 2: Parse as float
        const numericValue = parseFloat(cleaned);

        // 🧱 Step 3: Validate
        if (!Number.isFinite(numericValue)) throw new Error("Invalid number");

        // 🧾 Step 4: Split for whole and decimal part
        const [whole, fraction] = cleaned.split(".");

        // 🗣 Step 5: Convert to words
        const words = numberToWords.toWords(Math.floor(whole || 0));
        const fractionText = fraction && parseInt(fraction) > 0
            ? ` and ${fraction}/100`
            : ``;

        setPriceText(`${words.charAt(0).toUpperCase() + words.slice(1)}${fractionText} Only`);
      } catch {
        // 🧯 Fallback for invalid data
        setPriceText("Zero Only");
      }
    })()
  },[totals?.total])
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
        onChange={(updatedData) => onChange(updatedData)}
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
          <strong>Subtotal:</strong> {totals?.subTotal || 0} AED
        </p>
        <p>
          <strong>Total:</strong> {totals?.total || 0} AED
        </p>
      </div>

      {/* === Footer Section (Newly Added) === */}
      <div className="mt-6 border border-gray-400 text-sm">
        <table className="w-full border-collapse">
          <tbody>
            {/* TOTAL VALUE IN AED */}
            <tr className="bg-gray-100 font-semibold">
              <td className="border border-gray-400 px-3 py-2 text-right" colSpan={6}>
                TOTAL VALUE IN AED.
              </td>
              <td className="border border-gray-400 px-3 py-2 text-center w-20">
                {items.length}
              </td>
              <td className="border border-gray-400 px-3 py-2 text-center w-20">
                Nos
              </td>
              <td className="border border-gray-400 px-3 py-2 text-center w-20">
                AED
              </td>
              <td className="border border-gray-400 px-3 py-2 text-right font-bold">
                {totals?.total || "0.00"}
              </td>
            </tr>

            {/* IN WORDS */}
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-left" colSpan={10}>
                <strong>IN WORDS :</strong> {" "}
                  <input
                    type="text"
                    value={priceText || ""}
                    onChange={(e) => setPriceText(e.target.value)}
                    className="border border-gray-400 rounded p-1 ml-2 w-64"
                    placeholder="price-in-words"
                  />
                    {/* {(() => {
                      try {
                        const raw = (totals?.total ?? "").toString().trim().replace(/,/g, "");
                        const numericValue = parseFloat(raw);
                        if (!Number.isFinite(numericValue)) throw new Error("Invalid number");

                        const [whole, fraction] = raw.split(".");
                        const words = numberToWords.toWords(Math.floor(whole));
                        const fractionText = fraction
                          ? ` and ${fraction.padEnd(2, "0").slice(0, 2)}/100`
                          : "";

                        return `AED ${words.charAt(0).toUpperCase() + words.slice(1)}${fractionText} Only`;
                      } catch {
                        return "AED Zero Only";
                      }
                    })()} */}
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
              </td>

              <td
                className="border border-gray-400 px-3 py-2 align-top w-1/2"
                colSpan={5}
              >
                <strong>SHIPPING MARKS:</strong>
                <br />
                <span className="block">
                  {header.buyer || ""}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
