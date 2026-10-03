import { unstable_cache } from "next/cache";
import { fetchLogoDurum, fetchSatislar } from "./logo-api";
import { shiftDate } from "./product-sales";
import { aggregateRevenueRows, mergeRevenueEntries, type RevenueEntry } from "./revenue-channels";

async function readMonth(base:string, company:string, start:string, end:string, reportEnd:string) {
 const parts:RevenueEntry[][]=[];
 const limit=1000;
 for(let offset=0,pages=0;pages<600;pages++) {
  const page=await fetchSatislar(base,{sirket:company,baslangic:start,bitis:end,limit,offset});
  if(page.adet!==page.satirlar.length)throw new Error("Eksik satış sayfası");
  if(page.satirlar.length<limit){parts.push(aggregateRevenueRows(page.satirlar,reportEnd));return mergeRevenueEntries(parts);}
  const last=page.satirlar.at(-1)!;let complete=page.satirlar.length;
  while(complete>0){const row=page.satirlar[complete-1];if(row.tarihi!==last.tarihi||row.fatura_numarasi!==last.fatura_numarasi)break;complete--;}
  if(!complete)throw new Error("Tek fatura sayfa sınırını aşıyor");
  parts.push(aggregateRevenueRows(page.satirlar.slice(0,complete),reportEnd));offset+=complete;
 }
 throw new Error("Ciro veri kapsamı tamamlanamadı");
}
const readYear = unstable_cache(async(base:string,endDate:string,transfer:string)=>{
 void transfer;
 const months=Array.from({length:Number(endDate.slice(5,7))},(_,index)=>`${endDate.slice(0,4)}-${String(index+1).padStart(2,"0")}`);
 const jobs=months.flatMap(month=>["Holimer","Fw İlaç"].map(company=>({month,company})));
 const parts:RevenueEntry[][]=[];
 // Limit concurrent mirror reads; never substitute a top-customer list for full revenue.
 for(let offset=0;offset<jobs.length;offset+=4){
  const batch=await Promise.all(jobs.slice(offset,offset+4).map(job=>{
   const next=new Date(`${job.month}-01T00:00:00Z`);next.setUTCMonth(next.getUTCMonth()+1);
   const monthEnd=shiftDate(next.toISOString().slice(0,10),-1);
   return readMonth(base,job.company,`${job.month}-01`,monthEnd<endDate?monthEnd:endDate,endDate);
  }));parts.push(...batch);
 }
 return mergeRevenueEntries(parts);
},["revenue-channels-returns-gross-2026-10-04-v2"],{revalidate:3600});
export async function fetchRevenueChannelReport(baseOverride?:string){
 const base=(baseOverride ?? process.env.FASTAPI_BASE_URL)?.replace(/\/$/,"");if(!base)throw new Error("Logo havuz bağlantısı tanımlı değil");
 const status=await fetchLogoDurum(base);
 if(!status.veri_var||!status.en_yeni_fatura)throw new Error("Ciro verisi yok");
 for(const company of ["Holimer","Fw İlaç"])if(!status.sirketler.some(item=>item.sirket===company))throw new Error("Şirket verisi eksik");
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Istanbul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 const yesterday=shiftDate(today,-1),latest=status.en_yeni_fatura.slice(0,10),endDate=latest<yesterday?latest:yesterday;
 const startDate=`${endDate.slice(0,4)}-01-01`;
 if(status.en_eski_fatura.slice(0,10)>startDate)throw new Error("Yılbaşından itibaren veri kapsamı eksik");
 return {endDate,startDate,lastTransfer:status.son_aktarim,stale:latest<yesterday,entries:await readYear(base,endDate,status.son_aktarim)};
}
