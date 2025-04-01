// --- START OF FILE main.js ---

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
const assignmentModal = document.getElementById('worker-assignment-modal');
const confirmAssignmentsBtn = document.getElementById('confirm-assignments-btn');
const dailyScrumModal = document.getElementById('daily-scrum-modal'); // Now used for Reassignment & Blockers
const confirmReassignmentsBtn = document.getElementById('confirm-reassignments-btn'); // Button in Daily Scrum Modal
const reviewModal = document.getElementById('sprint-review-modal');
const startRetroBtn = document.getElementById('start-retro-btn');
const retroModal = document.getElementById('sprint-retrospective-modal');
const retroForm = document.getElementById('retro-form');
const finalBookModal = document.getElementById('final-storybook-modal');
const playAgainBtn = document.getElementById('play-again-btn');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');
const nextDayBtn = document.getElementById('next-day-btn'); // Button for end of work days
const proceduralChoiceModal = document.getElementById('procedural-choice-modal');
const confirmChoiceBtn = document.getElementById('confirm-choice-btn');
const endGameBtn = document.getElementById('end-game-btn');
// --- DoD Refs ---
const dodChoiceModal = document.getElementById('dod-choice-modal');
const dodForm = document.getElementById('dod-form');
// --- Instructions Refs ---
const instructionsModal = document.getElementById('instructions-modal'); // New
const startGameFromInstructionsBtn = document.getElementById('start-game-from-instructions-btn'); // New


// --- Initialization ---
function initGame() {
    console.log("Initializing Game (Instructions & Multi-Assign)...");
    GameState.loadInitialState(initialProductBacklog); // Load state (resets DoD)
    UI.renderWorkers(GameState.getTeam()); // Render workers early
    Kanban.initializeKanbanBoards(null); // Initialize Kanban display (drag disabled)
    setupEventListeners();

    // --- Start Game with Instructions ---
    if (instructionsModal) {
        UI.showModal(instructionsModal); // Show instructions first
    } else {
        console.error("Instructions modal not found! Proceeding without instructions.");
        Simulation.startGameFlow(); // Fallback: Start with DoD choice if instructions modal is missing
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // ** New: Start Game from Instructions **
    if (startGameFromInstructionsBtn) {
        startGameFromInstructionsBtn.addEventListener('click', () => {
            UI.closeModal(instructionsModal);
            Simulation.startGameFlow(); // Proceed to DoD choice
        });
    }

    // DoD Form Submission
    dodForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission
        console.log(">>> DoD form submitted");
        Simulation.confirmDoDChoice();
    });

    // Other Buttons
    openLearningBtn.addEventListener('click', () => UI.showModal(learningModal));
    commitSprintBtn.addEventListener('click', Simulation.commitToSprint); // Planning Modal
    confirmAssignmentsBtn.addEventListener('click', Simulation.confirmWorkerAssignments); // Assignment Modal (Day 1)
    confirmReassignmentsBtn.addEventListener('click', Simulation.confirmReassignments); // Daily Scrum/Reassignment Modal (Day 2 + Blockers)
    startRetroBtn.addEventListener('click', Simulation.startRetrospective); // Review Modal
    retroForm.addEventListener('submit', handleRetroSubmit); // Retro Modal
    playAgainBtn.addEventListener('click', () => {
        UI.closeModal(finalBookModal);
        initGame(); // Restart
    });
    nextDayBtn.addEventListener('click', Simulation.handleDayEnd); // Main button for end of work days
    confirmChoiceBtn.addEventListener('click', Simulation.confirmProceduralChoice); // Procedural Choice Modal
    endGameBtn.addEventListener('click', Simulation.showFinalStorybook); // Retro Modal (End Game)

    // Close buttons for all modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('dialog');
            if (modal) UI.closeModal(modal);
        });
    });

    // Close instructions modal if clicking backdrop (optional, standard dialog behavior)
    if (instructionsModal) {
        instructionsModal.addEventListener('click', (event) => {
            if (event.target === instructionsModal) {
                // Optionally close or require button click
                 // UI.closeModal(instructionsModal);
            }
        });
    }


    console.log(">>> Event listeners setup complete.");
}

// --- Event Handlers ---
function handleRetroSubmit(event) {
    event.preventDefault();
    const well = document.getElementById('retro-well').value.trim();
    const improve = document.getElementById('retro-improve').value.trim();
    const change = document.getElementById('retro-change').value.trim();

    if (!well || !improve || !change) {
        alert("Please fill out all sections of the retrospective.");
        return;
    }

    console.log("Retrospective:", { well, improve, change });
    GameState.recordRetrospective(well, improve, change);
    UI.closeModal(retroModal);

    if (GameState.getCurrentSprintNumber() < 3) {
        Simulation.startNextSprint();
    } else {
        Simulation.showFinalStorybook();
    }
}


// --- Game Start ---
document.addEventListener('DOMContentLoaded', initGame);
// --- END OF FILE main.js ---