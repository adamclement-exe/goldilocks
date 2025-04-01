import * as GameState from './gameState.js';
import * as UI from './ui.js';

// --- Modal References ---
const DOD_CHOICE_MODAL = document.getElementById('dod-choice-modal');
const PLANNING_MODAL = document.getElementById('sprint-planning-modal');
const ASSIGNMENT_MODAL = document.getElementById('worker-assignment-modal');
const DAILY_SCRUM_MODAL = document.getElementById('daily-scrum-modal'); // Now used for Reassignment Day 2
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
    GameState.calculateTeamCapacity();
    const capacity = GameState.getTeamCapacity();
    UI.updateSprintInfo(sprintNum, capacity, 'Planning');
    UI.renderAllColumns(); // Ensure columns are fresh
    UI.populateSprintPlanningModal(
        GameState.getProductBacklog(),
        GameState.getSprintBacklog().map(s => s.id),
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
            const checkbox = document.getElementById(`plan-select-${storyId}`);
            if (checkbox && checkbox.checked && !GameState.getSprintBacklog().find(s => s.id === storyId)) {
                 if(GameState.addStoryToSprint(storyId)) { UI.moveCardToColumn(storyId, 'ready'); }
                 else { checkbox.checked = false; }
            }
            UI.updateCard(storyId, GameState.getStory(storyId));
            UI.updateSprintPlanningUI();
        } else { console.error("Selected choice index is invalid."); }
    } else { console.error("Could not find story ID or selected choice index."); }
}

export function commitToSprint() {
    const selectedStories = GameState.getSprintBacklog();
    if (selectedStories.length === 0) { alert("Please select at least one story for the Sprint."); return; }
    const selectedPoints = selectedStories.reduce((sum, story) => sum + (story?.chosenImplementation ? story.chosenImplementation.effort : story?.baseEffort || 0), 0);
    const capacity = GameState.getTeamCapacity();
     if (selectedPoints > capacity) {
        if (!confirm(`Warning: Selected points (${selectedPoints}) exceed capacity (${capacity}). Continue anyway?`)) { return; }
    }
    console.log("Committing to Sprint Backlog:", selectedStories.map(s => s?.title || 'Unknown Story'));
    UI.closeModal(PLANNING_MODAL);
    GameState.advanceDay(); // Move to Day 1 (Assignment Phase)
    startWorkerAssignmentPhase();
}

// --- Assignment Phase (Day 1) ---
function startWorkerAssignmentPhase() {
    const currentDay = GameState.getCurrentDay(); // Should be 1
    const phaseName = GameState.getPhaseName(currentDay);
    console.log(`Starting Worker Assignment Phase (Day ${currentDay})`);
    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDay);
    const storiesToAssign = GameState.getSprintBacklog().filter(s => s?.status === 'ready');
    const availableWorkers = GameState.getAvailableWorkers();
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
            const success = GameState.assignWorkerToStory(workerId, storyId);
            if (success) { UI.moveCardToColumn(storyId, 'inprogress'); assignmentsMade++; }
        } else {
             const story = GameState.getStory(storyId);
             if (story && story.status === 'ready') { console.log(`Story ${storyId} (${story.title}) left unassigned for Day 1.`); }
        }
    });
    console.log(`${assignmentsMade} Day 1 assignments confirmed.`);
    UI.closeModal(ASSIGNMENT_MODAL);
    UI.renderWorkers(GameState.getTeam());
    GameState.advanceDay(); // Move to Day 2 (Work Day 1)
    runWorkDaySimulation(1); // Run Day 1 work simulation
}


// --- Daily Scrum & Reassignment Phase (Day 2) ---
function startDailyScrumAndReassignment() {
    const currentDayState = GameState.getCurrentDay(); // Should be 3
    const currentWorkDayDisplay = 2;
    const phaseName = GameState.getPhaseName(currentDayState);
    console.log(`Starting ${phaseName}`);
    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDayState);

    // Apply Random Obstacle for Day 2
    const obstacle = generateRandomObstacle();
    if (obstacle) { GameState.addObstacle(obstacle); console.log("Obstacle generated for Day 2:", obstacle.message); UI.renderWorkers(GameState.getTeam()); }
    else { UI.renderWorkers(GameState.getTeam()); }

    const storiesInProgressOrTesting = Object.values(GameState.getAllStories())
        .filter(s => s.status === 'inprogress' || s.status === 'testing');

    UI.populateDailyScrumModal( currentWorkDayDisplay, GameState.getTeam(), GameState.getActiveObstacles(), storiesInProgressOrTesting );
    UI.showModal(DAILY_SCRUM_MODAL);
    // User clicks "Confirm Assignments & Start Day 2 Work" -> confirmReassignments
}

export function confirmReassignments() {
    console.log("Confirming Day 2 reassignments...");
    const reassignmentSelects = DAILY_SCRUM_MODAL.querySelectorAll('#reassignment-list select');
    let changesMade = 0;
    reassignmentSelects.forEach(select => {
        const storyId = select.dataset.storyId;
        const newWorkerId = select.value;
        const story = GameState.getStory(storyId);
        if (!story) return;
        const initialWorkerId = story.assignedWorker;
        if (newWorkerId === initialWorkerId) return; // No change
        if (newWorkerId === '') { // Unassign
            if (initialWorkerId) {
                console.log(`Reassign: Unassigning ${initialWorkerId} from ${storyId}`);
                GameState.unassignWorkerFromStory(storyId);
                const updatedStory = GameState.getStory(storyId); // Check status *after* unassigning
                UI.moveCardToColumn(storyId, updatedStory.status); // Move to ready or testing
                changesMade++;
            }
        } else { // Assign new worker
            console.log(`Reassign: Assigning ${newWorkerId} to ${storyId} (was ${initialWorkerId || 'None'})`);
            const success = GameState.assignWorkerToStory(newWorkerId, storyId);
            if (success) {
                const updatedStory = GameState.getStory(storyId);
                UI.moveCardToColumn(storyId, updatedStory.status);
                changesMade++;
            } else { console.error(`Reassignment failed for story ${storyId} to worker ${newWorkerId}`); }
        }
    });
    console.log(`${changesMade} reassignment changes processed.`);
    UI.closeModal(DAILY_SCRUM_MODAL);
    UI.renderWorkers(GameState.getTeam());
    UI.renderAllColumns(); // Re-render columns fully
    GameState.advanceDay(); // Move to Day 4 (Work Day 2)
    runWorkDaySimulation(2); // Run Day 2 work simulation
}


// --- Work Simulation ---
function runWorkDaySimulation(workDay) {
    const currentDayState = GameState.getCurrentDay(); // Should be 2 or 4
    const phaseName = GameState.getPhaseName(currentDayState);
    console.log(`--- Simulating Work Progress for ${phaseName} ---`);
    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(currentDayState); // Show Next Day / End Sprint button
    simulateDayProgress(workDay);
}

function simulateDayProgress(workDay) {
    console.log(`--- Running Simulation for Work Day ${workDay} ---`);
    const workers = GameState.getTeam();
    const stories = GameState.getAllStories();
    let workDoneThisCycle = false;
    workers.forEach(worker => {
        if (worker.assignedStory && worker.available) {
            const story = stories[worker.assignedStory];
            if (story && (story.status === 'inprogress' || story.status === 'testing') && !story.isBlocked) {
                let pointsAvailable = GameState.getWorkerCurrentPoints(worker.id);
                if (pointsAvailable <= 0) return;
                const specialtyBonus = story.tags.includes(worker.area) ? 1 : 0;
                let basePointsToApply = worker.pointsPerDay;
                let potentialPoints = basePointsToApply + specialtyBonus;
                let pointsToApply = pointsAvailable;
                let workType = "Unknown";
                if (worker.area !== 'Testing' && story.status === 'inprogress') {
                    workType = "DEV"; pointsToApply = Math.min(pointsToApply, story.remainingEffort);
                } else if (worker.area === 'Testing' && story.status === 'testing') {
                    workType = "TEST"; pointsToApply = Math.min(pointsToApply, story.testingEffortRemaining);
                } else { console.warn(`Work skip: ${worker.name}(${worker.area}) assigned to ${story.title}(${story.status})`); return; }
                pointsToApply = Math.min(pointsToApply, potentialPoints);
                pointsToApply = Math.max(0, pointsToApply);
                if (pointsToApply > 0) {
                    console.log(`${workType}: Worker ${worker.name} (${worker.area}) working on ${story.title}. Available: ${pointsAvailable}, Base: ${basePointsToApply}, Bonus: ${specialtyBonus}, Applying: ${pointsToApply}`);
                    const isDone = GameState.applyWorkToStory(story.id, pointsToApply, worker.area);
                    GameState.useWorkerPoints(worker.id, pointsToApply);
                    UI.updateCard(story.id, GameState.getStory(story.id));
                    workDoneThisCycle = true;
                    const updatedStory = GameState.getStory(story.id);
                    if (isDone) {
                        console.log(`${story.title} is fully DONE by ${worker.name}`);
                        UI.moveCardToColumn(story.id, 'done');
                        UI.renderWorkers(GameState.getTeam()); // Worker is free
                    } else if (updatedStory.status === 'testing' && workType === 'DEV') {
                         console.log(`DEV work complete for ${story.title}, moved to Testing column.`);
                         UI.moveCardToColumn(story.id, 'testing');
                         UI.renderWorkers(GameState.getTeam()); // Dev worker is free
                    }
                }
            } else if (story && story.isBlocked) { console.log(`Worker ${worker.name} cannot work on ${story.title} (Blocked).`); }
        }
    });
    if (!workDoneThisCycle) { console.log("No work could be done this cycle."); }
    console.log("--- End Day Simulation ---");
    UI.renderWorkers(GameState.getTeam());
}


// Called by Next Day / End Sprint button - UPDATED Day numbers
export function handleDayEnd() {
    const currentDayState = GameState.getCurrentDay(); // 2 (End of Day 1 Work) or 4 (End of Day 2 Work)
    if (currentDayState === 2) { // End of Day 1 Work
        GameState.advanceDay(); // Move to Day 3 (Reassignment Day 2)
        startDailyScrumAndReassignment();
    } else if (currentDayState === 4) { // End of Day 2 Work
        GameState.advanceDay(); // Move to Day 5 (Review)
        endSprintWork();
    } else { console.error(`handleDayEnd called unexpectedly in state ${currentDayState}`); }
}

// --- Review, Retro, Next Sprint, Final Book ---

function endSprintWork() {
    const sprintNum = GameState.getCurrentSprintNumber();
    console.log(`Ending Sprint ${sprintNum} Work Phase`);
    const phaseName = GameState.getPhaseName(GameState.getCurrentDay());
    UI.updateSprintInfo(sprintNum, GameState.getTeamCapacity(), phaseName);
    UI.updateButtonVisibility(GameState.getCurrentDay());
    startSprintReview();
}

function startSprintReview() {
    console.log("Starting Sprint Review");
    const sprintNum = GameState.getCurrentSprintNumber();
    const completed = GameState.getCurrentSprintCompletedStories();
    const velocity = completed.reduce((sum, story) => sum + (story?.baseEffort || 0), 0);
    const value = completed.reduce((sum, story) => sum + (story?.value || 0), 0);
    let feedback = "The sponsor observes the progress. ";
    if (velocity === 0) { feedback += "They seem disappointed that nothing was finished."; }
    else if (value > 10) { feedback += "They are very pleased with the high-value features delivered!"; }
    else if (velocity < GameState.getTeamCapacity() / 4) { feedback += "They note that progress seems a bit slow."; }
    else { feedback += "They acknowledge the completed work."; }
    UI.populateSprintReviewModal(sprintNum, completed, velocity, value, feedback);
}

export function startRetrospective() {
    console.log("Starting Sprint Retrospective");
    UI.closeModal(REVIEW_MODAL);
    UI.populateRetrospectiveModal(GameState.getCurrentSprintNumber());
}

export function startNextSprint() {
    console.log("Preparing for next Sprint...");
    GameState.startNewSprint();
    startSprintPlanning();
}

export function showFinalStorybook() {
     console.log("Checking DoD and Showing Final Storybook");
     UI.closeModal(RETRO_MODAL);
     GameState.checkDoDMet();
     const allCompleted = GameState.getCompletedStories();
     UI.populateFinalStorybook(allCompleted);
}


// --- Obstacle Generation ---
function generateRandomObstacle() {
    const chance = 0.25;
    if (Math.random() > chance) return null;
    const obstacleTypes = [
        { type: 'capacity_reduction', pointsLost: 1, shortMessage: "Distracted", message: "got distracted by project discussions and loses 1 point capacity today.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 2, shortMessage: "Meeting", message: "was pulled into an urgent meeting, losing 2 points capacity.", makesUnavailable: false },
        { type: 'capacity_reduction', pointsLost: 99, shortMessage: "Sick Day", message: "is unexpectedly sick today and unavailable.", makesUnavailable: true },
        { type: 'blocker', message: "needs urgent clarification on requirements, blocking progress on their current task!" },
    ];
    const chosenObstacle = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    let potentialTargets = GameState.getTeam().filter(w => w.available && w.assignedStory);
    if (potentialTargets.length === 0) { potentialTargets = GameState.getTeam().filter(w => w.available); }
    if (potentialTargets.length === 0) return null;
    const targetWorker = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];

    if (chosenObstacle.type === 'capacity_reduction') {
        const actualPointsLost = Math.min(chosenObstacle.pointsLost, targetWorker.pointsPerDay);
        return { ...chosenObstacle, pointsLost: actualPointsLost, targetWorkerId: targetWorker.id, message: `${targetWorker.name} ${chosenObstacle.message}` };
    } else if (chosenObstacle.type === 'blocker') {
         const assignedStoryId = targetWorker.assignedStory;
         if (assignedStoryId) {
             const story = GameState.getStory(assignedStoryId);
             if (story && (story.status === 'inprogress' || story.status === 'testing') && !story.isBlocked) {
                 return { ...chosenObstacle, targetWorkerId: targetWorker.id, targetStoryId: story.id, message: `${targetWorker.name} ${chosenObstacle.message.replace('their current task', `'${story.title}'`)}` };
             }
         }
         console.log(`Could not apply blocker obstacle to ${targetWorker.name}, no suitable task.`);
         return null;
    }
    return null;
}