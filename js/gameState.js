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
    stories: {},
    team: [
        { id: 'w1', name: 'Vicky Senior', area: 'Visual', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
        { id: 'w2', name: 'Val Junior', area: 'Visual', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
        { id: 'w3', name: 'Terry Senior', area: 'Text', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
        { id: 'w4', name: 'Tom Junior', area: 'Text', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
        { id: 'w5', name: 'Tessa Senior', area: 'Testing', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
        { id: 'w6', name: 'Tim Junior', area: 'Testing', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
    ],
    teamCapacity: 0,
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

// --- Constants ---
const TESTING_EFFORT_PER_STORY = 1;

// --- Initialization ---
export function loadInitialState(initialBacklog) {
     state = {
        currentSprint: 1,
        currentDay: 0,
        productBacklog: [],
        sprintBacklog: [],
        stories: {},
        team: [
            { id: 'w1', name: 'Vicky Senior', area: 'Visual', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
            { id: 'w2', name: 'Val Junior', area: 'Visual', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
            { id: 'w3', name: 'Terry Senior', area: 'Text', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
            { id: 'w4', name: 'Tom Junior', area: 'Text', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
            { id: 'w5', name: 'Tessa Senior', area: 'Testing', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3 },
            { id: 'w6', name: 'Tim Junior', area: 'Testing', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1 },
        ],
        teamCapacity: 0,
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
            baseEffort: storyData.effort,
            isBlocked: false,
        };
        state.productBacklog.push(storyId);
    });
    calculateTeamCapacity();
    console.log("Initial state loaded (Testing Team):", state);
    console.log("Calculated Team Capacity:", state.teamCapacity);
}

// --- Getters ---
export function getProductBacklog() { return state.productBacklog.map(id => state.stories[id]).filter(Boolean); }
export function getSprintBacklog() { return state.sprintBacklog.map(id => state.stories[id]).filter(Boolean); }
export function getStory(id) { return state.stories[id]; }
export function getAllStories() { return state.stories; }
export function getTeam() { return state.team; }
export function getAvailableWorkers() { return state.team.filter(w => w.available && !w.assignedStory); }
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


// --- Mutations ---

export function addStoryToSprint(storyId) {
    if (!state.sprintBacklog.includes(storyId) && state.productBacklog.includes(storyId)) {
        state.sprintBacklog.push(storyId);
        state.productBacklog = state.productBacklog.filter(id => id !== storyId);
        updateStoryStatus(storyId, 'ready');
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
            updateStoryStatus(storyId, 'backlog');
            state.stories[storyId].chosenImplementation = null;
            state.stories[storyId].remainingEffort = state.stories[storyId].baseEffort;
            state.stories[storyId].testingEffortRemaining = TESTING_EFFORT_PER_STORY;
            state.stories[storyId].progress = 0;
            state.stories[storyId].testingProgress = 0;
            state.stories[storyId].assignedWorker = null;
            console.log(`Story ${storyId} removed from sprint backlog state.`);
            return true;
        }
    }
    console.warn(`Failed to remove story ${storyId} from sprint backlog state. Not found.`);
    return false;
}

export function updateStoryStatus(storyId, newStatus) {
    if (state.stories[storyId]) {
        const oldStatus = state.stories[storyId].status;
        if (oldStatus === newStatus) return;

        state.stories[storyId].status = newStatus;
        console.log(`Story ${storyId} status updated from ${oldStatus} to ${newStatus}`);

        // If moved out of progress or testing, ensure worker is unassigned
        if ((newStatus !== 'inprogress' && newStatus !== 'testing') && (oldStatus === 'inprogress' || oldStatus === 'testing') && state.stories[storyId].assignedWorker) {
            unassignWorkerFromStory(storyId);
        }
    } else {
        console.error(`Cannot update status for non-existent story ${storyId}`);
    }
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

    let targetStatus = story.status;
    let canAssign = false;

    if (worker.area === 'Testing' && story.status === 'testing') {
        canAssign = true;
    } else if (worker.area !== 'Testing' && story.status === 'ready') {
        canAssign = true;
        targetStatus = 'inprogress';
    } else if (worker.area !== 'Testing' && story.status === 'inprogress') {
        canAssign = true; // Reassignment allowed
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
    // Update status only if moving from Ready to In Progress
    if (story.status === 'ready' && targetStatus === 'inprogress') {
        updateStoryStatus(storyId, 'inprogress');
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
         }
         story.assignedWorker = null;
         console.log(`Worker ${workerName} unassigned from story ${story.title}`);

         // If unassigning from 'inprogress', reset status to 'ready'
         // If unassigning from 'testing', it stays in 'testing'
         if (story.status === 'inprogress') {
             updateStoryStatus(storyId, 'ready');
         }
     }
}

export function applyWorkToStory(storyId, points, workerArea) {
    const story = state.stories[storyId];
    if (!story) return false;

    if (workerArea !== 'Testing' && story.status === 'inprogress' && story.remainingEffort > 0) {
        // --- Development Work ---
        const pointsToApply = Math.min(points, story.remainingEffort);
        story.remainingEffort -= pointsToApply;
        story.progress = ((story.baseEffort - story.remainingEffort) / story.baseEffort) * 100;
        console.log(`DEV: Applied ${pointsToApply} points to ${storyId}. Dev Remaining: ${story.remainingEffort}`);

        if (story.remainingEffort === 0) {
            console.log(`DEV Complete for ${storyId}. Moving to Testing.`);
            const devWorkerId = story.assignedWorker; // Get worker before status change potentially unassigns
            updateStoryStatus(storyId, 'testing'); // Move to Testing state
            // Explicitly unassign the dev worker now dev work is done
            if (devWorkerId) {
                unassignWorkerFromStory(storyId); // This will also reset status if needed, but we just set it to testing
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
            markStoryAsDone(storyId); // Final completion step (will unassign tester)
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
    if (state.stories[storyId] && state.stories[storyId].status !== 'done') {
        console.log(`Story ${storyId} is DONE!`);
        const wasAssignedWorker = state.stories[storyId].assignedWorker;
        updateStoryStatus(storyId, 'done');
        if (!state.currentSprintCompleted.includes(storyId)) {
             state.currentSprintCompleted.push(storyId);
        }
         if (!state.completedStories.includes(storyId)) {
            state.completedStories.push(storyId);
        }
        if (wasAssignedWorker) {
            unassignWorkerFromStory(storyId);
        }
    }
}

export function advanceDay() {
    state.currentDay++;
    const currentPhase = getPhaseName(state.currentDay);
    console.log(`--- Advancing to Day ${state.currentDay} (${currentPhase}) ---`);

    if (currentPhase === 'Day 1 Work' || currentPhase === 'Day 2 Work' || currentPhase === 'Reassign Workers Day 2') {
        state.team.forEach(w => {
            const obstacle = state.obstacles.find(o => o.targetWorkerId === w.id && o.type === 'capacity_reduction' && o.duration > 0);
            if (obstacle) {
                 w.dailyPointsLeft = Math.max(0, w.pointsPerDay - obstacle.pointsLost);
                 obstacle.duration--;
                 console.log(`Obstacle persists for ${w.name}, points: ${w.dailyPointsLeft}, duration left: ${obstacle.duration}`);
                 if (obstacle.duration <= 0) {
                     w.available = true;
                     console.log(`${w.name} becomes available again.`);
                 } else {
                     w.available = obstacle.makesUnavailable ? false : true;
                 }
            } else {
                 w.dailyPointsLeft = w.pointsPerDay;
                 w.available = true;
            }
        });
         state.obstacles = state.obstacles.filter(o => o.duration === undefined || o.duration > 0);
         Object.values(state.stories).forEach(story => story.isBlocked = false);
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
        w.dailyPointsLeft = w.pointsPerDay;
    });
    Object.values(state.stories).forEach(story => {
        if (story.status === 'inprogress' || story.status === 'ready' || story.status === 'testing') {
            console.log(`Moving unfinished story ${story.title} (Status: ${story.status}) back to Product Backlog.`);
            story.status = 'backlog';
            story.remainingEffort = story.baseEffort;
            story.testingEffortRemaining = TESTING_EFFORT_PER_STORY;
            story.progress = 0;
            story.testingProgress = 0;
            story.assignedWorker = null;
            if (!state.productBacklog.includes(story.id)) {
                state.productBacklog.unshift(story.id);
            }
        }
    });
    calculateTeamCapacity();
    console.log(`Starting Sprint ${state.currentSprint}`);
}

export function calculateTeamCapacity() {
    const pointsPerDay = state.team.reduce((sum, worker) => sum + worker.pointsPerDay, 0);
    state.teamCapacity = pointsPerDay * 2;
}

export function recordRetrospective(well, improve, change) {
    state.retrospectiveNotes.push({ sprint: state.currentSprint, well, improve, change });
}
export function setStoryImplementation(storyId, choice) {
     if (state.stories[storyId]) {
        state.stories[storyId].chosenImplementation = choice;
        state.stories[storyId].remainingEffort = choice.effort;
        state.stories[storyId].baseEffort = choice.effort;
        console.log(`Implementation chosen for ${storyId}: ${choice.description}, Effort: ${choice.effort}`);
    }
}
export function useWorkerPoints(workerId, pointsUsed) {
     const worker = getWorkerById(workerId);
     if (worker) {
         const pointsActuallyUsed = Math.min(pointsUsed, worker.dailyPointsLeft);
         worker.dailyPointsLeft -= pointsActuallyUsed;
     }
}
export function addObstacle(obstacle) {
    const obstacleWithDuration = { ...obstacle, id: `obs-${Date.now()}-${Math.random()}`, duration: 1 };
    state.obstacles.push(obstacleWithDuration);
    if (obstacle.type === 'capacity_reduction') {
        const worker = state.team.find(w => w.id === obstacle.targetWorkerId);
        if (worker) {
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