// Initial Product Backlog Data
// Effort: 1-5 points
// Value: 1-5 stars
// implementationChoices: Optional array for procedural choices
//   - description: Text shown to player
//   - effort: Points for this choice
//   - impact: Text describing the outcome (used in review/final book)

export const initialProductBacklog = [
    {
      title: "Catchy Cover Page",
      story: "As a reader, I want an exciting cover page, so that I am drawn to open the book.",
      effort: 3, // Base effort if no choices
      value: 5,
      tags: ["Visual", "Design", "Marketing"],
      implementationChoices: [
          { description: "Simple Title Text", effort: 1, impact: "A basic text cover." },
          { description: "Title with Simple Sketch", effort: 3, impact: "A cover with a cute sketch of Goldilocks." },
          { description: "Full Color Illustration", effort: 5, impact: "A vibrant, full-color cover illustration." }
      ]
    },
    {
      title: "Introduce Goldilocks",
      story: "As a reader, I want to know who Goldilocks is, so that I understand the main character.",
      effort: 2,
      value: 4,
      tags: ["Text", "Character"],
      implementationChoices: [
          { description: "Basic intro sentence", effort: 1, impact: "Goldilocks is introduced briefly." },
          { description: "Paragraph describing Goldilocks", effort: 2, impact: "A short paragraph describes Goldilocks and her walk." }
      ]
    },
     {
      title: "Goldilocks Finds Cottage",
      story: "As a reader, I want Goldilocks to find the bears' cottage, so the story can proceed.",
      effort: 2,
      value: 4,
      tags: ["Text", "Plot"],
       implementationChoices: [
          { description: "She finds a house", effort: 1, impact: "Goldilocks finds a cottage in the woods." },
          { description: "Detailed cottage description", effort: 3, impact: "The cozy bears' cottage is described in charming detail." }
      ]
    },
    {
      title: "Cottage Visual",
      story: "As a reader, I want to see the bears' cottage, so I can imagine the setting.",
      effort: 3,
      value: 3,
      tags: ["Visual", "Setting"],
       implementationChoices: [
          { description: "Simple line drawing", effort: 2, impact: "A basic sketch shows the cottage exterior." },
          { description: "Colorful cottage picture", effort: 4, impact: "A welcoming, colorful picture of the bears' cottage." }
      ]
    },
    {
      title: "Porridge Testing Scene",
      story: "As a reader, I want Goldilocks to try the three porridges, so I experience the core conflict.",
      effort: 4,
      value: 5,
      tags: ["Text", "Plot", "Activity"], // Activity tag if we imagine interaction
       implementationChoices: [
          { description: "Lists the results", effort: 2, impact: "Goldilocks tries the porridges: too hot, too cold, just right." },
          { description: "Describes reactions vividly", effort: 4, impact: "Goldilocks' funny reactions to each porridge bowl are described." }
      ]
    },
     {
      title: "Porridge Visual",
      story: "As a reader, I want to see the three porridge bowls, so I can visualize the scene.",
      effort: 2,
      value: 3,
      tags: ["Visual"],
       implementationChoices: [
          { description: "Three simple bowl icons", effort: 1, impact: "Basic icons represent the three bowls." },
          { description: "Picture of Goldilocks eating", effort: 3, impact: "A picture shows Goldilocks tasting the 'just right' porridge." }
      ]
    },
    {
      title: "Chair Testing Scene",
      story: "As a reader, I want Goldilocks to try the three chairs, so the story pattern continues.",
      effort: 3,
      value: 4,
      tags: ["Text", "Plot"],
       implementationChoices: [
          { description: "Lists the results", effort: 2, impact: "Goldilocks tries the chairs: too hard, too soft, breaks." },
          { description: "Describes the breaking chair", effort: 3, impact: "The scene focuses on the little chair breaking dramatically." }
      ]
    },
     {
      title: "Broken Chair Visual",
      story: "As a reader, I want to see the broken chair, for comedic effect.",
      effort: 2,
      value: 4,
      tags: ["Visual"],
       implementationChoices: [
          { description: "Sketch of broken chair", effort: 2, impact: "A simple drawing shows the small, broken chair." },
          { description: "Goldilocks falling visual", effort: 3, impact: "A funny picture shows Goldilocks falling as the chair breaks." }
      ]
    },
    {
      title: "Bed Testing Scene",
      story: "As a reader, I want Goldilocks to try the three beds and fall asleep, setting up the climax.",
      effort: 3,
      value: 5,
      tags: ["Text", "Plot"],
       implementationChoices: [
          { description: "Lists the results & sleep", effort: 2, impact: "Goldilocks tries the beds and falls asleep in the small one." },
          { description: "Describes her sleepiness", effort: 3, impact: "Text emphasizes how tired she was before finding the perfect bed." }
      ]
    },
     {
      title: "Goldilocks Sleeping Visual",
      story: "As a reader, I want to see Goldilocks asleep, showing her vulnerability.",
      effort: 2,
      value: 3,
      tags: ["Visual"],
       implementationChoices: [
          { description: "Simple 'Zzz' graphic", effort: 1, impact: "A simple icon shows Goldilocks asleep." },
          { description: "Peaceful sleeping picture", effort: 3, impact: "A picture shows Goldilocks sleeping soundly in the little bed." }
      ]
    },
    {
      title: "Bears Return Home",
      story: "As a reader, I want the bears to return, creating tension.",
      effort: 2,
      value: 5,
      tags: ["Text", "Plot", "Character"],
       implementationChoices: [
          { description: "Bears come back", effort: 1, impact: "The three bears return to their cottage." },
          { description: "Dialogue as they enter", effort: 3, impact: "The bears talk amongst themselves as they come home." }
      ]
    },
    {
      title: "Bears Discover Mess",
      story: "As a reader, I want the bears to discover the porridge, chairs, and beds, building the climax.",
      effort: 5, // More complex scene
      value: 5,
      tags: ["Text", "Plot", "Dialogue"],
       implementationChoices: [
          { description: "List discoveries", effort: 3, impact: "The bears find the eaten porridge, broken chair, and used beds." },
          { description: "Full dialogue sequence", effort: 5, impact: "'Somebody's been eating my porridge!' The bears' famous lines are included." }
      ]
    },
     {
      title: "Bears Discover Goldilocks Visual",
      story: "As a reader, I want to see the bears finding Goldilocks, the story's climax.",
      effort: 3,
      value: 5,
      tags: ["Visual", "Climax"],
       implementationChoices: [
          { description: "Bears looking shocked", effort: 2, impact: "A picture shows the three bears looking surprised." },
          { description: "Bears looming over bed", effort: 4, impact: "A dramatic picture shows the bears discovering Goldilocks in the bed." }
      ]
    },
    {
      title: "Goldilocks Wakes Up & Flees",
      story: "As a reader, I want Goldilocks to wake up and run away, resolving the immediate conflict.",
      effort: 3,
      value: 4,
      tags: ["Text", "Plot", "Resolution"],
       implementationChoices: [
          { description: "She wakes and runs", effort: 1, impact: "Goldilocks wakes up, sees the bears, and runs away." },
          { description: "Describes her fright", effort: 3, impact: "The text emphasizes how scared Goldilocks was as she fled." }
      ]
    },
    {
      title: "The End Page",
      story: "As a reader, I want a concluding page, signifying the story is over.",
      effort: 1,
      value: 3,
      tags: ["Text", "Marketing"],
       implementationChoices: [
          { description: "'The End' text", effort: 1, impact: "A simple page says 'The End'." },
          { description: "Moral of the story", effort: 2, impact: "A concluding page includes a simple moral about respecting others' property." }
      ]
    },
     {
      title: "Back Cover Blurb",
      story: "As a publisher, I want a catchy blurb on the back cover, to encourage purchases.",
      effort: 2,
      value: 2,
      tags: ["Marketing", "Text"],
       implementationChoices: [
          { description: "Basic summary", effort: 1, impact: "A simple summary for the back cover." },
          { description: "Engaging question", effort: 2, impact: "A catchy question on the back cover to entice readers." }
      ]
    }
];