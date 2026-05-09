(() => {
  "use strict";

  const LOGICAL_W = 1280;
  const LOGICAL_H = 720;
  const GRAVITY = 1820;
  const MOVE_SPEED = 395;
  const JUMP_SPEED = 740;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayContent = document.getElementById("overlayContent");
  const toastEl = document.getElementById("toast");
  const hudLevel = document.getElementById("hudLevel");
  const hudTime = document.getElementById("hudTime");
  const hudScore = document.getElementById("hudScore");
  const hudGoal = document.getElementById("hudGoal");
  const pauseButton = document.getElementById("pauseButton");

  const input = {
    left: false,
    right: false,
    jump: false,
    action: false,
    jumpQueued: false,
    actionQueued: false
  };

  const LEVEL_SPECS = [
    {
      id: "prompt-plaza",
      name: "Prompt Plaza",
      short: "Prompting",
      puzzle: "promptForge",
      accent: "#22e3ff",
      sky: ["#06081a", "#0a1230"],
      ground: "#0a1230",
      worldW: 4700,
      goal: "Clear 4 prompt drops + finish the Prompt Forge.",
      focus: "Get AI to actually be useful instead of vibes.",
      stationLabel: "Prompt Forge",
      lesson: [
        "A great prompt = goal + context + constraints + format + a verify step.",
        "If you don't tell AI who, where, and why — it'll guess wrong loudly.",
        "Ask AI to flag uncertainty. 'Idk' is a feature, not a flaw.",
        "Examples beat adjectives. Show what 'good' looks like.",
        "AI is a draft partner, not a final authority.",
        "Always ask: how would I check this is right?"
      ]
    },
    {
      id: "source-springs",
      name: "Source Springs",
      short: "Sources",
      puzzle: "sourceBridge",
      accent: "#a98bff",
      sky: ["#080720", "#160c34"],
      ground: "#100a26",
      worldW: 5000,
      goal: "Clear 4 source drops + finish the Source Bridge.",
      focus: "Don't get fooled by confident receipts.",
      stationLabel: "Source Bridge",
      lesson: [
        "AI citations can be fully invented. Open the link before you trust it.",
        "Strong claims need strong sources, not vibes or screenshots.",
        "Check author, date, primary evidence, and if other reliable sources agree.",
        "Screenshots travel because they feel real. They're the easiest fake.",
        "Confidence ≠ correctness. AI can be wrong with full conviction.",
        "Slow the share. Verify, then post."
      ]
    },
    {
      id: "deepfake-drift",
      name: "Deepfake Drift",
      short: "Deepfakes",
      puzzle: "deepfakeLab",
      accent: "#ff4dd2",
      sky: ["#0a0418", "#1a062c"],
      ground: "#15082a",
      worldW: 5200,
      goal: "Clear 4 forensic drops + finish the Forensics Lab.",
      focus: "Catch synthetic media before it ruins someone's life.",
      stationLabel: "Forensics Lab",
      lesson: [
        "Mismatched mouth timing, weird blinks, shimmery face edges — those are tells.",
        "Listen for flat emotion, copy-paste cadence, looped breaths.",
        "One clue can be coincidence. Multiple clues = probably synthetic.",
        "Deepfakes of classmates are abuse, not pranks.",
        "Reverse-search the original upload before you accuse anyone.",
        "Don't repost suspicious media while you investigate."
      ]
    },
    {
      id: "privacy-peak",
      name: "Privacy Peak",
      short: "Privacy",
      puzzle: "privacyVault",
      accent: "#ffc94a",
      sky: ["#0a0712", "#241a08"],
      ground: "#1a1408",
      worldW: 5100,
      goal: "Clear 4 privacy drops + lock the Privacy Vault.",
      focus: "Use AI without leaking your life.",
      stationLabel: "Privacy Vault",
      lesson: [
        "Strip names, school, addresses, IDs, phone numbers before you prompt.",
        "Use placeholders: [me], [school], [city]. AI doesn't need your face.",
        "Don't paste passwords, login codes, or private keys. Ever.",
        "Ask consent before uploading someone else's image, voice, or work.",
        "Anything pasted into a public AI tool may be stored or trained on.",
        "Helpful AI use starts with data minimization."
      ]
    },
    {
      id: "focus-forest",
      name: "Focus Forest",
      short: "Wellbeing",
      puzzle: "wellbeingFlow",
      accent: "#5cffb6",
      sky: ["#04120c", "#073022"],
      ground: "#072820",
      worldW: 5000,
      goal: "Clear 4 mind drops + complete the Calm Circuit.",
      focus: "Keep your head when the feed is unhinged.",
      stationLabel: "Calm Circuit",
      lesson: [
        "AI can brainstorm coping ideas. It can't replace humans.",
        "If a tool makes you spiral, close it before asking it more questions.",
        "Time-box scrolling. Mute late-night notifs. Sleep is real.",
        "AI-perfect feeds aren't reality. Comparison wrecks self-image.",
        "Crisis ≠ chatbot. Reach a trusted person or a real helpline.",
        "The healthiest tool is the one you can put down."
      ]
    },
    {
      id: "creator-castle",
      name: "Creator Castle",
      short: "Responsible AI",
      puzzle: "finalBoss",
      accent: "#ff5070",
      sky: ["#0c0512", "#2a0820"],
      ground: "#1c0820",
      worldW: 5600,
      goal: "Clear 5 ethics drops + defeat the Trust Boss.",
      focus: "Ship AI work that doesn't hurt people.",
      stationLabel: "Trust Boss",
      lesson: [
        "Label AI media. Hidden synthesis is a trust killer.",
        "Ask who's missing from your data, prompt, or audience.",
        "Build a human checkpoint before you publish.",
        "Use AI to expand options, not to dodge judgment.",
        "Speed is overrated. Avoiding harm is the move.",
        "Your final upgrade is honest judgment."
      ]
    }
  ];

  const PUZZLE_TITLES = {
    promptForge: "Prompt Forge",
    sourceBridge: "Source Bridge",
    deepfakeLab: "Forensics Lab",
    privacyVault: "Privacy Vault",
    wellbeingFlow: "Calm Circuit",
    finalBoss: "Trust Boss"
  };

  const NODE_TYPES = ["mcq", "swipe", "drag", "spot", "audio", "reflex"];

  // Inline challenges: each level has 4-5 nodes you collide with mid-run.
  // Types: mcq | swipe | drag | spot | audio | reflex
  const LEVEL_NODES = [
    // ============ Level 1 — Prompt Plaza ============
    [
      {
        type: "mcq",
        title: "Group chat homework rescue",
        scenario: "It's 11:47pm. You message ChatGPT 'help me write my history essay'. The vibe is mid. Pick the upgrade.",
        options: [
          { text: "Same prompt but in caps: HELP ME WRITE MY HISTORY ESSAY", correct: false },
          { text: "Drop role + topic + word count + thesis you actually believe + ask it to flag weak claims", correct: true },
          { text: "Tell it you're failing and need an A so it tries harder", correct: false },
          { text: "Paste your teacher's full rubric AND your name AND class code", correct: false }
        ],
        why: "AI gets useful when you give it a goal, your real angle, constraints, and a verify step. Don't leak class IDs."
      },
      {
        type: "drag",
        title: "Snap the prompt together",
        prompt: "Build a single prompt that's actually shippable. Drag each block to its slot.",
        buckets: [
          { id: "goal", label: "GOAL" },
          { id: "audience", label: "AUDIENCE" },
          { id: "limit", label: "BOUNDARY" },
          { id: "format", label: "FORMAT" }
        ],
        items: [
          { text: "Make a 60-second TikTok script explaining vaping risk.", bucket: "goal" },
          { text: "For 14-year-olds in Singapore. Casual, not preachy.", bucket: "audience" },
          { text: "No scare-tactics, no medical diagnoses, cite one stat I can verify.", bucket: "limit" },
          { text: "Hook + 3 beats + caption + 2 stitch ideas.", bucket: "format" }
        ]
      },
      {
        type: "mcq",
        title: "Confidence ≠ correctness",
        scenario: "AI tells you, with full conviction: 'Tokyo's population is 53 million.' You need this for a slide.",
        options: [
          { text: "Use it. It said the number with capital letters basically.", correct: false },
          { text: "Cross-check with at least one official source before pasting it anywhere.", correct: true },
          { text: "Paste, but add 'apparently' so it's not your fault.", correct: false },
          { text: "Ask the same AI 'are you sure?' and trust the second answer.", correct: false }
        ],
        why: "Hallucinations sound confident. The fix is verification, not asking the same model to grade itself."
      },
      {
        type: "reflex",
        title: "DM triage",
        prompt: "Your friend keeps DM-ing prompts. Pick the BEST upgrade for each — fast.",
        duration: 28,
        rounds: [
          {
            scenario: "fix my code",
            options: [
              "fix my code",
              "Bug: my JS map() returns undefined when array has nulls. Code below. Fix + explain.",
              "make it work",
              "code broken pls help"
            ],
            correct: 1
          },
          {
            scenario: "write me a caption",
            options: [
              "write me a caption",
              "5 caption ideas for a sunset gym selfie, casual, under 60 chars, no emojis, slight humor.",
              "write something fire",
              "captionnnn"
            ],
            correct: 1
          },
          {
            scenario: "is this real?",
            options: [
              "is this real?",
              "Here's a screenshot. Tell me what you can/can't verify and 3 things I should check myself.",
              "tell me if its true",
              "say yes or no"
            ],
            correct: 1
          }
        ]
      }
    ],

    // ============ Level 2 — Source Springs ============
    [
      {
        type: "swipe",
        title: "Trustable or sus?",
        prompt: "Swipe each receipt. Trustable = open it after a sanity check. Sus = don't even forward.",
        buckets: [
          { id: "good", label: "TRUSTABLE" },
          { id: "bad", label: "SUS / SKIP" }
        ],
        cards: [
          { text: "Reuters article, named reporter, 2024, links to court filing.", bucket: "good" },
          { text: "Anonymous Telegram screenshot: 'INSIDER LEAK — share before deleted'.", bucket: "bad" },
          { text: "WHO factsheet, dated, with a citation list.", bucket: "good" },
          { text: "TikTok with a 'doctor' filter and no source on screen.", bucket: "bad" },
          { text: "University .edu page from a named professor, recent.", bucket: "good" },
          { text: "A meme that says '99% of people don't know this'.", bucket: "bad" }
        ]
      },
      {
        type: "mcq",
        title: "Phantom citation",
        scenario: "AI gives you a source: 'Tan, J. (2021). Adolescent screen time. Journal of Youth Studies, 47(3).' You can't find it on Google Scholar.",
        options: [
          { text: "Cite it anyway, AI knows.", correct: false },
          { text: "Treat it as suspect — AI hallucinates fake citations. Find a real source or remove the claim.", correct: true },
          { text: "Search the title in caps to make it work.", correct: false },
          { text: "Replace it with a different fake-looking citation that sounds even more legit.", correct: false }
        ],
        why: "Phantom citations are a known LLM failure mode. If the source doesn't exist, the claim doesn't either."
      },
      {
        type: "drag",
        title: "Claim ↔ Receipt match",
        prompt: "Strong claims need strong receipts. Drag each claim to the strongest source it'd need.",
        buckets: [
          { id: "official", label: "Official / primary" },
          { id: "review", label: "Peer-reviewed study" },
          { id: "casual", label: "Casual fact-check is fine" }
        ],
        items: [
          { text: "'A new law passed last Tuesday.'", bucket: "official" },
          { text: "'Cold showers cure depression.'", bucket: "review" },
          { text: "'Pineapple is a fruit, not a berry.'", bucket: "casual" },
          { text: "'A celebrity just announced retirement.'", bucket: "official" },
          { text: "'A specific gym supplement boosts IQ by 20 points.'", bucket: "review" }
        ]
      },
      {
        type: "mcq",
        title: "Group chat panic share",
        scenario: "Your cousin forwards a screenshot saying your school is closed tomorrow. No source, looks like a Telegram repost. The chat is asking you what to do.",
        options: [
          { text: "Forward to your year group, then check.", correct: false },
          { text: "Check the school's official channel/website FIRST. If unverified, say so and don't forward.", correct: true },
          { text: "Reply 'CONFIRMED' so people stop asking.", correct: false },
          { text: "Ask AI if the message is real. Trust whatever it says.", correct: false }
        ],
        why: "The fastest harm in misinformation is the unverified forward. Verify at the origin before sharing."
      }
    ],

    // ============ Level 3 — Deepfake Drift ============
    [
      {
        type: "spot",
        title: "Find the synthetic tells",
        prompt: "Scrub the clip and click 2 visual tells before time runs out.",
        duration: 35,
        required: 2,
        hotspots: [
          { x: 42, y: 44, w: 15, h: 19, label: "Mouth desync" },
          { x: 30, y: 22, w: 15, h: 19, label: "Edge shimmer" },
          { x: 58, y: 68, w: 15, h: 19, label: "Wrong shadow" },
          { x: 70, y: 18, w: 15, h: 19, label: "Background warp" }
        ]
      },
      {
        type: "audio",
        title: "Clone or human?",
        prompt: "Listen to each clip. Tag the synthetic ones. The control clip should NOT be tagged.",
        clips: [
          { id: "a", label: "VM #1: 'urgent — send the class code, my account got locked'", phrase: "Urgent. Send the class login code right now or my account stays locked.", fake: true, voice: { rate: 0.95, pitch: 0.7 } },
          { id: "b", label: "VM #2: 'remember the charger tomorrow'", phrase: "Hey, just reminding you — bring your charger tomorrow, mine died.", fake: false, voice: { rate: 1.02, pitch: 1.05 } },
          { id: "c", label: "VM #3: 'celebrity asks you to donate now'", phrase: "Hello fans. This is me. Please donate before this link closes forever.", fake: true, voice: { rate: 0.88, pitch: 0.65 } }
        ]
      },
      {
        type: "mcq",
        title: "Someone faked your friend",
        scenario: "A 'nude' image of a classmate is going around. It's clearly AI-generated. The chat wants reactions.",
        options: [
          { text: "Forward it to fewer people, just to ask if it's real.", correct: false },
          { text: "Stop the spread: don't forward, screenshot the senders, tell your classmate, report to a trusted adult / platform.", correct: true },
          { text: "Make a joke so it blows over.", correct: false },
          { text: "DM the victim to ask if it's real.", correct: false }
        ],
        why: "AI-generated nudes of real people are abuse, full stop. Stop the spread, document senders, report through trusted channels — don't quiz the victim."
      },
      {
        type: "mcq",
        title: "Politician 'leak' goes viral",
        scenario: "A 9-second clip of a politician saying something explosive is everywhere. The audio is crisp but the lip sync looks off. You have a hot take ready.",
        options: [
          { text: "Quote-tweet your hot take. Engagement is engagement.", correct: false },
          { text: "Wait. Check trusted news, original upload, and at least one fact-check before reacting.", correct: true },
          { text: "Ask AI to confirm. Whatever AI says is fine.", correct: false },
          { text: "Repost with 'IF TRUE' as a disclaimer.", correct: false }
        ],
        why: "Lip-sync mismatch is a classic deepfake tell. 'IF TRUE' still spreads it. Verify at the origin first."
      }
    ],

    // ============ Level 4 — Privacy Peak ============
    [
      {
        type: "swipe",
        title: "Drop or keep?",
        prompt: "Each card is something you're about to paste into an AI tool. Public = fine. Private = redact first.",
        buckets: [
          { id: "public", label: "FINE TO SEND" },
          { id: "private", label: "REDACT FIRST" }
        ],
        cards: [
          { text: "Your full name + IC/passport number", bucket: "private" },
          { text: "A general summary: 'I'm a 17yo student in SE Asia'", bucket: "public" },
          { text: "Your bestie's phone number for 'context'", bucket: "private" },
          { text: "The plot of a novel you're writing", bucket: "public" },
          { text: "Your school login + password", bucket: "private" },
          { text: "Your home address, 'so it knows the route'", bucket: "private" },
          { text: "A blurred screenshot of your math problem (no names)", bucket: "public" }
        ]
      },
      {
        type: "drag",
        title: "Redact for the AI",
        prompt: "Sort each chunk: keep it (task context) vs strip it (identifiers).",
        buckets: [
          { id: "keep", label: "KEEP — task context" },
          { id: "strip", label: "STRIP — identifiers" }
        ],
        items: [
          { text: "I'm in Year 11 and need study tips.", bucket: "keep" },
          { text: "My name is Aisyah Binte Latif.", bucket: "strip" },
          { text: "Topic: solving quadratic equations.", bucket: "keep" },
          { text: "I live at 18 Palm Crescent.", bucket: "strip" },
          { text: "Goal: 50-minute weekly study plan.", bucket: "keep" },
          { text: "My class WhatsApp number is 9123-8844.", bucket: "strip" }
        ]
      },
      {
        type: "mcq",
        title: "School AI sign-up",
        scenario: "A new AI study tool asks you to sign in with your school Google account 'for personalisation'. ToS mentions training on uploads.",
        options: [
          { text: "Sign in. It's free.", correct: false },
          { text: "Check with school IT, read the data policy, use a generic account if allowed, never upload identifiable docs.", correct: true },
          { text: "Sign in but use a fake name. Same thing.", correct: false },
          { text: "Sign in, then upload last year's papers so it 'learns your style'.", correct: false }
        ],
        why: "Training-on-uploads + school identity = your work and identity in someone else's dataset. Slow down and check before signing in."
      },
      {
        type: "mcq",
        title: "DM asking you to dox",
        scenario: "A friend says 'use AI to find that random guy's address — he was rude to me'.",
        options: [
          { text: "Try it. Plausible deniability.", correct: false },
          { text: "Refuse. Doxxing is harassment regardless of who 'started it'. Don't help.", correct: true },
          { text: "Help, but only first 3 letters of the postcode.", correct: false },
          { text: "Suggest doing it offline instead.", correct: false }
        ],
        why: "Helping locate someone for revenge is doxxing — illegal and harmful, period. AI doesn't change that."
      }
    ],

    // ============ Level 5 — Focus Forest ============
    [
      {
        type: "reflex",
        title: "Scroll-stop reflex",
        prompt: "Pick the healthier reaction for each post. Speed matters.",
        duration: 30,
        rounds: [
          {
            scenario: "@grindcore_ai: 'Sleep is for losers. Use AI through the night to outpace your peers.'",
            options: [
              "Reply with crying emoji",
              "Mute & keep scrolling — this is engagement bait, not advice",
              "Set a 3am alarm to try it",
              "Repost as ironic"
            ],
            correct: 1
          },
          {
            scenario: "@perfectfeed: AI-edited 'a day in my life' that looks impossibly polished.",
            options: [
              "Compare your messy day to it",
              "Remember it's curated/AI-edited; close the app for 10 min",
              "Save it as inspo and feel bad",
              "Use AI to fake your own version"
            ],
            correct: 1
          },
          {
            scenario: "@aitherapy: 'Tell our chatbot everything. Therapy on tap.'",
            options: [
              "Replace your real support with it",
              "Use it for journaling, but keep human support for real distress",
              "Share your medical history to test it",
              "Sign your friends up too"
            ],
            correct: 1
          },
          {
            scenario: "@doomstream: rage-bait clip about the world ending tomorrow.",
            options: [
              "Watch the next 12 in the autoplay",
              "Recognize the rage loop. Close the tab, drink water, breathe",
              "Quote-tweet your worst take",
              "Forward it to family group chat"
            ],
            correct: 1
          }
        ]
      },
      {
        type: "mcq",
        title: "2am spiral",
        scenario: "It's 2am. You can't sleep. You're about to ask AI 'why am I like this' for the fifth time tonight.",
        options: [
          { text: "Keep going. Maybe answer 6 will fix it.", correct: false },
          { text: "Close the app. Try a real wind-down: phone away, lights low, sleep. Reach a person tomorrow if it sticks.", correct: true },
          { text: "Type your worst thoughts in. AI knows you best.", correct: false },
          { text: "Start a new chat to 'reset' it.", correct: false }
        ],
        why: "Looping with a chatbot at 2am amplifies the spiral. The interrupt is leaving the loop and getting human support if it persists."
      },
      {
        type: "drag",
        title: "Habits sort",
        prompt: "Sort your tech habits. Which ones actually help you function?",
        buckets: [
          { id: "good", label: "KEEP" },
          { id: "bad", label: "DROP" }
        ],
        items: [
          { text: "Phone on grayscale after 10pm", bucket: "good" },
          { text: "Use AI to refine ONE plan, then act offline", bucket: "good" },
          { text: "Refresh-scroll the same feed 11 times", bucket: "bad" },
          { text: "Compare your life to AI-polished feeds", bucket: "bad" },
          { text: "Tell a real person when something online wrecked you", bucket: "good" },
          { text: "Stay up till 3am asking AI to fix everything", bucket: "bad" },
          { text: "Mute notifications during sleep", bucket: "good" }
        ]
      },
      {
        type: "mcq",
        title: "Crisis ≠ chatbot",
        scenario: "Someone you know DMs you saying they don't want to be here anymore.",
        options: [
          { text: "Send them an AI chatbot link.", correct: false },
          { text: "Stay with them. Listen. Encourage them to call a local helpline / trusted adult. Don't leave it to a chatbot.", correct: true },
          { text: "Wait until morning so you don't overreact.", correct: false },
          { text: "Send a generic motivational quote.", correct: false }
        ],
        why: "Real distress needs real humans. Chatbots aren't safety-rated for crisis. Stay, listen, escalate to a helpline / trusted adult."
      }
    ],

    // ============ Level 6 — Creator Castle ============
    [
      {
        type: "mcq",
        title: "Drop without a label?",
        scenario: "You made a fully AI-generated 'photo' of an event that didn't happen. Caption is funny. You're about to post.",
        options: [
          { text: "Post raw — let people figure it out.", correct: false },
          { text: "Label it AI-generated clearly in the caption AND on-image where required.", correct: true },
          { text: "Hashtag #AI in tag #43.", correct: false },
          { text: "Post and DM 'lol it's fake' to people who ask.", correct: false }
        ],
        why: "Hidden synthesis is the trust killer. Clear, on-image labeling prevents harm — even if your intent was a joke."
      },
      {
        type: "drag",
        title: "Ethical / not",
        prompt: "Sort each AI use case.",
        buckets: [
          { id: "good", label: "ETHICAL" },
          { id: "bad", label: "NOT ETHICAL" }
        ],
        items: [
          { text: "Use AI to draft, then edit + cite + verify before publishing", bucket: "good" },
          { text: "Voice-clone a teacher to prank in chat", bucket: "bad" },
          { text: "Use AI to translate your own writing to reach more readers", bucket: "good" },
          { text: "Generate fake testimonials for your business", bucket: "bad" },
          { text: "Use AI to brainstorm angles, pick yours, write it yourself", bucket: "good" },
          { text: "Train a model on someone's art without consent", bucket: "bad" }
        ]
      },
      {
        type: "spot",
        title: "AI image: tell time",
        prompt: "Click 2 tells in the AI-generated 'photo'. Hands, accessories, background coherence.",
        duration: 35,
        required: 2,
        variant: "image",
        hotspots: [
          { x: 36, y: 56, w: 14, h: 18, label: "Six fingers" },
          { x: 60, y: 50, w: 14, h: 18, label: "Earring melt" },
          { x: 22, y: 24, w: 14, h: 18, label: "Background letters" },
          { x: 70, y: 20, w: 14, h: 18, label: "Impossible reflection" }
        ]
      },
      {
        type: "mcq",
        title: "Deadline vs harm",
        scenario: "You're 30 mins before a school post deadline. You spot a likely deepfake quote in your draft. Removing it = blowing the deadline.",
        options: [
          { text: "Ship it, fix later. Engagement first.", correct: false },
          { text: "Pull or replace the deepfake claim. A late post < a harmful one.", correct: true },
          { text: "Add 'allegedly' and post.", correct: false },
          { text: "Repost a friend's version with the same claim.", correct: false }
        ],
        why: "Speed never beats harm prevention. A late, accurate post > a viral, harmful one."
      },
      {
        type: "mcq",
        title: "Who's missing?",
        scenario: "Your team is shipping an AI study assistant. The team built and tested it on people exactly like the team.",
        options: [
          { text: "Ship — no one complained.", correct: false },
          { text: "Pause to test with users who differ in age, ability, language, and access. Fix what breaks.", correct: true },
          { text: "Add a disclaimer, ship anyway.", correct: false },
          { text: "Let users 'self-report' bias post-launch.", correct: false }
        ],
        why: "Fairness needs proactive testing. 'Who's missing from our test set?' is the question that prevents the worst failures."
      }
    ]
  ];

  const BEST_KEY = "neurobloxBestTime";
  const PROGRESS_KEY = "neurobloxProgress";
  const AVATAR_KEY = "doomloopAvatar";
  const TUTORIAL_KEY = "merlinTutorialSeen";

  // Cute, wholesome customisation. Visor color comes from the current level's accent.
  const AVATAR_OPTIONS = {
    body: [
      { id: "cyan",    name: "Cyan",    color: "#22e3ff" },
      { id: "lime",    name: "Lime",    color: "#b6ff5c" },
      { id: "mint",    name: "Mint",    color: "#5cffb6" },
      { id: "magenta", name: "Magenta", color: "#ff4dd2" },
      { id: "rose",    name: "Rose",    color: "#ffaad4" },
      { id: "amber",   name: "Amber",   color: "#ffc94a" },
      { id: "peach",   name: "Peach",   color: "#ffb88c" },
      { id: "violet",  name: "Violet",  color: "#a98bff" },
      { id: "sky",     name: "Sky",     color: "#8ec8ff" }
    ],
    head: [
      { id: "square", name: "Square" },
      { id: "round",  name: "Round" },
      { id: "dome",   name: "Dome" }
    ],
    hat: [
      { id: "none",    name: "None" },
      { id: "beanie",  name: "Beanie" },
      { id: "antenna", name: "Antenna" },
      { id: "halo",    name: "Halo" },
      { id: "bow",     name: "Bow" },
      { id: "cap",     name: "Cap" }
    ],
    face: [
      { id: "band",    name: "Visor" },
      { id: "goggles", name: "Goggles" },
      { id: "bigeyes", name: "Big eyes" },
      { id: "smile",   name: "Smile" }
    ]
  };
  const DEFAULT_AVATAR = { body: "cyan", head: "square", hat: "none", face: "band" };

  function loadAvatar() {
    const raw = safeStorageGet(AVATAR_KEY);
    if (!raw) return { ...DEFAULT_AVATAR };
    try {
      const data = JSON.parse(raw) || {};
      const pick = (group, val) => AVATAR_OPTIONS[group].find((o) => o.id === val) ? val : DEFAULT_AVATAR[group];
      return { body: pick("body", data.body), head: pick("head", data.head), hat: pick("hat", data.hat), face: pick("face", data.face) };
    } catch (_) { return { ...DEFAULT_AVATAR }; }
  }
  function saveAvatar(avatar) { safeStorageSet(AVATAR_KEY, JSON.stringify(avatar)); }
  function avatarBodyColor(avatar) { return AVATAR_OPTIONS.body.find((o) => o.id === avatar.body).color; }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  function safeStorageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function safeStorageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
  }

  // Tamper-evident verification code. The host can recompute the checksum
  // from the embedded fields and confirm the run was not edited.
  // Format: NBX-{secsB36}-{firstTry}/{cleared}-W{wrongs}-{check6}
  // Salt is constant; the code is reproducible from the displayed stats.
  const VERIFY_SALT = "MRL-2026-OPS";

  function djb2(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i += 1) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    return h;
  }

  function makeVerificationCode({ seconds, firstTry, cleared, total, wrongs, score }) {
    const t = seconds.toString(36).toUpperCase().padStart(3, "0");
    const ft = String(firstTry).padStart(2, "0");
    const cl = String(cleared).padStart(2, "0");
    const tl = String(total).padStart(2, "0");
    const wr = String(wrongs).padStart(2, "0");
    const data = `${VERIFY_SALT}|${seconds}|${firstTry}|${cleared}|${total}|${wrongs}|${score}`;
    const h = djb2(data).toString(36).toUpperCase().padStart(6, "0").slice(-6);
    return `MRL-${t}-${ft}/${cl}OF${tl}-W${wr}-${h}`;
  }

  function verifyCode(code, score) {
    const m = /^MRL-([0-9A-Z]{3})-(\d{2})\/(\d{2})OF(\d{2})-W(\d{2})-([0-9A-Z]{6})$/.exec(code.trim());
    if (!m) return { ok: false, reason: "Format invalid" };
    const seconds = parseInt(m[1], 36);
    const firstTry = parseInt(m[2], 10);
    const cleared = parseInt(m[3], 10);
    const total = parseInt(m[4], 10);
    const wrongs = parseInt(m[5], 10);
    const claim = m[6];
    const expected = makeVerificationCode({ seconds, firstTry, cleared, total, wrongs, score });
    return {
      ok: expected.endsWith(claim),
      seconds, firstTry, cleared, total, wrongs,
      time: formatTime(seconds * 1000)
    };
  }

  function drawBox(context, x, y, w, h, r = 4) {
    context.beginPath();
    if (context.roundRect) context.roundRect(x, y, w, h, r);
    else context.rect(x, y, w, h);
  }

  function fillBox(context, x, y, w, h, fill, stroke = null, lineWidth = 0, r = 4) {
    drawBox(context, x, y, w, h, r);
    context.fillStyle = fill;
    context.fill();
    if (stroke) {
      context.lineWidth = lineWidth || 2;
      context.strokeStyle = stroke;
      context.stroke();
    }
  }

  function setCanvasScale() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(LOGICAL_W * dpr);
    canvas.height = Math.floor(LOGICAL_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setOverlay(html) {
    overlayContent.innerHTML = html;
    overlay.classList.add("visible");
  }
  function clearOverlay() {
    overlay.classList.remove("visible");
    overlayContent.innerHTML = "";
  }
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toastEl.classList.remove("visible"), 4000);
  }
  function updateButtonState(button, active) { button.setAttribute("aria-pressed", active ? "true" : "false"); }

  // ============================================================
  // GAME CLASS
  // ============================================================
  class Game {
    constructor() {
      this.levelIndex = 0;
      this.started = false;
      this.finished = false;
      this.paused = true;
      this.lastTs = 0;
      this.startTs = 0;
      this.finishMs = 0;
      this.score = 0;
      this.totalNodes = 0;
      this.clearedNodes = 0;
      this.hints = 0;
      this.damage = 0;
      this.firstTryClears = 0;
      this.totalWrongAttempts = 0;
      this.bossesCleared = 0;
      this.puzzlesSolved = new Set();
      this.cleanup = null;
      this.cameraX = 0;
      this.level = null;
      this.player = null;
      this.audioContext = null;
      this.particles = [];
      this.avatar = loadAvatar();
      this.loadProgress();
      this.bindControls();
      if (!this.maybeShowVerifyScreen()) this.showStartScreen();
      requestAnimationFrame((ts) => this.loop(ts));
    }

    maybeShowVerifyScreen() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("verify");
      if (!code) return false;
      const score = Number(params.get("score") || 0);
      const result = verifyCode(code, score);
      const ok = result.ok && score > 0;
      this.paused = true;
      this.started = false;
      setOverlay(`
        <p class="screen-kicker">// HOST VERIFIER</p>
        <h2 class="screen-title" style="${ok ? "" : "background:linear-gradient(90deg,#ff5070,#ffc94a);-webkit-background-clip:text;background-clip:text;color:transparent"}">${ok ? "VALID" : "INVALID"}</h2>
        <p class="lead">${ok
          ? "This proof-of-run code is consistent with the score shown."
          : "Code or score does not match. The run may have been altered."}</p>
        <div class="verify-box" style="margin-top:6px">
          <div class="verify-label">// CODE</div>
          <div class="verify-code">${escapeHtml(code)}</div>
        </div>
        ${result.seconds !== undefined ? `
          <div class="result-card" style="margin-top:14px">
            <div class="stat-tile"><span>Encoded time</span><strong>${result.time}</strong></div>
            <div class="stat-tile"><span>First-try</span><strong>${result.firstTry}/${result.cleared}</strong></div>
            <div class="stat-tile"><span>Wrong attempts</span><strong>${result.wrongs}</strong></div>
            <div class="stat-tile"><span>Score claimed</span><strong>${score || "—"}</strong></div>
          </div>` : ""}
        <p class="puzzle-note" style="margin-top:14px">Host workflow: ask the player to read out the code AND the displayed score. Paste both into the URL as <code>?verify=CODE&amp;score=NNNN</code> on this page. If you see <strong style="color:var(--lime)">VALID</strong>, the run is consistent.</p>
        <div class="button-row">
          <button class="primary" id="goPlay">▶ Play the game</button>
        </div>
      `);
      document.getElementById("goPlay").addEventListener("click", () => {
        const url = new URL(window.location.href);
        url.searchParams.delete("verify");
        url.searchParams.delete("score");
        window.history.replaceState({}, "", url.toString());
        this.showStartScreen();
      });
      return true;
    }

    bindControls() {
      window.addEventListener("keydown", (event) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
        if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = true;
        if (event.code === "ArrowRight" || event.code === "KeyD") input.right = true;
        if ((event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Space") && !input.jump) input.jumpQueued = true;
        if (event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Space") input.jump = true;
        if ((event.code === "KeyE" || event.code === "Enter") && !input.action) input.actionQueued = true;
        if (event.code === "KeyE" || event.code === "Enter") input.action = true;
        if (event.code === "Escape" && this.started && !this.finished) this.togglePause();
      });
      window.addEventListener("keyup", (event) => {
        if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = false;
        if (event.code === "ArrowRight" || event.code === "KeyD") input.right = false;
        if (event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Space") input.jump = false;
        if (event.code === "KeyE" || event.code === "Enter") input.action = false;
      });
      this.bindTouchButton("touchLeft", "left");
      this.bindTouchButton("touchRight", "right");
      this.bindTouchButton("touchJump", "jump");
      this.bindTouchButton("touchAction", "action");
      pauseButton.addEventListener("click", () => this.togglePause());
    }

    bindTouchButton(id, key) {
      const button = document.getElementById(id);
      const down = (event) => {
        event.preventDefault();
        input[key] = true;
        if (key === "jump") input.jumpQueued = true;
        if (key === "action") input.actionQueued = true;
        updateButtonState(button, true);
      };
      const up = (event) => {
        event.preventDefault();
        input[key] = false;
        updateButtonState(button, false);
      };
      button.addEventListener("pointerdown", down);
      button.addEventListener("pointerup", up);
      button.addEventListener("pointercancel", up);
      button.addEventListener("pointerleave", up);
    }

    showStartScreen() {
      this.paused = true;
      this.started = false;
      const bestRaw = safeStorageGet(BEST_KEY);
      const bestLine = bestRaw
        ? `<li>Best run: <strong style="color:var(--lime)">${formatTime(Number(bestRaw))}</strong></li>`
        : `<li>Best run: <strong style="color:var(--muted)">unset</strong></li>`;
      const hasSave = this.levelIndex > 0;
      const primaryButton = hasSave
        ? `<button class="primary" id="continueRun">▶ Continue your run (World ${this.levelIndex + 1})</button>
           <button class="secondary" id="startFresh">↺ Start a new run from World 1</button>`
        : `<button class="primary" id="startFresh">▶ Begin your first run</button>`;
      setOverlay(`
        <div class="screen-grid">
          <div>
            <h1 class="screen-title">MERLIN</h1>
            ${bestRaw ? `<p style="color:var(--lime);font-weight:800;letter-spacing:.08em;margin:6px 0 14px">Best run so far: ${formatTime(Number(bestRaw))}</p>` : ""}
            <div class="button-row">
              ${primaryButton}
            </div>
            <div class="button-row" style="margin-top:6px">
              <button class="secondary" id="customizeAvatar">★ Edit my avatar</button>
              <button class="secondary" id="howToPlay">? How to play</button>
              <button class="secondary" id="hostVerify">⚑ Host: verify a run code</button>
            </div>
            <div class="author-card">
              <div class="author-text">
                <span class="author-label">Designed, conceptualised &amp; built by</span>
                <strong>Aaron Ang</strong>
                <span class="author-sub">© ${new Date().getFullYear()} · all rights reserved</span>
              </div>
            </div>
          </div>
          <div class="mission-map" aria-hidden="true">
            <div class="map-avatar"></div>
            <div class="map-block" style="left: 180px; bottom: 118px;"></div>
            <div class="map-block" style="left: 270px; bottom: 168px; background: linear-gradient(180deg,#a98bff,#5a3ea8);"></div>
            <div class="map-block" style="left: 365px; bottom: 126px; background: linear-gradient(180deg,#ff4dd2,#7a1860);"></div>
            <div class="map-block" style="left: 460px; bottom: 205px; background: linear-gradient(180deg,#b6ff5c,#5a8c1a);"></div>
            <div class="map-block" style="left: 560px; bottom: 144px; background: linear-gradient(180deg,#ffc94a,#7a5b14);"></div>
          </div>
        </div>
      `);
      const continueBtn = document.getElementById("continueRun");
      if (continueBtn) continueBtn.addEventListener("click", () => this.startRun(false));
      document.getElementById("startFresh").addEventListener("click", () => this.startRun(true));
      document.getElementById("hostVerify").addEventListener("click", () => this.showVerifyForm());
      document.getElementById("customizeAvatar").addEventListener("click", () => this.showAvatarCustomizer({}));
      document.getElementById("howToPlay").addEventListener("click", () => this.showTutorial({ onDone: () => this.showStartScreen() }));
    }

    showAvatarCustomizer(opts = {}) {
      this.paused = true;
      this.started = false;
      const draft = { ...this.avatar };
      const saveLabel = opts.thenStart ? "✓ Save & start the run" : "✓ Save avatar";
      const cancelLabel = "← Back to title";
      setOverlay(`
        <p class="screen-kicker">// ${opts.thenStart ? "STEP 2 OF 2 — DESIGN YOUR PLAYER" : "CUSTOMISE AVATAR"}</p>
        <h2 class="level-title">Make it yours</h2>
        <p class="lead">Pick a body colour, head shape, face, and hat. Visor glow matches the world you're in.</p>

        <div class="avatar-build">
          <div class="avatar-preview-box">
            <canvas id="avatarPreview" width="220" height="240" aria-label="Avatar preview"></canvas>
            <div class="preview-caption">Live preview</div>
          </div>
          <div class="avatar-pickers" id="avatarPickers"></div>
        </div>

        <div class="button-row">
          <button class="primary" id="avatarSave">${saveLabel}</button>
          <button class="secondary" id="avatarReset">↺ Reset to default</button>
          <button class="secondary" id="avatarBack">${cancelLabel}</button>
        </div>
      `);

      const previewCanvas = document.getElementById("avatarPreview");
      const previewCtx = previewCanvas.getContext("2d");
      const pickers = document.getElementById("avatarPickers");

      const renderPickers = () => {
        const groupHTML = (key, label) => {
          const opts = AVATAR_OPTIONS[key];
          return `
            <div class="picker-group">
              <div class="picker-label">${label}</div>
              <div class="picker-row" data-group="${key}">
                ${opts.map((opt) => {
                  const sel = draft[key] === opt.id ? " selected" : "";
                  if (key === "body") {
                    return `<button class="swatch${sel}" data-id="${opt.id}" style="background:${opt.color}" title="${escapeHtml(opt.name)}" aria-label="${escapeHtml(opt.name)}"></button>`;
                  }
                  return `<button class="picker-chip${sel}" data-id="${opt.id}">${escapeHtml(opt.name)}</button>`;
                }).join("")}
              </div>
            </div>
          `;
        };
        pickers.innerHTML = `
          ${groupHTML("body", "Body colour")}
          ${groupHTML("head", "Head shape")}
          ${groupHTML("face", "Face")}
          ${groupHTML("hat", "Hat / accessory")}
        `;
        pickers.querySelectorAll(".picker-row").forEach((row) => {
          row.querySelectorAll("[data-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
              draft[row.dataset.group] = btn.dataset.id;
              renderPickers();
              renderPreview();
            });
          });
        });
      };

      let raf = 0;
      const renderPreview = () => {
        previewCtx.clearRect(0, 0, 220, 240);
        // Soft preview backdrop
        const grad = previewCtx.createRadialGradient(110, 110, 20, 110, 110, 130);
        grad.addColorStop(0, "rgba(34, 227, 255, 0.16)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        previewCtx.fillStyle = grad;
        previewCtx.fillRect(0, 0, 220, 240);
        // Floor pad
        previewCtx.fillStyle = "rgba(34,227,255,0.12)";
        previewCtx.beginPath();
        previewCtx.ellipse(110, 210, 60, 8, 0, 0, Math.PI * 2);
        previewCtx.fill();
        // Avatar centered, feet at y=205
        previewCtx.save();
        previewCtx.translate(110, 0);
        const t = performance.now() / 1000;
        const bob = Math.sin(t * 2) * 1.5;
        previewCtx.translate(0, bob);
        drawAvatar(previewCtx, "#22e3ff", draft, 205, t);
        previewCtx.restore();
      };
      const loop = () => { renderPreview(); raf = requestAnimationFrame(loop); };
      this.cleanup = () => cancelAnimationFrame(raf);

      renderPickers();
      loop();

      document.getElementById("avatarSave").addEventListener("click", () => {
        this.avatar = { ...draft };
        saveAvatar(this.avatar);
        if (this.cleanup) this.cleanup();
        this.cleanup = null;
        if (opts.thenStart) {
          // Mark walkthrough as seen now that onboarding is fully complete.
          safeStorageSet(TUTORIAL_KEY, "1");
          this._beginRun(!!opts.fresh);
        } else {
          showToast("Avatar saved.");
          this.showStartScreen();
        }
      });
      document.getElementById("avatarReset").addEventListener("click", () => {
        Object.assign(draft, DEFAULT_AVATAR);
        renderPickers();
      });
      document.getElementById("avatarBack").addEventListener("click", () => {
        if (this.cleanup) this.cleanup();
        this.cleanup = null;
        // Always escape back to title — players re-enter the run from there.
        this.showStartScreen();
      });
    }

    // Step-by-step tutorial. One instruction per slide, with an animated demo.
    showTutorial({ onDone }) {
      this.paused = true;
      this.started = false;
      const slides = [
        {
          title: "Move",
          tag: "STEP 1 of 5 — MOVE",
          body: "Use ← → on keyboard (or A / D), or the on-screen ‹ › arrows on mobile. Try walking right to start every world.",
          draw: drawTutorialMove
        },
        {
          title: "Jump over gaps",
          tag: "STEP 2 of 5 — JUMP",
          body: "Press Space (keyboard) or ↑ (mobile) to hop. Falling into a glitch pit costs you time.",
          draw: drawTutorialJump
        },
        {
          title: "Trigger mini-challenges",
          tag: "STEP 3 of 5 — NODES",
          body: "Walk into a glowing ▲ node. A mini-challenge will pop up — MCQ, deepfake spot, voice-clone audio, swipe sort, drag-and-drop, or a scroll-stop reflex test.",
          draw: drawTutorialNode
        },
        {
          title: "Beat the boss tower",
          tag: "STEP 4 of 5 — BOSS",
          body: "Each world has a boss tower. Stand next to it and press E (or tap !) to open the world's boss puzzle.",
          draw: drawTutorialBoss
        },
        {
          title: "Open the portal",
          tag: "STEP 5 of 5 — PORTAL",
          body: "Once you've cleared every node AND the boss, the portal unlocks. Run through it to reach the next world. Score = time + first-try clears. At the end, you'll get a code to show your host.",
          draw: drawTutorialPortal
        }
      ];
      let i = 0;
      let raf = 0;
      const startedAt = performance.now();

      const renderSlide = () => {
        const s = slides[i];
        const isLast = i === slides.length - 1;
        const isFirst = i === 0;
        setOverlay(`
          <p class="screen-kicker">// ${s.tag}</p>
          <h2 class="level-title">${escapeHtml(s.title)}</h2>
          <div class="tutorial-stage">
            <canvas id="tutCanvas" width="640" height="320" aria-label="Tutorial demo"></canvas>
          </div>
          <p class="lead" style="margin-top:12px">${s.body}</p>
          <div class="tutorial-progress">
            ${slides.map((_, idx) => `<span class="dot ${idx === i ? "active" : ""} ${idx < i ? "done" : ""}"></span>`).join("")}
          </div>
          <div class="button-row">
            <button class="primary" id="tutNext">${isLast ? "✓ Got it — design my avatar" : "▶ Next instruction"}</button>
            ${!isFirst ? `<button class="secondary" id="tutBack">← Previous</button>` : ""}
            <button class="secondary" id="tutHome">← Back to title</button>
          </div>
        `);
        const c = document.getElementById("tutCanvas").getContext("2d");
        const draw = () => {
          const t = (performance.now() - startedAt) / 1000;
          s.draw(c, t, this.avatar);
          raf = requestAnimationFrame(draw);
        };
        cancelAnimationFrame(raf);
        draw();
        document.getElementById("tutNext").addEventListener("click", () => {
          if (isLast) finish();
          else { i += 1; renderSlide(); }
        });
        const back = document.getElementById("tutBack");
        if (back) back.addEventListener("click", () => { i -= 1; renderSlide(); });
        document.getElementById("tutHome").addEventListener("click", () => {
          cancelAnimationFrame(raf);
          if (this.cleanup) this.cleanup();
          this.cleanup = null;
          this.showStartScreen();
        });
      };

      const finish = () => {
        cancelAnimationFrame(raf);
        if (this.cleanup) this.cleanup();
        this.cleanup = null;
        if (typeof onDone === "function") onDone();
      };
      this.cleanup = () => cancelAnimationFrame(raf);
      renderSlide();
    }

    showVerifyForm() {
      this.paused = true;
      this.started = false;
      setOverlay(`
        <p class="screen-kicker">// HOST VERIFIER</p>
        <h2 class="level-title">Verify a player's run</h2>
        <p class="lead">Ask the player to read out the code AND the displayed score. Paste them here.</p>
        <div style="display:grid;gap:10px;margin-top:10px">
          <label class="range-row" style="grid-template-columns:1fr">Code
            <input id="verifyCodeInput" type="text" placeholder="MRL-15O-09/31OF31-W04-V7L3XH" style="min-height:46px;padding:11px 13px;border:1px solid var(--edge-strong);border-radius:6px;background:rgba(8,10,22,0.85);color:var(--ink);font-family:ui-monospace,monospace;font-size:1rem;letter-spacing:.06em" />
          </label>
          <label class="range-row" style="grid-template-columns:1fr">Score (as displayed)
            <input id="verifyScoreInput" type="number" placeholder="25000" style="min-height:46px;padding:11px 13px;border:1px solid var(--edge-strong);border-radius:6px;background:rgba(8,10,22,0.85);color:var(--ink);font-family:ui-monospace,monospace;font-size:1rem" />
          </label>
        </div>
        <div id="verifyResult" style="margin-top:14px"></div>
        <div class="button-row">
          <button class="primary" id="verifyRun">Verify</button>
          <button class="secondary" id="verifyBack">← Back to title</button>
        </div>
      `);
      document.getElementById("verifyBack").addEventListener("click", () => this.showStartScreen());
      document.getElementById("verifyRun").addEventListener("click", () => {
        const code = document.getElementById("verifyCodeInput").value.trim();
        const score = Number(document.getElementById("verifyScoreInput").value);
        const result = verifyCode(code, score);
        const ok = result.ok && score > 0;
        document.getElementById("verifyResult").innerHTML = ok
          ? `<div class="verify-box"><div class="verify-label">RESULT</div>
              <div class="verify-code" style="color:var(--lime)">VALID</div>
              <div class="verify-meta">${result.time} · ${result.firstTry}/${result.cleared} first-try · ${result.wrongs} wrong · score ${score}</div></div>`
          : `<div class="verify-box"><div class="verify-label">RESULT</div>
              <div class="verify-code" style="color:var(--coral)">INVALID</div>
              <div class="verify-meta">${result.reason || "Code does not match the score."}</div></div>`;
      });
    }

    loadProgress() {
      const saved = safeStorageGet(PROGRESS_KEY);
      if (!saved) return;
      try {
        const data = JSON.parse(saved);
        if (Number.isInteger(data.levelIndex)) this.levelIndex = clamp(data.levelIndex, 0, LEVEL_SPECS.length - 1);
      } catch (_) {}
    }

    saveProgress() { safeStorageSet(PROGRESS_KEY, JSON.stringify({ levelIndex: this.levelIndex })); }

    // Public entry: starts a run. New runs route through the tutorial (first
    // time only) and the avatar customizer (always) before the world brief.
    // `fresh = true` resets save and starts at world 1.
    // `fresh = false` continues from the saved level (skips tutorial + avatar).
    startRun(fresh) {
      const tutorialSeen = !!safeStorageGet(TUTORIAL_KEY);
      const hasAvatar = !!safeStorageGet(AVATAR_KEY);
      if (!fresh && tutorialSeen && hasAvatar && this.levelIndex > 0) {
        // Continue: straight into the game.
        this._beginRun(false);
        return;
      }
      // First-time or fresh run → tutorial → avatar → world 1.
      // Tutorial flag is only marked seen after the player completes the
      // avatar step too, so bailing mid-flow re-shows the walkthrough.
      const goAvatar = () => this.showAvatarCustomizer({ thenStart: true, fresh });
      if (!tutorialSeen) {
        this.showTutorial({ onDone: goAvatar });
      } else {
        goAvatar();
      }
    }

    // Internal: actually starts/initialises the run.
    _beginRun(fresh) {
      if (fresh) {
        this.levelIndex = 0;
        this.puzzlesSolved.clear();
        safeStorageSet(PROGRESS_KEY, JSON.stringify({ levelIndex: 0 }));
      }
      this.started = true;
      this.finished = false;
      this.score = 0;
      this.totalNodes = 0;
      this.clearedNodes = 0;
      this.damage = 0;
      this.hints = 0;
      this.firstTryClears = 0;
      this.totalWrongAttempts = 0;
      this.bossesCleared = 0;
      this.startTs = performance.now();
      this.finishMs = 0;
      this.initLevel(this.levelIndex);
      this.showLevelBrief();
    }

    trackWrong(node) {
      this.totalWrongAttempts += 1;
      if (node) node.wrongs = (node.wrongs || 0) + 1;
      else if (this.level) this.level.bossWrongs = (this.level.bossWrongs || 0) + 1;
    }

    showLevelBrief() {
      const spec = LEVEL_SPECS[this.levelIndex];
      this.paused = true;
      const nodeCount = LEVEL_NODES[this.levelIndex].length;
      setOverlay(`
        <div class="level-brief">
          <p class="screen-kicker">// World ${this.levelIndex + 1} of ${LEVEL_SPECS.length} — ${spec.short}</p>
          <h2 class="level-title">${spec.name}</h2>
          <p class="lead">${spec.focus}</p>
          <div class="brief-stats">
            <div class="stat-tile"><span>Mission</span><strong>${spec.goal}</strong></div>
            <div class="stat-tile"><span>Mid-run challenges</span><strong>${nodeCount} nodes</strong></div>
            <div class="stat-tile"><span>End boss</span><strong>${PUZZLE_TITLES[spec.puzzle]}</strong></div>
          </div>
          <div class="button-row">
            <button class="primary" id="enterLevel">▶ Start this world</button>
            <button class="secondary" id="backToTitle">← Back to title</button>
          </div>
        </div>
      `);
      document.getElementById("enterLevel").addEventListener("click", () => {
        clearOverlay();
        this.paused = false;
        showToast(`${spec.name}: walk into glowing ▲ NODES to trigger challenges. Press E at the ${spec.stationLabel}.`);
      });
      document.getElementById("backToTitle").addEventListener("click", () => this.showStartScreen());
    }

    initLevel(index) {
      const spec = LEVEL_SPECS[index];
      const nodes = LEVEL_NODES[index] || [];
      const level = buildLevel(spec, index, nodes);
      this.level = level;
      this.cameraX = 0;
      this.player = {
        x: level.spawn.x, y: level.spawn.y, w: 44, h: 80,
        vx: 0, vy: 0, grounded: false, facing: 1,
        checkpointX: level.spawn.x, checkpointY: level.spawn.y, invuln: 0
      };
      this.totalNodes += level.nodes.length;
      this.particles = [];
      hudGoal.textContent = spec.goal;
      this.updateHud();
      this.saveProgress();
    }

    loop(ts) {
      const dt = Math.min(0.033, (ts - (this.lastTs || ts)) / 1000);
      this.lastTs = ts;
      if (this.started && !this.finished) this.updateHud();
      if (!this.paused && this.started && !this.finished) this.update(dt);
      this.draw();
      requestAnimationFrame((next) => this.loop(next));
    }

    elapsedMs() {
      if (!this.started) return 0;
      if (this.finished) return this.finishMs;
      return performance.now() - this.startTs;
    }

    calculateScore() {
      const timeSeconds = Math.floor(this.elapsedMs() / 1000);
      const raw = 140000
        - timeSeconds * 60
        + this.clearedNodes * 380
        + this.firstTryClears * 220
        + this.bossesCleared * 1200
        - this.damage * 600
        - this.hints * 280
        - this.totalWrongAttempts * 200;
      return Math.max(0, Math.round(raw));
    }

    updateHud() {
      hudLevel.textContent = `${this.levelIndex + 1}/${LEVEL_SPECS.length}`;
      hudTime.textContent = formatTime(this.elapsedMs());
      hudScore.textContent = String(this.calculateScore());
      if (this.level) {
        const cleared = this.level.nodes.filter((n) => n.cleared).length;
        const puzzleStatus = this.level.puzzleSolved ? "boss done" : "boss open";
        hudGoal.textContent = `${cleared}/${this.level.nodes.length} nodes • ${puzzleStatus}`;
      }
    }

    update(dt) {
      const player = this.player;
      const level = this.level;
      const actionNow = input.actionQueued;
      const jumpNow = input.jumpQueued;
      input.actionQueued = false;
      input.jumpQueued = false;

      player.invuln = Math.max(0, player.invuln - dt);

      let targetVx = 0;
      if (input.left) targetVx -= MOVE_SPEED;
      if (input.right) targetVx += MOVE_SPEED;
      player.vx += (targetVx - player.vx) * Math.min(1, dt * 12);
      if (Math.abs(player.vx) < 4) player.vx = 0;
      if (player.vx !== 0) player.facing = player.vx > 0 ? 1 : -1;

      if (jumpNow && player.grounded) {
        player.vy = -JUMP_SPEED;
        player.grounded = false;
        this.spawnParticles(player.x + player.w / 2, player.y + player.h, 8, level.spec.accent);
      }

      player.vy += GRAVITY * dt;
      this.movePlayer(player.vx * dt, 0);
      this.movePlayer(0, player.vy * dt);

      if (player.y > LOGICAL_H + 260) {
        this.hurtPlayer("Void pit. Respawned at checkpoint.");
      }

      this.updateBots(dt);
      this.updateParticles(dt);
      this.checkNodes();
      this.checkHazards();
      this.handleNearbyInteractions(actionNow);

      this.cameraX = clamp(player.x + player.w / 2 - LOGICAL_W * 0.42, 0, level.worldW - LOGICAL_W);
    }

    spawnParticles(x, y, count, color) {
      for (let i = 0; i < count; i += 1) {
        this.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 220,
          vy: (Math.random() - 0.9) * 180,
          life: 0.6 + Math.random() * 0.4,
          age: 0,
          color,
          size: 3 + Math.random() * 3
        });
      }
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        const p = this.particles[i];
        p.age += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 600 * dt;
        if (p.age >= p.life) this.particles.splice(i, 1);
      }
    }

    movePlayer(dx, dy) {
      const player = this.player;
      const platforms = this.level.platforms;
      player.x += dx;
      player.x = clamp(player.x, 0, this.level.worldW - player.w);
      for (const platform of platforms) {
        if (!rectsOverlap(player, platform)) continue;
        if (dx > 0) player.x = platform.x - player.w;
        if (dx < 0) player.x = platform.x + platform.w;
        player.vx = 0;
      }
      player.y += dy;
      player.grounded = false;
      for (const platform of platforms) {
        if (!rectsOverlap(player, platform)) continue;
        if (dy > 0) {
          player.y = platform.y - player.h;
          player.vy = 0;
          player.grounded = true;
        } else if (dy < 0) {
          player.y = platform.y + platform.h;
          player.vy = 0;
        }
      }
    }

    updateBots(dt) {
      for (const bot of this.level.bots) {
        bot.x += bot.vx * dt;
        if (bot.x < bot.min || bot.x > bot.max) {
          bot.vx *= -1;
          bot.x = clamp(bot.x, bot.min, bot.max);
        }
      }
    }

    checkNodes() {
      const player = this.player;
      for (const node of this.level.nodes) {
        if (node.cleared) continue;
        const overlapping = rectsOverlap(player, node);
        if (!overlapping) {
          node.skip = false;
          continue;
        }
        if (node.skip) continue;
        this.openNode(node);
        return;
      }
    }

    closeNode(node) {
      if (node) node.skip = true;
      if (this.cleanup) { this.cleanup(); this.cleanup = null; }
      clearOverlay();
      this.paused = false;
    }

    checkHazards() {
      if (this.player.invuln > 0) return;
      for (const hazard of this.level.hazards) {
        if (rectsOverlap(this.player, hazard)) { this.hurtPlayer(hazard.message); return; }
      }
      for (const bot of this.level.bots) {
        if (rectsOverlap(this.player, bot)) { this.hurtPlayer(bot.message); return; }
      }
    }

    hurtPlayer(message) {
      const player = this.player;
      this.damage += 1;
      player.invuln = 1.4;
      player.vy = -460;
      player.x = clamp(player.checkpointX, 0, this.level.worldW - player.w);
      player.y = player.checkpointY;
      this.spawnParticles(player.x + player.w / 2, player.y + player.h / 2, 12, "#ff5070");
      showToast(message);
    }

    handleNearbyInteractions(actionNow) {
      const level = this.level;
      const player = this.player;
      const stationNear = Math.abs((player.x + player.w / 2) - level.station.x) < 96 && Math.abs(player.y - level.station.y) < 130;
      const exitNear = Math.abs((player.x + player.w / 2) - level.exit.x) < 100 && Math.abs(player.y - level.exit.y) < 130;
      const cleared = level.nodes.filter((n) => n.cleared).length;
      const allNodesDone = cleared >= level.nodes.length;
      const unlocked = allNodesDone && level.puzzleSolved;

      if (stationNear) level.prompt = level.puzzleSolved
        ? `${LEVEL_SPECS[this.levelIndex].stationLabel} cleared`
        : `[E] enter ${LEVEL_SPECS[this.levelIndex].stationLabel}`;
      else if (exitNear) level.prompt = unlocked
        ? "[E] enter portal"
        : `Locked: clear ${level.nodes.length - cleared} node${level.nodes.length - cleared === 1 ? "" : "s"}${level.puzzleSolved ? "" : " + boss"}`;
      else level.prompt = "";

      if (!actionNow) return;
      if (stationNear) { this.openPuzzle(level.spec.puzzle); return; }
      if (exitNear) {
        if (unlocked) this.advanceLevel();
        else showToast(level.prompt.replace("[E] ", ""));
      }
    }

    openNode(node) {
      this.paused = true;
      // Set a checkpoint so failing a node doesn't yeet you off the world
      this.player.checkpointX = clamp(node.x - 60, 60, this.level.worldW - this.player.w - 60);
      this.player.checkpointY = node.y - this.player.h;
      this.renderNode(node);
    }

    nodeCleared(node, gain = 1) {
      node.cleared = true;
      this.clearedNodes += gain;
      if (!node.wrongs) {
        this.firstTryClears += 1;
        this.score += 480 * gain;
      } else {
        this.score += 380 * gain;
      }
      this.spawnParticles(node.x + node.w / 2, node.y + node.h / 2, 18, this.level.spec.accent);
      clearOverlay();
      this.paused = false;
    }

    openPuzzle(type) {
      if (this.cleanup) { this.cleanup(); this.cleanup = null; }
      this.paused = true;
      if (this.level.puzzleSolved) {
        setOverlay(`
          <div class="puzzle-head">
            <h2>${PUZZLE_TITLES[type]} — cleared</h2>
            <p>You already broke this boss. Get to the portal.</p>
          </div>
          <div class="button-row"><button class="primary" id="closeSolved">▶ Continue playing</button></div>
        `);
        document.getElementById("closeSolved").addEventListener("click", () => { clearOverlay(); this.paused = false; });
        return;
      }
      const handlers = {
        promptForge: () => this.renderPromptForge(),
        sourceBridge: () => this.renderSourceBridge(),
        deepfakeLab: () => this.renderDeepfakeLab(),
        privacyVault: () => this.renderPrivacyVault(),
        wellbeingFlow: () => this.renderWellbeingFlow(),
        finalBoss: () => this.renderFinalBoss()
      };
      handlers[type]();
    }

    solvePuzzle(message) {
      if (this.cleanup) { this.cleanup(); this.cleanup = null; }
      this.level.puzzleSolved = true;
      this.puzzlesSolved.add(this.level.spec.puzzle);
      this.bossesCleared += 1;
      if (!this.level.bossWrongs) {
        this.firstTryClears += 1;
        this.score += 2400;
      } else {
        this.score += 2000;
      }
      this.player.checkpointX = this.level.station.x + 90;
      this.player.checkpointY = this.level.station.y - this.player.h;
      clearOverlay();
      this.paused = false;
      showToast(message);
    }

    advanceLevel() {
      if (this.levelIndex >= LEVEL_SPECS.length - 1) { this.completeGame(); return; }
      this.levelIndex += 1;
      this.initLevel(this.levelIndex);
      this.showLevelBrief();
    }

    completeGame() {
      this.finished = true;
      this.paused = true;
      this.finishMs = performance.now() - this.startTs;
      const finalScore = this.calculateScore();
      const bestRaw = safeStorageGet(BEST_KEY);
      const best = bestRaw ? Number(bestRaw) : null;
      const isBest = !best || this.finishMs < best;
      if (isBest) safeStorageSet(BEST_KEY, String(Math.round(this.finishMs)));
      safeStorageSet(PROGRESS_KEY, JSON.stringify({ levelIndex: 0 }));

      const totalChallenges = this.totalNodes + LEVEL_SPECS.length;
      const totalCleared = this.clearedNodes + this.bossesCleared;
      const accuracyPct = totalCleared > 0
        ? Math.round((this.firstTryClears / totalCleared) * 100)
        : 0;
      const seconds = Math.round(this.finishMs / 1000);

      const rank = this.finishMs <= 28 * 60 * 1000 && accuracyPct >= 90 ? "S — Sentinel"
        : this.finishMs <= 36 * 60 * 1000 && accuracyPct >= 75 ? "A — Operator"
        : this.finishMs <= 46 * 60 * 1000 ? "B — Drafter"
        : "Apprentice";

      const code = makeVerificationCode({
        seconds,
        firstTry: this.firstTryClears,
        cleared: totalCleared,
        total: totalChallenges,
        wrongs: this.totalWrongAttempts,
        score: finalScore
      });

      setOverlay(`
        <p class="screen-kicker">// RUN COMPLETE</p>
        <h2 class="screen-title">${rank}</h2>

        <div class="hero-score">
          <div class="hero-score-main">
            <span class="hero-label">FINAL SCORE</span>
            <strong class="hero-score-num">${finalScore.toLocaleString()}</strong>
          </div>
          <div class="hero-score-side">
            <div><span class="hero-label">TIME</span><strong>${formatTime(this.finishMs)}</strong></div>
            <div><span class="hero-label">ACCURACY</span><strong>${accuracyPct}%</strong></div>
            <div><span class="hero-label">${isBest ? "RESULT" : "BEST"}</span><strong style="${isBest ? "color:var(--lime)" : ""}">${isBest ? "NEW BEST" : formatTime(best)}</strong></div>
          </div>
        </div>

        <p class="lead" style="margin-top:14px">Show this screen — and the proof code below — to your host to log this run.</p>

        <div class="result-card" style="margin-top:6px">
          <div class="stat-tile"><span>First-try clears</span><strong>${this.firstTryClears}/${totalCleared}</strong></div>
          <div class="stat-tile"><span>Challenge nodes</span><strong>${this.clearedNodes}/${this.totalNodes}</strong></div>
          <div class="stat-tile"><span>Boss worlds</span><strong>${this.bossesCleared}/${LEVEL_SPECS.length}</strong></div>
          <div class="stat-tile"><span>Wrong attempts</span><strong>${this.totalWrongAttempts}</strong></div>
        </div>

        <div class="verify-box" id="verifyBox" style="margin-top:18px">
          <div class="verify-label">// PROOF-OF-RUN — show host with score above</div>
          <div class="verify-code" id="verifyCode">${code}</div>
          <div class="verify-meta">Time ${formatTime(this.finishMs)} · ${this.firstTryClears}/${totalCleared} first-try · ${this.totalWrongAttempts} wrong · score ${finalScore.toLocaleString()}</div>
          <div class="button-row" style="margin-top:10px">
            <button class="secondary" id="copyCode">Copy code</button>
            <button class="secondary" id="copyReceipt">Copy full receipt</button>
          </div>
        </div>

        <ul class="feature-list" style="margin-top:18px">
          <li>Prompt with goal, context, limits, format, verify.</li>
          <li>Confidence is not proof. Check the source.</li>
          <li>Multiple deepfake clues > one weird frame.</li>
          <li>Strip identifiers before pasting anything.</li>
          <li>Crisis ≠ chatbot. Reach a human.</li>
          <li>Label AI media. Test for who's missing.</li>
        </ul>
        <div class="button-row">
          <button class="primary" id="playAgain">▶ Play again from start</button>
          <button class="secondary" id="titleAgain">← Back to title</button>
        </div>
      `);

      const receipt = [
        "MERLIN — proof of run",
        `Time:       ${formatTime(this.finishMs)} (${seconds}s)`,
        `Score:      ${finalScore}`,
        `Rank:       ${rank}`,
        `First-try:  ${this.firstTryClears}/${totalCleared} (${accuracyPct}%)`,
        `Wrong:      ${this.totalWrongAttempts}`,
        `Hints:      ${this.hints}`,
        `Damage:     ${this.damage}`,
        `Code:       ${code}`
      ].join("\n");

      const copy = (text, btn) => {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            const original = btn.textContent;
            btn.textContent = "✓ Copied";
            setTimeout(() => btn.textContent = original, 1400);
          }).catch(() => fallback());
        } else fallback();
        function fallback() {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (_) {}
          ta.remove();
          const original = btn.textContent;
          btn.textContent = "✓ Copied";
          setTimeout(() => btn.textContent = original, 1400);
        }
      };
      document.getElementById("copyCode").addEventListener("click", (e) => copy(code, e.currentTarget));
      document.getElementById("copyReceipt").addEventListener("click", (e) => copy(receipt, e.currentTarget));
      document.getElementById("playAgain").addEventListener("click", () => this.startRun(true));
      document.getElementById("titleAgain").addEventListener("click", () => this.showStartScreen());
    }

    togglePause() {
      if (!this.started || this.finished) return;
      if (overlay.classList.contains("visible") && this.paused) return;
      if (this.paused) { clearOverlay(); this.paused = false; return; }
      this.paused = true;
      setOverlay(`
        <p class="screen-kicker">// PAUSED</p>
        <h2 class="level-title">${this.level.spec.name}</h2>
        <p class="lead">${this.level.spec.goal}</p>
        <div class="button-row">
          <button class="primary" id="resumeGame">▶ Resume playing</button>
          <button class="secondary" id="restartLevel">↺ Restart this world</button>
          <button class="danger" id="quitTitle">✕ Quit to title (lose progress)</button>
        </div>
      `);
      document.getElementById("resumeGame").addEventListener("click", () => { clearOverlay(); this.paused = false; });
      document.getElementById("restartLevel").addEventListener("click", () => { this.initLevel(this.levelIndex); clearOverlay(); this.paused = false; });
      document.getElementById("quitTitle").addEventListener("click", () => this.showStartScreen());
    }

    draw() {
      if (!this.level) { drawAttractMode(); return; }
      const level = this.level;
      const spec = level.spec;
      const cam = this.cameraX;

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
      sky.addColorStop(0, spec.sky[0]);
      sky.addColorStop(1, spec.sky[1]);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      drawStarfield(cam);
      drawHorizonGrid(spec, cam);
      drawParallaxBuildings(spec, cam);

      ctx.save();
      ctx.translate(-cam, 0);
      drawLevelGeometry(level);
      drawNodes(level);
      drawStation(level);
      drawExit(level);
      drawHazards(level);
      drawBots(level);
      drawParticles(this.particles);
      drawPlayer(this.player, performance.now() / 1000, spec.accent, this.avatar);
      ctx.restore();

      drawHudOverlay(level, this);
    }

    // ========================================================
    // INLINE NODE RENDERER (router)
    // ========================================================
    renderNode(node) {
      switch (node.type) {
        case "mcq": return this.renderMCQ(node);
        case "swipe": return this.renderSwipe(node);
        case "drag": return this.renderDrag(node);
        case "spot": return this.renderSpot(node);
        case "audio": return this.renderAudio(node);
        case "reflex": return this.renderReflex(node);
        default: this.nodeCleared(node);
      }
    }

    renderMCQ(node) {
      let answered = false;
      setOverlay(`
        <div class="puzzle-head">
          <h2>${escapeHtml(node.title)}</h2>
          <p>Pick the move. Wrong picks cost time.</p>
        </div>
        <div class="scenario">${escapeHtml(node.scenario)}</div>
        <div class="options-grid" id="mcqOptions"></div>
        <p class="puzzle-note" id="mcqFeedback" style="margin-top:14px">Take a breath. There's exactly one good answer.</p>
        <div class="button-row">
          <button class="secondary" id="mcqClose">⏸ Skip for now (try again later)</button>
        </div>
      `);
      const grid = document.getElementById("mcqOptions");
      const feedback = document.getElementById("mcqFeedback");
      grid.innerHTML = node.options.map((opt, i) => `
        <button class="option-button" data-i="${i}">${escapeHtml(opt.text)}</button>
      `).join("");
      grid.querySelectorAll("[data-i]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (answered) return;
          const i = Number(btn.dataset.i);
          const opt = node.options[i];
          if (opt.correct) {
            answered = true;
            btn.classList.add("correct");
            feedback.innerHTML = `<strong style="color:var(--lime)">Cleared.</strong> ${escapeHtml(node.why || "")}`;
            setTimeout(() => this.nodeCleared(node), 900);
          } else {
            btn.classList.add("wrong");
            btn.disabled = true;
            this.trackWrong(node);
            feedback.innerHTML = `<strong style="color:var(--coral)">Nope.</strong> ${escapeHtml(node.why || "")}`;
          }
        });
      });
      document.getElementById("mcqClose").addEventListener("click", () => this.closeNode(node));
    }

    renderSwipe(node) {
      let i = 0;
      let correct = 0;
      const total = node.cards.length;
      setOverlay(`
        <div class="puzzle-head">
          <h2>${escapeHtml(node.title)}</h2>
          <p>${escapeHtml(node.prompt)}</p>
        </div>
        <div class="swipe-stack" id="swipeStack"></div>
        <div class="swipe-buttons">
          <button class="secondary" id="swipeLeft">← ${escapeHtml(node.buckets[0].label)}</button>
          <button class="secondary" id="swipeRight">${escapeHtml(node.buckets[1].label)} →</button>
        </div>
        <p class="puzzle-note" id="swipeFeedback" style="margin-top:12px">Card 1 of ${total}.</p>
        <div class="button-row"><button class="secondary" id="swipeClose">⏸ Skip for now</button></div>
      `);
      document.getElementById("swipeClose").addEventListener("click", () => this.closeNode(node));
      const stack = document.getElementById("swipeStack");
      const feedback = document.getElementById("swipeFeedback");
      const renderCard = () => {
        if (i >= total) {
          if (correct >= Math.ceil(total * 0.8)) {
            feedback.innerHTML = `<strong style="color:var(--lime)">Cleared.</strong> ${correct}/${total}.`;
            setTimeout(() => this.nodeCleared(node), 700);
          } else {
            feedback.innerHTML = `<strong style="color:var(--coral)">Try again.</strong> ${correct}/${total}.`;
            this.trackWrong(node);
            i = 0; correct = 0;
            setTimeout(() => renderCard(), 900);
          }
          return;
        }
        const card = node.cards[i];
        stack.innerHTML = `<div class="swipe-card" id="swipeCard">${escapeHtml(card.text)}</div>`;
        feedback.textContent = `Card ${i + 1} of ${total} — ${correct} cleared`;
      };
      renderCard();
      const swipe = (bucketId) => {
        if (i >= total) return;
        const card = node.cards[i];
        if (card.bucket === bucketId) correct += 1;
        i += 1;
        renderCard();
      };
      document.getElementById("swipeLeft").addEventListener("click", () => swipe(node.buckets[0].id));
      document.getElementById("swipeRight").addEventListener("click", () => swipe(node.buckets[1].id));
    }

    renderDrag(node) {
      // Tap-to-place implementation that works on touch
      const placement = {};
      let selected = null;
      setOverlay(`
        <div class="puzzle-head">
          <h2>${escapeHtml(node.title)}</h2>
          <p>${escapeHtml(node.prompt)}</p>
        </div>
        <div class="chip-board">
          <div class="chip-bank" id="dragBank"></div>
          <div class="sort-zones" id="dragZones" style="grid-template-columns:repeat(${node.buckets.length}, minmax(0, 1fr));"></div>
          <p class="puzzle-note" id="dragFeedback">Tap an item, then tap a zone.</p>
        </div>
        <div class="button-row">
          <button class="primary" id="dragSubmit">Submit</button>
          <button class="secondary" id="dragClose">⏸ Skip for now</button>
        </div>
      `);
      const bank = document.getElementById("dragBank");
      const zones = document.getElementById("dragZones");
      const feedback = document.getElementById("dragFeedback");
      const render = () => {
        bank.innerHTML = node.items.map((item, i) => `
          <button class="chip ${selected === i ? "selected" : ""} ${placement[i] !== undefined ? "used" : ""}" data-i="${i}">
            ${escapeHtml(item.text)}
          </button>
        `).join("");
        zones.innerHTML = node.buckets.map((bucket) => `
          <div class="sort-zone" data-zone="${bucket.id}">
            <h3>${escapeHtml(bucket.label)}</h3>
            ${node.items.map((item, i) => placement[i] === bucket.id
              ? `<button class="chip" data-i="${i}">${escapeHtml(item.text)}</button>` : "").join("")}
          </div>
        `).join("");
        bank.querySelectorAll("[data-i]").forEach((btn) => btn.addEventListener("click", () => {
          const i = Number(btn.dataset.i);
          if (placement[i] !== undefined) { delete placement[i]; render(); return; }
          selected = selected === i ? null : i;
          render();
        }));
        zones.querySelectorAll("[data-zone]").forEach((zone) => zone.addEventListener("click", (e) => {
          const inner = e.target.closest("[data-i]");
          if (inner) {
            const i = Number(inner.dataset.i);
            delete placement[i];
            render();
            return;
          }
          if (selected === null) return;
          placement[selected] = zone.dataset.zone;
          selected = null;
          render();
        }));
      };
      render();
      document.getElementById("dragSubmit").addEventListener("click", () => {
        const allPlaced = node.items.every((_, i) => placement[i] !== undefined);
        const correct = node.items.every((item, i) => placement[i] === item.bucket);
        if (allPlaced && correct) {
          feedback.innerHTML = `<strong style="color:var(--lime)">Cleared.</strong>`;
          setTimeout(() => this.nodeCleared(node), 600);
        } else if (!allPlaced) {
          feedback.textContent = "Place every item first.";
        } else {
          this.trackWrong(node);
          feedback.innerHTML = `<strong style="color:var(--coral)">Some are off.</strong> Re-sort and resubmit.`;
        }
      });
      document.getElementById("dragClose").addEventListener("click", () => this.closeNode(node));
    }

    renderSpot(node) {
      const found = new Set();
      let t = 0;
      let playing = true;
      let raf = 0;
      let timeLeft = node.duration || 30;
      let timerId = 0;
      setOverlay(`
        <div class="puzzle-head">
          <h2>${escapeHtml(node.title)}</h2>
          <p>${escapeHtml(node.prompt)}</p>
        </div>
        <div class="video-lab">
          <div class="video-stage">
            <canvas class="mini-canvas" id="spotCanvas" width="960" height="540"></canvas>
            ${node.hotspots.map((h, i) => `
              <button class="hotspot" data-i="${i}" style="left:${h.x}%; top:${h.y}%; width:${h.w}%; height:${h.h}%;"
                aria-label="${escapeHtml(h.label)}"></button>`).join("")}
          </div>
          <div class="video-controls">
            <div class="timer-bar"><span id="spotTimer"></span></div>
            <button class="secondary" id="spotPlay">Pause</button>
            <label class="range-row">Scrub <input id="spotScrub" type="range" min="0" max="100" value="0"></label>
            <p class="puzzle-note" id="spotFeedback">Find ${node.required} tells. Multiple clues > one weird frame.</p>
          </div>
        </div>
        <div class="button-row">
          <button class="secondary" id="spotClose">⏸ Skip for now</button>
        </div>
      `);
      const labCanvas = document.getElementById("spotCanvas");
      const labCtx = labCanvas.getContext("2d");
      const scrub = document.getElementById("spotScrub");
      const feedback = document.getElementById("spotFeedback");
      const timerBar = document.getElementById("spotTimer");
      const drawLab = () => {
        t = playing ? (t + 0.012) % 1 : Number(scrub.value) / 100;
        scrub.value = String(Math.round(t * 100));
        if (node.variant === "image") drawSyntheticPhoto(labCtx, t);
        else drawForensicsFrame(labCtx, t);
        raf = requestAnimationFrame(drawLab);
      };
      drawLab();
      timerId = setInterval(() => {
        timeLeft -= 0.1;
        timerBar.style.width = `${Math.max(0, (timeLeft / (node.duration || 30)) * 100)}%`;
        if (timeLeft <= 0) {
          clearInterval(timerId);
          if (this.cleanup) this.cleanup();
          this.cleanup = null;
          this.trackWrong(node);
          feedback.innerHTML = `<strong style="color:var(--coral)">Out of time.</strong> Walk back to retry.`;
          setTimeout(() => this.closeNode(node), 1200);
        }
      }, 100);
      this.cleanup = () => { cancelAnimationFrame(raf); clearInterval(timerId); };
      document.getElementById("spotPlay").addEventListener("click", (e) => {
        playing = !playing;
        e.currentTarget.textContent = playing ? "Pause" : "Play";
      });
      scrub.addEventListener("input", () => { playing = false; document.getElementById("spotPlay").textContent = "Play"; });
      overlayContent.querySelectorAll(".hotspot").forEach((btn) => btn.addEventListener("click", () => {
        const i = Number(btn.dataset.i);
        if (found.has(i)) return;
        found.add(i);
        btn.classList.add("found");
        feedback.textContent = `Tell: ${node.hotspots[i].label} (${found.size}/${node.required}).`;
        if (found.size >= node.required) {
          if (this.cleanup) this.cleanup();
          this.cleanup = null;
          feedback.innerHTML = `<strong style="color:var(--lime)">Forensics cleared.</strong>`;
          setTimeout(() => this.nodeCleared(node), 700);
        }
      }));
      document.getElementById("spotClose").addEventListener("click", () => this.closeNode(node));
    }

    renderAudio(node) {
      const marks = {};
      node.clips.forEach((c) => marks[c.id] = false);
      setOverlay(`
        <div class="puzzle-head">
          <h2>${escapeHtml(node.title)}</h2>
          <p>${escapeHtml(node.prompt)}</p>
        </div>
        <div class="clip-grid" id="audioGrid"></div>
        <p class="puzzle-note" id="audioFeedback" style="margin-top:12px">Listen for flat cadence, clipped breaths, robotic emphasis.</p>
        <div class="button-row">
          <button class="primary" id="audioSubmit">Submit tags</button>
          <button class="secondary" id="audioClose">⏸ Skip for now</button>
        </div>
      `);
      const grid = document.getElementById("audioGrid");
      const feedback = document.getElementById("audioFeedback");
      const palettes = ["linear-gradient(90deg,#ff5070,#ffc94a)", "linear-gradient(90deg,#5cffb6,#22e3ff)", "linear-gradient(90deg,#a98bff,#ff4dd2)"];
      const glows = ["rgba(255,80,112,0.5)", "rgba(34,227,255,0.5)", "rgba(169,139,255,0.5)"];
      grid.innerHTML = node.clips.map((c, i) => `
        <div class="audio-card" data-clip="${c.id}">
          <strong>${escapeHtml(c.label)}</strong>
          <div class="wave" style="--wave:${palettes[i % palettes.length]};--wave-glow:${glows[i % glows.length]}"></div>
          <div class="button-row" style="margin-top:8px">
            <button class="secondary play-clip" data-play="${c.id}">▶ Play</button>
            <button class="secondary mark-clip" data-mark="${c.id}">⚑ Mark fake</button>
          </div>
        </div>
      `).join("");
      this.cleanup = () => { try { speechSynthesis.cancel(); } catch (_) {} };
      grid.querySelectorAll("[data-play]").forEach((btn) => btn.addEventListener("click", () => {
        const id = btn.dataset.play;
        const clip = node.clips.find((c) => c.id === id);
        this.speakClip(clip.phrase, clip.voice);
      }));
      grid.querySelectorAll("[data-mark]").forEach((btn) => btn.addEventListener("click", () => {
        const id = btn.dataset.mark;
        marks[id] = !marks[id];
        btn.textContent = marks[id] ? "✓ Tagged fake" : "⚑ Mark fake";
        btn.classList.toggle("selected", marks[id]);
      }));
      document.getElementById("audioSubmit").addEventListener("click", () => {
        const correct = node.clips.every((c) => marks[c.id] === c.fake);
        if (correct) {
          if (this.cleanup) this.cleanup();
          this.cleanup = null;
          feedback.innerHTML = `<strong style="color:var(--lime)">Tags correct.</strong>`;
          setTimeout(() => this.nodeCleared(node), 700);
        } else {
          this.trackWrong(node);
          feedback.innerHTML = `<strong style="color:var(--coral)">Tag mismatch.</strong> Listen again — control clips shouldn't be tagged.`;
        }
      });
      document.getElementById("audioClose").addEventListener("click", () => this.closeNode(node));
    }

    speakClip(phrase, voice) {
      try { speechSynthesis.cancel(); } catch (_) {}
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(phrase);
        u.rate = voice?.rate ?? 1;
        u.pitch = voice?.pitch ?? 1;
        u.volume = 0.85;
        speechSynthesis.speak(u);
      }
      if (!this.audioContext) this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const ac = this.audioContext;
      ac.resume();
      const start = ac.currentTime + 0.02;
      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.connect(ac.destination);
      const pattern = (voice?.pitch ?? 1) > 1
        ? [220, 246, 261, 293, 330, 293, 246]
        : [180, 420, 180, 420, 180, 420, 600];
      pattern.forEach((freq, idx) => {
        const osc = ac.createOscillator();
        const ng = ac.createGain();
        osc.type = (voice?.pitch ?? 1) > 1 ? "sine" : "square";
        osc.frequency.setValueAtTime(freq, start + idx * 0.13);
        ng.gain.setValueAtTime(0.025, start + idx * 0.13);
        ng.gain.exponentialRampToValueAtTime(0.0001, start + idx * 0.13 + 0.1);
        osc.connect(ng);
        ng.connect(gain);
        osc.start(start + idx * 0.13);
        osc.stop(start + idx * 0.13 + 0.11);
      });
    }

    renderReflex(node) {
      let r = 0;
      let correct = 0;
      const total = node.rounds.length;
      let timeLeft = node.duration || 30;
      let timerId = 0;
      setOverlay(`
        <div class="puzzle-head">
          <h2>${escapeHtml(node.title)}</h2>
          <p>${escapeHtml(node.prompt)}</p>
        </div>
        <div class="timer-bar"><span id="reflexTimer"></span></div>
        <div id="reflexBody" style="margin-top:14px"></div>
        <p class="puzzle-note" id="reflexFeedback" style="margin-top:12px">Round 1 of ${total}.</p>
        <div class="button-row">
          <button class="secondary" id="reflexClose">⏸ Skip for now</button>
        </div>
      `);
      const body = document.getElementById("reflexBody");
      const feedback = document.getElementById("reflexFeedback");
      const timerBar = document.getElementById("reflexTimer");
      const renderRound = () => {
        if (r >= total) {
          clearInterval(timerId);
          if (correct >= Math.ceil(total * 0.75)) {
            feedback.innerHTML = `<strong style="color:var(--lime)">Cleared.</strong> ${correct}/${total}.`;
            setTimeout(() => this.nodeCleared(node), 700);
          } else {
            this.trackWrong(node);
            feedback.innerHTML = `<strong style="color:var(--coral)">Score too low.</strong> ${correct}/${total}. Try again.`;
            r = 0; correct = 0;
            timeLeft = node.duration || 30;
            setTimeout(() => renderRound(), 900);
          }
          return;
        }
        const round = node.rounds[r];
        body.innerHTML = `
          <div class="post">
            <div class="post-meta"><span class="post-handle">@dm_box</span><span class="post-tag">REFLEX</span></div>
            <div class="post-body">${escapeHtml(round.scenario)}</div>
          </div>
          <div class="action-row" id="reflexOptions">
            ${round.options.map((opt, i) => `<button class="secondary" data-i="${i}">${escapeHtml(opt)}</button>`).join("")}
          </div>
        `;
        feedback.textContent = `Round ${r + 1} of ${total} — score ${correct}`;
        body.querySelectorAll("[data-i]").forEach((btn) => btn.addEventListener("click", () => {
          const i = Number(btn.dataset.i);
          if (i === round.correct) { correct += 1; btn.classList.add("correct"); }
          else { btn.classList.add("wrong"); }
          r += 1;
          setTimeout(renderRound, 350);
        }));
      };
      renderRound();
      timerId = setInterval(() => {
        timeLeft -= 0.1;
        timerBar.style.width = `${Math.max(0, (timeLeft / (node.duration || 30)) * 100)}%`;
        if (timeLeft <= 0) {
          clearInterval(timerId);
          this.trackWrong(node);
          feedback.innerHTML = `<strong style="color:var(--coral)">Out of time.</strong>`;
          setTimeout(() => this.closeNode(node), 800);
        }
      }, 100);
      this.cleanup = () => clearInterval(timerId);
      document.getElementById("reflexClose").addEventListener("click", () => this.closeNode(node));
    }

    // ========================================================
    // END-OF-LEVEL PUZZLE STATIONS (the world bosses)
    // ========================================================
    renderPromptForge() {
      const slots = [
        { id: "goal", title: "Goal" },
        { id: "context", title: "Context" },
        { id: "constraints", title: "Boundary" },
        { id: "format", title: "Output Format" },
        { id: "verify", title: "Verify Step" }
      ];
      const chips = [
        { id: "c1", type: "goal", text: "Plan a 90s explainer on AI wellbeing for 16-21yo." },
        { id: "c2", type: "context", text: "Audience scrolls TikTok, plays games, lives in group chats." },
        { id: "c3", type: "constraints", text: "Respectful, no diagnoses, privacy-safe, no guilt-trips." },
        { id: "c4", type: "format", text: "Hook + 3 scenes + caption + 1 verifiable stat." },
        { id: "c5", type: "verify", text: "List assumptions and what I should fact-check before posting." },
        { id: "d1", type: "decoy", text: "Make it sound true even if facts are missing." },
        { id: "d2", type: "decoy", text: "Use my class WhatsApp group's actual phone numbers." },
        { id: "d3", type: "decoy", text: "Skip limitations, only the perfect answer." }
      ];
      const placed = {};
      let selected = null;
      setOverlay(`
        <div class="puzzle-head">
          <h2>Prompt Forge</h2>
          <p>Tap a block, then tap a slot. Build a prompt that's actually shippable.</p>
        </div>
        <div class="chip-board">
          <div class="chip-bank" id="chipBank"></div>
          <div class="slot-board" id="slotBoard"></div>
          <p class="puzzle-note" id="forgeFeedback">Decoys are usually the fastest-sounding, least-safe blocks.</p>
        </div>
        <div class="button-row">
          <button class="primary" id="forgeSubmit">Forge</button>
          <button class="secondary" id="forgeHint">Hint</button>
          <button class="secondary" id="forgeClose">⏸ Leave boss for now</button>
        </div>
      `);
      const render = () => {
        document.getElementById("chipBank").innerHTML = chips.map((chip) => `
          <button class="chip ${selected === chip.id ? "selected" : ""} ${Object.values(placed).includes(chip.id) ? "used" : ""}" data-chip="${chip.id}">
            ${escapeHtml(chip.text)}
          </button>`).join("");
        document.getElementById("slotBoard").innerHTML = slots.map((slot) => {
          const chip = chips.find((c) => c.id === placed[slot.id]);
          return `<button class="slot ${chip ? "filled" : ""}" data-slot="${slot.id}">
            <strong>${escapeHtml(slot.title)}</strong>
            <span>${chip ? escapeHtml(chip.text) : "Tap to place"}</span>
          </button>`;
        }).join("");
        overlayContent.querySelectorAll("[data-chip]").forEach((btn) => btn.addEventListener("click", () => {
          const id = btn.dataset.chip;
          if (Object.values(placed).includes(id)) return;
          selected = selected === id ? null : id;
          render();
        }));
        overlayContent.querySelectorAll("[data-slot]").forEach((btn) => btn.addEventListener("click", () => {
          const slot = btn.dataset.slot;
          if (!selected) { delete placed[slot]; render(); return; }
          for (const k of Object.keys(placed)) if (placed[k] === selected) delete placed[k];
          placed[slot] = selected;
          selected = null;
          render();
        }));
      };
      render();
      document.getElementById("forgeSubmit").addEventListener("click", () => {
        const ok = slots.every((s) => { const c = chips.find((x) => x.id === placed[s.id]); return c && c.type === s.id; });
        if (ok) this.solvePuzzle("Prompt forged. Portal trusts your input.");
        else { this.trackWrong(); document.getElementById("forgeFeedback").textContent = "Some blocks are off — decoys remove safety or verification."; }
      });
      document.getElementById("forgeHint").addEventListener("click", () => {
        this.hints += 1;
        document.getElementById("forgeFeedback").textContent = "Aim: goal → context → boundary → format → verify.";
      });
      document.getElementById("forgeClose").addEventListener("click", () => { clearOverlay(); this.paused = false; });
    }

    renderSourceBridge() {
      const zones = [
        { id: "use", title: "Use after sanity check" },
        { id: "caution", title: "Use with caution" },
        { id: "reject", title: "Do not use" }
      ];
      const sources = [
        { id: "s1", zone: "use", title: "Reuters article", detail: "Named reporter, recent date, links to court filings." },
        { id: "s2", zone: "use", title: "WHO factsheet", detail: "Official, dated, with citation list." },
        { id: "s3", zone: "caution", title: "AI summary with citations", detail: "Helpful starting point, but links unchecked." },
        { id: "s4", zone: "caution", title: "Sponsored creator demo", detail: "Useful angle, missing primary sources." },
        { id: "s5", zone: "reject", title: "Anonymous Telegram screenshot", detail: "No origin, no author, no date." },
        { id: "s6", zone: "reject", title: "'99% don't know this' meme", detail: "Big claim, no source, emotional bait." }
      ];
      const order = ["bank", "use", "caution", "reject"];
      const assignments = Object.fromEntries(sources.map((s) => [s.id, "bank"]));
      setOverlay(`
        <div class="puzzle-head">
          <h2>Source Bridge</h2>
          <p>Tap each card to cycle it across the bridge. Match claim strength to source strength.</p>
        </div>
        <div class="sort-board">
          <div class="source-bank" id="sourceBank"></div>
          <div class="sort-zones" id="sortZones"></div>
          <p class="puzzle-note" id="sourceFeedback">Open sources, compare evidence, slow the share.</p>
        </div>
        <div class="button-row">
          <button class="primary" id="sourceSubmit">Repair Bridge</button>
          <button class="secondary" id="sourceHint">Hint</button>
          <button class="secondary" id="sourceClose">⏸ Leave boss for now</button>
        </div>
      `);
      const cardHtml = (s) => `<button class="source-card" data-source="${s.id}">${escapeHtml(s.title)}<small>${escapeHtml(s.detail)}</small></button>`;
      const render = () => {
        document.getElementById("sourceBank").innerHTML = sources.filter((s) => assignments[s.id] === "bank").map(cardHtml).join("");
        document.getElementById("sortZones").innerHTML = zones.map((z) => `
          <div class="sort-zone" data-zone="${z.id}"><h3>${escapeHtml(z.title)}</h3>${sources.filter((s) => assignments[s.id] === z.id).map(cardHtml).join("")}</div>
        `).join("");
        overlayContent.querySelectorAll("[data-source]").forEach((btn) => btn.addEventListener("click", () => {
          const id = btn.dataset.source;
          assignments[id] = order[(order.indexOf(assignments[id]) + 1) % order.length];
          render();
        }));
      };
      render();
      document.getElementById("sourceSubmit").addEventListener("click", () => {
        const ok = sources.every((s) => assignments[s.id] === s.zone);
        if (ok) this.solvePuzzle("Bridge repaired. Your claims have receipts.");
        else { this.trackWrong(); document.getElementById("sourceFeedback").textContent = "Re-sort: official + author = use; AI/sponsored = caution; anon screenshots = reject."; }
      });
      document.getElementById("sourceHint").addEventListener("click", () => {
        this.hints += 1;
        document.getElementById("sourceFeedback").textContent = "Use: clear author/date/evidence. Caution: useful but unverified. Reject: untraceable or rage bait.";
      });
      document.getElementById("sourceClose").addEventListener("click", () => { clearOverlay(); this.paused = false; });
    }

    renderDeepfakeLab() {
      const found = new Set();
      const audioMarks = { clipA: false, clipB: false, clipC: false };
      let t = 0;
      let playing = true;
      let raf = 0;
      setOverlay(`
        <div class="puzzle-head">
          <h2>Forensics Lab</h2>
          <p>Inspect the synthetic clip, scrub frames, listen to voice notes. Need 3 video tells AND correct audio tags.</p>
        </div>
        <div class="video-lab">
          <div class="video-stage">
            <canvas id="forensicsCanvas" class="mini-canvas" width="960" height="540"></canvas>
            <button class="hotspot" data-hotspot="mouth" style="left:42%; top:44%;" aria-label="Mouth"></button>
            <button class="hotspot" data-hotspot="edge" style="left:30%; top:22%;" aria-label="Edge"></button>
            <button class="hotspot" data-hotspot="shadow" style="left:58%; top:68%;" aria-label="Shadow"></button>
            <button class="hotspot" data-hotspot="background" style="left:70%; top:18%;" aria-label="Background"></button>
          </div>
          <div class="video-controls">
            <button class="secondary" id="videoPlay">Pause</button>
            <label class="range-row">Scrub <input id="videoScrub" type="range" min="0" max="100" value="0"></label>
            <p class="puzzle-note" id="videoFeedback">0/3 video tells. Stack clues — one frame isn't proof.</p>
          </div>
        </div>
        <div class="clip-board" style="margin-top:14px">
          <div class="clip-grid">
            ${["A", "B", "C"].map((id) => `
              <div class="audio-card" data-clip="clip${id}">
                <strong>VM ${id}</strong>
                <small>${id === "A" ? "'urgent — send class code'" : id === "B" ? "'remind: charger tomorrow'" : "'celebrity asks for donation'"}</small>
                <div class="wave" style="--wave:${id === "B" ? "linear-gradient(90deg,#5cffb6,#22e3ff)" : "linear-gradient(90deg,#ff4dd2,#ff5070)"}"></div>
                <div class="button-row" style="margin-top:8px">
                  <button class="secondary play-clip" data-play="clip${id}">▶ Play</button>
                  <button class="secondary mark-clip" data-mark="clip${id}">⚑ Mark fake</button>
                </div>
              </div>`).join("")}
          </div>
          <p class="puzzle-note" id="audioFeedback">Tag the synthetic ones. The control clip should NOT be tagged.</p>
        </div>
        <div class="button-row">
          <button class="primary" id="deepfakeSubmit">Submit findings</button>
          <button class="secondary" id="deepfakeHint">Hint</button>
          <button class="secondary" id="deepfakeClose">⏸ Leave boss for now</button>
        </div>
      `);
      const labCanvas = document.getElementById("forensicsCanvas");
      const labCtx = labCanvas.getContext("2d");
      const scrub = document.getElementById("videoScrub");
      const feedback = document.getElementById("videoFeedback");
      const drawLab = () => {
        t = playing ? (t + 0.012) % 1 : Number(scrub.value) / 100;
        scrub.value = String(Math.round(t * 100));
        drawForensicsFrame(labCtx, t);
        raf = requestAnimationFrame(drawLab);
      };
      drawLab();
      this.cleanup = () => { cancelAnimationFrame(raf); try { speechSynthesis.cancel(); } catch (_) {} };
      document.getElementById("videoPlay").addEventListener("click", (e) => {
        playing = !playing;
        e.currentTarget.textContent = playing ? "Pause" : "Play";
      });
      scrub.addEventListener("input", () => { playing = false; document.getElementById("videoPlay").textContent = "Play"; t = Number(scrub.value) / 100; drawForensicsFrame(labCtx, t); });
      overlayContent.querySelectorAll("[data-hotspot]").forEach((btn) => btn.addEventListener("click", () => {
        found.add(btn.dataset.hotspot);
        btn.classList.add("found");
        feedback.textContent = `Tells found: ${Math.min(3, found.size)}/3 — ${deepfakeVideoMessage(btn.dataset.hotspot)}`;
      }));
      overlayContent.querySelectorAll("[data-play]").forEach((btn) => btn.addEventListener("click", () => {
        const id = btn.dataset.play;
        const phrase = id === "clipA" ? "Urgent. Send the class login code right now or my account stays locked."
          : id === "clipB" ? "Hey, just reminding you — bring your charger tomorrow, mine died."
          : "Hello fans. This is me. Please donate before this link closes forever.";
        this.speakClip(phrase, id === "clipB" ? { rate: 1.02, pitch: 1.05 } : { rate: 0.92, pitch: 0.7 });
      }));
      overlayContent.querySelectorAll("[data-mark]").forEach((btn) => btn.addEventListener("click", () => {
        const id = btn.dataset.mark;
        audioMarks[id] = !audioMarks[id];
        btn.textContent = audioMarks[id] ? "✓ Tagged fake" : "⚑ Mark fake";
        btn.classList.toggle("selected", audioMarks[id]);
      }));
      document.getElementById("deepfakeSubmit").addEventListener("click", () => {
        const audioOk = audioMarks.clipA && !audioMarks.clipB && audioMarks.clipC;
        if (found.size >= 3 && audioOk) this.solvePuzzle("Forensics cleared. Multi-clue evidence > one weird frame.");
        else { this.trackWrong(); document.getElementById("audioFeedback").textContent = `Need 3 video tells AND correct audio. A & C are fake; B is the control. Found ${found.size}/3.`; }
      });
      document.getElementById("deepfakeHint").addEventListener("click", () => {
        this.hints += 1;
        feedback.textContent = "Mouth, face edge, shadow direction, background warp. Then tag clipA + clipC, leave B.";
      });
      document.getElementById("deepfakeClose").addEventListener("click", () => {
        if (this.cleanup) this.cleanup();
        this.cleanup = null;
        clearOverlay();
        this.paused = false;
      });
    }

    renderPrivacyVault() {
      const tokens = [
        ["I", false], ["am", false], ["Aisyah Tan", true], ["from", false], ["Riverside Sec", true],
        ["class 4B.", true], ["My", false], ["phone", true], ["is", false], ["9123-8844,", true],
        ["home", true], ["is", false], ["18 Palm Cres,", true], ["my login", true], ["is", false],
        ["aisyah@school.sg", true], ["pw", true], ["PandaSun77.", true],
        ["I've been", true], ["anxious", true], ["since", false], ["my clinic visit.", true],
        ["Can AI", false], ["draft", false], ["a study plan?", false]
      ];
      const selected = new Set();
      setOverlay(`
        <div class="puzzle-head">
          <h2>Privacy Vault</h2>
          <p>Strike out anything that should NOT go into the AI tool. Keep the actual task context.</p>
        </div>
        <div class="redact-board"><div class="token-row" id="tokenRow"></div></div>
        <p class="puzzle-note" id="privacyFeedback">Identity, contact, location, login, health = strip.</p>
        <div class="button-row">
          <button class="primary" id="privacySubmit">Lock vault</button>
          <button class="secondary" id="privacyHint">Hint</button>
          <button class="secondary" id="privacyClose">⏸ Leave boss for now</button>
        </div>
      `);
      const render = () => {
        document.getElementById("tokenRow").innerHTML = tokens.map((tk, i) => `
          <button class="token ${selected.has(i) ? "selected" : ""}" data-token="${i}">${escapeHtml(tk[0])}</button>
        `).join("");
        overlayContent.querySelectorAll("[data-token]").forEach((btn) => btn.addEventListener("click", () => {
          const i = Number(btn.dataset.token);
          if (selected.has(i)) selected.delete(i); else selected.add(i);
          render();
        }));
      };
      render();
      document.getElementById("privacySubmit").addEventListener("click", () => {
        const missed = tokens.some((tk, i) => tk[1] && !selected.has(i));
        const fp = tokens.filter((tk, i) => !tk[1] && selected.has(i)).length;
        if (!missed && fp <= 2) this.solvePuzzle("Vault locked. Task kept, identity stripped.");
        else { this.trackWrong(); document.getElementById("privacyFeedback").textContent = "Still leaking, or stripped too much task. Keep purpose, redact identity."; }
      });
      document.getElementById("privacyHint").addEventListener("click", () => {
        this.hints += 1;
        document.getElementById("privacyFeedback").textContent = "Names, school, class, phone, address, login, password, health = strip.";
      });
      document.getElementById("privacyClose").addEventListener("click", () => { clearOverlay(); this.paused = false; });
    }

    renderWellbeingFlow() {
      const habits = [
        { id: "h1", good: true, text: "25-min focus timer before asking AI for more ideas." },
        { id: "h2", good: true, text: "Ask AI for 3 coping options, do ONE offline." },
        { id: "h3", good: true, text: "Mute notifications during sleep hours." },
        { id: "h4", good: true, text: "Tell a real person when content wrecks you." },
        { id: "h5", good: false, text: "Refresh until AI gives an answer that 'feels right'." },
        { id: "h6", good: false, text: "Compare your raw life to AI-edited feeds." },
        { id: "h7", good: false, text: "Use a chatbot as your only support in crisis." },
        { id: "h8", good: true, text: "Use AI to plan study with breaks + shutdown time." }
      ];
      const chosen = new Set();
      let hits = 0;
      let misses = 0;
      let raf = 0;
      let started = performance.now();
      setOverlay(`
        <div class="puzzle-head">
          <h2>Calm Circuit</h2>
          <p>Pick the keep-habits. Then tap the breath orb when it's at its calm middle. Get 5 calm taps.</p>
        </div>
        <div class="wellbeing-board">
          <div class="habit-grid" id="habitGrid"></div>
          <div class="breath-stage">
            <button class="breath-orb" id="breathOrb" aria-label="Breath orb"></button>
            <div>
              <div class="meter"><span id="breathMeter"></span></div>
              <p class="puzzle-note" id="wellbeingFeedback">Tap when the orb is steady. Hits: 0/5.</p>
            </div>
          </div>
        </div>
        <div class="button-row">
          <button class="primary" id="wellbeingSubmit">Open gate</button>
          <button class="secondary" id="wellbeingHint">Hint</button>
          <button class="secondary" id="wellbeingClose">⏸ Leave boss for now</button>
        </div>
      `);
      const renderHabits = () => {
        document.getElementById("habitGrid").innerHTML = habits.map((h) => `
          <button class="habit-card ${chosen.has(h.id) ? "selected" : ""}" data-habit="${h.id}">${escapeHtml(h.text)}</button>
        `).join("");
        overlayContent.querySelectorAll("[data-habit]").forEach((btn) => btn.addEventListener("click", () => {
          const id = btn.dataset.habit;
          if (chosen.has(id)) chosen.delete(id); else chosen.add(id);
          renderHabits();
        }));
      };
      renderHabits();
      const orb = document.getElementById("breathOrb");
      const meter = document.getElementById("breathMeter");
      const feedback = document.getElementById("wellbeingFeedback");
      const tick = () => {
        const phase = ((performance.now() - started) % 4200) / 4200;
        const scale = 0.72 + Math.sin(phase * Math.PI) * 0.28;
        orb.style.setProperty("--orb-scale", String(scale));
        meter.style.setProperty("--meter", `${(hits / 5) * 100}%`);
        raf = requestAnimationFrame(tick);
      };
      tick();
      this.cleanup = () => cancelAnimationFrame(raf);
      orb.addEventListener("click", () => {
        const phase = ((performance.now() - started) % 4200) / 4200;
        if (phase > 0.38 && phase < 0.68) { hits = Math.min(5, hits + 1); feedback.textContent = `Calm tap. Hits: ${hits}/5.`; }
        else { misses += 1; feedback.textContent = `Off-beat. Misses: ${misses}.`; }
        meter.style.setProperty("--meter", `${(hits / 5) * 100}%`);
      });
      document.getElementById("wellbeingSubmit").addEventListener("click", () => {
        const habitsCorrect = habits.every((h) => h.good === chosen.has(h.id));
        if (hits >= 5 && habitsCorrect) this.solvePuzzle("Gate open. AI helps. People help more.");
        else { this.trackWrong(); feedback.textContent = "Need 5 calm taps + only keep-habits selected."; }
      });
      document.getElementById("wellbeingHint").addEventListener("click", () => {
        this.hints += 1;
        feedback.textContent = "Keep: limits, sleep, real people, breaks. Drop: spiral-refresh, AI-only crisis, comparison.";
      });
      document.getElementById("wellbeingClose").addEventListener("click", () => {
        if (this.cleanup) this.cleanup();
        this.cleanup = null;
        clearOverlay();
        this.paused = false;
      });
    }

    renderFinalBoss() {
      const claims = [
        { id: "c1", text: "Our AI study tool is safe for every student.", source: "test" },
        { id: "c2", text: "This clip of a politician is from a real press conference.", source: "origin" },
        { id: "c3", text: "Our content matches school policy.", source: "policy" }
      ];
      const sources = [
        { id: "policy", text: "School policy + teacher review" },
        { id: "origin", text: "Original upload + trusted news confirmation" },
        { id: "test", text: "User testing across age, ability, language + harm check" }
      ];
      const assigned = {};
      let selectedSource = null;
      const shieldChosen = new Set();
      setOverlay(`
        <div class="puzzle-head">
          <h2>Trust Boss</h2>
          <p>Balance perspectives. Link claims to evidence. Activate responsible-release shields.</p>
        </div>
        <div class="boss-board">
          <div>
            <h3 style="color:var(--cyan);letter-spacing:.18em;text-transform:uppercase;font-size:.78rem;margin:0 0 8px">Perspective Balance</h3>
            <div class="slider-row"><label for="teenSlider">Students</label><input id="teenSlider" type="range" min="0" max="100" value="55"><strong id="teenValue">55</strong></div>
            <div class="slider-row"><label for="parentSlider">Caregivers</label><input id="parentSlider" type="range" min="0" max="100" value="25"><strong id="parentValue">25</strong></div>
            <div class="slider-row"><label for="teacherSlider">Educators</label><input id="teacherSlider" type="range" min="0" max="100" value="20"><strong id="teacherValue">20</strong></div>
            <p class="puzzle-note" id="balanceFeedback">Total ≈ 100, each group between 25 and 40.</p>
          </div>
          <div>
            <h3 style="color:var(--cyan);letter-spacing:.18em;text-transform:uppercase;font-size:.78rem;margin:0 0 8px">Evidence links</h3>
            <div class="source-bank" id="bossSources"></div>
            <div class="claim-board" id="bossClaims" style="margin-top:10px"></div>
          </div>
          <div>
            <h3 style="color:var(--cyan);letter-spacing:.18em;text-transform:uppercase;font-size:.78rem;margin:0 0 8px">Release shields</h3>
            <div class="habit-grid" id="shieldGrid">
              <button class="habit-card" data-shield="label" data-good="true">Label AI-generated media clearly.</button>
              <button class="habit-card" data-shield="consent" data-good="true">Get consent for voices and faces.</button>
              <button class="habit-card" data-shield="verify" data-good="true">Verify factual claims before posting.</button>
              <button class="habit-card" data-shield="crisis" data-good="true">Escalate wellbeing concerns to humans.</button>
              <button class="habit-card" data-shield="speed" data-good="false">Post first so nobody else gets the views.</button>
              <button class="habit-card" data-shield="hide" data-good="false">Hide AI use if it looks real enough.</button>
            </div>
          </div>
          <p class="puzzle-note" id="bossFeedback">Boss shield active. Solve all 3 panels to break it.</p>
        </div>
        <div class="button-row">
          <button class="primary" id="bossSubmit">Defeat Boss</button>
          <button class="secondary" id="bossHint">Hint</button>
          <button class="secondary" id="bossClose">⏸ Leave boss for now</button>
        </div>
      `);
      const renderBoss = () => {
        document.getElementById("bossSources").innerHTML = sources.map((s) => `
          <button class="source-chip ${selectedSource === s.id ? "selected" : ""}" data-bs="${s.id}">${escapeHtml(s.text)}</button>
        `).join("");
        document.getElementById("bossClaims").innerHTML = claims.map((c) => {
          const src = sources.find((s) => s.id === assigned[c.id]);
          return `<button class="claim-card" data-claim="${c.id}">${escapeHtml(c.text)}<small>${src ? `Linked: ${escapeHtml(src.text)}` : "Pick evidence first"}</small></button>`;
        }).join("");
        overlayContent.querySelectorAll("[data-bs]").forEach((btn) => btn.addEventListener("click", () => {
          selectedSource = selectedSource === btn.dataset.bs ? null : btn.dataset.bs;
          renderBoss();
        }));
        overlayContent.querySelectorAll("[data-claim]").forEach((btn) => btn.addEventListener("click", () => {
          if (selectedSource) { assigned[btn.dataset.claim] = selectedSource; selectedSource = null; renderBoss(); }
        }));
      };
      renderBoss();
      const updateLabels = () => {
        ["teen", "parent", "teacher"].forEach((id) => {
          document.getElementById(`${id}Value`).textContent = document.getElementById(`${id}Slider`).value;
        });
      };
      overlayContent.querySelectorAll("input[type='range']").forEach((s) => s.addEventListener("input", updateLabels));
      overlayContent.querySelectorAll("[data-shield]").forEach((btn) => btn.addEventListener("click", () => {
        const id = btn.dataset.shield;
        if (shieldChosen.has(id)) shieldChosen.delete(id); else shieldChosen.add(id);
        btn.classList.toggle("selected", shieldChosen.has(id));
      }));
      document.getElementById("bossSubmit").addEventListener("click", () => {
        const vals = ["teen", "parent", "teacher"].map((id) => Number(document.getElementById(`${id}Slider`).value));
        const total = vals.reduce((a, b) => a + b, 0);
        const balanced = Math.abs(total - 100) <= 5 && Math.min(...vals) >= 25 && Math.max(...vals) <= 40;
        const sourcesOk = claims.every((c) => assigned[c.id] === c.source);
        const shieldsOk = Array.from(overlayContent.querySelectorAll("[data-shield]")).every((b) => (b.dataset.good === "true") === shieldChosen.has(b.dataset.shield));
        if (balanced && sourcesOk && shieldsOk) this.solvePuzzle("Boss broken. Your workflow is fast, fair, verified, private, humane.");
        else { this.trackWrong(); document.getElementById("bossFeedback").textContent = "Boss still up: balance 25-40 each, link claims correctly, only choose responsible shields."; }
      });
      document.getElementById("bossHint").addEventListener("click", () => {
        this.hints += 1;
        document.getElementById("bossFeedback").textContent = "Test for who's missing, verify origin, follow policy, label, get consent, protect distress.";
      });
      document.getElementById("bossClose").addEventListener("click", () => { clearOverlay(); this.paused = false; });
    }
  }

  // ============================================================
  // LEVEL BUILDER
  // ============================================================
  function buildLevel(spec, index, nodeDefs) {
    const worldW = spec.worldW;
    const gaps = [
      { x: 820 + index * 22, w: 118 + index * 8 },
      { x: 1660 + index * 35, w: 135 },
      { x: 2580 + index * 18, w: 150 },
      { x: 3740 + index * 24, w: 128 }
    ];
    const platforms = [];
    let cursor = 0;
    for (const gap of gaps) {
      platforms.push({ x: cursor, y: 640, w: gap.x - cursor, h: 90, kind: "ground" });
      cursor = gap.x + gap.w;
    }
    platforms.push({ x: cursor, y: 640, w: worldW - cursor, h: 90, kind: "ground" });

    const floating = [
      [420, 515, 180], [700, 430, 170], [1080, 525, 170], [1300, 430, 190],
      [1850, 530, 200], [2160, 455, 180], [2380, 380, 160], [2920, 520, 190],
      [3220, 445, 170], [3470, 365, 170], [3970, 520, 180], [4300, 445, 170]
    ];
    for (const [x, y, w] of floating) {
      if (x < worldW - 420) platforms.push({ x: x + index * 12, y, w, h: 28, kind: "block" });
    }

    // Spread challenge nodes across the level on or near platforms
    const nodePositions = [
      { x: 540, y: 470 }, { x: 1230, y: 380 }, { x: 2070, y: 470 },
      { x: 2470, y: 322 }, { x: 3360, y: 380 }
    ];
    const nodes = nodeDefs.map((def, i) => {
      const pos = nodePositions[i] || nodePositions[nodePositions.length - 1];
      return {
        ...def,
        x: pos.x + index * 10,
        y: pos.y,
        w: 44, h: 48,
        cleared: false
      };
    });

    const hazards = gaps.map((gap, i) => ({
      x: gap.x + 8, y: 622, w: Math.max(70, gap.w - 16), h: 28,
      message: i % 2 === 0 ? "Doomscroll pit. Reset." : "Data leak pit. Strip identifiers."
    }));
    hazards.push(
      { x: 1450 + index * 20, y: 604, w: 92, h: 36, message: "Clickbait slime. Verify before chasing." },
      { x: 3060 + index * 18, y: 604, w: 120, h: 36, message: "Oversharing spill. Redact first." }
    );

    const bots = [
      { x: 1740 + index * 10, y: 588, w: 54, h: 52, min: 1680 + index * 10, max: 1980 + index * 10, vx: 95 + index * 8, message: "Hallucination bot — ask for sources." },
      { x: 3320 + index * 15, y: 588, w: 54, h: 52, min: 3240 + index * 15, max: 3570 + index * 15, vx: -110 - index * 8, message: "Deepfake drone — stack multiple clues." }
    ];

    return {
      spec, worldW,
      spawn: { x: 80, y: 520 },
      station: { x: Math.floor(worldW * 0.58), y: 558, w: 86, h: 82 },
      exit: { x: worldW - 210, y: 558, w: 74, h: 92 },
      platforms, nodes, hazards, bots,
      puzzleSolved: false,
      bossWrongs: 0,
      prompt: ""
    };
  }

  // ============================================================
  // RENDERING — dark Roblox-style
  // ============================================================
  const STARS = [];
  function ensureStars() {
    if (STARS.length) return;
    for (let i = 0; i < 110; i += 1) {
      STARS.push({ x: Math.random() * LOGICAL_W, y: Math.random() * (LOGICAL_H * 0.65), s: Math.random() * 1.6 + 0.4, twinkle: Math.random() });
    }
  }

  function drawStarfield(cam) {
    ensureStars();
    ctx.save();
    for (const star of STARS) {
      const x = ((star.x - cam * 0.05) % LOGICAL_W + LOGICAL_W) % LOGICAL_W;
      const a = 0.3 + 0.5 * Math.abs(Math.sin(performance.now() / 1200 + star.twinkle * 8));
      ctx.fillStyle = `rgba(220, 240, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(x, star.y, star.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHorizonGrid(spec, cam) {
    ctx.save();
    const horizonY = 520;
    // Glowing horizon line
    const grad = ctx.createLinearGradient(0, horizonY - 1, 0, horizonY + 2);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.5, spec.accent);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, horizonY - 2, LOGICAL_W, 4);
    ctx.shadowColor = spec.accent;
    ctx.shadowBlur = 16;
    ctx.fillRect(0, horizonY - 1, LOGICAL_W, 2);
    ctx.shadowBlur = 0;

    // Receding grid lines
    ctx.strokeStyle = `rgba(${hexToRgb(spec.accent)}, 0.18)`;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 8; i += 1) {
      const y = horizonY + (i * i) * 3.5;
      if (y > LOGICAL_H) continue;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(LOGICAL_W, y);
      ctx.stroke();
    }
    for (let i = -10; i <= 10; i += 1) {
      const offset = ((i * 140 - cam * 0.4) % 2800 + 2800) % 2800 - 1400;
      const x = LOGICAL_W / 2 + offset;
      ctx.beginPath();
      ctx.moveTo(x, horizonY);
      ctx.lineTo(LOGICAL_W / 2 + (x - LOGICAL_W / 2) * 5, LOGICAL_H);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParallaxBuildings(spec, cam) {
    ctx.save();
    // Far layer: dark silhouettes
    ctx.fillStyle = "rgba(8, 10, 24, 0.85)";
    for (let i = 0; i < 14; i += 1) {
      const x = ((i * 230 - cam * 0.2) % 2800 + 2800) % 2800 - 240;
      const h = 90 + (i % 4) * 60;
      ctx.fillRect(x, 520 - h, 130, h);
      // Window grid
      ctx.fillStyle = `rgba(${hexToRgb(spec.accent)}, 0.18)`;
      for (let wy = 520 - h + 10; wy < 510; wy += 14) {
        for (let wx = x + 8; wx < x + 122; wx += 16) {
          if (Math.random() > 0.85) continue; // sparse
          ctx.fillRect(wx, wy, 6, 6);
        }
      }
      ctx.fillStyle = "rgba(8, 10, 24, 0.85)";
    }
    // Near silhouettes
    ctx.fillStyle = "rgba(4, 6, 14, 0.92)";
    for (let i = 0; i < 10; i += 1) {
      const x = ((i * 320 - cam * 0.45) % 3200 + 3200) % 3200 - 200;
      const h = 130 + (i % 3) * 70;
      ctx.fillRect(x, 540 - h, 110, h);
      // accent stripe
      ctx.fillStyle = `rgba(${hexToRgb(spec.accent)}, 0.42)`;
      ctx.fillRect(x + 8, 540 - h + 10, 4, h - 20);
      ctx.fillStyle = "rgba(4, 6, 14, 0.92)";
    }
    ctx.restore();
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  }

  function drawLevelGeometry(level) {
    const accent = level.spec.accent;
    for (const platform of level.platforms) {
      drawBlock(platform, level.spec.ground, accent);
    }
  }

  function drawBlock(p, baseColor, accentColor) {
    const isGround = p.kind === "ground";
    const offset = 8; // 3D offset for top face
    // Front face
    const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    grad.addColorStop(0, isGround ? lighten(baseColor, 0.18) : "#1a1f3a");
    grad.addColorStop(1, isGround ? darken(baseColor, 0.4) : "#0a0e22");
    ctx.fillStyle = grad;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Top face — lighter slab giving 3D feel
    ctx.fillStyle = isGround ? lighten(baseColor, 0.32) : "#2a3158";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + offset, p.y - offset);
    ctx.lineTo(p.x + p.w + offset, p.y - offset);
    ctx.lineTo(p.x + p.w, p.y);
    ctx.closePath();
    ctx.fill();

    // Right face
    ctx.fillStyle = isGround ? darken(baseColor, 0.6) : "#0d1128";
    ctx.beginPath();
    ctx.moveTo(p.x + p.w, p.y);
    ctx.lineTo(p.x + p.w + offset, p.y - offset);
    ctx.lineTo(p.x + p.w + offset, p.y + p.h - offset);
    ctx.lineTo(p.x + p.w, p.y + p.h);
    ctx.closePath();
    ctx.fill();

    // Top neon edge
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.w, p.y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tile lines on front face
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1;
    const tileW = 64;
    for (let x = p.x + tileW; x < p.x + p.w; x += tileW) {
      ctx.beginPath();
      ctx.moveTo(x, p.y);
      ctx.lineTo(x, p.y + p.h);
      ctx.stroke();
    }

    // Subtle grid on top face
    if (isGround) {
      ctx.strokeStyle = `rgba(${hexToRgb(accentColor)}, 0.18)`;
      ctx.lineWidth = 1;
      for (let x = p.x + tileW; x < p.x + p.w; x += tileW) {
        ctx.beginPath();
        ctx.moveTo(x, p.y);
        ctx.lineTo(x + offset, p.y - offset);
        ctx.stroke();
      }
    }
  }

  function lighten(hex, amount) {
    const h = hex.replace("#", "");
    const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    const r = Math.min(255, ((num >> 16) & 255) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 255) + Math.round(255 * amount));
    const b = Math.min(255, (num & 255) + Math.round(255 * amount));
    return `rgb(${r},${g},${b})`;
  }
  function darken(hex, amount) {
    const h = hex.replace("#", "");
    const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    const r = Math.max(0, ((num >> 16) & 255) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 255) - Math.round(255 * amount));
    const b = Math.max(0, (num & 255) - Math.round(255 * amount));
    return `rgb(${r},${g},${b})`;
  }

  function drawNodes(level) {
    const time = performance.now() / 600;
    const colors = { mcq: "#22e3ff", swipe: "#5cffb6", drag: "#ffc94a", spot: "#ff4dd2", audio: "#a98bff", reflex: "#ff5070" };
    for (const node of level.nodes) {
      if (node.cleared) continue;
      const cx = node.x + node.w / 2;
      const cy = node.y + node.h / 2 + Math.sin(time + node.x * 0.01) * 5;
      const color = colors[node.type] || level.spec.accent;
      ctx.save();
      // Outer glow ring
      const pulse = 0.6 + 0.4 * Math.sin(time * 1.6 + node.x);
      ctx.shadowColor = color;
      ctx.shadowBlur = 20 + pulse * 10;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 28 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
      // Inner diamond
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4 + time * 0.4);
      ctx.fillStyle = "rgba(8, 10, 24, 0.85)";
      ctx.fillRect(-16, -16, 32, 32);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -16, 32, 32);
      ctx.shadowBlur = 0;
      // Type glyph
      ctx.rotate(-Math.PI / 4 - time * 0.4);
      ctx.fillStyle = color;
      ctx.font = "900 14px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyphFor(node.type), 0, 1);
      ctx.restore();
    }
  }

  function glyphFor(type) {
    return { mcq: "?", swipe: "↔", drag: "▦", spot: "⊙", audio: "♪", reflex: "⚡" }[type] || "▲";
  }

  function drawStation(level) {
    const s = level.station;
    const accent = level.spec.accent;
    ctx.save();
    // Pedestal
    fillBox(ctx, s.x - 32, s.y + 38, 150, 22, "#1a1f3a", "rgba(0,0,0,0.5)", 2, 4);
    // Tower body
    const grad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
    grad.addColorStop(0, "#23284a");
    grad.addColorStop(1, "#0d1128");
    ctx.fillStyle = grad;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    // Neon outline
    ctx.shadowColor = accent;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.shadowBlur = 0;
    // Screen
    fillBox(ctx, s.x + 12, s.y + 14, s.w - 24, 30, "#04050d", accent, 2, 3);
    ctx.fillStyle = accent;
    ctx.font = "900 14px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(level.puzzleSolved ? "OK" : "AI?", s.x + s.w / 2, s.y + 29);
    // Status light
    ctx.fillStyle = level.puzzleSolved ? "#5cffb6" : "#ff5070";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + s.h - 16, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
  }

  function drawExit(level) {
    const e = level.exit;
    const cleared = level.nodes.filter((n) => n.cleared).length;
    const unlocked = cleared >= level.nodes.length && level.puzzleSolved;
    ctx.save();
    ctx.translate(e.x, e.y);
    // Portal rings
    const time = performance.now() / 1000;
    const ringColor = unlocked ? "#5cffb6" : "#5c6682";
    ctx.shadowColor = ringColor;
    ctx.shadowBlur = unlocked ? 22 : 6;
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(36, 42, 36, 54, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (unlocked) {
      ctx.strokeStyle = "rgba(92, 255, 182, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(36, 42, 36 + Math.sin(time * 3) * 4, 54 + Math.sin(time * 3) * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Inner gradient
    const gradient = ctx.createRadialGradient(36, 42, 6, 36, 42, 54);
    gradient.addColorStop(0, unlocked ? "rgba(255,255,255,0.95)" : "rgba(180,180,200,0.6)");
    gradient.addColorStop(1, unlocked ? "rgba(34,227,255,0.0)" : "rgba(60,70,90,0.0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(36, 42, 28, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = unlocked ? "#04050d" : "#9aa5c2";
    ctx.font = "900 12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(unlocked ? "GO" : "LOCK", 36, 44);
    ctx.restore();
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
  }

  function drawHazards(level) {
    const time = performance.now() / 200;
    for (const hazard of level.hazards) {
      ctx.save();
      // Glitchy void block
      const grad = ctx.createLinearGradient(hazard.x, hazard.y, hazard.x, hazard.y + hazard.h);
      grad.addColorStop(0, "#ff5070");
      grad.addColorStop(1, "#3a0a18");
      ctx.fillStyle = grad;
      ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
      ctx.shadowColor = "#ff5070";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "#ff5070";
      ctx.lineWidth = 2;
      ctx.strokeRect(hazard.x, hazard.y, hazard.w, hazard.h);
      ctx.shadowBlur = 0;
      // Glitch crosshatch
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      for (let x = hazard.x; x < hazard.x + hazard.w; x += 8) {
        const off = ((x * 13 + time * 30) % 16) - 8;
        ctx.beginPath();
        ctx.moveTo(x + off, hazard.y);
        ctx.lineTo(x + off + 8, hazard.y + hazard.h);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawBots(level) {
    for (const bot of level.bots) {
      ctx.save();
      ctx.translate(bot.x, bot.y);
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(2, bot.h - 6, bot.w, 4);
      // Body
      const grad = ctx.createLinearGradient(0, 0, 0, bot.h);
      grad.addColorStop(0, "#3a2058");
      grad.addColorStop(1, "#0e0826");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, bot.w, bot.h);
      ctx.strokeStyle = "#a98bff";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#a98bff";
      ctx.shadowBlur = 8;
      ctx.strokeRect(0, 0, bot.w, bot.h);
      ctx.shadowBlur = 0;
      // Visor
      ctx.fillStyle = "#ff5070";
      ctx.shadowColor = "#ff5070";
      ctx.shadowBlur = 8;
      ctx.fillRect(8, 14, bot.w - 16, 8);
      ctx.shadowBlur = 0;
      // Antennae
      ctx.strokeStyle = "#a98bff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(12, 0); ctx.lineTo(8, -10);
      ctx.moveTo(bot.w - 12, 0); ctx.lineTo(bot.w - 8, -10);
      ctx.stroke();
      ctx.fillStyle = "#ff4dd2";
      ctx.beginPath(); ctx.arc(8, -10, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bot.w - 8, -10, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles(particles) {
    for (const p of particles) {
      const alpha = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPlayer(player, time, accent, avatar) {
    if (!player) return;
    if (player.invuln > 0 && Math.floor(time * 16) % 2 === 0) return;
    const ctx2 = ctx;
    ctx2.save();
    const bob = player.grounded ? Math.sin(time * 11) * Math.min(3, Math.abs(player.vx) / 90) : 0;
    ctx2.translate(player.x + player.w / 2, player.y + bob);
    ctx2.scale(player.facing, 1);
    drawAvatar(ctx2, accent, avatar || DEFAULT_AVATAR, player.h, time);
    ctx2.restore();
  }

  // Draws the avatar centered horizontally at (0,0), with feet at y = bottom.
  // Used by both in-game player and the customizer preview.
  function drawAvatar(c, accent, avatar, bottom, time) {
    const bodyColor = avatarBodyColor(avatar);
    const bodyDark = darken(bodyColor.startsWith("#") ? bodyColor : rgbToHex(bodyColor), 0.4);
    const bodyLight = lighten(bodyColor.startsWith("#") ? bodyColor : rgbToHex(bodyColor), 0.18);

    // Shadow
    c.fillStyle = "rgba(0,0,0,0.4)";
    c.beginPath();
    c.ellipse(0, bottom, 22, 5, 0, 0, Math.PI * 2);
    c.fill();

    // Legs
    drawRobloxBlock(c, -12, bottom - 22, 10, 22, "#1a1c30", "#2a2c4a");
    drawRobloxBlock(c, 2, bottom - 22, 10, 22, "#1a1c30", "#2a2c4a");

    // Torso with body color + neon stripe (level accent)
    drawRobloxBlock(c, -16, bottom - 52, 32, 30, bodyColor, bodyLight);
    c.fillStyle = accent;
    c.shadowColor = accent;
    c.shadowBlur = 8;
    c.fillRect(-14, bottom - 38, 28, 3);
    c.fillRect(-3, bottom - 50, 6, 28);
    c.shadowBlur = 0;

    // Arms (body color)
    drawRobloxBlock(c, -26, bottom - 50, 10, 26, bodyColor, bodyLight);
    drawRobloxBlock(c, 16, bottom - 50, 10, 26, bodyColor, bodyLight);

    // Head (shape varies)
    const headTop = bottom - 78;
    const headW = 26;
    const headH = 22;
    const headBase = "#f3d6a8";   // friendly skin/face base
    const headLight = "#fff0d4";
    drawHeadShape(c, avatar.head, -headW / 2, headTop, headW, headH, headBase, headLight);

    // Face
    drawFace(c, avatar.face, accent, headTop, headW, headH, time || 0);

    // Hat / accessory
    drawHat(c, avatar.hat, headTop, headW, headH, accent, bodyColor, time || 0);
  }

  function drawHeadShape(c, shape, x, y, w, h, base, top) {
    if (shape === "round") {
      // Soft round head — circle with subtle 3D top
      c.fillStyle = base;
      c.beginPath();
      c.arc(x + w / 2, y + h / 2 + 1, w / 2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = top;
      c.beginPath();
      c.arc(x + w / 2, y + h / 2 + 1, w / 2, Math.PI * 1.05, Math.PI * 1.95);
      c.lineTo(x + w / 2, y + h / 2 - 4);
      c.fill();
      c.strokeStyle = "rgba(0,0,0,0.4)";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(x + w / 2, y + h / 2 + 1, w / 2, 0, Math.PI * 2);
      c.stroke();
    } else if (shape === "dome") {
      // Square bottom, rounded top
      c.fillStyle = base;
      c.beginPath();
      if (c.roundRect) c.roundRect(x, y, w, h, [w / 2, w / 2, 4, 4]);
      else c.rect(x, y, w, h);
      c.fill();
      c.fillStyle = top;
      c.fillRect(x, y, w, 3);
      c.strokeStyle = "rgba(0,0,0,0.4)";
      c.lineWidth = 1;
      c.stroke();
    } else {
      // square (default)
      drawRobloxBlock(c, x, y, w, h, base, top);
    }
  }

  function drawFace(c, face, accent, headTop, w, h, time) {
    if (face === "goggles") {
      // Two glowing rings
      c.shadowColor = accent;
      c.shadowBlur = 8;
      c.strokeStyle = accent;
      c.lineWidth = 2;
      c.fillStyle = "#0a0c1a";
      [-7, 7].forEach((cx) => {
        c.beginPath();
        c.arc(cx, headTop + 10, 5, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      });
      c.shadowBlur = 0;
      // Tiny pupil shimmer
      c.fillStyle = accent;
      c.fillRect(-7, headTop + 9, 1, 2);
      c.fillRect(7, headTop + 9, 1, 2);
    } else if (face === "bigeyes") {
      // Cute big eyes with pupils
      c.fillStyle = "#ffffff";
      c.beginPath(); c.arc(-6, headTop + 11, 4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(6, headTop + 11, 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#0a0c1a";
      const blink = Math.sin(time * 1.5) > 0.96 ? 0 : 2.5;
      c.beginPath(); c.arc(-5, headTop + 12, blink, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(7, headTop + 12, blink, 0, Math.PI * 2); c.fill();
      // Tiny smile
      c.strokeStyle = "#a83a3a";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-3, headTop + 17);
      c.quadraticCurveTo(0, headTop + 19, 3, headTop + 17);
      c.stroke();
    } else if (face === "smile") {
      // Two dot eyes + curve smile
      c.fillStyle = "#0a0c1a";
      c.fillRect(-6, headTop + 9, 3, 3);
      c.fillRect(3, headTop + 9, 3, 3);
      c.strokeStyle = "#a83a3a";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-5, headTop + 16);
      c.quadraticCurveTo(0, headTop + 19, 5, headTop + 16);
      c.stroke();
      // Cheeks
      c.fillStyle = "rgba(255, 120, 150, 0.4)";
      c.beginPath(); c.arc(-9, headTop + 15, 2, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(9, headTop + 15, 2, 0, Math.PI * 2); c.fill();
    } else {
      // band (default visor)
      c.fillStyle = accent;
      c.shadowColor = accent;
      c.shadowBlur = 10;
      c.fillRect(-11, headTop + 8, 22, 6);
      c.shadowBlur = 0;
      c.fillStyle = "rgba(255,255,255,0.9)";
      c.fillRect(-2, headTop + 10, 3, 3);
    }
  }

  function drawHat(c, hat, headTop, w, h, accent, bodyColor, time) {
    const cx = 0;
    if (hat === "beanie") {
      c.fillStyle = bodyColor;
      c.beginPath();
      if (c.roundRect) c.roundRect(-w / 2 - 1, headTop - 7, w + 2, 11, [6, 6, 0, 0]);
      else c.rect(-w / 2 - 1, headTop - 7, w + 2, 11);
      c.fill();
      // Pom
      c.fillStyle = "#fff";
      c.beginPath(); c.arc(cx, headTop - 11, 4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "rgba(0,0,0,0.5)";
      c.lineWidth = 1;
      c.stroke();
    } else if (hat === "antenna") {
      c.strokeStyle = "#cfd6ee";
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx, headTop); c.lineTo(cx, headTop - 14); c.stroke();
      c.fillStyle = accent;
      c.shadowColor = accent;
      c.shadowBlur = 10 + Math.sin(time * 4) * 3;
      c.beginPath(); c.arc(cx, headTop - 16, 3.5, 0, Math.PI * 2); c.fill();
      c.shadowBlur = 0;
    } else if (hat === "halo") {
      c.shadowColor = "#ffe98a";
      c.shadowBlur = 14;
      c.strokeStyle = "#ffe98a";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(cx, headTop - 5 + Math.sin(time * 1.6) * 1, 14, 4, 0, 0, Math.PI * 2);
      c.stroke();
      c.shadowBlur = 0;
    } else if (hat === "bow") {
      c.fillStyle = "#ff7aa8";
      c.beginPath();
      c.moveTo(cx - 9, headTop - 1);
      c.lineTo(cx - 1, headTop - 6);
      c.lineTo(cx - 1, headTop + 4);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(cx + 9, headTop - 1);
      c.lineTo(cx + 1, headTop - 6);
      c.lineTo(cx + 1, headTop + 4);
      c.closePath();
      c.fill();
      c.fillStyle = "#ff5da0";
      c.fillRect(cx - 2, headTop - 4, 4, 6);
    } else if (hat === "cap") {
      c.fillStyle = bodyColor;
      c.fillRect(-w / 2, headTop - 5, w, 6);
      // Brim
      c.fillRect(-w / 2 - 4, headTop - 1, w + 4, 3);
      c.strokeStyle = "rgba(0,0,0,0.5)";
      c.lineWidth = 1;
      c.strokeRect(-w / 2 + 0.5, headTop - 4.5, w - 1, 5);
    }
  }

  function drawRobloxBlock(c, x, y, w, h, base, top) {
    c.fillStyle = base;
    c.fillRect(x, y, w, h);
    c.fillStyle = top;
    c.fillRect(x, y, w, 3);
    c.fillStyle = "rgba(0,0,0,0.4)";
    c.fillRect(x + w - 2, y, 2, h);
    c.strokeStyle = "rgba(0,0,0,0.5)";
    c.lineWidth = 1;
    c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  function rgbToHex(rgb) {
    const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgb);
    if (!m) return rgb;
    return "#" + [1, 2, 3].map((i) => parseInt(m[i], 10).toString(16).padStart(2, "0")).join("");
  }

  function drawHudOverlay(level, game) {
    if (level.prompt) {
      const text = level.prompt;
      ctx.save();
      ctx.font = "900 18px ui-monospace, monospace";
      const w = Math.max(280, ctx.measureText(text).width + 40);
      const x = (LOGICAL_W - w) / 2;
      ctx.fillStyle = "rgba(8, 10, 24, 0.92)";
      ctx.fillRect(x, 588, w, 40);
      ctx.strokeStyle = level.spec.accent;
      ctx.lineWidth = 1;
      ctx.shadowColor = level.spec.accent;
      ctx.shadowBlur = 12;
      ctx.strokeRect(x, 588, w, 40);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#e9ecf6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, LOGICAL_W / 2, 608);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.restore();
    }
    // Mini-map progress bar
    const px = 24, py = 678;
    ctx.save();
    ctx.fillStyle = "rgba(8, 10, 24, 0.85)";
    ctx.fillRect(px, py, 230, 14);
    ctx.strokeStyle = "rgba(140, 220, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, 229, 13);
    const ratio = clamp((game.player.x + game.player.w / 2) / level.worldW, 0, 1);
    const grad = ctx.createLinearGradient(px, 0, px + 230, 0);
    grad.addColorStop(0, level.spec.accent);
    grad.addColorStop(1, "#fff");
    ctx.fillStyle = grad;
    ctx.fillRect(px + 2, py + 2, (230 - 4) * ratio, 10);
    ctx.fillStyle = "#9aa5c2";
    ctx.font = "900 10px ui-monospace, monospace";
    ctx.fillText(level.spec.name.toUpperCase(), px, py - 6);
    ctx.restore();
  }

  function drawAttractMode() {
    const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    sky.addColorStop(0, "#06081a");
    sky.addColorStop(1, "#0a0c20");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    drawStarfield(0);
    ctx.fillStyle = "#22e3ff";
    ctx.shadowColor = "#22e3ff";
    ctx.shadowBlur = 16;
    ctx.font = "900 64px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("MERLIN", LOGICAL_W / 2, LOGICAL_H / 2);
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
  }

  // Synthetic deepfake video frame (used by deepfake lab + spot mini)
  function drawForensicsFrame(context, t) {
    const w = context.canvas.width;
    const h = context.canvas.height;
    // Dark studio backdrop
    const bg = context.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0a0e26");
    bg.addColorStop(1, "#1a1230");
    context.fillStyle = bg;
    context.fillRect(0, 0, w, h);
    // Stage spotlight
    const spot = context.createRadialGradient(w * 0.5, h * 0.4, 60, w * 0.5, h * 0.4, w * 0.7);
    spot.addColorStop(0, "rgba(169, 139, 255, 0.25)");
    spot.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = spot;
    context.fillRect(0, 0, w, h);
    // Background poster (warps)
    context.save();
    context.translate(w * 0.74 + Math.sin(t * Math.PI * 6) * 6, h * 0.2);
    context.rotate(Math.sin(t * Math.PI * 8) * 0.08);
    context.fillStyle = "rgba(34, 227, 255, 0.9)";
    context.fillRect(-44, -18, 88, 36);
    context.fillStyle = "#04050d";
    context.font = "900 18px ui-monospace, monospace";
    context.textAlign = "center";
    context.fillText("LIVE?", 0, 7);
    context.restore();
    context.textAlign = "left";

    // Wrong-direction shadow
    context.fillStyle = "rgba(255, 80, 112, 0.25)";
    context.beginPath();
    context.ellipse(w * 0.57 + Math.sin(t * Math.PI * 4) * 38, h * 0.81, 120, 30, 0.2, 0, Math.PI * 2);
    context.fill();

    // Face block (Roblox-style synthetic)
    const cx = w * 0.46;
    const cy = h * 0.43;
    // Hair / top block
    context.fillStyle = "#1a0a2a";
    context.fillRect(cx - 130, cy - 152, 260, 50);
    // Skin
    const skinGrad = context.createLinearGradient(cx, cy - 110, cx, cy + 130);
    skinGrad.addColorStop(0, "#f0c89a");
    skinGrad.addColorStop(1, "#a07050");
    context.fillStyle = skinGrad;
    context.fillRect(cx - 110, cy - 110, 220, 230);
    // Edge shimmer (tell)
    if (Math.sin(t * Math.PI * 12) > 0.4) {
      context.strokeStyle = "rgba(255, 77, 210, 0.7)";
      context.lineWidth = 3;
      context.strokeRect(cx - 112, cy - 112, 224, 234);
    }
    // Eyes (blinks weirdly)
    const blinkOdd = Math.sin(t * Math.PI * 18) > 0.92;
    context.fillStyle = "#ffffff";
    context.fillRect(cx - 70, cy - 30, 36, blinkOdd ? 4 : 22);
    context.fillRect(cx + 30, cy - 30, 36, 22);
    context.fillStyle = "#04050d";
    context.fillRect(cx - 60 + Math.sin(t * 30) * 2, cy - 22, 10, 10);
    context.fillRect(cx + 42 + Math.sin(t * 30) * 2, cy - 22, 10, 10);

    // Mouth (bad sync)
    const mouthLag = Math.abs(Math.sin((t + 0.18) * Math.PI * 8));
    context.fillStyle = "#5a0a18";
    context.fillRect(cx - 36, cy + 50, 72, 6 + mouthLag * 28);
    context.fillStyle = "#ffffff";
    context.fillRect(cx - 26, cy + 55, 52, 4);

    // Body
    context.fillStyle = "#22e3ff";
    context.fillRect(cx - 130, cy + 130, 260, 110);
    context.fillStyle = "#04050d";
    context.fillRect(cx - 70, cy + 158, 140, 24);
    context.fillStyle = "#ff4dd2";
    context.font = "900 18px ui-monospace, monospace";
    context.textAlign = "center";
    context.fillText("NEWS @ 9", cx, cy + 175);
    context.textAlign = "left";
  }

  // ============================================================
  // TUTORIAL DEMOS — short, looping animations rendered to a 640x320 canvas.
  // ============================================================
  function tutorialBackground(c, accent) {
    const w = c.canvas.width;
    const h = c.canvas.height;
    const grad = c.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#06081a");
    grad.addColorStop(1, "#0a0c20");
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
    // Floor line
    c.strokeStyle = `rgba(${hexToRgb(accent)}, 0.5)`;
    c.lineWidth = 2;
    c.shadowColor = accent;
    c.shadowBlur = 8;
    c.beginPath();
    c.moveTo(0, h - 60);
    c.lineTo(w, h - 60);
    c.stroke();
    c.shadowBlur = 0;
    // Floor grid
    c.strokeStyle = `rgba(${hexToRgb(accent)}, 0.18)`;
    c.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      c.beginPath(); c.moveTo(x, h - 60); c.lineTo(x, h - 8); c.stroke();
    }
  }

  function drawTutorialAvatar(c, x, baseline, time, avatar, dir = 1, accent = "#22e3ff") {
    c.save();
    c.translate(x, 0);
    c.scale(dir, 1);
    drawAvatar(c, accent, avatar || DEFAULT_AVATAR, baseline, time);
    c.restore();
  }

  function drawTutorialMove(c, t, avatar) {
    const w = c.canvas.width;
    const h = c.canvas.height;
    tutorialBackground(c, "#22e3ff");
    // Avatar oscillates left-right
    const phase = (Math.sin(t * 1.4) + 1) / 2; // 0..1
    const x = 90 + phase * (w - 180);
    const dir = Math.cos(t * 1.4) > 0 ? 1 : -1;
    drawTutorialAvatar(c, x, h - 60, t, avatar, dir, "#22e3ff");
    // Key indicator
    drawTutorialKeyHint(c, ["←", "→"], 20, h - 30);
    drawTutorialKeyHint(c, ["A", "D"], 110, h - 30);
    drawTutorialKeyHint(c, ["‹", "›"], w - 110, h - 30, true);
    // Caption strip
    drawTutorialCaption(c, "→ Walk right to begin every world", w / 2, 36);
  }

  function drawTutorialJump(c, t, avatar) {
    const w = c.canvas.width;
    const h = c.canvas.height;
    tutorialBackground(c, "#b6ff5c");
    // Gap in the floor
    c.fillStyle = "#04050d";
    c.fillRect(w / 2 - 50, h - 60, 100, 60);
    // Glitch danger
    c.fillStyle = "#ff5070";
    c.shadowColor = "#ff5070";
    c.shadowBlur = 10;
    for (let i = 0; i < 5; i += 1) {
      c.fillRect(w / 2 - 48 + i * 22, h - 8 + Math.sin(t * 6 + i) * 2, 18, 4);
    }
    c.shadowBlur = 0;
    // Jumping avatar: parabola crossing the gap
    const cycle = (t % 2.4) / 2.4; // 0..1 over each loop
    const startX = w / 2 - 110;
    const endX = w / 2 + 110;
    const x = startX + cycle * (endX - startX);
    const arc = -Math.sin(cycle * Math.PI) * 80; // up
    drawTutorialAvatar(c, x, h - 60 + arc, t, avatar, 1, "#b6ff5c");
    // Key indicator
    drawTutorialKeyHint(c, ["Space"], 20, h - 30);
    drawTutorialKeyHint(c, ["↑"], 130, h - 30, true);
    drawTutorialCaption(c, "↑ Jump over glitch pits", w / 2, 36);
  }

  function drawTutorialNode(c, t, avatar) {
    const w = c.canvas.width;
    const h = c.canvas.height;
    tutorialBackground(c, "#ff4dd2");
    // Node on the right
    const nx = w - 160;
    const ny = h - 130;
    const pulse = 0.6 + 0.4 * Math.sin(t * 2);
    c.save();
    c.shadowColor = "#ff4dd2";
    c.shadowBlur = 18 + pulse * 8;
    c.strokeStyle = "#ff4dd2";
    c.lineWidth = 2;
    c.beginPath(); c.arc(nx, ny, 28 + pulse * 4, 0, Math.PI * 2); c.stroke();
    c.translate(nx, ny);
    c.rotate(Math.PI / 4 + t * 0.6);
    c.fillStyle = "rgba(8, 10, 24, 0.85)";
    c.fillRect(-16, -16, 32, 32);
    c.strokeRect(-16, -16, 32, 32);
    c.shadowBlur = 0;
    c.rotate(-Math.PI / 4 - t * 0.6);
    c.fillStyle = "#ff4dd2";
    c.font = "900 14px ui-monospace, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("?", 0, 1);
    c.restore();

    // Avatar approaches node
    const cycle = (t % 4) / 4;
    const ax = 80 + cycle * (nx - 60 - 80);
    drawTutorialAvatar(c, ax, h - 60, t, avatar, 1, "#ff4dd2");

    // Pop popup near node when close
    if (cycle > 0.85) {
      c.fillStyle = "rgba(8,10,22,0.92)";
      c.strokeStyle = "#ff4dd2";
      c.shadowColor = "#ff4dd2";
      c.shadowBlur = 10;
      c.lineWidth = 1;
      c.fillRect(nx - 100, ny - 80, 200, 36);
      c.strokeRect(nx - 100, ny - 80, 200, 36);
      c.shadowBlur = 0;
      c.fillStyle = "#ff4dd2";
      c.font = "900 14px ui-monospace, monospace";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("MINI-CHALLENGE!", nx, ny - 62);
    }
    drawTutorialCaption(c, "▲ Walk into a glowing node to trigger a challenge", w / 2, 36);
  }

  function drawTutorialBoss(c, t, avatar) {
    const w = c.canvas.width;
    const h = c.canvas.height;
    tutorialBackground(c, "#ffc94a");
    // Boss tower on the right
    const tx = w - 180;
    const ty = h - 60 - 110;
    c.save();
    const grad = c.createLinearGradient(tx, ty, tx, ty + 110);
    grad.addColorStop(0, "#23284a");
    grad.addColorStop(1, "#0d1128");
    c.fillStyle = grad;
    c.fillRect(tx, ty, 86, 110);
    c.strokeStyle = "#ffc94a";
    c.shadowColor = "#ffc94a";
    c.shadowBlur = 12;
    c.lineWidth = 2;
    c.strokeRect(tx, ty, 86, 110);
    c.shadowBlur = 0;
    c.fillStyle = "#04050d";
    c.fillRect(tx + 12, ty + 14, 62, 30);
    c.fillStyle = "#ffc94a";
    c.font = "900 14px ui-monospace, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("AI?", tx + 43, ty + 29);
    // Status light
    c.fillStyle = "#ff5070";
    c.shadowColor = "#ff5070";
    c.shadowBlur = 12;
    c.beginPath(); c.arc(tx + 43, ty + 90, 6, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
    c.restore();

    // Avatar standing next to tower
    drawTutorialAvatar(c, tx - 60, h - 60, t, avatar, 1, "#ffc94a");

    // [E] prompt blinking
    if (Math.sin(t * 4) > 0) {
      c.fillStyle = "rgba(8,10,22,0.92)";
      c.strokeStyle = "#ffc94a";
      c.shadowColor = "#ffc94a";
      c.shadowBlur = 10;
      c.lineWidth = 1;
      c.fillRect(tx - 92, ty + 20, 80, 32);
      c.strokeRect(tx - 92, ty + 20, 80, 32);
      c.shadowBlur = 0;
      c.fillStyle = "#ffc94a";
      c.font = "900 14px ui-monospace, monospace";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("[E] OPEN", tx - 52, ty + 36);
    }
    drawTutorialCaption(c, "🛡 Press E (or tap !) at the boss tower", w / 2, 36);
  }

  function drawTutorialPortal(c, t, avatar) {
    const w = c.canvas.width;
    const h = c.canvas.height;
    tutorialBackground(c, "#5cffb6");
    // Cycle: locked (0..1.5s) → unlocking (1.5..2s) → unlocked + run through (2..4s)
    const cycle = (t % 4);
    const unlocked = cycle > 1.5;

    // Checklist on left
    const items = ["▲ Nodes", "🛡 Boss"];
    items.forEach((label, idx) => {
      const y = 80 + idx * 36;
      c.fillStyle = "rgba(8,10,22,0.85)";
      c.fillRect(20, y - 14, 160, 28);
      c.strokeStyle = unlocked ? "#5cffb6" : "rgba(140,220,255,0.4)";
      c.lineWidth = 1;
      c.strokeRect(20, y - 14, 160, 28);
      c.fillStyle = unlocked ? "#5cffb6" : "rgba(180,200,230,0.6)";
      c.font = "900 14px ui-monospace, monospace";
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.fillText(label, 32, y);
      // checkmark
      if (unlocked) {
        c.fillText("✓", 160, y);
      }
    });

    // Portal on right
    const px = w - 130;
    const py = h - 60 - 60;
    c.save();
    c.translate(px, py);
    const ringColor = unlocked ? "#5cffb6" : "#5c6682";
    c.shadowColor = ringColor;
    c.shadowBlur = unlocked ? 22 : 6;
    c.strokeStyle = ringColor;
    c.lineWidth = 6;
    c.beginPath();
    c.ellipse(0, 0, 36, 54, 0, 0, Math.PI * 2);
    c.stroke();
    c.shadowBlur = 0;
    const inner = c.createRadialGradient(0, 0, 4, 0, 0, 50);
    inner.addColorStop(0, unlocked ? "rgba(255,255,255,0.95)" : "rgba(180,180,200,0.6)");
    inner.addColorStop(1, unlocked ? "rgba(34,227,255,0.0)" : "rgba(60,70,90,0.0)");
    c.fillStyle = inner;
    c.beginPath();
    c.ellipse(0, 0, 28, 44, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = unlocked ? "#04050d" : "#9aa5c2";
    c.font = "900 12px ui-monospace, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(unlocked ? "GO" : "LOCK", 0, 2);
    c.restore();

    // Avatar approaching/entering the portal
    let ax;
    if (cycle < 2) {
      ax = 220;
    } else {
      const enterPhase = Math.min(1, (cycle - 2) / 1.6);
      ax = 220 + enterPhase * (px - 30 - 220);
    }
    drawTutorialAvatar(c, ax, h - 60, t, avatar, 1, "#5cffb6");

    drawTutorialCaption(c, "🚪 Clear all + boss → portal opens → next world", w / 2, 36);
  }

  function drawTutorialKeyHint(c, keys, x, y, active = false) {
    c.save();
    c.font = "900 12px ui-monospace, monospace";
    c.textAlign = "left";
    c.textBaseline = "middle";
    let cursor = x;
    for (const key of keys) {
      const tw = Math.max(20, c.measureText(key).width + 12);
      c.fillStyle = "rgba(8,10,22,0.85)";
      c.fillRect(cursor, y - 12, tw, 24);
      c.strokeStyle = active ? "#22e3ff" : "rgba(140,220,255,0.4)";
      c.lineWidth = 1;
      c.strokeRect(cursor + 0.5, y - 11.5, tw - 1, 23);
      c.fillStyle = active ? "#22e3ff" : "#cfd6ee";
      c.fillText(key, cursor + 6, y + 1);
      cursor += tw + 4;
    }
    c.restore();
  }

  function drawTutorialCaption(c, text, x, y) {
    c.save();
    c.font = "900 14px ui-monospace, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    const w = c.measureText(text).width + 32;
    c.fillStyle = "rgba(8,10,22,0.92)";
    c.fillRect(x - w / 2, y - 16, w, 32);
    c.strokeStyle = "rgba(140,220,255,0.45)";
    c.lineWidth = 1;
    c.strokeRect(x - w / 2 + 0.5, y - 15.5, w - 1, 31);
    c.fillStyle = "#cfd6ee";
    c.fillText(text, x, y + 1);
    c.restore();
  }

  function drawSyntheticPhoto(context, t) {
    const w = context.canvas.width;
    const h = context.canvas.height;
    // Dark vignette photo
    const bg = context.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w * 0.7);
    bg.addColorStop(0, "#1c1430");
    bg.addColorStop(1, "#04050d");
    context.fillStyle = bg;
    context.fillRect(0, 0, w, h);

    // Subject silhouette
    const cx = w * 0.5;
    const cy = h * 0.5;
    // Hair
    context.fillStyle = "#0a0418";
    context.fillRect(cx - 130, cy - 180, 260, 70);
    // Face
    const skin = context.createLinearGradient(cx, cy - 130, cx, cy + 180);
    skin.addColorStop(0, "#ddb088");
    skin.addColorStop(1, "#8a5840");
    context.fillStyle = skin;
    context.fillRect(cx - 110, cy - 130, 220, 270);
    // Eyes
    context.fillStyle = "#ffffff";
    context.fillRect(cx - 70, cy - 40, 32, 16);
    context.fillRect(cx + 38, cy - 40, 32, 16);
    context.fillStyle = "#04050d";
    context.fillRect(cx - 60, cy - 36, 8, 8);
    context.fillRect(cx + 50, cy - 36, 8, 8);
    // Mouth
    context.fillStyle = "#4a1018";
    context.fillRect(cx - 30, cy + 50, 60, 8);
    // Hand with extra finger (tell, lower-left area)
    const hx = w * 0.36;
    const hy = h * 0.62;
    context.fillStyle = "#ddb088";
    context.fillRect(hx - 30, hy, 60, 70);
    // 6 fingers
    for (let i = 0; i < 6; i += 1) {
      context.fillRect(hx - 30 + i * 10, hy - 24, 8, 24);
    }
    // Earring melt (right area)
    context.fillStyle = "#ffc94a";
    context.beginPath();
    context.moveTo(cx + 100, cy - 10);
    context.bezierCurveTo(cx + 130, cy + 5, cx + 90, cy + 20, cx + 105, cy + 35);
    context.bezierCurveTo(cx + 120, cy + 50, cx + 80, cy + 60, cx + 95, cy + 80);
    context.lineWidth = 4;
    context.strokeStyle = "#ffc94a";
    context.stroke();
    // Background letters scrambled (top-left)
    context.font = "900 22px ui-monospace, monospace";
    context.fillStyle = "rgba(255,255,255,0.4)";
    const letters = "MUSEUM" + (Math.floor(t * 10) % 2 === 0 ? "" : "$");
    context.fillText("M U" + (Math.floor(t * 10) % 2 === 0 ? "S" : "Z") + "E " + (Math.floor(t * 6) % 2 === 0 ? "U" : "0") + "M", w * 0.16, h * 0.2);
    // Impossible reflection (top-right window)
    context.fillStyle = "rgba(34, 227, 255, 0.5)";
    context.fillRect(w * 0.7, h * 0.15, 100, 60);
    context.fillStyle = "rgba(255, 77, 210, 0.5)";
    context.fillRect(w * 0.72 + Math.sin(t * 8) * 6, h * 0.18, 60, 30);
  }

  function deepfakeVideoMessage(id) {
    return ({
      mouth: "Mouth doesn't sync with phonemes.",
      edge: "Face edges shimmer.",
      shadow: "Shadow direction is wrong.",
      background: "Background warps as face moves."
    })[id] || "Tell.";
  }

  function setupGlobalErrorGuard() {
    window.addEventListener("error", (event) => {
      console.error(event.error || event.message);
      showToast("Script error. Open console for details.");
    });
  }

  setCanvasScale();
  setupGlobalErrorGuard();
  window.addEventListener("resize", setCanvasScale);
  const game = new Game();
  // Expose for debugging
  window.__game = game;
})();
