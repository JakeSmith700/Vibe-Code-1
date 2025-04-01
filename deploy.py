import boto3
import os
from pathlib import Path
import sys
import mimetypes

def normalize_path(path):
    # Convert Windows backslashes to forward slashes for S3
    return path.replace('\\', '/')

def get_content_type(file_path):
    # Map file extensions to content types
    content_types = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon',
        '.txt': 'text/plain',
        '.mp3': 'audio/mpeg'
    }
    
    ext = os.path.splitext(file_path)[1].lower()
    return content_types.get(ext, 'application/octet-stream')

def upload_to_s3(local_path, bucket_name, s3_path):
    s3 = boto3.client('s3')
    
    # Normalize the S3 path to use forward slashes
    s3_path = normalize_path(s3_path)
    
    # Set cache control headers and content type
    extra_args = {
        'CacheControl': 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0',
        'Expires': '-1',
        'ContentType': get_content_type(local_path)
    }
    
    # Upload the file
    try:
        s3.upload_file(
            local_path,
            bucket_name,
            s3_path,
            ExtraArgs=extra_args
        )
        print(f"Uploaded {local_path} to {s3_path} ({extra_args['ContentType']})")
    except Exception as e:
        print(f"Error uploading {local_path}: {str(e)}")

def deploy_file(file_path):
    bucket_name = 'www.pashasmind.com'
    
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found")
        return
    
    # For single file deployment, use the file path as is
    s3_path = normalize_path(file_path)
    upload_to_s3(file_path, bucket_name, s3_path)

def deploy():
    # Configuration
    bucket_name = 'www.pashasmind.com'
    base_dir = Path('.')
    
    print("Starting deployment to www.pashasmind.com...")
    
    # Root files to upload
    root_files = [
        'index.html',
        'fishtank.html',
        'credits.txt'
    ]
    
    print("\nUploading root files...")
    for file in root_files:
        if os.path.exists(file):
            upload_to_s3(file, bucket_name, file)
        else:
            print(f"Warning: {file} not found")
    
    # Upload static files
    static_dir = base_dir / 'static'
    if static_dir.exists():
        print("\nUploading static files...")
        for root, _, files in os.walk(static_dir):
            for file in files:
                if not file.startswith('.'):  # Skip hidden files
                    local_path = os.path.join(root, file)
                    # Keep the static/ prefix in the path
                    s3_path = normalize_path(local_path)
                    upload_to_s3(local_path, bucket_name, s3_path)
    else:
        print("Warning: static directory not found")
    
    # Upload assets
    assets_dir = base_dir / 'assets'
    if assets_dir.exists():
        print("\nUploading assets...")
        for root, _, files in os.walk(assets_dir):
            for file in files:
                if not file.startswith('.'):  # Skip hidden files
                    local_path = os.path.join(root, file)
                    # Keep the assets/ prefix in the path
                    s3_path = normalize_path(local_path)
                    upload_to_s3(local_path, bucket_name, s3_path)
    else:
        print("Warning: assets directory not found")
    
    print("\nDeployment complete!")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        # If a file path is provided as argument, deploy only that file
        file_path = sys.argv[1]
        print(f"Deploying single file: {file_path}")
        deploy_file(file_path)
    else:
        # Otherwise, deploy everything
        deploy() 