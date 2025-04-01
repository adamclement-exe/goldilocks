// --- Kanban Board Initialization (No Drag/Drop Between Columns) ---

export function initializeKanbanBoards(onMoveCallback) { // Callback likely not needed now

    // Allow sorting within Product Backlog only (optional)
    const backlogList = document.getElementById('product-backlog-list');
    if (backlogList) {
        try {
            new Sortable(backlogList, {
                group: 'product-backlog', // Unique group for backlog sorting
                animation: 150,
                ghostClass: 'sortable-ghost',
                // onEnd: handleBacklogSort // Optional: Define if you need to save priority changes
            });
        } catch (e) {
            console.error("Failed to initialize SortableJS on Product Backlog:", e);
        }
    } else {
        console.warn("Product Backlog list element not found.");
    }

    // Do NOT initialize SortableJS on the other columns (Ready, In Progress, Done)
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