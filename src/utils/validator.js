function normalizeDigits(value, length) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length !== length) {
    return null;
  }

  return digits;
}

function validateDraw(draw) {
  const firstPrize = draw?.prizes?.first?.number?.[0] || draw?.first_prize;
  const normalized = normalizeDigits(firstPrize, 6);

  if (!normalized) {
    return false;
  }

  return normalized !== "000000";
}

module.exports = {
  normalizeDigits,
  validateDraw
};
