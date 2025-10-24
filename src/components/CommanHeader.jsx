import React from "react";

export default function CommonHeader({ header, title, uniqueHsCodes }) {
  
  // const setHeader = (k, v) =>
  //   onChange((prev) => ({
  //     ...prev,
  //     header: { ...prev.header, [k]: v },
  //   }));

  // // ✅ Helper to ensure "-CI" suffix
  // const ensureCISuffix = (value = "") => {
  //   if (!value) return "";
  //   const cleanValue = value.trim();
  //   return cleanValue.toUpperCase().endsWith("-CI") ? cleanValue : `${cleanValue}-CI`;
  // };

  return (
    <>
      {/* Company Header */}
      <div className="relative">
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
        {title || ""}
      </h2>

      {/* Header Info */}
      <table className="w-full border border-gray-400 mb-4 text-sm">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 align-top w-1/2">
              <strong>CONSIGNEE :</strong>
              <p>{header.buyer || ""}</p>
              <p>{header.buyerAddress || ""}</p>
              {/* <textarea
                rows={1}
                value={header.buyer || ""}
                onChange={(e) => setHeader("buyer", e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1"
              />
              <textarea
                rows={4}
                value={header.buyerAddress || ""}
                onChange={(e) => setHeader("buyerAddress", e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1"
              /> */}

            </td>
            <td className="border border-gray-400 p-3 align-top">
              <div className="space-y-2">
                <div>
                  <strong>DATE :</strong>{" "}
                  <p>{header.orderDate || ""}</p>
                  {/* <input
                    type="text"
                    value={header.orderDate || ""}
                    onChange={(e) => setHeader("orderDate", e.target.value)}
                    className="border border-gray-300 rounded p-1 ml-1 w-44"
                  /> */}
                </div>

                {/* ✅ INV. NO auto-suffix with -CI */}
                <div>
                  <strong>INV. NO :</strong>{" "}
                  <p>{header.salesOrderNo || ""}</p>
                  {/* <input
                    type="text"
                    value={ensureCISuffix(header.salesOrderNo || "")}
                    onChange={(e) =>
                      setHeader("salesOrderNo", ensureCISuffix(e.target.value))
                    }
                    className="border border-gray-300 rounded p-1 ml-1 w-44 uppercase"
                    placeholder="Enter Invoice No"
                  /> */}
                </div>

                <div>
                  <strong>PO Number :</strong>{" "}
                  <p>{header.refNo || ""}</p>
                  {/* <input
                    type="text"
                    value={header.refNo || ""}
                    onChange={(e) => setHeader("refNo", e.target.value)}
                    className="border border-gray-300 rounded p-1 ml-1 w-44"
                  /> */}
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
                <p>{header.modeOfShipment || ""}</p>
                {/* <select
                  value={header.modeOfShipment || ""}
                  onChange={(e) => setHeader("modeOfShipment", e.target.value)}
                  className="border border-gray-300 rounded p-1 w-64 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Mode</option>
                  <option value="AIR">AIR</option>
                  <option value="SEA">SEA</option>
                  <option value="LAND">LAND</option>
                  <option value="COURIER">COURIER</option>
                </select> */}
              </div>

              {/* Freight Terms Dropdown */}
              <div className="mt-2 flex items-center gap-2">
                <strong>FREIGHT TERMS :</strong>
                <p>{header.freightTerms || ""}</p>
                {/* <select
                  value={header.freightTerms || ""}
                  onChange={(e) => setHeader("freightTerms", e.target.value)}
                  className="border border-gray-300 rounded p-1 w-64 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Term</option>
                  <option value="EX-WORKS">EX-WORKS</option>
                  <option value="DDP">DDP</option>
                  <option value="FOB">FOB</option>
                  <option value="CIF">CIF</option>
                </select> */}
              </div>

              {/* Loading & Discharge */}
              <div className="mt-2">
                <strong>PLACE OF LOADING :</strong>{" "}
                <p>{header.placeOfLoading || ""}</p>
                {/* <input
                  type="text"
                  value={header.placeOfLoading || ""}
                  onChange={(e) => setHeader("placeOfLoading", e.target.value)}
                  className="border border-gray-300 rounded p-1 ml-1 w-64"
                /> */}
              </div>

              <div className="mt-1">
                <strong>PLACE OF DISCHARGE :</strong>{" "}
                <p>{header.placeOfDischarge || ""}</p>
                {/* <input
                  type="text"
                  value={header.placeOfDischarge || ""}
                  onChange={(e) =>
                    setHeader("placeOfDischarge", e.target.value)
                  }
                  className="border border-gray-300 rounded p-1 ml-1 w-64"
                /> */}
              </div>
            </td>

            {/* Sold To */}
            <td className="border border-gray-400 p-3 align-top w-1/2">
              <strong>SOLD TO / INVOICED TO :</strong>
              <p>{header.buyer || ""}</p>
              <p>{header.buyerAddress || ""}</p>
              {/* <textarea
                rows={1}
                value={header.buyer || ""}
                onChange={(e) => setHeader("buyer", e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1"
              />
              <textarea
                rows={4}
                value={header.buyerAddress || ""}
                onChange={(e) => setHeader("buyerAddress", e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1"
              /> */}
            </td>
          </tr>

          {/* Origin & HS Codes */}
          <tr>
            <td className="border border-gray-400 p-3">
              <strong>COUNTRY / PLACE OF ORIGIN:</strong>{" "}
              <p>{ Array.isArray(header.uniqueOrigin) ? (header.uniqueOrigin).join(", ") : header.uniqueOrigin ? header.uniqueOrigin : "" }</p>
            </td>
            <td className="border border-gray-400 p-3">
              <p>
                <strong>HS CODES IN THIS SHIPMENT:</strong>{" "}
                {uniqueHsCodes.join(", ") || "—"}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
