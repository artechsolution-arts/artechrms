"""Cloudflare R2 object storage (S3-compatible via boto3).

Falls back to local filesystem when R2 credentials are not configured
so local development works without any cloud setup.

Interface is unchanged from the previous MinIO module:
  upload_file(data, folder, filename) -> "/files/<folder>/<filename>"
  download_file(object_key)           -> bytes
  delete_file(url)                    -> None
"""
import io
import os

R2_ACCOUNT_ID        = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID     = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET            = os.getenv("R2_BUCKET", "hrms")

_LOCAL_ROOT = os.getenv("LOCAL_FILES_DIR", "/app/local_files")

_CONTENT_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg",
    "png": "image/png",  "webp": "image/webp", "gif": "image/gif",
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}

_client = None


def _r2_ready() -> bool:
    return bool(R2_ACCOUNT_ID and R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY)


def _get_client():
    global _client
    if _client is None:
        import boto3
        from botocore.client import Config
        _client = boto3.client(
            "s3",
            endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )
    return _client


# ── Public API ─────────────────────────────────────────────────────────────────

def upload_file(data: bytes, folder: str, filename: str) -> str:
    """Store bytes under <folder>/<filename>. Returns app-relative URL /files/<key>."""
    object_key = f"{folder}/{filename}"

    if _r2_ready():
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        _get_client().put_object(
            Bucket=R2_BUCKET,
            Key=object_key,
            Body=data,
            ContentType=_CONTENT_TYPES.get(ext, "application/octet-stream"),
        )
    else:
        # Local filesystem fallback for dev
        dest_dir = os.path.join(_LOCAL_ROOT, folder)
        os.makedirs(dest_dir, exist_ok=True)
        with open(os.path.join(dest_dir, filename), "wb") as fh:
            fh.write(data)

    return f"/files/{object_key}"


def download_file(object_key: str) -> bytes:
    """Download a file by its object key (the part after /files/)."""
    if _r2_ready():
        resp = _get_client().get_object(Bucket=R2_BUCKET, Key=object_key)
        return resp["Body"].read()
    else:
        path = os.path.join(_LOCAL_ROOT, object_key)
        with open(path, "rb") as fh:
            return fh.read()


def delete_file(url: str | None) -> None:
    """Delete a file given its /files/<key> relative URL. Silent on failure."""
    if not url:
        return
    if url.startswith("/files/"):
        object_key = url[len("/files/"):]
    else:
        return
    try:
        if _r2_ready():
            _get_client().delete_object(Bucket=R2_BUCKET, Key=object_key)
        else:
            path = os.path.join(_LOCAL_ROOT, object_key)
            if os.path.isfile(path):
                os.remove(path)
    except Exception:
        pass
