import source from "../data/revenue-accounts.json";
const sites: Record<string,string> = { Holimer:"holistikmarket.com", "Fw İlaç":"destekurunleri.com" };
const ownAccounts: Record<string,ReadonlySet<string>> = {
  Holimer:new Set(["9.HOLISTIK.COM","9.TICIMAX"]),
  "Fw İlaç":new Set(["9.FW.DESTEK","9.TICIMAX"]),
};
const cards=new Map(source.accounts.map(account=>[`${account.company}|${account.code}`,account]));
/** Exact own-site accounts and explicitly site-tagged customer cards; no company-wide fallback. */
export function isOwnWebsiteSale(company:string,accountCode:string):boolean {
 const code=accountCode?.trim();
 if(!code||!sites[company])return false;
 if(ownAccounts[company]?.has(code))return true;
 // Keep marketplace basket accounts out even if customer metadata is inconsistent.
 if(code.startsWith("9."))return false;
 const card=cards.get(`${company}|${code}`);
 const special=card?.specialCode.toLocaleUpperCase("tr-TR").replace(/İ/g,"I") ?? "";
 if (/^120\.(02|03|04|05|06)\./.test(code) || special.includes("BAYI") || special.startsWith("OMT") || special==="FARMAZON") return false;
 const website=card?.website.toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,"").split(/[/?#]/)[0];
 return website===sites[company];
}
