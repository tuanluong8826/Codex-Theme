// Frontend script for Codex Theme Antigravity UI Extension

const I18N = {
  vi: {
    title: "Giao diện & Hoạt ảnh",
    subtitle: "Tùy biến hình nền, hiệu ứng kính và hoạt ảnh 12s cho Antigravity",
    themeEnable: "Bật giao diện Dream Skin",
    themeDesc: "Áp dụng hình nền và hiệu ứng kính mờ cho Antigravity",
    wallpaperTitle: "Hình nền (Wallpaper)",
    opacity: "Độ hiển thị hình nền",
    blur: "Độ mờ kính (Glass Blur)",
    animTitle: "Hoạt ảnh khởi động (12s Sequence)",
    animToggle: "Phát hoạt ảnh khi mở app",
    animDesc: "Hiệu ứng radar, hud quét hạt và lời chào",
    soundToggle: "Âm thanh khởi động",
    soundDesc: "Bật tiếng chào và âm thanh công nghệ",
    btnPreview: "✨ Phát thử hoạt ảnh ngay bây giờ",
    langTitle: "Ngôn ngữ hiển thị (Language)",
    btnSave: "💾 Lưu cài đặt",
    saved: "Đã lưu cài đặt thành công!"
  },
  en: {
    title: "Theme & Startup Animation",
    subtitle: "Customize wallpaper, glassmorphism, and 12s animation for Antigravity",
    themeEnable: "Enable Dream Skin Theme",
    themeDesc: "Apply background wallpaper and translucent glassmorphism",
    wallpaperTitle: "Background Wallpaper",
    opacity: "Wallpaper Opacity",
    blur: "Glass Blur",
    animTitle: "Startup Animation (12s Sequence)",
    animToggle: "Play animation on launch",
    animDesc: "Sci-fi radar, particle scanlines, and greeting",
    soundToggle: "Startup Sound Effects",
    soundDesc: "Enable audio greeting and tech sound effects",
    btnPreview: "✨ Preview Animation Now",
    langTitle: "Display Language",
    btnSave: "💾 Save Preferences",
    saved: "Preferences saved successfully!"
  },
  zh: {
    title: "主题与启动动画",
    subtitle: "自定义 Antigravity 壁纸、玻璃拟物效果与 12 秒启动动画",
    themeEnable: "启用 Dream Skin 皮肤",
    themeDesc: "为 Antigravity 应用背景壁纸与半透明磨砂效果",
    wallpaperTitle: "背景壁纸",
    opacity: "壁纸不透明度",
    blur: "磨砂模糊度 (Glass Blur)",
    animTitle: "启动动画 (12 秒序列)",
    animToggle: "启动时播放动画",
    animDesc: "雷达波形、粒子扫描线与问候语",
    soundToggle: "启动音效",
    soundDesc: "开启语音问候与科技音效",
    btnPreview: "✨ 立即预览启动动画",
    langTitle: "显示语言",
    btnSave: "💾 保存设置",
    saved: "设置已成功保存！"
  }
};

let currentWallpaper = "assets/artwork.jpg";

function applyLanguage(lang) {
  const t = I18N[lang] || I18N.vi;
  document.getElementById("txt-title").textContent = t.title;
  document.getElementById("txt-subtitle").textContent = t.subtitle;
  document.getElementById("txt-theme-enable").textContent = t.themeEnable;
  document.getElementById("txt-theme-desc").textContent = t.themeDesc;
  document.getElementById("txt-wallpaper-title").textContent = t.wallpaperTitle;
  document.getElementById("txt-opacity").textContent = t.opacity;
  document.getElementById("txt-blur").textContent = t.blur;
  document.getElementById("txt-anim-title").textContent = t.animTitle;
  document.getElementById("txt-anim-toggle").textContent = t.animToggle;
  document.getElementById("txt-anim-desc").textContent = t.animDesc;
  document.getElementById("txt-sound-toggle").textContent = t.soundToggle;
  document.getElementById("txt-sound-desc").textContent = t.soundDesc;
  document.getElementById("btn-preview").textContent = t.btnPreview;
  document.getElementById("txt-lang-title").textContent = t.langTitle;
  document.getElementById("btn-save").textContent = t.btnSave;
}

async function init() {
  const chkEnabled = document.getElementById("chk-enabled");
  const rngOpacity = document.getElementById("rng-opacity");
  const valOpacity = document.getElementById("val-opacity");
  const rngBlur = document.getElementById("rng-blur");
  const valBlur = document.getElementById("val-blur");
  const chkAnimation = document.getElementById("chk-animation");
  const chkSound = document.getElementById("chk-sound");
  const selLang = document.getElementById("sel-lang");
  const btnSave = document.getElementById("btn-save");
  const btnPreview = document.getElementById("btn-preview");
  const statusMsg = document.getElementById("status-msg");
  const presetBtns = document.querySelectorAll(".preset-btn");

  rngOpacity.addEventListener("input", () => {
    valOpacity.textContent = rngOpacity.value + "%";
  });

  rngBlur.addEventListener("input", () => {
    valBlur.textContent = rngBlur.value + "px";
  });

  selLang.addEventListener("change", () => {
    applyLanguage(selLang.value);
  });

  presetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      presetBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const preset = btn.dataset.preset;
      if (preset === "gothic") {
        currentWallpaper = "macos/presets/preset-gothic-void-crusade/background.jpg";
      } else if (preset === "arina") {
        currentWallpaper = "macos/presets/preset-arina-hashimoto/background.jpg";
      } else {
        currentWallpaper = "startup-animation/assets/artwork.jpg";
      }
    });
  });

  // Load preferences from sidecar backend
  try {
    const res = await window.sidecar.fetch("/api/preferences");
    if (res.ok) {
      const prefs = await res.json();
      chkEnabled.checked = prefs.enabled !== false;
      const op = Math.round((prefs.wallpaperOpacity ?? 0.90) * 100);
      rngOpacity.value = op;
      valOpacity.textContent = op + "%";
      const bl = prefs.glassBlur ?? 16;
      rngBlur.value = bl;
      valBlur.textContent = bl + "px";
      chkAnimation.checked = prefs.startupAnimation !== false;
      chkSound.checked = prefs.soundEnabled !== false;
      if (prefs.language) {
        selLang.value = prefs.language;
        applyLanguage(prefs.language);
      }
    }
  } catch (err) {
    console.warn("Could not fetch preferences:", err);
  }

  btnSave.addEventListener("click", async () => {
    const payload = {
      enabled: chkEnabled.checked,
      wallpaper: currentWallpaper,
      wallpaperOpacity: Number(rngOpacity.value) / 100,
      glassBlur: Number(rngBlur.value),
      startupAnimation: chkAnimation.checked,
      soundEnabled: chkSound.checked,
      language: selLang.value
    };

    try {
      const res = await window.sidecar.fetch("/api/preferences", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        statusMsg.textContent = (I18N[selLang.value] || I18N.vi).saved;
        statusMsg.hidden = false;
        setTimeout(() => { statusMsg.hidden = true; }, 3000);
      }
    } catch (e) {
      alert("Lỗi khi lưu: " + e.message);
    }
  });

  btnPreview.addEventListener("click", async () => {
    try {
      await window.sidecar.fetch("/api/preview", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
