'use strict';
// Customer header disclosure only; booking and demo state remain the existing implementation.
(() => {
 const language=document.querySelector('.header-language');
 if(!language)return;
 const trigger=language.querySelector('summary');
 const nav=document.querySelector('#navigation');
 const menu=document.querySelector('.menu-toggle');
 const labels={en:'EN',vi:'VI','zh-Hant':'繁中',ko:'KO'};
 function sync(){
  const locale=QueenI18n.locale;
  language.querySelector('.language-current').textContent=labels[locale];
  language.querySelectorAll('[data-header-locale]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.headerLocale===locale)));
  trigger.setAttribute('aria-label',QueenI18n.t('Language'));
  menu.setAttribute('aria-label',QueenI18n.t('Menu'));
 }
 function closeLanguage(focus=false){language.open=false;if(focus)trigger.focus();}
 language.querySelectorAll('[data-header-locale]').forEach(button=>button.addEventListener('click',()=>{
  QueenI18n.setLocale(button.dataset.headerLocale);sync();closeLanguage(true);
 }));
 language.addEventListener('toggle',()=>{if(language.open)closeMenu();});
 menu.addEventListener('click',()=>{closeLanguage();if(menu.getAttribute('aria-expanded')==='true')nav.querySelector('a').focus();});
 document.addEventListener('queen-locale-change',sync);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&language.open){event.preventDefault();closeLanguage(true);}});
 document.addEventListener('click',event=>{
  if(!language.contains(event.target))closeLanguage();
  if(!nav.contains(event.target)&&!menu.contains(event.target)&&menu.getAttribute('aria-expanded')==='true')closeMenu();
 });
 document.addEventListener('focusin',event=>{
  if(!language.contains(event.target))closeLanguage();
  if(!nav.contains(event.target)&&!menu.contains(event.target)&&menu.getAttribute('aria-expanded')==='true')closeMenu();
 });
 sync();
})();
