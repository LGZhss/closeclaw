//go:build windows

package server

import (
	"log/slog"
	"net"

	"github.com/Microsoft/go-winio"
	"golang.org/x/sys/windows"
)

func listen() (net.Listener, error) {
	slog.Info("Windows 平台：启用物理命名管道监听", "pipe", pipePath)

	token := windows.GetCurrentProcessToken()
	defer token.Close()

	// 获取当前用户 SID
	user, err := token.GetTokenUser()
	if err != nil {
		slog.Warn("获取当前用户 SID 失败，使用默认权限", "err", err)
		return winio.ListenPipe(pipePath, nil)
	}

	// 构建 SDDL: 仅授予当前用户完全访问，拒绝其他所有用户
	// D: = DACL header
	// A;;GA;;;SID = 授予 SID 完全控制 (Generic All)
	sddl := "D:P(A;;GA;;;" + user.User.Sid.String() + ")"
	sd, err := windows.SecurityDescriptorFromString(sddl)
	if err != nil {
		slog.Warn("构建安全描述符失败，使用默认权限", "err", err)
		return winio.ListenPipe(pipePath, nil)
	}

	config := &winio.PipeConfig{
		SecurityDescriptor: sd.String(),
	}

	return winio.ListenPipe(pipePath, config)
}
