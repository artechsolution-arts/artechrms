from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False)        # LinkedIn | Facebook | Instagram
    account_name = Column(String(200))                   # Display name / page name
    account_id = Column(String(200))                     # Platform user/page ID
    access_token = Column(Text)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    page_id = Column(String(200), nullable=True)         # Facebook page ID
    page_name = Column(String(200), nullable=True)
    ig_user_id = Column(String(200), nullable=True)      # Instagram Business Account ID
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SocialPost(Base):
    __tablename__ = "social_posts"

    id = Column(Integer, primary_key=True, index=True)
    job_opening_id = Column(Integer, ForeignKey("job_openings.id"), nullable=False)
    platform = Column(String(50))
    social_account_id = Column(Integer, ForeignKey("social_accounts.id"), nullable=True)
    post_id = Column(String(200), nullable=True)         # Platform post ID
    post_url = Column(String(500), nullable=True)
    status = Column(String(50), default="pending")       # pending | posted | failed
    error_message = Column(Text, nullable=True)
    posted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
