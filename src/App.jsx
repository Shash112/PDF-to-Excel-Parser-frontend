import React, { useState } from "react";
import PdfUploadScreen from "./components/PdfUploadScreen";
import ItemsEditor from "./components/ItemsEditor";
import GroupingScreen from "./components/GroupingScreen";
import PackingListPreview from "./components/PackingListPreview";
import PreviewTabs from "./components/PreviewTab";
import StickerGenerator from "./components/StickerGenerator"; // ✅ new
import StickerFromExcel from "./components/StickerFromExcel";

/** ---------- HS CODE MAPPING ---------- */
function assignHsCode(description = "") {
  const text = (description || "").toLowerCase();
  const has = (arr) => arr.some((a) => text.includes(a.toLowerCase()));

  if (has(["flange", "wnrf", "weldneck", "slipon flange", "blind flange"])) {
    if (has(["carbon steel", "a105", "a105n", "a350", "lf2"])) return "73079100";
  }
  if (has(["elbow", "tee", "reducer", "swage nipple"])) {
    if (has(["a234", "wpb", "a420", "wpl6"])) return "73079300";
  }
  if (has(["flange", "wnrf", "blind flange"])) {
    if (has(["stainless steel", "a182", "f316", "f304"])) return "73072100";
  }
  if (has(["gasket", "spiral wound"])) return "84841000";
  if (has(["studbolt", "hex bolt", "nut", "washer"])) return "73181500";
  if (has(["valve"])) return "84818040";
  if (has(["pipe", "carbon steel"])) return "73041900";
  if (has(["ss pipe", "stainless steel"])) return "73044100";
  return "N/A";
}

export default function App() {
  const [data, setData] = useState(null);
  const [step, setStep] = useState(0); // 0 = Upload

  const steps = [
    { id: 1, label: "Items", icon: "📦" },
    { id: 2, label: "Grouping", icon: "🧩" },
    { id: 3, label: "Preview", icon: "📋" },
    { id: 4, label: "Stickers", icon: "🏷️" }, // ✅ New Step
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* --- Modern Header --- */}
      {step > 0 && (
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <span className="text-2xl">🚚</span>
              <h1 className="text-2xl font-semibold tracking-tight">
                Packing List Builder
              </h1>
            </div>
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
          </div>
        </header>
      )}

      {/* --- Main Content --- */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        {/* 0️⃣ Upload */}
        {step === 0 && (
          <><PdfUploadScreen
            onParsed={(parsedData) => {
              const enrichedItems = (parsedData.items || []).map((it, i) => ({
                ...it,
                id: i + 1,
                hsCode: assignHsCode(it.description),
                origin: "UAE",
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
            } } />
            {/* <StickerFromExcel /> */}
            </>
        )}

        {/* 1️⃣ Items */}
        {step === 1 && data && (
          <ItemsEditor
            data={data}
            onChange={setData}
            onNext={() => setStep(2)}
            assignHsCode={assignHsCode}
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

        {/* 3️⃣ Preview (PL + Invoice) */}
        {step === 3 && data && (
          <PreviewTabs data={data} onChange={setData} onPrev={() => setStep(2)} />
        )}

        {/* 4️⃣ Stickers (new step) */}
        {step === 4 && data && (
          <StickerGenerator
            items={data.items}
            header={data.header}
            onBack={() => setStep(3)}
          />
        )}
      </main>
    </div>
  );
}
