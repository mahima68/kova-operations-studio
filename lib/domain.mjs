export const money = n => new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR',maximumFractionDigits:0}).format(n / 100);
export const today = () => { const p = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); const v = k => p.find(x=>x.type===k).value; return `${v('year')}-${v('month')}-${v('day')}`; };
const uid = prefix => `${prefix}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
function check(test, message) { if (!test) throw new Error(message); }
function num(n, label, min = 0, max = 100000000) { check(Number.isSafeInteger(n) && n >= min && n <= max, `${label} must be a whole number between ${min} and ${max}.`); return n; }
function str(s, label, max = 160) { check(typeof s === 'string' && s.trim().length > 0 && s.length <= max, `Enter ${label.toLowerCase()} (up to ${max} characters).`); return s.trim(); }
const pick = (s,id) => {const v=s.variants.find(v=>v.id===id); check(v,'Choose a valid product.'); return v;};
const order = (s,id) => {const o=s.orders.find(o=>o.id===id); check(o,'Order not found.'); return o;};
export const dispatched = o => ['Shipped','Delivered'].includes(o.status);
export const total = o => o.items.reduce((a,i)=>a+i.qty*i.price,0)+o.shippingCharged;
export const paid = (s,id) => s.payments.filter(p=>p.orderId===id).reduce((a,p)=>a+(p.type==='Refund'?-p.amount:p.amount),0);
export const returned = (s,id,sku) => s.returns.filter(r=>r.orderId===id&&r.sku===sku).reduce((a,r)=>a+r.qty,0);
export function stock(s,sku) {
 const onHand=s.movements.filter(m=>m.sku===sku).reduce((a,m)=>a+m.qty,0);
 const reserved=s.orders.filter(o=>['Confirmed','Packed'].includes(o.status)).reduce((a,o)=>a+o.items.filter(i=>i.sku===sku).reduce((b,i)=>b+i.qty,0),0);
 return {onHand,reserved,available:onHand-reserved};
}
export const refundLimit=(s,o)=>o.status==='Cancelled'?total(o):s.returns.filter(r=>r.orderId===o.id).reduce((a,r)=>a+r.value,0);
export const refunds=(s,id)=>s.payments.filter(p=>p.orderId===id&&p.type==='Refund').reduce((a,p)=>a+p.amount,0);
export const due=(s,o)=>Math.max(0,(o.status==='Cancelled'?0:total(o)-refundLimit(s,o))-paid(s,o.id));
export function metrics(s) {
 const shipped=s.orders.filter(dispatched);
 const sales=shipped.reduce((a,o)=>a+total(o),0)-s.returns.reduce((a,r)=>a+r.value,0);
 const cogs=shipped.reduce((a,o)=>a+o.items.reduce((b,i)=>b+i.qty*i.cost,0),0)-s.returns.filter(r=>r.restock).reduce((a,r)=>a+r.qty*r.cost,0);
 const fulfilment=shipped.reduce((a,o)=>a+o.shippingCost+o.packagingCost+Math.round(total(o)*o.feeBps/10000),0);
 const expenses=s.expenses.reduce((a,e)=>a+e.amount,0);
 return {sales,cogs,fulfilment,contribution:sales-cogs-fulfilment,expenses,balance:sales-cogs-fulfilment-expenses,outstanding:s.orders.reduce((a,o)=>a+due(s,o),0),units:s.variants.reduce((a,v)=>a+stock(s,v.id).onHand,0),reserved:s.variants.reduce((a,v)=>a+stock(s,v.id).reserved,0),low:s.variants.filter(v=>stock(s,v.id).available<=v.reorder).length};
}
export function seed() {
 const s={brand:'Kova Lifestyle',variants:[],movements:[],orders:[],payments:[],returns:[],suppliers:[{id:'SUP-01',name:'Sample Cotton Works',contact:'Fictional supplier · Ludhiana'},{id:'SUP-02',name:'Demo Print Studio',contact:'Fictional supplier · Delhi'}],purchases:[],expenses:[{id:'EXP-01',date:'2026-10-10',category:'Sampling',amount:240000,note:'Fictional sample development'},{id:'EXP-02',date:'2026-10-18',category:'Marketing',amount:120000,note:'Sample shoot and content props'}],campaigns:[{id:'CMP-01',name:'First drop · Instagram',channel:'Instagram',budget:300000,spent:0,impressions:0,clicks:0},{id:'CMP-02',name:'Search launch plan',channel:'Google Ads',budget:500000,spent:0,impressions:0,clicks:0}],tasks:[],activity:[]};
 const colours=[['Ink','INK'],['Chalk','CHK'],['Sage','SAG']];
 for(const [style,code,price,cost] of [['Everyday','ED',69900,26000],['Oversized','OV',89900,34000]]) for(const gender of ['Men','Women']) for(const [colour,col] of colours) for(const size of ['XS','S','M','L','XL']) {
  const id=`KV-${code}-${gender[0]}-${col}-${size}`;
  s.variants.push({id,style,gender,colour,size,price,cost,reorder:3});
  s.movements.push({id:`OPEN-${id}`,sku:id,qty:size==='XS'?3:size==='M'?12:8,kind:'Opening stock',date:'2026-10-01',note:'Fictional opening stock'});
 }
 const tasks=[['Brand','Define customer and price range'],['Brand','Choose brand colours and logo'],['Products','Check fabric and print samples'],['Products','Build size chart and care guide'],['Products','Create SKU list for all variants'],['Products','Approve fit for men and women'],['Suppliers','Compare supplier quotes'],['Suppliers','Confirm minimum order and lead time'],['Money','Set a launch budget'],['Money','Check unit cost and selling price'],['Store','Prepare photos and product descriptions'],['Store','Set up order form or online store'],['Store','Draft shipping and return policies'],['Store','Review India tax and invoice needs with an adviser'],['Operations','Test packing and shipping flow'],['Operations','Run a test return and refund'],['Marketing','Prepare 30-day content calendar'],['Marketing','Plan search keywords and ad copy'],['Marketing','Set up campaign tracking links'],['Launch','Complete a test order before launch']];
 s.tasks=tasks.map(([group,title],i)=>({id:`TASK-${i+1}`,group,title,done:[0,1,2,4,8,9].includes(i)}));
 const products=s.variants;
 const specs=[['Aarav (demo)','Delhi','Instagram','Delivered','Prepaid',3,0],['Meera (demo)','Mumbai','Website','Shipped','Prepaid',17,1],['Kabir (demo)','Jaipur','WhatsApp','Packed','COD',31,2],['Tara (demo)','Pune','Instagram','Confirmed','Prepaid',44,3],['Riya (demo)','Bengaluru','Website','Delivered','COD',23,4],['Dev (demo)','Chandigarh','WhatsApp','Confirmed','COD',38,5],['Isha (demo)','Amritsar','Instagram','Delivered','Prepaid',52,6],['Neel (demo)','Delhi','Website','Packed','Prepaid',8,7]];
 for(const [name,city,channel,status,mode,index,i] of specs){ const v=products[index]; const o={id:`KV-100${i+1}`,name,city,channel,status,paymentMode:mode,date:`2026-10-${String(17+i).padStart(2,'0')}`,items:[{sku:v.id,qty:i===0?2:1,price:v.price,cost:v.cost}],shippingCharged:0,shippingCost:dispatched({status})?7500:0,packagingCost:2500,feeBps:200,courier:dispatched({status})?'Sample courier':'',tracking:dispatched({status})?`DEMO${i+1}`:'',campaignId:channel==='Instagram'?'CMP-01':''}; s.orders.push(o); if(dispatched(o)) s.movements.push({id:`SHIP-${o.id}`,sku:v.id,qty:-o.items[0].qty,kind:'Dispatch',date:o.date,note:o.id}); if(mode==='Prepaid'||status==='Delivered')s.payments.push({id:`PAY-${o.id}`,orderId:o.id,type:'Payment',amount:total(o),date:o.date,note:'Fictional payment'}); }
 s.purchases.push({id:'PO-1001',supplierId:'SUP-01',date:'2026-10-24',expected:'2026-11-03',status:'Ordered',items:[{sku:products[0].id,qty:12,cost:26000},{sku:products[15].id,qty:12,cost:26000}],paid:312000});
 s.activity=[{id:'ACT-SEED',date:'2026-10-24',text:'Fictional starter records loaded'}];
 return s;
}
export function apply(original, a) {
 check(a && typeof a.type==='string','Choose a valid action.');
 const s=structuredClone(original), date=today();
 const log=text=>s.activity.unshift({id:uid('ACT'),date,text});
 switch(a.type){
 case 'task': {const t=s.tasks.find(t=>t.id===a.id);check(t,'Task not found.');t.done=!t.done;log(`${t.done?'Completed':'Reopened'}: ${t.title}`);break;}
 case 'addTask': s.tasks.push({id:uid('TASK'),title:str(a.title,'Task'),group:'Custom',done:false});log('Added launch task');break;
 case 'product': {const v=pick(s,a.id);v.price=num(a.price,'Selling price',1);v.cost=num(a.cost,'Unit cost',1);v.reorder=num(a.reorder,'Low-stock point',0,10000);log(`Updated pricing: ${v.id}`);break;}
 case 'addProduct': {check(s.variants.length<500,'Product limit reached.');const id=str(a.id,'SKU',50).toUpperCase();check(!s.variants.some(v=>v.id===id),'This SKU already exists.');s.variants.push({id,style:str(a.style,'Style',50),gender:str(a.gender,'Fit',20),colour:str(a.colour,'Colour',30),size:str(a.size,'Size',10),price:num(a.price,'Selling price',1),cost:num(a.cost,'Unit cost',1),reorder:num(a.reorder,'Low-stock point',0,10000)});log(`Added product: ${id}`);break;}
 case 'adjust': {pick(s,a.sku);num(a.qty,'Stock change',-10000,10000);check(a.qty!==0,'Enter a non-zero quantity.');check(stock(s,a.sku).available+a.qty>=0,'This change would use stock reserved for orders.');s.movements.push({id:uid('MOV'),sku:a.sku,qty:a.qty,kind:'Adjustment',date,note:str(a.note,'Reason')});log(`Stock adjusted: ${a.sku} (${a.qty})`);break;}
 case 'order': {
  check(s.orders.length<2000,'Order limit reached.');check(Array.isArray(a.items)&&a.items.length>0&&a.items.length<=20,'Add between 1 and 20 order lines.');check(new Set(a.items.map(i=>i.sku)).size===a.items.length,'Combine repeated products into one line.');
  const items=a.items.map(i=>{const v=pick(s,i.sku);const qty=num(i.qty,'Quantity',1,1000);check(stock(s,v.id).available>=qty,`Not enough available stock for ${v.id}.`);return {sku:v.id,qty,price:num(i.price,'Unit price',1),cost:v.cost};});
  check(['Instagram','WhatsApp','Website','Other'].includes(a.channel),'Choose a channel.');check(['Prepaid','COD'].includes(a.paymentMode),'Choose a payment method.');check(!a.campaignId||s.campaigns.some(c=>c.id===a.campaignId),'Choose a valid campaign.');
  check(!a.relatedOrderId||s.orders.some(o=>o.id===a.relatedOrderId),'Choose a valid related order.');
  const o={relatedOrderId:a.relatedOrderId||'',id:uid('KV'),name:str(a.name,'Customer name',80),city:str(a.city,'City',60),channel:a.channel,paymentMode:a.paymentMode,campaignId:a.campaignId||'',items,shippingCharged:num(a.shippingCharged,'Customer shipping'),shippingCost:0,packagingCost:num(a.packagingCost,'Packaging cost'),feeBps:num(a.feeBps,'Fee rate',0,5000),date,status:'Confirmed',courier:'',tracking:''};s.orders.unshift(o);log(`Confirmed ${o.id} and reserved stock`);break;}
 case 'pack': {const o=order(s,a.id);check(o.status==='Confirmed','Only confirmed orders can be packed.');o.status='Packed';log(`Packed ${o.id}`);break;}
 case 'ship': {const o=order(s,a.id);check(o.status==='Packed','Pack this order before dispatch.');check(o.paymentMode==='COD'||paid(s,o.id)>=total(o),'Record full payment before sending a prepaid order.');o.courier=str(a.courier,'Courier',60);o.tracking=str(a.tracking,'Tracking reference',100);o.shippingCost=num(a.shippingCost,'Shipping cost');o.status='Shipped';for(const i of o.items){check(stock(s,i.sku).onHand>=i.qty,'Insufficient physical stock.');s.movements.push({id:uid('MOV'),sku:i.sku,qty:-i.qty,kind:'Dispatch',date,note:o.id});}log(`Dispatched ${o.id}`);break;}
 case 'deliver': {const o=order(s,a.id);check(o.status==='Shipped','Only shipped orders can be delivered.');o.status='Delivered';log(`Marked ${o.id} delivered`);break;}
 case 'cancel': {const o=order(s,a.id);check(['Confirmed','Packed'].includes(o.status),'Only unsent orders can be cancelled.');o.status='Cancelled';log(`Cancelled ${o.id} and released stock`);break;}
 case 'payment': {const o=order(s,a.id);check(o.status!=='Cancelled','Cannot collect payment on a cancelled order.');const amount=num(a.amount,'Payment',1);check(amount<=due(s,o),'Payment is higher than the amount due.');s.payments.unshift({id:uid('PAY'),orderId:o.id,amount,type:'Payment',date,note:str(a.note,'Payment reference')});log(`Recorded payment for ${o.id}`);break;}
 case 'refund': {const o=order(s,a.id);const amount=num(a.amount,'Refund',1);check(amount<=paid(s,o.id),'Refund exceeds recorded money held.');check(amount<=refundLimit(s,o)-refunds(s,o.id),'Refund exceeds returned items or cancelled order value.');s.payments.unshift({id:uid('REF'),orderId:o.id,amount,type:'Refund',date,note:str(a.note,'Refund reference')});log(`Recorded refund for ${o.id}`);break;}
 case 'return': {const o=order(s,a.id);check(dispatched(o),'Returns require a shipped or delivered order.');const i=o.items.find(i=>i.sku===a.sku);check(i,'Choose a product from this order.');const qty=num(a.qty,'Return quantity',1,1000);check(qty<=i.qty-returned(s,o.id,i.sku),'Return exceeds the quantity still eligible.');check(typeof a.restock==='boolean','Choose whether the item can be resold.');const r={id:uid('RET'),date,orderId:o.id,sku:i.sku,qty,cost:i.cost,value:qty*i.price,restock:a.restock,note:str(a.note,'Return reason')};s.returns.unshift(r);if(r.restock)s.movements.push({id:uid('MOV'),sku:r.sku,qty,kind:'Return',date,note:o.id});log(`Recorded return for ${o.id}${r.restock?' and restocked items':''}`);break;}
 case 'supplier': s.suppliers.push({id:uid('SUP'),name:str(a.name,'Supplier name',80),contact:str(a.contact,'Contact or location',100)});log('Added supplier');break;
 case 'purchase': {check(s.suppliers.some(v=>v.id===a.supplierId),'Choose a supplier.');pick(s,a.sku);const qty=num(a.qty,'Quantity',1,10000),cost=num(a.cost,'Unit cost',1);const advance=num(a.paid,'Advance');check(advance<=qty*cost,'Advance exceeds purchase total.');check(typeof a.expected==='string' && /^\d{4}-\d{2}-\d{2}$/.test(a.expected) && Number.isFinite(Date.parse(a.expected+'T00:00:00Z')) && new Date(a.expected+'T00:00:00Z').toISOString().slice(0,10)===a.expected,'Enter a valid expected date.');s.purchases.unshift({id:uid('PO'),supplierId:a.supplierId,date,expected:a.expected,status:'Ordered',items:[{sku:a.sku,qty,cost}],paid:advance});log('Created purchase order');break;}
 case 'receive': {const p=s.purchases.find(p=>p.id===a.id);check(p&&p.status==='Ordered','Only open purchases can be received.');p.status='Received';for(const i of p.items)s.movements.push({id:uid('MOV'),sku:i.sku,qty:i.qty,kind:'Purchase received',date,note:p.id});log(`Received ${p.id}`);break;}
 case 'supplierPayment': {const p=s.purchases.find(p=>p.id===a.id);check(p,'Purchase not found.');const amount=num(a.amount,'Supplier payment',1);check(p.paid+amount<=p.items.reduce((t,i)=>t+i.qty*i.cost,0),'Payment exceeds purchase balance.');p.paid+=amount;log(`Recorded supplier payment for ${p.id}`);break;}
 case 'expense': {check(['Sampling','Marketing','Tools','Rent','Other'].includes(a.category),'Choose a category.');s.expenses.unshift({id:uid('EXP'),date,category:a.category,amount:num(a.amount,'Expense amount',1),note:str(a.note,'Description')});log('Added operating expense');break;}
 case 'campaign': {check(s.campaigns.length<100,'Campaign limit reached.');s.campaigns.push({id:uid('CMP'),name:str(a.name,'Campaign name',80),channel:str(a.channel,'Channel',40),budget:num(a.budget,'Budget'),spent:0,impressions:0,clicks:0});log('Added campaign plan');break;}
 case 'campaignResults': {const c=s.campaigns.find(c=>c.id===a.id);check(c,'Campaign not found.');c.spent=num(a.spent,'Spend');c.impressions=num(a.impressions,'Impressions',0,1000000000);c.clicks=num(a.clicks,'Clicks',0,1000000000);check(c.clicks<=c.impressions,'Clicks cannot exceed impressions.');log(`Updated manual results: ${c.name}`);break;}
 default: throw new Error('Action not supported.');
 }
 s.activity=s.activity.slice(0,200);check(new TextEncoder().encode(JSON.stringify(s)).length<1000000,'Workspace is full. Export a backup before starting a new workspace.');return s;
}
