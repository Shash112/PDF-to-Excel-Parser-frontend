import React, { useMemo, useEffect } from "react";
import CommonHeader from "./CommanHeader";

export default function PackingListPreview({ data, onChange }) {
  const { header = {}, groups = [], items = [], totalCbm } = data;

  // ✅ Inline row total weight helper (lightweight, no group calc)
  const getRowTotal = (qty, unitWeight) => {
    const q = parseFloat(qty) || 0;
    const u = parseFloat(unitWeight) || 0;
    const tw = q * u;
    return tw > 0 ? tw.toFixed(2) : "—";
  };

  // ✅ Unique HS Codes
  const uniqueHsCodes = useMemo(() => {
    const hsSet = new Set();
    (items || []).forEach((it) => it.hsCode && hsSet.add(it.hsCode));
    (groups || []).forEach((g) =>
      (g.items || []).forEach((it) => it.hsCode && hsSet.add(it.hsCode))
    );
    return Array.from(hsSet);
  }, [items, groups]);

  // ✅ Use existing stored weights from previous screen
  const { groupWeights, totalNet, totalGross } = useMemo(() => {
    let groupWeights = [];
    let totalNet = 0;
    let totalGross = 0;

    if ((groups || []).length > 0) {
      groupWeights = groups.map((g) => {
        const net = parseFloat(g.netWeight) || 0;
        const gross = parseFloat(g.grossWeight) || 0;
        totalNet += net;
        totalGross += gross;
        return { id: g.id, name: g.name, net, gross };
      });
    }

    return {
      groupWeights,
      totalNet: +totalNet.toFixed(2),
      totalGross: +totalGross.toFixed(2),
    };
  }, [groups]);


  // ✅ Auto-packing summary
  const autoPackingSummary = useMemo(() => {
    if (!(groups || []).length) return "";

    const normalizeName = (name = "") => {
      name = name.trim().toLowerCase();
      name = name.replace(/[\s_-]*\d+$/g, ""); // remove trailing numbers
      name = name.replace(/\s+\([^)]*\)$/g, ""); // remove text inside parentheses
      name = name.replace(/\s{2,}/g, " "); // collapse extra spaces
      return name;
    };

    const capitalizeName = (name = "") =>
      name
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    const countMap = new Map();
    (groups || []).forEach((g) => {
      const rawName = g.name?.trim() || "Unknown";
      const key = normalizeName(rawName);
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });

    const totalPackages = Array.from(countMap.values()).reduce((sum, c) => sum + c, 0);

    const details = Array.from(countMap.entries())
      .map(([name, count]) => `${count} ${capitalizeName(name)}`)
      .join(" + ");

    return `Total Packages: ${totalPackages} (${details})`;
  }, [groups]);


  useEffect(() => {
    if (autoPackingSummary) {
      onChange({
        ...data,
        header: {
          ...header,
          packingDetails: autoPackingSummary,
        },
      });
    }
  }, [autoPackingSummary]);

  const showGroups = (groups || []).length > 0;

  return (
    <div className="bg-white border rounded-lg shadow p-6 w-full">
      {/* Header */}
      <CommonHeader
        header={header}
        title="PACKING LIST"
        uniqueHsCodes={uniqueHsCodes}
      />

      {/* Items / Groups */}
      {!showGroups ? (
        // 🔹 Non-grouped items
        <div className="overflow-x-auto mb-6">
          <table className="w-full border border-gray-400 text-sm">
            <thead className="bg-gray-100">
              <tr className="text-center">
                <th className="border border-gray-400 px-2 py-1 w-10">SR</th>
                <th className="border border-gray-400 px-2 py-1 text-left">
                  DESCRIPTION
                </th>
                <th className="border border-gray-400 px-2 py-1 w-16">QTY</th>
                <th className="border border-gray-400 px-2 py-1 w-16">UOM</th>
                <th className="border border-gray-400 px-2 py-1 w-24">
                  H.S. CODE
                </th>
                <th className="border border-gray-400 px-2 py-1 w-20">
                  ORIGIN
                </th>
                <th className="border border-gray-400 px-2 py-1 w-28">
                  UNIT WT / KGS
                </th>
                <th className="border border-gray-400 px-2 py-1 w-28">
                  TOTAL WT / KGS
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr
                  key={it.id}
                  className="even:bg-gray-50 hover:bg-blue-50 text-center"
                >
                  <td className="border border-gray-400 px-2 py-1">{i + 1}</td>
                  <td className="border border-gray-400 px-2 py-1 text-left">
                    {it.description}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">{it.qty}</td>
                  <td className="border border-gray-400 px-2 py-1">{it.unit}</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {it.hsCode}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {it.origin}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {it.unitWeight || "—"}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {getRowTotal(it.qty, it.unitWeight)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // 🔹 Grouped items
        (groups || []).map((g, gi) => (
          <div key={g.id} className="mb-8">
            {/* Group header */}
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">
                {g.name}{" "}
                {g.cbm ? (
                  <span className="text-gray-600 text-sm">
                    (<strong>{g.cbm} m³</strong>)
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">(No dimensions)</span>
                )}
              </div>
            </div>

            {/* Items under group */}
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-400 text-sm">
                <thead className="bg-gray-100">
                  <tr className="text-center">
                    <th className="border border-gray-400 px-2 py-1 w-10">SR</th>
                    <th className="border border-gray-400 px-2 py-1 text-left">
                      DESCRIPTION
                    </th>
                    <th className="border border-gray-400 px-2 py-1 w-16">QTY</th>
                    <th className="border border-gray-400 px-2 py-1 w-16">UOM</th>
                    <th className="border border-gray-400 px-2 py-1 w-24">
                      H.S. CODE
                    </th>
                    <th className="border border-gray-400 px-2 py-1 w-20">
                      ORIGIN
                    </th>
                    <th className="border border-gray-400 px-2 py-1 w-28">
                      UNIT WT / KGS
                    </th>
                    <th className="border border-gray-400 px-2 py-1 w-28">
                      TOTAL WT / KGS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="border border-gray-400 px-2 py-2 text-center text-gray-500"
                      >
                        No items in this group.
                      </td>
                    </tr>
                  ) : (
                    g.items.map((it, i) => (
                      <tr
                        key={`${g.id}-${it.id}-${i}`}
                        className="even:bg-gray-50 hover:bg-blue-50 text-center"
                      >
                        <td className="border border-gray-400 px-2 py-1">
                          {i + 1}
                        </td>
                        <td className="border border-gray-400 px-2 py-1 text-left">
                          {it.description}
                        </td>
                        <td className="border border-gray-400 px-2 py-1">
                          {it.qty}
                        </td>
                        <td className="border border-gray-400 px-2 py-1">
                          {it.unit}
                        </td>
                        <td className="border border-gray-400 px-2 py-1">
                          {it.hsCode}
                        </td>
                        <td className="border border-gray-400 px-2 py-1">
                          {it.origin}
                        </td>
                        <td className="border border-gray-400 px-2 py-1">
                          {it.unitWeight || "—"}
                        </td>
                        <td className="border border-gray-400 px-2 py-1">
                          {getRowTotal(it.qty, it.unitWeight)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ Group Net & Gross (using stored values) */}
            <div className="text-right mt-2 text-sm">
              <p>
                <strong>Group Net Weight:</strong>{" "}
                {g.netWeight || groupWeights[gi]?.net || 0} KGS
              </p>
              <p>
                <strong>Group Gross Weight:</strong>{" "}
                {g.grossWeight || groupWeights[gi]?.gross || 0} KGS
              </p>
            </div>
          </div>
        ))
      )}

      {/* ✅ Packing Details */}
      <div className="mt-4 border-t border-gray-300 pt-3 text-sm">
        <strong>PACKING DETAILS:</strong>
        <p>{header.packingDetails || autoPackingSummary}</p>
        <strong className="block mt-4">SHIPPING MARKS:</strong>
        <p>{header.buyer || ""}</p>
        <p>{header.buyerAddress || ""}</p>
        <br />
        <strong>TOTAL CBM (m³):</strong> {" "}
        {totalCbm?.toFixed(2) || "0.00"}
      </div>

      {/* ✅ Totals */}
      <div className="text-right mt-6 text-sm border-t border-gray-300 pt-3">
        <p>
          <strong>Total Net Weight:</strong> {totalNet.toFixed(2)} KGS
        </p>
        <p>
          <strong>Total Gross Weight:</strong> {totalGross.toFixed(2)} KGS
        </p>
      </div>
    </div>
  );
}
