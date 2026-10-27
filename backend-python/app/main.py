from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.seed import seed_data
from app.routers import vehicles, tariffs, availability, bookings, locations, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed_data()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

logger = logging.getLogger("rentcar.api")

@app.exception_handler(RequestValidationError)
async def sanitized_validation_error(_request, exc: RequestValidationError):
    # Pydantic's default errors include the rejected input; omit it to avoid
    # reflecting/logging customer names, phone numbers, or email addresses.
    details = [
        {"loc": error.get("loc", []), "msg": error.get("msg", "Invalid value"), "type": error.get("type", "value_error")}
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": details})

# CORS для взаємодії з клієнтським Nginx
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Idempotency-Key"],
)

# Підключення роутерів
app.include_router(vehicles.router)
app.include_router(tariffs.router)
app.include_router(availability.router)
app.include_router(bookings.router)
app.include_router(locations.router)
app.include_router(admin.router)

@app.get("/live")
async def liveness():
    return {"status": "alive", "service": settings.PROJECT_NAME}

@app.get("/ready")
@app.get("/health")
async def readiness(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.exception("Database readiness check failed")
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    return {
        "status": "ready",
        "service": "RentCar UA Python Core API",
        "version": settings.VERSION
    }
