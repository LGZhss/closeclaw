package scheduler

import (
	"log/slog"
	"sync"
)

// TaskAction represents the actual workload to be executed for a given group.
type TaskAction func() error

// QueueItem represents a task queued for a specific group.
type QueueItem struct {
	GroupFolder string
	Action      TaskAction
	ResultCh    chan error // Used to notify the caller of the result
}

// GroupPool represents a highly concurrent scheduler replacing group-queue.ts
// It ensures that for any given GroupFolder, only ONE task runs at a time,
// while globally limiting the total number of running tasks.
type GroupPool struct {
	maxConcurrent int
	// activeAgents counts how many tasks are currently running globally.
	activeAgents int

	// groupQueues holds the pending tasks for each group.
	groupQueues map[string][]*QueueItem
	// groupProcessing tracks if a group is currently executing a task.
	groupProcessing map[string]bool
	// waitingQueue holds groups that have pending tasks but are waiting for global concurrency slots.
	waitingQueue []string

	mu sync.Mutex
}

// NewGroupPool creates a new concurrency-limited group queue pool.
func NewGroupPool(maxConcurrent int) *GroupPool {
	if maxConcurrent <= 0 {
		maxConcurrent = 5 // default from TS
	}
	return &GroupPool{
		maxConcurrent:   maxConcurrent,
		groupQueues:     make(map[string][]*QueueItem),
		groupProcessing: make(map[string]bool),
		waitingQueue:    make([]string, 0),
	}
}

// Enqueue adds a task for a specific group and blocks until the task is complete.
func (p *GroupPool) Enqueue(groupFolder string, action TaskAction) error {
	resultCh := make(chan error, 1)
	item := &QueueItem{
		GroupFolder: groupFolder,
		Action:      action,
		ResultCh:    resultCh,
	}

	p.mu.Lock()
	p.groupQueues[groupFolder] = append(p.groupQueues[groupFolder], item)
	p.tryProcess(groupFolder)
	p.mu.Unlock()

	// block until finished
	return <-resultCh
}

// tryProcess attempts to start processing for a specific group.
// Caller MUST hold p.mu.
func (p *GroupPool) tryProcess(groupFolder string) {
	if p.groupProcessing[groupFolder] {
		return // Group is already busy
	}
	queue := p.groupQueues[groupFolder]
	if len(queue) == 0 {
		return // Nothing to do for this group
	}

	if p.activeAgents >= p.maxConcurrent {
		// Global concurrency limit reached, add to waiting queue if not already there
		for _, g := range p.waitingQueue {
			if g == groupFolder {
				return
			}
		}
		p.waitingQueue = append(p.waitingQueue, groupFolder)
		return
	}

	// Mark group as busy and pop the first item
	p.groupProcessing[groupFolder] = true
	p.activeAgents++
	item := queue[0]
	p.groupQueues[groupFolder] = queue[1:]

	// Launch goroutine
	go p.executeItem(item)
}

// executeItem runs the actual task and triggers the next items.
func (p *GroupPool) executeItem(item *QueueItem) {
	slog.Info("Executing task for group", "groupFolder", item.GroupFolder)
	err := item.Action()
	
	// Notify caller
	item.ResultCh <- err

	p.mu.Lock()
	defer p.mu.Unlock()

	p.activeAgents--
	p.groupProcessing[item.GroupFolder] = false

	// Try processing the next item in the same group's queue
	p.tryProcess(item.GroupFolder)

	// Try processing any waiting groups
	for len(p.waitingQueue) > 0 && p.activeAgents < p.maxConcurrent {
		waitingGroup := p.waitingQueue[0]
		p.waitingQueue = p.waitingQueue[1:]
		p.tryProcess(waitingGroup)
	}
}
