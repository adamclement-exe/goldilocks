// --- "Fake" API for Selecting Images ---
// TODO: Replace these paths with your actual image filenames in the /images/ folder

const imageMap = {
    // Story ID -> Implementation Description -> Image Path
    "story-1": { // Catchy Cover Page
        "Simple Title Text": "images/cover-simple.png", // Example path
        "Title with Simple Sketch": "images/cover-sketch.png",
        "Full Color Illustration": "images/cover-detailed.png"
    },
    "story-4": { // Cottage Visual
         "Simple line drawing": "images/cottage-sketch.png",
         "Colorful cottage picture": "images/cottage-color.png"
    },
     "story-6": { // Porridge Visual
         "Three simple bowl icons": "images/bowls-icons.png",
         "Picture of Goldilocks eating": "images/porridge-eating.png"
    },
     "story-8": { // Broken Chair Visual
         "Sketch of broken chair": "images/chair-broken-sketch.png",
         "Goldilocks falling visual": "images/chair-falling.png"
    },
     "story-10": { // Goldilocks Sleeping Visual
         "Simple 'Zzz' graphic": "images/sleeping-zzz.png",
         "Peaceful sleeping picture": "images/sleeping-peaceful.png"
    },
     "story-13": { // Bears Discover Goldilocks Visual
         "Bears looking shocked": "images/bears-shocked.png",
         "Bears looming over bed": "images/bears-discover.png"
    },
    // Add mappings for other visual stories...
    "default": "images/placeholder.png" // Fallback image
};

export function selectImageForStory(storyId, chosenImplementation) {
    if (!chosenImplementation) {
        // If no choice was made (e.g., story not visual or not completed with choice)
        // Maybe return a default based on storyId if it's inherently visual?
        // For now, return null or a placeholder if no specific implementation known.
        // Check if the story itself has a default visual tag maybe?
        // const story = getStory(storyId); // Need access to gameState here, tricky
        // if (story && story.tags.includes('Visual')) return imageMap['default'];
        return null; // Or imageMap['default'];
    }

    const storyImages = imageMap[storyId];
    if (storyImages && storyImages[chosenImplementation.description]) {
        return storyImages[chosenImplementation.description];
    }

    // Fallback if specific choice or story ID not found
    console.warn(`Image not found for story ${storyId}, choice: ${chosenImplementation.description}. Using default.`);
    return imageMap['default'];
}