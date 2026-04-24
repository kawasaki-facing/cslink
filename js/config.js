// CSLINK 共通設定
// 全HTMLから <script src="js/config.js"></script> として読み込む
(function(){
  window.CSLINK_CONFIG = Object.freeze({
    SUPABASE_URL: 'https://xatjfhleqgubgrnqzxrs.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdGpmaGxlcWd1YmdybnF6eHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDk1MDYsImV4cCI6MjA5MTk4NTUwNn0.GVHjmNah2oq1i5tI_VTBwspLfDrpY0cv2apTmpe4MFU',
    WORKER_URL: 'https://cslink-ai-proxy.kawasaki-be9.workers.dev',
    SITE_ORIGIN: 'https://cslink.link',
    GA_ID: '',
    ENABLE_GA: false,
    ENABLE_SUBSCRIBE: false
  });
  if (window.CSLINK_CONFIG.ENABLE_GA && window.CSLINK_CONFIG.GA_ID) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(window.CSLINK_CONFIG.GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', window.CSLINK_CONFIG.GA_ID, { anonymize_ip: true });
  }
})();
