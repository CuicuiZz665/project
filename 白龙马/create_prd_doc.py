from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
import os


BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "中台调整PRD-后台xp+转盘.docx")


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, v in [("top", top), ("start", start), ("bottom", bottom), ("end", end)]:
        node = tc_mar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(v))
        node.set(qn("w:type"), "dxa")


def set_table_widths(table, widths):
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = False
    tbl_pr = table._tbl.tblPr
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), "9360")
    tbl_w.set(qn("w:type"), "dxa")

    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), "120")
    tbl_ind.set(qn("w:type"), "dxa")

    grid = table._tbl.tblGrid
    if grid is None:
        grid = OxmlElement("w:tblGrid")
        table._tbl.insert(0, grid)
    for child in list(grid):
        grid.remove(child)
    for width in widths:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)

    for row in table.rows:
        for index, cell in enumerate(row.cells):
            cell.width = Inches(widths[index] / 1440)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_margins(cell)
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(widths[index]))
            tc_w.set(qn("w:type"), "dxa")


def style_run(run, bold=False, color=None, size=None):
    run.bold = bold
    run.font.name = "STHeiti"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "STHeiti")
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    if size:
        run.font.size = Pt(size)


def add_heading(doc, text, level=1):
    p = doc.add_paragraph()
    p.style = f"Heading {level}"
    run = p.add_run(text)
    style_run(run, bold=True, color="2E74B5" if level < 3 else "1F4D78", size=16 if level == 1 else 13 if level == 2 else 12)
    return p


def add_body(doc, text):
    p = doc.add_paragraph(text)
    p.style = "Normal"
    return p


def add_bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    run = p.add_run(text)
    style_run(run)
    return p


def add_table(doc, headers, rows, widths):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    for i, header in enumerate(headers):
        hdr[i].text = header
        set_cell_shading(hdr[i], "E8EEF5")
        for p in hdr[i].paragraphs:
            for run in p.runs:
                style_run(run, bold=True)
    for row in rows:
        cells = table.add_row().cells
        for i, value in enumerate(row):
            cells[i].text = value
            for p in cells[i].paragraphs:
                for run in p.runs:
                    style_run(run)
    set_table_widths(table, widths)
    return table


doc = Document()
section = doc.sections[0]
section.page_width = Inches(8.5)
section.page_height = Inches(11)
for side in ["top_margin", "right_margin", "bottom_margin", "left_margin"]:
    setattr(section, side, Inches(1))
section.header_distance = Inches(0.492)
section.footer_distance = Inches(0.492)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "STHeiti"
normal._element.rPr.rFonts.set(qn("w:eastAsia"), "STHeiti")
normal.font.size = Pt(11)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.25

for name, size, color, before, after in [
    ("Heading 1", 16, "2E74B5", 18, 10),
    ("Heading 2", 13, "2E74B5", 14, 7),
    ("Heading 3", 12, "1F4D78", 10, 5),
]:
    style = styles[name]
    style.font.name = "STHeiti"
    style._element.rPr.rFonts.set(qn("w:eastAsia"), "STHeiti")
    style.font.size = Pt(size)
    style.font.color.rgb = RGBColor.from_string(color)
    style.font.bold = True
    style.paragraph_format.space_before = Pt(before)
    style.paragraph_format.space_after = Pt(after)
    style.paragraph_format.line_spacing = 1.25

title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.LEFT
title_run = title.add_run("中台调整 PRD：后台 XP + 转盘")
style_run(title_run, bold=True, color="0B2545", size=20)
title.paragraph_format.space_after = Pt(8)

subtitle = doc.add_paragraph()
subtitle_run = subtitle.add_run("范围：积分获取设置 XP/Drop 版、投递新建奖金/积分大转盘版、合并后台左侧菜单。")
style_run(subtitle_run, color="555555")
subtitle.paragraph_format.space_after = Pt(10)

add_table(
    doc,
    ["项目", "内容"],
    [
        ["文档类型", "中台调整 PRD"],
        ["版本", "V1.0"],
        ["页面入口", "市场活动 > 积分 > 积分获取设置；市场活动 > 投递管理 > 投递列表"],
        ["输出原型", "后台-xp+转盘.html"],
    ],
    [2200, 7160],
)

add_heading(doc, "1. 背景与目标")
add_body(doc, "现有两个后台节点分别完成了积分获取规则和投递新建能力。本次将两个节点合并为一个后台原型，并保留已完成内容；同时补充投递物选择的动态展示逻辑，避免未选择投递物时提前展示奖金/积分配置区域。")

add_heading(doc, "2. 调整范围")
add_bullet(doc, "后台左侧菜单只保留两个业务入口：积分获取设置、投递列表。")
add_bullet(doc, "积分获取设置保留 XP / Drop 奖励配置、规则列表、新增/修改/复制、启用/禁用、列设置等现有能力。")
add_bullet(doc, "投递列表保留新建投递、投递物级联选择、自动/人工投递、详情抽屉等现有能力。")
add_bullet(doc, "新建投递中，投递物未选择前不展示下方动态配置块。")

add_heading(doc, "3. 功能改动清单")
add_table(
    doc,
    ["模块", "调整点", "说明"],
    [
        ["合并后台", "左侧菜单精简", "删除其他菜单展示，仅保留“积分 > 积分获取设置”和“投递管理 > 投递列表”。"],
        ["积分获取设置", "奖励类型扩展", "规则奖励支持 XP、Drop，可单独配置，也可同时配置。"],
        ["积分获取设置", "规则维护", "保留查询、分页、列设置、新增、修改、复制、启用/禁用确认等交互。"],
        ["投递新建", "投递物选择", "投递物支持优惠券、奖励、积分三级/二级选择。"],
        ["投递新建", "动态配置块", "未选择投递物时不展示金额/数量/中奖概率；选择奖励或积分后再展示对应配置。"],
        ["投递新建", "优惠券分支", "选择优惠券时展示优惠券选择内容，不展示奖金/积分配置块。"],
    ],
    [1700, 2500, 5160],
)

add_heading(doc, "4. 关键交互规则")
add_bullet(doc, "进入合并后台后，默认打开“积分获取设置”。")
add_bullet(doc, "点击左侧“投递列表”，右侧切换到投递管理页面。")
add_bullet(doc, "点击投递列表的“新建”后，选择投递物输入框默认显示“请选择投递物”。")
add_bullet(doc, "未选择投递物前，金额、发放数量、中奖概率等区域不出现。")
add_bullet(doc, "选择“奖励”后，展示金额、发放数量、中奖概率。")
add_bullet(doc, "选择“积分 > XP / Drop”后，展示积分值、发放数量、中奖概率。")
add_bullet(doc, "选择“优惠券”后，仅展示优惠券选择区域。")

add_heading(doc, "5. 字段说明")
add_table(
    doc,
    ["字段", "代表什么"],
    [
        ["XP", "积分奖励类型之一，用于任务或投递发放。"],
        ["Drop", "积分奖励类型之一，可与 XP 分别配置。"],
        ["投递物", "本次投递发放的对象，包含优惠券、奖励、积分。"],
        ["金额", "选择奖励类投递物时填写的奖金金额。"],
        ["发放数量（份）", "本次投递或奖池中可发放的份数。"],
        ["中奖概率", "大转盘场景下该投递物被抽中的概率。"],
        ["投递方式", "自动：按触发事件投递；人工：按指定用户投递。"],
        ["触发事件", "自动投递时使用的触发条件，例如大转盘。"],
    ],
    [2700, 6660],
)

add_heading(doc, "6. 验收标准")
add_bullet(doc, "打开“后台-xp+转盘.html”，左侧不出现无关菜单项。")
add_bullet(doc, "点击两个保留菜单，右侧页面能正常切换，原有列表和弹窗内容不丢失。")
add_bullet(doc, "新建投递弹窗打开时，投递物下方动态配置块默认不显示。")
add_bullet(doc, "选择奖励或积分后，才显示图二对应的配置区域。")
add_bullet(doc, "选择优惠券后，不显示奖金/积分配置区域。")
add_bullet(doc, "积分获取设置页面的 XP / Drop 规则配置、保存校验和列表展示正常。")

add_heading(doc, "7. 本次不包含")
add_bullet(doc, "不调整真实接口、权限、登录态和后端数据结构。")
add_bullet(doc, "不重做页面视觉，只基于现有原型合并与补充交互。")
add_bullet(doc, "不扩展优惠券、奖励、积分的实际库存校验逻辑。")

doc.save(OUT)
print(OUT)
