package scheduler

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/robfig/cron/v3"

	"closeclaw-kernel/db"
	pb "closeclaw-kernel/proto"
)

// Dispatcher 接口用于解耦 server 循环引用
type Dispatcher interface {
	BroadcastTask(task *pb.Task)
}

// Scheduler handles cron and interval background tasks.
type Scheduler struct {
	pool       *GroupPool
	cronParser cron.Parser
	stopCh     chan struct{}
	dispatcher Dispatcher
}

// NewScheduler creates a background scheduler mapped to the provided group pool.
func NewScheduler(pool *GroupPool, dispatcher Dispatcher) *Scheduler {
	return &Scheduler{
		pool:       pool,
		cronParser: cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor),
		stopCh:     make(chan struct{}),
		dispatcher: dispatcher,
	}
}

// CalculateNextRun calculates the next run time for a given task.
func (s *Scheduler) CalculateNextRun(task *db.ScheduledTask) *time.Time {
	switch task.ScheduleType {
	case "cron":
		schedule, err := s.cronParser.Parse(task.ScheduleValue)
		if err != nil {
			slog.Error("Failed to parse cron expression", "task_id", task.ID, "err", err)
			return nil
		}
		next := schedule.Next(time.Now())
		return &next

	case "interval":
		// Parse duration, TS stored milliseconds
		dur, err := time.ParseDuration(task.ScheduleValue + "ms")
		if err != nil {
			slog.Error("Failed to parse interval", "task_id", task.ID, "err", err)
			return nil
		}
		next := time.Now().Add(dur)
		return &next

	case "once":
		next, err := time.Parse(time.RFC3339, task.ScheduleValue)
		if err != nil {
			slog.Error("Failed to parse once time", "task_id", task.ID, "err", err)
			return nil
		}
		return &next

	default:
		slog.Warn("Unknown schedule type", "type", task.ScheduleType)
		return nil
	}
}

// Start begins a polling loop that periodically checks the database for due tasks
// and enqueues them into the GroupPool.
func (s *Scheduler) Start(pollInterval time.Duration) {
	slog.Info("Go Scheduler started", "pollInterval", pollInterval)
	ticker := time.NewTicker(pollInterval)

	go func() {
		for {
			select {
			case <-ticker.C:
				s.processDueTasks()
			case <-s.stopCh:
				ticker.Stop()
				slog.Info("Go Scheduler stopped")
				return
			}
		}
	}()
	
	// Immediate first run
	s.processDueTasks()
}

// Stop halts the scheduler loop.
func (s *Scheduler) Stop() {
	close(s.stopCh)
}

func (s *Scheduler) processDueTasks() {
	// 获取当前到期的 PENDING 任务
	dueTasks, err := db.GetDueTasks(db.GetDB(), time.Now())
	if err != nil {
		slog.Error("Failed to fetch due tasks", "err", err)
		return
	}

	if len(dueTasks) == 0 {
		return
	}

	slog.Info("Processing due tasks", "count", len(dueTasks))

	for _, t := range dueTasks {
		task := t // copy for goroutine
		
		// 1. 检查 DAG 依赖
		met, err := db.CheckDependenciesMet(db.GetDB(), task.DependsOn)
		if err != nil {
			slog.Error("DAG check failed", "task_id", task.ID, "err", err)
			continue
		}
		if !met {
			slog.Debug("Dependencies not met, skipping task", "task_id", task.ID, "depends_on", task.DependsOn)
			continue
		}

		// 2. 标记任务为 RUNNING，防止被重复分发
		if err := db.UpdateTaskStatus(db.GetDB(), task.ID, "RUNNING"); err != nil {
			slog.Error("Failed to mark task as RUNNING", "task_id", task.ID, "err", err)
			continue
		}

		// 3. 异步分发
		go func() {
			action := func() error {
				slog.Info("Executing scheduled task via gRPC Broadcast", "task_id", task.ID, "group", task.GroupFolder)
				
				// 转换并广播
				pbTask := &pb.Task{
					TaskId:   fmt.Sprintf("%d", task.ID),
					GroupJid: task.GroupFolder,
					Payload:  []byte(task.Prompt),
					Status:   pb.TaskStatus_PENDING,
				}
				s.dispatcher.BroadcastTask(pbTask)
				return nil
			}
			
			if err := s.pool.Enqueue(task.GroupFolder, action); err != nil {
				slog.Error("Task dispatch failed", "task_id", task.ID, "err", err)
				_ = db.UpdateTaskStatus(db.GetDB(), task.ID, "FAILED") // 状态回滚或标记失败
				return
			}
			
			// 4. 计算下一次运行时间并更新
			nextRun := s.CalculateNextRun(&task)
			if nextRun != nil {
				nextRunStr := nextRun.UTC().Format(time.RFC3339)
				if err := db.UpdateTaskNextRun(db.GetDB(), task.ID, nextRunStr); err != nil {
					slog.Error("Scheduled next run update failed", "task_id", task.ID, "err", err)
				}
				slog.Info("Task rescheduled", "task_id", task.ID, "next_run", nextRunStr)
			} else {
				// 对于 once 类型的任务，执行后标记为 DONE
				if task.ScheduleType == "once" {
					_ = db.UpdateTaskStatus(db.GetDB(), task.ID, "DONE")
				}
			}
		}()
	}
}
