import os
import json
import shutil
from flask import Flask, render_template, url_for, request, jsonify
from pathlib import Path
from os import path

app = Flask(__name__)
__folder__ = path.abspath(path.dirname(__file__))


class Config:
    def __init__(self, filename, loaded, data):
        self.filename = filename
        self.loaded = loaded
        self.data = data

def load_configs(config_folder):
    configs = []
    for filename in os.listdir(config_folder):
        if filename.endswith(".json"):
            with open(os.path.join(config_folder, filename), "r") as file:
                data = json.load(file)
                configs.append(Config(filename, False, data))
    return configs

@app.route('/')
def configurations():
    # Get the absolute path to the folder containing app.py
    app_root = os.path.dirname(os.path.abspath(__file__))
    # Create a path to the config_files folder
    config_folder = os.path.join(app_root, 'configurations')
    configs = load_configs(config_folder)
    return render_template('configurations.html', configs=configs)

@app.route('/payloadDB')
def tests():
    return render_template('payloadDB.html')

@app.route('/database')
def database():
    return render_template('database.html')

@app.route('/results')
def results():
    return render_template('results.html')

@app.route('/api/save-config', methods=['POST'])
def save_config():
    data = request.get_json()
    print(data)
    original_filename = data.get('original_file_name')
    new_filename = data.get('filename')
    config_data = data.get('data')
    config_data["threads"] = int(config_data["threads"])

    # Define the directory where the config files are stored
    config_dir = path.join(__folder__, "configurations")

    # If original_filename is not an empty string, rename the file
    if original_filename:
        original_filepath = os.path.join(config_dir, original_filename)
        new_filepath = os.path.join(config_dir, new_filename)
        os.rename(original_filepath, new_filepath)
    else:
        # If original_filename is an empty string, create a new file
        new_filepath = os.path.join(config_dir, new_filename)
        with open(new_filepath, 'w') as new_file:
            json.dump({}, new_file)

    # Update the config data in the file
    with open(new_filepath, 'r+') as config_file:
        # Load the existing data
        existing_data = json.load(config_file)
        # Update the data
        existing_data.update(config_data)
        # Clear the file
        config_file.seek(0)
        config_file.truncate()
        # Write the updated data back to the file
        json.dump(existing_data, config_file)

    return jsonify({'success': True})

@app.route('/api/files', methods=['GET'])
def api_get_files():
    path = request.args.get('path', '/payloadDB')
    if not path.startswith('/payloadDB'):
        return jsonify({'error': 'Invalid path'}), 400

    full_path = os.path.join(os.getcwd(), path.strip('/'))
    if not os.path.exists(full_path):
        return jsonify({'error': 'Path not found'}), 404

    if os.path.isfile(full_path):
        return jsonify({'error': 'Path is not a directory'}), 400

    try:
        entries = os.listdir(full_path)
        result = []
        for entry in entries:
            entry_path = os.path.join(full_path, entry)
            result.append({
                'name': entry,
                'path': os.path.join(path, entry),
                'is_directory': os.path.isdir(entry_path)
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files', methods=['POST'])
def api_create_file_or_folder():
    path = request.form.get('path')
    if not path.startswith('/payloadDB'):
        return jsonify({'error': 'Invalid path'}), 400

    full_path = os.path.join(os.getcwd(), path.strip('/'))
    if os.path.exists(full_path):
        return jsonify({'error': 'File or folder already exists'}), 400

    try:
        if request.form.get('is_directory') == 'true':
            os.makedirs(full_path)
        else:
            with open(full_path, 'w') as f:
                f.write(request.form.get('content', ''))
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/file-content', methods=['GET'])
def get_file_content():
    requested_path = request.args.get('path', '')
    if not requested_path:
        return jsonify({'error': 'Path parameter is required'})

    full_path = os.path.join(os.getcwd(), requested_path.lstrip('/'))
    print(f'non-absolute path: {full_path}')
    full_path = os.path.abspath(full_path)  # Add this line to get the absolute path of the file
    print(f'absolute path: {full_path}')

    if not os.path.exists(full_path):
        return jsonify({'error': f'File not found: {requested_path}'})

    if not os.path.isfile(full_path):
        return jsonify({'error': 'Path is not a file'})

    with open(full_path, 'r') as file:
        content = file.read()

    return jsonify({'content': content})



# ...

@app.route('/api/rename', methods=['POST'])
def rename():
    src_path = request.form.get('src_path')
    dest_path = request.form.get('dest_path')

    if src_path and dest_path:
        try:
            os.rename(src_path, dest_path)
            return jsonify(success=True)
        except Exception as e:
            return jsonify(error=str(e)), 500

    return jsonify(error='Missing parameters'), 400


@app.route('/api/delete', methods=['POST'])
def delete():
    target_path = request.form.get('target_path')

    if target_path:
        try:
            if os.path.isfile(target_path):
                os.remove(target_path)
            elif os.path.isdir(target_path):
                shutil.rmtree(target_path)
            return jsonify(success=True)
        except Exception as e:
            return jsonify(error=str(e)), 500

    return jsonify(error='Missing parameters'), 400


@app.route('/api/new-directory', methods=['POST'])
def new_directory():
    parent_path = request.form.get('parent_path')
    dir_name = request.form.get('dir_name')

    if parent_path and dir_name:
        try:
            new_dir_path = os.path.join(parent_path, dir_name)
            os.makedirs(new_dir_path, exist_ok=True)
            return jsonify(success=True)
        except Exception as e:
            return jsonify(error=str(e)), 500

    return jsonify(error='Missing parameters'), 400


@app.route('/api/new-file', methods=['POST'])
def new_file():
    parent_path = request.form.get('parent_path')
    file_name = request.form.get('file_name')

    if parent_path and file_name:
        try:
            new_file_path = os.path.join(parent_path, file_name)
            Path(new_file_path).touch()
            return jsonify(success=True)
        except Exception as e:
            return jsonify(error=str(e)), 500

    return jsonify(error='Missing parameters'), 400




if __name__ == "__main__":
    app.run(debug=True)