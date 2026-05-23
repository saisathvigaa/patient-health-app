# Patient Health Dashboard App

A full-stack web application that lets users upload blood report PDFs/images, automatically extracts lab values via OCR (Google Cloud Vision), and generates a comprehensive health dashboard with trend charts.

## Architecture

```
patient-health-app/
├── frontend/          # Next.js 15 + Tailwind CSS + Chart.js
├── backend/           # Python FastAPI + SQLAlchemy + Google Vision
├── docker-compose.yml # Local dev (PostgreSQL + API)
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Chart.js, Zustand |
| Backend | Python FastAPI, async SQLAlchemy, PostgreSQL |
| OCR | Google Cloud Vision API |
| PDF Processing | PyMuPDF |
| Auth | JWT (python-jose + bcrypt) |
| Deployment | Vercel (frontend) + Railway (backend) |

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (for PostgreSQL)
- Google Cloud Vision API credentials

### 1. Start the database
```bash
docker-compose up -d db
```

### 2. Start the backend
```bash
cd backend
cp .env.example .env
# Edit .env with your settings
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app
Visit http://localhost:3000

## API Documentation
Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Reference Implementation
This app is based on the static dashboard at:
- Live: https://patient-history-lakshmanan.netlify.app/
- Source: https://github.com/saisathvigaa/patient-health-dashboard

## License
MIT
