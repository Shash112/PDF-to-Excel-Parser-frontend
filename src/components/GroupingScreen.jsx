import React, { useMemo, useState, useRef, useEffect } from "react";

export default function GroupingScreen({ data, onChange, onPrev, onNext }) {
  const [splitQtyModal, setSplitQtyModal] = useState(null);
  const [splitQty, setSplitQty] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [activeTab, setActiveTab] = useState(data.groups?.[0]?.id || null);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const inputRef = useRef(null);

  const { header = {}, items = [], groups = [], totals = {} } = data;

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
  // Compute per-group net and suggested gross (if user hasn't entered a valid one)
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
        // if g.grossWeight exists and >= net, use it; otherwise default to net * 1.04
        const userGross = parseFloat(g.grossWeight);
        const autoGross = +(netRounded * 1.04).toFixed(2);
        const gross =
          Number.isFinite(userGross) && userGross >= netRounded ? +userGross.toFixed(2) : autoGross;

        totalNet += netRounded;
        return { id: g.id, name: g.name, net: netRounded, gross };
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

    return { groupWeights, totalNet: +totalNet.toFixed(2), totalGross: +totalGross.toFixed(2) };
  }, [items, groups]);

  // Persist netWeight and grossWeight into group objects so they’re available on the next screen
  useEffect(() => {
    if (!Array.isArray(groupWeights) || !groupWeights.length) return;
    const updated = (groups || []).map((g) => {
      const gw = groupWeights.find((x) => x.id === g.id);
      if (!gw) return g;
      // Keep user's gross if (still) >= net; else use computed gross
      const currentGross = parseFloat(g.grossWeight);
      const finalGross =
        Number.isFinite(currentGross) && currentGross >= gw.net ? +currentGross.toFixed(2) : gw.gross;

      // Only update if something changed to avoid extra renders
      if (g.netWeight === gw.net && g.grossWeight === finalGross) return g;
      return { ...g, netWeight: gw.net, grossWeight: finalGross };
    });

    const changed =
      updated.length !== groups.length ||
      updated.some((g, i) => g.netWeight !== groups[i].netWeight || g.grossWeight !== groups[i].grossWeight);

    if (changed) onChange({ ...data, groups: updated });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupWeights]);

  // ✅ Update editable gross weight (cannot be less than net)
  const handleGrossWeightChange = (gid, value) => {
    const newGroups = (data.groups || []).map((g) => {
      if (g.id !== gid) return g;

      const netWeight = parseFloat(g.netWeight || 0);
      const newGross = parseFloat(value);

      if (!Number.isFinite(newGross) || newGross < netWeight) {
        alert(`Gross weight cannot be less than Net Weight (${netWeight} KGS).`);
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
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md cursor-pointer"
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
                      <select
                        value={selectedItemId === it.id ? it.selectedGroup || "" : ""}
                        onChange={(e) => {
                          const gid = e.target.value;
                          if (gid) {
                            it.selectedGroup = gid;
                            openSplitModal(it, gid);
                          }
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm cursor-pointer focus:ring-1 focus:ring-blue-400 focus:border-blue-500 transition-all"
                      >
                        <option value="">Select Group</option>
                        {(data.groups || []).map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>

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
                          {it.qty ?? ""}
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

      {/* ➕ Add Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white w-96 rounded-xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">🆕 Create New Group</h3>

            {/* Group Name */}
            <input
              ref={inputRef}
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />

            {/* 📏 Dimensions Input */}
            <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
              <div>
                <label>Length (cm)</label>
                <input
                  type="number"
                  id="group-length"
                  placeholder="L"
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                  onChange={(e) => {
                    const length = parseFloat(e.target.value) || 0;
                    const width = parseFloat(document.getElementById("group-width")?.value) || 0;
                    const height = parseFloat(document.getElementById("group-height")?.value) || 0;
                    const cbm = ((length * width * height) / 1000000).toFixed(3);
                    document.getElementById("group-cbm").value = cbm;
                  }}
                />
              </div>

              <div>
                <label>Width (cm)</label>
                <input
                  type="number"
                  id="group-width"
                  placeholder="W"
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                  onChange={(e) => {
                    const width = parseFloat(e.target.value) || 0;
                    const length = parseFloat(document.getElementById("group-length")?.value) || 0;
                    const height = parseFloat(document.getElementById("group-height")?.value) || 0;
                    const cbm = ((length * width * height) / 1000000).toFixed(3);
                    document.getElementById("group-cbm").value = cbm;
                  }}
                />
              </div>

              <div>
                <label>Height (cm)</label>
                <input
                  type="number"
                  id="group-height"
                  placeholder="H"
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                  onChange={(e) => {
                    const height = parseFloat(e.target.value) || 0;
                    const length = parseFloat(document.getElementById("group-length")?.value) || 0;
                    const width = parseFloat(document.getElementById("group-width")?.value) || 0;
                    const cbm = ((length * width * height) / 1000000).toFixed(3);
                    document.getElementById("group-cbm").value = cbm;
                  }}
                />
              </div>
            </div>

            {/* CBM Display */}
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
                  const length = parseFloat(document.getElementById("group-length")?.value) || 0;
                  const width = parseFloat(document.getElementById("group-width")?.value) || 0;
                  const height = parseFloat(document.getElementById("group-height")?.value) || 0;
                  const cbm = parseFloat(document.getElementById("group-cbm")?.value) || 0;

                  if (!newGroupName.trim()) {
                    alert("Please enter a group name.");
                    return;
                  }
                  if (!length || !width || !height) {
                    alert("Please enter all dimensions before creating a group.");
                    return;
                  }

                  const newGroup = {
                    id: Date.now(),
                    name: newGroupName.trim(),
                    items: [],
                    length,
                    width,
                    height,
                    cbm,
                  };

                  const groups = [...(data.groups || []), newGroup];
                  onChange({ ...data, groups });
                  setActiveTab(newGroup.id);
                  setNewGroupName("");
                  setShowModal(false);
                }}
                className={`px-4 py-2 text-sm rounded-md ${
                  newGroupName.trim()
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    : "bg-gray-300 text-gray-400 cursor-not-allowed"
                }`}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
