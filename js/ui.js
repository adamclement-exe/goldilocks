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
const dailyScrumAssignments = document.getElementById('daily-scrum-assignments'); // Not used for assignments now
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
}

export function createStoryCard(story) {
    if (!storyCardTemplate || !story || !story.id) { console.error("Story card template or story data invalid:", story); return null; }
    const card = storyCardTemplate.content.cloneNode(true).querySelector('.story-card');
    card.dataset.storyId = story.id;
    card.style.cursor = 'default';
    card.querySelector('.story-title').textContent = story.title;
    card.querySelector('.story-effort').textContent = story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort;
    card.querySelector('.story-value').textContent = story.value;
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
    if (story.isBlocked) { card.style.border = '2px solid orange'; card.title = 'Blocked by obstacle!'; }
    else { card.style.border = ''; card.title = ''; }
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
             stateElement.style.color = 'red'; stateClass = 'unavailable';
        } else if (worker.assignedStory) {
            const assignedStory = GameState.getStory(worker.assignedStory);
            stateText = `Working on: ${assignedStory ? assignedStory.title.substring(0,15)+'...' : 'Unknown'}`;
            stateElement.style.color = 'blue'; stateClass = 'working';
        } else {
            stateText = `Idle (${worker.dailyPointsLeft} pts left)`;
            stateElement.style.color = 'green'; stateClass = 'idle';
        }
        stateElement.textContent = stateText;
        workerElement.dataset.state = stateClass;
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
}

export function updateCard(storyId, storyData) {
    const card = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
    if (card && storyData) {
        card.querySelector('.story-effort').textContent = storyData.chosenImplementation ? storyData.chosenImplementation.effort : storyData.baseEffort;
        card.querySelector('.story-value').textContent = storyData.value;
        const workerSpan = card.querySelector('.story-worker');
        const worker = storyData.assignedWorker ? GameState.getTeam().find(w => w.id === storyData.assignedWorker) : null;
        workerSpan.textContent = worker ? worker.name : 'None';
        const devProgressElement = card.querySelector('.story-progress');
        const devProgressBar = card.querySelector('.dev-progress');
        const devPointsRemainingSpan = card.querySelector('.dev-points-remaining');
        const testProgressElement = card.querySelector('.story-testing-progress');
        const testProgressBar = card.querySelector('.test-progress');
        const testPointsRemainingSpan = card.querySelector('.test-points-remaining');
        if (storyData.status === 'inprogress' || storyData.status === 'testing' || storyData.status === 'done') {
            devProgressElement.style.display = 'block';
            devProgressBar.value = storyData.progress || 0;
            devPointsRemainingSpan.textContent = `${Math.round(storyData.remainingEffort)} pts`;
        } else { devProgressElement.style.display = 'none'; }
        if (storyData.status === 'testing' || storyData.status === 'done') {
            testProgressElement.style.display = 'block';
            testProgressBar.value = storyData.testingProgress || 0;
            testPointsRemainingSpan.textContent = `${Math.round(storyData.testingEffortRemaining)} pts`;
        } else { testProgressElement.style.display = 'none'; }
        if (storyData.isBlocked) { card.style.border = '2px solid orange'; card.title = 'Blocked by obstacle!'; }
        else { card.style.border = ''; card.title = ''; }
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
    } else {
         console.warn(`UI Error: Could not move card ${storyId} to column ${targetColumnId}. Card or list not found.`);
         renderAllColumns();
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
    renderSprintBacklog(allStories.filter(s => s.status === 'ready' && GameState.getSprintBacklog().map(sb=>sb.id).includes(s.id)));
    renderInProgress(allStories.filter(s => s.status === 'inprogress'));
    renderTesting(allStories.filter(s => s.status === 'testing')); // Added
    renderDone(allStories.filter(s => s.status === 'done'));
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
        checkbox.checked = selectedIds.includes(story.id); checkbox.dataset.effort = story.baseEffort;
        const label = document.createElement('label');
        label.htmlFor = checkbox.id; label.textContent = ` ${story.title} (Effort: ${story.baseEffort}, Value: ${story.value}⭐)`;
        checkbox.addEventListener('change', (event) => {
             const storyId = event.target.value; const isChecked = event.target.checked;
             const storyData = GameState.getStory(storyId);
             if (!storyData) { console.error(`Story data not found for ID ${storyId} during planning change.`); return; }
             let actionSuccess = false;
             if (isChecked) {
                 if (storyData.implementationChoices && storyData.implementationChoices.length > 0 && !storyData.chosenImplementation) {
                     showProceduralChoiceModal(storyData);
                 } else {
                      actionSuccess = GameState.addStoryToSprint(storyId);
                      if (actionSuccess) { moveCardToColumn(storyId, 'ready'); }
                      else { console.warn(`Add to sprint failed for ${storyId}, reverting checkbox.`); event.target.checked = false; }
                 }
             } else {
                 actionSuccess = GameState.removeStoryFromSprint(storyId);
                  if (actionSuccess) { moveCardToColumn(storyId, 'backlog'); }
                  else { console.warn(`Remove from sprint failed for ${storyId}, reverting checkbox.`); event.target.checked = true; }
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
    if(capacityWarning) capacityWarning.style.display = selectedPoints > capacity ? 'block' : 'none';
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
    if (storiesToAssign.length === 0) { assignmentListContainer.innerHTML = '<p>No stories in the Sprint Backlog require assignment.</p>'; return; }
    const assignedInModal = new Set();
    storiesToAssign.forEach(story => {
        if (!story) return;
        const storyDiv = document.createElement('div'); storyDiv.className = 'assignment-item';
        storyDiv.innerHTML = `<strong>${story.title}</strong> (Effort: ${story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort}) <br> Tags: ${story.tags.join(', ')} <br>`;
        const selectLabel = document.createElement('label'); selectLabel.textContent = 'Assign Worker: '; selectLabel.htmlFor = `assign-${story.id}`;
        const selectWorker = document.createElement('select'); selectWorker.id = `assign-${story.id}`; selectWorker.dataset.storyId = story.id;
        const noneOption = document.createElement('option'); noneOption.value = ''; noneOption.textContent = '-- Select Available Worker --'; selectWorker.appendChild(noneOption);
        availableWorkers.forEach(worker => {
            // Only allow Devs to be assigned here (to Ready stories)
            if (worker.area !== 'Testing') {
                const option = document.createElement('option'); option.value = worker.id;
                const specialtyMatch = story.tags.includes(worker.area);
                option.textContent = `${worker.name} (${worker.area} ${worker.skill} - ${worker.pointsPerDay} pts)${specialtyMatch ? ' ✨' : ''}`;
                option.disabled = assignedInModal.has(worker.id);
                selectWorker.appendChild(option);
            }
        });
        selectWorker.addEventListener('change', (event) => {
            const selectedWorkerId = event.target.value; const previousWorkerId = event.target.dataset.currentlySelected;
            if (previousWorkerId) { assignedInModal.delete(previousWorkerId); }
            if (selectedWorkerId) { assignedInModal.add(selectedWorkerId); }
            event.target.dataset.currentlySelected = selectedWorkerId;
            const allSelects = assignmentListContainer.querySelectorAll('select');
            allSelects.forEach(sel => {
                if (sel !== event.target) {
                    const currentSelectionInOther = sel.value;
                    Array.from(sel.options).forEach(opt => {
                        if (opt.value) { opt.disabled = assignedInModal.has(opt.value) && opt.value !== currentSelectionInOther; }
                    });
                }
            });
        });
        storyDiv.appendChild(selectLabel); storyDiv.appendChild(selectWorker); assignmentListContainer.appendChild(storyDiv);
    });
}

// Populate Daily Scrum modal - NOW for Day 2 Reassignment
export function populateDailyScrumModal(day, workers, activeObstacles, storiesInProgressOrTesting) {
    const modal = document.getElementById('daily-scrum-modal');
    if (!modal) return;
    modal.querySelector('h2').textContent = `Daily Scrum & Reassignment - Day ${day}`;
    obstacleDisplay.innerHTML = '';
    if (activeObstacles && activeObstacles.length > 0) {
        obstacleDisplay.innerHTML = '<strong>Obstacles Today:</strong><ul>' + activeObstacles.map(obs => `<li>${obs.message}</li>`).join('') + '</ul>';
    } else { obstacleDisplay.innerHTML = 'No new obstacles today.'; }
    reassignmentListContainer.innerHTML = '';
    if (storiesInProgressOrTesting.length === 0) { reassignmentListContainer.innerHTML = '<p>No stories currently in progress or testing to reassign.</p>'; return; }
    const availableWorkers = GameState.getAvailableWorkers();
    const assignedInModal = new Set();
    storiesInProgressOrTesting.forEach(story => { if (story?.assignedWorker) { assignedInModal.add(story.assignedWorker); } });
    storiesInProgressOrTesting.forEach(story => {
        if (!story) return;
        const itemDiv = document.createElement('div'); itemDiv.className = 'reassignment-item';
        const currentWorker = story.assignedWorker ? GameState.getWorkerById(story.assignedWorker) : null;
        const currentWorkerName = currentWorker ? currentWorker.name : 'None';
        const storyEffortText = story.status === 'testing' ? `Test Left: ${story.testingEffortRemaining}` : `Dev Left: ${story.remainingEffort}`;
        itemDiv.innerHTML = `<strong>${story.title}</strong> (${storyEffortText}) <br> Status: ${story.status} <span class="reassignment-current">(Currently: ${currentWorkerName})</span> <br>`;
        const selectLabel = document.createElement('label'); selectLabel.textContent = 'Assign Worker: '; selectLabel.htmlFor = `reassign-${story.id}`;
        const selectWorker = document.createElement('select'); selectWorker.id = `reassign-${story.id}`; selectWorker.dataset.storyId = story.id; selectWorker.dataset.initialWorker = story.assignedWorker || '';
        const noneOption = document.createElement('option'); noneOption.value = '';
        noneOption.textContent = currentWorker ? `-- Keep ${currentWorkerName} --` : '-- Select Available Worker --'; selectWorker.appendChild(noneOption);
        const potentialWorkers = [...availableWorkers];
        if (currentWorker && !potentialWorkers.some(w => w.id === currentWorker.id)) { potentialWorkers.push(currentWorker); }
        potentialWorkers.forEach(worker => {
            const canWork = (worker.area !== 'Testing' && story.status === 'inprogress') || (worker.area === 'Testing' && story.status === 'testing');
            if (canWork) {
                const option = document.createElement('option'); option.value = worker.id;
                const specialtyMatch = story.tags.includes(worker.area);
                option.textContent = `${worker.name} (${worker.area} ${worker.skill} - ${worker.pointsPerDay} pts)${specialtyMatch ? ' ✨' : ''}`;
                option.disabled = assignedInModal.has(worker.id) && worker.id !== story.assignedWorker;
                selectWorker.appendChild(option);
            }
        });
        selectWorker.addEventListener('change', (event) => {
            const selectedWorkerId = event.target.value; const initialWorkerId = event.target.dataset.initialWorker;
            const previouslySelectedInModal = event.target.dataset.currentlySelectedInModal || initialWorkerId;
            if (previouslySelectedInModal) { assignedInModal.delete(previouslySelectedInModal); }
            if (selectedWorkerId) { assignedInModal.add(selectedWorkerId); }
            event.target.dataset.currentlySelectedInModal = selectedWorkerId;
            const allSelects = reassignmentListContainer.querySelectorAll('select');
            allSelects.forEach(sel => {
                if (sel !== event.target) {
                    const otherInitialWorker = sel.dataset.initialWorker; const currentSelectionInOther = sel.value || otherInitialWorker;
                    Array.from(sel.options).forEach(opt => {
                        if (opt.value) { opt.disabled = assignedInModal.has(opt.value) && opt.value !== otherInitialWorker; }
                    });
                }
            });
        });
        itemDiv.appendChild(selectLabel); itemDiv.appendChild(selectWorker); reassignmentListContainer.appendChild(itemDiv);
    });
}

export function populateSprintReviewModal(sprintNum, completedStories, velocity, totalValue, sponsorFeedback) {
    modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
    reviewCompletedList.innerHTML = '';
    completedStories.forEach(story => { const li = document.createElement('li'); li.textContent = `${story.title} (Effort: ${story.baseEffort}, Value: ${story.value}⭐)`; reviewCompletedList.appendChild(li); });
    reviewVelocityDisplay.textContent = velocity; reviewValueDisplay.textContent = totalValue; reviewSponsorFeedback.textContent = sponsorFeedback || "The sponsor is reviewing the progress...";
    reviewStorybookPreview.innerHTML = '';
    completedStories.forEach(story => { const pagePreview = createStorybookPagePreview(story); if (pagePreview) { reviewStorybookPreview.appendChild(pagePreview); } });
    showModal(document.getElementById('sprint-review-modal'));
}

export function populateRetrospectiveModal(sprintNum) {
     modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
     document.getElementById('retro-form').reset();
     if (sprintNum >= 3) { endGameBtn.style.display = 'inline-block'; document.querySelector('#retro-form button[type="submit"]').style.display = 'none'; }
     else { endGameBtn.style.display = 'none'; document.querySelector('#retro-form button[type="submit"]').style.display = 'inline-block'; }
     showModal(document.getElementById('sprint-retrospective-modal'));
}

export function populateFinalStorybook(completedStories) {
    finalStorybookPages.innerHTML = '';
    const dodStatusDiv = document.createElement('div'); dodStatusDiv.style.padding = '10px'; dodStatusDiv.style.marginBottom = '15px'; dodStatusDiv.style.border = '1px solid #ccc'; dodStatusDiv.style.backgroundColor = '#f9f9f9'; dodStatusDiv.style.borderRadius = '4px';
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
        const sortedStories = completedStories.sort((a, b) => { const indexA = storyOrder.findIndex(prefix => a.title.includes(prefix)); const indexB = storyOrder.findIndex(prefix => b.title.includes(prefix)); const effectiveIndexA = indexA === -1 ? 99 : indexA; const effectiveIndexB = indexB === -1 ? 99 : indexB; return effectiveIndexA - effectiveIndexB; });
        sortedStories.forEach(story => { const page = createStorybookPagePreview(story, true); if (page) { finalStorybookPages.appendChild(page); } });
    }
    showModal(document.getElementById('final-storybook-modal'));
}

function createStorybookPagePreview(story, isFinal = false) {
    if (!story) return null;
    const pageDiv = document.createElement('div'); pageDiv.classList.add('storybook-page-preview'); if (isFinal) pageDiv.style.maxWidth = '300px';
    const title = document.createElement('h5'); title.textContent = story.title; pageDiv.appendChild(title);
    const imageUrl = selectImageForStory(story.id, story.chosenImplementation);
    if (imageUrl) { const img = document.createElement('img'); img.src = imageUrl; img.alt = story.title; pageDiv.appendChild(img); }
    else if (story.tags.includes('Visual')) { pageDiv.appendChild(document.createTextNode('[Visual not generated]')); }
    if (story.chosenImplementation && story.chosenImplementation.impact) { const desc = document.createElement('p'); desc.textContent = story.chosenImplementation.impact; pageDiv.appendChild(desc); }
    else if (!story.tags.includes('Visual')) { const desc = document.createElement('p'); desc.textContent = story.story; pageDiv.appendChild(desc); }
    return pageDiv;
}

// --- Button/State Updates ---
export function updateButtonVisibility(dayState) {
    const phaseName = GameState.getPhaseName(dayState);
    nextDayBtn.style.display = 'none';
    if (phaseName === 'Day 1 Work') { nextDayBtn.style.display = 'inline-block'; nextDayBtn.textContent = 'Proceed to Day 2 Reassignment'; }
    else if (phaseName === 'Day 2 Work') { nextDayBtn.style.display = 'inline-block'; nextDayBtn.textContent = 'End Sprint / Go to Review'; }
}

// --- Obstacle Related ---
function getObstacleMessageForWorker(workerId) {
    const obstacles = GameState.getActiveObstacles ? GameState.getActiveObstacles() : [];
    const workerObstacle = obstacles.find(obs => obs.targetWorkerId === workerId && obs.type === 'capacity_reduction');
    const worker = GameState.getWorkerById(workerId);
    if (worker && !worker.available && workerObstacle) { return workerObstacle.shortMessage || 'Unavailable'; }
    else if (workerObstacle) { return workerObstacle.shortMessage || 'Affected'; }
    return 'Unavailable';
}