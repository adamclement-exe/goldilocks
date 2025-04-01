// --- START OF FILE gameState.js ---

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
    team: [ // Worker still assigned to one primary story for focus
        { id: 'w1', name: 'Vicky Senior', area: 'Visual', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
        { id: 'w2', name: 'Val Junior', area: 'Visual', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
        { id: 'w3', name: 'Terry Senior', area: 'Text', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
        { id: 'w4', name: 'Tom Junior', area: 'Text', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
        { id: 'w5', name: 'Tessa Senior', area: 'Testing', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
        { id: 'w6', name: 'Tim Junior', area: 'Testing', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
    ],
    teamCapacity: 0,
    wipLimits: { // UPDATED: Define WIP limits
        inprogress: 3, // Max 3 stories in progress
        testing: 3     // Max 3 stories in testing
    },
    currentWip: { // Track current WIP counts
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
export const UNBLOCKING_COST = 1; // How many points it costs a Senior to unblock

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
        wipLimits: { inprogress: 3, testing: 3 }, // Reset WIP limits (UPDATED)
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
            assignedWorkers: [], // CHANGED: Now an array
            chosenImplementation: null,
            baseEffort: storyData.effort, // Keep original effort
            isBlocked: false,
            daysInState: 0,
            enteredInProgressTimestamp: null,
            completedTimestamp: null,
        };
        state.productBacklog.push(storyId);
    });
    calculateTeamCapacity();
    console.log("Initial state loaded (Multi-Assign, WIP 3):", state);
    console.log("Calculated Team Capacity:", state.teamCapacity);
}

// --- Getters ---
export function getProductBacklog() { return state.productBacklog.map(id => state.stories[id]).filter(Boolean); }
export function getSprintBacklog() { return state.sprintBacklog.map(id => state.stories[id]).filter(Boolean); }
export function getStory(id) { return state.stories[id]; }
export function getAllStories() { return state.stories; }
export function getTeam() { return state.team; }
// Worker is available if not unavailable AND not currently assigned to *any* story AND not unblocking
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
export function getWipLimits() { return state.wipLimits; }
export function getCurrentWip() { return state.currentWip; }

// --- Mutations ---

function updateWipCount() {
    state.currentWip.inprogress = 0;
    state.currentWip.testing = 0;
    Object.values(state.stories).forEach(story => {
        // A story contributes to WIP if it's in the state AND has at least one worker assigned
        if (story.status === 'inprogress' && story.assignedWorkers.length > 0) {
            state.currentWip.inprogress++;
        } else if (story.status === 'testing' && story.assignedWorkers.length > 0) {
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
        const story = state.stories[storyId];
        if(story) {
            if (!state.productBacklog.includes(storyId)) {
                 state.productBacklog.unshift(storyId);
            }
            // Unassign all workers when moving back
            if (story.assignedWorkers && story.assignedWorkers.length > 0) {
                 [...story.assignedWorkers].forEach(workerId => { // Iterate over a copy
                     const worker = getWorkerById(workerId);
                     if (worker) worker.assignedStory = null;
                 });
                 story.assignedWorkers = []; // Clear the array
            }
            // Reset relevant fields
            story.chosenImplementation = null;
            story.remainingEffort = story.baseEffort;
            story.testingEffortRemaining = TESTING_EFFORT_PER_STORY;
            story.progress = 0;
            story.testingProgress = 0;
            story.enteredInProgressTimestamp = null;
            story.completedTimestamp = null;
            story.isBlocked = false;
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

    // If moved out of progress or testing, ensure all workers are unassigned from this story
    if ((newStatus !== 'inprogress' && newStatus !== 'testing') && (oldStatus === 'inprogress' || oldStatus === 'testing')) {
         if (story.assignedWorkers && story.assignedWorkers.length > 0) {
             console.log(`Story ${storyId} moved out of active state (${oldStatus} -> ${newStatus}), unassigning workers: ${story.assignedWorkers.join(', ')}`);
             [...story.assignedWorkers].forEach(workerId => {
                  unassignWorkerFromStory(workerId, storyId); // Use modified unassign function
             });
         }
    }

    // Update WIP counts after status change and potential unassignments
    updateWipCount();
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
        return false; // Should be handled by UI, but double-check
    }
    // CHANGED: Check if worker is assigned to *any* other story
    if (worker.assignedStory && worker.assignedStory !== storyId) {
        console.warn(`Assign failed: Worker ${worker.name} is already assigned to ${worker.assignedStory}.`);
        alert(`Worker ${worker.name} is already assigned to ${getStory(worker.assignedStory)?.title}. Unassign them first if you want them to work on ${story.title}.`);
        return false;
    }
     if (worker.isUnblocking) {
         console.warn(`Assign failed: Worker ${worker.name} is currently assigned to unblock a story.`);
         alert(`Worker ${worker.name} is busy unblocking another story.`);
         return false;
     }
     // CHANGED: Check if worker is *already* assigned to *this* story
     if (story.assignedWorkers.includes(workerId)) {
          console.warn(`Assign failed: Worker ${worker.name} is already assigned to this story (${story.title}).`);
          // No alert needed, just prevent double assignment
          return false;
     }

    let targetStatus = story.status;
    let canAssign = false;
    let isFirstWorker = story.assignedWorkers.length === 0;

    // --- WIP Limit Check ---
    // Only check WIP limit if this is the *first* worker being assigned, moving the story into an active state
    if (isFirstWorker) {
        if (worker.area !== 'Testing' && story.status === 'ready') { // Moving to 'inprogress'
            if (state.currentWip.inprogress >= state.wipLimits.inprogress) {
                console.warn(`Assign failed: WIP Limit for 'In Progress' (${state.wipLimits.inprogress}) reached. Cannot start new story.`);
                alert(`Cannot assign the first worker to ${story.title} (In Progress). WIP Limit (${state.wipLimits.inprogress}) reached. Finish other work first!`);
                return false;
            }
            targetStatus = 'inprogress'; // Will trigger status update later
        } else if (worker.area === 'Testing' && story.status === 'testing') { // Moving to 'testing' (first tester)
            if (state.currentWip.testing >= state.wipLimits.testing) {
                console.warn(`Assign failed: WIP Limit for 'Testing' (${state.wipLimits.testing}) reached. Cannot start testing new story.`);
                alert(`Cannot assign the first tester to ${story.title}. Testing WIP Limit (${state.wipLimits.testing}) reached. Finish other testing first!`);
                return false;
            }
            // No status change, already 'testing'
        }
    }
    // --- End WIP Limit Check ---

    // Check if worker role matches the required work phase
    if (worker.area === 'Testing' && story.status === 'testing') {
        canAssign = true;
    } else if (worker.area !== 'Testing' && (story.status === 'ready' || story.status === 'inprogress')) {
        // Devs can be assigned to 'ready' (moving to 'inprogress') or 'inprogress' (joining existing work)
        canAssign = true;
        if (story.status === 'ready') targetStatus = 'inprogress'; // Set target status if moving from ready
    } else if (worker.area === 'Testing' && story.status !== 'testing') {
         console.warn(`Assign failed: Cannot assign Tester ${worker.name} to story ${story.title} in '${story.status}' status.`);
         alert(`Cannot assign Tester ${worker.name} to story ${story.title}. It must be in 'Testing' status.`);
         return false;
    } else if (worker.area !== 'Testing' && story.status === 'testing') {
         console.warn(`Assign failed: Cannot assign Dev ${worker.name} to story ${story.title} in 'Testing' status.`);
         alert(`Cannot assign Dev ${worker.name} to story ${story.title} while it's in 'Testing'.`);
         return false;
    } else {
         console.warn(`Assign failed: Unknown reason for worker ${worker.name} (${worker.area}) to story ${story.title} (${story.status}).`);
         return false;
    }

    if (!canAssign) return false;

    // --- Perform Assignment ---
    // Unassign worker from their *previous* story if they were assigned elsewhere
    if (worker.assignedStory && worker.assignedStory !== storyId) {
         unassignWorkerFromStory(workerId, worker.assignedStory); // Unassign from old story
    }

    // Assign worker to this story
    worker.assignedStory = storyId; // Worker focuses on this story
    story.assignedWorkers.push(workerId); // Add to story's list
    worker.isUnblocking = false; // Ensure they are not marked as unblocking

    console.log(`Worker ${worker.name} assigned to story ${story.title}. Current workers: [${story.assignedWorkers.join(', ')}].`);

    // Update status only if moving from Ready to In Progress (triggered by first Dev worker)
    // updateStoryStatus handles WIP counts and cycle time start
    if (story.status === 'ready' && targetStatus === 'inprogress') {
        updateStoryStatus(storyId, 'inprogress'); // This calls updateWipCount
    } else if (isFirstWorker && targetStatus === story.status) {
        // If it was the first worker assigned but status didn't change (e.g., first tester on 'testing' story),
        // we still need to potentially update WIP count.
        updateWipCount();
    }
    // If adding subsequent workers, WIP count doesn't change.

    return true;
}

export function unassignWorkerFromStory(workerId, storyId) {
     const story = state.stories[storyId];
     const worker = state.team.find(w => w.id === workerId);

     if (!story || !worker) {
          console.warn(`Unassign failed: Worker ${workerId} or Story ${storyId} not found.`);
          return false;
     }

     const workerIndex = story.assignedWorkers.indexOf(workerId);
     if (workerIndex !== -1) {
         story.assignedWorkers.splice(workerIndex, 1); // Remove worker from story
         console.log(`Worker ${worker.name} unassigned from story ${story.title}. Remaining workers: [${story.assignedWorkers.join(', ')}].`);

         // Clear worker's assignment only if they were assigned to this story
         if (worker.assignedStory === storyId) {
             worker.assignedStory = null;
         }
          worker.isUnblocking = false; // Make sure this is reset

         const wasLastWorker = story.assignedWorkers.length === 0;

         // If unassigning the last worker from 'inprogress', reset status to 'ready' (unless blocked)
         // If unassigning the last worker from 'testing', it stays in 'testing' (needs a new tester)
         if (wasLastWorker && story.status === 'inprogress' && !story.isBlocked) {
             console.log(`Last worker unassigned from ${storyId}, moving back to 'ready'.`);
             updateStoryStatus(storyId, 'ready'); // This handles WIP update
         } else {
             // If status doesn't change OR it wasn't the last worker, update WIP anyway
             // as removing the last worker *does* affect WIP.
             updateWipCount();
         }
         return true;
     } else {
          console.warn(`Cannot unassign: Worker ${worker.name} was not assigned to story ${story.title}.`);
          return false;
     }
}

// Assigning a Senior to unblock *adds* them temporarily if needed, consumes their points, and unblocks.
// Does not remove other workers.
export function assignSeniorToUnblock(workerId, storyId) {
    const worker = state.team.find(w => w.id === workerId);
    const story = state.stories[storyId];

    if (!worker || !story) { console.error(`Unblock assign failed: Worker ${workerId} or Story ${storyId} not found.`); return false; }
    if (worker.skill !== 'Senior' || worker.area === 'Testing') { alert(`Only Senior Developers (Text/Visual) can unblock stories.`); return false; }
    if (!worker.available) { alert(`Worker ${worker.name} is not available to unblock.`); return false; }
    if (worker.assignedStory) { alert(`Worker ${worker.name} is already assigned to another task.`); return false; }
    if (!story.isBlocked) { alert(`Story ${story.title} is not currently blocked.`); return false; }
    if (worker.dailyPointsLeft < UNBLOCKING_COST) { alert(`Worker ${worker.name} requires ${UNBLOCKING_COST} point(s) to unblock, but only has ${worker.dailyPointsLeft}.`); return false; }

    // Unassign any *other* worker currently marked as unblocking this specific story (edge case cleanup)
    state.team.forEach(w => {
        if (w.id !== workerId && w.isUnblocking && w.assignedStory === storyId) {
            w.isUnblocking = false;
            w.assignedStory = null; // Clear their assignment as they are no longer unblocking
            console.log(`Previously assigned unblocker ${w.name} unassigned.`);
        }
    });

    worker.assignedStory = storyId; // Temporarily assign story ID for focus/reference
    worker.isUnblocking = true; // Mark as unblocking for the day
    worker.dailyPointsLeft -= UNBLOCKING_COST; // Consume points immediately
    story.isBlocked = false; // Unblock the story
    story.daysInState = 0; // Reset age counter as it's actionable again

    console.log(`Worker ${worker.name} assigned to UNBLOCK story ${story.title}. Points remaining: ${worker.dailyPointsLeft}. Story unblocked.`);

    // Worker is now busy unblocking for the rest of the day.
    // They *remain* technically assigned to the story via worker.assignedStory for this day cycle.
    // They do NOT get added to story.assignedWorkers array unless explicitly assigned for regular work later.
    // They will become available (isUnblocking=false) and unassigned (assignedStory=null) during the next day reset cycle, unless the story finished.

    return true;
}


// Apply work from *all* assigned workers suitable for the current phase
export function applyWorkToStory(storyId) {
    const story = state.stories[storyId];
    if (!story || story.assignedWorkers.length === 0) return false; // No assigned workers

    // Ensure work isn't applied if blocked
    if (story.isBlocked) {
        console.warn(`Work blocked on story ${storyId}.`);
        return false; // No work applied by anyone
    }

    let totalDevPointsApplied = 0;
    let totalTestPointsApplied = 0;
    let devCompleteThisCycle = false;
    let testCompleteThisCycle = false;

    // Iterate through assigned workers
    [...story.assignedWorkers].forEach(workerId => { // Iterate over a copy in case of unassignment during loop
        const worker = getWorkerById(workerId);
        // Skip if worker not found, unavailable, unblocking, or has no points left
        if (!worker || !worker.available || worker.isUnblocking || worker.dailyPointsLeft <= 0) {
            return; // Skip this worker for this cycle
        }

        let pointsAvailable = worker.dailyPointsLeft;
        const specialtyBonus = story.tags.includes(worker.area) ? 1 : 0; // Simple bonus
        let workerPointsToApply = Math.min(worker.pointsPerDay + specialtyBonus, pointsAvailable);

        // Check if worker type matches story status and apply points
        if (worker.area !== 'Testing' && story.status === 'inprogress' && story.remainingEffort > 0) {
            // --- Development Work ---
            let actualPoints = Math.min(workerPointsToApply, story.remainingEffort - totalDevPointsApplied); // Apply only up to remaining dev effort
            actualPoints = Math.max(0, actualPoints); // Ensure non-negative

            if (actualPoints > 0) {
                totalDevPointsApplied += actualPoints;
                useWorkerPoints(worker.id, actualPoints); // Deduct points from worker
                console.log(`DEV: ${worker.name} applied ${actualPoints} points to ${storyId}. Worker pts left: ${worker.dailyPointsLeft}.`);
            }

        } else if (worker.area === 'Testing' && story.status === 'testing' && story.testingEffortRemaining > 0) {
            // --- Testing Work ---
            let actualPoints = Math.min(workerPointsToApply, story.testingEffortRemaining - totalTestPointsApplied); // Apply only up to remaining test effort
            actualPoints = Math.max(0, actualPoints); // Ensure non-negative

            if (actualPoints > 0) {
                totalTestPointsApplied += actualPoints;
                useWorkerPoints(worker.id, actualPoints); // Deduct points from worker
                console.log(`TEST: ${worker.name} applied ${actualPoints} points to ${storyId}. Worker pts left: ${worker.dailyPointsLeft}.`);
            }
        }
        // else: Worker type doesn't match current phase, no work applied by this worker
    }); // End foreach worker

    // --- Update Story Progress After All Workers ---
    if (totalDevPointsApplied > 0) {
        story.remainingEffort -= totalDevPointsApplied;
        story.remainingEffort = Math.max(0, story.remainingEffort); // Ensure not negative
        story.progress = ((story.baseEffort - story.remainingEffort) / story.baseEffort) * 100;
        console.log(`Total DEV points applied to ${storyId}: ${totalDevPointsApplied}. Dev Remaining: ${story.remainingEffort}`);
        if (story.remainingEffort === 0) {
             devCompleteThisCycle = true;
        }
    }

    if (totalTestPointsApplied > 0) {
        story.testingEffortRemaining -= totalTestPointsApplied;
        story.testingEffortRemaining = Math.max(0, story.testingEffortRemaining); // Ensure not negative
        story.testingProgress = ((TESTING_EFFORT_PER_STORY - story.testingEffortRemaining) / TESTING_EFFORT_PER_STORY) * 100;
         console.log(`Total TEST points applied to ${storyId}: ${totalTestPointsApplied}. Test Remaining: ${story.testingEffortRemaining}`);
        if (story.testingEffortRemaining === 0) {
            testCompleteThisCycle = true;
        }
    }

    // --- Handle State Transitions ---
    if (devCompleteThisCycle && story.status === 'inprogress') {
        console.log(`DEV Complete for ${storyId}. Moving to Testing.`);
        // Unassign *all* Dev workers (non-testers) as their work is done
        [...story.assignedWorkers].forEach(workerId => {
            const worker = getWorkerById(workerId);
            if (worker && worker.area !== 'Testing') {
                 unassignWorkerFromStory(workerId, storyId);
            }
        });
        updateStoryStatus(storyId, 'testing'); // Move to Testing state (handles WIP, daysInState)

        // Informational warning if testing WIP is high
        if (state.currentWip.testing >= state.wipLimits.testing) {
              console.warn(`Story ${storyId} completed DEV but Testing WIP limit may be constraining.`);
        }
        return false; // Story not fully DONE yet
    }

    if (testCompleteThisCycle && story.status === 'testing') {
        markStoryAsDone(storyId); // Final completion step (will unassign any remaining testers, update WIP)
        return true; // Story is fully DONE
    }

    return false; // Story not fully DONE
}


function markStoryAsDone(storyId) {
    const story = state.stories[storyId];
    if (story && story.status !== 'done') {
        console.log(`Story ${storyId} is DONE!`);
        story.completedTimestamp = state.currentDay; // Record completion day for Cycle Time

        // Unassign any remaining workers (should only be testers at this point)
        const workersToUnassign = [...story.assignedWorkers]; // Copy array
        workersToUnassign.forEach(workerId => {
             unassignWorkerFromStory(workerId, storyId);
        });

        // Update status *after* unassigning workers to ensure correct WIP calculation transition
        updateStoryStatus(storyId, 'done'); // Handles WIP update and daysInState reset

        if (!state.currentSprintCompleted.includes(storyId)) {
             state.currentSprintCompleted.push(storyId);
        }
         if (!state.completedStories.includes(storyId)) {
            state.completedStories.push(storyId);
        }
    }
}


export function advanceDay() {
    state.currentDay++;
    const currentPhase = getPhaseName(state.currentDay);
    console.log(`--- Advancing to Day ${state.currentDay} (${currentPhase}) ---`);

    // Increment WIP Aging for stories in progress or testing *that are not blocked* AND have workers
    Object.values(state.stories).forEach(story => {
        if ((story.status === 'inprogress' || story.status === 'testing') && !story.isBlocked && story.assignedWorkers.length > 0) {
            story.daysInState++;
        }
        // Reset blocker status (will be re-applied if obstacle occurs)
        // Blockers are now resolved immediately by assigning a senior, not carried over days.
        story.isBlocked = false; // Reset blocker daily
    });

    // Reset workers' daily points and availability
    // Also handle end-of-day for unblocking workers
    if (currentPhase === 'Assign Workers Day 1' || currentPhase === 'Day 1 Work' || currentPhase === 'Reassign Workers Day 2' || currentPhase === 'Day 2 Work') {
        state.team.forEach(w => {
            w.dailyPointsLeft = w.pointsPerDay;
            w.available = true; // Assume available initially

            // If worker was unblocking, task is done, make them available and unassigned
            if (w.isUnblocking) {
                 console.log(`Worker ${w.name} finished unblocking task for story ${w.assignedStory}.`);
                 w.isUnblocking = false;
                 w.assignedStory = null; // No longer focused on the unblocking task
            }
            // Note: worker.assignedStory persists if they were doing normal work, unless story finished.

            // Check for new/persistent capacity reduction obstacles AFTER resetting points
            const obstacle = state.obstacles.find(o => o.targetWorkerId === w.id && o.type === 'capacity_reduction' && o.duration > 0);
            if (obstacle) {
                 w.dailyPointsLeft = Math.max(0, w.pointsPerDay - obstacle.pointsLost);
                 obstacle.duration--;
                 console.log(`Obstacle persists for ${w.name}, points: ${w.dailyPointsLeft}, duration left: ${obstacle.duration}`);
                 w.available = !obstacle.makesUnavailable; // Set availability based on obstacle
                 // If made unavailable, unassign from current story
                 if (!w.available && w.assignedStory) {
                      console.log(`${w.name} made unavailable by obstacle, unassigning from story ${w.assignedStory}`);
                      unassignWorkerFromStory(w.id, w.assignedStory);
                 }
            }
        });
        // Remove expired obstacles
         state.obstacles = state.obstacles.filter(o => o.duration === undefined || o.duration > 0);
    }
     // Apply new blockers *after* resetting points/availability and aging
     applyDailyBlockers();
}

function applyDailyBlockers() {
     // Find blocker obstacles generated for *today* (duration typically 1, added in simulation phase before advanceDay)
     const todayBlockers = state.obstacles.filter(o => o.type === 'blocker' && o.duration > 0); // Check duration just in case
     todayBlockers.forEach(blocker => {
          const story = state.stories[blocker.targetStoryId];
           if(story && (story.status === 'inprogress' || story.status === 'testing')) {
             story.isBlocked = true;
             story.daysInState = 0; // Reset age as it's now blocked
             console.log(`Obstacle Applied: ${blocker.message} blocking story ${story.title}`);
             // Worker impact is handled during work simulation (cannot work on blocked item)
             // And in reassignment UI (cannot assign to blocked items)
           } else if (story) {
               console.log(`Blocker Skipped: Target story ${story?.title} status is ${story?.status}.`);
           }
     });
     // Blockers are resolved manually in the Reassignment phase, not automatically removed here.
}


export function startNewSprint() {
    // Calculate velocity from stories fully completed in the sprint
    const completedPoints = state.currentSprintCompleted
        .map(id => state.stories[id]?.baseEffort || 0) // Use base effort for velocity calc
        .reduce((sum, points) => sum + points, 0);
    state.velocityHistory.push(completedPoints);

    state.currentSprint++;
    state.currentDay = 0;
    state.sprintBacklog = [];
    state.currentSprintCompleted = [];
    state.obstacles = [];

    // Reset team availability and assignments
    state.team.forEach(w => {
        w.available = true;
        w.assignedStory = null;
        w.isUnblocking = false;
        w.dailyPointsLeft = w.pointsPerDay;
    });

    // Handle unfinished stories
    Object.values(state.stories).forEach(story => {
        if (story.status === 'inprogress' || story.status === 'ready' || story.status === 'testing') {
            console.log(`Moving unfinished story ${story.title} (Status: ${story.status}) back to Product Backlog.`);
            story.status = 'backlog';
            // Reset progress based on base effort
            story.remainingEffort = story.baseEffort;
            story.testingEffortRemaining = TESTING_EFFORT_PER_STORY;
            story.progress = 0;
            story.testingProgress = 0;
            story.assignedWorkers = []; // Clear workers
            story.isBlocked = false;
            story.daysInState = 0;
            story.enteredInProgressTimestamp = null;
            // story.completedTimestamp = null; // Should be null

            if (!state.productBacklog.includes(story.id)) {
                state.productBacklog.unshift(story.id); // Add back to top of product backlog
            }
        } else if (story.status === 'done') {
             story.daysInState = 0; // Reset age for completed stories too
        }
    });

    updateWipCount(); // Recalculate WIP (should be 0)
    calculateTeamCapacity();
    console.log(`Starting Sprint ${state.currentSprint}`);
}


export function calculateTeamCapacity() {
    // Capacity is total points available over the 2 working days
    const pointsPerDay = state.team.reduce((sum, worker) => sum + worker.pointsPerDay, 0);
    state.teamCapacity = pointsPerDay * 2; // Assuming 2 working days per sprint
}

export function recordRetrospective(well, improve, change) {
    state.retrospectiveNotes.push({ sprint: state.currentSprint, well, improve, change });
}
export function setStoryImplementation(storyId, choice) {
     const story = state.stories[storyId];
     if (story) {
        const oldEffort = story.baseEffort;
        story.chosenImplementation = choice;
        story.baseEffort = choice.effort; // Update base effort to chosen effort

        // Reset progress if effort changed, or if it was previously in progress/testing
        if (oldEffort !== choice.effort || story.status === 'inprogress' || story.status === 'testing') {
             story.remainingEffort = choice.effort;
             story.progress = 0;
             story.testingEffortRemaining = TESTING_EFFORT_PER_STORY; // Reset testing too
             story.testingProgress = 0;
             console.log(`Implementation changed effort/state for ${storyId}. Progress reset. New Effort: ${choice.effort}`);
        }
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

    // Capacity reduction effect is applied during advanceDay
    // Blocker effect is applied during advanceDay (applyDailyBlockers)
    console.log(`Obstacle generated: ${obstacle.message}. Effect applied at start of next relevant phase.`);
    // Immediate unavailability for sick days is handled in advanceDay now
}
export function setDoD(level) {
    if (dodDefinitions[level]) {
        state.chosenDoD = level;
        state.dodBonusPoints = dodDefinitions[level].bonusPoints;
        console.log(`Definition of Done set to: ${level}, Bonus: ${state.dodBonusPoints}`);
    } else { console.error(`Invalid DoD level chosen: ${level}`); }
}
export function checkDoDMet() {
    if (!state.chosenDoD) { state.dodMet = false; return false; }
    const definition = dodDefinitions[state.chosenDoD];
    if (!definition) { state.dodMet = false; return false; }

    const requiredIds = definition.requiredStoryIds;
    const completedIds = new Set(state.completedStories); // Use the running list of all completed stories
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

// Helper to get phase name
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

// Calculate Average Cycle Time for completed stories in the current sprint
export function calculateAverageCycleTime() {
    const completedThisSprint = getCurrentSprintCompletedStories();
    if (completedThisSprint.length === 0) return null;

    let totalCycleTimeDays = 0;
    let validStoriesCount = 0;
    completedThisSprint.forEach(story => {
        if (typeof story.enteredInProgressTimestamp === 'number' &&
            typeof story.completedTimestamp === 'number' &&
            story.enteredInProgressTimestamp >= 1 &&
            story.completedTimestamp >= story.enteredInProgressTimestamp)
        {
            // Cycle Days = completedTimestamp - enteredInProgressTimestamp + 1
            const cycleDays = story.completedTimestamp - story.enteredInProgressTimestamp + 1;
             totalCycleTimeDays += cycleDays;
             validStoriesCount++;
             console.log(`Cycle Time for ${story.id}: Start Day ${story.enteredInProgressTimestamp}, End Day ${story.completedTimestamp}, Days: ${cycleDays}`);
        } else {
             console.warn(`Invalid cycle time data for story ${story.id}: Start=${story.enteredInProgressTimestamp}, End=${story.completedTimestamp}`);
        }
    });

    if (validStoriesCount === 0) return null;
    return (totalCycleTimeDays / validStoriesCount).toFixed(1);
}
// --- END OF FILE gameState.js ---