-- ────────────────────────────────────────────────────────────────────────────
-- Development seed data - OPTIONAL. These are examples only; the production
-- source of truth is the database, never the frontend. Delete rows and manage
-- through the Admin dashboard.
-- ────────────────────────────────────────────────────────────────────────────

insert into public.domains (name, description, display_order) values
  ('Web Development', 'Build fast, accessible experiences for the browser - from semantic markup to modern frameworks.', 1),
  ('UI/UX Design', 'Design clear, human interfaces: research, wireframes, high-fidelity screens, and design systems.', 2),
  ('App Development', 'Craft native or cross-platform applications with clean architecture and great UX.', 3),
  ('AI / ML', 'Train, evaluate, and ship intelligent systems - from classic ML to modern deep learning.', 4)
on conflict do nothing;
-- Tasks reference the seeded domain ids by name for readability.
do $$
declare
  web uuid := (select id from public.domains where name = 'Web Development' limit 1);
  ui  uuid := (select id from public.domains where name = 'UI/UX Design' limit 1);
  app uuid := (select id from public.domains where name = 'App Development' limit 1);
  ai  uuid := (select id from public.domains where name = 'AI / ML' limit 1);
begin
  if web is not null then
    insert into public.tasks (domain_id, name, description, instructions, difficulty, submission_type, display_order) values
      (web, 'Semantic HTML Portfolio', 'Mark up a personal portfolio using only semantic HTML 5 elements.', 'Build a single-page portfolio using only semantic HTML5: header, nav, main, article, section, aside, footer. No CSS or JS required for this task - the focus is on structure, landmarks, and accessible reading order. Validate with the W3C validator.', 'easy', 'link', 1),
      (web, 'Responsive Landing Page', 'Recreate a landing page that is fully responsive from 320px to 1440px.', 'Recreate the provided landing page design using HTML/CSS only. Use a mobile-first approach with a single breakpoint. Provide a live URL or a GitHub repository containing the code and a README explaining your breakpoint strategy.', 'medium', 'pdf_link', 2),
      (web, 'State Management in React', 'Add global state to a small React app using a state management library of your choice.', 'Extend the starter React app: add global state for the cart and user session using your chosen library (Context+Reducer, Zustand, Redux Toolkit, Jotai...). Document why you chose the library and how it scales.', 'medium', 'pdf', 3),
      (web, 'Build a Real-Time Dashboard', 'Ship a dashboard with live-updating data over WebSockets.', 'Using any stack you like, build a dashboard that displays live metrics pushed over WebSockets. Include loading/error/empty states and a short architecture diagram in your PDF. The PDF must include your architecture diagram and deployment notes.', 'hard', 'pdf_link', 4),
      (web, 'Compiler in the Browser', 'Write a minimal tokenizer + parser for a tiny language and run it in the browser.', 'Implement a lexer and recursive-descent parser for the toy language spec provided, with live error messages and a step-by-step execution trace rendered in the browser. This is the boss round - full marks require a documented grammar.', 'extreme', 'pdf_link', 5);
  end if;

  if ui is not null then
    insert into public.tasks (domain_id, name, description, instructions, difficulty, submission_type, display_order) values
      (ui, 'Design Tokens Audit', 'Audit a design system and document 20+ inconsistencies in a structured report.', 'Pick any open-source design system. Audit its tokens (color, type, spacing, radius, elevation) against its own documentation. Deliver a PDF report with screenshots annotating each inconsistency and a prioritized fix list.', 'easy', 'pdf', 1),
      (ui, 'Mobile Onboarding Flow', 'Redesign a mobile onboarding flow and produce a hi-fi Figma prototype.', 'Design a 4-step onboarding flow for the brief provided. Include the full user flow, wireframes, and a hi-fi prototype in Figma. Submit the Figma link and a one-page rationale PDF.', 'medium', 'pdf_link', 2),
      (ui, 'Accessibility Redesign', 'Take a real screen and redesign it for WCAG 2.2 AA compliance.', 'Choose one screen from the provided list, audit it against WCAG 2.2 AA, and deliver both an annotated audit and a redesigned hi-fi version. All conformance claims must be tied to the specific criteria.', 'medium', 'pdf', 3),
      (ui, 'Design System Component', 'Build a complete, documented component package for one UI element.', 'Design and document a full component package (tokens, variants, states, usage, accessibility) for one element - button, select, or data table. Deliver as a Figma library link plus a PDF spec.', 'hard', 'pdf_link', 4),
      (ui, 'Complex Data Visualization', 'Design an interface for a data-heavy analytics domain that stays human.', 'Pick a domain (observability, finance, healthcare ops). Design a dashboard that shows the same dataset at three levels of detail without overwhelming the user. The PDF must justify every layout decision with a diagram.', 'extreme', 'pdf_link', 5);
  end if;

  if app is not null then
    insert into public.tasks (domain_id, name, description, instructions, difficulty, submission_type, display_order) values
      (app, 'Kotlin Basics: Tip Calculator', 'Build a tip calculator app with clean state handling.', 'Build a simple tip calculator in Kotlin (Jetpack Compose or Views). Handle split counts, rounding, and configuration changes without losing state. Link to the repository and include a one-page PDF explaining state handling.', 'easy', 'pdf_link', 1),
      (app, 'Offline-First Notes App', 'Build a notes app that works fully offline and syncs later.', 'Implement local persistence (Room or SwiftData) with a sync queue that flushes when connectivity returns. Demonstrate conflict handling for the same note edited on two devices.', 'medium', 'pdf_link', 2),
      (app, 'Cross-Platform Architecture', 'Design and implement a shared architecture for a cross-platform app.', 'Using a shared-code approach (KMP / Flutter), structure business logic in a shared module and implement two platform-specific UIs. The PDF must include the module diagram and how you tested the shared layer.', 'hard', 'pdf_link', 3),
      (app, 'Background Task Engine', 'Ship a reliable background processing pipeline for a mobile app.', 'Implement background uploads/downloads with retries, backoff, and user-visible progress, surviving process death. Demonstrate with a test harness that kills the app mid-transfer.', 'extreme', 'pdf_link', 4);
  end if;

  if ai is not null then
    insert into public.tasks (domain_id, name, description, instructions, difficulty, submission_type, display_order) values
      (ai, 'MNIST from Scratch', 'Train a classifier on MNIST without a deep learning framework.', 'Implement forward and backward passes, training loop, and evaluation in NumPy (or equivalent) only. Report final accuracy and include loss curves in your PDF.', 'easy', 'pdf', 1),
      (ai, 'Model Card', 'Write a rigorous model card for an existing open model.', 'Pick an openly released model and author a complete model card: intended use, metrics, training data, evaluation, limitations. Base every claim on the model''s actual documentation - no invented numbers.', 'medium', 'pdf', 2),
      (ai, 'Fine-Tune an LLM', 'Fine-tune a small language model on a custom dataset and evaluate it properly.', 'Fine-tune a small open model (e.g. 0.5B–1B) on a dataset you curate. Compare against the base model with a held-out test set and qualitative samples. The PDF must include hyperparameters and compute details.', 'hard', 'pdf_link', 3),
      (ai, 'Build a RAG System', 'Ship a retrieval-augmented generation pipeline with evaluation.', 'Build a complete RAG pipeline: ingest, chunking, embedding, retrieval, generation with citations, and an evaluation harness (retrieval + answer quality). Provide the repo link and an architecture/evaluation PDF.', 'hard', 'pdf_link', 4),
      (ai, 'Deploy at the Edge', 'Deploy an ML model to an edge device with real latency constraints.', 'Take a small model and ship it to a constrained device (Raspberry Pi, phone, browser) with a measured latency budget. Deliver the deployment artifacts and a PDF with profiling data showing you met the budget.', 'extreme', 'pdf_link', 5);
  end if;
end $$;
