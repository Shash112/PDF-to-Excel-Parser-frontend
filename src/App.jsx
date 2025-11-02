import React, { useState, useEffect } from "react";
import PdfUploadScreen from "./components/PdfUploadScreen";
import ItemsEditor from "./components/ItemsEditor";
import GroupingScreen from "./components/GroupingScreen";
import PreviewTabs from "./components/PreviewTab";
import { hsCodeCountryMap, hsCodeLabels } from "./constants/hsCode";


export default function App() {
  const [data, setData] = useState(null);
  const [step, setStep] = useState(0); // 0 = Upload
  const [showHelp, setShowHelp] = useState(false); // 🆕 modal state
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const handleWheel = (e) => {
      if (document.activeElement.type === "number") {
        e.preventDefault();       // stop scroll action
        document.activeElement.blur(); // remove focus
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);


  useEffect(() => {
    if (!data?.items || !data?.groups) return;

    // Remove deleted items from all groups
    const itemIds = new Set(data.items.map((it) => it.id));
    const cleanedGroups = data.groups.map((g) => ({
      ...g,
      items: g.items.filter((it) => itemIds.has(it.id)),
    }));

    const changed = cleanedGroups.some(
      (g, i) => g.items.length !== data.groups[i]?.items.length
    );
    if (changed) setData({ ...data, groups: cleanedGroups });
  }, [data?.items]);

  const steps = [
    { id: 1, label: "Items", icon: "📦" },
    { id: 2, label: "Grouping", icon: "🧩" },
    { id: 3, label: "Preview", icon: "📋" },
  ];


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* --- Modern Header --- */}
      {step > 0 && (
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3 text-white">
              <span className="text-2xl">🚚</span>
              <h1 className="text-2xl font-semibold tracking-tight">
                Packing List Builder
              </h1>
            </div>

            {/* Middle: Steps */}
            <nav className="flex gap-3">
              {steps.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  disabled={!data}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    step === s.id
                      ? "bg-white text-blue-700 shadow-md"
                      : "bg-blue-500 text-white hover:bg-blue-400"
                  }`}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </nav>

            {/* Right: Help Button */}
            <button
              onClick={() => setShowHelp(true)}
              className="ml-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium backdrop-blur-sm border border-white/30 transition-all"
            >
              ❓ Help
            </button>
          </div>
        </header>
      )}

      {/* --- Main Content --- */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        {/* 0️⃣ Upload */}
        {step === 0 && (
          <>
            <PdfUploadScreen
              onParsed={(parsedData) => {
                const enrichedItems = (parsedData.items || []).map((it) => ({
                  ...it,
                  unitWeight: it.unitWeight || "",
                  totalWeight: it.totalWeight || "",
                }));

                const newData = {
                  ...parsedData,
                  items: enrichedItems,
                  groups: [],
                };

                setData(newData);
                setStep(1);
              }}
            />
          </>
        )}

        {/* 1️⃣ Items */}
        {step === 1 && data && (
          <ItemsEditor
            data={data}
            onChange={setData}
            onNext={() => setStep(2)}
          />
        )}

        {/* 2️⃣ Grouping */}
        {step === 2 && data && (
          <GroupingScreen
            data={data}
            onChange={setData}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {/* 3️⃣ Preview */}
        {step === 3 && data && (
          <PreviewTabs data={data} onChange={setData} onPrev={() => setStep(2)} />
        )}
      </main>

      {/* 🆕 Simplified HS Code Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowHelp(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              ❓ HS Code Reference
            </h2>

            <div className="divide-y divide-gray-200">
              {Object.entries(hsCodeCountryMap).map(([code, countries], idx) => {
                const label = hsCodeLabels[code] || "Unknown";

                return (
                  <div key={code} className="border-b border-gray-200">
                    {/* Header */}
                    <div
                      className="flex justify-between items-center py-3 cursor-pointer select-none"
                      onClick={() => setExpanded(expanded === idx ? null : idx)}
                    >
                      {/* Left side — code and label */}
                      <div className="flex flex-col flex-1">
                        <span className="font-semibold text-blue-700">{code}</span>
                        <span className="text-xs text-gray-600">{label}</span>
                      </div>

                      {/* 📋 Copy HS Code — stop event so it won’t toggle expand */}
                      <button
                        title="Copy HS Code"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent toggle when copying
                          navigator.clipboard.writeText(code);
                          const el = document.createElement("div");
                          el.textContent = "Copied!";
                          el.className =
                            "absolute text-xs text-green-600 bg-white px-2 py-1 border border-green-400 rounded shadow-sm";
                          document.body.appendChild(el);
                          setTimeout(() => el.remove(), 1000);
                        }}
                        className="ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md border border-gray-300 cursor-pointer"
                      >
                        📋
                      </button>

                      {/* ▼ Arrow — now clickable */}
                      <span
                        className={`ml-3 transform transition-transform ${
                          expanded === idx ? "rotate-180" : "rotate-0"
                        } text-gray-500`}
                      >
                        ▼
                      </span>
                    </div>

                    {/* Collapsible Content */}
                    {expanded === idx && (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-2 text-sm text-gray-700">
                        <ul className="list-disc pl-5 space-y-1">
                          {countries.map((country, i) => (
                            <li key={i} className="flex justify-between items-center">
                              <span>{country}</span>

                              {/* 📋 Copy Country */}
                              <button
                                title="Copy Country"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(country);
                                  const el = document.createElement("div");
                                  el.textContent = "Copied!";
                                  el.className =
                                    "absolute text-xs text-green-600 bg-white px-2 py-1 border border-green-400 rounded shadow-sm";
                                  document.body.appendChild(el);
                                  setTimeout(() => el.remove(), 1000);
                                }}
                                className="ml-2 px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md border border-gray-300 cursor-pointer"
                              >
                                📋
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
