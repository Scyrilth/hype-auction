import type { ChartGranularity, DateRange, DateRangePreset } from "./types";

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  quarter: "This quarter",
  year: "This year",
  all: "All time",
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfQuarter(date: Date) {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

export function getDateRangeFromPreset(
  preset: DateRangePreset,
  customFrom?: Date,
  customTo?: Date
): DateRange {
  const now = new Date();

  if (customFrom && customTo) {
    return {
      preset,
      from: startOfDay(customFrom),
      to: endOfDay(customTo),
      label: `${customFrom.toLocaleDateString()} – ${customTo.toLocaleDateString()}`,
      isCustom: true,
    };
  }

  switch (preset) {
    case "today":
      return {
        preset,
        from: startOfDay(now),
        to: endOfDay(now),
        label: PRESET_LABELS.today,
      };
    case "week":
      return {
        preset,
        from: startOfWeek(now),
        to: endOfDay(now),
        label: PRESET_LABELS.week,
      };
    case "month":
      return {
        preset,
        from: startOfMonth(now),
        to: endOfDay(now),
        label: PRESET_LABELS.month,
      };
    case "quarter":
      return {
        preset,
        from: startOfQuarter(now),
        to: endOfDay(now),
        label: PRESET_LABELS.quarter,
      };
    case "year":
      return {
        preset,
        from: startOfYear(now),
        to: endOfDay(now),
        label: PRESET_LABELS.year,
      };
    case "all":
    default:
      return {
        preset: "all",
        from: new Date(0),
        to: endOfDay(now),
        label: PRESET_LABELS.all,
      };
  }
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const duration = range.to.getTime() - range.from.getTime();
  const prevTo = new Date(range.from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - duration);

  return {
    preset: range.preset,
    from: prevFrom,
    to: prevTo,
    label: "Previous period",
  };
}

export function isDateInRange(isoDate: string, range: DateRange): boolean {
  const time = new Date(isoDate).getTime();
  return time >= range.from.getTime() && time <= range.to.getTime();
}

export function getChartGranularity(range: DateRange): ChartGranularity {
  switch (range.preset) {
    case "today":
      return "hour";
    case "week":
    case "month":
      return "day";
    case "quarter":
      return "week";
    case "year":
    case "all":
      return range.preset === "all" ? "quarter" : "month";
    default:
      return "day";
  }
}

export function formatPeriodLabel(date: Date, granularity: ChartGranularity): string {
  switch (granularity) {
    case "hour":
      return date.toLocaleTimeString(undefined, { hour: "numeric" });
    case "day":
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    case "week":
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    case "month":
      return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    case "quarter": {
      const q = Math.floor(date.getMonth() / 3) + 1;
      return `Q${q} ${date.getFullYear()}`;
    }
    default:
      return date.toLocaleDateString();
  }
}

export function getPeriodKey(date: Date, granularity: ChartGranularity): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  switch (granularity) {
    case "hour":
      return `${y}-${m}-${d}-${date.getHours()}`;
    case "day":
      return `${y}-${m}-${d}`;
    case "week": {
      const weekStart = startOfWeek(date);
      return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
    }
    case "month":
      return `${y}-${m}`;
    case "quarter":
      return `${y}-Q${Math.floor(m / 3) + 1}`;
    default:
      return `${y}-${m}-${d}`;
  }
}

export const DATE_PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "today", label: PRESET_LABELS.today },
  { id: "week", label: PRESET_LABELS.week },
  { id: "month", label: PRESET_LABELS.month },
  { id: "quarter", label: PRESET_LABELS.quarter },
  { id: "year", label: PRESET_LABELS.year },
  { id: "all", label: PRESET_LABELS.all },
];
