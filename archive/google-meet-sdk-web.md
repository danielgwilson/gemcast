# Google Meet SDK for Web

## Research Summary

Google Meet provides several SDKs and APIs for web developers to integrate their applications directly into the Meet experience.

### Key Findings:

1.  **Google Meet Add-ons SDK:** This is the most promising tool for our project. It allows embedding web applications directly within the Google Meet interface. This could be used to create a custom "control panel" for our podcasting tool, accessible to participants during the meeting.

2.  **Google Meet REST API:** This API is for managing meetings (creating, updating, etc.) and accessing post-meeting artifacts. It's a necessary component for the backend but doesn't provide in-meeting functionality.

3.  **Google Meet Media API (Developer Preview):** As mentioned in the recording research, this API provides real-time access to audio and video streams. This is the key to building custom recording and transcription solutions.

4.  **Google Meet Live Sharing SDK (Preview):** This SDK is focused on co-watching and shared experiences. While interesting, it's less relevant to our core podcasting functionality.

## Implications for the Project

- The **Add-ons SDK** is a game-changer for the user experience. We can build a custom UI that lives inside Google Meet, allowing hosts to manage the podcasting session, see guest information, and potentially trigger actions.
- The combination of the **Add-ons SDK (for the frontend) and the REST API (for the backend)** will form the core of our integration.
- To achieve full automation of recording and real-time transcription, we will need to investigate and apply for the **Media API Developer Preview**.
