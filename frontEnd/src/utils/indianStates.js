/**
 * Complete list of Indian states and union territories (as per India Post / SOI 2024).
 * Used in the checkout address form for the State/UT selector.
 */
export const INDIAN_STATES = [
  { name: "Andaman and Nicobar Islands", code: "AN" },
  { name: "Andhra Pradesh", code: "AP" },
  { name: "Arunachal Pradesh", code: "AR" },
  { name: "Assam", code: "AS" },
  { name: "Bihar", code: "BR" },
  { name: "Chandigarh", code: "CH" },
  { name: "Chhattisgarh", code: "CG" },
  { name: "Dadra and Nagar Haveli and Daman and Diu", code: "DD" },
  { name: "Delhi", code: "DL" },
  { name: "Goa", code: "GA" },
  { name: "Gujarat", code: "GJ" },
  { name: "Haryana", code: "HR" },
  { name: "Himachal Pradesh", code: "HP" },
  { name: "Jammu and Kashmir", code: "JK" },
  { name: "Jharkhand", code: "JH" },
  { name: "Karnataka", code: "KA" },
  { name: "Kerala", code: "KL" },
  { name: "Ladakh", code: "LA" },
  { name: "Lakshadweep", code: "LD" },
  { name: "Madhya Pradesh", code: "MP" },
  { name: "Maharashtra", code: "MH" },
  { name: "Manipur", code: "MN" },
  { name: "Meghalaya", code: "ML" },
  { name: "Mizoram", code: "MZ" },
  { name: "Nagaland", code: "NL" },
  { name: "Odisha", code: "OD" },
  { name: "Puducherry", code: "PY" },
  { name: "Punjab", code: "PB" },
  { name: "Rajasthan", code: "RJ" },
  { name: "Sikkim", code: "SK" },
  { name: "Tamil Nadu", code: "TN" },
  { name: "Telangana", code: "TS" },
  { name: "Tripura", code: "TR" },
  { name: "Uttar Pradesh", code: "UP" },
  { name: "Uttarakhand", code: "UK" },
  { name: "West Bengal", code: "WB" },
];

/**
 * India Post sorting-district pincode ranges keyed by state code.
 * Each entry is an array of [firstDigit, secondDigit] range pairs that correspond
 * to that state's allocated postal circles.
 *
 * Source: India Post Pincode Directory — postal circle allocations.
 * Format: each tuple is [minPrefix, maxPrefix] where prefix is the first 2 digits
 * of the 6-digit pincode.
 */
const STATE_PINCODE_PREFIXES = {
  AN: [[744, 744]],
  AP: [[500, 500], [501, 535]],   // Hyderabad circle overlap + AP proper
  AR: [[790, 792]],
  AS: [[781, 788]],
  BR: [[800, 855]],
  CH: [[160, 160]],
  CG: [[490, 497]],
  DD: [[362, 362], [396, 396]],   // Daman & Diu / Dadra & NH
  DL: [[110, 110]],
  GA: [[403, 403]],
  GJ: [[360, 396]],
  HR: [[121, 136]],
  HP: [[170, 177]],
  JK: [[180, 194]],
  JH: [[813, 835]],
  KA: [[560, 591]],
  KL: [[670, 695]],
  LA: [[194, 194]],
  LD: [[682, 682]],
  MP: [[450, 488]],
  MH: [[400, 445]],
  MN: [[795, 795]],
  ML: [[793, 794]],
  MZ: [[796, 796]],
  NL: [[797, 798]],
  OD: [[750, 770]],
  PY: [[605, 605], [533, 534], [673, 673]],
  PB: [[140, 160]],
  RJ: [[301, 345]],
  SK: [[737, 737]],
  TN: [[600, 643]],
  TS: [[500, 509]],
  TR: [[799, 799]],
  UP: [[200, 285]],
  UK: [[246, 263]],
  WB: [[700, 743]],
};

/**
 * Returns true when the 6-digit pincode is consistent with the selected state's
 * postal-circle allocation.
 *
 * Rules:
 * - Pincode must be exactly 6 digits.
 * - First digit must not be 0.
 * - The first 3 digits (the "sorting district") must fall within at least one
 *   of the prefix ranges configured for the state.
 *
 * When no state is selected the function returns true (no validation applied).
 */
export const isPincodeValidForState = (pincode, stateCode) => {
  if (!stateCode) return true;
  if (!/^\d{6}$/.test(pincode)) return false;
  if (pincode[0] === "0") return false;

  const prefix = parseInt(pincode.slice(0, 3), 10);
  const ranges = STATE_PINCODE_PREFIXES[stateCode];

  if (!ranges) return true; // unknown state — skip range check

  return ranges.some(([min, max]) => prefix >= min && prefix <= max);
};
