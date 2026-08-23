// 1. CONSTANTS & CONFIG 

// Total number of questions in the quiz — drives the progress bar
const TOTAL_QUESTIONS = 12;

// Category weights — must sum to 1.0. This is what turns the 7
// category danger scores (0-100 each) into one final score (0-100).
const CATEGORY_WEIGHTS = {
  sleep: 0.15,
  screen: 0.10,
  pending: 0.20,
  deadline: 0.20,
  productivity: 0.10,
  procrastination: 0.15,
  money: 0.10,
};

// Human-readable labels for the breakdown bars on the result screen
const CATEGORY_LABELS = {
  sleep: "Sleep",
  screen: "Screen Time",
  pending: "Pending Work",
  deadline: "Deadline",
  productivity: "Productivity",
  procrastination: "Procrastination",
  money: "Money",
};

// Score bands -> visual severity + copy. Order matters: we walk this
// array top to bottom and return the first band whose max the score
// fits under.
const SEVERITY_BANDS = [
  { max: 15, sevClass: "sev-1", emoji: "🟢", label: "TOUCHING GRASS", key: "touchingGrass" },
  { max: 30, sevClass: "sev-2", emoji: "🟢", label: "DOING ALRIGHT", key: "doingAlright" },
  { max: 45, sevClass: "sev-3", emoji: "🟡", label: "MILDLY COOKED", key: "mildlyCooked" },
  { max: 60, sevClass: "sev-4", emoji: "🟠", label: "GETTING COOKED", key: "gettingCooked" },
  { max: 75, sevClass: "sev-5", emoji: "🔴", label: "BRO IS COOKED", key: "broIsCooked" },
  { max: 89, sevClass: "sev-6", emoji: "💀", label: "EXTREMELY COOKED", key: "extremelyCooked" },
  { max: 100, sevClass: "sev-7", emoji: "☠️", label: "IT'S ACTUALLY OVER", key: "actuallyOver" },
];

// Personalized message pools, one array per severity band. Each entry
// is a function that takes the raw stats object and returns a string,
// so the copy can reference the user's actual answers.
const MESSAGE_POOLS = {
  touchingGrass: [
    (s) => `${s.sleepHours}h of sleep and only ${s.pendingTasks} things pending. Who hurt you into being this put-together?`,
    (s) => `You're productive, rested, and ${s.daysUntilDeadline} days ahead of schedule. Please teach a class.`,
    (s) => `Somehow you scrolled for only ${s.screenHours}h today. Suspicious levels of self-control detected.`,
  ],
  doingAlright: [
    (s) => `${s.pendingTasks} tasks pending but you've got ${s.daysUntilDeadline} days. That's basically a vacation.`,
    (s) => `${s.sleepHours}h of sleep, a semi-functional brain. Could be worse. Could be much worse.`,
    (s) => `You said "I'll do it tomorrow" ${s.procrastinationCount} times, but you're still standing. Respect.`,
  ],
  mildlyCooked: [
    (s) => `${s.screenHours}h of scrolling and ${s.pendingTasks} pending tasks. The math isn't mathing yet, but it's close.`,
    (s) => `${s.daysUntilDeadline} days left and ${s.productiveHours}h of actual work done today. We need to talk.`,
    (s) => `You're not on fire, but you can smell smoke. ${s.procrastinationCount} "tomorrow"s and counting.`,
  ],
  gettingCooked: [
    (s) => `${s.pendingTasks} tasks pending, ${s.sleepHours}h of sleep, and a deadline ${s.daysUntilDeadline} days out. The oven is preheating.`,
    (s) => `You scrolled for ${s.screenHours}h and were productive for ${s.productiveHours}h. The ratio is not in your favor.`,
    (s) => `${s.procrastinationCount} times you said "tomorrow." Tomorrow is now today. Today is now a problem.`,
  ],
  broIsCooked: [
    (s) => `${s.daysUntilDeadline} days left, ${s.pendingTasks} tasks pending, and you found ${s.screenHours}h to scroll anyway. Bold strategy.`,
    (s) => `${s.sleepHours}h of sleep is not a sustainable business model. Neither is this deadline.`,
    (s) => `Your productivity clocked in at ${s.productiveHours}h today. Your anxiety clocked in at approximately all of it.`,
  ],
  extremelyCooked: [
    (s) => `You have ${s.daysUntilDeadline} days left, ${s.pendingTasks} assignments pending, and somehow found ${s.screenHours} hours to scroll. Your productivity has officially left the server.`,
    (s) => `${s.sleepHours}h of sleep, ${s.procrastinationCount} "I'll do it tomorrow"s, and a deadline that is basically breathing on your neck.`,
    (s) => `${s.productiveHours}h of real work against ${s.pendingTasks} pending tasks. At this rate the tasks are winning by a landslide.`,
  ],
  actuallyOver: [
    (s) => `${s.pendingTasks} tasks, ${s.daysUntilDeadline} days, ${s.sleepHours}h of sleep. There is no version of this math that ends well.`,
    (s) => `You said "tomorrow" ${s.procrastinationCount} times and scrolled for ${s.screenHours}h. Tomorrow called. It's not coming to save you.`,
    (s) => `This isn't a Screwed Score anymore, it's a eulogy. ${s.productiveHours}h productive out of a very long, very doomed day.`,
  ],
};

// 2. STATE

let currentQuestionIndex = 0; // 0-based index into the 12 questions

// 3. DOM REFERENCES


const screens = {
  landing: document.getElementById("landing-screen"),
  quiz: document.getElementById("quiz-screen"),
  result: document.getElementById("result-screen"),
};

const startBtn = document.getElementById("start-btn");
const quizForm = document.getElementById("quiz-form");
const questionEls = Array.from(document.querySelectorAll(".question"));
const backBtn = document.getElementById("back-btn");
const nextBtn = document.getElementById("next-btn");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");

const scoreNumberEl = document.getElementById("score-number");
const resultCategoryEl = document.getElementById("result-category");
const resultMessageEl = document.getElementById("result-message");
const breakdownListEl = document.getElementById("breakdown-list");
const retryBtn = document.getElementById("retry-btn");

// 4. SCREEN NAVIGATION


function showScreen(screenKey) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[screenKey].classList.add("active");
}

// 5. QUIZ NAVIGATION

// Show only the question at `index`, hide the rest, update progress UI
function renderQuestion(index) {
  questionEls.forEach((el, i) => {
    el.classList.toggle("active", i === index);
  });

  const percent = ((index + 1) / TOTAL_QUESTIONS) * 100;
  progressFill.style.width = `${percent}%`;
  progressLabel.textContent = `Question ${index + 1} of ${TOTAL_QUESTIONS}`;

  backBtn.disabled = index === 0;
  nextBtn.textContent = index === TOTAL_QUESTIONS - 1 ? "See My Damage" : "Next";
}

function goToNextQuestion() {
  const currentEl = questionEls[currentQuestionIndex];
  const validationError = validateQuestion(currentEl);

  if (validationError) {
    flagInvalid(currentEl, validationError);
    return;
  }

  if (currentQuestionIndex === TOTAL_QUESTIONS - 1) {
    // Last question answered — calculate and show the result
    const answers = collectAnswers();
    const result = calculateScore(answers);
    renderResult(result);
    showScreen("result");
    return;
  }

  currentQuestionIndex += 1;
  renderQuestion(currentQuestionIndex);
}

function goToPreviousQuestion() {
  if (currentQuestionIndex === 0) return;
  currentQuestionIndex -= 1;
  renderQuestion(currentQuestionIndex);
}

function resetQuiz() {
  currentQuestionIndex = 0;
  quizForm.reset();
  renderQuestion(0);
}


// 6. VALIDATION 

// Returns an error message string if invalid, or null if valid
function validateQuestion(questionEl) {
  const numberInput = questionEl.querySelector('input[type="number"]');
  if (numberInput) {
    if (numberInput.value === "") return "This field is required.";
    const value = parseFloat(numberInput.value);
    const min = parseFloat(numberInput.min);
    const max = parseFloat(numberInput.max);
    const step = parseFloat(numberInput.step || "1");

    if (Number.isNaN(value) || value < min || value > max) {
      return `Please enter a value between ${min} and ${max}.`;
    }

    // Check step constraint (multiply by 10 to avoid float precision issues)
    if ((Math.abs(value * 10) % (step * 10)) !== 0) {
      return step === 1 ? "Please enter a whole number." : "Please enter a multiple of 0.5.";
    }
    return null;
  }

  const radios = questionEl.querySelectorAll('input[type="radio"]');
  if (radios.length > 0) {
    if (!Array.from(radios).some((r) => r.checked)) {
      return "Please select an option.";
    }
  }

  return null;
}

// Briefly highlights the offending input and shows a warning message
function flagInvalid(questionEl, message) {
  const target =
    questionEl.querySelector('input[type="number"]') || questionEl;

  target.style.transition = "box-shadow 0.15s ease";
  target.style.boxShadow = "0 0 0 3px rgba(239, 68, 68, 0.5)";

  let warningEl = questionEl.querySelector('.validation-warning');
  if (!warningEl) {
    warningEl = document.createElement('div');
    warningEl.className = 'validation-warning';
    questionEl.appendChild(warningEl);
  }
  warningEl.textContent = message || "Invalid input.";
  warningEl.classList.add('active');

  setTimeout(() => {
    target.style.boxShadow = "";
    warningEl.classList.remove('active');
  }, 2500);
}

// 7. SCORING ENGINE

// Clamp any value into the 0-100 range
function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

// Reads every form field into a plain object of raw values
function collectAnswers() {
  const formData = new FormData(quizForm);

  return {
    sleepHours: parseFloat(formData.get("sleepHours")),
    screenHours: parseFloat(formData.get("screenHours")),
    pendingTasks: parseFloat(formData.get("pendingTasks")),
    daysUntilDeadline: parseFloat(formData.get("daysUntilDeadline")),
    productiveHours: parseFloat(formData.get("productiveHours")),
    procrastinationCount: parseFloat(formData.get("procrastinationCount")),
    taskRelationship: parseFloat(formData.get("taskRelationship")),
    financialSituation: parseFloat(formData.get("financialSituation")),
    productivityLevel: parseFloat(formData.get("productivityLevel")),
    sleepSchedule: parseFloat(formData.get("sleepSchedule")),
    examConfidence: parseFloat(formData.get("examConfidence")),
    sitDownBehavior: parseFloat(formData.get("sitDownBehavior")),
  };
}

// Turns raw answers into 7 category danger scores (0-100 each),
// then into one final weighted score (0-100).
function calculateScore(answers) {
  // --- Sleep: avg of hours-based score and schedule MCQ ---
  // 8h is the "safe" point. Undersleeping ramps to 100 at 0h;
  // oversleeping ramps to 100 at 12h (the input's max).
  const sleepFromHours =
    answers.sleepHours <= 8
      ? clamp(((8 - answers.sleepHours) / 8) * 100)
      : clamp(((answers.sleepHours - 8) / 4) * 100);
  const sleepFromSchedule = clamp(answers.sleepSchedule);
  const sleepDanger = (sleepFromHours + sleepFromSchedule) / 2;

  // --- Screen time: hours only ---
  const screenDanger = clamp((answers.screenHours / 8) * 100);

  // --- Pending work: avg of task count and relationship MCQ ---
  const pendingFromCount = clamp((answers.pendingTasks / 10) * 100);
  const pendingFromRelationship = clamp(answers.taskRelationship);
  const pendingDanger = (pendingFromCount + pendingFromRelationship) / 2;

  // --- Deadline pressure: avg of days-left and exam confidence MCQ ---
  const deadlineFromDays = clamp(100 - (answers.daysUntilDeadline / 14) * 100);
  const deadlineFromConfidence = clamp(answers.examConfidence);
  const deadlineDanger = (deadlineFromDays + deadlineFromConfidence) / 2;

  // --- Productivity: avg of productive-hours and productivity level MCQ ---
  const productivityFromHours = clamp(100 - (answers.productiveHours / 8) * 100);
  const productivityFromLevel = clamp(answers.productivityLevel);
  const productivityDanger = (productivityFromHours + productivityFromLevel) / 2;

  // --- Procrastination: avg of "tomorrow" count and sit-down MCQ ---
  const procFromCount = clamp((answers.procrastinationCount / 5) * 100);
  const procFromSitDown = clamp(answers.sitDownBehavior);
  const procrastinationDanger = (procFromCount + procFromSitDown) / 2;

  // --- Money: MCQ only ---
  const moneyDanger = clamp(answers.financialSituation);

  const categoryScores = {
    sleep: sleepDanger,
    screen: screenDanger,
    pending: pendingDanger,
    deadline: deadlineDanger,
    productivity: productivityDanger,
    procrastination: procrastinationDanger,
    money: moneyDanger,
  };

  // Weighted sum — guaranteed to land in 0-100 since every category
  // score is already clamped and the weights sum to 1.0
  let finalScore = 0;
  for (const category in categoryScores) {
    finalScore += categoryScores[category] * CATEGORY_WEIGHTS[category];
  }
  finalScore = Math.round(finalScore);

  return {
    finalScore,
    categoryScores,
    stats: answers, // raw answers, used for the personalized message text
  };
}

// Finds the severity band a score falls into
function getSeverity(score) {
  return SEVERITY_BANDS.find((band) => score <= band.max);
}

// Randomly picks one message template from the matching pool and
// fills it in with the user's actual stats
function pickMessage(severityKey, stats) {
  const pool = MESSAGE_POOLS[severityKey];
  const template = pool[Math.floor(Math.random() * pool.length)];
  return template(stats);
}

// 8. RESULT RENDERING 

function renderResult(result) {
  const { finalScore, categoryScores, stats } = result;
  const severity = getSeverity(finalScore);

  // Reset any previous severity color class before applying the new one
  SEVERITY_BANDS.forEach((band) => {
    scoreNumberEl.classList.remove(band.sevClass);
    resultCategoryEl.classList.remove(band.sevClass);
  });
  scoreNumberEl.classList.add(severity.sevClass);
  resultCategoryEl.classList.add(severity.sevClass);

  resultCategoryEl.textContent = `${severity.emoji} ${severity.label}`;
  resultMessageEl.textContent = pickMessage(severity.key, stats);

  animateScoreCountUp(scoreNumberEl, finalScore);
  renderBreakdown(categoryScores);

  saveLastResult(finalScore);
}

// Animates the big score number counting up from 0 to the target
function animateScoreCountUp(el, target) {
  const duration = 900; // ms
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = clamp(elapsed / duration, 0, 1);
    const current = Math.round(progress * target);
    el.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

// Builds the category breakdown bars on the result screen
function renderBreakdown(categoryScores) {
  breakdownListEl.innerHTML = "";

  Object.keys(CATEGORY_WEIGHTS).forEach((category) => {
    const score = Math.round(categoryScores[category]);

    const li = document.createElement("li");
    li.className = "breakdown-item";

    const label = document.createElement("span");
    label.className = "breakdown-label";
    label.textContent = CATEGORY_LABELS[category];

    const bar = document.createElement("div");
    bar.className = "breakdown-bar";

    const fill = document.createElement("div");
    fill.className = "breakdown-fill";
    // Start at 0 width, then animate to the real value on the next
    // frame so the transition in the CSS actually plays
    fill.style.width = "0%";

    const value = document.createElement("span");
    value.className = "breakdown-value";
    value.textContent = score;

    bar.appendChild(fill);
    li.appendChild(label);
    li.appendChild(bar);
    li.appendChild(value);
    breakdownListEl.appendChild(li);

    requestAnimationFrame(() => {
      fill.style.width = `${score}%`;
    });
  });
}


// 9. LOCAL STORAGE 

const STORAGE_KEY = "howScrewedAmI:lastResult";

function saveLastResult(score) {
  const payload = {
    score,
    timestamp: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // localStorage can fail (private browsing, storage full, etc.) —
    // not critical to the app working, so just log it
    console.warn("Couldn't save last result:", err);
  }
}


// 10. EVENT LISTENERS 

startBtn.addEventListener("click", () => {
  resetQuiz();
  showScreen("quiz");
});

nextBtn.addEventListener("click", goToNextQuestion);
backBtn.addEventListener("click", goToPreviousQuestion);

// Prevent native form submission (e.g. if user hits Enter)
quizForm.addEventListener("submit", (e) => e.preventDefault());

retryBtn.addEventListener("click", () => {
  resetQuiz();
  showScreen("landing");
});


// INIT

renderQuestion(currentQuestionIndex);