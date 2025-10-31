import React, { useState, useEffect } from "react";

export default function ItemsEditor({ data, onChange, onNext }) {

  console.log("Items editor: ", data)
  const [splitModal, setSplitModal] = useState(null);
  const [splitParts, setSplitParts] = useState([]);
  const [validationErrors, setValidationErrors] = useState({
    header: {},
    items: {},
  });
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    validateForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);


  const validateForm = () => {
    const headerFields = [
      "buyer",
      "buyerAddress",
      "orderDate",
      "salesOrderNo",
      "refNo",
      "modeOfShipment",
      "freightTerms",
      "placeOfLoading",
      "placeOfDischarge",
    ];

    const newErrors = { header: {}, items: {} };
    let hasError = false;

    // 🔹 Validate Header
    headerFields.forEach((key) => {
      if (!data.header[key] || data.header[key].trim() === "") {
        newErrors.header[key] = true;
        hasError = true;
      }
    });

    // 🔹 Validate Each Item
    data.items.forEach((item, i) => {
      const itemErrors = {};
      ["itemCode", "description", "qty", "unit", "hsCode", "origin", "unitWeight"].forEach(
        (field) => {
          if (
            item[field] === undefined ||
            item[field] === "" ||
            (typeof item[field] === "number" && item[field] <= 0)
          ) {
            itemErrors[field] = true;
            hasError = true;
          }
        }
      );
      if (Object.keys(itemErrors).length > 0) newErrors.items[i] = itemErrors;
    });

    setValidationErrors(newErrors);
    setIsFormValid(!hasError);
    return !hasError;
  };

  const handleDeleteItem = (itemToDelete) => {
    const message = itemToDelete.splitGroupId
      ? "You are about to delete a split item."
      : "You are about to delete this item.";

    const userInput = prompt(
      `${message}\n\nType "confirm" to proceed with deletion:`
    );

    if (!userInput || userInput.toLowerCase().trim() !== "confirm") {
      alert("❌ Deletion cancelled. Item was not deleted.");
      return;
    }

    let updatedItems = data.items.filter((it) => it.id !== itemToDelete.id);

    // ✅ Optional: Reorder split IDs if needed
    if (itemToDelete.splitGroupId) {
      const groupId = itemToDelete.splitGroupId;
      const groupItems = updatedItems.filter((it) => it.splitGroupId === groupId);

      // Reassign sequential IDs (e.g., 1001-1, 1001-2, 1001-3 → after delete becomes 1001-1, 1001-2)
      groupItems.forEach((it, idx) => {
        it.id = `${groupId}-${idx + 1}`;
      });
    }

    onChange({ ...data, items: updatedItems });

    alert("✅ Item deleted successfully.");
  };



  const openSplitModal = (item, index) => {
    const remainingQty = parseFloat(item.qty) || 0;
    if (!remainingQty || remainingQty <= 1) {
      alert("Quantity must be greater than 1 to split.");
      return;
    }

    const groupId = item.splitGroupId || item.id;
    const existingSplits = data.items.filter(
      (it) => it.splitGroupId === groupId
    );

    if (existingSplits.length >= 1) {
      setSplitParts(
        existingSplits.map((it) => ({
          qty: it.qty,
          origin: it.origin,
          customOrigin: it.customOrigin || "",
        }))
      );
    } else {
      setSplitParts([{ qty: "", origin: "", customOrigin: "" }]);
    }

    setSplitModal({ item, index, splitGroupId: groupId });
  };



  const handleSplitPartChange = (idx, field, value) => {
    const newParts = [...splitParts];
    newParts[idx][field] = value;
    setSplitParts(newParts);
  };

  const addSplitRow = () => {
    setSplitParts((prev) => [...prev, { qty: "", origin: "" }]);
  };

  const removeSplitRow = (idx) => {
    setSplitParts((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveSplit = () => {
    const baseItem = splitModal.item;
    const splitGroupId = baseItem.splitGroupId || baseItem.id;

    // ✅ Get all items in this split group
    const groupItems = data.items.filter(
      (it) => it.splitGroupId === splitGroupId || it.id === baseItem.id
    );

    // ✅ Find total group quantity (sum of all existing splits)
    const groupTotalQty = groupItems.reduce(
      (sum, it) => sum + (parseFloat(it.qty) || 0),
      0
    );

    // ✅ Calculate total split from user input
    const totalSplitQty = splitParts.reduce(
      (sum, p) => sum + (parseFloat(p.qty) || 0),
      0
    );

    if (totalSplitQty !== groupTotalQty) {
      alert(
        `Total split quantity (${totalSplitQty}) must equal the original item/group quantity (${groupTotalQty}).`
      );
      return;
    }

    // ✅ Create new split entries
    const newItems = splitParts.map((p, idx) => ({
      ...baseItem,
      id: `${splitGroupId}-${idx + 1}`,
      splitGroupId,
      qty: parseFloat(p.qty),
      origin: p.origin,
      customOrigin: p.origin === "Other" ? p.customOrigin || "" : "",
      totalWeight:
        parseFloat(p.qty) * parseFloat(baseItem.unitWeight || 0) || 0,
    }));

    // ✅ Remove old splits for this group
    const updatedItems = data.items.filter(
      (it) => it.splitGroupId !== splitGroupId && it.id !== baseItem.id
    );

    // ✅ Insert new splits in place of first group's original position
    const firstIndex = data.items.findIndex(
      (it) => it.splitGroupId === splitGroupId || it.id === baseItem.id
    );

    const finalItems = [
      ...updatedItems.slice(0, firstIndex),
      ...newItems,
      ...updatedItems.slice(firstIndex),
    ];

    // ✅ Update and close modal
    onChange({ ...data, items: finalItems });
    setSplitModal(null);
    setSplitParts([]);
  };

    
  const handleItemChange = (idx, field, value) => {
    const items = data.items.map((it, i) => {
      if (i !== idx) return it;
      const updatedItem = { ...it, [field]: value };

      // 🔹 Clear customOrigin when origin changes away from "Other"
      if (field === "origin" && value !== "Other") {
        updatedItem.customOrigin = "";
      }

      // 🔹 Auto-calculate totalWeight
      if (["qty", "unitWeight"].includes(field)) {
        const qty = parseFloat(updatedItem.qty || 0);
        const unitWeight = parseFloat(updatedItem.unitWeight || 0);
        updatedItem.totalWeight =
          qty && unitWeight ? Number((qty * unitWeight).toFixed(2)) : "";
      }

      return updatedItem;
    });

    // 🔹 Always rebuild header.uniqueOrigin on origin/customOrigin updates
    let updatedData = { ...data, items };
    if (["origin", "customOrigin"].includes(field)) {
      const uniqueOriginSet = new Set();
      items.forEach((row) => {
        const originValue =
          row.origin === "Other"
            ? row.customOrigin?.trim()
            : row.origin?.trim();
        if (originValue) uniqueOriginSet.add(originValue);
      });
      updatedData.header = {
        ...data.header,
        uniqueOrigin: Array.from(uniqueOriginSet),
      };
    }

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-12">
      {/* Floating Header Bar */}
      <div className="w-full max-w-7xl mb-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-md py-3 px-6 z-20">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight flex items-center gap-2">
          <span className="text-blue-600">📦</span> Step 1 — Items Editor
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => {
              if (validateForm()) {
                onNext();
              }
            }}
            disabled={!isFormValid}
            className={`px-5 py-2.5 rounded-lg shadow text-sm font-medium transition-all
              ${isFormValid
                ? "cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
              }`}
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
                  className={`w-full mt-1 border border-gray-300 rounded p-1 ${validationErrors.header.buyer ? "border-red-500" : "border-gray-300"}`}
                />
                {validationErrors.header.buyer && (
                  <p className="text-red-500 text-xs mt-1">Required field</p>
                )}
                <textarea
                  rows={4}
                  value={data.header.buyerAddress || ""}
                  onChange={(e) => setHeader("buyerAddress", e.target.value)}
                  className={`w-full mt-1 border border-gray-300 rounded p-1 ${validationErrors.header.buyerAddress ? "border-red-500" : "border-gray-300"}`}
                />
                {validationErrors.header.buyerAddress && (
                  <p className="text-red-500 text-xs mt-1">Required field</p>
                )}

              </td>
              <td className="border border-gray-400 p-3 align-top">
                <div className="space-y-2">
                  <div>
                    <strong>DATE :</strong>{" "}
                    <input
                      type="text"
                      value={data.header.orderDate || ""}
                      onChange={(e) => setHeader("orderDate", e.target.value)}
                      className={`border border-gray-300 rounded p-1 ml-1 w-44 ${validationErrors.header.orderDate ? "border-red-500" : "border-gray-300"}`}
                    />
                    {validationErrors.header.orderDate && (
                      <p className="text-red-500 text-xs mt-1">Required field</p>
                    )}
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
                      className={`border border-gray-300 rounded p-1 ml-1 w-44 uppercase ${validationErrors.header.salesOrderNo ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Enter Invoice No"
                    />
                    {validationErrors.header.salesOrderNo && (
                      <p className="text-red-500 text-xs mt-1">Required field</p>
                    )}
                  </div>

                  <div>
                    <strong>PO Number :</strong>{" "}
                    <input
                      type="text"
                      value={data.header.refNo || ""}
                      onChange={(e) => setHeader("refNo", e.target.value)}
                      className={`border border-gray-300 rounded p-1 ml-1 w-44 salesOrderNo ${validationErrors.header.refNo ? "border-red-500" : "border-gray-300"}`}
                    />
                    {validationErrors.header.refNo && (
                      <p className="text-red-500 text-xs mt-1">Required field</p>
                    )}
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
                    className={`border border-gray-300 rounded p-1 w-64 focus:ring-1 focus:ring-blue-500 ${validationErrors.header.modeOfShipment ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select Mode</option>
                    <option value="AIR">AIR</option>
                    <option value="SEA">SEA</option>
                    <option value="LAND">LAND</option>
                    <option value="COURIER">COURIER</option>
                  </select>
                  {validationErrors.header.modeOfShipment && (
                    <p className="text-red-500 text-xs mt-1">Required field</p>
                  )}
                </div>
              </td>
              <td className="border border-gray-400 p-3 align-top w-1/2">
                {/* Freight Terms Dropdown */}
                <div className="mt-2 flex items-center gap-2">
                  <strong>FREIGHT TERMS :</strong>
                  <select
                    value={data.header.freightTerms || ""}
                    onChange={(e) => setHeader("freightTerms", e.target.value)}
                    className={`border border-gray-300 rounded p-1 w-64 focus:ring-1 focus:ring-blue-500 ${validationErrors.header.freightTerms ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select Term</option>
                    <option value="EX-WORKS">EX-WORKS</option>
                    <option value="DDP">DDP</option>
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                  </select>
                  {validationErrors.header.freightTerms && (
                    <p className="text-red-500 text-xs mt-1">Required field</p>
                  )}
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-3 align-top w-1/2">
                                {/* Loading & Discharge */}
                <div className="mt-2">
                  <strong>PLACE OF LOADING :</strong>{" "}
                  <input
                    type="text"
                    value={data.header.placeOfLoading || ""}
                    onChange={(e) => setHeader("placeOfLoading", e.target.value)}
                    className={`border border-gray-300 rounded p-1 ml-1 w-64 ${validationErrors.header.placeOfLoading ? "border-red-500" : "border-gray-300"}`}
                  />
                  {validationErrors.header.placeOfLoading && (
                    <p className="text-red-500 text-xs mt-1">Required field</p>
                  )}
                </div>
              </td>
              <td className="border border-gray-400 p-3 align-top w-1/2">
                <div className="mt-1">
                  <strong>PLACE OF DISCHARGE :</strong>{" "}
                  <input
                    type="text"
                    value={data.header.placeOfDischarge || ""}
                    onChange={(e) =>
                      setHeader("placeOfDischarge", e.target.value)
                    }
                    className={`border border-gray-300 rounded p-1 ml-1 w-64 ${validationErrors.header.placeOfDischarge ? "border-red-500" : "border-gray-300"}`}
                  />
                  {validationErrors.header.placeOfDischarge && (
                    <p className="text-red-500 text-xs mt-1">Required field</p>
                  )}
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
                <th className="px-4 py-3 border-b border-gray-300 w-20">ID</th>
                <th className="px-4 py-3 border-b border-gray-300 w-40">Item Code</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left">
                  Description
                </th>
                <th className="px-4 py-3 border-b border-gray-300 w-28">Qty</th>
                <th className="px-4 py-3 border-b border-gray-300 w-24">UOM</th>
                <th className="px-4 py-3 border-b border-gray-300 w-28">
                  HS Code
                </th>
                <th className="px-4 py-3 border-b border-gray-300 w-28">
                  Origin
                </th>
                <th className="px-4 py-3 border-b border-gray-300 w-28">
                  Unit Weight (kg)
                </th>
                <th className="px-4 py-3 border-b border-gray-300 w-20">Action</th>
                {/* <th className="px-4 py-3 border-b border-gray-300 w-28">
                  Total Weight (kg)
                </th> */}
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
                    <td className="border-t border-gray-200 px-4 py-2 text-center">
                    <input
                      type="text"
                      value={it.itemCode || ""}
                      onChange={(e) => handleItemChange(i, "itemCode", e.target.value)}
                      placeholder="Enter Item Code"
                      className={`w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400 ${validationErrors.items[i]?.itemCode ? "border-red-500" : "border-gray-300"}`}
                    />
                  </td>
                    <td className="border-t border-gray-200 px-4 py-2">
                      <textarea
                        rows={2}
                        value={it.description || ""}
                        onChange={(e) =>
                          handleItemChange(i, "description", e.target.value)
                        }
                        placeholder="Enter item description..."
                        className={`w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition-all resize-none ${validationErrors.items[i]?.description ? "border-red-500" : "border-gray-300"}`}
                      />
                    </td>

                    <td className="border-t border-gray-200 px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={it.qty || ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value < 0) return; // prevent negative or invalid input
                            handleItemChange(i, "qty", value);
                          }}
                          placeholder="0"
                          className={`w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400 ${validationErrors.items[i]?.qty ? "border-red-500" : "border-gray-300"}`}
                        />
                        {parseFloat(it.qty) > 1 && (
                          <button
                            onClick={() => openSplitModal(it, i)}
                            className="text-xs text-blue-600 underline hover:text-blue-800"
                          >
                            Split
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="border-t border-gray-200 px-4 py-2 text-center">
                      <input
                        type="text"
                        value={it.unit || ""}
                        onChange={(e) =>
                          handleItemChange(i, "unit", e.target.value)
                        }
                        placeholder="PCS / SET"
                        className={`w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400 ${validationErrors.items[i]?.unit ? "border-red-500" : "border-gray-300"}`}
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
                        className={`w-full text-center p-1.5 border border-gray-300 rounded-lg text-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 ${validationErrors.items[i]?.hsCode ? "border-red-500" : "border-gray-300"}`}
                      />
                    </td>

                    <td className="border-t border-gray-200 px-4 py-2 text-center">
                      {it.originCountries && it.originCountries.length > 0 ? (
                        <>
                          <select
                            value={it.origin || ""}
                            onChange={(e) => handleItemChange(i, "origin", e.target.value)}
                            className={`w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400 ${validationErrors.items[i]?.customOrigin ? "border-red-500" : "border-gray-300"}`}
                          >
                            <option value="">Select Country</option>
                            {it.originCountries.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>

                          {it.origin === "Other" && (
                            <input
                              type="text"
                              value={it.customOrigin || ""}
                              onChange={(e) =>
                                handleItemChange(i, "customOrigin", e.target.value)
                              }
                              placeholder="Enter custom country"
                              className={`mt-2 w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400 ${validationErrors.items[i]?.customOrigin ? "border-red-500" : "border-gray-300"}`}
                            />
                          )}
                        </>
                      ) : (
                        <input
                          type="text"
                          value={it.origin || ""}
                          onChange={(e) => handleItemChange(i, "origin", e.target.value)}
                          placeholder="Country"
                          className={`w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400 ${validationErrors.items[i]?.origin ? "border-red-500" : "border-gray-300"}`}
                        />
                      )}
                    </td>

                    <td className="border-t border-gray-200 px-4 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        value={it.unitWeight || ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (isNaN(value) || value < 0) return; // prevent negative or invalid input
                          handleItemChange(i, "unitWeight", value);
                        }}
                        placeholder="0.00"
                        className={`w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400 ${validationErrors.items[i]?.unitWeight ? "border-red-500" : "border-gray-300"}`}
                      />
                    </td>
                    <td className="border-t border-gray-200 px-4 py-2 text-center">
                      <button
                        onClick={() => handleDeleteItem(it)}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        🗑️ Delete
                      </button>
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
      {splitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-[550px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Split Quantity — {splitModal.item.description}
            </h3>

            <table className="w-full border-collapse text-sm mb-3">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="border px-2 py-2 w-24 text-center">Qty</th>
                  <th className="border px-2 py-2 text-center">Origin</th>
                  <th className="border px-2 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {splitParts.map((part, idx) => (
                  <tr key={idx}>
                    {/* Qty Input */}
                    <td className="border px-2 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={part.qty}
                        onChange={(e) =>
                          handleSplitPartChange(idx, "qty", e.target.value)
                        }
                        placeholder="0"
                        className="w-full border border-gray-300 rounded p-1 text-center focus:ring-1 focus:ring-blue-400"
                      />
                    </td>

                    {/* Origin Dropdown / Input (based on HS Code) */}
                    <td className="border px-2 py-2 text-center">
                     {splitModal.item.originCountries && splitModal.item.originCountries.length > 0 ? (
                        <>
                          <select
                            value={part.origin || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleSplitPartChange(idx, "origin", value);
                              if (value !== "Other") handleSplitPartChange(idx, "customOrigin", "");
                            }}
                            className="w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                          >
                            <option value="">Select Country</option>
                            {splitModal.item.originCountries.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>

                          {part.origin === "Other" && (
                            <input
                              type="text"
                              value={part.customOrigin || ""}
                              onChange={(e) =>
                                handleSplitPartChange(idx, "customOrigin", e.target.value)
                              }
                              placeholder="Enter custom country"
                              className="mt-2 w-full text-center p-1.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                            />
                          )}
                        </>
                      ) : (
                        <input
                          type="text"
                          value={part.origin || ""}
                          onChange={(e) =>
                            handleSplitPartChange(idx, "origin", e.target.value)
                          }
                          placeholder="Country"
                          className="w-full border border-gray-300 rounded p-1 text-center focus:ring-1 focus:ring-blue-400"
                        />
                      )}

                    </td>

                    {/* Remove Row */}
                    <td className="border px-2 py-2 text-center">
                      {splitParts.length > 1 && (
                        <button
                          onClick={() => removeSplitRow(idx)}
                          className="text-red-500 text-xs hover:text-red-700"
                        >
                          ✖
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Buttons */}
            <div className="flex justify-between mt-2">
              <button
                onClick={addSplitRow}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                ➕ Add Row
              </button>

              <div className="space-x-3">
                <button
                  onClick={() => setSplitModal(null)}
                  className="px-3 py-1 bg-gray-300 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSplit}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Save Split
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
