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
    sprintBacklog: [],
    stories: {}, // Story objects keyed by ID
    team: [ // 8 Staff members
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
    wipLimits: { // Dev WIP can be adjusted here
        inprogress: 5,
        testing: 2
    },
    currentWip: {
        inprogress: 0,
        testing: 0
    },
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
const TESTING_EFFORT_PER_STORY = 1; // Base testing effort
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
        wipLimits: { inprogress: 5, testing: 2 }, // WIP Limits
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
            status: 'backlog',
            remainingEffort: storyData.effort, // Scaled effort from stories.js
            testingEffortRemaining: TESTING_EFFORT_PER_STORY,
            progress: 0,
            testingProgress: 0,
            assignedWorkers: [], // Now an array
            chosenImplementation: null,
            baseEffort: storyData.effort, // Scaled effort from stories.js
            isBlocked: false,
            daysInState: 0,
            enteredInProgressTimestamp: null,
            completedTimestamp: null,
        };
        state.productBacklog.push(storyId);
    });
    calculateTeamCapacity(); // Calculate based on new team and 5 work days
    console.log("Initial state loaded (Multi-Assign Ready):", state);
    console.log("Calculated Team Capacity:", state.teamCapacity);
}

// --- Getters ---
export function getProductBacklog() { return state.productBacklog.map(id => state.stories[id]).filter(Boolean); }
export function getSprintBacklog() { return state.sprintBacklog.map(id => state.stories[id]).filter(Boolean); }
export function getStory(id) { return state.stories[id]; }
export function getAllStories() { return state.stories; }
export function getTeam() { return state.team; }
// getAvailableWorkers: Workers free AND available AND not unblocking
export function getAvailableWorkers() { return state.team.filter(w => w.available && !w.assignedStory && !w.isUnblocking); }
// getAvailableWorkersForStory: Available workers suitable for the *current* status of a specific story
export function getAvailableWorkersForStory(storyId) {
    const story = getStory(storyId);
    if (!story) return [];
    const available = getAvailableWorkers(); // Get generally available workers
    return available.filter(w => {
        // Dev needed? Worker is Dev?
        if ((story.status === 'inprogress' || story.status === 'ready') && w.area !== 'Testing') return true; // Devs for Ready & InProgress
        // Tester needed? Worker is Tester?
        if (story.status === 'testing' && w.area === 'Testing') return true;
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
export function getCurrentWip() { return state.currentWip; }
export function getAssignedWorkersForStory(storyId) { // Helper to get worker objects
    const story = getStory(storyId);
    if (!story || !story.assignedWorkers) return [];
    return story.assignedWorkers.map(id => getWorkerById(id)).filter(Boolean); // Map IDs to worker objects
}


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
     console.log(`WIP Updated: In Progress=${state.currentWip.inprogress}, Testing=${state.currentWip.testing}`);
}

export function addStoryToSprint(storyId) {
    if (!state.sprintBacklog.includes(storyId) && state.productBacklog.includes(storyId)) {
        state.sprintBacklog.push(storyId);
        state.productBacklog = state.productBacklog.filter(id => id !== storyId);
        updateStoryStatus(storyId, 'ready');
        console.log(`Story ${storyId} added to sprint backlog state.`);
        return true;
    }
    console.warn(`Failed to add story ${storyId} to sprint backlog state.`);
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
            // Unassign any workers first
            if (story.assignedWorkers && story.assignedWorkers.length > 0) {
                // Create a copy as unassign modifies the array
                [...story.assignedWorkers].forEach(workerId => unassignWorkerFromStory(storyId, workerId));
            }
            // Reset relevant fields
            const originalBaseEffort = story.baseEffort;
            story.chosenImplementation = null;
            story.remainingEffort = originalBaseEffort;
            story.testingEffortRemaining = TESTING_EFFORT_PER_STORY;
            story.progress = 0;
            story.testingProgress = 0;
            story.assignedWorkers = []; // Ensure it's reset
            story.enteredInProgressTimestamp = null;
            story.completedTimestamp = null;
            story.isBlocked = false;
            updateStoryStatus(storyId, 'backlog'); // Handles WIP Update implicitly if needed
            console.log(`Story ${storyId} removed from sprint backlog state.`);
            return true;
        }
    }
    console.warn(`Failed to remove story ${storyId} from sprint backlog state.`);
    return false;
}

export function updateStoryStatus(storyId, newStatus) {
    const story = state.stories[storyId];
    if (!story) { console.error(`Cannot update status for non-existent story ${storyId}`); return; }
    const oldStatus = story.status;
    if (oldStatus === newStatus) return;

    console.log(`Story ${storyId} status changing from ${oldStatus} to ${newStatus}`);
    story.status = newStatus;
    story.daysInState = 0; // Reset WIP age

    // Track Cycle Time Start
    if (newStatus === 'inprogress' && oldStatus === 'ready') {
        story.enteredInProgressTimestamp = state.currentDay;
        console.log(`Story ${storyId} entered 'inprogress' on day index ${state.currentDay}`);
    }

    // Unassign workers if story moves out of a working state
    // This is crucial when moving back from 'inprogress' to 'ready' or 'backlog'
    if ((newStatus !== 'inprogress' && newStatus !== 'testing') && (oldStatus === 'inprogress' || oldStatus === 'testing')) {
         if (story.assignedWorkers && story.assignedWorkers.length > 0) {
            console.warn(`Story ${storyId} moved to ${newStatus} with workers [${story.assignedWorkers.join(', ')}] still assigned. Unassigning all.`);
            [...story.assignedWorkers].forEach(workerId => unassignWorkerFromStory(storyId, workerId));
        }
    }

    updateWipCount(); // Update overall WIP counts AFTER potential unassignments
}


// Assigns ONE worker to a story. Handles checks including WIP limits.
export function assignWorkerToStory(workerId, storyId) {
    const worker = state.team.find(w => w.id === workerId);
    const story = state.stories[storyId];

    if (!worker || !story) { console.error(`Assign failed: Worker ${workerId} or Story ${storyId} not found.`); return false; }
    if (!worker.available) { console.warn(`Assign failed: Worker ${worker.name} unavailable.`); return false; }
    if (worker.assignedStory) { // Check if worker is assigned to ANY story
        // Allow reassigning to the same story (shouldn't happen via UI flow but good safeguard)
        if (worker.assignedStory !== storyId) {
             console.warn(`Assign failed: Worker ${worker.name} already on story ${worker.assignedStory}.`);
             // Optional: alert(`Worker ${worker.name} is already assigned to story ${getStory(worker.assignedStory)?.title || 'another task'}.`);
             return false;
        }
    }
    if (story.assignedWorkers.includes(workerId)) {
         console.warn(`Assign failed: Worker ${worker.name} is already assigned to story ${story.title}.`);
         return false; // Prevent adding duplicates
    }
    if (worker.isUnblocking) { console.warn(`Assign failed: Worker ${worker.name} is unblocking.`); return false; }
    if (story.status === 'done' || story.status === 'backlog') { console.warn(`Assign failed: Cannot assign worker to story ${story.title} in status ${story.status}.`); return false; }
    if (story.isBlocked) { console.warn(`Assign failed: Story ${story.title} is blocked.`); return false; }


    let targetStatus = story.status;
    let requiresStatusChange = false;

    // Role/Status Check & WIP Limit Check
    if (worker.area === 'Testing') {
        // Assigning Tester
        if (story.status === 'testing') {
             // Assigning tester to testing story. WIP Check is only relevant if adding the *first* tester
             // *and* the column is already full.
             const currentlyHasTester = story.assignedWorkers.some(id => getWorkerById(id)?.area === 'Testing');
             if (!currentlyHasTester && state.currentWip.testing >= state.wipLimits.testing) {
                 console.warn(`Assign failed: WIP Limit for 'Testing' (${state.wipLimits.testing}) reached when adding first tester.`);
                 alert(`WIP Limit Reached: Cannot assign first tester to ${story.title} in 'Testing' (Limit: ${state.wipLimits.testing}).`);
                 return false;
             }
        } else {
            console.warn(`Assign failed: Tester ${worker.name} cannot be assigned to story ${story.title} in status ${story.status}.`);
            return false;
        }
    } else { // Assigning Dev (Visual/Text)
         if (story.status === 'ready') {
             // Assigning Dev to 'ready' story. This *might* trigger status change. Check WIP Limit *before* changing status.
             if (state.currentWip.inprogress >= state.wipLimits.inprogress) {
                 console.warn(`Assign failed: WIP Limit for 'In Progress' (${state.wipLimits.inprogress}) reached.`);
                 alert(`WIP Limit Reached: Cannot move ${story.title} to 'In Progress' (Limit: ${state.wipLimits.inprogress}).`);
                 return false;
             }
             targetStatus = 'inprogress';
             requiresStatusChange = true;
         } else if (story.status === 'inprogress') {
             // Assigning another Dev to 'inprogress' story. No WIP check needed for adding more devs here.
         } else {
             console.warn(`Assign failed: Dev ${worker.name} cannot be assigned to story ${story.title} in status ${story.status}.`);
             return false;
         }
    }

    // Perform Assignment
    worker.assignedStory = storyId;
    story.assignedWorkers.push(workerId);
    worker.isUnblocking = false; // Ensure reset

    console.log(`Worker ${worker.name} assigned to story ${story.title}. Current assignees: ${story.assignedWorkers.join(', ')}`);

    // Update status if needed (this also updates WIP counts)
    if (requiresStatusChange) {
        updateStoryStatus(storyId, targetStatus);
    } else {
        updateWipCount(); // Ensure WIP count is fresh if status didn't change (e.g., adding 2nd tester)
    }

    return true;
}

// Unassigns a SPECIFIC worker from a story
export function unassignWorkerFromStory(storyId, workerId) {
     const story = state.stories[storyId];
     const worker = state.team.find(w => w.id === workerId);

     if (!story || !worker) { console.error(`Unassign failed: Story ${storyId} or Worker ${workerId} not found.`); return; }
     if (!story.assignedWorkers.includes(workerId)) { console.warn(`Unassign failed: Worker ${workerId} not assigned to story ${storyId}.`); return; }

     const workerName = worker.name;
     console.log(`Unassigning worker ${workerName} from story ${story.title}`);

     // Remove worker from story
     story.assignedWorkers = story.assignedWorkers.filter(id => id !== workerId);
     // Clear worker's assignment
     worker.assignedStory = null;
     worker.isUnblocking = false; // Ensure reset

     // If last worker removed from 'inprogress', move back to 'ready'
     if (story.status === 'inprogress' && story.assignedWorkers.length === 0 && !story.isBlocked) {
         console.log(`Last worker removed from In Progress story ${storyId}. Moving back to Ready.`);
         updateStoryStatus(storyId, 'ready'); // Handles WIP update
     }
     // If last worker removed from 'testing', move back to 'inprogress' (if dev effort > 0) or 'ready' (if dev effort was 0?)
     // -> This scenario shouldn't happen. Testing work should complete, then testers unassigned, then status -> Done.
     // -> A tester being unassigned before completion is odd. Let's assume it stays in Testing for now.
     else {
         // Update WIP count even if status doesn't change (e.g., removing 1 of 2 testers)
         updateWipCount();
     }
}

export function assignSeniorToUnblock(workerId, storyId) {
    // ... (logic remains the same - unblocking is a separate state)
    const worker = state.team.find(w => w.id === workerId);
    const story = state.stories[storyId];

    if (!worker || !story) { console.error(`Unblock assign failed: Worker/Story not found.`); return false; }
    if (worker.skill !== 'Senior' || worker.area === 'Testing') { alert(`Only Senior Developers (Text/Visual) can unblock stories.`); return false; }
    if (!worker.available) { alert(`Worker ${worker.name} is not available to unblock.`); return false; }
    // Check if already assigned to another task OR currently assigned to unblock THIS story
    if (worker.assignedStory && worker.assignedStory !== storyId) { alert(`Worker ${worker.name} is already assigned to another task.`); return false; }
    if (!story.isBlocked) { alert(`Story ${story.title} is not currently blocked.`); return false; }
    if (worker.dailyPointsLeft < UNBLOCKING_COST) { alert(`Worker ${worker.name} requires ${UNBLOCKING_COST} point(s) to unblock, but only has ${worker.dailyPointsLeft}.`); return false; }

    // Unassign any previous unblocker (if a different worker was assigned to unblock this story)
    state.team.forEach(w => { if (w.isUnblocking && w.assignedStory === storyId && w.id !== workerId) { w.isUnblocking = false; w.assignedStory = null; } });

    // If worker was previously working on this now-blocked story, remove from assignedWorkers list
     story.assignedWorkers = story.assignedWorkers.filter(id => id !== workerId);

    worker.assignedStory = storyId; // Assign story for reference
    worker.isUnblocking = true;
    worker.dailyPointsLeft -= UNBLOCKING_COST;
    story.isBlocked = false;
    story.daysInState = 0; // Reset age

    console.log(`Worker ${worker.name} assigned to UNBLOCK story ${story.title}. Points remaining: ${worker.dailyPointsLeft}. Story unblocked.`);
    return true;
}


// Applies work from a specific worker to a story
export function applyWorkToStory(storyId, points, workerId) {
    const story = state.stories[storyId];
    const worker = getWorkerById(workerId); // Get worker info

    if (!story || !worker || story.isBlocked) {
        if (story?.isBlocked) console.warn(`Work blocked on story ${storyId}.`);
        return { workApplied: 0, storyCompleted: false }; // Return object
    }

    const workerArea = worker.area; // Use the specific worker's area
    let pointsActuallyApplied = 0;
    let storyCompleted = false;

    if (workerArea !== 'Testing' && story.status === 'inprogress' && story.remainingEffort > 0) {
        // Dev Work
        pointsActuallyApplied = Math.min(points, story.remainingEffort);
        story.remainingEffort -= pointsActuallyApplied;
        story.progress = ((story.baseEffort - story.remainingEffort) / story.baseEffort) * 100;
        console.log(`DEV by ${worker.name}: Applied ${pointsActuallyApplied} points to ${storyId}. Dev Remaining: ${story.remainingEffort}`);

        if (story.remainingEffort <= 0) {
            console.log(`DEV Complete for ${storyId}. Moving to Testing.`);
            // Find and unassign ALL Dev workers on this story
            const devWorkers = [...story.assignedWorkers].filter(id => getWorkerById(id)?.area !== 'Testing'); // Create copy for iteration
            devWorkers.forEach(devId => unassignWorkerFromStory(storyId, devId)); // Unassign specific devs
            updateStoryStatus(storyId, 'testing'); // Change status AFTER unassigning devs
            // Story is not *fully* done yet
        }
    } else if (workerArea === 'Testing' && story.status === 'testing' && story.testingEffortRemaining > 0) {
        // Testing Work
        pointsActuallyApplied = Math.min(points, story.testingEffortRemaining);
        story.testingEffortRemaining -= pointsActuallyApplied;
        story.testingProgress = ((TESTING_EFFORT_PER_STORY - story.testingEffortRemaining) / TESTING_EFFORT_PER_STORY) * 100;
        console.log(`TEST by ${worker.name}: Applied ${pointsActuallyApplied} points to ${storyId}. Test Remaining: ${story.testingEffortRemaining}`);

        if (story.testingEffortRemaining <= 0) {
            console.log(`TEST Complete for ${storyId}. Marking as Done.`);
            // Find and unassign ALL Test workers on this story (should only be testers here)
            const testWorkers = [...story.assignedWorkers].filter(id => getWorkerById(id)?.area === 'Testing'); // Create copy
            testWorkers.forEach(testId => unassignWorkerFromStory(storyId, testId)); // Unassign specific testers
            markStoryAsDone(storyId); // Change status AFTER unassigning testers
            storyCompleted = true; // Story is fully DONE
        }
    }

    return { workApplied: pointsActuallyApplied, storyCompleted: storyCompleted }; // Return amount applied and completion status
}


function markStoryAsDone(storyId) {
    const story = state.stories[storyId];
    if (story && story.status !== 'done') {
        console.log(`Marking story ${storyId} as DONE!`);
        // Ensure all workers are unassigned (should happen before calling this)
        if (story.assignedWorkers && story.assignedWorkers.length > 0) {
             console.warn(`Story ${storyId} marked as done, but workers [${story.assignedWorkers.join(', ')}] still assigned. Unassigning now.`);
              [...story.assignedWorkers].forEach(workerId => unassignWorkerFromStory(story.id, workerId));
        }
        story.completedTimestamp = state.currentDay;
        updateStoryStatus(storyId, 'done'); // This updates WIP

        if (!state.currentSprintCompleted.includes(storyId)) state.currentSprintCompleted.push(storyId);
        if (!state.completedStories.includes(storyId)) state.completedStories.push(storyId);
    }
}

export function advanceDay() {
    state.currentDay++;
    const currentPhase = getPhaseName(state.currentDay);
    console.log(`--- Advancing to Day Index ${state.currentDay} (${currentPhase}) ---`);

    // Increment WIP Aging & potentially clear blockers based on phase logic
    Object.values(state.stories).forEach(story => {
        if ((story.status === 'inprogress' || story.status === 'testing') && !story.isBlocked) {
            story.daysInState++;
        }
         // Clear blocker status at start of day if NOT in a work phase (cleared by unblocker action during reassignment)
         if (![2, 4, 6, 8, 10].includes(state.currentDay)) {
              //story.isBlocked = false; // Let unblocking handle this explicitly
         }
    });

    // Reset workers at start of Assignment/Reassignment phases
    if (currentPhase.includes('Assign') || currentPhase.includes('Reassign')) {
        console.log(`Resetting worker points/availability for ${currentPhase}.`);
        state.team.forEach(w => {
            w.dailyPointsLeft = w.pointsPerDay;
            w.available = true; // Default to available

            // Reset unblocking status unless they are actively assigned to unblock *now*
            // (assignSeniorToUnblock sets isUnblocking=true)
             // w.isUnblocking = false; // Let the assignment logic manage this

            // Apply persistent obstacles
            const obstacle = state.obstacles.find(o => o.targetWorkerId === w.id && o.type === 'capacity_reduction' && o.duration > 0);
            if (obstacle) {
                 w.dailyPointsLeft = Math.max(0, w.pointsPerDay - obstacle.pointsLost);
                 obstacle.duration--;
                 console.log(`Obstacle persists for ${w.name}, points: ${w.dailyPointsLeft}, duration left: ${obstacle.duration}`);
                 if (obstacle.makesUnavailable) {
                     w.available = false;
                     // If they become unavailable, unassign them from any current task
                     if (w.assignedStory) {
                         console.log(`Worker ${w.name} made unavailable by obstacle, unassigning from ${w.assignedStory}`);
                         unassignWorkerFromStory(w.assignedStory, w.id);
                     }
                     w.isUnblocking = false; // Cannot unblock if unavailable
                 }
            } else {
                 // If no obstacle, ensure they are marked available
                 w.available = true;
            }

             // If worker is assigned to a story that IS currently blocked, mark worker as unavailable for *new* assignments
             // but they remain 'assigned' conceptually until reassigned/unblocked
             const assignedStory = w.assignedStory ? getStory(w.assignedStory) : null;
             if(assignedStory && assignedStory.isBlocked && !w.isUnblocking) {
                 // Don't mark unavailable here, let the UI show 'Blocked' status
                 // worker.available = false; // This prevents them appearing in dropdowns
             }
        });
        // Clean up expired obstacles
        state.obstacles = state.obstacles.filter(o => o.duration === undefined || o.duration > 0);
    }
}


export function startNewSprint() {
    // ... (Logic remains similar, ensure assignedWorkers reset)
    const completedPoints = state.currentSprintCompleted
        .map(id => state.stories[id]?.baseEffort || 0)
        .reduce((sum, points) => sum + points, 0);
    state.velocityHistory.push(completedPoints);
    state.currentSprint++;
    state.currentDay = 0;
    state.sprintBacklog = [];
    state.currentSprintCompleted = [];
    state.obstacles = []; // Clear obstacles for new sprint
    state.team.forEach(w => {
        w.available = true;
        w.assignedStory = null;
        w.isUnblocking = false;
        w.dailyPointsLeft = w.pointsPerDay;
    });
    Object.values(state.stories).forEach(story => {
        // Reset any story not 'done' or already in 'backlog'
        if (story.status !== 'done' && story.status !== 'backlog') {
            console.log(`Moving unfinished story ${story.title} (Status: ${story.status}) back to Product Backlog.`);
             // Unassign workers first
             if (story.assignedWorkers && story.assignedWorkers.length > 0) {
                 [...story.assignedWorkers].forEach(workerId => unassignWorkerFromStory(story.id, workerId));
             }
            story.status = 'backlog';
            story.remainingEffort = story.baseEffort; // Reset effort
            story.testingEffortRemaining = TESTING_EFFORT_PER_STORY; // Reset testing
            story.progress = 0;
            story.testingProgress = 0;
            story.assignedWorkers = []; // Reset array
            story.isBlocked = false;
            story.daysInState = 0;
            story.enteredInProgressTimestamp = null;
            story.completedTimestamp = null;
            // Add back to product backlog if not already there
            if (!state.productBacklog.includes(story.id)) {
                state.productBacklog.unshift(story.id); // Add to top
            }
        } else if (story.status === 'done') {
            story.daysInState = 0; // Reset age for done items too
        }
    });
    updateWipCount(); // Reset WIP count
    calculateTeamCapacity();
    console.log(`Starting Sprint ${state.currentSprint}`);
}

export function calculateTeamCapacity() {
    const pointsPerDay = state.team.reduce((sum, worker) => sum + worker.pointsPerDay, 0);
    const workDays = 5; // 5 work days per sprint
    state.teamCapacity = pointsPerDay * workDays;
}

export function recordRetrospective(well, improve, change) {
    state.retrospectiveNotes.push({ sprint: state.currentSprint, well, improve, change });
}

export function setStoryImplementation(storyId, choice) {
     if (state.stories[storyId]) {
        const story = state.stories[storyId];
        story.chosenImplementation = choice;
        // Update effort only if it changes, reset progress
        if (story.baseEffort !== choice.effort) {
             story.remainingEffort = choice.effort;
             story.baseEffort = choice.effort;
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
             console.log(`Points used by ${worker.name}: ${pointsActuallyUsed}. Remaining today: ${worker.dailyPointsLeft}`);
         }
     }
}

export function addObstacle(obstacle) {
    const obstacleWithDuration = { ...obstacle, id: `obs-${Date.now()}-${Math.random()}`, duration: 1 }; // Default 1 day duration for capacity reduction
    state.obstacles.push(obstacleWithDuration);

    // Immediate effect for blockers
     if (obstacle.type === 'blocker') {
         const story = state.stories[obstacle.targetStoryId];
         if(story && (story.status === 'inprogress' || story.status === 'testing') && !story.isBlocked) {
             story.isBlocked = true;
             story.daysInState = 0; // Reset age when blocked
             console.log(`Obstacle Applied: ${obstacle.message} blocking story ${story.title}`);
             // Workers assigned remain assigned but cannot work (handled in simulation)
             if (story.assignedWorkers.length > 0) {
                 console.log(`Story ${story.title} blocked. Assigned workers [${story.assignedWorkers.join(', ')}] cannot progress.`);
                 // Optionally mark workers as unavailable if needed, but UI state should reflect 'Blocked'
             }
         } else if (story) { console.log(`Obstacle Skipped: Blocker targeting story ${story.title} in status ${story.status} or already blocked.`); }
         else { console.warn(`Obstacle Skipped: Blocker target story ${obstacle.targetStoryId} not found.`); }
     }
    // Capacity reductions are applied at the start of the next (re)assignment phase in advanceDay()
     else if (obstacle.type === 'capacity_reduction') {
        const worker = state.team.find(w => w.id === obstacle.targetWorkerId);
        if (worker) {
             console.log(`Obstacle Added: ${obstacle.message} targeting ${worker.name}. Effect applied at start of next (re)assignment phase.`);
             // Immediate unavailability can be handled here if needed, but current logic waits for advanceDay
             // if (obstacle.makesUnavailable) { worker.available = false; }
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
    const completedIds = new Set(state.completedStories);
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
    let totalCycleTimeDays = 0; let validStoriesCount = 0;
    completedThisSprint.forEach(story => {
        // enteredInProgressTimestamp is the *start* of the day index (e.g., 1 for start of Day 1 assignment)
        // completedTimestamp is the *end* of the day index (e.g., 2 for end of Day 1 work)
        // Cycle time = (completedTimestamp - enteredInProgressTimestamp) + 1 (inclusive of start/end days)
        // Note: Adjusting based on 0-11 index. Day 1 Assign=1, Work=2. Day 5 Assign=9, Work=10.
        if (typeof story.enteredInProgressTimestamp === 'number' && typeof story.completedTimestamp === 'number' &&
            story.enteredInProgressTimestamp >= 1 && // Must have started (at least Day 1 Assign phase)
            story.completedTimestamp >= story.enteredInProgressTimestamp)
        {
            // Calculate the number of *work phases* included.
            // Example: Start Day 1 (index 1), Finish Day 1 (index 2) -> Cycle = 1 work phase (Day 1 Work)
            // Example: Start Day 1 (index 1), Finish Day 2 (index 4) -> Cycle = 2 work phases (Day 1 Work, Day 2 Work)
            // Formula: floor(completionIndex / 2) - floor((startIndex - 1) / 2)
            const startWorkPhase = Math.ceil(story.enteredInProgressTimestamp / 2); // Work phase corresponding to start index
            const endWorkPhase = Math.ceil(story.completedTimestamp / 2); // Work phase corresponding to end index
            const cycleWorkPhases = endWorkPhase - startWorkPhase + 1;

            totalCycleTimeDays += cycleWorkPhases;
            validStoriesCount++;
            console.log(`Cycle Time for ${story.id}: Start Index ${story.enteredInProgressTimestamp} (Work Phase ${startWorkPhase}), End Index ${story.completedTimestamp} (Work Phase ${endWorkPhase}), Work Phases: ${cycleWorkPhases}`);
        } else { console.warn(`Invalid cycle time data for story ${story.id}: Start=${story.enteredInProgressTimestamp}, End=${story.completedTimestamp}`); }
    });
    if (validStoriesCount === 0) return null;
    // Return average number of *work days* (phases)
    return (totalCycleTimeDays / validStoriesCount).toFixed(1);
}
// --- END OF FILE gameState.js ---