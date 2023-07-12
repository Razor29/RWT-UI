import json
import csv
class TestReport:
    def __init__(self, file_path):
        with open(file_path, 'r') as json_file:
            self.report = json.load(json_file)

    def get_summary(self):
        summary = {}
        for category, tests in self.report.items():
            summary[category] = tests['Category Summary']
        return summary

    def get_test_summary(self, category_name, test_name):
        return self.report[category_name][test_name]['Test Summary']

    def get_passed_failed_per_test(self):
        details = {}
        for category, tests in self.report.items():
            for test, data in tests.items():
                if test != "Category Summary":
                    details[test] = {
                        "Passed": len(data['Details']['Passed']),
                        "Failed": len(data['Details']['Failed'])
                    }
        return details


    def get_detailed_results(self, category_name, test_name, result_type):
        if result_type not in ["Failed", "Passed"]:
            raise ValueError("result_type parameter must be either 'Failed' or 'Passed'")
        try:
            return self.report[category_name][test_name]['Details'][result_type]
        except KeyError:
            return None

    def get_total_failed_passed(self):
        total = {
            "Failed": 0,
            "Passed": 0
        }

        for category, tests in self.report.items():
            total["Failed"] += int(tests['Category Summary']["Failed"])
            total["Passed"] += int(tests['Category Summary']["Passed"])
        return total

    def get_category_list(self):
        return list(self.report.keys())

    def get_test_list(self, category_name):
        return [test for test in self.report[category_name].keys() if test != "Category Summary"]

    def get_passed_failed_per_test_for_category(self, category_name):
        details = {}
        for test, data in self.report[category_name].items():
            if test != "Category Summary":
                details[test] = {
                    "Passed": len(data['Details']['Passed']),
                    "Failed": len(data['Details']['Failed'])
                }
        return details

    def get_passed_failed_per_category(self):
        details = {}
        for category, tests in self.report.items():
            details[category] = {
                "Passed": tests['Category Summary']['Passed'],
                "Failed": tests['Category Summary']['Failed']
            }
        return details


    def get_passed_failed_for_category(self, category_name):
        category_summary = self.report.get(category_name, {}).get('Category Summary')
        if category_summary:
            return {
                "Passed": category_summary['Passed'],
                "Failed": category_summary['Failed']
            }
        else:
            return None

    def export_to_csv(self, csv_file_path, filename):
        test_date, test_time = self._parse_filename(filename)

        row = {
            "Category": '', "Test": '', "Location": '',
            "Payload": '', "Result": '', "Status Code": '',
            "Test Date": test_date, "Test Time": test_time
        }

        with open(csv_file_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ["Category", "Test", "Location", "Payload", "Result", "Status Code", "Test Date", "Test Time"]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()
            for category, tests in self.report.items():
                for test_name, test_data in tests.items():
                    if test_name != 'Category Summary':
                        for result_type, results in test_data['Details'].items():
                            for result in results.values():
                                row.update({
                                    "Category": category,
                                    "Test": test_name,
                                    "Location": result.get('location', ''),
                                    "Payload": result.get('payload', ''),
                                    "Result": result_type,
                                    "Status Code": result.get('status_code', '')
                                })
                                writer.writerow(row)
                                row.update({
                                    "Category": '', "Test": '', "Location": '',
                                    "Payload": '', "Result": '', "Status Code": '',
                                    "Test Date": '', "Test Time": ''
                                })

    def _parse_filename(self, filename):
        print(filename)
        filename = filename.replace("report-", "").replace(".json", "")
        print(filename)
        date_part, time_part = filename.split("-")

        month, day, year = date_part.split("_")
        date = f'{month}/{day}/{year}'

        hour, minute = time_part[:-4], time_part[-4:-2]
        time = f'{hour}:{minute} {"AM" if "AM" in time_part else "PM"}'

        return date, time


