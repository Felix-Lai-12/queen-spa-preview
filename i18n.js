'use strict';
// Portable locale layer. Stable source messages; textContent only, no translated HTML.
(() => {
 const admin=location.pathname.includes('admin'),supported=admin?['en','vi']:['en','vi','zh-Hant','ko'];
 const key='queen-pages-v1-'+(admin?'admin':'customer')+'-locale';
 const tags={en:'en-GB',vi:'vi-VN','zh-Hant':'zh-TW',ko:'ko-KR'};
 const ogTags={en:'en_US',vi:'vi_VN','zh-Hant':'zh_TW',ko:'ko_KR'};
 function updateOG(){document.querySelector?.('meta[property="og:locale"]')?.setAttribute('content',ogTags[locale]);}
 let locale=document.documentElement.lang||'en';try{if(!document.documentElement.dataset.localeRoute)locale=localStorage.getItem(key)||locale;}catch(e){}if(!supported.includes(locale))locale='en';
 const dict=window.QueenMessageScopes?.[admin?'admin':'customer']||window.QueenMessages||{},missing=new Set(),sources=new WeakMap(),attributes=new WeakMap();
 // Reverse inference is allowed only for unique values in this surface's catalog.
 const candidates={};for(const [source,values] of Object.entries(dict))for(const value of Object.values(values))if(value)(candidates[value]??=new Set()).add(source);
 const getSource=value=>dict[value]?value:(candidates[value]?.size===1?[...candidates[value]][0]:value);
 function hydrate(){const manifest=document.getElementById?.('queen-i18n-identities');if(!manifest)return;for(const item of JSON.parse(manifest.textContent)){let el=document.documentElement;for(const index of item.path)el=el?.children[index];if(!el)continue;if(item.source){const node=el.childNodes[item.slot];if(node?.nodeType===3)sources.set(node,{source:item.source,rendered:node.data});}if(item.attrs){const stored={};for(const [name,source]of Object.entries(item.attrs))stored[name]={source,rendered:el.getAttribute(name)};attributes.set(el,stored);}}}
 function option(source,value){const canonical=getSource(source);const node=new Option(t(canonical),value);if(node.firstChild)sources.set(node.firstChild,{source:canonical,rendered:node.firstChild.data});return node;}
 function number(value){return new Intl.NumberFormat(tags[locale]).format(value);}
 function money(value){return number(value)+' VND';}
 function date(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;return new Intl.DateTimeFormat(tags[locale],{dateStyle:'long',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));}
 function t(value){if(!value)return value;const source=getSource(String(value));if(locale==='en')return source.replace(/\b\d{4}-\d{2}-\d{2}\b/g,date);if(dict[source]?.[locale])return dict[source][locale];
  let text=source;
  if(source.includes(' · ')){text=source.split(' · ').map(part=>dict[part]?.[locale]||part).join(' · ');}
  // Dynamic messages have numbers, booking IDs and proper names supplied at runtime.
  const dynamic=['heroImage','galleryOne','galleryTwo','serviceImage','Current demo status:','Status:','New request','saved in this browser','Demo admin changed status to','Status changed to','Request created from the website.','No notification sent.','Fictional sample booking loaded.','Demo booking created from the customer website. No notification sent.','From','Rituals from','demo menu','Da Nang (GMT+7)','minutes','guests','guest','min','bookings','Open','Photo preview','Upload','photo'];
  const serviceNames=['Natural oil','Bamboo & lotion cream','Lotion cream & hot stone'];
  [...dynamic,...serviceNames,...['pending','confirmed','rescheduled','completed','cancelled']].sort((a,b)=>b.length-a.length).forEach(k=>{if(dict[k]?.[locale]){const escaped=k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');text=text.replace(new RegExp('(?<![A-Za-z])'+escaped+'(?![A-Za-z])','g'),dict[k][locale]);}});
  ['This removes all saved bookings, uploaded photos and menu/content edits.','Six fictional sample bookings will be loaded.','The booking list will be empty.'].forEach(k=>{if(dict[k]?.[locale])text=text.replace(k,dict[k][locale]);});
  text=text.replace(/\b\d{4}-\d{2}-\d{2}\b/g,date);
  text=text.replace(/\b(\d{1,3}(?:,\d{3})+)\s*VND\b/g,(_,v)=>money(Number(v.replaceAll(',',''))));
  text=text.replace(/\b(\d{1,3}(?:,\d{3})+)\b/g,(_,v)=>number(Number(v.replaceAll(',',''))));
  text=text.replace(/(\d+)\s+(phút|分鐘|분|khách|位旅客|명)(?!\p{L})/gu,(_,n,unit)=>number(Number(n))+(locale==='ko'?'':' ')+unit);
  if(text===source && /[A-Za-z]{3}/.test(source) && !/^(Queen Spa|Demo Guest|QS-D|preview@|guest\.|English|Tiếng Việt|EN$|VI$|SON TRA$|DA NANG$|VND$|[\d.,]+ VND$|GMT\+7|assets\/)/.test(source))missing.add(source);
  return text;
 }
 function excluded(node){return node.parentElement?.closest('script,style,noscript,svg,textarea,[data-user-content],[translate="no"],#locale-switch,[data-locale-switch]');}
 function apply(root=document){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(excluded(node)||!node.data.trim())continue;const old=sources.get(node);let source;if(old&&node.data===old.rendered)source=old.source;else source=getSource(node.data.trim());const lead=node.data.match(/^\s*/)[0],tail=node.data.match(/\s*$/)[0];const translated=lead+t(source)+tail;if(node.data!==translated)node.data=translated;sources.set(node,{source,rendered:translated});}
  const elements=root.querySelectorAll?root.querySelectorAll('[alt],[aria-label],[placeholder],[title],meta[content]'):[];for(const el of elements){if(el.closest('#locale-switch,[data-locale-switch],[data-user-content]'))continue;let stored=attributes.get(el)||{};for(const attr of ['alt','aria-label','placeholder','title','content']){if(!el.hasAttribute(attr))continue;if(attr==='content'&&!['description','og:title','og:description','og:image:alt','twitter:title','twitter:description'].includes(el.getAttribute('name')||el.getAttribute('property')))continue;const value=el.getAttribute(attr),old=stored[attr],source=old&&value===old.rendered?old.source:getSource(value);const rendered=t(source);if(value!==rendered)el.setAttribute(attr,rendered);stored[attr]={source,rendered};}attributes.set(el,stored);}
 }
 function setLocale(next){if(!supported.includes(next))return;locale=next;document.documentElement.lang=locale;updateOG();try{localStorage.setItem(key,locale);}catch(e){}document.querySelectorAll('#locale-switch,[data-locale-switch]').forEach(select=>select.value=locale);apply();document.dispatchEvent(new CustomEvent('queen-locale-change',{detail:{locale,admin}}));}
 hydrate();
 function inspectBindings(root=document){const result=[];const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(excluded(node)||!node.data.trim())continue;const binding=sources.get(node);if(binding)result.push({source:binding.source,actual:node.data.trim(),expected:t(binding.source),visible:Boolean(node.parentElement.getClientRects().length)});}return result;}
 window.QueenI18n={t,number,money,date,option,inspectBindings,setLocale,get locale(){return locale;},get tag(){return tags[locale];},get missing(){return [...missing];},apply,key,supported};
 document.documentElement.lang=locale;
 document.addEventListener('DOMContentLoaded',()=>{updateOG();document.querySelectorAll('#locale-switch,[data-locale-switch]').forEach(select=>{select.value=locale;select.addEventListener('change',()=>setLocale(select.value));});apply();let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['alt','aria-label','placeholder','title']});});
})();
