// About 3 minutes of guided reading (feature-plan K4). Six short passages,
// about 450 words (a test keeps it between 430 and 480), read slowly at bedtime pace (~150 words a minute).
// The first two lines of "warm-up" and "big feelings" are the mockup's own
// (canon §8, F2). The rest is written for the Candlemere story world and uses
// the sample family; the lab swaps in real names from the family file.
//
// Why these passages: a clone learns from how you actually read to children,
// so the script covers a calm narrator voice, dialogue, whispers, a loud line,
// questions, a laugh, and a slow sleepy close.

export interface GuidedPassage {
  id: string;
  title: string;
  help: string;
  text: string;
}

export const GUIDED_PASSAGES: readonly GuidedPassage[] = [
  {
    id: "warm-up",
    title: "Warm-up",
    help: "Read like you would at bedtime. Pauses are good.",
    text:
      "Once, in the village of Candlemere, there lived a fox named Ember, who could find the way home from anywhere at all. " +
      "She knew every lane and every stile, every hedge with a gap in it, and every kitchen door that might, if you were very polite, have a sausage behind it. " +
      "On cold nights she curled up by the last warm hearth in the village and listened to the fire crackle.",
  },
  {
    id: "big-feelings",
    title: "Big feelings",
    help: "Give the characters voices! A whisper, a roar, a giggle.",
    text:
      "“I'm not scared,” whispered the little dragon. Then, very loudly: “Okay. I'm a LITTLE bit scared.” " +
      "Ember's ears went flat. “Nobody is scared,” she said. Then she sneezed, and everyone knew she was fibbing. " +
      "Clara laughed so hard she fell over. “You sneezed! You're scared too!” " +
      "“Only of thunder,” said Ember with great dignity, “and deep water. And that is a perfectly sensible list.”",
  },
  {
    id: "the-lane",
    title: "The lane at night",
    help: "Slow and warm, like the start of a story.",
    text:
      "The lane out of Candlemere was dark and quiet. Frost sparkled on the hedges, and far away an owl called twice. " +
      "Hugh held the lantern high, the way Grandma Ruth had shown him, steady and still. " +
      "Alfie counted the stones in the wall. “Forty-one, forty-two, forty-three…” " +
      "And Clara held on to Hugh's cloak with one hand, and to Ember's tail with the other.",
  },
  {
    id: "questions",
    title: "Questions",
    help: "Let your voice go up for the questions.",
    text:
      "“How far is it to Wardlow?” asked Alfie. " +
      "“Far,” said Ember. “One, two, three, four, lots.” " +
      "“That isn't a number,” said Alfie. " +
      "“It is a fox number,” said Ember. " +
      "“Are we nearly there?” asked Clara. “Is it after the big tree? Or the one after that?” " +
      "“What if the lantern goes out?” said Alfie. “What if we get lost? What if there's a troll?” " +
      "Hugh looked at the long road ahead. Would the flame last? Would they find a door that opened? " +
      "He didn't know. But he knew one thing. They were going together.",
  },
  {
    id: "the-hearth",
    title: "Grandma's hearth",
    help: "Gentle, like you're talking to someone you love.",
    text:
      "Grandma Ruth knelt by the fire and banked it the old way, with the old words her own grandmother used. " +
      "“Sleep low, stay warm, wake bright.” " +
      "The flames settled down into a soft red glow. " +
      "“There,” she said. “Now it will keep all night, and so will you.” " +
      "She kissed each of them on the top of the head, one, two, three, and tucked the blanket in tight. " +
      "“Grandma,” Clara whispered, “were you ever scared of the dark?” " +
      "“Oh, all the time,” said Grandma Ruth. “That's why we keep a fire. Not to chase the dark away, " +
      "but so that nobody has to sit in it alone.”",
  },
  {
    id: "goodnight",
    title: "Goodnight",
    help: "Slow down. Let it get sleepy.",
    text:
      "Outside, the wind hushed in the chimney. Inside, the fire whispered to itself. " +
      "Ember curled round Clara like a warm red scarf, and her tail twitched once, and then lay still. " +
      "Hugh's eyes closed. Alfie stopped counting. " +
      "And the last light of Candlemere burned low and gold, and kept them safe until morning. " +
      "Goodnight, little ones. Sleep well.",
  },
];

export function passageWordCount(): number {
  return GUIDED_PASSAGES.reduce((n, p) => n + p.text.split(/\s+/).length, 0);
}

export function getPassage(id: string): GuidedPassage | undefined {
  return GUIDED_PASSAGES.find((p) => p.id === id);
}
