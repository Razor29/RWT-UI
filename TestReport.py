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


