import { getCountries, getCountryCallingCode } from "libphonenumber-js";
const names = new Intl.DisplayNames(["es"], { type: "region" });
export const phoneRegions = getCountries()
  .map((code) => ({
    code,
    label: `${names.of(code) ?? code} (+${getCountryCallingCode(code)})`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, "es"));
