# PRINCIPIA Learning Science Engine

The learning science engine is a separate module loaded before the learning orchestrator. It provides 58 context-aware strategy profiles across 18 groups. It does not expose strategy names in the learner interface. The orchestrator selects a small compatible set for the current task instead of applying every technique in one session.

## Strategy registry

- **Memory and retention:** retrieval practice, spaced practice, cumulative retrieval, generation, formula/definition dictation (默写).
- **Practice and error correction:** interleaving, deliberate practice, varied practice, error analysis, targeted problem volume (题海战术, selectively), topic-focused training (专题训练), error notebook (错题本).
- **Understanding and representation:** elaborative interrogation, self-explanation, worked examples, faded guidance, dual coding, concrete examples, chunking, analogical learning, concept mapping.
- **Teaching and dialogue:** Feynman-style teach-back, Socratic questioning, peer instruction, collaborative retrieval, group study (集体自习).
- **Problem solving and physics reasoning:** Polya's four phases, first principles, problem decomposition, multiple solutions, counterexample testing, dimensional analysis, prediction before observation.
- **Transfer and assessment:** transfer practice, exam wrappers, metacognitive calibration, immediate feedback.
- **Motivation and planning:** autonomy/competence support from self-determination theory, growth-mindset reframing, goal-gradient milestones, implementation intentions (if–then plans), WOOP, habit stacking, time blocking, planned review (计划复盘).
- **Focus and recovery:** flexible Pomodoro, deep-work blocks, attention restoration, environment design, ultradian-style breaks, cognitive-load management, embodied learning and sleep/recovery guidance.
- **Additional motivation and planning:** mastery-oriented achievement goals, opt-in comparison of peer reasoning (never public ranking), unfinished-task resume cues without pressure, and timed practice only after baseline accuracy.

The registry is intentionally broader than a single evidence ranking. Retrieval, distributed practice, and interleaving have classroom meta-analytic support, but their effects depend on task, feedback, timing, and whether practice actually elicits retrieval or discrimination. Self-explanation, elaborative interrogation, concrete examples, and dual coding are also discussed in learning-science reviews. Motivation, planning, focus, and culturally named study routines are treated as contextual implementation tools, not as equally proven memory interventions.

## Adaptation rules

- Low energy or low confidence: shorten the task, reduce cognitive load, use worked examples and faded hints.
- Weak quiz or repeated errors: classify the error, use targeted practice, require an independent retry, then schedule review.
- Strong performance: increase difficulty and test transfer with a changed representation or context.
- Remembering: use retrieval, spacing, cumulative recall and short dictation checks.
- Understanding: use concrete examples, diagrams, self-explanation and carefully bounded analogies.
- Olympiad: use problem decomposition, Polya-style planning, dimensional checks, counterexamples and multiple-solution comparison.
- Teaching: ask the learner to explain from memory; the AI student asks one relevant question at a time.
- Fatigue or distraction: reduce task size, remove distractions, insert a recovery break, and never encourage sleep deprivation or studying to exhaustion.

## Research references

1. Ruitenburg et al. (2026), *A Meta-Analysis of the Effectiveness and Boundary Conditions of Retrieval Practice, Distributed Practice, and Interleaved Practice in Authentic School Classrooms*, Educational Psychology Review. https://link.springer.com/article/10.1007/s10648-026-10225-5
2. Carpenter, Pan & Butler (2022), *The science of effective learning with spacing and retrieval practice*, Nature Reviews Psychology. https://www.nature.com/articles/s44159-022-00089-1
3. Weinstein, Madan & Sumeracki (2018), *Teaching the science of learning*. https://pmc.ncbi.nlm.nih.gov/articles/PMC5780548/
4. National Academies (2018), *How People Learn II: Learners, Contexts, and Cultures*, Chapter 6. https://www.nationalacademies.org/read/24783/chapter/7
5. Education Endowment Foundation, *Cognitive science approaches in the classroom: a review of the evidence*. https://educationendowmentfoundation.org.uk/education-evidence/evidence-reviews/cognitive-science-approaches-in-the-classroom

This engine is a decision-support layer, not a clinical or psychological diagnostic tool. It stores only a short list of recently selected strategy IDs in local storage; it does not need mood histories or sensitive personal details.
