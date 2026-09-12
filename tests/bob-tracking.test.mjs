import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../public/scripts/bob-tracking.js',import.meta.url),'utf8');
function run({host='buildwisemedia.com',dnt='0',gpc=false,query=''}={}){
 const timers=[],intervals=[],scripts=[],listeners={};let rewritten='';
 const location={hostname:host,origin:'https://'+host,pathname:'/contact/',href:'https://'+host+'/contact/'+query,hash:''};
 const store=new Map();const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
 const window={addEventListener:(k,f)=>listeners[k]=f};
 const document={referrer:'',cookie:'',documentElement:{scrollHeight:1000},head:{appendChild:s=>scripts.push(s)},querySelectorAll:()=>[],addEventListener(){},createElement:()=>({listeners:{},addEventListener(k,f){this.listeners[k]=f}})};
 const c={window,document,location,navigator:{doNotTrack:dnt,globalPrivacyControl:gpc},history:{state:null,replaceState:(_,__,u)=>rewritten=u},sessionStorage:storage,localStorage:storage,URL,Set,Map,Date,setTimeout:f=>{timers.push(f)},setInterval:f=>{intervals.push(f);return 1},clearInterval(){},innerHeight:500,scrollY:0};
 vm.runInNewContext(code,c);return {c,window,timers,intervals,scripts,get rewritten(){return rewritten}};
}
test('test hosts and privacy signals do not queue or load vendors',()=>{
 for(const settings of [{host:'branch.buildwise-media.pages.dev'},{dnt:'1'},{gpc:true}]){const x=run(settings);assert.equal(x.window.dataLayer,undefined);assert.equal(x.scripts.length,0);assert.equal(x.timers.length,0);assert.equal(x.window['ga-disable-G-V5LSP69E41'],true);}
});
test('one GA4 loader precedes GTM; no direct duplicate Clarity or Meta loader',()=>{
 const x=run();x.timers[0]();assert.equal(x.scripts.length,1);assert.match(x.scripts[0].src,/gtag\/js\?id=G-V5LSP69E41$/);x.scripts[0].listeners.load();x.scripts[0].listeners.error();assert.equal(x.scripts.length,2);assert.match(x.scripts[1].src,/gtm.js\?id=GTM-P5JSD86L$/);
});
test('campaign attribution remains while private query fields stay out of GA4 and rewritten URL',()=>{
 const x=run({query:'?utm_source=owners&utm_medium=email&utm_campaign=talk&email=private%40example.com&note=secret&job=knowledge'});
 const config=x.window.dataLayer.find(a=>a[0]==='config')[2];assert.equal(config.campaign_source,'owners');assert.equal(config.campaign_medium,'email');assert.equal(config.campaign_name,'talk');assert.match(config.page_location,/^https:\/\/buildwisemedia.com\/contact\//);assert.equal(config.page_location.includes('private'),false);assert.equal(config.page_referrer,'');assert.equal(x.rewritten.includes('private'),false);assert.equal(x.rewritten.includes('secret'),false);assert.match(x.rewritten,/job=knowledge/);
});
test('conversion events buffer until GA4 is ready and omit form text',()=>{
 const x=run();x.window.__bwmTrackEvent('generate_lead',{selected_interest:'knowledge',work_email:'private@example.com',bottleneck:'secret'});assert.equal(x.window.dataLayer.some(a=>a[0]==='event'),false);x.timers[0]();x.window.google_tag_manager={'G-V5LSP69E41':{}};x.intervals[0]();const sent=x.window.dataLayer.find(a=>a[0]==='event');assert.equal(sent[1],'generate_lead');assert.equal(sent[2].selected_interest,'knowledge');assert.equal(JSON.stringify(x.window.dataLayer).includes('private'),false);assert.equal(JSON.stringify(x.window.dataLayer).includes('secret'),false);
});

test('Google Ads click IDs survive the sanitized GA4 page URL',()=>{
 const x=run({query:'?gclid=TestClick.123&utm_source=google&email=private%40example.com'});const config=x.window.dataLayer.find(a=>a[0]==='config')[2];assert.match(config.page_location,/gclid=TestClick.123/);assert.equal(config.page_location.includes('email'),false);assert.equal(x.window.__bobSourceDetails().gclid,'TestClick.123');
});
