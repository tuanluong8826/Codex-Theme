<div align="center">

# Codex Theme & Startup Animation

### Mang lại diện mạo sống động và hiệu ứng khởi động tinh tế cho ứng dụng Codex Desktop

**Tích hợp toàn diện Codex Dream Skin và Codex Startup Animation: Vừa tuỳ biến hình nền, giao diện Safe CSS, vừa sở hữu đoạn hoạt ảnh khởi động 12 giây cuốn hút. Hỗ trợ đầy đủ macOS và Windows, đa ngôn ngữ Tiếng Việt, English và 中文.**

[![Nền tảng](https://img.shields.io/badge/h%E1%BB%87%20%C4%91i%E1%BB%81u%20h%C3%A0nh-macOS%20%7C%20Windows-blue)](#)
[![Ngôn ngữ](https://img.shields.io/badge/ng%C3%B4n%20ng%E1%BB%AF-Ti%E1%BA%BFng%20Vi%E1%BB%87t%20%7C%20English%20%7C%20%E4%B8%AD%E6%96%87-success)](#)
[![Giấy phép](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

[Tiếng Việt](README.vi.md) | [English](README.md) | [中文](README.zh-CN.md)

</div>

---

## 🌟 Tính năng nổi bật

1. **Hiệu ứng khởi động 12 giây (Startup Animation)**:
   - Chuỗi hoạt ảnh mượt mà: Xung nhịp tải ban đầu → Radar xoay cùng ảnh đại diện → Các mảnh ghép tan biến → Vẽ viền nét chuyển động từ trái sang phải → Hình nền nghệ thuật bung tỏa màu sắc → Thu gọn mượt mà để bước vào giao diện Codex.
   - Hỗ trợ đổi ngôn ngữ trực tiếp (Tiếng Việt, English, 中文).
   - Tùy chỉnh ảnh đại diện, hình nền, tiêu đề mở đầu, phụ đề và độ mờ nền theo sở thích cá nhân.
   - Nhấn **Esc** hoặc nút **Bỏ qua** bất kỳ lúc nào để vào thẳng giao diện làm việc.

2. **Hệ thống giao diện tuỳ biến (Codex Dream Skin)**:
   - Thay đổi hình nền tùy thích, giữ nguyên toàn bộ nút bấm, thanh bên và tính năng gốc của Codex.
   - Hệ thống CSS an toàn (Safe CSS Validator) bảo vệ tính toàn vẹn của ứng dụng.
   - Thư viện theme trực tuyến và quản lý giao diện tiện lợi qua Menu Bar (macOS) hoặc Khay hệ thống System Tray (Windows).

3. **Hỗ trợ đầy đủ 2 nền tảng lớn**:
   - **macOS**: Hỗ trợ Apple Silicon (M1/M2/M3/M4) và Intel, tương thích macOS 13+.
   - **Windows**: Hỗ trợ Windows 10/11 x64, bộ cài đặt Inno Setup song ngữ Anh - Việt - Trung.

4. **Đa ngôn ngữ (Languages)**:
   - Thư mục trung tâm `languages/` (`vi.json`, `en.json`, `zh.json`).
   - Giao diện cài đặt và hoạt ảnh tự động nhận diện ngôn ngữ hệ thống hoặc cho phép người dùng tự do chuyển đổi.

---

## 🚀 Hướng dẫn sử dụng nhanh

### Trên macOS

1. Hãy mở ứng dụng Codex chính thức một lần rồi thoát hẳn (**⌘Q**).
2. **Khởi chạy kèm hoạt ảnh khởi động**:
   - Nhấp đúp vào: `Start Codex (Dream Skin + Animation).command`
   - Hoặc chạy lệnh trong Terminal:
     ```sh
     ./macos/scripts/start-dream-skin-macos.sh --prompt-restart --startup-animation
     ```
3. **Khởi chạy giao diện không kèm hoạt ảnh**:
   - Nhấp đúp vào: `Start Codex (Dream Skin).command`
4. **Xem thử hoạt ảnh (không cần mở Codex)**:
   - Nhấp đúp vào: `Preview Startup Animation.command`
   - Hoặc mở trực tiếp file `startup-animation/index.html` trên trình duyệt.

### Trên Windows

1. Đóng hoàn toàn ứng dụng Codex đang chạy.
2. **Khởi chạy kèm hoạt ảnh khởi động**:
   - Nhấp đúp vào: `Start-Codex-With-Animation.bat`
   - Hoặc chạy qua PowerShell:
     ```powershell
     powershell -ExecutionPolicy Bypass -File .\windows\scripts\start-dream-skin.ps1 -PromptRestart -StartupAnimation
     ```
3. **Khởi chạy giao diện thông thường**:
   - Nhấp đúp vào: `Start-Codex.bat`
4. **Xem thử hoạt ảnh**:
   - Nhấp đúp vào: `Preview-Startup-Animation.bat`

---

## 🎨 Tùy chỉnh hình ảnh & chữ khởi động

Trong lúc hoạt ảnh đang chạy hoặc sau khi kết thúc, nhấn tổ hợp phím:
- **⌘⌥B** (trên macOS)
- **Ctrl+Alt+B** (trên Windows)
- Hoặc bấm nút **Cài đặt hình ảnh** ở góc phải màn hình.

| Mục | Chi tiết |
| --- | --- |
| **🌐 Ngôn ngữ** | Chọn **Tiếng Việt**, **English** hoặc **中文**. |
| **Ảnh đại diện** | PNG / JPEG / WebP, tự động căn giữa khung vuông 512×512. |
| **Hình nền** | PNG / JPEG / WebP (khuyên dùng tỉ lệ 3:2), tự động tạo đường viền nét vẽ vi tính. |
| **Tiêu đề & Chú thích** | Tùy chỉnh chữ nửa đầu và nửa sau, để trống nếu muốn ẩn. |
| **Độ rõ hình nền** | Mặc định 42% (chọn 0% nếu chỉ muốn xem hoạt ảnh mà không giữ hình nền sau đó). |
| **Lưu và xem thử** | Lưu cài đặt vào bộ nhớ máy và phát lại hoạt ảnh ngay lập tức. |

> **Bảo mật**: Toàn bộ hình ảnh và chữ được lưu trực tiếp trong IndexedDB trên máy của bạn, không tải lên bất kỳ máy chủ nào.

---

## 📁 Cấu trúc dự án

```text
Codex-Theme/
├── languages/                 # Trung tâm ngôn ngữ i18n (vi.json, en.json, zh.json, index.js)
├── startup-animation/         # Động cơ hoạt ảnh khởi động 12s
│   ├── index.html             # Giao diện hoạt ảnh và bảng cài đặt đa ngôn ngữ
│   ├── animation.js           # Xử lý dòng thời gian, radar, mảnh ghép, đường nét
│   ├── style.css              # Phong cách CSS hiển thị
│   ├── image-settings.js      # Xử lý nhập ảnh & thuật toán trích xuất viền nét
│   ├── assets/                # Hình ảnh & dữ liệu nét vẽ mặc định
│   └── extension/             # Tệp cầu nối CDP tiêm hoạt ảnh vào Codex
├── macos/                     # Bộ khởi chạy, Menu Bar app và script cho macOS
├── windows/                   # Bộ khởi chạy, System Tray app và script cho Windows
├── runtime/                   # CSS lõi (dream-skin.css) & bộ tiêm renderer
├── tools/                     # Công cụ đồng bộ tài nguyên và kiểm thử
├── *.command                  # Các phím tắt tiện lợi cho người dùng macOS
└── *.bat                      # Các phím tắt tiện lợi cho người dùng Windows
```

---

## 🔒 Cơ chế an toàn

- Đây là công cụ mở rộng bên ngoài phi chính thức, **hoàn toàn không sửa đổi** tệp ứng dụng gốc `.app`, `app.asar` hay thư mục `WindowsApps`.
- Không can thiệp vào mô hình AI, tài khoản hay tính năng trò chuyện của Codex.
- Giao tiếp qua cổng gỡ lỗi cục bộ loopback `127.0.0.1` của Chromium.
- Khi muốn quay về nguyên bản, chỉ cần thoát hẳn ứng dụng và mở lại bằng biểu tượng Codex chính thức.

---

## 🏷️ Nguồn gốc & Bản quyền (Credits & Upstream Sources)

Dự án này là sản phẩm tích hợp và phát triển từ hai dự án mã nguồn mở tuyệt vời:

1. **[Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin)** của tác giả **[Fei-Away](https://github.com/Fei-Away)**:
   - Động cơ giao diện, cơ chế tuỳ biến hình nền, Safe CSS validator và ứng dụng Menu Bar (macOS) / System Tray (Windows).
2. **[codex-startup-animation](https://github.com/panding999/codex-startup-animation)** của tác giả **[panding999](https://github.com/panding999)**:
   - Ý tưởng và hiệu ứng khởi động 12 giây đậm chất điện ảnh (radar xoay, xung nhịp đại diện, phân rã mảnh ghép và vẽ viền nét chuyển màu).

Chân thành cảm ơn các tác giả gốc đã cống hiến những sản phẩm mã nguồn mở xuất sắc!

