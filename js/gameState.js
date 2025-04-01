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
    currentDay: 0, // 0-11 structure for 5 work days
    productBacklog: [],
    sprintBacklog: [], // IDs of stories committed to the sprint
    stories: {}, // Story objects keyed by ID
    team: [
        { id: 'w1', name: 'Vicky Senior', area: 'Visual', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
        { id: 'w2', name: 'Val Junior', area: 'Visual', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
        { id: 'w3', name: 'Terry Senior', area: 'Text', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
        { id: 'w4', name: 'Tom Junior', area: 'Text', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
        { id: 'w5', name: 'Tessa Senior', area: 'Testing', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
        { id: 'w6', name: 'Tim Junior', area: 'Testing', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
        { id: 'w7', name: 'Wendy Senior', area: 'Text', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
        { id: 'w8', name: 'Walter Junior', area: 'Testing', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
    ],
    teamCapacity: 0,
    wipLimits: { // *** WIP Limits for 'Doing' sub-states ***
        inprogress: 5, // Max in InProgress-Doing
        testing: 3    // Max in Testing-Doing (Adjusted)
    },
    currentWip: { // Counts items ONLY in 'Doing' sub-states
        inprogress: 0,
        testing: 0
    },
    completedStories: [], // Stories in final 'done' state (overall)
    currentSprintCompleted: [], // Stories moved to final 'done' this sprint
    velocityHistory: [],
    retrospectiveNotes: [],
    obstacles: [],
    chosenDoD: null,
    dodBonusPoints: 0,
    dodMet: false,
    missingDodStories: [],
};

// --- Constants ---
const TESTING_EFFORT_PER_STORY = 1; // Base testing effort for simplicity
export const UNBLOCKING_COST = 1;

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
            { id: 'w7', name: 'Wendy Senior', area: 'Text', skill: 'Senior', pointsPerDay: 3, available: true, assignedStory: null, dailyPointsLeft: 3, isUnblocking: false },
            { id: 'w8', name: 'Walter Junior', area: 'Testing', skill: 'Junior', pointsPerDay: 1, available: true, assignedStory: null, dailyPointsLeft: 1, isUnblocking: false },
        ],
        teamCapacity: 0,
        wipLimits: { inprogress: 5, testing: 3 }, // *** Updated WIP Limits ***
        currentWip: { inprogress: 0, testing: 0 },
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
            status: 'backlog', // Main status: backlog, ready, inprogress, testing, done
            subStatus: null,  // Sub-status: null, doing, done (within inprogress/testing)
            remainingEffort: storyData.effort,
            testingEffortRemaining: TESTING_EFFORT_PER_STORY,
            progress: 0,
            testingProgress: 0,
            assignedWorkers: [],
            chosenImplementation: null,
            baseEffort: storyData.effort,
            isBlocked: false,
            daysInState: 0, // Tracks days in current status/subStatus combo
            enteredInProgressTimestamp: null, // Timestamp when entering inprogress-doing
            completedTimestamp: null, // Timestamp when entering final done
        };
        state.productBacklog.push(storyId);
    });
    calculateTeamCapacity();
    console.log("Initial state loaded (with SubStatus & updated WIP):", JSON.parse(JSON.stringify(state))); // Deep copy for logging
}

// --- Getters ---
export function getProductBacklog() { return state.productBacklog.map(id => state.stories[id]).filter(Boolean); }
export function getSprintBacklogStories() { return state.sprintBacklog.map(id => state.stories[id]).filter(Boolean); } // Gets actual stories in sprint
export function getStory(id) { return state.stories[id]; }
export function getAllStories() { return state.stories; }
export function getTeam() { return state.team; }
export function getAvailableWorkers() { return state.team.filter(w => w.available && !w.assignedStory && !w.isUnblocking); }
// getAvailableWorkersForStory: Suitable workers for the *current* state/sub-state of a story
export function getAvailableWorkersForStory(storyId) {
    const story = getStory(storyId);
    if (!story) return [];
    const available = getAvailableWorkers();

    return available.filter(w => {
        // Dev needed for 'ready' or 'inprogress-doing'
        if ((story.status === 'ready' || (story.status === 'inprogress' && story.subStatus === 'doing')) && w.area !== 'Testing') return true;
        // Tester needed for 'inprogress-done' (to pull into testing) or 'testing-doing'
        if (((story.status === 'inprogress' && story.subStatus === 'done') || (story.status === 'testing' && story.subStatus === 'doing')) && w.area === 'Testing') return true;
        return false;
    });
}
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
export function getCurrentWip() { return state.currentWip; } // Returns counts of 'doing' states
export function getAssignedWorkersForStory(storyId) {
    const story = getStory(storyId);
    if (!story || !story.assignedWorkers) return [];
    return story.assignedWorkers.map(id => getWorkerById(id)).filter(Boolean);
}


// --- Mutations ---

// Updates WIP counts based ONLY on 'doing' sub-statuses
function updateWipCount() {
    state.currentWip.inprogress = 0;
    state.currentWip.testing = 0;
    Object.values(state.stories).forEach(story => {
        if (story.status === 'inprogress' && story.subStatus === 'doing') {
            state.currentWip.inprogress++;
        } else if (story.status === 'testing' && story.subStatus === 'doing') {
            state.currentWip.testing++;
        }
    });
     console.log(`WIP Counts Updated: InProgress(Doing)=${state.currentWip.inprogress}/${state.wipLimits.inprogress}, Testing(Doing)=${state.currentWip.testing}/${state.wipLimits.testing}`);
}

// Updates story state and resets age. Handles WIP count updates.
function setStoryState(storyId, newStatus, newSubStatus = null) {
    const story = state.stories[storyId];
    if (!story) { console.error(`Cannot set state for non-existent story ${storyId}`); return; }

    const oldStatus = story.status;
    const oldSubStatus = story.subStatus;

    if (oldStatus === newStatus && oldSubStatus === newSubStatus) return; // No change

    console.log(`Story ${storyId} state changing from ${oldStatus}/${oldSubStatus} to ${newStatus}/${newSubStatus}`);
    story.status = newStatus;
    story.subStatus = newSubStatus;
    story.daysInState = 0; // Reset WIP age for the new state

    // Track Cycle Time Start (when entering inprogress-doing)
    if (newStatus === 'inprogress' && newSubStatus === 'doing' && !(oldStatus === 'inprogress' && oldSubStatus === 'doing')) {
        if (story.enteredInProgressTimestamp === null) { // Only set if not already set
             story.enteredInProgressTimestamp = state.currentDay;
             console.log(`Story ${storyId} entered 'inprogress-doing' FIRST TIME on day index ${state.currentDay}`);
        } else {
             console.log(`Story ${storyId} re-entered 'inprogress-doing'. Start timestamp remains ${story.enteredInProgressTimestamp}.`);
        }
    }

    // Track Cycle Time End (when entering final 'done')
    if (newStatus === 'done' && oldStatus !== 'done') {
        story.completedTimestamp = state.currentDay;
         console.log(`Story ${storyId} entered final 'done' on day index ${state.currentDay}`);
         // Add to completed lists
        if (!state.currentSprintCompleted.includes(storyId)) state.currentSprintCompleted.push(storyId);
        if (!state.completedStories.includes(storyId)) state.completedStories.push(storyId);
    }

    // Unassign workers if story moves OUT of an active 'doing' state or into final 'done'
    const wasDoing = (oldStatus === 'inprogress' && oldSubStatus === 'doing') || (oldStatus === 'testing' && oldSubStatus === 'doing');
    const isNowDoing = (newStatus === 'inprogress' && newSubStatus === 'doing') || (newStatus === 'testing' && newSubStatus === 'doing');

    if ( (wasDoing && !isNowDoing) || newStatus === 'done' ) {
        if (story.assignedWorkers.length > 0) {
             console.log(`Story ${storyId} moved to inactive/final state ${newStatus}/${newSubStatus}. Unassigning workers [${story.assignedWorkers.join(', ')}].`);
             // Create a copy as unassign modifies the array
             [...story.assignedWorkers].forEach(workerId => unassignWorkerFromStory(storyId, workerId));
        }
    }

    updateWipCount(); // Update WIP counts after any state changes and potential unassignments
}


export function addStoryToSprint(storyId) {
    const story = state.stories[storyId];
    if (story && story.status === 'backlog' && !state.sprintBacklog.includes(storyId)) {
        state.sprintBacklog.push(storyId);
        state.productBacklog = state.productBacklog.filter(id => id !== storyId);
        setStoryState(storyId, 'ready', null); // Move to ready state
        console.log(`Story ${storyId} added to sprint backlog state (ready).`);
        return true;
    }
    console.warn(`Failed to add story ${storyId} to sprint backlog state. Current status: ${story?.status}`);
    return false;
}

export function removeStoryFromSprint(storyId) {
    const story = state.stories[storyId];
     if (story && state.sprintBacklog.includes(storyId)) {
        state.sprintBacklog = state.sprintBacklog.filter(id => id !== storyId);

        if (!state.productBacklog.includes(storyId)) {
             state.productBacklog.unshift(storyId); // Add back to top of product backlog
        }

        // Unassign any workers first
        if (story.assignedWorkers && story.assignedWorkers.length > 0) {
            [...story.assignedWorkers].forEach(workerId => unassignWorkerFromStory(storyId, workerId));
        }

        // Reset relevant fields
        const originalBaseEffort = story.baseEffort; // Revert to original base effort
        story.chosenImplementation = null;
        story.remainingEffort = originalBaseEffort;
        story.testingEffortRemaining = TESTING_EFFORT_PER_STORY;
        story.progress = 0;
        story.testingProgress = 0;
        story.assignedWorkers = [];
        story.enteredInProgressTimestamp = null;
        story.completedTimestamp = null;
        story.isBlocked = false;
        story.daysInState = 0;

        setStoryState(storyId, 'backlog', null); // Set back to backlog state

        console.log(`Story ${storyId} removed from sprint state, returned to product backlog.`);
        return true;
    }
    console.warn(`Failed to remove story ${storyId} from sprint state.`);
    return false;
}


// Assigns ONE worker to a story. Handles state transitions & WIP limits for 'Doing' states.
export function assignWorkerToStory(workerId, storyId) {
    const worker = state.team.find(w => w.id === workerId);
    const story = state.stories[storyId];

    if (!worker || !story) { console.error(`Assign failed: Worker ${workerId} or Story ${storyId} not found.`); return false; }
    if (!worker.available) { console.warn(`Assign failed: Worker ${worker.name} unavailable.`); return false; }
    if (worker.assignedStory) { console.warn(`Assign failed: Worker ${worker.name} already assigned to story ${worker.assignedStory}.`); return false; }
    if (story.assignedWorkers.includes(workerId)) { console.warn(`Assign failed: Worker ${worker.name} is already assigned to story ${story.title}.`); return false; }
    if (worker.isUnblocking) { console.warn(`Assign failed: Worker ${worker.name} is unblocking.`); return false; }
    if (story.status === 'done' || story.status === 'backlog') { console.warn(`Assign failed: Cannot assign worker to story ${story.title} in status ${story.status}.`); return false; }
    if (story.isBlocked) { console.warn(`Assign failed: Story ${story.title} is blocked.`); return false; }

    let targetStatus = story.status;
    let targetSubStatus = story.subStatus;
    let requiresStateChange = false;
    let wipCheckNeeded = null; // 'inprogress' or 'testing' if entering a 'doing' state

    // --- Determine Target State & WIP Check ---
    if (worker.area !== 'Testing') { // Assigning a Dev
        if (story.status === 'ready') {
            targetStatus = 'inprogress'; targetSubStatus = 'doing'; requiresStateChange = true; wipCheckNeeded = 'inprogress';
        } else if (story.status === 'inprogress' && story.subStatus === 'doing') {
            // Adding another Dev to InProgress-Doing (no state change, no WIP check needed for this action)
        } else {
            console.warn(`Assign failed: Dev ${worker.name} cannot work on story ${story.title} in state ${story.status}/${story.subStatus}.`); return false;
        }
    } else { // Assigning a Tester
        if (story.status === 'inprogress' && story.subStatus === 'done') {
             targetStatus = 'testing'; targetSubStatus = 'doing'; requiresStateChange = true; wipCheckNeeded = 'testing';
        } else if (story.status === 'testing' && story.subStatus === 'doing') {
            // Adding another Tester to Testing-Doing (no state change, no WIP check needed for this action)
        } else {
            console.warn(`Assign failed: Tester ${worker.name} cannot work on story ${story.title} in state ${story.status}/${story.subStatus}.`); return false;
        }
    }

    // --- Perform WIP Limit Check (if required) ---
    if (wipCheckNeeded) {
        const limit = state.wipLimits[wipCheckNeeded];
        const currentCount = state.currentWip[wipCheckNeeded]; // Current count in 'doing'
        if (currentCount >= limit) {
            const statusName = wipCheckNeeded === 'inprogress' ? 'In Progress (Doing)' : 'Testing (Doing)';
             console.warn(`Assign failed: WIP Limit for '${statusName}' (${limit}) reached.`);
             alert(`WIP Limit Reached: Cannot move story to '${statusName}' (Limit: ${limit}). Start finishing work!`);
             return false;
        }
         console.log(`WIP Check Passed for moving into ${wipCheckNeeded}-doing: (${currentCount}/${limit})`);
    }

    // --- Perform Assignment & State Change ---
    worker.assignedStory = storyId;
    story.assignedWorkers.push(workerId);
    worker.isUnblocking = false;

    console.log(`Worker ${worker.name} assigned to story ${story.title}. Current assignees: [${story.assignedWorkers.join(', ')}]`);

    if (requiresStateChange) {
        setStoryState(storyId, targetStatus, targetSubStatus); // Handles WIP count update
    }
    // No else needed for WIP count, as setStoryState handles it.

    return true;
}

// Unassigns a SPECIFIC worker from a story
export function unassignWorkerFromStory(storyId, workerId) {
     const story = state.stories[storyId];
     const worker = state.team.find(w => w.id === workerId);

     if (!story || !worker) { console.error(`Unassign failed: Story ${storyId} or Worker ${workerId} not found.`); return false; } // Return boolean
     if (!story.assignedWorkers.includes(workerId)) {
         // This can happen if the story state changed and auto-unassigned the worker already
         console.warn(`Unassign skipped: Worker ${workerId} not found assigned to story ${storyId}. Current assignees: [${story.assignedWorkers.join(', ')}]`);
         // Ensure worker state is clean if this happens
         if (worker.assignedStory === storyId) worker.assignedStory = null;
         return false; // Indicate unassignment didn't happen *now*
     }

     const workerName = worker.name;
     console.log(`Unassigning worker ${workerName} (${workerId}) from story ${story.title} (${storyId})`);

     // Remove worker from story
     story.assignedWorkers = story.assignedWorkers.filter(id => id !== workerId);
     // Clear worker's assignment
     worker.assignedStory = null;
     worker.isUnblocking = false; // Should already be false, but reset just in case

     // Check if state needs to revert if last worker removed from a 'doing' state
     if (story.status === 'inprogress' && story.subStatus === 'doing' && story.assignedWorkers.length === 0 && !story.isBlocked) {
         console.log(`Last worker removed from In Progress (Doing) story ${storyId}. Moving back to Ready.`);
         setStoryState(storyId, 'ready', null);
     } else if (story.status === 'testing' && story.subStatus === 'doing' && story.assignedWorkers.length === 0 && !story.isBlocked) {
          console.log(`Last worker removed from Testing (Doing) story ${storyId}. Moving back to In Progress (Done).`);
         setStoryState(storyId, 'inprogress', 'done');
     } else {
          // If state didn't change, no WIP count update needed here (setStoryState handles it)
     }
     return true; // Indicate successful unassignment
}

// Assigns a senior dev to unblock a story (only 'doing' states can be unblocked)
export function assignSeniorToUnblock(workerId, storyId) {
    const worker = state.team.find(w => w.id === workerId);
    const story = state.stories[storyId];

    if (!worker || !story) { console.error(`Unblock assign failed: Worker/Story not found.`); return false; }
    if (worker.skill !== 'Senior' || worker.area === 'Testing') { alert(`Only Senior Developers (Text/Visual) can unblock stories.`); return false; }
    if (!worker.available) { alert(`Worker ${worker.name} is not available to unblock.`); return false; }
    if (worker.assignedStory) { alert(`Worker ${worker.name} is already assigned to another task: ${worker.assignedStory}.`); return false; }
    if (!story.isBlocked) { alert(`Story ${story.title} is not currently blocked.`); return false; }
    // Can only unblock stories that are actively being worked on ('doing')
    if (!((story.status === 'inprogress' && story.subStatus === 'doing') || (story.status === 'testing' && story.subStatus === 'doing'))) {
        alert(`Cannot unblock story ${story.title} in state ${story.status}/${story.subStatus}. Must be in a 'Doing' state.`); return false;
    }
    if (worker.dailyPointsLeft < UNBLOCKING_COST) { alert(`Worker ${worker.name} requires ${UNBLOCKING_COST} point(s) to unblock, but only has ${worker.dailyPointsLeft}.`); return false; }

    // Unassign any previous unblocker (safety check)
    state.team.forEach(w => { if (w.isUnblocking && w.assignedStory === storyId) { w.isUnblocking = false; w.assignedStory = null; } });

    // Mark worker as unblocking this story
    worker.assignedStory = storyId; // References the story being unblocked
    worker.isUnblocking = true;
    worker.dailyPointsLeft -= UNBLOCKING_COST;
    story.isBlocked = false;
    story.daysInState = 0; // Reset age now that it's active again

    console.log(`Worker ${worker.name} assigned to UNBLOCK story ${story.title}. Points remaining: ${worker.dailyPointsLeft}. Story unblocked.`);
    updateWipCount(); // Ensure WIP is correct
    return true;
}


// Applies work from a specific worker to a story (only affects 'doing' sub-states)
export function applyWorkToStory(storyId, points, workerId) {
    const story = state.stories[storyId];
    const worker = getWorkerById(workerId);

    if (!story || !worker) return { workApplied: 0, storyCompleted: false };
    if (story.isBlocked) { console.warn(`Work blocked on story ${storyId}.`); return { workApplied: 0, storyCompleted: false }; }
    if (story.status === 'done') return { workApplied: 0, storyCompleted: false };

    const workerArea = worker.area;
    let pointsActuallyApplied = 0;
    let storyMovedToFinalDone = false;

    // Dev Work (only on inprogress-doing)
    if (workerArea !== 'Testing' && story.status === 'inprogress' && story.subStatus === 'doing' && story.remainingEffort > 0) {
        pointsActuallyApplied = Math.min(points, story.remainingEffort);
        story.remainingEffort -= pointsActuallyApplied;
        story.progress = ((story.baseEffort - story.remainingEffort) / story.baseEffort) * 100;
        console.log(`DEV by ${worker.name}: Applied ${pointsActuallyApplied} points to ${storyId}. Dev Remaining: ${story.remainingEffort}`);

        if (story.remainingEffort <= 0) {
            console.log(`DEV Complete for ${storyId}. Moving to In Progress (Done).`);
            setStoryState(storyId, 'inprogress', 'done'); // Handles unassigning Devs & WIP update
        }
    }
    // Testing Work (only on testing-doing)
    else if (workerArea === 'Testing' && story.status === 'testing' && story.subStatus === 'doing' && story.testingEffortRemaining > 0) {
        pointsActuallyApplied = Math.min(points, story.testingEffortRemaining);
        story.testingEffortRemaining -= pointsActuallyApplied;
        story.testingProgress = ((TESTING_EFFORT_PER_STORY - story.testingEffortRemaining) / TESTING_EFFORT_PER_STORY) * 100;
        console.log(`TEST by ${worker.name}: Applied ${pointsActuallyApplied} points to ${storyId}. Test Remaining: ${story.testingEffortRemaining}`);

        if (story.testingEffortRemaining <= 0) {
            console.log(`TEST Complete for ${storyId}. Moving to Testing (Done), then attempting Final Done.`);
            // Move to testing-done first (unassigns Testers, updates WIP)
             setStoryState(storyId, 'testing', 'done');
             // Now try to move to final Done
             markStoryAsDone(storyId); // Attempt final transition
             storyMovedToFinalDone = (story.status === 'done'); // Check if it actually moved
        }
    } else {
         // Log why work wasn't applied if worker is assigned but state doesn't match
         if (worker.assignedStory === storyId) {
             console.log(`Work not applied: Worker ${worker.name} (${workerArea}) assigned to ${storyId}, but story state is ${story.status}/${story.subStatus}.`);
         }
    }

    return { workApplied: pointsActuallyApplied, storyCompleted: storyMovedToFinalDone };
}


// Moves story from 'testing-done' to final 'done' state
function markStoryAsDone(storyId) {
    const story = state.stories[storyId];
    // Only transition from testing-done to done
    if (story && story.status === 'testing' && story.subStatus === 'done') {
        console.log(`Marking story ${storyId} as DONE (Final)!`);
        setStoryState(storyId, 'done', null); // Handles timestamps, completed lists, WIP
    } else if (story && story.status === 'done') {
        // Already done
    } else if (story) {
        console.warn(`markStoryAsDone called for story ${storyId} but its state is ${story.status}/${story.subStatus}, not 'testing/done'.`);
    }
}

export function advanceDay() {
    state.currentDay++;
    const currentPhase = getPhaseName(state.currentDay);
    console.log(`--- Advancing to Day Index ${state.currentDay} (${currentPhase}) ---`);

    // Increment WIP Aging for all non-blocked, non-final states
    Object.values(state.stories).forEach(story => {
        if (story.status !== 'backlog' && story.status !== 'ready' && story.status !== 'done' && !story.isBlocked) {
            story.daysInState++;
        }
    });

    // Auto-move from testing-done to done at the START of any phase
    // This ensures completed items don't wait unnecessarily if review isn't immediate
    Object.values(state.stories).forEach(story => {
        if (story.status === 'testing' && story.subStatus === 'done') {
            console.log(`Auto-moving story ${story.id} from Testing(Done) to Final Done.`);
            markStoryAsDone(story.id);
        }
    });


    // Reset workers at start of Assignment/Reassignment phases
    if (currentPhase.includes('Assign') || currentPhase.includes('Reassign')) {
        console.log(`Resetting worker points/availability for ${currentPhase}.`);
        state.team.forEach(w => {
            w.dailyPointsLeft = w.pointsPerDay;
            w.available = true;
            // If worker was unblocking, they become available but keep reference to the story
            // The reassignment modal logic will handle if they get reassigned or stay idle
             if (w.isUnblocking) {
                 console.log(`Worker ${w.name} finished unblocking story ${w.assignedStory}. Now available.`);
                 w.isUnblocking = false;
                 // Keep assignedStory reference to potentially show in UI, but they are available
             }

            // Apply persistent obstacles
            const obstacle = state.obstacles.find(o => o.targetWorkerId === w.id && o.type === 'capacity_reduction' && o.duration > 0);
            if (obstacle) {
                 w.dailyPointsLeft = Math.max(0, w.pointsPerDay - obstacle.pointsLost);
                 obstacle.duration--;
                 console.log(`Obstacle persists for ${w.name}, points: ${w.dailyPointsLeft}, duration left: ${obstacle.duration}`);
                 if (obstacle.makesUnavailable) {
                     w.available = false;
                     if (w.assignedStory) {
                         console.log(`Worker ${w.name} made unavailable by obstacle, attempting to unassign from story ${w.assignedStory}`);
                         unassignWorkerFromStory(w.assignedStory, w.id); // Attempt graceful unassignment
                         // If unassign fails (e.g., already unassigned), just clear local ref
                         if (w.assignedStory) w.assignedStory = null;
                     }
                     w.isUnblocking = false; // Cannot unblock if unavailable
                 }
            }
        });
        // Clean up expired obstacles
        state.obstacles = state.obstacles.filter(o => o.duration === undefined || o.duration > 0);
    }
}


export function startNewSprint() {
    const completedPoints = state.currentSprintCompleted
        .map(id => state.stories[id]?.baseEffort || 0) // Use base effort for velocity
        .reduce((sum, points) => sum + points, 0);
    state.velocityHistory.push(completedPoints);
    state.currentSprint++;
    state.currentDay = 0;
    state.sprintBacklog = []; // Clear committed list
    state.currentSprintCompleted = [];
    state.obstacles = [];
    state.team.forEach(w => { // Reset workers
        w.available = true;
        w.assignedStory = null;
        w.isUnblocking = false;
        w.dailyPointsLeft = w.pointsPerDay;
    });
    Object.values(state.stories).forEach(story => {
        // Reset any story not 'done' or already in 'backlog'
        if (story.status !== 'done' && story.status !== 'backlog') {
            console.log(`Moving unfinished story ${story.title} (State: ${story.status}/${story.subStatus}) back to Product Backlog.`);
             if (story.assignedWorkers && story.assignedWorkers.length > 0) {
                 [...story.assignedWorkers].forEach(workerId => unassignWorkerFromStory(story.id, workerId));
             }
             // Reset story fields
            const originalBaseEffort = story.baseEffort;
            story.chosenImplementation = null;
            story.remainingEffort = originalBaseEffort;
            story.testingEffortRemaining = TESTING_EFFORT_PER_STORY;
            story.progress = 0;
            story.testingProgress = 0;
            story.assignedWorkers = [];
            story.isBlocked = false;
            story.daysInState = 0;
            story.enteredInProgressTimestamp = null;
            story.completedTimestamp = null;
            setStoryState(story.id, 'backlog', null);
            if (!state.productBacklog.includes(story.id)) {
                state.productBacklog.unshift(story.id);
            }
        } else if (story.status === 'done') {
            story.daysInState = 0;
        }
    });
    updateWipCount(); // Reset WIP count
    calculateTeamCapacity();
    console.log(`Starting Sprint ${state.currentSprint}`);
}

export function calculateTeamCapacity() {
    const pointsPerDay = state.team.reduce((sum, worker) => sum + worker.pointsPerDay, 0);
    const workDays = 5;
    state.teamCapacity = pointsPerDay * workDays;
}

export function recordRetrospective(well, improve, change) {
    state.retrospectiveNotes.push({ sprint: state.currentSprint, well, improve, change });
}

export function setStoryImplementation(storyId, choice) {
     if (state.stories[storyId]) {
        const story = state.stories[storyId];
        story.chosenImplementation = choice;
        if (story.baseEffort !== choice.effort) {
             story.remainingEffort = choice.effort;
             // Don't change baseEffort, keep original for reference/velocity if needed
             // story.baseEffort = choice.effort;
             story.progress = 0;
             console.log(`Implementation changed effort for ${storyId}. Effort reset to ${choice.effort}`);
        }
        console.log(`Implementation chosen for ${storyId}: ${choice.description}, Effort: ${choice.effort}`);
    }
}

export function useWorkerPoints(workerId, pointsUsed) {
     const worker = getWorkerById(workerId);
     if (worker) {
         const pointsActuallyUsed = Math.min(pointsUsed, worker.dailyPointsLeft);
         if (pointsActuallyUsed > 0) {
             worker.dailyPointsLeft -= pointsActuallyUsed;
             // console.log(`Points used by ${worker.name}: ${pointsActuallyUsed}. Remaining today: ${worker.dailyPointsLeft}`); // Reduce log noise
         }
     }
}

export function addObstacle(obstacle) {
    const obstacleWithDuration = { ...obstacle, id: `obs-${Date.now()}-${Math.random()}`, duration: 1 };
    state.obstacles.push(obstacleWithDuration);

    // Immediate effect for blockers (block 'doing' states)
     if (obstacle.type === 'blocker') {
         const story = state.stories[obstacle.targetStoryId];
         const isDoingState = (story?.status === 'inprogress' && story?.subStatus === 'doing') || (story?.status === 'testing' && story?.subStatus === 'doing');
         if(story && isDoingState && !story.isBlocked) {
             story.isBlocked = true;
             story.daysInState = 0; // Reset age when blocked
             console.log(`Obstacle Applied: ${obstacle.message} blocking story ${story.title}`);
             if (story.assignedWorkers.length > 0) {
                 console.log(`Story ${story.title} blocked. Assigned workers [${story.assignedWorkers.join(', ')}] cannot progress.`);
             }
         } else if (story) { console.log(`Obstacle Skipped: Blocker targeting story ${story.title} in state ${story.status}/${story.subStatus} or already blocked.`); }
         else { console.warn(`Obstacle Skipped: Blocker target story ${obstacle.targetStoryId} not found.`); }
     }
    // Capacity reductions applied at start of next (re)assignment phase in advanceDay()
     else if (obstacle.type === 'capacity_reduction') {
        const worker = state.team.find(w => w.id === obstacle.targetWorkerId);
        if (worker) {
             console.log(`Obstacle Added: ${obstacle.message} targeting ${worker.name}. Effect applied at start of next (re)assignment phase.`);
        } else { console.warn(`Obstacle Skipped: Capacity reduction target worker ${obstacle.targetWorkerId} not found.`); }
     }
}

export function setDoD(level) {
    if (dodDefinitions[level]) {
        state.chosenDoD = level;
        state.dodBonusPoints = dodDefinitions[level].bonusPoints;
        console.log(`Definition of Done set to: ${level}, Bonus: ${state.dodBonusPoints}`);
    } else { console.error(`Invalid DoD level chosen: ${level}`); }
}

export function checkDoDMet() {
    if (!state.chosenDoD) { console.error("Cannot check DoD, none chosen."); state.dodMet = false; return false; }
    const definition = dodDefinitions[state.chosenDoD];
    if (!definition) { console.error(`Definition not found for chosen DoD: ${state.chosenDoD}`); state.dodMet = false; return false; }
    const requiredIds = definition.requiredStoryIds;
    const completedIds = new Set(state.completedStories.map(id => state.stories[id].id));
    state.missingDodStories = [];
    let allRequiredMet = true;
    requiredIds.forEach(reqId => { if (!completedIds.has(reqId)) { allRequiredMet = false; state.missingDodStories.push(reqId); } });
    state.dodMet = allRequiredMet;
    console.log(`DoD Check (${state.chosenDoD}): Met = ${state.dodMet}. Missing: ${state.missingDodStories.join(', ')}`);
    return state.dodMet;
}

export function getPhaseName(dayNumber) {
    // Index-based phase names
    switch (dayNumber) {
        case 0: return 'Planning';
        case 1: return 'Assign Workers Day 1';
        case 2: return 'Work Day 1';
        case 3: return 'Reassign Workers Day 2';
        case 4: return 'Work Day 2';
        case 5: return 'Reassign Workers Day 3';
        case 6: return 'Work Day 3';
        case 7: return 'Reassign Workers Day 4';
        case 8: return 'Work Day 4';
        case 9: return 'Reassign Workers Day 5';
        case 10: return 'Work Day 5';
        case 11: return 'Review & Retro';
        default: return `Unknown Phase (${dayNumber})`;
    }
}

export function calculateAverageCycleTime() {
    const completedThisSprint = getCurrentSprintCompletedStories();
    if (completedThisSprint.length === 0) { return null; }

    let totalCycleTimeDays = 0;
    let validStoriesCount = 0;

    completedThisSprint.forEach(story => {
        if (typeof story.enteredInProgressTimestamp === 'number' && typeof story.completedTimestamp === 'number' &&
            story.enteredInProgressTimestamp >= 1 &&
            story.completedTimestamp >= story.enteredInProgressTimestamp)
        {
            // enteredInProgressTimestamp = index of start of Assign/Reassign phase *before* first work
            // completedTimestamp = index of end of Work phase where story reached final 'done'
            const startWorkPhase = Math.ceil(story.enteredInProgressTimestamp / 2);
            const endWorkPhase = Math.ceil(story.completedTimestamp / 2);
            const cycleWorkPhases = endWorkPhase - startWorkPhase + 1;

            if (cycleWorkPhases > 0) {
                totalCycleTimeDays += cycleWorkPhases;
                validStoriesCount++;
                // console.log(`Cycle Time for ${story.id}: Start Index ${story.enteredInProgressTimestamp} (Work Phase ${startWorkPhase}), End Index ${story.completedTimestamp} (Work Phase ${endWorkPhase}), Work Phases: ${cycleWorkPhases}`); // Reduce log noise
            } else {
                console.warn(`Invalid calculated cycle time (<= 0) for story ${story.id}: StartIndex=${story.enteredInProgressTimestamp}, EndIndex=${story.completedTimestamp}, CalculatedPhases=${cycleWorkPhases}`);
            }
        } else {
            console.warn(`Invalid or missing cycle time data for story ${story.id}: Start=${story.enteredInProgressTimestamp}, End=${story.completedTimestamp}`);
        }
    });

    if (validStoriesCount === 0) return null;
    return (totalCycleTimeDays / validStoriesCount).toFixed(1);
}
// --- END OF FILE gameState.js ---