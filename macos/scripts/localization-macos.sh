#!/bin/bash

# Shared user-facing language resolver for macOS runtime scripts. Callers may
# set DREAMSKIN_LANG to vi, en, or zh; otherwise the current macOS language is
# used. Machine-readable output must never depend on these strings.

dreamskin_language() {
  if [ -n "${DREAMSKIN_RESOLVED_LANG:-}" ]; then
    /usr/bin/printf '%s' "$DREAMSKIN_RESOLVED_LANG"
    return 0
  fi

  local requested="${DREAMSKIN_LANG:-}"
  local locale=""
  case "$requested" in
    vi|vi-*|vi_*|vietnamese) DREAMSKIN_RESOLVED_LANG="vi" ;;
    zh|zh-*|zh_*|chinese) DREAMSKIN_RESOLVED_LANG="zh" ;;
    en|en-*|en_*|english) DREAMSKIN_RESOLVED_LANG="en" ;;
    *)
      locale="${LC_ALL:-${LC_MESSAGES:-${LANG:-}}}"
      case "$locale" in
        vi|vi-*|vi_*|Vietnamese*) DREAMSKIN_RESOLVED_LANG="vi" ;;
        zh|zh-*|zh_*|Chinese*) DREAMSKIN_RESOLVED_LANG="zh" ;;
        *)
          if /usr/bin/defaults read -g AppleLanguages 2>/dev/null \
            | /usr/bin/head -n 2 | /usr/bin/grep -Eiq '(^|[^A-Za-z])vi([-_]|[^A-Za-z]|$)'; then
            DREAMSKIN_RESOLVED_LANG="vi"
          elif /usr/bin/defaults read -g AppleLanguages 2>/dev/null \
            | /usr/bin/head -n 2 | /usr/bin/grep -Eiq '(^|[^A-Za-z])zh([-_]|[^A-Za-z]|$)'; then
            DREAMSKIN_RESOLVED_LANG="zh"
          else
            DREAMSKIN_RESOLVED_LANG="en"
          fi
          ;;
      esac
      ;;
  esac
  /usr/bin/printf '%s' "$DREAMSKIN_RESOLVED_LANG"
}

dreamskin_text() {
  local key="${1:-}"
  local language=""
  language="$(dreamskin_language)"
  case "$language:$key" in
    vi:operation_timeout) /usr/bin/printf '%s' 'Thao tác quá thời gian, vui lòng thử lại.' ;;
    zh:operation_timeout) /usr/bin/printf '%s' '操作超时，请重试' ;;
    en:operation_timeout) /usr/bin/printf '%s' 'Operation timed out. Try again.' ;;

    vi:skin_applying_label) /usr/bin/printf '%s' 'Đang áp dụng Skin' ;;
    zh:skin_applying_label) /usr/bin/printf '%s' 'Skin 应用中' ;;
    en:skin_applying_label) /usr/bin/printf '%s' 'Skin applying' ;;

    vi:skin_pausing_label) /usr/bin/printf '%s' 'Đang tạm dừng Skin' ;;
    zh:skin_pausing_label) /usr/bin/printf '%s' 'Skin 暂停中' ;;
    en:skin_pausing_label) /usr/bin/printf '%s' 'Skin pausing' ;;

    vi:skin_unavailable) /usr/bin/printf '%s' 'Skin không khả dụng' ;;
    zh:skin_unavailable) /usr/bin/printf '%s' 'Skin 异常' ;;
    en:skin_unavailable) /usr/bin/printf '%s' 'Skin unavailable' ;;

    vi:operation_failed_short) /usr/bin/printf '%s' 'Thao tác thất bại' ;;
    zh:operation_failed_short) /usr/bin/printf '%s' '操作失败' ;;
    en:operation_failed_short) /usr/bin/printf '%s' 'operation failed' ;;

    vi:cancelled_short) /usr/bin/printf '%s' 'Đã hủy' ;;
    zh:cancelled_short) /usr/bin/printf '%s' '已取消' ;;
    en:cancelled_short) /usr/bin/printf '%s' 'cancelled' ;;

    vi:applying_selected_theme) /usr/bin/printf '%s' 'Đang áp dụng giao diện đã chọn' ;;
    zh:applying_selected_theme) /usr/bin/printf '%s' '正在应用已选主题' ;;
    en:applying_selected_theme) /usr/bin/printf '%s' 'Applying selected theme' ;;

    vi:skin_applied) /usr/bin/printf '%s' 'Giao diện đã được áp dụng' ;;
    zh:skin_applied) /usr/bin/printf '%s' '皮肤已应用' ;;
    en:skin_applied) /usr/bin/printf '%s' 'Skin applied' ;;

    vi:theme_switch_unconfirmed) /usr/bin/printf '%s' 'Chuyển giao diện chưa hoàn tất, kết quả chưa được xác nhận' ;;
    zh:theme_switch_unconfirmed) /usr/bin/printf '%s' '主题切换未完成，应用结果未确认' ;;
    en:theme_switch_unconfirmed) /usr/bin/printf '%s' 'Theme switch did not finish; the result is unconfirmed' ;;

    vi:switching_theme) /usr/bin/printf '%s' 'Đang chuyển giao diện' ;;
    zh:switching_theme) /usr/bin/printf '%s' '正在切换主题' ;;
    en:switching_theme) /usr/bin/printf '%s' 'Switching theme' ;;

    vi:apply_unconfirmed) /usr/bin/printf '%s' 'Áp dụng thất bại, kết quả chưa được xác nhận' ;;
    zh:apply_unconfirmed) /usr/bin/printf '%s' '应用失败，应用结果未确认' ;;
    en:apply_unconfirmed) /usr/bin/printf '%s' 'Apply failed; the result is unconfirmed' ;;

    vi:applying_skin) /usr/bin/printf '%s' 'Đang áp dụng giao diện' ;;
    zh:applying_skin) /usr/bin/printf '%s' '正在应用皮肤' ;;
    en:applying_skin) /usr/bin/printf '%s' 'Applying skin' ;;

    vi:cancelled_unchanged) /usr/bin/printf '%s' 'Thao tác đã hủy, giao diện cũ được giữ nguyên' ;;
    zh:cancelled_unchanged) /usr/bin/printf '%s' '操作已取消，原皮肤保持不变' ;;
    en:cancelled_unchanged) /usr/bin/printf '%s' 'Operation cancelled; the previous skin is unchanged' ;;

    vi:pause_failed) /usr/bin/printf '%s' 'Tạm dừng thất bại, trạng thái cũ có thể chưa đổi' ;;
    zh:pause_failed) /usr/bin/printf '%s' '暂停失败，原状态可能未改变' ;;
    en:pause_failed) /usr/bin/printf '%s' 'Pause failed; the previous state may be unchanged' ;;

    vi:pause_failed_alert) /usr/bin/printf '%s' 'Tạm dừng thất bại, vui lòng mở lại menu để xem trạng thái.' ;;
    zh:pause_failed_alert) /usr/bin/printf '%s' '暂停失败，请重新打开菜单查看状态。' ;;
    en:pause_failed_alert) /usr/bin/printf '%s' 'Pause failed. Reopen the menu to check the current state.' ;;

    vi:pausing_skin) /usr/bin/printf '%s' 'Đang tạm dừng giao diện' ;;
    zh:pausing_skin) /usr/bin/printf '%s' '正在暂停皮肤' ;;
    en:pausing_skin) /usr/bin/printf '%s' 'Pausing skin' ;;

    vi:skin_paused) /usr/bin/printf '%s' 'Giao diện đã tạm dừng' ;;
    zh:skin_paused) /usr/bin/printf '%s' '皮肤已暂停' ;;
    en:skin_paused) /usr/bin/printf '%s' 'Skin paused' ;;

    vi:selected_theme) /usr/bin/printf '%s' 'Giao diện đã chọn' ;;
    zh:selected_theme) /usr/bin/printf '%s' '已选主题' ;;
    en:selected_theme) /usr/bin/printf '%s' 'Selected theme' ;;

    vi:continue) /usr/bin/printf '%s' 'Tiếp tục' ;;
    zh:continue) /usr/bin/printf '%s' '继续' ;;
    en:continue) /usr/bin/printf '%s' 'Continue' ;;

    vi:cancel) /usr/bin/printf '%s' 'Hủy' ;;
    zh:cancel) /usr/bin/printf '%s' '取消' ;;
    en:cancel) /usr/bin/printf '%s' 'Cancel' ;;

    vi:restart_prompt) /usr/bin/printf '%s' 'Codex cần khởi động lại một lần để kích hoạt giao diện (thường mất 10–30 giây).' ;;
    zh:restart_prompt) /usr/bin/printf '%s' 'ChatGPT 需要重启一次才能启用皮肤。通常会在 10–30 秒内完成。' ;;
    en:restart_prompt) /usr/bin/printf '%s' 'ChatGPT must restart once to enable the skin. This usually takes 10–30 seconds.' ;;

    vi:restart_and_apply) /usr/bin/printf '%s' 'Khởi động lại và áp dụng' ;;
    zh:restart_and_apply) /usr/bin/printf '%s' '重启并应用' ;;
    en:restart_and_apply) /usr/bin/printf '%s' 'Restart and apply' ;;

    vi:open_and_apply) /usr/bin/printf '%s' 'Mở và áp dụng' ;;
    zh:open_and_apply) /usr/bin/printf '%s' '打开并应用' ;;
    en:open_and_apply) /usr/bin/printf '%s' 'Open and apply' ;;

    vi:reapply) /usr/bin/printf '%s' 'Áp dụng lại' ;;
    zh:reapply) /usr/bin/printf '%s' '重新应用' ;;
    en:reapply) /usr/bin/printf '%s' 'Reapply' ;;

    vi:repair_and_apply) /usr/bin/printf '%s' 'Sửa chữa và áp dụng' ;;
    zh:repair_and_apply) /usr/bin/printf '%s' '修复并应用' ;;
    en:repair_and_apply) /usr/bin/printf '%s' 'Repair and apply' ;;

    vi:apply) /usr/bin/printf '%s' 'Áp dụng' ;;
    zh:apply) /usr/bin/printf '%s' '应用' ;;
    en:apply) /usr/bin/printf '%s' 'Apply' ;;

    vi:click_received) /usr/bin/printf '%s' 'Đã nhận yêu cầu…' ;;
    zh:click_received) /usr/bin/printf '%s' '已收到点击…' ;;
    en:click_received) /usr/bin/printf '%s' 'Request received…' ;;

    vi:engine_script_missing) /usr/bin/printf '%s' 'Không thể tải mã nguồn động cơ' ;;
    zh:engine_script_missing) /usr/bin/printf '%s' '无法加载引擎脚本' ;;
    en:engine_script_missing) /usr/bin/printf '%s' 'Could not load the engine script' ;;

    vi:cancelled_progress) /usr/bin/printf '%s' 'Đã hủy, giao diện cũ được giữ nguyên' ;;
    zh:cancelled_progress) /usr/bin/printf '%s' '已取消，原皮肤保持不变' ;;
    en:cancelled_progress) /usr/bin/printf '%s' 'Cancelled; the previous skin is unchanged' ;;

    vi:opening_and_applying) /usr/bin/printf '%s' 'Đang mở Codex và áp dụng giao diện…' ;;
    zh:opening_and_applying) /usr/bin/printf '%s' '正在打开 ChatGPT 并应用皮肤…' ;;
    en:opening_and_applying) /usr/bin/printf '%s' 'Opening ChatGPT and applying the skin…' ;;

    vi:checking_chatgpt) /usr/bin/printf '%s' 'Đang kiểm tra Codex…' ;;
    zh:checking_chatgpt) /usr/bin/printf '%s' '检查 ChatGPT…' ;;
    en:checking_chatgpt) /usr/bin/printf '%s' 'Checking ChatGPT…' ;;

    vi:hot_reload) /usr/bin/printf '%s' 'Đang tải lại giao diện trực tiếp…' ;;
    zh:hot_reload) /usr/bin/printf '%s' '尝试热重载皮肤…' ;;
    en:hot_reload) /usr/bin/printf '%s' 'Trying a live skin reload…' ;;

    vi:apply_complete) /usr/bin/printf '%s' 'Hoàn tất: Đã áp dụng giao diện' ;;
    zh:apply_complete) /usr/bin/printf '%s' '完成：皮肤已应用' ;;
    en:apply_complete) /usr/bin/printf '%s' 'Complete: skin applied' ;;

    vi:connecting_debug) /usr/bin/printf '%s' 'Đang khởi động/kết nối cổng gỡ lỗi…' ;;
    zh:connecting_debug) /usr/bin/printf '%s' '启动/连接调试口…' ;;
    en:connecting_debug) /usr/bin/printf '%s' 'Starting or connecting to the debug port…' ;;

    vi:apply_failed) /usr/bin/printf '%s' 'Áp dụng thất bại' ;;
    zh:apply_failed) /usr/bin/printf '%s' '应用失败' ;;
    en:apply_failed) /usr/bin/printf '%s' 'Apply failed' ;;

    vi:default_theme_name) /usr/bin/printf '%s' 'Giao diện của tôi' ;;
    zh:default_theme_name) /usr/bin/printf '%s' '我的主题' ;;
    en:default_theme_name) /usr/bin/printf '%s' 'My Theme' ;;

    vi:loading_image) /usr/bin/printf '%s' 'Đang tải hình ảnh…' ;;
    zh:loading_image) /usr/bin/printf '%s' '正在加载图片…' ;;
    en:loading_image) /usr/bin/printf '%s' 'Loading image…' ;;

    vi:theme_ready_not_applied) /usr/bin/printf '%s' 'Giao diện đã sẵn sàng (chưa áp dụng)' ;;
    zh:theme_ready_not_applied) /usr/bin/printf '%s' '主题已就绪（未应用）' ;;
    en:theme_ready_not_applied) /usr/bin/printf '%s' 'Theme ready (not applied)' ;;

    vi:starting_chatgpt_for_apply) /usr/bin/printf '%s' 'Phiên hiện tại không khả dụng, đang khởi động Codex và áp dụng giao diện…' ;;
    zh:starting_chatgpt_for_apply) /usr/bin/printf '%s' '当前会话不可用，正在启动 ChatGPT 并应用主题…' ;;
    en:starting_chatgpt_for_apply) /usr/bin/printf '%s' 'The current session is unavailable; starting ChatGPT and applying the theme…' ;;

    vi:image_saved_apply_failed) /usr/bin/printf '%s' 'Đã lưu ảnh, nhưng áp dụng skin thất bại. Vui lòng bấm "Áp dụng" để thử lại.' ;;
    zh:image_saved_apply_failed) /usr/bin/printf '%s' '图片已保存，但皮肤应用失败。请点“应用皮肤”重试。' ;;
    en:image_saved_apply_failed) /usr/bin/printf '%s' 'The image was saved, but applying the skin failed. Click Apply Skin to retry.' ;;

    vi:validating_theme_content) /usr/bin/printf '%s' 'Đang xác thực nội dung giao diện…' ;;
    zh:validating_theme_content) /usr/bin/printf '%s' '正在验证主题内容…' ;;
    en:validating_theme_content) /usr/bin/printf '%s' 'Validating theme content…' ;;

    vi:publishing_validated_theme) /usr/bin/printf '%s' 'Đang xuất bản giao diện đã xác thực…' ;;
    zh:publishing_validated_theme) /usr/bin/printf '%s' '正在发布已验证的主题…' ;;
    en:publishing_validated_theme) /usr/bin/printf '%s' 'Publishing the validated theme…' ;;

    vi:applying_theme_to_chatgpt) /usr/bin/printf '%s' 'Đang áp dụng giao diện vào Codex…' ;;
    zh:applying_theme_to_chatgpt) /usr/bin/printf '%s' '正在将主题应用到 ChatGPT…' ;;
    en:applying_theme_to_chatgpt) /usr/bin/printf '%s' 'Applying the theme to ChatGPT…' ;;

    vi:verifying_rendered_theme) /usr/bin/printf '%s' 'Đang kiểm tra hiển thị giao diện…' ;;
    zh:verifying_rendered_theme) /usr/bin/printf '%s' '正在验证主题渲染…' ;;
    en:verifying_rendered_theme) /usr/bin/printf '%s' 'Verifying the rendered theme…' ;;

    vi:restarting_chatgpt_for_apply) /usr/bin/printf '%s' 'Đang khởi động lại Codex và kiểm tra giao diện…' ;;
    zh:restarting_chatgpt_for_apply) /usr/bin/printf '%s' '正在重启 ChatGPT 并验证主题应用…' ;;
    en:restarting_chatgpt_for_apply) /usr/bin/printf '%s' 'Restarting ChatGPT to apply and verify the theme…' ;;

    vi:theme_switch_apply_failed) /usr/bin/printf '%s' 'Đã chuyển giao diện, nhưng áp dụng thất bại. Bấm "Áp dụng" để thử lại.' ;;
    zh:theme_switch_apply_failed) /usr/bin/printf '%s' '主题已切换，但皮肤应用失败。请点“应用皮肤”重试。' ;;
    en:theme_switch_apply_failed) /usr/bin/printf '%s' 'The theme was switched, but applying the skin failed. Click Apply Skin to retry.' ;;

    vi:ok) /usr/bin/printf '%s' 'Đồng ý' ;;
    zh:ok) /usr/bin/printf '%s' '好' ;;
    en:ok) /usr/bin/printf '%s' 'OK' ;;
    *) return 1 ;;
  esac
}
