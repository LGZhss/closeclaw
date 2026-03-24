package router

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"closeclaw-kernel/db"
)

// Config holds the dynamic settings retrieved from environment / db in Go context
type Config struct {
	AssistantName  string
	TriggerPattern *regexp.Regexp
}

// DefaultConfig creates a config with default values
func DefaultConfig(assistantName string) *Config {
	if assistantName == "" {
		assistantName = "Andy"
	}
	return &Config{
		AssistantName:  assistantName,
		// (?i) makes it case-insensitive
		TriggerPattern: regexp.MustCompile("(?i)^@" + assistantName + "\\b"),
	}
}

// EscapeXML mimics the typescript router.ts escapeXml function
func EscapeXML(s string) string {
	if s == "" {
		return ""
	}
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	return s
}

// FormatTimeZHCN mimics Intl.DateTimeFormat("zh-CN", {month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true})
// Example: "3月22日 下午1:40"
func FormatTimeZHCN(t time.Time) string {
	amPm := "上午"
	hour12 := t.Hour()
	if hour12 >= 12 {
		amPm = "下午"
		if hour12 > 12 {
			hour12 -= 12
		}
	} else if hour12 == 0 {
		hour12 = 12
	}
	// month output as X月, day as Y日
	return fmt.Sprintf("%d月%d日 %s%d:%02d", t.Month(), t.Day(), amPm, hour12, t.Minute())
}

// FormatMessages formats the db messages into a single prompt string
func FormatMessages(messages []db.Message) string {
	var builder strings.Builder
	for i, msg := range messages {
		// CST (UTC+8) 时区
		cst := time.FixedZone("CST", 8*3600)
		t := time.UnixMilli(msg.Timestamp).In(cst)
		timeStr := FormatTimeZHCN(t)
		builder.WriteString(fmt.Sprintf("[%s] %s: %s", timeStr, msg.SenderName, msg.Text))
		if i < len(messages)-1 {
			builder.WriteString("\n")
		}
	}
	return builder.String()
}

// ShouldTrigger tests the trigger pattern
func ShouldTrigger(cfg *Config, text string) bool {
	if text == "" {
		return false
	}
	return cfg.TriggerPattern.MatchString(strings.TrimSpace(text))
}

// BuildAgentPrompt assembles the final prompt mimicking JS router
func BuildAgentPrompt(cfg *Config, messages []db.Message) string {
	formatted := FormatMessages(messages)
	return fmt.Sprintf("You are %s, a helpful AI assistant.\n\nConversation history:\n%s\n\nPlease respond to the latest messages above. Be helpful, concise, and natural.", cfg.AssistantName, formatted)
}
