from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models

print("Initializing database...")
models.Base.metadata.create_all(bind=engine)
print("Database initialized successfully.")

import auth
import products
import recommendations
import audit

app = FastAPI(title="Klypup Pricing Intelligence API")

import os

# Define allowed origins
default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
env_origins = os.getenv("CORS_ORIGINS", "").split(",")
origins = [o.strip() for o in env_origins if o.strip()] + default_origins

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(recommendations.router)
app.include_router(audit.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Klypup Pricing Intelligence API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
