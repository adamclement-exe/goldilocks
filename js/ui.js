// --- START OF FILE ui.js ---

import * as GameState from './gameState.js';
import { selectImageForStory } from './imageSelector.js';

// --- DOM Element References ---
// ... (keep all existing references) ...
const productBacklogList = document.getElementById('product-backlog-list');
const sprintBacklogList = document.getElementById('sprint-backlog-list');
const inProgressList = document.getElementById('inprogress-list');
const testingList = document.getElementById('testing-list');
const doneList = document.getElementById('done-list');
const storyCardTemplate = document.getElementById('story-card-template');
const workerList = document.getElementById('worker-list');
const workerTemplate = document.getElementById('worker-template');
const sprintNumberDisplay = document.getElementById('sprint-number');
const teamCapacityDisplay = document.getElementById('team-capacity');
const currentDayDisplay = document.getElementById('current-day');
const sprintSelectedPointsDisplay = document.getElementById('sprint-selected-points');
const modalSelectedPointsDisplay = document.getElementById('modal-selected-points');
const capacityWarning = document.getElementById('capacity-warning');
const planningBacklogSelection = document.getElementById('planning-backlog-selection');
const modalSprintNumberDisplays = document.querySelectorAll('.modal-sprint-number');
const modalTeamCapacityDisplays = document.querySelectorAll('.modal-team-capacity');
const reviewCompletedList = document.getElementById('review-completed-list');
const reviewVelocityDisplay = document.getElementById('review-velocity');
const reviewValueDisplay = document.getElementById('review-value');
const reviewSponsorFeedback = document.getElementById('review-sponsor-feedback');
const reviewStorybookPreview = document.getElementById('review-storybook-preview');
const finalStorybookPages = document.getElementById('final-storybook-pages');
const dailyScrumDayDisplay = document.getElementById('daily-scrum-day');
const obstacleDisplay = document.getElementById('obstacle-display');
const choiceStoryTitle = document.getElementById('choice-story-title');
const choiceOptionsContainer = document.getElementById('choice-options');
const nextDayBtn = document.getElementById('next-day-btn');
const endGameBtn = document.getElementById('end-game-btn');
const workerAssignmentModal = document.getElementById('worker-assignment-modal'); // Day 1 Modal
const assignmentListContainer = document.getElementById('assignment-list');        // Day 1 List Container
const dailyScrumModal = document.getElementById('daily-scrum-modal'); // Day 2-5 Modal
const reassignmentListContainer = document.getElementById('reassignment-list');    // Day 2-5 Reassignment List Container
const blockerResolutionList = document.getElementById('blocker-assignment-list'); // Day 2-5 Blocker List Container
const dodChoiceModal = document.getElementById('dod-choice-modal');
const dodForm = document.getElementById('dod-form');
const bonusPointsEasy = document.querySelector('.bonus-points-easy');
const bonusPointsMedium = document.querySelector('.bonus-points-medium');
const bonusPointsHard = document.querySelector('.bonus-points-hard');
const reviewCycleTimeDisplay = document.getElementById('review-cycle-time');
const reviewDodProgressDisplay = document.getElementById('review-dod-progress');
const unblockingCostDisplay = document.getElementById('unblocking-cost-display');


// --- Rendering Functions ---
// ... (keep createStoryCard, renderWorkers, renderStoryList, etc. exactly as they were) ...
export function renderProductBacklog(backlogItems) { renderStoryList(productBacklogList, backlogItems); }
export function renderSprintBacklog(sprintItems) { renderStoryList(sprintBacklogList, sprintItems); updateSprintPlanningUI(); }
export function renderInProgress(inProgressItems) { renderStoryList(inProgressList, inProgressItems); }
export function renderTesting(testingItems) { renderStoryList(testingList, testingItems); }
export function renderDone(doneItems) { renderStoryList(doneList, doneItems); }

function renderStoryList(listElement, stories) {
    if (!listElement) { console.error("Target list element not found for rendering stories."); return; }
    listElement.innerHTML = '';
    if (stories && stories.length > 0) {
        stories.forEach(story => {
            if (story) {
                const card = createStoryCard(story);
                if (card) listElement.appendChild(card);
            } else { console.warn("Attempted to render an undefined story."); }
        });
    }
    updateWipDisplays(); // Update WIP counts
}

export function createStoryCard(story) {
    if (!storyCardTemplate || !story || !story.id) { console.error("Story card template or story data invalid:", story); return null; }
    const card = storyCardTemplate.content.cloneNode(true).querySelector('.story-card');
    card.dataset.storyId = story.id;
    card.style.cursor = 'default'; // Not draggable between columns
    card.querySelector('.story-title').textContent = story.title;
    card.querySelector('.story-effort').textContent = story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort;
    card.querySelector('.story-value').textContent = story.value;

    // WIP Aging Display
    const ageSpan = card.querySelector('.story-age');
    if ((story.status === 'inprogress' || story.status === 'testing') && typeof story.daysInState === 'number' && story.daysInState > 0) {
        ageSpan.textContent = `Age: ${story.daysInState}d`;
        ageSpan.style.display = 'inline';
        if (story.daysInState > 2) { // Aging threshold (e.g., > 2 days)
             ageSpan.classList.add('aging'); // Use class for styling
        } else {
             ageSpan.classList.remove('aging');
        }
    } else {
        ageSpan.style.display = 'none';
        ageSpan.classList.remove('aging');
    }

    // Tags Display
    const tagsContainer = card.querySelector('.story-tags');
    tagsContainer.innerHTML = '';
    if (story.tags && Array.isArray(story.tags)) {
        story.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.classList.add('tag', `tag-${tag.toLowerCase().replace(/\s+/g, '-')}`);
            tagSpan.textContent = tag; tagsContainer.appendChild(tagSpan);
        });
    }

    // ** Assigned Workers Display (Handles Array) **
    const assignmentDiv = card.querySelector('.story-assignment');
    assignmentDiv.innerHTML = 'Assigned: '; // Clear previous
    const workerSpan = document.createElement('span');
    workerSpan.className = 'story-worker'; // Keep class for potential styling
    if (story.assignedWorkers && story.assignedWorkers.length > 0) {
         const workerNames = story.assignedWorkers.map(id => {
             const worker = GameState.getWorkerById(id);
             return worker ? `${worker.name.split(' ')[0]} (${worker.area[0]})` : '?'; // Short name + Area Initial
         }).filter(Boolean);
          workerSpan.textContent = workerNames.join(', ');
    } else {
        workerSpan.textContent = 'None';
    }
    assignmentDiv.appendChild(workerSpan);

    // Blocker Display
    const blockerInfo = card.querySelector('.blocker-info');
    if (story.isBlocked) {
        blockerInfo.style.display = 'block';
        card.dataset.blocked = 'true'; // Use data attribute for CSS
    } else {
        blockerInfo.style.display = 'none';
        card.dataset.blocked = 'false';
    }

    // Progress Bars (No change needed here)
    const devProgressElement = card.querySelector('.story-progress');
    const devProgressBar = card.querySelector('.dev-progress');
    const devPointsRemainingSpan = card.querySelector('.dev-points-remaining');
    const testProgressElement = card.querySelector('.story-testing-progress');
    const testProgressBar = card.querySelector('.test-progress');
    const testPointsRemainingSpan = card.querySelector('.test-points-remaining');

    if (story.status === 'inprogress' || story.status === 'testing' || story.status === 'done') {
        devProgressElement.style.display = 'block';
        devProgressBar.value = story.progress || 0; devProgressBar.max = 100;
        devPointsRemainingSpan.textContent = `${Math.round(story.remainingEffort)} pts`;
    } else { devProgressElement.style.display = 'none'; }

    if (story.status === 'testing' || story.status === 'done') {
        testProgressElement.style.display = 'block';
        testProgressBar.value = story.testingProgress || 0; testProgressBar.max = 100;
        testPointsRemainingSpan.textContent = `${Math.round(story.testingEffortRemaining)} pts`;
    } else { testProgressElement.style.display = 'none'; }

    // Apply aging style (only if not blocked) via data attribute
     if (!story.isBlocked && story.daysInState > 2 && (story.status === 'inprogress' || story.status === 'testing')) {
         card.dataset.aging = 'true';
     } else {
         card.dataset.aging = 'false';
     }


    return card;
}


export function renderWorkers(workers) {
    if (!workerList) return;
    workerList.innerHTML = '';
     if (!workerTemplate) { console.error("Worker template not found!"); return; }
    workers.forEach(worker => {
        const workerElement = workerTemplate.content.cloneNode(true).querySelector('.worker-status');
        workerElement.dataset.workerId = worker.id;
        workerElement.querySelector('.worker-name').textContent = worker.name;
        workerElement.querySelector('.worker-area').textContent = worker.area;
        workerElement.querySelector('.worker-skill').textContent = worker.skill;
        workerElement.querySelector('.worker-points').textContent = worker.pointsPerDay;
        workerElement.querySelector('.worker-avatar').style.backgroundColor = getWorkerColor(worker.id);

        const stateElement = workerElement.querySelector('.worker-state');
        let stateText = 'Unknown';
        let stateClass = 'idle'; // Default state class

        const assignedStory = worker.assignedStory ? GameState.getStory(worker.assignedStory) : null;

        if (!worker.available) {
             const obstacleMsg = getObstacleMessageForWorker(worker.id);
             stateText = `Unavailable (${obstacleMsg || 'Reason Unknown'})`;
             stateClass = 'unavailable';
        } else if (worker.isUnblocking && assignedStory) {
            stateText = `Unblocking: ${assignedStory.title.substring(0,15)+'...'}`;
            stateClass = 'unblocking';
        } else if (assignedStory) {
             if (assignedStory.isBlocked) {
                stateText = `Blocked on: ${assignedStory.title.substring(0,15)+'...'}`;
                stateClass = 'blocked'; // Assign 'blocked' state class
             } else {
                stateText = `Working on: ${assignedStory.title.substring(0,15)+'...'}`;
                stateClass = 'working'; // Assign 'working' state class
             }
        } else {
            stateText = `Idle (${worker.dailyPointsLeft} pts left)`;
            stateClass = 'idle'; // Assign 'idle' state class
        }
        stateElement.textContent = stateText;
        workerElement.dataset.state = stateClass; // Set the data-state attribute
        workerList.appendChild(workerElement);
    });
}

function getWorkerColor(workerId) {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#d35400', '#2980b9', '#8e44ad', '#bdc3c7'];
    const index = parseInt(workerId.replace('w', ''), 10) - 1;
    return colors[index % colors.length];
}

// --- UI Updates ---

export function updateSprintInfo(sprintNum, capacity, phaseName = 'Planning') {
    sprintNumberDisplay.textContent = sprintNum;
    teamCapacityDisplay.textContent = capacity;
    currentDayDisplay.textContent = phaseName;
    modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
    modalTeamCapacityDisplays.forEach(el => el.textContent = capacity);
    // Update unblocking cost display
    if (unblockingCostDisplay) {
         unblockingCostDisplay.textContent = GameState.UNBLOCKING_COST;
    }
}

export function updateWipDisplays() {
    const wipLimits = GameState.getWipLimits();
    const currentWip = GameState.getCurrentWip();
    const columns = [
        { id: 'inprogress', headerId: 'col-inprogress', modalInfoId: `inprogress-wip-info`, dailyInfoId: `daily-wip-inprogress` },
        { id: 'testing', headerId: 'col-testing', modalInfoId: `testing-wip-info`, dailyInfoId: `daily-wip-testing` }
    ];

    columns.forEach(colInfo => {
        const limit = wipLimits[colInfo.id];
        const count = currentWip[colInfo.id];
        const isExceeded = count > limit;

        // Main Kanban Column Header
        const headerElement = document.getElementById(colInfo.headerId);
        if (headerElement) {
            const countSpan = headerElement.querySelector('.wip-count');
            const maxSpan = headerElement.querySelector('.wip-max');
            const limitSpan = headerElement.querySelector('.wip-limit');
            if (countSpan) countSpan.textContent = count;
            if (maxSpan) maxSpan.textContent = limit;
            if (limitSpan) limitSpan.classList.toggle('exceeded', isExceeded);
        }

        // Day 1 Assignment Modal WIP Info
         const modalWipInfo = document.getElementById(colInfo.modalInfoId);
         if (modalWipInfo) {
             const countSpan = modalWipInfo.querySelector('.wip-count');
             const maxSpan = modalWipInfo.querySelector('.wip-max');
             if (countSpan) countSpan.textContent = count;
             if (maxSpan) maxSpan.textContent = limit;
              modalWipInfo.classList.toggle('exceeded', isExceeded);
         }

         // Daily Scrum Modal WIP Info
         const dailyWipSpan = document.getElementById(colInfo.dailyInfoId);
         if (dailyWipSpan) {
             const countSpan = document.getElementById(`${colInfo.dailyInfoId}-count`);
             const maxSpan = document.getElementById(`${colInfo.dailyInfoId}-max`);
             if(countSpan) countSpan.textContent = count;
             if(maxSpan) maxSpan.textContent = limit;
             dailyWipSpan.classList.toggle('exceeded', isExceeded);
         }
    });
}


export function updateCard(storyId, storyData) {
    const card = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
    if (card && storyData) {
        const newCard = createStoryCard(storyData); // Re-create the card content
        if (newCard) {
            // Preserve scroll position if possible (might not be perfect)
            const parentList = card.parentElement;
            const scrollPos = parentList ? parentList.scrollTop : 0;

            card.innerHTML = newCard.innerHTML; // Replace inner content
            // Re-apply data attributes for styling
            card.dataset.blocked = storyData.isBlocked ? 'true' : 'false';
            card.dataset.aging = (!storyData.isBlocked && storyData.daysInState > 2 && (storyData.status === 'inprogress' || storyData.status === 'testing')) ? 'true' : 'false';

            // Restore scroll position
             if (parentList) { parentList.scrollTop = scrollPos; }

        }
    } else { console.warn(`Card with ID ${storyId} not found for update or invalid data.`); }
}


export function moveCardToColumn(storyId, targetColumnId) {
    const card = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
    const targetList = document.getElementById(getColumnListId(targetColumnId));
    if (card && targetList) {
        if (card.parentElement !== targetList) {
             // Preserve scroll position before moving
            const sourceList = card.parentElement;
            const sourceScroll = sourceList ? sourceList.scrollTop : 0;
            const targetScroll = targetList.scrollTop;

            targetList.appendChild(card);
            console.log(`UI: Moved card ${storyId} to column ${targetColumnId}`);

            // Restore scroll positions
            if (sourceList) sourceList.scrollTop = sourceScroll;
             targetList.scrollTop = targetScroll; // Or targetList.scrollHeight to scroll to bottom

        }
        updateWipDisplays(); // Update WIP counts after move
    } else {
         console.warn(`UI Error: Could not move card ${storyId} to column ${targetColumnId}. Card or Target List not found.`);
         renderAllColumns(); // Fallback: re-render everything if move fails
    }
}

function getColumnListId(columnId) {
    switch (columnId) {
        case 'backlog': return 'product-backlog-list';
        case 'ready': return 'sprint-backlog-list';
        case 'inprogress': return 'inprogress-list';
        case 'testing': return 'testing-list';
        case 'done': return 'done-list';
        default: console.error(`Unknown column ID: ${columnId}`); return null;
    }
}

export function renderAllColumns() {
    console.log("Re-rendering all columns...");
    renderProductBacklog(GameState.getProductBacklog());
    const allStories = Object.values(GameState.getAllStories());
    const sprintBacklogIds = new Set(GameState.getSprintBacklog().map(s => s.id)); // Use Set for faster lookup

    renderSprintBacklog(allStories.filter(s => s.status === 'ready' && sprintBacklogIds.has(s.id)));
    renderInProgress(allStories.filter(s => s.status === 'inprogress'));
    renderTesting(allStories.filter(s => s.status === 'testing'));
    renderDone(allStories.filter(s => s.status === 'done'));
     // Ensure workers are also up-to-date
     renderWorkers(GameState.getTeam());
}


// --- Modal Handling ---
export function showModal(modalElement) {
    if (modalElement && typeof modalElement.showModal === 'function') {
        if (!modalElement.open) {
             modalElement.showModal();
             // *** FIX: Reset scroll position after showing ***
             // Use setTimeout to ensure this runs after the browser's potential autofocus scroll
             setTimeout(() => {
                 modalElement.scrollTop = 0;
             }, 0);
        } else {
             console.log(`>>> UI.showModal: Modal ${modalElement.id} is already open.`);
             // Even if already open, reset scroll just in case
              setTimeout(() => {
                  modalElement.scrollTop = 0;
             }, 0);
        }
    } else { console.error(">>> UI.showModal Error: Invalid modal element or showModal not supported:", modalElement); }
}
export function closeModal(modalElement) { if (modalElement && typeof modalElement.close === 'function') { modalElement.close(); } }

// --- Specific Modal Content Updates ---
// ... (keep showDoDChoiceModal, populateSprintPlanningModal, updateSprintPlanningUI, showProceduralChoiceModal, etc. exactly as they were) ...

export function showDoDChoiceModal() {
    if (!dodChoiceModal) return;
    try {
        if (bonusPointsEasy) bonusPointsEasy.textContent = GameState.getDodDefinition('easy')?.bonusPoints || '?';
        if (bonusPointsMedium) bonusPointsMedium.textContent = GameState.getDodDefinition('medium')?.bonusPoints || '?';
        if (bonusPointsHard) bonusPointsHard.textContent = GameState.getDodDefinition('hard')?.bonusPoints || '?';
    } catch (e) { console.error("Error getting DoD definitions for UI:", e); }
    dodForm.reset();
    showModal(dodChoiceModal);
}

export function populateSprintPlanningModal(backlogStories, selectedIds, currentCapacity) {
    planningBacklogSelection.innerHTML = '';
    backlogStories.forEach(story => {
        const div = document.createElement('div'); const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.id = `plan-select-${story.id}`; checkbox.value = story.id;
        checkbox.checked = selectedIds.includes(story.id); checkbox.dataset.effort = story.baseEffort;
        const label = document.createElement('label'); label.htmlFor = checkbox.id;
        label.textContent = ` ${story.title} (Effort: ${story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort}, Value: ${story.value}⭐)`;
        checkbox.addEventListener('change', (event) => {
             const storyId = event.target.value; const isChecked = event.target.checked; const storyData = GameState.getStory(storyId);
             if (!storyData) { console.error(`Story data not found for ID ${storyId} during planning change.`); return; }
             let actionSuccess = false;
             if (isChecked) {
                 // If story requires implementation choice and hasn't been chosen, show choice modal first
                 if (storyData.implementationChoices && storyData.implementationChoices.length > 0 && !storyData.chosenImplementation) {
                     showProceduralChoiceModal(storyData);
                     // We expect the choice modal confirmation to handle adding to sprint
                 }
                 else { // Otherwise, add directly
                     actionSuccess = GameState.addStoryToSprint(storyId);
                     if (actionSuccess) { moveCardToColumn(storyId, 'ready'); } else { event.target.checked = false; /* Revert checkbox if add fails */ }
                 }
             } else {
                 actionSuccess = GameState.removeStoryFromSprint(storyId);
                 if (actionSuccess) { moveCardToColumn(storyId, 'backlog'); } else { event.target.checked = true; /* Revert checkbox if remove fails */ }
             }
             updateSprintPlanningUI(); // Update points total regardless
        });
        div.appendChild(checkbox); div.appendChild(label); planningBacklogSelection.appendChild(div);
    });
    updateSprintPlanningUI(); // Initial calculation
}

export function updateSprintPlanningUI() {
    let selectedPoints = 0;
    const sprintStories = GameState.getSprintBacklog();
    sprintStories.forEach(story => {
        if (story) {
             // Use chosen effort if available, otherwise base effort
             selectedPoints += story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort;
        }
     });
    sprintSelectedPointsDisplay.textContent = selectedPoints;
    if (modalSelectedPointsDisplay) modalSelectedPointsDisplay.textContent = selectedPoints;
    const capacity = GameState.getTeamCapacity();
    if(capacityWarning) {
         capacityWarning.style.display = selectedPoints > capacity ? 'block' : 'none';
         capacityWarning.textContent = `Warning: Selected points (${selectedPoints}) exceed capacity (${capacity}).`;
    }
    // Update labels in planning modal if effort changed due to implementation choice
     const planningLabels = planningBacklogSelection.querySelectorAll('label');
     planningLabels.forEach(label => {
        const checkbox = document.getElementById(label.htmlFor);
        if (checkbox) {
            const storyId = checkbox.value;
            const storyData = GameState.getStory(storyId);
            if (storyData) {
                label.textContent = ` ${storyData.title} (Effort: ${storyData.chosenImplementation ? storyData.chosenImplementation.effort : storyData.baseEffort}, Value: ${storyData.value}⭐)`;
            }
        }
     });
}


export function showProceduralChoiceModal(story) {
     const modal = document.getElementById('procedural-choice-modal'); if (!modal || !story) return;
     choiceStoryTitle.textContent = `Choose Implementation for: ${story.title}`; choiceOptionsContainer.innerHTML = ''; modal.dataset.storyId = story.id;
     if (story.implementationChoices && story.implementationChoices.length > 0) {
         story.implementationChoices.forEach((choice, index) => {
             const div = document.createElement('div'); const radio = document.createElement('input'); radio.type = 'radio'; radio.name = `choice-${story.id}`; radio.id = `choice-${story.id}-${index}`; radio.value = index; if (index === 0) radio.checked = true; // Default to first choice
             const label = document.createElement('label'); label.htmlFor = radio.id; label.textContent = ` ${choice.description} (Effort: ${choice.effort}, Impact: ${choice.impact})`;
             div.appendChild(radio); div.appendChild(label); choiceOptionsContainer.appendChild(div);
         });
     } else { choiceOptionsContainer.innerHTML = '<p>No implementation choices available.</p>'; } showModal(modal);
}


export function populateWorkerAssignmentModal(storiesToAssign, availableWorkers) {
    if (!assignmentListContainer) return;
    assignmentListContainer.innerHTML = ''; // Clear previous content
     // Remove previous listener to avoid duplicates
     assignmentListContainer.removeEventListener('change', handleAssignmentCheckboxChange);
    updateWipDisplays(); // Ensure WIP info is current

    if (storiesToAssign.length === 0) {
        assignmentListContainer.innerHTML = '<p>No stories in the Sprint Backlog require assignment.</p>';
        return;
    }

    // Keep track of workers assigned within this modal session to disable them elsewhere
    const workersAssignedInModal = new Set();
    // Keep track of stories that will potentially move to 'In Progress'
    let storiesMovingToInProgress = 0;

    storiesToAssign.forEach(story => {
        if (!story) return;
        const storyDiv = document.createElement('div');
        storyDiv.className = 'assignment-item';
        storyDiv.dataset.storyId = story.id;

        const storyInfo = document.createElement('div');
        storyInfo.innerHTML = `<strong>${story.title}</strong> (Effort: ${story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort})`;
        const wipWarningSpan = document.createElement('span'); // WIP warning specific to this story
        wipWarningSpan.className = 'wip-limit-warning';
        wipWarningSpan.textContent = ' (WIP Limit!)';
        wipWarningSpan.style.display = 'none'; // Hide initially
        storyInfo.appendChild(wipWarningSpan); // Add warning span here
        storyDiv.appendChild(storyInfo);


        const storyTags = Array.isArray(story.tags) ? story.tags : [];
        const storyDetails = document.createElement('span');
        storyDetails.className = 'story-details';
        storyDetails.textContent = `Tags: ${storyTags.join(', ')}`;
        storyDiv.appendChild(storyDetails);

        const assignLabel = document.createElement('label');
        assignLabel.textContent = 'Assign Developers:';
        assignLabel.style.display = 'block'; // Ensure label is on its own line
        assignLabel.style.marginTop = '5px';
        storyDiv.appendChild(assignLabel);

        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'worker-checkbox-container';
        checkboxContainer.dataset.storyId = story.id; // Link container to story

        availableWorkers.forEach(worker => {
            if (worker.area !== 'Testing') { // Only show Devs
                const optionDiv = document.createElement('div');
                optionDiv.className = 'worker-checkbox-option';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `assign-${story.id}-${worker.id}`;
                checkbox.value = worker.id;
                checkbox.dataset.storyId = story.id;
                checkbox.dataset.workerId = worker.id; // Easier access to worker ID

                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                const specialtyMatch = storyTags.includes(worker.area);
                label.textContent = `${worker.name} (${worker.skill[0]} ${worker.pointsPerDay}pts)${specialtyMatch ? ' ✨' : ''}`;

                optionDiv.appendChild(checkbox);
                optionDiv.appendChild(label);
                checkboxContainer.appendChild(optionDiv);
            }
        });
        storyDiv.appendChild(checkboxContainer);
        assignmentListContainer.appendChild(storyDiv);
    });

    // Add event listener to the container for delegation
    assignmentListContainer.addEventListener('change', handleAssignmentCheckboxChange);

    // Initial update of checkbox states based on current WIP and assignments
    updateAssignmentModalCheckboxes();
}

// Event handler for Day 1 Assignment Checkbox changes
function handleAssignmentCheckboxChange(event) {
    if (event.target.type === 'checkbox') {
        updateAssignmentModalCheckboxes();
    }
}

// Helper function to update checkbox enabled/disabled state and WIP warnings in Day 1 Modal
function updateAssignmentModalCheckboxes() {
    const allCheckboxes = assignmentListContainer.querySelectorAll('input[type="checkbox"]');
    const workersAssignedInModal = new Set();
    const storiesWithAssignments = new Set();

    // 1. Identify current selections
    allCheckboxes.forEach(cb => {
        if (cb.checked) {
            workersAssignedInModal.add(cb.value); // Add worker ID
            storiesWithAssignments.add(cb.dataset.storyId); // Add story ID
        }
    });

    // 2. Calculate projected WIP increase
    const currentWipInProgress = GameState.getCurrentWip().inprogress;
    const wipLimitInProgress = GameState.getWipLimits().inprogress;
    const projectedWip = currentWipInProgress + storiesWithAssignments.size;
    const wipLimitReached = projectedWip > wipLimitInProgress; // Check if strictly greater than limit

    console.log(`Current WIP: ${currentWipInProgress}, Stories selected: ${storiesWithAssignments.size}, Projected WIP: ${projectedWip}, Limit: ${wipLimitInProgress}, Reached (>): ${wipLimitReached}`);

    // 3. Update checkboxes and warnings
    assignmentListContainer.querySelectorAll('.assignment-item').forEach(itemDiv => {
        const storyId = itemDiv.dataset.storyId;
        const isStorySelected = storiesWithAssignments.has(storyId);
        const wipWarning = itemDiv.querySelector('.wip-limit-warning');

        // Show/hide WIP warning for this specific story IF it's selected AND the limit is reached
        if (wipWarning) {
            wipWarning.style.display = (isStorySelected && wipLimitReached) ? 'inline' : 'none';
             // Add specific warning text
             if (isStorySelected && wipLimitReached) {
                 wipWarning.textContent = ` (WIP Limit of ${wipLimitInProgress} Reached!)`;
             }
        }

        itemDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            const workerId = cb.value;
            const isWorkerAssignedElsewhere = workersAssignedInModal.has(workerId) && !cb.checked; // Assigned to another story in modal

            // Disable checkbox if:
            // 1. Worker is assigned elsewhere in the modal.
            // 2. WIP limit is REACHED (> limit) AND this story doesn't have anyone assigned yet AND this checkbox isn't checked.
            //    (Allows assigning workers to a story already counted towards WIP, even if at limit)
            const disableBecauseWip = wipLimitReached && !isStorySelected && !cb.checked;

            cb.disabled = isWorkerAssignedElsewhere || disableBecauseWip;

             // Update label style if disabled
             const label = cb.nextElementSibling; // Assuming label is immediately after checkbox
             if (label) {
                 label.style.textDecoration = cb.disabled ? 'line-through' : 'none';
                 label.style.color = cb.disabled ? '#aaa' : 'inherit';
             }
        });
    });
}


export function populateDailyScrumModal(day, workers, activeObstacles, storiesInProgressOrTesting) {
    const modal = document.getElementById('daily-scrum-modal');
    if (!modal) return;
    modal.querySelector('h2').textContent = `Daily Scrum & Reassignment - Day ${day}`;
     const confirmBtn = document.getElementById('confirm-reassignments-btn');
     if(confirmBtn) {
        const confirmDaySpan = confirmBtn.querySelector('#confirm-work-day-num');
        if(confirmDaySpan) confirmDaySpan.textContent = day;
     }
    updateWipDisplays(); // Update WIP counts display in modal
    if (unblockingCostDisplay) unblockingCostDisplay.textContent = GameState.UNBLOCKING_COST;

    // Obstacles Display
    obstacleDisplay.innerHTML = activeObstacles.length > 0
        ? '<strong>Obstacles Today:</strong><ul>' + activeObstacles.map(obs => `<li>${obs.message}</li>`).join('') + '</ul>'
        : 'No new obstacles today.';

    reassignmentListContainer.innerHTML = '';
    blockerResolutionList.innerHTML = '';

    const blockedStories = storiesInProgressOrTesting.filter(s => s.isBlocked);
    const unblockedActiveStories = storiesInProgressOrTesting.filter(s => !s.isBlocked);

    // --- Populate Reassignment Section (Unblocked Stories) ---
    const reassignmentSection = document.getElementById('reassignment-section');
    if (unblockedActiveStories.length === 0) {
        reassignmentListContainer.innerHTML = '<p>No active (unblocked) stories to assign/reassign.</p>';
    } else {
        unblockedActiveStories.forEach(story => {
            const itemDiv = document.createElement('div'); itemDiv.className = 'reassignment-item'; itemDiv.dataset.storyId = story.id;

            const storyInfo = document.createElement('div');
            const storyEffortText = story.status === 'testing' ? `Test Left: ${Math.round(story.testingEffortRemaining)} pts` : `Dev Left: ${Math.round(story.remainingEffort)} pts`;
            const ageText = story.daysInState > 0 ? ` (Age: ${story.daysInState}d)` : '';
             const agingClass = story.daysInState > 2 ? ' aging' : ''; // Add aging class if needed
            storyInfo.innerHTML = `<strong>${story.title}</strong> (${storyEffortText}) <br> Status: ${story.status}<span class="story-age${agingClass}">${ageText}</span>`;
            itemDiv.appendChild(storyInfo);

            // List current workers with unassign buttons
            const currentWorkersDiv = document.createElement('div');
            currentWorkersDiv.style.marginLeft = '15px'; currentWorkersDiv.style.marginTop = '5px';
            currentWorkersDiv.innerHTML = 'Assigned: ';
            const assignedWorkers = GameState.getAssignedWorkersForStory(story.id); // Get worker objects

            if (assignedWorkers.length > 0) {
                assignedWorkers.forEach(worker => {
                    const workerSpan = document.createElement('span');
                    workerSpan.style.marginRight = '10px'; workerSpan.style.display = 'inline-block'; // Better spacing

                    const unassignBtn = document.createElement('button');
                    unassignBtn.textContent = '✕'; // Unassign symbol
                    unassignBtn.title = `Unassign ${worker.name}`;
                    unassignBtn.classList.add('unassign-worker-btn'); // Add class for event listener
                    unassignBtn.dataset.workerId = worker.id;
                    unassignBtn.dataset.storyId = story.id;
                    unassignBtn.style.marginLeft = '3px'; unassignBtn.style.padding = '1px 4px'; unassignBtn.style.fontSize = '0.8em'; unassignBtn.style.backgroundColor = '#e74c3c'; unassignBtn.style.color = 'white'; unassignBtn.style.border = 'none'; unassignBtn.style.cursor = 'pointer';

                    workerSpan.textContent = `${worker.name} (${worker.area[0]}) `; // Short name + Area Initial
                    workerSpan.appendChild(unassignBtn);
                    currentWorkersDiv.appendChild(workerSpan);
                });
            } else {
                currentWorkersDiv.innerHTML += 'None';
            }
            itemDiv.appendChild(currentWorkersDiv);

            // Add Additional Worker Dropdown
            const addWorkerDiv = document.createElement('div');
            addWorkerDiv.style.marginTop = '8px';
            const selectLabel = document.createElement('label');
            selectLabel.textContent = 'Assign Additional Worker: '; selectLabel.htmlFor = `add-assign-${story.id}`;
            const selectWorker = document.createElement('select');
            selectWorker.id = `add-assign-${story.id}`;
            selectWorker.dataset.storyId = story.id; selectWorker.dataset.storyStatus = story.status;
            const noneOption = document.createElement('option'); noneOption.value = ''; noneOption.textContent = '-- Select Available Worker --';
            selectWorker.appendChild(noneOption);
            // Options populated later by update function
            addWorkerDiv.appendChild(selectLabel); addWorkerDiv.appendChild(selectWorker);
            itemDiv.appendChild(addWorkerDiv);

            reassignmentListContainer.appendChild(itemDiv);
        });
    }
    reassignmentSection.style.display = 'block'; // Ensure visible

    // --- Populate Blocker Resolution Section ---
    const blockerSection = document.getElementById('blocker-resolution-section');
    if (blockedStories.length > 0) {
        blockerSection.style.display = 'block';
        blockedStories.forEach(story => {
            const itemDiv = document.createElement('div'); itemDiv.className = 'blocker-assignment-item'; itemDiv.dataset.storyId = story.id;
            const ageText = story.daysInState > 0 ? ` (Blocked ${story.daysInState}d)` : '';
             const agingClass = story.daysInState > 2 ? ' aging' : ''; // Add aging class if needed
            itemDiv.innerHTML = `<strong>${story.title}</strong> <span style="color: orange;">[BLOCKED]</span><span class="story-age${agingClass}">${ageText}</span><br>`;
            const selectLabel = document.createElement('label'); selectLabel.htmlFor = `unblock-assign-${story.id}`; selectLabel.textContent = 'Assign Senior Dev: ';
            const selectWorker = document.createElement('select'); selectWorker.id = `unblock-assign-${story.id}`; selectWorker.dataset.storyId = story.id;
            const noneOption = document.createElement('option'); noneOption.value = ''; noneOption.textContent = '-- Select Available Senior --';
            selectWorker.appendChild(noneOption);
            // Options populated later
            itemDiv.appendChild(selectLabel); itemDiv.appendChild(selectWorker);
            blockerResolutionList.appendChild(itemDiv);
        });
    } else {
        blockerSection.style.display = 'none';
    }

    // Add event listeners for dynamically created unassign buttons (delegated)
    reassignmentListContainer.removeEventListener('click', handleUnassignClick); // Remove previous listener if any
    reassignmentListContainer.addEventListener('click', handleUnassignClick);

    // Initial population and update of dropdown options
    updateDailyScrumModalOptions();
}

// Event handler for unassign clicks in Daily Scrum (delegated)
function handleUnassignClick(event) {
    if (event.target.classList.contains('unassign-worker-btn')) {
        const button = event.target;
        const workerId = button.dataset.workerId;
        const storyId = button.dataset.storyId;

        if (!workerId || !storyId) return;

        console.log(`UI Unassign Click: Worker ${workerId} from Story ${storyId}`);
        GameState.unassignWorkerFromStory(storyId, workerId); // Update state

        // Visually remove the worker and their button
        const workerSpan = button.closest('span');
        if (workerSpan) workerSpan.remove();

        // Check if "Currently Assigned" is now empty
        const itemDiv = document.querySelector(`.reassignment-item[data-story-id="${storyId}"]`);
        if (itemDiv) {
             const currentWorkersDiv = itemDiv.querySelector('div:nth-of-type(2)'); // Assuming second div holds assigned workers
             // Verify it's the correct div before modifying
            if (currentWorkersDiv && currentWorkersDiv.textContent.trim().startsWith('Assigned:')) {
                if (!currentWorkersDiv.querySelector('span')) { // No worker spans left
                    currentWorkersDiv.innerHTML = 'Assigned: None';
                }
            }
        }

        updateDailyScrumModalOptions(); // Re-enable options in dropdowns
        UI.renderWorkers(GameState.getTeam()); // Update main worker list
        UI.updateCard(storyId, GameState.getStory(storyId)); // Update card display
    }
}


// Helper function to update all dropdown options in the Daily Scrum modal
function updateDailyScrumModalOptions() {
    const allReassignSelects = reassignmentListContainer.querySelectorAll('select[id^="add-assign-"]');
    const allBlockerSelects = blockerResolutionList.querySelectorAll('select[id^="unblock-assign-"]');
    const availableWorkers = GameState.getAvailableWorkers(); // Workers not assigned AND available AND not unblocking
    const availableSeniorDevs = GameState.getAvailableSeniorDevs(); // Available seniors specifically
    const wipLimits = GameState.getWipLimits();

    // --- Update Reassignment ("Add Additional") Selects ---
    allReassignSelects.forEach(sel => {
        const storyId = sel.dataset.storyId;
        const story = GameState.getStory(storyId);
        if (!story || story.isBlocked) { // Skip if story not found or is blocked
             sel.innerHTML = '<option value="">-- Story Blocked --</option>';
             sel.disabled = true;
             return;
        }
        sel.disabled = false; // Re-enable if previously disabled

        const storyStatus = story.status;
        const currentlyAssignedToThisStory = new Set(story.assignedWorkers);
        const originalValue = sel.value; // Preserve selection if still valid
        sel.innerHTML = '<option value="">-- Select Available Worker --</option>'; // Reset options

        // Determine potential WIP violation if adding *first* tester to a full column
        let wouldViolateTestWip = false;
        if (storyStatus === 'testing') {
            const hasTester = story.assignedWorkers.some(id => GameState.getWorkerById(id)?.area === 'Testing');
            if (!hasTester && GameState.getCurrentWip().testing >= wipLimits.testing) {
                wouldViolateTestWip = true;
            }
        }

        availableWorkers.forEach(worker => {
            const canWorkOnStatus = (storyStatus === 'inprogress' && worker.area !== 'Testing') || (storyStatus === 'testing' && worker.area === 'Testing');

            if (canWorkOnStatus) {
                const option = document.createElement('option');
                option.value = worker.id;
                const storyTags = Array.isArray(story.tags) ? story.tags : [];
                const specialtyMatch = storyTags.includes(worker.area);
                option.textContent = `${worker.name} (${worker.area} ${worker.skill}) ${specialtyMatch ? '✨' : ''}`;

                // Disable if:
                // 1. Worker already assigned to THIS story.
                // 2. Worker is already assigned to ANOTHER story (worker.assignedStory check is covered by getAvailableWorkers).
                 // 3. Adding the FIRST tester would violate Testing WIP limit.
                const disableBecauseWip = (worker.area === 'Testing' && wouldViolateTestWip);

                option.disabled = currentlyAssignedToThisStory.has(worker.id) || disableBecauseWip;
                sel.appendChild(option);
            }
        });
        sel.value = originalValue; // Restore selection if still valid
    });

    // --- Update Blocker Selects ---
    allBlockerSelects.forEach(sel => {
        const currentSelection = sel.value; // Preserve selection
        sel.innerHTML = '<option value="">-- Select Available Senior --</option>'; // Reset options
        availableSeniorDevs.forEach(worker => {
            const option = document.createElement('option');
            option.value = worker.id;
            option.textContent = `${worker.name} (${worker.skill} ${worker.area} - ${worker.dailyPointsLeft}pts left)`;
             // Disable if:
             // 1. Not enough points for unblocking cost.
             // 2. Worker already assigned (should be covered by getAvailableSeniorDevs, but double-check)
            option.disabled = worker.dailyPointsLeft < GameState.UNBLOCKING_COST;
            sel.appendChild(option);
        });
        sel.value = currentSelection; // Restore previous selection if still valid
    });
}


export function populateSprintReviewModal(sprintNum, completedStories, velocity, totalValue, avgCycleTime, sponsorFeedback, dodProgressFeedback) {
    modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
    reviewCompletedList.innerHTML = '';
    completedStories.forEach(story => { const li = document.createElement('li'); li.textContent = `${story.title} (Effort: ${story.baseEffort}, Value: ${story.value}⭐)`; reviewCompletedList.appendChild(li); });
    reviewVelocityDisplay.textContent = velocity; reviewValueDisplay.textContent = totalValue;
    reviewCycleTimeDisplay.textContent = avgCycleTime !== null ? `${avgCycleTime} work day(s)` : 'N/A'; // Updated label
    reviewSponsorFeedback.textContent = sponsorFeedback || "..."; reviewDodProgressDisplay.textContent = dodProgressFeedback || "";
    reviewStorybookPreview.innerHTML = '';
    // Define a more logical story order
    const storyOrder = [ "Cover", "Introduce", "Finds Cottage", "Cottage Visual", "Porridge Testing", "Porridge Visual", "Chair Testing", "Broken Chair Visual", "Bed Testing", "Sleeping Visual", "Return", "Discover Mess", "Discover Goldilocks Visual", "Wakes Up & Flees", "End Page", "Back Cover"];
    const sortedCompleted = [...completedStories].sort((a, b) => {
        const indexA = storyOrder.findIndex(p => a.title.includes(p));
        const indexB = storyOrder.findIndex(p => b.title.includes(p));
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
     });
    sortedCompleted.forEach(story => { const pagePreview = createStorybookPagePreview(story); if (pagePreview) { reviewStorybookPreview.appendChild(pagePreview); } });
    showModal(document.getElementById('sprint-review-modal'));
}


export function populateRetrospectiveModal(sprintNum) {
     modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
     const retroFormElement = document.getElementById('retro-form');
     if (retroFormElement) retroFormElement.reset(); // Reset form fields
     const submitButton = document.querySelector('#retro-form button[type="submit"]');

     if (sprintNum >= 3) { // End of game
         if(endGameBtn) endGameBtn.style.display = 'inline-block';
         if(submitButton) submitButton.style.display = 'none';
     }
     else { // Mid-game
         if(endGameBtn) endGameBtn.style.display = 'none';
         if(submitButton) submitButton.style.display = 'inline-block';
     }
     showModal(document.getElementById('sprint-retrospective-modal'));
}

export function populateFinalStorybook(completedStories) {
    finalStorybookPages.innerHTML = ''; // Clear previous content
    const dodStatusDiv = document.createElement('div');
    const chosenDoD = GameState.getChosenDoD();
    const dodMet = GameState.getDodMetStatus();
    const bonusPoints = GameState.getDoDBonusPoints();
    const dodDef = GameState.getDodDefinition(chosenDoD);

    if (chosenDoD && dodDef) {
        dodStatusDiv.innerHTML = `<h3 style="margin-bottom: 10px;">Goal: ${dodDef.name}</h3>`;
        if (dodMet) {
            dodStatusDiv.innerHTML += `<p style="color: green; font-weight: bold;">Congratulations! You met the Definition of Done!</p><p>Bonus Points Awarded: +${bonusPoints}</p>`;
        } else {
            dodStatusDiv.innerHTML += `<p style="color: red; font-weight: bold;">Definition of Done Not Met.</p>`;
            const missingIds = GameState.getMissingDodStories();
            if (missingIds.length > 0) {
                 dodStatusDiv.innerHTML += `<p>Missing Required Stories:</p><ul style="margin-top: 5px; padding-left: 20px; list-style: disc;">`; // Ensure list style
                 missingIds.forEach(id => {
                     const story = GameState.getStory(id);
                     dodStatusDiv.innerHTML += `<li>${story ? story.title : id}</li>`;
                 });
                 dodStatusDiv.innerHTML += `</ul>`;
            }
        }
    } else {
        dodStatusDiv.innerHTML = '<p>No Definition of Done was set.</p>';
    }
    finalStorybookPages.appendChild(dodStatusDiv);

    if (completedStories.length === 0) {
        const noPagesMessage = document.createElement('p');
        noPagesMessage.textContent = "Oh no! It looks like no pages of the storybook were completed.";
        finalStorybookPages.appendChild(noPagesMessage);
    } else {
        // Define a more logical story order
        const storyOrder = [ "Cover", "Introduce", "Finds Cottage", "Cottage Visual", "Porridge Testing", "Porridge Visual", "Chair Testing", "Broken Chair Visual", "Bed Testing", "Sleeping Visual", "Return", "Discover Mess", "Discover Goldilocks Visual", "Wakes Up & Flees", "End Page", "Back Cover"];
         const sortedStories = [...completedStories].sort((a, b) => {
             const indexA = storyOrder.findIndex(p => a.title.includes(p));
             const indexB = storyOrder.findIndex(p => b.title.includes(p));
             return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
         });
        sortedStories.forEach(story => {
             const page = createStorybookPagePreview(story, true); // Pass true for final styling
             if (page) { finalStorybookPages.appendChild(page); }
         });
    }
    showModal(document.getElementById('final-storybook-modal'));
}


function createStorybookPagePreview(story, isFinal = false) {
    if (!story) return null;
    const pageDiv = document.createElement('div');
    pageDiv.classList.add('storybook-page-preview');
    if (isFinal) pageDiv.style.maxWidth = '250px'; // Adjust final size if needed

    const title = document.createElement('h5'); title.textContent = story.title; pageDiv.appendChild(title);

    const imgContainer = document.createElement('div');
    // Basic styling for the image container
    imgContainer.style.flexGrow = '1'; imgContainer.style.display = 'flex'; imgContainer.style.alignItems = 'center'; imgContainer.style.justifyContent = 'center'; imgContainer.style.minHeight = '80px'; imgContainer.style.marginBottom = '8px';

    const imageUrl = selectImageForStory(story.id, story.chosenImplementation);

    if (imageUrl && story.tags.includes('Visual')) { // Ensure it's a visual story for image
        const img = document.createElement('img');
        img.src = imageUrl; img.alt = story.title;
        img.style.maxWidth = '100%'; img.style.maxHeight = isFinal ? '120px' : '100px'; // Slightly larger in final book?
        img.style.height = 'auto'; img.style.borderRadius = '3px'; img.style.objectFit = 'contain';
        imgContainer.appendChild(img);
    } else if (story.tags.includes('Visual')) { // Visual story but no image found
        const placeholder = document.createElement('p'); placeholder.textContent = '[Visual Story - Image Missing]'; placeholder.style.color = '#aaa'; placeholder.style.fontStyle = 'italic';
        imgContainer.appendChild(placeholder);
    }
     // Always append image container, even if empty for non-visual stories
     pageDiv.appendChild(imgContainer);


    const textContainer = document.createElement('div');
    textContainer.style.marginTop = 'auto'; // Push text towards bottom

    // Display implementation impact for text stories or if choice made
    if (story.chosenImplementation && story.chosenImplementation.impact) {
         const desc = document.createElement('p');
         desc.textContent = story.chosenImplementation.impact;
         textContainer.appendChild(desc);
    }
    // Display story text if it's primarily a text story and no specific impact text shown
    else if (Array.isArray(story.tags) && !story.tags.includes('Visual') && story.story && !(story.chosenImplementation && story.chosenImplementation.impact)) {
         const desc = document.createElement('p');
         // Show a snippet of the user story text
         desc.textContent = story.story.length > 100 ? story.story.substring(0, 97) + "..." : story.story;
         textContainer.appendChild(desc);
    }
    // Fallback for text stories with missing details
    else if (Array.isArray(story.tags) && !story.tags.includes('Visual')) {
        const placeholder = document.createElement('p'); placeholder.textContent = '[Text Content Placeholder]'; placeholder.style.color = '#aaa'; placeholder.style.fontStyle = 'italic';
        textContainer.appendChild(placeholder);
    }

    pageDiv.appendChild(textContainer);
    return pageDiv;
}


// --- Button/State Updates ---
export function updateButtonVisibility(dayState) {
    const phaseName = GameState.getPhaseName(dayState);
    if (!nextDayBtn) return;

    nextDayBtn.style.display = 'none'; // Hide by default

    // Show 'Next Day' button only at the end of a Work Day phase
    if ([2, 4, 6, 8, 10].includes(dayState)) {
        nextDayBtn.style.display = 'inline-block';
        if (dayState === 10) { // End of last work day
            nextDayBtn.textContent = 'End Sprint / Go to Review';
        } else { // End of work days 1-4
            const nextDayNum = (dayState / 2) + 1;
            nextDayBtn.textContent = `Proceed to Day ${nextDayNum} Reassignment`;
        }
    }
}

// --- Obstacle Related ---
function getObstacleMessageForWorker(workerId) {
    const obstacles = GameState.getActiveObstacles ? GameState.getActiveObstacles() : [];
    const workerObstacle = obstacles.find(obs => obs.targetWorkerId === workerId && obs.type === 'capacity_reduction');
    const worker = GameState.getWorkerById(workerId);

    // Check if explicitly made unavailable by an obstacle
    if (worker && !worker.available && workerObstacle && workerObstacle.makesUnavailable) {
         return workerObstacle.shortMessage || 'Unavailable';
    }
    // Generic unavailable message if worker.available is false but no specific obstacle found
     else if (worker && !worker.available) {
         return 'Unavailable';
     }
    // If worker is available but assigned to a blocked story (and not unblocking)
     else if (worker && worker.available && worker.assignedStory && GameState.getStory(worker.assignedStory)?.isBlocked && !worker.isUnblocking) {
        // Don't return "Blocked" here as the worker state text handles this.
        // Returning "" indicates no specific *obstacle* message applies.
        return '';
    }
    return ''; // No specific message
}


// --- END OF FILE ui.js ---