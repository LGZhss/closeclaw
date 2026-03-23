package router

import (
	"testing"
	"time"

	"closeclaw-kernel/db"
)

func TestEscapeXML(t *testing.T) {
	input := `say <hello> & "world"`
	expected := `say &lt;hello&gt; &amp; &quot;world&quot;`
	if out := EscapeXML(input); out != expected {
		t.Errorf("EscapeXML failed. expected: %s, got: %s", expected, out)
	}
}

func TestFormatTimeZHCN(t *testing.T) {
	// AM test
	t1 := time.Date(2026, time.March, 22, 9, 5, 0, 0, time.UTC)
	if out := FormatTimeZHCN(t1); out != "3月22日 上午9:05" {
		t.Errorf("Expected 3月22日 上午9:05, got %s", out)
	}

	// PM test
	t2 := time.Date(2026, time.March, 23, 17, 40, 0, 0, time.UTC)
	if out := FormatTimeZHCN(t2); out != "3月23日 下午5:40" {
		t.Errorf("Expected 3月23日 下午5:40, got %s", out)
	}

	// Midnight test
	t3 := time.Date(2026, time.March, 23, 0, 0, 0, 0, time.UTC)
	if out := FormatTimeZHCN(t3); out != "3月23日 上午12:00" {
		t.Errorf("Expected 3月23日 上午12:00, got %s", out)
	}

	// Noon test
	t4 := time.Date(2026, time.March, 23, 12, 0, 0, 0, time.UTC)
	if out := FormatTimeZHCN(t4); out != "3月23日 下午12:00" {
		t.Errorf("Expected 3月23日 下午12:00, got %s", out)
	}
}

func TestShouldTrigger(t *testing.T) {
	cfg := DefaultConfig("Andy")
	if !ShouldTrigger(cfg, "@Andy hello") {
		t.Error("Expected true")
	}
	if !ShouldTrigger(cfg, "  @andy   how are you?") {
		t.Error("Expected true")
	}
	if ShouldTrigger(cfg, "hello @Andy") {
		t.Error("Expected false")
	}
	if ShouldTrigger(cfg, "@AndyFake hi") {
		t.Error("Expected false")
	}
}

func TestBuildAgentPrompt(t *testing.T) {
	cfg := DefaultConfig("Andy")
	msgs := []db.Message{
		{SenderName: "Alice", Text: "Hi there!", Timestamp: "2026-03-23T09:05:00Z"},
	}
	out := BuildAgentPrompt(cfg, msgs)
	expected := "You are Andy, a helpful AI assistant.\n\nConversation history:\n[3月23日 上午9:05] Alice: Hi there!\n\nPlease respond to the latest messages above. Be helpful, concise, and natural."

	if out != expected {
		t.Errorf("BuildAgentPrompt failed.\nExpected:\n%s\nGot:\n%s", expected, out)
	}
}
