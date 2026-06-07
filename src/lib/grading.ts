export const AUCTION_CONDITIONS = [
  "New",
  "Like New",
  "Very Good",
  "Good",
  "Fair",
  "Poor",
] as const;

export type GradingCompany = "PSA" | "BGS" | "CGC" | "SGC" | "ACE" | "HGA";

export const GRADING_COMPANIES: {
  id: GradingCompany;
  label: string;
}[] = [
  { id: "PSA", label: "PSA" },
  { id: "BGS", label: "BGS (Beckett)" },
  { id: "CGC", label: "CGC" },
  { id: "SGC", label: "SGC" },
  { id: "ACE", label: "ACE" },
  { id: "HGA", label: "HGA" },
];

export type GradeOption = {
  id: string;
  grade: string;
  label: string;
};

function grade(id: string, gradeValue: string, label: string): GradeOption {
  return { id, grade: gradeValue, label };
}

export const GRADES_BY_COMPANY: Record<GradingCompany, GradeOption[]> = {
  PSA: [
    grade("psa-10", "10", "Gem Mint"),
    grade("psa-9", "9", "Mint"),
    grade("psa-8", "8", "Near Mint-Mint"),
    grade("psa-7", "7", "Near Mint"),
    grade("psa-6", "6", "Excellent-Mint"),
    grade("psa-5", "5", "Excellent"),
    grade("psa-4", "4", "Very Good-Excellent"),
    grade("psa-3", "3", "Very Good"),
    grade("psa-2", "2", "Good"),
    grade("psa-1.5", "1.5", "Fair"),
    grade("psa-1", "1", "Poor"),
    grade("psa-auth", "Authentic", "Authentic"),
  ],
  BGS: [
    grade("bgs-10-bl", "10", "Black Label Pristine"),
    grade("bgs-10-pr", "10", "Pristine"),
    grade("bgs-9.5", "9.5", "Gem Mint"),
    grade("bgs-9", "9", "Mint"),
    grade("bgs-8.5", "8.5", "Near Mint-Mint+"),
    grade("bgs-8", "8", "Near Mint-Mint"),
    grade("bgs-7.5", "7.5", "Near Mint+"),
    grade("bgs-7", "7", "Near Mint"),
    grade("bgs-6", "6", "Excellent-Mint"),
    grade("bgs-5", "5", "Excellent"),
    grade("bgs-4", "4", "Very Good-Excellent"),
    grade("bgs-3", "3", "Very Good"),
    grade("bgs-2", "2", "Good"),
    grade("bgs-1", "1", "Poor"),
  ],
  CGC: [
    grade("cgc-10", "10", "Pristine"),
    grade("cgc-9.5", "9.5", "Gem Mint"),
    grade("cgc-9", "9", "Mint"),
    grade("cgc-8.5", "8.5", "Near Mint-Mint+"),
    grade("cgc-8", "8", "Near Mint-Mint"),
    grade("cgc-7.5", "7.5", "Near Mint+"),
    grade("cgc-7", "7", "Near Mint"),
    grade("cgc-6", "6", "Excellent-Mint"),
    grade("cgc-5", "5", "Excellent"),
    grade("cgc-4", "4", "Very Good-Excellent"),
    grade("cgc-3", "3", "Very Good"),
    grade("cgc-2", "2", "Good"),
    grade("cgc-1", "1", "Poor"),
  ],
  SGC: [
    grade("sgc-10", "10", "Pristine"),
    grade("sgc-9.5", "9.5", "Mint+"),
    grade("sgc-9", "9", "Mint"),
    grade("sgc-8", "8", "Near Mint-Mint"),
    grade("sgc-7", "7", "Near Mint"),
    grade("sgc-6", "6", "Excellent-Mint"),
    grade("sgc-5", "5", "Excellent"),
    grade("sgc-4", "4", "Very Good-Excellent"),
    grade("sgc-3", "3", "Very Good"),
    grade("sgc-2", "2", "Good"),
    grade("sgc-1", "1", "Poor"),
  ],
  ACE: [
    grade("ace-10-pr", "10", "Pristine"),
    grade("ace-10-gm", "10", "Gem Mint"),
    grade("ace-9", "9", "Mint"),
    grade("ace-8", "8", "Near Mint-Mint"),
    grade("ace-7", "7", "Near Mint"),
    grade("ace-6", "6", "Excellent-Mint"),
    grade("ace-5", "5", "Excellent"),
    grade("ace-4", "4", "Very Good-Excellent"),
    grade("ace-3", "3", "Very Good"),
    grade("ace-2", "2", "Good"),
    grade("ace-1", "1", "Poor"),
  ],
  HGA: [
    grade("hga-10", "10", "Gem Mint"),
    grade("hga-9.5", "9.5", "Mint+"),
    grade("hga-9", "9", "Mint"),
    grade("hga-8.5", "8.5", "Near Mint-Mint+"),
    grade("hga-8", "8", "Near Mint-Mint"),
    grade("hga-7.5", "7.5", "Near Mint+"),
    grade("hga-7", "7", "Near Mint"),
    grade("hga-6", "6", "Excellent-Mint"),
    grade("hga-5", "5", "Excellent"),
  ],
};

export const GRADING_DETAIL_KEYS = [
  "grading_company",
  "grade",
  "grade_label",
] as const;

export type GradingInfo = {
  company: string;
  grade: string;
  label: string;
};

export function getGradesForCompany(company: GradingCompany): GradeOption[] {
  return GRADES_BY_COMPANY[company] ?? [];
}

export function getGradeOption(
  company: GradingCompany,
  gradeId: string
): GradeOption | null {
  return getGradesForCompany(company).find((option) => option.id === gradeId) ?? null;
}

export function buildGradingItemDetails(
  company: GradingCompany,
  gradeId: string
): Record<string, string> | null {
  const option = getGradeOption(company, gradeId);
  if (!option) return null;

  return {
    grading_company: company,
    grade: option.grade,
    grade_label: option.label,
  };
}

export function getGradingFromItemDetails(
  details: Record<string, string>
): GradingInfo | null {
  const company = details.grading_company?.trim();
  const gradeValue = details.grade?.trim();
  const label = details.grade_label?.trim();

  if (!company || !gradeValue || !label) return null;

  return { company, grade: gradeValue, label };
}

export function formatGradingBadge(info: GradingInfo): string {
  return `${info.company} ${info.grade} — ${info.label}`;
}

export function isGradingDetailKey(key: string): boolean {
  return (GRADING_DETAIL_KEYS as readonly string[]).includes(key);
}

export function filterCustomItemDetails(
  details: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(details).filter(
      ([key, value]) => !isGradingDetailKey(key) && key.trim() && value.trim()
    )
  );
}
