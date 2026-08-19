from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.security import hash_password, verify_password, create_access_token
from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, TokenResponse
from app.auth.dependencies import get_current_user

router=APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data:UserCreate,
    db :Session=Depends(get_db)
):
    existing_user=db.query(User).filter(
        User.email==user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password=hash_password(user_data.password)

    new_user=User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post(
    "/login",
    response_model=TokenResponse
)

def login_user(
    user_data: UserLogin, 
    db:Session=Depends(get_db)

):
    user=db.query(User).filter(
        User.email==user_data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(
        user_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    access_token=create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type":"bearer"
    }

@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User=Depends(get_current_user)
):
    return current_user