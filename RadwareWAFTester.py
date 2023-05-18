import re
import json
import logging
import requests
from os import path
from multiprocessing.pool import ThreadPool
from requests.compat import urlparse, urljoin, quote_plus
from datetime import datetime


__app_name__ = "Radware WAF Tester"
__version__ = "1.0.0"
__folder__ = path.abspath(path.dirname(__file__))

# Configuration template
# TODO use template to verify configurations.json file validity
CONFIG_TEMPLATE = {
    "application_url": "",
    "blocking_page_regex": "Case ID:\\s*([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})",
    "threads": 25,
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
}


class RadwareWAFTester(object):
    """A class for testing a server protected by a Radware WAF product using payload files"""

    def __init__(self, configuration_file=path.join(__folder__, "configurations", "config.json"),
                 test_file=path.join(__folder__, "testfiles", "tests.json"), payload_path=path.join(__folder__, "payloadDB"),
                 report_path=path.join(__folder__, "reports", "report.json"), report_success=False, report_failure=False):
        """
        Initializes the RadwareWAFTester instance.

        :param configuration_file: The path to the configuration file. Defaults to 'configurations/config.json'.
        :type configuration_file: str
        :param test_file: The path to the test file. Defaults to 'testfiles/tests.json'.
        :type test_file: str
        :param payload_path: The root folder containing the payload directories and files. Defaults to 'payloadDB'.
        :type payload_path: str
        :param report_path: The path where the test report will be saved. Defaults to a timestamped report file in 'reports' folder.
        :type report_path: str
        :param report_success: Whether or not to include successful tests in the report. Defaults to False.
        :type report_success: bool
        :param report_failure: Whether or not to include failed tests in the report. Defaults to False.
        :type report_failure: bool
        """
        # Get current date and time
        current_datetime = datetime.now()
        # Format the date and time string
        formatted_datetime = current_datetime.strftime("report-%m_%d_%y-%I_%M%p.json")

        # Set the default value for report_path if it's not provided
        if report_path is None:
            self.report_path = path.join(__folder__, "reports", formatted_datetime)
        else:
            self.report_path = report_path
        # Initialize the logger
        self.logger = logging.getLogger(__name__)

        # Load the configuration file
        self.config = self._load_tests(configuration_file)

        # Load the test file
        self.tests = self._load_tests(test_file)

        # Set Folder path containing the payload databases configured in test json file
        self.payload_path = payload_path
        self.report_success = report_success
        self.report_failure = report_failure

        # Create a thread pool with the number of threads specified in the configuration file
        self.pool = ThreadPool(self.config.get("threads"))

        # Initialize the report  dictionaries
        self.report = {}

    @staticmethod
    def _load_config(configuration_file):
        if not path.exists(configuration_file):
            raise FileNotFoundError("Configuration not found, you can initialize the default configuration.")

        with open(configuration_file) as cf:
            return json.load(cf)

    @staticmethod
    def _load_tests(test_file):
        with open(test_file) as tf:
            return json.load(tf)

    def export_report(self, report_path='report.json'):
        def serialize(value):
            """Serialize non-serializable values."""
            if isinstance(value, ValueError):
                return str(value)
            elif isinstance(value, set):
                return list(value)
            else:
                return repr(value)
        report = self.get_report()
        report = json.dumps(report, indent=2, sort_keys=True, default=serialize)
        with open(report_path, 'w') as f:
            f.write(report)
            f.flush()



    def get_url(self):
        """Returns the application URL from the configuration."""
        return self.config["application_url"]

    def get_report(self):
        """Returns the test report."""
        report = self.report
        return report

    def start_test(self, url):
        """
        Iterates through all the tests specified in the `tests` dictionary, and sends requests with the payloads
        in various locations (URL, parameters, cookies, headers, or body), based on the test's configuration.

        Args:
            url (str): The base URL of the application to be tested.
        """
        # Iterate through the payload files specified for the current test
        for test_category, tests in self.tests.items():

            test_name = test_category

            for key, val in tests.items():
                test = key
                # Skip the test if it's marked to be skipped
                if val["skip"] is True:
                    continue

                # Iterate through the payloads files specified for the current test
                for db in val["payloads_files"]:
                    expected = db["expected"]
                    http_method = db.get("method", "GET")  # Get the HTTP method from the test definition or default to GET

                    # Read the payloads from the file
                    with open(path.join(self.payload_path, db["file"]), encoding="utf8") as payloads_file:
                        payloads = payloads_file.readlines()

                    # Iterate through the payloads
                    # TODO add multiple checks of payload to identify charecters or formatting which can crash the code
                    for payload in payloads:
                        headers = {}
                        if payload.endswith('\n'):
                            payload = payload.rstrip('\n')
                        headers["User-Agent"] = self.config["User-Agent"]
                        if self.config["Host"]:
                            headers["Host"] = self.config["Host"]
                        if self.config["xff"]:
                            headers.update(self.config["xff"])
                        if val["headers"]:
                            headers.update(val["headers"])

                        # Send requests with the payload in the URL
                        if val["payload_location"]["url"]:
                            location = "url"
                            self.send_request(urljoin(url, payload), headers, test_name, test, payload, location, expected, http_method=http_method)


                        # Send requests with the payload as a parameter
                        if val["payload_location"]["parameters"]:
                            for param in val["payload_location"]["parameters"]:
                                location = "Parameter: " + param
                                self.send_request(url, headers, test_name, test, payload, location, expected, params=param, http_method=http_method)

                        # Send requests with the payload as a cookie
                        if val["payload_location"]["cookies"]:
                            for cookie in val["payload_location"]["cookies"]:
                                location = "cookie:" + cookie
                                headers["cookie"] = "{}={}".format(cookie, payload)
                                self.send_request(url, headers, test_name, test, payload, location, expected, http_method=http_method)
                                del headers["cookie"]

                        # Send requests with the payload in the body
                        # TODO add support for multiple body parameters and multiple http methods
                        if val["payload_location"]["body"]:
                            body_info = val["payload_location"]["body"]
                            content_type = body_info.get("type", "non-json")
                            http_method = body_info["method"]
                            body = {body_info["parameter"]: payload}
                            location = "Body"
                            self.send_request(url, headers, test_name, test, payload, location, expected, content_type=content_type, http_method=http_method, body=body)

                        # Send requests with the payload in the headers
                        if val["payload_location"]["headers"]:
                            for header in val["payload_location"]["headers"]:
                                if header.lower() in map(str.lower, self.config.keys()) or header.lower() in map(str.lower,self.config["xff"].keys()):
                                    temp = header
                                    headers[header] = payload.lstrip()
                                    self.send_request(url, headers, test_name, test, payload, location, expected, http_method=http_method)
                                    location = "Header: " + header
                                    headers[header] = temp
                                else:
                                    location = "Header: " + header
                                    headers[header] = payload.lstrip()
                                    self.send_request(url, headers, test_name, test, payload, location, expected, http_method=http_method)

        print("Test Complete")
        self.export_report(report_path=self.report_path)

    def send_request(self, url, headers, test_name, test, payload, location, expected, **kwargs):
        """
        Send an HTTP request to the specified URL with the given parameters and headers.
        This method will then analyze the response and generate a report based on the results.

        Args:
            url (str): The target URL for the request.
            headers (dict): A dictionary containing the headers to be sent with the request.
            test_name (str): The name of the test being performed.
            test (str): The specific test being performed.
            payload (str): The payload to be used in the request.
            location (str): The location of the payload in the request (e.g., URL, header, cookie, etc.).
            expected (str): The expected response from the server.
            **kwargs: Optional keyword arguments that can include:
                - params (dict): A dictionary containing query parameters to be sent with the request.
                - http_method (str): The HTTP method to be used for the request (e.g., GET, POST, PUT, DELETE, etc.).
                - content_type (str): The content type of the payload (e.g., "json" or "non-json").
        """
        response = None
        error = None

        # Get the values of params, http_method, and content_type from kwargs
        params = kwargs.get("params", None)
        body = kwargs.get("body", None)
        http_method = kwargs.get("http_method", "GET")
        content_type = kwargs.get("content_type", "non-json")

        # Prepare the request data
        req_data = {
            "url": url,
            "headers": headers,
            "method": http_method,
            "verify": False,
        }

        # Add query parameters if provided
        if params:
            req_data["params"] = {params: payload}

        # Add the payload as JSON or regular data based on content_type
        if body:
            if content_type == "json":
                req_data["json"] = body
            else:
                req_data["data"] = body

        # Send the request and store the response
        try:
            response = requests.request(**req_data)
            response_content = response.content
        except Exception as ex:
            error = ex
            print(error)
        try:
            self.analyze_response(response, test_name, test, payload, location, expected, error, response_content)
        except Exception as ex:
            error = ex
            print(error)

    def analyze_response(self, response, test_name, test, payload, location, expected, error, response_content):
        """
        Analyze the response from the send_request method and generate a report entry.

        :param response: The response object returned by the send_request method.
        :param test_name: The name of the test being performed.
        :param payload: The payload used in the request.
        :param location: The location of the payload in the request (e.g., URL, header, cookie, etc.).
        :param expected: The expected response from the server.
        :param error: Any error encountered while sending the request.
        :param response_content: The content of the response.
        """
        # Initialize the report for the test_name if it doesn't exist
        if test_name not in self.report:
            self.report[test_name] = {
                "Summary": {"Failed": 0, "Passed": 0},
                "Details": {"Failed": {}, "Passed": {}},
            }

        trans_id = ""
        try:
            if type(response_content) is bytes:
                re_res = re.search(self.config['blocking_page_regex'], response_content.decode("utf-8"))
            else:
                re_res = re.search(self.config['blocking_page_regex'], response_content)

            if re_res:
                trans_id = re_res.group(1)
        except Exception as ex:
            error = str(ex)
            if "codec can't decode byte" in error:
                re_res = re.search(self.config['blocking_page_regex'], response_content.decode("unicode_escape"))

        result = {
            "test": test,
            "payload": payload,
            "location": location,
            "result": trans_id if trans_id else error
        }

        # Update the report based on the test results
        if re_res and expected == "block":
            self.report[test_name]["Summary"]["Passed"] += 1
            log_result = "pass"
            if self.report_success is True:
                pass_count = self.report[test_name]["Summary"]["Passed"]
                self.report[test_name]["Details"]["Passed"][pass_count] = result
        elif not re_res and expected == "pass":
            self.report[test_name]["Summary"]["Passed"] += 1
            log_result = "pass"
            if self.report_success is True:
                pass_count = self.report[test_name]["Summary"]["Passed"]
                self.report[test_name]["Details"]["Passed"][pass_count] = result
        else:
            self.report[test_name]["Summary"]["Failed"] += 1
            log_result = "failed"
            if self.report_failure is True:
                fail_count = self.report[test_name]["Summary"]["Failed"]
                self.report[test_name]["Details"]["Failed"][fail_count] = result

        # Log the test results
        self.logger.info(
            "Test Name: {test_name} \nPayload Location: {location}\nTest Result: {result}\nPayload: {payload}".format(
                test_name=test_name, location=location, payload=payload,
                result=log_result
            ))


def main(**kwargs):
    """
    The main function to run the RadwareWAFTester tests. This function initializes the
    RadwareWAFTester object with the provided configuration and test files, and then
    starts the test with the application URL.

    **kwargs: Optional keyword arguments that can include:
        - configuration_file (str): Path to the configuration file. Default is "configurations/config.json".
        - test_file (str): Path to the test file. Default is "testfiles/tests.json".
        - report_path (str): Path to the report file. Default is None.
        - payload_path (str): Path to the payload directory. Default is "payloadDB".
        - success (bool): Report successful test results. Default is False.
        - failure (bool): Report failed test results. Default is False.
    """
    if kwargs:
        configuration_file = kwargs.get("configuration_file", "configurations/config.json")
        test_file = kwargs.get("test_file", "testfiles/tests.json")
        report_path = kwargs.get("report_path", None)
        payload_path = kwargs.get("payload_path", "payloadDB")
        report_success = kwargs.get("success", False)
        report_failure = kwargs.get("failure", False)
    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s %(levelname)s %(message)s",
                        datefmt="%d-%m-%y %H:%M:%S")
    logging.getLogger("requests.packages.urllib3.connectionpool").disabled = True

    test = RadwareWAFTester(configuration_file=configuration_file,test_file=test_file,report_path=report_path,report_success=report_success,report_failure=report_failure, payload_path=payload_path)
    test.start_test(test.get_url())


#main(success=True, failure=True, payload_path=path.join("payloadDB", "OWASP-top10"), test_file=path.join("testfiles", "owasp.json"))