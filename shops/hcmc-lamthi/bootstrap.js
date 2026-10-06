'use strict';
(() => {
  const panel = document.getElementById('preview-load-status');
  const app = document.getElementById('preview-app');
  const heading = document.getElementById('preview-load-heading');
  const message = document.getElementById('preview-load-message');
  if (!panel || !app || !heading || !message) return;
  const locale = document.documentElement.lang;
  const words = {
    en: ['Loading this preview…', 'Interactive features will be available when loading finishes.', 'Preview unavailable', 'Some required page content could not load. Reload to try again. Nothing has been sent.', 'This is taking longer than usual', 'Still waiting for page content. You can wait here; the preview will open automatically when it arrives. Or reload to try again. Nothing has been sent.', 'Loading the map… You can still view the address and use the inquiry form.', 'The map is taking longer to load. The address and inquiry form are available.', 'The map could not load. The address and inquiry form are available.', 'Retry map'],
    vi: ['Đang tải bản xem trước…', 'Các tính năng tương tác sẽ khả dụng khi tải xong.', 'Bản xem trước chưa khả dụng', 'Một số nội dung cần thiết không tải được. Hãy tải lại để thử lại. Chưa có thông tin nào được gửi.', 'Đang tải lâu hơn bình thường', 'Vẫn đang chờ nội dung trang. Bạn có thể đợi; bản xem trước sẽ tự mở khi tải xong. Hoặc tải lại để thử lại. Chưa có thông tin nào được gửi.', 'Đang tải bản đồ… Bạn vẫn có thể xem địa chỉ và dùng biểu mẫu hỏi dịch vụ.', 'Bản đồ đang tải chậm. Địa chỉ và biểu mẫu hỏi dịch vụ vẫn dùng được.', 'Không tải được bản đồ. Địa chỉ và biểu mẫu hỏi dịch vụ vẫn dùng được.', 'Thử tải lại bản đồ'],
    'zh-Hant': ['正在載入預覽…', '載入完成後即可使用互動功能。', '預覽暫時無法使用', '部分必要內容無法載入，請重新載入再試。沒有送出任何資料。', '載入時間比平常稍長', '仍在等待頁面內容。您可以繼續等候，內容到齊後會自動開啟預覽；也可以重新載入再試。沒有送出任何資料。', '正在載入地圖…您仍可查看地址及使用詢問表單。', '地圖載入較慢。地址與詢問表單仍可使用。', '地圖無法載入。地址與詢問表單仍可使用。', '重試地圖'],
    ko: ['미리보기를 불러오는 중…', '불러오기가 끝나면 기능을 사용할 수 있습니다.', '미리보기를 사용할 수 없습니다', '필수 내용을 불러오지 못했습니다. 새로고침하여 다시 시도하세요. 전송된 정보는 없습니다.', '평소보다 시간이 오래 걸립니다', '페이지 내용을 기다리고 있습니다. 기다리시면 준비되는 대로 미리보기가 자동으로 열립니다. 새로고침하여 다시 시도할 수도 있습니다. 전송된 정보는 없습니다.', '지도를 불러오는 중… 주소 확인과 문의 양식은 계속 사용할 수 있습니다.', '지도를 불러오는 데 시간이 걸립니다. 주소 확인과 문의 양식은 사용할 수 있습니다.', '지도를 불러오지 못했습니다. 주소 확인과 문의 양식은 사용할 수 있습니다.', '지도 다시 시도']
  };
  const copy = words[locale] || words.en;
  let state = 'loading', reason = null, timer;
  let mapState = 'idle', mapAttempt = 0, mapTimer, mapNodes = [];
  const mapStatus = document.getElementById('map-status');
  let mapRetry, mapRestoreFocus = false;
  function show(next) {
    state = next;
    app.inert = true;
    app.setAttribute('aria-busy', String(next !== 'unavailable'));
    panel.hidden = false;
    panel.setAttribute('role', next === 'unavailable' ? 'alert' : 'status');
    panel.setAttribute('aria-live', next === 'unavailable' ? 'assertive' : 'polite');
    const offset = next === 'loading' ? 0 : next === 'waiting' ? 4 : 2;
    heading.textContent = copy[offset];
    message.textContent = copy[offset + 1];
  }
  function validData() {
    const data = window.ShopData;
    return !!(data && typeof data.id === 'string' && data.id && data.ui &&
      Array.isArray(data.branches) && data.branches.length &&
      data.branches.every(branch => branch && typeof branch.id === 'string' &&
        Array.isArray(branch.services) && branch.services.length && Array.isArray(branch.photos)));
  }
  function fail(code) {
    if (state === 'ready' || state === 'unavailable') return;
    reason = code;
    clearTimeout(timer);
    show('unavailable');
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    heading.focus({preventScroll: true});
  }
  function mapFailed(attempt) {
    if (attempt !== mapAttempt || mapState === 'ready') return;
    clearTimeout(mapTimer);
    mapState = 'unavailable';
    mapStatus.textContent = copy[8];
    mapRetry.hidden = false;
    mapRetry.disabled = false;
    if (mapRestoreFocus) mapRetry.focus({preventScroll: true});
  }
  function loadMap() {
    if (!mapStatus || mapState === 'loading' || mapState === 'ready') return;
    const attempt = ++mapAttempt;
    mapRestoreFocus = document.activeElement === mapRetry;
    mapNodes.forEach(node => node.remove());
    mapNodes = [];
    mapState = 'loading';
    mapStatus.textContent = copy[6];
    mapRetry.hidden = true;
    clearTimeout(mapTimer);
    mapTimer = setTimeout(() => {
      if (attempt === mapAttempt && mapState === 'loading') mapStatus.textContent = copy[7];
    }, 10000);
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'vendor/leaflet.css';
    css.dataset.previewOptional = 'map';
    css.onerror = () => mapFailed(attempt);
    css.onload = () => {
      if (attempt !== mapAttempt || mapState !== 'loading') return;
      function finishMap() {
        if (attempt !== mapAttempt || mapState !== 'loading') return;
        if (!window.L) { mapFailed(attempt); return; }
        document.dispatchEvent(new Event('preview-map-ready'));
        if (!window.SpaMap) { mapFailed(attempt); return; }
        clearTimeout(mapTimer);
        mapState = 'ready';
        if (mapRestoreFocus) document.getElementById('branch-map').focus({preventScroll: true});
        mapRetry.hidden = true;
      }
      if (window.L) { finishMap(); return; }
      const script = document.createElement('script');
      script.src = 'vendor/leaflet.js';
      script.async = true;
      script.dataset.previewOptional = 'map';
      script.onload = finishMap;
      script.onerror = () => mapFailed(attempt);
      mapNodes.push(script);
      document.head.append(script);
    };
    mapNodes.push(css);
    document.head.append(css);
  }
  function ready() {
    if (state === 'unavailable' || state === 'ready') return;
    if (!validData() || window.SpaPreview?.shopId !== window.ShopData.id) { fail('initialization-incomplete'); return; }
    const restoreFocus = panel.contains(document.activeElement);
    state = 'ready'; reason = null;
    clearTimeout(timer);
    app.inert = false;
    app.setAttribute('aria-busy', 'false');
    panel.hidden = true;
    if (restoreFocus) {
      const target = document.querySelector('dialog[open] .booking-step:not([hidden]) h3') || document.querySelector('#main h1, main h1, h1');
      if (target) { target.setAttribute('tabindex', '-1'); target.focus({preventScroll: true}); }
    }
    if (mapStatus && document.body.dataset.surface === 'customer') {
      mapStatus.setAttribute('role', 'status');
      mapStatus.setAttribute('aria-live', 'polite');
      mapRetry = document.createElement('button');
      mapRetry.id = 'preview-map-retry';
      mapRetry.type = 'button';
      mapRetry.className = 'secondary-button button light';
      mapRetry.style.minHeight = '44px';
      mapRetry.textContent = copy[9];
      mapRetry.hidden = true;
      mapRetry.addEventListener('click', loadMap);
      mapStatus.after(mapRetry);
      loadMap();
    }
  }
  window.PreviewLoadGate = {
    canStart: () => (state === 'loading' || state === 'waiting') && validData(),
    fail, ready,
    status: () => ({state, reason, mapState, mapAttempt})
  };
  window.addEventListener('error', event => {
    if (state === 'ready' || state === 'unavailable') return;
    if (event.target instanceof HTMLScriptElement) {
      if (!event.target.dataset.previewOptional) fail('required-script-failed');
    } else if (event instanceof ErrorEvent) fail('initialization-error');
  }, true);
  show('loading');
  // A slow request is not a permanent failure: late valid scripts may still initialize once.
  timer = setTimeout(() => {
    if (state === 'loading') { reason = 'content-pending'; show('waiting'); }
  }, 10000);
  // Core runtime explicitly calls ready; neither photographs nor optional modules gate it.
  document.addEventListener('DOMContentLoaded', () => {
    if (state !== 'ready' && state !== 'unavailable') fail('initialization-incomplete');
  }, {once: true});
})();
