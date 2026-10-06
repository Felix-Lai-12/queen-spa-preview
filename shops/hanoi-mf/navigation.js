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
