# CARE LINK AI

## 📌 About This Repository
This repository is a **personal copy** of a final year academic group project, uploaded for portfolio and reference purposes. The original project was developed collaboratively as part of a team/group assignment for the final year of engineering. No individual names are attached to this copy, as it represents a shared team effort.

> **Note:** This is not a standalone individual project — it reflects a group submission, and this copy is maintained here for personal reference and showcasing purposes only.

## 📖 Project Overview
**CARE LINK AI** is a smart, elder-friendly healthcare management platform designed to help families manage the health of elderly members more efficiently — especially when caregivers are coordinating remotely.

In today's fast-paced world, families often struggle to manage elderly healthcare due to fragmented medical records, missed medication doses, and a lack of centralized coordination between family members, caregivers, and doctors. Most existing health apps also aren't designed with elderly users in mind, making them difficult to use.

CARE LINK AI solves this by providing a single, centralized, and intelligent platform that supports medication adherence, real-time emergency alerts, secure health record storage, and seamless family collaboration.

## ❗ Problem Statement
Families face growing challenges in managing healthcare for elderly members due to:
- **Fragmented Medical Records** – Health data scattered across providers, platforms, and paper documents
- **Poor Medication Adherence** – Missed doses due to lack of reminders
- **Non-Elder-Friendly Digital Tools** – Most health apps are not intuitive for older users
- **Lack of Real-Time Coordination** – No centralized system for multiple caregivers to monitor and respond in real time

## ✨ Key Features
- **Smart Medicine Reminders** – Voice-command support and WhatsApp-based medication reminders
- **Pill Scanner** – Identify medicines by photo using AI/image recognition
- **AI Symptom Checker** – Suggests possible conditions/advice based on selected symptoms (not a diagnosis)
- **Health Tracker** – Track vitals like BP, sugar, weight, sleep, and water intake with visual graphs
- **Doctor Connect** – Direct communication access with healthcare providers
- **Family Mode** – Manage health profiles of multiple family members from a single account
- **Medical Vault** – Secure, centralized storage for medical records, prescriptions, and reports
- **Emergency SOS Alerts** – Real-time alerts sent to family and doctors during emergencies
- **Health Habit Gamification** – Streaks and badges to encourage healthy habits
- **Personalized Meal Plan Generator** – AI-generated meal plans based on health conditions and goals

## 🛠️ Tech Stack
- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **AI Integration:** Gemini AI / OpenRouter API for chatbot, symptom checking, and health insights
- **Notifications:** WhatsApp API integration for reminders and alerts
- **OCR:** Tesseract (for pill scanning/image recognition)

## 🏗️ System Architecture
The platform follows a role-based architecture supporting four types of users:
- **Elders** – Primary users managing their own health
- **Family/Caregivers** – Monitor and support elderly family members remotely
- **Doctors** – Provide medical advice and updates
- **Admin** – Manages users, system monitoring, and data security

All data flows through a centralized AI platform connected to a secure database storing medical records and history.

## 📂 Project Structure
```
care-link/
├── care-link-backend/        # Node.js + Express backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
├── care-link-frontend/       # React (Vite) frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── index.html
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js and npm installed
- MongoDB instance (local or cloud)
- API keys for AI service (Gemini/OpenRouter) and WhatsApp integration

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/care-link-ai.git
cd care-link-ai

# Setup backend
cd care-link-backend
npm install
# Create a .env file with required variables (MONGO_URI, JWT_SECRET, OPENROUTER_API_KEY, etc.)
npm start

# Setup frontend (in a new terminal)
cd care-link-frontend
npm install
npm run dev
```

## ⚠️ Project Status
This project was developed and submitted as a final year academic project. It is functionally complete with core features implemented, and there is scope for future enhancements such as telehealth integration, predictive analytics, and offline support.

## 🔮 Future Scope
- Telehealth integration for virtual doctor consultations
- Predictive analytics for early health risk detection
- Offline mode support
- Advanced personalization using deep learning models

## 📄 Disclaimer
This project was built for academic and educational purposes as part of a college final year submission. It is not intended for real-world medical use, and the AI-based symptom checker does not provide medical diagnoses.