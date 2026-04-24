from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)