import os
import json
import shutil
from RadwareWAFTester import RadwareWAFTester
from flask import Flask, render_template, redirect, url_for, request, jsonify
from pathlib import Path
from os import path
from TestReport import TestReport
from threading import Thread
from flask_codemirror import CodeMirror
from flask_codemirror.fields import CodeMirrorField
from wtforms import Form

from collections import defaultdict
from jinja2 import Environment, select_autoescape, FileSystemLoader, ext
app = Flask(__name__)
app.jinja_env.add_extension('jinja2.ext.do')




__folder__ = path.abspath(path.dirname(__file__))
radware_waf_tester = None
CODEMIRROR_LANGUAGES = ['text']
WTF_CSRF_ENABLED = True
SECRET_KEY = 'secret'
app.config.update(
    CODEMIRROR_LANGUAGES = ['text'],
    WTF_CSRF_ENABLED = True,
    SECRET_KEY = 'secret',
    CODEMIRROR_THEME='3024-night'
)
codemirror = CodeMirror(app)
class MyForm(Form):
    source_code = CodeMirrorField(language='python', config={'lineNumbers' : 'true'})
@app.route('/submit', methods=['POST'])
def submit():
    text = request.form.get('text')
    # process the text
    return redirect(url_for('index'))
######################################################
# Configurations page functions                      #
######################################################


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


@app.route('/api/configurations', methods=['POST'])
def create_configuration():
    data = request.get_json()
    new_filename = data.get('filename')
    config_data = data.get('data')
    config_data["threads"] = int(config_data["threads"])

    # Define the directory where the config files are stored
    config_dir = path.join(path.dirname(__file__), "configurations")
    new_filepath = os.path.join(config_dir, new_filename)

    # Check if file with the same name already exists
    if os.path.exists(new_filepath):
        return jsonify({"error": "File with the same name already exists"}), 400

    # If not, create a new file
    with open(new_filepath, 'w') as new_file:
        json.dump(config_data, new_file)  # Here we need to dump config_data, not an empty dict

    return jsonify({"message": "Configuration created successfully"}), 201

@app.route('/api/configurations', methods=['PUT'])
def update_configuration():
    data = request.get_json()
    filename = data.get('filename')
    original_filename = data.get('original_filename')
    config_data = data.get('data')

    # Define the directory where the config files are stored
    config_dir = path.join(path.dirname(__file__), "configurations")

    # The filepaths of the original and the new file
    original_filepath = os.path.join(config_dir, original_filename)
    new_filepath = os.path.join(config_dir, filename)

    # Check if the original file exists
    if not os.path.exists(original_filepath):
        return jsonify({"error": "Original file does not exist"}), 404

    # If filename has changed, check if the new filename already exists
    if original_filename != filename and os.path.exists(new_filepath):
        return jsonify({"error": "File with the new name already exists"}), 400

    # Update the file
    with open(original_filepath, 'w') as file:
        json.dump(config_data, file)

    # If filename has changed, rename the file
    if original_filename != filename:
        os.rename(original_filepath, new_filepath)

    return jsonify({"message": "Configuration updated successfully"}), 200

@app.route('/api/configurations', methods=['DELETE'])
def delete_configuration():
    data = request.get_json()
    filename = data.get('filename')

    # Define the directory where the config files are stored
    config_dir = path.join(path.dirname(__file__), "configurations")

    # The filepath of the file
    filepath = os.path.join(config_dir, filename)

    # Check if the file exists
    if not os.path.exists(filepath):
        return jsonify({"error": "File does not exist"}), 404

    # Delete the file
    os.remove(filepath)

    return jsonify({"message": "Configuration deleted successfully"}), 200



######################################################
# tests page functions                               #
######################################################
def get_test_file_path(filename):
    return Path(__file__).parent / "testfiles" / f"{filename}.json"



@app.route('/tests')
def tests():
    table_data = get_tests_reformat()
    return render_template('tests.html', configs=table_data)

def get_tests_reformat():
    json_files_dir = os.path.join(__folder__, "testfiles")
    payload_db_dir = os.path.join(__folder__, "payloadDB")
    table_values = {
        "MetaData": {
            "total_files": 0,
            "total_categories": 0,
        },
        "payloadDB": [d for d in os.listdir(payload_db_dir) if os.path.isdir(os.path.join(payload_db_dir, d))],
        "Rows": []
    }

    for filename in os.listdir(json_files_dir):
        if filename.endswith('.json'):
            with open(os.path.join(json_files_dir, filename), 'r') as file:
                data = json.load(file)
                table_values["MetaData"]["total_files"] += 1
                table_values["MetaData"][filename] = {"total_tests": 0}

                for category in data:
                    table_values["MetaData"]["total_categories"] += 1
                    table_values["MetaData"][filename][category] = {"test_count": len(data[category])}
                    table_values["MetaData"][filename]["total_tests"] += (len(data[category]))

                    for test in data[category]:
                        table_values["Rows"].append({
                            'filename': filename,
                            'category': category,
                            'test_name': test,
                            'test_data': data[category][test],
                        })
    return table_values


@app.route('/api/get-test-payload-files', methods=['GET'])
def get_test_payload_files():
    root_dir = os.path.dirname(os.path.abspath(__file__))  # get the directory of the current file
    payloadDB_dir = os.path.join(root_dir, 'payloadDB')  # join it with the relative path to payloadDB

    files_list = []

    # Walk through payloadDB_dir
    for dir_name, subdir_list, file_list in os.walk(payloadDB_dir):
        for fname in file_list:
            # Construct the file path from the directory and file name
            file_path = os.path.join(dir_name, fname)
            # Remove the payloadDB_dir from the file_path to get a relative path
            relative_path = os.path.relpath(file_path, payloadDB_dir)
            # Replace backslashes with forward slashes for a more standard format
            relative_path = relative_path.replace("\\", "/")
            # Append it to the list
            files_list.append(relative_path)

    return jsonify(files_list)

@app.route('/api/test-file',methods=['POST'])
def create_test_file():
    data = request.get_json()
    filename = data.get('filename')
    file_path = get_test_file_path(filename)

    if file_path.exists():
        return jsonify({"error": "file already exists"}), 400

    new_file_data = {
        "Category 1": {
            "test 1": {
                "skip": True,
                "headers": {},
                "body type": "",
                "payload_location": {
                    "url": False,
                    "body": {},
                    "headers": [],
                    "cookies": [],
                    "parameters": []
                },
                "payloads_files": [
                    {
                        "file": "",
                        "expected": ""
                    }
                ]
            }
        }
    }

    with file_path.open('w') as f:
        json.dump(new_file_data, f)

    return jsonify({"message": "file created successfully"}), 200

@app.route('/api/test-file',methods=['DELETE'])
def delete_test_file():
    data = request.get_json()
    filename = data.get('filename')
    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    os.remove(file_path)

    return jsonify({"message": "file deleted successfully"}), 200

@app.route('/api/test-file-name',methods=['PUT'])
def update_test_file_name():
    data = request.get_json()
    old_filename = data.get('old-filename')
    new_filename = data.get('new-filename')

    old_file_path = get_test_file_path(old_filename)
    new_file_path = get_test_file_path(new_filename)

    if not old_file_path.exists():
        return jsonify({"error": "file does not exist"}), 400
    if new_file_path.exists():
        return jsonify({"error": "new filename already exists"}), 400

    os.rename(old_file_path, new_file_path)

    return jsonify({"message": "file name updated successfully"}), 200

@app.route('/api/test-file-category',methods=['PUT'])
def update_test_file_category():
    data = request.get_json()
    filename = data.get('filename')
    original_category = data.get('original-category')
    new_category = data.get('new-category')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if original_category not in content:
        return jsonify({"error": "category does not exist"}), 400
    if new_category in content:
        return jsonify({"error": "new category name already exists"}), 400

    content[new_category] = content.pop(original_category)

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "category name updated successfully"}), 200

@app.route('/api/test-file-category',methods=['POST'])
def add_test_file_category():
    data = request.get_json()
    filename = data.get('filename')
    category = data.get('category')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if category in content:
        return jsonify({"error": "category already exists"}), 400

    category_data = {
        "test 1": {
            "skip": True,
            "headers": {},
            "body type": "",
            "payload_location": {
                "url": False,
                "body": {},
                "headers": [],
                "cookies": [],
                "parameters": []
            },
            "payloads_files": [
                {
                    "file": "",
                    "expected": ""
                }
            ]
        }
    }

    content[category] = category_data

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "category added successfully"}), 200

@app.route('/api/test-file-category',methods=['DELETE'])
def delete_test_file_category():
    data = request.get_json()
    filename = data.get('filename')
    category = data.get('category')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if category not in content:
        return jsonify({"error": "category does not exist"}), 400

    del content[category]

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "category deleted successfully"}), 200

@app.route('/api/test-file-skip',methods=['PUT'])
def update_test_file_skip():
    data = request.get_json()
    filename = data.get('filename')
    category = data.get('category')
    test = data.get('test')
    skip = data.get('skip')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if category not in content:
        return jsonify({"error": "category does not exist"}), 400
    if test not in content[category]:
        return jsonify({"error": "test does not exist"}), 400

    content[category][test]['skip'] = skip

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "test skip status updated successfully"}), 200




@app.route('/api/test-file-test',methods=['PUT'])
def update_test_file_test():
    data = request.get_json()
    filename = data.get('filename')
    category = data.get('category')
    original_test = data.get('original-test')
    new_test = data.get('new-test')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if category not in content or original_test not in content[category]:
        return jsonify({"error": "category or test does not exist"}), 400
    if new_test in content[category]:
        return jsonify({"error": "new test name already exists"}), 400

    content[category][new_test] = content[category].pop(original_test)

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "test name updated successfully"}), 200

@app.route('/api/test-file-test',methods=['POST'])
def add_test_file_test():
    data = request.get_json()
    filename = data.get('filename')
    category = data.get('category')
    test = data.get('test')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if category not in content:
        return jsonify({"error": "category does not exist"}), 400
    if test in content[category]:
        return jsonify({"error": "test already exists"}), 400

    test_data = {
        "skip": True,
        "headers": {},
        "body type": "",
        "payload_location": {
            "url": False,
            "body": {},
            "headers": [],
            "cookies": [],
            "parameters": []
        },
        "payloads_files": [
            {
                "file": "",
                "expected": ""
            }
        ]
    }

    content[category][test] = test_data

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "test added successfully"}), 200

@app.route('/api/test-file-test',methods=['DELETE'])
def delete_test_file_test():
    data = request.get_json()
    filename = data.get('filename')
    category = data.get('category')
    test = data.get('test')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if category not in content or test not in content[category]:
        return jsonify({"error": "category or test does not exist"}), 400

    del content[category][test]

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "test deleted successfully"}), 200

@app.route('/api/test-file-properties',methods=['PUT'])
def update_test_file_properties():
    data = request.get_json()
    filename = data.get('filename')
    category = data.get('category')
    test = data.get('test')
    properties = data.get('properties')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if category not in content or test not in content[category]:
        return jsonify({"error": "category or test does not exist"}), 400

    content[category][test]['headers'] = properties['headers']

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "properties updated successfully"}), 200

@app.route('/api/test-file-files',methods=['PUT'])
def update_test_file_files():
    data = request.get_json()
    filename = data.get('filename')
    category = data.get('category')
    test = data.get('test')
    files = data.get('files')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if category not in content or test not in content[category]:
        return jsonify({"error": "category or test does not exist"}), 400

    content[category][test]['payloads_files'] = files

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "files updated successfully"}), 200

@app.route('/api/test-file-location',methods=['PUT'])
def update_test_file_location():
    data = request.get_json()
    filename = data.get('filename')
    category = data.get('category')
    test = data.get('test')
    body_type = data.get('body type')
    location = data.get('location')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if category not in content or test not in content[category]:
        return jsonify({"error": "category or test does not exist"}), 400

    content[category][test]['payload_location'] = location
    content[category][test]['body type'] = body_type

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "location updated successfully"}), 200
######################################################
# Database page functions                            #
######################################################
@app.route('/database')
def database():

    return render_template('database.html')


@app.route('/api/rename', methods=['POST'])
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


@app.route('/api/delete', methods=['POST'])
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




@app.route('/api/is-directory', methods=['GET'])
def is_directory():
    relative_path = request.args.get('path', default = '.', type = str) # Value '/payloadDB/OWASP-top10'
    flipped_path = relative_path.replace('/', '\\').lstrip('\\') # Value 'payloadDB\OWASP-top10'
    print(flipped_path)
    print(path.dirname(__file__)) # Value 'C:\Users\taly\PycharmProjects\RWT-UI'
    absolute_path = os.path.join(path.dirname(__file__), flipped_path)
    print(absolute_path)
    is_directory = os.path.isdir(absolute_path)
    return jsonify(isDirectory=is_directory)


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

    with open(full_path, 'r', encoding='utf-8') as file:  # Specify the encoding here
        content = file.read()

    return jsonify({'content': content})


@app.route('/api/save-file', methods=['POST'])
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



######################################################
# Runtest page functions                             #
######################################################
@app.route('/runtest')
def runtest():
    return render_template('runtest.html')

@app.route('/api/runtest-start', methods=['POST'])
def post_runtest_start():
    global radware_waf_tester

    # Get the configuration from the request data
    data = request.get_json()
    configuration_file = path.join("configurations", data.get("configuration_file", "config.json"))
    test_file = path.join("testfiles", data.get("test_file", "tests.json"))
    report_success = data.get("success", False)
    report_failure = data.get("failure", False)

    # Create a new RadwareWAFTester instance
    radware_waf_tester = RadwareWAFTester(
        configuration_file=configuration_file,
        test_file=test_file,
        report_success=report_success,
        report_failure=report_failure,
        payload_path=path.join("payloadDB"),
        ui=True
    )

    # Start the test
    Thread(target=radware_waf_tester.start_test, args=(radware_waf_tester.get_url(),)).start()

    return jsonify({"message": "Test started"})




@app.route('/api/runtest-progress', methods=['GET'])
def get_runtest_progress():
    # Get the current progress from the RadwareWAFTester instance
    progress = radware_waf_tester.test_progress

    # If the test is complete, include the results filename in the redirect URL
    # if progress['test_complete']:
    #     return redirect(url_for('results', filename=progress['results_filename']))

    # Return the progress as JSON
    return jsonify(progress)

######################################################
# Results page functions                             #
######################################################
@app.route('/api/reports-files', methods=['GET'])
def get_reports_files():
    reports_folder = os.path.join(__folder__, 'reports')
    report_files = [f for f in os.listdir(reports_folder) if os.path.isfile(os.path.join(reports_folder, f))]
    return jsonify(report_files)

@app.route('/results')
def results():
    return render_template('results.html')

@app.route('/summary', methods=['GET'])
def get_summary():
    # Get overall Passed and Failed
    filename = request.args.get('filename', default=None, type=str)
    if filename is None:
        return jsonify({"error": "filename parameter is required"}), 400
    report_file = path.join(path.dirname(__file__),"reports",filename)
    report = TestReport(report_file)
    return jsonify(report.get_summary())

@app.route('/category_total_failed_passed', methods=['GET'])
def category_total_failed_passed():
    filename = request.args.get('filename', default=None, type=str)
    if filename is None:
        return jsonify({"error": "filename parameter is required"}), 400
    report_file = path.join(path.dirname(__file__),"reports",filename)
    report = TestReport(report_file)
    return jsonify(report.get_total_failed_passed())

@app.route('/api/tests-files', methods=['GET'])
def get_tests_files():
    tests_files_dir = path.join(__folder__, "testfiles")
    tests_files = [f for f in os.listdir(tests_files_dir) if os.path.isfile(os.path.join(tests_files_dir, f))]

    return jsonify(tests_files)

@app.route('/api/configurations-files', methods=['GET'])
def get_configurations_files():
    configurations_files_dir = path.join(__folder__, "configurations")
    configurations_files = [f for f in os.listdir(configurations_files_dir) if os.path.isfile(os.path.join(configurations_files_dir, f))]

    return jsonify(configurations_files)


@app.route('/overall_passed_failed', methods=['GET'])
def overall_passed_failed():
    # Get overall Passed and Failed
    filename = request.args.get('filename', default=None, type=str)
    if filename is None:
        return jsonify({"error": "filename parameter is required"}), 400
    report_file = path.join(path.dirname(__file__),"reports",filename)
    report = TestReport(report_file)
    return jsonify(report.get_total_failed_passed())

@app.route('/category_passed_failed', methods=['GET'])
def category_passed_failed():
    # Get Passed and Failed per category
    filename = request.args.get('filename', default=None, type=str)
    if filename is None:
        return jsonify({"error": "filename parameter is required"}), 400
    report_file = path.join(path.dirname(__file__),"reports",filename)
    report = TestReport(report_file)
    return jsonify(report.get_passed_failed_per_category())

@app.route('/test_passed_failed', methods=['GET'])
def test_passed_failed():
    # Get Passed and Failed per test
    filename = request.args.get('filename', default=None, type=str)
    if filename is None:
        return jsonify({"error": "filename parameter is required"}), 400
    report_file = path.join(path.dirname(__file__),"reports",filename)
    report = TestReport(report_file)
    return jsonify(report.get_passed_failed_per_test())

@app.route('/test_passed_failed_specific_category', methods=['GET'])
def test_passed_failed_specific_category():
    # Get Passed and Failed per test for a specific category
    filename = request.args.get('filename', default=None, type=str)
    category = request.args.get('category', default=None, type=str)
    if filename is None or category is None:
        return jsonify({"error": "filename and category parameters are required"}), 400
    report_file = path.join(path.dirname(__file__),"reports",filename)
    report = TestReport(report_file)
    return jsonify({test: details for test, details in report.get_passed_failed_per_test().items() if test.startswith(category)})















if __name__ == "__main__":
    app.run(debug=True)