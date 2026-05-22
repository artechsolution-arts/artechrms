"""
ReportLab letter generator — exact content from AR Tech Solutions official templates.
Source: /Users/MURALI/Desktop/Offical Documents/
"""
import os, math
from contextvars import ContextVar
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO

# ── Custom font registration ──────────────────────────────────────────────────

_FONTS_DIR = os.path.join(os.path.dirname(__file__), 'fonts')
_REGISTERED: set = set()

_FONT_FILES = [
    ('PlusJakartaSans-Regular',   'PlusJakartaSans-Regular.ttf'),
    ('PlusJakartaSans-SemiBold',  'PlusJakartaSans-SemiBold.ttf'),
    ('PlusJakartaSans-Bold',      'PlusJakartaSans-Bold.ttf'),
    ('SourceSans3-Regular',       'SourceSans3-Regular.ttf'),
    ('SourceSans3-Bold',          'SourceSans3-Bold.ttf'),
    ('SourceSans3-Italic',        'SourceSans3-Italic.ttf'),
    ('SourceSans3-BoldItalic',    'SourceSans3-BoldItalic.ttf'),
]

for _name, _fname in _FONT_FILES:
    _path = os.path.join(_FONTS_DIR, _fname)
    if os.path.isfile(_path):
        try:
            pdfmetrics.registerFont(TTFont(_name, _path))
            _REGISTERED.add(_name)
        except Exception:
            pass

# Convenience: True when both families loaded successfully
_HAS_PJS = 'PlusJakartaSans-Bold' in _REGISTERED
_HAS_SS3 = 'SourceSans3-Regular' in _REGISTERED

PAGE_W, PAGE_H = A4

DARK  = colors.HexColor('#1A1A2E')
WHITE = colors.white

HEADER_H = 16.92 * mm
BLUE_H   = 8.73  * mm
TRAP_X1  = 98.4  * mm
TRAP_X2  = 138.0 * mm
FTRAP_X1 = 72.0  * mm
FTRAP_X2 = 111.6 * mm

_DEFAULT_LOGO_PATH = os.path.join(os.path.dirname(__file__), 'artech_logo.png')
_UPLOADS_DIR       = "/app/letterhead_logos"

# ── Default branding constants (used as fallback) ─────────────────────────────
COMPANY_NAME = "AR TECH SOLUTIONS"
TAGLINE      = "Driven By Innovation"
ADDR1 = "Flat: 402, 4th Floor, 1-11-254 & 255"
ADDR2 = "Naiks's Vijayasri Nivas, Prakash Nagar,"
ADDR3 = "Begumpet, Hyderabad,"
ADDR4 = "Telangana – 500016"
PHONE1       = "+91 7993013344"
PHONE2       = "+91 7993013355"
EMAIL        = "info@artechsolution.co.in"
WEBSITE      = "www.artechsolution.co.in"
HR_SIGNATORY = "Radhika Yalamanchili"
HR_ROLE      = "Human Resource Executive"

ML    = 18 * mm
MR    = 18 * mm
LH    = 5.0 * mm
PG    = 2.0 * mm
_ICON_R = 6.8 * mm

# ── Template config context (set per generate_letter call) ────────────────────
_tpl_ctx: ContextVar[dict] = ContextVar('_tpl_ctx', default={})


def _t(key: str, default):
    """Read a value from the active template config, falling back to default."""
    return _tpl_ctx.get().get(key) or default


def _blue():
    return colors.HexColor(_t('header_color', '#1764B4'))


def _teal():
    return colors.HexColor(_t('accent_color', '#01BEB0'))


def _logo_path():
    fn = _t('logo_filename', None)
    if fn:
        candidate = os.path.join(_UPLOADS_DIR, fn)
        if os.path.isfile(candidate):
            return candidate
    return _DEFAULT_LOGO_PATH


def _fmt(d):
    if not d:
        return ""
    try:
        return datetime.strptime(d, "%Y-%m-%d").strftime("%d/%m/%Y")
    except Exception:
        return d


# ── Header ────────────────────────────────────────────────────────────────────

def _draw_header(c):
    TEAL = _teal(); BLUE = _blue()
    c.setFillColor(TEAL)
    p = c.beginPath()
    p.moveTo(TRAP_X1, PAGE_H); p.lineTo(PAGE_W, PAGE_H)
    p.lineTo(PAGE_W, PAGE_H - HEADER_H); p.lineTo(TRAP_X2, PAGE_H - HEADER_H)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.rect(0, PAGE_H - BLUE_H, PAGE_W, BLUE_H, fill=1, stroke=0)
    lp = _logo_path()
    if os.path.isfile(lp):
        logo_x = _t('logo_x_mm', 16.0) * mm
        logo_y = _t('logo_y_mm', 10.0) * mm
        logo_w = _t('logo_w_mm', 32.0) * mm
        logo_h = _t('logo_h_mm', 32.0) * mm
        c.drawImage(lp, logo_x, PAGE_H - HEADER_H - logo_y - logo_h,
                    width=logo_w, height=logo_h, mask='auto')


def _header_bottom_y():
    return PAGE_H - _t('content_top_mm', 58.92) * mm


# ── Font helpers ──────────────────────────────────────────────────────────────

_FONT_MAP = {
    'Helvetica':        {'r': 'Helvetica',            'b': 'Helvetica-Bold',
                         'i': 'Helvetica-Oblique',     'bi': 'Helvetica-BoldOblique'},
    'Times-Roman':      {'r': 'Times-Roman',           'b': 'Times-Bold',
                         'i': 'Times-Italic',           'bi': 'Times-BoldItalic'},
    'Courier':          {'r': 'Courier',               'b': 'Courier-Bold',
                         'i': 'Courier-Oblique',        'bi': 'Courier-BoldOblique'},
    'Source Sans 3':    {'r': 'SourceSans3-Regular',   'b': 'SourceSans3-Bold',
                         'i': 'SourceSans3-Italic',     'bi': 'SourceSans3-BoldItalic'},
    'Plus Jakarta Sans':{'r': 'PlusJakartaSans-Regular','b': 'PlusJakartaSans-Bold',
                         'i': 'PlusJakartaSans-Regular','bi': 'PlusJakartaSans-Bold'},
}

# Heading font: Plus Jakarta Sans Bold (falls back to Helvetica-Bold if not loaded)
_HF_BOLD  = 'PlusJakartaSans-Bold'      if _HAS_PJS else 'Helvetica-Bold'
_HF_SEMI  = 'PlusJakartaSans-SemiBold'  if 'PlusJakartaSans-SemiBold' in _REGISTERED else _HF_BOLD
_HF_REG   = 'PlusJakartaSans-Regular'   if _HAS_PJS else 'Helvetica'

# Body font default: Source Sans 3 (falls back to Helvetica if not loaded)
_DEFAULT_BODY = 'Source Sans 3' if _HAS_SS3 else 'Helvetica'


def _font(weight='r'):
    """Return the ReportLab font name for the template's chosen body font + modifiers."""
    fam    = _t('body_font', _DEFAULT_BODY)
    bold   = bool(_t('body_bold', False))
    italic = bool(_t('body_italic', False))
    if weight in ('b', 'bold'):
        key = 'bi' if italic else 'b'
    else:
        key = 'i' if italic else 'r'
    fm = _FONT_MAP.get(fam, _FONT_MAP['Helvetica'])
    candidate = fm[key]
    # Graceful fallback if custom font not registered (e.g. TTF missing)
    if candidate not in _REGISTERED and candidate not in ('Helvetica', 'Helvetica-Bold',
            'Helvetica-Oblique', 'Helvetica-BoldOblique', 'Times-Roman', 'Times-Bold',
            'Times-Italic', 'Times-BoldItalic', 'Courier', 'Courier-Bold',
            'Courier-Oblique', 'Courier-BoldOblique'):
        return 'Helvetica-Bold' if key in ('b', 'bi') else 'Helvetica'
    return candidate


def _fsize():
    return _t('body_font_size', 10.5)


# ── Footer icons ──────────────────────────────────────────────────────────────

def _icon_ring(c, cx, cy):
    c.setStrokeColor(_teal()); c.setLineWidth(1.5); c.setFillColor(WHITE)
    c.circle(cx, cy, _ICON_R, fill=0, stroke=1)

def _draw_pin_icon(c, cx, cy):
    _icon_ring(c, cx, cy)
    ir = _ICON_R * 0.58; top_y = cy + ir * 0.28; tip_y = cy - ir * 0.72; pw = ir * 0.62
    c.setFillColor(_teal())
    p = c.beginPath()
    p.moveTo(cx, tip_y)
    p.curveTo(cx-pw*1.15, tip_y+ir*0.55, cx-pw, top_y-ir*0.1, cx, top_y+ir*0.45)
    p.curveTo(cx+pw, top_y-ir*0.1, cx+pw*1.15, tip_y+ir*0.55, cx, tip_y)
    p.close(); c.drawPath(p, fill=1, stroke=0)
    c.setFillColor(WHITE); c.circle(cx, top_y+ir*0.12, _ICON_R*0.14, fill=1, stroke=0)

def _draw_phone_icon(c, cx, cy):
    _icon_ring(c, cx, cy)
    ir=_ICON_R*0.60; ang=math.radians(42); ca,sa=math.cos(ang),math.sin(ang)
    dx=ir*0.46; tx=cx+dx*ca; ty=cy+dx*sa; bx=cx-dx*ca; by=cy-dx*sa; off=ir*0.38
    c.setStrokeColor(_teal()); c.setLineWidth(_ICON_R*0.30)
    p=c.beginPath(); p.moveTo(tx,ty)
    p.curveTo(tx+off*sa, ty-off*ca, bx+off*sa, by-off*ca, bx, by)
    c.drawPath(p, fill=0, stroke=1)
    c.setFillColor(_teal()); c.setLineWidth(0)
    c.circle(tx, ty, _ICON_R*0.14, fill=1, stroke=0)
    c.circle(bx, by, _ICON_R*0.14, fill=1, stroke=0)

def _draw_email_icon(c, cx, cy):
    _icon_ring(c, cx, cy)
    ir=_ICON_R*0.57; ew=ir*1.90; eh=ir*1.25; ex=cx-ew/2; ey=cy-eh/2
    c.setStrokeColor(_teal()); c.setLineWidth(1.2)
    c.rect(ex, ey, ew, eh, fill=0, stroke=1)
    p=c.beginPath(); p.moveTo(ex, ey+eh); p.lineTo(cx, ey+eh*0.52); p.lineTo(ex+ew, ey+eh)
    c.drawPath(p, fill=0, stroke=1)

def _draw_globe_icon(c, cx, cy):
    _icon_ring(c, cx, cy)
    ir=_ICON_R*0.60
    c.setStrokeColor(_teal()); c.setLineWidth(1.2)
    c.circle(cx, cy, ir, fill=0, stroke=1); c.line(cx-ir, cy, cx+ir, cy)
    p=c.beginPath(); p.moveTo(cx, cy-ir)
    p.curveTo(cx+ir*0.52, cy-ir, cx+ir*0.52, cy+ir, cx, cy+ir)
    p.curveTo(cx-ir*0.52, cy+ir, cx-ir*0.52, cy-ir, cx, cy-ir)
    p.close(); c.drawPath(p, fill=0, stroke=1)
    lat_y=cy+ir*0.52; chord=math.sqrt(max(0.0, ir*ir-(lat_y-cy)**2))
    c.line(cx-chord, lat_y, cx+chord, lat_y)

def _draw_footer(c):
    TEAL = _teal(); BLUE = _blue()
    c.setFillColor(TEAL)
    p=c.beginPath(); p.moveTo(0,0); p.lineTo(FTRAP_X2,0)
    p.lineTo(FTRAP_X1, HEADER_H); p.lineTo(0, HEADER_H); p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.setFillColor(BLUE); c.rect(0, 0, PAGE_W, BLUE_H, fill=1, stroke=0)
    # Optional custom footer image replaces the programmatic contact block
    footer_fn = _t('footer_image_filename', None)
    if footer_fn:
        fi_path = os.path.join(_UPLOADS_DIR, footer_fn)
        if os.path.isfile(fi_path):
            fi_x = _t('footer_x_mm', 0.0) * mm
            fi_y = HEADER_H + _t('footer_y_mm', 0.0) * mm
            fi_w = _t('footer_w_mm', PAGE_W / mm) * mm
            fi_h = _t('footer_h_mm', 62.0) * mm
            c.drawImage(fi_path, fi_x, fi_y, width=fi_w, height=fi_h, mask='auto')
            return
    c.setStrokeColor(colors.HexColor('#CCCCCC')); c.setLineWidth(0.5)
    c.line(15*mm, _footer_top_y()-1*mm, PAGE_W-15*mm, _footer_top_y()-1*mm)
    LM=18*mm; MID=PAGE_W/2+8*mm; LH2=4.4*mm
    TX=LM+_ICON_R*2+4*mm; TX2=MID+_ICON_R*2+4*mm
    R1=HEADER_H+46*mm
    _draw_pin_icon(c, LM+_ICON_R, R1)
    c.setFillColor(BLUE); c.setFont("Helvetica", 8.5)
    addr_lines = [
        _t('addr1', ADDR1), _t('addr2', ADDR2),
        _t('addr3', ADDR3), _t('addr4', ADDR4),
    ]
    for i, line in enumerate(addr_lines):
        c.drawString(TX, R1+_ICON_R*0.45-i*LH2, line)
    _draw_phone_icon(c, MID+_ICON_R, R1)
    c.setFillColor(BLUE); c.setFont("Helvetica", 8.5)
    c.drawString(TX2, R1+LH2*0.4, _t('phone1', PHONE1))
    c.drawString(TX2, R1+LH2*0.4-LH2, _t('phone2', PHONE2))
    R2=HEADER_H+23*mm
    _draw_email_icon(c, LM+_ICON_R, R2)
    c.setFillColor(BLUE); c.setFont("Helvetica", 8.5)
    c.drawString(TX, R2-LH2*0.35, _t('email', EMAIL))
    _draw_globe_icon(c, MID+_ICON_R, R2)
    c.setFillColor(BLUE); c.setFont("Helvetica", 8.5)
    c.drawString(TX2, R2-LH2*0.35, _t('website', WEBSITE))

def _footer_top_y():
    return HEADER_H + 62 * mm


# ── Watermark ─────────────────────────────────────────────────────────────────

def _draw_watermark(c):
    wm_fn = _t('watermark_filename', None)
    if not wm_fn:
        return
    wm_path = os.path.join(_UPLOADS_DIR, wm_fn)
    if not os.path.isfile(wm_path):
        return
    try:
        from PIL import Image as _PILImage
        from reportlab.lib.utils import ImageReader as _IR
        from io import BytesIO as _BytesIO
        opacity = max(0.01, min(1.0, float(_t('watermark_opacity', 0.08))))
        img = _PILImage.open(wm_path).convert("RGBA")
        r, g, b, a = img.split()
        a = a.point(lambda v: int(v * opacity))
        img2 = _PILImage.merge("RGBA", (r, g, b, a))
        buf = _BytesIO()
        img2.save(buf, format='PNG')
        buf.seek(0)
        wm_x = _t('watermark_x_mm', 45.0) * mm
        wm_y = _t('watermark_y_mm', 88.5) * mm
        wm_w = _t('watermark_w_mm', 120.0) * mm
        wm_h = _t('watermark_h_mm', 120.0) * mm
        c.drawImage(_IR(buf), wm_x, wm_y, width=wm_w, height=wm_h, mask='auto')
    except Exception:
        pass  # watermark is decorative; never break letter generation


# ── Page-break helper ─────────────────────────────────────────────────────────

def _check_break(c, y, needed=6*mm):
    if y - needed < _footer_top_y():
        c.showPage(); _draw_header(c); _draw_footer(c); _draw_watermark(c)
        return _header_bottom_y() - 10 * mm   # same top margin as page 1
    return y


# ── Text helpers ──────────────────────────────────────────────────────────────

def _wrap(c, text, x, y, font=None, size=None, lh=None, color=DARK):
    if font is None: font = _font()
    if size is None: size = _fsize()
    max_w = PAGE_W - MR - x
    if lh is None: lh = LH
    c.setFont(font, size); c.setFillColor(color)
    words = text.split(); line = ""
    for word in words:
        test = (line + " " + word).strip()
        if c.stringWidth(test, font, size) <= max_w:
            line = test
        else:
            if line:
                y = _check_break(c, y, lh)
                c.setFont(font, size); c.setFillColor(color)
                c.drawString(x, y, line); y -= lh
            line = word
    if line:
        y = _check_break(c, y, lh)
        c.setFont(font, size); c.setFillColor(color)
        c.drawString(x, y, line); y -= lh
    return y


def _title(c, text, y, size=13):
    y = _check_break(c, y, 14*mm)
    c.setFont(_HF_BOLD, size); c.setFillColor(DARK)
    tw = c.stringWidth(text, _HF_BOLD, size)
    c.drawCentredString(PAGE_W/2, y, text)
    c.setStrokeColor(DARK); c.setLineWidth(0.8)
    c.line(PAGE_W/2 - tw/2, y - 1.5, PAGE_W/2 + tw/2, y - 1.5)
    return y - 9*mm


def _left_block(c, lines):
    """Draw left-aligned lines below header. Each item: (text, bold). Returns Y."""
    y = _header_bottom_y() - 10*mm
    for text, bold in lines:
        if not text:
            y -= LH / 2; continue
        c.setFont(_HF_SEMI if bold else _font(), _fsize())
        c.setFillColor(DARK)
        c.drawString(ML, y, text); y -= LH
    return y - PG


def _signoff(c, y, signer=None):
    sig_fn = _t('signature_filename', None)
    sig_h  = _t('sig_h_mm', 20.0) * mm
    needed = 22*mm + (sig_h + PG if sig_fn else LH * 2.0)
    y = _check_break(c, y, needed)
    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, "Yours sincerely,"); y -= LH
    c.setFont(_HF_SEMI, _fsize())
    c.drawString(ML, y, f"For {_t('company_name', COMPANY_NAME)}"); y -= LH
    if sig_fn:
        sig_path = os.path.join(_UPLOADS_DIR, sig_fn)
        if os.path.isfile(sig_path):
            sig_x = _t('sig_x_mm', 18.0) * mm
            sig_w = _t('sig_w_mm', 40.0) * mm
            c.drawImage(sig_path, sig_x, y - sig_h, width=sig_w, height=sig_h, mask='auto')
            y -= sig_h + PG
        else:
            y -= LH * 2.0
    else:
        y -= LH * 2.0
    c.setFont(_HF_SEMI, _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, _t('hr_signatory', HR_SIGNATORY)); y -= LH
    c.setFont(_font(), _fsize())
    c.drawString(ML, y, _t('hr_role', HR_ROLE))
    return y


def _pronouns(gender):
    """Return (title, subject, object, possessive)."""
    if gender == "Female":
        return "Ms.", "She", "her", "her"
    elif gender == "Male":
        return "Mr.", "He", "him", "his"
    return "Mr./Ms.", "He/She", "him/her", "his/her"


# ════════════════════════════════════════════════════════════════════════════════
# Body renderers — exact content from official templates
# ════════════════════════════════════════════════════════════════════════════════

def _body_extended_probation(c, fields):
    emp   = fields["employee_name"]
    desig = fields["designation"]
    y = _left_block(c, [
        (f"Date: {_fmt(fields['letter_date'])}", False),
        (emp, False),
        (desig, False),
    ])
    y = _title(c, "Extension of Probation Period", y) - 2*mm

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, f"Dear {emp},"); y -= LH + PG

    y = _wrap(c, (
        f"This is to inform you that your probation period, which was scheduled to conclude on "
        f"{_fmt(fields['previous_end_date'])}, has been extended for a further period of "
        f"{fields['duration']} effective from {_fmt(fields['new_start_date'])} to "
        f"{_fmt(fields['new_end_date'])}."
    ), ML, y); y -= PG

    y = _wrap(c, (
        "The extension is being made to provide additional time for assessing your performance, work "
        "responsibilities, and overall suitability for the role. During this period, your performance and "
        "conduct will continue to be reviewed as per company standards and expectations."
    ), ML, y); y -= PG

    y = _wrap(c, (
        "We encourage you to focus on the areas discussed and demonstrate consistent improvement "
        "during the extended probation period."
    ), ML, y); y -= PG

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, "All other terms and conditions of your employment remain unchanged.")
    y -= LH + PG
    c.drawString(ML, y, "Please acknowledge receipt of this letter.")
    y -= LH + PG * 3

    _signoff(c, y, _t("hr_role", HR_ROLE))


def _body_appointment(c, fields):
    emp       = fields["employee_name"]
    desig     = fields["designation"]
    dept      = fields.get("department", "")
    joining   = _fmt(fields.get("joining_date", ""))
    conf_date = _fmt(fields.get("confirmation_date", ""))

    y = _left_block(c, [(f"Date: {_fmt(fields['letter_date'])}", False)])
    y = _title(c, "APPOINTMENT LETTER", y) - 2*mm

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, f"Dear {emp},"); y -= LH + PG

    y = _wrap(c, (
        f"We are pleased to confirm your appointment as {desig} with "
        f"AR Tech Solutions, effective from {joining}."
    ), ML, y); y -= PG

    c.drawString(ML, y, "Your employment with us will be governed by the following terms and conditions:")
    y -= LH + PG

    # Point 1
    y = _check_break(c, y, 20*mm)
    c.setFont(_HF_SEMI, _fsize()); c.drawString(ML, y, "1. Employment Details"); y -= LH
    c.setFont(_font(), _fsize())
    c.drawString(ML + 5*mm, y, f"Designation:  {desig}"); y -= LH
    c.drawString(ML + 5*mm, y, f"Department:   {dept or chr(8212)}"); y -= LH + PG

    # Point 2a - Probation Period
    y = _check_break(c, y, 20*mm)
    c.setFont(_HF_SEMI, _fsize()); c.drawString(ML, y, "2. Probation Period"); y -= LH
    c.setFont(_font(), _fsize())
    y = _wrap(c, (
        "You will be on probation for a period of 3 months from the date of joining. "
        "During the probation period, your performance and conduct will be evaluated."
    ), ML, y); y -= PG/2
    y = _wrap(c, (
        "The company reserves the right to extend the probation period or terminate employment during "
        "probation with notice if performance or conduct is found unsatisfactory."
    ), ML, y); y -= PG

    # Point 2b - Confirmation of Employment
    y = _check_break(c, y, 15*mm)
    c.setFont(_HF_SEMI, _fsize()); c.drawString(ML, y, "3. Confirmation of Employment"); y -= LH
    c.setFont(_font(), _fsize())
    y = _wrap(c, (
        f"Having successfully completed your probation for three months, your services are hereby "
        f"confirmed with AR Tech Solutions, effective from {conf_date}."
    ), ML, y); y -= PG

    # Point 4
    y = _check_break(c, y, 15*mm)
    c.setFont(_HF_SEMI, _fsize()); c.drawString(ML, y, "4. Compensation"); y -= LH
    c.setFont(_font(), _fsize())
    y = _wrap(c, (
        "Your Compensation will be as per company norms. Your detailed salary structure is enclosed as "
        "Annexure A – Compensation Structure, which forms an integral part of this Appointment Letter."
    ), ML, y); y -= PG

    # Point 5
    y = _check_break(c, y, 15*mm)
    c.setFont(_HF_SEMI, _fsize()); c.drawString(ML, y, "5. Leave Entitlement"); y -= LH
    c.setFont(_font(), _fsize())
    y = _wrap(c, (
        "Details regarding leave entitlement, leave structure, and leave approval procedures "
        "shall be governed as per the policies mentioned in the company handbook."
    ), ML, y); y -= PG

    # Point 6
    y = _check_break(c, y, 15*mm)
    c.setFont(_HF_SEMI, _fsize()); c.drawString(ML, y, "6. Notice Period"); y -= LH
    c.setFont(_font(), _fsize())
    y = _wrap(c, (
        "Notice period of 60 days applicable from either side for termination of employment, "
        "unless otherwise decided by the management."
    ), ML, y); y -= PG

    # Points 7–12 inline (bold heading: body on same line)
    for heading, body in [
        ("7. Termination of Services",
         "Services may be terminated for invalid documents, failed background verification, medical "
         "unfitness, misconduct, breach of trust, non-compliance, or false information provided during "
         "the hiring process."),
        ("8. Company Rules & Non-Compete",
         "Employment governed by company rules; for two years post-employment, employees must not "
         "compete with the company."),
        ("9. Job & Location Changes",
         "Designation, duties, or location may change as per business needs without affecting compensation."),
        ("10. Final Settlement",
         "The Full and Final settlement of dues shall be processed within 30 days from the employee's "
         "last working day, subject to successful completion of the notice period and proper handover "
         "of all company assets."),
        ("11. Address & Communication",
         "Inform the company within 24 hours of any address change."),
        ("12. Dispute Resolution",
         "Hyderabad will be considered the legal jurisdiction for any disputes."),
    ]:
        y = _check_break(c, y, LH * 2)
        c.setFont(_HF_SEMI, _fsize()); c.setFillColor(DARK)
        c.drawString(ML, y, heading); y -= LH
        c.setFont(_font(), _fsize())
        y = _wrap(c, body, ML + 5*mm, y); y -= PG/2

    y -= PG/2

    y = _wrap(c, (
        "All other Terms and Conditions of your employment remain the same as set out in your offer "
        "letter and the Company Handbook, as amended from time to time."
    ), ML, y); y -= PG

    y = _wrap(c, (
        "We look forward to your continued contributions and commitment toward the growth of "
        "AR Tech Solutions."
    ), ML, y); y -= PG

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, "Kindly sign and return a copy of this letter as a token of your acceptance.")
    y -= LH + PG * 2

    y = _signoff(c, y, _t("hr_signatory", HR_SIGNATORY))
    y -= LH * 3   # clear visual gap between sign-off and acknowledgment

    # Acknowledgment section
    y = _check_break(c, y, 22*mm)
    c.setFont(_HF_SEMI, _fsize() + 0.5); c.setFillColor(DARK)
    c.drawString(ML, y, "Acknowledgment & Acceptance"); y -= LH + PG
    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, f"I, {emp}, hereby accept the appointment as per the terms mentioned above.")
    y -= LH + PG * 1.5
    c.drawString(ML, y, "Signature: ______________________"); y -= LH + PG * 1.5
    c.drawString(ML, y, "Date: ____________________________")


def _body_confirmation(c, fields):
    emp        = fields["employee_name"]
    desig      = fields["designation"]
    prob_start = _fmt(fields.get("probation_start_date", ""))
    conf_start = _fmt(fields.get("confirmation_date", ""))

    y = _left_block(c, [(f"Date: {_fmt(fields['letter_date'])}", False)])
    y -= PG
    y = _title(c, "Confirmation of Employment Upon Completion of Probation", y, size=11) - 2*mm

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, f"Dear {emp},"); y -= LH + PG

    y = _wrap(c, (
        f"We are pleased to inform you that you have successfully completed your probation period "
        f"with AR Tech Solutions effective from {prob_start}."
    ), ML, y); y -= PG

    y = _wrap(c, (
        f"Based on your performance, conduct, and contribution during the probationary period, the "
        f"management is happy to confirm your appointment as a permanent employee in the position "
        f"of {desig} from {conf_start}."
    ), ML, y); y -= PG

    y = _wrap(c, (
        "We appreciate your efforts and commitment and look forward to your continued contribution "
        "and growth with the organization."
    ), ML, y); y -= PG

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, "Congratulations and best wishes for a successful career with us.")
    y -= LH + PG * 3

    _signoff(c, y, _t("hr_role", HR_ROLE))


def _body_experience(c, fields):
    emp    = fields["employee_name"]
    desig  = fields["designation"]
    dept   = fields.get("department", "")
    joining = _fmt(fields.get("joining_date", ""))
    lwd     = _fmt(fields.get("last_working_date", ""))
    _, subj, obj, poss = _pronouns(fields.get("gender", "Male"))

    y = _left_block(c, [(f"Date: {_fmt(fields['letter_date'])}", False)])
    y -= PG * 2
    y = _title(c, "TO WHOMSOEVER IT MAY CONCERN", y, size=11) - 2*mm
    y -= PG

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    y = _wrap(c, (
        f"This is to certify that Mr./Ms. {emp} was employed with AR Tech Solutions as a "
        f"{desig} from {joining} to {lwd}."
    ), ML, y); y -= PG

    dept_text = f"handling duties related to {dept}" if dept else "handling the assigned responsibilities"
    y = _wrap(c, (
        f"During the tenure of employment, the employee was responsible for {dept_text}. "
        f"We found {obj} to be sincere, hardworking, and professional in carrying out the "
        f"assigned responsibilities."
    ), ML, y); y -= PG

    c.drawString(ML, y,
        f"{poss.capitalize()} conduct and performance during the employment period were satisfactory.")
    y -= LH + PG

    c.drawString(ML, y, f"We wish {obj} all the best for future endeavors.")
    y -= LH + PG * 3

    _signoff(c, y, _t("hr_role", HR_ROLE))


def _body_increment(c, fields):
    emp      = fields["employee_name"]
    desig    = fields["designation"]
    old_ctc  = fields.get("old_ctc", "")
    new_ctc  = fields.get("new_ctc", "")
    eff_date = _fmt(fields.get("effective_date", ""))

    y = _left_block(c, [
        (f"Date: {_fmt(fields['letter_date'])}", False),
        (emp, False),
        (desig, False),
    ])
    y = _title(c, "Increment Letter", y) - 2*mm

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, f"Dear {emp},"); y -= LH + PG

    y = _wrap(c, (
        "We are pleased to inform you that based on your performance, dedication, and contribution "
        f"to the organization, your salary has been revised with effect from {eff_date}."
    ), ML, y); y -= PG

    y = _wrap(c, (
        f"Your revised Annual Salary will be {old_ctc} to {new_ctc} as per the company's "
        "compensation structure and policies."
    ), ML, y); y -= PG

    y = _wrap(c, (
        "We appreciate your hard work and commitment towards the organization and look forward "
        "to your continued support and contribution to the growth of the company."
    ), ML, y); y -= PG

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, "All other terms and conditions of your employment remain unchanged.")
    y -= LH + PG
    c.drawString(ML, y, "We wish you continued success in your role.")
    y -= LH + PG * 3

    _signoff(c, y, _t("hr_signatory", HR_SIGNATORY))


def _body_loi(c, fields):
    emp       = fields["employee_name"]
    desig     = fields["designation"]
    address   = fields.get("employee_address", "")
    joining   = _fmt(fields.get("joining_date", ""))
    ctc_words = fields.get("ctc_words", "")
    ctc_amt   = fields.get("ctc_amount", "xxxxxxxxxx")

    lines = [(f"Date: {_fmt(fields['letter_date'])}", False), (emp, False)]
    if address:
        lines.append((address, False))
    y = _left_block(c, lines)
    y = _title(c, "Letter of Intent", y) - 2*mm

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, f"Dear {emp},"); y -= LH + PG

    y = _wrap(c, (
        "This is with reference to the discussions you had with us. As mutually agreed, we would be "
        f"pleased to offer you an appointment as {desig} at AR Tech Solutions and your date of "
        f"joining will be {joining}."
    ), ML, y); y -= PG/2

    y = _wrap(c, (
        f"You have been offered annual compensation of {ctc_words} only Rs. {ctc_amt}/-."
    ), ML, y); y -= PG/2

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, "The Appointment Letter will be handed over to the employee on the date of joining.")
    y -= LH + PG/2

    y = _wrap(c, (
        "Confirmation of employment will be provided upon successful completion of the probation "
        "period, subject to satisfactory performance and conduct."
    ), ML, y); y -= PG/2

    y = _wrap(c, (
        "You will be on probation for a period of 3 months. During the probation period you will not "
        "be entitled to take any leave except in case of emergency. Any leave taken during probation "
        "period will be considered as Leave Without Pay (LOP). The termination notices on Either side "
        "will be 15 days during probation period and 60 days after confirmation."
    ), ML, y); y -= PG/2

    y = _wrap(c, (
        "Please note that this offer shall automatically lapse if you fail to commence the arrangement "
        "on the aforesaid date. The management may, however, in its absolute discretion, extend the "
        "said date upon a written request being received from you."
    ), ML, y); y -= PG/2

    y = _wrap(c, (
        "You are requested to sign and return the duplicate copy of this letter as a token of your "
        "acceptance of the above offer. Looking forward to a mutually beneficial association."
    ), ML, y); y -= PG * 2

    _signoff(c, y, _t("hr_signatory", HR_SIGNATORY))


def _body_promotion(c, fields):
    emp      = fields["employee_name"]
    desig    = fields["designation"]
    new_desig = fields.get("new_designation", "")
    eff_date  = _fmt(fields.get("effective_date", ""))
    ctc_det   = fields.get("ctc_details", "")

    y = _left_block(c, [
        (f"Date: {_fmt(fields['letter_date'])}", False),
        (emp, False),
        (desig, False),
    ])
    y = _title(c, "Promotion Letter", y) - 2*mm

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, f"Dear {emp},"); y -= LH + PG

    y = _wrap(c, (
        "We are pleased to inform you that, based on your performance, dedication, and contributions "
        f"to the organization, you have been promoted to the position of {new_desig}, effective "
        f"from {eff_date}."
    ), ML, y); y -= PG

    salary_line = ctc_det if ctc_det else "as per the revised compensation structure"
    y = _wrap(c, (
        f"Your revised compensation will be {salary_line}, along with applicable benefits as per "
        "company policy."
    ), ML, y); y -= PG

    y = _wrap(c, (
        "We are confident that you will continue to perform your duties with the same level of "
        "excellence and commitment in your new position."
    ), ML, y); y -= PG

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    y = _wrap(c, (
        "Congratulations on your well-deserved promotion. We wish you continued success in your "
        "career with us."
    ), ML, y); y -= PG * 3

    _signoff(c, y, _t("hr_signatory", HR_SIGNATORY))


def _body_termination(c, fields):
    emp   = fields["employee_name"]
    desig = fields["designation"]
    lwd   = _fmt(fields.get("last_working_date", ""))

    y = _left_block(c, [
        (f"Date: {_fmt(fields['letter_date'])}", False),
        (emp, False),
        (desig, False),
    ])
    y = _title(c, "Termination of Employment", y) - 2*mm

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, f"Dear {emp},"); y -= LH + PG

    y = _wrap(c, (
        f"This letter is to inform you that your employment with AR Tech Solutions will be "
        f"terminated effectively from {lwd}."
    ), ML, y); y -= PG

    c.drawString(ML, y, "The decision has been taken due to the following performance concerns:")
    y -= LH + PG/2
    for i, point in enumerate([
        "Delay in completing assigned tasks",
        "Not providing regular work updates",
        "Unsatisfactory work performance",
    ], 1):
        c.drawString(ML + 4*mm, y, f"{i}. {point}"); y -= LH
    y -= PG/2

    y = _wrap(c, (
        "Despite multiple discussions and opportunities provided for improvement, the expected "
        "performance standards have not been met."
    ), ML, y); y -= PG

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    y = _wrap(c, (
        "You are requested to complete all handover formalities and return any company assets "
        "before your last working day."
    ), ML, y); y -= PG

    y = _wrap(c, (
        "Your final settlement will be processed as per company policy after completion of exit formalities."
    ), ML, y); y -= PG

    y = _wrap(c, (
        "We thank you for your services and wish you all the best for your future endeavors."
    ), ML, y); y -= PG * 3

    _signoff(c, y, _t("hr_signatory", HR_SIGNATORY))


def _body_relieving(c, fields):
    emp       = fields["employee_name"]
    desig     = fields["designation"]
    joining   = _fmt(fields.get("joining_date", ""))
    lwd       = _fmt(fields.get("last_working_date", ""))
    relieving = _fmt(fields.get("relieving_date", "") or fields.get("last_working_date", ""))
    _, subj, obj, poss = _pronouns(fields.get("gender", "Male"))

    # Unique layout: title FIRST, then date, then TO WHOMSOEVER
    y = _header_bottom_y() - 10*mm
    y = _title(c, "RELIEVING LETTER", y) - 2*mm

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, f"Date: {_fmt(fields['letter_date'])}"); y -= LH + PG
    y = _title(c, "TO WHOMSOEVER IT MAY CONCERN", y, size=11) - 2*mm
    y -= PG

    y = _wrap(c, (
        f"This is to certify that Mr./Ms. {emp} worked with AR Tech Solutions as a "
        f"{desig} from {joining} to {lwd}."
    ), ML, y); y -= PG

    y = _wrap(c, (
        f"{subj}/ She has been formally relieved from the duties and responsibilities of the "
        f"organization with effect from {relieving} after completing the required notice period "
        f"and knowledge handover."
    ), ML, y); y -= PG

    y = _wrap(c, (
        f"We appreciate {poss}/her contribution to the organization and wish {obj}/her all the "
        f"best for future endeavors."
    ), ML, y); y -= PG * 3

    _signoff(c, y, _t("hr_role", HR_ROLE))


def _body_resignation_acceptance(c, fields):
    emp        = fields["employee_name"]
    desig      = fields["designation"]
    emp_code   = fields.get("employee_code", "")
    resig_date = _fmt(fields.get("resignation_date", ""))
    lwd        = _fmt(fields.get("last_working_date", ""))

    items = [(f"Date: {_fmt(fields['letter_date'])}", False), (emp, False)]
    if emp_code:
        items.append((f"Employee ID: {emp_code}", False))
    items.append((desig, False))

    y = _left_block(c, items)
    y = _title(c, "Resignation Acceptance Letter", y) - 2*mm
    y -= PG

    c.setFont(_font(), _fsize()); c.setFillColor(DARK)
    c.drawString(ML, y, f"Dear {emp},"); y -= LH + PG

    y = _wrap(c, (
        f"This is with reference to your resignation letter dated {resig_date}. We hereby accept "
        f"your resignation from the position of {desig} at AR Tech Solutions. Your last working "
        f"day with the organization will be {lwd} as per the notice period terms."
    ), ML, y); y -= PG

    y = _wrap(c, (
        "You are requested to complete the knowledge transfer process and hand over all company "
        "assets and responsibilities before your relieving date."
    ), ML, y); y -= PG

    y = _wrap(c, (
        "We thank you for your contributions to the organization and wish you success in your "
        "future endeavors."
    ), ML, y); y -= PG * 3

    _signoff(c, y, _t("hr_signatory", HR_SIGNATORY))


# ── Dispatcher ────────────────────────────────────────────────────────────────

BODY_RENDERERS = {
    "Extended of Probation Letter":    _body_extended_probation,
    "Appointment Letter":              _body_appointment,
    "Confirmation Letter":             _body_confirmation,
    "Experience Letter":               _body_experience,
    "New Increment Letter":            _body_increment,
    "New Promotion Letter":            _body_promotion,
    "Relieving Letter":                _body_relieving,
    "Resignation Acceptance Letter":   _body_resignation_acceptance,
    "New Termination Letter":          _body_termination,
    "New Letter Of Intent":            _body_loi,
}

LETTER_FIELDS = {
    "Extended of Probation Letter": [
        {"key": "letter_date",       "label": "Letter Date",                 "type": "date", "required": True},
        {"key": "previous_end_date", "label": "Previous Probation End Date", "type": "date", "required": True},
        {"key": "duration",          "label": "Extension Duration",          "type": "text", "required": True,
         "placeholder": "e.g. 30 days / 1 month"},
        {"key": "new_start_date",    "label": "New Start Date",              "type": "date", "required": True},
        {"key": "new_end_date",      "label": "New End Date",                "type": "date", "required": True},
    ],
    "Appointment Letter": [
        {"key": "letter_date",       "label": "Letter Date",       "type": "date", "required": True},
        {"key": "joining_date",      "label": "Date of Joining",   "type": "date", "required": True},
        {"key": "confirmation_date", "label": "Confirmation Date", "type": "date", "required": True,
         "placeholder": "3 months after joining"},
        {"key": "department",        "label": "Department",        "type": "text", "required": False},
    ],
    "Confirmation Letter": [
        {"key": "letter_date",          "label": "Letter Date",          "type": "date", "required": True},
        {"key": "probation_start_date", "label": "Probation Start Date", "type": "date", "required": True},
        {"key": "confirmation_date",    "label": "Confirmation Date",    "type": "date", "required": True},
    ],
    "Experience Letter": [
        {"key": "letter_date",       "label": "Letter Date",       "type": "date",   "required": True},
        {"key": "joining_date",      "label": "Date of Joining",   "type": "date",   "required": True},
        {"key": "last_working_date", "label": "Last Working Date", "type": "date",   "required": True},
        {"key": "department",        "label": "Department",        "type": "text",   "required": False},
        {"key": "gender",            "label": "Gender",            "type": "select", "required": False,
         "options": ["Male", "Female", "Other"]},
    ],
    "New Increment Letter": [
        {"key": "letter_date",    "label": "Letter Date",    "type": "date", "required": True},
        {"key": "old_ctc",        "label": "Current Salary", "type": "text", "required": True,
         "placeholder": "e.g. 4,00,000"},
        {"key": "new_ctc",        "label": "Revised Salary", "type": "text", "required": True,
         "placeholder": "e.g. 5,00,000"},
        {"key": "effective_date", "label": "Effective Date", "type": "date", "required": True},
    ],
    "New Letter Of Intent": [
        {"key": "letter_date",      "label": "Letter Date",             "type": "date", "required": True},
        {"key": "employee_address", "label": "Employee Address",        "type": "text", "required": False},
        {"key": "joining_date",     "label": "Expected Date of Joining","type": "date", "required": True},
        {"key": "ctc_words",        "label": "Salary in Words",         "type": "text", "required": True,
         "placeholder": "e.g. Five Lakh"},
        {"key": "ctc_amount",       "label": "Salary Amount (digits)",  "type": "text", "required": True,
         "placeholder": "e.g. 500000"},
    ],
    "New Promotion Letter": [
        {"key": "letter_date",     "label": "Letter Date",          "type": "date", "required": True},
        {"key": "new_designation", "label": "New Designation",      "type": "text", "required": True},
        {"key": "effective_date",  "label": "Effective Date",       "type": "date", "required": True},
        {"key": "ctc_details",     "label": "Revised Compensation", "type": "text", "required": False,
         "placeholder": "e.g. 6,00,000 p.a."},
    ],
    "New Termination Letter": [
        {"key": "letter_date",       "label": "Letter Date",       "type": "date", "required": True},
        {"key": "last_working_date", "label": "Last Working Date", "type": "date", "required": True},
    ],
    "Relieving Letter": [
        {"key": "letter_date",       "label": "Letter Date",       "type": "date",   "required": True},
        {"key": "joining_date",      "label": "Date of Joining",   "type": "date",   "required": True},
        {"key": "last_working_date", "label": "Last Working Date", "type": "date",   "required": True},
        {"key": "relieving_date",    "label": "Relieving Date",    "type": "date",   "required": False},
        {"key": "gender",            "label": "Gender",            "type": "select", "required": False,
         "options": ["Male", "Female", "Other"]},
    ],
    "Resignation Acceptance Letter": [
        {"key": "letter_date",       "label": "Letter Date",       "type": "date", "required": True},
        {"key": "resignation_date",  "label": "Resignation Date",  "type": "date", "required": True},
        {"key": "last_working_date", "label": "Last Working Date", "type": "date", "required": True},
    ],
}


def generate_letter(letter_type: str, fields: dict, template: dict | None = None) -> bytes:
    renderer = BODY_RENDERERS.get(letter_type)
    if renderer is None:
        raise ValueError(f"No renderer for letter type: {letter_type!r}")
    token = _tpl_ctx.set(template or {})
    try:
        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        _draw_header(c)
        _draw_footer(c)
        _draw_watermark(c)
        renderer(c, fields)
        c.save()
        buf.seek(0)
        return buf.read()
    finally:
        _tpl_ctx.reset(token)
