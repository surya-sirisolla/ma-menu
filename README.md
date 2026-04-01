# 🍽️ MaMenu

MaMenu is a full-stack menu management system designed to streamline menu creation, management, and delivery for modern applications.

Built with a high-performance Go backend and a scalable Next.js frontend, MaMenu focuses on speed, usability, and production-grade architecture.

---

## 🚀 Features

* 🔐 Authentication & Authorization (RBAC ready)
* 📋 Menu creation & management
* ⚡ High-performance REST APIs (Golang)
* 🎨 Modern UI with Next.js + TypeScript
* 📊 Scalable architecture for real-world usage
* 🔄 Easy integration with third-party services

---

## 🏗️ Tech Stack

### Backend

* Go (Golang)
* Gin / gRPC
* MongoDB 
* REST APIs

### Frontend

* Next.js
* TypeScript
* Tailwind CSS

### DevOps / Tools

* Docker
* GitHub
* Postman / Swagger

---

## 📂 Project Structure

```
MaMenu/
│
├── backend/        # Golang services
│   ├── cmd/
│   ├── internal/
│   ├── routes/
│   └── config/
│
├── frontend/       # Next.js app
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── utils/
│
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

* Go 1.20+
* Node.js 18+
* npm / yarn
* MongoDB

---

## 🔧 Backend Setup (Go)

```bash
cd backend

# install dependencies
go mod tidy

# run server
go run cmd/server main.go
```

Backend runs on: `http://localhost:8080`

---

## 💻 Frontend Setup (Next.js)

```bash
cd frontend

# install dependencies
npm install

# run app
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## 🔐 Environment Variables

Create `.env` files in both backend and frontend.

### Backend `.env`

```
PORT=8080
DB_URI=your_database_url
JWT_SECRET=your_secret
```

### Frontend `.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 📸 Screenshots

*Add screenshots of your UI here (very important for visibility)*

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create your feature branch

   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## 🐛 Issues

Feel free to open issues for:

* Bug reports
* Feature requests
* Improvements

---

## 📌 Roadmap

* [ ] Add role-based access control (RBAC)
* [ ] Implement caching layer (Redis)
* [ ] Add analytics dashboard
* [ ] Dockerize the application
* [ ] CI/CD pipeline

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Sirisolla Jaya Surya**

* Backend Engineer (Go, Kafka, Microservices)
* Passionate about scalable systems & distributed architecture

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
