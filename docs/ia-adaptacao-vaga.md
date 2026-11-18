# Tailor a resume to a job (AI)

The user pastes a full job posting. An external AI reads it together with one of the user's resumes (the **base resume**) and builds a **new** resume aimed at that job, using the job's keywords where the base resume supports them. The base resume is never changed.

Code: `src/features/ai/`.

## No back-end: bring your own key

The browser calls the AI provider directly with the user's own API key. There is no server in between, so the app stays a static site (it can still be deployed to Vercel with no environment variables).

| Provider | API address (OpenAI-compatible) | Where to get a key |
|---|---|---|
| OpenRouter (recommended) | `https://openrouter.ai/api/v1` | <https://openrouter.ai/keys> |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | <https://aistudio.google.com/apikey> |
| Local proxy (DeepSeek, Qwen...) | editable, default `http://localhost:3000/v1` | optional, set by the proxy |
| Custom | any OpenAI-compatible URL, e.g. Ollama at `http://localhost:11434/v1` | depends on the server |

OpenRouter gives access to models from Google, Anthropic, OpenAI and others with one key, and the model can be changed without code changes.

Setup: **AI settings** in the header opens a side panel → choose the provider, paste the key, pick the model → **Test connection** → **Save**.

The **Model** field is a combobox (`ModelCombobox.tsx`): it loads the provider's models when the dialog opens, and clicking it opens a list grouped by company, with the short name, the id, the context size and a **Free** badge (hidden while the free-only filter is on). Typing filters the list; a name that is not in the list can still be typed. Arrows move, Enter picks, Escape closes only the list. The list floats over the panel, so the panel does not need to scroll. Models that generate audio, images or video (e.g. music models) are left out, since they cannot write a resume.

The key field shows the provider's key format as a placeholder (`sk-or-v1-...`, `AIza...`). It warns when the key does not have that format (OpenRouter keys start with `sk-or-`, Google AI Studio keys with `AIza`) and suggests the right provider (`checkKeyFormat` in `providers.ts`). OpenRouter lists its models without a key, so the model list loading does not mean the key is valid; **Test connection** checks the key and the model.

Both providers accept requests from the browser (CORS). The client only sends the `HTTP-Referer` and `X-Title` headers to OpenRouter, because other providers reject unknown headers in the browser preflight.

## Local proxy

The **Local proxy** provider is for an OpenAI-compatible server running on the user's computer that forwards requests to a chat account, such as [DeepsProxy](https://github.com/pedrofariasx/deepsproxy) for DeepSeek (port 3000 by default) or a proxy for Qwen.

- The API address is editable (port and `/v1`); the key is only needed if the proxy has one (`API_KEY` in DeepsProxy).
- The model list reads the proxy's `/v1/models` (DeepsProxy: `deepseek-v4-flash`, `deepseek-v4-pro` and their `-thinking` versions).
- The proxy must allow CORS (DeepsProxy does). If the app cannot reach it, the error says to check that the proxy is running and the address is right.
- These proxies drive a browser, so answers are slower: the connection test waits up to 90 seconds. `<think>` blocks from reasoning models are ignored when reading the JSON answer.
- Use it with the app running locally (`npm run dev`). From the deployed HTTPS site, Chrome may block requests to `localhost` (Private Network Access).

## Privacy

- The API key is stored only in this browser (`localStorage`, key `ai-settings`) and is sent only to the chosen provider. **Forget key** removes it. Avoid saving it on shared computers.
- What is sent to the provider: the job posting and the resume **content** (headline, summary, skills, experience, projects, education, languages); in the chat, also the messages and the facts the candidate stated.
- What is never sent: name, email, phone, address, LinkedIn/GitHub/portfolio links and references (`resumeForPrompt` in `prompts.ts`, covered by a test).

## Flow

1. **Job**: choose the base resume, paste the posting (up to 15,000 characters) and the output language (default: same as the posting).
2. **Analysis** (first AI call): role, company, seniority, main requirements and up to 30 keywords with priority (high / medium / low). Each keyword shows whether the base resume already mentions it.
3. **Result** (second AI call): the tailored resume, reviewed before saving. When the output language is Portuguese or English and the base resume is in the other one, the base resume is first translated (see below) and the tailoring works on the translated copy, so roles, courses, languages and dates do not stay in the old language (`prepareTailorBase` in `translation.ts`). The result then shows:
   - keyword coverage before → after, per keyword and per section
   - a warning for terms that were **not** in the base resume ("keep them only if they are true")
   - the number of invented items that were discarded
   - keywords the job asks for that the resume cannot support (add them to the base resume if they are true, then generate again)
   - the AI's own list of changes
   - a side-by-side comparison of every section
4. **Save as new resume**: the copy is added to the list and opened for editing, with `meta` (target job, company, keywords, source resume) and the resume language (`locale`), which sets the PDF's section titles.

## Translate a resume

"Translate to English / Portuguese" in the resume's ⋯ menu creates a **copy** in the other language; the original never changes. The copy is named after the original with the new language in parentheses; a previous language suffix is replaced, not added ("Resume (Português)" → "Resume (English)", `titleWithoutLanguage`). The source language is the language detected in the text, not the chosen resume language, so a resume written in English but set to Portuguese is translated from English (`contentLocaleOf` in `src/shared/locale.ts`). It can also be started from the banner that appears under "Resume language" when the chosen language and the text do not match.

The AI translates the headline, summary, skills, soft and interpersonal skills, languages ("Inglês: avançado" → "English: advanced"), and in each experience, education and project: role, course, project name, dates and description. It keeps technologies, product names, certifications and acronyms as written. The user reviews a before/after of every section and the new name, then saves.

`mergeTranslatedCV` (`translation.ts`) applies the answer on top of the original:

- Contact data, links, companies, institutions, references and ids always come from the original; they are not even sent.
- An item with an id the original does not have is discarded and counted; an item that comes back without translation keeps the original text and is counted, with a warning in the review.
- A translated date is used only if its numbers are the same as the original's ("jan 2020" → "Jan 2020" is fine, "Jan 2021" is ignored).
- An empty field stays empty; a field the AI leaves empty keeps the original text.

## Adjust in a chat

The ▾ next to "Tailor to a job" opens a menu with **Adjust in a chat**, **Translate** and **AI history** for the open resume (`AIActions.tsx`).

The chat (`RefineChatDrawer.tsx`, `refine.ts`) works on the open resume. The candidate asks for changes in their own words ("make the summary shorter", "I studied GraphQL in 2026"). If the resume came from a job tailoring, the job posting goes along as context and the keywords the resume still does not show become "I have …" shortcuts that start the message.

The reply is in the site language by default; if the candidate writes in another language, or asks for one, the AI answers in that language without the site language changing. The resume text always stays in the resume language, and the AI does not use dashes (— or –) to join sentences.

Each answer is a short reply and, when something should change, a **proposal**: a before/after of the sections it touches, with **Apply** and **Discard**. Nothing changes until the candidate applies it. Applying is recorded in the history (entry "Adjusted in the chat"), so it can be undone with "Restore this version". A proposal made before another one was applied can no longer be applied, since the resume changed.

The conversation is saved per resume in `localStorage` (key `cv-chat`, `chatHistory.ts`), so it comes back when the panel is reopened or the page reloads. Each resume keeps its last 40 messages; a new request still sends only the last 12 (starting at a candidate message), so the cost of a long conversation stays bounded. A proposal keeps only the resume content (`contentOf`), not the whole resume. If storage is full, the oldest conversations are dropped first. Deleting a resume or clearing all data deletes its conversation, and "Clear conversation" in the panel deletes it on demand. Conversations are not part of the backup file.

`applyRefinePatch` guards the answer: only the fields in the patch change; contact data, companies, roles, dates and institutions never change; entries cannot be added or removed (the AI tells the candidate to add them in the form) and unknown ids are counted and ignored.

**Declared facts**: when the candidate states something about themselves, the AI returns it as a short fact. Facts are kept in the resume (`meta.declaredFacts`) and sent with the next messages, so the AI can use them without inventing. For a tailored resume, "Also use in the base resume" keeps them in the base resume too, after a confirmation; tailoring from that base then sends them as `<candidate_facts>`, and the prompt allows facts from the base resume or from that list. Only the last 12 messages go with each request.

## History

"AI history" in the resume's ⋯ menu opens a side panel with what the AI did to that resume, newest first (`src/features/history/`, `HistoryDrawer.tsx`):

- **Tailored to <job>**: date, model, keyword coverage before → after, new terms, keywords the resume could not support, the AI's list of changes, the job posting (collapsed) and a before/after of every section.
- **Translated from <language> to <language>**: date, model and the before/after.
- **Adjusted in the chat**: the request, the AI's reply and the before/after.
- **Version restored**: when a version is brought back.

The keywords that were missing in a tailoring have an "I have …" button that opens the chat with the message started.

**Restore this version** puts that entry's result back into the resume (headline, summary, skills, experience, education, projects, languages and resume language; contact data does not change), after a confirmation. The restore is itself saved as an entry, so it can be undone the same way.

Only AI actions are saved, not every manual edit (autosave would flood the history). Each entry keeps only the parts the AI can change (`contentOf`), never contact data. The history lives in `localStorage` under `cv-history`, keeps the last 20 entries per resume, is deleted with its resume, and when the browser storage is full the oldest entries are dropped first (`fitToStorage`).

## Honesty guarantees (in code, not only in the prompt)

`mergeTailoredCV` (`parse.ts`) applies the AI answer on top of the base resume:

- Contact data, companies, roles, dates, institutions, links, references, languages and ids always come from the base resume.
- The AI can rewrite text (headline, summary, skills, soft skills, experience descriptions, project descriptions), reorder or drop projects, and narrow education topics to lines that already exist.
- Experiences or projects with an id the base resume does not have are discarded and counted.
- If the AI returns an empty project list, the original projects are kept.

Keyword coverage is counted in code (`keywords.ts`), ignoring case and accents, with whole-term matching that handles names such as `C#`, `Node.js` and `CI/CD` ("Java" does not match "JavaScript").

## PDF metadata

Every exported PDF gets title, author, subject, keywords and language (`src/features/pdf/pdfMetadata.ts`). For a tailored resume the subject uses the target job and company, and the keywords come from the job. The file is named `Name_Role_Company.pdf`.

Most ATS rank resumes by the visible text, so the metadata helps a little; what matters is that the keywords appear in the content. The prompt asks for high-priority keywords 2-3 times across sections, and never for hidden text or keyword lists.

## Errors

Errors are shown in a banner with a practical next step in the user's language; the provider's own text (often in English) and the HTTP status stay under a collapsed **Technical details** (`describeAIError` in `errorMessage.ts`, `StatusAlert`). Provider errors are mapped to messages the user can act on (`client.ts` → `ai.errors.*`): invalid key (the message says the problem is the key, not the model), no credits, rate limit, model not found, free model blocked by the OpenRouter privacy settings, provider down, no connection, timeout. If the model answers with something that is not the expected JSON, the request is retried once; some models reject `response_format`, so the client retries without it.

## Limitations

- Each generation costs tokens with the chosen provider (free models exist on OpenRouter and Gemini has a free tier).
- Quality depends on the model. Small models may ignore instructions; the code-level guards still keep facts from the base resume.
- The app cannot read job pages by URL; the user pastes the text.
