'use strict';
// Shared, same-origin browser demo store. Fictional data only; not a production database.
(() => {
  const KEY = 'queen-spa-pages-demo-v1';
  const money = value => `${new Intl.NumberFormat('en-US').format(value)} VND`;
  function today() {
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function shiftDate(date,days){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
  function base(withSamples=true){
    const services={
      oil:{name:'Natural oil',description:'Natural oil and traditional Vietnamese massage techniques. A flowing, soft-to-medium touch.',image:'assets/natural-oil.webp',alt:'Queen Spa natural oil massage',options:[[60,500000],[90,750000]]},
      bamboo:{name:'Bamboo & lotion cream',description:'Bamboo tools paired with lotion cream. For those who prefer a medium-to-strong massage.',image:'assets/bamboo-lotion.webp',alt:'Queen Spa bamboo massage',options:[[90,850000],[120,1100000]]},
      stone:{name:'Lotion cream & hot stone',description:'Lotion cream body massage combined with warm stones. Choose 70, 90 or 120 minutes.',image:'assets/hot-stone.webp',alt:'Queen Spa hot stone massage',options:[[70,590000],[90,750000],[120,980000]]}
    };
    const state={version:6,nextOrder:2001,revision:0,updatedAt:new Date().toISOString(),content:{title:'A little stillness.\nIn Da Nang.',intro:'Natural oil, bamboo and hot stone body massage.\nMake time for yourself at Queen Spa.',hours:'Opening hours to be confirmed',address:'144 Pham Cu Luong Street\nSon Tra, Da Nang, Vietnam',heroImage:'assets/queen-massage-room.webp',galleryOne:'assets/queen-interior.webp',galleryTwo:'assets/queen-treatment-room.webp',contact:{phone:'',whatsapp:'',zalo:'',mapsUrl:'https://www.google.com/maps/dir/?api=1&destination=Queen+Spa%2C+144+Pham+Cu+Luong%2C+Son+Tra%2C+Da+Nang%2C+Vietnam'}},services,bookings:[]};
    if(withSamples){
      const rows=[['A','oil',60,2,'10:00','pending',0],['B','bamboo',90,1,'11:30','confirmed',0],['C','stone',70,2,'14:00','pending',0],['D','oil',90,1,'16:00','completed',0],['E','bamboo',120,2,'17:30','cancelled',0],['F','stone',90,1,'10:30','pending',1]];
      state.bookings=rows.map(([letter,key,minutes,guests,time,status,days],i)=>({id:`QS-D${1001+i}`,createdAt:new Date().toISOString(),serviceKey:key,serviceName:services[key].name,duration:minutes,unitPrice:services[key].options.find(([m])=>m===minutes)[1],guests,date:shiftDate(today(),days),time,name:`Demo Guest ${letter}`,email:`guest.${letter.toLowerCase()}@example.com`,phone:'',status,history:[{at:new Date().toISOString(),text:'Fictional sample booking loaded.'}]}));
    }
    return state;
  }
  let problem='';
  let memory=base();
  function valid(state){return state&&state.version===6&&state.content&&Array.isArray(state.bookings)&&['oil','bamboo','stone'].every(key=>state.services?.[key]?.options?.length&&state.services[key].options.every(p=>Array.isArray(p)&&Number.isInteger(p[0])&&p[0]>0&&Number.isInteger(p[1])&&p[1]>0));}
  function read(){
    try {
      const raw=localStorage.getItem(KEY);
      if(!raw){if(problem)return structuredClone(memory);memory=base();localStorage.setItem(KEY,JSON.stringify(memory));}
      else {const parsed=JSON.parse(raw);if(!valid(parsed))throw Error('Unsupported or damaged demo data.');if(!parsed.content.contact)parsed.content.contact=base(false).content.contact;memory=parsed;}
      problem='';
    }catch(e){problem='Browser storage is unavailable or damaged. Allow storage for this preview; no changes will be saved.';}
    return structuredClone(memory);
  }
  function publish(){window.dispatchEvent(new CustomEvent('queen-demo-change'));}
  function save(mutator){
    const draft=read();
    if(problem)throw Error(problem);
    mutator(draft);
    draft.revision+=1;draft.updatedAt=new Date().toISOString();
    if(!valid(draft))throw Error('The demo change is invalid.');
    try{localStorage.setItem(KEY,JSON.stringify(draft));memory=draft;publish();}
    catch(e){throw Error('Cannot save demo data. Browser storage may be full or blocked. Try a smaller photo or reset the demo in admin.');}
    return structuredClone(draft);
  }
  function reset(withSamples=true){const state=base(withSamples);try{localStorage.setItem(KEY,JSON.stringify(state));memory=state;problem='';publish();}catch(e){throw Error('Cannot reset: browser storage is blocked. Allow local storage for this preview.');}}
  function addBooking(input){
    if(!/^Demo\b/i.test(input.name)||!/@example\.(com|net|org)$/i.test(input.email)||input.phone)throw Error('Use a fictional Demo name and an example.com email. Leave the demo phone blank.');
    if(!Number.isInteger(input.guests)||input.guests<1||input.guests>6||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||input.date<today()||!/^([01]\d|2[0-3]):(00|15|30|45)$/.test(input.time))throw Error('Choose valid future demo appointment details.');
    let id;
    save(state=>{
      const service=state.services[input.serviceKey];const option=service.options.find(([minutes])=>minutes===input.duration);
      if(!option)throw Error('The menu changed. Please select your duration again.');
      id=`QS-D${state.nextOrder++}`;
      state.bookings.unshift({...input,id,serviceName:service.name,serviceNameCopies:structuredClone(service.localeCopies||{}),unitPrice:option[1],createdAt:new Date().toISOString(),status:'pending',history:[{at:new Date().toISOString(),text:(typeof document!=='undefined'&&document.documentElement.dataset.mode==='pitch')?'Request created from the website. No notification sent.':'Demo booking created from the customer website. No notification sent.'}]});
    });
    return id;
  }
  function subscribe(fn){window.addEventListener('queen-demo-change',fn);window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null){read();fn();}});}
  window.QueenDemo={read,save,reset,addBooking,subscribe,today,shiftDate,money,key:KEY,get problem(){return problem;}};
  read();
})();
