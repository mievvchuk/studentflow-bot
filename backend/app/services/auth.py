from sqlalchemy.orm import Session

from app.models import User


def get_or_create_telegram_user(db: Session, telegram_user: dict) -> User:
    telegram_id = int(telegram_user["id"])
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    values = {
        "username": telegram_user.get("username"),
        "first_name": telegram_user.get("first_name"),
        "last_name": telegram_user.get("last_name"),
        "photo_url": telegram_user.get("photo_url"),
    }
    if user:
        for key, value in values.items():
            setattr(user, key, value)
    else:
        user = User(telegram_id=telegram_id, **values)
        db.add(user)
    db.commit()
    db.refresh(user)
    return user

