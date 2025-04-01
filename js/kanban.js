// --- START OF FILE kanban.js ---

// --- Kanban Board Initialization (No Drag/Drop Between Columns) ---

export function initializeKanbanBoards(onMoveCallback) { // Callback likely not needed now

    // Allow sorting within Product Backlog only (optional)
    const backlogList = document.getElementById('product-backlog-list');
    if (backlogList) {
        // *** Check if Sortable exists on the window object ***
        if (typeof window.Sortable !== 'undefined') {
            try {
                // *** Use window.Sortable ***
                new window.Sortable(backlogList, {
                    group: 'product-backlog', // Unique group for backlog sorting
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    // onEnd: handleBacklogSort // Optional: Define if you need to save priority changes
                });
                 console.log("SortableJS initialized on Product Backlog.");
            } catch (e) {
                console.error("Failed to initialize SortableJS on Product Backlog:", e);
            }
        } else {
            // *** Log error if Sortable library isn't loaded ***
            console.error("SortableJS library not found. Drag/drop within Product Backlog will be disabled.");
        }
    } else {
        console.warn("Product Backlog list element not found for SortableJS initialization.");
    }

    // Do NOT initialize SortableJS on the other columns (Ready, In Progress, Testing, Done)
    // to prevent drag-and-drop between them.

    console.log("Kanban boards initialized (Drag/Drop between columns disabled).");
}

// Optional: Handler if you implement saving backlog sort order
/*
function handleBacklogSort(evt) {
    const itemEl = evt.item;
    const newIndex = evt.newIndex;
    const storyId = itemEl.dataset.storyId;
    console.log(`Backlog item ${storyId} moved to index ${newIndex}`);
    // TODO: Update the order in GameState.state.productBacklog array
}
*/

// handleSortableEnd for inter-column moves is no longer needed.
// --- END OF FILE kanban.js ---