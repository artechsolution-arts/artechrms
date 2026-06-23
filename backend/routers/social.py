"""
Social Media OAuth + Posting
Env variables required:
  LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
  FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
  APP_BASE_URL  (e.g. https://yourapp.com or http://localhost:8000)
"""
import os
import uuid
import time
import secrets
from datetime import datetime, timedelta
from typing import Optional, List

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.social import SocialAccount, SocialPost
from backend.models.recruitment import JobOpening

router = APIRouter(prefix="/api/social", tags=["Social Media"])

# ── Simple in-memory OAuth state store (per-request CSRF protection) ──────────
_oauth_states: dict[str, dict] = {}


def _base_url() -> str:
    return os.getenv("APP_BASE_URL", "http://localhost:8000").rstrip("/")


# ── Credentials from env ───────────────────────────────────────────────────────

def _linkedin_creds():
    return os.getenv("LINKEDIN_CLIENT_ID", ""), os.getenv("LINKEDIN_CLIENT_SECRET", "")


def _facebook_creds():
    return os.getenv("FACEBOOK_APP_ID", ""), os.getenv("FACEBOOK_APP_SECRET", "")


# ── Post content generator ─────────────────────────────────────────────────────

def _build_post_text(opening: JobOpening, platform: str) -> str:
    title = opening.title or "Open Position"
    desc = (opening.description or "")[:300]
    ctc = f"₹{int(opening.expected_ctc):,}" if opening.expected_ctc else None
    closes = str(opening.closes_on) if opening.closes_on else None
    positions = opening.no_of_positions or 1

    if platform == "LinkedIn":
        lines = [
            f"🚀 We're Hiring: {title}",
            "",
            f"Artech Solutions is looking for a talented {title} to join our growing team.",
        ]
        if desc:
            lines += ["", desc]
        lines += [""]
        if positions > 1:
            lines.append(f"👥 {positions} openings")
        if ctc:
            lines.append(f"💰 CTC: {ctc}")
        if closes:
            lines.append(f"📅 Apply by: {closes}")
        lines += [
            "",
            f"#Hiring #{''.join(title.split())} #Jobs #Careers #ArtechSolutions #Recruitment",
        ]
        return "\n".join(lines)

    elif platform == "Facebook":
        lines = [
            f"🎯 We're Hiring — {title}!",
            "",
            f"Artech Solutions is expanding! We're looking for a {title} to join our team.",
        ]
        if desc:
            lines += ["", desc]
        lines += [""]
        if positions > 1:
            lines.append(f"✅ {positions} positions available")
        if ctc:
            lines.append(f"💰 Package: {ctc}")
        if closes:
            lines.append(f"⏰ Last date: {closes}")
        lines += ["", "👉 Apply now via our website or DM us!", ""]
        lines.append(f"#Hiring #Jobs #ArtechSolutions #{''.join(title.split())}")
        return "\n".join(lines)

    elif platform == "Instagram":
        lines = [
            f"We're Hiring! 🚀",
            f"",
            f"Position: {title}",
        ]
        if ctc:
            lines.append(f"Package: {ctc}")
        if closes:
            lines.append(f"Apply by: {closes}")
        if desc:
            lines += ["", desc[:200]]
        lines += [
            "",
            "#WeAreHiring #JobAlert #ArtechSolutions #Careers #NowHiring",
            f"#{(''.join(title.split()))[:30]} #Jobs #HiringNow",
        ]
        return "\n".join(lines)

    return f"We're hiring: {title}! Contact us for details."


# ── Instagram image generation ─────────────────────────────────────────────────

def _generate_ig_image(title: str, opening_id: int) -> Optional[str]:
    """Generate a simple gradient PNG for Instagram posts using Pillow."""
    try:
        from PIL import Image, ImageDraw, ImageFont
        import textwrap

        img = Image.new("RGB", (1080, 1080))
        draw = ImageDraw.Draw(img)

        # Gradient background
        for y in range(1080):
            r = int(102 + (118 - 102) * y / 1080)
            g = int(126 + (75 - 126) * y / 1080)
            b = int(234 + (162 - 234) * y / 1080)
            draw.line([(0, y), (1080, y)], fill=(r, g, b))

        # Semi-transparent overlay
        overlay = Image.new("RGBA", (1080, 1080), (0, 0, 0, 80))
        img = img.convert("RGBA")
        img = Image.alpha_composite(img, overlay).convert("RGB")
        draw = ImageDraw.Draw(img)

        # Text
        try:
            font_big = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 90)
            font_med = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 55)
            font_sm  = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
        except Exception:
            font_big = font_med = font_sm = ImageFont.load_default()

        draw.text((540, 300), "WE'RE HIRING", font=font_big, fill="white", anchor="mm")

        # Title wrap
        wrapped = textwrap.wrap(title, width=20)
        y_pos = 500
        for line in wrapped[:3]:
            draw.text((540, y_pos), line, font=font_med, fill="white", anchor="mm")
            y_pos += 80

        draw.text((540, 750), "Artech Solutions", font=font_sm, fill=(255, 255, 255, 200), anchor="mm")
        draw.text((540, 820), "artech-solutions.com", font=font_sm, fill=(200, 200, 255, 180), anchor="mm")

        from io import BytesIO as _BytesIO
        from backend import storage as _storage
        fname = f"ig_{opening_id}_{int(time.time())}.png"
        buf = _BytesIO()
        img.save(buf, format="PNG")
        file_url = _storage.upload_file(buf.getvalue(), "ig_posts", fname)
        return f"{_base_url()}{file_url}"
    except Exception:
        return None


# ── Config check ───────────────────────────────────────────────────────────────

@router.get("/config")
def get_config():
    li_id, li_sec = _linkedin_creds()
    fb_id, fb_sec = _facebook_creds()
    return {
        "LinkedIn": {"configured": bool(li_id and li_sec), "client_id": li_id},
        "Facebook": {"configured": bool(fb_id and fb_sec), "app_id": fb_id},
        "Instagram": {"configured": bool(fb_id and fb_sec), "note": "Uses same Meta/Facebook app"},
        "app_base_url": _base_url(),
    }


# ── Connected accounts ─────────────────────────────────────────────────────────

@router.get("/accounts")
def list_accounts(db: Session = Depends(get_db)):
    accounts = db.query(SocialAccount).filter(SocialAccount.is_active == True).all()
    return [
        {
            "id": a.id,
            "platform": a.platform,
            "account_name": a.account_name,
            "account_id": a.account_id,
            "page_name": a.page_name,
            "ig_user_id": a.ig_user_id,
            "token_expires_at": str(a.token_expires_at) if a.token_expires_at else None,
        }
        for a in accounts
    ]


@router.delete("/accounts/{account_id}")
def disconnect_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(404, "Account not found")
    account.is_active = False
    db.commit()
    return {"ok": True}


# ── LinkedIn OAuth ─────────────────────────────────────────────────────────────

@router.get("/auth/linkedin")
def linkedin_auth():
    client_id, client_secret = _linkedin_creds()
    if not client_id:
        raise HTTPException(400, "LinkedIn credentials not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET env variables.")

    state = secrets.token_urlsafe(32)
    _oauth_states[state] = {"platform": "LinkedIn", "ts": time.time()}

    redirect_uri = f"{_base_url()}/api/social/callback/linkedin"
    scope = "openid profile email w_member_social"
    url = (
        f"https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scope.replace(' ', '%20')}"
        f"&state={state}"
    )
    return {"url": url}


@router.get("/callback/linkedin")
async def linkedin_callback(code: str = Query(None), state: str = Query(None), error: str = Query(None), db: Session = Depends(get_db)):
    if error:
        return HTMLResponse(_oauth_done_html("LinkedIn", False, f"Access denied: {error}"))

    if not state or state not in _oauth_states:
        return HTMLResponse(_oauth_done_html("LinkedIn", False, "Invalid state parameter"))

    _oauth_states.pop(state, None)

    client_id, client_secret = _linkedin_creds()
    redirect_uri = f"{_base_url()}/api/social/callback/linkedin"

    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_resp = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": client_id,
                "client_secret": client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_data = token_resp.json()

        if "access_token" not in token_data:
            return HTMLResponse(_oauth_done_html("LinkedIn", False, str(token_data.get("error_description", "Token exchange failed"))))

        access_token = token_data["access_token"]
        expires_in = token_data.get("expires_in", 5184000)  # default 60 days

        # Get user profile
        profile_resp = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        profile = profile_resp.json()
        name = profile.get("name") or profile.get("localizedFirstName", "LinkedIn User")
        user_id = profile.get("sub") or profile.get("id", "")

    # Upsert account
    existing = db.query(SocialAccount).filter(
        SocialAccount.platform == "LinkedIn",
        SocialAccount.account_id == user_id,
    ).first()
    if existing:
        existing.access_token = access_token
        existing.account_name = name
        existing.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        existing.is_active = True
    else:
        db.add(SocialAccount(
            platform="LinkedIn",
            account_name=name,
            account_id=user_id,
            access_token=access_token,
            token_expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
        ))
    db.commit()
    return HTMLResponse(_oauth_done_html("LinkedIn", True))


# ── Facebook + Instagram OAuth ─────────────────────────────────────────────────

@router.get("/auth/facebook")
def facebook_auth():
    app_id, app_secret = _facebook_creds()
    if not app_id:
        raise HTTPException(400, "Facebook credentials not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET env variables.")

    state = secrets.token_urlsafe(32)
    _oauth_states[state] = {"platform": "Facebook", "ts": time.time()}

    redirect_uri = f"{_base_url()}/api/social/callback/facebook"
    scope = "pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish"
    url = (
        f"https://www.facebook.com/v19.0/dialog/oauth"
        f"?client_id={app_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scope}"
        f"&state={state}"
        f"&response_type=code"
    )
    return {"url": url}


@router.get("/callback/facebook")
async def facebook_callback(code: str = Query(None), state: str = Query(None), error: str = Query(None), db: Session = Depends(get_db)):
    if error:
        return HTMLResponse(_oauth_done_html("Facebook", False, "Access denied"))

    if not state or state not in _oauth_states:
        return HTMLResponse(_oauth_done_html("Facebook", False, "Invalid state"))

    _oauth_states.pop(state, None)

    app_id, app_secret = _facebook_creds()
    redirect_uri = f"{_base_url()}/api/social/callback/facebook"

    async with httpx.AsyncClient() as client:
        # Exchange code → short-lived user token
        token_resp = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "client_id": app_id,
                "redirect_uri": redirect_uri,
                "client_secret": app_secret,
                "code": code,
            },
        )
        token_data = token_resp.json()
        if "access_token" not in token_data:
            return HTMLResponse(_oauth_done_html("Facebook", False, str(token_data.get("error", {}).get("message", "Token failed"))))

        short_token = token_data["access_token"]

        # Exchange for long-lived user token (60-day)
        ll_resp = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": app_id,
                "client_secret": app_secret,
                "fb_exchange_token": short_token,
            },
        )
        ll_data = ll_resp.json()
        user_token = ll_data.get("access_token", short_token)
        expires_in = ll_data.get("expires_in", 5184000)

        # Get pages this user manages
        pages_resp = await client.get(
            "https://graph.facebook.com/v19.0/me/accounts",
            params={"access_token": user_token},
        )
        pages_data = pages_resp.json()
        pages = pages_data.get("data", [])

    saved_facebook = False
    saved_instagram = False

    for page in pages:
        page_id = page["id"]
        page_name = page["name"]
        page_token = page["access_token"]  # page-scoped, never expires

        # Save Facebook page account
        fb_existing = db.query(SocialAccount).filter(
            SocialAccount.platform == "Facebook",
            SocialAccount.page_id == page_id,
        ).first()
        if fb_existing:
            fb_existing.access_token = page_token
            fb_existing.account_name = page_name
            fb_existing.page_name = page_name
            fb_existing.is_active = True
        else:
            db.add(SocialAccount(
                platform="Facebook",
                account_name=page_name,
                account_id=page_id,
                access_token=page_token,
                page_id=page_id,
                page_name=page_name,
            ))
        saved_facebook = True

        # Check for connected Instagram Business Account
        async with httpx.AsyncClient() as cl:
            ig_resp = await cl.get(
                f"https://graph.facebook.com/v19.0/{page_id}",
                params={"fields": "instagram_business_account", "access_token": page_token},
            )
            ig_data = ig_resp.json()
            ig_biz = ig_data.get("instagram_business_account")

            if ig_biz:
                ig_user_id = ig_biz["id"]
                # Get IG account name
                ig_name_resp = await cl.get(
                    f"https://graph.facebook.com/v19.0/{ig_user_id}",
                    params={"fields": "username,name", "access_token": page_token},
                )
                ig_info = ig_name_resp.json()
                ig_name = ig_info.get("username") or ig_info.get("name") or "Instagram Account"

                ig_existing = db.query(SocialAccount).filter(
                    SocialAccount.platform == "Instagram",
                    SocialAccount.ig_user_id == ig_user_id,
                ).first()
                if ig_existing:
                    ig_existing.access_token = page_token
                    ig_existing.account_name = f"@{ig_name}"
                    ig_existing.page_id = page_id
                    ig_existing.is_active = True
                else:
                    db.add(SocialAccount(
                        platform="Instagram",
                        account_name=f"@{ig_name}",
                        account_id=ig_user_id,
                        access_token=page_token,
                        page_id=page_id,
                        ig_user_id=ig_user_id,
                    ))
                saved_instagram = True

    db.commit()

    if not saved_facebook and not pages:
        return HTMLResponse(_oauth_done_html("Facebook", False, "No Facebook Pages found. Make sure you have admin access to at least one Page."))

    platforms = "Facebook" + (" & Instagram" if saved_instagram else "")
    return HTMLResponse(_oauth_done_html(platforms, True))


# ── Posting ────────────────────────────────────────────────────────────────────

class PostRequest(BaseModel):
    platforms: List[str]


@router.post("/post/{job_opening_id}")
async def post_to_social(job_opening_id: int, data: PostRequest, db: Session = Depends(get_db)):
    opening = db.query(JobOpening).filter(JobOpening.id == job_opening_id).first()
    if not opening:
        raise HTTPException(404, "Job opening not found")

    results = []

    for platform in data.platforms:
        account = db.query(SocialAccount).filter(
            SocialAccount.platform == platform,
            SocialAccount.is_active == True,
        ).first()

        if not account:
            results.append({"platform": platform, "status": "failed", "error": f"No connected {platform} account"})
            continue

        post_record = SocialPost(
            job_opening_id=job_opening_id,
            platform=platform,
            social_account_id=account.id,
        )
        db.add(post_record)
        db.flush()

        try:
            text = _build_post_text(opening, platform)

            if platform == "LinkedIn":
                post_id, post_url = await _post_linkedin(account, text)
            elif platform == "Facebook":
                post_id, post_url = await _post_facebook(account, text)
            elif platform == "Instagram":
                post_id, post_url = await _post_instagram(account, opening, text)
            else:
                raise ValueError(f"Unknown platform: {platform}")

            post_record.status = "posted"
            post_record.post_id = post_id
            post_record.post_url = post_url
            post_record.posted_at = datetime.utcnow()
            results.append({"platform": platform, "status": "posted", "post_url": post_url})

        except Exception as e:
            post_record.status = "failed"
            post_record.error_message = str(e)
            results.append({"platform": platform, "status": "failed", "error": str(e)})

    db.commit()
    return {"results": results}


@router.get("/posts/{job_opening_id}")
def list_posts(job_opening_id: int, db: Session = Depends(get_db)):
    posts = db.query(SocialPost).filter(
        SocialPost.job_opening_id == job_opening_id
    ).order_by(SocialPost.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "platform": p.platform,
            "status": p.status,
            "post_url": p.post_url,
            "error_message": p.error_message,
            "posted_at": str(p.posted_at) if p.posted_at else None,
        }
        for p in posts
    ]


# ── Platform posting helpers ───────────────────────────────────────────────────

async def _post_linkedin(account: SocialAccount, text: str):
    async with httpx.AsyncClient() as client:
        # Get LinkedIn user URN
        me_resp = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {account.access_token}"},
        )
        me = me_resp.json()
        user_id = me.get("sub") or account.account_id
        author = f"urn:li:person:{user_id}"

        payload = {
            "author": author,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": text},
                    "shareMediaCategory": "NONE",
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            },
        }
        resp = await client.post(
            "https://api.linkedin.com/v2/ugcPosts",
            json=payload,
            headers={
                "Authorization": f"Bearer {account.access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        )
        data = resp.json()
        if resp.status_code not in (200, 201):
            raise Exception(data.get("message") or str(data))

        post_id = data.get("id", "")
        post_url = f"https://www.linkedin.com/feed/update/{post_id}" if post_id else None
        return post_id, post_url


async def _post_facebook(account: SocialAccount, text: str):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://graph.facebook.com/v19.0/{account.page_id}/feed",
            data={"message": text, "access_token": account.access_token},
        )
        data = resp.json()
        if "id" not in data:
            raise Exception(data.get("error", {}).get("message") or str(data))

        post_id = data["id"]
        post_url = f"https://www.facebook.com/{post_id.replace('_', '/posts/')}"
        return post_id, post_url


async def _post_instagram(account: SocialAccount, opening: JobOpening, caption: str):
    ig_user_id = account.ig_user_id
    if not ig_user_id:
        raise Exception("No Instagram Business Account linked to this Facebook Page")

    # Try to generate an image; Instagram requires an image URL
    image_url = _generate_ig_image(opening.title or "Job Opening", opening.id)
    if not image_url:
        raise Exception(
            "Instagram posting requires Pillow (pip install pillow) and a publicly accessible URL. "
            "Install Pillow and set APP_BASE_URL to your public server URL."
        )

    async with httpx.AsyncClient() as client:
        # Step 1: Create media container
        media_resp = await client.post(
            f"https://graph.facebook.com/v19.0/{ig_user_id}/media",
            data={
                "image_url": image_url,
                "caption": caption,
                "access_token": account.access_token,
            },
        )
        media_data = media_resp.json()
        if "id" not in media_data:
            raise Exception(media_data.get("error", {}).get("message") or str(media_data))

        creation_id = media_data["id"]

        # Step 2: Publish
        pub_resp = await client.post(
            f"https://graph.facebook.com/v19.0/{ig_user_id}/media_publish",
            data={
                "creation_id": creation_id,
                "access_token": account.access_token,
            },
        )
        pub_data = pub_resp.json()
        if "id" not in pub_data:
            raise Exception(pub_data.get("error", {}).get("message") or str(pub_data))

        post_id = pub_data["id"]
        post_url = f"https://www.instagram.com/p/{post_id}/"
        return post_id, post_url


# ── OAuth done HTML page (closes popup and notifies opener) ───────────────────

def _oauth_done_html(platform: str, success: bool, error: str = "") -> str:
    if success:
        msg = f"{platform} connected successfully!"
        script = f"""
            if (window.opener) {{
                window.opener.postMessage({{type:'social-auth',platform:'{platform}',status:'success'}}, '*');
                setTimeout(() => window.close(), 1500);
            }} else {{
                window.location.href = '/';
            }}
        """
        bg, icon, text_color = "#dcfce7", "✅", "#15803d"
    else:
        msg = f"Failed to connect {platform}: {error}"
        script = f"""
            if (window.opener) {{
                window.opener.postMessage({{type:'social-auth',platform:'{platform}',status:'error',error:{repr(error)}}}, '*');
                setTimeout(() => window.close(), 3000);
            }} else {{
                window.location.href = '/';
            }}
        """
        bg, icon, text_color = "#fee2e2", "❌", "#dc2626"

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Social Media Auth</title>
<style>
  body {{margin:0;font-family:system-ui,sans-serif;background:{bg};display:flex;align-items:center;justify-content:center;min-height:100vh;}}
  .box {{text-align:center;padding:40px;background:white;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.1);max-width:400px;}}
  .icon {{font-size:48px;margin-bottom:16px;}}
  .msg {{color:{text_color};font-size:16px;font-weight:600;}}
  .sub {{color:#6b7280;font-size:13px;margin-top:8px;}}
</style></head>
<body>
<div class="box">
  <div class="icon">{icon}</div>
  <div class="msg">{msg}</div>
  <div class="sub">This window will close automatically…</div>
</div>
<script>{script}</script>
</body></html>
"""
