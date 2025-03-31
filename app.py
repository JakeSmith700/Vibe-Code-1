from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO
import os

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.config['SECRET_KEY'] = 'your-secret-key-here'
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate-sand')
def generate_sand():
    return render_template('generate_sand.html')

# Add route to serve files from assets directory
@app.route('/assets/<path:filename>')
def serve_asset(filename):
    return send_from_directory('assets', filename)

@app.route('/debug')
def debug():
    return {
        'static_folder': app.static_folder,
        'static_url_path': app.static_url_path,
        'assets_path': os.path.join(app.root_path, 'assets'),
        'files': {
            'static/js/fish.js': os.path.exists(os.path.join(app.root_path, 'static', 'js', 'fish.js')),
            'assets/clownfish/clownfish.png': os.path.exists(os.path.join(app.root_path, 'assets', 'clownfish', 'clownfish.png')),
            'assets/clownfish/animation.json': os.path.exists(os.path.join(app.root_path, 'assets', 'clownfish', 'animation.json'))
        }
    }

if __name__ == '__main__':
    socketio.run(app, debug=True)