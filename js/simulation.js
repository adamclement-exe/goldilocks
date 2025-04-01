// --- START OF FILE simulation.js ---

import * as GameState from './gameState.js';
import * as UI from './ui.js';
// Import the pending set from UI
import { pendingUnassignments } from './ui.js';

// --- Modal References ---
const DOD_CHOICE_MODAL = document.getElementById('dod-choice-modal');
const PLANNING_MODAL = document.getElementById('sprint-planning-modal');
const ASSIGNMENT_MODAL = document.getElementById('worker-assignment-modal'); // Day 1 Assign Modal
const DAILY_SCRUM_MODAL = document.getElementById('daily-scrum-modal'); // Day 2-5 Reassign/Unblock Modal
const PROCEDURAL_CHOICE_MODAL = document.getElementById('procedural-choice-modal');
const REVIEW_MODAL = document.getElementById('sprint-review-modal');
const RETRO_MODAL = document.getElementById('sprint-retrospective-modal');


// --- Game Start Flow ---

export function startGameFlow() {
    console.log("Starting Game Flow: Showing DoD Choice");
    UI.showDoDChoiceModal();
}

export function confirmDoDChoice() {
    console.log("Confirming DoD Choice...");
    const selectedLevel = DOD_CHOICE_MODAL.querySelector('input[name="dod-level"]:checked')?.value;
    if (selectedLevel) {
        GameState.setDoD(selectedLevel);
        UI.closeModal(DOD_CHOICE_MODAL);
        console.log("DoD Confirmed. Starting Sprint Planning...");
        startSprintPlanning();
    } else {
        alert("Please select a Definition of Done level.");
    }
}


// --- Sprint Lifecycle Functions ---

export function startSprintPlanning() {
    if (!GameState.getChosenDoD()) { startGameFlow(); return; }
    const sprintNum = GameState.getCurrentSprintNumber();
    console.log(`Starting Planning for Sprint ${sprintNum} (Day 0)`);
    GameState.calculateTeamCapacity();
    const capacity = GameState.getTeamCapacity();
    UI.updateSprintInfo(sprintNum, capacity, 'Planning');
    UI.renderAllColumns(); // Render initial state (with sub-columns)
    UI.populateSprintPlanningModal( GameState.getProductBacklog(), GameState.getSprintBacklogStories().map(s => s.id), capacity );
    UI.showModal(PLANNING_MODAL);
    UI.updateButtonVisibility(0);
}

export function confirmProceduralChoice() {
    const storyId = PROCEDURAL_CHOICE_MODAL.dataset.storyId;
    const selectedIndex = PROCEDURAL_CHOICE_MODAL.querySelector('input[type="radio"]:checked')?.value;
    if (storyId && selectedIndex !== undefined) {
        const story = GameState.getStory(storyId); if (!story) return;
        const choice = story.implementationChoices[parseInt(selectedIndex)];
        if (choice) {
            GameState.setStoryImplementation(storyId, choice);
            UI.closeModal(PROCEDURAL_CHOICE_MODAL);
            // If story is already in sprint, update its card
            if (GameState.getSprintBacklogStories().some(s => s.id === storyId)) {
                 UI.updateCard(storyId, GameState.getStory(storyId));
            }
            // Check if story is selected in planning modal and add if needed
            const checkbox = document.getElementById(`plan-select-${storyId}`);
            if (checkbox && checkbox.checked && !GameState.getSprintBacklogStories().some(s => s.id === storyId)) {
                 if(GameState.addStoryToSprint(storyId)) {
                     UI.moveCardToColumn(storyId, 'ready');
                 } else {
                      checkbox.checked = false;
                      alert(`Could not add story ${story.title} to the sprint.`);
                 }
            }
            UI.updateSprintPlanningUI(); // Update total points display
        } else { console.error("Selected choice index invalid."); }
    } else { console.error("Could not find story ID or selected choice index."); }
}

export function commitToSprint() {
    console.log("commitToSprint called");
    const selectedStories = GameState.getSprintBacklogStories();
    if (selectedStories.length === 0) { alert("Please select at least one story for the Sprint."); return; }
    const selectedPoints = selectedStories.reduce((sum, story) => sum + (story?.chosenImplementation ? story.chosenImplementation.effort : story?.baseEffort || 0), 0);
    const capacity = GameState.getTeamCapacity();
     if (selectedPoints > capacity) {
        if (!confirm(`Warning: Selected points (${selectedPoints}) exceed capacity (${capacity}). Overcommitment can severely impact flow. Continue anyway?`)) { return; }
    }
    console.log("Committing to Sprint Backlog:", selectedStories.map(s => s?.title || 'Unknown Story'));
    UI.closeModal(PLANNING_MODAL);
    console.log("Planning modal closed, calling startWorkerAssignmentPhase...");
    startWorkerAssignmentPhase(1); // Start Assignment for Day 1
}

// --- Assignment Phase (Day 1 - Checkboxes) ---
function startWorkerAssignmentPhase(dayNum) {
    console.log("startWorkerAssignmentPhase entered");
    GameState.advanceDay(); // To Day 1 (index 1)
    const currentDay = GameState.getCurrentDay();
    const phaseName = GameState.getPhaseName(currentDay);
    console.log(`Starting Worker Assignment Phase (${phaseName} - Day State: ${currentDay})`);
    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDay);

    // Get stories in 'Ready' state from the committed sprint backlog
    const storiesToAssign = GameState.getSprintBacklogStories().filter(s => s?.status === 'ready');
    console.log(`Found ${storiesToAssign.length} stories in Ready state to assign.`);
    const availableWorkers = GameState.getAvailableWorkers(); // Devs only relevant here
    console.log(`Found ${availableWorkers.length} available workers.`);

    try {
        UI.populateWorkerAssignmentModal(storiesToAssign, availableWorkers);
        console.log("Worker assignment modal content populated.");
    } catch (error) { console.error("Error during UI.populateWorkerAssignmentModal:", error); return; }

    if (!ASSIGNMENT_MODAL) { console.error("Cannot show modal: ASSIGNMENT_MODAL reference is null!"); return; }
    UI.showModal(ASSIGNMENT_MODAL);
}

// Confirm Day 1 Assignments from Checkboxes
export function confirmWorkerAssignments() {
    console.log("confirmWorkerAssignments called (Day 1 Multi-Assign)");
    const assignmentCheckboxes = ASSIGNMENT_MODAL.querySelectorAll('#assignment-list input[type="checkbox"]:checked');
    let assignmentsMade = 0;
    const storiesAssigned = new Set();

    // Group assignments by story to handle WIP limits correctly
    const assignmentsByStory = {};
    assignmentCheckboxes.forEach(checkbox => {
        const storyId = checkbox.dataset.storyId;
        const workerId = checkbox.value;
        if (!assignmentsByStory[storyId]) { assignmentsByStory[storyId] = []; }
        assignmentsByStory[storyId].push(workerId);
    });

    // Process assignments story by story
    for (const storyId in assignmentsByStory) {
        const workersToAssign = assignmentsByStory[storyId];
        if (workersToAssign.length === 0) continue;

        const story = GameState.getStory(storyId);
        if (!story) { console.warn(`Story ${storyId} not found during assignment confirmation.`); continue; }

        // Attempt to assign each worker
        let storyAssignments = 0;
        workersToAssign.forEach(workerId => {
            // GameState.assignWorkerToStory handles state change (ready -> ip-doing) & WIP limit check
            const success = GameState.assignWorkerToStory(workerId, storyId);
            if (success) {
                assignmentsMade++;
                storyAssignments++;
                storiesAssigned.add(storyId);
                console.log(`SUCCESS: Assigned ${workerId} to ${storyId}`);
            } else {
                const checkbox = ASSIGNMENT_MODAL.querySelector(`input[type="checkbox"][value="${workerId}"][data-story-id="${storyId}"]`);
                if (checkbox) checkbox.checked = false;
                console.warn(`FAILED: Assignment of ${workerId} to ${storyId}.`);
            }
        });
    }

    console.log(`${assignmentsMade} Day 1 assignments confirmed across ${storiesAssigned.size} stories.`);

    UI.closeModal(ASSIGNMENT_MODAL);
    // Update UI fully after all assignments are processed
    UI.renderWorkers(GameState.getTeam());
    UI.renderAllColumns();
    console.log("Calling runWorkDaySimulation(1)...");
    runWorkDaySimulation(1); // Simulate Work for Day 1
}


// --- Daily Scrum & Reassignment Phase (Day 2+ - Checkboxes) ---
function startDailyScrumAndReassignment(dayNum) {
    GameState.advanceDay(); // To Day Index 3, 5, 7, or 9
    const currentDayState = GameState.getCurrentDay();
    const phaseName = GameState.getPhaseName(currentDayState);
    console.log(`Starting ${phaseName} (Day State: ${currentDayState})`);
    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDayState);

    // Generate and apply obstacles AFTER advancing day
    const obstacle = generateRandomObstacle();
    if (obstacle) {
        GameState.addObstacle(obstacle);
        console.log(`Obstacle generated for Day ${dayNum}:`, obstacle.message);
        // Obstacle application might change worker availability or block stories
        UI.renderWorkers(GameState.getTeam()); // Update workers after potential obstacle effect
        if (obstacle.type === 'blocker') UI.renderAllColumns(); // Update cards if blocked
    } else {
         UI.renderWorkers(GameState.getTeam());
         UI.renderAllColumns(); // Ensure UI is fresh even without obstacles
    }

    UI.populateDailyScrumModal(dayNum, GameState.getTeam(), GameState.getActiveObstacles());
    UI.showModal(DAILY_SCRUM_MODAL);
}

// Confirm Day 2+ Changes (Unassigns, Checkbox Assigns, Unblocks)
export function confirmReassignments() {
    const currentDayState = GameState.getCurrentDay();
    const workDayNum = Math.ceil(currentDayState / 2);
    console.log(`Confirming Day ${workDayNum} changes (Unassigns / Checkbox Assigns / Unblocking)...`);
    let changesMade = 0;
    const assignmentsAttempted = { success: 0, failed: 0 };

    // --- 1. Process Pending Unassignments (from UI '✕' clicks) ---
    console.log("Processing Pending Unassignments:", Array.from(pendingUnassignments));
    pendingUnassignments.forEach(unassignKey => {
        const [storyId, workerId] = unassignKey.split('|');
        if (storyId && workerId) {
            console.log(`Executing pending unassign: Worker ${workerId} from Story ${storyId}`);
            const success = GameState.unassignWorkerFromStory(storyId, workerId); // Handles state logic
             if (!success) {
                console.warn(`Pending unassign of ${workerId} from ${storyId} failed (likely already unassigned).`);
             }
        }
    });
    pendingUnassignments.clear(); // Clear the set after processing

    // --- 2. Process Blocker Resolutions (from dropdown selections) ---
    const blockerSelects = DAILY_SCRUM_MODAL.querySelectorAll('#blocker-assignment-list select');
    blockerSelects.forEach(select => {
        const storyId = select.dataset.storyId;
        const workerId = select.value;
        if (workerId) {
            console.log(`Attempting Unblock: Worker ${workerId} for Story ${storyId}`);
            const success = GameState.assignSeniorToUnblock(workerId, storyId);
            if (success) { changesMade++; console.log(`SUCCESS: Unblocked ${storyId} by ${workerId}`); }
            else { console.warn(`FAILED: Unblock ${storyId} by ${workerId}`); select.value = ''; }
        }
    });

    // --- 3. Process Checkbox Assignments ---
    const assignmentCheckboxes = DAILY_SCRUM_MODAL.querySelectorAll('#reassignment-list input[type="checkbox"]');
    const desiredAssignments = new Map(); // storyId -> Set(workerId)

    // Gather all desired assignments from checkboxes
    assignmentCheckboxes.forEach(cb => {
        if (cb.checked) {
            const storyId = cb.dataset.storyId;
            const workerId = cb.value;
            if (!desiredAssignments.has(storyId)) { desiredAssignments.set(storyId, new Set()); }
            desiredAssignments.get(storyId).add(workerId);
        }
    });

    // Compare desired state with current GameState and attempt assignments
    desiredAssignments.forEach((workers, storyId) => {
        const story = GameState.getStory(storyId);
        if (!story) return;
        const currentWorkers = new Set(story.assignedWorkers);

        workers.forEach(workerId => {
            if (!currentWorkers.has(workerId)) { // Only attempt if worker is not already assigned in GameState
                console.log(`Attempting Checkbox Assign: Worker ${workerId} to Story ${storyId}`);
                const success = GameState.assignWorkerToStory(workerId, storyId); // Handles WIP check & state change
                if (success) {
                    assignmentsAttempted.success++;
                    changesMade++;
                    console.log(`SUCCESS: Assigned ${workerId} to ${storyId} via checkbox.`);
                } else {
                    assignmentsAttempted.failed++;
                    console.warn(`FAILED: Checkbox assign of ${workerId} to ${storyId}. (WIP Limit likely)`);
                    // Find and uncheck the box visually if it failed
                     const failedCheckbox = DAILY_SCRUM_MODAL.querySelector(`input[type="checkbox"][value="${workerId}"][data-story-id="${storyId}"]`);
                     if (failedCheckbox) failedCheckbox.checked = false;
                }
            }
        });
    });

     if (assignmentsAttempted.failed > 0) {
          alert(`Could not make all requested assignments (${assignmentsAttempted.failed} failed). Check WIP limits.`);
          // Re-open modal? For now, proceed.
     }

    console.log(`${changesMade} blocker/assignment changes processed. Pending unassignments executed.`);
    UI.closeModal(DAILY_SCRUM_MODAL);

    // --- 4. Update ALL UI at the end ---
    UI.renderWorkers(GameState.getTeam());
    UI.renderAllColumns(); // Reflects all state changes

    runWorkDaySimulation(workDayNum);
}


// --- Work Simulation ---
function runWorkDaySimulation(workDayNum) {
    console.log(`runWorkDaySimulation called for Work Day ${workDayNum}`);
    GameState.advanceDay(); // To Day Index 2, 4, 6, 8, 10
    const currentDayState = GameState.getCurrentDay();
    const phaseName = GameState.getPhaseName(currentDayState);
    console.log(`--- Simulating Work Progress for ${phaseName} (Day State: ${currentDayState}) ---`);
    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDayState);
    simulateDayProgress(workDayNum); // Run the actual simulation logic
}

// Simulate Day Progress (Handles Multiple Workers & Sub-Statuses)
function simulateDayProgress(workDayNum) {
    console.log(`--- Running Simulation for Work Day ${workDayNum} ---`);
    const workers = GameState.getTeam();
    const stories = GameState.getAllStories();
    let workDoneThisCycle = false;

    workers.forEach(worker => {
        if (!worker.available || worker.isUnblocking || worker.dailyPointsLeft <= 0) {
             // console.log(`Skipping worker ${worker.name}: Available=${worker.available}, Unblocking=${worker.isUnblocking}, PointsLeft=${worker.dailyPointsLeft}`);
             return;
        }

        if (worker.assignedStory) {
            const story = stories[worker.assignedStory];

            // Check if story exists, is not blocked, and is in a 'doing' state
            if (story && !story.isBlocked && story.subStatus === 'doing') {
                // Check if worker role matches the required work (Dev for 'inprogress', Tester for 'testing')
                 const canWorkOnStatus = (worker.area !== 'Testing' && story.status === 'inprogress') || (worker.area === 'Testing' && story.status === 'testing');

                 if (canWorkOnStatus) {
                    let pointsAvailable = worker.dailyPointsLeft;
                    if (pointsAvailable <= 0) return;

                    const specialtyBonus = (story.tags || []).includes(worker.area) ? 1 : 0;
                    let pointsToAttempt = worker.pointsPerDay + specialtyBonus;
                    pointsToAttempt = Math.min(pointsToAttempt, pointsAvailable);

                    // Apply work using applyWorkToStory
                    const result = GameState.applyWorkToStory(story.id, pointsToAttempt, worker.id);
                    const pointsApplied = result.workApplied;
                    const storyCompleted = result.storyCompleted; // True if moved to final 'done'

                    if (pointsApplied > 0) {
                         GameState.useWorkerPoints(worker.id, pointsApplied);
                         workDoneThisCycle = true;
                         // UI update will happen in the final renderAllColumns call
                    }

                    if (storyCompleted) {
                        console.log(`Story ${story.title} fully completed (reached Final Done) by ${worker.name}.`);
                        // Worker unassignment happens within setStoryState via markStoryAsDone
                    }
                    // If story moved to 'done' sub-state but not final done (e.g., ip-done, t-done)
                    else if (story.subStatus === 'done' && !storyCompleted && !story.assignedWorkers.includes(worker.id)) {
                         console.log(`Work by ${worker.name} moved story ${story.title} to ${story.status}/${story.subStatus}. Worker automatically unassigned.`);
                    }

                 } else {
                      // This case should ideally not happen if assignment logic is correct
                      console.warn(`Worker ${worker.name} (${worker.area}) assigned to story ${story.title}, but cannot work on state ${story.status}/${story.subStatus}.`);
                      // GameState.unassignWorkerFromStory(story.id, worker.id); // Consider auto-unassigning?
                 }

            } else if (story && story.isBlocked) {
                console.log(`Worker ${worker.name} blocked on ${story.title}.`);
            } else if (story && story.subStatus !== 'doing') {
                // Worker assigned, but story is in a 'done' sub-state or final 'done' - should have been unassigned
                console.warn(`Worker ${worker.name} still assigned to story ${story.title} which is in state ${story.status}/${story.subStatus}. Attempting unassign.`);
                GameState.unassignWorkerFromStory(story.id, worker.id);
            }
            else if (!story && worker.assignedStory) {
                 console.warn(`Worker ${worker.name} assigned to non-existent story ${worker.assignedStory}. Unassigning.`);
                 worker.assignedStory = null;
            }
        }
    });

    if (!workDoneThisCycle) console.log("No work progress made this cycle.");
    console.log("--- End Day Simulation ---");

    // Update UI after all work is done
    UI.renderWorkers(GameState.getTeam());
    UI.renderAllColumns(); // This handles moving cards between sub-columns visually
}


// Called by Next Day / End Sprint button click
export function handleDayEnd() {
    const currentDayState = GameState.getCurrentDay(); // State *after* work sim (2, 4, 6, 8, 10)
    console.log(`Handling End of Day Button Click. Current Day State: ${currentDayState}`);

    if ([2, 4, 6, 8].includes(currentDayState)) {
        const nextDayNum = Math.ceil((currentDayState + 1) / 2);
        startDailyScrumAndReassignment(nextDayNum);
    } else if (currentDayState === 10) { // End of Work Day 5
        GameState.advanceDay(); // Advance to Day 11 (Review & Retro phase)
        endSprintWork();
    } else {
        console.error(`handleDayEnd called unexpectedly in state ${currentDayState}`);
    }
}


// --- Review, Retro, Next Sprint, Final Book ---

function endSprintWork() {
    const sprintNum = GameState.getCurrentSprintNumber();
    const currentDayState = GameState.getCurrentDay(); // Should be 11
    console.log(`Ending Sprint ${sprintNum}. Current Day State: ${currentDayState}`);
    const phaseName = GameState.getPhaseName(currentDayState);

     // Final auto-move from testing-done to done before review
     Object.values(GameState.getAllStories()).forEach(story => {
         if (story.status === 'testing' && story.subStatus === 'done') {
             console.log(`Final auto-move: story ${story.id} from Testing(Done) to Final Done.`);
             GameState.markStoryAsDone(story.id); // Use markStoryAsDone to ensure correct state change
         }
     });
     UI.renderAllColumns(); // Update board before showing review

    UI.updateSprintInfo(sprintNum, GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDayState);
    startSprintReview();
}

function startSprintReview() {
    console.log("Starting Sprint Review");
    const sprintNum = GameState.getCurrentSprintNumber();
    const completed = GameState.getCurrentSprintCompletedStories(); // Gets stories reaching final 'done' this sprint
    const velocity = completed.reduce((sum, story) => sum + (story?.baseEffort || 0), 0); // Use base effort for velocity
    const value = completed.reduce((sum, story) => sum + (story?.value || 0), 0);
    const avgCycleTime = GameState.calculateAverageCycleTime();

    // Sponsor Feedback Generation (logic remains the same)
    let feedback = "Sponsor feedback: ";
    if (velocity === 0 && GameState.getSprintBacklogStories().length > 0) { feedback += "Disappointed nothing finished, despite commitment."; }
    else if (velocity > 0 && value > (sprintNum * 15)) { feedback += "Thrilled with the high value delivered!"; }
    else if (velocity > 0 && value < (sprintNum * 5) ) { feedback += "Work done, but hoped for more valuable features."; }
    else if (velocity > 0 && velocity < GameState.getTeamCapacity() / 4) { feedback += "Progress seems quite slow."; }
    else if (velocity > 0) { feedback += "Acknowledges completed work. Seems steady."; }
    else { feedback += "No work completed this sprint."; }
    if (avgCycleTime !== null) {
         if (avgCycleTime > 4.0) { feedback += ` Flow seems sluggish (Avg Cycle: ${avgCycleTime} work days).`; }
         else if (avgCycleTime < 2.0) { feedback += ` Excellent flow! (Avg Cycle: ${avgCycleTime} work days).`; }
         else { feedback += ` Flow seems steady (Avg Cycle: ${avgCycleTime} work days).`; }
     } else if (velocity > 0) { feedback += " (Could not calculate average cycle time)."; }

    // DoD Progress Feedback (logic remains the same)
    let dodProgressFeedback = "";
    const chosenDoD = GameState.getChosenDoD();
    if (chosenDoD) {
        const definition = GameState.getDodDefinition(chosenDoD);
        const allCompletedIds = new Set(GameState.getCompletedStories().map(s => s.id)); // Use *all* completed stories overall
        const requiredIds = definition.requiredStoryIds;
        const completedRequired = requiredIds.filter(id => allCompletedIds.has(id)).length;
        const totalRequired = requiredIds.length;
        dodProgressFeedback = `Overall DoD Progress ('${definition.name}'): ${completedRequired} / ${totalRequired} required stories completed so far.`;
        if (sprintNum === 3) {
             GameState.checkDoDMet(); // Ensure final check is done
             dodProgressFeedback += GameState.getDodMetStatus() ? " Goal Met!" : " Goal Not Met.";
        }
    }

    UI.populateSprintReviewModal(sprintNum, completed, velocity, value, avgCycleTime, feedback, dodProgressFeedback);
    UI.showModal(REVIEW_MODAL);
}


export function startRetrospective() {
    console.log("Starting Sprint Retrospective");
    UI.closeModal(REVIEW_MODAL);
    UI.populateRetrospectiveModal(GameState.getCurrentSprintNumber());
    UI.showModal(RETRO_MODAL);
}

export function startNextSprint() {
    console.log("Preparing for next Sprint...");
    GameState.startNewSprint(); // This resets state for the new sprint
    startSprintPlanning(); // Go back to planning phase
}

export function showFinalStorybook() {
     console.log("Checking DoD and Showing Final Storybook");
     UI.closeModal(RETRO_MODAL);
     GameState.checkDoDMet(); // Ensure final DoD status is calculated
     const allCompleted = GameState.getCompletedStories(); // Get all stories in final 'done' state
     UI.populateFinalStorybook(allCompleted);
}


// --- Obstacle Generation ---
function generateRandomObstacle() {
    const chance = 0.35;
    if (Math.random() > chance) return null;

    const obstacleTypes = [
        { type: 'capacity_reduction', pointsLost: 1, shortMessage: "Distracted", message: "distracted, loses 1pt capacity today.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 2, shortMessage: "Meeting", message: "pulled into a meeting, loses 2pt capacity today.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 3, shortMessage: "Helping", message: "helping another team, loses 3pt capacity today.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 99, shortMessage: "Sick Day", message: "called in sick, unavailable today.", makesUnavailable: true },
        { type: 'blocker', message: "needs urgent clarification, blocking progress!" },
        { type: 'blocker', message: "has an unexpected technical issue, blocking progress!" },
        { type: 'blocker', message: "dependency delayed, blocking progress!" },
        { type: 'blocker', message: "conflicting requirements discovered, blocking progress!" },
    ];

    const chosenObstacle = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    if (chosenObstacle.type === 'capacity_reduction') {
        const potentialTargets = GameState.getTeam().filter(w => w.available && !w.isUnblocking);
        if (potentialTargets.length === 0) { console.log("Obstacle Skipped: No available workers."); return null; }
        const targetWorker = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
        const actualPointsLost = Math.min(chosenObstacle.pointsLost, targetWorker.pointsPerDay);
        return { ...chosenObstacle, pointsLost: actualPointsLost, targetWorkerId: targetWorker.id, message: `${targetWorker.name} ${chosenObstacle.message}` };

    } else if (chosenObstacle.type === 'blocker') {
         // Target stories in 'doing' states, NOT already blocked, and HAVE assigned workers
         const activeStories = Object.values(GameState.getAllStories()).filter(s =>
             s.subStatus === 'doing' && // Must be in ip-doing or t-doing
             !s.isBlocked &&
             s.assignedWorkers.length > 0
         );
         if (activeStories.length === 0) { console.log("Obstacle Skipped: No active stories in 'doing' state."); return null; }
         const targetStory = activeStories[Math.floor(Math.random() * activeStories.length)];
         const reportingWorkerId = targetStory.assignedWorkers[Math.floor(Math.random() * targetStory.assignedWorkers.length)];
         const reportingWorker = GameState.getWorkerById(reportingWorkerId);
         if (!reportingWorker) return null; // Safety

         return { ...chosenObstacle, targetWorkerId: reportingWorker.id, targetStoryId: targetStory.id, message: `${reportingWorker.name} reports that story '${targetStory.title}' ${chosenObstacle.message}` };
    }
    return null;
}
// --- END OF FILE simulation.js ---