//go:build !windows

package server

import (
	"log/slog"
	"net"
)

func listen() (net.Listener, error) {
	slog.Info("Unix 平台：启用 Unix Domain Socket 监听", "sock", sockPath)
	return net.Listen("unix", sockPath)
}
