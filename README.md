# ⚡ Triage — Full-Stack Productivity SaaS

> A modern, secure workspace and notes management platform engineered with Spring Boot, React, and MySQL, featuring hierarchical document tree structures, stateless JWT authentication, and tokenized public sharing.

---

## 🎯 Overview

**Triage** is designed to provide seamless personal knowledge and productivity management. It implements a 3-tier hierarchical data model (Workspaces → Folders → Notes) with relational data integrity, sub-50ms token authentication, and collision-safe file asset processing, packaged within an interactive glassmorphic interface.

---

## ✨ Key Features

* **🔐 Stateless JWT Authentication:** Built on Spring Security 6 with stateless JSON Web Tokens, providing secure registration, login, and sub-50ms session authorization.
* **🌳 3-Tier Hierarchical Workspace Engine:** Organizes content into Workspaces, Folders, and Notes with JPA/Hibernate relational mapping and transactional unlinking for data integrity.
* **🔗 Secure Public Share Links:** Cryptographically random UUID token generation enables users to publish individual notes as read-only public web links without exposing private workspace hierarchies.
* **📁 Collision-Resistant File Storage:** Dynamic file upload pipeline mapping user avatars and workspace image assets with unique UUID schemas to eliminate filesystem naming collisions.
* **🎨 Modern Glassmorphic UI:** Built with React, Tailwind CSS, and Framer Motion, featuring dark/light themes, fluid animations, and real-time image previews.

---

## 🏗️ Architecture & Tech Stack

```text
┌──────────────────────────────────────────────────────────┐
│                   CLIENT (React + Vite)                  │
│       Tailwind CSS  │  Framer Motion  │  Axios HTTP      │
└────────────────────────────┬─────────────────────────────┘
                             │ (REST APIs + Bearer JWT)
                             ▼
┌──────────────────────────────────────────────────────────┐
│                SPRING BOOT BACKEND (Java)                │
│    Spring Security (JWT Filter)  │  REST Controllers     │
│    JPA / Hibernate ORM           │  Transactional Logic  │
└──────────────┬─────────────────────────────┬─────────────┘
               │                             │
               ▼                             ▼
      ┌─────────────────┐           ┌─────────────────┐
      │  MySQL Storage  │           │   File Storage  │
      │ (Data & Tokens) │           │ (UUID-based FS) │
      └─────────────────┘           └─────────────────┘
