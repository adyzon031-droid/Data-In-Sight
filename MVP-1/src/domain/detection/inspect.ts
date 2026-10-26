import { detectNaturalPersonal } from "./detectors/natural-personal";
import type { CountryCode } from "libphonenumber-js";
import { detectContextualPersonal } from "./detectors/contextual-personal";
import { detectFinancialMx } from "./detectors/financial-mx";
import { detectEmails } from "./detectors/email";
import { detectPhones } from "./detectors/phone";
import { detectCurps } from "./detectors/curp";
import { detectRfcs } from "./detectors/rfc";
import { detectSecrets } from "./detectors/secrets";
import { detectionView } from "./normalize";
import { mergeFindings } from "./merge-findings";

export function detect(text: string, phoneRegion: CountryCode = "MX") {
  const view = detectionView(text);
  return mergeFindings(
    [
      detectSecrets,
      detectFinancialMx,
      detectContextualPersonal,
      detectNaturalPersonal,
      detectEmails,
      (value: string) => detectPhones(value, phoneRegion),
      detectCurps,
      detectRfcs,
    ]
      .flatMap((detector) => detector(view.text))
      .map((finding) => ({
        ...finding,
        start: view.offsets[finding.start]!,
        end: view.offsets[finding.end - 1]! + 1,
      })),
  );
}
