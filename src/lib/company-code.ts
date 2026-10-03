/** Stable URL identifiers; retain exact mirror names in reports and UI. */
export function companyRequestCode(company: string): string {
 return company === "Fw İlaç" ? "fw" : company === "Holimer" ? "holimer" : company;
}
export function companyNameFromCode(code: string): string {
 return code.toLowerCase() === "fw" ? "Fw İlaç" : code.toLowerCase() === "holimer" ? "Holimer" : code;
}
