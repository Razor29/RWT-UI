import os
import json
import shutil
from flask import Flask, render_template, url_for, request, jsonify
from pathlib import Path
from os import path
from TestReport import TestReport
from collections import defaultdict
from jinja2 import Environment, select_autoescape, FileSystemLoader, ext
app = Flask(__name__)
app.jinja_env.add_extension('jinja2.ext.do')



__folder__ = path.abspath(path.dirname(__file__))

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
    config_data["threads"] = int(config_data["threads"])

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
    return Path(__file__).parent / "test_files" / f"{filename}.json"



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
                        "expected": "block"
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
                    "expected": "block"
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
                "expected": "block"
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
    content[category][test]['body type'] = properties['body type']

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
    location = data.get('location')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if category not in content or test not in content[category]:
        return jsonify({"error": "category or test does not exist"}), 400

    content[category][test]['payload_location'] = location

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "location updated successfully"}), 200
######################################################
# Database page functions                            #
######################################################
@app.route('/database')
def database():
    return render_template('database.html')

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

######################################################
# Runtest page functions                             #
######################################################
@app.route('/runtest')
def runtest():
    return render_template('runtest.html')

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
    filename = request.args.get('filename', default=None, type=str)
    if filename is None:
        return jsonify({"error": "filename parameter is required"}), 400
    report_file = path.join(path.dirname(__file__),"reports",filename)
    report = TestReport(report_file)
    return jsonify(report.get_summary())

@app.route('/total_failed_passed', methods=['GET'])
def total_failed_passed():
    filename = request.args.get('filename', default=None, type=str)
    if filename is None:
        return jsonify({"error": "filename parameter is required"}), 400
    report_file = path.join(path.dirname(__file__),"reports",filename)
    report = TestReport(report_file)
    return jsonify(report.get_total_failed_passed())


######################################################
# Unknown page functions                             #
######################################################
import os
import json
from collections import defaultdict






@app.route('/api/tests-files', methods=['GET'])
def get_tests_files():
    tests_files_dir = path.join(__folder__, "testfiles")
    tests_files = [f for f in os.listdir(tests_files_dir) if os.path.isfile(os.path.join(tests_files_dir, f))]

    return jsonify(tests_files)





@app.route('/api/payload-dbs', methods=['GET'])
def get_payload_dbs():
    payload_db_dir = path.join(__folder__, "payloadDB")
    payload_dbs = [d for d in os.listdir(payload_db_dir) if os.path.isdir(os.path.join(payload_db_dir, d))]
    return jsonify(payload_dbs)

@app.route('/api/tests', methods=['GET'])
def get_tests():
    json_files_dir = path.join(__folder__, "testfiles")
    tests = []
    stats = []

    # Iterate over each JSON file in the directory
    for filename in os.listdir(json_files_dir):
        if filename.endswith('.json'):
            with open(os.path.join(json_files_dir, filename), 'r') as file:
                data = json.load(file)

                # Initialize variables for statistics
                categories_count = 0
                tests_count = 0

                for category, category_data in data.items():
                    test_data = []
                    for test_name, test_info in category_data.items():
                        test_data.append({
                            'name': test_name,
                            'skip': test_info['skip'],
                            'headers': test_info['headers'],
                            'bodyType': test_info['body type'],
                            'payloadLocation': test_info['payload_location'],
                            'payloadFiles': test_info['payloads_files']
                        })

                    categories_count += 1
                    tests_count += len(test_data)

                    tests.append({
                        'filename': filename,
                        'categories': [{
                            'name': category,
                            'tests': test_data
                        }]
                    })

                # Append file statistics to the stats list
                stats.append({
                    'filename': filename,
                    'categories_count': categories_count,
                    'tests_count': tests_count
                })

    # Get the list of directories in the 'PayloadDB' folder
    payload_db_dir = path.join(__folder__, 'PayloadDB')
    payload_dbs = [name for name in os.listdir(payload_db_dir) if os.path.isdir(os.path.join(payload_db_dir, name))]

    return jsonify({'tests': tests, 'payloadDbs': payload_dbs, 'stats': stats})





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





# Routes for results page




if __name__ == "__main__":
    app.run(debug=True)