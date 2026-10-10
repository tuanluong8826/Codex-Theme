using System.Diagnostics;
using System.Globalization;
using System.Windows.Forms;

namespace Codex.Launcher;

internal static class Program
{
    private static string DetectLanguage()
    {
        var env = Environment.GetEnvironmentVariable("DREAMSKIN_LANG")?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(env))
        {
            if (env.StartsWith("vi")) return "vi";
            if (env.StartsWith("zh")) return "zh";
            return "en";
        }
        var culture = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.ToLowerInvariant();
        if (culture == "vi") return "vi";
        if (culture == "zh") return "zh";
        return "en";
    }

    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        var lang = DetectLanguage();

        string appDir = AppDomain.CurrentDomain.BaseDirectory;
        string scriptPath = Path.Combine(appDir, "windows", "scripts", "start-dream-skin.ps1");
        if (!File.Exists(scriptPath))
        {
            string parentScript = Path.Combine(appDir, "..", "windows", "scripts", "start-dream-skin.ps1");
            if (File.Exists(parentScript))
            {
                scriptPath = Path.GetFullPath(parentScript);
                appDir = Path.GetFullPath(Path.Combine(appDir, ".."));
            }
        }

        if (!File.Exists(scriptPath))
        {
            string notFoundMsg = lang switch
            {
                "vi" => "Không tìm thấy thư mục Codex-Theme hoặc script khởi động Windows.",
                "zh" => "未找到 Codex-Theme 目录或 Windows 启动脚本。",
                _ => "Codex-Theme directory or Windows startup script not found."
            };
            MessageBox.Show(notFoundMsg, "Codex Launcher", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        var runningProcs = Process.GetProcessesByName("ChatGPT")
            .Concat(Process.GetProcessesByName("Codex"))
            .ToList();

        if (runningProcs.Count > 0)
        {
            string runningMsg = lang switch
            {
                "vi" => "ChatGPT đang mở. Bạn có muốn khởi động lại để phát hoạt ảnh khởi động và áp dụng giao diện không?",
                "zh" => "ChatGPT 正在运行中。是否重新启动以应用主题并播放启动动画？",
                _ => "ChatGPT is currently running. Restart to apply the theme and play the startup animation?"
            };

            var result = MessageBox.Show(runningMsg, "Codex Launcher", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (result == DialogResult.Yes)
            {
                foreach (var p in runningProcs)
                {
                    try { p.Kill(); p.WaitForExit(3000); } catch { }
                }
            }
            else
            {
                return;
            }
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = $"-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"{scriptPath}\" -StartupAnimation",
            WorkingDirectory = appDir,
            UseShellExecute = false,
            CreateNoWindow = true,
            WindowStyle = ProcessWindowStyle.Hidden
        };

        try
        {
            Process.Start(startInfo);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Error: {ex.Message}", "Codex Launcher", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
