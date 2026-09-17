let selectedPrinter = null;

const browserPrintBaseUrl = () =>
  window.location.protocol === "https:"
    ? "https://localhost:9101/"
    : "http://localhost:9100/";

const getDefaultPrinterDirectly = async () => {
  const response = await fetch(`${browserPrintBaseUrl()}default?type=printer`);
  if (!response.ok) throw new Error(`Zebra Browser Print error ${response.status}`);
  const responseText = await response.text();
  if (!responseText) return null;
  return JSON.parse(responseText);
};

export const setupWebPrint = () =>
  new Promise((resolve, reject) => {
    if (window.BrowserPrint) {
      window.BrowserPrint.getDefaultDevice(
        "printer",
        (device) => {
          if (!device) {
            reject(new Error("Không tìm thấy máy in Zebra mặc định."));
            return;
          }
          selectedPrinter = device;
          resolve({ success: true, name: device.name || device.uid || "Zebra Printer" });
        },
        (error) => reject(new Error(error || "Không thể kết nối Zebra Browser Print.")),
      );
      return;
    }

    getDefaultPrinterDirectly()
      .then((device) => {
        if (!device) throw new Error("Không tìm thấy máy in Zebra mặc định.");
        selectedPrinter = device;
        resolve({ success: true, name: device.name || device.uid || "Zebra Printer" });
      })
      .catch(() => reject(new Error("Không thể kết nối Zebra Browser Print. Hãy kiểm tra ứng dụng Browser Print và máy in mặc định.")));
  });

export const sendZplCode = async (zplCode) => {
  if (!selectedPrinter) await setupWebPrint();
  if (typeof selectedPrinter.send !== "function") {
    const response = await fetch(`${browserPrintBaseUrl()}write`, {
      method: "POST",
      body: JSON.stringify({ device: selectedPrinter, data: zplCode }),
    });
    if (!response.ok) throw new Error(`Zebra Browser Print error ${response.status}`);
    return { success: true };
  }
  return new Promise((resolve, reject) => {
    selectedPrinter.send(
      zplCode,
      () => resolve({ success: true }),
      (error) => reject(new Error(error || "Không thể gửi dữ liệu tới máy in Zebra.")),
    );
  });
};
