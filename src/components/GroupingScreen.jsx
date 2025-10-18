import React, { useMemo, useState, useRef, useEffect } from "react";

export default function GroupingScreen({ data, onChange, onPrev, onNext }) {
  const groupedIds = new Set(
    (data.groups || []).flatMap((g) => g.items.map((it) => it.id))
  );
  const ungroupedItems = useMemo(
    () => data.items.filter((it) => !groupedIds.has(it.id)),
    [data.items, data.groups]
  );

  const [activeTab, setActiveTab] = useState(data.groups?.[0]?.id || null);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const inputRef = useRef(null);

  // Auto focus input when modal opens
  useEffect(() => {
    if (showModal && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [showModal]);

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup = {
      id: Date.now(),
      name: newGroupName.trim(),
      items: [],
    };
    const groups = [...(data.groups || []), newGroup];
    onChange({ ...data, groups });
    setActiveTab(newGroup.id);
    setNewGroupName("");
    setShowModal(false);
  };

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

  const assignToGroup = (itemId, gid) => {
    if (!gid) return;
    const item = data.items.find((i) => i.id === itemId);
    const groups = (data.groups || []).map((g) =>
      g.id === Number(gid) ? { ...g, items: [...g.items, item] } : g
    );
    onChange({ ...data, groups });
  };

  const removeFromGroup = (gid, itemId) => {
    const groups = (data.groups || []).map((g) =>
      g.id === gid
        ? { ...g, items: g.items.filter((it) => it.id !== itemId) }
        : g
    );
    onChange({ ...data, groups });
  };

  const handleItemField = (gid, itemId, field, value) => {
    const groups = (data.groups || []).map((g) =>
      g.id === gid
        ? {
            ...g,
            items: g.items.map((it) =>
              it.id === itemId
                ? {
                    ...it,
                    [field]: value,
                    ...(field === "qty" || field === "unitWeight"
                      ? {
                          totalWeight: (
                            parseFloat(field === "qty" ? value : it.qty || 0) *
                            parseFloat(field === "unitWeight" ? value : it.unitWeight || 0)
                          ).toFixed(2),
                        }
                      : {}),
                  }
                : it
            ),
          }
        : g
    );
    onChange({ ...data, groups });
  };

  const allGrouped = ungroupedItems.length === 0;
  const activeGroup = (data.groups || []).find((g) => g.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-12 relative">
      {/* Top Bar */}
      <div className="w-full max-w-7xl mb-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-md py-3 px-6 z-20">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight flex items-center gap-2">
          <span className="text-blue-600">📦</span> Step 2 — Grouping
        </h1>
        <div className="flex gap-3">
          <button
            onClick={onPrev}
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow transition-all"
          >
            ◀ Back
          </button>
          <button
            onClick={allGrouped ? onNext : undefined}
            disabled={!allGrouped}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg shadow transition-all ${
              allGrouped
                ? "bg-blue-600 hover:bg-blue-700 text-white"
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
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            🧾 Ungrouped Items ({ungroupedItems.length})
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow transition-all"
          >
            ➕ Add Group
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wide sticky top-0">
              <tr>
                <th className="px-3 py-2 border-b w-12">ID</th>
                <th className="px-3 py-2 border-b text-left">Description</th>
                <th className="px-3 py-2 border-b w-64 text-center">Assign to Group</th>
              </tr>
            </thead>
            <tbody>
              {ungroupedItems.length > 0 ? (
                ungroupedItems.map((it) => (
                  <tr key={it.id} className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                    <td className="border-t px-3 py-2 text-center text-gray-700">{it.id}</td>
                    <td className="border-t px-3 py-2 text-gray-800">{it.description}</td>
                    <td className="border-t px-3 py-2 text-center">
                      <select
                        defaultValue=""
                        onChange={(e) => assignToGroup(it.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-500 transition-all"
                      >
                        <option value="">Select Group</option>
                        {(data.groups || []).map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
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

      {/* Tabs */}
      {(data.groups || []).length > 0 && (
        <div className="w-full max-w-7xl bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <div className="flex items-center border-b bg-gray-100 overflow-x-auto">
            {(data.groups || []).map((g) => (
              <div
                key={g.id}
                onClick={() => setActiveTab(g.id)}
                className={`px-6 py-3 text-sm font-medium cursor-pointer transition-all border-b-2 ${
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Group name:</span>
                  <input
                    value={activeGroup.name}
                    onChange={(e) => renameGroup(activeGroup.id, e.target.value)}
                    className="font-semibold text-gray-800 bg-white border border-gray-300 rounded-md px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition-all"
                  />
                </div>
                <button
                  onClick={() => deleteGroup(activeGroup.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs shadow transition-all"
                >
                  🗑 Delete Group
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs tracking-wide sticky top-0">
                    <tr className="text-center">
                      <th className="border-b px-2 py-2 w-10">SR</th>
                      <th className="border-b px-2 py-2 text-left">Description</th>
                      <th className="border-b px-2 py-2 w-16">Qty</th>
                      <th className="border-b px-2 py-2 w-16">UOM</th>
                      <th className="border-b px-2 py-2 w-24">H.S. Code</th>
                      <th className="border-b px-2 py-2 w-24">Origin</th>
                      <th className="border-b px-2 py-2 w-24">Unit WT</th>
                      <th className="border-b px-2 py-2 w-24">Total WT</th>
                      <th className="border-b px-2 py-2 w-12">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeGroup.items.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-4 text-gray-500 italic border-t bg-gray-50">
                          No items in this group yet.
                        </td>
                      </tr>
                    )}
                    {activeGroup.items.map((it, idx) => (
                      <tr key={it.id} className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                        <td className="border-t px-2 py-2 text-center text-gray-700">{idx + 1}</td>
                        <td className="border-t px-2 py-2">
                          <textarea
                            rows={2}
                            value={it.description || ""}
                            onChange={(e) => handleItemField(activeGroup.id, it.id, "description", e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-400 resize-none transition-all"
                          />
                        </td>
                        <td className="border-t px-2 py-2 text-center">
                          <input
                            type="number"
                            value={it.qty || ""}
                            onChange={(e) => handleItemField(activeGroup.id, it.id, "qty", e.target.value)}
                            className="w-full text-center border border-gray-300 rounded-md p-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition-all"
                          />
                        </td>
                        <td className="border-t px-2 py-2 text-center">
                          <input
                            type="text"
                            value={it.unit || ""}
                            onChange={(e) => handleItemField(activeGroup.id, it.id, "unit", e.target.value)}
                            className="w-full text-center border border-gray-300 rounded-md p-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition-all"
                          />
                        </td>
                        <td className="border-t px-2 py-2 text-center">
                          <input
                            type="text"
                            value={it.hsCode || ""}
                            onChange={(e) => handleItemField(activeGroup.id, it.id, "hsCode", e.target.value)}
                            className="w-full text-center border border-gray-300 rounded-md p-1.5 text-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition-all"
                          />
                        </td>
                        <td className="border-t px-2 py-2 text-center">
                          <input
                            type="text"
                            value={it.origin || ""}
                            onChange={(e) => handleItemField(activeGroup.id, it.id, "origin", e.target.value)}
                            className="w-full text-center border border-gray-300 rounded-md p-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition-all"
                          />
                        </td>
                        <td className="border-t px-2 py-2 text-center">
                          <input
                            type="number"
                            value={it.unitWeight || ""}
                            onChange={(e) => handleItemField(activeGroup.id, it.id, "unitWeight", e.target.value)}
                            className="w-full text-center border border-gray-300 rounded-md p-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition-all"
                          />
                        </td>
                        <td className="border-t px-2 py-2 text-center bg-gray-100">
                          <input
                            type="text"
                            value={it.totalWeight || ""}
                            readOnly
                            className="w-full text-center border border-gray-200 rounded-md p-1.5 bg-gray-100 text-gray-700 cursor-not-allowed"
                          />
                        </td>
                        <td className="border-t px-2 py-2 text-center">
                          <button
                            onClick={() => removeFromGroup(activeGroup.id, it.id)}
                            className="text-red-600 text-xs font-medium hover:text-red-700 transition-colors"
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

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white w-96 rounded-xl shadow-2xl p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🆕 Create New Group
            </h3>
            <input
              ref={inputRef}
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewGroupName("");
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  newGroupName.trim()
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
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
