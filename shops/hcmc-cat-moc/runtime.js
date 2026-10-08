'use strict';
(()=>{
if (!window.PreviewLoadGate || !window.PreviewLoadGate.canStart()) { window.PreviewLoadGate?.fail('data-or-dependency-unavailable'); return; }
document.documentElement.classList.add('js');
const D=window.ShopData,lang=document.documentElement.lang,admin=document.body.dataset.surface==='admin';
/*map-photos-v1*/const SHOP_PHOTOS=D.photos||[];D.branches.forEach(b=>{if(!(b.photos&&b.photos.length))b.photos=SHOP_PHOTOS;});
const prefix=`spa100:${D.id}:v1:`,key=prefix+'state',draftKey=prefix+'booking-draft';
const t=k=>D.ui[k]?.[lang]||D.ui[k]?.en||k;
/*prices-v1*/
const PX={from:{en:'From ',vi:'Từ ','zh-Hant':'',ko:''},fromSuffix:{en:'',vi:'','zh-Hant':' 起',ko:'부터'},min:{en:' min',vi:' phút','zh-Hant':' 分鐘',ko:'분'},
 sample:{en:'Sample demo: all content, including prices, is example data based on the official website. Please confirm with the spa before visiting.',vi:'Bản mẫu: mọi nội dung, kể cả giá, đều là dữ liệu ví dụ dựa trên website chính thức. Vui lòng xác nhận với spa trước khi đến.','zh-Hant':'示範網站：所有內容（含價格）皆為範例資料，參考自官方網站；到訪前請向店家確認。',ko:'샘플 데모: 가격을 포함한 모든 내용은 공식 웹사이트를 참고한 예시 데이터입니다. 방문 전 스파에 확인해 주세요.'},
 sampleShort:{en:'Example prices · sample data',vi:'Giá ví dụ · dữ liệu mẫu','zh-Hant':'價格為範例・資料皆為範例',ko:'예시 가격 · 샘플 데이터'}};
const px=k=>PX[k][lang]??PX[k].en;
const hasPrices=()=>D.services.some(s=>s.price!=null);
function money(s){const n=Number(s.price);return s.currency==='USD'?'US$'+n.toLocaleString('en-US'):n.toLocaleString(lang==='vi'?'vi-VN':'en-US')+' ₫';}
function priceText(s){if(!s||s.price==null)return t('price');const m=money(s);return (s.kind==='from'?px('from')+m+px('fromSuffix'):m)+(s.durationMin?' · '+s.durationMin+px('min'):'');}
const sp=i=>D.services[i]?.price!=null?' ('+priceText(D.services[i])+')':'';

const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
let requested=new URL(location.href).searchParams.get('branch');
try{requested ||= localStorage.getItem(prefix+'selected-branch');}catch(e){}
let B=D.branches.find(b=>b.id===requested)||D.branches.find(b=>b.id===D.defaultBranch)||D.branches[0];
D.services=B.services;D.photos=B.photos;
const empty=()=>({version:1,shopId:D.id,bookings:[],edits:{},photos:{},branchEdits:{},branchPhotos:{}});
const edits=x=>x.branchEdits[B.id]??(x.branchEdits[B.id]={});
const photos=(x,branchId=B.id)=>x.branchPhotos[branchId]??(x.branchPhotos[branchId]={});
const pendingUploads=new Map();
const uploadKey=(branchId,slot)=>branchId+':'+slot;
const photoVersion=(x,branchId,slot)=>x.photoVersions?.[branchId]?.[slot]||0;
function bumpPhotoVersion(x,branchId,slot){x.photoVersions??={};x.photoVersions[branchId]??={};x.photoVersions[branchId][slot]=photoVersion(x,branchId,slot)+1;}
function cancelUploads(branchId,slot=null){let cancelled=false;for(const [key,job] of pendingUploads){if(job.branchId===branchId&&(slot===null||job.slot===String(slot))){pendingUploads.delete(key);cancelled=true;}}return cancelled;}
function renderPhotos(){
 for(const container of all('[data-photo-slot]')){
  const slot=Number(container.dataset.photoSlot),value=photos(state)[slot],source=B.photos[Math.min(slot,B.photos.length-1)];
  let photo=source?{src:source.local,width:source.width,height:source.height}:null;
  if(value&&(B.photos.some(p=>p.local===value.src)||(/^data:image\/(jpeg|png|webp);base64,/.test(value.src)&&value.src.length<1500000)))photo=value;
  const caption=container.closest('figure')?.querySelector('figcaption');if(caption)caption.textContent=photo?.uploaded?t('uploadedPhoto'):photo?t('photoCaption'):t('missingPhoto');
  if(photo){const focus=B.photos.find(p=>p.local===photo.src)?.heroPosition||'50% 50%';container.style.setProperty('--hero-position',focus);if(container.querySelector('img')?.getAttribute('src')===photo.src)continue;const im=new Image();im.src=photo.src;im.alt=photo.uploaded?t('uploadedPhoto'):t('photoCaption')+' · '+B.name;im.width=photo.width||900;im.height=photo.height||600;container.replaceChildren(im);}
  else{const missing=document.createElement('div');missing.className='scene-missing';const name=document.createElement('p');name.className='scene-name';name.textContent=B.name;const note=document.createElement('p');note.textContent=t('missingPhoto');missing.append(name,note);container.replaceChildren(missing);}
 }
}
let state=empty(),storageOK=true;
function problem(){storageOK=false;const el=$('#store-error');el.hidden=false;el.textContent=t('storageError');}
function read(){try{const raw=localStorage.getItem(key);state=raw?JSON.parse(raw):empty();if(state.shopId!==D.id||state.version!==1||!Array.isArray(state.bookings)||!state.edits)throw Error();state.photos??={};state.branchEdits??=D.branches.length===1?{[D.defaultBranch]:state.edits}:{};state.branchPhotos??=D.branches.length===1?{[D.defaultBranch]:state.photos}:{};storageOK=true;}catch(e){state=empty();problem();}return state;}
function save(fn){if(!storageOK)throw Error(t('storageError'));read();if(!storageOK)throw Error(t('storageError'));const next=structuredClone(state);fn(next);try{localStorage.setItem(key,JSON.stringify(next));state=next;}catch(e){problem();throw Error(t('storageError'));}render();}
function label(i){return edits(state)[lang]?.services?.[i]||D.services[i].labels[lang];}
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function headline(){return edits(state)[lang]?.headline||D.headline[lang];}
function render(){
 all('[data-service]').forEach(el=>{el.textContent=label(Number(el.dataset.service));});
 if($('#hero-title'))$('#hero-title').textContent=headline();
 all('[data-intro]').forEach(e=>e.textContent=B.serviceScope==='unverified'?t('branchMenuMissing'):D.services.slice(0,2).map((s,i)=>label(i)).join(' · '));
 renderBranch();
 renderPhotos();
 if(!admin&&$('#booking')?.open)updateSummaries();
 if(admin){renderRequests();all('[data-select-photo]').forEach(select=>{select.querySelector('option[value=uploaded]')?.remove();const current=photos(state)[select.dataset.selectPhoto];if(current?.uploaded){const option=new Option(t('uploadedPhoto'),'uploaded');option.disabled=true;select.add(option);select.value='uploaded';}else{const i=B.photos.findIndex(p=>p.local===current?.src);select.value=i>=0?String(i):'original';}});}
}
read();
renderServices();
try{localStorage.setItem(prefix+(admin?'admin':'customer')+'-locale',lang);}catch(e){}
window.addEventListener('storage',e=>{if(e.key===key){read();render();}});
function navigateLocale(code){
 if(!(admin?['en','vi']:['en','vi','zh-Hant','ko']).includes(code))return;
 if(!admin&&$('#booking')?.open)persistDraft();
 if(admin){try{sessionStorage.setItem(prefix+'editor-draft:'+B.id+':'+lang,JSON.stringify({headline:$('#edit-headline').value,services:all('[data-edit-service]').map(e=>e.value)}));}catch(e){}}
 location.href=(admin?'admin':'index')+(code==='en'?'':'.'+code)+'.html?branch='+encodeURIComponent(B.id);
}
all('[data-locale]').forEach(el=>el.addEventListener('change',()=>navigateLocale(el.value)));
document.addEventListener('preview-locale-request',e=>navigateLocale(e.detail));

if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}));all('[data-reveal]').forEach(e=>observer.observe(e));}else all('[data-reveal]').forEach(e=>e.classList.add('is-visible'));
let step=0,opener=null,openerService=null,bookingId=null;
const dialog=$('#booking');
function draft(){return {branchId:B.id,step,service:$('#book-treatment').value,date:$('#book-date').value,time:$('#book-time').value,guests:$('#book-guests').value,bookingId};}
function persistDraft(){try{sessionStorage.setItem(draftKey,JSON.stringify(draft()));}catch(e){}}
function summary(){
 if(step===3){
  const saved=state.bookings.find(b=>b.id===bookingId);
  if(!saved)return t('savedRequestMissing');
  const branch=saved.branchSnapshot?`${saved.branchSnapshot.name} · ${saved.branchSnapshot.address}`:t('branchSnapshotUnknown');
  return `${branch} · ${saved.serviceLabels?.[lang]||saved.serviceName}${sp(Number($('#book-treatment').value))} · ${saved.guests} · ${saved.date} · ${saved.time} (GMT+7)`;
 }
 const s=draft();return `${B.name} · ${B.address} · ${label(Number(s.service))}${sp(Number(s.service))} · ${s.guests} · ${s.date} · ${s.time} (GMT+7)`;
}
function updateSummaries(){const text=summary();$('#review-summary').textContent=text;$('#final-summary').textContent=text;}
function showStep(n){step=n;dialog.dataset.step=String(n);all('.booking-step').forEach(e=>e.hidden=Number(e.dataset.step)!==n);all('[data-progress]').forEach(e=>{e.removeAttribute('aria-current');if(Number(e.dataset.progress)===n)e.setAttribute('aria-current','step');});$('#booking-back').hidden=n===0||n===3;$('#booking-next').textContent=t(n===2?'save':n===3?'done':'next');updateSummaries();$('#step-error').textContent='';$('.booking-step:not([hidden]) h3').focus();persistDraft();}
function close(){
 dialog.close();try{sessionStorage.removeItem(draftKey);}catch(e){}
 const replacement=openerService!==null?all('.treatment-list [data-book]').find(b=>b.dataset.book===openerService):null;
 for(const target of [opener,replacement,$('main>.branch-control select'),$('.hero [data-book]')]){
  if(!target?.isConnected||target.disabled||!target.getClientRects().length||getComputedStyle(target).visibility==='hidden')continue;
  target.focus();if(document.activeElement===target)break;
 }
}
if(dialog){
 $('#book-date').min=today();
 document.addEventListener('click',e=>{const b=e.target.closest('[data-book]');if(!b)return;opener=b;openerService=b.closest('.treatment-list')?b.dataset.book:null;bookingId=null;$('#book-treatment').value=b.dataset.book||'0';dialog.showModal();showStep(0);});
 $('.close-booking').addEventListener('click',close);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 $('#booking-back').addEventListener('click',()=>showStep(Math.max(0,step-1)));
 for(const event of ['input','change'])$('#booking-form').addEventListener(event,()=>{if(dialog.open)persistDraft();});
 $('#booking-form').addEventListener('submit',e=>{
  e.preventDefault();
  if(step===3){close();return;}
  if(step===0){const s=draft(),when=new Date(`${s.date}T${s.time}:00+07:00`);if(!s.date||!s.time||!Number.isFinite(+when)||+when<=Date.now()){$('#step-error').textContent=t('validation');$('#book-date').focus();return;}}
  if(step===2){try{const s=draft();bookingId=D.id+'-'+crypto.randomUUID().slice(0,8);save(x=>x.bookings.unshift({id:bookingId,shopId:D.id,branchId:B.id,branchSnapshot:{id:B.id,name:B.name,address:B.address,email:B.email,whatsapp:B.whatsapp,whatsappScope:B.whatsappScope,availability:B.availability,availabilityEvidence:B.availabilityEvidence,source:B.source},requestKind:B.availability==='confirm'?'availability_inquiry':'treatment_inquiry',service:Number(s.service),serviceLabels:Object.fromEntries(Object.entries(D.services[Number(s.service)].labels).map(([locale,value])=>[locale,edits(x)[locale]?.services?.[Number(s.service)]||value])),serviceName:label(Number(s.service)),guests:Number(s.guests),date:s.date,time:s.time,name:'Demo Guest Preview',email:'preview@example.com',price:null,status:'pending',createdAt:new Date().toISOString()}));}catch(e){$('#step-error').textContent=t('storageError');return;}}
  showStep(step+1);
 });
 try{const saved=JSON.parse(sessionStorage.getItem(draftKey)||'null');if(saved&&saved.step>=0&&saved.step<=3){if(saved.branchId&&D.branches.some(b=>b.id===saved.branchId))selectBranch(saved.branchId,false);for(const field of ['service','date','time','guests'])$(field==='service'?'#book-treatment':'#book-'+field).value=saved[field]||'';bookingId=saved.bookingId;dialog.showModal();showStep(saved.step);}}catch(e){}
}
function renderServices(){
 const list=$('.treatment-list'),options=$('#book-treatment');if(list)list.replaceChildren();if(list&&hasPrices()){let n=$('.sample-price-note');if(!n){n=document.createElement('p');n.className='sample-price-note';list.after(n);}n.textContent=px('sample');all('p').forEach(p=>{if(p.textContent.trim()===t('price')&&!p.closest('.treatment-list'))p.textContent=px('sampleShort');});}if(options)options.replaceChildren();
 D.services.forEach((service,i)=>{
  if(options){const option=new Option(label(i),String(i));option.dataset.service=String(i);options.add(option);}
  if(list){const row=document.createElement('article');row.className='treatment';const copy=document.createElement('div');copy.className='treatment-copy';const number=document.createElement('p');number.className='service-number';number.textContent=String(i+1).padStart(2,'0');const h=document.createElement('h3');h.dataset.service=i;h.textContent=label(i);const note=document.createElement('p');note.textContent=priceText(service);if(service.price!=null)note.className='treatment-price';copy.append(number,h,note);/*treatment-photos-v1*/if(service.photo){const fig=document.createElement('figure');fig.className='treatment-pic';const im=document.createElement('img');im.src=service.photo.src;im.alt=label(i);im.loading='lazy';im.decoding='async';im.width=800;im.height=600;fig.append(im);if(service.photo.kind==='stock'){const tag=document.createElement('span');tag.textContent=({vi:'Ảnh minh họa',en:'Illustrative photo','zh-Hant':'示意圖',ko:'예시 이미지'})[lang]||'Ảnh minh họa';fig.append(tag);}copy.prepend(fig);}const choice=document.createElement('div');choice.className='treatment-choice';const button=document.createElement('button');button.className='treatment-book';button.dataset.book=i;button.textContent=t('inquiry')+' →';choice.append(button);row.append(copy,choice);list.append(row);}
 });
 if(admin){
  all('[data-edit-service]').forEach(el=>el.closest('label').remove());
  D.services.forEach((service,i)=>{const labelEl=document.createElement('label');labelEl.textContent=t('treatment')+' '+(i+1);const input=document.createElement('input');input.dataset.editService=i;input.maxLength=140;input.required=true;input.value=label(i);labelEl.append(input);$('#editor').insertBefore(labelEl,$('#editor button'));});
  $('#edit-headline').value=headline();
  all('[data-select-photo]').forEach(select=>{select.replaceChildren(new Option(t('originalPhoto'),'original'));B.photos.forEach((photo,i)=>select.add(new Option(t('scene')+' '+(i+1),String(i))));const current=photos(state)[select.dataset.selectPhoto];const n=B.photos.findIndex(p=>p.local===current?.src);select.value=n>=0?String(n):'original';});
 }
}
function renderBranch(){
 all('[data-branch]').forEach(e=>e.value=B.id);
 all('[data-branch-name]').forEach(e=>e.textContent=B.name);
 all('[data-branch-address]').forEach(e=>e.textContent=B.address);
 all('[data-branch-availability]').forEach(e=>{e.textContent=B.id==='herbal-dn-luxury-201'?t('renovation'):B.availability==='confirm'?t('availabilityConfirm'):'';e.hidden=!e.textContent;});
 all('[data-branch-contacts]').forEach(el=>{el.replaceChildren();const add=(href,text)=>{if(!href)return;const a=document.createElement('a');a.className='contact-link';a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=text;el.append(a);};add(B.source,t('official'));add(B.email?'mailto:'+B.email:null,t('email'));add(B.whatsapp,'WhatsApp');});
 all('[data-branch-list-id]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.branchListId===B.id)));
}
function selectBranch(id,focusMap=true){
 const next=D.branches.find(b=>b.id===id);if(!next)return;if(next.id!==B.id&&cancelUploads(B.id)&&$('#photo-status'))$('#photo-status').textContent=t('uploadCancelled');B=next;D.services=B.services;D.photos=B.photos;renderServices();render();
 try{localStorage.setItem(prefix+'selected-branch',B.id);}catch(e){}
 const url=new URL(location.href);url.searchParams.set('branch',B.id);history.replaceState(null,'',url);
 if($('#booking')?.open){bookingId=null;showStep(0);}
 if(focusMap)window.SpaMap?.select(B.id);
}
all('[data-branch]').forEach(e=>e.addEventListener('change',()=>selectBranch(e.value)));
function setupMap(){
 const el=$('#branch-map');if(!el)return;
 const list=$('#branch-list');D.branches.forEach(b=>{const button=document.createElement('button');button.type='button';button.className='branch-list-item';button.dataset.branchListId=b.id;const name=document.createElement('strong');name.textContent=b.name;const address=document.createElement('span');address.textContent=b.address;button.append(name,address);if(!b.coordinates){const note=document.createElement('small');note.textContent=t('pinMissing');button.append(note);}button.addEventListener('click',()=>selectBranch(b.id));list.append(button);});
 document.addEventListener('preview-map-ready',initMap);
 if(window.L)initMap();
}
function initMap(){
 const el=$('#branch-map');if(!el||window.SpaMap||!window.L)return;
 $('#map-status').textContent='';
 const map=L.map(el,{scrollWheelZoom:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false}),markers=new Map(),pins=D.branches.filter(b=>b.coordinates);
 const icon=(i,selected,dx=0,dy=0)=>L.divIcon({className:'branch-pin'+(selected?' selected':''),html:String(i+1),iconSize:[32,32],iconAnchor:[16-dx,16-dy]});
 pins.forEach((b,i)=>{const popup=document.createElement('div');popup.textContent=b.name+' · '+b.address;const marker=L.marker(b.coordinates,{icon:icon(i,b.id===B.id),title:b.name,alt:b.name,keyboard:true}).addTo(map).bindPopup(popup);marker.on('click',()=>selectBranch(b.id,true));markers.set(b.id,marker);});
 let mapMode='all';const leaders=L.layerGroup().addTo(map);
 function arrange(){leaders.clearLayers();const occupied=[];pins.forEach((b,i)=>{const point=map.latLngToContainerPoint(b.coordinates);let x=point.x,y=point.y;for(let n=0;n<24&&occupied.some(p=>Math.hypot(p.x-x,p.y-y)<38);n++){const angle=n*Math.PI/4,radius=40+Math.floor(n/8)*20;x=point.x+Math.cos(angle)*radius;y=point.y+Math.sin(angle)*radius;}occupied.push({x,y});markers.get(b.id).setIcon(icon(i,b.id===B.id,x-point.x,y-point.y));if(Math.hypot(x-point.x,y-point.y)>1){L.polyline([b.coordinates,map.containerPointToLatLng([x,y])],{color:'#254c38',weight:2,interactive:false}).addTo(leaders);L.circleMarker(b.coordinates,{radius:3,color:'#254c38',fillColor:'#fff',fillOpacity:1,interactive:false}).addTo(leaders);}});}
 map.on('moveend zoomend',arrange);
 function fit(){mapMode='all';if(pins.length)map.fitBounds(L.latLngBounds(pins.map(b=>b.coordinates)),{padding:[52,52],maxZoom:16});else if(B.areaCenter)map.setView(B.areaCenter,B.areaLevel==='street'?16:13);else map.setView([16,107],5);arrange();}
 function select(id){mapMode='selected';const b=D.branches.find(v=>v.id===id);pins.forEach((p,i)=>markers.get(p.id).setIcon(icon(i,p.id===id)));if(b?.coordinates){map.setView(b.coordinates,16);markers.get(id).openPopup();arrange();}else{$('#map-status').textContent=t('pinMissing');fit();}}
 fit();$('#fit-all').addEventListener('click',fit);if(!pins.length)$('#map-status').textContent=t('pinMissing');
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
 tiles.on('tileerror',()=>{$('#map-status').textContent=t('mapUnavailable');});
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){tiles.addTo(map);observer.disconnect();}},{rootMargin:'100px'});observer.observe(el);
 new ResizeObserver(()=>{map.invalidateSize({pan:false});if(mapMode==='all')fit();else arrange();}).observe(el);
 window.SpaMap={map,markers,fit,select,pinCount:pins.length};
}
function renderRequests(){
 const list=$('#request-list');list.replaceChildren();
 if(!state.bookings.length){const p=document.createElement('p');p.textContent=t('empty');list.append(p);return;}
 for(const b of state.bookings){if($('#branch-filter')?.value&&b.branchId!==$('#branch-filter').value)continue;const row=document.createElement('article');row.className='request-row';row.dataset.bookingId=b.id;
  const h=document.createElement('h3');h.textContent=b.serviceLabels?.[lang]||b.serviceName;
  const p=document.createElement('p');p.textContent=`${b.date} · ${b.time} (GMT+7) · ${b.guests} · ${b.name}`;
  const branch=document.createElement('p');branch.className='request-branch';branch.textContent=b.branchSnapshot?`${b.branchSnapshot.name} · ${b.branchSnapshot.address}`:t('branchSnapshotUnknown');
  const id=document.createElement('small');id.textContent=b.id;
  const label=document.createElement('label');label.textContent=t('status');const select=document.createElement('select');select.setAttribute('aria-label',t('status')+' '+b.id);
  for(const status of ['pending','confirmed','cancelled','completed']){const o=new Option(t(status),status);select.add(o);}select.value=b.status;
  select.addEventListener('change',()=>{try{save(x=>{x.bookings.find(v=>v.id===b.id).status=select.value;});}catch(e){problem();}});
  label.append(select);row.append(id,h,branch,p,label);list.append(row);
 }
}
if(admin){
 $('#branch-filter').addEventListener('change',renderRequests);
 const values=edits(state)[lang]||{headline:D.headline[lang],services:D.services.map(s=>s.labels[lang])};let edit=values;
 try{edit=JSON.parse(sessionStorage.getItem(prefix+'editor-draft:'+B.id+':'+lang)||'null')||values;}catch(e){}
 $('#edit-headline').value=edit.headline;all('[data-edit-service]').forEach((e,i)=>e.value=edit.services?.[i]||D.services[i].labels[lang]);
 $('#editor').addEventListener('submit',e=>{e.preventDefault();try{save(x=>edits(x)[lang]={headline:$('#edit-headline').value.trim(),services:all('[data-edit-service]').map(e=>e.value.trim())});sessionStorage.removeItem(prefix+'editor-draft:'+B.id+':'+lang);$('#edit-status').textContent=t('edited');}catch(e){problem();}});
 $('#reset').addEventListener('click',()=>{$('#confirm-reset').hidden=false;$('#confirm-reset').focus();});
 $('#confirm-reset').addEventListener('click',()=>{try{save(x=>x.bookings=[]);$('#confirm-reset').hidden=true;}catch(e){problem();}});
 all('[data-select-photo]').forEach(select=>select.addEventListener('change',()=>{const slot=select.dataset.selectPhoto;cancelUploads(B.id,slot);try{save(x=>{bumpPhotoVersion(x,B.id,slot);if(select.value==='original')delete photos(x)[slot];else{const source=D.photos[Number(select.value)];photos(x)[slot]={src:source.local,width:source.width,height:source.height,uploaded:false};}});$('#photo-status').textContent=t('photoSaved');}catch(e){problem();}}));
 all('[data-reset-photo]').forEach(button=>button.addEventListener('click',()=>{try{const slot=button.dataset.resetPhoto;cancelUploads(B.id,slot);save(x=>{bumpPhotoVersion(x,B.id,slot);delete photos(x)[slot];});$(`[data-select-photo="${button.dataset.resetPhoto}"]`).value='original';$('#photo-status').textContent=t('photoSaved');}catch(e){problem();}}));
 all('[data-upload-photo]').forEach(input=>input.addEventListener('change',async()=>{
  const file=input.files[0];if(!file)return;
  const branchId=B.id,slot=input.dataset.uploadPhoto,jobKey=uploadKey(branchId,slot),status=$('#photo-status');
  cancelUploads(branchId,slot);input.value='';
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>1024*1024){status.textContent=t('uploadInvalid');return;}
  read();const job={branchId,slot,version:photoVersion(state,branchId,slot)};pendingUploads.set(jobKey,job);status.textContent=t('uploadPending');
  const current=()=>pendingUploads.get(jobKey)===job;
  try{
   const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
   if(!current())return;
   const im=new Image();im.src=src;await im.decode();
   if(!current())return;
   if(!im.naturalWidth||!im.naturalHeight)throw Error();
   save(x=>{if(photoVersion(x,branchId,slot)!==job.version)throw new DOMException('Photo changed while upload was pending','AbortError');photos(x,branchId)[slot]={src,width:im.naturalWidth,height:im.naturalHeight,uploaded:true};bumpPhotoVersion(x,branchId,slot);});
   status.textContent=t('photoSaved');
  }catch(e){if(current())status.textContent=e?.name==='AbortError'?t('uploadCancelled'):storageOK?t('uploadInvalid'):t('storageError');}
  finally{if(current())pendingUploads.delete(jobKey);}
 }));
 $('#reset-website').addEventListener('click',()=>{$('#confirm-website').hidden=false;$('#confirm-website').focus();});
 $('#confirm-website').addEventListener('click',()=>{try{cancelUploads(B.id);save(x=>{x.branchEdits[B.id]={};x.branchPhotos[B.id]={};for(const slot of ['0','1','2'])bumpPhotoVersion(x,B.id,slot);});for(const locale of ['en','vi'])sessionStorage.removeItem(prefix+'editor-draft:'+B.id+':'+locale);location.reload();}catch(e){problem();}});
}
setupMap();
render();
window.SpaPreview={key,prefix,read:()=>structuredClone(state),locale:lang,shopId:D.id,branch:()=>structuredClone(B)};

// Header navigation is part of core initialization, not a deferred readiness dependency.
'use strict';
(()=>{
 const language=document.querySelector('.header-language');if(!language)return;
 const trigger=language.querySelector('summary'),nav=document.querySelector('#navigation'),menu=document.querySelector('.menu-toggle');
 function closeLanguage(focus=false){language.open=false;if(focus)trigger.focus();}
 function closeMenu(focus=false){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');if(focus)menu.focus();}
 language.querySelectorAll('[data-header-locale]').forEach(button=>button.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('preview-locale-request',{detail:button.dataset.headerLocale}))));
 language.addEventListener('toggle',()=>{if(language.open)closeMenu();});
 menu.addEventListener('click',()=>{closeLanguage();const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);if(open)nav.querySelector('a').focus();});
 nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{closeMenu();const target=document.querySelector(link.getAttribute('href'));target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}));
 document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(language.open){event.preventDefault();closeLanguage(true);}if(menu.getAttribute('aria-expanded')==='true'){event.preventDefault();closeMenu(true);}});
 for(const event of ['click','focusin'])document.addEventListener(event,e=>{if(!language.contains(e.target))closeLanguage();if(!nav.contains(e.target)&&!menu.contains(e.target)&&menu.getAttribute('aria-expanded')==='true')closeMenu();});
 matchMedia('(min-width:1024px)').addEventListener('change',()=>closeMenu());
})();

window.PreviewLoadGate.ready();
})();

/*layout-v1*/(function(){const SEL="h1,h2,h3,h4,p,li,figcaption,.contact-link,.button",CJK=/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/;function glue(el){const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let last=null,n;while(n=w.nextNode())if(n.data.trim())last=n;if(!last)return;const s=last.data.replace(/\s+$/,"");if(CJK.test(s.slice(-1))){if(s.length>1&&s.slice(-2,-1)!=="\u2060"&&CJK.test(s.slice(-2,-1)))last.data=s.slice(0,-1)+"\u2060"+s.slice(-1)+last.data.slice(s.length);return;}const m=/(\s+)(\S+)$/.exec(s);if(!m||m[1]!==" "||m[2].length>12||m.index===0)return;last.data=s.slice(0,m.index)+"\u00a0"+m[2]+last.data.slice(s.length);}let busy=false;function run(){if(busy)return;busy=true;document.querySelectorAll(SEL).forEach(glue);busy=false;}let t=null;new MutationObserver(()=>{if(busy)return;clearTimeout(t);t=setTimeout(run,60);}).observe(document.body,{childList:true,subtree:true,characterData:true});run();})();
