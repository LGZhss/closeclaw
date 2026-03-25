// kernel/llm/client.go — Go 内核 LLM 请求客户端
package llm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// OpenAIRequest 适配 OpenAI 兼容接口
type OpenAIRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message ChatMessage `json:"message"`
	} `json:"choices"`
	Error struct {
		Message string `json:"message"`
	} `json:"error"`
}

// Client 提供向 LLM 发送请求的能力
type Client struct {
	APIKey  string
	BaseURL string
	HTTP    *http.Client
}

func NewClient() (*Client, error) {
	key := os.Getenv("OPENROUTER_API_KEY") // 优先使用 OpenRouter
	if key == "" {
		key = os.Getenv("OPENAI_API_KEY")
	}
	if key == "" {
		return nil, fmt.Errorf("未配置 LLM API Key (需设置 OPENROUTER_API_KEY 或 OPENAI_API_KEY)")
	}
	baseURL := os.Getenv("OPENROUTER_BASE_URL")
	if baseURL == "" {
		baseURL = "https://openrouter.ai/api/v1"
	}

	return &Client{
		APIKey:  key,
		BaseURL: baseURL,
		HTTP:    &http.Client{Timeout: 60 * time.Second},
	}, nil
}

// Chat 执行一次推理请求
func (c *Client) Chat(prompt string, history []string) (string, error) {
	if c.APIKey == "" {
		return "", fmt.Errorf("未配置 LLM API Key (OPENROUTER_API_KEY)")
	}

	msgs := []ChatMessage{}
	// 精简历史记录处理
	for _, h := range history {
		msgs = append(msgs, ChatMessage{Role: "user", Content: h})
	}
	msgs = append(msgs, ChatMessage{Role: "user", Content: prompt})

	reqBody := OpenAIRequest{
		Model:    "nvidia/nemotron-3-super-120b-a12b:free", // 默认免费模型
		Messages: msgs,
	}

	jsonData, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", c.BaseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("HTTP-Referer", "https://github.com/LGZhss/closeclaw")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API 错误 (%d): %s", resp.StatusCode, string(body))
	}

	var openResp OpenAIResponse
	if err := json.Unmarshal(body, &openResp); err != nil {
		return "", err
	}

	if len(openResp.Choices) > 0 {
		return openResp.Choices[0].Message.Content, nil
	}

	return "", fmt.Errorf("API 未返回有效内容")
}
