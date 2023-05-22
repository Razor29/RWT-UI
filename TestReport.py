import json


class TestReport:
    def __init__(self, file_path):
        with open(file_path, 'r') as json_file:
            self.report = json.load(json_file)

    def get_summary(self):
        summary = {}
        for test, details in self.report.items():
            summary[test] = details['Summary']
        return summary

    def get_test_summary(self, test_name):
        return self.report[test_name]['Summary']

    def get_passed_failed_per_test(self):
        details = {}
        for test, data in self.report.items():
            details[test] = {
                "Passed": len(data['Details']['Passed']),
                "Failed": len(data['Details']['Failed'])
            }
        return details

    def get_failed_details(self, test_name):
        return self.report[test_name]['Details']['Failed']

    def get_passed_details(self, test_name):
        return self.report[test_name]['Details']['Passed']

    def get_total_failed_passed(self):
        total = {
            "Failed": 0,
            "Passed": 0
        }

        for test, details in self.report.items():
            total["Failed"] += int(details['Summary']["Failed"])
            total["Passed"] += int(details['Summary']["Passed"])
        return total
    def get_test_list(self):
        return list(self.report.keys())

# TestReport instance initialization
report = TestReport('reports/report-05_22_23-07_04AM.json')

# Fetching the required information
print(report.get_summary())
print(report.get_total_failed_passed())
# print(report.get_test_list())
# print(report.get_test_summary("A01:2021 - Broken Access Control"))
# print(report.get_passed_failed_per_test())
# print(report.get_failed_details("A01:2021 - Broken Access Control"))
# print(report.get_passed_details("A01:2021 - Broken Access Control"))
