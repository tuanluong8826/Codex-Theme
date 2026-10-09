function Resolve-DreamSkinLanguage {
  param(
    [string]$Language = $env:DREAMSKIN_LANG,
    [string]$StateRoot = ''
  )
  $requested = if ($null -eq $Language) { '' } else { $Language.Trim() }
  if ($requested -match '^(?i:vi)(?:-|_|$)' -or $requested -ieq 'vietnamese') { return 'vi-VN' }
  if ($requested -match '^(?i:zh)(?:-|_|$)' -or $requested -ieq 'chinese') { return 'zh-CN' }
  if ($requested -match '^(?i:en)(?:-|_|$)' -or $requested -ieq 'english') { return 'en-US' }

  if ($StateRoot) {
    $preferencePath = Join-Path $StateRoot 'language.txt'
    if (Test-Path -LiteralPath $preferencePath -PathType Leaf) {
      try {
        $item = Get-Item -LiteralPath $preferencePath -Force -ErrorAction Stop
        if (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0 -and
          $item.Length -le 16) {
          $saved = [System.IO.File]::ReadAllText($item.FullName).Trim()
          if ($saved -ceq 'vi-VN' -or $saved -ceq 'zh-CN' -or $saved -ceq 'en-US') { return $saved }
        }
      } catch {}
    }
  }

  $culture = [System.Globalization.CultureInfo]::CurrentUICulture.Name
  if ($culture -match '^(?i:vi)(?:-|_|$)') { return 'vi-VN' }
  if ($culture -match '^(?i:zh)(?:-|_|$)') { return 'zh-CN' }
  return 'en-US'
}

function Set-DreamSkinLanguage {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('system', 'en-US', 'zh-CN', 'vi-VN')]
    [string]$Language,
    [Parameter(Mandatory = $true)][string]$StateRoot
  )
  $root = [System.IO.Path]::GetFullPath($StateRoot)
  if (-not (Test-Path -LiteralPath $root -PathType Container)) {
    [void][System.IO.Directory]::CreateDirectory($root)
  }
  $preferencePath = Join-Path $root 'language.txt'
  if ($Language -ceq 'system') {
    Remove-Item -LiteralPath $preferencePath -Force -ErrorAction SilentlyContinue
    return
  }
  $temporary = Join-Path $root ('.language.' + [Guid]::NewGuid().ToString('N') + '.tmp')
  try {
    [System.IO.File]::WriteAllText(
      $temporary,
      $Language + [Environment]::NewLine,
      [System.Text.UTF8Encoding]::new($false)
    )
    Move-Item -LiteralPath $temporary -Destination $preferencePath -Force
  } finally {
    Remove-Item -LiteralPath $temporary -Force -ErrorAction SilentlyContinue
  }
}

function Get-DreamSkinLanguagePreference {
  param([Parameter(Mandatory = $true)][string]$StateRoot)
  if ($env:DREAMSKIN_LANG -match '^(?i:vi)(?:-|_|$)' -or $env:DREAMSKIN_LANG -ieq 'vietnamese') {
    return 'vi-VN'
  }
  if ($env:DREAMSKIN_LANG -match '^(?i:zh)(?:-|_|$)' -or $env:DREAMSKIN_LANG -ieq 'chinese') {
    return 'zh-CN'
  }
  if ($env:DREAMSKIN_LANG -match '^(?i:en)(?:-|_|$)' -or $env:DREAMSKIN_LANG -ieq 'english') {
    return 'en-US'
  }
  $preferencePath = Join-Path $StateRoot 'language.txt'
  if (Test-Path -LiteralPath $preferencePath -PathType Leaf) {
    try {
      $saved = [System.IO.File]::ReadAllText($preferencePath).Trim()
      if ($saved -ceq 'vi-VN' -or $saved -ceq 'zh-CN' -or $saved -ceq 'en-US') { return $saved }
    } catch {}
  }
  return 'system'
}

function Get-DreamSkinText {
  param(
    [Parameter(Mandatory = $true)][string]$Key,
    [string]$Language = '',
    [object[]]$FormatArguments = @()
  )
  $resolved = Resolve-DreamSkinLanguage -Language $Language
  $catalog = @{
    'vi-VN' = @{
      StatusPaused = 'Trạng thái: Đã tạm dừng'; StatusRunning = 'Trạng thái: Đang chạy'; StatusStopped = 'Trạng thái: Chưa chạy'
      Apply = 'Áp dụng hoặc áp dụng lại'; Resume = 'Tiếp tục skin'; Pause = 'Tạm dừng skin'
      ChangeBackground = 'Đổi hình nền'; BackgroundTitle = 'Chọn hình nền Codex Dream Skin'
      BackgroundUpdated = 'Đã cập nhật hình nền.'; ImportZip = 'Nhập tệp ZIP giao diện...'
      ImportTitle = 'Chọn tệp ZIP giao diện Codex Dream Skin'; SaveCurrent = 'Lưu giao diện hiện tại'
      SavePrompt = 'Tên giao diện:'; SaveTitle = 'Lưu giao diện Codex Dream Skin'; Saved = 'Đã lưu: {0}'
      SavedThemes = 'Giao diện đã lưu'; NoSavedThemes = 'Chưa có giao diện đã lưu'; Applied = 'Đã áp dụng: {0}'
      ThemeWindowHint = 'Chọn một giao diện đã lưu, sau đó nhấn Áp dụng. Trạng thái chỉ đổi sau khi bộ vẽ xác nhận giao diện.'
      HideToTray = 'Thu nhỏ xuống khay'
      ApplyNotConfirmed = 'Áp dụng giao diện chưa được xác nhận. Có thể đã bị hủy; hãy áp dụng lại để thử.'
      ApplyFailed = 'Áp dụng giao diện thất bại ({0}). Hãy áp dụng lại để thử.'
      ApplyWaiting = 'Đang chờ hoàn tất áp dụng giao diện. Kết quả chưa được xác nhận.'
      ApplyCouldNotStart = 'Không thể bắt đầu áp dụng giao diện. Hãy áp dụng lại.'
      OpenThemes = 'Mở thư mục themes'; OpenImages = 'Mở thư mục hình ảnh'; CheckUpdate = 'Kiểm tra cập nhật...'
      Gallery = 'Thư viện Theme Gallery'; Studio = 'Online Studio'; OpenSite = 'Mở DreamSkin.cc'
      LaunchAtLogin = 'Khởi động cùng Windows'; Restore = 'Khôi phục hoàn toàn Codex'; Exit = 'Thoát khay hệ thống'
      Language = 'Ngôn ngữ / Language'; LanguageSystem = 'Hệ thống / System'; LanguageVietnamese = 'Tiếng Việt'; LanguageEnglish = 'English'; LanguageChinese = '中文'
      ApplyStarted = 'Đã bắt đầu áp dụng skin'; Applying = 'Đang áp dụng skin...'
      ResumeStarted = 'Đã bắt đầu kích hoạt lại skin'; Reapplying = 'Đang áp dụng lại skin...'
      ThemeExists = 'Giao diện đã tồn tại: {0}. Không ghi đè.'
      ThemeUpdated = 'Đã cập nhật giao diện đã lưu: {0}. Giao diện hiện tại không đổi.'
      ThemeImported = 'Đã nhập: {0}. Giao diện hiện tại không đổi.'
      NewIdentifier = ' Mã định danh mới: {0}.'; NameCollision = ' Đã tồn tại giao diện cùng tên.'
      CssValidated = ' theme.css đã vượt qua kiểm tra Safe CSS cục bộ và sẽ áp dụng cùng giao diện này.'
      SignatureIgnored = ' manifest.sig là tệp dự phòng và được bỏ qua ở phiên bản này.'
      CleanupWarning = ' Giao diện đã được lưu, nhưng không thể dọn thư mục sao lưu cũ. Hãy khởi động lại client sau và kiểm tra nhật ký.'
      ImageFilter = 'Tệp hình ảnh|*.png;*.jpg;*.jpeg;*.webp|Tất cả tệp|*.*'
      PauseNoSession = 'Đã ghi nhận tạm dừng, nhưng không kết nối được phiên nào. Cửa sổ hiện tại có thể vẫn hiển thị skin.'
      PauseSucceeded = 'Đã tạm dừng skin.'; PauseFailed = 'Đã ghi nhận tạm dừng, nhưng gỡ bỏ skin trực tiếp thất bại. Thử lại tạm dừng hoặc khôi phục Codex.'
      UpdateTitle = 'Cập nhật Codex Dream Skin'; UpdateAvailable = 'Đã có phiên bản Codex Dream Skin {0}.'
      UpdateQuestion = 'Mở trang tải về GitHub?'; UpToDate = 'Codex Dream Skin {0} đang là phiên bản mới nhất.'
      UpdateFailed = 'Không thể kiểm tra cập nhật.'
      RestartPrompt = 'Codex cần khởi động lại một lần để bật Dream Skin. Dữ liệu chưa lưu có thể bị mất. Khởi động lại ngay?'
      LaunchCancelled = 'Đã hủy khởi chạy Dream Skin; Codex không bị thay đổi.'
      RestoreClose = 'Khôi phục sẽ đóng Codex, gỡ bỏ Dream Skin và phiên CDP của nó, sau đó mở lại ứng dụng chính thức. Tiếp tục?'
      RestoreCloseNoRelaunch = 'Khôi phục sẽ đóng Codex và gỡ bỏ Dream Skin cùng phiên CDP của nó. Tiếp tục?'
      RestoreCancelled = 'Đã hủy khôi phục; không có trạng thái hay cấu hình nào bị thay đổi.'
      CommunitySuccess = 'Giao diện “{0}” đã vượt qua kiểm tra tải về, SHA-256, gói giao diện và Safe CSS và hiện đang hoạt động trong Codex.'
      CommunityCleanup = 'Giao diện đã được áp dụng, nhưng không thể dọn thư mục sao lưu cũ. Giao diện mới sẽ không bị khôi phục lại. Khởi động lại client sau và kiểm tra nhật ký.'
      CommunityConfirmTitle = 'Xác nhận áp dụng giao diện một chạm'; CommunityConfirm = 'Tải về và áp dụng “{0}” từ DreamSkin.cc?'
      CommunityAuthor = 'Tác giả: {0}'; CommunityVersion = 'Phiên bản: {0} · {1} MiB'; CommunityHash = 'SHA-256: {0}'
      CommunitySafety = 'Client chỉ kết nối đến API chính thức cố định và kiểm tra lại dung lượng tải, SHA-256, ZIP, manifest và Safe CSS. Codex có thể khởi động lại khi áp dụng, và dữ liệu chưa lưu có thể bị mất. Nội dung giao diện không bao giờ được thực thi dưới dạng lệnh.'
      RecoveryVerified = 'Giao diện mới không hoạt động. Giao diện trước đó đã được áp dụng lại và vượt qua kiểm tra hiển thị.'
      RecoveryFailed = 'Giao diện mới không hoạt động. Quá trình tự động khôi phục hoặc kiểm tra hiển thị của giao diện trước đó chưa hoàn thành. Mở lại client và kiểm tra.'
      RecoverySuperseded = 'Phát hiện thao tác giao diện khác. Client giữ lại lựa chọn mới hơn và không ghi đè.'
      RecoveryUnconfirmed = 'Giao diện mới chưa vào trạng thái hoạt động được xác nhận.'
      RecoveryWorkRetained = 'Thư mục làm việc khôi phục được giữ lại và không bị xóa.'; DownloadCleaned = 'Các tệp tải tạm thời đã được dọn sạch.'
      RollbackSnapshot = 'Bản chụp khôi phục: {0}'; CommunityApplyFailed = 'Áp dụng giao diện một chạm thất bại.'
      CommunityStartCdpLaunchFailed = 'Không thể khởi động ứng dụng Codex chính thức cùng phiên gỡ lỗi.'
      CommunityStartCdpDirectAccessDenied = 'Windows từ chối khởi chạy trực tiếp tệp thực thi Store đã xác thực sau khi kích hoạt gói bỏ mất tham số gỡ lỗi.'
      CommunityStartCdpEndpointUnavailable = 'Bản dựng Codex này không mở điểm cuối gỡ lỗi cục bộ đã xác thực.'
      CommunityStartPortUnavailable = 'Không có cổng gỡ lỗi cục bộ đã xác thực khả dụng.'
      CommunityStartStateReconciliationFailed = 'Dream Skin không thể điều hòa phiên cục bộ trước đó một cách an toàn.'
      CommunityStartInjectorFailed = 'Trình dựng Dream Skin cục bộ không thể khởi động.'
      CommunityStartRendererVerificationFailed = 'Giao diện đang hoạt động không vượt qua kiểm tra hiển thị.'
      CommunityStartSuperseded = 'Một giao diện mới hơn hoặc thao tác tạm dừng đã thay thế lần áp dụng này.'
      CommunityStartInternalFailure = 'Dream Skin không thể hoàn thành thao tác khởi động cục bộ.'
      CommunityStartTimedOut = 'Khởi động Dream Skin và kiểm tra hiển thị quá thời gian. Quá trình khôi phục ngầm vẫn đang chạy; tệp giao diện đang hoạt động được giữ nguyên.'
      CommunityStartInvalidResult = 'Khởi động Dream Skin không trả về kết quả hợp lệ.'
      CommunityStartAppearanceRestored = 'Cài đặt giao diện bị thay đổi bởi lần thử này đã được khôi phục.'
      CommunityStartAppearanceConflictPreserved = 'Các thay đổi giao diện mới hơn đã được giữ lại.'
      CommunityStartAppearanceBlocked = 'Khôi phục giao diện bị chặn vì không thể xác nhận Codex đã đóng hoặc cấu hình đã thay đổi lại.'
      CommunityStartAppearancePreservedRendered = 'Cài đặt giao diện được giữ lại vì giao diện đã hiển thị thành công.'
    }
    'en-US' = @{
      StatusPaused = 'Status: Paused'; StatusRunning = 'Status: Running'; StatusStopped = 'Status: Stopped'
      Apply = 'Apply or reapply'; Resume = 'Resume skin'; Pause = 'Pause skin'
      ChangeBackground = 'Change background image'; BackgroundTitle = 'Choose a Codex Dream Skin background image'
      BackgroundUpdated = 'Background image updated.'; ImportZip = 'Import theme ZIP...'
      ImportTitle = 'Choose a Codex Dream Skin theme ZIP'; SaveCurrent = 'Save current theme'
      SavePrompt = 'Theme name:'; SaveTitle = 'Save Codex Dream Skin theme'; Saved = 'Saved: {0}'
      SavedThemes = 'Saved themes'; NoSavedThemes = 'No saved themes'; Applied = 'Applied: {0}'
      ThemeWindowHint = 'Choose a saved theme, then Apply. The status changes only after the renderer confirms the theme.'
      HideToTray = 'Hide to tray'
      ApplyNotConfirmed = 'Theme application was not confirmed. It may have been cancelled; apply again to retry.'
      ApplyFailed = 'Theme application failed ({0}). Apply again to retry.'
      ApplyWaiting = 'Waiting for theme application to finish. Result is not yet confirmed.'
      ApplyCouldNotStart = 'Theme application could not start. Apply again to retry.'
      OpenThemes = 'Open themes folder'; OpenImages = 'Open images folder'; CheckUpdate = 'Check for updates...'
      Gallery = 'Theme Gallery'; Studio = 'Online Studio'; OpenSite = 'Open DreamSkin.cc'
      LaunchAtLogin = 'Launch at login'; Restore = 'Fully restore Codex'; Exit = 'Exit tray'
      Language = 'Language / 语言'; LanguageSystem = 'System / 系统'; LanguageVietnamese = 'Tiếng Việt'; LanguageEnglish = 'English'; LanguageChinese = '中文'
      ApplyStarted = 'Skin apply started'; Applying = 'Applying skin...'
      ResumeStarted = 'Skin reapply started'; Reapplying = 'Reapplying skin...'
      ThemeExists = 'Theme already exists: {0}. No duplicate was written.'
      ThemeUpdated = 'Saved theme updated: {0}. The current theme did not change.'
      ThemeImported = 'Imported: {0}. The current theme did not change.'
      NewIdentifier = ' New identifier: {0}.'; NameCollision = ' A theme with the same name already exists.'
      CssValidated = ' theme.css passed local Safe CSS validation and will apply with this theme.'
      SignatureIgnored = ' manifest.sig is reserved and ignored by this version.'
      CleanupWarning = ' The theme was saved, but an old backup folder could not be cleaned up. Restart the client later and check its logs.'
      ImageFilter = 'Image files|*.png;*.jpg;*.jpeg;*.webp|All files|*.*'
      PauseNoSession = 'Pause was recorded, but no active session could be reached. The current window may still show the skin.'
      PauseSucceeded = 'Skin paused.'; PauseFailed = 'Pause was recorded, but removing the live skin failed. Retry pause or fully restore Codex.'
      UpdateTitle = 'Codex Dream Skin Update'; UpdateAvailable = 'Codex Dream Skin {0} is available.'
      UpdateQuestion = 'Open the GitHub download page?'; UpToDate = 'Codex Dream Skin {0} is up to date.'
      UpdateFailed = 'Could not check for updates.'
      RestartPrompt = 'Codex must restart once to enable Dream Skin. Unsaved input may be lost. Restart now?'
      LaunchCancelled = 'Dream Skin launch was cancelled; Codex was not changed.'
      RestoreClose = 'Restore will close Codex, remove Dream Skin and its CDP session, then reopen the official app. Continue?'
      RestoreCloseNoRelaunch = 'Restore will close Codex and remove Dream Skin plus its CDP session. Continue?'
      RestoreCancelled = 'Restore was cancelled; no state or configuration was changed.'
      CommunitySuccess = 'Theme “{0}” passed download, SHA-256, package, and Safe CSS validation and is now active in Codex.'
      CommunityCleanup = 'The theme was applied, but an old backup folder could not be cleaned up. The new theme will not be rolled back. Restart the client later and check its logs.'
      CommunityConfirmTitle = 'Confirm one-click theme apply'; CommunityConfirm = 'Download and apply “{0}” from DreamSkin.cc?'
      CommunityAuthor = 'Author: {0}'; CommunityVersion = 'Version: {0} · {1} MiB'; CommunityHash = 'SHA-256: {0}'
      CommunitySafety = 'The client connects only to the fixed official API and revalidates download size, SHA-256, ZIP, manifest, and Safe CSS. Codex may restart while applying, and unsaved input may be lost. Theme content is never executed as commands.'
      RecoveryVerified = 'The new theme did not become active. The previous theme was reapplied and passed visible-render verification.'
      RecoveryFailed = 'The new theme did not become active. Automatic restore or render verification of the previous theme did not finish. Reopen the client and inspect it.'
      RecoverySuperseded = 'Another theme operation was detected. The client kept the newer selection and did not overwrite it.'
      RecoveryUnconfirmed = 'The new theme did not enter verified active state.'
      RecoveryWorkRetained = 'The recovery work folder was retained and not deleted.'; DownloadCleaned = 'Temporary download files were cleaned up.'
      RollbackSnapshot = 'Rollback snapshot: {0}'; CommunityApplyFailed = 'One-click theme apply failed.'
      CommunityStartCdpLaunchFailed = 'The official Codex app could not be started with a debugging session.'
      CommunityStartCdpDirectAccessDenied = 'Windows denied direct launch of the validated Store executable after package activation dropped the debugging argument.'
      CommunityStartCdpEndpointUnavailable = 'This Codex build did not expose a verified local debugging endpoint.'
      CommunityStartPortUnavailable = 'No verified local debugging port was available.'
      CommunityStartStateReconciliationFailed = 'Dream Skin could not reconcile the previous local session safely.'
      CommunityStartInjectorFailed = 'The local Dream Skin renderer could not start.'
      CommunityStartRendererVerificationFailed = 'The active theme did not pass visible renderer verification.'
      CommunityStartSuperseded = 'A newer theme or pause action superseded this apply.'
      CommunityStartInternalFailure = 'Dream Skin could not complete the local start operation.'
      CommunityStartTimedOut = 'Dream Skin start and visible verification timed out. Background recovery was left running; active-theme files were preserved.'
      CommunityStartInvalidResult = 'Dream Skin start did not return a valid bounded result.'
      CommunityStartAppearanceRestored = 'The appearance settings changed by this attempt were restored.'
      CommunityStartAppearanceConflictPreserved = 'Newer appearance edits were preserved.'
      CommunityStartAppearanceBlocked = 'Appearance recovery was blocked because Codex could not be confirmed closed or the config changed again.'
      CommunityStartAppearancePreservedRendered = 'The appearance settings were kept because the theme was already visibly rendered.'
    }
    'zh-CN' = @{
      StatusPaused = '状态：已暂停'; StatusRunning = '状态：运行中'; StatusStopped = '状态：未运行'
      Apply = '应用或重新应用'; Resume = '继续显示皮肤'; Pause = '暂停皮肤'
      ChangeBackground = '更换背景图'; BackgroundTitle = '选择 Codex Dream Skin 背景图'
      BackgroundUpdated = '背景图已更新。'; ImportZip = '导入主题 ZIP…'
      ImportTitle = '选择 Codex Dream Skin 主题 ZIP'; SaveCurrent = '保存当前主题'
      SavePrompt = '输入主题名称：'; SaveTitle = '保存 Codex Dream Skin 主题'; Saved = '已保存：{0}'
      SavedThemes = '已保存主题'; NoSavedThemes = '暂无已保存主题'; Applied = '已应用：{0}'
      ThemeWindowHint = '选择已保存主题后点击“应用”。只有渲染器确认主题生效后，状态才会变为已应用。'
      HideToTray = '隐藏到托盘'
      ApplyNotConfirmed = '未确认主题已生效，可能已取消；请重新点击应用。'
      ApplyFailed = '主题应用失败（{0}），请重新点击应用。'
      ApplyWaiting = '正在等待主题应用完成，尚未确认结果。'
      ApplyCouldNotStart = '无法开始应用主题，请重新点击应用。'
      OpenThemes = '打开主题文件夹'; OpenImages = '打开图片文件夹'; CheckUpdate = '检查更新…'
      Gallery = '主题库 Gallery'; Studio = '在线 Studio'; OpenSite = '打开 DreamSkin.cc'
      LaunchAtLogin = '登录时启动'; Restore = '完全恢复 Codex'; Exit = '退出托盘'
      Language = '语言 / Language'; LanguageSystem = '系统 / System'; LanguageVietnamese = 'Tiếng Việt'; LanguageEnglish = 'English'; LanguageChinese = '中文'
      ApplyStarted = '已开始应用皮肤'; Applying = '正在应用皮肤…'
      ResumeStarted = '已开始重新应用皮肤'; Reapplying = '正在重新应用皮肤…'
      ThemeExists = '主题已存在：{0}。没有重复写入。'
      ThemeUpdated = '已更新已保存主题：{0}。当前主题没有改变。'
      ThemeImported = '已导入：{0}。当前主题没有改变。'
      NewIdentifier = ' 新标识：{0}。'; NameCollision = ' 主题库中已有同名主题。'
      CssValidated = ' theme.css 已通过本机 Safe CSS 校验，切换到该主题时会一并生效。'
      SignatureIgnored = ' manifest.sig 是预留文件，当前版本已忽略。'
      CleanupWarning = ' 主题已成功保存，但旧备份目录未能自动清理；新主题不会因此回滚。请稍后重启客户端并查看日志。'
      ImageFilter = '图片文件|*.png;*.jpg;*.jpeg;*.webp|所有文件|*.*'
      PauseNoSession = '没有可连接的活动会话；已记录暂停，当前窗口可能仍显示皮肤。'
      PauseSucceeded = '皮肤已暂停。'; PauseFailed = '已记录暂停，但卸下当前皮肤失败；可重试暂停或完全恢复 Codex。'
      UpdateTitle = 'Codex Dream Skin 更新'; UpdateAvailable = 'Codex Dream Skin {0} 已发布。'
      UpdateQuestion = '是否打开 GitHub 下载页面？'; UpToDate = 'Codex Dream Skin {0} 已是最新版本。'
      UpdateFailed = '无法检查更新。'
      RestartPrompt = 'Codex 需要重启一次才能启用 Dream Skin，未保存的输入可能丢失。现在重启吗？'
      LaunchCancelled = '已取消启动 Dream Skin；Codex 未发生改变。'
      RestoreClose = '恢复操作将关闭 Codex，移除 Dream Skin 及其 CDP 会话，然后重新打开官方应用。是否继续？'
      RestoreCloseNoRelaunch = '恢复操作将关闭 Codex，并移除 Dream Skin 及其 CDP 会话。是否继续？'
      RestoreCancelled = '已取消恢复；状态和配置均未改变。'
      CommunitySuccess = '主题“{0}”已通过下载、SHA-256、主题包与 Safe CSS 校验，并已应用到 Codex。'
      CommunityCleanup = '主题已成功应用，但旧备份目录未能自动清理；新主题不会因此回滚。请稍后重启客户端并查看日志。'
      CommunityConfirmTitle = '确认一键换肤'; CommunityConfirm = '从 DreamSkin.cc 下载并应用“{0}”？'
      CommunityAuthor = '作者：{0}'; CommunityVersion = '版本：{0} · {1} MiB'; CommunityHash = 'SHA-256：{0}'
      CommunitySafety = '客户端只会连接固定官方 API，并重新校验下载大小、SHA-256、ZIP、清单和 Safe CSS。应用时 Codex 可能重启，未保存的输入可能丢失。主题内容不会作为命令执行。'
      RecoveryVerified = '新主题未能生效；此前主题已重新应用并完成可见渲染验证。'
      RecoveryFailed = '新主题未能生效；此前主题的自动恢复或渲染验证未完成。请重新打开客户端检查。'
      RecoverySuperseded = '检测到另一个换肤操作，客户端保留了较新的选择，没有覆盖它。'
      RecoveryUnconfirmed = '新主题未写入已验证的活动状态。'
      RecoveryWorkRetained = '恢复工作目录已保留，未自动删除。'; DownloadCleaned = '下载临时文件已清理。'
      RollbackSnapshot = '回滚快照：{0}'; CommunityApplyFailed = '一键换肤失败。'
      CommunityStartCdpLaunchFailed = '官方 Codex 应用无法以调试会话启动。'
      CommunityStartCdpDirectAccessDenied = '应用包启动丢失调试参数后，Windows 拒绝直接启动已验证的 Store 可执行文件。'
      CommunityStartCdpEndpointUnavailable = '当前 Codex 版本没有开放可验证的本地调试端点。'
      CommunityStartPortUnavailable = '没有可用且可验证的本地调试端口。'
      CommunityStartStateReconciliationFailed = 'Dream Skin 无法安全协调此前的本机会话。'
      CommunityStartInjectorFailed = '本地 Dream Skin 渲染器无法启动。'
      CommunityStartRendererVerificationFailed = '当前主题未通过可见渲染验证。'
      CommunityStartSuperseded = '较新的主题或暂停操作已取代本次应用。'
      CommunityStartInternalFailure = 'Dream Skin 无法完成本地启动操作。'
      CommunityStartTimedOut = 'Dream Skin 启动与可见渲染验证超时；后台恢复仍在继续，活动主题文件已保留。'
      CommunityStartInvalidResult = 'Dream Skin 启动没有返回有效的有界结果。'
      CommunityStartAppearanceRestored = '本次尝试改动的外观设置已恢复。'
      CommunityStartAppearanceConflictPreserved = '已保留较新的外观编辑。'
      CommunityStartAppearanceBlocked = '由于无法确认 Codex 已关闭或配置再次变化，外观恢复已停止。'
      CommunityStartAppearancePreservedRendered = '主题已经可见渲染，因此保留了当前外观设置。'
    }
  }
  $value = $catalog[$resolved][$Key]
  if ($null -eq $value) {
    # Fallback to English if key missing in resolved language
    $value = $catalog['en-US'][$Key]
  }
  if ($null -eq $value) { throw "Unknown Dream Skin localization key: $Key" }
  if ($FormatArguments.Count -gt 0) { return [string]::Format($value, $FormatArguments) }
  return $value
}
