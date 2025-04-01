import * as GameState from './gameState.js';
import * as UI from './ui.js';

// --- Modal References ---
const DOD_CHOICE_MODAL = document.getElementById('dod-choice-modal');
const PLANNING_MODAL = document.getElementById('sprint-planning-modal');
const ASSIGNMENT_MODAL = document.getElementById('worker-assignment-modal');
const DAILY_SCRUM_MODAL = document.getElementById('daily-scrum-modal'); // Now used for Reassignment Day 2 & Blockers
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
                 // Try adding to sprint *after* choice is confirmed
                 if(GameState.addStoryToSprint(storyId)) {
                      UI.moveCardToColumn(storyId, 'ready');
                 } else {
                      console.warn(`Failed to add story ${storyId} to sprint after choice confirmation.`);
                      checkbox.checked = false; // Revert checkbox if adding failed
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
    // GameState.advanceDay(); // Move state to Day 1 (Assignment Phase) - Handled in startWorkerAssignmentPhase
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

    // Fetch stories in 'ready' state that are part of the sprint backlog
    const storiesToAssign = GameState.getSprintBacklog().filter(s => s?.status === 'ready');
    const availableWorkers = GameState.getAvailableWorkers(); // Get workers available on Day 1
    UI.populateWorkerAssignmentModal(storiesToAssign, availableWorkers);
    UI.showModal(ASSIGNMENT_MODAL);
}


export function confirmWorkerAssignments() {
    console.log("Confirming Day 1 worker assignments...");
    const assignmentSelects = ASSIGNMENT_MODAL.querySelectorAll('#assignment-list select');
    let assignmentsMade = 0;
    assignmentSelects.forEach(select => {
        const storyId = select.dataset.storyId;
        const workerId = select.value;
        if (workerId) {
            // GameState.assignWorkerToStory now handles WIP limit checks and alerts
            const success = GameState.assignWorkerToStory(workerId, storyId);
            if (success) {
                // UI update (move card, wip count) is handled by status update triggered within assignWorkerToStory
                assignmentsMade++;
            } else {
                 // Assignment failed (likely WIP limit), reset the dropdown in UI
                 select.value = '';
                 // Re-enable options in other dropdowns for this worker (complex, may need full modal refresh or skip)
                 console.warn(`Assignment of ${workerId} to ${storyId} failed (likely WIP limit).`);
                 // Alert happens inside GameState.assignWorkerToStory
            }
        } else {
             const story = GameState.getStory(storyId);
             if (story && story.status === 'ready') { console.log(`Story ${storyId} (${story.title}) left unassigned for Day 1.`); }
        }
    });
    console.log(`${assignmentsMade} Day 1 assignments confirmed.`);
    UI.closeModal(ASSIGNMENT_MODAL);
    UI.renderWorkers(GameState.getTeam()); // Update worker display
    // GameState.advanceDay(); // Move to Day 2 (Work Day 1) - Handled by simulation flow
    runWorkDaySimulation(1); // Run Day 1 work simulation (Occurs on Day state 2)
}


// --- Daily Scrum & Reassignment Phase (Day 3 Logic Start) ---
function startDailyScrumAndReassignment() {
    const currentDayState = GameState.getCurrentDay(); // Should be 2, about to become 3
    const currentWorkDayDisplay = 2; // Displaying Day 2 for user
    const phaseName = GameState.getPhaseName(3); // Display "Reassign Workers Day 2"
    console.log(`Starting ${phaseName} (Will be Day 3)`);

    GameState.advanceDay(); // NOW advance to Day 3. Handles point reset/availability, WIP Aging, clears old blockers
    const sprintNum = GameState.getCurrentSprintNumber();
    const capacity = GameState.getTeamCapacity();

    UI.updateSprintInfo(sprintNum, capacity, phaseName); // Update UI with Day 3 info
    UI.updateButtonVisibility(3); // Update buttons for Day 3 state

    // Apply Random Obstacle for Day 2 *after* advancing day and resetting points/availability
    const obstacle = generateRandomObstacle();
    if (obstacle) {
        GameState.addObstacle(obstacle); // Add obstacle to state
        console.log("Obstacle generated for Day 2:", obstacle.message);
        // Re-render workers immediately if an obstacle hits availability
        UI.renderWorkers(GameState.getTeam());
         // If obstacle was a blocker, re-render columns to show blocker icon
         if (obstacle.type === 'blocker') {
              UI.renderAllColumns(); // Ensures blocker icon/style is applied
         }
    } else {
        // Ensure workers are rendered even without new obstacles, showing reset points
        UI.renderWorkers(GameState.getTeam());
        UI.renderAllColumns(); // Ensure aging is updated visually if no obstacles hit
    }


    const storiesInProgressOrTesting = Object.values(GameState.getAllStories())
        .filter(s => s.status === 'inprogress' || s.status === 'testing');

    UI.populateDailyScrumModal( currentWorkDayDisplay, GameState.getTeam(), GameState.getActiveObstacles(), storiesInProgressOrTesting );
    UI.showModal(DAILY_SCRUM_MODAL);
    // User clicks "Confirm Changes & Start Day 2 Work" -> confirmReassignments
}

export function confirmReassignments() {
    console.log("Confirming Day 2 changes (Reassignments & Unblocking)...");
    let changesMade = 0;

    // --- Process Blocker Resolutions First ---
    const blockerSelects = DAILY_SCRUM_MODAL.querySelectorAll('#blocker-assignment-list select');
    blockerSelects.forEach(select => {
        const storyId = select.dataset.storyId;
        const workerId = select.value;
        if (workerId) { // If a senior was selected
            console.log(`Attempting to assign ${workerId} to unblock ${storyId}`);
            // GameState function handles checks and point deduction
            const success = GameState.assignSeniorToUnblock(workerId, storyId);
            if (success) {
                changesMade++;
                UI.updateCard(storyId, GameState.getStory(storyId)); // Update card to remove blocker visual
                console.log(`Successfully assigned ${workerId} to unblock ${storyId}`);
            } else {
                console.error(`Failed to assign ${workerId} to unblock ${storyId}`);
                select.value = ''; // Reset dropdown on failure
                // Alert/message handled within GameState function
            }
        }
    });

    // --- Process Reassignments Second ---
    const reassignmentSelects = DAILY_SCRUM_MODAL.querySelectorAll('#reassignment-list select');
    reassignmentSelects.forEach(select => {
        const storyId = select.dataset.storyId;
        const newWorkerId = select.value;
        const story = GameState.getStory(storyId); // Get current story state

        // Skip stories that are still blocked (weren't unblocked above)
        if (!story || story.isBlocked) {
             console.log(`Skipping reassignment for ${storyId}: Story is blocked.`);
             return;
        }
         // Skip if trying to assign a worker who just got assigned to unblock
         if (newWorkerId && GameState.getWorkerById(newWorkerId)?.isUnblocking) {
              console.log(`Skipping reassignment for ${storyId}: Target worker ${newWorkerId} is assigned to unblock.`);
              select.value = story.assignedWorker || ''; // Reset dropdown
              return;
         }

        const initialWorkerId = story.assignedWorker;

        if (newWorkerId === initialWorkerId) return; // No change

        if (newWorkerId === '') { // Unassign
            if (initialWorkerId) {
                console.log(`Reassign: Unassigning ${initialWorkerId} from ${storyId}`);
                GameState.unassignWorkerFromStory(storyId); // Handles state update & triggers status/WIP update
                changesMade++;
            }
        } else { // Assign new worker
            console.log(`Reassign: Attempting assignment of ${newWorkerId} to ${storyId} (was ${initialWorkerId || 'None'})`);
            // GameState.assignWorkerToStory handles WIP checks and alerts
            const success = GameState.assignWorkerToStory(newWorkerId, storyId);
            if (success) {
                // UI update (move card, wip) handled by status change in assignWorkerToStory
                changesMade++;
                 console.log(`Reassign: Successfully assigned ${newWorkerId} to ${storyId}`);
            } else {
                console.error(`Reassignment failed for story ${storyId} to worker ${newWorkerId} (likely WIP limit).`);
                 // Reset dropdown to initial state on failure
                 select.value = initialWorkerId || ''; // Reset to initial worker or empty
                 // Alert handled in GameState function
            }
        }
    });

    console.log(`${changesMade} reassignment/unblocking changes processed.`);
    UI.closeModal(DAILY_SCRUM_MODAL);
    UI.renderWorkers(GameState.getTeam()); // Update worker display (shows unblocking status, points used)
    UI.renderAllColumns(); // Re-render columns fully to reflect changes (blocker removed, assignments)
    // GameState.advanceDay(); // Move to Day 4 (Work Day 2) - Handled by simulation flow
    runWorkDaySimulation(2); // Run Day 2 work simulation (Occurs on Day state 4)
}


// --- Work Simulation ---
function runWorkDaySimulation(workDayNum) {
    const currentDayState = GameState.getCurrentDay(); // Should be 2 or 4
    // Advance day state *before* simulating work for that day
    GameState.advanceDay(); // Moves state to 2 or 4, handles point resets, aging etc.
    const phaseName = GameState.getPhaseName(currentDayState); // Get phase name *before* advancing
    console.log(`--- Simulating Work Progress for ${phaseName} (Day State: ${GameState.getCurrentDay()}) ---`);

    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName); // Display phase name
    UI.updateButtonVisibility(GameState.getCurrentDay()); // Show Next Day / End Sprint button based on NEW day state

    simulateDayProgress(workDayNum);
}

function simulateDayProgress(workDayNum) {
    console.log(`--- Running Simulation for Work Day ${workDayNum} ---`);
    const workers = GameState.getTeam();
    const stories = GameState.getAllStories();
    let workDoneThisCycle = false;

    workers.forEach(worker => {
        // Skip workers busy unblocking or unavailable workers
        if (worker.isUnblocking || !worker.available) {
            // console.log(`Skipping worker ${worker.name}: ${worker.isUnblocking ? 'Unblocking' : 'Unavailable'}`);
            return;
        }

        if (worker.assignedStory) {
            const story = stories[worker.assignedStory];
            // Check if story exists, is in a workable state, and is NOT blocked
            if (story && (story.status === 'inprogress' || story.status === 'testing') && !story.isBlocked) {
                let pointsAvailable = GameState.getWorkerCurrentPoints(worker.id);
                if (pointsAvailable <= 0) {
                     // console.log(`Worker ${worker.name} has no points left.`);
                     return; // No points left
                }

                // Simple bonus for matching specialty (could be refined)
                const specialtyBonus = story.tags.includes(worker.area) ? 1 : 0;
                // Base points application capped by daily points left
                let pointsToApply = Math.min(worker.pointsPerDay + specialtyBonus, pointsAvailable);

                let workType = "Unknown";

                if (worker.area !== 'Testing' && story.status === 'inprogress') {
                    workType = "DEV";
                    pointsToApply = Math.min(pointsToApply, story.remainingEffort); // Cannot apply more than remaining
                } else if (worker.area === 'Testing' && story.status === 'testing') {
                    workType = "TEST";
                    pointsToApply = Math.min(pointsToApply, story.testingEffortRemaining); // Cannot apply more than remaining
                } else {
                    console.warn(`Work skip: ${worker.name}(${worker.area}) assigned to ${story.title}(${story.status}, Blocked: ${story.isBlocked}). No valid work type.`);
                    return; // Skip if role/status mismatch
                }

                pointsToApply = Math.max(0, pointsToApply); // Ensure non-negative

                if (pointsToApply > 0) {
                    console.log(`${workType}: Worker ${worker.name} (${worker.area}) working on ${story.title}. Available: ${pointsAvailable}, Applying: ${pointsToApply}`);
                    // Apply work and check if story is fully done (dev + test)
                    const isDone = GameState.applyWorkToStory(story.id, pointsToApply, worker.area);
                    GameState.useWorkerPoints(worker.id, pointsToApply);
                    UI.updateCard(story.id, GameState.getStory(story.id)); // Update card visuals (progress)
                    workDoneThisCycle = true;

                    const updatedStory = GameState.getStory(story.id); // Get state after work applied

                    // Check story status *after* applying work
                    if (isDone) { // isDone is true only when TEST work completes
                        console.log(`${story.title} is fully DONE by ${worker.name}`);
                        // UI move is handled by markStoryAsDone -> updateStoryStatus -> moveCardToColumn
                        // Worker is unassigned automatically in markStoryAsDone->unassignWorkerFromStory
                    } else if (updatedStory.status === 'testing' && workType === 'DEV') { // Check if DEV work just finished
                         console.log(`DEV work complete for ${story.title}, moved to Testing column.`);
                         // UI move is handled by applyWorkToStory -> updateStoryStatus -> moveCardToColumn
                         // Worker is unassigned automatically in applyWorkToStory->unassignWorkerFromStory
                    }
                    // If work was done but story not finished/moved, the card is updated, worker points used.
                }
            } else if (story && story.isBlocked) {
                console.log(`Worker ${worker.name} cannot work on ${story.title} (Blocked).`);
                 // Worker remains assigned but does no work. UI reflects this via renderWorkers.
            } else if (!story) {
                console.error(`Worker ${worker.name} assigned to non-existent story ${worker.assignedStory}`);
                 // Attempt to unassign worker if story is missing
                 GameState.unassignWorkerFromStory(worker.assignedStory); // Use story ID stored on worker
            } else {
                // console.log(`Worker ${worker.name} assigned to ${story.title} but status is ${story.status}. No work done.`);
            }
        } // End if worker.assignedStory
    }); // End forEach worker

    if (!workDoneThisCycle) { console.log("No work progress made this cycle."); }

    console.log("--- End Day Simulation ---");
    UI.renderWorkers(GameState.getTeam()); // Update worker display after all work
    UI.renderAllColumns(); // Update columns to show aging, progress etc.
    // UI.updateWipDisplays(); // Called by renderAllColumns -> renderStoryList
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
        // Potentially reset or show error
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
    const avgCycleTime = GameState.calculateAverageCycleTime(); // Calculate cycle time

    // Sponsor Feedback
    let feedback = "The sponsor observes the progress. ";
    if (velocity === 0 && GameState.getSprintBacklog().length > 0) { // Only disappointed if work was committed
        feedback += "They seem disappointed that nothing was finished this Sprint.";
    } else if (velocity > 0 && value > 10) { // High value delivered
         feedback += "They are very pleased with the high-value features delivered!";
    } else if (velocity > 0 && velocity < GameState.getTeamCapacity() / 4) { // Low velocity relative to capacity
         feedback += "They acknowledge the completed work, but note that progress seems a bit slow.";
    } else if (velocity > 0) { // Reasonable progress
         feedback += "They acknowledge the completed work.";
    } else {
         feedback += "No stories were committed or completed this Sprint.";
    }

    // Add comment based on Cycle Time
    if (avgCycleTime !== null) {
        if (avgCycleTime > 3.0) { // Example threshold for slow cycle time
            feedback += ` They also comment that items seem to be taking a while to get through the process (Avg Cycle Time: ${avgCycleTime} days). Consider how to improve flow.`;
        } else if (avgCycleTime < 1.5) {
             feedback += ` The team is delivering features quickly (Avg Cycle Time: ${avgCycleTime} days)!`;
        } else {
            feedback += ` Flow seems steady (Avg Cycle Time: ${avgCycleTime} days).`;
        }
    } else if (velocity > 0) {
         feedback += " (Could not calculate average cycle time for completed items).";
    }

    // DoD Progress Feedback
    let dodProgressFeedback = "";
    const chosenDoD = GameState.getChosenDoD();
    if (chosenDoD) {
        const definition = GameState.getDodDefinition(chosenDoD);
        const allCompletedIds = new Set(GameState.getCompletedStories().map(s => s.id)); // Check all completed so far
        const requiredIds = definition.requiredStoryIds;
        const completedRequired = requiredIds.filter(id => allCompletedIds.has(id)).length;
        const totalRequired = requiredIds.length;
        dodProgressFeedback = `Progress towards '${definition.name}' goal: ${completedRequired} of ${totalRequired} required stories completed across all sprints.`;
        if (sprintNum < 3 && completedRequired < totalRequired / 2) {
             dodProgressFeedback += " Keep focused on the goal!";
        } else if (sprintNum < 3 && completedRequired >= totalRequired / 2) {
             dodProgressFeedback += " Good progress towards the goal!";
        } else if (sprintNum === 3 && completedRequired < totalRequired) {
             dodProgressFeedback += " Final sprint results - check the final book for DoD status!";
        } else if (sprintNum === 3 && completedRequired >= totalRequired) {
             dodProgressFeedback += " Looks like the goal might be met!";
        }
    }


    UI.populateSprintReviewModal(sprintNum, completed, velocity, value, avgCycleTime, feedback, dodProgressFeedback);
    // Modal is shown within populate function
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


// --- Obstacle Generation ---
function generateRandomObstacle() {
    const chance = 0.35; // Increased chance slightly more
    if (Math.random() > chance) return null;

    const obstacleTypes = [
        { type: 'capacity_reduction', pointsLost: 1, shortMessage: "Distracted", message: "got distracted by project discussions and loses 1 point capacity today.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 2, shortMessage: "Meeting", message: "was pulled into an urgent meeting, losing 2 points capacity.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 99, shortMessage: "Sick Day", message: "is unexpectedly sick today and unavailable.", makesUnavailable: true },
        // Increased chance/impact of blockers
        { type: 'blocker', message: "needs urgent clarification on requirements, blocking progress!" },
        { type: 'blocker', message: "found a technical issue requiring senior input, blocking progress!" },
        { type: 'blocker', message: "dependency on another story not yet done is blocking progress!" }, // Dependency blocker
    ];

    const chosenObstacle = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    // Target worker/story logic
    let potentialTargets = [];
    if (chosenObstacle.type === 'capacity_reduction') {
        // Capacity reduction can hit anyone *currently available* at the start of the phase
        potentialTargets = GameState.getTeam().filter(w => w.available && !w.isUnblocking);
        if (potentialTargets.length === 0) {
            console.log("Obstacle Generation: No available workers to target for capacity reduction.");
            return null;
        }
        const targetWorker = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
        const actualPointsLost = Math.min(chosenObstacle.pointsLost, targetWorker.pointsPerDay); // Cannot lose more than base points
        return { ...chosenObstacle, pointsLost: actualPointsLost, targetWorkerId: targetWorker.id, message: `${targetWorker.name} ${chosenObstacle.message}` };

    } else if (chosenObstacle.type === 'blocker') {
         // Blocker should target a story being worked on (dev or test) that isn't *already* blocked
         const activeStories = Object.values(GameState.getAllStories()).filter(s => (s.status === 'inprogress' || s.status === 'testing') && !s.isBlocked && s.assignedWorker);
         if (activeStories.length > 0) {
             const targetStory = activeStories[Math.floor(Math.random() * activeStories.length)];
             const targetWorker = GameState.getWorkerById(targetStory.assignedWorker); // Blocker is associated with the worker on the task
             if (targetWorker) {
                  // Ensure worker exists
                  // No need to check worker availability here, blocker applies to the story regardless
                  return { ...chosenObstacle, targetWorkerId: targetWorker.id, targetStoryId: targetStory.id, message: `${targetWorker.name} reports that ${chosenObstacle.message.replace('progress', `progress on '${targetStory.title}'`)}` };
             } else {
                  console.log(`Obstacle Generation: Blocker targets story ${targetStory.id} but cannot find assigned worker ${targetStory.assignedWorker}. Blocker not applied.`);
                  return null;
             }
         } else {
             console.log("Obstacle Generation: No active, unblocked stories with assigned workers to target for blocker.");
             return null; // Cannot apply blocker if no suitable target
         }
    }
    return null; // Should not be reached
}