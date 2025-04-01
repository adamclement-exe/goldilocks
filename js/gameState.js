// --- State Variables ---
let state = {
    currentSprint: 1,
    currentDay: 0, // 0: Planning, 1: Assignment, 2: Day 1 Work, 3: Day 2 Work, 4: Review/Retro
    productBacklog: [], // Array of story IDs
    sprintBacklog: [], // Array of story IDs committed to the sprint
    stories: {}, // Object to hold all story details, keyed by ID
    // --- UPDATED & SIMPLIFIED TEAM STRUCTURE ---
    team: [
        // Visual Team (1 Senior, 1 Junior)
        { id: 'w1', name: 'Vicky Senior', area: 'Visual', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
        { id: 'w2', name: 'Val Junior', area: 'Visual', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
        // Text/Activity Team (1 Senior, 1 Junior)
        { id: 'w3', name: 'Terry Senior', area: 'Text', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
        { id: 'w4', name: 'Tom Junior', area: 'Text', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
         // Marketing/Design Team (1 Senior, 1 Junior)
        { id: 'w5', name: 'Mark Senior', area: 'Marketing', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
        { id: 'w6', name: 'Mia Junior', area: 'Marketing', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
    ], // Total 6 workers
    teamCapacity: 0, // Calculated per sprint
    completedStories: [], // Stories completed across all sprints
    currentSprintCompleted: [], // Stories completed in the current sprint
    velocityHistory: [],
    retrospectiveNotes: [],
    obstacles: [], // Active obstacles { id, message, type, targetWorkerId?, targetStoryId?, duration }
};

// --- Initialization ---
export function loadInitialState(initialBacklog) {
    // Reset state, including the new team structure
     state = {
        currentSprint: 1,
        currentDay: 0, // Start at Planning
        productBacklog: [],
        sprintBacklog: [],
        stories: {},
        team: [ // Ensure team state is reset correctly
             // Visual Team (1 Senior, 1 Junior)
            { id: 'w1', name: 'Vicky Senior', area: 'Visual', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
            { id: 'w2', name: 'Val Junior', area: 'Visual', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
            // Text/Activity Team (1 Senior, 1 Junior)
            { id: 'w3', name: 'Terry Senior', area: 'Text', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
            { id: 'w4', name: 'Tom Junior', area: 'Text', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
             // Marketing/Design Team (1 Senior, 1 Junior)
            { id: 'w5', name: 'Mark Senior', area: 'Marketing', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
            { id: 'w6', name: 'Mia Junior', area: 'Marketing', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
        ], // Total 6 workers
        teamCapacity: 0,
        completedStories: [],
        currentSprintCompleted: [],
        velocityHistory: [],
        retrospectiveNotes: [],
        obstacles: [],
    };

    let storyIdCounter = 1;
    initialBacklog.forEach(storyData => {
        const storyId = `story-${storyIdCounter++}`;
        state.stories[storyId] = {
            ...storyData,
            id: storyId,
            status: 'backlog', // Initial status
            remainingEffort: storyData.effort, // Track progress
            progress: 0, // Percentage or points done
            assignedWorker: null,
            chosenImplementation: null, // Store the chosen option
            baseEffort: storyData.effort, // Keep original estimate
            isBlocked: false, // Track if blocked by obstacle
        };
        state.productBacklog.push(storyId);
    });
    calculateTeamCapacity(); // Calculate initial capacity
    console.log("Initial state loaded (Senior/Junior Team):", state);
    console.log("Calculated Team Capacity:", state.teamCapacity); // Log capacity
}

// --- Getters ---
export function getProductBacklog() {
    // Return stories from productBacklog array, ensuring they exist in state.stories
    return state.productBacklog.map(id => state.stories[id]).filter(Boolean);
}

export function getSprintBacklog() {
    // Return stories from sprintBacklog array, ensuring they exist in state.stories
    return state.sprintBacklog.map(id => state.stories[id]).filter(Boolean);
}

export function getStory(id) { return state.stories[id]; }
export function getAllStories() { return state.stories; }
export function getTeam() { return state.team; }
export function getAvailableWorkers() { return state.team.filter(w => w.available && !w.assignedStory); }
export function getCurrentSprintNumber() { return state.currentSprint; }
export function getCurrentDay() { return state.currentDay; } // 0=Plan, 1=Assign, 2=Day1, 3=Day2, 4=Review
export function getTeamCapacity() { return state.teamCapacity; }
export function getCompletedStories() { return state.completedStories.map(id => state.stories[id]).filter(Boolean); }
export function getCurrentSprintCompletedStories() { return state.currentSprintCompleted.map(id => state.stories[id]).filter(Boolean); }
export function getVelocityHistory() { return state.velocityHistory; }
export function getWorkerById(workerId) { return state.team.find(w => w.id === workerId); }
export function getWorkerCurrentPoints(workerId) { const worker = getWorkerById(workerId); return worker ? worker.dailyPointsLeft : 0; }
export function getActiveObstacles() { return state.obstacles; }


// --- Mutations ---

// Called during planning modal interaction (checkbox checked)
export function addStoryToSprint(storyId) {
    if (!state.sprintBacklog.includes(storyId) && state.productBacklog.includes(storyId)) {
        state.sprintBacklog.push(storyId);
        state.productBacklog = state.productBacklog.filter(id => id !== storyId);
        updateStoryStatus(storyId, 'ready'); // Set status
        console.log(`Story ${storyId} added to sprint backlog state.`);
        return true; // Indicate success
    }
    console.warn(`Failed to add story ${storyId} to sprint backlog state. Already in sprint? ${state.sprintBacklog.includes(storyId)}, In product backlog? ${state.productBacklog.includes(storyId)}`);
    return false; // Indicate failure or already added
}

// Called during planning modal interaction (checkbox unchecked)
export function removeStoryFromSprint(storyId) {
     if (state.sprintBacklog.includes(storyId)) {
        state.sprintBacklog = state.sprintBacklog.filter(id => id !== storyId);
        // Ensure it goes back to product backlog if it exists in stories
        if(state.stories[storyId]) {
            // Avoid duplicates if already there somehow
            if (!state.productBacklog.includes(storyId)) {
                 state.productBacklog.unshift(storyId); // Add back to top of product backlog
            }
            updateStoryStatus(storyId, 'backlog');
            // Reset relevant fields
            state.stories[storyId].chosenImplementation = null;
            state.stories[storyId].remainingEffort = state.stories[storyId].baseEffort;
            state.stories[storyId].progress = 0;
            state.stories[storyId].assignedWorker = null; // Ensure unassigned
            console.log(`Story ${storyId} removed from sprint backlog state.`);
            return true; // Indicate success
        }
    }
    console.warn(`Failed to remove story ${storyId} from sprint backlog state. Not found.`);
    return false; // Indicate failure or not found
}

// Central function to update status (doesn't move UI card directly)
export function updateStoryStatus(storyId, newStatus) {
    if (state.stories[storyId]) {
        const oldStatus = state.stories[storyId].status;
        if (oldStatus === newStatus) return; // No change

        state.stories[storyId].status = newStatus;
        console.log(`Story ${storyId} status updated from ${oldStatus} to ${newStatus}`);

        // If moved out of progress, ensure worker is unassigned
        if (newStatus !== 'inprogress' && oldStatus === 'inprogress' && state.stories[storyId].assignedWorker) {
            unassignWorkerFromStory(storyId); // Ensure consistency
        }
    } else {
        console.error(`Cannot update status for non-existent story ${storyId}`);
    }
}

// Called during the Assignment Phase confirmation
export function assignWorkerToStory(workerId, storyId) {
    const worker = state.team.find(w => w.id === workerId);
    const story = state.stories[storyId];

    // Ensure story is in 'ready' state and worker is available
    if (worker && story && worker.available && !worker.assignedStory && story.status === 'ready') {
        // Unassign from previous story if any (safety check - should not happen if logic is correct)
        if(story.assignedWorker) { unassignWorkerFromStory(storyId); }

        worker.assignedStory = storyId;
        story.assignedWorker = workerId;
        updateStoryStatus(storyId, 'inprogress'); // <<< CHANGE: Update status here
        console.log(`Worker ${worker.name} assigned to story ${story.title}. Status -> inprogress.`);
        return true;
    }
    console.warn(`Failed to assign worker ${workerId} to story ${storyId}. Worker available: ${worker?.available}, Worker assigned: ${worker?.assignedStory}, Story status: ${story?.status}`);
    return false;
}

// Unassigns worker AND resets story status if it wasn't done
export function unassignWorkerFromStory(storyId) {
     const story = state.stories[storyId];
     if (story && story.assignedWorker) {
         const worker = state.team.find(w => w.id === story.assignedWorker);
         const workerName = worker ? worker.name : 'Unknown Worker'; // Get name before potentially losing worker ref
         if (worker) {
             worker.assignedStory = null;
         }
         story.assignedWorker = null;
         console.log(`Worker ${workerName} unassigned from story ${story.title}`);

         // If unassigning and story is not 'done', reset status to 'ready'
         if (story.status === 'inprogress') {
             updateStoryStatus(storyId, 'ready'); // <<< CHANGE: Reset status if work stopped
         }
     }
}

// Called by simulation loop
export function applyWorkToStory(storyId, points) {
    const story = state.stories[storyId];
    if (story && story.remainingEffort > 0 && story.status === 'inprogress') {
        const pointsToApply = Math.min(points, story.remainingEffort); // Don't apply more than needed
        story.remainingEffort -= pointsToApply;
        story.progress = ((story.baseEffort - story.remainingEffort) / story.baseEffort) * 100;
        console.log(`Applied ${pointsToApply} points to ${storyId}. Remaining: ${story.remainingEffort}`);
        if (story.remainingEffort === 0) {
            markStoryAsCompleted(storyId); // This will update status to 'done' & unassign worker
            return true; // Story completed
        }
    } else if (story && story.status !== 'inprogress') {
         console.warn(`Attempted to apply work to story ${storyId} which is not 'inprogress' (status: ${story.status})`);
    }
    return false; // Story not completed
}

// Called internally when effort reaches 0
function markStoryAsCompleted(storyId) {
    if (state.stories[storyId] && state.stories[storyId].status !== 'done') {
        console.log(`Story ${storyId} completed!`);
        const wasAssignedWorker = state.stories[storyId].assignedWorker; // Check before status change potentially unassigns

        updateStoryStatus(storyId, 'done'); // <<< CHANGE: Update status to 'done'

        if (!state.currentSprintCompleted.includes(storyId)) {
             state.currentSprintCompleted.push(storyId);
        }
         if (!state.completedStories.includes(storyId)) { // Keep track globally too
            state.completedStories.push(storyId);
        }
        // Ensure worker is unassigned (updateStoryStatus might do this, but be explicit)
        if (wasAssignedWorker) {
            unassignWorkerFromStory(storyId);
        }
    }
}


export function advanceDay() {
    state.currentDay++;
    const currentPhase = getPhaseName(state.currentDay);
    console.log(`--- Advancing to Day ${state.currentDay} (${currentPhase}) ---`);

    // Reset daily points for workers only at the start of a work day
    if (currentPhase === 'Day 1 Work' || currentPhase === 'Day 2 Work') {
        state.team.forEach(w => {
            // Apply obstacle effects first if they persist
            const obstacle = state.obstacles.find(o => o.targetWorkerId === w.id && o.type === 'capacity_reduction' && o.duration > 0);
            if (obstacle) {
                 w.dailyPointsLeft = Math.max(0, w.pointsPerDay - obstacle.pointsLost);
                 obstacle.duration--; // Decrement duration
                 console.log(`Obstacle persists for ${w.name}, points: ${w.dailyPointsLeft}, duration left: ${obstacle.duration}`);
                 if (obstacle.duration <= 0) {
                     w.available = true; // Make available again if obstacle expires
                     console.log(`${w.name} becomes available again.`);
                 }
            } else {
                 w.dailyPointsLeft = w.pointsPerDay; // Reset fully
                 w.available = true; // Ensure available if no obstacle
            }
        });
         // Clean up expired obstacles
         state.obstacles = state.obstacles.filter(o => o.duration === undefined || o.duration > 0);
         // Reset blocked stories (blockers assumed to last 1 day unless logic changes)
         Object.values(state.stories).forEach(story => story.isBlocked = false);
    }
}

export function startNewSprint() {
    // Calculate velocity from completed stories
    const completedPoints = state.currentSprintCompleted
        .map(id => state.stories[id]?.baseEffort || 0) // Use base effort, check story exists
        .reduce((sum, points) => sum + points, 0);
    state.velocityHistory.push(completedPoints);

    // Reset for next sprint
    state.currentSprint++;
    state.currentDay = 0; // Back to planning
    state.sprintBacklog = [];
    state.currentSprintCompleted = [];
    state.obstacles = []; // Clear obstacles
    state.team.forEach(w => {
        w.available = true;
        w.assignedStory = null;
        w.dailyPointsLeft = w.pointsPerDay;
    });
    // Reset story statuses for any unfinished work from previous sprint?
    // Move unfinished back to Product Backlog.
    Object.values(state.stories).forEach(story => {
        if (story.status === 'inprogress' || story.status === 'ready') {
            console.log(`Moving unfinished story ${story.title} back to Product Backlog.`);
            story.status = 'backlog';
            story.remainingEffort = story.baseEffort;
            story.progress = 0;
            story.assignedWorker = null;
            if (!state.productBacklog.includes(story.id)) {
                state.productBacklog.unshift(story.id); // Add back if not already there
            }
        }
    });


    calculateTeamCapacity(); // Recalculate for the new sprint
    console.log(`Starting Sprint ${state.currentSprint}`);
}

// Calculates capacity based on the current team structure
export function calculateTeamCapacity() {
    const pointsPerDay = state.team.reduce((sum, worker) => sum + worker.pointsPerDay, 0);
    state.teamCapacity = pointsPerDay * 2; // Assuming 2 work days per sprint
}

export function recordRetrospective(well, improve, change) {
    state.retrospectiveNotes.push({
        sprint: state.currentSprint,
        well,
        improve,
        change
    });
    // TODO: Potentially apply minor buffs/changes for next sprint based on 'change'
}

export function setStoryImplementation(storyId, choice) {
     if (state.stories[storyId]) {
        state.stories[storyId].chosenImplementation = choice;
        state.stories[storyId].remainingEffort = choice.effort; // Update effort based on choice
        state.stories[storyId].baseEffort = choice.effort; // Update base effort too
        console.log(`Implementation chosen for ${storyId}: ${choice.description}, Effort: ${choice.effort}`);
    }
}

export function useWorkerPoints(workerId, pointsUsed) {
     const worker = getWorkerById(workerId);
     if (worker) {
         const pointsActuallyUsed = Math.min(pointsUsed, worker.dailyPointsLeft); // Ensure not negative
         worker.dailyPointsLeft -= pointsActuallyUsed;
         // console.log(`Worker ${worker.name} used ${pointsActuallyUsed} points. ${worker.dailyPointsLeft} left.`);
     }
}

// --- Obstacles (Add duration) ---
export function addObstacle(obstacle) {
    // Add a duration (e.g., 1 day)
    const obstacleWithDuration = { ...obstacle, id: `obs-${Date.now()}-${Math.random()}`, duration: 1 }; // Add ID and duration
    state.obstacles.push(obstacleWithDuration);

    if (obstacle.type === 'capacity_reduction') {
        const worker = state.team.find(w => w.id === obstacle.targetWorkerId);
        if (worker) {
            // Apply reduction immediately for the current day
            worker.dailyPointsLeft = Math.max(0, worker.dailyPointsLeft - obstacle.pointsLost);
            worker.available = obstacle.makesUnavailable ? false : worker.available;
            console.log(`Obstacle Applied: ${obstacle.message} to ${worker.name} for ${obstacleWithDuration.duration} day(s). Points left: ${worker.dailyPointsLeft}, Available: ${worker.available}`);
        }
    }
     if (obstacle.type === 'blocker') {
         const story = state.stories[obstacle.targetStoryId];
         if(story) {
             story.isBlocked = true;
             console.log(`Obstacle Applied: ${obstacle.message} blocking story ${story.title}`);
             // Blockers assumed to last 1 day (reset in advanceDay)
         }
     }
}

// Helper to get phase name
export function getPhaseName(dayNumber) {
    switch (dayNumber) {
        case 0: return 'Planning';
        case 1: return 'Assign Workers';
        case 2: return 'Day 1 Work';
        case 3: return 'Day 2 Work';
        case 4: return 'Review & Retro';
        default: return 'Unknown Phase';
    }
}