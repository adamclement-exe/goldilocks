# Goldilocks: A Scrum & Kanban Adventure (Simulation)

This is an educational browser-based simulation game designed to teach and demonstrate core concepts of Scrum and Kanban methodologies using the familiar story of Goldilocks and the Three Bears as the project theme.

Players take on the role of managing a small team over three Sprints to create pages for the Goldilocks storybook.


## Core Concepts Demonstrated

This simulation aims to provide hands-on experience with:

**Scrum:**
*   **Roles:** Implied (Product Owner via backlog prioritization, Scrum Master via facilitating flow, Development Team via workers).
*   **Events:**
    *   Sprint Planning (Selecting stories, making implementation choices).
    *   Daily Scrum (Reviewing progress, handling obstacles, reassigning workers).
    *   Sprint Review (Demoing completed work, calculating velocity/value, getting feedback).
    *   Sprint Retrospective (Reflecting on the process).
*   **Artifacts:**
    *   Product Backlog (Prioritized list of all story elements).
    *   Sprint Backlog (Stories committed for the current Sprint).
    *   Increment (The completed storybook pages at the end of each Sprint/Game).
*   **Other Scrum Elements:**
    *   User Stories (with Effort, Value, Tags).
    *   Story Points (Effort estimation).
    *   Velocity (Points completed per Sprint).
    *   Team Capacity.
    *   Definition of Done (DoD) (Selectable goal with required stories).

**Kanban:**
*   **Visualize Workflow:** The Kanban board shows stories moving through stages (Ready, In Progress, Testing, Done).
*   **Limit Work-In-Progress (WIP):** Explicit WIP limits are enforced on the 'In Progress' and 'Testing' columns to promote flow and prevent bottlenecks. The game actively prevents assigning work that would violate these limits.
*   **Manage Flow:** Players must actively manage which stories are worked on and how workers are assigned to ensure a smooth flow towards 'Done'.
*   **Make Policies Explicit:** WIP limits, unblocking policy (Seniors only, costs points), and DoD requirements are clearly defined.
*   **Implement Feedback Loops:** Daily Scrums, Reviews, and Retrospectives provide opportunities to inspect and adapt.
*   **Improve Collaboratively:** Retrospective inputs encourage thinking about process improvements.

**Other Game Mechanics:**
*   **Multi-Assignment:** Assign multiple workers (Devs or Testers) to a single story to potentially speed up completion.
*   **WIP Aging:** Stories display how long they've been in 'In Progress' or 'Testing', highlighting potential bottlenecks.
*   **Cycle Time:** Calculated in the Sprint Review, showing the average time stories take from start ('In Progress') to finish ('Done').
*   **Blockers:** Random obstacles can block stories, requiring a Senior Developer to unblock them.
*   **Worker Capacity/Obstacles:** Workers have daily point limits, and random obstacles can reduce capacity or make workers unavailable.
*   **Implementation Choices:** Some stories offer choices affecting effort, value, and the final visual/text output.

## Features

### Core Gameplay
- Sprint planning and execution
- Team capacity management
- Story development workflow
- Definition of Done (DoD) levels
- Sprint reviews and retrospectives

### Gamification Features

#### Achievements
- **Perfect Sprint**: Complete all planned stories in a sprint (50 points)
- **Testing Master**: Complete testing on 3 stories in one day (30 points)
- **Unblocking Hero**: Unblock 3 stories in one sprint (40 points)
- **Story Flow**: Complete 5 stories in a row without blocking (35 points)
- **Resource Master**: Use all team members perfectly for 3 days (45 points)

#### Special Events
- **Team Morale Boost**: All workers get +0.5 points for the day
- **Testing Focus**: Testing effort reduced by 1 point for the day
- **Creative Block**: Visual work capacity reduced by 50% for the day
- **Pair Programming**: Two workers can collaborate with 1.5x efficiency

#### Team Dynamics
- **Mentoring**: Seniors boost junior capacity when working together
- **Team Chemistry**: Workers in the same area get efficiency bonuses
- **Burnout**: Overworked workers get temporary capacity reduction

#### Visual Feedback
- Animated celebrations for completed stories
- Progress bars for team morale and story quality
- Achievement badges and indicators
- Sound effects for important events
- Interactive UI elements with hover effects

## How to Play

1.  **Run the Game:**
    *   Download or clone this repository.
    *   Open the `index.html` file in a modern web browser (Chrome, Firefox, Edge, Safari). No web server or build process is required.
    *   *(Note: Ensure your browser supports ES Modules, as the JavaScript uses `import`/`export`.)*

2.  **Read Instructions:** An instructions modal will appear on load. Read through the goals, game flow, and key concepts.

3.  **Choose Definition of Done (DoD):** Select the desired level of completeness (Easy, Medium, Hard) you aim to achieve by the end of Sprint 3. This sets required stories and bonus points.

4.  **Sprint Planning:** Select stories from the Product Backlog to add to the Sprint Backlog. Be mindful of your team's capacity. Make implementation choices when prompted. Click "Commit to Sprint".

5.  **Day 1 Assignment:** Assign one or more available Developers (Text/Visual) to stories in the Sprint Backlog ('Ready' column) using the checkboxes. Assigning workers moves stories to 'In Progress' (respecting WIP limits). Click "Confirm Assignments".

6.  **Work Day 1:** The simulation runs automatically, workers apply points, and progress is updated.

7.  **Daily Scrum & Reassignment (Days 2-5):**
    *   Review obstacles.
    *   Unassign workers from stories if needed (click '✕').
    *   Assign *additional* workers using the dropdowns (Devs to 'In Progress', Testers to 'Testing').
    *   Assign a Senior Developer to unblock any blocked stories.
    *   Click "Confirm Changes".

8.  **Work Days 2-5:** The simulation runs again after each reassignment phase.

9.  **Sprint Review:** At the end of Day 5's work, review completed stories, velocity, value, cycle time, and DoD progress.

10. **Sprint Retrospective:** Reflect on what went well, what could be improved, and what to change.

11. **Repeat:** Continue for Sprints 2 and 3.

12. **Final Storybook:** After Sprint 3's retrospective, view the final storybook pages based on completed stories and choices, and see if you met your chosen DoD!

**Goal:** Complete stories efficiently, manage WIP, deliver value, meet your DoD, and learn about Scrum/Kanban!

## Technology Stack

*   HTML5
*   CSS3
*   JavaScript (ES Modules)
*   [SortableJS](https://github.com/SortableJS/Sortable) (Currently used only for optional backlog sorting, drag/drop between columns is disabled)

## Future Improvements (Potential)

*   More sophisticated worker skills or specializations.
*   More varied and impactful obstacle types.
*   Team morale or burnout mechanics.
*   Different story scenarios or themes.
*   Enhanced metrics dashboard (CFD, Burn-up/down charts).
*   Saving and loading game state.
*   UI/UX refinements.

## Contributing

Contributions are welcome! Please feel free to fork the repository, create a feature branch, and submit a pull request. For major changes, please open an issue first to discuss.
