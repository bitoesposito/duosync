import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(isBetween);

export const TWENTY_FOUR_HOUR_FORMAT = "HH:mm";

export function parseTimeStrict(value: string) {
  return dayjs(value, TWENTY_FOUR_HOUR_FORMAT, true);
}

export function formatTimeTo24h(value: string) {
  const parsed = parseTimeStrict(value);
  return parsed.isValid() ? parsed.format(TWENTY_FOUR_HOUR_FORMAT) : value;
}

export default dayjs;


