# PRINCIPIA Learning Lab

A standalone learning feature loaded after the shared Gemini client. It preserves the existing site structure and stores its own data in `principia_learning_lab_v1`.

## Features

### AI concept map and prerequisite path
- Learner enters a topic, current level, and goal.
- Gemini generates 4–8 concepts in prerequisite order, up to five prerequisites, core ideas, common misconceptions, and a self-check question per concept.
- Dependency edges are validated to reference earlier concepts only, preventing cycles and dangling references.
- Maps are saved locally (maximum 20) and can be exported as UTF-8 text.
- Each prerequisite can launch a baseline oral check. Each concept can launch an oral self-explanation check or a misconception challenge that asks the learner to produce a counterexample and explain the conditions.

### Socratic oral practice
- Four tutor personas: Socratic coach, beginner learner, skeptic, and Olympiad learner.
- Adaptive or selected difficulty.
- One question per turn; the tutor evaluates reasoning, provides a limited hint, and asks the next question instead of giving away the complete solution.
- Text input, browser speech recognition (Vietnamese where supported), and browser text-to-speech.
- If an AI request fails, the learner's answer is retained for retry.

## Privacy and safety
- Only the entered learning topic, learning goal, generated map, and learner's study answer are sent to the configured Gemini API when the learner explicitly starts an action.
- The UI warns that Gemini Free Tier content may be used to improve Google's products. Learners should not submit personal or sensitive information.
- Learner-entered topics and answers are treated as untrusted data, not system instructions.
- Maps are stored locally on the current device; this module does not claim cross-device synchronization.
- Microphone access is only requested when the learner presses the voice-answer button. Keyboard input remains available.

## Verification
Unit tests cover structured-output parsing, minimum concept count, unique identifiers, acyclic prerequisite edges, tutor score bounds, required follow-up questions, Gemini map generation, script order, privacy notice, and voice capability fallbacks.
