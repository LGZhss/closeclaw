package scheduler

import (
	"log/slog"
	"time"

	"github.com/robfig/cron/v3"
)

// ScheduledTask represents a task loaded from DB.
type ScheduledTask struct {
	ID            int64
	GroupFolder   string
	ScheduleType  string // "cron", "interval", "once"
	ScheduleValue string
	// ... other fields matching TS entity
}

// Scheduler handles cron and interval background tasks.
type Scheduler struct {
	pool       *GroupPool
	cronParser cron.Parser
	stopCh     chan struct{}
}

// NewScheduler creates a background scheduler mapped to the provided group pool.
func NewScheduler(pool *GroupPool) *Scheduler {
	return &Scheduler{
		pool:       pool,
		cronParser: cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor),
		stopCh:     make(chan struct{}),
	}
}

// CalculateNextRun calculates the next run time for a given task.
func (s *Scheduler) CalculateNextRun(task *ScheduledTask) *time.Time {
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
	// TODO Phase2: Replace with actual db.GetDueTasks(time.Now()) call when sqlite logic mapped
	// dueTasks := db.GetDueTasks(time.Now())
	
	// For POC, simulate fetching 0 tasks due to DB lock placeholder logic
	var dueTasks []ScheduledTask

	if len(dueTasks) == 0 {
		return
	}

	slog.Info("Processing due tasks", "count", len(dueTasks))

	for _, t := range dueTasks {
		task := t // copy for goroutine
		
		// Enqueue the task asynchronously so it doesn't block the scheduler loop
		go func() {
			action := func() error {
				slog.Info("Executing scheduled task via RPC", "task_id", task.ID, "group", task.GroupFolder)
				// TODO Phase2: Actually dispatch RPC to TS Sandbox here
				return nil
			}
			
			if err := s.pool.Enqueue(task.GroupFolder, action); err != nil {
				slog.Error("Task failed", "task_id", task.ID, "err", err)
			}
			
			// Calculate next run and update DB
			nextRun := s.CalculateNextRun(&task)
			if nextRun != nil {
				// db.UpdateTaskNextRun(task.ID, *nextRun)
				slog.Info("Task rescheduled", "task_id", task.ID, "next_run", *nextRun)
			} else {
				// mark completed
			}
		}()
	}
}
