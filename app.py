from flask import Flask, render_template, send_from_directory, send_file
from flask_socketio import SocketIO
import os

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.config['SECRET_KEY'] = 'your-secret-key-here'
socketio = SocketIO(app)

# Add CORS headers and disable caching for all routes
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    # Disable caching
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate-sand')
def generate_sand():
    return render_template('generate_sand.html')

# Serve static files from assets directory
@app.route('/assets/<path:filename>')
def serve_asset(filename):
    return send_from_directory('assets', filename)

# Serve credits.txt from root
@app.route('/credits.txt')
def serve_credits():
    return send_from_directory('.', 'credits.txt')

# Serve music files
@app.route('/assets/music/<path:filename>')
def serve_music(filename):
    return send_from_directory('assets/music', filename)

# Debug endpoint to check file existence
@app.route('/debug')
def debug():
    files_to_check = [
        'credits.txt',
        'assets/music/tracks.json',
        'assets/music/chill/bicycles.mp3',
        'assets/music/hype/touch-the-stars.mp3',
        'assets/fish/clownfish.png',
        'assets/castle/castle.png',
        'assets/heart/heart.png'
    ]
    
    results = {}
    for file_path in files_to_check:
        results[file_path] = os.path.exists(file_path)
    
    return results

if __name__ == '__main__':
    socketio.run(app, debug=True)