const zeroDecimalCurrencies = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF"
]);

const threeDecimalCurrencies = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);

export function getCurrencyMinorUnit(currency: string) {
  const normalized = normalizeCurrency(currency);

  if (zeroDecimalCurrencies.has(normalized)) {
    return 0;
  }

  if (threeDecimalCurrencies.has(normalized)) {
    return 3;
  }

  return 2;
}

export function decimalToMinorUnits(amount: string, currency = "USD") {
  const minorUnit = getCurrencyMinorUnit(currency);
  const normalizedAmount = amount.trim();

  if (!/^\d+(\.\d+)?$/.test(normalizedAmount)) {
    throw new Error("Amount must be a positive decimal string");
  }

  const [whole = "0", rawFraction = ""] = normalizedAmount.split(".");

  if (rawFraction.length > minorUnit && /[1-9]/.test(rawFraction.slice(minorUnit))) {
    throw new Error(`Amount has more than ${minorUnit} decimal places for ${normalizeCurrency(currency)}`);
  }

  const fraction = rawFraction.slice(0, minorUnit);
  const normalizedFraction = fraction.padEnd(minorUnit, "0");
  const minorUnits = Number.parseInt(minorUnit === 0 ? whole : `${whole}${normalizedFraction}`, 10);

  if (!Number.isSafeInteger(minorUnits)) {
    throw new Error("Amount is too large");
  }

  return minorUnits;
}

export function normalizeCurrency(currency: string) {
  return currency.trim().toUpperCase();
}
