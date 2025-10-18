import React, { useMemo } from "react";
import CommonHeader from "./CommanHeader";

export default function PackingListPreview({ data, onChange }) {
  const { header = {}, groups = [], items = [] } = data;

  // Helper: safe total weight
  const calcTotal = (qty, unitWeight) => {
    const q = parseFloat((qty ?? "").toString().replace(/,/g, ""));
    const u = parseFloat((unitWeight ?? "").toString().replace(/,/g, ""));
    if (!Number.isFinite(q) || !Number.isFinite(u)) return "";
    const tw = q * u;
    return Number.isFinite(tw) ? +tw.toFixed(2) : "";
  };

  // ✅ Capitalize helper
  const capitalizeName = (name = "") =>
    name.charAt(0).toUpperCase() + name.slice(1);

  // ✅ Unique HS Codes
  const uniqueHsCodes = useMemo(() => {
    const hsSet = new Set();
    (items || []).forEach((it) => it.hsCode && hsSet.add(it.hsCode));
    (groups || []).forEach((g) =>
      (g.items || []).forEach((it) => it.hsCode && hsSet.add(it.hsCode))
    );
    return Array.from(hsSet);
  }, [items, groups]);

  // ✅ Compute group & total weights
  const { groupWeights, totalNet, totalGross } = useMemo(() => {
    let groupWeights = [];
    let totalNet = 0;

    if ((groups || []).length > 0) {
      groupWeights = groups.map((g) => {
        let net = 0;
        (g.items || []).forEach((it) => {
          const tw = calcTotal(it.qty, it.unitWeight);
          if (tw) net += tw;
        });

        const gross =
          parseFloat(g.grossWeight || 0) > 0
            ? parseFloat(g.grossWeight)
            : +(net * 1.04).toFixed(2);

        totalNet += net;
        return { id: g.id, name: g.name, net: +net.toFixed(2), gross };
      });
    } else {
      (items || []).forEach((it) => {
        const tw = calcTotal(it.qty, it.unitWeight);
        if (tw) totalNet += tw;
      });
    }

    const totalGross =
      groupWeights.length > 0
        ? groupWeights.reduce((acc, g) => acc + (g.gross || 0), 0)
        : +(totalNet * 1.04).toFixed(2);

    return { groupWeights, totalNet: +totalNet.toFixed(2), totalGross };
  }, [items, groups]);

  // ✅ Update editable fields
  const handleGroupFieldChange = (gid, field, value) => {
    const newGroups = (data.groups || []).map((g) => {
      if (g.id !== gid) return g;

      const updated = { ...g, [field]: value };

      // ✅ Auto-calculate CBM when dimensions change
      const L = parseFloat(updated.length) || 0;
      const W = parseFloat(updated.width) || 0;
      const H = parseFloat(updated.height) || 0;
      updated.cbm = L && W && H ? parseFloat(((L * W * H) / 1000000).toFixed(3)) : "";

      return updated;
    });
    onChange({ ...data, groups: newGroups });
  };

  // ✅ Update editable gross weight
  const handleGrossWeightChange = (gid, value) => {
    handleGroupFieldChange(gid, "grossWeight", value);
  };

  // ✅ Auto-packing summary
  const autoPackingSummary = useMemo(() => {
    if (!(groups || []).length) return "";
    const countMap = {};
    (groups || []).forEach((g) => {
      const key = g.name?.trim().toLowerCase() || "unknown";
      countMap[key] = (countMap[key] || 0) + 1;
    });
    return Object.entries(countMap)
      .map(([name, count]) => `${count} ${capitalizeName(name)}`)
      .join(", ");
  }, [groups]);

  const showGroups = (groups || []).length > 0;
  const setHeader = (k, v) =>
    onChange({ ...data, header: { ...header, [k]: v } });

  return (
    <div className="bg-white border rounded-lg shadow p-6 w-full">
      {/* Header */}
      <CommonHeader
        header={header}
        title="PACKING LIST"
        onChange={onChange}
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
                <th className="border border-gray-400 px-2 py-1 text-left">DESCRIPTION</th>
                <th className="border border-gray-400 px-2 py-1 w-16">QTY</th>
                <th className="border border-gray-400 px-2 py-1 w-16">UOM</th>
                <th className="border border-gray-400 px-2 py-1 w-24">H.S. CODE</th>
                <th className="border border-gray-400 px-2 py-1 w-20">ORIGIN</th>
                <th className="border border-gray-400 px-2 py-1 w-28">UNIT WT / KGS</th>
                <th className="border border-gray-400 px-2 py-1 w-28">TOTAL WT / KGS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const rowTW = calcTotal(it.qty, it.unitWeight);
                return (
                  <tr key={it.id} className="even:bg-gray-50 hover:bg-blue-50">
                    <td className="border border-gray-400 px-2 py-1 text-center">{i + 1}</td>
                    <td className="border border-gray-400 px-2 py-1">{it.description}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{it.qty}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{it.unit}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{it.hsCode}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{it.origin}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      {it.unitWeight || "—"}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      {rowTW !== "" ? rowTW : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // 🔹 Grouped items
        (groups || []).map((g, gi) => (
          <div key={g.id} className="mb-8">
            {/* Group header with dimensions + CBM */}
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
              {/* Editable fields for LWH */}
              
            </div>

            {/* Items under group */}
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
                    <th className="border border-gray-400 px-2 py-1 w-28">UNIT WT / KGS</th>
                    <th className="border border-gray-400 px-2 py-1 w-28">TOTAL WT / KGS</th>
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
                    g.items.map((it, i) => {
                      const rowTW = calcTotal(it.qty, it.unitWeight);
                      return (
                        <tr key={`${g.id}-${it.id}-${i}`} className="even:bg-gray-50 hover:bg-blue-50">
                          <td className="border border-gray-400 px-2 py-1 text-center">{i + 1}</td>
                          <td className="border border-gray-400 px-2 py-1">{it.description}</td>
                          <td className="border border-gray-400 px-2 py-1 text-center">{it.qty}</td>
                          <td className="border border-gray-400 px-2 py-1 text-center">{it.unit}</td>
                          <td className="border border-gray-400 px-2 py-1 text-center">{it.hsCode}</td>
                          <td className="border border-gray-400 px-2 py-1 text-center">{it.origin}</td>
                          <td className="border border-gray-400 px-2 py-1 text-center">
                            {it.unitWeight || "—"}
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-center">
                            {rowTW !== "" ? rowTW : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ Group Net & Editable Gross */}
            <div className="text-right mt-2 text-sm">
              <p>
                <strong>Group Net Weight:</strong> {groupWeights[gi]?.net || 0} KGS
              </p>
              <p className="flex items-center justify-end gap-2">
                <strong>Group Gross Weight:</strong>
                <input
                  type="number"
                  step="0.01"
                  value={g.grossWeight || groupWeights[gi]?.gross || ""}
                  onChange={(e) => handleGrossWeightChange(g.id, e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-0.5 w-28 text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                />
                <span>KGS</span>
              </p>
            </div>
          </div>
        ))
      )}

      {/* ✅ Packing Details */}
      <div className="mt-4 border-t border-gray-300 pt-3 text-sm">
        <strong>PACKING DETAILS:</strong>
        <textarea
          rows={3}
          value={header.packingDetails || autoPackingSummary}
          onChange={(e) => setHeader("packingDetails", e.target.value)}
          className="w-full border border-gray-400 rounded p-1 mt-1"
          placeholder="Example: 2 Box, 3 Wooden Box"
        />
        <strong className="block mt-4">SHIPPING MARKS:</strong>
        <textarea
          rows={4}
          value={header.shippingMarks || header.buyer || ""}
          onChange={(e) => setHeader("shippingMarks", e.target.value)}
          className="w-full border border-gray-400 rounded p-1 mt-1"
        />
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
