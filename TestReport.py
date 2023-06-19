import json

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

    def get_failed_details(self, category_name, test_name):
        return self.report[category_name][test_name]['Details']['Failed']

    def get_passed_details(self, category_name, test_name):
        return self.report[category_name][test_name]['Details']['Passed']

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


    def get_passed_failed_per_category(self):
        details = {}
        for category, tests in self.report.items():
            details[category] = {
                "Passed": tests['Category Summary']['Passed'],
                "Failed": tests['Category Summary']['Failed']
            }
        return details
