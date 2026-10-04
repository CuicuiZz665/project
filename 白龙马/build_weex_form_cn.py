from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


OUT = "WEEX合作伙伴申请表_中文整理版.docx"

NAVY = "17324D"
BLUE = "1677A6"
LIGHT_BLUE = "EAF3F8"
LIGHT_GRAY = "F4F6F8"
MID_GRAY = "6B7280"
BORDER = "CCD6DF"
RED = "C83A3A"
BLACK = "1F2933"
FONT = "Arial Unicode MS"


def set_run_font(run, size=10.5, bold=False, color=BLACK, italic=False):
    run.font.name = FONT
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = RGBColor.from_string(color)
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    rfonts.set(qn("w:ascii"), FONT)
    rfonts.set(qn("w:hAnsi"), FONT)
    rfonts.set(qn("w:eastAsia"), FONT)


def set_paragraph_spacing(paragraph, before=0, after=6, line=1.25):
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    fmt.line_spacing = line


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=100, start=140, bottom=100, end=140):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_geometry(table, widths_dxa, indent_dxa=120):
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    tbl_pr = table._tbl.tblPr
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(sum(widths_dxa)))
    tbl_w.set(qn("w:type"), "dxa")
    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), str(indent_dxa))
    tbl_ind.set(qn("w:type"), "dxa")
    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths_dxa:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(widths_dxa[idx]))
            tc_w.set(qn("w:type"), "dxa")


def set_table_borders(table, color=BORDER, size=8):
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.find(qn("w:tblBorders"))
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = qn(f"w:{edge}")
        node = borders.find(tag)
        if node is None:
            node = OxmlElement(f"w:{edge}")
            borders.append(node)
        node.set(qn("w:val"), "single")
        node.set(qn("w:sz"), str(size))
        node.set(qn("w:space"), "0")
        node.set(qn("w:color"), color)


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    header = OxmlElement("w:tblHeader")
    header.set(qn("w:val"), "true")
    tr_pr.append(header)


def set_row_cant_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    cant_split.set(qn("w:val"), "true")
    tr_pr.append(cant_split)


def add_page_field(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("第 ")
    set_run_font(run, size=8.5, color=MID_GRAY)
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "1"
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.extend([fld_begin, instr, fld_sep, text, fld_end])
    tail = paragraph.add_run(" 页")
    set_run_font(tail, size=8.5, color=MID_GRAY)


def configure_styles(doc):
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = FONT
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor.from_string(BLACK)
    normal._element.rPr.rFonts.set(qn("w:ascii"), FONT)
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.25

    for name, size, color, before, after in (
        ("Heading 1", 16, NAVY, 18, 10),
        ("Heading 2", 13, BLUE, 14, 7),
        ("Heading 3", 11.5, NAVY, 10, 5),
    ):
        style = styles[name]
        style.font.name = FONT
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style._element.rPr.rFonts.set(qn("w:ascii"), FONT)
        style._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
        style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True
        style.paragraph_format.line_spacing = 1.15


def add_section_heading(doc, title, subtitle=None):
    table = doc.add_table(rows=1, cols=1)
    set_table_geometry(table, [9360], 120)
    set_table_borders(table, color=LIGHT_BLUE, size=0)
    cell = table.cell(0, 0)
    set_cell_shading(cell, LIGHT_BLUE)
    set_cell_margins(cell, top=100, start=160, bottom=90, end=160)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    p = cell.paragraphs[0]
    set_paragraph_spacing(p, after=0, line=1.15)
    r = p.add_run(title)
    set_run_font(r, size=12.5, bold=True, color=NAVY)
    if subtitle:
        r = p.add_run(f"  {subtitle}")
        set_run_font(r, size=9, color=MID_GRAY)
    spacer = doc.add_paragraph()
    set_paragraph_spacing(spacer, after=2, line=1)


def add_question_title(doc, number, title, required=True):
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    set_paragraph_spacing(p, before=7, after=2, line=1.15)
    r = p.add_run(f"{number}. ")
    set_run_font(r, size=11.5, bold=True, color=BLUE)
    r = p.add_run(title)
    set_run_font(r, size=11.5, bold=True, color=BLACK)
    if required:
        r = p.add_run("  *")
        set_run_font(r, size=11.5, bold=True, color=RED)


def add_help(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.keep_with_next = True
    set_paragraph_spacing(p, after=4, line=1.2)
    r = p.add_run(text)
    set_run_font(r, size=9.2, color=MID_GRAY)


def add_response_line(doc, placeholder="请填写"):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.right_indent = Inches(0.08)
    set_paragraph_spacing(p, after=6, line=1.15)
    p_pr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), LIGHT_GRAY)
    p_pr.append(shd)
    borders = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "8")
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), BORDER)
    borders.append(bottom)
    p_pr.append(borders)
    r = p.add_run(f"  {placeholder}  ")
    set_run_font(r, size=9.5, color=MID_GRAY)


def add_multiline_response(doc, lines=3):
    table = doc.add_table(rows=1, cols=1)
    set_row_cant_split(table.rows[0])
    set_table_geometry(table, [9360], 120)
    set_table_borders(table, color=BORDER, size=8)
    cell = table.cell(0, 0)
    set_cell_shading(cell, "FFFFFF")
    set_cell_margins(cell, top=120, start=140, bottom=120, end=140)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
    p = cell.paragraphs[0]
    set_paragraph_spacing(p, after=0, line=1.2)
    r = p.add_run("请填写")
    set_run_font(r, size=9.5, color=MID_GRAY)
    for _ in range(lines - 1):
        p = cell.add_paragraph()
        set_paragraph_spacing(p, after=0, line=1.2)
        p.add_run(" ")
    after = doc.add_paragraph()
    set_paragraph_spacing(after, after=1, line=1)


def add_options(doc, options):
    for idx, option in enumerate(options):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.28)
        p.paragraph_format.first_line_indent = Inches(-0.02)
        set_paragraph_spacing(p, after=3, line=1.18)
        p.paragraph_format.keep_together = True
        p.paragraph_format.keep_with_next = idx < len(options) - 1
        mark = p.add_run("☐ ")
        set_run_font(mark, size=11, color=BLUE)
        r = p.add_run(option)
        set_run_font(r, size=10, color=BLACK)


def add_question(doc, number, title, help_text=None, required=True, options=None,
                 placeholder="请填写", multiline=False):
    add_question_title(doc, number, title, required)
    if help_text:
        add_help(doc, help_text)
    if options:
        add_options(doc, options)
    elif multiline:
        add_multiline_response(doc, 4)
    else:
        add_response_line(doc, placeholder)


doc = Document()
section = doc.sections[0]
section.page_width = Inches(8.5)
section.page_height = Inches(11)
section.top_margin = Inches(0.72)
section.bottom_margin = Inches(0.72)
section.left_margin = Inches(1)
section.right_margin = Inches(1)
section.header_distance = Inches(0.36)
section.footer_distance = Inches(0.36)
configure_styles(doc)

# Quiet running header and footer for this multi-page application form.
header = section.header
hp = header.paragraphs[0]
hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
set_paragraph_spacing(hp, after=0, line=1)
r = hp.add_run("WEEX 合作伙伴申请 | 2026")
set_run_font(r, size=8.5, color=MID_GRAY)

footer = section.footer
fp = footer.paragraphs[0]
set_paragraph_spacing(fp, after=0, line=1)
r = fp.add_run("根据 Lark 原表整理 · 中文版本")
set_run_font(r, size=8.5, color=MID_GRAY)
add_page_field(fp)

# Customer-pack style opening block, simplified for a fillable application form.
p = doc.add_paragraph()
set_paragraph_spacing(p, before=3, after=4, line=1.05)
r = p.add_run("WEEX 合作伙伴申请表")
set_run_font(r, size=24, bold=True, color=NAVY)
p2 = doc.add_paragraph()
set_paragraph_spacing(p2, after=13, line=1.1)
r = p2.add_run("2026 · 中文整理版")
set_run_font(r, size=11, bold=True, color=BLUE)

intro = doc.add_table(rows=1, cols=1)
set_table_geometry(intro, [9360], 120)
set_table_borders(intro, color=BORDER, size=6)
cell = intro.cell(0, 0)
set_cell_shading(cell, LIGHT_GRAY)
set_cell_margins(cell, top=130, start=170, bottom=130, end=170)
p = cell.paragraphs[0]
set_paragraph_spacing(p, after=3, line=1.25)
r = p.add_run("感谢您的咨询！请填写以下必要信息。")
set_run_font(r, size=10.5, bold=True, color=BLACK)
p = cell.add_paragraph()
set_paragraph_spacing(p, after=0, line=1.25)
r = p.add_run("提交后，预计将有专人在 1-2 个工作日内与您联系。带 * 的项目为必填项。")
set_run_font(r, size=9.5, color=MID_GRAY)

add_section_heading(doc, "一、基本信息", "身份与推广区域")
add_question(doc, 1, "您的姓名", "该姓名将作为您的用户名，请确保填写正确。")
add_question(doc, 2, "您的 WEEX UID", "如尚未申请成为合作伙伴，请填写“0”。", placeholder="请输入整数")
add_question(doc, 3, "来源国家或地区", "请填写您的来源国家或地区。")
add_question(doc, 4, "您的推广区域", "例如：浙江宁波、河南省、英国曼彻斯特、新加坡等。")
add_question(doc, 5, "首选沟通语言", "最多填写 2 种，例如：英语、中文、土耳其语、西班牙语、葡萄牙语、法语。")

add_section_heading(doc, "二、社区与合作情况", "规模、经验与合作诉求")
add_question(doc, 6, "您的社区规模（如适用）", "如尚无社区，请选择“0”。", options=[
    "1-1,000 人", "1,001-5,000 人", "5,001-10,000 人", "10,001 人及以上", "0 人",
])
add_question(doc, 7, "社区月均交易量（如适用）", "如尚无社区，请选择“0 美元”。", options=[
    "1-5,000,000 美元", "5,000,000-20,000,000 美元", "20,000,000-50,000,000 美元",
    "50,000,001 美元及以上", "0 美元",
])
add_question(doc, 8, "您对联盟计划的熟悉程度", options=[
    "我是新手，尚不了解联盟计划的运作方式。",
    "我基本了解联盟计划的运作方式。",
    "我有相关经验，了解其运作方式，并已准备开始。",
])
add_question(doc, 9, "合作类型", "例如：代理合作、团队合作、流量合作、商务合作等。")
add_question(doc, 10, "您目前正在合作的平台数量", "如目前没有合作平台，请填写“0”。", placeholder="请输入整数")
add_question(doc, 11, "您的用户来源渠道", "请选择一项。", options=["线上", "线下", "线上及线下"])
add_question(doc, 12, "您期望的代理佣金制度", "可填写期望等级、返佣比例结构等。", multiline=True)
add_question(doc, 13, "您从何处了解到 WEEX 合作伙伴招募", "请选择最符合的选项；原表中的相近 Telegram 选项已合并。", options=[
    "WEEX 官方 Telegram / TG 群", "其他线上渠道", "其他渠道（请注明）",
])
add_question(doc, 14, "补充说明", "请简要介绍您的团队资源、推广计划、合作思路，或任何有助于 WEEX 了解您合作潜力的信息。", required=False, multiline=True)

add_section_heading(doc, "三、联系方式", "请填写可正常接收消息的联系方式")
add_question(doc, 15, "联系电话（WhatsApp）", "请填写可正常接收短信或电话的手机号码。信息将被加密。")
add_question(doc, 16, "联系邮箱", "请填写正确的邮箱地址，该邮箱将用于联系您。例如：abc@gmail.com。")
add_question(doc, 17, "微信 / Telegram", "请注明平台，例如：Telegram：@example；微信：123456。")
add_question(doc, 18, "社交媒体频道链接", "优先填写 X（Twitter）或 YouTube 链接。")

add_section_heading(doc, "四、提交确认", "请阅读并确认")
add_question_title(doc, 19, "提交前请确认", True)
confirmations = [
    "WEEX 将收集我的电话号码以及微信、Telegram 或 QQ 账号信息。",
    "上述信息仅用于身份验证、代理申请审核和官方支持。",
    "提交材料后，专员将在 1-2 个工作日内与我联系。",
]
for idx, text in enumerate(confirmations, 1):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.28)
    p.paragraph_format.first_line_indent = Inches(-0.02)
    set_paragraph_spacing(p, after=4, line=1.25)
    r = p.add_run(f"{idx}. ")
    set_run_font(r, size=10, bold=True, color=BLUE)
    r = p.add_run(text)
    set_run_font(r, size=10, color=BLACK)
add_help(doc, "如有疑问，可联系 support@weex.com 或通过 WEEX App 客服寻求支持。")
add_options(doc, ["我已阅读并同意上述内容"])

p = doc.add_paragraph()
set_paragraph_spacing(p, before=14, after=2, line=1.2)
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("原始表单由 Lark 多维表格提供技术支持")
set_run_font(r, size=8.5, color=MID_GRAY)

doc.core_properties.title = "WEEX 合作伙伴申请表（2026）- 中文整理版"
doc.core_properties.subject = "WEEX 合作伙伴申请信息收集表"
doc.core_properties.author = "OpenAI Codex"
doc.core_properties.keywords = "WEEX, 合作伙伴, 申请表, 中文"
doc.save(OUT)
print(OUT)
