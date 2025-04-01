import * as GameState from './gameState.js';
import { selectImageForStory } from './imageSelector.js';

// --- DOM Element References ---
const productBacklogList = document.getElementById('product-backlog-list');
const sprintBacklogList = document.getElementById('sprint-backlog-list');
const inProgressList = document.getElementById('inprogress-list');
const testingList = document.getElementById('testing-list'); // NEW Testing list
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
const dailyScrumDayDisplay = document.getElementById('daily-scrum-day'); // In Reassignment modal now
// const dailyScrumAssignments = document.getElementById('daily-scrum-assignments'); // Not used for assignments now
const obstacleDisplay = document.getElementById('obstacle-display'); // In Reassignment modal now
const choiceStoryTitle = document.getElementById('choice-story-title');
const choiceOptionsContainer = document.getElementById('choice-options');
const nextDayBtn = document.getElementById('next-day-btn');
const endGameBtn = document.getElementById('end-game-btn');
const workerAssignmentModal = document.getElementById('worker-assignment-modal');
const assignmentListContainer = document.getElementById('assignment-list');
const reassignmentListContainer = document.getElementById('reassignment-list'); // NEW Reassignment container
const dodChoiceModal = document.getElementById('dod-choice-modal');
const dodForm = document.getElementById('dod-form');
const bonusPointsEasy = document.querySelector('.bonus-points-easy');
const bonusPointsMedium = document.querySelector('.bonus-points-medium');
const bonusPointsHard = document.querySelector('.bonus-points-hard');
const reviewCycleTimeDisplay = document.getElementById('review-cycle-time'); // NEW Cycle Time display
const reviewDodProgressDisplay = document.getElementById('review-dod-progress'); // NEW DoD Progress display
const blockerResolutionList = document.getElementById('blocker-assignment-list'); // NEW Blocker section
const unblockingCostSpan = document.getElementById('unblocking-cost'); // Span for unblocking cost


// --- Rendering Functions ---

export function renderProductBacklog(backlogItems) { renderStoryList(productBacklogList, backlogItems); }
export function renderSprintBacklog(sprintItems) { renderStoryList(sprintBacklogList, sprintItems); updateSprintPlanningUI(); }
export function renderInProgress(inProgressItems) { renderStoryList(inProgressList, inProgressItems); }
export function renderTesting(testingItems) { renderStoryList(testingList, testingItems); } // NEW
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
    updateWipDisplays(); // Update WIP counts whenever a list is re-rendered
}

export function createStoryCard(story) {
    if (!storyCardTemplate || !story || !story.id) { console.error("Story card template or story data invalid:", story); return null; }
    const card = storyCardTemplate.content.cloneNode(true).querySelector('.story-card');
    card.dataset.storyId = story.id;
    card.style.cursor = 'default';
    card.querySelector('.story-title').textContent = story.title;
    card.querySelector('.story-effort').textContent = story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort;
    card.querySelector('.story-value').textContent = story.value;

    // WIP Aging Display
    const ageSpan = card.querySelector('.story-age');
    if ((story.status === 'inprogress' || story.status === 'testing') && typeof story.daysInState === 'number' && story.daysInState > 0) {
        ageSpan.textContent = `Age: ${story.daysInState}d`;
        ageSpan.style.display = 'inline';
        // Optional: Add visual cue for old items
        if (story.daysInState > 2) { // Example threshold: 2 days in state is getting old
            ageSpan.style.fontWeight = 'bold';
            ageSpan.style.color = '#e74c3c'; // Red for aging items
            ageSpan.classList.add('aging'); // Add class for potential styling
        } else {
            ageSpan.style.fontWeight = 'normal';
            ageSpan.style.color = '#999'; // Default aging color
            ageSpan.classList.remove('aging');
        }
    } else {
        ageSpan.style.display = 'none';
        ageSpan.classList.remove('aging');
    }

    const tagsContainer = card.querySelector('.story-tags');
    tagsContainer.innerHTML = '';
    if (story.tags && Array.isArray(story.tags)) {
        story.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.classList.add('tag', `tag-${tag.toLowerCase().replace(/\s+/g, '-')}`);
            tagSpan.textContent = tag;
            tagsContainer.appendChild(tagSpan);
        });
    }
    const workerSpan = card.querySelector('.story-worker');
    const worker = story.assignedWorker ? GameState.getTeam().find(w => w.id === story.assignedWorker) : null;
    workerSpan.textContent = worker ? worker.name : 'None';

    // Blocker Display
    const blockerInfo = card.querySelector('.blocker-info');
    if (story.isBlocked) {
        blockerInfo.style.display = 'block';
        card.style.borderLeftColor = 'orange'; // Use left border for blocker
        card.dataset.blocked = 'true'; // Add data attribute for potential CSS targeting
    } else {
        blockerInfo.style.display = 'none';
        card.style.borderLeftColor = 'transparent'; // Reset left border
        card.dataset.blocked = 'false';
    }

    const devProgressElement = card.querySelector('.story-progress');
    const devProgressBar = card.querySelector('.dev-progress');
    const devPointsRemainingSpan = card.querySelector('.dev-points-remaining');
    const testProgressElement = card.querySelector('.story-testing-progress');
    const testProgressBar = card.querySelector('.test-progress');
    const testPointsRemainingSpan = card.querySelector('.test-points-remaining');

    if (story.status === 'inprogress' || story.status === 'testing' || story.status === 'done') {
        devProgressElement.style.display = 'block';
        devProgressBar.value = story.progress || 0;
        devProgressBar.max = 100;
        devPointsRemainingSpan.textContent = `${Math.round(story.remainingEffort)} pts`;
    } else { devProgressElement.style.display = 'none'; }

    if (story.status === 'testing' || story.status === 'done') {
        testProgressElement.style.display = 'block';
        testProgressBar.value = story.testingProgress || 0;
        testProgressBar.max = 100;
         testPointsRemainingSpan.textContent = `${Math.round(story.testingEffortRemaining)} pts`;
    } else { testProgressElement.style.display = 'none'; }

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
        let stateText = 'Unknown'; let stateClass = '';

        if (!worker.available) {
             const obstacleMsg = getObstacleMessageForWorker(worker.id);
             stateText = `Unavailable (${obstacleMsg})`;
             stateElement.style.color = '#e74c3c'; stateClass = 'unavailable';
        } else if (worker.isUnblocking && worker.assignedStory) { // NEW: Show unblocking status
            const blockedStory = GameState.getStory(worker.assignedStory);
            stateText = `Unblocking: ${blockedStory ? blockedStory.title.substring(0,15)+'...' : 'Unknown'}`;
            stateElement.style.color = '#f39c12'; // Orange for unblocking
            stateClass = 'unblocking'; // Use distinct state for border
        } else if (worker.assignedStory) {
            const assignedStory = GameState.getStory(worker.assignedStory);
             // Check if assigned story is blocked
             if (assignedStory?.isBlocked) {
                stateText = `Blocked on: ${assignedStory.title.substring(0,15)+'...'}`;
                stateElement.style.color = '#e74c3c'; // Red text for blocked worker
                stateClass = 'blocked'; // Use distinct state for border
             } else {
                stateText = `Working on: ${assignedStory ? assignedStory.title.substring(0,15)+'...' : 'Unknown'}`;
                stateElement.style.color = '#3498db'; // Blue text for working
                stateClass = 'working';
             }
        } else {
            stateText = `Idle (${worker.dailyPointsLeft} pts left)`;
            stateElement.style.color = '#2ecc71'; // Green text for idle
            stateClass = 'idle';
        }
        stateElement.textContent = stateText;
        workerElement.dataset.state = stateClass; // Controls left border color via CSS
        workerList.appendChild(workerElement);
    });
}

function getWorkerColor(workerId) {
    // Simple consistent color mapping based on worker ID
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
}

// NEW: Update WIP counts and visual indicators
export function updateWipDisplays() {
    const wipLimits = GameState.getWipLimits();
    const currentWip = GameState.getCurrentWip();

    const columns = [
        { id: 'inprogress', listId: 'inprogress-list' },
        { id: 'testing', listId: 'testing-list' }
    ];

    columns.forEach(colInfo => {
        const limit = wipLimits[colInfo.id];
        const count = currentWip[colInfo.id]; // Use state count directly

        // Update header display
        const headerElement = document.getElementById(`col-${colInfo.id}`);
        if (headerElement) {
            const countSpan = headerElement.querySelector('.wip-count');
            const maxSpan = headerElement.querySelector('.wip-max');
            const limitSpan = headerElement.querySelector('.wip-limit'); // The whole span element

            if (countSpan) countSpan.textContent = count;
            if (maxSpan) maxSpan.textContent = limit;
            if (limitSpan) {
                if (count > limit) {
                    limitSpan.classList.add('exceeded');
                } else {
                    limitSpan.classList.remove('exceeded');
                }
            }
        }

        // Update corresponding modal WIP info spans if they exist
         const modalWipInfo = document.getElementById(`${colInfo.id}-wip-info`);
         if (modalWipInfo) {
             const countSpan = modalWipInfo.querySelector('.wip-count');
             const maxSpan = modalWipInfo.querySelector('.wip-max');
             if (countSpan) countSpan.textContent = count;
             if (maxSpan) maxSpan.textContent = limit;
             if (count > limit) {
                 modalWipInfo.classList.add('exceeded'); // Use class for styling
             } else {
                  modalWipInfo.classList.remove('exceeded');
             }
         }

         // Update daily scrum modal WIP display spans
         const dailyWipCount = document.getElementById(`daily-wip-${colInfo.id}-count`);
         const dailyWipMax = document.getElementById(`daily-wip-${colInfo.id}-max`);
         const dailyWipSpan = document.getElementById(`daily-wip-${colInfo.id}`); // The surrounding span
         if(dailyWipCount) dailyWipCount.textContent = count;
         if(dailyWipMax) dailyWipMax.textContent = limit;
         if (dailyWipSpan) {
             if (count > limit) {
                 dailyWipSpan.classList.add('exceeded');
             } else {
                 dailyWipSpan.classList.remove('exceeded');
             }
         }
    });
}


export function updateCard(storyId, storyData) {
    const card = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
    if (card && storyData) {
        // Re-create the card content to ensure all elements are updated
        // This is slightly less efficient but more robust than updating individual elements
        const newCard = createStoryCard(storyData);
        if (newCard) {
            card.innerHTML = newCard.innerHTML; // Replace inner content
            // Re-apply styles/attributes that might be on the card element itself
            if (storyData.isBlocked) {
                card.style.borderLeftColor = 'orange';
                card.dataset.blocked = 'true';
            } else {
                card.style.borderLeftColor = 'transparent';
                card.dataset.blocked = 'false';
            }
             // Add aging attribute if needed
            if (storyData.daysInState > 2 && (storyData.status === 'inprogress' || storyData.status === 'testing') && !storyData.isBlocked) {
                 card.dataset.aging = 'true';
                 card.style.borderLeftColor = '#e74c3c'; // Use red for aging if not blocked
             } else if (!storyData.isBlocked) { // Reset aging border only if not blocked
                 card.dataset.aging = 'false';
                 card.style.borderLeftColor = 'transparent'; // Fallback to transparent if not blocked or aging
             }
        }
    } else { console.warn(`Card with ID ${storyId} not found for update or invalid data.`); }
}


export function moveCardToColumn(storyId, targetColumnId) {
    const card = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
    const targetList = document.getElementById(getColumnListId(targetColumnId));
    if (card && targetList) {
        if (card.parentElement !== targetList) {
            targetList.appendChild(card);
            console.log(`UI: Moved card ${storyId} to column ${targetColumnId}`);
        }
        // Update WIP counts AFTER the card has physically moved in the DOM/state
        // Note: GameState.updateStoryStatus triggers GameState.updateWipCount internally
        // Calling it here ensures the UI header reflects the latest counts.
        updateWipDisplays();
    } else {
         console.warn(`UI Error: Could not move card ${storyId} to column ${targetColumnId}. Card or list not found.`);
         renderAllColumns(); // Fallback: re-render everything
    }
}

function getColumnListId(columnId) {
    switch (columnId) {
        case 'backlog': return 'product-backlog-list';
        case 'ready': return 'sprint-backlog-list';
        case 'inprogress': return 'inprogress-list';
        case 'testing': return 'testing-list'; // Added
        case 'done': return 'done-list';
        default: console.error(`Unknown column ID: ${columnId}`); return null;
    }
}

export function renderAllColumns() {
    console.log("Re-rendering all columns...");
    renderProductBacklog(GameState.getProductBacklog());
    const allStories = Object.values(GameState.getAllStories());
    // Ensure sprint backlog only shows stories actually in the sprint backlog state array
    const sprintBacklogIds = GameState.getSprintBacklog().map(s => s.id);
    renderSprintBacklog(allStories.filter(s => s.status === 'ready' && sprintBacklogIds.includes(s.id)));
    renderInProgress(allStories.filter(s => s.status === 'inprogress'));
    renderTesting(allStories.filter(s => s.status === 'testing')); // Added
    renderDone(allStories.filter(s => s.status === 'done'));
    // updateWipDisplays(); // Called within renderStoryList now
}


// --- Modal Handling ---
export function showModal(modalElement) {
    if (modalElement && typeof modalElement.showModal === 'function') {
        if (!modalElement.open) {
             console.log(`>>> UI.showModal: Showing modal with ID: ${modalElement.id}`);
             modalElement.showModal();
        } else {
             console.log(`>>> UI.showModal: Modal ${modalElement.id} is already open.`);
        }
    } else {
        console.error(">>> UI.showModal Error: Invalid modal element or showModal not supported:", modalElement);
    }
}
export function closeModal(modalElement) { if (modalElement && typeof modalElement.close === 'function') { modalElement.close(); } }

// --- Specific Modal Content Updates ---

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
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.id = `plan-select-${story.id}`; checkbox.value = story.id;
        checkbox.checked = selectedIds.includes(story.id);
        // Use base effort initially, update if implementation chosen later
        checkbox.dataset.effort = story.baseEffort;
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = ` ${story.title} (Effort: ${story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort}, Value: ${story.value}⭐)`;
        checkbox.addEventListener('change', (event) => {
             const storyId = event.target.value; const isChecked = event.target.checked;
             const storyData = GameState.getStory(storyId);
             if (!storyData) { console.error(`Story data not found for ID ${storyId} during planning change.`); return; }
             let actionSuccess = false;
             if (isChecked) {
                 // Check for implementation choices *before* adding to sprint
                 if (storyData.implementationChoices && storyData.implementationChoices.length > 0 && !storyData.chosenImplementation) {
                     showProceduralChoiceModal(storyData); // Show choice modal
                     // Don't add to sprint yet, wait for choice confirmation
                     // Keep checkbox visually checked for now
                 } else {
                      // Add to sprint directly if no choices needed or already made
                      actionSuccess = GameState.addStoryToSprint(storyId);
                      if (actionSuccess) { moveCardToColumn(storyId, 'ready'); }
                      else { console.warn(`Add to sprint failed for ${storyId}, reverting checkbox.`); event.target.checked = false; }
                 }
             } else {
                 // Remove from sprint
                 actionSuccess = GameState.removeStoryFromSprint(storyId);
                  if (actionSuccess) { moveCardToColumn(storyId, 'backlog'); }
                  else { console.warn(`Remove from sprint failed for ${storyId}, reverting checkbox.`); event.target.checked = true; }
             }
             updateSprintPlanningUI(); // Update points display
        });
        div.appendChild(checkbox); div.appendChild(label); planningBacklogSelection.appendChild(div);
    });
     updateSprintPlanningUI();
}

export function updateSprintPlanningUI() {
    let selectedPoints = 0;
    const sprintStories = GameState.getSprintBacklog();
    sprintStories.forEach(story => {
        if (story) { selectedPoints += story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort; }
    });
    sprintSelectedPointsDisplay.textContent = selectedPoints;
    if (modalSelectedPointsDisplay) modalSelectedPointsDisplay.textContent = selectedPoints;
    const capacity = GameState.getTeamCapacity();
    if(capacityWarning) {
         capacityWarning.style.display = selectedPoints > capacity ? 'block' : 'none';
         capacityWarning.textContent = `Warning: Selected points (${selectedPoints}) exceed capacity (${capacity}). This may reduce efficiency.`;
    }

    // Update labels in planning modal if implementation choice changed effort
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
     const modal = document.getElementById('procedural-choice-modal');
     if (!modal || !story) return;
     choiceStoryTitle.textContent = `Choose Implementation for: ${story.title}`;
     choiceOptionsContainer.innerHTML = ''; modal.dataset.storyId = story.id;
     if (story.implementationChoices && story.implementationChoices.length > 0) {
         story.implementationChoices.forEach((choice, index) => {
             const div = document.createElement('div'); const radio = document.createElement('input');
             radio.type = 'radio'; radio.name = `choice-${story.id}`; radio.id = `choice-${story.id}-${index}`; radio.value = index;
             if (index === 0) radio.checked = true;
             const label = document.createElement('label'); label.htmlFor = radio.id;
             label.textContent = ` ${choice.description} (Effort: ${choice.effort}, Impact: ${choice.impact})`;
             div.appendChild(radio); div.appendChild(label); choiceOptionsContainer.appendChild(div);
         });
     } else { choiceOptionsContainer.innerHTML = '<p>No implementation choices available.</p>'; }
     showModal(modal);
}

export function populateWorkerAssignmentModal(storiesToAssign, availableWorkers) {
    if (!assignmentListContainer) return;
    assignmentListContainer.innerHTML = '';
    updateWipDisplays(); // Ensure WIP info is current before populating

    if (storiesToAssign.length === 0) { assignmentListContainer.innerHTML = '<p>No stories in the Sprint Backlog require assignment.</p>'; return; }

    const assignedInModal = new Set(); // Track workers assigned within this modal session
    const wipLimits = GameState.getWipLimits();
    const currentWip = GameState.getCurrentWip();

    storiesToAssign.forEach(story => {
        if (!story) return;
        const storyDiv = document.createElement('div'); storyDiv.className = 'assignment-item';
        storyDiv.innerHTML = `<strong>${story.title}</strong> (Effort: ${story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort}) <br> Tags: ${story.tags.join(', ')} <br>`;

        const selectLabel = document.createElement('label'); selectLabel.textContent = 'Assign Worker: '; selectLabel.htmlFor = `assign-${story.id}`;
        const selectWorker = document.createElement('select'); selectWorker.id = `assign-${story.id}`; selectWorker.dataset.storyId = story.id;

        const noneOption = document.createElement('option'); noneOption.value = ''; noneOption.textContent = '-- Select Available Worker --';
        selectWorker.appendChild(noneOption);

        // Check if assigning this story would break WIP limit for 'inprogress' *predictively*
        const wouldExceedWip = (currentWip.inprogress + assignedInModal.size) >= wipLimits.inprogress;

        availableWorkers.forEach(worker => {
            // Only allow Devs (non-Testers) to be assigned here (to Ready stories -> InProgress)
            if (worker.area !== 'Testing') {
                const option = document.createElement('option'); option.value = worker.id;
                const specialtyMatch = story.tags.includes(worker.area);
                option.textContent = `${worker.name} (${worker.area} ${worker.skill} - ${worker.pointsPerDay} pts)${specialtyMatch ? ' ✨' : ''}`;
                 // Initial disable: worker assigned elsewhere in modal OR assigning *any* worker would break limit
                option.disabled = assignedInModal.has(worker.id) || wouldExceedWip;
                selectWorker.appendChild(option);
            }
        });

         // Add warning if WIP limit is the reason for disabling options
         if (wouldExceedWip && availableWorkers.some(w => w.area !== 'Testing')) {
             const warningSpan = document.createElement('span');
             warningSpan.className = 'wip-limit-warning'; // Add class for easier removal/update
             warningSpan.textContent = ' (WIP Limit Reached)';
             warningSpan.style.color = 'red';
             warningSpan.style.fontSize = '0.9em';
             storyDiv.appendChild(warningSpan);
         }


        selectWorker.addEventListener('change', (event) => {
            const selectedWorkerId = event.target.value;
            const previousWorkerId = event.target.dataset.currentlySelected; // Get previously selected in this specific dropdown

            // Update the set of workers assigned within the modal
            if (previousWorkerId) { assignedInModal.delete(previousWorkerId); }
            if (selectedWorkerId) { assignedInModal.add(selectedWorkerId); }
            event.target.dataset.currentlySelected = selectedWorkerId; // Store current selection for this dropdown

             // Re-evaluate predictive WIP limit based on current modal assignments
            const currentModalWipCount = currentWip.inprogress + assignedInModal.size;
            const wipLimitReachedNow = currentModalWipCount >= wipLimits.inprogress;

            // Update disable state of options in *all* select dropdowns
            const allSelects = assignmentListContainer.querySelectorAll('select');
            allSelects.forEach(sel => {
                const currentSelectionInOther = sel.value; // The worker currently selected in *that* dropdown
                 // Find the warning span for this select's story item, if it exists
                 const itemDiv = sel.closest('.assignment-item');
                 let warningSpan = itemDiv ? itemDiv.querySelector('.wip-limit-warning') : null;

                Array.from(sel.options).forEach(opt => {
                    if (opt.value) { // Skip the "-- Select --" option
                         // Disable if:
                         // 1. The worker is assigned elsewhere in the modal (and not the current selection of this dropdown)
                         // 2. Selecting *any* available worker would break the WIP limit (unless it's the worker already selected for this dropdown)
                        const workerAlreadyAssigned = assignedInModal.has(opt.value) && opt.value !== currentSelectionInOther;
                        // Disable if limit reached AND the option is not the currently selected one (allows keeping current selection even if over limit temp)
                        opt.disabled = workerAlreadyAssigned || (wipLimitReachedNow && opt.value !== currentSelectionInOther);
                    }
                });

                // Update or add/remove the warning span for the current select element's item
                if (itemDiv) {
                    if (wipLimitReachedNow && !currentSelectionInOther) { // WIP limit reached and no one selected for this item yet
                        if (!warningSpan) {
                            warningSpan = document.createElement('span');
                            warningSpan.className = 'wip-limit-warning'; // Add class for potential removal
                            warningSpan.textContent = ' (WIP Limit Reached)';
                            warningSpan.style.color = 'red';
                            warningSpan.style.fontSize = '0.9em';
                            itemDiv.appendChild(warningSpan);
                        }
                        warningSpan.style.display = 'inline'; // Ensure visible
                    } else if (warningSpan) {
                        warningSpan.style.display = 'none'; // Hide warning if limit not reached or someone selected
                    }
                }
            });
        });

        storyDiv.appendChild(selectLabel); storyDiv.appendChild(selectWorker);
        assignmentListContainer.appendChild(storyDiv);
    });
}


// Populate Daily Scrum modal - NOW for Day 2 Reassignment & Blocker Resolution
export function populateDailyScrumModal(day, workers, activeObstacles, storiesInProgressOrTesting) {
    const modal = document.getElementById('daily-scrum-modal');
    if (!modal) return;
    modal.querySelector('h2').textContent = `Daily Scrum & Reassignment - Day ${day}`;
    updateWipDisplays(); // Ensure WIP counts in modal header are correct
    if (unblockingCostSpan) unblockingCostSpan.textContent = GameState.UNBLOCKING_COST; // Update cost display

    // Display Obstacles
    obstacleDisplay.innerHTML = '';
    if (activeObstacles && activeObstacles.length > 0) {
        obstacleDisplay.innerHTML = '<strong>Obstacles Today:</strong><ul>' + activeObstacles.map(obs => `<li>${obs.message}</li>`).join('') + '</ul>';
    } else { obstacleDisplay.innerHTML = 'No new obstacles today.'; }

    reassignmentListContainer.innerHTML = ''; // Clear previous list
    blockerResolutionList.innerHTML = ''; // Clear previous blocker list

    const storiesToDisplay = Object.values(GameState.getAllStories())
                                   .filter(s => s.status === 'inprogress' || s.status === 'testing');
    const blockedStories = storiesToDisplay.filter(s => s.isBlocked);
    const unblockedActiveStories = storiesToDisplay.filter(s => !s.isBlocked);

    const wipLimits = GameState.getWipLimits();
    const currentWip = GameState.getCurrentWip();
    const availableWorkers = GameState.getAvailableWorkers(); // Workers not assigned and available
    const availableSeniorDevs = GameState.getAvailableSeniorDevs(); // For unblocking

    // Store workers assigned in this modal session to prevent double-booking
    // Needs to track both reassignments and unblocking assignments
    const assignedInModal = new Set();
    // Pre-populate with workers already assigned to the stories being displayed
    storiesToDisplay.forEach(story => {
         if (story?.assignedWorker && !story.isBlocked) { // Only count assignments to non-blocked stories initially
              assignedInModal.add(story.assignedWorker);
         }
    });


    // --- Populate Reassignment Section ---
    const reassignmentSection = document.getElementById('reassignment-section');
    if (unblockedActiveStories.length === 0) {
        reassignmentListContainer.innerHTML = '<p>No active (unblocked) stories to reassign.</p>';
        reassignmentSection.style.display = 'block'; // Ensure section is visible even if empty
    } else {
        reassignmentSection.style.display = 'block'; // Ensure section is visible

        unblockedActiveStories.forEach(story => {
            const itemDiv = document.createElement('div'); itemDiv.className = 'reassignment-item';
            const currentWorker = story.assignedWorker ? GameState.getWorkerById(story.assignedWorker) : null;
            const currentWorkerName = currentWorker ? currentWorker.name : 'None';
            const storyEffortText = story.status === 'testing' ? `Test Left: ${story.testingEffortRemaining}` : `Dev Left: ${story.remainingEffort}`;
            const ageText = story.daysInState > 0 ? ` (Age: ${story.daysInState}d)` : '';
            itemDiv.innerHTML = `<strong>${story.title}</strong> (${storyEffortText}) <br> Status: ${story.status}${ageText} <span class="reassignment-current">(Currently: ${currentWorkerName})</span> <br>`;

            const selectLabel = document.createElement('label'); selectLabel.textContent = 'Assign Worker: '; selectLabel.htmlFor = `reassign-${story.id}`;
            const selectWorker = document.createElement('select'); selectWorker.id = `reassign-${story.id}`; selectWorker.dataset.storyId = story.id; selectWorker.dataset.initialWorker = story.assignedWorker || ''; selectWorker.dataset.storyStatus = story.status; // Store status for WIP check

            const noneOption = document.createElement('option'); noneOption.value = '';
            noneOption.textContent = currentWorker ? `-- Keep ${currentWorkerName} --` : '-- Select Available Worker --';
            selectWorker.appendChild(noneOption);

            // Combine available workers + the currently assigned worker (if any and usable)
            const potentialWorkers = [...availableWorkers];
            if (currentWorker && currentWorker.available && !currentWorker.isUnblocking && !potentialWorkers.some(w => w.id === currentWorker.id)) {
                potentialWorkers.push(currentWorker);
            }

            potentialWorkers.forEach(worker => {
                // Determine if worker role matches story status
                 const canWork = (worker.area !== 'Testing' && story.status === 'inprogress') || (worker.area === 'Testing' && story.status === 'testing');

                 if (canWork) {
                    const option = document.createElement('option'); option.value = worker.id;
                    const specialtyMatch = story.tags.includes(worker.area);
                    option.textContent = `${worker.name} (${worker.area} ${worker.skill} - ${worker.pointsPerDay} pts)${specialtyMatch ? ' ✨' : ''}`;

                    // Initial disable check: worker assigned elsewhere in modal (either reassignment or unblocking)?
                    option.disabled = assignedInModal.has(worker.id) && worker.id !== story.assignedWorker;
                    selectWorker.appendChild(option);
                 }
            });

            // Add event listener for dynamic disabling based on modal selections and WIP
            selectWorker.addEventListener('change', () => {
                updateDailyScrumModalOptions(assignedInModal); // Call helper to update all dropdowns
            });

            itemDiv.appendChild(selectLabel); itemDiv.appendChild(selectWorker);
            reassignmentListContainer.appendChild(itemDiv);
        }); // End forEach unblocked story
    }


    // --- Populate Blocker Resolution Section ---
     const blockerSection = document.getElementById('blocker-resolution-section');
    if (blockedStories.length > 0) {
        blockerSection.style.display = 'block';
        blockerResolutionList.innerHTML = ''; // Clear previous

        blockedStories.forEach(story => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'blocker-assignment-item';
             const ageText = story.daysInState > 0 ? ` (Blocked ${story.daysInState}d)` : '';
            itemDiv.innerHTML = `<strong>${story.title}</strong> <span style="color: orange;">[BLOCKED]</span>${ageText}<br>`;

            const selectLabel = document.createElement('label');
            selectLabel.htmlFor = `unblock-assign-${story.id}`;
            selectLabel.textContent = 'Assign Senior Dev: ';

            const selectWorker = document.createElement('select');
            selectWorker.id = `unblock-assign-${story.id}`;
            selectWorker.dataset.storyId = story.id; // Store story ID

            const noneOption = document.createElement('option');
            noneOption.value = '';
            noneOption.textContent = '-- Select Available Senior --';
            selectWorker.appendChild(noneOption);

            availableSeniorDevs.forEach(worker => {
                 const option = document.createElement('option');
                 option.value = worker.id;
                 option.textContent = `${worker.name} (${worker.skill} ${worker.area} - ${worker.pointsPerDay} pts)`;
                 // Initial disable: worker assigned elsewhere in modal OR doesn't have points
                 option.disabled = assignedInModal.has(worker.id) || worker.dailyPointsLeft < GameState.UNBLOCKING_COST;
                 selectWorker.appendChild(option);
            });

             selectWorker.addEventListener('change', () => {
                 updateDailyScrumModalOptions(assignedInModal); // Call helper to update all dropdowns
             });

            itemDiv.appendChild(selectLabel);
            itemDiv.appendChild(selectWorker);
            blockerResolutionList.appendChild(itemDiv);
        });
    } else {
         blockerSection.style.display = 'none';
    }

    // Initial update after populating
    updateDailyScrumModalOptions(assignedInModal);

}

// Helper function to update all dropdown options in the Daily Scrum modal
function updateDailyScrumModalOptions(assignedInModalSet) {
    const allReassignSelects = reassignmentListContainer.querySelectorAll('select');
    const allBlockerSelects = blockerResolutionList.querySelectorAll('select');

    // Clear and rebuild the set of assigned workers based on current selections
    assignedInModalSet.clear();
    allReassignSelects.forEach(sel => { if (sel.value) assignedInModalSet.add(sel.value); });
    allBlockerSelects.forEach(sel => { if (sel.value) assignedInModalSet.add(sel.value); });

    // Recalculate projected WIP based on current selections
    const wipLimits = GameState.getWipLimits();
    const currentWip = GameState.getCurrentWip();
    let projectedWipInProgress = currentWip.inprogress;
    let projectedWipTesting = currentWip.testing;
    const initialAssignments = {}; // Store initial assignments {storyId: workerId}

    allReassignSelects.forEach(sel => { initialAssignments[sel.dataset.storyId] = sel.dataset.initialWorker; });

    allReassignSelects.forEach(sel => {
        const storyId = sel.dataset.storyId;
        const selInitial = initialAssignments[storyId];
        const selCurrent = sel.value;
        const selStatus = sel.dataset.storyStatus;

        if (selCurrent !== selInitial) {
            if (selInitial) {
                const initialWorker = GameState.getWorkerById(selInitial);
                if (initialWorker) {
                    if (selStatus === 'inprogress' && initialWorker.area !== 'Testing') projectedWipInProgress--;
                    if (selStatus === 'testing' && initialWorker.area === 'Testing') projectedWipTesting--;
                }
            }
            if (selCurrent) {
                const currentWorker = GameState.getWorkerById(selCurrent);
                if (currentWorker) {
                    if (selStatus === 'inprogress' && currentWorker.area !== 'Testing') projectedWipInProgress++;
                    if (selStatus === 'testing' && currentWorker.area === 'Testing') projectedWipTesting++;
                }
            }
        }
    });
    projectedWipInProgress = Math.max(0, projectedWipInProgress);
    projectedWipTesting = Math.max(0, projectedWipTesting);

    // Update Reassignment Selects
    allReassignSelects.forEach(sel => {
        const currentSelection = sel.value;
        const initialWorkerId = sel.dataset.initialWorker;
        const storyStatus = sel.dataset.storyStatus;
        Array.from(sel.options).forEach(opt => {
            if (opt.value) {
                let disableOpt = false;
                // Assigned elsewhere in modal?
                if (assignedInModalSet.has(opt.value) && opt.value !== currentSelection) {
                    disableOpt = true;
                }
                // Would break projected WIP limit if changing?
                if (!disableOpt && opt.value !== initialWorkerId) { // Only check WIP if changing assignment
                     const workerToAdd = GameState.getWorkerById(opt.value);
                     if (workerToAdd) {
                        if (storyStatus === 'inprogress' && workerToAdd.area !== 'Testing' && projectedWipInProgress >= wipLimits.inprogress) disableOpt = true;
                        if (storyStatus === 'testing' && workerToAdd.area === 'Testing' && projectedWipTesting >= wipLimits.testing) disableOpt = true;
                     }
                }
                opt.disabled = disableOpt;
            }
        });
    });

    // Update Blocker Selects
    allBlockerSelects.forEach(sel => {
        const currentSelection = sel.value;
        Array.from(sel.options).forEach(opt => {
            if (opt.value) {
                const worker = GameState.getWorkerById(opt.value);
                opt.disabled = (assignedInModalSet.has(opt.value) && opt.value !== currentSelection) || (worker && worker.dailyPointsLeft < GameState.UNBLOCKING_COST);
            }
        });
    });
}


export function populateSprintReviewModal(sprintNum, completedStories, velocity, totalValue, avgCycleTime, sponsorFeedback, dodProgressFeedback) {
    modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
    reviewCompletedList.innerHTML = '';
    completedStories.forEach(story => { const li = document.createElement('li'); li.textContent = `${story.title} (Effort: ${story.baseEffort}, Value: ${story.value}⭐)`; reviewCompletedList.appendChild(li); });
    reviewVelocityDisplay.textContent = velocity;
    reviewValueDisplay.textContent = totalValue;
    reviewCycleTimeDisplay.textContent = avgCycleTime !== null ? `${avgCycleTime} days` : 'N/A'; // Display Cycle Time
    reviewSponsorFeedback.textContent = sponsorFeedback || "The sponsor is reviewing the progress...";
    reviewDodProgressDisplay.textContent = dodProgressFeedback || ""; // Display DoD Progress

    reviewStorybookPreview.innerHTML = '';
    // Sort completed stories for preview if desired
    const storyOrder = [ "Cover", "Introduce", "Finds Cottage", "Cottage Visual", "Porridge", "Chair", "Bed", "Return", "Discover", "Wakes", "End", "Back Cover"];
    const sortedCompleted = [...completedStories].sort((a, b) => {
        const indexA = storyOrder.findIndex(prefix => a.title.includes(prefix));
        const indexB = storyOrder.findIndex(prefix => b.title.includes(prefix));
        const effectiveIndexA = indexA === -1 ? 99 : indexA;
        const effectiveIndexB = indexB === -1 ? 99 : indexB;
        return effectiveIndexA - effectiveIndexB;
    });
    sortedCompleted.forEach(story => { const pagePreview = createStorybookPagePreview(story); if (pagePreview) { reviewStorybookPreview.appendChild(pagePreview); } });
    showModal(document.getElementById('sprint-review-modal'));
}


export function populateRetrospectiveModal(sprintNum) {
     modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
     document.getElementById('retro-form').reset(); // Reset text areas
     // Clear previous text area values explicitly if reset doesn't work reliably
     document.getElementById('retro-well').value = '';
     document.getElementById('retro-improve').value = '';
     document.getElementById('retro-change').value = '';

     if (sprintNum >= 3) { endGameBtn.style.display = 'inline-block'; document.querySelector('#retro-form button[type="submit"]').style.display = 'none'; }
     else { endGameBtn.style.display = 'none'; document.querySelector('#retro-form button[type="submit"]').style.display = 'inline-block'; }
     showModal(document.getElementById('sprint-retrospective-modal'));
}

export function populateFinalStorybook(completedStories) {
    finalStorybookPages.innerHTML = '';
    const dodStatusDiv = document.createElement('div');
    // Use existing styles from CSS for this element
    const chosenDoD = GameState.getChosenDoD(); const dodMet = GameState.getDodMetStatus(); const bonusPoints = GameState.getDoDBonusPoints(); const dodDef = GameState.getDodDefinition(chosenDoD);

    if (chosenDoD && dodDef) {
        dodStatusDiv.innerHTML = `<h3 style="margin-bottom: 10px;">Goal: ${dodDef.name}</h3>`;
        if (dodMet) { dodStatusDiv.innerHTML += `<p style="color: green; font-weight: bold;">Congratulations! You met the Definition of Done!</p><p>Bonus Points Awarded: +${bonusPoints}</p>`; }
        else {
            dodStatusDiv.innerHTML += `<p style="color: red; font-weight: bold;">Definition of Done Not Met.</p>`;
            const missingIds = GameState.getMissingDodStories();
            if (missingIds.length > 0) {
                dodStatusDiv.innerHTML += `<p>Missing Required Stories:</p><ul style="margin-top: 5px; padding-left: 20px;">`;
                missingIds.forEach(id => { const story = GameState.getStory(id); dodStatusDiv.innerHTML += `<li>${story ? story.title : id}</li>`; });
                dodStatusDiv.innerHTML += `</ul>`;
            }
        }
    } else { dodStatusDiv.innerHTML = '<p>No Definition of Done was set.</p>'; }
    finalStorybookPages.appendChild(dodStatusDiv);

    if (completedStories.length === 0) { finalStorybookPages.innerHTML += "<p>Oh no! It looks like no pages of the storybook were completed.</p>"; }
    else {
        const storyOrder = [ "Cover", "Introduce", "Finds Cottage", "Cottage Visual", "Porridge", "Chair", "Bed", "Return", "Discover", "Wakes", "End", "Back Cover"];
        const sortedStories = [...completedStories].sort((a, b) => { // Use spread to avoid modifying original array
            const indexA = storyOrder.findIndex(prefix => a.title.includes(prefix));
            const indexB = storyOrder.findIndex(prefix => b.title.includes(prefix));
            const effectiveIndexA = indexA === -1 ? 99 : indexA;
            const effectiveIndexB = indexB === -1 ? 99 : indexB;
            return effectiveIndexA - effectiveIndexB;
         });
        sortedStories.forEach(story => { const page = createStorybookPagePreview(story, true); if (page) { finalStorybookPages.appendChild(page); } });
    }
    showModal(document.getElementById('final-storybook-modal'));
}


function createStorybookPagePreview(story, isFinal = false) {
    if (!story) return null;
    const pageDiv = document.createElement('div'); pageDiv.classList.add('storybook-page-preview');
    if (isFinal) pageDiv.style.maxWidth = '300px'; // Adjust size for final view maybe

    const title = document.createElement('h5'); title.textContent = story.title; pageDiv.appendChild(title);

    const imageUrl = selectImageForStory(story.id, story.chosenImplementation);
    const imgContainer = document.createElement('div'); // Container for image
    imgContainer.style.flexGrow = '1'; // Allow container to grow
    imgContainer.style.display = 'flex';
    imgContainer.style.alignItems = 'center';
    imgContainer.style.justifyContent = 'center';
    imgContainer.style.minHeight = '80px'; // Ensure space even if no image/text

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl; img.alt = story.title;
        // Apply styles directly for simplicity or use CSS classes
        img.style.maxWidth = '100%'; img.style.maxHeight = '100px';
        img.style.height = 'auto'; img.style.borderRadius = '3px';
        img.style.objectFit = 'contain';
        imgContainer.appendChild(img);
    } else if (story.tags.includes('Visual')) {
         const placeholder = document.createElement('p');
         placeholder.textContent = '[Visual Story - Image Missing]';
         placeholder.style.color = '#aaa';
         placeholder.style.fontStyle = 'italic';
         imgContainer.appendChild(placeholder);
    }
    pageDiv.appendChild(imgContainer);


    const textContainer = document.createElement('div'); // Container for text
    textContainer.style.marginTop = 'auto'; // Push text towards bottom
    if (story.chosenImplementation && story.chosenImplementation.impact) {
        const desc = document.createElement('p'); desc.textContent = story.chosenImplementation.impact; textContainer.appendChild(desc);
    } else if (!story.tags.includes('Visual') && story.story) { // Show base story text if not primarily visual and has text
        const desc = document.createElement('p'); desc.textContent = story.story; textContainer.appendChild(desc);
    } else if (!imageUrl && !story.tags.includes('Visual') && !story.story) {
         // Fallback for non-visual story with no text? Shouldn't happen often.
         textContainer.appendChild(document.createTextNode('[Text missing]'));
    }
     pageDiv.appendChild(textContainer);

    return pageDiv;
}

// --- Button/State Updates ---
export function updateButtonVisibility(dayState) {
    const phaseName = GameState.getPhaseName(dayState);
    nextDayBtn.style.display = 'none'; // Hide by default
    // Show 'Next Day' button only at the end of work phases
    if (phaseName === 'Day 1 Work') {
        nextDayBtn.style.display = 'inline-block';
        nextDayBtn.textContent = 'Proceed to Day 2 Reassignment';
    } else if (phaseName === 'Day 2 Work') {
        nextDayBtn.style.display = 'inline-block';
        nextDayBtn.textContent = 'End Sprint / Go to Review';
    }
}

// --- Obstacle Related ---
function getObstacleMessageForWorker(workerId) {
    const obstacles = GameState.getActiveObstacles ? GameState.getActiveObstacles() : [];
    // Find the *active* obstacle affecting the worker today
    const workerObstacle = obstacles.find(obs => obs.targetWorkerId === workerId && obs.type === 'capacity_reduction'); // Duration checked in gameState advanceDay
    const worker = GameState.getWorkerById(workerId);

    if (worker && !worker.available && workerObstacle && workerObstacle.makesUnavailable) {
         return workerObstacle.shortMessage || 'Unavailable';
    } else if (workerObstacle) {
        // If affected but available, show message but don't mark as 'Unavailable' state
        // The worker state function will show 'Idle (X pts left)' or 'Working'
        // We only return the short message if they are *truly* unavailable due to the obstacle
        return ''; // Don't return message if worker is still available
    } else if (worker && !worker.available) {
        // If unavailable but no specific obstacle message found (e.g., maybe unblocking failed?)
        return 'Unavailable';
    }
    // If available or no obstacle, this function shouldn't be called for unavailability message
    return '';
}