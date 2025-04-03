// Effort values scaled approx 3x for 8 staff / 5 work days / 80 points/sprint capacity

export const initialProductBacklog = [
  {
    id_stub_for_scaling: "story-1", // Keep original ID reference if needed elsewhere
    title: "Catchy Cover Page",
    story: "As a reader, I want an exciting cover page, so that I am drawn to open the book.",
    effort: 6, // Reduced from 9
    value: 5,
    tags: ["Visual", "Design", "Marketing"],
    implementationChoices: [
        { description: "Simple Title Text", effort: 2, impact: "A basic text cover." },
        { description: "Title with Simple Sketch", effort: 6, impact: "A cover with a cute sketch of Goldilocks." },
        { description: "Full Color Illustration", effort: 10, impact: "A vibrant, full-color cover illustration." }
    ]
  },
  {
    id_stub_for_scaling: "story-2",
    title: "Introduce Goldilocks",
    story: "As a reader, I want to know who Goldilocks is, so that I understand the main character.",
    effort: 6, // Base effort (scaled)
    value: 4,
    tags: ["Text", "Character"],
    implementationChoices: [
        { description: "Basic intro sentence", effort: 3, impact: "Goldilocks is introduced briefly." }, // 1 * 3
        { description: "Paragraph describing Goldilocks", effort: 6, impact: "A short paragraph describes Goldilocks and her walk." } // 2 * 3
    ]
  },
   {
    id_stub_for_scaling: "story-3",
    title: "Goldilocks Finds Cottage",
    story: "As a reader, I want Goldilocks to find the bears' cottage, so the story can proceed.",
    effort: 6, // Base effort (scaled)
    value: 4,
    tags: ["Text", "Plot"],
     implementationChoices: [
        { description: "She finds a house", effort: 3, impact: "Goldilocks finds a cottage in the woods." }, // 1 * 3
        { description: "Detailed cottage description", effort: 9, impact: "The cozy bears' cottage is described in charming detail." } // 3 * 3
    ]
  },
  {
    id_stub_for_scaling: "story-4",
    title: "Cottage Visual",
    story: "As a reader, I want to see the bears' cottage, so I can imagine the setting.",
    effort: 6, // Reduced from 9
    value: 3,
    tags: ["Visual", "Setting"],
     implementationChoices: [
        { description: "Simple line drawing", effort: 4, impact: "A basic sketch shows the cottage exterior." },
        { description: "Colorful cottage picture", effort: 8, impact: "A welcoming, colorful picture of the bears' cottage." }
    ]
  },
  {
    id_stub_for_scaling: "story-5",
    title: "Porridge Testing Scene",
    story: "As a reader, I want Goldilocks to try the three porridges, so I experience the core conflict.",
    effort: 9, // Reduced from 12
    value: 5,
    tags: ["Text", "Plot", "Activity"],
     implementationChoices: [
        { description: "Lists the results", effort: 4, impact: "Goldilocks tries the porridges: too hot, too cold, just right." },
        { description: "Describes reactions vividly", effort: 9, impact: "Goldilocks' funny reactions to each porridge bowl are described." }
    ]
  },
   {
    id_stub_for_scaling: "story-6",
    title: "Porridge Visual",
    story: "As a reader, I want to see the three porridge bowls, so I can visualize the scene.",
    effort: 6, // Base effort (scaled)
    value: 3,
    tags: ["Visual"],
     implementationChoices: [
        { description: "Three simple bowl icons", effort: 3, impact: "Basic icons represent the three bowls." }, // 1 * 3
        { description: "Picture of Goldilocks eating", effort: 9, impact: "A picture shows Goldilocks tasting the 'just right' porridge." } // 3 * 3
    ]
  },
  {
    id_stub_for_scaling: "story-7",
    title: "Chair Testing Scene",
    story: "As a reader, I want Goldilocks to try the three chairs, so the story pattern continues.",
    effort: 9, // Base effort (scaled)
    value: 4,
    tags: ["Text", "Plot"],
     implementationChoices: [
        { description: "Lists the results", effort: 6, impact: "Goldilocks tries the chairs: too hard, too soft, breaks." }, // 2 * 3
        { description: "Describes the breaking chair", effort: 9, impact: "The scene focuses on the little chair breaking dramatically." } // 3 * 3
    ]
  },
   {
    id_stub_for_scaling: "story-8",
    title: "Broken Chair Visual",
    story: "As a reader, I want to see the broken chair, for comedic effect.",
    effort: 6, // Base effort (scaled)
    value: 4,
    tags: ["Visual"],
     implementationChoices: [
        { description: "Sketch of broken chair", effort: 6, impact: "A simple drawing shows the small, broken chair." }, // 2 * 3
        { description: "Goldilocks falling visual", effort: 9, impact: "A funny picture shows Goldilocks falling as the chair breaks." } // 3 * 3
    ]
  },
  {
    id_stub_for_scaling: "story-9",
    title: "Bed Testing Scene",
    story: "As a reader, I want Goldilocks to try the three beds and fall asleep, setting up the climax.",
    effort: 9, // Base effort (scaled)
    value: 5,
    tags: ["Text", "Plot"],
     implementationChoices: [
        { description: "Lists the results & sleep", effort: 6, impact: "Goldilocks tries the beds and falls asleep in the small one." }, // 2 * 3
        { description: "Describes her sleepiness", effort: 9, impact: "Text emphasizes how tired she was before finding the perfect bed." } // 3 * 3
    ]
  },
   {
    id_stub_for_scaling: "story-10",
    title: "Goldilocks Sleeping Visual",
    story: "As a reader, I want to see Goldilocks asleep, showing her vulnerability.",
    effort: 6, // Base effort (scaled)
    value: 3,
    tags: ["Visual"],
     implementationChoices: [
        { description: "Simple 'Zzz' graphic", effort: 3, impact: "A simple icon shows Goldilocks asleep." }, // 1 * 3
        { description: "Peaceful sleeping picture", effort: 9, impact: "A picture shows Goldilocks sleeping soundly in the little bed." } // 3 * 3
    ]
  },
  {
    id_stub_for_scaling: "story-11",
    title: "Bears Return Home",
    story: "As a reader, I want the bears to return, creating tension.",
    effort: 6, // Base effort (scaled)
    value: 5,
    tags: ["Text", "Plot", "Character"],
     implementationChoices: [
        { description: "Bears come back", effort: 3, impact: "The three bears return to their cottage." }, // 1 * 3
        { description: "Dialogue as they enter", effort: 9, impact: "The bears talk amongst themselves as they come home." } // 3 * 3
    ]
  },
  {
    id_stub_for_scaling: "story-12",
    title: "Bears Discover Mess",
    story: "As a reader, I want the bears to discover the porridge, chairs, and beds, building the climax.",
    effort: 9, // Reduced from 15
    value: 5,
    tags: ["Text", "Plot", "Dialogue"],
     implementationChoices: [
        { description: "List discoveries", effort: 6, impact: "The bears find the eaten porridge, broken chair, and used beds." },
        { description: "Full dialogue sequence", effort: 9, impact: "'Somebody's been eating my porridge!' The bears' famous lines are included." }
    ]
  },
   {
    id_stub_for_scaling: "story-13",
    title: "Bears Discover Goldilocks Visual",
    story: "As a reader, I want to see the bears finding Goldilocks, the story's climax.",
    effort: 9, // Base effort (scaled)
    value: 5,
    tags: ["Visual", "Climax"],
     implementationChoices: [
        { description: "Bears looking shocked", effort: 6, impact: "A picture shows the three bears looking surprised." }, // 2 * 3
        { description: "Bears looming over bed", effort: 12, impact: "A dramatic picture shows the bears discovering Goldilocks in the bed." } // 4 * 3
    ]
  },
  {
    id_stub_for_scaling: "story-14",
    title: "Goldilocks Wakes Up & Flees",
    story: "As a reader, I want Goldilocks to wake up and run away, resolving the immediate conflict.",
    effort: 9, // Base effort (scaled)
    value: 4,
    tags: ["Text", "Plot", "Resolution"],
     implementationChoices: [
        { description: "She wakes and runs", effort: 3, impact: "Goldilocks wakes up, sees the bears, and runs away." }, // 1 * 3
        { description: "Describes her fright", effort: 9, impact: "The text emphasizes how scared Goldilocks was as she fled." } // 3 * 3
    ]
  },
  {
    id_stub_for_scaling: "story-15",
    title: "The End Page",
    story: "As a reader, I want a concluding page, signifying the story is over.",
    effort: 3, // Base effort (scaled)
    value: 3,
    tags: ["Text", "Marketing"],
     implementationChoices: [
        { description: "'The End' text", effort: 3, impact: "A simple page says 'The End'." }, // 1 * 3
        { description: "Moral of the story", effort: 6, impact: "A concluding page includes a simple moral about respecting others' property." } // 2 * 3
    ]
  },
   {
    id_stub_for_scaling: "story-16",
    title: "Back Cover Blurb",
    story: "As a publisher, I want a catchy blurb on the back cover, to encourage purchases.",
    effort: 4, // Reduced from 6
    value: 2,
    tags: ["Marketing", "Text"],
     implementationChoices: [
        { description: "Basic summary", effort: 2, impact: "A simple summary for the back cover." },
        { description: "Engaging question", effort: 4, impact: "A catchy question on the back cover to entice readers." }
    ]
  }
];

// Note: The dodDefinitions file was *not* requested for update, but its requiredStoryIds still reference the original IDs like 'story-1'.
// The initialProductBacklog array above *is* the data source used by gameState.js's loadInitialState function.
// The loadInitialState function generates the final story IDs like `story-${counter}` and assigns the scaled effort values from this file to the state.
// The `id_stub_for_scaling` is just a comment for reference during scaling and is not used by the game logic.