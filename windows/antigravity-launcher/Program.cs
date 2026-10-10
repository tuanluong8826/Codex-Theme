using System.Diagnostics;
using System.Globalization;
using System.Windows.Forms;

namespace Antigravity.Launcher;

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
        string scriptPath = Path.Combine(appDir, "antigravity", "scripts", "start-antigravity-skin-windows.ps1");
        if (!File.Exists(scriptPath))
        {
            string parentScript = Path.Combine(appDir, "..", "antigravity", "scripts", "start-antigravity-skin-windows.ps1");
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
                "vi" => "Không tìm thấy thư mục Codex-Theme hoặc script khởi động Windows cho Antigravity.",
                "zh" => "未找到 Codex-Theme 目录或 Antigravity Windows 启动脚本。",
                _ => "Codex-Theme directory or Antigravity Windows startup script not found."
            };
            MessageBox.Show(notFoundMsg, "Antigravity Launcher", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        var runningProcs = Process.GetProcessesByName("Antigravity").ToList();

        if (runningProcs.Count > 0)
        {
            string runningMsg = lang switch
            {
                "vi" => "Antigravity đang mở. Bạn có muốn kích hoạt hoạt ảnh khởi động và áp dụng theme không?",
                "zh" => "Antigravity 正在运行中。是否播放启动动画并应用主题？",
                _ => "Antigravity is currently running. Play startup animation and apply theme?"
            };

            var result = MessageBox.Show(runningMsg, "Antigravity Launcher", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (result != DialogResult.Yes)
            {
                return;
            }
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = $"-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"{scriptPath}\"",
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
            MessageBox.Show($"Error: {ex.Message}", "Antigravity Launcher", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
