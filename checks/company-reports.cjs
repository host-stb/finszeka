const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
const original=Module._load;Module._load=function(name,...args){if(name==='next/cache')return{unstable_cache:fn=>fn};return original.call(this,name,...args);};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017,esModuleInterop:true}}).outputText,f);
const {aggregateRevenueRows}=require('../src/lib/revenue-channels.ts'),{sumRowValues}=require('../src/lib/report-utils.ts');
const sale=(company,date,type,net,vat)=>({sirket:company,tarihi:date,fatura_numarasi:company+date+type,fatura_turu:type,cari_hesap_kodu:'test',cari_hesap_unvani:'Hesap',hizmet_kodu:'test',satir_matrahi:net,kdv:vat,toplami:net+vat});
const entries=aggregateRevenueRows([sale('Holimer','2026-01-01','Perakende Satış Faturası',1000,200),sale('Fw İlaç','2026-01-01','Toptan Satış Faturası',500,100),sale('Fw İlaç','2026-04-01','Toptan Satış İade Faturası',-100,-20)],'2026-10-03');
let reads=0;require('../src/lib/revenue-channel-report.ts').fetchRevenueChannelReport=async()=>{reads++;return{entries,endDate:'2026-10-03'}};
require('../src/lib/logo-api.ts').fetchSatislarOzet=async()=>{throw new Error('Monthly summaries must not be required');};
(async()=>{
 const {fetchCompanyReportFromLogo}=require('../src/lib/logo-report.ts');
 for(const [company,sales,gross,net] of [['Holimer',1200,1200,1000],['Fw İlaç',600,480,400]]){
  const report=await fetchCompanyReportFromLogo('test',company);
  assert.equal(report.companyId,company);assert.equal(sumRowValues(report.rows.find(r=>r.kind==='total')),sales);assert.equal(sumRowValues(report.netRows.find(r=>r.id==='net')),gross);assert.equal(sumRowValues(report.netRevenueRows.find(r=>r.kind==='total')),net);
  assert.equal(report.rows.filter(r=>r.kind==='item').reduce((n,r)=>n+sumRowValues(r),0),sales);assert.equal(report.netRevenueRows.filter(r=>r.kind==='item').reduce((n,r)=>n+sumRowValues(r),0),net);
 }
 assert.equal(reads,2);console.log('Holimer/FW şirket ayrımı, tam kalem toplamları ve ek aylık isteksiz raporlar doğrulandı.');
})().catch(e=>{console.error(e);process.exitCode=1});
