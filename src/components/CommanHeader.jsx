import React from "react";

export default function CommonHeader({ header, title, onChange, uniqueHsCodes }) {
  const setHeader = (k, v) =>
    onChange((prev) => ({
      ...prev,
      header: { ...prev.header, [k]: v },
    }));

  return (
    <>
      {/* Company Header */}
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

      {/* Title (dynamic so PL and INV can share same component) */}
      <h2 className="text-lg font-bold text-center underline mb-4">
        {title || ""}
      </h2>

      {/* Header Info */}
      <table className="w-full border border-gray-400 mb-4 text-sm">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 align-top w-1/2">
              <strong>CONSIGNEE :</strong>
              <textarea
                rows={4}
                value={header.buyer || ""}
                onChange={(e) => setHeader("consignee", e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1"
              />
            </td>
            <td className="border border-gray-400 p-3 align-top">
              <div className="space-y-2">
                <div>
                  <strong>DATE :</strong>{" "}
                  <input
                    type="text"
                    value={header.orderDate || ""}
                    onChange={(e) => setHeader("orderDate", e.target.value)}
                    className="border border-gray-300 rounded p-1 ml-1 w-44"
                  />
                </div>
                <div>
                  <strong>INV. NO :</strong>{" "}
                  <input
                    type="text"
                    value={header.salesOrderNo || ""}
                    onChange={(e) => setHeader("salesOrderNo", e.target.value)}
                    className="border border-gray-300 rounded p-1 ml-1 w-44"
                  />
                </div>
                <div>
                  <strong>S.O. REF :</strong>{" "}
                  <input
                    type="text"
                    value={header.refNo || ""}
                    onChange={(e) => setHeader("refNo", e.target.value)}
                    className="border border-gray-300 rounded p-1 ml-1 w-44"
                  />
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
              <div className="mt-2">
                <strong>MODE OF SHIPMENT :</strong>{" "}
                <input
                  type="text"
                  value={header.modeOfShipment || ""}
                  onChange={(e) => setHeader("modeOfShipment", e.target.value)}
                  className="border border-gray-300 rounded p-1 ml-1 w-64"
                />
              </div>

              <div className="mt-2">
                <strong>FREIGHT TERMS :</strong>{" "}
                <input
                  type="text"
                  value={header.freightTerms || ""}
                  onChange={(e) => setHeader("freightTerms", e.target.value)}
                  className="border border-gray-300 rounded p-1 ml-1 w-64"
                />
              </div>

              <div className="mt-2">
                <strong>PLACE OF LOADING :</strong>{" "}
                <input
                  type="text"
                  value={header.placeOfLoading || ""}
                  onChange={(e) => setHeader("placeOfLoading", e.target.value)}
                  className="border border-gray-300 rounded p-1 ml-1 w-64"
                />
              </div>

              <div className="mt-1">
                <strong>PLACE OF DISCHARGE :</strong>{" "}
                <input
                  type="text"
                  value={header.placeOfDischarge || ""}
                  onChange={(e) => setHeader("placeOfDischarge", e.target.value)}
                  className="border border-gray-300 rounded p-1 ml-1 w-64"
                />
              </div>
            </td>

            <td className="border border-gray-400 p-3 align-top w-1/2">
              <strong>SOLD TO / INVOICED TO :</strong>
              <textarea
                rows={4}
                value={header.buyer || ""}
                onChange={(e) => setHeader("soldTo", e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1"
              />
            </td>
          </tr>

          <tr>
            <td className="border border-gray-400 p-3">
              <strong>COUNTRY / PLACE OF ORIGIN:</strong>{" "}
              <input
                type="text"
                value={header.countryOfOrigin || ""}
                onChange={(e) => setHeader("countryOfOrigin", e.target.value)}
                className="border border-gray-400 rounded p-1 ml-2 w-64"
                placeholder="UAE"
              />
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
