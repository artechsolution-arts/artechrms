"""
Payslip PDF generator — matches AR Tech Solutions payslip format exactly.
"""
import calendar
import io
import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

# ── Brand colours ──────────────────────────────────────────────────────────────
TEAL  = colors.HexColor('#3DC7B3')
NAVY  = colors.HexColor('#0D1F4E')
GRAY  = colors.HexColor('#888888')
LGRAY = colors.HexColor('#f2f2f2')

MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']

# ── Font registration (DejaVu supports ₹ U+20B9) ──────────────────────────────
_FONTS_REGISTERED = False

def _register_fonts() -> tuple[str, str]:
    """Return (normal_font, bold_font) names, registering TTF once."""
    global _FONTS_REGISTERED
    if _FONTS_REGISTERED:
        return 'DVSans', 'DVSans-Bold'
    base = '/usr/share/fonts/truetype/dejavu'
    try:
        pdfmetrics.registerFont(TTFont('DVSans',      f'{base}/DejaVuSans.ttf'))
        pdfmetrics.registerFont(TTFont('DVSans-Bold', f'{base}/DejaVuSans-Bold.ttf'))
        _FONTS_REGISTERED = True
        return 'DVSans', 'DVSans-Bold'
    except Exception:
        return 'Helvetica', 'Helvetica-Bold'


# ── Logo conversion (SVG → PNG, cached in memory) ─────────────────────────────
_LOGO_PNG: bytes | None = None

def _logo_png() -> bytes | None:
    global _LOGO_PNG
    if _LOGO_PNG is not None:
        return _LOGO_PNG
    svg_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'logo.svg')
    if not os.path.exists(svg_path):
        svg_path = '/app/static/logo.svg'
    if not os.path.exists(svg_path):
        return None
    try:
        import cairosvg
        with open(svg_path, 'rb') as f:
            svg_data = f.read()
        _LOGO_PNG = cairosvg.svg2png(bytestring=svg_data, output_width=100, output_height=98)
        return _LOGO_PNG
    except Exception:
        return None


# ── Helpers ────────────────────────────────────────────────────────────────────
def _fmt(val: float | None, font: str = 'Helvetica') -> str:
    if not val:
        return '—'
    return f'₹ {val:,.0f}'   # ₹ using unicode directly


def _p(text: str, font: str, bold_font: str, size=9, bold=False,
       align=TA_LEFT, color=colors.black) -> Paragraph:
    fname = bold_font if bold else font
    return Paragraph(
        str(text),
        ParagraphStyle('_', fontName=fname, fontSize=size,
                       leading=size + 3, alignment=align, textColor=color),
    )


def _draw_corners(canvas, doc):
    """Teal corner decorations at bottom-left (matching the original PDF)."""
    canvas.saveState()
    canvas.setFillColor(TEAL)
    canvas.rect(0, 0, 75, 10, fill=1, stroke=0)
    canvas.rect(0, 0, 10, 75, fill=1, stroke=0)
    canvas.restoreState()


# ── Main generator ─────────────────────────────────────────────────────────────
def generate_payslip_pdf(slip_data: dict) -> bytes:
    """
    Generate payslip PDF bytes matching the AR Tech Solutions format.

    Required keys in slip_data:
        month (int), year (int)
        employee_name, designation, department
        date_of_joining (date | str), bank_account_no, pan
        basic, hra, ca, others, gross_pay
        pf, esi, pt, tds, total_deduction, net_pay
        days_in_month, days_present, cl, sl, el, lop
    """
    font, bfont = _register_fonts()
    buf = io.BytesIO()
    W, H = A4
    MARGIN = 1.5 * cm
    usable = W - 2 * MARGIN

    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        rightMargin=MARGIN, leftMargin=MARGIN,
        topMargin=1.2 * cm, bottomMargin=3 * cm,
    )
    story = []

    # ── 1. Header: logo + company name (right-aligned) ────────────────────────
    logo_cell: list = []
    png = _logo_png()
    if png:
        logo_cell.append(Image(io.BytesIO(png), width=1.1 * cm, height=1.08 * cm))

    name_cell = [
        _p('AR TECH SOLUTIONS', font, bfont, size=12, bold=True, color=NAVY),
        _p('Driven By Innovation', font, bfont, size=7, color=GRAY),
    ]

    logo_inner = Table([[logo_cell, name_cell]], colWidths=[1.3 * cm, None])
    logo_inner.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    header_row = Table([['', logo_inner]], colWidths=[usable * 0.52, usable * 0.48])
    header_row.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_row)
    story.append(Spacer(1, 0.35 * cm))

    # ── 2. Title ──────────────────────────────────────────────────────────────
    month_name = MONTHS[slip_data['month']].upper()
    year = slip_data['year']
    story.append(_p(
        f'<u>PAY-SLIP FOR THE MONTH OF {month_name}-{year}</u>',
        font, bfont, size=12, bold=True, align=TA_CENTER, color=TEAL,
    ))
    story.append(Spacer(1, 0.45 * cm))

    # ── 3. Employee info table ─────────────────────────────────────────────────
    doj = slip_data.get('date_of_joining', '—')
    if hasattr(doj, 'strftime'):
        doj = doj.strftime('%d-%m-%Y')

    def lbl(t): return _p(t, font, bfont, bold=True)
    def val(t): return _p(str(t) if t else '—', font, bfont)

    half = usable / 2
    ei = Table([
        [lbl('Name'),         val(slip_data.get('employee_name', '')),  lbl('Designation'),   val(slip_data.get('designation', ''))],
        [lbl('DOJ'),          val(doj),                                   lbl('Pay Period'),    val(f"{MONTHS[slip_data['month']]} {year}")],
        [lbl('Days in month'),val(slip_data.get('days_in_month', '')),   lbl('PAN'),           val(slip_data.get('pan', 'N/A'))],
        [lbl('Bank A/C'),     val(slip_data.get('bank_account_no', '')), lbl('Location'),      val(slip_data.get('department', ''))],
    ], colWidths=[half * 0.36, half * 0.64, half * 0.36, half * 0.64])
    ei.setStyle(TableStyle([
        ('BOX',         (0, 0), (-1, -1), 0.8, colors.black),
        ('INNERGRID',   (0, 0), (-1, -1), 0.5, colors.black),
        ('VALIGN',      (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',  (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING',(0,0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(ei)
    story.append(Spacer(1, 0.35 * cm))

    # ── 4. Gross Pay | Attendance table ──────────────────────────────────────
    basic        = slip_data.get('basic', 0)
    hra          = slip_data.get('hra', 0)
    ca           = slip_data.get('ca', 0)
    others_earn  = slip_data.get('others', 0)
    gross_pay    = slip_data.get('gross_pay', 0)
    days_present = slip_data.get('days_present', 0)
    cl           = slip_data.get('cl', 0)
    sl           = slip_data.get('sl', 0)
    el           = slip_data.get('el', 0)
    lop          = slip_data.get('lop', 0)
    att_total    = int(days_present) + int(cl) + int(sl) + int(el)

    def hdr(t): return _p(t, font, bfont, bold=True, align=TA_CENTER)
    def rl(t):  return _p(t, font, bfont)
    def rv(t):  return _p(str(t), font, bfont)
    def bl(t):  return _p(t, font, bfont, bold=True, align=TA_CENTER)
    def bv(t):  return _p(str(t), font, bfont, bold=True)

    c1, c2, c3, c4 = usable*0.30, usable*0.20, usable*0.30, usable*0.20

    ga = Table([
        [hdr('GROSS PAY'), '',               hdr('ATTENDANCE'),    ''              ],
        [rl('Basic'),      rv(_fmt(basic)),   rl('Days Present'),   rv(days_present)],
        [rl('HRA'),        rv(_fmt(hra)),     rl('CLs availed'),    rv(cl)          ],
        [rl('CA'),         rv(_fmt(ca)),      rl('SLs availed'),    rv(sl)          ],
        [rl('Others'),     rv(_fmt(others_earn)), rl('ELs availed'), rv(el)        ],
        ['',               '',               rl('LOP Days'),        rv(lop)         ],
        [bl('Total'),      bv(_fmt(gross_pay)), bl('Total'),        bv(att_total)   ],
    ], colWidths=[c1, c2, c3, c4])
    ga.setStyle(TableStyle([
        ('BOX',        (0, 0), (-1, -1), 0.8, colors.black),
        ('SPAN',       (0, 0), (1, 0)),
        ('SPAN',       (2, 0), (3, 0)),
        ('INNERGRID',  (0, 0), (-1, -1), 0.5, colors.black),
        ('LINEAFTER',  (1, 0), (1, -1), 0.8, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), LGRAY),
        ('BACKGROUND', (0, -1),(-1,-1), LGRAY),
        ('VALIGN',     (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING',(0,0),(-1, -1), 4),
        ('LEFTPADDING',(0, 0), (-1, -1), 6),
    ]))
    story.append(ga)
    story.append(Spacer(1, 0.35 * cm))

    # ── 5. Earnings | Deductions + Net Pay table ──────────────────────────────
    pf            = slip_data.get('pf', 0)
    esi           = slip_data.get('esi', 0)
    pt            = slip_data.get('pt', 0)
    tds           = slip_data.get('tds', 0)
    total_ded     = slip_data.get('total_deduction', 0)
    net_pay       = slip_data.get('net_pay', 0)

    ed = Table([
        [hdr('EARNINGS'),        '',                hdr('DEDUCTIONS'),   ''              ],
        [rl('Basic'),            rv(_fmt(basic)),   rl('PF'),            rv(_fmt(pf))    ],
        [rl('HRA'),              rv(_fmt(hra)),     rl('ESI'),           rv(_fmt(esi))   ],
        [rl('CA'),               rv(_fmt(ca)),      rl('PT'),            rv(_fmt(pt))    ],
        [rl('Others'),           rv(_fmt(others_earn)), rl('TDS'),       rv(_fmt(tds))   ],
        [bl('Total'),            bv(_fmt(gross_pay)), bl('Total'),       bv(_fmt(total_ded))],
        [bl('Net Pay'),          bv(_fmt(net_pay)), '',                  ''              ],
    ], colWidths=[c1, c2, c3, c4])
    ed.setStyle(TableStyle([
        ('BOX',        (0, 0), (-1, -1), 0.8, colors.black),
        ('SPAN',       (0, 0), (1, 0)),
        ('SPAN',       (2, 0), (3, 0)),
        ('SPAN',       (0, -1),(1, -1)),   # Net Pay label
        ('SPAN',       (2, -1),(3, -1)),   # Net Pay value
        ('INNERGRID',  (0, 0), (-1, -1), 0.5, colors.black),
        ('LINEAFTER',  (1, 0), (1, -1), 0.8, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), LGRAY),
        ('BACKGROUND', (0, -2),(-1,-2), LGRAY),
        ('BACKGROUND', (0, -1),(-1,-1), LGRAY),
        ('VALIGN',     (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING',(0,0),(-1, -1), 4),
        ('LEFTPADDING',(0, 0), (-1, -1), 6),
    ]))
    story.append(ed)
    story.append(Spacer(1, 0.5 * cm))

    # ── 6. System note ────────────────────────────────────────────────────────
    story.append(_p(
        'This is system generated Pay slip and does not require signature',
        font, bfont, size=8, color=colors.HexColor('#444444'),
    ))
    story.append(Spacer(1, 0.4 * cm))

    # ── 7. Contact footer ─────────────────────────────────────────────────────
    def cp(t): return _p(t, font, bfont, size=7.5, color=TEAL)

    contact = Table([
        [cp('Flat: 402, 4th Floor, 1-11-254 & 255\nNaik\'s Vijayasri Nivas, Prakash Nagar,\nBegumpet, Hyderabad, Telangana – 500016'),
         cp('+91 7993013344\n+91 7993013355')],
        [cp('info@artechsolution.co.in'),
         cp('www.artechsolution.co.in')],
    ], colWidths=[usable * 0.5, usable * 0.5])
    contact.setStyle(TableStyle([
        ('VALIGN',       (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING',  (0, 0), (-1, -1), 0),
        ('TOPPADDING',   (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 0),
    ]))
    story.append(contact)

    doc.build(story, onFirstPage=_draw_corners, onLaterPages=_draw_corners)
    return buf.getvalue()
