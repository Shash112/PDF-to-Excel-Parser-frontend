import React, { useState } from "react";
import PdfUploadScreen from "./components/PdfUploadScreen";
import ItemsEditor from "./components/ItemsEditor";
import GroupingScreen from "./components/GroupingScreen";
import PreviewTabs from "./components/PreviewTab";


/** ---------- HS CODE MAPPING (Updated 2025-10) ---------- */
function assignHsCode(description = "") {
  const text = (description || "").toLowerCase();
  const has = (arr) => arr.some((a) => text.includes(a.toLowerCase()));

  // 1️⃣ CS FLANGES: 73079100
  if (has(["flange", "wnrf", "weldneck", "slipon flange", "blind flange", "socket weld flange"])) {
    if (has(["carbon steel", "a105", "a105n", "sa a105 n", "a350 lf2", "a 350 l f 2 cl.1", "a350", "sa350", "cs flange", "carbon steel flange"])) {
      return "73079100";
    }
  }

  // 2️⃣ CS FITTINGS: 73079300
  if (has(["elbow", "tee", "r.tee", "reducing tee", "reducer", "con reducer", "con.reducer", "ecc. reducer", "swage nipple", "ecc swage nipple", "eccentric swage nipple", "concentric swage nipple"])) {
    if (has(["a234 wpb", "a420", "a420 wpl6", "wpl6", "wpb"])) {
      return "73079300";
    }
  }

  // 3️⃣ SS FLANGES: 73072100
  if (has(["flange", "wnrf", "weldneck", "slipon flange", "blind flange", "socket weld flange"])) {
    if (has(["stainless steel", "a182", "f316", "f316l", "f316/l", "f304", "f 304l", "f304l", "stainless steel flange", "ss flange"])) {
      return "73072100";
    }
  }

  // 4️⃣ SS FITTINGS: 73072900
  if (has(["elbow", "tee", "r.tee", "reducing tee", "reducer", "con reducer", "con.reducer", "ecc. reducer", "swage nipple", "ecc swage nipple", "eccentric swage nipple", "concentric swage nipple"])) {
    if (has(["stainless steel fittings", "ss 304", "ss 316", "a403", "a403 316", "a403 316/l", "a403 wp 316", "a403 wp 304/l", "a403 wp 316/l"])) {
      return "73072900";
    }
  }

  // 5️⃣ GASKET: 84841000
  if (has(["gasket", "spw", "spiral wound"])) return "84841000";

  // 6️⃣ STUD BOLT: 73181500
  if (has(["studbolt", "stud bolt", "hex bolt", "nut", "washer", "jackscrew", "jack bolt", "jac bolt"])) {
    return "73181500";
  }

  // 7️⃣ VALVE: 84818040
  if (has(["valve", "ball valve", "gate valve", "globe valve", "check valve", "swing check valve"])) {
    return "84818040";
  }

  // 8️⃣ CS PIPE: 73041900
  if (has(["carbon steel pipe", "cs pipe", "a106", "a106 gr. b", "sa 106 gr.b", "api 5l", "api 5l x42", "x65", "x60", "x52", "a333 gr.6", "a333"])) {
    return "73041900";
  }

  // 9️⃣ SS PIPE: 73044100
  if (has(["ss pipe", "stainless steel pipe", "tp 316", "tp316", "tp316l", "tp 316/l", "tp 304", "tp 304/l", "tp 304l", "a312", "a312 tp 316/l"])) {
    return "73044100";
  }

  // 🔟 PADDLE SPACER (CS): 73079900
  if (has(["paddle blank", "paddle spacer", "spectacle blind", "spacer", "blind"])) {
    if (has(["a516 gr.70", "a516 gr.60", "a516 gr.65"])) {
      return "73079900";
    }
  }

  // 11️⃣ PADDLE SPACER (SS): 73072100
  if (has(["paddle blank", "paddle spacer", "spectacle blind", "spacer", "blind"])) {
    if (has(["316", "316l", "304", "304l", "316/l", "304/l"])) {
      return "73072100";
    }
  }

  // 12️⃣ CS FORGED FITTINGS: 73079300
  if (has([
    "elbow", "tee", "r.tee", "reducing tee", "bush", "r.bush", "reducing bush",
    "hexplug", "hex plug", "hex head plug", "square head plug", "square plug",
    "weld-o-let", "weldolet", "sockolet", "o’let", "olet", "threadolet", "thread o let",
    "cap", "coupling", "r.coupling", "street elbow", "hex nipple", "hexnipple",
    "union", "pipe nipple", "half coupling"
  ])) {
    if (has(["a105", "a105n", "sa a105 n", "a350 lf2", "a 350 l f 2 cl.1", "a350", "sa350", "forged fittings"])) {
      return "73079300";
    }
  }

  // 13️⃣ SS FORGED FITTINGS: 73072900
  if (has([
    "elbow", "tee", "r.tee", "reducing tee", "bush", "r.bush", "reducing bush",
    "hexplug", "hex plug", "hex head plug", "square head plug", "square plug",
    "weld-o-let", "weldolet", "sockolet", "o’let", "olet", "threadolet", "thread o let",
    "cap", "coupling", "r.coupling", "street elbow", "hex nipple", "hexnipple",
    "union", "pipe nipple", "half coupling"
  ])) {
    if (has(["stainless steel", "a182", "f316", "f316l", "f316/l", "f304", "f 304l", "f304l"])) {
      return "73072900";
    }
  }

  // Default
  return "N/A";
}

export default function App() {
  const [data, setData] = useState(null);
  const [step, setStep] = useState(0); // 0 = Upload

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
          <>
          <PdfUploadScreen
            onParsed={(parsedData) => {
              const enrichedItems = (parsedData.items || []).map((it) => ({
                ...it,
                hsCode: assignHsCode(it.description),
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
      </main>
    </div>
  );
}
