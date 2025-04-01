// --- START OF FILE ui.js ---

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
const obstacleDisplay = document.getElementById('obstacle-display'); // In Reassignment modal now
const choiceStoryTitle = document.getElementById('choice-story-title');
const choiceOptionsContainer = document.getElementById('choice-options');
const nextDayBtn = document.getElementById('next-day-btn');
const endGameBtn = document.getElementById('end-game-btn');
const workerAssignmentModal = document.getElementById('worker-assignment-modal');
const assignmentListContainer = document.getElementById('assignment-list');
const reassignmentListContainer = document.getElementById('reassignment-list'); // Reassignment container
const dodChoiceModal = document.getElementById('dod-choice-modal');
const dodForm = document.getElementById('dod-form');
const bonusPointsEasy = document.querySelector('.bonus-points-easy');
const bonusPointsMedium = document.querySelector('.bonus-points-medium');
const bonusPointsHard = document.querySelector('.bonus-points-hard');
const reviewCycleTimeDisplay = document.getElementById('review-cycle-time'); // Cycle Time display
const reviewDodProgressDisplay = document.getElementById('review-dod-progress'); // DoD Progress display
const blockerResolutionList = document.getElementById('blocker-assignment-list'); // Blocker section
const unblockingCostSpan = document.getElementById('unblocking-cost'); // Span for unblocking cost


// --- Rendering Functions ---

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
    // Show age only if active and has workers
    if ((story.status === 'inprogress' || story.status === 'testing') && story.assignedWorkers.length > 0 && typeof story.daysInState === 'number' && story.daysInState > 0) {
        ageSpan.textContent = `Age: ${story.daysInState}d`;
        ageSpan.style.display = 'inline';
        if (story.daysInState > 2) { // Highlight old items
            ageSpan.style.fontWeight = 'bold';
            ageSpan.style.color = '#e74c3c';
            ageSpan.classList.add('aging');
        } else {
            ageSpan.style.fontWeight = 'normal';
            ageSpan.style.color = '#999';
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

    // --- Worker Assignment Display (CHANGED) ---
    const workerSpan = card.querySelector('.story-worker'); // The SPAN element inside the "Assigned:" div
    const assignmentDiv = card.querySelector('.story-assignment'); // The main DIV
    if (story.assignedWorkers && story.assignedWorkers.length > 0) {
        workerSpan.innerHTML = ''; // Clear default "None"
        story.assignedWorkers.forEach((workerId, index) => {
            const worker = GameState.getWorkerById(workerId);
            if(worker) {
                const workerPill = document.createElement('span');
                workerPill.classList.add('worker-pill');
                workerPill.style.backgroundColor = getWorkerColor(workerId);
                workerPill.textContent = worker.name.split(' ')[0]; // Show first name
                workerPill.title = `${worker.name} (${worker.area} ${worker.skill})`; // Tooltip
                workerSpan.appendChild(workerPill);
            }
        });
    } else {
         workerSpan.textContent = 'None'; // Keep default if no workers
    }
    // --- End Worker Assignment Display ---


    // Blocker Display
    const blockerInfo = card.querySelector('.blocker-info');
    if (story.isBlocked) {
        blockerInfo.style.display = 'block';
        card.style.borderLeftColor = 'orange';
        card.dataset.blocked = 'true';
    } else {
        blockerInfo.style.display = 'none';
        card.style.borderLeftColor = 'transparent';
        card.dataset.blocked = 'false';
    }

    const devProgressElement = card.querySelector('.story-progress');
    const devProgressBar = card.querySelector('.dev-progress');
    const devPointsRemainingSpan = card.querySelector('.dev-points-remaining');
    const testProgressElement = card.querySelector('.story-testing-progress');
    const testProgressBar = card.querySelector('.test-progress');
    const testPointsRemainingSpan = card.querySelector('.test-points-remaining');

    // Show progress if it has started or completed
    if (story.progress > 0 || story.status === 'testing' || story.status === 'done') {
        devProgressElement.style.display = 'block';
        devProgressBar.value = story.progress || 0;
        devProgressBar.max = 100;
        devPointsRemainingSpan.textContent = `${Math.round(story.remainingEffort)} pts`;
    } else { devProgressElement.style.display = 'none'; }

    if (story.testingProgress > 0 || story.status === 'done') {
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
        } else if (worker.isUnblocking && worker.assignedStory) { // Unblocking takes precedence
            const blockedStory = GameState.getStory(worker.assignedStory);
            stateText = `Unblocking: ${blockedStory ? blockedStory.title.substring(0,15)+'...' : 'Unknown'}`;
            stateElement.style.color = '#f39c12';
            stateClass = 'unblocking';
        } else if (worker.assignedStory) { // Worker is assigned (focused on) a story
            const assignedStory = GameState.getStory(worker.assignedStory);
             if (assignedStory?.isBlocked) { // Check if the focused story is blocked
                stateText = `Blocked on: ${assignedStory.title.substring(0,15)+'...'}`;
                stateElement.style.color = '#e74c3c';
                stateClass = 'blocked';
             } else {
                stateText = `Working on: ${assignedStory ? assignedStory.title.substring(0,15)+'...' : 'Unknown'}`;
                stateElement.style.color = '#3498db';
                stateClass = 'working';
             }
        } else { // Worker is idle (available and not assigned)
            stateText = `Idle (${worker.dailyPointsLeft} pts left)`;
            stateElement.style.color = '#2ecc71';
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

export function updateWipDisplays() {
    const wipLimits = GameState.getWipLimits();
    const currentWip = GameState.getCurrentWip(); // Uses counts from GameState

    const columns = [
        { id: 'inprogress', listId: 'inprogress-list' },
        { id: 'testing', listId: 'testing-list' }
    ];

    columns.forEach(colInfo => {
        const limit = wipLimits[colInfo.id];
        const count = currentWip[colInfo.id]; // Use state count

        // Update header display
        const headerElement = document.getElementById(`col-${colInfo.id}`);
        if (headerElement) {
            const countSpan = headerElement.querySelector('.wip-count');
            const maxSpan = headerElement.querySelector('.wip-max');
            const limitSpan = headerElement.querySelector('.wip-limit');

            if (countSpan) countSpan.textContent = count;
            if (maxSpan) maxSpan.textContent = limit;
            if (limitSpan) {
                limitSpan.classList.toggle('exceeded', count > limit);
            }
        }

        // Update corresponding modal WIP info spans
         const modalWipInfo = document.getElementById(`${colInfo.id}-wip-info`);
         if (modalWipInfo) {
             const countSpan = modalWipInfo.querySelector('.wip-count');
             const maxSpan = modalWipInfo.querySelector('.wip-max');
             if (countSpan) countSpan.textContent = count;
             if (maxSpan) maxSpan.textContent = limit;
             modalWipInfo.classList.toggle('exceeded', count > limit);
         }

         // Update daily scrum modal WIP display spans
         const dailyWipCount = document.getElementById(`daily-wip-${colInfo.id}-count`);
         const dailyWipMax = document.getElementById(`daily-wip-${colInfo.id}-max`);
         const dailyWipSpan = document.getElementById(`daily-wip-${colInfo.id}`);
         if(dailyWipCount) dailyWipCount.textContent = count;
         if(dailyWipMax) dailyWipMax.textContent = limit;
         if (dailyWipSpan) {
             dailyWipSpan.classList.toggle('exceeded', count > limit);
         }
    });
}


export function updateCard(storyId, storyData) {
    const card = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
    if (card && storyData) {
        // Re-create the card content to ensure all elements are updated
        const newCard = createStoryCard(storyData);
        if (newCard) {
            card.innerHTML = newCard.innerHTML; // Replace inner content
            // Re-apply styles/attributes that might be on the card element itself
            card.style.borderLeftColor = storyData.isBlocked ? 'orange' : 'transparent';
            card.dataset.blocked = storyData.isBlocked ? 'true' : 'false';

             // Apply aging border if applicable and not blocked
             const isAging = storyData.daysInState > 2 && (storyData.status === 'inprogress' || storyData.status === 'testing') && storyData.assignedWorkers.length > 0;
             if (isAging && !storyData.isBlocked) {
                 card.dataset.aging = 'true';
                 card.style.borderLeftColor = '#e74c3c'; // Red for aging
             } else if (!storyData.isBlocked) { // Reset aging border only if not blocked
                 card.dataset.aging = 'false';
                 // Border color already set based on blocked status
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
        // WIP counts are updated via GameState.updateStoryStatus -> GameState.updateWipCount
        // Calling updateWipDisplays ensures UI headers reflect the latest state.
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
    const sprintBacklogIds = GameState.getSprintBacklog().map(s => s.id);
    renderSprintBacklog(allStories.filter(s => s.status === 'ready' && sprintBacklogIds.includes(s.id)));
    renderInProgress(allStories.filter(s => s.status === 'inprogress'));
    renderTesting(allStories.filter(s => s.status === 'testing'));
    renderDone(allStories.filter(s => s.status === 'done'));
    // updateWipDisplays(); // Called within renderStoryList
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
    } else { console.error(">>> UI.showModal Error: Invalid modal element or showModal not supported:", modalElement); }
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
                 if (storyData.implementationChoices && storyData.implementationChoices.length > 0 && !storyData.chosenImplementation) {
                     showProceduralChoiceModal(storyData); // Show choice modal
                 } else {
                      actionSuccess = GameState.addStoryToSprint(storyId);
                      if (actionSuccess) { moveCardToColumn(storyId, 'ready'); }
                      else { event.target.checked = false; } // Revert checkbox
                 }
             } else {
                 actionSuccess = GameState.removeStoryFromSprint(storyId);
                  if (actionSuccess) { moveCardToColumn(storyId, 'backlog'); }
                  else { event.target.checked = true; } // Revert checkbox
             }
             updateSprintPlanningUI();
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

// --- Populate Worker Assignment Modal (Day 1) --- CHANGED for multi-select
export function populateWorkerAssignmentModal(storiesToAssign, allWorkers) {
    if (!assignmentListContainer) return;
    assignmentListContainer.innerHTML = '';
    updateWipDisplays(); // Ensure WIP info is current before populating

    if (storiesToAssign.length === 0) {
        assignmentListContainer.innerHTML = '<p>No stories in the Sprint Backlog require assignment.</p>';
        return;
    }

    const wipLimits = GameState.getWipLimits();
    const assignedInModal = new Set(); // Track workers assigned within this modal session to any story

    storiesToAssign.forEach(story => {
        if (!story) return;
        const storyDiv = document.createElement('div');
        storyDiv.className = 'assignment-item multi-assign-item'; // Add class for styling
        storyDiv.dataset.storyId = story.id;
        storyDiv.innerHTML = `<strong>${story.title}</strong> (Effort: ${story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort}) <br> Tags: ${story.tags.join(', ')} <br> <label>Assign Workers:</label>`;

        const workerCheckboxContainer = document.createElement('div');
        workerCheckboxContainer.className = 'worker-checkbox-container';

        const suitableWorkers = allWorkers.filter(w => w.area !== 'Testing'); // Only Devs for Ready -> InProgress

        if (suitableWorkers.length === 0) {
            workerCheckboxContainer.innerHTML = '<small>No suitable (Dev) workers available.</small>';
        } else {
            suitableWorkers.forEach(worker => {
                const checkboxId = `assign-${story.id}-${worker.id}`;
                const workerDiv = document.createElement('div');
                workerDiv.className = 'worker-checkbox-option';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = checkboxId;
                checkbox.value = worker.id;
                checkbox.dataset.storyId = story.id;
                // Initial disable: worker already assigned elsewhere in modal
                checkbox.disabled = assignedInModal.has(worker.id);

                const label = document.createElement('label');
                label.htmlFor = checkboxId;
                const specialtyMatch = story.tags.includes(worker.area);
                label.textContent = ` ${worker.name} (${worker.area} ${worker.skill} - ${worker.pointsPerDay} pts)${specialtyMatch ? ' ✨' : ''}`;
                label.title = checkbox.disabled ? 'Worker already assigned to another story in this modal' : '';

                checkbox.addEventListener('change', (event) => {
                    const workerId = event.target.value;
                    const isChecked = event.target.checked;

                    // Update the set of workers assigned within the modal
                    if (isChecked) {
                        assignedInModal.add(workerId);
                    } else {
                        assignedInModal.delete(workerId);
                    }

                    // Re-evaluate WIP limit predictively for *this specific story*
                    const storyItemDiv = event.target.closest('.assignment-item');
                    const workersCheckedForThisStory = storyItemDiv.querySelectorAll('input[type="checkbox"]:checked').length;
                    const isFirstWorkerForThisStory = workersCheckedForThisStory === 1 && isChecked; // True if this check made it the first worker
                    const isNowZeroWorkers = workersCheckedForThisStory === 0 && !isChecked; // True if this uncheck made it zero

                    const wipLimitReached = GameState.getCurrentWip().inprogress >= wipLimits.inprogress;
                    const warningSpan = storyItemDiv.querySelector('.wip-limit-warning');

                    // Show WIP warning ONLY if trying to assign the *first* worker AND the limit is reached
                    if (isFirstWorkerForThisStory && wipLimitReached) {
                        if (warningSpan) warningSpan.style.display = 'inline';
                         // Maybe disable other checkboxes for this story if limit reached? Or just show warning.
                         // For now, just show warning. GameState will prevent commit if invalid.
                    } else {
                         if (warningSpan) warningSpan.style.display = 'none'; // Hide warning if not first worker or limit ok
                    }

                    // Update disable state of this worker in *other* story assignments
                    const allCheckboxes = assignmentListContainer.querySelectorAll('input[type="checkbox"]');
                    allCheckboxes.forEach(cb => {
                         if (cb.value === workerId && cb !== event.target) { // Find checkboxes for the same worker in other stories
                              cb.disabled = isChecked; // Disable if checked here, enable if unchecked here
                              const otherLabel = cb.nextElementSibling;
                              if (otherLabel) {
                                   otherLabel.title = isChecked ? 'Worker assigned to another story in this modal' : '';
                              }
                         }
                    });
                }); // End event listener

                workerDiv.appendChild(checkbox);
                workerDiv.appendChild(label);
                workerCheckboxContainer.appendChild(workerDiv);
            }); // End forEach suitable worker
        } // End else suitableWorkers.length > 0

        storyDiv.appendChild(workerCheckboxContainer);

        // Add placeholder for WIP Limit warning (hidden initially)
        const warningSpan = document.createElement('span');
        warningSpan.className = 'wip-limit-warning';
        warningSpan.textContent = ` (WIP Limit: ${wipLimits.inprogress} Reached - Cannot start new story)`;
        warningSpan.style.color = 'red';
        warningSpan.style.fontSize = '0.9em';
        warningSpan.style.display = 'none'; // Hide initially
        storyDiv.appendChild(warningSpan);

        assignmentListContainer.appendChild(storyDiv);
    }); // End forEach storyToAssign

    // Initial check for disabling workers already assigned (e.g., if modal reopened without confirming)
    const allCheckboxesInitial = assignmentListContainer.querySelectorAll('input[type="checkbox"]');
    allCheckboxesInitial.forEach(cb => {
        const storyData = GameState.getStory(cb.dataset.storyId);
        if (storyData && storyData.assignedWorkers.includes(cb.value)) {
            cb.checked = true;
            assignedInModal.add(cb.value); // Add to modal set initially
        }
    });
    // Update disabled state based on initial assignments
    allCheckboxesInitial.forEach(cb => {
         if (!cb.checked && assignedInModal.has(cb.value)) {
              cb.disabled = true;
              const label = cb.nextElementSibling;
              if(label) label.title = 'Worker already assigned to another story in this modal';
         }
    });


}


// --- Populate Daily Scrum modal (Day 2 Reassignment & Blockers) --- CHANGED for multi-select
export function populateDailyScrumModal(day, workers, activeObstacles, storiesInProgressOrTesting) {
    const modal = document.getElementById('daily-scrum-modal');
    if (!modal) return;
    modal.querySelector('h2').textContent = `Daily Scrum & Reassignment - Day ${day}`;
    updateWipDisplays(); // Ensure WIP counts in modal header are correct
    if (unblockingCostSpan) unblockingCostSpan.textContent = GameState.UNBLOCKING_COST;

    // Display Obstacles
    obstacleDisplay.innerHTML = '';
    if (activeObstacles && activeObstacles.length > 0) {
        obstacleDisplay.innerHTML = '<strong>Obstacles Today:</strong><ul>' + activeObstacles.map(obs => `<li>${obs.message}</li>`).join('') + '</ul>';
    } else { obstacleDisplay.innerHTML = 'No new obstacles today.'; }

    reassignmentListContainer.innerHTML = ''; // Clear previous list
    blockerResolutionList.innerHTML = ''; // Clear previous blocker list

    const allActiveStories = Object.values(GameState.getAllStories())
                                   .filter(s => s.status === 'inprogress' || s.status === 'testing');
    const blockedStories = allActiveStories.filter(s => s.isBlocked);
    const unblockedActiveStories = allActiveStories.filter(s => !s.isBlocked);

    const wipLimits = GameState.getWipLimits();
    const availableWorkers = GameState.getAvailableWorkers(); // Workers not assigned and available
    const availableSeniorDevs = GameState.getAvailableSeniorDevs(); // For unblocking

    // Track workers assigned in this modal session (either reassignment or unblocking)
    const assignedInModal = new Set();
    // Pre-populate with workers already assigned to *any* story or unblocking
    workers.forEach(w => { if (w.assignedStory) assignedInModal.add(w.id); });

    // --- Populate Reassignment Section ---
    const reassignmentSection = document.getElementById('reassignment-section');
    if (unblockedActiveStories.length === 0) {
        reassignmentListContainer.innerHTML = '<p>No active (unblocked) stories to reassign workers.</p>';
        reassignmentSection.style.display = 'block';
    } else {
        reassignmentSection.style.display = 'block';

        unblockedActiveStories.forEach(story => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'reassignment-item multi-assign-item'; // Add class for styling
            itemDiv.dataset.storyId = story.id;
            itemDiv.dataset.storyStatus = story.status; // Store status for WIP check

            const storyEffortText = story.status === 'testing' ? `Test Left: ${Math.round(story.testingEffortRemaining)}` : `Dev Left: ${Math.round(story.remainingEffort)}`;
            const ageText = story.daysInState > 0 ? ` (Age: ${story.daysInState}d)` : '';
            itemDiv.innerHTML = `<strong>${story.title}</strong> (${storyEffortText}) <br> Status: ${story.status}${ageText}<br>`;

            // Display Currently Assigned Workers
            const currentWorkersDiv = document.createElement('div');
            currentWorkersDiv.className = 'current-workers-list';
            currentWorkersDiv.innerHTML = 'Currently Assigned: ';
            if (story.assignedWorkers.length > 0) {
                story.assignedWorkers.forEach(workerId => {
                    const worker = GameState.getWorkerById(workerId);
                    if (worker) {
                        const pill = document.createElement('span');
                        pill.className = 'worker-pill';
                        pill.style.backgroundColor = getWorkerColor(workerId);
                        pill.textContent = worker.name.split(' ')[0];
                        pill.title = `${worker.name} (${worker.area} ${worker.skill})`;
                        // Add a remove button/checkbox next to each assigned worker
                        const removeCheckbox = document.createElement('input');
                        removeCheckbox.type = 'checkbox';
                        removeCheckbox.checked = true; // Checked means "keep assigned"
                        removeCheckbox.dataset.action = 'keep';
                        removeCheckbox.dataset.workerId = workerId;
                        removeCheckbox.id = `keep-${story.id}-${workerId}`;
                        removeCheckbox.addEventListener('change', (e) => {
                            const workerId = e.target.dataset.workerId;
                            if (!e.target.checked) { // If unchecked (meaning "remove")
                                assignedInModal.delete(workerId); // Free up worker in modal state
                            } else { // If re-checked (meaning "keep")
                                assignedInModal.add(workerId); // Re-assign worker in modal state
                            }
                            updateDailyScrumModalOptions(assignedInModal); // Update options everywhere
                        });

                        const removeLabel = document.createElement('label');
                        removeLabel.htmlFor = `keep-${story.id}-${workerId}`;
                        removeLabel.className = 'worker-remove-label';
                        removeLabel.appendChild(pill);
                        // removeLabel.appendChild(document.createTextNode(' (Keep)')); // Optional text

                        currentWorkersDiv.appendChild(removeCheckbox);
                        currentWorkersDiv.appendChild(removeLabel);
                    }
                });
            } else {
                currentWorkersDiv.innerHTML += '<i>None</i>';
            }
            itemDiv.appendChild(currentWorkersDiv);

            // Display Available Workers to Add
            const addWorkersDiv = document.createElement('div');
            addWorkersDiv.className = 'add-workers-list worker-checkbox-container'; // Reuse styling
            addWorkersDiv.innerHTML = '<label>Add Available Workers:</label>';

             // Filter available workers based on story status
            const suitableAvailableWorkers = availableWorkers.filter(w => {
                 return (story.status === 'inprogress' && w.area !== 'Testing') || (story.status === 'testing' && w.area === 'Testing');
             });


            if (suitableAvailableWorkers.length === 0) {
                addWorkersDiv.innerHTML += '<small>No suitable workers available to add.</small>';
            } else {
                suitableAvailableWorkers.forEach(worker => {
                    // Don't show workers already assigned to *this* story in the add list
                    if (story.assignedWorkers.includes(worker.id)) return;

                    const checkboxId = `add-${story.id}-${worker.id}`;
                    const workerDiv = document.createElement('div');
                    workerDiv.className = 'worker-checkbox-option';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = checkboxId;
                    checkbox.value = worker.id;
                    checkbox.dataset.action = 'add';
                    // Initial disable: worker assigned elsewhere in modal
                    checkbox.disabled = assignedInModal.has(worker.id);

                    const label = document.createElement('label');
                    label.htmlFor = checkboxId;
                    const specialtyMatch = story.tags.includes(worker.area);
                    label.textContent = ` ${worker.name} (${worker.area} ${worker.skill} - ${worker.pointsPerDay} pts)${specialtyMatch ? ' ✨' : ''}`;
                    label.title = checkbox.disabled ? 'Worker already assigned to another story or unblocking in this modal' : '';

                    checkbox.addEventListener('change', (event) => {
                         const workerId = event.target.value;
                         if (event.target.checked) { // If checked (meaning "add")
                              assignedInModal.add(workerId);
                         } else { // If unchecked (meaning "cancel add")
                              assignedInModal.delete(workerId);
                         }
                         updateDailyScrumModalOptions(assignedInModal); // Update options everywhere
                    });

                    workerDiv.appendChild(checkbox);
                    workerDiv.appendChild(label);
                    addWorkersDiv.appendChild(workerDiv);
                });
            }
            itemDiv.appendChild(addWorkersDiv);

            reassignmentListContainer.appendChild(itemDiv);
        }); // End forEach unblocked story
    }


    // --- Populate Blocker Resolution Section --- (Largely unchanged logic, but needs UI updates)
     const blockerSection = document.getElementById('blocker-resolution-section');
    if (blockedStories.length > 0) {
        blockerSection.style.display = 'block';
        blockerResolutionList.innerHTML = '';

        blockedStories.forEach(story => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'blocker-assignment-item';
             const ageText = story.daysInState > 0 ? ` (Blocked ${story.daysInState}d)` : '';
            itemDiv.innerHTML = `<strong>${story.title}</strong> <span style="color: orange;">[BLOCKED]</span>${ageText}<br>`;

            const selectLabel = document.createElement('label');
            selectLabel.htmlFor = `unblock-assign-${story.id}`;
            selectLabel.textContent = 'Assign Senior Dev to Unblock: ';

            const selectWorker = document.createElement('select');
            selectWorker.id = `unblock-assign-${story.id}`;
            selectWorker.dataset.storyId = story.id; // Store story ID
            selectWorker.dataset.action = 'unblock'; // Mark action type

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
                 // When selection changes, we need to update the master 'assignedInModal' set.
                 // Find the previously selected value for this dropdown (if any) and remove it from the set.
                 const previousWorkerId = selectWorker.dataset.previousValue;
                 if (previousWorkerId) {
                      assignedInModal.delete(previousWorkerId);
                 }
                 // Add the newly selected worker (if any) to the set.
                 const currentWorkerId = selectWorker.value;
                 if (currentWorkerId) {
                      assignedInModal.add(currentWorkerId);
                 }
                 // Store the current value for the next change event.
                 selectWorker.dataset.previousValue = currentWorkerId;

                 updateDailyScrumModalOptions(assignedInModal); // Update all options based on the new set
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

// --- Helper function to update all interactive elements in the Daily Scrum modal ---
function updateDailyScrumModalOptions(assignedInModalSet) {
    const allReassignItems = reassignmentListContainer.querySelectorAll('.reassignment-item');
    const allBlockerSelects = blockerResolutionList.querySelectorAll('select');

    // --- Update Reassignment Section ---
    allReassignItems.forEach(itemDiv => {
        const storyId = itemDiv.dataset.storyId;
        // Update "Keep" checkboxes
        itemDiv.querySelectorAll('input[data-action="keep"]').forEach(keepCb => {
            const workerId = keepCb.dataset.workerId;
            // Cannot uncheck "keep" if the worker is now assigned elsewhere in the modal
            keepCb.disabled = !keepCb.checked && assignedInModalSet.has(workerId);
             const label = keepCb.nextElementSibling;
             if(label) label.title = keepCb.disabled ? 'Worker assigned elsewhere in modal' : '';
        });
        // Update "Add" checkboxes
        itemDiv.querySelectorAll('input[data-action="add"]').forEach(addCb => {
            const workerId = addCb.value;
            // Disable if worker is assigned elsewhere (and not currently checked here)
            addCb.disabled = !addCb.checked && assignedInModalSet.has(workerId);
            const label = addCb.nextElementSibling;
            if(label) label.title = addCb.disabled ? 'Worker assigned elsewhere in modal' : '';
        });
    });

    // --- Update Blocker Section ---
    allBlockerSelects.forEach(sel => {
        const currentSelection = sel.value;
        Array.from(sel.options).forEach(opt => {
            if (opt.value) { // Skip the "-- Select --" option
                const workerId = opt.value;
                const worker = GameState.getWorkerById(workerId);
                // Disable if:
                // 1. Worker is assigned elsewhere in the modal (and not the current selection for this dropdown)
                // 2. Worker doesn't exist or doesn't have enough points
                opt.disabled = (assignedInModalSet.has(workerId) && workerId !== currentSelection) || !worker || worker.dailyPointsLeft < GameState.UNBLOCKING_COST;
            }
        });
    });

    // --- (Optional) Predictive WIP Check ---
    // This is complex with multi-assign. The primary WIP check happens in GameState on confirm.
    // We can add a simple visual warning here if limits *might* be exceeded based on current modal state,
    // but enforcing it strictly in the UI is difficult. GameState is the source of truth.
    // Example: Recalculate projectedWip based on modal changes and display warnings if needed.
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
    const storyOrder = [ "Cover", "Introduce", "Finds Cottage", "Cottage Visual", "Porridge", "Chair", "Bed", "Return", "Discover", "Wakes", "End", "Back Cover"];
    const sortedCompleted = [...completedStories].sort((a, b) => {
        const indexA = storyOrder.findIndex(prefix => a.title.includes(prefix));
        const indexB = storyOrder.findIndex(prefix => b.title.includes(prefix));
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });
    sortedCompleted.forEach(story => { const pagePreview = createStorybookPagePreview(story); if (pagePreview) { reviewStorybookPreview.appendChild(pagePreview); } });
    showModal(document.getElementById('sprint-review-modal'));
}


export function populateRetrospectiveModal(sprintNum) {
     modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
     document.getElementById('retro-form').reset();
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
        const sortedStories = [...completedStories].sort((a, b) => {
            const indexA = storyOrder.findIndex(prefix => a.title.includes(prefix));
            const indexB = storyOrder.findIndex(prefix => b.title.includes(prefix));
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
         });
        sortedStories.forEach(story => { const page = createStorybookPagePreview(story, true); if (page) { finalStorybookPages.appendChild(page); } });
    }
    showModal(document.getElementById('final-storybook-modal'));
}


function createStorybookPagePreview(story, isFinal = false) {
    if (!story) return null;
    const pageDiv = document.createElement('div'); pageDiv.classList.add('storybook-page-preview');
    if (isFinal) pageDiv.style.maxWidth = '300px';

    const title = document.createElement('h5'); title.textContent = story.title; pageDiv.appendChild(title);

    const imageUrl = selectImageForStory(story.id, story.chosenImplementation);
    const imgContainer = document.createElement('div');
    imgContainer.style.flexGrow = '1'; imgContainer.style.display = 'flex'; imgContainer.style.alignItems = 'center'; imgContainer.style.justifyContent = 'center'; imgContainer.style.minHeight = '80px';

    if (imageUrl) {
        const img = document.createElement('img'); img.src = imageUrl; img.alt = story.title;
        img.style.maxWidth = '100%'; img.style.maxHeight = '100px'; img.style.height = 'auto'; img.style.borderRadius = '3px'; img.style.objectFit = 'contain';
        imgContainer.appendChild(img);
    } else if (story.tags.includes('Visual')) {
         const placeholder = document.createElement('p'); placeholder.textContent = '[Visual Story - Image Missing]';
         placeholder.style.color = '#aaa'; placeholder.style.fontStyle = 'italic';
         imgContainer.appendChild(placeholder);
    }
    pageDiv.appendChild(imgContainer);

    const textContainer = document.createElement('div');
    textContainer.style.marginTop = 'auto';
    if (story.chosenImplementation && story.chosenImplementation.impact) {
        const desc = document.createElement('p'); desc.textContent = story.chosenImplementation.impact; textContainer.appendChild(desc);
    } else if (!story.tags.includes('Visual') && story.story) {
        const desc = document.createElement('p'); desc.textContent = story.story; textContainer.appendChild(desc);
    } else if (!imageUrl && !story.tags.includes('Visual') && !story.story) {
         textContainer.appendChild(document.createTextNode('[Text missing]'));
    }
     pageDiv.appendChild(textContainer);

    return pageDiv;
}

// --- Button/State Updates ---
export function updateButtonVisibility(dayState) {
    const phaseName = GameState.getPhaseName(dayState);
    nextDayBtn.style.display = 'none'; // Hide by default
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
    const workerObstacle = obstacles.find(obs => obs.targetWorkerId === workerId && obs.type === 'capacity_reduction');
    const worker = GameState.getWorkerById(workerId);

    if (worker && !worker.available && workerObstacle && workerObstacle.makesUnavailable) {
         return workerObstacle.shortMessage || 'Unavailable';
    } else if (worker && !worker.available) {
        return 'Unavailable';
    }
    return '';
}
// --- END OF FILE ui.js ---