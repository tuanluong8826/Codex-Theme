/* Local image import and one-time contour tracing. Supports vi, en, zh. No network or app privileges. */
(function (scope) {
  'use strict';

  const I18N_MESSAGES = {
    vi: {
      tooBig: 'Vui lòng chọn ảnh nhỏ hơn 30 MB.',
      badType: 'Vui lòng chọn PNG, JPEG hoặc WebP.',
      fewContours: 'Hình nền quá ít đường viền nét, vui lòng chọn ảnh có chi tiết rõ ràng hơn.',
      readError: 'Không thể đọc hình ảnh, vui lòng thử lại ảnh khác.',
      saveFailed: 'Lưu cài đặt thất bại.'
    },
    en: {
      tooBig: 'Please select an image smaller than 30 MB.',
      badType: 'Please select a PNG, JPEG, or WebP image.',
      fewContours: 'Too few contours found. Please select an image with sharper edges.',
      readError: 'Image cannot be read. Please try another image.',
      saveFailed: 'Failed to save settings.'
    },
    zh: {
      tooBig: '请选择小于 30 MB 的图片。',
      badType: '请选择 PNG、JPEG 或 WebP 图片。',
      fewContours: '图片轮廓太少，请选择边缘更清晰的背景。',
      readError: '图片无法读取，请换一张图片。',
      saveFailed: '保存失败。'
    }
  };

  function getMsg(key, lang) {
    const l = lang && I18N_MESSAGES[lang] ? lang : (scope.currentLang || 'vi');
    return I18N_MESSAGES[l]?.[key] || I18N_MESSAGES.en[key] || key;
  }

  function vectorize(rgba, width, height) {
    const count = width * height, gray = new Float32Array(count), mag = new Float32Array(count), angle = new Uint8Array(count), edge = new Uint8Array(count);
    for (let i = 0; i < count; i++) gray[i] = rgba[i * 4] * .299 + rgba[i * 4 + 1] * .587 + rgba[i * 4 + 2] * .114;
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const gx = -gray[i - width - 1] + gray[i - width + 1] - 2 * gray[i - 1] + 2 * gray[i + 1] - gray[i + width - 1] + gray[i + width + 1];
      const gy = -gray[i - width - 1] - 2 * gray[i - width] - gray[i - width + 1] + gray[i + width - 1] + 2 * gray[i + width] + gray[i + width + 1];
      mag[i] = Math.hypot(gx, gy);
      const a = (Math.atan2(gy, gx) * 180 / Math.PI + 180) % 180;
      angle[i] = a < 22.5 || a >= 157.5 ? 0 : a < 67.5 ? 1 : a < 112.5 ? 2 : 3;
    }
    const pairs = [[1, -1], [width + 1, -width - 1], [width, -width], [width - 1, -width + 1]];
    for (let y = 2; y < height - 2; y++) for (let x = 2; x < width - 2; x++) {
      const i = y * width + x, [a, b] = pairs[angle[i]];
      if (mag[i] > 32 && mag[i] >= mag[i + a] && mag[i] > mag[i + b]) edge[i] = 1;
    }
    const neighbors = [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1];
    const visited = new Uint8Array(count), paths = [];
    function walk(start) {
      let current = start, previous = -1; const points = [];
      while (current >= 0 && !visited[current]) {
        visited[current] = 1; points.push([current % width, Math.floor(current / width)]);
        let next = -1, best = -Infinity;
        for (const d of neighbors) {
          const n = current + d; if (n < 0 || n >= count || !edge[n] || visited[n]) continue;
          const dx = n % width - current % width, dy = Math.floor(n / width) - Math.floor(current / width);
          const score = previous < 0 ? mag[n] : dx * (current % width - previous % width) + dy * (Math.floor(current / width) - Math.floor(previous / width));
          if (score > best) { best = score; next = n; }
        }
        previous = current; current = next;
      }
      if (points.length >= 8) paths.push(points.filter((_, i) => i % 2 === 0 || i === points.length - 1).map(([x, y]) => [Math.round(x * 1536 / width), Math.round(y * 1024 / height)]));
    }
    for (let i = 0; i < count; i++) if (edge[i] && !visited[i] && neighbors.reduce((n, d) => n + (edge[i + d] || 0), 0) <= 1) walk(i);
    for (let i = 0; i < count; i++) if (edge[i] && !visited[i]) walk(i);
    return paths.sort((a, b) => b.length - a.length).slice(0, 1200);
  }

  if (typeof module !== 'undefined') { module.exports = { vectorize }; return; }

  async function database(action, value) {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open('aemeath-startup-images', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('settings');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result, tx = db.transaction('settings', action === 'read' ? 'readonly' : 'readwrite'), store = tx.objectStore('settings');
        const request = action === 'read' ? store.get('images') : store.put(value, 'images');
        tx.oncomplete = () => { db.close(); resolve(action === 'read' ? request.result || {} : value); };
        tx.onerror = tx.onabort = () => { db.close(); reject(tx.error || new Error(getMsg('saveFailed'))); };
      };
    });
  }

  async function importImage(file, kind, lang) {
    if (file.size > 30 * 1024 * 1024) throw new Error(getMsg('tooBig', lang));
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error(getMsg('badType', lang));
    const url = URL.createObjectURL(file), img = new Image();
    try {
      img.src = url; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = kind === 'avatar' ? 512 : 1536; canvas.height = kind === 'avatar' ? 512 : 1024;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#08060d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      const image = canvas.toDataURL('image/png');
      if (kind === 'avatar') return { avatar: image };
      const small = document.createElement('canvas'); small.width = 768; small.height = 512;
      const smallCtx = small.getContext('2d', { willReadFrequently: true }); smallCtx.drawImage(canvas, 0, 0, 768, 512);
      const contours = vectorize(smallCtx.getImageData(0, 0, 768, 512).data, 768, 512);
      if (!contours.length) throw new Error(getMsg('fewContours', lang));
      return { artwork: image, contours };
    } catch (error) {
      throw new Error(error.message || getMsg('readError', lang));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  scope.imageSettings = { load: () => database('read'), save: images => database('write', images), importImage };
})(typeof window === 'undefined' ? {} : window);
