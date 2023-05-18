# Radware WAF tester

Version 1.0

Radware WAF Tester is a Python-based testing tool designed to test the effectiveness of your Web Application Firewall (WAF) by simulating various attack patterns and evaluating the WAF's ability to block or allow the traffic. The tool reads a set of test cases from a JSON file and sends requests with payloads to the target application, checking if the WAF blocks or allows the request based on the test case configuration.

## Install

Follow these steps to install and run the Radware WAF Tester:

### Prerequisites

- Python 3.6 or higher
- `requests` library

### Installation Steps
1. Clone the repository
2. Change to the project directory:
```
cd radware-waf-tester
```
3. Install the required dependencies:
```
pip install -r requirements.txt
```

## Usage

To run the Radware WAF Tester, use the test_waf.py script with the appropriate command-line arguments.

```
python test_waf.py [options]
```
Available options:
- `-v, --version`: Display the version of the Radware WAF Tester.
- `-c, --config:` Path to the configuration file. Default: config/config.json.
- `-t, --tests`: Path to the tests file. Default: config/test.json.
- `-p, --path`: Test DB root path. Default: tests.
- `-r, --report`: Report file save path. Default: report.json.
- `--failure`: Include details of failed tests. Default: true.
- `--success`: Include details of successful tests. Default: true.

For example, to run the WAF Tester with a custom configuration file and tests file, you can use the following command:
```
python test_waf.py -c path/to/config.json -t path/to/tests.json
```


## Configuration

The application uses two main configuration files: config.json and tests.json.

### config.json
The config.json file contains the configuration for the application and WAF, such as the target application URL, headers, and other settings. Here is an example configuration file:
```
{
    "application_url": "http://10.100.0.137:31022/",
    "blocking_page_regex": "Case ID:\\s*([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})",
    "threads": 2,
    "User-Agent" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    "Host": "hackazon.kwaf.lab",
    "xff": {"X-Forwarded-For": ""}
}   
```
- `application_url`: The target application URL that the tool will send requests to.
- `blocking_page_regex`: A regular expression used to detect if a request was blocked by the WAF.
- `threads`: The number of concurrent threads the tool will use when sending requests.
- `User-Agent`: The User-Agent header value to be used in requests.
- `Host`: The Host header value to be used in requests.
- `xff`: The X-Forwarded-For header name and value to be used in requests.

### tests.json
The tests.json file contains the test cases for various attack patterns. Each test case specifies the headers, body type, payload location, and expected result for a request. Here is an example of a test case:

```
{
    "A01:2021 - Broken Access Control": {
        "Path Traversal - URL": {
            "skip": false,
            "headers": {
                "Accept": "*/*"
            },
            "body type": "",
            "payload_location": {
                "url": true,
                "body": {},
                "headers": [],
                "cookies": {},
                "parameters": {}
            },
            "payloads_files": [
                {
                    "file": "A01/A01 Path Traversal URL.txt",
                    "expected": "block"
                }
            ]
        }
    }
}
```
- **Category Name**: This represents the first level in the JSON object structure and contains multiple tests under it. Each category name represents a specific security risk or attack type, e.g., "A01:2021 - Broken Access Control".
- **Test Name**: This represents the second level in the JSON object structure and is the individual test name within a category, e.g., "Path Traversal - URL".
- `skip`: If set to true, the test case will be skipped.
- `headers`: A dictionary of headers to be included in the request.
- `body type`: The type of request body, such as "json" for JSON body or "" for non JSON-based body.
- `payload_location`: Specifies where the payload should be injected in the request (url, body, headers, cookies, or parameters).
- `payloads_files`: An array of dictionaries containing the path to a file with payloads (relative to the tests_root_folder) and the expected result ("block" or "pass").
### Create Custom Tests

The tests.json file provided in this example is the default test file used by the Radware WAF Tester. However, you can create your own custom test files using the same structure as demonstrated in the tests.json file. To use a custom test file, simply specify its path using the -t or --tests option when running the WAF Tester.

Test files are composed of various test categories, such as A01:2021 - Broken Access Control, each containing multiple tests under it, such as Path Traversal - URL and Predictable Resource Location - URL. You can include as many test categories and tests as needed in your custom test file.

It's important to note that the category names and the tests under them are used in the generated report. This allows you to easily identify and analyze the results of each specific test within the context of its category.

Example structure of a custom test file:

```
{
    "Test Category 1": {
        "Test 1": {
            ...
        },
        "Test 2": {
            ...
        }
    },
    "Test Category 2": {
        "Test 1": {
            ...
        },
        "Test 2": {
            ...
        }
    }
}
```
To run the WAF Tester with a custom test file, use the following command:

```
python radware_waf_tester.py -t path/to/custom_tests.json
```
Remember to adjust the path/to/custom_tests.json to the actual path of your custom test file.

#### Test Root Folder

In each test definition within the tests JSON file, you'll find an array under the key payloads_files, which contains one or more dictionaries. Each of these dictionaries represents a payload file, and the file key within these dictionaries indicates the path to the payload file, relative to the tests_root_folder.

For example, if your tests_root_folder is set to 'tests' (which is the default), and in one of your tests you have specified a payload file as 'A01/A01 Path Traversal URL.txt', the WAF Tester will look for this file in 'tests/A01/A01 Path Traversal URL.txt'.

You can specify a custom tests_root_folder using the -p or --path option when running the WAF Tester:

```
python radware_waf_tester.py -p path/to/tests_root_folder
```

Remember to adjust the path/to/tests_root_folder to the actual path of your tests root folder. This is particularly useful when you have a large test suite organized in multiple directories and subdirectories.
