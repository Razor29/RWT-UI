
import os
from flask import Blueprint, Flask, render_template, redirect, url_for, request, jsonify
from os import path
__folder__ = path.abspath(path.dirname(__file__))
import json
from flask import Flask, render_template, redirect, url_for, request, jsonify
from pathlib import Path

tests_page = Blueprint('tests_page', __name__)



def get_test_file_path(filename):
    return Path(__file__).parent / "testfiles" / f"{filename}.json"



@tests_page.route('/tests')
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


@tests_page.route('/api/get-test-payload-files', methods=['GET'])
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

@tests_page.route('/api/test-file',methods=['POST'])
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

@tests_page.route('/api/test-file',methods=['DELETE'])
def delete_test_file():
    data = request.get_json()
    filename = data.get('filename')
    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    os.remove(file_path)

    return jsonify({"message": "file deleted successfully"}), 200

@tests_page.route('/api/test-file-name',methods=['PUT'])
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

@tests_page.route('/api/test-file-category',methods=['PUT'])
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

@tests_page.route('/api/test-file-category',methods=['POST'])
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

@tests_page.route('/api/test-file-category',methods=['DELETE'])
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

@tests_page.route('/api/test-file-skip',methods=['PUT'])
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




@tests_page.route('/api/test-file-test',methods=['PUT'])
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

@tests_page.route('/api/test-file-test',methods=['POST'])
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

@tests_page.route('/api/test-file-test',methods=['DELETE'])
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

@tests_page.route('/api/test-file-properties',methods=['PUT'])
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

@tests_page.route('/api/test-file-files',methods=['PUT'])
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

@tests_page.route('/api/test-file-location',methods=['PUT'])
def update_test_file_location():
    data = request.get_json()
    filename = data.get('filename')
    category = data.get('category')
    test = data.get('test')
    body_type = data.get('body_type')
    location = data.get('location')

    file_path = get_test_file_path(filename)

    if not file_path.exists():
        return jsonify({"error": "file does not exist"}), 400

    with file_path.open() as f:
        content = json.load(f)

    if category not in content or test not in content[category]:
        return jsonify({"error": "category or test does not exist"}), 400

    content[category][test]['payload_location'] = location
    content[category][test]['body_type'] = body_type

    with file_path.open('w') as f:
        json.dump(content, f)

    return jsonify({"message": "location updated successfully"}), 200