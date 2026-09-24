# Yojana Setu AI agent instructions

## Project overview
- This repo is a React + Vite app for matching applicants to government schemes and loan programs.
- The app currently has a lightweight profile workflow: `src/pages/Profile.jsx` collects applicant data, `src/utils/schemeMatcher.js` ranks schemes, and `src/pages/SchemeResults.jsx` renders the matched results.
- `src/components/DocumentIntelligence.jsx` and `src/utils/documentService.js` provide local document parsing and profile cross-checks; they are not OCR-backed yet and should be treated as a manual review workflow.
- `src/utils/applicationRoadmap.js` provides scheme-specific guidance and official application steps.

## Architecture and data flow
- `App.jsx` routes between landing, login/signup, profile, results, and scheme detail screens.
- `profileData` is passed from the profile form into scheme matching and later into the detail screen.
- Matching logic is intentionally scheme-based and transparent: the score is a ranking signal, not a sanction or approval prediction.
- Reuse existing data from `profile` and uploaded document extraction; do not create a second matching engine or a parallel sanction predictor.

## Real readiness rules
- The only acceptable readiness metric is based on actual application fields and uploaded document data.
- Use criteria that exist in this app: identity information, business information, business registration/document, loan-required amount, required documents, and category-specific supporting information when relevant.
- If a scheme-specific item is not required for the selected scheme, do not count it as incomplete.
- Keep status wording factual: `Complete`, `Needs Attention`, or `Not Provided`.
- Never present readiness as bank approval, government approval, sanction probability, or a loan probability.

## Current scheme-specific patterns
- `src/utils/schemeMatcher.js` currently covers PMEGP, MUDRA, and Stand-Up India.
- `selectedScheme` should influence the readiness checklist only to the extent that the project already includes scheme-specific conditions and required evidence.
- Keep the checklist anchored to real fields already collected in `Profile` and to document-type detection in `documentService.js`.

## Build and verification
- Use `npm install` at the root if dependencies are missing.
- Run `npm run build` from the repo root to confirm the React app compiles.
- `npm run dev` is the local frontend workflow for live development.
- The backend is in `backend/` and runs with `npm start` from that folder when API/auth services are needed.
- There are no automated tests configured in this repo; build verification is the main confidence check.

## UI conventions
- Keep the existing Yojana Setu visual language: indigo/emerald accent cards, rounded panels, and profile/result cards.
- When updating readiness UI, follow the project’s current wording and spacing patterns in `src/pages/SchemeResults.jsx` and `src/index.css`.
- Prefer plain, factual wording such as `Application Readiness`, `Ready to proceed`, and `Readiness reflects the completeness of the information and documents provided.`
- Do not use sanctioned-approval language anywhere in the UI, including screen mockups or exported static HTML.

## Important constraints
- Do not add hard-coded percentages unless they are computed from actual data in the current profile/document state.
- Do not use sanction-style score labels or approval-probability wording in the UI or instructions.
- If data is missing, show a neutral actionable state rather than inventing a score.
- Keep profile and document data as the source of truth.
