import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBoxLabelQr,
  buildDateCode,
  buildLotNo,
  encodeDatePart,
  isValidLotNo,
} from "../src/utils/boxLabel.js";

test("encodes month and day values used in a Lot No", () => {
  assert.equal(encodeDatePart(8), "8");
  assert.equal(encodeDatePart(10), "A");
  assert.equal(encodeDatePart(11), "B");
  assert.equal(encodeDatePart(31), "V");
  assert.equal(buildDateCode("2026-08-11"), "268B");
});

test("creates a daily Lot No with a three-digit sequence", () => {
  assert.equal(buildLotNo("268B", 1), "268B-X001");
  assert.equal(buildLotNo("268B", 999), "268B-X999");
  assert.throws(() => buildLotNo("268B", 1000));
});

test("validates the YYMD-X999 Lot No standard", () => {
  assert.equal(isValidLotNo("268B-X001"), true);
  assert.equal(isValidLotNo("26AB-X999"), true);
  assert.equal(isValidLotNo("ZZZZ-X001"), false);
  assert.equal(isValidLotNo("2601-X001"), false);
  assert.equal(isValidLotNo("268B-X01"), false);
});

test("creates the required 24-character Box Label QR", () => {
  const qrCode = buildBoxLabelQr({
    MATERIALSCODE: "PTHRT1",
    PRODUCT: "TMS",
    PRODUCTFACTORY: "V2",
    LOTNO: "268B-X001",
    QUANTITY: 160,
  });
  assert.equal(qrCode, "PTHRT1TMSV2268BX00100160");
  assert.equal(qrCode.length, 24);
});

test("rejects source fields with invalid fixed lengths", () => {
  assert.throws(() => buildBoxLabelQr({
    MATERIALSCODE: "SHORT",
    PRODUCT: "TMS",
    PRODUCTFACTORY: "V2",
    LOTNO: "268B-X001",
    QUANTITY: 160,
  }));
});
