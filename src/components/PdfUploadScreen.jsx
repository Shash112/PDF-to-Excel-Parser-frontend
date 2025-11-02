import React, { useState } from "react";
import axios from "axios";
import { Upload, FileText, FileSpreadsheet, Loader2, X } from "lucide-react";

export default function PdfUploadScreen({ onParsed }) {
  const [file, setFile] = useState(null);
  const [xlsxFile, setXlsxFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingXlsx, setLoadingXlsx] = useState(false);
  const [error, setError] = useState("");
  const [xlsxError, setXlsxError] = useState("");

  // 🆕 XLSX customization states
  const [showOptions, setShowOptions] = useState(false);
  const [font, setFont] = useState("Helvetica");
  const [addLogo, setAddLogo] = useState(false);
  const [addQr, setAddQr] = useState(false);

  // 🔧 Backend URLs
  // const NODE_API_URL = import.meta.env.VITE_NODE_API_URL || "https://pdf-to-excel-parser.vercel.app";
  const NODE_API_URL = import.meta.env.VITE_NODE_API_URL || "https://pdf-to-excel-parser.vercel.app";
  const PYTHON_API_URL =
    import.meta.env.VITE_PYTHON_API_URL || "http://127.0.0.1:8000";

  // 📄 PDF Handlers
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please select a PDF file first.");

    try {
      setLoading(true);
      setError("");
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await axios.post(`${NODE_API_URL}/api/parse-pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Parsed Data (PDF):", response.data);
      onParsed(response.data);
    } catch (err) {
      console.error("❌ Error parsing PDF:", err);
      setError(err.response?.data?.error || "Failed to parse PDF");
    } finally {
      setLoading(false);
    }
  };

  // 📊 XLSX Handlers
  const handleXlsxChange = (e) => {
    setXlsxFile(e.target.files[0]);
    setXlsxError("");
  };

  // 🆕 Ask for inputs before XLSX processing
  const handleXlsxSubmit = (e) => {
    e.preventDefault();
    if (!xlsxFile) return setXlsxError("Please select an XLSX file first.");
    setShowOptions(true);
  };

  // 🧩 Confirm and send XLSX to backend
  const handleConfirmUpload = async () => {
    try {
      setLoadingXlsx(true);
      setShowOptions(false);
      setXlsxError("");

      const formData = new FormData();
      formData.append("file", xlsxFile);
      formData.append("font", font);
      formData.append("addLogo", addLogo);
      formData.append("addQr", addQr);

      const response = await axios.post(`${PYTHON_API_URL}/generate-sticker`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stickers_msg_final.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Error processing XLSX:", err);
      setXlsxError(err.response?.data?.error || "Failed to process XLSX");
    } finally {
      setLoadingXlsx(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center gap-10 p-6">
      {/* PDF Upload Card */}
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-10 w-full max-w-lg text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="p-5 bg-blue-50 rounded-full mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            Upload PDF for Extraction
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Upload your invoice or packing list PDF. The system will extract structured data automatically.
          </p>

          <form onSubmit={handleSubmit} className="w-full">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition">
              <Upload className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-gray-600 font-medium">
                {file ? file.name : "Click to upload or drag & drop PDF"}
              </span>
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </label>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" /> Parsing PDF...
                </>
              ) : (
                "Extract PDF Data"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* XLSX Upload Card */}
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-10 w-full max-w-lg text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="p-5 bg-green-50 rounded-full mb-4">
            <FileSpreadsheet className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">Upload Excel for Processing</h2>
          <p className="text-gray-500 text-sm mb-6">
            Upload your Excel file (.xlsx). The Python backend will process and extract structured data.
          </p>

          <form onSubmit={handleXlsxSubmit} className="w-full">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition">
              <Upload className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-gray-600 font-medium">
                {xlsxFile ? xlsxFile.name : "Click to upload or drag & drop XLSX"}
              </span>
              <input type="file" accept=".xlsx" onChange={handleXlsxChange} className="hidden" />
            </label>

            {xlsxError && <p className="text-red-500 text-sm mt-3">{xlsxError}</p>}

            <button
              type="submit"
              disabled={loadingXlsx}
              className="mt-6 w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition flex items-center justify-center"
            >
              {loadingXlsx ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" /> Processing XLSX...
                </>
              ) : (
                "Process XLSX Data"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 🆕 Font + Logo + QR Modal (only for XLSX flow) */}
      {showOptions && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[400px] relative">
            <button
              onClick={() => setShowOptions(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-semibold mb-4">Customize XLSX Processing</h3>

            {/* Font Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Font</label>
              <select
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="Helvetica">Helvetica</option>
                <option value="Times">Times</option>
                <option value="Courier">Courier</option>
              </select>
            </div>

            {/* Logo Checkbox */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="addLogo"
                checked={addLogo}
                onChange={(e) => setAddLogo(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="addLogo" className="text-sm text-gray-700">
                Include Logo
              </label>
            </div>

            {/* QR Checkbox */}
            <div className="flex items-center mb-5">
              <input
                type="checkbox"
                id="addQr"
                checked={addQr}
                onChange={(e) => setAddQr(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="addQr" className="text-sm text-gray-700">
                Include QR Code
              </label>
            </div>

            {/* Confirm Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowOptions(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
