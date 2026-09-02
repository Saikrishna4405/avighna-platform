from typing import Optional
from pydantic import BaseModel

try:
    from pydantic import EmailStr
except ImportError:
    EmailStr = str

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "FIELD_OFFICER"
    district: Optional[str] = "Guwahati"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    district: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
