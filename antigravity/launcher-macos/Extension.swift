import AppKit

final class ExtensionDelegate: NSObject, NSApplicationDelegate {
    var process: Process?
    
    private var lang: String {
        let preferred = Locale.preferredLanguages.first?.lowercased() ?? "vi"
        if preferred.hasPrefix("vi") { return "vi" }
        if preferred.hasPrefix("zh") { return "zh" }
        return "en"
    }

    private func localizedText(_ key: String) -> String {
        switch (lang, key) {
        case ("vi", "notFound"): return "Không tìm thấy ứng dụng Antigravity (/Applications/Antigravity.app)."
        case ("vi", "runningText"): return "Antigravity đang mở. Bạn có muốn áp dụng theme & phát hoạt ảnh không?"
        case ("vi", "restartBtn"): return "Khởi động lại"
        case ("vi", "openExisting"): return "Áp dụng cho cửa sổ hiện tại"
        case ("vi", "ok"): return "Đồng ý"
        case ("vi", "launchFailed"): return "Khởi chạy thất bại"
        case ("vi", "runError"): return "Không thể chạy tiện ích: "

        case ("zh", "notFound"): return "没有找到 Antigravity 应用 (/Applications/Antigravity.app)。"
        case ("zh", "runningText"): return "Antigravity 正在运行中。是否应用主题并播放启动动画？"
        case ("zh", "restartBtn"): return "重新启动"
        case ("zh", "openExisting"): return "应用到现有窗口"
        case ("zh", "ok"): return "知道了"
        case ("zh", "launchFailed"): return "启动失败"
        case ("zh", "runError"): return "无法运行扩展："

        default:
            switch key {
            case "notFound": return "Antigravity application not found (/Applications/Antigravity.app)."
            case "runningText": return "Antigravity is currently running. Apply theme and play startup animation?"
            case "restartBtn": return "Restart"
            case "openExisting": return "Apply to Existing Window"
            case "ok": return "OK"
            case "launchFailed": return "Launch failed"
            case "runError": return "Could not launch extension: "
            default: return key
            }
        }
    }

    func fail(_ text: String) {
        NSApp.activate(ignoringOtherApps: true)
        let alert = NSAlert()
        alert.messageText = "Antigravity Theme"
        alert.informativeText = text
        alert.addButton(withTitle: localizedText("ok"))
        alert.runModal()
        NSApp.terminate(nil)
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        var appURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.google.antigravity")
        if appURL == nil {
            let defaultURL = URL(fileURLWithPath: "/Applications/Antigravity.app")
            if FileManager.default.fileExists(atPath: defaultURL.path) {
                appURL = defaultURL
            }
        }
        guard let app = appURL else {
            fail(localizedText("notFound"))
            return
        }

        let running = NSRunningApplication.runningApplications(withBundleIdentifier: "com.google.antigravity")
        var shouldRestart = false
        if let existing = running.first {
            NSApp.activate(ignoringOtherApps: true)
            let alert = NSAlert()
            alert.messageText = "Antigravity"
            alert.informativeText = localizedText("runningText")
            alert.addButton(withTitle: localizedText("openExisting"))
            alert.addButton(withTitle: localizedText("restartBtn"))
            let response = alert.runModal()
            if response == .alertSecondButtonReturn {
                shouldRestart = true
                existing.terminate()
                for _ in 0..<30 {
                    if existing.isTerminated { break }
                    Thread.sleep(forTimeInterval: 0.1)
                }
            } else {
                existing.unhide()
                existing.activate(options: [.activateAllWindows])
            }
        }

        if running.isEmpty || shouldRestart {
            let conf = NSWorkspace.OpenConfiguration()
            conf.activates = true
            NSWorkspace.shared.openApplication(at: app, configuration: conf) { _, _ in }
        }

        let runner = Process(), output = Pipe()
        runner.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        let scriptPath = Bundle.main.resourceURL!.appendingPathComponent("web/extension/run.mjs").path
        runner.arguments = ["node", scriptPath, "--antigravity"]
        var env = ProcessInfo.processInfo.environment
        env["DREAMSKIN_LANG"] = lang
        runner.environment = env
        runner.standardOutput = output
        runner.standardError = output
        runner.terminationHandler = { [weak self] task in
            let data = output.fileHandleForReading.readDataToEndOfFile()
            let message = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            DispatchQueue.main.async {
                if task.terminationStatus == 0 {
                    NSApp.terminate(nil)
                } else {
                    self?.fail(message.isEmpty ? (self?.localizedText("launchFailed") ?? "Failed") : message)
                }
            }
        }
        process = runner
        do {
            try runner.run()
        } catch {
            fail(localizedText("runError") + error.localizedDescription)
        }
    }
}

let app = NSApplication.shared
let delegate = ExtensionDelegate()
app.delegate = delegate
app.run()
