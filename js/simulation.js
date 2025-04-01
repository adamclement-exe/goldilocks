// --- START OF FILE simulation.js ---

import * as GameState from './gameState.js';
import * as UI from './ui.js';

// --- Modal References ---
const DOD_CHOICE_MODAL = document.getElementById('dod-choice-modal');
const PLANNING_MODAL = document.getElementById('sprint-planning-modal');
const ASSIGNMENT_MODAL = document.getElementById('worker-assignment-modal');
const DAILY_SCRUM_MODAL = document.getElementById('daily-scrum-modal'); // Reassignment Day 2 & Blockers
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
        startSprintPlanning(); // Now start the actual Sprint 1 Planning
    } else {
        alert("Please select a Definition of Done level.");
    }
}


// --- Sprint Lifecycle Functions ---

export function startSprintPlanning() {
    if (!GameState.getChosenDoD()) {
        console.error("Trying to start planning before DoD is chosen!");
        startGameFlow(); // Restart DoD choice if needed
        return;
    }
    const sprintNum = GameState.getCurrentSprintNumber();
    console.log(`Starting Planning for Sprint ${sprintNum}`);
    GameState.calculateTeamCapacity(); // Ensure capacity is up-to-date
    const capacity = GameState.getTeamCapacity();
    UI.updateSprintInfo(sprintNum, capacity, 'Planning'); // Day state 0 is Planning
    UI.renderAllColumns(); // Ensure columns are fresh
    UI.populateSprintPlanningModal(
        GameState.getProductBacklog(),
        GameState.getSprintBacklog().map(s => s.id), // Pass only IDs of already selected
        capacity
    );
    UI.showModal(PLANNING_MODAL);
    UI.updateButtonVisibility(0); // Planning state (hides main button)
}

export function confirmProceduralChoice() {
    const storyId = PROCEDURAL_CHOICE_MODAL.dataset.storyId;
    const selectedIndex = PROCEDURAL_CHOICE_MODAL.querySelector('input[type="radio"]:checked')?.value;
    if (storyId && selectedIndex !== undefined) {
        const story = GameState.getStory(storyId);
        if (!story) { console.error(`Story ${storyId} not found for procedural choice.`); return; }
        const choice = story.implementationChoices[parseInt(selectedIndex)];
        if (choice) {
            GameState.setStoryImplementation(storyId, choice);
            UI.closeModal(PROCEDURAL_CHOICE_MODAL);

            // Check if the story *should* be in the sprint (was checkbox checked?)
            const checkbox = document.getElementById(`plan-select-${storyId}`);
            if (checkbox && checkbox.checked && !GameState.getSprintBacklog().find(s => s.id === storyId)) {
                 if(GameState.addStoryToSprint(storyId)) {
                      UI.moveCardToColumn(storyId, 'ready');
                 } else {
                      console.warn(`Failed to add story ${storyId} to sprint after choice confirmation.`);
                      checkbox.checked = false;
                 }
            }
            UI.updateCard(storyId, GameState.getStory(storyId)); // Update card display with new effort
            UI.updateSprintPlanningUI(); // Update total points display
        } else { console.error("Selected choice index is invalid."); }
    } else { console.error("Could not find story ID or selected choice index."); }
}

export function commitToSprint() {
    const selectedStories = GameState.getSprintBacklog();
    if (selectedStories.length === 0) { alert("Please select at least one story for the Sprint."); return; }
    const selectedPoints = selectedStories.reduce((sum, story) => sum + (story?.baseEffort || 0), 0); // Use baseEffort after choice
    const capacity = GameState.getTeamCapacity();
     if (selectedPoints > capacity) {
        if (!confirm(`Warning: Selected points (${selectedPoints}) exceed capacity (${capacity}). This may reduce efficiency. Continue anyway?`)) { return; }
    }
    console.log("Committing to Sprint Backlog:", selectedStories.map(s => s?.title || 'Unknown Story'));
    UI.closeModal(PLANNING_MODAL);
    startWorkerAssignmentPhase();
}

// --- Assignment Phase (Day 1) ---
function startWorkerAssignmentPhase() {
    const currentDay = GameState.getCurrentDay(); // Should be 0, about to become 1
    const phaseName = GameState.getPhaseName(1); // Display "Assign Workers Day 1"
    console.log(`Starting Worker Assignment Phase (Will be Day 1)`);

    GameState.advanceDay(); // NOW advance to Day 1. Handles point reset etc.
    const sprintNum = GameState.getCurrentSprintNumber();
    const capacity = GameState.getTeamCapacity();

    UI.updateSprintInfo(sprintNum, capacity, phaseName); // Update UI with Day 1 info
    UI.updateButtonVisibility(1); // Update buttons for Day 1 state

    const storiesToAssign = GameState.getSprintBacklog().filter(s => s?.status === 'ready');
    const allWorkers = GameState.getTeam(); // Pass all workers, UI will filter
    UI.populateWorkerAssignmentModal(storiesToAssign, allWorkers); // UI handles filtering suitable workers
    UI.showModal(ASSIGNMENT_MODAL);
}


// --- Confirm Worker Assignments (Day 1) --- CHANGED for multi-select
export function confirmWorkerAssignments() {
    console.log("Confirming Day 1 worker assignments...");
    const assignmentItems = ASSIGNMENT_MODAL.querySelectorAll('.assignment-item');
    let assignmentsMadeCount = 0;
    let assignmentsAttemptedCount = 0;
    let successfulAssignments = []; // Track successful pairs {workerId, storyId}

    assignmentItems.forEach(item => {
        const storyId = item.dataset.storyId;
        const checkboxes = item.querySelectorAll('input[type="checkbox"]:checked');

        checkboxes.forEach(checkbox => {
            const workerId = checkbox.value;
            assignmentsAttemptedCount++;
            // GameState.assignWorkerToStory now handles WIP limit checks and alerts for the *first* worker
            const success = GameState.assignWorkerToStory(workerId, storyId);
            if (success) {
                assignmentsMadeCount++;
                successfulAssignments.push({ workerId, storyId });
                 // UI update (move card, wip count) is handled by GameState status/WIP updates
            } else {
                 // Assignment failed (likely WIP limit or other rule)
                 // Revert the checkbox in the UI? This might be complex if the modal closes immediately.
                 console.warn(`Assignment of ${workerId} to ${storyId} failed (likely WIP limit or worker unavailable).`);
                 // Alert happens inside GameState.assignWorkerToStory
            }
        });
    });

    console.log(`${assignmentsMadeCount} successful Day 1 assignments confirmed out of ${assignmentsAttemptedCount} attempts.`);

    // Ensure UI reflects the final state from GameState
    UI.closeModal(ASSIGNMENT_MODAL);
    UI.renderWorkers(GameState.getTeam()); // Update worker display (shows assigned story)
    UI.renderAllColumns(); // Update columns (card movement, assignments, WIP counts)

    runWorkDaySimulation(1); // Run Day 1 work simulation (Occurs on Day state 2)
}


// --- Daily Scrum & Reassignment Phase (Day 3 Logic Start) ---
function startDailyScrumAndReassignment() {
    const currentDayState = GameState.getCurrentDay(); // Should be 2, about to become 3
    const currentWorkDayDisplay = 2; // Displaying Day 2 for user
    const phaseName = GameState.getPhaseName(3); // Display "Reassign Workers Day 2"
    console.log(`Starting ${phaseName} (Will be Day 3)`);

    GameState.advanceDay(); // NOW advance to Day 3. Handles point resets, availability, aging, applies blockers
    const sprintNum = GameState.getCurrentSprintNumber();
    const capacity = GameState.getTeamCapacity();

    UI.updateSprintInfo(sprintNum, capacity, phaseName); // Update UI with Day 3 info
    UI.updateButtonVisibility(3); // Update buttons for Day 3 state

    // Obstacles (including blockers) are applied inside GameState.advanceDay now
    // We just need to render the results
    console.log("Active obstacles after advancing day:", GameState.getActiveObstacles());
    UI.renderWorkers(GameState.getTeam()); // Reflects any unavailability from obstacles
    UI.renderAllColumns(); // Reflects any new blockers and aging

    const storiesInProgressOrTesting = Object.values(GameState.getAllStories())
        .filter(s => s.status === 'inprogress' || s.status === 'testing');

    UI.populateDailyScrumModal( currentWorkDayDisplay, GameState.getTeam(), GameState.getActiveObstacles(), storiesInProgressOrTesting );
    UI.showModal(DAILY_SCRUM_MODAL);
    // User clicks "Confirm Changes & Start Day 2 Work" -> confirmReassignments
}

// --- Confirm Reassignments (Day 2 / Daily Scrum) --- CHANGED for multi-select
export function confirmReassignments() {
    console.log("Confirming Day 2 changes (Reassignments & Unblocking)...");
    let changesMadeCount = 0;
    let blockerAssignments = [];
    let reassignments = { add: [], remove: [] }; // { workerId, storyId }

    // --- Gather Intents from Modal ---

    // Blocker Resolution Intents
    const blockerSelects = DAILY_SCRUM_MODAL.querySelectorAll('#blocker-assignment-list select');
    blockerSelects.forEach(select => {
        const storyId = select.dataset.storyId;
        const workerId = select.value;
        if (workerId) { // If a senior was selected
            blockerAssignments.push({ workerId, storyId });
        }
    });

    // Reassignment Intents (Add/Remove)
    const reassignmentItems = DAILY_SCRUM_MODAL.querySelectorAll('.reassignment-item');
    reassignmentItems.forEach(item => {
        const storyId = item.dataset.storyId;
        // Check "Keep" checkboxes - if UNCHECKED, it's a REMOVE intent
        item.querySelectorAll('input[data-action="keep"]').forEach(keepCb => {
            if (!keepCb.checked) {
                reassignments.remove.push({ workerId: keepCb.dataset.workerId, storyId });
            }
        });
        // Check "Add" checkboxes - if CHECKED, it's an ADD intent
        item.querySelectorAll('input[data-action="add"]:checked').forEach(addCb => {
            reassignments.add.push({ workerId: addCb.value, storyId });
        });
    });

    console.log("Intents gathered:", { blockerAssignments, reassignments });

    // --- Process Intents (Order Matters: Unblock/Remove first, then Add) ---

    // 1. Process Blocker Resolutions
    blockerAssignments.forEach(intent => {
        console.log(`Attempting to assign ${intent.workerId} to unblock ${intent.storyId}`);
        // GameState function handles checks and point deduction
        const success = GameState.assignSeniorToUnblock(intent.workerId, intent.storyId);
        if (success) {
            changesMadeCount++;
            console.log(`Successfully assigned ${intent.workerId} to unblock ${intent.storyId}`);
            // UI update for blocker removal happens in final render
        } else {
            console.error(`Failed to assign ${intent.workerId} to unblock ${intent.storyId}`);
            // Alert/message handled within GameState function
        }
    });

    // 2. Process Removals
    reassignments.remove.forEach(intent => {
         console.log(`Attempting to unassign ${intent.workerId} from ${intent.storyId}`);
         const success = GameState.unassignWorkerFromStory(intent.workerId, intent.storyId);
          if (success) {
                changesMadeCount++;
                console.log(`Successfully unassigned ${intent.workerId} from ${intent.storyId}`);
                // WIP/Status updates handled in GameState
          } else {
               console.error(`Failed to unassign ${intent.workerId} from ${intent.storyId}`);
          }
    });

    // 3. Process Additions
    reassignments.add.forEach(intent => {
         console.log(`Attempting assignment of ${intent.workerId} to ${intent.storyId}`);
         const story = GameState.getStory(intent.storyId);
         // Double check story isn't blocked *after* blocker resolution phase
         if (story && story.isBlocked) {
             console.warn(`Skipping add assignment for ${intent.storyId}: Story is still blocked.`);
             alert(`Cannot assign ${GameState.getWorkerById(intent.workerId)?.name} to ${story.title}. It is still blocked.`);
             return; // Skip this addition
         }
          // Double check worker didn't get assigned to unblock
         const worker = GameState.getWorkerById(intent.workerId);
         if (worker && worker.isUnblocking) {
              console.warn(`Skipping add assignment for ${intent.storyId}: Worker ${intent.workerId} is now unblocking.`);
              alert(`Cannot assign ${worker.name} to ${story?.title || 'story'}. They are assigned to unblock another item.`);
              return; // Skip this addition
         }

         // GameState.assignWorkerToStory handles WIP checks and alerts for *first* worker
         const success = GameState.assignWorkerToStory(intent.workerId, intent.storyId);
         if (success) {
             changesMadeCount++;
             console.log(`Successfully assigned ${intent.workerId} to ${intent.storyId}`);
             // Status/WIP updates handled in GameState
         } else {
             console.error(`Add assignment failed for story ${intent.storyId} to worker ${intent.workerId} (likely WIP limit or worker unavailable).`);
             // Alert handled in GameState function
         }
    });


    console.log(`${changesMadeCount} successful changes processed.`);
    UI.closeModal(DAILY_SCRUM_MODAL);

    // --- Final UI Update ---
    UI.renderWorkers(GameState.getTeam()); // Update worker display (shows assignments, unblocking status, points used)
    UI.renderAllColumns(); // Re-render columns fully to reflect all changes (blockers removed, assignments, WIP)

    runWorkDaySimulation(2); // Run Day 2 work simulation (Occurs on Day state 4)
}


// --- Work Simulation --- CHANGED for multi-assign
function runWorkDaySimulation(workDayNum) {
    const currentDayState = GameState.getCurrentDay(); // State *before* advancing (e.g., 1 or 3)
    const phaseName = GameState.getPhaseName(currentDayState + 1); // Get phase name for the upcoming work day
    console.log(`--- Simulating Work Progress for ${phaseName} (Day State: ${currentDayState + 1}) ---`);

    GameState.advanceDay(); // Moves state to 2 or 4, handles point resets, aging, applies blockers etc.

    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName); // Display phase name
    UI.updateButtonVisibility(GameState.getCurrentDay()); // Show Next Day / End Sprint button based on NEW day state (2 or 4)

    simulateDayProgress(workDayNum); // Pass the work day number (1 or 2)
}

// --- Simulate Day Progress --- CHANGED for multi-assign
function simulateDayProgress(workDayNum) {
    console.log(`--- Running Simulation for Work Day ${workDayNum} ---`);
    const stories = GameState.getAllStories();
    let workAppliedSomewhere = false;

    // Iterate through stories that are in progress or testing
    Object.values(stories).forEach(story => {
        if ((story.status === 'inprogress' || story.status === 'testing') && story.assignedWorkers.length > 0 && !story.isBlocked) {
            // applyWorkToStory now handles iterating through assigned workers and applying points
            const storyCompleted = GameState.applyWorkToStory(story.id); // Returns true if story is fully DONE

            if (storyCompleted) {
                console.log(`Story ${story.title} was completed this cycle.`);
                // UI updates (moving to Done, updating card) are handled within markStoryAsDone called by applyWorkToStory
                workAppliedSomewhere = true; // Mark that work happened
            } else {
                 // Check if *any* work was actually applied (points > 0) even if not completed
                 // This requires looking at worker point changes or story progress change,
                 // but GameState.applyWorkToStory logs points applied, so we can rely on that for now.
                 // If applyWorkToStory applied any points, we assume work was done.
                 // We need a way to know if progress was made to set workAppliedSomewhere = true.
                 // For simplicity, let's assume if applyWorkToStory was called on an active story, work was attempted.
                 // A more robust check could involve comparing story progress before/after.
                 if (story.progress > 0 || story.testingProgress > 0) { // Basic check if *any* progress exists
                      workAppliedSomewhere = true;
                      // Update card UI immediately after work application
                      UI.updateCard(story.id, GameState.getStory(story.id));
                 }
            }
        } else if (story.isBlocked && story.assignedWorkers.length > 0) {
             console.log(`Work skipped for ${story.title}: Story is BLOCKED.`);
        }
         // else: Story not in active state, no workers, etc. - skip
    }); // End forEach story

    if (!workAppliedSomewhere) {
        console.log("No work progress could be applied this cycle.");
    }

    console.log("--- End Day Simulation ---");
    // Update UI after all stories have been processed for the day
    UI.renderWorkers(GameState.getTeam()); // Update worker display (points left, availability)
    UI.renderAllColumns(); // Update columns (progress, aging, potentially status changes)
}


// Called by Next Day / End Sprint button
export function handleDayEnd() {
    const currentDayState = GameState.getCurrentDay(); // State *after* work sim (2 or 4)
    console.log(`Handling End of Day State: ${currentDayState}`);
    if (currentDayState === 2) { // End of Day 1 Work phase completed
        startDailyScrumAndReassignment(); // Start Day 3 logic (Reassignment phase)
    } else if (currentDayState === 4) { // End of Day 2 Work phase completed
        GameState.advanceDay(); // Move state to Day 5 (Review)
        endSprintWork(); // Start Review phase logic
    } else {
        console.error(`handleDayEnd called unexpectedly in state ${currentDayState}`);
    }
}


// --- Review, Retro, Next Sprint, Final Book ---

function endSprintWork() {
    const sprintNum = GameState.getCurrentSprintNumber();
    const currentDayState = GameState.getCurrentDay(); // Should be 5
    console.log(`Ending Sprint ${sprintNum} Work Phase. Current Day State: ${currentDayState}`);
    const phaseName = GameState.getPhaseName(currentDayState); // Should be Review
    UI.updateSprintInfo(sprintNum, GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDayState); // Hide Next Day button
    startSprintReview();
}

function startSprintReview() {
    console.log("Starting Sprint Review");
    const sprintNum = GameState.getCurrentSprintNumber();
    const completed = GameState.getCurrentSprintCompletedStories();
    const velocity = completed.reduce((sum, story) => sum + (story?.baseEffort || 0), 0);
    const value = completed.reduce((sum, story) => sum + (story?.value || 0), 0);
    const avgCycleTime = GameState.calculateAverageCycleTime();

    // Sponsor Feedback
    let feedback = "The sponsor observes the progress. ";
    if (velocity === 0 && GameState.getSprintBacklog().length > 0) {
        feedback += "They seem disappointed that nothing was finished this Sprint.";
    } else if (velocity > 0 && value > 10) {
         feedback += "They are very pleased with the high-value features delivered!";
    } else if (velocity > 0 && velocity < GameState.getTeamCapacity() / 4) {
         feedback += "They acknowledge the completed work, but note that progress seems a bit slow.";
    } else if (velocity > 0) {
         feedback += "They acknowledge the completed work.";
    } else {
         feedback += "No stories were committed or completed this Sprint.";
    }
    if (avgCycleTime !== null) {
        if (avgCycleTime > 3.0) { feedback += ` They also comment that items seem to be taking a while to get through the process (Avg Cycle Time: ${avgCycleTime} days). Consider how to improve flow.`; }
        else if (avgCycleTime < 1.5) { feedback += ` The team is delivering features quickly (Avg Cycle Time: ${avgCycleTime} days)!`; }
        else { feedback += ` Flow seems steady (Avg Cycle Time: ${avgCycleTime} days).`; }
    } else if (velocity > 0) { feedback += " (Could not calculate average cycle time for completed items)."; }

    // DoD Progress Feedback
    let dodProgressFeedback = "";
    const chosenDoD = GameState.getChosenDoD();
    if (chosenDoD) {
        const definition = GameState.getDodDefinition(chosenDoD);
        const allCompletedIds = new Set(GameState.getCompletedStories().map(s => s.id));
        const requiredIds = definition.requiredStoryIds;
        const completedRequired = requiredIds.filter(id => allCompletedIds.has(id)).length;
        const totalRequired = requiredIds.length;
        dodProgressFeedback = `Progress towards '${definition.name}' goal: ${completedRequired} of ${totalRequired} required stories completed across all sprints.`;
        if (sprintNum < 3 && completedRequired < totalRequired / 2) { dodProgressFeedback += " Keep focused on the goal!"; }
        else if (sprintNum < 3 && completedRequired >= totalRequired / 2) { dodProgressFeedback += " Good progress towards the goal!"; }
        else if (sprintNum === 3 && completedRequired < totalRequired) { dodProgressFeedback += " Final sprint results - check the final book for DoD status!"; }
        else if (sprintNum === 3 && completedRequired >= totalRequired) { dodProgressFeedback += " Looks like the goal might be met!"; }
    }

    UI.populateSprintReviewModal(sprintNum, completed, velocity, value, avgCycleTime, feedback, dodProgressFeedback);
}


export function startRetrospective() {
    console.log("Starting Sprint Retrospective");
    UI.closeModal(REVIEW_MODAL);
    UI.populateRetrospectiveModal(GameState.getCurrentSprintNumber());
}

export function startNextSprint() {
    console.log("Preparing for next Sprint...");
    GameState.startNewSprint();
    startSprintPlanning(); // Go back to planning phase (Day 0)
}

export function showFinalStorybook() {
     console.log("Checking DoD and Showing Final Storybook");
     UI.closeModal(RETRO_MODAL); // Close retro if open
     GameState.checkDoDMet(); // Ensure final check is done
     const allCompleted = GameState.getCompletedStories();
     UI.populateFinalStorybook(allCompleted);
}


// --- Obstacle Generation (Minor adjustments needed) ---
function generateRandomObstacle() {
    const chance = 0.35;
    if (Math.random() > chance) return null;

    const obstacleTypes = [
        { type: 'capacity_reduction', pointsLost: 1, shortMessage: "Distracted", message: "got distracted by project discussions and loses 1 point capacity today.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 2, shortMessage: "Meeting", message: "was pulled into an urgent meeting, losing 2 points capacity.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 99, shortMessage: "Sick Day", message: "is unexpectedly sick today and unavailable.", makesUnavailable: true },
        { type: 'blocker', message: "needs urgent clarification on requirements, blocking progress!" },
        { type: 'blocker', message: "found a technical issue requiring senior input, blocking progress!" },
        { type: 'blocker', message: "dependency on another story not yet done is blocking progress!" },
    ];

    const chosenObstacle = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    let potentialTargets = [];
    if (chosenObstacle.type === 'capacity_reduction') {
        // Target available workers (not already unavailable or unblocking)
        potentialTargets = GameState.getTeam().filter(w => w.available && !w.isUnblocking);
        if (potentialTargets.length === 0) { console.log("Obstacle Generation: No available workers for capacity reduction."); return null; }
        const targetWorker = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
        const actualPointsLost = Math.min(chosenObstacle.pointsLost, targetWorker.pointsPerDay);
        return { ...chosenObstacle, pointsLost: actualPointsLost, targetWorkerId: targetWorker.id, message: `${targetWorker.name} ${chosenObstacle.message}` };

    } else if (chosenObstacle.type === 'blocker') {
         // Target an active story (inprogress/testing) that isn't already blocked and HAS assigned workers
         const activeStories = Object.values(GameState.getAllStories()).filter(s => (s.status === 'inprogress' || s.status === 'testing') && !s.isBlocked && s.assignedWorkers.length > 0);
         if (activeStories.length > 0) {
             const targetStory = activeStories[Math.floor(Math.random() * activeStories.length)];
             // Associate blocker with the story, not a specific worker
             return { ...chosenObstacle, targetStoryId: targetStory.id, message: `Obstacle encountered blocking progress on '${targetStory.title}'! (${chosenObstacle.message})` };
         } else {
             console.log("Obstacle Generation: No active, unblocked stories with assigned workers to target for blocker.");
             return null;
         }
    }
    return null;
}
// --- END OF FILE simulation.js ---