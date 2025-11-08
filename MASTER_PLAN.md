# Master Plan: Gemini Vibe (November 2025)

This document contains the definitive, up-to-date implementation plan for the Gemini Vibe platform. It reflects our decision to build a manual-start prototype that leverages the latest, generally available Google Cloud and AI services as of November 2025.

## 1. Project Vision

To create a seamless platform that leverages **Gemini 2.5 Pro** and Google Cloud services to handle the entire podcasting lifecycle: from idea generation and interview preparation to post-production, AI-powered "Vibe Editing," and asset generation.

## 2. Core Technology & Services

-   **Frontend:** Next.js / React (on Vercel)
-   **Backend API:** Next.js API Routes (on Vercel)
-   **Heavy Lifting / Processing:** Google Cloud Run
-   **AI Engine:** **Gemini 2.5 Pro** (via its GA API)
-   **Meeting Creation:** Google Meet REST API
-   **File Ingestion:** Google Drive API (with Webhooks)
-   **Media Processing:** **Google Cloud Transcoder API**
-   **Transcription:** Google Cloud Speech-to-Text API
-   **Image Generation:** **Imagen 2** (via Vertex AI)
-   **Database:** Vercel Postgres (or similar)
-   **File Storage:** Google Cloud Storage

## 3. Actionable Implementation Plan

### Phase 1: Build the Post-Production & Vibe Editing Pipeline

**Step 1: Session Creation & Management**
-   **Task:** Create a Next.js API route (`/api/sessions/create`) that uses the user's OAuth token to create a Google Meet space via the REST API.
-   **Functionality:** This endpoint will save a record of the session to our database and redirect the user to the Meet URL.
-   **User Action:** The user joins the meeting and **manually clicks "Record."**

**Step 2: Google Drive Webhook & Cloud Run Trigger**
-   **Task:** Create two API endpoints on Vercel: one to set up the Google Drive webhook, and one to receive the notifications.
-   **Functionality:**
    -   When a session is created, we tell the Google Drive API to watch the user's "Meet Recordings" folder.
    -   When a new recording appears, the webhook on Vercel receives the notification.
    -   The Vercel function immediately triggers a new job on **Google Cloud Run**, passing along the file details. This keeps the Vercel function light and fast.

**Step 3: The Cloud Run Processing Job**
-   **Task:** Build a containerized service on Google Cloud Run to handle all the heavy lifting.
-   **Functionality:**
    1.  **Download:** The job uses the Google Drive API to download the `.mp4` recording and export the transcript from Google Docs as plain text.
    2.  **Transcode:** It calls the **Transcoder API** to extract a high-quality audio file (e.g., FLAC) from the `.mp4`.
    3.  **Store:** It uploads the audio file and the text transcript to a Google Cloud Storage bucket.
    4.  **Update DB:** It updates the session's record in our database with the file locations and sets the status to "Transcribing."

**Step 4: Deep Analysis with Gemini 2.5 Pro**
-   **Task:** Create a second Cloud Run job (or a subsequent step in the first) that runs after transcription.
-   **Functionality:**
    -   It takes the full, raw transcript.
    -   It sends the entire transcript to **Gemini 2.5 Pro** in a single call.
    -   It prompts the model to generate a rich JSON object containing a summary, show notes, chapters, and key quotes.
    -   It saves this structured data back to our database and updates the session status to "Ready for Vibe Editing."

**Step 5: Frontend Dashboard & UI**
-   **Task:** Build the user's main dashboard in our Next.js app.
-   **Functionality:**
    -   A "Start New Podcast Session" button.
    -   A list of all sessions with their current status (e.g., "Processing," "Ready for Vibe Editing").
    -   A view for a completed session that displays the transcript and all the AI-generated analysis.

---

### Phase 2: Vibe Editing & Asset Generation

-   **Task:** Build the core "Vibe Editing" interface.
-   **Functionality:**
    -   The user selects a target "vibe."
    -   We send the full transcript and the vibe to **Gemini 2.5 Pro** to get the rewritten version.
    -   Add a "Generate Cover Art" button that uses the summary to prompt **Imagen 2** and create episode artwork.

### Phase 3: Full Automation (Future)

-   **Task:** If desired, replace the manual recording step with a real-time, automated solution.
-   **Functionality:**
    -   Build a new Cloud Run service that uses the Google Meet Media API to join calls and capture audio in real-time.
    -   Build a Google Meet Add-on for a live, in-call control panel.