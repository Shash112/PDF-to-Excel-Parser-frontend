import React from "react";
import * as XLSX from "xlsx";

export default function PackingList() {
  const data = {
    company: "MSG OILFIELD EQUIPMENT TRADING LLC",
    address:
      "DUBAI INDUSTRIAL CITY (DIC), PHASE 1, SAI SHUAIB 2, WAREHOUSE NO: J-04, DUBAI, UNITED ARAB EMIRATES",
    trn: "100518964000003",
    date: "09/10/2025",
    invNo: "MSG-0925-1563-CI",
    soRef: "MSG-0925-1563",
    consignee: {
      name: "FAB EQUIPMENT SUPPLY FZE",
      address:
        "T2-6F-6B, Amenity Centre - RAKEZ, Rakez Business Zones located in Al Jazeera Al Hamra, RAK, United Arab Emirates",
      tel: "00971585779494",
    },
    soldTo: {
      name: "FAB EQUIPMENT SUPPLY FZE",
      address:
        "T2-6F-6B, Amenity Centre - RAKEZ, Rakez Business Zones located in Al Jazeera Al Hamra, RAK, United Arab Emirates",
      trn: "100540235700003",
    },
    shipment: {
      mode: "BY LAND",
      freight: "EX-WORKS",
      loading: "DUBAI, U.A.E",
      discharge: "HAMRIYA",
      hsCode: "CS Flanges: 73079100; CS Fittings: 73079900",
      origin: "ITALY, SOUTH KOREA, FRANCE, THAILAND, CHINA",
    },
    items: [
      {
        box: "WOODEN BOX #1",
        rows: [
          {
            id: 93,
            description:
              'ELBOW 4", 90DEG, SCH.80, LR, BW, SMLS, ASTM A/SA234WPB, ASME B16.9',
            qty: 3,
            uom: "EA",
            hs: "73079900",
            origin: "THAILAND",
            unit: 5.4,
            total: 16.2,
          },
          {
            id: 94,
            description:
              'ELBOW 6", 90DEG, THK=8.74MM, LR, BW, SMLS, ASTM A/SA234WPB, ASME B16.9',
            qty: 4,
            uom: "EA",
            hs: "73079900",
            origin: "THAILAND",
            unit: 15.35,
            total: 61.4,
          },
        ],
        net: 510.5,
        gross: 540.0,
      },
      {
        box: "WOODEN BOX #3",
        rows: [
          {
            id: 76,
            description:
              'ELBOW 8", 90DEG, SCH.30, LR, BW, SMLS, ASTM A/SA234WPB, ASME B16.9',
            qty: 12,
            uom: "EA",
            hs: "73079900",
            origin: "CHINA",
            unit: 20.3,
            total: 243.6,
          },
          {
            id: 77,
            description:
              'ELBOW 9", 90DEG, SCH.30, LR, BW, SMLS, ASTM A/SA234WPB, ASME B16.9',
            qty: 2,
            uom: "EA",
            hs: "73079900",
            origin: "CHINA",
            unit: 31.3,
            total: 62.6,
          },
        ],
        net: 433.4,
        gross: 455.0,
      },
    ],
    totals: {
      netWeight: "6934.15",
      grossWeight: "7265",
      totalNos: "596",
      packages: "4 WOODEN BOX + 8 WOODEN PALLET",
    },
  };

  // 🧮 Convert data into Excel rows
  const prepareExcelData = () => {
    const sheetData = [];

    // Header section
    sheetData.push(["PACKING LIST"]);
    sheetData.push([]);
    sheetData.push(["Company", data.company]);
    sheetData.push(["Address", data.address]);
    sheetData.push(["TRN No", data.trn]);
    sheetData.push([]);
    sheetData.push(["Invoice No", data.invNo, "Date", data.date]);
    sheetData.push(["S.O. Ref", data.soRef]);
    sheetData.push([]);
    sheetData.push(["CONSIGNEE", data.consignee.name]);
    sheetData.push(["Address", data.consignee.address]);
    sheetData.push(["Tel", data.consignee.tel]);
    sheetData.push([]);
    sheetData.push(["SOLD TO / INVOICED TO", data.soldTo.name]);
    sheetData.push(["Address", data.soldTo.address]);
    sheetData.push(["TRN", data.soldTo.trn]);
    sheetData.push([]);
    sheetData.push(["MODE OF SHIPMENT", data.shipment.mode]);
    sheetData.push(["FREIGHT TERMS", data.shipment.freight]);
    sheetData.push(["PLACE OF LOADING", data.shipment.loading]);
    sheetData.push(["PLACE OF DISCHARGE", data.shipment.discharge]);
    sheetData.push(["HS CODE", data.shipment.hsCode]);
    sheetData.push(["COUNTRY OF ORIGIN", data.shipment.origin]);
    sheetData.push([]);

    // Table header
    sheetData.push([
      "SR NO",
      "DESCRIPTION",
      "QTY",
      "UOM",
      "H.S. CODE",
      "ORIGIN",
      "UNIT WT / KGS",
      "TOTAL WT / KGS",
    ]);

    // Items
    data.items.forEach((box) => {
      sheetData.push([box.box]);
      box.rows.forEach((item) => {
        sheetData.push([
          item.id,
          item.description,
          item.qty,
          item.uom,
          item.hs,
          item.origin,
          item.unit,
          item.total,
        ]);
      });
      sheetData.push([
        "",
        "NET WEIGHT",
        "",
        "",
        "",
        "",
        box.net,
        "GROSS WEIGHT " + box.gross,
      ]);
      sheetData.push([]);
    });

    // Totals
    sheetData.push([
      "PACKING DETAILS",
      "TOTAL OF 1 PACKAGE (" + data.totals.packages + ")",
    ]);
    sheetData.push(["NET WEIGHT", data.totals.netWeight + " KGS"]);
    sheetData.push(["GROSS WEIGHT", data.totals.grossWeight + " KGS"]);

    return sheetData;
  };

  // 📤 Export to Excel
  const exportToExcel = () => {
    const excelData = prepareExcelData();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Packing List");
    XLSX.writeFile(wb, "PackingList.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
      <div className="bg-white w-[90%] border border-gray-400 p-6 shadow">
        <h2 className="text-center font-bold text-lg mb-4 underline">
          PACKING LIST (Preview)
        </h2>
        <p className="text-sm mb-2">
          Company: <b>{data.company}</b>
        </p>
        <p className="text-sm mb-2">Invoice No: {data.invNo}</p>
        <p className="text-sm mb-2">Date: {data.date}</p>
        <p className="text-sm mb-2">
          Mode of Shipment: {data.shipment.mode} | Freight Terms:{" "}
          {data.shipment.freight}
        </p>

        <table className="w-full border border-black border-collapse text-xs mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1">SR NO</th>
              <th className="border border-black p-1">DESCRIPTION</th>
              <th className="border border-black p-1">QTY</th>
              <th className="border border-black p-1">UOM</th>
              <th className="border border-black p-1">H.S. CODE</th>
              <th className="border border-black p-1">ORIGIN</th>
              <th className="border border-black p-1">UNIT WT / KGS</th>
              <th className="border border-black p-1">TOTAL WT / KGS</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((box, i) => (
              <React.Fragment key={i}>
                <tr>
                  <td
                    colSpan={8}
                    className="border border-black text-center font-semibold bg-gray-50"
                  >
                    {box.box}
                  </td>
                </tr>
                {box.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="border border-black p-1">{row.id}</td>
                    <td className="border border-black p-1">{row.description}</td>
                    <td className="border border-black p-1 text-center">
                      {row.qty}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {row.uom}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {row.hs}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {row.origin}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {row.unit}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <button
          onClick={exportToExcel}
          className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📤 Export to Excel
        </button>
      </div>
    </div>
  );
}
