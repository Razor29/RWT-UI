import argparse
import RadwareWAFTester


def create_parser():
    """
    Create an ArgumentParser object to handle command line arguments for the Radware WAF Tester.

    Returns:
        argparse.ArgumentParser: The ArgumentParser object with the specified arguments.
    """
    parser = argparse.ArgumentParser(
        description='Radware WAF Tester',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    parser.add_argument('-v', '--version', action='version', version='%(prog)s 0.0.1')
    parser.add_argument('-c', '--configurations', help='Path to the configuration file',
                        default='configurations/config.json')
    parser.add_argument('-t', '--test_file', help='Path to the test file. Default: %(default)s', default='testfiles/tests.json')
    parser.add_argument('-p', '--payload_path', help='Path to the payload database root. Default: %(default)s', default='payloadDB')
    parser.add_argument('-r', '--report', help='Path to save the report file. Default: /reports/report-timestamp.json', default=None)
    parser.add_argument('--failure', action='store_true', help='Include details of failed payloadDB.')
    parser.add_argument('--success', action='store_true', help='Include details of successful payloadDB.')

    parser.set_defaults(failure=True, success=True)

    return parser


if __name__ == '__main__':
    parser = create_parser()
    args = parser.parse_args()

    arguments = {}
    if args.config:
        arguments["configuration_file"] = args.configurations
    if args.tests:
        arguments["test_file"] = args.test_file
    if args.path:
        arguments["payload_path"] = args.payload_path
    if args.report:
        arguments["config_report"] = args.report
    if args.failure:
        arguments["failure"] = args.failure
    if args.success:
        arguments["success"] = args.success

    RadwareWAFTester.main(**arguments)


