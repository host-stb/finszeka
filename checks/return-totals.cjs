// Run with: node checks/return-totals.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017,esModuleInterop:true}}).outputText,file);
const {aggregateRevenueRows,sumRevenue}=require('../src/lib/revenue-channels.ts');
const {revenueReportTotals}=require('../src/lib/revenue-report-totals.ts');
const {displayTotalRow,QUARTERS,sumRowValues}=require('../src/lib/report-utils.ts');
const row=(company,date,type,net,vat)=>({sirket:company,tarihi:date,fatura_numarasi:date+company+type,fatura_turu:type,fatura_iptal_durumu:'İptal Edilmemiş',cari_hesap_kodu:'test',cari_hesap_unvani:'Test',hizmet_kodu:'test',satir_matrahi:net,kdv:vat,toplami:net+vat});
const entries=aggregateRevenueRows([
 row('Holimer','2026-01-01','Perakende Satış Faturası',1000,200),
 row('Holimer','2026-01-02','Perakende Satış İade Faturası',-200,-40),
 row('Holimer','2026-04-01','Toptan Satış İade Faturası',-100,-20),
 row('Fw İlaç','2026-01-01','Toptan Satış Faturası',500,100),
 row('Fw İlaç','2026-02-01','Toptan Satış İade Faturası',-500,-100),
 {...row('Holimer','2026-01-03','Perakende Satış Faturası',99999,9999),fatura_iptal_durumu:'İptal Edilmiş'},
],'2026-10-03');
const totals=revenueReportTotals(entries,'Holimer','2026-10-03');
assert.equal(totals.sales.Ocak,1200);
assert.equal(totals.returns.Ocak,-240);
assert.equal(totals.gross.Ocak,960);
assert.equal(totals.net.Ocak,800);
assert.equal(totals.gross.Nisan,-120); // A month containing only returns is still included.
assert.equal(totals.net.Nisan,-100);
assert.equal(totals.gross.Kasım,undefined); // Future months have no data.
const report={totalBasis:'vat-included-after-returns',rows:[{id:'total',kind:'total',values:totals.sales}],netRows:[{id:'net',kind:'total',values:totals.gross}]};
const displayed=displayTotalRow(report);
assert.equal(sumRowValues(displayed),840);
assert.equal(sumRowValues(displayed,QUARTERS[0].months),960);
assert.equal(sumRowValues(displayed,QUARTERS[1].months),-120);
assert.equal(QUARTERS.reduce((sum,q)=>sum+sumRowValues(displayed,q.months),0),sumRowValues(displayed));
assert.equal(sumRevenue(entries.filter(e=>e.company==='Holimer'),'year').gross,840);
assert.equal(sumRevenue(entries.filter(e=>e.company==='Holimer'),'year').returnsGross,-360);
const fw=revenueReportTotals(entries,'Fw İlaç','2026-10-03');
assert.equal(Object.values(fw.gross).reduce((a,b)=>a+b,0),0); // Full return.
assert.equal(displayTotalRow({rows:report.rows}),report.rows[0]); // Existing mock reports retain their basis.
console.log('İade KDV’si, iade-only ay, iptaller, şirket ayrımı ve çeyrek/yıl toplamları doğrulandı.');
