// --- START OF FILE ui.js ---

import * as GameState from './gameState.js';
import { selectImageForStory } from './imageSelector.js';

// --- DOM Element References ---
const productBacklogList = document.getElementById('product-backlog-list');
const sprintBacklogList = document.getElementById('sprint-backlog-list');
// Sub-column lists
const inProgressDoingList = document.getElementById('inprogress-doing-list');
const inProgressDoneList = document.getElementById('inprogress-done-list');
const testingDoingList = document.getElementById('testing-doing-list');
const testingDoneList = document.getElementById('testing-done-list');
const doneList = document.getElementById('done-list'); // Final Done column
// Other refs
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

// Set to track pending unassignments in the Daily Scrum modal
export let pendingUnassignments = new Set();

// Tutorial Modals
const tutorialModals = {
    achievements: {
        title: "Achievements System",
        content: `
            <h3>Welcome to the Achievements System!</h3>
            <p>As you play, you'll unlock achievements for completing special challenges:</p>
            <ul>
                <li><strong>Perfect Sprint</strong>: Complete all planned stories in a sprint</li>
                <li><strong>Testing Master</strong>: Complete testing on 3 stories in one day</li>
                <li><strong>Unblocking Hero</strong>: Unblock 3 stories in one sprint</li>
                <li><strong>Story Flow</strong>: Complete 5 stories in a row without blocking</li>
                <li><strong>Resource Master</strong>: Use all team members perfectly for 3 days</li>
            </ul>
            <p>Each achievement gives bonus points and helps you track your progress!</p>
        `
    },
    events: {
        title: "Special Events",
        content: `
            <h3>Special Events System</h3>
            <p>Random events can occur during your sprint, affecting your team:</p>
            <ul>
                <li><strong>Team Morale Boost</strong>: All workers get +0.5 points for the day</li>
                <li><strong>Testing Focus</strong>: Testing effort reduced by 1 point for the day</li>
                <li><strong>Creative Block</strong>: Visual work capacity reduced by 50%</li>
                <li><strong>Pair Programming</strong>: Two workers can collaborate with 1.5x efficiency</li>
            </ul>
            <p>Adapt your strategy to make the most of these events!</p>
        `
    },
    teamDynamics: {
        title: "Team Dynamics",
        content: `
            <h3>Team Dynamics System</h3>
            <p>Your team members interact in special ways:</p>
            <ul>
                <li><strong>Mentoring</strong>: Seniors boost junior capacity when working together</li>
                <li><strong>Team Chemistry</strong>: Workers in the same area get efficiency bonuses</li>
                <li><strong>Burnout</strong>: Overworked workers get temporary capacity reduction</li>
            </ul>
            <p>Use these dynamics to optimize your team's performance!</p>
        `
    }
};

// Achievement Display
function createAchievementDisplay() {
    const container = document.createElement('div');
    container.id = 'achievement-display';
    container.className = 'achievement-container';
    
    const header = document.createElement('h3');
    header.textContent = 'Achievements';
    container.appendChild(header);
    
    const list = document.createElement('ul');
    list.id = 'achievement-list';
    container.appendChild(list);
    
    return container;
}

// Event Display
function createEventDisplay() {
    const container = document.createElement('div');
    container.id = 'event-display';
    container.className = 'event-container';
    
    const header = document.createElement('h3');
    header.textContent = 'Active Events';
    container.appendChild(header);
    
    const list = document.createElement('ul');
    list.id = 'event-list';
    container.appendChild(list);
    
    return container;
}

// Team Dynamics Display
function createTeamDynamicsDisplay() {
    const container = document.createElement('div');
    container.id = 'team-dynamics-display';
    container.className = 'team-dynamics-container';
    
    const header = document.createElement('h3');
    header.textContent = 'Team Dynamics';
    container.appendChild(header);
    
    const list = document.createElement('ul');
    list.id = 'team-dynamics-list';
    container.appendChild(list);
    
    return container;
}

// Show Tutorial Modal
export function showTutorialModal(topic) {
    const modal = document.createElement('div');
    modal.className = 'tutorial-modal';
    
    const content = document.createElement('div');
    content.className = 'tutorial-content';
    
    const title = document.createElement('h2');
    title.textContent = tutorialModals[topic].title;
    content.appendChild(title);
    
    const body = document.createElement('div');
    body.innerHTML = tutorialModals[topic].content;
    content.appendChild(body);
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Got it!';
    closeButton.onclick = () => modal.remove();
    content.appendChild(closeButton);
    
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// Update Achievement Display
export function updateAchievementDisplay() {
    const list = document.getElementById('achievement-list');
    if (!list) return;
    
    list.innerHTML = '';
    const achievements = GameState.getAchievements();
    
    achievements.forEach(achievement => {
        const item = document.createElement('li');
        item.className = 'achievement-item';
        
        const name = document.createElement('span');
        name.className = 'achievement-name';
        name.textContent = achievement.name;
        
        const points = document.createElement('span');
        points.className = 'achievement-points';
        points.textContent = `+${achievement.points} points`;
        
        item.appendChild(name);
        item.appendChild(points);
        list.appendChild(item);
    });
}

// Update Event Display
export function updateEventDisplay() {
    const list = document.getElementById('event-list');
    if (!list) return;
    
    list.innerHTML = '';
    const activeEvents = GameState.getActiveEvents();
    
    activeEvents.forEach(event => {
        const item = document.createElement('li');
        item.className = 'event-item';
        
        const name = document.createElement('span');
        name.className = 'event-name';
        name.textContent = event.name;
        
        const duration = document.createElement('span');
        duration.className = 'event-duration';
        duration.textContent = `${event.duration} day(s) remaining`;
        
        item.appendChild(name);
        item.appendChild(duration);
        list.appendChild(item);
    });
}

// Update Team Dynamics Display
export function updateTeamDynamicsDisplay() {
    const list = document.getElementById('team-dynamics-list');
    if (!list) return;
    
    list.innerHTML = '';
    const dynamics = GameState.getTeamDynamics();
    
    Object.entries(dynamics).forEach(([key, active]) => {
        if (active) {
            const item = document.createElement('li');
            item.className = 'dynamics-item';
            
            const name = document.createElement('span');
            name.className = 'dynamics-name';
            name.textContent = key;
            
            const description = document.createElement('span');
            description.className = 'dynamics-description';
            description.textContent = `Active: ${active}`;
            
            item.appendChild(name);
            item.appendChild(description);
            list.appendChild(item);
        }
    });
}

// Initialize UI Components
export function initializeGameUI() {
    // Get or create game container
    let gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        gameContainer = document.createElement('div');
        gameContainer.id = 'game-container';
        document.body.appendChild(gameContainer);
    }
    
    // Add displays to the game container
    const achievementDisplay = createAchievementDisplay();
    const eventDisplay = createEventDisplay();
    const teamDynamicsDisplay = createTeamDynamicsDisplay();
    
    gameContainer.appendChild(achievementDisplay);
    gameContainer.appendChild(eventDisplay);
    gameContainer.appendChild(teamDynamicsDisplay);
    
    // Add tutorial buttons
    const tutorialButtons = document.createElement('div');
    tutorialButtons.className = 'tutorial-buttons';
    
    const achievementTutorial = document.createElement('button');
    achievementTutorial.textContent = 'Achievements Help';
    achievementTutorial.onclick = () => showTutorialModal('achievements');
    
    const eventTutorial = document.createElement('button');
    eventTutorial.textContent = 'Events Help';
    eventTutorial.onclick = () => showTutorialModal('events');
    
    const dynamicsTutorial = document.createElement('button');
    dynamicsTutorial.textContent = 'Team Dynamics Help';
    dynamicsTutorial.onclick = () => showTutorialModal('teamDynamics');
    
    tutorialButtons.appendChild(achievementTutorial);
    tutorialButtons.appendChild(eventTutorial);
    tutorialButtons.appendChild(dynamicsTutorial);
    
    gameContainer.appendChild(tutorialButtons);
    
    // Initial updates
    updateAchievementDisplay();
    updateEventDisplay();
    updateTeamDynamicsDisplay();
}

// --- Rendering Functions ---
// Generic list renderer
function renderStoryList(listElement, stories) {
    if (!listElement) { console.error("Target list element not found for rendering stories:", listElement); return; }
    listElement.innerHTML = ''; // Clear previous content
    if (stories && stories.length > 0) {
        stories.forEach(story => {
            if (story) {
                const card = createStoryCard(story);
                if (card) {
                    // Make sure card is draggable only in Product Backlog
                    card.draggable = listElement.id === 'product-backlog-list';
                    listElement.appendChild(card);
                }
            } else { console.warn("Attempted to render an undefined story."); }
        });
    }
     // Update WIP counts after rendering any list that might affect them
     if (listElement.id === 'inprogress-doing-list' || listElement.id === 'testing-doing-list') {
          updateWipDisplays();
     }
}

// Specific render functions for each list/sub-list
export function renderProductBacklog(items) { renderStoryList(productBacklogList, items); }
export function renderSprintBacklog(items) { renderStoryList(sprintBacklogList, items); updateSprintPlanningUI(); }
export function renderInProgressDoing(items) { renderStoryList(inProgressDoingList, items); }
export function renderInProgressDone(items) { renderStoryList(inProgressDoneList, items); }
export function renderTestingDoing(items) { renderStoryList(testingDoingList, items); }
export function renderTestingDone(items) { renderStoryList(testingDoneList, items); }
export function renderDone(items) { renderStoryList(doneList, items); }

export function createStoryCard(story) {
    if (!storyCardTemplate || !story || !story.id) { console.error("Story card template or story data invalid:", story); return null; }
    const card = storyCardTemplate.content.cloneNode(true).querySelector('.story-card');
    card.dataset.storyId = story.id;
    card.dataset.status = story.status;
    card.dataset.subStatus = story.subStatus || 'none';
    card.style.cursor = 'default';
    card.querySelector('.story-title').textContent = story.title;
    card.querySelector('.story-effort').textContent = story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort;
    card.querySelector('.story-value').textContent = story.value;

    // WIP Aging Display
    const ageSpan = card.querySelector('.story-age');
    const isAgingState = (story.status !== 'backlog' && story.status !== 'ready' && story.status !== 'done');
    if (isAgingState && typeof story.daysInState === 'number' && story.daysInState >= 0) {
        ageSpan.textContent = `Age: ${story.daysInState}d`;
        ageSpan.style.display = 'inline';
        const isStuck = (story.subStatus === 'doing' || story.subStatus === 'done') && story.daysInState > 2;
        ageSpan.classList.toggle('aging', isStuck && !story.isBlocked);
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

    // Assigned Workers Display
    const assignmentDiv = card.querySelector('.story-assignment');
    const workerSpan = assignmentDiv.querySelector('.story-worker');
    if (story.assignedWorkers && story.assignedWorkers.length > 0) {
         const workerNames = story.assignedWorkers.map(id => {
             const worker = GameState.getWorkerById(id);
             return worker ? `${worker.name.split(' ')[0]} (${worker.area[0]})` : '?';
         }).filter(Boolean);
          workerSpan.textContent = workerNames.join(', ');
          assignmentDiv.style.display = 'block'; // Show div
    } else {
        workerSpan.textContent = ''; // Clear names
        // Hide "Assigned: " if not in a 'doing' state
        assignmentDiv.style.display = (story.status === 'inprogress' || story.status === 'testing') && story.subStatus === 'doing' ? 'block' : 'none';
        if (assignmentDiv.style.display === 'block') workerSpan.textContent = 'None'; // Show 'None' explicitly only if it should be shown but has no workers
    }

    // Blocker Display
    const blockerInfo = card.querySelector('.blocker-info');
    blockerInfo.style.display = story.isBlocked ? 'block' : 'none';
    card.dataset.blocked = story.isBlocked ? 'true' : 'false';

    // Progress Bars
    const devProgressElement = card.querySelector('.story-progress');
    const devProgressBar = devProgressElement.querySelector('.dev-progress');
    const devPointsRemainingSpan = devProgressElement.querySelector('.dev-points-remaining');
    const testProgressElement = card.querySelector('.story-testing-progress');
    const testProgressBar = testProgressElement.querySelector('.test-progress');
    const testPointsRemainingSpan = testProgressElement.querySelector('.test-points-remaining');

    const showDevProgress = story.status === 'inprogress' || story.status === 'testing' || story.status === 'done';
    devProgressElement.style.display = showDevProgress ? 'flex' : 'none'; // Use flex for label/progress alignment
    if(showDevProgress) {
        devProgressBar.value = story.progress || 0;
        devPointsRemainingSpan.textContent = `${Math.round(story.remainingEffort)} pts`;
    }

    const showTestProgress = story.status === 'testing' || story.status === 'done';
    testProgressElement.style.display = showTestProgress ? 'flex' : 'none'; // Use flex
    if(showTestProgress) {
        testProgressBar.value = story.testingProgress || 0;
        testPointsRemainingSpan.textContent = `${Math.round(story.testingEffortRemaining)} pts`;
    }

    // Apply aging visual effect based on data attribute
    card.dataset.aging = ageSpan.classList.contains('aging') ? 'true' : 'false';

    return card;
}

export function renderWorkers(workers) {
    if (!workerList) { console.error("Worker list element not found."); return; }
    workerList.innerHTML = '';
     if (!workerTemplate) { console.error("Worker template not found!"); return; }
    workers.forEach(worker => {
        const workerElement = workerTemplate.content.cloneNode(true).querySelector('.worker-status');
        workerElement.dataset.workerId = worker.id;
        workerElement.querySelector('.worker-name').textContent = worker.name;
        workerElement.querySelector('.worker-area').textContent = worker.area;
        workerElement.querySelector('.worker-skill').textContent = worker.skill;
        workerElement.querySelector('.worker-points').textContent = Math.round(worker.pointsPerDay * 10) / 10; // Round to 1 decimal place
        workerElement.querySelector('.worker-avatar').style.backgroundColor = getWorkerColor(worker.id);

        const stateElement = workerElement.querySelector('.worker-state');
        let stateText = 'Unknown';
        let stateClass = 'idle';

        const assignedStory = worker.assignedStory ? GameState.getStory(worker.assignedStory) : null;

        if (!worker.available) {
             const obstacleMsg = getObstacleMessageForWorker(worker.id);
             stateText = `Unavailable (${obstacleMsg || 'Reason Unknown'})`;
             stateClass = 'unavailable';
        } else if (worker.isUnblocking && assignedStory) {
            stateText = `Unblocking: ${assignedStory.title.substring(0,15)}...`;
            stateClass = 'unblocking';
        } else if (assignedStory) {
             if (assignedStory.isBlocked) {
                stateText = `Blocked on: ${assignedStory.title.substring(0,15)}...`;
                stateClass = 'blocked';
             } else {
                 const subStatusText = assignedStory.subStatus ? ` (${assignedStory.subStatus})` : '';
                 stateText = `Working: ${assignedStory.title.substring(0,12)}...${subStatusText}`;
                 stateClass = 'working';
             }
        } else {
            stateText = `Idle (${Math.round(worker.dailyPointsLeft * 10) / 10} pts left)`; // Round to 1 decimal place
            stateClass = 'idle';
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
    if (unblockingCostDisplay) {
         unblockingCostDisplay.textContent = GameState.UNBLOCKING_COST;
    }
}

// Updates WIP displays based on 'doing' sub-states
export function updateWipDisplays() {
    const wipLimits = GameState.getWipLimits();
    const currentWip = GameState.getCurrentWip(); // GameState.currentWip tracks 'doing'
    const columns = [
        { key: 'inprogress', headerId: 'col-inprogress', modalInfoId: `inprogress-wip-info`, dailyInfoId: `daily-wip-inprogress` },
        { key: 'testing', headerId: 'col-testing', modalInfoId: `testing-wip-info`, dailyInfoId: `daily-wip-testing` }
    ];

    columns.forEach(colInfo => {
        const limit = wipLimits[colInfo.key];
        const count = currentWip[colInfo.key];
        const isExceeded = count >= limit; // Exceeded if count is >= limit

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

        // Modals WIP Info
         const modalWipInfo = document.getElementById(colInfo.modalInfoId); // Day 1 modal ID
         const dailyWipSpan = document.getElementById(colInfo.dailyInfoId); // Day 2+ modal ID

         [modalWipInfo, dailyWipSpan].forEach(wipDisplayElement => {
              if(wipDisplayElement) {
                   const countSpan = wipDisplayElement.querySelector('.wip-count') || document.getElementById(`${colInfo.dailyInfoId}-count`);
                   const maxSpan = wipDisplayElement.querySelector('.wip-max') || document.getElementById(`${colInfo.dailyInfoId}-max`);
                   if (countSpan) countSpan.textContent = count;
                   if (maxSpan) maxSpan.textContent = limit;
                   wipDisplayElement.classList.toggle('exceeded', isExceeded);
              }
         });
    });
}


export function updateCard(storyId, storyData) {
    const card = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
    if (card && storyData) {
        const newCardContent = createStoryCard(storyData); // Re-create the card content only
        if (newCardContent) {
            const parentList = card.parentElement;
            const scrollPos = parentList ? parentList.scrollTop : 0;

            card.innerHTML = newCardContent.innerHTML; // Replace inner content
            // Re-apply data attributes
            card.dataset.status = storyData.status;
            card.dataset.subStatus = storyData.subStatus || 'none';
            card.dataset.blocked = storyData.isBlocked ? 'true' : 'false';
            card.dataset.aging = newCardContent.dataset.aging;

            if (parentList) { parentList.scrollTop = scrollPos; }
        }
    } else { console.warn(`Card with ID ${storyId} not found for update or invalid data.`); }
}

// Moves card to the correct list based on status and subStatus
export function moveCardToColumn(storyId, targetStatus, targetSubStatus = null) {
    const card = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
    const targetListId = getColumnListId(targetStatus, targetSubStatus);
    if (!targetListId) {
        console.error(`Cannot move card ${storyId}: No list ID found for ${targetStatus}/${targetSubStatus}`);
        return;
    }
    const targetList = document.getElementById(targetListId);

    if (card && targetList) {
        if (card.parentElement !== targetList) {
            const sourceList = card.parentElement;
            const sourceScroll = sourceList ? sourceList.scrollTop : 0;
            const targetScroll = targetList.scrollTop;

            // Calculate the target position
            const sourceRect = card.getBoundingClientRect();
            const targetRect = targetList.getBoundingClientRect();
            const xOffset = targetRect.left - sourceRect.left;
            
            // Store original position and add moving class
            const originalPosition = card.getBoundingClientRect();
            card.style.position = 'absolute';
            card.style.left = `${originalPosition.left}px`;
            card.style.top = `${originalPosition.top}px`;
            card.classList.add('moving');
            card.style.setProperty('--target-x', `${xOffset}px`);
            
            // Wait for animation to complete before moving the card
            setTimeout(() => {
                targetList.appendChild(card);
                card.dataset.status = targetStatus;
                card.dataset.subStatus = targetSubStatus || 'none';
                card.classList.remove('moving');
                card.style.removeProperty('--target-x');
                card.style.position = '';
                card.style.left = '';
                card.style.top = '';
                console.log(`UI: Moved card ${storyId} to list ${targetListId}`);

                if (sourceList) sourceList.scrollTop = sourceScroll;
                targetList.scrollTop = targetScroll;
            }, 2000); // Match this with the animation duration

        } else { // Already in correct list, just update data attributes
            card.dataset.status = targetStatus;
            card.dataset.subStatus = targetSubStatus || 'none';
        }
        updateWipDisplays();
    } else {
        console.warn(`UI Error: Could not move card ${storyId} to ${targetStatus}/${targetSubStatus}. Card or Target List (${targetListId}) not found.`);
        renderAllColumns(); // Fallback
    }
}

// Returns the ID of the correct list element based on status/substatus
function getColumnListId(status, subStatus = null) {
    if (status === 'backlog') return 'product-backlog-list';
    if (status === 'ready') return 'sprint-backlog-list';
    if (status === 'inprogress' && subStatus === 'doing') return 'inprogress-doing-list';
    if (status === 'inprogress' && subStatus === 'done') return 'inprogress-done-list';
    if (status === 'testing' && subStatus === 'doing') return 'testing-doing-list';
    if (status === 'testing' && subStatus === 'done') return 'testing-done-list';
    if (status === 'done') return 'done-list';

    console.error(`Unknown status/subStatus combination: ${status}/${subStatus}`);
    return null;
}

// Re-renders all lists based on current GameState
export function renderAllColumns() {
    console.log("Re-rendering all columns with sub-columns...");
    const allStories = Object.values(GameState.getAllStories());
    const sprintStoryIds = new Set(GameState.getSprintBacklogStories().map(s => s.id));

    renderProductBacklog(allStories.filter(s => s.status === 'backlog'));
    renderSprintBacklog(allStories.filter(s => s.status === 'ready' && sprintStoryIds.has(s.id))); // Only show committed Ready stories
    renderInProgressDoing(allStories.filter(s => s.status === 'inprogress' && s.subStatus === 'doing'));
    renderInProgressDone(allStories.filter(s => s.status === 'inprogress' && s.subStatus === 'done'));
    renderTestingDoing(allStories.filter(s => s.status === 'testing' && s.subStatus === 'doing'));
    renderTestingDone(allStories.filter(s => s.status === 'testing' && s.subStatus === 'done'));
    renderDone(allStories.filter(s => s.status === 'done'));

    renderWorkers(GameState.getTeam());
    updateWipDisplays();
}


// --- Modal Handling ---
export function showModal(modalElement) {
    if (modalElement && typeof modalElement.showModal === 'function') {
        if (!modalElement.open) {
             modalElement.showModal();
             setTimeout(() => { modalElement.scrollTop = 0; }, 0);
        } else {
             console.log(`>>> UI.showModal: Modal ${modalElement.id} is already open.`);
             setTimeout(() => { modalElement.scrollTop = 0; }, 0);
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

export function populateSprintPlanningModal(backlogStories, committedIds, currentCapacity) {
    planningBacklogSelection.innerHTML = '';
    const committedStoryIds = new Set(committedIds); // Use Set for faster lookup

    backlogStories.forEach(story => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `plan-select-${story.id}`;
        checkbox.value = story.id;
        checkbox.checked = committedStoryIds.has(story.id); // Check if already committed
        checkbox.dataset.effort = story.baseEffort;

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = ` ${story.title} (Effort: ${story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort}, Value: ${story.value}⭐)`;

        checkbox.addEventListener('change', (event) => {
             const storyId = event.target.value;
             const isChecked = event.target.checked;
             const storyData = GameState.getStory(storyId);
             if (!storyData) { console.error(`Story data not found for ID ${storyId} during planning change.`); return; }

             let actionSuccess = false;
             if (isChecked) {
                 if (storyData.implementationChoices && storyData.implementationChoices.length > 0 && !storyData.chosenImplementation) {
                     showProceduralChoiceModal(storyData);
                     // Expect choice modal to potentially call addStoryToSprint if needed
                 } else {
                     actionSuccess = GameState.addStoryToSprint(storyId);
                     if (actionSuccess) { moveCardToColumn(storyId, 'ready'); }
                     else { event.target.checked = false; alert(`Failed to add story ${storyData.title} to sprint.`); }
                 }
             } else { // Unchecking
                 actionSuccess = GameState.removeStoryFromSprint(storyId);
                 if (actionSuccess) { moveCardToColumn(storyId, 'backlog'); }
                 else { event.target.checked = true; alert(`Failed to remove story ${storyData.title} from sprint.`); }
             }
             updateSprintPlanningUI();
        });

        div.appendChild(checkbox);
        div.appendChild(label);
        planningBacklogSelection.appendChild(div);
    });
    updateSprintPlanningUI(); // Initial calculation
}


export function updateSprintPlanningUI() {
    let selectedPoints = 0;
    const sprintStories = GameState.getSprintBacklogStories();
    sprintStories.forEach(story => {
        if (story) {
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
    // Update labels if effort changed
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
             const div = document.createElement('div'); const radio = document.createElement('input'); radio.type = 'radio'; radio.name = `choice-${story.id}`; radio.id = `choice-${story.id}-${index}`; radio.value = index; if (index === 0) radio.checked = true;
             const label = document.createElement('label'); label.htmlFor = radio.id; label.textContent = ` ${choice.description} (Effort: ${choice.effort}, Impact: ${choice.impact})`;
             div.appendChild(radio); div.appendChild(label); choiceOptionsContainer.appendChild(div);
         });
     } else { choiceOptionsContainer.innerHTML = '<p>No implementation choices available.</p>'; } showModal(modal);
}


// Populates Day 1 Modal (Assign Devs to Ready stories)
export function populateWorkerAssignmentModal(storiesToAssign, availableWorkers) {
    if (!assignmentListContainer) { console.error("Assignment list container not found for Day 1 modal."); return; }
    assignmentListContainer.innerHTML = '';
    assignmentListContainer.removeEventListener('change', updateDay1AssignmentModalCheckboxes); // Use specific handler name
    updateWipDisplays();

    const readyStories = storiesToAssign.filter(s => s && s.status === 'ready'); // Ensure only ready stories

    if (readyStories.length === 0) {
        assignmentListContainer.innerHTML = '<p>No stories in the Sprint Backlog (Ready) require assignment.</p>';
        return;
    }

    readyStories.forEach(story => {
        const storyDiv = document.createElement('div');
        storyDiv.className = 'assignment-item'; storyDiv.dataset.storyId = story.id;

        // Story Info
        const storyInfo = document.createElement('div');
        storyInfo.innerHTML = `<strong>${story.title}</strong> (Effort: ${story.chosenImplementation ? story.chosenImplementation.effort : story.baseEffort})`;
        const wipWarningSpan = document.createElement('span');
        wipWarningSpan.className = 'wip-limit-warning'; wipWarningSpan.style.cssText = 'color: red; margin-left: 5px; font-weight: bold; display: none;';
        storyInfo.appendChild(wipWarningSpan);
        storyDiv.appendChild(storyInfo);

        // Tags
        const storyTags = Array.isArray(story.tags) ? story.tags : [];
        const storyDetails = document.createElement('span');
        storyDetails.className = 'story-details'; storyDetails.textContent = `Tags: ${storyTags.join(', ')}`;
        storyDetails.style.cssText = 'font-size: 0.85em; color: #666; display: block; margin-bottom: 3px;';
        storyDiv.appendChild(storyDetails);

        // Checkbox Section
        const assignLabel = document.createElement('label'); assignLabel.textContent = 'Assign Developers:';
        assignLabel.style.cssText = 'display: block; margin-top: 5px; font-weight: bold;';
        storyDiv.appendChild(assignLabel);
        const checkboxContainer = document.createElement('div'); checkboxContainer.className = 'worker-checkbox-container'; checkboxContainer.dataset.storyId = story.id;

        let hasDevs = false;
        availableWorkers.forEach(worker => {
            if (worker.area !== 'Testing') { // Only Devs
                hasDevs = true;
                const optionDiv = document.createElement('div'); optionDiv.className = 'worker-checkbox-option';
                const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
                checkbox.id = `assign-${story.id}-${worker.id}`; checkbox.value = worker.id;
                checkbox.dataset.storyId = story.id; checkbox.dataset.workerId = worker.id;
                const label = document.createElement('label'); label.htmlFor = checkbox.id;
                const specialtyMatch = storyTags.includes(worker.area);
                label.textContent = `${worker.name} (${worker.skill[0]} ${worker.pointsPerDay}pts)${specialtyMatch ? ' ✨' : ''}`;
                optionDiv.appendChild(checkbox); optionDiv.appendChild(label);
                checkboxContainer.appendChild(optionDiv);
            }
        });
        if (!hasDevs) { checkboxContainer.innerHTML = '<p style="font-size: 0.9em; color: #777;">No available developers.</p>'; }
        storyDiv.appendChild(checkboxContainer);
        assignmentListContainer.appendChild(storyDiv);
    });

    assignmentListContainer.addEventListener('change', updateDay1AssignmentModalCheckboxes);
    updateDay1AssignmentModalCheckboxes(); // Initial update
}

// Updates Day 1 Assignment Modal Checkboxes
function updateDay1AssignmentModalCheckboxes() {
    if (!assignmentListContainer) return;
    const allCheckboxes = assignmentListContainer.querySelectorAll('input[type="checkbox"]');
    const workersAssignedInModal = new Set();
    const storiesWithAssignments = new Set();

    allCheckboxes.forEach(cb => { if (cb.checked) { workersAssignedInModal.add(cb.value); storiesWithAssignments.add(cb.dataset.storyId); } });

    const currentWipInProgress = GameState.getCurrentWip().inprogress;
    const wipLimitInProgress = GameState.getWipLimits().inprogress;
    const projectedWip = currentWipInProgress + storiesWithAssignments.size;
    const wipLimitReached = projectedWip > wipLimitInProgress;

    // console.log(`Day 1 Assign - Current IP WIP: ${currentWipInProgress}, Stories newly selected: ${storiesWithAssignments.size}, Projected IP WIP: ${projectedWip}, Limit: ${wipLimitInProgress}, Reached (>): ${wipLimitReached}`);

    assignmentListContainer.querySelectorAll('.assignment-item').forEach(itemDiv => {
        const storyId = itemDiv.dataset.storyId;
        const isStorySelected = storiesWithAssignments.has(storyId);
        const wipWarning = itemDiv.querySelector('.wip-limit-warning');

        if (wipWarning) {
            wipWarning.style.display = (isStorySelected && wipLimitReached) ? 'inline' : 'none';
            if (isStorySelected && wipLimitReached) { wipWarning.textContent = ` (IP WIP Limit ${wipLimitInProgress} Reached!)`; }
        }

        itemDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            const workerId = cb.value;
            const isWorkerAssignedElsewhere = workersAssignedInModal.has(workerId) && !cb.checked;
            const disableBecauseWip = wipLimitReached && !isStorySelected && !cb.checked;
            cb.disabled = isWorkerAssignedElsewhere || disableBecauseWip;
            const label = cb.nextElementSibling;
            if (label) { label.style.textDecoration = cb.disabled ? 'line-through' : 'none'; label.style.color = cb.disabled ? '#aaa' : 'inherit'; }
        });
    });
}


// Populates Day 2+ Daily Scrum Modal (Reassignment/Blockers - Uses Checkboxes)
export function populateDailyScrumModal(day, workers, activeObstacles) {
    const modal = document.getElementById('daily-scrum-modal');
    if (!modal) return;
    modal.querySelector('h2').textContent = `Daily Scrum & Reassignment - Day ${day}`;
     const confirmBtn = document.getElementById('confirm-reassignments-btn');
     if(confirmBtn) { const span = confirmBtn.querySelector('#confirm-work-day-num'); if(span) span.textContent = day; }
    updateWipDisplays();
    if (unblockingCostDisplay) unblockingCostDisplay.textContent = GameState.UNBLOCKING_COST;

    pendingUnassignments.clear();

    obstacleDisplay.innerHTML = activeObstacles.length > 0 ? '<strong>Obstacles Today:</strong><ul>' + activeObstacles.map(obs => `<li>${obs.message}</li>`).join('') + '</ul>' : 'No new obstacles today.';

    reassignmentListContainer.innerHTML = '';
    blockerResolutionList.innerHTML = '';

    // Get stories relevant for this modal (IP-Doing, IP-Done, T-Doing) & Blocked stories
    const storiesForReassignment = Object.values(GameState.getAllStories()).filter(s =>
        !s.isBlocked && ( (s.status === 'inprogress' && (s.subStatus === 'doing' || s.subStatus === 'done')) || (s.status === 'testing' && s.subStatus === 'doing') )
    );
    const blockedStories = Object.values(GameState.getAllStories()).filter(s => s.isBlocked && ( (s.status === 'inprogress' && s.subStatus === 'doing') || (s.status === 'testing' && s.subStatus === 'doing') )); // Can only unblock 'doing'

    // --- Populate Reassignment Section ---
    if (storiesForReassignment.length === 0) { reassignmentListContainer.innerHTML = '<p>No active stories require worker assignment.</p>'; }
    else {
        storiesForReassignment.forEach(story => {
            const itemDiv = document.createElement('div'); itemDiv.className = 'reassignment-item'; itemDiv.dataset.storyId = story.id;

            const storyInfoDiv = document.createElement('div');
            let effortText = '';
            if (story.status === 'inprogress') effortText = `Dev Left: ${Math.round(story.remainingEffort)} pts`;
            else if (story.status === 'testing') effortText = `Test Left: ${Math.round(story.testingEffortRemaining)} pts`;
            const ageText = story.daysInState > 0 ? ` (Age: ${story.daysInState}d)` : '';
            const agingClass = story.daysInState > 2 ? ' aging' : '';
            storyInfoDiv.innerHTML = `<strong>${story.title}</strong> (${effortText})<br> State: ${story.status} (${story.subStatus || '?'})<span class="story-age${agingClass}">${ageText}</span>`;
            itemDiv.appendChild(storyInfoDiv);

            const currentWorkersDiv = document.createElement('div'); currentWorkersDiv.className = 'assigned-workers-list';
            currentWorkersDiv.innerHTML = 'Assigned: ';
            const assignedWorkers = GameState.getAssignedWorkersForStory(story.id);
            if (assignedWorkers.length > 0) {
                assignedWorkers.forEach(worker => {
                    const workerSpan = document.createElement('span'); workerSpan.style.cssText = 'margin-right: 10px; display: inline-block;';
                    const unassignBtn = document.createElement('button'); unassignBtn.textContent = '✕'; unassignBtn.title = `Unassign ${worker.name}`; unassignBtn.classList.add('unassign-worker-btn');
                    unassignBtn.dataset.workerId = worker.id; unassignBtn.dataset.storyId = story.id;
                    unassignBtn.style.cssText = 'margin-left: 3px; padding: 1px 4px; font-size: 0.8em; background-color: #e74c3c; color: white; border: none; cursor: pointer; border-radius: 2px;';
                    workerSpan.textContent = `${worker.name} (${worker.area[0]}) `; workerSpan.appendChild(unassignBtn); currentWorkersDiv.appendChild(workerSpan);
                });
            } else { currentWorkersDiv.innerHTML += 'None'; }
            itemDiv.appendChild(currentWorkersDiv);

            const checkboxSection = document.createElement('div'); checkboxSection.className = 'checkbox-assignment-section';
            const assignLabel = document.createElement('label'); const checkboxContainer = document.createElement('div'); checkboxContainer.className = 'worker-checkbox-container'; checkboxContainer.dataset.storyId = story.id;
            let workerTypeNeeded = '';
            if (story.status === 'inprogress' && story.subStatus === 'doing') { workerTypeNeeded = 'Dev'; assignLabel.textContent = 'Assign Addtl. Developers:'; }
            else if (story.status === 'inprogress' && story.subStatus === 'done') { workerTypeNeeded = 'Tester'; assignLabel.textContent = 'Assign Testers (Moves to Testing):'; }
            else if (story.status === 'testing' && story.subStatus === 'doing') { workerTypeNeeded = 'Tester'; assignLabel.textContent = 'Assign Addtl. Testers:'; }
            if(workerTypeNeeded) checkboxSection.appendChild(assignLabel);
            checkboxSection.appendChild(checkboxContainer); itemDiv.appendChild(checkboxSection);
            reassignmentListContainer.appendChild(itemDiv);
        });
    }
    document.getElementById('reassignment-section').style.display = 'block';

    // --- Populate Blocker Resolution Section ---
    const blockerSection = document.getElementById('blocker-resolution-section');
    if (blockedStories.length > 0) {
        blockerSection.style.display = 'block';
        blockedStories.forEach(story => {
            const itemDiv = document.createElement('div'); itemDiv.className = 'blocker-assignment-item'; itemDiv.dataset.storyId = story.id;
            const ageText = story.daysInState > 0 ? ` (Blocked ${story.daysInState}d)` : ''; const agingClass = story.daysInState > 2 ? ' aging' : '';
            itemDiv.innerHTML = `<strong>${story.title}</strong> <span style="color: orange;">[BLOCKED]</span><span class="story-age${agingClass}">${ageText}</span> (State: ${story.status}/${story.subStatus})<br>`;
            const selectLabel = document.createElement('label'); selectLabel.htmlFor = `unblock-assign-${story.id}`; selectLabel.textContent = 'Assign Senior Dev: ';
            const selectWorker = document.createElement('select'); selectWorker.id = `unblock-assign-${story.id}`; selectWorker.dataset.storyId = story.id;
            selectWorker.innerHTML = '<option value="">-- Select Available Senior --</option>'; // Options added later
            itemDiv.appendChild(selectLabel); itemDiv.appendChild(selectWorker); blockerResolutionList.appendChild(itemDiv);
        });
    } else { blockerSection.style.display = 'none'; }

    // Add event listeners
    reassignmentListContainer.removeEventListener('click', handleUnassignClick);
    reassignmentListContainer.addEventListener('click', handleUnassignClick);
    reassignmentListContainer.removeEventListener('change', updateDailyScrumCheckboxes); // Checkbox change listener
    reassignmentListContainer.addEventListener('change', updateDailyScrumCheckboxes);
    blockerResolutionList.removeEventListener('change', updateDailyScrumCheckboxes); // Blocker select change listener
    blockerResolutionList.addEventListener('change', updateDailyScrumCheckboxes);

    // Initial population/update of checkboxes/dropdowns
    updateDailyScrumCheckboxes();
}

// Event handler for unassign clicks ('✕') in Daily Scrum
function handleUnassignClick(event) {
    if (event.target.classList.contains('unassign-worker-btn')) {
        const button = event.target;
        const workerId = button.dataset.workerId;
        const storyId = button.dataset.storyId;

        if (!workerId || !storyId || button.disabled) return;

        const unassignKey = `${storyId}|${workerId}`;
        const workerSpan = button.closest('span');

        if (pendingUnassignments.has(unassignKey)) { // If already pending, toggle it back (re-assign visually)
            pendingUnassignments.delete(unassignKey);
             console.log(`UI De-Queueing Unassign: Worker ${workerId} from Story ${storyId}`);
             if (workerSpan) { workerSpan.style.textDecoration = 'none'; workerSpan.style.opacity = '1'; }
             button.disabled = false; // Re-enable button
        } else { // If not pending, mark for unassignment
             pendingUnassignments.add(unassignKey);
             console.log(`UI Queueing Unassign: Worker ${workerId} from Story ${storyId}`);
             if (workerSpan) { workerSpan.style.textDecoration = 'line-through'; workerSpan.style.opacity = '0.5'; }
             button.disabled = true; // Disable button while pending
        }
         console.log("Pending unassignments:", Array.from(pendingUnassignments));
         updateDailyScrumCheckboxes(); // Update the modal UI
    }
}


// Updates Day 2+ Modal Checkboxes and Blocker Dropdowns
function updateDailyScrumCheckboxes() {
    const allReassignmentItems = reassignmentListContainer.querySelectorAll('.reassignment-item');
    const allBlockerSelects = blockerResolutionList.querySelectorAll('select[id^="unblock-assign-"]');
    const wipLimits = GameState.getWipLimits();

    // --- 1. Calculate Visual State & Projected WIP ---
    const visuallyAssignedWorkersByStory = {}; // storyId -> Set(workerId)
    const visuallyAssignedWorkersGlobal = new Set(); // workerId (assigned anywhere visually)
    let projectedWip = { inprogress: GameState.getCurrentWip().inprogress, testing: GameState.getCurrentWip().testing };
    const storiesMovingToTestingDoing = new Set(); // Stories that WILL move due to checked tester

    // a. Consider existing assignments minus pending unassignments
    allReassignmentItems.forEach(item => {
        const storyId = item.dataset.storyId;
        visuallyAssignedWorkersByStory[storyId] = new Set();
        item.querySelectorAll('.unassign-worker-btn').forEach(btn => {
            const workerId = btn.dataset.workerId;
            if (!pendingUnassignments.has(`${storyId}|${workerId}`)) {
                visuallyAssignedWorkersByStory[storyId].add(workerId);
                visuallyAssignedWorkersGlobal.add(workerId);
            }
        });
    });

    // b. Consider workers assigned to BLOCKERS
    allBlockerSelects.forEach(sel => { if(sel.value) { visuallyAssignedWorkersGlobal.add(sel.value); } });

    // c. Consider CHECKED checkboxes and update projected WIP
    reassignmentListContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        const workerId = cb.value;
        const storyId = cb.dataset.storyId;
        const story = GameState.getStory(storyId);
        visuallyAssignedWorkersGlobal.add(workerId);
        if (story) {
             if(!visuallyAssignedWorkersByStory[storyId]) visuallyAssignedWorkersByStory[storyId] = new Set();
             visuallyAssignedWorkersByStory[storyId].add(workerId);

             // Check if assignment causes IP-Done -> T-Doing transition
             if (story.status === 'inprogress' && story.subStatus === 'done' && GameState.getWorkerById(workerId)?.area === 'Testing') {
                 // If this story isn't already counted as moving to testing, increment projected WIP
                 if (!storiesMovingToTestingDoing.has(storyId)) {
                      storiesMovingToTestingDoing.add(storyId);
                      projectedWip.testing++;
                 }
             }
        }
    });

    // --- 2. Determine Available Workers ---
    const generallyAvailableWorkers = GameState.getTeam().filter(w => w.available && !w.isUnblocking);
    // Workers available FOR checkboxes are those generally available MINUS those visually assigned anywhere else
    const workersAvailableForCheckboxes = generallyAvailableWorkers.filter(w => !visuallyAssignedWorkersGlobal.has(w.id));
    // Seniors available for BLOCKER dropdowns (check points later)
    const seniorsAvailableForBlockers = GameState.getAvailableSeniorDevs();

    // --- 3. Update Checkboxes for Reassignment Items ---
    allReassignmentItems.forEach(item => {
        const storyId = item.dataset.storyId;
        const story = GameState.getStory(storyId);
        if (!story || story.isBlocked) { // Don't show checkboxes for blocked stories
             const container = item.querySelector('.checkbox-assignment-section');
             if(container) container.innerHTML = '<p style="font-size:0.9em; color:#888;">(Story Blocked)</p>';
             return;
        }

        const checkboxContainer = item.querySelector('.worker-checkbox-container');
        if (!checkboxContainer) return;
        checkboxContainer.innerHTML = ''; // Clear old checkboxes

        let workerTypeNeeded = '';
        if (story.status === 'inprogress' && story.subStatus === 'doing') { workerTypeNeeded = 'Dev'; }
        else if (story.status === 'inprogress' && story.subStatus === 'done') { workerTypeNeeded = 'Tester'; }
        else if (story.status === 'testing' && story.subStatus === 'doing') { workerTypeNeeded = 'Tester'; }

        if (!workerTypeNeeded) { // Should not happen for displayed stories, but safeguard
            checkboxContainer.innerHTML = `<p style="font-size:0.9em; color:#888;">(Cannot assign workers in state: ${story.status}/${story.subStatus})</p>`;
            return;
        }

        const currentlyAssignedToThisStory = visuallyAssignedWorkersByStory[storyId] || new Set();
        const suitableWorkers = workersAvailableForCheckboxes.filter(w => {
             return (workerTypeNeeded === 'Dev' && w.area !== 'Testing') || (workerTypeNeeded === 'Tester' && w.area === 'Testing');
        });

        // Also include workers currently assigned (visually) to THIS story, so they can be unchecked
        currentlyAssignedToThisStory.forEach(assignedWorkerId => {
            if (!suitableWorkers.some(w => w.id === assignedWorkerId)) {
                 const assignedWorker = GameState.getWorkerById(assignedWorkerId);
                 // Only add if they match the type needed for the current state
                 if (assignedWorker && ((workerTypeNeeded === 'Dev' && assignedWorker.area !== 'Testing') || (workerTypeNeeded === 'Tester' && assignedWorker.area === 'Testing'))) {
                     suitableWorkers.push(assignedWorker);
                 }
            }
        });


        if (suitableWorkers.length === 0 && currentlyAssignedToThisStory.size === 0) {
             checkboxContainer.innerHTML = `<p style="font-size:0.9em; color:#888;">No available ${workerTypeNeeded}s.</p>`;
        } else {
            suitableWorkers.forEach(worker => {
                const optionDiv = document.createElement('div'); optionDiv.className = 'worker-checkbox-option';
                const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
                checkbox.id = `reassign-${story.id}-${worker.id}`; checkbox.value = worker.id;
                checkbox.dataset.storyId = story.id; checkbox.dataset.workerId = worker.id;
                checkbox.checked = currentlyAssignedToThisStory.has(worker.id); // Check based on visual state

                // --- WIP Limit Check ---
                let disableBecauseWip = false;
                 // Check ONLY if assigning a TESTER to an INPROGRESS-DONE story
                 if (!checkbox.checked && workerTypeNeeded === 'Tester' && story.status === 'inprogress' && story.subStatus === 'done') {
                     // If projected testing WIP is already >= limit AND this story wasn't the one counted, disable
                     if (projectedWip.testing >= wipLimits.testing && !storiesMovingToTestingDoing.has(storyId)) {
                          disableBecauseWip = true;
                          // console.log(`Disabling checkbox for ${worker.name} on ${story.title} due to Testing WIP limit (${projectedWip.testing}/${wipLimits.testing})`);
                     }
                 }
                // --- End WIP Limit Check ---

                 // Disable if visually assigned ELSEWHERE, or if WIP limit reached for this type of transition
                 checkbox.disabled = (visuallyAssignedWorkersGlobal.has(worker.id) && !currentlyAssignedToThisStory.has(worker.id)) || disableBecauseWip;

                const label = document.createElement('label'); label.htmlFor = checkbox.id;
                const storyTags = Array.isArray(story.tags) ? story.tags : []; const specialtyMatch = storyTags.includes(worker.area);
                label.textContent = `${worker.name} (${worker.skill[0]} ${worker.pointsPerDay}pts)${specialtyMatch ? ' ✨' : ''}`;
                 label.style.textDecoration = checkbox.disabled ? 'line-through' : 'none';
                 label.style.color = checkbox.disabled ? '#aaa' : 'inherit';

                optionDiv.appendChild(checkbox); optionDiv.appendChild(label); checkboxContainer.appendChild(optionDiv);
            });
        }
    });

    // --- 4. Update Blocker Select Dropdowns ---
    allBlockerSelects.forEach(sel => {
        const currentSelection = sel.value;
        sel.innerHTML = '<option value="">-- Select Available Senior --</option>';
        seniorsAvailableForBlockers.forEach(worker => {
            const isVisuallyAssignedElsewhere = visuallyAssignedWorkersGlobal.has(worker.id) && worker.id !== currentSelection;
            const option = document.createElement('option'); option.value = worker.id;
            option.textContent = `${worker.name} (${worker.skill} ${worker.area} - ${worker.dailyPointsLeft}pts left)`;
            option.disabled = worker.dailyPointsLeft < GameState.UNBLOCKING_COST || isVisuallyAssignedElsewhere;
            sel.appendChild(option);
        });
        const optionToRestore = sel.querySelector(`option[value="${currentSelection}"]`);
        if(optionToRestore && !optionToRestore.disabled) { sel.value = currentSelection; }
        else { sel.value = ''; } // Reset if selection no longer valid
    });
}


export function populateSprintReviewModal(sprintNum, completedStories, velocity, totalValue, avgCycleTime, sponsorFeedback, dodProgressFeedback) {
    modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
    reviewCompletedList.innerHTML = '';
    // Filter for stories actually in the final 'done' state
    const finalDoneStories = completedStories.filter(s => s.status === 'done');
    finalDoneStories.forEach(story => { const li = document.createElement('li'); li.textContent = `${story.title} (Effort: ${story.baseEffort}, Value: ${story.value}⭐)`; reviewCompletedList.appendChild(li); });

    reviewVelocityDisplay.textContent = velocity; reviewValueDisplay.textContent = totalValue;
    reviewCycleTimeDisplay.textContent = avgCycleTime !== null ? `${avgCycleTime} work day(s)` : 'N/A';
    reviewSponsorFeedback.textContent = sponsorFeedback || "..."; reviewDodProgressDisplay.textContent = dodProgressFeedback || "";
    reviewStorybookPreview.innerHTML = '';

    const storyOrder = [ "Cover", "Introduce", "Finds Cottage", "Cottage Visual", "Porridge Testing", "Porridge Visual", "Chair Testing", "Broken Chair Visual", "Bed Testing", "Sleeping Visual", "Return", "Discover Mess", "Discover Goldilocks Visual", "Wakes Up & Flees", "End Page", "Back Cover"];
    const sortedCompleted = [...finalDoneStories].sort((a, b) => { // Sort only final done stories
        const indexA = storyOrder.findIndex(p => a.title.includes(p)); const indexB = storyOrder.findIndex(p => b.title.includes(p));
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
     });
    sortedCompleted.forEach(story => { const pagePreview = createStorybookPagePreview(story); if (pagePreview) { reviewStorybookPreview.appendChild(pagePreview); } });
    showModal(document.getElementById('sprint-review-modal'));
}


export function populateRetrospectiveModal(sprintNum) {
     modalSprintNumberDisplays.forEach(el => el.textContent = sprintNum);
     const retroFormElement = document.getElementById('retro-form');
     if (retroFormElement) retroFormElement.reset();
     const submitButton = document.querySelector('#retro-form button[type="submit"]');

     if (sprintNum >= 3) {
         if(endGameBtn) endGameBtn.style.display = 'inline-block';
         if(submitButton) submitButton.style.display = 'none';
     }
     else {
         if(endGameBtn) endGameBtn.style.display = 'none';
         if(submitButton) submitButton.style.display = 'inline-block';
     }
     showModal(document.getElementById('sprint-retrospective-modal'));
}

export function populateFinalStorybook(completedStories) { // completedStories are those in final 'done' state
    finalStorybookPages.innerHTML = '';
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
                 dodStatusDiv.innerHTML += `<p>Missing Required Stories:</p><ul style="margin-top: 5px; padding-left: 20px; list-style: disc;">`;
                 missingIds.forEach(id => { const story = GameState.getStory(id); dodStatusDiv.innerHTML += `<li>${story ? story.title : id}</li>`; });
                 dodStatusDiv.innerHTML += `</ul>`;
            }
        }
    } else { dodStatusDiv.innerHTML = '<p>No Definition of Done was set.</p>'; }
    finalStorybookPages.appendChild(dodStatusDiv);

    if (completedStories.length === 0) {
        finalStorybookPages.appendChild(document.createElement('p')).textContent = "Oh no! It looks like no pages of the storybook were completed.";
    } else {
        const storyOrder = [ "Cover", "Introduce", "Finds Cottage", "Cottage Visual", "Porridge Testing", "Porridge Visual", "Chair Testing", "Broken Chair Visual", "Bed Testing", "Sleeping Visual", "Return", "Discover Mess", "Discover Goldilocks Visual", "Wakes Up & Flees", "End Page", "Back Cover"];
         const sortedStories = [...completedStories].sort((a, b) => {
             const indexA = storyOrder.findIndex(p => a.title.includes(p)); const indexB = storyOrder.findIndex(p => b.title.includes(p));
             return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
         });
        sortedStories.forEach(story => { const page = createStorybookPagePreview(story, true); if (page) { finalStorybookPages.appendChild(page); } });
    }
    showModal(document.getElementById('final-storybook-modal'));
}


function createStorybookPagePreview(story, isFinal = false) {
    if (!story) return null;
    const pageDiv = document.createElement('div');
    pageDiv.classList.add('storybook-page-preview');
    if (isFinal) pageDiv.style.maxWidth = '250px';

    const title = document.createElement('h5'); title.textContent = story.title; pageDiv.appendChild(title);
    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = 'flex-grow: 1; display: flex; align-items: center; justify-content: center; min-height: 80px; margin-bottom: 8px;';
    const imageUrl = selectImageForStory(story.id, story.chosenImplementation);
    if (imageUrl && story.tags.includes('Visual')) {
        const img = document.createElement('img'); img.src = imageUrl; img.alt = story.title;
        img.style.cssText = `max-width: 100%; max-height: ${isFinal ? '120px' : '100px'}; height: auto; border-radius: 3px; object-fit: contain;`;
        imgContainer.appendChild(img);
    } else if (story.tags.includes('Visual')) {
        const placeholder = document.createElement('p'); placeholder.textContent = '[Visual Story - Image Missing]'; placeholder.style.cssText = 'color: #aaa; font-style: italic;';
        imgContainer.appendChild(placeholder);
    }
    pageDiv.appendChild(imgContainer);
    const textContainer = document.createElement('div'); textContainer.style.marginTop = 'auto';
    if (story.chosenImplementation?.impact) {
         textContainer.appendChild(document.createElement('p')).textContent = story.chosenImplementation.impact;
    } else if (!story.tags.includes('Visual') && story.story && !story.chosenImplementation?.impact) {
         const desc = textContainer.appendChild(document.createElement('p'));
         desc.textContent = story.story.length > 100 ? story.story.substring(0, 97) + "..." : story.story; desc.style.fontSize = '0.9em';
    } else if (!story.tags.includes('Visual')) {
        const placeholder = textContainer.appendChild(document.createElement('p')); placeholder.textContent = '[Text Content Placeholder]'; placeholder.style.cssText = 'color: #aaa; font-style: italic;';
    }
    pageDiv.appendChild(textContainer);
    return pageDiv;
}


// --- Button/State Updates ---
export function updateButtonVisibility(dayState) {
    const phaseName = GameState.getPhaseName(dayState);
    if (!nextDayBtn) return;
    nextDayBtn.style.display = 'none';
    if ([2, 4, 6, 8, 10].includes(dayState)) { // End of Work Day phases
        nextDayBtn.style.display = 'inline-block';
        nextDayBtn.textContent = dayState === 10 ? 'End Sprint / Go to Review' : `Proceed to Day ${(dayState / 2) + 1} Reassignment`;
    }
}

// --- Obstacle Related ---
function getObstacleMessageForWorker(workerId) {
    const obstacles = GameState.getActiveObstacles ? GameState.getActiveObstacles() : [];
    const workerObstacle = obstacles.find(obs => obs.targetWorkerId === workerId && obs.type === 'capacity_reduction');
    const worker = GameState.getWorkerById(workerId);
    if (worker && !worker.available && workerObstacle && workerObstacle.makesUnavailable) { return workerObstacle.shortMessage || 'Unavailable'; }
    else if (worker && !worker.available) { return 'Unavailable'; }
    return '';
}

// --- END OF FILE ui.js ---