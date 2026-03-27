//go:build windows

package server

import (
	"log/slog"
	"net"

	"github.com/Microsoft/go-winio"
)

func listen() (net.Listener, error) {
	slog.Info("Windows 平台：启用物理命名管道监听", "pipe", pipePath)
	return winio.ListenPipe(pipePath, nil)
}
