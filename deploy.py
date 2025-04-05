import boto3
import os
from pathlib import Path

def upload_to_s3(local_path, bucket_name, s3_path):
    s3 = boto3.client('s3')
    
    # Set cache control headers
    extra_args = {
        'CacheControl': 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0',
        'Expires': '-1'
    }
    
    # Upload the file
    s3.upload_file(
        local_path,
        bucket_name,
        s3_path,
        ExtraArgs=extra_args
    )
    print(f"Uploaded {local_path} to {s3_path}")

def deploy():
    # Configuration
    bucket_name = 'www.pashasmind.com'  # Replace with your bucket name
    base_dir = Path('.')
    
    # Files to upload (excluding directories and hidden files)
    files_to_upload = [
        'index.html',
        'fishtank.html',
        'credits.txt',
        'changelog.html'
    ]
    
    # Upload root files
    for file in files_to_upload:
        if os.path.exists(file):
            upload_to_s3(file, bucket_name, file)
    
    # Upload static files
    static_dir = base_dir / 'static'
    if static_dir.exists():
        for root, _, files in os.walk(static_dir):
            for file in files:
                if not file.startswith('.'):  # Skip hidden files
                    local_path = os.path.join(root, file)
                    # Calculate S3 path by removing 'static/' prefix
                    s3_path = local_path.replace('static/', '', 1)
                    upload_to_s3(local_path, bucket_name, s3_path)
    
    # Upload assets
    assets_dir = base_dir / 'assets'
    if assets_dir.exists():
        for root, _, files in os.walk(assets_dir):
            for file in files:
                if not file.startswith('.'):  # Skip hidden files
                    local_path = os.path.join(root, file)
                    # Calculate S3 path by removing 'assets/' prefix
                    s3_path = local_path.replace('assets/', '', 1)
                    upload_to_s3(local_path, bucket_name, s3_path)

if __name__ == '__main__':
    deploy() 