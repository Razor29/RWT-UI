from matplotlib.figure import Figure
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
import matplotlib.pyplot as plt
from PIL import Image as PilImage
from flask import Flask,Blueprint, render_template, redirect, url_for, request, jsonify, send_file, Response
from TestReport import TestReport
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4, landscape
from matplotlib import patches
from matplotlib.transforms import IdentityTransform

from os import path
exportPDF = Blueprint('exportPDF', __name__)

def make_autopct(values):
    def my_autopct(pct):
        total = sum(values)
        val = int(round(pct*total/100.0))
        return '{p:.1f}% ({v:d})'.format(p=pct,v=val)
    return my_autopct

@exportPDF.route('/api/export-pdf/<filename>', methods=['GET'])
def export_pdf(filename):
    report_file = path.join(path.dirname(__file__), "reports", filename)
    report = TestReport(report_file)

    total_passed_failed = report.get_total_failed_passed()
    passed_failed_per_category = report.get_passed_failed_per_category()

    # Create a PDF document
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=10, rightMargin=10, topMargin=10, bottomMargin=10)
    story = []
    styles = getSampleStyleSheet()

    # Add the title
    title = Paragraph('Test Report', styles['Title'])
    story.append(title)
    story.append(Spacer(1, 0.5 * inch))

    # Create the Summary Results Bar Chart
    fig, ax = plt.subplots(figsize=(10, 3))  # Set the figure size.
    categories = list(passed_failed_per_category.keys())
    passed = [passed_failed_per_category[category]['Passed'] for category in categories]
    failed = [passed_failed_per_category[category]['Failed'] for category in categories]
    bars1 = ax.bar(categories, passed, label='Passed')
    bars2 = ax.bar(categories, failed, bottom=passed, label='Failed')

    # Add the actual numbers on the bar chart
    for bars in [bars1, bars2]:
        for bar in bars:
            yval = bar.get_height()
            ax.text(bar.get_x() + bar.get_width() / 2.0, yval, int(yval), va='bottom')  # va: vertical alignment

    ax.legend()

    plt.xticks(rotation=0, fontsize=8)  # Rotate x-axis labels and set font size.

    chart_stream = BytesIO()
    plt.savefig(chart_stream, format='png', dpi=300)  # Save with high dpi
    chart_stream.seek(0)
    chart_image = Image(chart_stream, width=A4[0] - 20, height=(A4[0] - 20) * 3 / 10)

    story.append(chart_image)
    story.append(Spacer(1, 0.5 * inch))

    # Create the Total Passed/Failed Pie Chart
    fig, ax = plt.subplots(figsize=(3, 3))  # 40% smaller and square aspect ratio for round pie chart

    autopct = make_autopct([total_passed_failed['Passed'], total_passed_failed['Failed']])
    wedges, texts, autotexts = ax.pie([total_passed_failed['Passed'], total_passed_failed['Failed']],
                                      labels=['Passed', 'Failed'], autopct=autopct)

    for text in autotexts:
        text.set_fontsize(6)  # make the text labels for the pie chart slices smaller.

    chart_stream = BytesIO()
    plt.savefig(chart_stream, format='png', dpi=300,
                bbox_inches='tight')  # Ensure the entire pie chart fits into the figure size
    chart_stream.seek(0)
    chart_image = Image(chart_stream, width=(A4[0] - 20) * 0.4, height=(A4[1] - 20) * 0.22)  # 40% of the original size
    story.append(chart_image)
    story.append(Spacer(1, 0.5 * inch))

    # Save the PDF
    doc.build(story)
    buffer.seek(0)
    return Response(buffer, headers={
        "Content-Disposition": "attachment; filename=report.pdf",
        "Content-Type": "application/pdf"
    })

