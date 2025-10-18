import React, { useState } from "react";
import axios from "axios";
import { Upload, FileText, Loader2 } from "lucide-react";

export default function PdfUploadScreen({ onParsed }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      const response = await axios.post("https://pdf-to-excel-parser.vercel.app/api/parse-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Parsed Data:", response.data);
      onParsed(response.data); // send extracted data back to App
    } catch (err) {
      console.error("❌ Error parsing PDF:", err);
      setError(err.response?.data?.error || "Failed to parse PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-10 w-full max-w-lg text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="p-5 bg-blue-50 rounded-full mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">Upload PDF for Extraction</h2>
          <p className="text-gray-500 text-sm mb-6">
            Upload your invoice or packing list PDF. The system will extract structured data automatically.
          </p>

          <form onSubmit={handleSubmit} className="w-full">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition">
              <Upload className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-gray-600 font-medium">
                {file ? file.name : "Click to upload or drag & drop PDF"}
              </span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
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
                "Extract Data"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
