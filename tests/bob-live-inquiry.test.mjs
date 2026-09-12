import test from 'node:test';
import assert from 'node:assert/strict';
import {initInquiry} from '../public/scripts/bob-inquiry.js';

function setup(kind='fit') {
  const handlers={},fields=Object.fromEntries(Object.entries({contact_name:'A test',work_email:'test@example.invalid',company:'Test',company_url:'',bottleneck:'I changed my note.',selected_interest:'knowledge'}).map(([k,value])=>[k,{value}]));
  fields.contact_permission={checked:true};
  const button={textContent:'Send your note',disabled:true}, status={hidden:true,focus(){}}, success={hidden:true,focus(){}};
  const panel={querySelector:s=>s==='[data-inquiry-status]'?status:success};
  const form={dataset:{kind},elements:fields,hidden:false,valid:true,closest:()=>panel,querySelector:()=>button,reportValidity(){return this.valid;},addEventListener:(k,f)=>{handlers[k]=f},setAttribute(){},removeAttribute(){}};
  globalThis.location={hostname:'buildwisemedia.com',href:'https://buildwisemedia.com/contact/?job=knowledge'};
  globalThis.document={referrer:''};const events=[];
  globalThis.window={__bwmTrackEvent:(...x)=>events.push(x)};
  const payloads=[];let response={ok:true,body:{ok:true,captured:true,emailed:true,receipt_recorded:true}};
  globalThis.fetch=async(_,o)=>{payloads.push(JSON.parse(o.body));return {ok:response.ok,json:async()=>response.body}};
  initInquiry(form);
  return {form,fields,button,status,success,events,payloads,setResponse:x=>response=x,submit:()=>handlers.submit({preventDefault(){}})};
}
test('interest is delivered separately from edited message; success events use the receipt UUID',async()=>{
 const x=setup();await x.submit();assert.equal(x.payloads[0].selected_interest,'knowledge');assert.equal(x.payloads[0].request_kind,'fit');assert.equal(x.payloads[0].bottleneck,'I changed my note.');
 assert.equal(x.form.hidden,true);assert.equal(x.success.hidden,false);assert.equal(x.events.length,2);assert.equal(x.events[1][0],'generate_lead');assert.equal(x.events[1][1].submission_id,x.payloads[0].submission_id);
 assert.equal(JSON.stringify(x.events).includes('test@example.invalid'),false);
});
test('partial delivery keeps the form and retries with the same ID; changed interest gets a new ID',async()=>{
 const x=setup();x.setResponse({ok:true,body:{ok:true,captured:true,emailed:false,receipt_recorded:false}});await x.submit();assert.equal(x.success.hidden,true);assert.equal(x.form.hidden,false);assert.equal(x.events.some(e=>e[0]==='generate_lead'),false);await x.submit();assert.deepEqual(x.payloads[1],x.payloads[0]);x.fields.selected_interest.value='website';await x.submit();assert.notEqual(x.payloads[2].submission_id,x.payloads[0].submission_id);
});
test('luncheon optional note has a truthful fallback and its own kind',async()=>{
 const x=setup('luncheon');x.fields.bottleneck.value='';await x.submit();assert.equal(x.payloads[0].request_kind,'luncheon');assert.equal(Object.hasOwn(x.payloads[0],'selected_interest'),false);assert.match(x.payloads[0].bottleneck,/Luncheon interest:/);
});
test('native validation failure never posts',async()=>{const x=setup();x.form.valid=false;await x.submit();assert.equal(x.payloads.length,0);});

test('success reports the saved interest even if the select changes while sending',async()=>{
 const x=setup();globalThis.fetch=async(_,o)=>{x.fields.selected_interest.value='website';return {ok:true,json:async()=>({ok:true,captured:true,emailed:true,receipt_recorded:true})}};await x.submit();assert.equal(x.events.find(e=>e[0]==='generate_lead')[1].selected_interest,'knowledge');
});
