from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics


import os

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "中台调整PRD-后台xp+转盘.pdf")
FONT = "STHeitiEmbedded"

pdfmetrics.registerFont(TTFont(FONT, "/System/Library/Fonts/STHeiti Medium.ttc", subfontIndex=0))

styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    "TitleCN",
    parent=styles["Title"],
    fontName=FONT,
    fontSize=20,
    leading=26,
    textColor=colors.HexColor("#0B2545"),
    alignment=TA_LEFT,
    spaceAfter=8,
)
sub_style = ParagraphStyle(
    "SubCN",
    parent=styles["BodyText"],
    fontName=FONT,
    fontSize=10.5,
    leading=16,
    textColor=colors.HexColor("#555555"),
    spaceAfter=10,
)
h1_style = ParagraphStyle(
    "H1CN",
    parent=styles["Heading1"],
    fontName=FONT,
    fontSize=14,
    leading=20,
    textColor=colors.HexColor("#2E74B5"),
    spaceBefore=12,
    spaceAfter=7,
)
body_style = ParagraphStyle(
    "BodyCN",
    parent=styles["BodyText"],
    fontName=FONT,
    fontSize=9.5,
    leading=13.5,
    spaceAfter=3,
)
bullet_style = ParagraphStyle(
    "BulletCN",
    parent=body_style,
    leftIndent=16,
    firstLineIndent=-8,
)


def p(text, style=body_style):
    return Paragraph(text, style)


def bullet(text):
    return Paragraph("• " + text, bullet_style)


def table(data, widths):
    t = Table([[p(str(cell)) for cell in row] for row in data], colWidths=widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), FONT),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF5")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1F3A5F")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#9AA4B2")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


doc = SimpleDocTemplate(
    OUT,
    pagesize=letter,
    rightMargin=0.7 * inch,
    leftMargin=0.7 * inch,
    topMargin=0.65 * inch,
    bottomMargin=0.65 * inch,
)

story = []
story.append(p("中台调整 PRD：后台 XP + 转盘", title_style))
story.append(p("范围：积分获取设置 XP/Drop 版、投递新建奖金/积分大转盘版、合并后台左侧菜单。", sub_style))

story.append(
    table(
        [
            ["项目", "内容"],
            ["文档类型", "中台调整 PRD"],
            ["版本", "V1.0"],
            ["页面入口", "市场活动 > 积分 > 积分获取设置；市场活动 > 投递管理 > 投递列表"],
            ["输出原型", "后台-xp+转盘.html"],
        ],
        [1.35 * inch, 5.65 * inch],
    )
)

story.append(p("1. 背景与目标", h1_style))
story.append(
    p(
        "现有两个后台节点分别完成了积分获取规则和投递新建能力。本次将两个节点合并为一个后台原型，并保留已完成内容；同时补充投递物选择的动态展示逻辑，避免未选择投递物时提前展示奖金/积分配置区域。"
    )
)

story.append(p("2. 调整范围", h1_style))
for item in [
    "后台左侧菜单只保留两个业务入口：积分获取设置、投递列表。",
    "积分获取设置保留 XP / Drop 奖励配置、规则列表、新增/修改/复制、启用/禁用、列设置等现有能力。",
    "投递列表保留新建投递、投递物级联选择、自动/人工投递、详情抽屉等现有能力。",
    "新建投递中，投递物未选择前不展示下方动态配置块。",
]:
    story.append(bullet(item))

story.append(p("3. 功能改动清单", h1_style))
story.append(
    table(
        [
            ["模块", "调整点", "说明"],
            ["合并后台", "左侧菜单精简", "删除其他菜单展示，仅保留“积分 > 积分获取设置”和“投递管理 > 投递列表”"],
            ["积分获取设置", "奖励类型扩展", "规则奖励支持 XP、Drop，可单独配置，也可同时配置"],
            ["积分获取设置", "规则维护", "保留查询、分页、列设置、新增、修改、复制、启用/禁用确认等交互"],
            ["投递新建", "投递物选择", "投递物支持优惠券、奖励、积分三级/二级选择"],
            ["投递新建", "动态配置块", "未选择投递物时不展示金额/数量/中奖概率；选择奖励或积分后再展示对应配置"],
            ["投递新建", "优惠券分支", "选择优惠券时展示优惠券选择内容，不展示奖金/积分配置块"],
        ],
        [1.25 * inch, 1.55 * inch, 4.2 * inch],
    )
)

story.append(p("4. 关键交互规则", h1_style))
for item in [
    "进入合并后台后，默认打开“积分获取设置”。",
    "点击左侧“投递列表”，右侧切换到投递管理页面。",
    "点击投递列表的“新建”后，选择投递物输入框默认显示“请选择投递物”。",
    "未选择投递物前，金额、发放数量、中奖概率等区域不出现。",
    "选择“奖励”后，展示金额、发放数量、中奖概率。",
    "选择“积分 > XP / Drop”后，展示积分值、发放数量、中奖概率。",
    "选择“优惠券”后，仅展示优惠券选择区域。",
]:
    story.append(bullet(item))

story.append(p("5. 字段说明", h1_style))
story.append(
    table(
        [
            ["字段", "代表什么"],
            ["XP", "积分奖励类型之一，用于任务或投递发放"],
            ["Drop", "积分奖励类型之一，可与 XP 分别配置"],
            ["投递物", "本次投递发放的对象，包含优惠券、奖励、积分"],
            ["金额", "选择奖励类投递物时填写的奖金金额"],
            ["发放数量（份）", "本次投递或奖池中可发放的份数"],
            ["中奖概率", "大转盘场景下该投递物被抽中的概率"],
            ["投递方式", "自动：按触发事件投递；人工：按指定用户投递"],
            ["触发事件", "自动投递时使用的触发条件，例如大转盘"],
        ],
        [1.45 * inch, 5.55 * inch],
    )
)

story.append(p("6. 验收标准", h1_style))
for item in [
    "打开“后台-xp+转盘.html”，左侧不出现无关菜单项。",
    "点击两个保留菜单，右侧页面能正常切换，原有列表和弹窗内容不丢失。",
    "新建投递弹窗打开时，投递物下方动态配置块默认不显示。",
    "选择奖励或积分后，才显示金额/数量/中奖概率对应配置区域。",
    "选择优惠券后，不显示奖金/积分配置区域。",
    "积分获取设置页面的 XP / Drop 规则配置、保存校验和列表展示正常。",
]:
    story.append(bullet(item))

story.append(p("7. 本次不包含", h1_style))
for item in [
    "不调整真实接口、权限、登录态和后端数据结构。",
    "不重做页面视觉，只基于现有原型合并与补充交互。",
    "不扩展优惠券、奖励、积分的实际库存校验逻辑。",
]:
    story.append(bullet(item))

doc.build(story)
print(OUT)
