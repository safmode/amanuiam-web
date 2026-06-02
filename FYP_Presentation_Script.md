# FYP Presentation Script: AmanuIAM (Campus Safety & Emergency Dispatch System)

Welcome to the presentation script for **AmanuIAM**. This guide is designed to flow naturally, sound humane, and directly impress your examiners.

---

## 1. Opening & Addressing the Examiners (The Warm Intro)

*Use this opening to address both Dr. Rafidah (who is following your progress) and Dr. Adznan (who is new to the project).*

> **"Assalamualaikum and a very good morning to our examiners, Dr. Rafidah and Dr. Adznan. Thank you for your time today. My name is [Your Name] (and my partner is [Partner's Name] - *if in a team*), and we are excited to present the final implementation of our Final Year Project: **AmanuIAM**, an Automated Campus Safety and Incident Reporting System designed specifically for the IIUM community.**
>
> **To start, I want to briefly bridge the gap between our project phases for Dr. Rafidah, while introducing the core concept to Dr. Adznan."**

### 🎙️ For Dr. Adznan (New Examiner - High-Level System Overview)
> **"Dr. Adznan, to give you a quick overview, AmanuIAM is a real-time emergency dispatch and incident reporting system. On university campuses like IIUM, students face security challenges ranging from wild animal encounters (like monkeys and snakes) to theft, harassment, or facility issues. The problem is that traditional campus security relies on phone calls, physical logbooks, or slow emails, which delays response times.**
> 
> **AmanuIAM solves this by providing a dual-platform ecosystem: a mobile app for students to report incidents and trigger a live GPS panic button, and a central Web Dashboard for security administrators to automatically analyze, map, and dispatch security officers to resolve emergencies in real-time."**

### 🎙️ For Dr. Rafidah (Continuation Examiner - Recalling FYP1)
> **"Dr. Rafidah, as a continuation from our FYP1 proposal, you might recall our initial design for an automated reporting structure. Since our last evaluation, we have fully completed the backend architecture, integrated real-time communication protocols, and deployed AI classification pipelines to automate the triage process. We have moved from conceptual wireframes to a fully functioning production-ready system utilizing Laravel, React (InertiaJS), MongoDB, and real-time integrations like Telegram and Hugging Face APIs."**

---

## 2. Core Business Flow & Live Product Demonstration (Wow Phase)

*The examiners want to see the final product immediately after explaining the business flow. Let's paint the picture of how the system works dynamically, then guide them through the live demo.*

### 🔄 The Business Flow Story (Explain first)
> **"Let's look at the core business flow of AmanuIAM. It operates in 5 simple, automated steps:"**
> 1. **Trigger / Report**: A student either triggers a **Live Panic Button** (which captures their real-time GPS coordinates) or submits an **Incident Report** with description and photo attachments.
> 2. **AI Triage**: The system intercept is fully automated. The report goes through our backend, where a **zero-shot classification AI model** determines the category (e.g., theft, animal threat, harassment) and detects the urgency level (urgent vs general).
> 3. **Real-time Alerting**: The admin dashboard instantly receives the emergency or report via **Pusher WebSockets**—no page refresh needed.
> 4. **Dispatch**: The admin views the incident on a live Google Map and dispatches an available security officer.
> 5. **Telegram Notification & Resolution**: The dispatched security officer receives an automated, formatted alert directly on **Telegram** with student details, location, and navigation links. Once resolved, the officer updates the status, closing the loop and notifying the student on their mobile app.

---

### 🖥️ Live Demonstration Steps (Perform on Screen)

Show your examiners the live system using this sequence:

#### **Step 1: The Welcome Page & Admin Authentication**
* **Action**: Show the landing page, and log in to the Admin Dashboard.
* **Talking Point**: *"Here, we are logging into the Admin Dashboard. The authentication uses JWT (JSON Web Tokens) to ensure a secure session for our security staff."*

#### **Step 2: Simulating a Student Panic Alert (Live Map Reaction)**
* **Action**: Trigger an emergency (you can simulate this via Postman or the student mobile app). Instantly show the admin dashboard screen popping up a red alert.
* **Talking Point**: *"Watch the screen. As soon as a student triggers the emergency button, a real-time modal pops up. The system doesn't poll the database; it uses Pusher WebSockets to push the alert instantly. We can see the student's exact live location mapped in real time on our Google Map component."*

#### **Step 3: AI Categorization and Traiting in Action**
* **Action**: Go to the **Reports** page. Show an incident with a description (e.g., *"There is a huge snake near KICT Mahallah Asiah cafe, please help!"*). Show how it was auto-assigned the category "Wild Animal" and marked as "Urgent".
* **Talking Point**: *"If we look at the reports list, here is a report submitted by a student. Notice that the category was auto-filled as 'Wild Animal' and the urgency set to 'Urgent'. This is powered by our integration with the Hugging Face Inference API using the facebook/bart-large-mnli zero-shot classification model. If the AI service is unavailable, our controller falls back to a custom keyword extraction matching system to guarantee reliability."*

#### **Step 4: Dispatching a Security Officer**
* **Action**: Click "Dispatch Officer" on the alert, select an officer, write brief dispatch notes, and hit confirm.
* **Talking Point**: *"Now, as an admin, I will assign Officer Bilal to this incident. I select his name, add a brief note, and click dispatch."*

#### **Step 5: The Telegram Integration (Show your phone/screen)**
* **Action**: Show the Telegram message received on the Telegram app.
* **Talking Point**: *"Immediately, Officer Bilal receives an automated Telegram message. It contains the student's name, matric number, contact number, and the exact coordinates. This eliminates the need for security officers to run separate bulky apps; they get notified right on their daily messaging app, Telegram, which keeps resources light and fast."*

#### **Step 6: Resolution & Statistics**
* **Action**: Mark the emergency as "Resolved" on the dashboard, then click on the **Statistics** and **Heatmap** page.
* **Talking Point**: *"Once the officer handles the situation, the status is updated to 'Resolved' which triggers a status update back to the student's mobile device via a Node.js push service. Finally, on the Heatmap page, you can see the density of reports across IIUM's campus (such as Mahallah Asiah, KICT, or KOE), helping management allocate security patrols to high-risk areas."*

---

## 3. Under the Hood: Models, Controllers, and Database Design

*Explain your software architecture with technical confidence.*

### 🗄️ Database Choice: MongoDB (NoSQL)
> **"For our database, we chose MongoDB instead of a traditional relational SQL database. Here is why:"**
> 1. **Schema Flexibility**: Incident reports are highly unstructured. One report might include suspect descriptions, while another might have injuries or facility damage details. Storing these as flexible BSON documents avoids sparse tables with lots of null columns.
> 2. **Geospatial Capabilities**: MongoDB natively supports GeoJSON coordinates, which allows us to store the latitude and longitude of emergencies and perform complex spatial queries.
> 3. **Native PHP integration**: We use `mongodb/laravel-mongodb` to bridge Eloquent with MongoDB collections seamlessly.

### 📁 Models (Data Structure)
> **"Let's look at our model layer. We have 7 primary collections:"**
> * **`Student`**: Represents the student profile (matrix number, email, phone, and Mahallah).
> * **`Officer`**: Security personnel with their ranks, cases handled, and their **Telegram Chat ID** to handle notifications.
> * **`Report`**: Stores reported incidents, carrying details like category, description, status, assigned officer, and attachments stored on **Cloudinary**.
> * **`Emergencies`**: Dedicated collection for active panic alerts, capturing real-time latitude/longitude and dispatch states.
> * **`UnregisteredReporter`**: To handle reports by anonymous students or guests. The system tracks their email or phone and links multiple reports to a dynamic guest profile to prevent spam.

### ⚙️ Controllers (Business Logic) & Advanced Trait Design
> **"Our business logic is clean and decoupled. The primary drivers are:"**
> * **`ReportController`**: Handles incident creation, AI categorization, priority assignment, and file uploads via Cloudinary.
> * **`EmergencyController`**: Manages the panic button lifecycle, dispatching, and resolving alerts.
> 
> **"One of our proudest implementations is the `LocationMatchingTrait`. When students trigger an alert, their phone sends GPS coordinates. In Laravel, we built a proximity matcher that:"**
> 1. Uses the **Haversine Formula** in PHP to calculate the spherical distance in meters between the student and a database of IIUM campus coordinates (e.g., Mahallah Asiah, KICT, Library).
> 2. If the student is within a defined radius (e.g., 200 meters), it automatically matches the incident to that campus landmark.
> 3. If GPS signals are weak and coordinates are not available, it uses **regex matching** and **keyword mapping** on the address text as a fallback. This guarantees that campus security always knows the exact zone to dispatch officers to.

---

## 4. Task Distribution (Referencing the iTa'leem Rubric)

*When examiners ask how the tasks were divided, present a clear, professional breakdown based on software engineering roles.*

> **"According to our project plan and the iTa'leem rubric guidelines, which evaluate planning, contribution, and system design, we divided our tasks clearly to ensure both members contributed equally across frontend, backend, and integration layers:"**

### 👥 Division of Labor Matrix

| Student Name | Role | Responsibilities & Rubric Scope |
| :--- | :--- | :--- |
| **Member A** (e.g., Lead Frontend & UI) | **UI/UX & Frontend Integration** | <ul><li>Designed the responsive web app using **React** and **Tailwind CSS**.</li><li>Implemented the **InertiaJS** client routing for SPA experience.</li><li>Built the Google Maps interactive dispatch component.</li><li>Implemented chart components in **Statistics** and the visual **Heatmap**.</li></ul> |
| **Member B** (e.g., Lead Backend & Devops) | **Database, Backend, & Third-Party APIs** | <ul><li>Designed the **MongoDB** database schema and collections.</li><li>Developed Laravel REST APIs and WebSocket configurations via **Pusher**.</li><li>Programmed the Hugging Face AI zero-shot classification logic.</li><li>Built the Telegram Bot API notification engine.</li></ul> |

*Both members collaborated closely on integration testing, system validation, and security configurations (JWT authentication and CSRF protection in Axios).*

---

## 5. Conclusion (The Strong Closing)

> **"In conclusion, AmanuIAM isn't just a conceptual project; it is a fully functioning, integrated, and AI-assisted campus safety system. By combining React, Laravel, MongoDB, Hugging Face AI, and Telegram notifications, we have built a solution that drastically minimizes incident response times and modernizes safety management at IIUM.**
>
> **Thank you, Dr. Rafidah and Dr. Adznan. We are now open to any questions you may have."**
