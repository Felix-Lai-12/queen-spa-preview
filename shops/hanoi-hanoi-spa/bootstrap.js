'use strict';
(() => {
  const panel = document.getElementById('preview-load-status');
  const app = document.getElementById('preview-app');
  const heading = document.getElementById('preview-load-heading');
  const message = document.getElementById('preview-load-message');
  if (!panel || !app || !heading || !message) return;
  const locale = document.documentElement.lang;
  const copy = {
    en: ['Loading this preview…', 'Interactive features will be available when loading finishes.', 'Preview unavailable', 'Some page content did not load. Reload to try again. Nothing has been sent.'],
    vi: ['Đang tải bản xem trước…', 'Các tính năng tương tác sẽ khả dụng khi tải xong.', 'Bản xem trước chưa khả dụng', 'Một số nội dung chưa tải được. Hãy tải lại để thử lại. Chưa có thông tin nào được gửi.'],
    'zh-Hant': ['正在載入預覽…', '載入完成後即可使用互動功能。', '預覽暫時無法使用', '部分頁面內容未能載入，請重新載入再試。沒有送出任何資料。'],
    ko: ['미리보기를 불러오는 중…', '불러오기가 끝나면 기능을 사용할 수 있습니다.', '미리보기를 사용할 수 없습니다', '일부 내용을 불러오지 못했습니다. 새로고침하여 다시 시도하세요. 전송된 정보는 없습니다.']
  }[locale] || ['Loading this preview…', 'Please wait.', 'Preview unavailable', 'Reload to try again. Nothing has been sent.'];
  let state = 'loading';
  let reason = null;
  let timer;
  app.inert = true;
  app.setAttribute('aria-busy', 'true');
  panel.hidden = false;
  panel.setAttribute('role', 'status');
  panel.setAttribute('aria-live', 'polite');
  heading.textContent = copy[0];
  message.textContent = copy[1];
  function fail(code) {
    if (state === 'ready' || state === 'unavailable') return;
    state = 'unavailable';
    reason = code;
    clearTimeout(timer);
    app.inert = true;
    app.setAttribute('aria-busy', 'false');
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    panel.hidden = false;
    panel.setAttribute('role', 'alert');
    panel.setAttribute('aria-live', 'assertive');
    heading.textContent = copy[2];
    message.textContent = copy[3];
    heading.focus({preventScroll: true});
  }
  function validData() {
    const data = window.ShopData;
    return !!(data && typeof data.id === 'string' && data.id && data.ui &&
      Array.isArray(data.branches) && data.branches.length &&
      data.branches.every(branch => branch && typeof branch.id === 'string' &&
        Array.isArray(branch.services) && branch.services.length && Array.isArray(branch.photos)));
  }
  window.PreviewLoadGate = {
    canStart: () => state === 'loading' && validData() &&
      (document.body.dataset.surface !== 'customer' || !!window.L),
    fail,
    status: () => ({state, reason})
  };
  window.addEventListener('error', event => {
    if (state !== 'loading') return;
    if (event.target instanceof HTMLScriptElement) fail('required-script-failed');
    else if (event instanceof ErrorEvent) fail('initialization-error');
  }, true);
  timer = setTimeout(() => fail('load-timeout'), 10000);
  function finish() {
    if (state !== 'loading') return;
    if (!validData() || !window.SpaPreview || window.SpaPreview.shopId !== window.ShopData.id) {
      fail('initialization-incomplete');
      return;
    }
    state = 'ready';
    clearTimeout(timer);
    app.inert = false;
    app.setAttribute('aria-busy', 'false');
    panel.hidden = true;
  }
  if (document.readyState === 'complete') finish();
  else document.addEventListener('DOMContentLoaded', finish, {once: true});
})();
