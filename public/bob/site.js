'use strict';
(() => {
 const views=[
  ['An inquiry arrives after hours.','An inquiry arrives after hours. The lead system keeps the contact details and language together.'],
  ['The reply sets the right expectation.','The reply uses the family’s language and sets a next-business-day callback. The inquiry stays visible on the board.'],
  ['A callback is planned.','A 2:00 PM call is confirmed for the next business day. The team can see the planned callback on the board.']
 ];
 const frames=[{id:'inquiry-demo',type:'bob-demo-ready',status:'inquiry-status'},{id:'service-demo',type:'bob-service-ready',status:'service-status'}].map(x=>({...x,frame:document.getElementById(x.id),note:document.getElementById(x.status),ready:false})).filter(x=>x.frame);
 const inquiry=frames.find(x=>x.id==='inquiry-demo');
 const back=document.getElementById('demo-back'),next=document.getElementById('demo-next');
 let step=0;
 function send(){if(inquiry)inquiry.frame.contentWindow?.postMessage({type:'bob-demo-step',index:step},'*');}
 function show(index){
  step=index;document.getElementById('demo-step').textContent=`Step ${step+1} of 3`;
  document.getElementById('demo-announcement').textContent=`Step ${step+1} of 3. ${views[step][1]}`;
  document.getElementById('demo-heading').textContent=views[step][0];document.getElementById('demo-caption').textContent=views[step][1];
  back.disabled=step===0;next.textContent=step===2?'Start again':'Next';document.getElementById('demo-result').hidden=step!==2;
  send();if(document.activeElement===back&&back.disabled)next.focus();
 }
 if(inquiry&&back&&next){back.addEventListener('click',()=>{if(step>0)show(step-1)});next.addEventListener('click',()=>show(step===2?0:step+1));inquiry.frame.addEventListener('load',send);show(0);}
 window.addEventListener('message',event=>{
  const item=frames.find(x=>event.source===x.frame.contentWindow&&event.data?.type===x.type);if(!item)return;
  const h=Number(event.data.height);if(!Number.isFinite(h)||h<120||h>5000)return;
  item.frame.style.height=`${Math.ceil(h)}px`;item.ready=true;if(item.note)item.note.hidden=true;
 });
 for(const item of frames){
  let started=false;
  const slow=()=>{if(!item.ready&&item.note){item.note.textContent=item.id==='inquiry-demo'?'The example is taking a while to load. Open “Read the three-step summary” below for the steps and a full-size view.':'The example is taking a while to load. The main points are above. Use “Open the example at full size” below for the full view.';item.note.hidden=false;}};
  const start=()=>{if(!started){started=true;setTimeout(slow,12000)}};
  item.frame.addEventListener('load',start,{once:true});
  if(item.id==='inquiry-demo'||!('IntersectionObserver' in window))start();
  else {const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){start();observer.disconnect()}},{rootMargin:'300px'});observer.observe(item.frame);}
 }
})();

// The chosen interest stays in its own form field, separate from the editable note.
(() => {
 const jobs = {
  leads: { label: 'lead follow-up', note: 'I would like help keeping inquiries and follow-ups moving. Here is what happens now: ' },
  service: { label: 'service work', note: 'I would like help keeping service cases, owners and customer updates together. Here is what happens now: ' },
  'connected-data': { label: 'connected business data', note: 'I would like a clearer view across our business tools. The question I want to answer is: ' },
  website: { label: 'your website', note: 'I would like our website to work well for people and the AI tools they use. Here is what we need it to do: ' },
  meetings: { label: 'meeting follow-up', note: 'I would like help turning calls into clear tasks and decisions. Here is what happens now: ' },
  content: { label: 'content drafts', note: 'I would like to turn one set of facts into useful content drafts. The work we repeat is: ' },
  knowledge: { label: 'company knowledge', note: 'I would like our team to find answers in our approved documents. The questions that keep coming up are: ' }
 };
 const choices = document.querySelector('.job-choice-controls');
 const status = document.getElementById('chosen-job-status');
 const link = document.getElementById('chosen-job-link');
 if (choices && status && link) {
  for (const button of choices.querySelectorAll('button[data-job]')) {
   button.addEventListener('click', () => {
    const job = button.dataset.job;
    if (!Object.prototype.hasOwnProperty.call(jobs, job)) return;
    const selected = button.getAttribute('aria-pressed') !== 'true';
    for (const option of choices.querySelectorAll('button[data-job]')) option.setAttribute('aria-pressed', String(selected && option === button));
    const url = new URL(link.href, location.href);
    if (selected) url.searchParams.set('job', job);
    else url.searchParams.delete('job');
    link.href = url.href;
    status.textContent = selected ? `Start with ${jobs[job].label}. The next page has a starter note you can change.` : 'Have a different job in mind? Tell us about it.';
    link.textContent = selected ? 'Talk About This Job' : 'Talk About Your First Job';
   });
  }
  choices.hidden = false;
 }
 const incomingJob = new URL(location.href).searchParams.get('job');
 const note = document.querySelector('form[data-kind="fit"] textarea[name="bottleneck"]');
 const interest = note?.form.elements.namedItem('selected_interest');
 if (interest && !interest.value && Object.prototype.hasOwnProperty.call(jobs, incomingJob)) interest.value = incomingJob;
 const job = interest ? interest.value : incomingJob;
 const help = document.getElementById('request-help');
 if (note && Object.prototype.hasOwnProperty.call(jobs, job)) {
  if (!note.value) note.value = jobs[job].note;
  const starter = jobs[job].note.trim();
  if (help && note.value.trim() === starter) help.textContent = 'A starter note is filled in. Change it to fit your business. Leave out private customer details.';
  const validateNote = () => note.setCustomValidity(note.value.trim() === starter ? 'Add a few words about your work, or write your own note.' : '');
  note.addEventListener('input', validateNote);
  note.addEventListener('change', validateNote);
  note.form.addEventListener('submit', validateNote, true);
  validateNote();
 }
})();

(() => {
 const allowed=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
 const incoming=new URL(location.href).searchParams;
 for(const a of document.querySelectorAll('a[href]')){
  if(a.getAttribute('href').startsWith('#'))continue;
  const url=new URL(a.getAttribute('href'),location.href);
  const sameSite=location.protocol==='file:'?url.protocol==='file:':url.origin===location.origin;
  if(!['file:','https:','http:'].includes(url.protocol)||!sameSite||!/^\/(?:contact|speaking|luncheon|privacy|terms)?\/?$/.test(url.pathname))continue;
  for(const k of allowed){const v=incoming.get(k);if(v&&!url.searchParams.has(k))url.searchParams.set(k,v.slice(0,160));}
  a.href=url.href;
 }
})();
