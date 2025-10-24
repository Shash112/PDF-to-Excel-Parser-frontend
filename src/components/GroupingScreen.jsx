import React, { useMemo, useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const generatePDF = (data) => {
  const doc = new jsPDF("p", "mm", "a4");

  const addPageHeader = (groupName) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Packing List Summary", 14, 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sales Order No: ${data.header?.salesOrderNo || "N/A"}`, 14, 22);
    doc.text(`PO Number: ${data.header?.refNo || "N/A"}`, 14, 27);

    // Divider
    doc.setDrawColor(180);
    doc.line(10, 30, 200, 30);

    // Group Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`${groupName}`, 14, 38);

    doc.setFont("helvetica", "normal");
  };

  // ======================
  // 📦 Loop through Groups
  // ======================
  (data.groups || []).forEach((group, idx) => {
    // New page for each group (except first)
    if (idx > 0) doc.addPage();

    // Add header for this group
    addPageHeader(group.name);

    const tableData = (group.items || []).map((it, i) => [
      i + 1,
      it.description,
      it.qty,
      it.unit,
    ]);

    autoTable(doc, {
      head: [["#", "Description", "Qty", "UOM"]],
      body: tableData,
      startY: 45,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: "center" },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { cellWidth: 110 },
        2: { halign: "center", cellWidth: 20 },
        3: { halign: "center", cellWidth: 20 },
      },
      didDrawPage: () => {
        // optional watermark or footer can go here
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // ✅ Summary for the group
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Net Weight: ${group.netWeight || 0} KGS    Gross Weight: ${group.grossWeight || 0} KGS`,
      14,
      finalY
    );
  });

  // ✅ Save the PDF
  doc.save("Packing_List.pdf");
};



export default function GroupingScreen({ data, onChange, onPrev, onNext }) {
  const [splitQtyModal, setSplitQtyModal] = useState(null);
  const [splitQty, setSplitQty] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [activeTab, setActiveTab] = useState(data.groups?.[0]?.id || null);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const inputRef = useRef(null);
  // 🧮 Track selected items for grouping and package numbering
  const [selectedItems, setSelectedItems] = useState([]);
  const [packageNumbers, setPackageNumbers] = useState({
    Box: 1,
    Pallet: 1,
    "Carton Box": 1,
    "Loose Pipe": 1,
  });
  const { header = {}, items = [], groups = [], totals = {} } = data;


  // ✅ Build original qty map for each item
  const originalQtyMap = useMemo(() => {
    const map = {};
    (items || []).forEach((it) => (map[it.id] = parseFloat(it.qty) || 0));
    return map;
  }, [items]);

  // ✅ Compute remaining quantity for an item across groups (exclude one group if needed)
  const getRemainingForItem = (itemId, excludeGroupId = null) => {
    const original = originalQtyMap[itemId] || 0;
    let assigned = 0;
    (groups || []).forEach((g) => {
      if (excludeGroupId && g.id === excludeGroupId) return;
      (g.items || []).forEach((it) => {
        if (it.id === itemId) assigned += parseFloat(it.qty) || 0;
      });
    });
    const remaining = original - assigned;
    return remaining > 0 ? +remaining.toFixed(6) : 0;
  };




  
  console.log(header);
  console.log(totals);
  // ✅ Calculate already assigned qty for each item
  const assignedQtyMap = useMemo(() => {
    const map = {};
    (data.groups || []).forEach((g) =>
      g.items.forEach((it) => {
        const q = parseFloat(it.qty) || 0;
        map[it.id] = (map[it.id] || 0) + q;
      })
    );
    return map;
  }, [data.groups]);

  // ✅ Show only items with remaining qty
  const ungroupedItems = useMemo(() => {
    return (data.items || []).filter((it) => {
      const totalAssigned = assignedQtyMap[it.id] || 0;
      return totalAssigned < Number(it.qty || 0);
    });
  }, [data.items, assignedQtyMap]);

  // Helper: safe total weight
  const calcTotal = (qty, unitWeight) => {
    const q = parseFloat((qty ?? "").toString().replace(/,/g, ""));
    const u = parseFloat((unitWeight ?? "").toString().replace(/,/g, ""));
    if (!Number.isFinite(q) || !Number.isFinite(u)) return "";
    const tw = q * u;
    return Number.isFinite(tw) ? +tw.toFixed(2) : "";
  };

  const allGrouped = ungroupedItems.length === 0;
  const activeGroup = (data.groups || []).find((g) => g.id === activeTab);

    // =======================
    // ✅ Net & Gross Weights
    // =======================
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

          const netRounded = +net.toFixed(2);
          const boxWeight = parseFloat(g.boxWeight) || 0;
          const expectedGross = +(netRounded + boxWeight).toFixed(2);

          totalNet += netRounded;

          return {
            id: g.id,
            name: g.name,
            net: netRounded,
            gross: expectedGross,
            boxWeight,
          };
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
          : +(totalNet).toFixed(2);

      return {
        groupWeights,
        totalNet: +totalNet.toFixed(2),
        totalGross: +totalGross.toFixed(2),
      };
    }, [items, groups]);



    // ✅ Persist updated net & gross weights whenever boxWeight or items change
    useEffect(() => {
      if (!Array.isArray(groupWeights) || !groupWeights.length) return;

      const updatedGroups = (groups || []).map((g) => {
        const gw = groupWeights.find((x) => x.id === g.id);
        if (!gw) return g;

        // Gross = Net + BoxWeight (always)
        const finalGross = +(gw.net + gw.boxWeight).toFixed(2);

        if (g.netWeight === gw.net && g.grossWeight === finalGross) return g;

        return {
          ...g,
          netWeight: gw.net,
          grossWeight: finalGross,
        };
      });

      const changed = updatedGroups.some(
        (g, i) =>
          g.netWeight !== groups[i]?.netWeight ||
          g.grossWeight !== groups[i]?.grossWeight
      );

      if (changed) onChange({ ...data, groups: updatedGroups });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupWeights]);


  // ✅ Update editable gross weight (cannot be less than net)
    const handleGrossWeightChange = (gid, value) => {
      const newGroups = (data.groups || []).map((g) => {
        if (g.id !== gid) return g;

        const netWeight = parseFloat(g.netWeight || 0);
        const boxWeight = parseFloat(g.boxWeight || 0);
        const minGross = netWeight + boxWeight;
        const newGross = parseFloat(value);

        if (!Number.isFinite(newGross) || newGross < minGross) {
          alert(`Gross weight cannot be less than Net (${netWeight}) + Box (${boxWeight}) = ${minGross.toFixed(2)} KGS.`);
          return g;
        }

        return { ...g, grossWeight: +newGross.toFixed(2) };
      });

      onChange({ ...data, groups: newGroups });
    };


  // const handleGroupFieldChange = (gid, field, value) => {
  //   const newGroups = (data.groups || []).map((g) => {
  //     if (g.id !== gid) return g;

  //     const updated = { ...g, [field]: value };

  //     // ✅ Auto-calculate CBM when dimensions change
  //     const L = parseFloat(updated.length) || 0;
  //     const W = parseFloat(updated.width) || 0;
  //     const H = parseFloat(updated.height) || 0;
  //     updated.cbm = L && W && H ? parseFloat(((L * W * H) / 1000000).toFixed(3)) : "";

  //     return updated;
  //   });
  //   onChange({ ...data, groups: newGroups });
  // };

  // ✅ Auto focus for "Add Group" modal
  
  useEffect(() => {
    if (showModal && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [showModal]);

  const renameGroup = (gid, name) => {
    const groups = (data.groups || []).map((g) =>
      g.id === gid ? { ...g, name } : g
    );
    onChange({ ...data, groups });
  };

  const deleteGroup = (gid) => {
    const groups = (data.groups || []).filter((g) => g.id !== gid);
    onChange({ ...data, groups });
    if (gid === activeTab && groups.length > 0) setActiveTab(groups[0].id);
    else if (groups.length === 0) setActiveTab(null);
  };

  const removeFromGroup = (gid, itemId) => {
    const groups = (data.groups || []).map((g) =>
      g.id === gid
        ? { ...g, items: g.items.filter((it) => it.id !== itemId) }
        : g
    );
    onChange({ ...data, groups });
  };

  const addItemToExistingGroup = (itemId, groupId) => {
    const item = (items || []).find((it) => it.id === itemId);
    if (!item) return;

    const remaining = getRemainingForItem(itemId);
    if (remaining <= 0) {
      alert("This item is already fully assigned.");
      return;
    }

    const updatedGroups = (data.groups || []).map((g) => {
      if (g.id !== Number(groupId)) return g;

      // check if item already exists in group
      const existingItem = g.items.find((it) => it.id === itemId);
      if (existingItem) {
        const newQty = parseFloat(existingItem.qty || 0) + remaining;
        return {
          ...g,
          items: g.items.map((it) =>
            it.id === itemId ? { ...it, qty: newQty } : it
          ),
        };
      } else {
        return {
          ...g,
          items: [...g.items, { ...item, qty: remaining }],
        };
      }
    });

    onChange({ ...data, groups: updatedGroups });
  };


  // ==============================
  // 🧮 Split & Assign Logic
  // ==============================
  const openSplitModal = (item, gid) => {
    setSplitQtyModal({ item, gid });
    setSplitQty("");
    setSelectedItemId(item.id);
  };

  const confirmSplitAssign = () => {
    const { item, gid } = splitQtyModal;
    const assignQty = parseFloat(splitQty) || 0;
    const totalAssigned = assignedQtyMap[item.id] || 0;
    const available = parseFloat(item.qty || 0) - totalAssigned;

    if (!assignQty || assignQty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }
    if (assignQty > available) {
      alert(`You can assign only up to ${available} units remaining.`);
      return;
    }

    const groups = (data.groups || []).map((g) => {
      if (g.id !== Number(gid)) return g;

      // ✅ Merge same item if already exists in group
      const existingIndex = g.items.findIndex((it) => it.id === item.id);
      if (existingIndex !== -1) {
        const existingItem = g.items[existingIndex];
        const newQty = parseFloat(existingItem.qty || 0) + assignQty;
        g.items[existingIndex] = { ...existingItem, qty: newQty };
      } else {
        const splitItem = { ...item, uid: Date.now(), qty: assignQty };
        g.items.push(splitItem);
      }
      return { ...g };
    });

    onChange({ ...data, groups });
    if (item) item.selectedGroup = "";
    setSplitQtyModal(null);
    setSelectedItemId(null);
  };

  const cancelSplitModal = () => {
    if (splitQtyModal?.item) splitQtyModal.item.selectedGroup = "";
    setSplitQtyModal(null);
    setSelectedItemId(null);
  };

  // ==============================
  // 📦 Dimension Handlers
  // ==============================
  const handleDimensionChange = (gid, field, value) => {
    const groups = (data.groups || []).map((g) => {
      if (g.id !== gid) return g;
      const updatedGroup = { ...g, [field]: value };

      const L = parseFloat(updatedGroup.length) || 0;
      const W = parseFloat(updatedGroup.width) || 0;
      const H = parseFloat(updatedGroup.height) || 0;

      updatedGroup.cbm = parseFloat(((L * W * H) / 1000000).toFixed(3)); // ✅ in cubic meters
      return updatedGroup;
    });

    onChange({ ...data, groups });
  };

  // ==============================
  // 🎨 UI Layout
  // ==============================
  const updateCBMInput = () => {
    const L = parseFloat(document.getElementById("group-length")?.value) || 0;
    const W = parseFloat(document.getElementById("group-width")?.value) || 0;
    const H = parseFloat(document.getElementById("group-height")?.value) || 0;
    const cbm = L && W && H ? ((L * W * H) / 1_000_000).toFixed(3) : "0.000";
    const cbmInput = document.getElementById("group-cbm");
    if (cbmInput) cbmInput.value = cbm;
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-12">
      {/* Header */}
      <div className="w-full max-w-7xl mb-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-md py-3 px-6 z-20">
        <h1 className="text-2xl font-semibold text-gray-800">
          <span className="text-blue-600">📦</span> Step 2 — Grouping
        </h1>
        <div className="flex gap-3">
          <button
            onClick={onPrev}
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg cursor-pointer"
          >
            ◀ Back
          </button>
          <button
            onClick={allGrouped ? onNext : undefined}
            disabled={!allGrouped}
            className={`px-5 py-2.5 rounded-lg ${
              allGrouped
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
          >
            {allGrouped ? "💾 Save & Next" : "Add all items to continue"}
          </button>
        </div>
      </div>

      {/* Ungrouped Items */}
      <div className="w-full max-w-7xl bg-white border border-gray-200 shadow-md rounded-xl mb-10">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-800">
            🧾 Ungrouped Items ({ungroupedItems.length})
          </h2>
        <button
          onClick={() => selectedItems.length && setShowModal(true)}
          disabled={!selectedItems.length}
          className={`px-4 py-2 rounded-md ${
            selectedItems.length
              ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
        >
          ➕ Add Group
        </button>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-3 py-2 border-b w-12">ID</th>
                <th className="px-3 py-2 border-b text-left">Description</th>
                <th className="px-3 py-2 border-b w-64 text-center">Assign</th>
              </tr>
            </thead>
            <tbody>
              {ungroupedItems.length > 0 ? (
                ungroupedItems.map((it) => (
                  <tr key={it.id} className="even:bg-gray-50 hover:bg-blue-50">
                    <td className="border-t px-3 py-2 text-center">{it.id}</td>
                    <td className="border-t px-3 py-2">{it.description}</td>
                    <td className="border-t px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(it.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems((prev) => [...prev, it.id]);
                          } else {
                            setSelectedItems((prev) => prev.filter((id) => id !== it.id));
                          }
                        }}
                        className="cursor-pointer accent-blue-600 w-4 h-4"
                      />

                      {/* 🟢 Add to existing group dropdown */}
                      {(data.groups || []).length > 0 && (
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addItemToExistingGroup(it.id, e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="ml-2 text-xs border border-gray-300 rounded-md px-2 py-1 cursor-pointer focus:ring-1 focus:ring-blue-400"
                        >
                          <option value="">Add to Group</option>
                          {(data.groups || []).map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="text-xs text-gray-500 mt-1">
                        Assigned: {assignedQtyMap[it.id] || 0} / {it.qty}
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-6 text-green-600 bg-gray-50 font-medium border-t"
                  >
                    ✅ All items are assigned to groups.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Groups Section */}
      {(data.groups || []).length > 0 && (
        <div className="w-full max-w-7xl bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <div className="flex items-center border-b bg-gray-100 overflow-x-auto">
            {(data.groups || []).map((g) => (
              <div
                key={g.id}
                onClick={() => setActiveTab(g.id)}
                className={`px-6 py-3 text-sm cursor-pointer border-b-2 ${
                  g.id === activeTab
                    ? "border-blue-600 text-blue-700 bg-white"
                    : "border-transparent text-gray-600 hover:text-blue-600"
                }`}
              >
                {g.name}
              </div>
            ))}
          </div>

          {activeGroup ? (
            <div className="p-4">
              {/* Group Info */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Group name:</span>
                  <input
                    value={activeGroup.name}
                    onChange={(e) => renameGroup(activeGroup.id, e.target.value)}
                    className="font-semibold border border-gray-300 rounded-md px-3 py-1.5 focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <button
                  onClick={() => deleteGroup(activeGroup.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs cursor-pointer"
                >
                  🗑 Delete Group
                </button>
              </div>

              {/* 📏 Dimensions & CBM */}
              <div className="flex flex-wrap items-end gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-600">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    value={activeGroup.length || ""}
                    onChange={(e) =>
                      handleDimensionChange(activeGroup.id, "length", e.target.value)
                    }
                    className="w-24 border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    value={activeGroup.width || ""}
                    onChange={(e) =>
                      handleDimensionChange(activeGroup.id, "width", e.target.value)
                    }
                    className="w-24 border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={activeGroup.height || ""}
                    onChange={(e) =>
                      handleDimensionChange(activeGroup.id, "height", e.target.value)
                    }
                    className="w-24 border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">
                    CBM (m³)
                  </label>
                  <input
                    type="text"
                    value={activeGroup.cbm || 0}
                    readOnly
                    className="w-28 border border-gray-300 bg-gray-100 rounded px-2 py-1 text-right font-semibold"
                  />
                </div>
              </div>

             {/* ⚖️ Group / Box Weight */}
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm text-gray-700 font-medium">
                  {(() => {
                    if (activeGroup?.type) return `${activeGroup.type} Weight (KGS)`;
                    const clean = (activeGroup?.name || "")
                      .replace(/\d+/g, "")
                      .trim()
                      .replace(/\s{2,}/g, " ");
                    return `${clean || "Package"} Weight (KGS)`;
                  })()}
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={activeGroup.boxWeight || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    const groups = (data.groups || []).map((g) => {
                      if (g.id !== activeGroup.id) return g;

                      const netWeight = parseFloat(g.netWeight) || 0;
                      const grossWeight = +(netWeight + value).toFixed(2);
                      return { ...g, boxWeight: value, grossWeight };
                    });
                    onChange({ ...data, groups });
                  }}
                  placeholder="Enter box weight"
                  className="w-28 border border-gray-300 rounded-md px-2 py-1 text-right focus:ring-1 focus:ring-blue-400 focus:border-blue-500"
                />
              </div>



              {/* ✅ Group Net & Editable Gross (added) */}
              <div className="text-right mt-2 text-sm">
                <p>
                  <strong>Group Net Weight:</strong>{" "}
                  {activeGroup.netWeight || 0} KGS
                </p>
                <p className="flex items-center justify-end gap-2">
                  <strong>Group Gross Weight:</strong>
                  <input
                    type="number"
                    step="0.01"
                    value={activeGroup.grossWeight ?? ""}
                    onChange={(e) =>
                      handleGrossWeightChange(activeGroup.id, e.target.value)
                    }
                    className="border border-gray-300 rounded-md px-2 py-0.5 w-28 text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                  />
                  <span>KGS</span>
                </p>
              </div>

              {/* Group Items */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                    <tr className="text-center">
                      <th className="border-b px-2 py-2 w-10">SR</th>
                      <th className="border-b px-2 py-2 text-left">
                        Description
                      </th>
                      <th className="border-b px-2 py-2 w-16">Qty</th>
                      <th className="border-b px-2 py-2 w-16">UOM</th>
                      <th className="border-b px-2 py-2 w-24">H.S. Code</th>
                      <th className="border-b px-2 py-2 w-24">Origin</th>
                      <th className="border-b px-2 py-2 w-24">Unit WT</th>
                      <th className="border-b px-2 py-2 w-12">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeGroup.items.map((it, idx) => (
                      <tr
                        key={it.uid || it.id}
                        className="even:bg-gray-50 hover:bg-blue-50"
                      >
                        <td className="border-t px-2 py-2 text-center">
                          {idx + 1}
                        </td>
                        <td className="border-t px-2 py-2">
                          {it.description || ""}
                        </td>
                        <td className="border-t px-2 py-2 text-center">
                          <input
                            type="number"
                            value={it.qty}
                            onChange={(e) => {
                              const requested = parseFloat(e.target.value) || 0;
                              const outsideRemaining = getRemainingForItem(it.id, activeGroup.id);
                              const currentInThisGroup = parseFloat(it.qty) || 0;
                              const maxAllowed = +(outsideRemaining + currentInThisGroup).toFixed(6);

                              const finalQty = requested > maxAllowed ? maxAllowed : requested;
                              if (requested > maxAllowed) {
                                alert(`Max allowed for this item is ${maxAllowed}`);
                              }

                              const newGroups = (data.groups || []).map((g) => {
                                if (g.id !== activeGroup.id) return g;
                                const updatedItems = (g.items || []).map((gi) =>
                                  gi.id === it.id ? { ...gi, qty: finalQty } : gi
                                );
                                return { ...g, items: updatedItems };
                              });

                              onChange({ ...data, groups: newGroups });
                            }}
                            className="w-16 text-center border border-gray-300 rounded px-1 py-0.5"
                          />
                        </td>


                        <td className="border-t px-2 py-2 text-center">
                          {it.unit || ""}
                        </td>
                        <td className="border-t px-2 py-2 text-center">
                          {it.hsCode || ""}
                        </td>
                        <td className="border-t px-2 py-2 text-center">
                          {it.origin || ""}
                        </td>
                        <td className="border-t px-2 py-2 text-center">
                          {it.unitWeight || ""}
                        </td>
                        <td className="border-t px-2 py-2 text-center">
                          <button
                            onClick={() =>
                              removeFromGroup(activeGroup.id, it.id)
                            }
                            className="text-red-600 text-xs font-medium hover:text-red-700 cursor-pointer"
                          >
                            ✖
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 italic bg-gray-50">
              No group selected.
            </div>
          )}
        </div>
      )}

      {/* ✅ Totals (added) */}
      <div className="w-full max-w-7xl mt-6 text-right text-gray-700">
        <p className="font-semibold">
          Total Net Weight: {totalNet.toFixed(2)} KGS
        </p>
        <p className="font-semibold">
          Total Gross Weight: {totalGross.toFixed(2)} KGS
        </p>
        <button
          onClick={() => generatePDF(data)}
          className="mt-4 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md cursor-pointer"
        >
          📄 Generate PDF
        </button>
      </div>

      {/* 🔹 Split Qty Modal */}
      {splitQtyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
            <h3 className="text-lg font-semibold mb-3">
              Split Quantity for Item #{splitQtyModal.item.id}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Available:{" "}
              {Number(splitQtyModal.item.qty) -
                (assignedQtyMap[splitQtyModal.item.id] || 0)}
            </p>
            <input
              type="number"
              value={splitQty}
              onChange={(e) => setSplitQty(e.target.value)}
              placeholder="Enter qty to assign"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={cancelSplitModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmSplitAssign}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm cursor-pointer"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 🆕 Add Group Modal */}
      {showModal && 
      <div className="bg-white w-96 rounded-xl shadow-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">🆕 Create New Package</h3>

        {/* Package Type */}
        <label className="block mb-2 text-sm text-gray-700 font-medium">
          Select Package Type:
        </label>
        <select
          id="package-type"
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="Box">Box</option>
          <option value="Pallet">Pallet</option>
          <option value="Carton Box">Carton Box</option>
          <option value="Loose Pipe">Loose Pipe</option>
        </select>

        {/* Group Name */}
        <label className="block mb-2 text-sm text-gray-700 font-medium">
          Group Name:
        </label>
        <input
          ref={inputRef}
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Enter custom group name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
          <div>
            <label>Length (cm)</label>
            <input
              type="number"
              id="group-length"
              placeholder="L"
              className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
              onChange={() => updateCBMInput()}
            />
          </div>
          <div>
            <label>Width (cm)</label>
            <input
              type="number"
              id="group-width"
              placeholder="W"
              className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
              onChange={() => updateCBMInput()}
            />
          </div>
          <div>
            <label>Height (cm)</label>
            <input
              type="number"
              id="group-height"
              placeholder="H"
              className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
              onChange={() => updateCBMInput()}
            />
          </div>
        </div>

        <div className="mb-4 text-right text-sm text-gray-700">
          <strong>CBM:</strong>{" "}
          <input
            id="group-cbm"
            type="text"
            value="0.000"
            readOnly
            className="w-24 text-right border border-gray-300 bg-gray-100 rounded px-2 py-1 font-semibold"
          />{" "}
          m³
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={() => {
              setShowModal(false);
              setNewGroupName("");
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              const packageType = document.getElementById("package-type").value;
              const packageNum = packageNumbers[packageType];
              const groupLabel = `${packageType} #${packageNum}`;

              const length = parseFloat(document.getElementById("group-length")?.value) || 0;
              const width  = parseFloat(document.getElementById("group-width")?.value) || 0;
              const height = parseFloat(document.getElementById("group-height")?.value) || 0;
              const cbmCalc = length && width && height ? +((length * width * height) / 1_000_000).toFixed(3) : 0;

              if (!selectedItems.length) {
                alert("Please select items first.");
                return;
              }
              if (!length || !width || !height) {
                alert("Please enter all dimensions before creating a group.");
                return;
              }

              const selectedGroupItems = items
                .filter((it) => selectedItems.includes(it.id))
                .map((it) => {
                  const remaining = getRemainingForItem(it.id);
                  if (remaining <= 0) return null;
                  return { ...it, qty: remaining };
                })
                .filter(Boolean);

              if (!selectedGroupItems.length) {
                alert("Selected items have no remaining quantity to assign.");
                return;
              }

              const newGroup = {
                id: Date.now(),
                name: newGroupName || groupLabel,
                type: packageType,
                number: packageNum,
                items: selectedGroupItems,
                length,
                width,
                height,
                cbm: cbmCalc,
                boxWeight: 0,
                netWeight: 0,
                grossWeight: 0,
              };

              const updatedGroups = [...(data.groups || []), newGroup];
              setPackageNumbers({ ...packageNumbers, [packageType]: packageNum + 1 });
              setSelectedItems([]);
              onChange({ ...data, groups: updatedGroups });
              setActiveTab(newGroup.id);
              setNewGroupName("");
              setShowModal(false);
            }}
            className={`px-4 py-2 text-sm rounded-md ${
              newGroupName.trim() || selectedItems.length
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                : "bg-gray-300 text-gray-400 cursor-not-allowed"
            }`}
          >
            Create
          </button>
        </div>
      </div>

      }

    </div>
  );
}
