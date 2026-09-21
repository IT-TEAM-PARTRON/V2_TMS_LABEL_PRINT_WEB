export const LOT_NO_PATTERN = /^\d{2}[1-9A-C][1-9A-V]-X\d{3}$/;

export const isValidLotNo = (value) => LOT_NO_PATTERN.test(String(value));

export const encodeDatePart = (value) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 31) {
    throw new Error("Invalid date part");
  }
  return number < 10 ? String(number) : String.fromCharCode(55 + number);
};

export const buildDateCode = (isoDate) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate));
  if (!match) throw new Error("Invalid production date");
  return `${match[1].slice(-2)}${encodeDatePart(Number(match[2]))}${encodeDatePart(Number(match[3]))}`;
};

export const buildLotNo = (dateCode, sequence) => {
  if (!/^\d{2}[1-9A-C][1-9A-V]$/.test(dateCode)) throw new Error("Invalid date code");
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999) {
    throw new Error("Daily Box Label sequence is out of range");
  }
  return `${dateCode}-X${String(sequence).padStart(3, "0")}`;
};

export const buildBoxLabelQr = ({ MATERIALSCODE, PRODUCT, PRODUCTFACTORY, LOTNO, QUANTITY }) => {
  if (String(MATERIALSCODE).length !== 6) throw new Error("Invalid MATERIALSCODE length");
  if (String(PRODUCT).length !== 3) throw new Error("Invalid PRODUCT length");
  if (String(PRODUCTFACTORY).length !== 2) throw new Error("Invalid PRODUCTFACTORY length");
  if (!isValidLotNo(LOTNO)) throw new Error("Invalid LOTNO format");
  const qrCode = `${MATERIALSCODE}${PRODUCT}${PRODUCTFACTORY}${LOTNO.replace("-", "")}${String(QUANTITY).padStart(5, "0")}`;
  if (qrCode.length !== 24) throw new Error("Box Label QR must contain exactly 24 characters");
  return qrCode;
};
