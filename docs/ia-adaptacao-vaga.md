# Tailor a resume to a job (AI)

The user pastes a full job posting. An external AI reads it together with one of the user's resumes (the **base resume**) and builds a **new** resume aimed at that job, using the job's keywords where the base resume supports them. The base resume is never changed.

Code: `src/features/ai/`.

## No back-end: bring your own key

The browser calls the AI provider directly with the user's own API key. There is no server in between, so the app stays a static site (it can still be deployed to Vercel with no environment variables).

| Provider | API address (OpenAI-compatible) | Where to get a key |
|---|---|---|
| OpenRouter (recommended) | `https://openrouter.ai/api/v1` | <https://openrouter.ai/keys> |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | <https://aistudio.google.com/apikey> |
| Custom | any OpenAI-compatible URL, e.g. Ollama at `http://localhost:11434/v1` | depends on the server |

OpenRouter gives access to models from Google, Anthropic, OpenAI and others with one key, and the model can be changed without code changes.

Setup: **AI settings** in the header → choose the provider, paste the key, type a model (or **Load models** to pick from the provider's list) → **Test connection** → **Save**.

Both providers accept requests from the browser (CORS). The client only sends the `HTTP-Referer` and `X-Title` headers to OpenRouter, because other providers reject unknown headers in the browser preflight.

## Privacy

- The API key is stored only in this browser (`localStorage`, key `ai-settings`) and is sent only to the chosen provider. **Forget key** removes it. Avoid saving it on shared computers.
- What is sent to the provider: the job posting and the resume **content** (headline, summary, skills, experience, projects, education, languages).
- What is never sent: name, email, phone, address, LinkedIn/GitHub/portfolio links and references (`resumeForPrompt` in `prompts.ts`, covered by a test).

## Flow

1. **Job**: choose the base resume, paste the posting (up to 15,000 characters) and the output language (default: same as the posting).
2. **Analysis** (first AI call): role, company, seniority, main requirements and up to 30 keywords with priority (high / medium / low). Each keyword shows whether the base resume already mentions it.
3. **Result** (second AI call): the tailored resume, reviewed before saving:
   - keyword coverage before → after, per keyword and per section
   - a warning for terms that were **not** in the base resume ("keep them only if they are true")
   - the number of invented items that were discarded
   - keywords the job asks for that the resume cannot support (add them to the base resume if they are true, then generate again)
   - the AI's own list of changes
   - a side-by-side comparison of every section
4. **Save as new resume**: the copy is added to the list and opened for editing, with `meta` (target job, company, keywords, source resume).

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

Provider errors are mapped to messages the user can act on (`client.ts` → `ai.errors.*`): invalid key, no credits, rate limit, model not found, provider down, no connection, timeout. If the model answers with something that is not the expected JSON, the request is retried once; some models reject `response_format`, so the client retries without it.

## Limitations

- Each generation costs tokens with the chosen provider (free models exist on OpenRouter and Gemini has a free tier).
- Quality depends on the model. Small models may ignore instructions; the code-level guards still keep facts from the base resume.
- The app cannot read job pages by URL; the user pastes the text.
