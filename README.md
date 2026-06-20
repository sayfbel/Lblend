# L'blend Premium Operations Platform

The official full-stack authentication and operational hub for **L'blend**, featuring a high-fidelity teal and gold aesthetic.

## 💡 Project Idea

L'blend is envisioned as a secure, role-based, and highly aesthetic central hub for managing users, administrative tasks, and operational workflows. Built with modern web technologies, it provides a seamless authentication experience (including JWT and Google Login) coupled with a premium UI using glassmorphism. It serves both as a secure gateway and a functional dashboard, offering customized and personalized experiences for regular users and administrators.


## 🚀 Features

- **Full Stack Auth**: JWT-based authentication with secure password hashing (Bcrypt).
- **Google Login**: Seamless integration with Google OAuth 2.0.
- **Email Notifications**: Welcome emails sent via SMTP (Gmail).
- **Role-Based Access**: Specialized views for `admin` and `user` roles.
- **Premium UI**: Ultra-modern design using Glassmorphism, Google Fonts, and Lucide Icons.
- **Responsive**: Fully responsive layout for all screen sizes.

---

## 🛠️ Setup Instructions

### 1. Database Setup (XAMPP)
1. Open **XAMPP Control Panel** and start **Apache** and **MySQL**.
2. Go to `http://localhost/phpmyadmin`.
3. Create a new database named `user_auth_db`.
4. Import the file `server/database.sql` into this database OR run the SQL code inside it in the SQL tab.

### 2. Backend Setup
1. Open a terminal in the `server` folder.
2. The `.env` file is already pre-configured for default XAMPP settings.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
   *The server will start on port 5000.*

### 3. Frontend Setup
1. Open a new terminal in the `client` folder.
2. Run:
   ```bash
   npm install
   npm run dev
   ```
   *The client will start, usually on port 5173.*

---

## 🔑 Usage

- **Registration**: Go to the Register page. You can choose your role (Admin or User) from the dropdown. 
- **Login**: Use your registered email and password.
- **Dashboard**: 
  - **Admin**: Will see system stats, health reports, and administrative logs.
  - **User**: Will see their profile status and personal task list.

## 📦 Tech Stack

- **Frontend**: React.js, Vite, Axios, React Router, Lucide Icons.
- **Backend**: Node.js, Express, MySQL2, JWT, Bcrypt.
- **Styling**: Vanilla CSS (Premium Glassmorphism).

---

Developed with ❤️ by saif belfaquir.