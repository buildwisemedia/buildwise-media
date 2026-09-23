import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../public/scripts/bob-tracking.js',import.meta.url),'utf8');
// Pass the same local store and cookie jar to a second run to model a later visit on the same device.
const memory=()=>{const m=new Map();return {m,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))};};
function cookieJar(){const jar=new Map();return {jar,get cookie(){return [...jar].map(([n,c])=>`${n}=${c.value}`).join('; ');},set cookie(line){const [pair,...attrs]=String(line).split('; ');const i=pair.indexOf('=');jar.set(pair.slice(0,i),{value:pair.slice(i+1),attrs});}};}
function run({host='buildwisemedia.com',dnt='0',gpc=false,query='',referrer='',local=memory(),session=memory(),cookies=cookieJar()}={}){
 const timers=[],intervals=[],scripts=[],listeners={},docListeners=[];let rewritten='';
 const location={hostname:host,origin:'https://'+host,pathname:'/contact/',href:'https://'+host+'/contact/'+query,hash:''};
 const window={addEventListener:(k,f)=>listeners[k]=f};
 const document={referrer,documentElement:{scrollHeight:1000},head:{appendChild:s=>scripts.push(s)},querySelectorAll:()=>[],addEventListener:(k,f,capture)=>docListeners.push({k,f,capture:capture===true}),createElement:()=>({listeners:{},addEventListener(k,f){this.listeners[k]=f}})};
 Object.defineProperty(document,'cookie',{get:()=>cookies.cookie,set:v=>{cookies.cookie=v;}});
 const c={window,document,location,navigator:{doNotTrack:dnt,globalPrivacyControl:gpc},history:{state:null,replaceState:(_,__,u)=>rewritten=u},sessionStorage:session,localStorage:local,URL,Set,Map,Date,setTimeout:f=>{timers.push(f)},setInterval:f=>{intervals.push(f);return 1},clearInterval(){},innerHeight:500,scrollY:0};
 vm.runInNewContext(code,c);
 const click=target=>docListeners.filter(l=>l.k==='click').sort((a,b)=>b.capture-a.capture).forEach(l=>l.f({target}));
 return {c,window,timers,intervals,scripts,local,session,cookies,docListeners,click,get rewritten(){return rewritten}};
}
const anchor=(href,{source,classes=[]}={})=>({href:new URL(href,'https://buildwisemedia.com/contact/').href,classList:{contains:c=>classes.includes(c)},getAttribute:k=>k==='href'?href:k==='data-cta-source'?(source??null):null,closest(sel){return sel==='a[href]'?this:null;}});
const pushed=(x,name)=>Array.from(x.window.dataLayer||[]).filter(e=>e&&e.event===name);
const cookieValue=x=>JSON.parse(decodeURIComponent(x.cookies.jar.get('_bwm_attribution').value));
// The intake Worker rejects the whole request if the attribution snapshot carries any other key.
const WORKER_FIELDS=new Set(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','fbc','fbp','referrer','landing_page','page_url','experiment_id','experiment_variant_id']);
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

test('CTA clicks carry the brand CTA source from data-cta-source',()=>{
 const x=run();
 x.click(anchor('/contact?job=website',{source:'three-layer-website-cta',classes:['button']}));
 x.click(anchor('/#work',{classes:['header-cta']}));
 x.click(anchor('/contact',{source:'Bad Value!',classes:['button']}));
 x.click(anchor('/contact',{source:'final-primary'}));
 x.click(anchor('/privacy'));
 const clicks=pushed(x,'cta_click');
 assert.deepEqual(clicks.map(e=>e.cta_source),['three-layer-website-cta','unspecified',undefined,'final-primary']);
 assert.equal(clicks[0].link_path,'/contact');
});

test('phone and email clicks send only redacted details (Spec-Attribution-JS v2.10)',()=>{
 const x=run({referrer:'https://www.google.com/search?q=private'});
 assert.ok(x.docListeners.some(l=>l.k==='click'&&l.capture),'capture-phase listener');
 x.click(anchor('tel:+14786063370'));
 x.click(anchor('mailto:Hello@BuildwiseMedia.com?subject=Hi'));
 const [phone]=pushed(x,'phone_click'),[email]=pushed(x,'email_click');
 assert.equal(phone.phone_number_redacted,'3370');
 assert.equal(email.email_domain,'buildwisemedia.com');
 for(const e of [phone,email]){assert.equal(e.page_path,'/contact/');assert.equal(e.page_referrer,'https://www.google.com');}
 const all=JSON.stringify(x.window.dataLayer);
 for(const secret of ['4786063370','Hello@','subject','private'])assert.equal(all.includes(secret),false,secret);
 assert.equal(pushed(x,'cta_click').length,0);
});

test('a campaign visit is kept 30 days in the _bwm_attribution cookie and reaches a later direct lead',()=>{
 const local=memory(),cookies=cookieJar();
 const first=run({local,cookies,query:'?utm_source=google&utm_medium=cpc&utm_campaign=bob&gclid=Abc_123'});
 const saved=cookies.jar.get('_bwm_attribution');
 assert.ok(saved,'cookie set');
 for(const attr of ['path=/','max-age=2592000','SameSite=Lax','Secure'])assert.ok(saved.attrs.includes(attr),attr);
 const value=cookieValue(first);
 assert.equal(value.utm_source,'google');assert.equal(value.utm_campaign,'bob');assert.equal(value.gclid,'Abc_123');
 assert.equal(value.first_touch_utm_source,'google');assert.equal(value.attribution_provenance,'bob_tracking_v1');
 // A later direct visit in a new session on the same device.
 const later=run({local,cookies});
 const details=later.window.__bobSourceDetails();
 assert.equal(details.utm_source,'google');assert.equal(details.utm_medium,'cpc');assert.equal(details.gclid,'Abc_123');
 assert.deepEqual(Object.keys(details).filter(k=>!WORKER_FIELDS.has(k)),[]);
 // GA4 keeps its own cross-session attribution; the direct session is not relabelled as a campaign.
 assert.equal(later.window.dataLayer.find(a=>a[0]==='config')[2].campaign_source,undefined);
 // A new campaign replaces the saved one as a whole set; the first touch stays in the cookie.
 const next=run({local,cookies,query:'?utm_source=newsletter'});
 const d2=next.window.__bobSourceDetails();
 assert.equal(d2.utm_source,'newsletter');assert.equal(d2.utm_medium,undefined);assert.equal(d2.gclid,undefined);
 const v2=cookieValue(next);assert.equal(v2.utm_source,'newsletter');assert.equal(v2.first_touch_utm_source,'google');
});

// public/bob/site.js forwards UTM tags, not click IDs, onto internal links.
test('ad click IDs survive internal links that carry the same campaign tags',()=>{
 const local=memory(),session=memory(),cookies=cookieJar();
 run({local,session,cookies,query:'?utm_source=google&utm_medium=cpc&gclid=Click123&fbclid=Fb_9'});
 const inner=run({local,session,cookies,query:'?utm_source=google&utm_medium=cpc'});
 const d=inner.window.__bobSourceDetails();
 assert.equal(d.gclid,'Click123');assert.equal(d.fbclid,'Fb_9');assert.equal(d.utm_source,'google');
 assert.equal(cookieValue(inner).gclid,'Click123');
 // With session storage blocked, the saved 30-day record still keeps them.
 const fresh=run({local,cookies,query:'?utm_source=google&utm_medium=cpc'});
 assert.equal(fresh.window.__bobSourceDetails().gclid,'Click123');
 // A genuinely new campaign still replaces the whole set, click IDs included.
 const other=run({local,session,cookies,query:'?utm_source=google&utm_medium=email'});
 const o=other.window.__bobSourceDetails();
 assert.equal(o.gclid,undefined);assert.equal(o.fbclid,undefined);assert.equal(cookieValue(other).gclid,'');
});

test('a newer campaign saved by the older site pages wins over the tab campaign',()=>{
 const local=memory(),session=memory(),cookies=cookieJar();
 run({local,session,cookies,query:'?utm_source=google&utm_medium=cpc&gclid=OldClick'});
 // An older BaseLayout page in the same tab saves campaign B as the latest touch.
 const rec=JSON.parse(local.getItem('_bwm_attribution'));
 rec.last_touch={ts:new Date().toISOString(),utm:{utm_source:'facebook',utm_medium:'paid',fbclid:'FbB'}};
 local.setItem('_bwm_attribution',JSON.stringify(rec));
 const d=run({local,session,cookies}).window.__bobSourceDetails();
 assert.equal(d.utm_source,'facebook');assert.equal(d.fbclid,'FbB');assert.equal(d.gclid,undefined);assert.equal(d.utm_medium,'paid');
});

test('click IDs restored on a tagged return visit reach later untagged pages',()=>{
 const local=memory(),cookies=cookieJar();
 run({local,cookies,query:'?utm_source=google&utm_medium=cpc&gclid=Keep1'});
 const session=memory();
 run({local,session,cookies,query:'?utm_source=google&utm_medium=cpc'});
 const d=run({local,session,cookies}).window.__bobSourceDetails();
 assert.equal(d.gclid,'Keep1');assert.equal(d.utm_source,'google');
});

test('saved campaigns older than 30 days are not restored or renewed',()=>{
 const local=memory(),cookies=cookieJar(),ago=n=>new Date(Date.now()-n*86400000).toISOString();
 local.setItem('_bwm_attribution',JSON.stringify({first_touch:{ts:ago(84),utm:{utm_source:'google',gclid:'Old1'}},last_touch:{ts:ago(84),utm:{utm_source:'google',gclid:'Old1'}}}));
 const x=run({local,cookies,query:'?utm_source=google'});
 const d=x.window.__bobSourceDetails();
 assert.equal(d.utm_source,'google');assert.equal(d.gclid,undefined);
 local.setItem('_bwm_attribution',JSON.stringify({first_touch:{ts:ago(84),utm:{utm_source:'google',gclid:'Old1'}},last_touch:{ts:ago(31),utm:{utm_source:'bing'}}}));
 const z=run({local,cookies});
 assert.equal(z.window.__bobSourceDetails().utm_source,undefined);assert.equal(cookieValue(z).utm_source,'');assert.equal(cookieValue(z).gclid,'');
 // A dated touch inside the window still counts.
 local.setItem('_bwm_attribution',JSON.stringify({first_touch:{ts:ago(84),utm:{}},last_touch:{ts:ago(29),utm:{utm_source:'bing',gclid:'New2'}}}));
 assert.equal(run({local,cookies}).window.__bobSourceDetails().gclid,'New2');
});

test('a newer saved click ID with the same tags beats the tab copy',()=>{
 const local=memory(),session=memory(),cookies=cookieJar();
 run({local,session,cookies,query:'?utm_source=google&utm_medium=cpc&gclid=TabA'});
 const rec=JSON.parse(local.getItem('_bwm_attribution'));
 rec.last_touch={ts:new Date().toISOString(),utm:{utm_source:'google',utm_medium:'cpc',gclid:'SavedB'}};
 local.setItem('_bwm_attribution',JSON.stringify(rec));
 const x=run({local,session,cookies,query:'?utm_source=google&utm_medium=cpc'});
 assert.equal(x.window.__bobSourceDetails().gclid,'SavedB');
 assert.equal(JSON.parse(local.getItem('_bwm_attribution')).last_touch.utm.gclid,'SavedB');
});

test('a direct tab keeps its restored lead campaign after an older page clears last_touch',()=>{
 const local=memory(),session=memory(),cookies=cookieJar(),ago=n=>new Date(Date.now()-n*86400000).toISOString();
 local.setItem('_bwm_attribution',JSON.stringify({first_touch:{ts:ago(10),utm:{utm_source:'linkedin'}},last_touch:{ts:ago(2),utm:{utm_source:'google',gclid:'B1'}}}));
 const first=run({local,session,cookies});
 assert.equal(first.window.__bobSourceDetails().utm_source,'google');
 assert.equal(first.window.dataLayer.find(a=>a[0]==='config')[2].campaign_source,undefined);
 // An untagged BaseLayout page rewrites last_touch with no tags.
 const rec=JSON.parse(local.getItem('_bwm_attribution'));rec.last_touch={ts:new Date().toISOString(),utm:{}};local.setItem('_bwm_attribution',JSON.stringify(rec));
 const back=run({local,session,cookies});
 const d=back.window.__bobSourceDetails();
 assert.equal(d.utm_source,'google');assert.equal(d.gclid,'B1');
 assert.equal(back.window.dataLayer.find(a=>a[0]==='config')[2].campaign_source,undefined);
});

test('the held lead campaign expires with its source touch',()=>{
 const local=memory(),session=memory(),cookies=cookieJar(),ago=n=>new Date(Date.now()-n*86400000).toISOString();
 local.setItem('_bwm_attribution',JSON.stringify({first_touch:{ts:ago(40),utm:{}},last_touch:{ts:ago(29),utm:{utm_source:'google',gclid:'Day29'}}}));
 assert.equal(run({local,session,cookies}).window.__bobSourceDetails().gclid,'Day29');
 const held=JSON.parse(session.getItem('bob_lead_campaign'));assert.equal(held.utm.gclid,'Day29');
 // Two days later the same tab reloads: the source touch is now 31 days old.
 held.ts=ago(31);session.setItem('bob_lead_campaign',JSON.stringify(held));
 const rec=JSON.parse(local.getItem('_bwm_attribution'));rec.last_touch.ts=ago(31);local.setItem('_bwm_attribution',JSON.stringify(rec));
 const later=run({local,session,cookies});
 assert.equal(later.window.__bobSourceDetails().gclid,undefined);assert.equal(cookieValue(later).gclid,'');
});

test('an expired tab campaign does not restore its click IDs',()=>{
 const local=memory(),session=memory(),cookies=cookieJar(),ago=n=>new Date(Date.now()-n*86400000).toISOString();
 run({local,session,cookies,query:'?utm_source=google&utm_medium=cpc&gclid=Tab31'});
 const tab=JSON.parse(session.getItem('bob_tab_campaign'));assert.equal(tab.utm.gclid,'Tab31');
 tab.ts=ago(31);session.setItem('bob_tab_campaign',JSON.stringify(tab));
 const rec=JSON.parse(local.getItem('_bwm_attribution'));rec.last_touch.ts=ago(31);local.setItem('_bwm_attribution',JSON.stringify(rec));
 const x=run({local,session,cookies,query:'?utm_source=google&utm_medium=cpc'});
 assert.equal(x.window.__bobSourceDetails().gclid,undefined);
 assert.equal(JSON.parse(local.getItem('_bwm_attribution')).last_touch.utm.gclid,undefined);
});

test('a full local store still restores the saved campaign',()=>{
 const ago=n=>new Date(Date.now()-n*86400000).toISOString(),m=memory();
 m.setItem('_bwm_attribution',JSON.stringify({first_touch:{ts:ago(5),utm:{}},last_touch:{ts:ago(2),utm:{utm_source:'google',gclid:'Kept'}}}));
 const full={getItem:m.getItem,setItem:()=>{throw new Error('QuotaExceededError');}};
 const d=run({local:full}).window.__bobSourceDetails();
 assert.equal(d.utm_source,'google');assert.equal(d.gclid,'Kept');
});

test('a first touch saved by the older site pages survives an empty last touch',()=>{
 const local=memory();
 const day=86400000,ago=n=>new Date(Date.now()-n*day).toISOString();
 local.setItem('_bwm_attribution',JSON.stringify({first_touch:{ts:ago(3),utm:{utm_source:'linkedin',utm_medium:'social',utm_campaign:'owners'}},last_touch:{ts:ago(2),utm:{}}}));
 const x=run({local});
 const details=x.window.__bobSourceDetails();
 assert.equal(details.utm_source,'linkedin');assert.equal(details.utm_campaign,'owners');
});

test('privacy signals and test hosts store no attribution and send no click events',()=>{
 for(const settings of [{host:'branch.buildwise-media.pages.dev'},{dnt:'1'},{gpc:true}]){
  const local=memory(),session=memory(),cookies=cookieJar();
  const x=run({...settings,local,session,cookies,query:'?utm_source=google'});
  assert.equal(cookies.jar.size,0);assert.equal(local.m.size,0);assert.equal(session.m.size,0);
  x.click(anchor('tel:+14786063370'));x.click(anchor('/contact',{source:'hero-primary',classes:['button']}));
  assert.equal(x.window.dataLayer,undefined);
 }
});
