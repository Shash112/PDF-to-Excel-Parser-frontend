import React from "react";

export default function ItemsEditor({ data, onChange, onNext, assignHsCode }) {
  
  const handleItemChange = (idx, field, value) => {
    const items = data.items.map((it, i) => {
      if (i !== idx) return it;

      const updatedItem = { ...it, [field]: value };

      // ✅ Auto-calculate Total Weight when qty or unitWeight changes
      if (field === "qty" || field === "unitWeight") {
        const qty = parseFloat(updatedItem.qty || 0);
        const unitWeight = parseFloat(updatedItem.unitWeight || 0);
        updatedItem.totalWeight =
          qty && unitWeight ? (qty * unitWeight).toFixed(2) : "";
      }

      return updatedItem;
    });

    let updatedData = { ...data, items };

    if (field === "origin") {
          const uniqueOriginMap = new Map();

          items.forEach((it) => {
            const origin = it.origin?.trim();
            if (!origin) return; // skip falsy
            const key = origin.toLowerCase();
            if (!uniqueOriginMap.has(key)) {
              uniqueOriginMap.set(key, origin); // preserve first original casing
            }
          });

          const uniqueOrigin = Array.from(uniqueOriginMap.values());

        updatedData = {
          ...updatedData,
          header: {
            ...data.header,
            uniqueOrigin,
          },
        };
      }
      console.log(updatedData)
      onChange(updatedData);
  };

  const ensureCISuffix = (value = "") => {
      if (!value) return "";
      const cleanValue = value.trim();
      return cleanValue.toUpperCase().endsWith("-CI")
        ? cleanValue
        : `${cleanValue}-CI`;
    };

    const setHeader = (k, v) =>
      onChange((prev) => ({
        ...prev,
        header: { ...prev.header, [k]: v },
    }));

  const autoHs = () => {
    const items = data.items.map((it) => ({
      ...it,
      hsCode: assignHsCode(it.description),
    }));
    onChange({ ...data, items });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-12">
      {/* Floating Header Bar */}
      <div className="w-full max-w-7xl mb-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-md py-3 px-6 z-20">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight flex items-center gap-2">
          <span className="text-blue-600">📦</span> Step 1 — Items Editor
        </h1>

        <div className="flex gap-3">
          <button
            onClick={autoHs}
            className="px-5 py-2.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow transition-all"
          >
            ⚙️ Auto HS Codes
          </button>
          <button
            onClick={onNext}
            className="px-5 py-2.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow transition-all"
          >
            💾 Save & Next
          </button>
        </div>
      </div>
      <>
        {/* Company Header */}
        <div className="relative w-full">
          <img
            src="/logo.png"
            width={150}
            height={150}
            alt="Company Logo"
            className="absolute left-12"
          />
          <div className="text-center border-b pb-3 mb-4">
            <h1 className="text-xl font-bold uppercase">
              MSG OILFIELD EQUIPMENT TRADING LLC
            </h1>
            <p>Dubai Industrial City (DIC), Phase 1</p>
            <p>Sai Shuaib 2, Warehouse No: J-04, Dubai, United Arab Emirates</p>
            <p>
              <strong>TRN No:</strong> 100518964000003
            </p>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-center underline mb-4">
          {"No Title"}
        </h2>

        {/* Header Info */}
        <table className="w-full border border-gray-400 mb-4 text-sm">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-3 align-top w-1/2">
                <strong>BUYER/CONSIGNEE :</strong>
                <textarea
                  rows={1}
                  value={data.header.buyer || ""}
                  onChange={(e) => setHeader("buyer", e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded p-1"
                />
                <textarea
                  rows={4}
                  value={data.header.buyerAddress || ""}
                  onChange={(e) => setHeader("buyerAddress", e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded p-1"
                />

              </td>
              <td className="border border-gray-400 p-3 align-top">
                <div className="space-y-2">
                  <div>
                    <strong>DATE :</strong>{" "}
                    <input
                      type="text"
                      value={data.header.orderDate || ""}
                      onChange={(e) => setHeader("orderDate", e.target.value)}
                      className="border border-gray-300 rounded p-1 ml-1 w-44"
                    />
                  </div>

                  {/* ✅ INV. NO auto-suffix with -CI */}
                  <div>
                    <strong>INV. NO :</strong>{" "}
                    <input
                      type="text"
                      value={ensureCISuffix(data.header.salesOrderNo || "")}
                      onChange={(e) =>
                        setHeader("salesOrderNo", ensureCISuffix(e.target.value))
                      }
                      className="border border-gray-300 rounded p-1 ml-1 w-44 uppercase"
                      placeholder="Enter Invoice No"
                    />
                  </div>

                  <div>
                    <strong>PO Number :</strong>{" "}
                    <input
                      type="text"
                      value={data.header.refNo || ""}
                      onChange={(e) => setHeader("refNo", e.target.value)}
                      className="border border-gray-300 rounded p-1 ml-1 w-44"
                    />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Buyer / Sold To / Shipment */}
        <table className="w-full border border-gray-400 mb-6 text-sm">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-3 align-top w-1/2">
                {/* Mode of Shipment Dropdown */}
                <div className="mt-2 flex items-center gap-2">
                  <strong>MODE OF SHIPMENT :</strong>
                  <select
                    value={data.header.modeOfShipment || ""}
                    onChange={(e) => setHeader("modeOfShipment", e.target.value)}
                    className="border border-gray-300 rounded p-1 w-64 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Mode</option>
                    <option value="AIR">AIR</option>
                    <option value="SEA">SEA</option>
                    <option value="LAND">LAND</option>
                    <option value="COURIER">COURIER</option>
                  </select>
                </div>

                {/* Freight Terms Dropdown */}
                <div className="mt-2 flex items-center gap-2">
                  <strong>FREIGHT TERMS :</strong>
                  <select
                    value={data.header.freightTerms || ""}
                    onChange={(e) => setHeader("freightTerms", e.target.value)}
                    className="border border-gray-300 rounded p-1 w-64 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Term</option>
                    <option value="EX-WORKS">EX-WORKS</option>
                    <option value="DDP">DDP</option>
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                  </select>
                </div>

                {/* Loading & Discharge */}
                <div className="mt-2">
                  <strong>PLACE OF LOADING :</strong>{" "}
                  <input
                    type="text"
                    value={data.header.placeOfLoading || ""}
                    onChange={(e) => setHeader("placeOfLoading", e.target.value)}
                    className="border border-gray-300 rounded p-1 ml-1 w-64"
                  />
                </div>

                <div className="mt-1">
                  <strong>PLACE OF DISCHARGE :</strong>{" "}
                  <input
                    type="text"
                    value={data.header.placeOfDischarge || ""}
                    onChange={(e) =>
                      setHeader("placeOfDischarge", e.target.value)
                    }
                    className="border border-gray-300 rounded p-1 ml-1 w-64"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </>

      {/* Main Table Section */}
      <div className="w-full max-w-7xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10 shadow-sm">
              <tr className="text-center uppercase text-xs tracking-wide">
                <th className="px-4 py-3 border-b border-gray-300 w-12">ID</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left">
                  Description
                </th>
                <th className="px-4 py-3 border-b border-gray-300 w-20">Qty</th>
                <th className="px-4 py-3 border-b border-gray-300 w-20">UOM</th>
                <th className="px-4 py-3 border-b border-gray-300 w-28">
                  HS Code
                </th>
                <th className="px-4 py-3 border-b border-gray-300 w-28">
                  Origin
                </th>
                <th className="px-4 py-3 border-b border-gray-300 w-28">
                  Unit Weight (kg)
                </th>
                <th className="px-4 py-3 border-b border-gray-300 w-28">
                  Total Weight (kg)
                </th>
              </tr>
            </thead>

            <tbody>
              {data.items.length > 0 ? (
                data.items.map((it, i) => (
                  <tr
                    key={it.id}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition-colors duration-150`}
                  >
                    <td className="border-t border-gray-200 px-4 py-2 text-center text-gray-600 font-medium">
                      {it.id}
                    </td>

                    <td className="border-t border-gray-200 px-4 py-2">
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

                    <td className="border-t border-gray-200 px-4 py-2 text-center">
                      <input
                        type="number"
                        readOnly
                        value={it.qty || ""}
                        onChange={(e) =>
                          handleItemChange(i, "qty", e.target.value)
                        }
                        placeholder="0"
                        className="w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                      />
                    </td>

                    <td className="border-t border-gray-200 px-4 py-2 text-center">
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

                    <td className="border-t border-gray-200 px-4 py-2 text-center">
                      <input
                        type="text"
                        value={it.hsCode || ""}
                        onChange={(e) =>
                          handleItemChange(i, "hsCode", e.target.value)
                        }
                        placeholder="HS Code"
                        className="w-full text-center p-1.5 border border-gray-300 rounded-lg text-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                      />
                    </td>

                    <td className="border-t border-gray-200 px-4 py-2 text-center">
                      <input
                        type="text"
                        value={it.origin || ""}
                        onChange={(e) =>
                          handleItemChange(i, "origin", e.target.value)
                        }
                        placeholder="Country"
                        className="w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                      />
                    </td>

                    <td className="border-t border-gray-200 px-4 py-2 text-center">
                      <input
                        type="number"
                        value={it.unitWeight || ""}
                        onChange={(e) =>
                          handleItemChange(i, "unitWeight", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                      />
                    </td>

                    <td className="border-t border-gray-200 px-4 py-2 text-center bg-gray-100">
                      <input
                        type="text"
                        value={it.totalWeight || ""}
                        readOnly
                        placeholder="Auto"
                        className="w-full text-center p-1.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-10 text-gray-500 italic bg-gray-50"
                  >
                    No items found. Please upload or add data to continue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        
      </div>
    </div>
  );
}
