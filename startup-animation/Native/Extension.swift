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
        case ("vi", "notFound"): return "Không tìm thấy ứng dụng ChatGPT / Codex chính thức."
        case ("vi", "sigFail"): return "Kiểm tra chữ ký ứng dụng không thành công."
        case ("vi", "runningText"): return "ChatGPT đang mở. Bạn có muốn khởi động lại để phát hoạt ảnh khởi động không?"
        case ("vi", "restartBtn"): return "Khởi động lại"
        case ("vi", "openExisting"): return "Mở cửa sổ hiện tại"
        case ("vi", "ok"): return "Đồng ý"
        case ("vi", "launchFailed"): return "Khởi chạy thất bại"
        case ("vi", "runError"): return "Không thể chạy tiện ích: "

        case ("zh", "notFound"): return "没有找到官方 Codex / ChatGPT 应用。"
        case ("zh", "sigFail"): return "应用签名检查未通过，未启动扩展。"
        case ("zh", "runningText"): return "ChatGPT 正在运行中。是否重新启动以播放启动动画？"
        case ("zh", "restartBtn"): return "重新启动"
        case ("zh", "openExisting"): return "切换到现有窗口"
        case ("zh", "ok"): return "知道了"
        case ("zh", "launchFailed"): return "启动失败"
        case ("zh", "runError"): return "无法运行扩展："

        default:
            switch key {
            case "notFound": return "Official Codex / ChatGPT application not found."
            case "sigFail": return "Application signature verification failed."
            case "runningText": return "ChatGPT is currently running. Restart to play the startup animation?"
            case "restartBtn": return "Restart"
            case "openExisting": return "Switch to Existing Window"
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
        alert.messageText = "Codex"
        alert.informativeText = text
        alert.addButton(withTitle: localizedText("ok"))
        alert.runModal()
        NSApp.terminate(nil)
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        guard let app = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.openai.codex") else {
            fail(localizedText("notFound"))
            return
        }
        let running = NSRunningApplication.runningApplications(withBundleIdentifier: "com.openai.codex")
        if CommandLine.arguments.contains("--probe") {
            let result: [String: Any] = ["application": app.path, "running": running.map { Int($0.processIdentifier) }]
            print(String(data: try! JSONSerialization.data(withJSONObject: result), encoding: .utf8)!)
            NSApp.terminate(nil)
            return
        }

        if let existing = running.first {
            NSApp.activate(ignoringOtherApps: true)
            let alert = NSAlert()
            alert.messageText = "Codex"
            alert.informativeText = localizedText("runningText")
            alert.addButton(withTitle: localizedText("restartBtn"))
            alert.addButton(withTitle: localizedText("openExisting"))
            let response = alert.runModal()
            if response == .alertFirstButtonReturn {
                existing.terminate()
                for _ in 0..<30 {
                    if existing.isTerminated { break }
                    Thread.sleep(forTimeInterval: 0.1)
                }
            } else {
                existing.unhide()
                existing.activate(options: [.activateAllWindows])
                NSApp.terminate(nil)
                return
            }
        }

        // Validate the signed app before executing its bundled runtime.
        let check = Process()
        check.executableURL = URL(fileURLWithPath: "/usr/bin/codesign")
        check.arguments = ["--verify", "--deep", "--strict", app.path]
        do {
            try check.run()
            check.waitUntilExit()
        } catch {
            fail(localizedText("runError") + error.localizedDescription)
            return
        }
        guard check.terminationStatus == 0 else {
            fail(localizedText("sigFail"))
            return
        }

        let runner = Process(), output = Pipe()
        runner.executableURL = app.appendingPathComponent("Contents/Resources/cua_node/bin/node")
        runner.arguments = [
            Bundle.main.resourceURL!.appendingPathComponent("web/extension/run.mjs").path,
            "--bundle",
            app.path
        ]
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
