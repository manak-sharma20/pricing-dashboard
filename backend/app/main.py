from fastapi import FastAPI
from app.db.database import Base, engine
from app.models import user


Base.metadata.create_all(bind=engine)

app=FastAPI()


@app.get("/")
def root():
    return ""
