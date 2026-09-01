import secrets
import os
from app.models.password_reset import PasswordResetToken
from app.schemas.user import ResetPasswordRequest
from app.services.email_service import send_password_reset_email
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.database.dependencies import get_db
from app.models.user import User
from app.auth.security import hash_password, verify_password, create_access_token

from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

from app.auth.dependencies import get_current_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(
        user_data.password
    )

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse
)
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == user_data.email
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

    access_token = create_access_token(
        user.id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post(
    "/forgot-password"
)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    # Do not reveal whether an email exists.
    if not user:

        return {
            "message":
                "If this email is registered, "
                "a password reset link has been created."
        }

    token = secrets.token_urlsafe(32)

    expires_at = (
        datetime.utcnow()
        + timedelta(minutes=30)
    )

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
        used=False
    )

    db.add(reset_token)
    db.commit()

    frontend_url=os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )

    reset_link=(
        f"{frontend_url}/reset-password"
        f"?token={token}"
    )

    try:
        send_password_reset_email(
            recipient_email=user.email,
            reset_link=reset_link 
        )

    except Exception as error:
        print(
            "Password reset email failed:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to send password reset email."
        )
    

    return {
        "message":
        "If this email is registered,"
        "a password reset link has been sent."
        
    }


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post(
    "/forgot-password"
)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    # Do not reveal whether an email exists.
    if not user:

        return {
            "message":
                "If this email is registered, "
                "a password reset link has been sent."
        }

    token = secrets.token_urlsafe(32)

    expires_at = (
        datetime.utcnow()
        + timedelta(minutes=30)
    )

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
        used=False
    )

    db.add(reset_token)
    db.commit()

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )

    reset_link = (
        f"{frontend_url}/reset-password"
        f"?token={token}"
    )

    try:

        send_password_reset_email(
            recipient_email=user.email,
            reset_link=reset_link
        )

    except Exception as error:

        print(
            "Password reset email failed:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to send password reset email."
        )

    return {
        "message":
            "If this email is registered, "
            "a password reset link has been sent."
    }



@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    reset_token = db.query(
        PasswordResetToken
    ).filter(
        PasswordResetToken.token == request.token,
        PasswordResetToken.used == False
    ).first()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )

    if reset_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )

    user = db.query(User).filter(
        User.id == reset_token.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset request."
        )

    user.hashed_password = hash_password(
        request.new_password
    )

    reset_token.used = True

    db.commit()

    return {
        "message": "Password reset successful."
    }
# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):

    return current_user