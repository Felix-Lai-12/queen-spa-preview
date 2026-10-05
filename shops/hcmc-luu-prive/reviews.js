/* Sourced review excerpts; no data means no rendered review section. */
(()=>{'use strict';
function init(){
 const data=window.SpaReviewData||window.ShopData?.reviews;
 if(!data?.reviews?.length||document.body.dataset.surface==='admin')return;
 const entries=data.reviews.filter(r=>r.text&&r.author&&/^https:\/\//.test(r.source));if(!entries.length)return;
 const words={en:['GUEST VOICES','A few words from our guests.','Selected excerpts from Tripadvisor. Text kept as displayed by the source; some may be automatically translated.','Pause reviews','Resume reviews','Guest review excerpts','Read source','Read more reviews ↗','Use arrow keys to browse. Focus or manual browsing pauses movement; use Resume to restart.'],vi:['LỜI KHÁCH CHIA SẺ','Đôi lời từ khách ghé thăm.','Trích đoạn được chọn từ Tripadvisor. Giữ nguyên văn bản hiển thị tại nguồn; một số có thể được dịch tự động.','Tạm dừng đánh giá','Tiếp tục đánh giá','Trích đoạn đánh giá của khách','Xem nguồn','Đọc thêm đánh giá ↗','Dùng phím mũi tên để xem. Khi có tiêu điểm hoặc thao tác thủ công, chuyển động sẽ dừng; chọn Tiếp tục để chạy lại.'],'zh-Hant':['旅客心聲','來自旅客的幾句話。','精選 Tripadvisor 評論片段，保留來源顯示的文字；部分內容可能由來源自動翻譯。','暫停評論輪播','繼續評論輪播','旅客評論片段','查看來源','閱讀更多評論 ↗','使用方向鍵瀏覽。取得焦點或手動瀏覽會暫停；請按繼續重新播放。'],ko:['방문객의 이야기','방문객이 남긴 짧은 이야기.','Tripadvisor에서 발췌한 후기입니다. 출처에 표시된 원문을 유지하며, 일부는 자동 번역된 내용일 수 있습니다.','후기 일시 정지','후기 재생','방문객 후기 발췌','출처 보기','후기 더 보기 ↗','방향키로 둘러보세요. 포커스나 직접 탐색 시 이동이 멈춥니다. 재생 버튼으로 다시 시작하세요.']};
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const section=node('section','guest-reviews wrap');section.id='guest-reviews';section.setAttribute('translate','no');section.setAttribute('aria-labelledby','guest-reviews-title');
 const head=node('div','guest-reviews-heading'),titles=node('div'),eyebrow=node('p','eyebrow'),title=node('h2');title.id='guest-reviews-title';titles.append(eyebrow,title);
 const toggle=node('button','review-toggle');toggle.type='button';toggle.setAttribute('aria-controls','guest-reviews-scroll');head.append(titles,toggle);
 const note=node('p','review-note'),viewport=node('div','review-viewport');viewport.id='guest-reviews-scroll';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-describedby','guest-reviews-help');
 const help=node('p','sr-only');help.id='guest-reviews-help';const track=node('div','review-track'),group=node('div','review-group');group.setAttribute('role','list');const links=[];
 entries.forEach(r=>{const card=node('article','guest-review-card');card.setAttribute('role','listitem');const quote=node('blockquote');quote.lang=r.language||'en';quote.textContent='“'+r.text+'”';const by=node('p','review-author',r.author),date=node('time','review-date',r.displayDate||r.date);date.dateTime=r.date;const link=node('span','review-source','Tripadvisor');card.append(quote,by,date,link);group.append(card)});
 const clone=group.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.setAttribute('inert','');clone.classList.add('review-visual-copy');
 track.append(group,clone);viewport.append(track);const more=node('a','review-more text-link');more.href=data.source;more.target='_blank';more.rel='noopener noreferrer';section.append(head,note,help,viewport,more);
 const anchor=document.querySelector('#before')||document.querySelector('main .visit');if(!anchor)return;anchor.before(section);
 const mq=matchMedia('(prefers-reduced-motion: reduce)');let userPaused=mq.matches,hover=false,visible=false,cycle=0,pos=0,last=0;
 const running=()=>!userPaused&&!hover&&visible&&!document.hidden;
 function sync(){const w=words[window.QueenI18n?.locale||document.documentElement.lang]||words.en;eyebrow.textContent=w[0];title.textContent=w[1];note.textContent=w[2];toggle.textContent=userPaused?w[4]:w[3];toggle.setAttribute('aria-pressed',String(userPaused));viewport.setAttribute('aria-label',w[5]);links.forEach(l=>l.textContent=w[6]+' ↗');more.textContent=w[7];help.textContent=w[8];section.dataset.paused=String(userPaused)}
 function pause(){userPaused=true;sync()}
 // Remember the pointer intent before focusin pauses playback. Keyboard focus presents Resume.
 let pointerWasPaused=null;
 toggle.addEventListener('pointerdown',()=>{pointerWasPaused=userPaused});
 toggle.addEventListener('pointercancel',()=>{pointerWasPaused=null});
 toggle.addEventListener('keydown',()=>{pointerWasPaused=null});
 toggle.addEventListener('click',()=>{userPaused=!(pointerWasPaused??userPaused);pointerWasPaused=null;pos=viewport.scrollLeft;sync()});
 section.addEventListener('mouseenter',()=>hover=true);section.addEventListener('mouseleave',()=>hover=false);
 // Focus anywhere in the carousel pauses persistently; only explicit Resume restarts.
 section.addEventListener('focusin',pause);
 viewport.addEventListener('pointerdown',pause,{passive:true});viewport.addEventListener('wheel',pause,{passive:true});
 viewport.addEventListener('scroll',()=>{if(!running())pos=viewport.scrollLeft},{passive:true});
 viewport.addEventListener('keydown',e=>{if(e.target!==viewport||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();pause();viewport.scrollLeft=e.key==='Home'?0:e.key==='End'?group.offsetWidth-viewport.clientWidth:viewport.scrollLeft+(e.key==='ArrowLeft'?-1:1)*Math.min(320,viewport.clientWidth*.8);pos=viewport.scrollLeft});
 new ResizeObserver(()=>{cycle=clone.offsetLeft-group.offsetLeft;pos=viewport.scrollLeft}).observe(group);
 new IntersectionObserver(es=>{visible=es[0].isIntersecting;last=0}).observe(viewport);
 mq.addEventListener('change',e=>{if(e.matches)pause()});document.addEventListener('queen-locale-change',sync);
 function tick(now){const dt=last?Math.min(now-last,64):0;last=now;if(running()&&cycle){pos=(pos+18*dt/1000)%cycle;viewport.scrollLeft=pos}requestAnimationFrame(tick)}sync();requestAnimationFrame(tick);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
