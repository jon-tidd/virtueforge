// Amazon Associates affiliate tag — append to all Amazon URLs
export const AMAZON_AFFILIATE_TAG = "virtueforge-20";

export function getAmazonUrl(baseUrl: string): string {
  if (!baseUrl.includes("amazon.com")) return baseUrl;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}tag=${AMAZON_AFFILIATE_TAG}`;
}

export const VIRTUES: Record<string, Virtue> = {
  prudence: {
    name: "Prudence",
    latin: "Prudentia",
    icon: "🦉",
    color: "#2B4C7E",
    lightColor: "#D6E4F0",
    description: "Wisdom to discern the right path",
    subVirtues: [
      { id: "curiosity", name: "Curiosity", desc: "A love of learning and wonder at the world" },
      { id: "discernment", name: "Discernment", desc: "Seeing clearly what is true and good" },
      { id: "patience", name: "Patience", desc: "Trusting that good things unfold in time" },
      { id: "humility", name: "Humility", desc: "Knowing one's limits and being open to growth" },
    ],
  },
  justice: {
    name: "Justice",
    latin: "Iustitia",
    icon: "⚖️",
    color: "#8B5E3C",
    lightColor: "#F0E0D0",
    description: "Right relationship with others",
    subVirtues: [
      { id: "honesty", name: "Honesty", desc: "Speaking and living truthfully" },
      { id: "fairness", name: "Fairness", desc: "Treating others as they deserve" },
      { id: "generosity", name: "Generosity", desc: "Giving freely of what one has" },
      { id: "gratitude", name: "Gratitude", desc: "Recognizing and appreciating goodness" },
    ],
  },
  courage: {
    name: "Courage",
    latin: "Fortitudo",
    icon: "🦁",
    color: "#8B2500",
    lightColor: "#F5D5C8",
    description: "Strength of heart in the face of difficulty",
    subVirtues: [
      { id: "perseverance", name: "Perseverance", desc: "Pressing on when the path is hard" },
      { id: "self_discipline", name: "Self-Discipline", desc: "Mastering oneself to do what is right" },
      { id: "integrity", name: "Integrity", desc: "Standing for what is right, even alone" },
      { id: "resilience", name: "Resilience", desc: "Rising again after falling" },
    ],
  },
  temperance: {
    name: "Temperance",
    latin: "Temperantia",
    icon: "🌿",
    color: "#2E5E4E",
    lightColor: "#D0E8DC",
    description: "Self-mastery and inner harmony",
    subVirtues: [
      { id: "moderation", name: "Moderation", desc: "Finding the golden mean in all things" },
      { id: "self_control", name: "Self-Control", desc: "Governing impulses with reason" },
      { id: "contentment", name: "Contentment", desc: "Finding joy in what is, not what might be" },
      { id: "orderliness", name: "Orderliness", desc: "Bringing harmony to one's world" },
    ],
  },
};

export const STRUGGLES_MAP: Record<string, { virtues: string[]; label: string }> = {
  perfectionism: { virtues: ["humility", "resilience", "contentment"], label: "Perfectionism" },
  defiance: { virtues: ["self_control", "honesty", "patience"], label: "Defiance / Disobedience" },
  anxiety: { virtues: ["perseverance", "integrity", "contentment"], label: "Anxiety / Fearfulness" },
  lying: { virtues: ["honesty", "integrity", "self_discipline"], label: "Lying / Dishonesty" },
  selfishness: { virtues: ["generosity", "fairness", "gratitude"], label: "Selfishness" },
  anger: { virtues: ["self_control", "patience", "moderation"], label: "Anger / Tantrums" },
  laziness: { virtues: ["perseverance", "self_discipline", "orderliness"], label: "Laziness / Lack of effort" },
  bullying: { virtues: ["fairness", "humility", "generosity"], label: "Bullying / Unkindness" },
  impatience: { virtues: ["patience", "self_control", "contentment"], label: "Impatience" },
  jealousy: { virtues: ["gratitude", "contentment", "generosity"], label: "Jealousy / Envy" },
  quitting: { virtues: ["perseverance", "resilience", "self_discipline"], label: "Giving up easily" },
  disrespect: { virtues: ["honesty", "gratitude", "humility"], label: "Disrespect" },
};

export const READING_LEVELS = [
  { value: "pre-k", label: "Pre-K (Ages 2-4)", ageRange: [2, 4] },
  { value: "early", label: "Early Reader (Ages 4-6)", ageRange: [4, 6] },
  { value: "grade1-2", label: "Grades 1-2 (Ages 6-8)", ageRange: [6, 8] },
  { value: "grade3-4", label: "Grades 3-4 (Ages 8-10)", ageRange: [8, 10] },
  { value: "grade5-6", label: "Grades 5-6 (Ages 10-12)", ageRange: [10, 12] },
  { value: "middle", label: "Middle School (Ages 12-14)", ageRange: [12, 14] },
];

export const BOOKS_DATABASE: Book[] = [
  { title: "Curious George", author: "H.A. Rey", virtues: ["curiosity"], readingLevel: "pre-k", year: 1941, amazon: "https://www.amazon.com/dp/0395150299", desc: "A little monkey's insatiable curiosity leads to adventures and learning." },
  { title: "The Story of the World, Vol. 1", author: "Susan Wise Bauer", virtues: ["curiosity", "discernment"], readingLevel: "grade1-2", year: 2001, amazon: "https://www.amazon.com/dp/1933339004", desc: "History as a grand story, igniting love of learning about civilizations." },
  { title: "If You Give a Mouse a Cookie", author: "Laura Numeroff", virtues: ["curiosity", "patience"], readingLevel: "pre-k", year: 1985, amazon: "https://www.amazon.com/dp/0060245867", desc: "One curious action leads to an endless chain of delightful consequences." },
  { title: "The Emperor's New Clothes", author: "Hans Christian Andersen", virtues: ["discernment", "honesty", "integrity"], readingLevel: "early", year: 1837, publicDomain: "https://www.gutenberg.org/ebooks/1597", desc: "A child's clear sight reveals what adults fear to say — the truth." },
  { title: "Aesop's Fables", author: "Aesop", virtues: ["discernment"], readingLevel: "early", year: -600, publicDomain: "https://www.gutenberg.org/ebooks/11339", desc: "Timeless tales teaching wisdom through animal parables — the original moral stories." },
  { title: "The Phantom Tollbooth", author: "Norton Juster", virtues: ["discernment", "curiosity", "perseverance"], readingLevel: "grade3-4", year: 1961, amazon: "https://www.amazon.com/dp/0394820371", desc: "A bored boy discovers that wisdom, words, and numbers make life worth living." },
  { title: "The Carrot Seed", author: "Ruth Krauss", virtues: ["patience", "perseverance"], readingLevel: "pre-k", year: 1945, amazon: "https://www.amazon.com/dp/006023351X", desc: "A boy plants a seed and waits with quiet faith while everyone doubts." },
  { title: "Owl Moon", author: "Jane Yolen", virtues: ["patience", "contentment"], readingLevel: "early", year: 1987, amazon: "https://www.amazon.com/dp/0399214577", desc: "A father and child walk silently through snow, waiting for the owl's call." },
  { title: "The Story of Ferdinand", author: "Munro Leaf", virtues: ["humility", "contentment", "self_control"], readingLevel: "early", year: 1936, amazon: "https://www.amazon.com/dp/044845694X", desc: "A bull who prefers smelling flowers to fighting — gentle strength." },
  { title: "Pinocchio", author: "Carlo Collodi", virtues: ["humility", "honesty", "self_discipline"], readingLevel: "grade1-2", year: 1883, publicDomain: "https://www.gutenberg.org/ebooks/500", desc: "A puppet learns that becoming real means becoming truthful and humble." },
  { title: "Sam, Bangs & Moonshine", author: "Evaline Ness", virtues: ["honesty", "discernment"], readingLevel: "early", year: 1966, amazon: "https://www.amazon.com/dp/0805003142", desc: "A girl who tells tall tales learns the dangerous line between fantasy and lies." },
  { title: "The Boy Who Cried Wolf", author: "Aesop", virtues: ["honesty", "integrity"], readingLevel: "pre-k", year: -600, publicDomain: "https://www.gutenberg.org/ebooks/11339", desc: "The shepherd boy who lied discovers that trust, once broken, is hard to restore." },
  { title: "Harriet the Spy", author: "Louise Fitzhugh", virtues: ["honesty", "discernment", "humility"], readingLevel: "grade3-4", year: 1964, amazon: "https://www.amazon.com/dp/0440416795", desc: "A girl who writes honest observations must learn kindness alongside truth." },
  { title: "Each Kindness", author: "Jacqueline Woodson", virtues: ["fairness", "generosity", "gratitude"], readingLevel: "early", year: 2012, amazon: "https://www.amazon.com/dp/0399246525", desc: "A girl realizes too late the kindness she failed to show a new classmate." },
  { title: "The Hundred Dresses", author: "Eleanor Estes", virtues: ["fairness", "integrity", "generosity"], readingLevel: "grade1-2", year: 1944, amazon: "https://www.amazon.com/dp/015205260X", desc: "Classmates mock a poor girl's claims — and learn the cost of cruelty." },
  { title: "The Giving Tree", author: "Shel Silverstein", virtues: ["generosity", "gratitude"], readingLevel: "early", year: 1964, amazon: "https://www.amazon.com/dp/0060256656", desc: "A tree gives everything to a boy — a meditation on selfless love." },
  { title: "A Christmas Carol", author: "Charles Dickens", virtues: ["generosity", "gratitude", "contentment"], readingLevel: "grade3-4", year: 1843, publicDomain: "https://www.gutenberg.org/ebooks/46", desc: "A miser's transformation through three ghostly visits to see what truly matters." },
  { title: "Stone Soup", author: "Marcia Brown", virtues: ["generosity", "curiosity"], readingLevel: "early", year: 1947, amazon: "https://www.amazon.com/dp/0689711034", desc: "Clever travelers teach a village that sharing creates abundance." },
  { title: "The Thank You Book", author: "Mo Willems", virtues: ["gratitude"], readingLevel: "pre-k", year: 2016, amazon: "https://www.amazon.com/dp/1423178289", desc: "Piggie wants to thank EVERYONE — a joyful celebration of appreciation." },
  { title: "Miss Rumphius", author: "Barbara Cooney", virtues: ["gratitude", "generosity", "orderliness"], readingLevel: "early", year: 1982, amazon: "https://www.amazon.com/dp/0140505393", desc: "A woman makes the world more beautiful — gratitude expressed through action." },
  { title: "The Little Engine That Could", author: "Watty Piper", virtues: ["perseverance", "self_discipline"], readingLevel: "pre-k", year: 1930, amazon: "https://www.amazon.com/dp/0448405202", desc: "'I think I can' — the original perseverance story for the youngest listeners." },
  { title: "Charlotte's Web", author: "E.B. White", virtues: ["perseverance", "generosity", "integrity"], readingLevel: "grade1-2", year: 1952, amazon: "https://www.amazon.com/dp/0064400557", desc: "A spider's tireless devotion saves a pig's life — friendship as courageous love." },
  { title: "Hatchet", author: "Gary Paulsen", virtues: ["perseverance", "resilience", "self_discipline"], readingLevel: "grade5-6", year: 1987, amazon: "https://www.amazon.com/dp/1416936475", desc: "A boy survives alone in the wilderness with nothing but a hatchet and his wits." },
  { title: "My Side of the Mountain", author: "Jean Craighead George", virtues: ["perseverance", "curiosity", "self_discipline"], readingLevel: "grade3-4", year: 1959, amazon: "https://www.amazon.com/dp/0142401579", desc: "A boy lives alone in the Catskills, learning self-reliance through nature." },
  { title: "The Lion, the Witch and the Wardrobe", author: "C.S. Lewis", virtues: ["self_discipline", "integrity", "perseverance"], readingLevel: "grade3-4", year: 1950, amazon: "https://www.amazon.com/dp/0064404994", desc: "Four children discover a world where doing right demands everything." },
  { title: "Little House in the Big Woods", author: "Laura Ingalls Wilder", virtues: ["self_discipline", "orderliness", "contentment"], readingLevel: "grade1-2", year: 1932, amazon: "https://www.amazon.com/dp/0064400018", desc: "Pioneer life teaches work, discipline, and the warmth of family." },
  { title: "The Tale of Despereaux", author: "Kate DiCamillo", virtues: ["integrity", "perseverance"], readingLevel: "grade3-4", year: 2003, amazon: "https://www.amazon.com/dp/0763680893", desc: "A tiny mouse with an enormous heart defies convention to do what is right." },
  { title: "Number the Stars", author: "Lois Lowry", virtues: ["integrity", "perseverance", "self_discipline"], readingLevel: "grade3-4", year: 1989, amazon: "https://www.amazon.com/dp/0547577095", desc: "A girl risks everything to help her Jewish friend escape occupied Denmark." },
  { title: "The Hobbit", author: "J.R.R. Tolkien", virtues: ["integrity", "perseverance", "humility", "resilience"], readingLevel: "grade5-6", year: 1937, amazon: "https://www.amazon.com/dp/054792822X", desc: "An ordinary hobbit discovers extraordinary courage on an unexpected journey." },
  { title: "Alexander and the Terrible, Horrible, No Good, Very Bad Day", author: "Judith Viorst", virtues: ["resilience", "patience"], readingLevel: "early", year: 1972, amazon: "https://www.amazon.com/dp/0689711735", desc: "Some days are terrible — and that's okay. You survive them." },
  { title: "After the Fall", author: "Dan Santat", virtues: ["resilience", "perseverance"], readingLevel: "early", year: 2017, amazon: "https://www.amazon.com/dp/1626726825", desc: "Humpty Dumpty learns to climb again after his great fall." },
  { title: "Island of the Blue Dolphins", author: "Scott O'Dell", virtues: ["resilience", "perseverance", "self_discipline"], readingLevel: "grade5-6", year: 1960, amazon: "https://www.amazon.com/dp/0547328613", desc: "A girl survives alone on an island for years through courage and resourcefulness." },
  { title: "Goldilocks and the Three Bears", author: "Robert Southey", virtues: ["moderation", "discernment"], readingLevel: "pre-k", year: 1837, publicDomain: "https://www.gutenberg.org/ebooks/17034", desc: "Not too hot, not too cold — the original lesson in finding the golden mean." },
  { title: "If You Give a Pig a Pancake", author: "Laura Numeroff", virtues: ["moderation", "self_control"], readingLevel: "pre-k", year: 1998, amazon: "https://www.amazon.com/dp/0060266864", desc: "Indulgence leads to an escalating chain of wants — moderation matters." },
  { title: "No, David!", author: "David Shannon", virtues: ["self_control", "patience"], readingLevel: "pre-k", year: 1998, amazon: "https://www.amazon.com/dp/0590930028", desc: "David does everything he shouldn't — and still, he is loved." },
  { title: "Llama Llama Mad at Mama", author: "Anna Dewdney", virtues: ["self_control", "patience"], readingLevel: "pre-k", year: 2007, amazon: "https://www.amazon.com/dp/0670062405", desc: "A little llama's tantrum at the store — and the calm that follows." },
  { title: "The Wind in the Willows", author: "Kenneth Grahame", virtues: ["self_control", "moderation", "contentment", "generosity"], readingLevel: "grade3-4", year: 1908, publicDomain: "https://www.gutenberg.org/ebooks/289", desc: "Toad's wild impulses contrast with Mole's gentle contentment — a study in temperance." },
  { title: "Corduroy", author: "Don Freeman", virtues: ["contentment", "gratitude"], readingLevel: "pre-k", year: 1968, amazon: "https://www.amazon.com/dp/0140501738", desc: "A bear with a missing button finds that love doesn't require perfection." },
  { title: "Heidi", author: "Johanna Spyri", virtues: ["contentment", "gratitude", "generosity"], readingLevel: "grade3-4", year: 1881, publicDomain: "https://www.gutenberg.org/ebooks/1448", desc: "A mountain girl's simple joy transforms everyone around her." },
  { title: "The Velveteen Rabbit", author: "Margery Williams", virtues: ["contentment", "patience", "resilience"], readingLevel: "early", year: 1922, publicDomain: "https://www.gutenberg.org/ebooks/11757", desc: "Becoming real means being loved enough to wear out — and that is beautiful." },
  { title: "Madeline", author: "Ludwig Bemelmans", virtues: ["orderliness", "integrity"], readingLevel: "pre-k", year: 1939, amazon: "https://www.amazon.com/dp/014056439X", desc: "Twelve little girls in two straight lines — order, bravery, and French charm." },
  { title: "The Boxcar Children", author: "Gertrude Chandler Warner", virtues: ["orderliness", "perseverance", "self_discipline"], readingLevel: "grade1-2", year: 1924, publicDomain: "https://www.gutenberg.org/ebooks/42796", desc: "Four orphans create a home from nothing through industry and cooperation." },
  { title: "Treasure Island", author: "Robert Louis Stevenson", virtues: ["perseverance", "discernment", "integrity"], readingLevel: "grade5-6", year: 1883, publicDomain: "https://www.gutenberg.org/ebooks/120", desc: "A boy's adventure among pirates tests his judgment and moral fiber." },
  { title: "Little Women", author: "Louisa May Alcott", virtues: ["generosity", "self_discipline", "patience", "contentment"], readingLevel: "grade5-6", year: 1868, publicDomain: "https://www.gutenberg.org/ebooks/514", desc: "Four sisters grow through struggle, love, and the daily work of becoming good." },
  { title: "The Secret Garden", author: "Frances Hodgson Burnett", virtues: ["patience", "gratitude", "resilience", "curiosity"], readingLevel: "grade3-4", year: 1911, publicDomain: "https://www.gutenberg.org/ebooks/113", desc: "A hidden garden heals two sickly, selfish children through wonder and care." },
  { title: "The Jungle Book", author: "Rudyard Kipling", virtues: ["self_discipline", "integrity", "perseverance"], readingLevel: "grade3-4", year: 1894, publicDomain: "https://www.gutenberg.org/ebooks/236", desc: "Mowgli learns the law of the jungle — duty, loyalty, and self-mastery." },
  { title: "Robinson Crusoe", author: "Daniel Defoe", virtues: ["perseverance", "orderliness", "patience", "self_discipline"], readingLevel: "grade5-6", year: 1719, publicDomain: "https://www.gutenberg.org/ebooks/521", desc: "A castaway builds a life from nothing through relentless industry and faith." },
  { title: "Anne of Green Gables", author: "L.M. Montgomery", virtues: ["gratitude", "resilience", "curiosity", "humility"], readingLevel: "grade3-4", year: 1908, publicDomain: "https://www.gutenberg.org/ebooks/45", desc: "An orphan's irrepressible spirit transforms a quiet farm — imagination as virtue." },
  { title: "The Chronicles of Narnia: The Magician's Nephew", author: "C.S. Lewis", virtues: ["integrity", "humility", "self_control"], readingLevel: "grade3-4", year: 1955, amazon: "https://www.amazon.com/dp/0064405052", desc: "A boy's choices at the dawn of a new world set the course of its history." },
  { title: "Where the Red Fern Grows", author: "Wilson Rawls", virtues: ["perseverance", "self_discipline", "gratitude"], readingLevel: "grade5-6", year: 1961, amazon: "https://www.amazon.com/dp/0440412676", desc: "A boy's unwavering devotion to earn and train his dogs — love through hard work." },
  { title: "Sarah, Plain and Tall", author: "Patricia MacLachlan", virtues: ["patience", "contentment", "gratitude"], readingLevel: "grade1-2", year: 1985, amazon: "https://www.amazon.com/dp/0064402053", desc: "A mail-order bride comes to the prairie — quiet courage in building a new home." },
  { title: "The Courage of Sarah Noble", author: "Alice Dalgliesh", virtues: ["perseverance", "integrity", "resilience"], readingLevel: "grade1-2", year: 1954, amazon: "https://www.amazon.com/dp/0689715404", desc: "An eight-year-old girl keeps courage in the wilderness." },
  { title: "Frog and Toad Are Friends", author: "Arnold Lobel", virtues: ["generosity", "patience", "contentment"], readingLevel: "early", year: 1970, amazon: "https://www.amazon.com/dp/0064440206", desc: "Two friends navigate life's small moments with warmth, loyalty, and gentle humor." },
  { title: "Caps for Sale", author: "Esphyr Slobodkina", virtues: ["patience", "self_control", "discernment"], readingLevel: "pre-k", year: 1938, amazon: "https://www.amazon.com/dp/0064431436", desc: "A peddler outwits mischievous monkeys — patience and cleverness triumph." },
  { title: "Pilgrim's Progress (Children's Edition)", author: "John Bunyan (adapted)", virtues: ["perseverance", "integrity", "resilience", "self_discipline"], readingLevel: "grade3-4", year: 1678, amazon: "https://www.amazon.com/dp/0802440584", desc: "The original hero's journey — Christian's path through temptation toward the Celestial City." },
  { title: "D'Aulaires' Book of Greek Myths", author: "Ingri & Edgar Parin d'Aulaire", virtues: ["discernment", "humility", "moderation"], readingLevel: "grade1-2", year: 1962, amazon: "https://www.amazon.com/dp/0440406943", desc: "The Greek myths retold beautifully — where hubris is punished and wisdom rewarded." },
  { title: "Roll of Thunder, Hear My Cry", author: "Mildred D. Taylor", virtues: ["integrity", "perseverance", "fairness"], readingLevel: "grade5-6", year: 1976, amazon: "https://www.amazon.com/dp/0140384510", desc: "A Black family in 1930s Mississippi fights for justice, land, and dignity." },
  { title: "Esperanza Rising", author: "Pam Muñoz Ryan", virtues: ["resilience", "humility", "gratitude", "perseverance"], readingLevel: "grade5-6", year: 2000, amazon: "https://www.amazon.com/dp/043912042X", desc: "A wealthy Mexican girl loses everything and learns to rise again through hard work." },
  { title: "Holes", author: "Louis Sachar", virtues: ["perseverance", "fairness", "integrity", "resilience"], readingLevel: "grade5-6", year: 1998, amazon: "https://www.amazon.com/dp/0440414806", desc: "A wrongly accused boy digs holes at a desert camp and unearths a family curse." },
  { title: "A Single Shard", author: "Linda Sue Park", virtues: ["perseverance", "patience", "integrity", "humility"], readingLevel: "grade5-6", year: 2001, amazon: "https://www.amazon.com/dp/0547534264", desc: "An orphan in medieval Korea pursues the art of celadon pottery with quiet determination." },
  { title: "Inside Out & Back Again", author: "Thanhha Lai", virtues: ["resilience", "perseverance", "patience", "humility"], readingLevel: "grade5-6", year: 2011, amazon: "https://www.amazon.com/dp/0061962791", desc: "A Vietnamese girl flees Saigon and rebuilds her life in Alabama, one word at a time." },
  { title: "Last Stop on Market Street", author: "Matt de la Peña", virtues: ["gratitude", "contentment", "generosity"], readingLevel: "early", year: 2015, amazon: "https://www.amazon.com/dp/0399257748", desc: "A boy and his grandmother ride the bus and discover beauty in their community." },
  { title: "The Name Jar", author: "Yangsook Choi", virtues: ["integrity", "humility", "fairness"], readingLevel: "early", year: 2001, amazon: "https://www.amazon.com/dp/0440417996", desc: "A Korean girl learns that her real name is the most beautiful one of all." },
  { title: "Sadako and the Thousand Paper Cranes", author: "Eleanor Coerr", virtues: ["perseverance", "patience", "resilience", "gratitude"], readingLevel: "grade3-4", year: 1977, amazon: "https://www.amazon.com/dp/0142401137", desc: "A girl with leukemia from Hiroshima folds cranes and hopes for healing." },
  { title: "Tuck Everlasting", author: "Natalie Babbitt", virtues: ["discernment", "moderation", "contentment", "self_control"], readingLevel: "grade5-6", year: 1975, amazon: "https://www.amazon.com/dp/0312369816", desc: "A girl discovers a family cursed with immortality and must choose wisely." },
  { title: "The Watsons Go to Birmingham — 1963", author: "Christopher Paul Curtis", virtues: ["fairness", "integrity", "resilience"], readingLevel: "grade5-6", year: 1995, amazon: "https://www.amazon.com/dp/0440414121", desc: "A family road trip to Alabama becomes a brush with history's darkest moments." },
];

export const GUIDED_QUESTIONS = [
  {
    question: "What matters most to you in raising your child?",
    options: [
      { label: "That they think clearly and love learning", virtues: ["curiosity", "discernment"] },
      { label: "That they treat others well and fairly", virtues: ["honesty", "fairness", "generosity"] },
      { label: "That they are brave and don't give up", virtues: ["perseverance", "integrity", "resilience"] },
      { label: "That they have self-control and inner peace", virtues: ["self_control", "moderation", "contentment"] },
    ],
  },
  {
    question: "When your child faces something difficult, what do you hope they do?",
    options: [
      { label: "Step back, think, and make a wise choice", virtues: ["discernment", "patience"] },
      { label: "Ask for help and support others too", virtues: ["humility", "generosity"] },
      { label: "Push through and keep trying", virtues: ["perseverance", "self_discipline"] },
      { label: "Stay calm and not overreact", virtues: ["self_control", "patience"] },
    ],
  },
  {
    question: "What would make you most proud of your child as an adult?",
    options: [
      { label: "They seek truth and make wise decisions", virtues: ["discernment", "humility", "curiosity"] },
      { label: "They are honest, generous, and grateful", virtues: ["honesty", "generosity", "gratitude"] },
      { label: "They stand up for what's right, even when it's hard", virtues: ["integrity", "perseverance"] },
      { label: "They are content, orderly, and self-possessed", virtues: ["contentment", "orderliness", "moderation"] },
    ],
  },
  {
    question: "What does your child struggle with most right now?",
    options: [
      { label: "Rushing, not thinking things through", virtues: ["patience", "discernment"] },
      { label: "Being unkind or unfair to others", virtues: ["fairness", "generosity", "gratitude"] },
      { label: "Giving up too easily or avoiding hard things", virtues: ["perseverance", "resilience", "self_discipline"] },
      { label: "Tantrums, impulsiveness, or restlessness", virtues: ["self_control", "moderation", "orderliness"] },
    ],
  },
];

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface SubVirtue {
  id: string;
  name: string;
  desc: string;
}

export interface Virtue {
  name: string;
  latin: string;
  icon: string;
  color: string;
  lightColor: string;
  description: string;
  subVirtues: SubVirtue[];
}

export interface Book {
  title: string;
  author: string;
  virtues: string[];
  readingLevel: string;
  year: number;
  amazon?: string;
  publicDomain?: string;
  desc: string;
}

export interface ChildProfile {
  name: string;
  age: number;
  sex: string;
  readingLevel: string;
  struggles: string[];
  readBooks: string[];
  virtueProgress: Record<string, number>;
}

export interface AppData {
  children: ChildProfile[];
  familyVirtues: string[];
  setupComplete: boolean;
}

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────

export function getVirtueParent(subVirtueId: string): string | null {
  for (const [key, v] of Object.entries(VIRTUES)) {
    if (v.subVirtues.find((sv) => sv.id === subVirtueId)) return key;
  }
  return null;
}

export function getSubVirtue(id: string): SubVirtue | null {
  for (const v of Object.values(VIRTUES)) {
    const found = v.subVirtues.find((sv) => sv.id === id);
    if (found) return found;
  }
  return null;
}

export function getDefaultReadingLevel(age: number): string {
  if (age <= 4) return "pre-k";
  if (age <= 6) return "early";
  if (age <= 8) return "grade1-2";
  if (age <= 10) return "grade3-4";
  if (age <= 12) return "grade5-6";
  return "middle";
}

export function getRecommendedBooks(virtueIds: string[], readingLevel: string, readBooks: string[] = []): Book[] {
  const levelOrder = READING_LEVELS.map((l) => l.value);
  const levelIdx = levelOrder.indexOf(readingLevel);
  const acceptableLevels = levelOrder.slice(Math.max(0, levelIdx - 1), levelIdx + 2);

  return BOOKS_DATABASE.filter(
    (book) =>
      acceptableLevels.includes(book.readingLevel) &&
      book.virtues.some((v) => virtueIds.includes(v)) &&
      !readBooks.includes(book.title)
  ).sort((a, b) => {
    const aMatch = a.virtues.filter((v) => virtueIds.includes(v)).length;
    const bMatch = b.virtues.filter((v) => virtueIds.includes(v)).length;
    return bMatch - aMatch;
  });
}
