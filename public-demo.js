'use strict';
(()=>{
 const text={en:['Public sample preview · Not the official booking website. Fictional browser data only.','Sample admin · Public, without sign-in. Changes stay in this browser; no notifications are sent.','Queen Spa — Sample preview'],vi:['Bản xem trước minh họa công khai · Không phải trang đặt lịch chính thức. Chỉ dùng dữ liệu giả trong trình duyệt.','Quản trị minh họa · Công khai, không đăng nhập. Thay đổi chỉ lưu trong trình duyệt; không gửi thông báo.','Queen Spa — Bản xem trước minh họa'],'zh-Hant':['公開示範預覽 · 非官方預約網站。僅使用此瀏覽器的虛構資料。','示範後台 · 公開且無登入保護。修改只存於此瀏覽器，不會發送通知。','Queen Spa — 示範預覽'],ko:['공개 샘플 미리보기 · 공식 예약 사이트가 아닙니다. 브라우저의 가상 데이터만 사용하세요.','샘플 관리자 · 로그인 없이 공개됩니다. 변경 사항은 이 브라우저에만 저장되며 알림은 전송되지 않습니다.','Queen Spa — 샘플 미리보기']};
 const admin=location.pathname.includes('admin');const note=document.createElement('p');note.className='public-demo-note';note.setAttribute('translate','no');
 (document.querySelector(admin?'.admin-main':'.hero-copy')||document.body).prepend(note);
 function render(){const t=text[document.documentElement.lang]||text.en;note.textContent=t[admin?1:0];document.title=t[2];}
 render();document.addEventListener('queen-locale-change',render);document.addEventListener('DOMContentLoaded',render);
})();
