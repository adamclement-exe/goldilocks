// --- START OF FILE simulation.js ---

import * as GameState from './gameState.js';
import * as UI from './ui.js';

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
    // Proceeds via confirmDoDChoice
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
    if (!GameState.getChosenDoD()) { startGameFlow(); return; } // Ensure DoD is chosen first
    const sprintNum = GameState.getCurrentSprintNumber();
    console.log(`Starting Planning for Sprint ${sprintNum} (Day 0)`);
    GameState.calculateTeamCapacity();
    const capacity = GameState.getTeamCapacity();
    UI.updateSprintInfo(sprintNum, capacity, 'Planning');
    UI.renderAllColumns(); // Render initial state
    UI.populateSprintPlanningModal( GameState.getProductBacklog(), GameState.getSprintBacklog().map(s => s.id), capacity );
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
            // Check if this story was selected in the planning modal and add if needed
            const checkbox = document.getElementById(`plan-select-${storyId}`);
            if (checkbox && checkbox.checked && !GameState.getSprintBacklog().find(s => s.id === storyId)) {
                 if(GameState.addStoryToSprint(storyId)) {
                     UI.moveCardToColumn(storyId, 'ready');
                 } else {
                      // If adding failed (e.g., unexpected error), uncheck the box
                      checkbox.checked = false;
                      alert(`Could not add story ${story.title} to the sprint.`);
                 }
            }
            // Update the card potentially everywhere
            UI.updateCard(storyId, GameState.getStory(storyId));
            UI.updateSprintPlanningUI(); // Update total points display
        } else { console.error("Selected choice index invalid."); }
    } else { console.error("Could not find story ID or selected choice index."); }
}

export function commitToSprint() {
    console.log("commitToSprint called");
    const selectedStories = GameState.getSprintBacklog();
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

// --- Assignment Phase (Called for Day 1 only - assigns MULTIPLE workers via checkboxes) ---
function startWorkerAssignmentPhase(dayNum) {
    console.log("startWorkerAssignmentPhase entered");
    GameState.advanceDay(); // To Day 1 (index 1)
    const currentDay = GameState.getCurrentDay();
    const phaseName = GameState.getPhaseName(currentDay);
    console.log(`Starting Worker Assignment Phase (${phaseName} - Day State: ${currentDay})`);
    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDay);
    // Get stories in 'Ready' state from the committed sprint backlog
    const storiesToAssign = GameState.getSprintBacklog().filter(s => s?.status === 'ready');
    console.log(`Found ${storiesToAssign.length} stories in Ready state to assign.`);
    const availableWorkers = GameState.getAvailableWorkers(); // Includes Devs only
    console.log(`Found ${availableWorkers.length} available workers.`);
    try {
        UI.populateWorkerAssignmentModal(storiesToAssign, availableWorkers);
        console.log("Worker assignment modal content populated.");
    } catch (error) { console.error("Error during UI.populateWorkerAssignmentModal:", error); return; }
    if (!ASSIGNMENT_MODAL) { console.error("Cannot show modal: ASSIGNMENT_MODAL reference is null!"); return; }
    console.log("Attempting to show modal:", ASSIGNMENT_MODAL.id);
    UI.showModal(ASSIGNMENT_MODAL);
    console.log("UI.showModal call completed.");
}

// Confirm Day 1 Assignments from Checkboxes
export function confirmWorkerAssignments() {
    console.log("confirmWorkerAssignments called (Day 1 Multi-Assign)");
    const assignmentCheckboxes = ASSIGNMENT_MODAL.querySelectorAll('#assignment-list input[type="checkbox"]:checked');
    let assignmentsMade = 0;
    let successfulAssignments = []; // Track successful assignments {workerId, storyId}

    // Group assignments by story to check WIP limits properly
    const assignmentsByStory = {};
    assignmentCheckboxes.forEach(checkbox => {
        const storyId = checkbox.dataset.storyId;
        const workerId = checkbox.value;
        if (!assignmentsByStory[storyId]) {
            assignmentsByStory[storyId] = [];
        }
        assignmentsByStory[storyId].push(workerId);
    });

    // Process assignments story by story
    for (const storyId in assignmentsByStory) {
        const workersToAssign = assignmentsByStory[storyId];
        const story = GameState.getStory(storyId);

        if (!story) {
            console.warn(`Story ${storyId} not found during assignment confirmation.`);
            continue;
        }

        // Attempt to assign each worker to this story
        workersToAssign.forEach(workerId => {
            console.log(`Attempting assignment: Worker ${workerId} to Story ${storyId}`);
            // GameState.assignWorkerToStory handles all checks (availability, WIP, etc.)
            const success = GameState.assignWorkerToStory(workerId, storyId);
            if (success) {
                assignmentsMade++;
                successfulAssignments.push({ workerId, storyId }); // Store successful assignment
                console.log(`SUCCESS: Assigned ${workerId} to ${storyId}`);
            } else {
                // Revert the checkbox visually if assignment fails (e.g., last-minute WIP conflict)
                const checkbox = ASSIGNMENT_MODAL.querySelector(`input[type="checkbox"][value="${workerId}"][data-story-id="${storyId}"]`);
                if (checkbox) checkbox.checked = false;
                console.warn(`FAILED: Assignment of ${workerId} to ${storyId}.`);
                // Maybe alert the user here if needed
            }
        });
    }


    console.log(`${assignmentsMade} Day 1 assignments confirmed.`);

    // If no assignments were made at all, maybe keep the modal open? Or just proceed.
    if (assignmentsMade === 0 && assignmentCheckboxes.length > 0) {
         console.warn("Assignments attempted, but none were successful (likely WIP limits or other constraints).");
         // Decide whether to keep modal open or proceed
         // alert("No assignments could be made. Check WIP limits and worker availability."); return; // Option: Keep modal open
    }


    UI.closeModal(ASSIGNMENT_MODAL);
    UI.renderWorkers(GameState.getTeam()); // Update worker states
    UI.renderAllColumns(); // Update card assignments and potentially status/WIP count
    console.log("Calling runWorkDaySimulation(1)...");
    runWorkDaySimulation(1); // Simulate Work for Day 1 (occurs during Day State 2)
}


// --- Daily Scrum & Reassignment Phase (Called for Days 2, 3, 4, 5) ---
function startDailyScrumAndReassignment(dayNum) { // dayNum = 2, 3, 4, or 5
    GameState.advanceDay(); // To Day Index 3, 5, 7, or 9
    const currentDayState = GameState.getCurrentDay();
    const phaseName = GameState.getPhaseName(currentDayState);
    console.log(`Starting ${phaseName} (Day State: ${currentDayState})`);
    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDayState);

    // Generate and apply obstacles AFTER advancing day and resetting points/availability
    const obstacle = generateRandomObstacle();
    if (obstacle) {
        GameState.addObstacle(obstacle);
        console.log(`Obstacle generated for Day ${dayNum}:`, obstacle.message);
        UI.renderWorkers(GameState.getTeam()); // Update workers after potential obstacle effect
        if (obstacle.type === 'blocker') UI.renderAllColumns(); // Update cards if blocked
    } else {
         // Ensure UI is up-to-date even without new obstacles
         UI.renderWorkers(GameState.getTeam());
         UI.renderAllColumns();
    }

    // Get stories currently in progress or testing for the modal
    const storiesInProgressOrTesting = Object.values(GameState.getAllStories()).filter(s => s.status === 'inprogress' || s.status === 'testing');

    UI.populateDailyScrumModal(dayNum, GameState.getTeam(), GameState.getActiveObstacles(), storiesInProgressOrTesting );
    UI.showModal(DAILY_SCRUM_MODAL);
}

// ** Confirm Reassignments / Additions / Unblocking (Day 2-5) **
export function confirmReassignments() {
    // State: End of Day 3, 5, 7, or 9 (Reassignment phases)
    const currentDayState = GameState.getCurrentDay();
    const workDayNum = Math.ceil(currentDayState / 2); // Calculate current work day number (2, 3, 4, 5)
    console.log(`Confirming Day ${workDayNum} changes (Additions / Unblocking)...`);
    let changesMade = 0;

    // --- Process Blocker Resolutions ---
    const blockerSelects = DAILY_SCRUM_MODAL.querySelectorAll('#blocker-assignment-list select');
    blockerSelects.forEach(select => {
        const storyId = select.dataset.storyId;
        const workerId = select.value;
        if (workerId) { // Only if a worker is selected
            console.log(`Attempting Unblock: Worker ${workerId} for Story ${storyId}`);
            const success = GameState.assignSeniorToUnblock(workerId, storyId);
            if (success) {
                changesMade++;
                UI.updateCard(storyId, GameState.getStory(storyId)); // Update card (removes blocker visual)
                console.log(`SUCCESS: Unblocked ${storyId} by ${workerId}`);
            } else {
                 console.warn(`FAILED: Unblock ${storyId} by ${workerId}`);
                 select.value = ''; // Reset on failure
                 // Maybe alert user?
            }
        }
    });

    // --- Process Additional Worker Assignments ---
    // Unassigns are handled by event listeners in UI calling GameState directly
    const addWorkerSelects = DAILY_SCRUM_MODAL.querySelectorAll('#reassignment-list select[id^="add-assign-"]');
    addWorkerSelects.forEach(select => {
        const storyId = select.dataset.storyId;
        const workerId = select.value; // Worker selected in "Assign Additional"
        const story = GameState.getStory(storyId);

        if (workerId && story && !story.isBlocked) { // Only assign if worker selected and story not blocked
            console.log(`Attempting Add Worker: ${workerId} to Story ${storyId}`);
            // GameState.assignWorkerToStory handles availability, WIP limit checks
            const success = GameState.assignWorkerToStory(workerId, storyId);
            if (success) {
                changesMade++;
                console.log(`SUCCESS: Added worker ${workerId} to story ${storyId}`);
                 // UI updates for assigned workers list within the modal happens via updateDailyScrumModalOptions
                 // We need to update the card on the main board though
                 UI.updateCard(storyId, GameState.getStory(storyId));
            } else {
                console.warn(`FAILED: Add worker ${workerId} to story ${storyId}. Resetting dropdown.`);
                select.value = ''; // Reset add dropdown on failure
                 // Maybe alert user?
            }
        } else if (workerId && story && story.isBlocked) {
            console.warn(`Cannot add worker ${workerId} to blocked story ${storyId}. Resetting dropdown.`);
            select.value = ''; // Reset add dropdown if story is blocked
        } else if (workerId && !story) {
             console.warn(`Cannot add worker ${workerId} - story ${storyId} not found.`);
             select.value = '';
        }
    });

    console.log(`${changesMade} addition/unblocking changes processed for Day ${workDayNum}.`);
    UI.closeModal(DAILY_SCRUM_MODAL);
    UI.renderWorkers(GameState.getTeam()); // Update worker states in main list
    UI.renderAllColumns(); // Update cards on board
    runWorkDaySimulation(workDayNum); // Simulate Work for the corresponding day
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

// ** Simulate Day Progress (Handles Multiple Workers) **
function simulateDayProgress(workDayNum) {
    console.log(`--- Running Simulation for Work Day ${workDayNum} ---`);
    const workers = GameState.getTeam();
    const stories = GameState.getAllStories();
    let workDoneThisCycle = false;

    workers.forEach(worker => {
        // Skip unavailable, unblocking, or workers with no points left
        if (!worker.available || worker.isUnblocking || worker.dailyPointsLeft <= 0) {
             console.log(`Skipping worker ${worker.name}: Available=${worker.available}, Unblocking=${worker.isUnblocking}, PointsLeft=${worker.dailyPointsLeft}`);
             return;
        }

        if (worker.assignedStory) {
            const story = stories[worker.assignedStory]; // Find the story object

            // Check if story exists and is NOT blocked
            if (story && !story.isBlocked) {
                // Check if worker role matches story status (Dev on InProgress, Test on Testing)
                 const canWorkOnStatus = (worker.area !== 'Testing' && story.status === 'inprogress') || (worker.area === 'Testing' && story.status === 'testing');

                 if (canWorkOnStatus) {
                    let pointsAvailable = worker.dailyPointsLeft; // Use current remaining points
                    if (pointsAvailable <= 0) return; // Double check points

                    const specialtyBonus = story.tags.includes(worker.area) ? 1 : 0; // Simple bonus for matching area tag
                    let pointsToAttempt = worker.pointsPerDay + specialtyBonus; // Base points + bonus = potential max
                    pointsToAttempt = Math.min(pointsToAttempt, pointsAvailable); // Cannot use more points than available

                    // Apply work using applyWorkToStory
                    const result = GameState.applyWorkToStory(story.id, pointsToAttempt, worker.id); // Pass worker ID
                    const pointsApplied = result.workApplied; // Get actual points applied
                    const storyCompleted = result.storyCompleted; // Check if story finished testing

                    if (pointsApplied > 0) {
                         GameState.useWorkerPoints(worker.id, pointsApplied); // Deduct *actual* points used
                         workDoneThisCycle = true;
                         // Update UI immediately after work application for this worker/story combo
                         UI.updateCard(story.id, GameState.getStory(story.id));
                    }

                    if (storyCompleted) {
                        console.log(`Story ${story.title} completed (finished testing) by ${worker.name}.`);
                        // Worker unassignment happens within markStoryAsDone -> unassignWorkerFromStory
                         // Worker state will be updated in the final UI.renderWorkers call
                    } else if (story.status === 'testing' && worker.area !== 'Testing' && story.remainingEffort <= 0) {
                        // This state means Dev work finished, story moved to testing, but this dev worker wasn't unassigned yet.
                        // This should be handled inside applyWorkToStory, but as a safeguard:
                        console.warn(`Worker ${worker.name} (Dev) was assigned to story ${story.title} which moved to Testing. Unassigning.`);
                        GameState.unassignWorkerFromStory(story.id, worker.id);
                    }

                 } else {
                      console.log(`Worker ${worker.name} (${worker.area}) assigned to story ${story.title}, but status is ${story.status}. No work done by this worker.`);
                      // Consider auto-unassigning here? Or leave it for manual reassignment? For now, leave manual.
                 }

            } else if (story && story.isBlocked) {
                console.log(`Worker ${worker.name} blocked on ${story.title}.`);
                // Worker stays assigned but does no work. UI should reflect 'Blocked' state.
            }
            // If story doesn't exist, worker.assignedStory should be null (likely handled elsewhere?)
            else if (!story && worker.assignedStory) {
                 console.warn(`Worker ${worker.name} assigned to non-existent story ${worker.assignedStory}. Unassigning.`);
                 worker.assignedStory = null; // Clean up bad state
            }
        }
    });

    if (!workDoneThisCycle) console.log("No work progress made this cycle.");
    console.log("--- End Day Simulation ---");
    UI.renderWorkers(GameState.getTeam()); // Update worker points/state display AT THE END of the simulation
    UI.renderAllColumns(); // Update card progress, aging, etc. AT THE END
}


// Called by Next Day / End Sprint button click
export function handleDayEnd() {
    const currentDayState = GameState.getCurrentDay(); // State *after* work sim (2, 4, 6, 8, 10)
    console.log(`Handling End of Day Button Click. Current Day State: ${currentDayState}`);

    if ([2, 4, 6, 8].includes(currentDayState)) {
        const nextDayNum = Math.ceil((currentDayState + 1) / 2); // Day number (2, 3, 4, 5)
        startDailyScrumAndReassignment(nextDayNum);
    } else if (currentDayState === 10) {
        // End of Work Day 5
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
    UI.updateSprintInfo(sprintNum, GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDayState); // Hide next day button
    startSprintReview();
}

function startSprintReview() {
    console.log("Starting Sprint Review");
    const sprintNum = GameState.getCurrentSprintNumber();
    const completed = GameState.getCurrentSprintCompletedStories();
    const velocity = completed.reduce((sum, story) => sum + (story?.baseEffort || 0), 0);
    const value = completed.reduce((sum, story) => sum + (story?.value || 0), 0);
    const avgCycleTime = GameState.calculateAverageCycleTime(); // Calculation updated in gameState

    // Generate Sponsor Feedback
    let feedback = "Sponsor feedback: ";
    if (velocity === 0 && GameState.getSprintBacklog().length > 0) { feedback += "Disappointed nothing finished, despite commitment."; }
    else if (velocity > 0 && value > (sprintNum * 15)) { feedback += "Thrilled with the high value delivered!"; } // Higher bar for value
    else if (velocity > 0 && value < (sprintNum * 5) ) { feedback += "Work done, but hoped for more valuable features."; }
    else if (velocity > 0 && velocity < GameState.getTeamCapacity() / 4) { feedback += "Progress seems quite slow."; } // Lower threshold for slow
    else if (velocity > 0) { feedback += "Acknowledges completed work. Seems steady."; }
    else { feedback += "No work completed this sprint."; }
    // Cycle time feedback
    if (avgCycleTime !== null) {
         if (avgCycleTime > 4.0) { feedback += ` Flow seems sluggish (Avg Cycle: ${avgCycleTime} work days).`; }
         else if (avgCycleTime < 2.0) { feedback += ` Excellent flow! (Avg Cycle: ${avgCycleTime} work days).`; }
         else { feedback += ` Flow seems steady (Avg Cycle: ${avgCycleTime} work days).`; }
     } else if (velocity > 0) {
         feedback += " (Could not calculate average cycle time).";
     }

    // DoD Progress Feedback
    let dodProgressFeedback = "";
    const chosenDoD = GameState.getChosenDoD();
    if (chosenDoD) {
        const definition = GameState.getDodDefinition(chosenDoD);
        const allCompletedIds = new Set(GameState.getCompletedStories().map(s => s.id)); // Use *all* completed stories for DoD check
        const requiredIds = definition.requiredStoryIds;
        const completedRequired = requiredIds.filter(id => allCompletedIds.has(id)).length;
        const totalRequired = requiredIds.length;
        dodProgressFeedback = `Overall DoD Progress ('${definition.name}'): ${completedRequired} / ${totalRequired} required stories completed so far.`;
        if (sprintNum === 3) { // Add final check result message
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
     const allCompleted = GameState.getCompletedStories();
     UI.populateFinalStorybook(allCompleted);
}


// --- Obstacle Generation ---
function generateRandomObstacle() {
    const chance = 0.35; // Slightly higher chance for obstacles
    if (Math.random() > chance) return null;

    const obstacleTypes = [
        // Capacity Reductions (Target Available Workers)
        { type: 'capacity_reduction', pointsLost: 1, shortMessage: "Distracted", message: "distracted, loses 1pt capacity today.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 2, shortMessage: "Meeting", message: "pulled into a meeting, loses 2pt capacity today.", makesUnavailable: false },
         { type: 'capacity_reduction', pointsLost: 3, shortMessage: "Helping", message: "helping another team, loses 3pt capacity today.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 99, shortMessage: "Sick Day", message: "called in sick, unavailable today.", makesUnavailable: true },
        // Blockers (Target Active Stories)
        { type: 'blocker', message: "needs urgent clarification from stakeholders, blocking progress!" },
        { type: 'blocker', message: "has an unexpected technical issue, blocking progress!" },
        { type: 'blocker', message: "dependency on external team delayed, blocking progress!" },
        { type: 'blocker', message: "conflicting requirements discovered, blocking progress!" },
    ];

    const chosenObstacle = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    if (chosenObstacle.type === 'capacity_reduction') {
        // Target workers who are *currently set to available* for the upcoming phase
        const potentialTargets = GameState.getTeam().filter(w => w.available && !w.isUnblocking); // Target available workers
        if (potentialTargets.length === 0) {
             console.log("Obstacle Skipped: No available workers for capacity reduction.");
             return null; // No one available to affect
        }
        const targetWorker = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
        const actualPointsLost = Math.min(chosenObstacle.pointsLost, targetWorker.pointsPerDay); // Can't lose more than base points
        return {
            ...chosenObstacle,
            pointsLost: actualPointsLost,
            targetWorkerId: targetWorker.id,
            message: `${targetWorker.name} ${chosenObstacle.message}` // Dynamic message
        };

    } else if (chosenObstacle.type === 'blocker') {
         // Target stories that are 'inprogress' or 'testing', NOT already blocked, and HAVE assigned workers
         const activeStories = Object.values(GameState.getAllStories()).filter(s =>
             (s.status === 'inprogress' || s.status === 'testing') &&
             !s.isBlocked &&
             s.assignedWorkers.length > 0
         );
         if (activeStories.length === 0) {
            console.log("Obstacle Skipped: No active, unblocked stories with assigned workers for blocker.");
            return null; // No suitable story to block
         }
         const targetStory = activeStories[Math.floor(Math.random() * activeStories.length)];
         // Find *a* worker currently assigned to the story to "report" the blocker
         const reportingWorkerId = targetStory.assignedWorkers[Math.floor(Math.random() * targetStory.assignedWorkers.length)];
         const reportingWorker = GameState.getWorkerById(reportingWorkerId);
         if (!reportingWorker) return null; // Safety check

         return {
            ...chosenObstacle,
            targetWorkerId: reportingWorker.id, // Worker associated with the message
            targetStoryId: targetStory.id, // The story being blocked
            message: `${reportingWorker.name} reports that story '${targetStory.title}' ${chosenObstacle.message.replace('progress!', 'progress!')}` // Dynamic message
         };
    }
    return null; // Should not happen
}
// --- END OF FILE simulation.js ---