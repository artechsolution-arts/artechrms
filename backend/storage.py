"""MinIO-backed object storage utility.

All file uploads go through upload_file(); all deletions go through delete_file().
The bucket is created on first use with a public-read policy so browsers can
load images and PDFs directly from the MinIO URL without extra auth headers.
"""
import io
import json
import os

from minio import Minio
from minio.error import S3Error

MINIO_ENDPOINT   = os.getenv("MINIO_ENDPOINT",   "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY",  "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY",  "minioadmin123")
MINIO_BUCKET     = os.getenv("MINIO_BUCKET",      "hrms")
MINIO_PUBLIC_URL = os.getenv("MINIO_PUBLIC_URL",  "http://localhost:9000")

_CONTENT_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg",
    "png": "image/png", "webp": "image/webp", "gif": "image/gif",
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}

_client: Minio | None = None


def _get_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=False,
        )
        _ensure_bucket(_client)
    return _client


def _ensure_bucket(client: Minio) -> None:
    try:
        if not client.bucket_exists(MINIO_BUCKET):
            client.make_bucket(MINIO_BUCKET)
        policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect":    "Allow",
                "Principal": {"AWS": ["*"]},
                "Action":    ["s3:GetObject"],
                "Resource":  [f"arn:aws:s3:::{MINIO_BUCKET}/*"],
            }],
        })
        client.set_bucket_policy(MINIO_BUCKET, policy)
    except S3Error:
        pass


def upload_file(data: bytes, folder: str, filename: str) -> str:
    """Upload bytes to MinIO under <bucket>/<folder>/<filename>.

    Returns the public URL that browsers can open directly.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    content_type = _CONTENT_TYPES.get(ext, "application/octet-stream")
    object_name = f"{folder}/{filename}"
    _get_client().put_object(
        MINIO_BUCKET,
        object_name,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return f"/files/{object_name}"


def delete_file(url: str | None) -> None:
    """Delete a MinIO object given its public or relative URL. Silent on failure."""
    if not url:
        return
    # New relative format: /files/<folder>/<filename>
    if url.startswith("/files/"):
        object_name = url[len("/files/"):]
    else:
        # Legacy absolute URL format stored before the proxy migration
        prefix = f"{MINIO_PUBLIC_URL}/{MINIO_BUCKET}/"
        if not url.startswith(prefix):
            return
        object_name = url[len(prefix):]
    try:
        _get_client().remove_object(MINIO_BUCKET, object_name)
    except Exception:
        pass
