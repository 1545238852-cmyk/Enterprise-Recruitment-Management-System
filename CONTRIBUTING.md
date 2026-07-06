# Contributing

## Development

### Backend

```powershell
cd ai
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8001
```

### Frontend

```powershell
cd ai\frontend
npm install
npm run dev
```

## Testing

### Backend tests

```powershell
cd ai
.venv\Scripts\python.exe -m pytest backend\tests -q
```

### Frontend build

```powershell
cd ai\frontend
npm run build
```

## Pull request checklist

- keep runtime artifacts out of git
- update docs when behavior changes
- do not commit secrets
- verify backend tests or frontend build before merge
