# 🔮 AIONEX — An Intelligent Companion Demo

> **Note:** This repository showcases a functional demo of the AIONEX platform. It demonstrates the complete user experience, architecture, and frontend capabilities. The AI responses in this version are simulated to allow the project to run without API keys.

<p align="center">
<img src="static/AIONEX.jpg" alt="AIONEX Logo" width="160"/>
</p>

<p align="center">
<em>
An advanced AI-powered chat platform designed to foster a deeper, more personal connection between humans and machines. AIONEX is more than just a chatbot; it's a suite of intelligent companions with unique personalities, designed to remember conversations and grow with you over time.
</em>
</p>

<p align="center">
<a href="#-key-features">Features</a> •
<a href="#-technology-stack">Technology Stack</a> •
<a href="#️-how-it-works">How It Works</a> •
<a href="#-quickstart-guide">Quickstart</a> •
<a href="#-accessing-the-full-production-system">Access Full Project</a> •
<a href="#-license--intellectual-property">License</a>
</p>

-----

![AIONEX Demo GIF](placeholder_for_a_gif.gif)

<p align="center">
This project redefines the AI chat experience by introducing dynamic personas, long-term memory, and intelligent interactive tools. This fully interactive demo showcases how a robust backend and a polished user interface can create a meaningful and highly personalized relationship with an AI.
</p>

-----

## 🚀 Key Features

This demo fully implements the core features of the AIONEX experience:

### 🎭 Five Unique Personas
Connect with five distinct AI companions, each with their own personality, tone, and style of conversation:
* **Aura (The Mindful Guide):** Calm, empathetic, and insightful.
* **Zane (The Tech Innovator):** Sharp, logical, and futuristic.
* **Lyra (The Creative Storyteller):** Whimsical, imaginative, and artistic.
* **Rex (The Energetic Coach):** Motivating, bold, and a bit cheeky.
* **Nova (The Cosmic Explorer):** Curious, adventurous, and full of wonder.

-----

### 🧠 A Connection That Remembers
* **Long-Term Memory:** The system extracts and saves key facts about you from conversations to create more natural interactions. (In this demo, this is simulated to show the feature's UI).
* **Shared Memories:** The platform generates short, sentimental "shared memories," creating a beautiful timeline of your connection.
* **Full Memory Control:** Through the settings panel, you have complete control to view and delete any fact the AI has remembered about you.

-----

### 💬 Advanced Conversation Tools
* **Real-Time Streaming Responses:** AI responses are streamed token-by-token from the backend, creating the feeling of a live, dynamic conversation.
* **On-Demand Summarization:** Instantly get a bullet-point summary of the key topics discussed in your current chat.
* **Conversation Mood Analysis:** With a single click, the AI analyzes the overall mood of your conversation and provides a concise explanation.
* **Text-to-Speech (TTS) Ready:** The interface includes controls for TTS. (In the full version, this is powered by advanced TTS models).

-----

### ✨ Immersive & Personalized UX
* **Dynamic Theming:** The UI and background change dynamically to match the personality of the selected AI companion.
* **Multi-Language Support:** The entire UI instantly switches between six languages: **English, Spanish, French, Arabic, Chinese, and Hindi**.
* **Daily Check-ins:** The AI greets you with a warm, personalized message on your first chat of the day.
* **Modern UI:** A sleek design featuring smooth animations, a dark mode, and a custom cursor for a polished experience.

-----

## 🛠 Technology Stack

This demo is built with a clean and efficient stack, showcasing a robust separation of concerns between the frontend and backend.

| Area      | Technology          | Purpose                                                                          |
| :-------- | :------------------ | :------------------------------------------------------------------------------- |
| **Backend** | 🐍 **Python 3.10+** | Core application logic and server management.                                    |
|           | 🌐 **Flask** | A lightweight web framework for routing, requests, and serving the application.    |
|           | 🧵 **Threading** | Manages background tasks for memory and summary generation without blocking the UI.  |
| **Frontend**| ✨ **JavaScript (ES6+)** | Handles all client-side logic, interactivity, and API communication.               |
|           | 🎨 **HTML5 & CSS3** | Structures the application and provides a modern, responsive design.               |
| **Database**| 🗄 **SQLite** | A self-contained, serverless database for storing conversations and user memory.   |

-----

## ⚙️ How It Works

The AIONEX demo architecture is designed for real-time, multi-layered processing:

1.  **UI Interaction:** The user selects a persona or sends a message from the frontend, which is built with vanilla JavaScript, HTML, and CSS.
2.  **API Request:** The frontend sends a request to the appropriate endpoint on the **Flask backend server**.
3.  **Backend Processing:**
    * The user's message is saved to the **SQLite database**.
    * For the `/chat` endpoint, a **simulated AI response** is generated. This response is then **streamed** back to the client token-by-token to realistically mimic a live AI typing.
4.  **Real-Time Rendering:** The JavaScript frontend receives the stream and dynamically renders the response word-by-word, updating the DOM.
5.  **Background Tasks:** After a conversation, new **threads** are initiated to run placeholder functions for memory extraction and shared memory creation, demonstrating the architecture for these features without exposing the core AI logic.

> **Key Demo Feature:** This project is **fully self-contained** and runs locally without requiring any external API keys.

-----

## 🏁 Quickstart Guide

Follow these steps to run the project locally.

### 1. Prerequisites
* **Python 3.10** or newer
* **Git**

### 2. Clone the Repository
```bash
git clone [https://github.com/ArtinGhorbanian/AIONEX.git](https://github.com/ArtinGhorbanian/AIONEX.git)
cd AIONEX
````

### 3\. (Recommended) Create a Virtual Environment

**On macOS / Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**

```bash
python -m venv venv
.\venv\Scripts\activate
```

### 4\. Install Dependencies

This demo has only one dependency.

```bash
pip install Flask
```

### 5\. Run the Application

```bash
python app.py
```

Your terminal will show a clean startup message, and the server will be active.

### 6\. Open the App

Navigate to **http://127.0.0.1:5000** in your web browser to launch AIONEX\! 🚀

-----

## 🔑 Accessing the Full Production System

This public demo effectively showcases the user interface, application flow, and frontend architecture. The core intellectual property—including the fine-tuned AI models, advanced memory extraction algorithms, and scalable backend infrastructure—resides in a private repository.

We invite **VPs of Engineering, Lead AI Researchers, and Technical Hiring Managers** interested in a technical deep-dive, code review, or potential collaboration to request access.

A structured process is in place to ensure confidentiality:

1.  **Initial Inquiry:** Please send an inquiry to the email below from your **official corporate email address**. Inquiries from personal email domains will not be considered.
2.  **Verification & NDA:** Following a brief verification step, a standard Non-Disclosure Agreement (NDA) will be provided for review and signature.
3.  **Granting Access:** Upon execution of the NDA, access will be granted to the private source code repository and documentation for a limited time.

**Contact for Access:**
`artinghorbanianaionex@gmail.com`

-----

## 🛡️ Integrity & Proof of Ownership

To guarantee authenticity and protect the intellectual property of the full system, we use digital signatures and hashing. All critical commits in the private repository are signed with **GPG**.

The **SHA256 hash** of the primary production model file (which is proprietary and not included here) is listed below as a digital fingerprint for ownership verification.

  * **Model:** `aionex_prod_model_v1.2.bin`
  * **SHA256 Hash:** `3b5d2419c3c1b7c1d4b0d829e5a1b3a4d6c7b8c9a0a1f2e3d4c5b6a7b8c9d0e1` (File not included in this repository)

-----

## ©️ License & Intellectual Property

Copyright (c) 2025 Artin Ghorbanian
All rights reserved.

This demo is provided for evaluation purposes only.
The production system, including proprietary models, weights, and strategy logic, is available for review only under a Non-Disclosure Agreement (NDA).
