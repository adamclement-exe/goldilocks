import * as GameState from './gameState.js'; // Import GameState to access functions like getStory, getTeam
import { selectImageForStory } from './imageSelector.js';

// --- DOM Element References ---
const productBacklogList = document.getElementById('product-backlog-list');
const sprintBacklogList = document.getElementById('sprint-backlog-list');
const inProgressList = document.getElementById('inprogress-list');
const doneList = document.getElementById('done-list');
const storyCardTemplate = document.getElementById('story-card-template');
const workerList = document.getElementById('worker-list');
const workerTemplate = document.getElementById('worker-template');
const sprintNumberDisplay = document.getElementById('sprint-number');
const teamCapacityDisplay = document.getElementById('team-capacity');
const currentDayDisplay = document.getElementById('current-day'); // Now shows Phase Name
const sprintSelectedPointsDisplay = document.getElementById('sprint-selected-points');
const modalSelectedPointsDisplay = document.getElementById('modal-selected-points'); // In planning modal
const capacityWarning = document.getElementById('capacity-warning');
const planningBacklogSelection = document.getElementById('planning-backlog-selection'); // In planning modal
const modalSprintNumberDisplays = document.querySelectorAll('.modal-sprint-number');
const modalTeamCapacityDisplays = document.querySelectorAll('.modal-team-capacity');
const reviewCompletedList = document.getElementById('review-completed-list');
const reviewVelocityDisplay = document.getElementById('review-velocity');
const reviewValueDisplay = document.getElementById('review-value');
const reviewSponsorFeedback = document.getElementById('review-sponsor-feedback');
const reviewStorybookPreview = document.getElementById('review-storybook-preview');
const finalStorybookPages = document.getElementById('final-storybook-pages');
const dailyScrumDayDisplay = document.getElementById('daily-scrum-day');
const dailyScrumAssignments = document.getElementById('daily-scrum-assignments');
const obstacleDisplay = document.getElementById('obstacle-display'); // In daily scrum modal
const choiceStoryTitle = document.getElementById('choice-story-title');
const choiceOptionsContainer = document.getElementById('choice-options');
const nextDayBtn = document.getElementById('next-day-btn'); // Main action button outside modals
// const startSprintBtn = document.getElementById('start-sprint-btn'); // Removed/Repurposed
const endGameBtn = document.getElementById('end-game-btn');
const workerAssignmentModal = document.getElementById('worker-assignment-modal'); // Added
const assignmentListContainer = document.getElementById('assignment-list'); // Added


// --- Rendering Functions ---

export function renderProductBacklog(backlogItems) {
    renderStoryList(productBacklogList, backlogItems);
}

export function renderSprintBacklog(sprintItems) {
    renderStoryList(sprintBacklogList, sprintItems);
     updateSprintPlanningUI(); // Update points when sprint backlog changes (relevant during planning)
}

export function renderInProgress(inProgressItems) {
    renderStoryList(inProgressList, inProgressItems);
}

export function renderDone(doneItems) {
    renderStoryList(doneList, doneItems);
}

// Helper to render stories in a specific list element
function renderStoryList(listElement, stories) {
    if (!listElement) {
        console.error("Target list element not found for rendering stories.");
        return;
    }
    listElement.innerHTML = ''; // Clear existing items
    if (stories && stories.length > 0) {
        stories.forEach(story => {
            if (story) { // Ensure story data exists
                const card = createStoryCard(story);
                if (card) listElement.appendChild(card);
            } else {
                console.warn("Attempted to render an undefined story.");
            }
        });
    } else {
         // Optional: Add placeholder text if list is empty
         // listElement.innerHTML = '<p style="text-align: center; color: #888; padding: 10px;">Empty</p>';
    }
}

// Creates a story card element from template and data
export function createStoryCard(story) {
    if (!storyCardTemplate) {
        console.error("Story card template not found!");
        return null;
    }
    if (!story || !story.id) {
        console.error("Invalid story data provided to createStoryCard:", story);
        return null;
    }

    const card = storyCardTemplate.content.cloneNode(true).querySelector('.story-card');
    card.dataset.storyId = story.id; // Store ID on the element
    card.style.cursor = 'default'; // Ensure default cursor

    card.querySelector('.story-title').textContent = story.title;
    card.querySelector('.story-desc').textContent = story.story.substring(0, 60) + '...'; // Snippet
    card.querySelector('.story-effort').textContent = story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort;
    card.querySelector('.story-value').textContent = story.value;

    const tagsContainer = card.querySelector('.story-tags');
    tagsContainer.innerHTML = ''; // Clear default tags
    if (story.tags && Array.isArray(story.tags)) {
        story.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.classList.add('tag', `tag-${tag.toLowerCase().replace(/\s+/g, '-')}`);
            tagSpan.textContent = tag;
            tagsContainer.appendChild(tagSpan);
        });
    }

    const workerSpan = card.querySelector('.story-worker');
    // Access team state via GameState module
    const worker = story.assignedWorker ? GameState.getTeam().find(w => w.id === story.assignedWorker) : null;
    workerSpan.textContent = worker ? worker.name : 'None';

    // Progress bar update
    const progressElement = card.querySelector('.story-progress');
    const progressBar = card.querySelector('progress');
    if (story.status === 'inprogress' || story.status === 'done') {
        progressElement.style.display = 'block';
        progressBar.value = story.progress || 0;
        progressBar.max = 100;
    } else {
        progressElement.style.display = 'none';
    }

    // Add border color if blocked
    if (story.isBlocked) {
        card.style.border = '2px solid orange';
        card.title = 'Blocked by obstacle!'; // Tooltip
    } else {
        card.style.border = ''; // Reset border
        card.title = '';
    }


    return card;
}

// Renders the list of workers with their status and details
export function renderWorkers(workers) {
    if (!workerList) return;
    workerList.innerHTML = '';
     if (!workerTemplate) {
        console.error("Worker template not found!");
        return;
    }
    workers.forEach(worker => {
        const workerElement = workerTemplate.content.cloneNode(true).querySelector('.worker-status');
        workerElement.dataset.workerId = worker.id;
        workerElement.querySelector('.worker-name').textContent = worker.name;
        // --- NEW ---
        workerElement.querySelector('.worker-area').textContent = worker.area;
        workerElement.querySelector('.worker-skill').textContent = worker.skill;
        workerElement.querySelector('.worker-points').textContent = worker.pointsPerDay;
        // -----------
        workerElement.querySelector('.worker-avatar').style.backgroundColor = getWorkerColor(worker.id);

        const stateElement = workerElement.querySelector('.worker-state');
        if (!worker.available) {
             const obstacleMsg = getObstacleMessageForWorker(worker.id);
             stateElement.textContent = `Unavailable (${obstacleMsg})`;
             stateElement.style.color = 'red';
        } else if (worker.assignedStory) {
            const assignedStory = GameState.getStory(worker.assignedStory); // Use GameState
            stateElement.textContent = `Working on: ${assignedStory ? assignedStory.title.substring(0,15)+'...' : 'Unknown'}`;
            stateElement.style.color = 'blue';
        } else {
            stateElement.textContent = `Idle (${worker.dailyPointsLeft} pts left)`; // Show points left when idle
            stateElement.style.color = 'green';
        }

        workerList.appendChild(workerElement);
    });
}

// Helper for consistent worker colors
function getWorkerColor(workerId) {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#d35400', '#2980b9', '#8e44ad', '#bdc3c7'];
    const index = parseInt(workerId.replace('w', ''), 10) - 1;
    return colors[index % colors.length];
}

// --- UI Updates ---

// Updates the header info (Sprint #, Capacity, Phase Name)
export function updateSprintInfo(sprintNum, capacity, phaseName = 'Planning') {
    sprintNumberDisplay.textContent = sprintNum;
    teamCapacityDisplay.textContent = capacity;
    currentDayDisplay.textContent = phaseName; // Use phase name

    // Update modal displays too
    modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
    modalTeamCapacityDisplays.forEach(el => el.textContent = capacity);
}

// Updates an existing story card in the UI (more efficient than full re-render)
export function updateCard(storyId, storyData) {
    const card = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
    if (card && storyData) {
        // Update specific parts
        card.querySelector('.story-effort').textContent = storyData.chosenImplementation ? storyData.chosenImplementation.effort : storyData.baseEffort;
        card.querySelector('.story-value').textContent = storyData.value;

        const workerSpan = card.querySelector('.story-worker');
        const worker = storyData.assignedWorker ? GameState.getTeam().find(w => w.id === storyData.assignedWorker) : null;
        workerSpan.textContent = worker ? worker.name : 'None';

        const progressElement = card.querySelector('.story-progress');
        const progressBar = card.querySelector('progress');
         if (storyData.status === 'inprogress' || storyData.status === 'done') {
            progressElement.style.display = 'block';
            progressBar.value = storyData.progress || 0;
        } else {
            progressElement.style.display = 'none';
        }

        // Update blocked status visual
        if (storyData.isBlocked) {
            card.style.border = '2px solid orange';
            card.title = 'Blocked by obstacle!';
        } else {
            card.style.border = '';
            card.title = '';
        }

    } else {
        console.warn(`Card with ID ${storyId} not found for update or invalid data.`);
    }
}

// Programmatically moves a card element to the target column's list
export function moveCardToColumn(storyId, targetColumnId) {
    const card = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
    const targetList = document.getElementById(getColumnListId(targetColumnId)); // Use existing helper
    if (card && targetList) {
        targetList.appendChild(card); // Append to the new list
        console.log(`UI: Moved card ${storyId} to column ${targetColumnId}`);
    } else {
         console.warn(`UI Error: Could not move card ${storyId} to column ${targetColumnId}. Card or list not found.`);
         // Attempt to re-render the columns as a fallback? Might be slow.
         // renderAllColumns(); // Example of a potential fallback
    }
}

// Helper to get the DOM ID of the list element for a given logical column ID
function getColumnListId(columnId) {
    switch (columnId) {
        case 'backlog': return 'product-backlog-list';
        case 'ready': return 'sprint-backlog-list';
        case 'inprogress': return 'inprogress-list';
        case 'done': return 'done-list';
        default:
            console.error(`Unknown column ID: ${columnId}`);
            return null;
    }
}

// Optional: Helper to re-render all columns based on current GameState
export function renderAllColumns() {
    console.log("Re-rendering all columns...");
    renderProductBacklog(GameState.getProductBacklog());
    // Filter stories by status for other columns
    const allStories = Object.values(GameState.getAllStories());
    renderSprintBacklog(allStories.filter(s => s.status === 'ready' && GameState.getSprintBacklog().map(sb=>sb.id).includes(s.id))); // Ensure it's in sprint backlog state too
    renderInProgress(allStories.filter(s => s.status === 'inprogress'));
    renderDone(allStories.filter(s => s.status === 'done'));
}


// --- Modal Handling ---

export function showModal(modalElement) {
    if (modalElement && typeof modalElement.showModal === 'function') {
        modalElement.showModal();
    } else {
        console.error("Invalid modal element or showModal not supported:", modalElement);
    }
}

export function closeModal(modalElement) {
    if (modalElement && typeof modalElement.close === 'function') {
        modalElement.close();
    }
}

// --- Specific Modal Content Updates ---

// Populates the Sprint Planning modal with checkboxes
export function populateSprintPlanningModal(backlogStories, selectedIds, currentCapacity) {
    planningBacklogSelection.innerHTML = ''; // Clear previous
    backlogStories.forEach(story => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `plan-select-${story.id}`;
        checkbox.value = story.id;
        checkbox.checked = selectedIds.includes(story.id);
        checkbox.dataset.effort = story.baseEffort; // Use base effort for planning display

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = ` ${story.title} (Effort: ${story.baseEffort}, Value: ${story.value}⭐)`;

        // Add listener to update points and trigger state changes / procedural choice
        checkbox.addEventListener('change', (event) => {
             const storyId = event.target.value;
             const isChecked = event.target.checked;
             const storyData = GameState.getStory(storyId); // Get full story data

             if (!storyData) {
                 console.error(`Story data not found for ID ${storyId} during planning change.`);
                 return;
             }

             let actionSuccess = false;
             if (isChecked) {
                 // Check for procedural choices BEFORE adding
                 if (storyData.implementationChoices && storyData.implementationChoices.length > 0 && !storyData.chosenImplementation) {
                     showProceduralChoiceModal(storyData);
                     // Don't add to sprint state yet, but keep checkbox checked visually
                     // User must confirm choice, then we add to state & move UI card
                 } else {
                      // No choice needed or already made, add to state & move UI card
                      actionSuccess = GameState.addStoryToSprint(storyId);
                      if (actionSuccess) {
                          moveCardToColumn(storyId, 'ready'); // <<< MOVE UI CARD
                      } else {
                          console.warn(`Add to sprint failed for ${storyId}, reverting checkbox.`);
                          event.target.checked = false; // Revert checkbox if add failed
                      }
                 }
             } else {
                 // Deselected: Remove from state & move UI card back
                 actionSuccess = GameState.removeStoryFromSprint(storyId);
                  if (actionSuccess) {
                      moveCardToColumn(storyId, 'backlog'); // <<< MOVE UI CARD BACK
                  } else {
                       console.warn(`Remove from sprint failed for ${storyId}, reverting checkbox.`);
                       event.target.checked = true; // Revert checkbox if remove failed
                  }
             }
             updateSprintPlanningUI(); // Update points display
        });


        div.appendChild(checkbox);
        div.appendChild(label);
        planningBacklogSelection.appendChild(div);
    });
     updateSprintPlanningUI(); // Initial update
}

// Updates the points display in the planning modal and main UI
export function updateSprintPlanningUI() {
    // Calculate selected points based on GameState's sprintBacklog
    let selectedPoints = 0;
    const sprintStories = GameState.getSprintBacklog(); // Get stories currently in sprint state
    sprintStories.forEach(story => {
        if (story) {
            // Use chosen effort if available, otherwise base effort
            selectedPoints += story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort;
        }
    });

    sprintSelectedPointsDisplay.textContent = selectedPoints;
    if (modalSelectedPointsDisplay) modalSelectedPointsDisplay.textContent = selectedPoints; // Update modal too

    const capacity = GameState.getTeamCapacity(); // Get capacity from state
    if (selectedPoints > capacity) {
        if(capacityWarning) capacityWarning.style.display = 'block';
    } else {
        if(capacityWarning) capacityWarning.style.display = 'none';
    }
}

// Shows the modal for selecting implementation choice
export function showProceduralChoiceModal(story) {
     const modal = document.getElementById('procedural-choice-modal');
     if (!modal || !story) return;
     choiceStoryTitle.textContent = `Choose Implementation for: ${story.title}`;
     choiceOptionsContainer.innerHTML = ''; // Clear old options
     modal.dataset.storyId = story.id; // Store story ID for confirmation

     if (story.implementationChoices && story.implementationChoices.length > 0) {
         story.implementationChoices.forEach((choice, index) => {
             const div = document.createElement('div');
             const radio = document.createElement('input');
             radio.type = 'radio';
             radio.name = `choice-${story.id}`;
             radio.id = `choice-${story.id}-${index}`;
             radio.value = index; // Store index to retrieve choice object later
             if (index === 0) radio.checked = true; // Default select first

             const label = document.createElement('label');
             label.htmlFor = radio.id;
             label.textContent = ` ${choice.description} (Effort: ${choice.effort}, Impact: ${choice.impact})`;

             div.appendChild(radio);
             div.appendChild(label);
             choiceOptionsContainer.appendChild(div);
         });
     } else {
         choiceOptionsContainer.innerHTML = '<p>No implementation choices available for this story.</p>';
     }

     showModal(modal);
}


// Populates the Worker Assignment modal
export function populateWorkerAssignmentModal(storiesToAssign, availableWorkers) {
    if (!assignmentListContainer) return;
    assignmentListContainer.innerHTML = ''; // Clear previous
    if (storiesToAssign.length === 0) {
        assignmentListContainer.innerHTML = '<p>No stories in the Sprint Backlog require assignment.</p>';
        return;
    }

    // Keep track of workers assigned in this modal session to prevent duplicates in UI
    const assignedInModal = new Set();

    storiesToAssign.forEach(story => {
        if (!story) return; // Skip if story data is invalid
        const storyDiv = document.createElement('div');
        storyDiv.className = 'assignment-item';

        storyDiv.innerHTML = `<strong>${story.title}</strong> (Effort: ${story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort}) <br> Tags: ${story.tags.join(', ')} <br>`;

        const selectLabel = document.createElement('label');
        selectLabel.textContent = 'Assign Worker: ';
        selectLabel.htmlFor = `assign-${story.id}`;

        const selectWorker = document.createElement('select');
        selectWorker.id = `assign-${story.id}`;
        selectWorker.dataset.storyId = story.id; // Store story ID on the select

        // Option for no one
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = '-- Select Available Worker --';
        selectWorker.appendChild(noneOption);

        // Options for available workers
        availableWorkers.forEach(worker => {
            const option = document.createElement('option');
            option.value = worker.id;
            // Indicate specialty match (Simple area match)
            const specialtyMatch = story.tags.includes(worker.area);
            option.textContent = `${worker.name} (${worker.area} ${worker.skill} - ${worker.pointsPerDay} pts)${specialtyMatch ? ' ✨' : ''}`;
            // Disable if worker is already selected in another dropdown in this modal
            option.disabled = assignedInModal.has(worker.id);
            selectWorker.appendChild(option);
        });

        // Add listener to update the assignedInModal set and disable options elsewhere
        selectWorker.addEventListener('change', (event) => {
            const selectedWorkerId = event.target.value;
            const previousWorkerId = event.target.dataset.currentlySelected; // Store previous selection

            // Remove previous worker from the set if there was one
            if (previousWorkerId) {
                assignedInModal.delete(previousWorkerId);
            }
            // Add the new worker to the set if one is selected
            if (selectedWorkerId) {
                assignedInModal.add(selectedWorkerId);
            }
            // Store the current selection for the next change event
            event.target.dataset.currentlySelected = selectedWorkerId;

            // Update all other dropdowns in the modal
            const allSelects = assignmentListContainer.querySelectorAll('select');
            allSelects.forEach(sel => {
                if (sel !== event.target) { // Don't update the one being changed
                    const storyIdForOption = sel.dataset.storyId;
                    const currentSelectionInOther = sel.value;
                    Array.from(sel.options).forEach(opt => {
                        if (opt.value) { // Don't disable the '-- Select --' option
                            // Disable if the worker is in the assigned set AND not the current selection of *this* dropdown
                            opt.disabled = assignedInModal.has(opt.value) && opt.value !== currentSelectionInOther;
                        }
                    });
                }
            });
        });


        storyDiv.appendChild(selectLabel);
        storyDiv.appendChild(selectWorker);
        assignmentListContainer.appendChild(storyDiv);
    });
}


// Populates the Daily Scrum modal (mainly for obstacles)
export function populateDailyScrumModal(day, workers, activeObstacles) {
    dailyScrumDayDisplay.textContent = day; // Display as Day 1 or Day 2
    // Assignment section might just show read-only info or be removed
    dailyScrumAssignments.innerHTML = '<p>Workers proceed with existing assignments.</p>';

    obstacleDisplay.innerHTML = '';
    if (activeObstacles && activeObstacles.length > 0) {
        obstacleDisplay.innerHTML = '<strong>Obstacles Today:</strong><ul>' +
            activeObstacles.map(obs => `<li>${obs.message}</li>`).join('') + '</ul>';
    } else {
        obstacleDisplay.innerHTML = 'No new obstacles today.';
    }
}

// Populates the Sprint Review modal
export function populateSprintReviewModal(sprintNum, completedStories, velocity, totalValue, sponsorFeedback) {
    modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
    reviewCompletedList.innerHTML = '';
    completedStories.forEach(story => {
        const li = document.createElement('li');
        li.textContent = `${story.title} (Effort: ${story.baseEffort}, Value: ${story.value}⭐)`;
        reviewCompletedList.appendChild(li);
    });

    reviewVelocityDisplay.textContent = velocity;
    reviewValueDisplay.textContent = totalValue;
    reviewSponsorFeedback.textContent = sponsorFeedback || "The sponsor is reviewing the progress...";

    // Mini Demo
    reviewStorybookPreview.innerHTML = ''; // Clear previous
    completedStories.forEach(story => {
        const pagePreview = createStorybookPagePreview(story);
        if (pagePreview) {
            reviewStorybookPreview.appendChild(pagePreview);
        }
    });

    showModal(document.getElementById('sprint-review-modal'));
}

// Populates the Retrospective modal
export function populateRetrospectiveModal(sprintNum) {
     modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
     // Reset form fields if needed
     document.getElementById('retro-form').reset();

     // Show/hide end game button
     if (sprintNum >= 3) { // Check if it's the last sprint
         endGameBtn.style.display = 'inline-block';
         document.querySelector('#retro-form button[type="submit"]').style.display = 'none';
     } else {
         endGameBtn.style.display = 'none';
          document.querySelector('#retro-form button[type="submit"]').style.display = 'inline-block';
     }

     showModal(document.getElementById('sprint-retrospective-modal'));
}

// Populates the final storybook display modal
export function populateFinalStorybook(completedStories) {
    finalStorybookPages.innerHTML = ''; // Clear previous
    if (completedStories.length === 0) {
        finalStorybookPages.innerHTML = "<p>Oh no! It looks like no pages of the storybook were completed.</p>";
    } else {
        // Sort stories based on a predefined order if necessary, otherwise use completion order
        // Simple sort attempt based on typical story flow (can be improved)
        const storyOrder = [ "Cover", "Introduce", "Finds Cottage", "Cottage Visual", "Porridge", "Chair", "Bed", "Return", "Discover", "Wakes", "End", "Back Cover"];
        const sortedStories = completedStories.sort((a, b) => {
            const indexA = storyOrder.findIndex(prefix => a.title.includes(prefix));
            const indexB = storyOrder.findIndex(prefix => b.title.includes(prefix));
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB); // Put unknowns last
        });


        sortedStories.forEach(story => {
            const page = createStorybookPagePreview(story, true); // Use larger version for final
             if (page) {
                finalStorybookPages.appendChild(page);
            }
        });
    }
    showModal(document.getElementById('final-storybook-modal'));
}

// Creates a visual preview element for a storybook page
function createStorybookPagePreview(story, isFinal = false) {
    if (!story) return null;
    const pageDiv = document.createElement('div');
    pageDiv.classList.add('storybook-page-preview');
    if (isFinal) pageDiv.style.maxWidth = '300px'; // Larger final pages

    const title = document.createElement('h5');
    title.textContent = story.title;
    pageDiv.appendChild(title);

    // Use the image selector
    const imageUrl = selectImageForStory(story.id, story.chosenImplementation);
    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = story.title;
        pageDiv.appendChild(img);
    } else if (story.tags.includes('Visual')) { // Show placeholder only if it was a visual story
        pageDiv.appendChild(document.createTextNode('[Visual not generated]'));
    }

    // Add description based on implementation?
    if (story.chosenImplementation && story.chosenImplementation.impact) {
        const desc = document.createElement('p');
        desc.textContent = story.chosenImplementation.impact;
        pageDiv.appendChild(desc);
    } else if (!story.tags.includes('Visual')) { // Add story text if not primarily visual
         const desc = document.createElement('p');
         desc.textContent = story.story; // Show user story text as fallback
         pageDiv.appendChild(desc);
    }


    return pageDiv;
}

// --- Button/State Updates ---
// Controls visibility and text of the main action button based on game phase
export function updateButtonVisibility(dayState) {
    const phaseName = GameState.getPhaseName(dayState); // Get phase name from state
    nextDayBtn.style.display = 'none'; // Hide by default

    if (phaseName === 'Day 1 Work') {
        nextDayBtn.style.display = 'inline-block';
        nextDayBtn.textContent = 'Proceed to Day 2 Work';
    } else if (phaseName === 'Day 2 Work') {
         nextDayBtn.style.display = 'inline-block';
         nextDayBtn.textContent = 'End Sprint / Go to Review';
    }
    // Buttons for Planning, Assignment, Review, Retro are inside their respective modals
}

// --- Obstacle Related ---
// Helper to get obstacle message for UI display
function getObstacleMessageForWorker(workerId) {
    const obstacles = GameState.getActiveObstacles ? GameState.getActiveObstacles() : [];
    const workerObstacle = obstacles.find(obs => obs.targetWorkerId === workerId && obs.type === 'capacity_reduction');
    return workerObstacle ? (workerObstacle.shortMessage || 'Affected by obstacle') : 'Unavailable'; // Provide default if no short msg
}