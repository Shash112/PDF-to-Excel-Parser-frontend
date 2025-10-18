import React, { useState, useEffect } from "react";

export default function PackingListExcelStyle({ data, onChange }) {
  const [editableData, setEditableData] = useState(data || null);

  useEffect(() => {
    if (data) setEditableData(data);
  }, [data]);

  useEffect(() => {
    if (onChange && editableData) onChange(editableData);
  }, [editableData]);

  if (!editableData)
    return (
      <div className="text-center text-gray-500 italic p-10">
        📦 No data to display. Upload or parse your PDF to view or edit.
      </div>
    );

  const { header = {}, items = [], totals = {} } = editableData;

  const handleHeaderChange = (field, value) => {
    setEditableData((prev) => ({
      ...prev,
      header: { ...prev.header, [field]: value },
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // ✅ Auto-calculate amount (existing logic)
    if (field === "qty" || field === "rate") {
      const qty = parseFloat(newItems[index].qty || 0);
      const rate = parseFloat(newItems[index].rate || 0);
      newItems[index].amount = (qty * rate).toFixed(2);
    }

    // ✅ NEW FEATURE: Auto-calculate total weight
    if (field === "unitWeight" || field === "qty") {
      const qty = parseFloat(newItems[index].qty || 0);
      const unitWeight = parseFloat(newItems[index].unitWeight || 0);
      newItems[index].totalWeight = (qty * unitWeight).toFixed(2);
    }

    setEditableData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  const handleTotalChange = (field, value) => {
    setEditableData((prev) => ({
      ...prev,
      totals: { ...prev.totals, [field]: value },
    }));
  };

  return (
    <div className="bg-white w-full border rounded-lg shadow-md overflow-hidden p-8 text-gray-800 text-[13px] leading-snug">
      {/* Header Section */}
      <div className="text-center border-b pb-3 mb-4">
        <h1 className="text-xl font-bold uppercase">
          MSG OILFIELD EQUIPMENT TRADING LLC
        </h1>
        <p>Dubai Industrial City (DIC), Phase 1</p>
        <p>
          Saih Shuaib 2, Warehouse No: J-04, Dubai, United Arab Emirates
        </p>
        <p>
          <strong>TRN No:</strong> 100518964000003
        </p>
      </div>

      <h2 className="text-lg font-bold text-center underline mb-6">
        PACKING LIST
      </h2>

      {/* Consignee & Header Info */}
      <table className="w-full border border-gray-400 mb-4">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 w-1/2 align-top">
              <strong>CONSIGNEE :</strong>
              <textarea
                value={header.consignee || ""}
                onChange={(e) =>
                  handleHeaderChange("consignee", e.target.value)
                }
                rows={5}
                className="w-full mt-1 border border-gray-300 rounded p-1 resize-none"
              />
            </td>
            <td className="border border-gray-400 p-3 align-top">
              <div className="space-y-2">
                <div>
                  <strong>DATE :</strong>{" "}
                  <input
                    type="text"
                    value={header.orderDate || ""}
                    onChange={(e) =>
                      handleHeaderChange("orderDate", e.target.value)
                    }
                    className="border border-gray-300 rounded p-1 ml-1 w-40"
                  />
                </div>
                <div>
                  <strong>INV. NO :</strong>{" "}
                  <input
                    type="text"
                    value={header.salesOrderNo || ""}
                    onChange={(e) =>
                      handleHeaderChange("salesOrderNo", e.target.value)
                    }
                    className="border border-gray-300 rounded p-1 ml-1 w-40"
                  />
                </div>
                <div>
                  <strong>S.O. REF :</strong>{" "}
                  <input
                    type="text"
                    value={header.refNo || ""}
                    onChange={(e) =>
                      handleHeaderChange("refNo", e.target.value)
                    }
                    className="border border-gray-300 rounded p-1 ml-1 w-40"
                  />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Buyer / Sold To / Shipping Info */}
      <table className="w-full border border-gray-400 mb-6">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 w-1/2 align-top">
              <strong>BUYER :</strong>
              <textarea
                value={header.buyer || ""}
                onChange={(e) =>
                  handleHeaderChange("buyer", e.target.value)
                }
                rows={4}
                className="w-full mt-1 border border-gray-300 rounded p-1 resize-none"
              />
            </td>
            <td className="border border-gray-400 p-3 w-1/2 align-top">
              <strong>SOLD TO / INVOICED TO :</strong>
              <textarea
                value={header.soldTo || ""}
                onChange={(e) =>
                  handleHeaderChange("soldTo", e.target.value)
                }
                rows={4}
                className="w-full mt-1 border border-gray-300 rounded p-1 resize-none"
              />
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3">
              <strong>MODE OF SHIPMENT :</strong>{" "}
              <input
                type="text"
                value={header.modeOfShipment || ""}
                onChange={(e) =>
                  handleHeaderChange("modeOfShipment", e.target.value)
                }
                className="border border-gray-300 rounded p-1 ml-1 w-52"
              />
            </td>
            <td className="border border-gray-400 p-3">
              <strong>FREIGHT TERMS :</strong>{" "}
              <input
                type="text"
                value={header.freightTerms || ""}
                onChange={(e) =>
                  handleHeaderChange("freightTerms", e.target.value)
                }
                className="border border-gray-300 rounded p-1 ml-1 w-52"
              />
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3">
              <strong>PLACE OF LOADING :</strong>{" "}
              <input
                type="text"
                value={header.placeOfLoading || ""}
                onChange={(e) =>
                  handleHeaderChange("placeOfLoading", e.target.value)
                }
                className="border border-gray-300 rounded p-1 ml-1 w-52"
              />
            </td>
            <td className="border border-gray-400 p-3">
              <strong>PLACE OF DISCHARGE :</strong>{" "}
              <input
                type="text"
                value={header.placeOfDischarge || ""}
                onChange={(e) =>
                  handleHeaderChange("placeOfDischarge", e.target.value)
                }
                className="border border-gray-300 rounded p-1 ml-1 w-52"
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border border-gray-400 border-collapse text-[13px]">
          <thead className="bg-gray-100 font-semibold text-center">
            <tr>
              <th className="border px-2 py-1 w-10">SR</th>
              <th className="border px-2 py-1 text-left">DESCRIPTION</th>
              <th className="border px-2 py-1 w-14">QTY</th>
              <th className="border px-2 py-1 w-16">UOM</th>
              <th className="border px-2 py-1 w-24">H.S. CODE</th>
              <th className="border px-2 py-1 w-20">ORIGIN</th>
              <th className="border px-2 py-1 w-28">UNIT WEIGHT / KGS</th>
              <th className="border px-2 py-1 w-28">TOTAL WEIGHT / KGS</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                <td className="border px-2 py-1 text-center">{item.id}</td>
                <td className="border px-2 py-1">
                  <textarea
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(i, "description", e.target.value)
                    }
                    rows={2}
                    className="w-full border border-gray-200 rounded p-1 resize-none"
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      handleItemChange(i, "qty", e.target.value)
                    }
                    className="w-16 border border-gray-200 rounded text-center"
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) =>
                      handleItemChange(i, "unit", e.target.value)
                    }
                    className="w-16 border border-gray-200 rounded text-center"
                  />
                </td>
                <td className="border px-2 py-1 text-center text-blue-700">
                  <input
                    type="text"
                    value={item.hsCode || ""}
                    onChange={(e) =>
                      handleItemChange(i, "hsCode", e.target.value)
                    }
                    className="w-24 border border-gray-200 rounded text-center"
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="text"
                    value={item.origin || ""}
                    onChange={(e) =>
                      handleItemChange(i, "origin", e.target.value)
                    }
                    className="w-20 border border-gray-200 rounded text-center"
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="text"
                    value={item.unitWeight || ""}
                    onChange={(e) =>
                      handleItemChange(i, "unitWeight", e.target.value)
                    }
                    className="w-24 border border-gray-200 rounded text-center"
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="text"
                    value={item.totalWeight || ""}
                    onChange={(e) =>
                      handleItemChange(i, "totalWeight", e.target.value)
                    }
                    className="w-24 border border-gray-200 rounded text-center"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Packing Details */}
      <div className="mt-4 border-t border-gray-400 pt-3 text-sm">
        <strong>PACKING DETAILS:</strong>{" "}
        <textarea
          value={header.packingDetails || ""}
          onChange={(e) =>
            handleHeaderChange("packingDetails", e.target.value)
          }
          rows={2}
          className="w-full border border-gray-300 rounded p-1 mt-1 resize-none"
          placeholder="TOTAL OF 1 PACKAGE (4 WOODEN BOX + 8 WOODEN PALLET)"
        />

        <strong className="block mt-4">SHIPPING MARKS:</strong>
        <textarea
          value={header.shippingMarks || ""}
          onChange={(e) =>
            handleHeaderChange("shippingMarks", e.target.value)
          }
          rows={4}
          className="w-full border border-gray-300 rounded p-1 mt-1 resize-none"
        />
      </div>

      {/* Totals Section */}
      <div className="flex justify-end gap-8 text-sm mt-6 border-t border-gray-400 pt-3">
        <div className="space-y-2 text-right">
          <p>
            <strong>NET WEIGHT :</strong>{" "}
            <input
              type="text"
              value={totals.netWeight || ""}
              onChange={(e) =>
                handleTotalChange("netWeight", e.target.value)
              }
              className="border border-gray-300 rounded p-1 w-28 text-right"
            />
          </p>
          <p>
            <strong>GROSS WEIGHT :</strong>{" "}
            <input
              type="text"
              value={totals.grossWeight || ""}
              onChange={(e) =>
                handleTotalChange("grossWeight", e.target.value)
              }
              className="border border-gray-300 rounded p-1 w-28 text-right"
            />
          </p>
          <p>
            <strong>SUB TOTAL :</strong>{" "}
            <input
              type="text"
              value={totals.subTotal || ""}
              onChange={(e) =>
                handleTotalChange("subTotal", e.target.value)
              }
              className="border border-gray-300 rounded p-1 w-28 text-right"
            />
          </p>
          <p>
            <strong>TOTAL :</strong>{" "}
            <input
              type="text"
              value={totals.total || ""}
              onChange={(e) => handleTotalChange("total", e.target.value)}
              className="border border-gray-300 rounded p-1 w-28 text-right"
            />
          </p>
        </div>
      </div>
    </div>
  );
}
