import os
from flask import Blueprint, Flask, render_template, redirect, url_for, request, jsonify, send_file
from os import path
from TestReport import TestReport

__folder__ = path.abspath(path.dirname(__file__))

results_page = Blueprint('results_page', __name__)


@results_page.route('/results')
def results():
    return render_template('results.html')

@results_page.route('/api/reports-files', methods=['GET'])
def get_reports_files():
    reports_folder = os.path.join(__folder__, 'reports')
    report_files = [f for f in os.listdir(reports_folder) if os.path.isfile(os.path.join(reports_folder, f))]
    return jsonify(report_files)


@results_page.route('/test_passed_failed_specific_category', methods=['GET'])
def test_passed_failed_specific_category():
    # Get Passed and Failed per test for a specific category
    filename = request.args.get('filename', default=None, type=str)
    category = request.args.get('category', default=None, type=str)
    if filename is None or category is None:
        return jsonify({"error": "filename and category parameters are required"}), 400
    report_file = path.join(path.dirname(__file__), "reports", filename)
    report = TestReport(report_file)
    return jsonify(report.get_passed_failed_per_test_for_category(category))

@results_page.route('/overall_passed_failed_for_category', methods=['GET'])
def overall_passed_failed_for_category():
    # Get overall Passed and Failed for a specific category
    filename = request.args.get('filename', default=None, type=str)
    category = request.args.get('category', default=None, type=str)
    if filename is None or category is None:
        return jsonify({"error": "filename and category parameters are required"}), 400
    report_file = path.join(path.dirname(__file__), "reports", filename)
    report = TestReport(report_file)
    category_results = report.get_passed_failed_for_category(category)
    if category_results is not None:
        return jsonify(category_results)
    else:
        return jsonify({"error": f"Category '{category}' not found in report"}), 400



@results_page.route('/category_passed_failed', methods=['GET'])
def category_passed_failed():
    # Get Passed and Failed per category
    filename = request.args.get('filename', default=None, type=str)
    if filename is None:
        return jsonify({"error": "filename parameter is required"}), 400
    report_file = path.join(path.dirname(__file__),"reports",filename)
    report = TestReport(report_file)
    return jsonify(report.get_passed_failed_per_category())


@results_page.route('/overall_passed_failed', methods=['GET'])
def overall_passed_failed():
    # Get overall Passed and Failed
    filename = request.args.get('filename', default=None, type=str)
    if filename is None:
        return jsonify({"error": "filename parameter is required"}), 400
    report_file = path.join(path.dirname(__file__),"reports",filename)
    report = TestReport(report_file)
    return jsonify(report.get_total_failed_passed())

@results_page.route('/test_detailed_results', methods=['GET'])
def test_detailed_results():
    filename = request.args.get('filename')
    category_name = request.args.get('category')
    test_name = request.args.get('test')
    result_type = request.args.get('result_type')

    if not filename or not category_name or not test_name or not result_type:
        return {"error": "Missing required parameters"}, 400

    report_file = path.join(path.dirname(__file__), "reports", filename)

    report = TestReport(report_file)

    result = report.get_detailed_results(category_name, test_name, result_type)

    if result is None:
        return {"error": "No such category, test, or result type"}, 404

    return jsonify(result)


@results_page.route('/api/report-json/<filename>', methods=['GET'])
def get_report_json(filename):
    # Ensure filename does not contain path characters
    if '/' in filename or '\\' in filename:
        return jsonify({"error": "Invalid filename"}), 400

    report_file = os.path.join(__folder__, 'reports', filename)
    if not os.path.isfile(report_file):
        return jsonify({"error": "Report file does not exist"}), 404

    return send_file(report_file, mimetype='application/json', as_attachment=True)
