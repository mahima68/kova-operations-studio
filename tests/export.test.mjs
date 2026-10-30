import test from 'node:test';
import assert from 'node:assert/strict';
import {csvCell} from '../lib/csv.mjs';
import {seed,apply} from '../lib/domain.mjs';
test('spreadsheet formulas in names and SKUs export as literal text',()=>{
 for(const value of ['=1+1','+SUM(1,1)','-1+2','@SUM(A1)','  =HYPERLINK("https://example.test")','\t=1+1','\r=1+1']) assert.ok(csvCell(value).startsWith('"\''));
});
test('CSV keeps quotes, commas and numeric values intact',()=>{
 assert.equal(csvCell('Kova, "Ink"'),'"Kova, ""Ink"""');
 assert.equal(csvCell(-12.5),'"-12.5"');
 assert.equal(csvCell(null),'""');
});
test('supplier purchases reject dates that do not exist',()=>{
 const s=seed(),a={type:'purchase',supplierId:s.suppliers[0].id,sku:s.variants[0].id,qty:2,cost:26000,paid:0};
 for(const expected of ['2026-02-31','2026-13-01','not-a-date']) assert.throws(()=>apply(s,{...a,expected}),/valid expected date/);
 assert.equal(apply(s,{...a,expected:'2028-02-29'}).purchases[0].expected,'2028-02-29');
});
test('multi-item dispatch, partial returns and refunds preserve stock and debt',()=>{
 let s=seed(); const first=s.variants[0],second=s.variants[1];
 s=apply(s,{type:'order',name:'QA',city:'Delhi',channel:'Website',paymentMode:'COD',items:[{sku:first.id,qty:2,price:first.price},{sku:second.id,qty:2,price:second.price}],shippingCharged:5000,packagingCost:2500,feeBps:200});
 const id=s.orders[0].id;
 s=apply(s,{type:'pack',id});s=apply(s,{type:'ship',id,courier:'Demo',tracking:'QA-001',shippingCost:7500});
 s=apply(s,{type:'payment',id,amount:284600,note:'Demo COD'});
 s=apply(s,{type:'return',id,sku:first.id,qty:1,restock:true,note:'Size'});
 s=apply(s,{type:'refund',id,amount:69900,note:'Demo refund'});
 assert.equal(s.orders[0].items.length,2);
 assert.throws(()=>apply(s,{type:'refund',id,amount:1,note:'Duplicate'}),/exceeds/);
 assert.throws(()=>apply(s,{type:'payment',id,amount:1,note:'Excess'}),/higher/);
});
