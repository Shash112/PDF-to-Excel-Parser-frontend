import React from "react";

export default function SummaryPreview({ data, onChange }) {
  const { header = {}, items = [] } = data;

  const handleItemChange = (idx, field, value) => {
    const items = data.items.map((it, i) => {
      if (i !== idx) return it;

      const updatedItem = { ...it, [field]: value };

      return updatedItem;
    });

    onChange({ ...data, items });
  };

  const setHeader = (k, v) =>
    onChange((prev) => ({
      ...prev,
      header: { ...prev.header, [k]: v },
    }));

  return (
    <div className="bg-white border rounded-lg shadow p-6 w-full text-sm">
      {/* 🔁 Reuse Common Header Section */}
      <table className="w-full border border-gray-400 mb-4 text-sm">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 align-top w-1/2">
              <strong>Client :</strong>
              <textarea
                rows={4}
                value={header.buyer || ""}
                onChange={(e) => setHeader("buyer", e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1"
              />
            </td>
          </tr>
            <tr>
            <td className="border border-gray-400 p-3 align-top w-1/2">
              <strong>PO Number :</strong>
              <input
                    type="text"
                    value={header.po_number || ""}
                    onChange={(e) => setHeader("po_number", e.target.value)}
                    className="border border-gray-300 rounded p-1 ml-1 w-44"
                  />
            </td>
          </tr>
            <tr>
            <td className="border border-gray-400 p-3 align-top w-1/2">
              <strong>MSG Ref:</strong>
              <input
                    type="text"
                    value={header.refNo || ""}
                    onChange={(e) => setHeader("refNo", e.target.value)}
                    className="border border-gray-300 rounded p-1 ml-1 w-44"
                  />
            </td>
          </tr>
        </tbody>
      </table>

      {/* === Summary Table === */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border border-gray-400 text-sm">
          <thead className="bg-gray-100">
            <tr className="text-center">
              <th className="border border-gray-400 px-2 py-1 w-10">SL Number</th>
              <th className="border border-gray-400 px-2 py-1 text-left">DESCRIPTION</th>
              <th className="border border-gray-400 px-2 py-1 w-16">PO QTY</th>
              <th className="border border-gray-400 px-2 py-1 w-16">UOM</th>
              <th className="border border-gray-400 px-2 py-1 w-24">Heat CODE</th>
              <th className="border border-gray-400 px-2 py-1 w-20">Certificate Number</th>
              <th className="border border-gray-400 px-2 py-1 w-24">Make</th>
              <th className="border border-gray-400 px-2 py-1 w-24">Remarks</th>
            </tr>
          </thead>

          <tbody>
            {(items || []).map((it, i) => (
              <tr
                key={it.id}
                className="even:bg-gray-50 hover:bg-blue-50 transition-colors"
              >
                <td className="border border-gray-400 px-2 py-1 text-center">{i + 1}</td>
                <td className="border border-gray-400 px-2 py-1">
                    <textarea
                        rows={2}
                        value={it.description || ""}
                        onChange={(e) =>
                          handleItemChange(i, "description", e.target.value)
                        }
                        placeholder="Enter item description..."
                        className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition-all resize-none"
                      />
                </td>
                <td className="border border-gray-400 px-2 py-1 text-center">
                    <input
                        type="number"
                        value={it.qty || ""}
                        onChange={(e) =>
                          handleItemChange(i, "qty", e.target.value)
                        }
                        placeholder="0"
                        className="w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                      />
                </td>
                <td className="border border-gray-400 px-2 py-1 text-center">
                    <input
                        type="text"
                        value={it.unit || ""}
                        onChange={(e) =>
                          handleItemChange(i, "unit", e.target.value)
                        }
                        placeholder="PCS / SET"
                        className="w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                      />
                </td>
                <td className="border border-gray-400 px-2 py-1 text-center">
                    <input
                        type="text"
                        value={it.heatNumber || ""}
                        onChange={(e) =>
                          handleItemChange(i, "heatNumber", e.target.value)
                        }
                        placeholder="Heat Number"
                        className="w-full text-center p-1.5 border border-gray-300 rounded-lg text-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                      />
                </td>
                <td className="border border-gray-400 px-2 py-1 text-center">
                    <input
                        type="text"
                        value={it.certificateNumber || ""}
                        onChange={(e) =>
                          handleItemChange(i, "certificateNumber", e.target.value)
                        }
                        placeholder="Cerificate Number"
                        className="w-full text-center p-1.5 border border-gray-300 rounded-lg text-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                      />
                </td>
                <td className="border border-gray-400 px-2 py-1 text-center">
                    <input
                        type="text"
                        value={it.make || ""}
                        onChange={(e) =>
                          handleItemChange(i, "make", e.target.value)
                        }
                        placeholder="Make"
                        className="w-full text-center p-1.5 border border-gray-300 rounded-lg text-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                      />
                </td>
                <td className="border border-gray-400 px-2 py-1 text-center">
                    <input
                        type="text"
                        value={it.remarks || ""}
                        onChange={(e) =>
                          handleItemChange(i, "remarks", e.target.value)
                        }
                        placeholder="Remarks"
                        className="w-full text-center p-1.5 border border-gray-300 rounded-lg text-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                      />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
