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
from results import results_page
from tests import tests_page
from database import database_page
from exportPDF import exportPDF

from collections import defaultdict
from jinja2 import Environment, select_autoescape, FileSystemLoader, ext
app = Flask(__name__)
app.register_blueprint(results_page)
app.register_blueprint(tests_page)
app.register_blueprint(database_page)
app.register_blueprint(exportPDF)
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
# Database page functions                            #
######################################################





######################################################
# Results page functions                             #
######################################################
# @app.route('/api/reports-files', methods=['GET'])
# def get_reports_files():
#     reports_folder = os.path.join(__folder__, 'reports')
#     report_files = [f for f in os.listdir(reports_folder) if os.path.isfile(os.path.join(reports_folder, f))]
#     return jsonify(report_files)

# @app.route('/results')
# def results():
#     return render_template('results.html')






# @app.route('/overall_passed_failed', methods=['GET'])
# def overall_passed_failed():
#     # Get overall Passed and Failed
#     filename = request.args.get('filename', default=None, type=str)
#     if filename is None:
#         return jsonify({"error": "filename parameter is required"}), 400
#     report_file = path.join(path.dirname(__file__),"reports",filename)
#     report = TestReport(report_file)
#     return jsonify(report.get_total_failed_passed())

# @app.route('/category_passed_failed', methods=['GET'])
# def category_passed_failed():
#     # Get Passed and Failed per category
#     filename = request.args.get('filename', default=None, type=str)
#     if filename is None:
#         return jsonify({"error": "filename parameter is required"}), 400
#     report_file = path.join(path.dirname(__file__),"reports",filename)
#     report = TestReport(report_file)
#     return jsonify(report.get_passed_failed_per_category())


# @app.route('/test_passed_failed_specific_category', methods=['GET'])
# def test_passed_failed_specific_category():
#     # Get Passed and Failed per test for a specific category
#     filename = request.args.get('filename', default=None, type=str)
#     category = request.args.get('category', default=None, type=str)
#     if filename is None or category is None:
#         return jsonify({"error": "filename and category parameters are required"}), 400
#     report_file = path.join(path.dirname(__file__), "reports", filename)
#     report = TestReport(report_file)
#     return jsonify(report.get_passed_failed_per_test_for_category(category))


# @app.route('/overall_passed_failed_for_category', methods=['GET'])
# def overall_passed_failed_for_category():
#     # Get overall Passed and Failed for a specific category
#     filename = request.args.get('filename', default=None, type=str)
#     category = request.args.get('category', default=None, type=str)
#     if filename is None or category is None:
#         return jsonify({"error": "filename and category parameters are required"}), 400
#     report_file = path.join(path.dirname(__file__), "reports", filename)
#     report = TestReport(report_file)
#     category_results = report.get_passed_failed_for_category(category)
#     if category_results is not None:
#         return jsonify(category_results)
#     else:
#         return jsonify({"error": f"Category '{category}' not found in report"}), 400
#

# @app.route('/test_detailed_results', methods=['GET'])
# def test_detailed_results():
#     filename = request.args.get('filename')
#     category_name = request.args.get('category')
#     test_name = request.args.get('test')
#     result_type = request.args.get('result_type')
#
#     if not filename or not category_name or not test_name or not result_type:
#         return {"error": "Missing required parameters"}, 400
#
#     report_file = path.join(path.dirname(__file__), "reports", filename)
#
#     report = TestReport(report_file)
#
#     result = report.get_detailed_results(category_name, test_name, result_type)
#
#     if result is None:
#         return {"error": "No such category, test, or result type"}, 404
#
#     return jsonify(result)

@app.route('/test_passed_failed', methods=['GET'])
def test_passed_failed():
    # Get Passed and Failed per test
    filename = request.args.get('filename', default=None, type=str)
    if filename is None:
        return jsonify({"error": "filename parameter is required"}), 400
    report_file = path.join(path.dirname(__file__),"reports",filename)
    report = TestReport(report_file)
    return jsonify(report.get_passed_failed_per_test())

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

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
