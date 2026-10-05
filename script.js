'use strict';
// Fictional local demo only: browser persistence, no external submission or analytics.
const formatter = new Intl.NumberFormat('en-US');
const money = value => `${formatter.format(value)} VND`;
let services = QueenDemo.read().services;
let savedBookingId=null;
let preferredTreatment='oil';
const pitchMode=new URLSearchParams(location.search).get('mode')==='pitch';document.body.dataset.mode=pitchMode?'pitch':'demo';document.documentElement.dataset.mode=document.body.dataset.mode;
function sampleDetails(){document.querySelector('#book-name').value='Demo Guest Preview';document.querySelector('#book-email').value='preview@example.com';if(pitchMode){document.querySelector('#book-name').readOnly=true;document.querySelector('#book-email').readOnly=true;}}

document.querySelectorAll('.treatment-choice select').forEach(select => {
  select.addEventListener('change', () => {
    const key=select.id.split('-')[0];preferredTreatment=key;
    select.closest('.treatment-choice').querySelector('.price span').textContent = formatter.format(services[key].options.find(p=>p[0]===Number(select.value))[1]);
    if(timeEdit!=='all'&&Number(select.value)!==Number(timeEdit)){timeEdit='all';updateTimeEdit();}
  });
});
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu(returnFocus = false) {
  toggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('open');
  toggle.querySelector('span').textContent = '＋';
  if (returnFocus) toggle.focus();
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
  toggle.querySelector('span').textContent = open ? '−' : '＋';
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  closeMenu();
  const target = document.querySelector(link.getAttribute('href'));
  target.setAttribute('tabindex', '-1');
  target.focus({preventScroll:true});
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
window.matchMedia('(min-width: 1024px)').addEventListener('change', () => closeMenu());

const dialog = document.querySelector('#booking');
const form = document.querySelector('#booking-form');
const treatment = document.querySelector('#book-treatment');
const duration = document.querySelector('#book-duration');
const guests = document.querySelector('#book-guests');
const next = document.querySelector('#booking-next');
const back = document.querySelector('#booking-back');
const progress = document.querySelector('.booking-progress');
let step = 0;
let invoker = null;
let scrollPosition = 0;
let savedScrollBehavior = '';

function daNangNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
  return {date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};
}
function selectedOption() {
  return services[treatment.value].options.find(([minutes])=>minutes===Number(duration.value));
}
function refreshDurations(minutes) {
  duration.replaceChildren(...services[treatment.value].options.map(([value])=>QueenI18n.option(`${value} minutes`,String(value))));
  if (services[treatment.value].options.some(([value])=>value===Number(minutes))) duration.value = String(minutes);
  updateOrder();
}
function updateOrder() {
  const service = services[treatment.value];
  const [minutes,price] = selectedOption();
  const count = Number(guests.value);
  document.querySelector('#order-treatment').textContent = service.name;protectCopy(document.querySelector('#order-treatment'),service.name);
  document.querySelector('#order-party').textContent = `${minutes} minutes · ${count} ${count===1?'guest':'guests'}`;
  document.querySelector('#order-unit').textContent = money(price);
  document.querySelector('#order-total').textContent = money(price*count);
  const image = document.querySelector('#booking-photo');
  image.src = service.image;
  image.alt = imageDescriptions[service.image]?.alt || 'Uploaded demo image · premises not verified';
}
function clearErrors() {
  form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
  form.querySelectorAll('.field-error').forEach(el=>{el.textContent='';});
}
function error(id,message) {
  const input = document.getElementById(id);
  input.setAttribute('aria-invalid','true');
  document.getElementById(`${id}-error`).textContent = message;
  return input;
}
function validate() {
  clearErrors();
  let first = null;
  const report = (id,message) => {const input=error(id,message);if(!first)first=input;};
  if (step===0) {
    const now = daNangNow();
    const date = document.querySelector('#book-date');
    const time = document.querySelector('#book-time');
    date.min = now.date;
    if (!date.value || !date.validity.valid) report('book-date','Choose a valid date today or later.');
    else if (date.value < now.date) report('book-date','Choose today or a future date.');
    if (!time.value) report('book-time','Choose your preferred time.');
    else if (!time.validity.valid) report('book-time','Choose a time in 15-minute increments.');
    else if (date.value===now.date && time.value<=now.time) report('book-time','Choose a later time today or a future date.');
  }
  if (step===1) {
    const name = document.querySelector('#book-name');
    const email = document.querySelector('#book-email');
    const phone = document.querySelector('#book-phone');
    name.value = name.value.trim(); email.value=email.value.trim(); phone.value=phone.value.trim();
    if (!/^Demo\b/i.test(name.value) || name.value.length>80) report('book-name','Use a fictional name beginning with Demo.');
    if (!email.value || !email.validity.valid || !/^[^\s@]+@example\.(com|net|org)$/i.test(email.value)) report('book-email','Use a fictional example.com email.');
    if (phone.value && (!/^[+\d()\s.\-]+$/.test(phone.value) || phone.value.replace(/\D/g,'').length<7 || phone.value.replace(/\D/g,'').length>15)) report('book-phone','Use a phone number with 7–15 digits, including your country code.');
  }
  if (step===2 && !pitchMode && !document.querySelector('#book-ack').checked) report('book-ack','Please confirm the sample request before saving.');
  if (first) {first.focus();if(first.scrollIntoView)first.scrollIntoView({block:'center',behavior:'instant'});}
  return !first;
}
function updateSummary() {
  const [minutes,price] = selectedOption();
  const count = Number(guests.value);
  const rawDate = document.querySelector('#book-date').value;
  const [year,month,day] = rawDate.split('-').map(Number);
  const dateText = rawDate;
  const values = {
    treatment: services[treatment.value].name,
    party:`${minutes} minutes · ${count} ${count===1?'guest':'guests'}`,
    date: dateText,
    time: `${document.querySelector('#book-time').value} · Da Nang (GMT+7)`,
    name:document.querySelector('#book-name').value,
    email:document.querySelector('#book-email').value,
    phone:document.querySelector('#book-phone').value || 'Not provided',
    total:money(price*count)
  };
  document.querySelectorAll('[data-summary]').forEach(el=>{el.textContent=values[el.dataset.summary];if(el.dataset.summary==='treatment')protectCopy(el,el.textContent);});
}
function showStep(value,focus=true) {
  step=value;dialog.dataset.step=String(value);
  form.querySelectorAll('.booking-step').forEach(el=>{el.hidden=Number(el.dataset.step)!==step;});
  if(focus) gentleReveal(form.querySelector('.booking-step:not([hidden])')); 
  progress.querySelectorAll('li').forEach(el=>{
    if (Number(el.dataset.progress)===Math.min(step,2)) el.setAttribute('aria-current','step');
    else el.removeAttribute('aria-current');
  });
  progress.classList.toggle('final-mode',step===3);
  back.hidden=step===0 || step===3;
  back.textContent=step===3?'Edit request':'Back';
  const labels=pitchMode?['Continue','Review request','Save request','Done']:['Continue','Review request','Save request','View saved request'];
  next.replaceChildren(document.createTextNode(labels[step]+' '));
  if(step<3){const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='→';next.append(arrow);}
  if(step>=2)updateSummary();
  clearErrors();
  document.querySelector('.booking-content').scrollTop=0;
  if(focus) form.querySelector(`.booking-step[data-step="${step}"] .step-title`).focus({preventScroll:true});
}
function closeBooking() {
  if(!dialog.open)return;
  dialog.close();
  restorePage();
}
function restorePage() {
  if (!document.body.classList.contains('booking-open')) return;
  document.body.classList.remove('booking-open');
  document.body.style.top='';
  window.scrollTo({top:scrollPosition,behavior:'instant'});
  document.documentElement.style.scrollBehavior=savedScrollBehavior;
  form.reset();
  document.querySelectorAll('[data-summary]').forEach(el=>{el.textContent='';});
  clearErrors();
  if(invoker?.isConnected)invoker.focus({preventScroll:true});
  invoker=null;
}
dialog.addEventListener('close',()=>{if(!dialog.open)restorePage();});
dialog.addEventListener('cancel',event=>{event.preventDefault();closeBooking();});
document.querySelector('.close-booking').addEventListener('click',closeBooking);
document.querySelectorAll('[data-book]').forEach(button=>button.addEventListener('click',()=>{
  if(dialog.open)return;
  closeMenu();
  invoker=button;
  scrollPosition=window.scrollY;
  savedScrollBehavior=document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior='auto';
  form.reset();
  sampleDetails();
  const eligible=Object.keys(services).filter(key=>timeEdit==='all'||services[key].options.some(([m])=>String(m)===timeEdit));
  const key=button.dataset.book || (eligible.includes(preferredTreatment)?preferredTreatment:eligible[0]);
  preferredTreatment=key;
  treatment.value=key;
  let minutes=services[key].options[0][0];
  const cardSelect=document.querySelector(`#${key}-time`);
  if(cardSelect) minutes=Number(cardSelect.value);
  refreshDurations(minutes);
  document.querySelector('#book-date').min=daNangNow().date;
  document.body.style.top=`-${scrollPosition}px`;
  document.body.classList.add('booking-open');
  showStep(0,false);
  dialog.showModal();
  form.querySelector('[data-step="0"] .step-title').focus({preventScroll:true});
}));
treatment.addEventListener('change',()=>{refreshDurations(timeEdit==='all'?undefined:Number(timeEdit));syncBookingChoice();});
duration.addEventListener('change',()=>{updateOrder();syncBookingChoice();});
guests.addEventListener('change',updateOrder);
form.addEventListener('input',event=>{
  if(event.target.id!=='book-ack')document.querySelector('#book-ack').checked=false;
  if(event.target.id && document.getElementById(event.target.id+'-error')){
    event.target.removeAttribute('aria-invalid');
    document.getElementById(event.target.id+'-error').textContent='';
  }
});
form.addEventListener('submit',event=>{
  event.preventDefault();
  if(step===3){viewSavedRequest();return;}
  if(!validate())return;
  if(step===2){try{savedBookingId=QueenDemo.addBooking({serviceKey:treatment.value,duration:Number(duration.value),guests:Number(guests.value),date:document.querySelector('#book-date').value,time:document.querySelector('#book-time').value,name:document.querySelector('#book-name').value,email:document.querySelector('#book-email').value,phone:'',source:'customer'});showStep(3);document.querySelector('#demo-receipt').textContent=savedBookingId+' · saved in this browser';renderCustomer();}catch(e){document.querySelector('#booking-save-error').textContent=e.message;}return;}
  showStep(step+1);
});
back.addEventListener('click',()=>showStep(step===3?2:step-1));
document.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',()=>showStep(Number(button.dataset.edit))));
// Keep Tab and Shift+Tab within the active modal, including browser edge cases.
dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const controls=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length>0 && !el.hidden);
  const first=controls[0], last=controls[controls.length-1];
  if(!first){event.preventDefault();return;}
  if(event.shiftKey && (document.activeElement===first || !dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
  else if(!event.shiftKey && (document.activeElement===last || !dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
});

document.querySelector('#use-sample').addEventListener('click',()=>{sampleDetails();});
function knownCopy(text){return Boolean(QueenMessages[text]||Object.values(QueenMessages).some(values=>Object.values(values).includes(text)));}
function protectCopy(el,text){el.toggleAttribute('data-user-content',!knownCopy(text));}
function lines(el,text){el.toggleAttribute('data-user-content',!String(text).split('\n').every(knownCopy));el.replaceChildren();String(text).split('\n').forEach((line,i)=>{if(i)el.append(document.createElement('br'));if(el.id==='hero-title'){const span=document.createElement('span');span.className='headline-line';span.textContent=line;el.append(span);}else el.append(document.createTextNode(line));});}
const saved=document.createElement('section');saved.className='wrap saved-bookings';saved.id='demo-bookings';document.querySelector('#visit').before(saved);
const photoNodes=[document.querySelector('.hero-art img'),...document.querySelectorAll('.space img')];
const photoDefaults=new Map(photoNodes.map(n=>[n,{src:n.getAttribute('src'),srcset:n.getAttribute('srcset'),sizes:n.getAttribute('sizes'),alt:n.getAttribute('alt'),caption:n.closest('figure')?.querySelector('figcaption')?.textContent}]));
const imageDescriptions={
 'assets/queen-massage-room.webp':{alt:'Queen Spa treatment room with Egyptian-inspired wall art and two linen-covered massage beds',caption:'Inside Queen Spa · Son Tra, Da Nang'},
 'assets/queen-interior.webp':{alt:"Queen Spa's Egyptian-themed treatment room with a central wall painting and two massage beds",caption:'The treatment rooms'},
 'assets/queen-treatment-room.webp':{alt:'Queen Spa interior with decorated columns, Egyptian motifs and prepared massage beds',caption:'A closer look at the details'},
 'assets/natural-oil.webp':{alt:'Hands performing the natural oil body massage shown on Queen Spa’s service page',caption:'Natural oil · Queen Spa service photograph'},
 'assets/bamboo-lotion.webp':{alt:'Bamboo body massage with bamboo tools shown on Queen Spa’s service page',caption:'Bamboo · Queen Spa service photograph'},
 'assets/hot-stone.webp':{alt:'Hot stones used for a back massage in Queen Spa’s treatment photograph',caption:'Hot stone · Queen Spa service photograph'}
};
function renderPhoto(node,path){const original=photoDefaults.get(node);const caption=node.closest('figure')?.querySelector('figcaption');if(node.getAttribute('src')!==path)node.src=path;
 if(original&&path===original.src){if(original.srcset)node.setAttribute('srcset',original.srcset);else node.removeAttribute('srcset');if(original.sizes)node.setAttribute('sizes',original.sizes);node.alt=original.alt;if(caption)caption.textContent=original.caption;return;}
 const detail=imageDescriptions[path];if(detail){node.alt=detail.alt;if(caption)caption.textContent=detail.caption;if(['assets/queen-massage-room.webp','assets/queen-interior.webp','assets/queen-treatment-room.webp'].includes(path)){node.setAttribute('srcset',path.replace('.webp','-800.webp')+' 800w, '+path+' 1349w');node.setAttribute('sizes',original?.sizes||'(max-width:600px) 100vw, 50vw');}else node.removeAttribute('srcset');}
 else{node.removeAttribute('srcset');node.alt='Uploaded demo image · premises not verified';if(caption)caption.textContent='Uploaded demo image · premises not verified';}
}
function renderCustomer(){const state=QueenDemo.read();const lang=QueenI18n.locale;services=Object.fromEntries(Object.entries(state.services).map(([key,service])=>[key,{...service,...service.localeCopies?.[lang]}]));const content={...state.content,...state.content.localeCopies?.[lang]};
lines(document.querySelector('#hero-title'),content.title);lines(document.querySelector('.intro'),content.intro);lines(document.querySelector('[data-address]'),content.address);document.querySelector('[data-hours]').textContent=content.hours;
['heroImage','galleryOne','galleryTwo'].forEach((key,i)=>{if(photoNodes[i])renderPhoto(photoNodes[i],state.content[key]);});
for(const [key,service] of Object.entries(services)){const select=document.querySelector('#'+key+'-time');const card=select.closest('article');const old=Number(select.value);card.querySelector('h3').textContent=service.name;protectCopy(card.querySelector('h3'),service.name);card.querySelector('h3 + p').textContent=service.description;protectCopy(card.querySelector('h3 + p'),service.description);renderPhoto(card.querySelector('img'),service.image);select.replaceChildren(...service.options.map(([m])=>QueenI18n.option(m+' minutes',String(m))));if(service.options.some(p=>p[0]===old))select.value=String(old);card.querySelector('.price span').textContent=formatter.format(service.options.find(p=>p[0]===Number(select.value))[1]);const list=card.querySelector('.price-menu ul');list.replaceChildren(...service.options.map(([m,p])=>{const li=document.createElement('li');li.textContent=m+' min — '+money(p);return li;}));}
const oldKey=treatment.value,oldMinutes=duration.value;treatment.replaceChildren(...Object.entries(services).map(([k,v])=>QueenI18n.option(v.name,k)));treatment.value=oldKey;refreshDurations(oldMinutes);if(dialog.open&&step===2){updateSummary();document.querySelector('#book-ack').checked=false;}
renderMenuPriceSummary(services);renderContactLinks(state.content.contact||{});
const err=document.querySelector('#customer-store-error');err.hidden=!QueenDemo.problem;err.textContent=QueenDemo.problem;
saved.replaceChildren();const heading=document.createElement('h2');heading.textContent='Your sample requests';const note=document.createElement('p');note.textContent='Sample requests saved in this browser. Status updates appear here automatically. No real appointment is reserved.';saved.append(heading,note);
const rows=state.bookings.filter(b=>b.source==='customer');saved.hidden=!rows.length;
rows.forEach(b=>{const row=document.createElement('article');row.className='saved-row';row.dataset.bookingId=b.id;row.tabIndex=-1;const title=document.createElement('strong');const bookingName=b.serviceNameCopies?.[QueenI18n.locale]?.name||b.serviceName;title.textContent=b.id+' · '+bookingName;title.toggleAttribute('data-user-content',!knownCopy(bookingName));const detail=document.createElement('p');detail.textContent=b.date+' · '+b.time+' GMT+7 · '+b.duration+' min · '+b.guests+' '+(b.guests===1?'guest':'guests')+' · '+money(b.unitPrice*b.guests);const status=document.createElement('span');status.className='status '+b.status;status.textContent=b.status;row.append(title,detail,status);saved.append(row);});
if(savedBookingId){const b=state.bookings.find(b=>b.id===savedBookingId);if(b&&step===3){const values={treatment:b.serviceNameCopies?.[QueenI18n.locale]?.name||b.serviceName,party:b.duration+' minutes · '+b.guests+' '+(b.guests===1?'guest':'guests'),date:b.date,time:b.time+' · Da Nang (GMT+7)',name:b.name,email:b.email,phone:'Disabled in demo',total:money(b.unitPrice*b.guests)};document.querySelectorAll('[data-summary]').forEach(n=>{n.textContent=values[n.dataset.summary];if(n.dataset.summary==='treatment')protectCopy(n,n.textContent);});}document.querySelector('#customer-status').textContent=b?'Current demo status: '+b.status+' · '+b.date+' '+b.time+' GMT+7':'This booking was removed by a demo reset.';if(pitchMode){const copy=pitchCopy[b?b.status:'cancelled']||pitchCopy.pending;document.querySelector('.final-status [data-copy=pitch]').textContent=copy[0];document.querySelector('.booking-step[data-step="3"] .step-intro [data-copy=pitch]').textContent=copy[1];}}
}
QueenDemo.subscribe(renderCustomer);renderCustomer();

document.addEventListener('queen-locale-change',()=>{const ack=document.querySelector('#book-ack').checked;renderCustomer();document.querySelector('#book-ack').checked=ack;});

// A time-led comparison: filters the real menu, never implies available appointments.
let timeEdit='all';
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function gentleReveal(node){if(!node||reducedMotion.matches||!node.animate)return;node.getAnimations().forEach(a=>a.cancel());node.animate([{opacity:.35,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)'});}
function updateTimeEdit(animate=false){
 const buttons=[...document.querySelectorAll('[data-time-edit]')];
 const available=new Set(Object.values(services).flatMap(v=>v.options.map(p=>String(p[0]))));
 if(timeEdit!=='all'&&!available.has(timeEdit))timeEdit='all';
 buttons.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.timeEdit===timeEdit));b.disabled=b.dataset.timeEdit!=='all'&&!available.has(b.dataset.timeEdit);});
 const eligible=Object.keys(services).filter(key=>timeEdit==='all'||services[key].options.some(([m])=>String(m)===timeEdit));
 if(!eligible.includes(preferredTreatment))preferredTreatment=eligible[0];
 let count=0;
 document.querySelectorAll('.treatment[data-treatment]').forEach(card=>{const key=card.dataset.treatment;const match=timeEdit==='all'||services[key].options.some(p=>String(p[0])===timeEdit);card.hidden=!match;if(match){count++;if(timeEdit!=='all'){const select=card.querySelector('select');select.value=timeEdit;card.querySelector('.price span').textContent=formatter.format(services[key].options.find(([m])=>String(m)===timeEdit)[1]);}if(animate)gentleReveal(card);}});
 document.querySelector('.treatment-list').dataset.visible=String(count);
 const status=document.querySelector('#time-edit-status');status.replaceChildren(document.createTextNode(timeEdit==='all'?'Compare every ritual below.':'Treatments shown at your chosen duration.'));
 if(timeEdit!=='all'){const measure=document.createElement('span');measure.setAttribute('translate','no');measure.textContent=' '+QueenI18n.number(Number(timeEdit))+' '+QueenI18n.t('min')+' · '+QueenI18n.number(count)+' / '+QueenI18n.number(Object.keys(services).length);status.append(measure);}

}
document.querySelector('.time-edit').hidden=false;
document.querySelectorAll('[data-time-edit]').forEach(button=>button.addEventListener('click',()=>{timeEdit=button.dataset.timeEdit;updateTimeEdit(true);}));
QueenDemo.subscribe(()=>updateTimeEdit());document.addEventListener('queen-locale-change',()=>updateTimeEdit());

function syncBookingChoice(){
 preferredTreatment=treatment.value;
 const cardSelect=document.querySelector('#'+preferredTreatment+'-time');cardSelect.value=duration.value;
 cardSelect.closest('.treatment-choice').querySelector('.price span').textContent=formatter.format(selectedOption()[1]);
 if(timeEdit!=='all'&&String(duration.value)!==timeEdit){timeEdit='all';updateTimeEdit();}
}
// Both presentation modes show browser-only sample status, never merchant confirmation.
const pitchCopy={"pending": ["SAMPLE SAVED · NOT SENT", "This is a browser-only sample. Nothing was sent to Queen Spa. No appointment is reserved."], "confirmed": ["SAMPLE STATUS · CONFIRMED", "This is a browser-only sample. Nothing was sent to Queen Spa. No appointment is reserved."], "rescheduled": ["SAMPLE STATUS · RESCHEDULED", "This is a browser-only sample. Nothing was sent to Queen Spa. No appointment is reserved."], "cancelled": ["SAMPLE STATUS · CANCELLED", "This is a browser-only sample. Nothing was sent to Queen Spa. No appointment is reserved."], "completed": ["SAMPLE STATUS · COMPLETED", "This is a browser-only sample. Nothing was sent to Queen Spa. No appointment is reserved."]};
function viewSavedRequest(){
 const id=savedBookingId;closeBooking();
 const target=[...saved.querySelectorAll('[data-booking-id]')].find(row=>row.dataset.bookingId===id);
 if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:'instant'});}
}

// Both price surfaces consume one current-menu calculation through stable hooks.
function renderMenuPriceSummary(menu){
 const options=Object.values(menu).flatMap(service=>service.options);
 const minimum=Math.min(...options.map(([,price])=>price));
 const formatted=QueenI18n.locale==='en'?money(minimum):QueenI18n.money(minimum);
 document.querySelectorAll('[data-menu-minimum]').forEach(node=>{node.textContent=formatted;node.dataset.minimumPrice=String(minimum);});
 const minutes=options.map(([duration])=>duration);
 document.querySelectorAll('[data-menu-duration-range]').forEach(node=>{node.textContent=QueenI18n.number(Math.min(...minutes))+'–'+QueenI18n.number(Math.max(...minutes))+' '+QueenI18n.t('minutes');});
}

// Contact channels come from the merchant store; an empty field renders no button at all.
function contactItems(contact){const digits=v=>String(v||'').replace(/\D/g,'');const tel=v=>'tel:'+(String(v).trim().startsWith('+')?'+':'')+digits(v);const items=[];
 if(/^https:\/\//.test(contact.mapsUrl||''))items.push({label:'Get directions',href:contact.mapsUrl,newTab:true,mark:'↗',primary:true});
 if(digits(contact.phone).length>=7)items.push({label:'Call',href:tel(contact.phone),newTab:false,mark:'↗'});
 if(digits(contact.whatsapp).length>=7)items.push({label:'WhatsApp',href:'https://wa.me/'+digits(contact.whatsapp),newTab:true,mark:'↗'});
 if(digits(contact.zalo).length>=7)items.push({label:'Zalo',href:'https://zalo.me/'+digits(contact.zalo),newTab:true,mark:'↗'});
 return items;}
function contactLink(item,cls){const a=document.createElement('a');a.className=cls;a.href=item.href;if(item.newTab){a.target='_blank';a.rel='noopener noreferrer';}a.append(document.createTextNode(item.label+' '));const mark=document.createElement('span');mark.setAttribute('aria-hidden','true');mark.textContent=item.mark;a.append(mark);return a;}
function renderContactLinks(contact){const items=contactItems(contact);
 const directions=document.querySelector('[data-map-directions]');if(directions&&/^https:\/\//.test(contact.mapsUrl||''))directions.href=contact.mapsUrl;
 const visit=document.querySelector('[data-contact-links]');if(visit){const rows=items.filter(i=>!i.primary);visit.replaceChildren(...rows.map(i=>contactLink(i,'contact-link')));visit.hidden=!rows.length;}
 const final=document.querySelector('[data-final-actions]');if(final){final.replaceChildren(...items.map(i=>contactLink(i,i.primary?'button':'secondary-button')));final.hidden=!items.length;}}

// Quiet entrances: reveal once, never re-animate, and respect reduced motion (no-JS stays visible via CSS).
(()=>{const nodes=[...document.querySelectorAll('[data-reveal]')];const show=n=>n.classList.add('is-visible');
 if(!('IntersectionObserver' in window)||reducedMotion.matches){nodes.forEach(show);return;}
 const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){show(e.target);io.unobserve(e.target);}});},{rootMargin:'0px 0px -10% 0px',threshold:.1});nodes.forEach(n=>io.observe(n));
 reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)nodes.forEach(show);});})();

// Compact sticky header once the hero scrolls away (desktop widths only; see styles.css).
(()=>{const header=document.querySelector('.header');let ticking=false;const update=()=>{header.classList.toggle('is-scrolled',window.scrollY>48);ticking=false;};window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});update();})();

// The Google Maps embed (about 2 MB of third-party transfer) loads only once Find us approaches the viewport.
(()=>{const map=document.querySelector('.google-map[data-src]');if(!map)return;const load=()=>{if(!map.src)map.src=map.dataset.src;};
 if(!('IntersectionObserver' in window)){load();return;}
 const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){load();io.disconnect();}},{rootMargin:'200px 0px'});io.observe(map);})();
