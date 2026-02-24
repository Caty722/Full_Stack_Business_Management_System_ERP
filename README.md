# 💼 Ferwa One – Next-Gen ERP & Business Suite

An advanced, **AI-collaborated Enterprise Resource Planning (ERP)** platform designed for modern SMEs. Ferwa One centralizes complex business operations—including GST-compliant invoicing, real-time inventory tracking, and dynamic financial reporting—into a premium, high-performance web experience.

**Developed in partnership with Antigravity (Advanced Agentic AI)**, this project demonstrates a "next-gen" development workflow where production-ready software is built through high-level technical orchestration.

---

## 📌 Project Overview

Ferwa One is designed as a **modular business OS**:

- **Billing & Invoicing** → Automated generation of GST and Non-GST tax invoices with professional templates.
- **Inventory Engine** → Real-time stock tracking with low-stock alerts and automatic updates upon sale.
- **Client Ecosystem** → Dedicated portals for customer management, tiered pricing, and quotation builders.
- **Financial Intelligence** → Interactive dashboards visualizing revenue trends and profit margins.

---

## 🚀 Features

- **Premium UI/UX** – Stunning dark/light mode interface with glassmorphism aesthetics and smooth Framer Motion animations.
- **One-Click GST Invoicing** – Precision-engineered tax invoice builder with automatic HSN and tax calculations.
- **Quotation System** – Dynamic quotation builder with live preview and "Amount in Words" conversion.
- **Pixel-Perfect PDF Export** – Custom PDF engine ensuring 1:1 parity between the web UI and A4-compliant document exports.
- **Cloud-Synced Data** – Real-time data persistence and secure user authentication via Firebase Firestore.
- **Advanced Dashboards** – Separate revenue tracking for GST/Non-GST sales with integrated profit analysis.
- **Storefront Website** – Integrated professional landing page with Vision, Services, and Product showcases.

---

## 🛠️ Tech Stack

- **React 19** – Modern UI components and state management.
- **Vite** – Hyper-fast frontend tooling and HMR.
- **Firebase** – Firestore (NoSQL database) and Authentication.
- **Framer Motion** – Premium animations and micro-interactions.
- **Recharts** – Data visualization and financial performance graphs.
- **jsPDF & html2canvas** – Custom-built professional document generation.
- **Lucide React** – High-quality iconography across all dashboards.

---

## 📂 Project Structure

```bash
Ferwa-One/
│── src/
│   ├── components/        # Reusable UI (Modals, Invoice Layouts, Sidebar)
│   ├── pages/
│   │   ├── dashboard/     # ERP Modules (Billing, Inventory, Reports)
│   │   ├── website/       # Landing page sections (Hero, About, Vision)
│   │   └── auth/          # Login & Signup flows
│   ├── context/           # State management (Auth, Shop, Theme)
│   ├── lib/               # Core utility logic (PDF Generators, Data Helpers)
│   └── styles/            # Global styling system & Theme tokens
│── public/                # Static assets & Logos
│── package.json           # Dependencies & Scripts
│── firebase.json          # Hosting & Database rules
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/yourusername/ferwa-one.git
cd ferwa-one
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Set Up Firebase
- Create a new project in the [Firebase Console](https://console.firebase.google.com/).
- Enable Firestore and Authentication.
- Copy your Firebase config and place it in a `.env` file (refer to `src/context/ShopContext.jsx` for required keys).

### 4️⃣ Run Development Server
```bash
npm run dev
```

---

## 📊 Business Intelligence Example

```javascript
// Profit Calculation Logic Example
const calculateProfit = (invoice) => {
  const totalSale = invoice.totalAmount;
  const costPrice = invoice.items.reduce((acc, item) => acc + item.purchasePrice, 0);
  return totalSale - costPrice; // Tracked automatically in Reports dashboard
}
```

---

## 🔮 Future Enhancements

- **Multi-Store Support** – Manage multiple business outlets from a single master dashboard.
- **AI Inventory Insights** – Predictive stock ordering based on sales history patterns.
- **WhatsApp Integration** – Share invoices and quotations directly to client phone numbers.
- **Mobile Companion App** – Real-time business alerts and stock management on the go.

---

## 📜 License

This project is **for educational and personal use only**. All rights reserved. Built with the support of **Antigravity (Google DeepMind)**.
