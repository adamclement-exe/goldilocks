import * as GameState from './gameState.js';
import * as UI from './ui.js';
import * as Kanban from './kanban.js'; // Still needed for initialization
import * as Simulation from './simulation.js';
import { initialProductBacklog } from './stories.js'; // Import the data

// --- DOM Elements ---
const learningModal = document.getElementById('learning-modal');
const openLearningBtn = document.getElementById('open-learning-btn');
const planningModal = document.getElementById('sprint-planning-modal');
const commitSprintBtn = document.getElementById('commit-sprint-btn');
const assignmentModal = document.getElementById('worker-assignment-modal'); // Added
const confirmAssignmentsBtn = document.getElementById('confirm-assignments-btn'); // Added
const dailyScrumModal = document.getElementById('daily-scrum-modal');
const proceedDayBtn = document.getElementById('proceed-day-btn'); // Added (replaces start-day-btn)
const reviewModal = document.getElementById('sprint-review-modal');
const startRetroBtn = document.getElementById('start-retro-btn');
const retroModal = document.getElementById('sprint-retrospective-modal');
const retroForm = document.getElementById('retro-form');
const finalBookModal = document.getElementById('final-storybook-modal');
const playAgainBtn = document.getElementById('play-again-btn');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');
const nextDayBtn = document.getElementById('next-day-btn'); // Button for end of day 1 / day 2
const proceduralChoiceModal = document.getElementById('procedural-choice-modal');
const confirmChoiceBtn = document.getElementById('confirm-choice-btn');
const endGameBtn = document.getElementById('end-game-btn');


// --- Initialization ---
function initGame() {
    console.log("Initializing Game (Assignment Flow)...");
    GameState.loadInitialState(initialProductBacklog); // Load stories into state
    UI.renderProductBacklog(GameState.getProductBacklog()); // Render initial backlog
    // Clear other columns initially
    UI.renderSprintBacklog([]);
    UI.renderInProgress([]);
    UI.renderDone([]);
    UI.renderWorkers(GameState.getTeam());
    UI.updateSprintInfo(GameState.getCurrentSprintNumber(), GameState.getTeamCapacity(), 'Planning'); // Initial phase
    Kanban.initializeKanbanBoards(null); // Initialize (disable drag) - no callback needed
    setupEventListeners();

    // Start with Sprint Planning
    Simulation.startSprintPlanning();
}

// --- Event Listeners ---
function setupEventListeners() {
    openLearningBtn.addEventListener('click', () => UI.showModal(learningModal));
    commitSprintBtn.addEventListener('click', Simulation.commitToSprint);
    // NEW Assignment listener
    confirmAssignmentsBtn.addEventListener('click', Simulation.confirmWorkerAssignments);
    // REPLACED startDayBtn listener with proceedDayBtn
    proceedDayBtn.addEventListener('click', Simulation.runWorkDaySimulation); // Button in Daily Scrum modal
    startRetroBtn.addEventListener('click', Simulation.startRetrospective);
    retroForm.addEventListener('submit', handleRetroSubmit);
    playAgainBtn.addEventListener('click', () => {
        UI.closeModal(finalBookModal);
        initGame(); // Restart
    });
    nextDayBtn.addEventListener('click', Simulation.handleDayEnd); // Button for end of day 1 / day 2
    confirmChoiceBtn.addEventListener('click', Simulation.confirmProceduralChoice);
    endGameBtn.addEventListener('click', Simulation.showFinalStorybook);


    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('dialog');
            if (modal) UI.closeModal(modal);
        });
    });

    // Remove card click listeners if they were for manual assignment/drag
    // document.addEventListener('click', (event) => { ... }); // Removed
}

// --- Event Handlers ---
// handleCardMove is no longer needed as drag/drop is disabled for columns
// function handleCardMove(...) { ... }

function handleRetroSubmit(event) {
    event.preventDefault();
    const well = document.getElementById('retro-well').value;
    const improve = document.getElementById('retro-improve').value;
    const change = document.getElementById('retro-change').value;
    console.log("Retrospective:", { well, improve, change });
    GameState.recordRetrospective(well, improve, change);
    UI.closeModal(retroModal);

    if (GameState.getCurrentSprintNumber() < 3) {
        Simulation.startNextSprint();
    } else {
        // If retro was the last step, show final book
        Simulation.showFinalStorybook();
    }
}


// --- Game Start ---
document.addEventListener('DOMContentLoaded', initGame);