// Definition of Done Levels and Requirements
const dodDefinitions = {
    easy: {
        level: 'easy',
        name: 'Easy - Core Plot',
        description: 'Complete the essential story beats: Goldilocks enters, tries porridge/chairs/beds, bears return, Goldilocks flees.',
        bonusPoints: 50,
        requiredStoryIds: [ 'story-3', 'story-5', 'story-7', 'story-9', 'story-11', 'story-12', 'story-14', 'story-15' ]
    },
    medium: {
        level: 'medium',
        name: 'Medium - Illustrated Story',
        description: 'Complete the core plot with key illustrations and proper introduction/conclusion.',
        bonusPoints: 100,
        requiredStoryIds: [ 'story-1', 'story-2', 'story-3', 'story-4', 'story-5', 'story-6', 'story-7', 'story-8', 'story-9', 'story-10', 'story-11', 'story-12', 'story-13', 'story-14', 'story-15' ]
    },
    hard: {
        level: 'hard',
        name: 'Hard - Polished & Marketable',
        description: 'Complete a rich story with detailed text, visuals, cover, and marketing elements.',
        bonusPoints: 200,
        requiredStoryIds: [ 'story-1', 'story-2', 'story-3', 'story-4', 'story-5', 'story-6', 'story-7', 'story-8', 'story-9', 'story-10', 'story-11', 'story-12', 'story-13', 'story-14', 'story-15', 'story-16' ]
    }
};

// --- State Variables ---
let state = {
    currentSprint: 1,
    currentDay: 0, // 0: Planning, 1: Assignment Day 1, 2: Day 1 Work, 3: Reassignment Day 2, 4: Day 2 Work, 5: Review/Retro
    productBacklog: [],
    sprintBacklog: [],
    stories: {}, // Story objects keyed by ID
    team: [ // Added isUnblocking state
        { id: 'w1', name: 'Vicky Senior', area: 'Visual', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
        { id: 'w2', name: 'Val Junior', area: 'Visual', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
        { id: 'w3', name: 'Terry Senior', area: 'Text', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
        { id: 'w4', name: 'Tom Junior', area: 'Text', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
        { id: 'w5', name: 'Tessa Senior', area: 'Testing', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
        { id: 'w6', name: 'Tim Junior', area: 'Testing', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
    ],
    teamCapacity: 0,
    wipLimits: { // NEW: Define WIP limits
        inprogress: 2, // Example: Max 2 stories in progress
        testing: 2     // Example: Max 2 stories in testing
    },
    currentWip: { // NEW: Track current WIP counts
        inprogress: 0,
        testing: 0
    },
    completedStories: [], // All stories completed across all sprints
    currentSprintCompleted: [], // Stories completed in the current sprint
    velocityHistory: [],
    retrospectiveNotes: [],
    obstacles: [],
    chosenDoD: null,
    dodBonusPoints: 0,
    dodMet: false,
    missingDodStories: [],
};

// --- Constants ---
const TESTING_EFFORT_PER_STORY = 1;
export const UNBLOCKING_COST = 1; // How many points it costs a Senior to unblock // EXPORTED

// --- Initialization ---
export function loadInitialState(initialBacklog) {
     state = { // Reset state completely
        currentSprint: 1,
        currentDay: 0,
        productBacklog: [],
        sprintBacklog: [],
        stories: {},
        team: [
             { id: 'w1', name: 'Vicky Senior', area: 'Visual', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
             { id: 'w2', name: 'Val Junior', area: 'Visual', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
             { id: 'w3', name: 'Terry Senior', area: 'Text', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
             { id: 'w4', name: 'Tom Junior', area: 'Text', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
             { id: 'w5', name: 'Tessa Senior', area: 'Testing', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
             { id: 'w6', name: 'Tim Junior', area: 'Testing', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
        ],
        teamCapacity: 0,
        wipLimits: { inprogress: 2, testing: 2 }, // Reset WIP limits
        currentWip: { inprogress: 0, testing: 0 }, // Reset WIP counts
        completedStories: [],
        currentSprintCompleted: [],
        velocityHistory: [],
        retrospectiveNotes: [],
        obstacles: [],
        chosenDoD: null,
        dodBonusPoints: 0,
        dodMet: false,
        missingDodStories: [],
    };

    let storyIdCounter = 1;
    initialBacklog.forEach(storyData => {
        const storyId = `story-${storyIdCounter++}`;
        state.stories[storyId] = {
            ...storyData,
            id: storyId,
            status: 'backlog',
            remainingEffort: storyData.effort,
            testingEffortRemaining: TESTING_EFFORT_PER_STORY,
            progress: 0,
            testingProgress: 0,
            assignedWorker: null,
            chosenImplementation: null,
            baseEffort: storyData.effort, // Keep original effort
            isBlocked: false,
            daysInState: 0, // NEW: For WIP Aging
            enteredInProgressTimestamp: null, // NEW: For Cycle Time
            completedTimestamp: null, // NEW: For Cycle Time
        };
        state.productBacklog.push(storyId);
    });
    calculateTeamCapacity();
    console.log("Initial state loaded (WIP Limits, Aging, Cycle Time):", state);
    console.log("Calculated Team Capacity:", state.teamCapacity);
}

// --- Getters ---
export function getProductBacklog() { return state.productBacklog.map(id => state.stories[id]).filter(Boolean); }
export function getSprintBacklog() { return state.sprintBacklog.map(id => state.stories[id]).filter(Boolean); }
export function getStory(id) { return state.stories[id]; }
export function getAllStories() { return state.stories; }
export function getTeam() { return state.team; }
// Adjusted to consider isUnblocking
export function getAvailableWorkers() { return state.team.filter(w => w.available && !w.assignedStory && !w.isUnblocking); }
export function getAvailableSeniorDevs() { return state.team.filter(w => w.available && !w.assignedStory && !w.isUnblocking && w.skill === 'Senior' && w.area !== 'Testing'); }
export function getCurrentSprintNumber() { return state.currentSprint; }
export function getCurrentDay() { return state.currentDay; }
export function getTeamCapacity() { return state.teamCapacity; }
export function getCompletedStories() { return state.completedStories.map(id => state.stories[id]).filter(Boolean); }
export function getCurrentSprintCompletedStories() { return state.currentSprintCompleted.map(id => state.stories[id]).filter(Boolean); }
export function getVelocityHistory() { return state.velocityHistory; }
export function getWorkerById(workerId) { return state.team.find(w => w.id === workerId); }
export function getWorkerCurrentPoints(workerId) { const worker = getWorkerById(workerId); return worker ? worker.dailyPointsLeft : 0; }
export function getActiveObstacles() { return state.obstacles; }
export function getChosenDoD() { return state.chosenDoD; }
export function getDoDBonusPoints() { return state.dodBonusPoints; }
export function getDodMetStatus() { return state.dodMet; }
export function getMissingDodStories() { return state.missingDodStories; }
export function getDodDefinition(level) { return dodDefinitions[level]; }
export function getWipLimits() { return state.wipLimits; } // NEW
export function getCurrentWip() { return state.currentWip; } // NEW

// --- Mutations ---

function updateWipCount() {
    state.currentWip.inprogress = 0;
    state.currentWip.testing = 0;
    Object.values(state.stories).forEach(story => {
        if (story.status === 'inprogress') {
            state.currentWip.inprogress++;
        } else if (story.status === 'testing') {
            state.currentWip.testing++;
        }
    });
    console.log("WIP Count Updated:", state.currentWip);
}

export function addStoryToSprint(storyId) {
    if (!state.sprintBacklog.includes(storyId) && state.productBacklog.includes(storyId)) {
        state.sprintBacklog.push(storyId);
        state.productBacklog = state.productBacklog.filter(id => id !== storyId);
        updateStoryStatus(storyId, 'ready'); // Status change handles WIP reset
        console.log(`Story ${storyId} added to sprint backlog state.`);
        return true;
    }
    console.warn(`Failed to add story ${storyId} to sprint backlog state. Already in sprint? ${state.sprintBacklog.includes(storyId)}, In product backlog? ${state.productBacklog.includes(storyId)}`);
    return false;
}

export function removeStoryFromSprint(storyId) {
     if (state.sprintBacklog.includes(storyId)) {
        state.sprintBacklog = state.sprintBacklog.filter(id => id !== storyId);
        if(state.stories[storyId]) {
            if (!state.productBacklog.includes(storyId)) {
                 state.productBacklog.unshift(storyId);
            }
            // Reset relevant fields when moving back to backlog
            state.stories[storyId].chosenImplementation = null;
            state.stories[storyId].remainingEffort = state.stories[storyId].baseEffort;
            state.stories[storyId].testingEffortRemaining = TESTING_EFFORT_PER_STORY;
            state.stories[storyId].progress = 0;
            state.stories[storyId].testingProgress = 0;
            state.stories[storyId].assignedWorker = null;
            state.stories[storyId].enteredInProgressTimestamp = null;
            state.stories[storyId].completedTimestamp = null;
            state.stories[storyId].isBlocked = false;
            updateStoryStatus(storyId, 'backlog'); // Handles WIP update and daysInState reset
            console.log(`Story ${storyId} removed from sprint backlog state.`);
            return true;
        }
    }
    console.warn(`Failed to remove story ${storyId} from sprint backlog state. Not found.`);
    return false;
}

export function updateStoryStatus(storyId, newStatus) {
    const story = state.stories[storyId];
    if (!story) {
        console.error(`Cannot update status for non-existent story ${storyId}`);
        return;
    }

    const oldStatus = story.status;
    if (oldStatus === newStatus) return;

    console.log(`Story ${storyId} status changing from ${oldStatus} to ${newStatus}`);
    story.status = newStatus;
    story.daysInState = 0; // Reset WIP age counter on status change

    // Track Cycle Time Start
    if (newStatus === 'inprogress' && oldStatus === 'ready') {
        story.enteredInProgressTimestamp = state.currentDay; // Record when work starts
        console.log(`Story ${storyId} entered 'inprogress' on day ${state.currentDay}`);
    }

    // If moved out of progress or testing, ensure worker is unassigned
    if ((newStatus !== 'inprogress' && newStatus !== 'testing') && (oldStatus === 'inprogress' || oldStatus === 'testing') && story.assignedWorker) {
        unassignWorkerFromStory(storyId);
    }

    updateWipCount(); // Update WIP counts whenever status changes
}


export function assignWorkerToStory(workerId, storyId) {
    const worker = state.team.find(w => w.id === workerId);
    const story = state.stories[storyId];

    if (!worker || !story) {
        console.error(`Assign failed: Worker ${workerId} or Story ${storyId} not found.`);
        return false;
    }
    if (!worker.available) {
        console.warn(`Assign failed: Worker ${worker.name} is not available.`);
        return false;
    }
     if (worker.assignedStory && worker.assignedStory !== storyId) {
        console.warn(`Assign failed: Worker ${worker.name} is already assigned to ${worker.assignedStory}.`);
        return false;
    }
     if (worker.isUnblocking) {
         console.warn(`Assign failed: Worker ${worker.name} is currently assigned to unblock a story.`);
         return false;
     }

    let targetStatus = story.status;
    let canAssign = false;

    // --- WIP Limit Check ---
    // Check if adding THIS assignment would break the limit in the target state
    if (worker.area !== 'Testing' && story.status === 'ready') { // Moving to 'inprogress'
        if (state.currentWip.inprogress >= state.wipLimits.inprogress) {
            console.warn(`Assign failed: WIP Limit for 'In Progress' (${state.wipLimits.inprogress}) reached.`);
            alert(`Cannot assign ${story.title} to 'In Progress'. WIP Limit (${state.wipLimits.inprogress}) reached. Finish other work first!`);
            return false;
        }
    } else if (worker.area === 'Testing' && story.status === 'testing') { // Staying/Moving within 'testing'
        // Only check if the story doesn't *already* have a tester assigned (reassignment within Testing is fine even if over limit)
        const currentAssignee = story.assignedWorker ? GameState.getWorkerById(story.assignedWorker) : null;
        if (!currentAssignee || currentAssignee.area !== 'Testing') {
            if (state.currentWip.testing >= state.wipLimits.testing) {
                console.warn(`Assign failed: WIP Limit for 'Testing' (${state.wipLimits.testing}) reached.`);
                alert(`Cannot assign ${story.title} to 'Testing'. WIP Limit (${state.wipLimits.testing}) reached. Finish other testing first!`);
                return false;
            }
        }
    }
    // --- End WIP Limit Check ---


    if (worker.area === 'Testing' && story.status === 'testing') {
        canAssign = true;
    } else if (worker.area !== 'Testing' && story.status === 'ready') {
        canAssign = true;
        targetStatus = 'inprogress'; // Will trigger status update
    } else if (worker.area !== 'Testing' && story.status === 'inprogress') {
        canAssign = true; // Reassignment allowed within In Progress
    } else if (worker.area === 'Testing' && story.status === 'ready') {
         console.warn(`Assign failed: Cannot assign Tester ${worker.name} to story ${story.title} in 'Ready' status.`);
         return false;
    } else {
        console.warn(`Assign failed: Worker ${worker.name} (${worker.area}) cannot be assigned to story ${story.title} in status '${story.status}'.`);
        return false;
    }

    if (!canAssign) return false;

    // Unassign any worker currently on the story (if reassigning to a different worker)
    if(story.assignedWorker && story.assignedWorker !== workerId) {
        unassignWorkerFromStory(storyId);
    }

    worker.assignedStory = storyId;
    story.assignedWorker = workerId;
    worker.isUnblocking = false; // Ensure they are not marked as unblocking

    // Update status only if moving from Ready to In Progress
    // updateStoryStatus handles WIP counts and cycle time start
    if (story.status === 'ready' && targetStatus === 'inprogress') {
        updateStoryStatus(storyId, 'inprogress');
    } else {
        // If status doesn't change (e.g., reassigning within Testing), ensure WIP count is updated
        updateWipCount();
    }


    console.log(`Worker ${worker.name} assigned to story ${story.title} (Status: ${story.status}).`);
    return true;
}

export function unassignWorkerFromStory(storyId) {
     const story = state.stories[storyId];
     if (story && story.assignedWorker) {
         const worker = state.team.find(w => w.id === story.assignedWorker);
         const workerName = worker ? worker.name : 'Unknown Worker';
         if (worker) {
             worker.assignedStory = null;
             worker.isUnblocking = false; // Make sure this is reset
         }
         const oldStatus = story.status; // Store status before resetting worker
         story.assignedWorker = null;
         console.log(`Worker ${workerName} unassigned from story ${story.title}`);

         // If unassigning from 'inprogress', reset status to 'ready' (unless blocked)
         // If unassigning from 'testing', it stays in 'testing'
         if (oldStatus === 'inprogress' && !story.isBlocked) {
             updateStoryStatus(storyId, 'ready'); // This handles WIP update
         } else {
             // Even if status doesn't change (e.g., testing or blocked), WIP might change if a worker leaves
             updateWipCount();
         }
     }
}

// NEW: Function to assign a Senior worker to unblock a story
export function assignSeniorToUnblock(workerId, storyId) {
    const worker = state.team.find(w => w.id === workerId);
    const story = state.stories[storyId];

    if (!worker || !story) {
        console.error(`Unblock assign failed: Worker ${workerId} or Story ${storyId} not found.`);
        return false;
    }
    if (worker.skill !== 'Senior' || worker.area === 'Testing') {
        console.warn(`Unblock assign failed: Worker ${worker.name} is not a Senior Developer.`);
        alert(`Only Senior Developers (Text/Visual) can unblock stories.`);
        return false;
    }
    if (!worker.available) {
        console.warn(`Unblock assign failed: Worker ${worker.name} is not available.`);
        alert(`Worker ${worker.name} is not available to unblock.`);
        return false;
    }
    if (worker.assignedStory) {
         console.warn(`Unblock assign failed: Worker ${worker.name} is already assigned to ${worker.assignedStory}.`);
         alert(`Worker ${worker.name} is already assigned to another task.`);
         return false;
    }
    if (!story.isBlocked) {
         console.warn(`Unblock assign failed: Story ${story.title} is not blocked.`);
         alert(`Story ${story.title} is not currently blocked.`);
         return false;
    }
    if (worker.dailyPointsLeft < UNBLOCKING_COST) {
        console.warn(`Unblock assign failed: Worker ${worker.name} does not have enough points (${UNBLOCKING_COST} required).`);
        alert(`Worker ${worker.name} requires ${UNBLOCKING_COST} point(s) to unblock, but only has ${worker.dailyPointsLeft}.`);
        return false;
    }

    // Unassign anyone else currently assigned to unblock this story (shouldn't happen ideally)
    state.team.forEach(w => {
        if (w.isUnblocking && w.assignedStory === storyId) {
            w.isUnblocking = false;
            w.assignedStory = null;
            console.log(`Previously assigned unblocker ${w.name} unassigned.`);
        }
    });

    worker.assignedStory = storyId; // Temporarily assign story ID for reference
    worker.isUnblocking = true; // Mark as unblocking
    worker.dailyPointsLeft -= UNBLOCKING_COST; // Consume points immediately
    story.isBlocked = false; // Unblock the story
    story.daysInState = 0; // Reset age counter as it's actionable again

    console.log(`Worker ${worker.name} assigned to UNBLOCK story ${story.title}. Points remaining: ${worker.dailyPointsLeft}. Story unblocked.`);

    // Worker is now busy unblocking for the rest of the day
    // They will become available next day reset cycle
    return true;
}


export function applyWorkToStory(storyId, points, workerArea) {
    const story = state.stories[storyId];
    if (!story) return false;

    // Ensure work isn't applied if blocked
    if (story.isBlocked) {
        console.warn(`Work blocked on story ${storyId}.`);
        return false;
    }

    if (workerArea !== 'Testing' && story.status === 'inprogress' && story.remainingEffort > 0) {
        // --- Development Work ---
        const pointsToApply = Math.min(points, story.remainingEffort);
        story.remainingEffort -= pointsToApply;
        story.progress = ((story.baseEffort - story.remainingEffort) / story.baseEffort) * 100;
        console.log(`DEV: Applied ${pointsToApply} points to ${storyId}. Dev Remaining: ${story.remainingEffort}`);

        if (story.remainingEffort === 0) {
            console.log(`DEV Complete for ${storyId}. Moving to Testing.`);
            const devWorkerId = story.assignedWorker; // Get worker before status change potentially unassigns
            updateStoryStatus(storyId, 'testing'); // Move to Testing state (handles WIP, daysInState)
            // Explicitly unassign the dev worker now dev work is done
            if (devWorkerId) {
                 unassignWorkerFromStory(storyId); // This will correctly update WIP if needed
            }
             // Important: Check if testing WIP limit allows entry - This is informational, assignment logic prevents overflow
             if (state.currentWip.testing > state.wipLimits.testing) {
                  console.warn(`Story ${storyId} completed DEV but Testing WIP limit exceeded. Story may block testers.`);
             }
            return false; // Dev complete, but story not DONE yet
        }
    } else if (workerArea === 'Testing' && story.status === 'testing' && story.testingEffortRemaining > 0) {
        // --- Testing Work ---
        const pointsToApply = Math.min(points, story.testingEffortRemaining);
        story.testingEffortRemaining -= pointsToApply;
        story.testingProgress = ((TESTING_EFFORT_PER_STORY - story.testingEffortRemaining) / TESTING_EFFORT_PER_STORY) * 100;
        console.log(`TEST: Applied ${pointsToApply} points to ${storyId}. Test Remaining: ${story.testingEffortRemaining}`);

        if (story.testingEffortRemaining === 0) {
            markStoryAsDone(storyId); // Final completion step (will unassign tester, update WIP)
            return true; // Story is fully DONE
        }
    } else {
        // Log mismatch or attempt to work on story in wrong state/by wrong role
        if (story.status !== 'inprogress' && story.status !== 'testing') {
             // console.warn(`Attempted work on story ${storyId} in status ${story.status}`);
        } else if (workerArea === 'Testing' && story.status !== 'testing') {
             // console.warn(`Tester attempted work on story ${storyId} not in testing status`);
        } else if (workerArea !== 'Testing' && story.status === 'testing') {
             // console.warn(`Dev attempted work on story ${storyId} in testing status`);
        }
    }
    return false; // Story not fully DONE
}

function markStoryAsDone(storyId) {
    const story = state.stories[storyId];
    if (story && story.status !== 'done') {
        console.log(`Story ${storyId} is DONE!`);
        const wasAssignedWorker = story.assignedWorker;
        story.completedTimestamp = state.currentDay; // NEW: Record completion day for Cycle Time
        updateStoryStatus(storyId, 'done'); // Handles WIP update and daysInState reset

        if (!state.currentSprintCompleted.includes(storyId)) {
             state.currentSprintCompleted.push(storyId);
        }
         if (!state.completedStories.includes(storyId)) {
            state.completedStories.push(storyId);
        }
        // Unassign worker AFTER status update ensures WIP is correct
        if (wasAssignedWorker) {
             unassignWorkerFromStory(storyId);
        }
    }
}

export function advanceDay() {
    state.currentDay++;
    const currentPhase = getPhaseName(state.currentDay);
    console.log(`--- Advancing to Day ${state.currentDay} (${currentPhase}) ---`);

    // Increment WIP Aging for stories in progress or testing *that are not blocked*
    Object.values(state.stories).forEach(story => {
        if ((story.status === 'inprogress' || story.status === 'testing') && !story.isBlocked) {
            story.daysInState++;
        }
        // Reset blocker status right before checking/adding new obstacles for the day
         story.isBlocked = false;
    });

    // Reset workers' daily points and availability only at the start of work/reassignment phases
    if (currentPhase === 'Assign Workers Day 1' || currentPhase === 'Day 1 Work' || currentPhase === 'Reassign Workers Day 2' || currentPhase === 'Day 2 Work') {
        // Reset workers' daily points and availability
        state.team.forEach(w => {
            // Reset points first
            w.dailyPointsLeft = w.pointsPerDay;
            w.available = true; // Assume available initially
            w.isUnblocking = false; // Reset unblocking status
            // Keep existing story assignment unless work finished it

            // Check for persistent obstacles AFTER resetting points
            const obstacle = state.obstacles.find(o => o.targetWorkerId === w.id && o.type === 'capacity_reduction' && o.duration > 0);
            if (obstacle) {
                 w.dailyPointsLeft = Math.max(0, w.pointsPerDay - obstacle.pointsLost); // Adjust points based on base
                 obstacle.duration--; // Decrement duration *after* applying effect for the day
                 console.log(`Obstacle persists for ${w.name}, points: ${w.dailyPointsLeft}, duration left: ${obstacle.duration}`);
                 // Set availability based on obstacle for the *current* day
                 w.available = !obstacle.makesUnavailable;
            }
        });
        // Remove expired obstacles (duration is now 0 or less)
         state.obstacles = state.obstacles.filter(o => o.duration === undefined || o.duration > 0);

    }
}


export function startNewSprint() {
    const completedPoints = state.currentSprintCompleted
        .map(id => state.stories[id]?.baseEffort || 0)
        .reduce((sum, points) => sum + points, 0);
    state.velocityHistory.push(completedPoints);
    state.currentSprint++;
    state.currentDay = 0;
    state.sprintBacklog = [];
    state.currentSprintCompleted = [];
    state.obstacles = [];
    state.team.forEach(w => {
        w.available = true;
        w.assignedStory = null;
        w.isUnblocking = false; // Ensure reset
        w.dailyPointsLeft = w.pointsPerDay;
    });
    Object.values(state.stories).forEach(story => {
        // Reset unfinished stories moved back to product backlog
        if (story.status === 'inprogress' || story.status === 'ready' || story.status === 'testing') {
            console.log(`Moving unfinished story ${story.title} (Status: ${story.status}) back to Product Backlog.`);
            story.status = 'backlog';
            story.remainingEffort = story.baseEffort;
            story.testingEffortRemaining = TESTING_EFFORT_PER_STORY;
            story.progress = 0;
            story.testingProgress = 0;
            story.assignedWorker = null;
            story.isBlocked = false;
            story.daysInState = 0;
            story.enteredInProgressTimestamp = null;
            // story.completedTimestamp = null; // Should already be null
            if (!state.productBacklog.includes(story.id)) {
                state.productBacklog.unshift(story.id);
            }
        }
        // Reset aging for completed stories (though not strictly needed)
        if (story.status === 'done') {
             story.daysInState = 0;
        }
    });
    updateWipCount(); // Recalculate WIP (should be 0)
    calculateTeamCapacity();
    console.log(`Starting Sprint ${state.currentSprint}`);
}

export function calculateTeamCapacity() {
    const pointsPerDay = state.team.reduce((sum, worker) => sum + worker.pointsPerDay, 0);
    state.teamCapacity = pointsPerDay * 2; // Assuming 2 working days per sprint for capacity calculation
}

export function recordRetrospective(well, improve, change) {
    state.retrospectiveNotes.push({ sprint: state.currentSprint, well, improve, change });
}
export function setStoryImplementation(storyId, choice) {
     if (state.stories[storyId]) {
        state.stories[storyId].chosenImplementation = choice;
        // Update effort based on choice, reset progress if effort changes significantly
        if (state.stories[storyId].baseEffort !== choice.effort) {
             state.stories[storyId].remainingEffort = choice.effort;
             state.stories[storyId].baseEffort = choice.effort; // Update base effort too
             state.stories[storyId].progress = 0; // Reset progress if effort changed
             console.log(`Implementation changed effort for ${storyId}. Effort reset to ${choice.effort}`);
        }
        console.log(`Implementation chosen for ${storyId}: ${choice.description}, Effort: ${choice.effort}`);
    }
}
export function useWorkerPoints(workerId, pointsUsed) {
     const worker = getWorkerById(workerId);
     if (worker) {
         const pointsActuallyUsed = Math.min(pointsUsed, worker.dailyPointsLeft);
         worker.dailyPointsLeft -= pointsActuallyUsed;
         // Worker availability for the day is handled by points left or isUnblocking status
     }
}
export function addObstacle(obstacle) {
    // Obstacles now have duration 1 by default, applied daily
    const obstacleWithDuration = { ...obstacle, id: `obs-${Date.now()}-${Math.random()}`, duration: 1 };
    state.obstacles.push(obstacleWithDuration);

    if (obstacle.type === 'capacity_reduction') {
        const worker = state.team.find(w => w.id === obstacle.targetWorkerId);
        if (worker) {
             // Points reduction and availability check happens during advanceDay based on active obstacles
             console.log(`Obstacle Added: ${obstacle.message} targeting ${worker.name} for ${obstacleWithDuration.duration} day(s). Effect applied at start of next work phase.`);
             // Immediately mark unavailable if the obstacle type demands it
             if (obstacle.makesUnavailable) {
                 worker.available = false; // Mark unavailable now
                 if (worker.assignedStory) {
                     console.log(`${worker.name} made unavailable by obstacle, may impact assigned story ${worker.assignedStory}`);
                 }
             }
        }
    }
     if (obstacle.type === 'blocker') {
         const story = state.stories[obstacle.targetStoryId];
         if(story && (story.status === 'inprogress' || story.status === 'testing')) { // Only block active stories
             story.isBlocked = true;
             story.daysInState = 0; // Reset age as it's now blocked, not just slow
             console.log(`Obstacle Applied: ${obstacle.message} blocking story ${story.title}`);
             // If a worker was assigned, they might become effectively idle or need reassignment
             if (story.assignedWorker) {
                 const worker = getWorkerById(story.assignedWorker);
                 console.log(`Story ${story.title} blocked. Assigned worker ${worker?.name || 'Unknown'} may need reassignment.`);
                 // Don't auto-unassign, let player decide in Reassignment phase
             }
         } else if (story) {
             console.log(`Obstacle Skipped: Blocker targeting story ${story.title} in status ${story.status} (not active).`);
         }
     }
}
export function setDoD(level) {
    if (dodDefinitions[level]) {
        state.chosenDoD = level;
        state.dodBonusPoints = dodDefinitions[level].bonusPoints;
        console.log(`Definition of Done set to: ${level}, Bonus: ${state.dodBonusPoints}`);
    } else {
        console.error(`Invalid DoD level chosen: ${level}`);
    }
}
export function checkDoDMet() {
    if (!state.chosenDoD) {
        console.error("Cannot check DoD, none chosen.");
        state.dodMet = false;
        return false;
    }
    const definition = dodDefinitions[state.chosenDoD];
    if (!definition) {
        console.error(`Definition not found for chosen DoD: ${state.chosenDoD}`);
        state.dodMet = false;
        return false;
    }
    const requiredIds = definition.requiredStoryIds;
    const completedIds = new Set(state.completedStories);
    state.missingDodStories = [];
    let allRequiredMet = true;
    requiredIds.forEach(reqId => {
        if (!completedIds.has(reqId)) {
            allRequiredMet = false;
            state.missingDodStories.push(reqId);
        }
    });
    state.dodMet = allRequiredMet;
    console.log(`DoD Check (${state.chosenDoD}): Met = ${state.dodMet}. Missing: ${state.missingDodStories.join(', ')}`);
    return state.dodMet;
}

// Helper to get phase name - UPDATED Day numbers
export function getPhaseName(dayNumber) {
    switch (dayNumber) {
        case 0: return 'Planning';
        case 1: return 'Assign Workers Day 1';
        case 2: return 'Day 1 Work';
        case 3: return 'Reassign Workers Day 2';
        case 4: return 'Day 2 Work';
        case 5: return 'Review & Retro';
        default: return `Unknown Phase (${dayNumber})`;
    }
}

// NEW: Calculate Average Cycle Time for completed stories in the current sprint
export function calculateAverageCycleTime() {
    const completedThisSprint = getCurrentSprintCompletedStories();
    if (completedThisSprint.length === 0) {
        return null; // Avoid division by zero
    }
    let totalCycleTimeDays = 0;
    let validStoriesCount = 0;
    completedThisSprint.forEach(story => {
        // Ensure both timestamps are valid day numbers (0 is Planning, 1 is Assign Day 1, etc.)
        // Cycle time starts when it enters 'inprogress' (usually Day 2 or Day 4 if assigned late)
        // Cycle time ends when it enters 'done' (can be Day 2, 4, or later if carries over)
        if (typeof story.enteredInProgressTimestamp === 'number' &&
            typeof story.completedTimestamp === 'number' &&
            story.enteredInProgressTimestamp >= 1 && // Must have started *after* planning
            story.completedTimestamp >= story.enteredInProgressTimestamp)
        {
            // Calculate the number of "days" it existed from start of inProgress to end of done.
            // If entered Day 2, completed Day 4, it existed during Day 2, Day 3, Day 4.
            // Cycle Days = completedTimestamp - enteredInProgressTimestamp + 1
            // This represents calendar days spent in the system after starting work.
            const cycleDays = story.completedTimestamp - story.enteredInProgressTimestamp + 1;

             totalCycleTimeDays += cycleDays;
             validStoriesCount++;
             console.log(`Cycle Time for ${story.id}: Start Day ${story.enteredInProgressTimestamp}, End Day ${story.completedTimestamp}, Days: ${cycleDays}`);

        } else {
             console.warn(`Invalid cycle time data for story ${story.id}: Start=${story.enteredInProgressTimestamp}, End=${story.completedTimestamp}`);
        }
    });

    if (validStoriesCount === 0) return null;

    // Return average cycle time in days
    return (totalCycleTimeDays / validStoriesCount).toFixed(1);
}