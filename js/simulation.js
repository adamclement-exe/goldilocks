import * as GameState from './gameState.js';
import * as UI from './ui.js';

// --- Modal References ---
const PLANNING_MODAL = document.getElementById('sprint-planning-modal');
const ASSIGNMENT_MODAL = document.getElementById('worker-assignment-modal');
const DAILY_SCRUM_MODAL = document.getElementById('daily-scrum-modal');
const PROCEDURAL_CHOICE_MODAL = document.getElementById('procedural-choice-modal');
const REVIEW_MODAL = document.getElementById('sprint-review-modal');
const RETRO_MODAL = document.getElementById('sprint-retrospective-modal');


// --- Sprint Lifecycle Functions ---

export function startSprintPlanning() {
    const sprintNum = GameState.getCurrentSprintNumber();
    console.log(`Starting Planning for Sprint ${sprintNum}`);
    GameState.calculateTeamCapacity(); // Ensure capacity is up-to-date
    const capacity = GameState.getTeamCapacity();
    UI.updateSprintInfo(sprintNum, capacity, 'Planning');

    // Render columns based on current state before showing modal
    UI.renderAllColumns(); // Use helper to ensure all columns are fresh

    UI.populateSprintPlanningModal(
        GameState.getProductBacklog(),
        GameState.getSprintBacklog().map(s => s.id), // Pass IDs of already selected items
        capacity
    );
    UI.showModal(PLANNING_MODAL);
    UI.updateButtonVisibility(0); // Planning state (hides main button)
}

// Called when user clicks "Confirm Choice" in the procedural modal
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

            // If the story's checkbox is checked in planning modal, ensure it's added to state & moved
            const checkbox = document.getElementById(`plan-select-${storyId}`);
            if (checkbox && checkbox.checked && !GameState.getSprintBacklog().find(s => s.id === storyId)) {
                 if(GameState.addStoryToSprint(storyId)) {
                     UI.moveCardToColumn(storyId, 'ready');
                 } else {
                     console.error(`Failed to add story ${storyId} to sprint after procedural choice.`);
                     // Maybe uncheck the box?
                     checkbox.checked = false;
                 }
            }
            // Update the card display (effort might have changed)
            UI.updateCard(storyId, GameState.getStory(storyId));
            UI.updateSprintPlanningUI(); // Update total points display
        } else {
            console.error("Selected choice index is invalid.");
        }
    } else {
        console.error("Could not find story ID or selected choice index.");
    }
}


// Called by "Commit to Sprint" button in Planning Modal
export function commitToSprint() {
    const selectedStories = GameState.getSprintBacklog();
    if (selectedStories.length === 0) {
        alert("Please select at least one story for the Sprint.");
        return;
    }
    // Capacity warning (optional, as user selected manually)
    const selectedPoints = selectedStories.reduce((sum, story) => sum + (story?.chosenImplementation ? story.chosenImplementation.effort : story?.baseEffort || 0), 0);
    const capacity = GameState.getTeamCapacity();
     if (selectedPoints > capacity) {
        if (!confirm(`Warning: Selected points (${selectedPoints}) exceed capacity (${capacity}). Continue anyway?`)) {
            return;
        }
    }

    console.log("Committing to Sprint Backlog:", selectedStories.map(s => s?.title || 'Unknown Story'));
    UI.closeModal(PLANNING_MODAL);
    GameState.advanceDay(); // Move to Day 1 (Assignment Phase)
    startWorkerAssignmentPhase();
}

// --- NEW PHASE ---
function startWorkerAssignmentPhase() {
    const currentDay = GameState.getCurrentDay(); // Should be 1
    const phaseName = GameState.getPhaseName(currentDay);
    console.log(`Starting Worker Assignment Phase (Day ${currentDay})`);
    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDay); // Update main button state

    const storiesToAssign = GameState.getSprintBacklog().filter(s => s?.status === 'ready'); // Filter for ready status
    const availableWorkers = GameState.getAvailableWorkers();

    UI.populateWorkerAssignmentModal(storiesToAssign, availableWorkers);
    UI.showModal(ASSIGNMENT_MODAL);
}

// Called by "Confirm Assignments" button in Assignment Modal
export function confirmWorkerAssignments() {
    console.log("Confirming worker assignments...");
    const assignmentSelects = ASSIGNMENT_MODAL.querySelectorAll('#assignment-list select');
    let assignmentsMade = 0;

    assignmentSelects.forEach(select => {
        const storyId = select.dataset.storyId;
        const workerId = select.value;

        if (workerId) { // If a worker was selected
            const success = GameState.assignWorkerToStory(workerId, storyId);
            if (success) {
                UI.moveCardToColumn(storyId, 'inprogress'); // <<< MOVE UI CARD
                assignmentsMade++;
            } else {
                // Error already logged in gameState
                // Potentially provide feedback to user?
            }
        } else {
            // Story left unassigned
            const story = GameState.getStory(storyId);
             if (story && story.status === 'ready') { // Ensure it's still ready
                 console.log(`Story ${storyId} (${story.title}) left unassigned.`);
             }
        }
    });

    console.log(`${assignmentsMade} assignments confirmed.`);
    UI.closeModal(ASSIGNMENT_MODAL);
    UI.renderWorkers(GameState.getTeam()); // Update worker display with assignments

    // Proceed to the first day of work
    GameState.advanceDay(); // Move to Day 2 (Work Day 1)
    startDailyScrum();
}


// Now called at the start of Day 1 (state day 2) and Day 2 (state day 3) work phases
function startDailyScrum() {
    const currentDayState = GameState.getCurrentDay(); // Should be 2 or 3
    const currentWorkDay = currentDayState - 1; // Display as 1 or 2
    const phaseName = GameState.getPhaseName(currentDayState);
    console.log(`Starting Daily Scrum for ${phaseName}`);
    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDayState); // Show Next Day / End Sprint button

    // Apply Random Obstacle
    const obstacle = generateRandomObstacle();
    if (obstacle) {
        GameState.addObstacle(obstacle);
        console.log("Obstacle generated:", obstacle.message);
        UI.renderWorkers(GameState.getTeam()); // Reflect obstacle impact immediately
    } else {
        // No new obstacle, just ensure UI is up-to-date after potential obstacle expiry in advanceDay
        UI.renderWorkers(GameState.getTeam());
    }

    // Show simple daily scrum modal (mainly for obstacles)
    UI.populateDailyScrumModal(
        currentWorkDay, // Display as Day 1 or Day 2
        GameState.getTeam(),
        GameState.getActiveObstacles()
    );
    UI.showModal(DAILY_SCRUM_MODAL);
    // User clicks "Ok, Proceed with Work" (handled by main.js listener calling runWorkDaySimulation)
}

// Called by Proceed button in Daily Scrum Modal
export function runWorkDaySimulation() {
    UI.closeModal(DAILY_SCRUM_MODAL);
    simulateDayProgress();
}


// Simulates work progress for the current day
function simulateDayProgress() {
    const currentWorkDay = GameState.getCurrentDay() - 1; // 1 or 2
    console.log(`--- Simulating Work Progress for Day ${currentWorkDay} ---`);
    const workers = GameState.getTeam();
    const stories = GameState.getAllStories();
    let workDoneThisCycle = false;

    workers.forEach(worker => {
        if (worker.assignedStory && worker.available) {
            const story = stories[worker.assignedStory];
            // Double check story exists and is in progress and not blocked
            if (story && story.status === 'inprogress' && !story.isBlocked) {
                let pointsAvailable = GameState.getWorkerCurrentPoints(worker.id);
                if (pointsAvailable <= 0) return; // No points left for this worker

                // Specialty bonus (Simple Example: +1 point if area matches any tag)
                // More complex: check specific tags like 'Visual', 'Text' etc.
                const specialtyBonus = story.tags.includes(worker.area) ? 1 : 0;
                let basePointsToApply = worker.pointsPerDay; // Use worker's base rate

                // Calculate effective points considering bonus, but cap at points available and effort remaining
                let potentialPoints = basePointsToApply + specialtyBonus;
                let pointsToApply = Math.min(potentialPoints, pointsAvailable); // Cap at daily points left
                pointsToApply = Math.min(pointsToApply, story.remainingEffort); // Cap at effort remaining

                console.log(`Worker ${worker.name} (${worker.area}) working on ${story.title}. Available: ${pointsAvailable}, Base: ${basePointsToApply}, Bonus: ${specialtyBonus}, Applying: ${pointsToApply}`);

                if (pointsToApply > 0) {
                    const completed = GameState.applyWorkToStory(story.id, pointsToApply);
                    GameState.useWorkerPoints(worker.id, pointsToApply); // Deduct points used
                    UI.updateCard(story.id, GameState.getStory(story.id)); // Update card progress/status
                    workDoneThisCycle = true;

                    if (completed) {
                        console.log(`${story.title} completed by ${worker.name}`);
                        UI.moveCardToColumn(story.id, 'done'); // <<< MOVE UI CARD
                        // Worker is now free, update UI immediately
                        // Note: GameState.applyWorkToStory already unassigns worker state-wise
                        UI.renderWorkers(GameState.getTeam());
                    }
                }
            } else if (story && story.isBlocked) {
                 console.log(`Worker ${worker.name} cannot work on ${story.title} (Blocked).`);
            } else if (story && story.status !== 'inprogress') {
                 console.log(`Worker ${worker.name} assigned to ${story.title}, but status is ${story.status}. Skipping work.`);
                 // This might indicate a state inconsistency, potentially unassign worker?
                 // GameState.unassignWorkerFromStory(story.id);
            }
        }
    });

    if (!workDoneThisCycle) { console.log("No work could be done this cycle."); }
    console.log("--- End Day Simulation ---");
    // Update worker UI to show points spent / final status for the day
    UI.renderWorkers(GameState.getTeam());
    // Button visibility (Next Day / End Sprint) should already be set by startDailyScrum
}


// Called by Next Day / End Sprint button
export function handleDayEnd() {
    const currentDayState = GameState.getCurrentDay(); // 2 (End of Day 1) or 3 (End of Day 2)

    if (currentDayState === 2) { // If it was Day 1's work phase
        GameState.advanceDay(); // Move to Day 3 (Work Day 2)
        startDailyScrum();
    } else if (currentDayState === 3) { // If it was Day 2's work phase
        GameState.advanceDay(); // Move to Day 4 (Review)
        endSprintWork();
    } else {
        console.error(`handleDayEnd called unexpectedly in state ${currentDayState}`);
    }
}

// --- Review, Retro, Next Sprint, Final Book ---

function endSprintWork() {
    const sprintNum = GameState.getCurrentSprintNumber();
    console.log(`Ending Sprint ${sprintNum} Work Phase`);
    const phaseName = GameState.getPhaseName(GameState.getCurrentDay()); // Should be Review & Retro
    UI.updateSprintInfo(sprintNum, GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(GameState.getCurrentDay()); // Hide main button
    startSprintReview();
}

function startSprintReview() {
    console.log("Starting Sprint Review");
    const sprintNum = GameState.getCurrentSprintNumber();
    const completed = GameState.getCurrentSprintCompletedStories();
    const velocity = completed.reduce((sum, story) => sum + (story?.baseEffort || 0), 0);
    const value = completed.reduce((sum, story) => sum + (story?.value || 0), 0);

    // Simple sponsor feedback logic
    let feedback = "The sponsor observes the progress. ";
    if (velocity === 0) {
        feedback += "They seem disappointed that nothing was finished.";
    } else if (value > 15) { // Adjusted threshold for more workers/potential value
        feedback += "They are very pleased with the high-value features delivered!";
    } else if (velocity < GameState.getTeamCapacity() / 3) { // Lower threshold due to more workers
        feedback += "They note that progress seems a bit slow.";
    } else {
        feedback += "They acknowledge the completed work.";
    }
    // TODO: Add feedback based on specific story completion if desired (e.g., cover page)

    UI.populateSprintReviewModal(
        sprintNum,
        completed,
        velocity,
        value,
        feedback
    );
    // User clicks button in modal to proceed to Retro
}

export function startRetrospective() {
    console.log("Starting Sprint Retrospective");
    UI.closeModal(REVIEW_MODAL);
    UI.populateRetrospectiveModal(GameState.getCurrentSprintNumber());
    // User submits form or clicks End Game button (handled by main.js)
}

export function startNextSprint() {
    console.log("Preparing for next Sprint...");
    GameState.startNewSprint();
    // Potentially apply retro changes here from GameState.retrospectiveNotes
    startSprintPlanning(); // Go back to planning
}

export function showFinalStorybook() {
     console.log("Showing Final Storybook");
     UI.closeModal(RETRO_MODAL); // Close retro if open
     const allCompleted = GameState.getCompletedStories();
     UI.populateFinalStorybook(allCompleted);
}


// --- Obstacle Generation ---
function generateRandomObstacle() {
    const chance = 0.25; // 25% chance of an obstacle each work day
    if (Math.random() > chance) return null;

    const obstacleTypes = [
        { type: 'capacity_reduction', pointsLost: 2, shortMessage: "Distracted", message: "got distracted by project discussions and loses 2 points capacity today.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 3, shortMessage: "Meeting", message: "was pulled into an urgent meeting, losing 3 points capacity.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 99, shortMessage: "Sick Day", message: "is unexpectedly sick today and unavailable.", makesUnavailable: true },
        { type: 'blocker', message: "needs urgent clarification on requirements, blocking progress on their current task!" },
    ];

    const chosenObstacle = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const availableWorkers = GameState.getTeam().filter(w => w.available); // Consider all potentially available workers
    if (availableWorkers.length === 0) return null; // No one available to have an obstacle

    const targetWorker = availableWorkers[Math.floor(Math.random() * availableWorkers.length)];

    if (chosenObstacle.type === 'capacity_reduction') {
        return {
            ...chosenObstacle,
            targetWorkerId: targetWorker.id,
            message: `${targetWorker.name} ${chosenObstacle.message}` // Personalize message
        };
    } else if (chosenObstacle.type === 'blocker') {
         // Find a story the target worker is *currently assigned to* and is in progress
         const assignedStoryId = targetWorker.assignedStory;
         if (assignedStoryId) {
             const story = GameState.getStory(assignedStoryId);
             if (story && story.status === 'inprogress' && !story.isBlocked) { // Check if already blocked
                 return {
                     ...chosenObstacle,
                     targetWorkerId: targetWorker.id, // Worker who needs clarification
                     targetStoryId: story.id,
                     message: `${targetWorker.name} ${chosenObstacle.message.replace('their current task', `'${story.title}'`)}`
                 };
             }
         }
         // If worker not assigned or story not suitable, maybe try another obstacle type or skip
         console.log(`Could not apply blocker obstacle to ${targetWorker.name}, no suitable task.`);
         return null;
    }

    return null;
}