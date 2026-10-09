(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const duration = 12000;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const native = !window.AEMEATH_EXTERNAL && Boolean(window.webkit?.messageHandlers?.launcher);
  const embedded = window.parent!==window && (window.AEMEATH_EXTERNAL || new URLSearchParams(location.search).has('embedded'));
  const assets=window.AEMEATH_ASSETS||{artwork:'assets/artwork.jpg',avatar:'assets/avatar.jpg'};
  if(embedded)document.body.classList.add('embedded');
  const root = $('.window'), art = $('.artwork'), scene = $('.scene');
  const hud = $('.hud'), intro = $('.intro'), sweep = $('.light-sweep');
  const slider = $('#timeline'), pause = $('#pause'), subtitle = $('.subtitle');
  slider.max=String(duration/1000);
  let playing = false, elapsed = 0, origin = 0, frame = 0, lastUI = -Infinity;
  let completed = false, hiddenPause = false, mode = 'preview', loaded = false, revealed = false;
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { const t = clamp(n); return t*t*(3-2*t); };

  /* Internationalization Dictionary (Vietnamese, English, Chinese) */
  const I18N = {
    vi: {
      headingSequence: 'TRÌNH TỰ KHỞI ĐỘNG / 01',
      connectionEstablished: 'KẾT NỐI ĐÃ THÀNH CÔNG',
      endHeadline: 'Giao diện đã sẵn sàng bên bạn.',
      endDescription: 'Kết thúc xem thử 12 giây khởi động',
      launchShowing: 'Đang hiển thị Codex…',
      launchWaiting: 'Đang chờ mở Codex…',
      launchUnavailableTitle: 'Tạm thời không thể mở Codex',
      replay: 'Xem lại',
      pause: 'Tạm dừng',
      resume: 'Tiếp tục',
      finished: 'Đã kết thúc',
      skip: 'CLICK / ESC ĐỂ BỎ QUA',
      imageSettings: 'Cài đặt hình ảnh',
      assetError: 'Tải tài nguyên hoạt ảnh thất bại, vui lòng kiểm tra thư mục assets.',
      syncRatio: 'TỶ LỆ ĐỒNG BỘ',
      initializing: 'ĐANG KHỞI TẠO',
      synchronizing: 'ĐANG ĐỒNG BỘ',
      syncComplete: 'ĐỒNG BỘ HOÀN TẤT',
      resonance: 'CỘNG HƯỞNG / CODEX',
      settingsTitle: 'Đổi thành hình ảnh bạn yêu thích',
      settingsDescription: 'Tùy chỉnh hai hình ảnh và văn bản hiển thị bên dưới, để trống nếu muốn ẩn chữ.',
      avatarLabel: 'Ảnh đại diện nửa đầu',
      avatarHint: 'Hình vuông tỉ lệ 1:1 đẹp nhất',
      changeAvatar: 'Đổi ảnh đại diện',
      artworkLabel: 'Hình nền nửa sau',
      artworkHint: 'Khuyên dùng ảnh ngang 3:2 · Tự động tạo nét vẽ',
      changeArtwork: 'Đổi hình nền',
      introTitleLabel: 'Nửa đầu · Tiêu đề dưới avatar',
      introTitleHint: 'Tối đa 16 ký tự',
      introCaptionLabel: 'Nửa đầu · Chữ nhỏ dưới tiêu đề',
      introCaptionHint: 'Tối đa 48 ký tự',
      artworkSubtitleLabel: 'Nửa sau · Phụ đề dưới hình nền',
      artworkSubtitleHint: 'Tối đa 60 ký tự',
      wallpaperStrengthLabel: 'Độ rõ hình nền Codex',
      wallpaperStrengthHint: 'Sau khi kết thúc hoạt ảnh, hình nền tiếp tục phủ cửa sổ. 0% là tắt nền.',
      settingsStatus: 'Hình ảnh được lưu trên máy của bạn, không tải lên mạng. Sửa xong bấm「Lưu và xem thử」; đóng để hủy.',
      resetDefaults: 'Khôi phục ảnh & chữ mặc định',
      previewImages: 'Lưu và xem thử',
      restoreAppearance: 'Tắt làm đẹp, khôi phục gốc Codex',
      generatingContours: 'Đang tạo nét viền vẽ từ hình nền mới…',
      preparingAvatar: 'Đang xử lý ảnh đại diện…',
      imageReady: 'Hình ảnh đã sẵn sàng, nhấn「Lưu và xem thử」để áp dụng.',
      saving: 'Đang lưu…',
      saveFailed: 'Lưu thất bại, cài đặt cũ được giữ nguyên: ',
      defaultsRestored: 'Đã chọn ảnh, chữ và độ rõ mặc định. Nhấn「Lưu và xem thử」để áp dụng.',
      defaultTitle: 'Codex Theme',
      defaultCaption: 'CODEX INITIALIZE / TYPE-0',
      defaultSubtitle: 'Chào mừng bạn trở lại, chúc một ngày làm việc hiệu quả~'
    },
    en: {
      headingSequence: 'STARTUP SEQUENCE / 01',
      connectionEstablished: 'CONNECTION ESTABLISHED',
      endHeadline: 'Ghost resonance established.',
      endDescription: '12-second startup preview finished',
      launchShowing: 'Showing Codex…',
      launchWaiting: 'Waiting for Codex to open…',
      launchUnavailableTitle: 'Cannot open Codex right now',
      replay: 'Replay',
      pause: 'Pause',
      resume: 'Resume',
      finished: 'Finished',
      skip: 'CLICK / ESC TO SKIP',
      imageSettings: 'Image Settings',
      assetError: 'Animation assets failed to load. Please verify assets folder integrity.',
      syncRatio: 'SYNC RATIO',
      initializing: 'INITIALIZING',
      synchronizing: 'SYNCHRONIZING',
      syncComplete: 'SYNC COMPLETE',
      resonance: 'RESONANCE / CODEX',
      settingsTitle: 'Customize your startup screen',
      settingsDescription: 'Customize two images and texts below. Leave blank to hide text.',
      avatarLabel: 'First half · Avatar',
      avatarHint: 'Square images look best',
      changeAvatar: 'Change Avatar',
      artworkLabel: 'Second half · Background',
      artworkHint: 'Recommend 3:2 landscape · Auto generates contours',
      changeArtwork: 'Change Background',
      introTitleLabel: 'First half · Title below avatar',
      introTitleHint: 'Max 16 characters',
      introCaptionLabel: 'First half · Small text below title',
      introCaptionHint: 'Max 48 characters',
      artworkSubtitleLabel: 'Second half · Subtitle below background',
      artworkSubtitleHint: 'Max 60 characters',
      wallpaperStrengthLabel: 'Codex wallpaper opacity',
      wallpaperStrengthHint: 'After animation ends, background continues to cover the window. 0% disables it.',
      settingsStatus: 'Images are saved locally on this machine, never uploaded. Click 「Save & Preview」to apply.',
      resetDefaults: 'Reset to default images & text',
      previewImages: 'Save & Preview',
      restoreAppearance: 'Disable styling, restore official Codex',
      generatingContours: 'Generating line art contours for new background…',
      preparingAvatar: 'Preparing avatar image…',
      imageReady: 'Images ready. Click 「Save & Preview」to apply.',
      saving: 'Saving…',
      saveFailed: 'Save failed, previous settings retained: ',
      defaultsRestored: 'Restored default images, text, and opacity. Click 「Save & Preview」to apply.',
      defaultTitle: 'Codex Theme',
      defaultCaption: 'CODEX INITIALIZE / TYPE-0',
      defaultSubtitle: 'Welcome back, have a productive day ahead~'
    },
    zh: {
      headingSequence: 'STARTUP SEQUENCE / 01',
      connectionEstablished: 'CONNECTION ESTABLISHED',
      endHeadline: '幽灵，已在你身边。',
      endDescription: '12 秒开场预览结束',
      launchShowing: '正在显示 Codex…',
      launchWaiting: '正在等待 Codex 打开…',
      launchUnavailableTitle: '暂时无法打开 Codex',
      replay: '再看一次',
      pause: '暂停',
      resume: '继续',
      finished: '已结束',
      skip: 'CLICK / ESC TO SKIP',
      imageSettings: '图片设置',
      assetError: '动画素材加载失败，请确认 assets 文件夹完整。',
      syncRatio: 'SYNC RATIO',
      initializing: 'INITIALIZING',
      synchronizing: 'SYNCHRONIZING',
      syncComplete: 'SYNC COMPLETE',
      resonance: 'RESONANCE / AEMEATH',
      settingsTitle: '换成你喜欢的画面',
      settingsDescription: '自定义两张图片和下方文字，留空可隐藏对应文字。',
      avatarLabel: '前半段头像',
      avatarHint: '方形图片效果最好',
      changeAvatar: '更换头像',
      artworkLabel: '后半段背景',
      artworkHint: '推荐 3:2 横图 · 自动生成线稿',
      changeArtwork: '更换背景',
      introTitleLabel: '前半段 · 头像下方标题',
      introTitleHint: '最多 16 字',
      introCaptionLabel: '前半段 · 标题下方小字',
      introCaptionHint: '最多 48 字',
      artworkSubtitleLabel: '后半段 · 背景下方字幕',
      artworkSubtitleHint: '最多 60 字',
      wallpaperStrengthLabel: 'Codex 背景显现程度',
      wallpaperStrengthHint: '启动结束后，背景继续铺满窗口。0% 为不显示背景。',
      settingsStatus: '图片保存在本机，不会上传。修改后点击「保存并预览」；关闭则放弃本次修改。',
      resetDefaults: '恢复默认图片与文字',
      previewImages: '保存并预览',
      restoreAppearance: '关闭美化，恢复 Codex 外观',
      generatingContours: '正在为新背景生成线稿…',
      preparingAvatar: '正在准备头像…',
      imageReady: '图片已准备好，点击「保存并预览」应用。',
      saving: '正在保存…',
      saveFailed: '保存失败，原设置已保留：',
      defaultsRestored: '已选用默认图片、文字和背景显现程度，点击「保存并预览」应用。',
      defaultTitle: '飞行雪绒',
      defaultCaption: 'CODEX INITIALIZE / TYPE-0',
      defaultSubtitle: '幽灵来到…你身边～'
    }
  };

  let currentLang = 'vi';
  function detectLang() {
    if (window.AEMEATH_LANG && I18N[window.AEMEATH_LANG]) return window.AEMEATH_LANG;
    try {
      const stored = localStorage.getItem('codex-theme-lang');
      if (stored && I18N[stored]) return stored;
    } catch (_) {}
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('vi')) return 'vi';
    if (nav.startsWith('zh')) return 'zh';
    return 'en';
  }
  currentLang = detectLang();
  window.currentLang = currentLang;

  function t(key) {
    return I18N[currentLang]?.[key] || I18N.en[key] || I18N.vi[key] || key;
  }

  function setLanguage(lang) {
    if (!I18N[lang]) lang = 'vi';
    currentLang = lang;
    window.currentLang = lang;
    document.documentElement.lang = lang;
    try { localStorage.setItem('codex-theme-lang', lang); } catch (_) {}
    const sel = $('#lang-select');
    if (sel && sel.value !== lang) sel.value = lang;

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n.replace(/^animation\./, '');
      const val = t(k);
      if (val) el.textContent = val;
    });
    updateButton();
  }

  const send = (action, details={}) => {
    if(native)window.webkit.messageHandlers.launcher.postMessage(action);
    if(embedded){const data={type:'aemeath-boot',action,...details};if(window.AEMEATH_EXTERNAL)window.AEMEATH_SEND(data);else window.parent.postMessage(data,'*');}
  };
  const particles = Array.from({length: reduced ? 0 : 14}, (_, i) => {
    const node = document.createElement('i'); node.className = 'particle';
    const size = i % 4 === 0 ? 3 : 1.5;
    Object.assign(node.style, {width:`${size}px`,height:`${size}px`,left:`${(i*37+7)%100}%`,top:`${(i*23+17)%100}%`});
    $('.particles').appendChild(node); return node;
  });
  const milestones = [[0,0],[.12,.06],[.35,.41],[.56,.76],[.66,.924],[.72,.97],[.77,1],[1,1]];
  function progress(t) {
    const p = t / duration;
    for (let i=1;i<milestones.length;i++) {
      if (p <= milestones[i][0]) {
        const [a,x] = milestones[i-1], [b,y] = milestones[i];
        return x+(y-x)*smooth((p-a)/(b-a));
      }
    }
    return 1;
  }
  // Split the selected image's own contours once; no particles are allocated per frame.
  const canvas = $('.line-art'), ctx = canvas.getContext('2d');
  function preparePaths(raw) { return raw.map(points => {
    let total=0;
    for(let i=1;i<points.length;i++)total+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
    const full=new Path2D();points.forEach((point,i)=>i?full.lineTo(...point):full.moveTo(...point));
    return {points,total,full};
  }); }
  function prepareFragments(paths){
    const result=[],span=Math.max(18,paths.reduce((sum,path)=>sum+path.total,0)/1400);
    const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
    function add(points){
      if(points.length<2)return;
      const first=points[0],last=points[points.length-1],x=(first[0]+last[0])/2,y=(first[1]+last[1])/2;
      const seed=result.length+1;
      result.push({x,y,points:points.map(point=>[point[0]-x,point[1]-y]),
        sx:(x+(noise(seed)-.5)*440+1536)%1536,sy:(y+(noise(seed+271)-.5)*300+1024)%1024,
        angle:(noise(seed+563)-.5)*Math.PI*2,seed:noise(seed+811)*Math.PI*2});
    }
    for(const path of paths){
      if(path.points.length<2)continue;
      let chunk=[path.points[0]],used=0;
      for(let i=1;i<path.points.length;i++){
        let a=path.points[i-1];const b=path.points[i];
        let length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        while(length>0&&used+length>=span){
          const ratio=(span-used)/length,cut=[a[0]+(b[0]-a[0])*ratio,a[1]+(b[1]-a[1])*ratio];
          chunk.push(cut);add(chunk);chunk=[cut];a=cut;used=0;
          length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        }
        if(length>0){chunk.push(b);used+=length;}
      }
      add(chunk);
    }
    return result;
  }
  let paths=preparePaths(window.CONTOUR_PATHS || []),fragments=prepareFragments(paths);
  let identityTexture=null,identityPieces=[];
  function releaseIdentityTexture(){
    if(identityTexture)identityTexture.width=identityTexture.height=0;
    identityTexture=null;identityPieces=[];
  }
  function prepareIdentityTexture(){
    releaseIdentityTexture();
    const bounds=canvas.getBoundingClientRect(),scale=Math.max(bounds.width/1536,bounds.height/1024);
    if(!scale)return;
    const ox=bounds.left+(bounds.width-1536*scale)/2,oy=bounds.top+(bounds.height-1024*scale)/2;
    const rect=node=>{const r=node.getBoundingClientRect();return {x:(r.left-ox)/scale,y:(r.top-oy)/scale,w:r.width/scale,h:r.height/scale};};
    const texture=document.createElement('canvas');texture.width=1536;texture.height=1024;
    const ink=texture.getContext('2d');ink.imageSmoothingEnabled=false;
    const avatar=rect($('.avatar')),radar=rect($('.radar')),border=rect($('.avatar-frame'));
    const cx=radar.x+radar.w/2,cy=radar.y+radar.h/2;
    ink.strokeStyle='#a397a0';ink.lineWidth=1.3;
    ink.beginPath();ink.arc(cx,cy,radar.w*.4425,0,Math.PI*2);ink.stroke();
    ink.setLineDash([9,12]);ink.globalAlpha=.4;
    ink.beginPath();ink.arc(cx,cy,radar.w*.3775,0,Math.PI*2);ink.stroke();ink.setLineDash([]);ink.globalAlpha=.8;
    for(let i=0;i<60;i++){
      const a=i*Math.PI/30,r0=radar.w*(i%5===0?.4525:.46),r1=radar.w*(i%5===0?.4975:.48);
      ink.beginPath();ink.moveTo(cx+Math.sin(a)*r0,cy-Math.cos(a)*r0);ink.lineTo(cx+Math.sin(a)*r1,cy-Math.cos(a)*r1);ink.stroke();
    }
    ink.globalAlpha=1;ink.strokeRect(border.x,border.y,border.w,border.h);
    ink.drawImage($('.avatar'),avatar.x,avatar.y,avatar.w,avatar.h);
    const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
    const pieces=[],rows=7,cols=7;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const x=radar.x+radar.w*c/cols,y=radar.y+radar.h*r/rows;
      const w=radar.w/cols,h=radar.h/rows,seed=r*cols+c+1;
      pieces.push({x,y,w,h,
        tx:(x+(noise(seed)-.5)*520+1536)%1536,ty:(y+(noise(seed+193)-.5)*360+1024)%1024,
        angle:(noise(seed+389)-.5)*Math.PI*2.4,scale:.25+noise(seed+617)*.65,
        alpha:.45+noise(seed+823)*.55,delay:noise(seed+997)*.35});
    }
    identityTexture=texture;identityPieces=pieces;
  }
  function drawIdentityPieces(p){
    if(!identityTexture)return;
    identityPieces.forEach(piece=>{
      const t=clamp((p-piece.delay)/(1-piece.delay));
      if(t<=0)return;
      const ease=smooth(t),x=piece.x+(piece.tx-piece.x)*ease,y=piece.y+(piece.ty-piece.y)*ease;
      const angle=piece.angle*ease,scale=1+(piece.scale-1)*ease,alpha=piece.alpha*(1-ease);
      if(alpha<=.01)return;
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+piece.w/2,y+piece.h/2);
      ctx.rotate(angle);ctx.scale(scale,scale);
      ctx.drawImage(identityTexture,piece.x,piece.y,piece.w,piece.h,-piece.w/2,-piece.h/2,piece.w,piece.h);
      ctx.restore();
    });
  }
  let lastTrace=-1;
  function trace(sweep,t,dissolve=0){
    if(sweep===lastTrace)return;
    lastTrace=sweep;ctx.clearRect(0,0,1536,1024);
    if(sweep>=.999){
      ctx.strokeStyle='#dccad8';ctx.lineWidth=1.2;ctx.globalAlpha=.85;
      paths.forEach(path=>ctx.stroke(path.full));
      return;
    }
    const waveX=sweep*1696-80;
    fragments.forEach(f=>{
      const d=(f.x-waveX)/220;
      if(d>1)return;
      if(d<0){
        ctx.save();ctx.translate(f.x,f.y);ctx.strokeStyle='#dccad8';ctx.lineWidth=1.2;
        ctx.globalAlpha=d<-.5?.85:.85+.15*Math.sin((d+.5)*Math.PI*2);
        ctx.beginPath();f.points.forEach((pt,i)=>i?ctx.lineTo(...pt):ctx.moveTo(...pt));
        ctx.stroke();ctx.restore();return;
      }
      const ease=smooth(1-d),x=f.sx+(f.x-f.sx)*ease,y=f.sy+(f.y-f.sy)*ease;
      const angle=f.angle*(1-ease),alpha=ease*.85;
      if(alpha<=.02)return;
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);
      ctx.strokeStyle='#f3dbe8';ctx.lineWidth=1.2+.6*(1-ease);ctx.globalAlpha=alpha;
      ctx.beginPath();f.points.forEach((pt,i)=>i?ctx.lineTo(...pt):ctx.moveTo(...pt));
      ctx.stroke();ctx.restore();
    });
    if(dissolve>0)drawIdentityPieces(dissolve);
  }

  function render(t) {
    const s = t / 1000;
    const p = progress(t);
    const color = smooth((s - 7.2) / .42);
    const dissolve = clamp((s - 4.18) / .56);

    intro.style.opacity=String(reduced?1-smooth((s-4.18)/.56):s<4.18?1:0);
    $('.identity').style.opacity=String(smooth((s-1.05)/.65));
    $('.identity').style.transform=`translate(-50%,-43%) scale(${.94+.06*smooth((s-1.05)/.65)})`;
    const beat=reduced?0:Math.pow((1-Math.cos(Math.max(0,s-1.05)*Math.PI*2/1.08))/2,2);
    $('.avatar-frame').style.transform=`translateY(${-4*beat}px) scale(${1+.025*beat})`;
    $('.pulse').style.opacity=String(1-smooth((s-1.15)/.5));
    document.querySelectorAll('.pulse i').forEach((ring,i)=>{
      const phase=(s*.75+i*.5)%1;
      ring.style.transform=`scale(${.25+phase*.9})`;ring.style.opacity=String((1-phase)*.8);
    });
    $('.dashed').style.transformOrigin='200px 200px';$('.dashed').style.transform=`rotate(${reduced?0:s*16}deg)`;
    $('.boot-title').style.clipPath=`inset(0 ${(1-clamp((s-1.9)/.7))*100}% 0 0)`;
    $('.boot-caption').style.opacity=String(smooth((s-2.5)/.35)*.5);
    $('.wave').style.transform=`scaleY(${reduced?1:.6+Math.sin(s*6)*.4})`;
    $('.boot-grid').style.opacity=String(smooth((s-.8)/.6)*(1-color));
    $('.boot-corners').style.opacity=String(smooth((s-.8)/.6)*(1-color));
    $('.boot-logs').style.opacity=String((1-color)*.55);
    document.querySelectorAll('.boot-logs div').forEach((line,i)=>line.style.opacity=String(smooth((s-.15-i*.38)/.3)));
    const assembling=clamp((s-5.08)/2.02);
    if(s>=4.18&&s<7.43)trace(reduced?1:assembling,s-4.18,reduced?1:dissolve);
    if(s>=4.74&&identityTexture)releaseIdentityTexture();
    canvas.style.opacity=String((reduced?smooth((s-4.18)/.56):s>=4.18?1:0)*(1-color));
    canvas.dataset.dissolve=dissolve.toFixed(3);
    art.style.opacity=String(color);
    art.style.transform=reduced?'none':`scale(${1+.012*smooth((s-7.42)/3.58)})`;
    $('.shade').style.opacity=String(color);
    hud.style.opacity=String(smooth((s-7.24)/.45));
    $('.sync-fill').style.transform=`scaleX(${p})`;
    sweep.style.opacity=reduced?'0':String(Math.sin(clamp((s-7.18)/.8)*Math.PI)*.1);
    sweep.style.transform=`translateX(${(-60+clamp((s-7.18)/.8)*120)}%)`;
    particles.forEach((node,i)=>{
      node.style.opacity=String(color*(.12+.28*(.5+.5*Math.sin(s*.9+i))));
      node.style.transform=`translate(${Math.sin(s*.4+i)*8}px,${-s*(2+i%3)}px)`;
    });
    subtitle.style.opacity=String(smooth((s-7.6)/.4)*(1-smooth((s-10.65)/.25)));
    if(Math.abs(t-lastUI)>60 || t===0 || t>=duration) {
      lastUI=t;
      $('#ratio').textContent=`${(p*100).toFixed(2).padStart(5,'0')}%`;
      $('.sync-phase').textContent=s<6.5?t('initializing'):p<1?t('synchronizing'):t('syncComplete');
      $('#timecode').textContent=`00:${String(Math.floor(s)).padStart(2,'0')}:${String(Math.floor(s%1*30)).padStart(2,'0')}`;
      slider.value=String(s);
      $('#elapsed').innerHTML=`${s.toFixed(1).padStart(4,'0')} <span>/ 12.0s</span>`;
      root.dataset.elapsed=s.toFixed(2);
      root.dataset.stage=s>=11?'shutter':s<1.15?'pulse':s<4.18?'identity':s<4.74?'dispersing':s<5.08?'scattered':s<7.18?'drawing':s<7.43?'colorize':'portrait';
    }
  }

  function updateButton() {
    pause.textContent = playing ? t('pause') : t('resume');
    root.dataset.playing = String(playing);
  }
  function stop() { playing=false; cancelAnimationFrame(frame); frame=0; updateButton(); }
  function finish(skipped=false) {
    stop(); elapsed=duration; render(elapsed); completed=true;
    root.classList.add('finished'); root.dataset.completed='true';
    pause.textContent=t('finished'); pause.disabled=true;
    $('.end-description').textContent=mode==='launch'?t('launchShowing'):skipped?t('skipPreview'):t('previewEnd');
    send('complete');
  }
  function tick(now) {
    if(!playing)return;
    elapsed=Math.min(duration,now-origin); render(elapsed);
    if(elapsed>=duration){finish();return;}
    frame=requestAnimationFrame(tick);
  }
  function warmIdentityTexture(){
    if(reduced||identityTexture||elapsed>=4740)return;
    const restoreTime=elapsed;
    render(4179);prepareIdentityTexture();drawIdentityPieces(0);
    ctx.clearRect(0,0,1536,1024);lastTrace=-1;render(restoreTime);
  }
  function play() {
    if(!loaded)return;
    if(elapsed>=duration)elapsed=0;
    warmIdentityTexture();
    completed=false; root.classList.remove('finished'); root.dataset.completed='false';
    pause.disabled=false; origin=performance.now()-elapsed; playing=true;updateButton();
    cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);
  }
  function replay(){revealed=false;hiddenPause=false;stop();elapsed=0;lastUI=-Infinity;render(0);play();}
  $('#replay').addEventListener('click',replay);$('.replay-end').addEventListener('click',replay);
  pause.addEventListener('click',()=>{hiddenPause=false;if(playing){elapsed=Math.min(duration,performance.now()-origin);stop();render(elapsed);}else play();});
  $('.skip').addEventListener('click',()=>finish(true));
  slider.addEventListener('input',()=>{hiddenPause=false;stop();elapsed=Number(slider.value)*1000;warmIdentityTexture();if(elapsed>=duration){finish();return;}lastUI=-Infinity;completed=false;root.classList.remove('finished');root.dataset.completed='false';pause.disabled=false;render(elapsed);});
  window.addEventListener('keydown',event=>{
    if((event.metaKey||event.ctrlKey)&&event.altKey&&event.code==='KeyB'){
      event.preventDefault();if(!$('#settings-dialog').open)openSettings();return;
    }
    if($('#settings-dialog').open)return;
    if(event.key==='Escape'){event.preventDefault();finish(true);}
    if(event.code==='Space'&&event.target.tagName!=='INPUT'&&event.target.tagName!=='BUTTON'){event.preventDefault();pause.click();}
  });
  document.addEventListener('visibilitychange',()=>{
    if(native)return;
    if(document.hidden&&playing){elapsed=Math.min(duration,performance.now()-origin);hiddenPause=true;stop();}
    else if(!document.hidden&&hiddenPause&&!completed){hiddenPause=false;play();}
  });
  window.launcherUI={
    openSettings,
    beginLaunch(){mode='launch';document.body.classList.add('launch-mode');replay();},
    error(message){stop();scene.style.opacity='0';root.classList.add('finished');$('.end-description').textContent=message;$('.eyebrow').textContent='LAUNCH UNAVAILABLE';$('.end-screen h1').textContent=t('launchUnavailableTitle');},
    waiting(){ $('.end-description').textContent=t('launchWaiting'); }
  };
  if(native){
    document.body.classList.add('native');
  }
  function ready(){if(loaded)return;loaded=true;render(0);send('ready');if(window.AEMEATH_OPEN_SETTINGS||new URLSearchParams(location.search).has('settings'))openSettings();else play();}
  function failed(){stop();$('#asset-error').hidden=false;send('assetError');}
  let savedImages={},pendingImages={},busy=false;
  const settings=$('#settings-dialog'),status=$('#settings-status');
  const textFields=[
    {key:'introTitle',input:'#intro-title',target:'.boot-title',fallbackKey:'defaultTitle',limit:16},
    {key:'introCaption',input:'#intro-caption',target:'.boot-caption',fallbackKey:'defaultCaption',limit:48},
    {key:'artworkSubtitle',input:'#artwork-subtitle',target:'#subtitle',fallbackKey:'defaultSubtitle',limit:60}
  ];
  const textValue=(images,field)=>typeof images[field.key]==='string'?images[field.key].slice(0,field.limit):t(field.fallbackKey);
  function thumbnails(){
    $('#avatar-preview').src=pendingImages.avatar||assets.avatar;
    $('#artwork-preview').src=pendingImages.artwork||assets.artwork;
    $('#wallpaper-strength').value=String(pendingImages.wallpaperStrength??42);
    $('#wallpaper-value').textContent=$('#wallpaper-strength').value+'%';
    for(const field of textFields)$(field.input).value=textValue(pendingImages,field);
  }
  function openSettings(){
    if(mode==='launch'||settings.open)return;
    hiddenPause=false;stop();pendingImages={...savedImages};thumbnails();
    status.textContent=t('settingsStatus');
    settings.returnValue='';settings.showModal();send('settings-open');
  }
  function setBusy(value){
    busy=value;
    settings.querySelectorAll('input,button,select').forEach(node=>node.disabled=value);
  }
  async function applyImages(images){
    releaseIdentityTexture();
    art.src=images.artwork||assets.artwork;$('.avatar').src=images.avatar||assets.avatar;
    await Promise.all([art,$('.avatar')].map(img=>img.decode()));
    paths=preparePaths(images.contours||window.CONTOUR_PATHS||[]);fragments=prepareFragments(paths);lastTrace=-1;
    if(!paths.length)throw new Error('contours data missing');
    for(const field of textFields)$(field.target).textContent=textValue(images,field);
    $('.boot-title').classList.toggle('long-title',Array.from(textValue(images,textFields[0])).length>6);
    send('background',{image:art.src,strength:images.wallpaperStrength??42});
  }
  for(const field of textFields)$(field.input).addEventListener('input',event=>{
    pendingImages[field.key]=event.target.value.slice(0,field.limit);
  });
  $('#wallpaper-strength').addEventListener('input',event=>{
    pendingImages.wallpaperStrength=Number(event.target.value);
    $('#wallpaper-value').textContent=event.target.value+'%';
  });
  $('#image-settings').addEventListener('click',openSettings);
  if(window.AEMEATH_EXTERNAL){$('#restore-appearance').hidden=false;$('#restore-appearance').addEventListener('click',()=>send('restore'));}
  settings.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  settings.addEventListener('close',()=>{
    if(!loaded)return;
    if(settings.returnValue==='preview'){send('settings-close');replay();}
    else finish(true);
  });
  for(const kind of ['avatar','artwork'])$('#'+kind+'-file').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    setBusy(true);status.textContent=kind==='artwork'?t('generatingContours'):t('preparingAvatar');
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    try{
      pendingImages={...pendingImages,...await window.imageSettings.importImage(file,kind,currentLang)};thumbnails();
      status.textContent=t('imageReady');
    }catch(error){status.textContent=error.message;}
    finally{setBusy(false);event.target.value='';}
  });

  const langSelect = $('#lang-select');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', () => {
      const newLang = langSelect.value;
      const oldDefaults = ['defaultTitle', 'defaultCaption', 'defaultSubtitle'].map(k => t(k));
      setLanguage(newLang);
      pendingImages.lang = newLang;
      // If user hadn't changed text fields from old defaults, update them to new language defaults
      textFields.forEach((field, i) => {
        if (!pendingImages[field.key] || pendingImages[field.key] === oldDefaults[i]) {
          pendingImages[field.key] = t(field.fallbackKey);
          $(field.input).value = pendingImages[field.key];
          $(field.target).textContent = pendingImages[field.key];
        }
      });
      status.textContent = t('settingsStatus');
    });
  }

  $('#reset-images').addEventListener('click',()=>{
    pendingImages={lang:currentLang};thumbnails();
    status.textContent=t('defaultsRestored');
  });
  $('#preview-images').addEventListener('click',async()=>{
    setBusy(true);status.textContent=t('saving');
    try{
      pendingImages.lang = currentLang;
      await applyImages(pendingImages);await window.imageSettings.save(pendingImages);savedImages={...pendingImages};settings.close('preview');
    }catch(error){await applyImages(savedImages);status.textContent=t('saveFailed')+error.message;}
    finally{setBusy(false);}
  });

  // Initial load
  setLanguage(currentLang);
  window.imageSettings.load().catch(()=>({})).then(async images=>{
    savedImages=images;
    if(images.lang && I18N[images.lang]) setLanguage(images.lang);
    try{await applyImages(images);}catch{savedImages={};await applyImages({});}
    ready();
  }).catch(failed);
})();
