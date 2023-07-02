import os
import shutil
from flask import Flask,Blueprint, render_template, redirect, url_for, request, jsonify
from pathlib import Path
from os import path
database_page = Blueprint('database_page', __name__)


@database_page.route('/database')
def database():

    return render_template('database.html')


@database_page.route('/api/rename', methods=['POST'])
def rename():
    # Get the path and new name from the request data
    request_data = request.get_json()
    old_path = request_data.get('path')
    new_name = request_data.get('newName')

    # Validate the request data
    if not old_path or not new_name:
        return jsonify(success=False, error="Invalid request data"), 400

    # Ensure the new name does not include any disallowed characters
    if '/' in new_name or '\\' in new_name or ':' in new_name:
        return jsonify(success=False, error="Invalid character in new name"), 400

    try:
        # Convert relative path to absolute path
        relative_path = old_path.replace('/', os.sep).lstrip(os.sep)
        relative_path = relative_path.replace('\\', '/')
        full_path = os.path.join(os.path.dirname(__file__), relative_path)

        # Construct the new path
        directory = os.path.dirname(full_path)
        new_full_path = os.path.join(directory, new_name)

        # Rename the file or directory
        os.rename(full_path, new_full_path)

        return jsonify(success=True)
    except Exception as e:
        # If an error occurred during renaming, return a server error
        return jsonify(success=False, error=str(e)), 500


@database_page.route('/api/delete', methods=['POST'])
def delete():
    path = request.json.get('path')
    relative_path = path.replace('/', os.sep).lstrip(os.sep)
    relative_path = relative_path.replace('\\', '/')

    # Get absolute path
    full_path = os.path.join(os.path.dirname(__file__), relative_path)
    print(full_path)
    try:
        # Check if it's a directory
        if os.path.isdir(full_path):
            shutil.rmtree(full_path, ignore_errors = False)
        else:
            os.remove(full_path)
        return jsonify(success=True), 200
    except Exception as e:
        return jsonify(success=False, error=str(e)), 500



@database_page.route('/api/new-directory', methods=['POST'])
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


@database_page.route('/api/new-file', methods=['POST'])
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

@database_page.route('/api/files', methods=['GET'])
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

@database_page.route('/api/files', methods=['POST'])
def api_create_file_or_folder():
    data = request.get_json()
    relative_path = data['path']
    item_name = data['name']
    # Convert path to be OS specific
    relative_path = relative_path.replace('/', os.sep).lstrip(os.sep)
    # Get absolute path
    full_path = os.path.join(os.path.dirname(__file__), relative_path, item_name)
    print(full_path)
    if os.path.exists(full_path):
        return jsonify({'error': 'File or folder already exists'}), 400

    try:
        if data['is_directory']:
            os.makedirs(full_path)
        else:
            with open(full_path, 'w') as f:
                f.write(data.get('content', ''))
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500




@database_page.route('/api/is-directory', methods=['GET'])
def is_directory():
    relative_path = request.args.get('path', default = '.', type = str) # Value '/payloadDB/OWASP-top10'
    flipped_path = relative_path.replace('/', '\\').lstrip('\\') # Value 'payloadDB\OWASP-top10'
    print(flipped_path)
    print(path.dirname(__file__)) # Value 'C:\Users\taly\PycharmProjects\RWT-UI'
    absolute_path = os.path.join(path.dirname(__file__), flipped_path)
    print(absolute_path)
    is_directory = os.path.isdir(absolute_path)
    return jsonify(isDirectory=is_directory)


@database_page.route('/api/file-content', methods=['GET'])
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

    with open(full_path, 'r', encoding='utf-8') as file:  # Specify the encoding here
        content = file.read()

    return jsonify({'content': content})


@database_page.route('/api/save-file', methods=['POST'])
def api_save_file():
    data = request.get_json()
    relative_path = data['path']
    file_data = data['content']  # get file data from POST request

    # Convert path to be OS specific
    relative_path = relative_path.replace('/', os.sep).lstrip(os.sep)

    # Get absolute path
    full_path = os.path.join(os.path.dirname(__file__), relative_path)

    try:
        with open(full_path, 'w') as file:
            file.write(file_data)
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


