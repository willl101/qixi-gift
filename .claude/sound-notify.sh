#!/bin/bash

# Claude Code 声音提示脚本
# 用于不同事件的音频和视觉通知

play_sound() {
    local sound_type="$1"
    
    # 检测操作系统
    OS="$(uname -s)"
    
    case "$sound_type" in
        "user_input_required")
            # 需要用户输入时 - 柔和的双声提示
            if [[ "$OS" == "Darwin" ]]; then
                # macOS: 播放声音并显示通知
                afplay /System/Library/Sounds/Tink.aiff 2>/dev/null &
                sleep 0.2
                afplay /System/Library/Sounds/Tink.aiff 2>/dev/null &
                osascript -e 'display notification "Claude 需要你的确认或输入" with title "⏸ Claude Code" sound name "Tink"' 2>/dev/null &
            elif [[ "$OS" == "Linux" ]]; then
                paplay /usr/share/sounds/freedesktop/stereo/message.oga 2>/dev/null &
            else
                printf "\a\a"
            fi
            ;;
            
        "task_completed")
            # 任务完成时 - 成功的声音
            if [[ "$OS" == "Darwin" ]]; then
                afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
                osascript -e 'display notification "任务执行完成！" with title "✅ Claude Code" sound name "Glass"' 2>/dev/null &
            elif [[ "$OS" == "Linux" ]]; then
                paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null &
            else
                printf "\a"
            fi
            ;;
            
        "error")
            # 发生错误时 - 警告音
            if [[ "$OS" == "Darwin" ]]; then
                afplay /System/Library/Sounds/Sosumi.aiff 2>/dev/null &
                osascript -e 'display notification "命令执行失败" with title "❌ Claude Code" sound name "Sosumi"' 2>/dev/null &
            elif [[ "$OS" == "Linux" ]]; then
                paplay /usr/share/sounds/freedesktop/stereo/dialog-error.oga 2>/dev/null &
            else
                printf "\a\a\a"
            fi
            ;;
            
        "session_start")
            # 会话开始时 - 欢迎音
            if [[ "$OS" == "Darwin" ]]; then
                afplay /System/Library/Sounds/Hero.aiff 2>/dev/null &
                osascript -e 'display notification "Claude Code 已就绪" with title "🚀 Claude Code" sound name "Hero"' 2>/dev/null &
            elif [[ "$OS" == "Linux" ]]; then
                paplay /usr/share/sounds/freedesktop/stereo/service-login.oga 2>/dev/null &
            else
                printf "\a"
            fi
            ;;
            
        *)
            # 默认提示音
            if [[ "$OS" == "Darwin" ]]; then
                afplay /System/Library/Sounds/Ping.aiff 2>/dev/null &
            else
                printf "\a"
            fi
            ;;
    esac
    
    # 记录到日志（调试用）
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Event: $sound_type" >> ~/.claude/sound-events.log
}

# 主程序
if [ $# -eq 0 ]; then
    echo "Usage: $0 <sound_type>"
    echo "Types: user_input_required, task_completed, error, session_start"
    exit 1
fi

play_sound "$1"
exit 0