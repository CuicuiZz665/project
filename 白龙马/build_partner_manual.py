from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE


import os

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "Partner Web 控制台简易操作手册.docx")
ASSET = os.path.join(BASE, "partner_manual_assets")
CN_FONT = "STHeiti"


def apply_run_font(run, size=None, bold=None, color=None):
    run.font.name = CN_FONT
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), CN_FONT)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if color is not None:
        run.font.color.rgb = RGBColor.from_string(color)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_text(cell, text, bold=False):
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(text)
    apply_run_font(run, size=9, bold=bold)


def add_table(doc, rows, widths=(1.55, 4.75)):
    table = doc.add_table(rows=1, cols=len(rows[0]))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    for i, text in enumerate(rows[0]):
        set_cell_text(hdr[i], text, True)
        set_cell_shading(hdr[i], "E8EEF5")
    for row in rows[1:]:
        cells = table.add_row().cells
        for i, text in enumerate(row):
            set_cell_text(cells[i], text)
    for row in table.rows:
        for i, cell in enumerate(row.cells):
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if i < len(widths):
                cell.width = Inches(widths[i])
    doc.add_paragraph()
    return table


def add_steps(doc, steps):
    for i, step in enumerate(steps, 1):
        p = doc.add_paragraph(style="List Number")
        apply_run_font(p.add_run(step))


def add_screenshot(doc, path, caption):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run()
    r.add_picture(path, width=Inches(6.15))
    cap = doc.add_paragraph(caption)
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    apply_run_font(cap.runs[0], size=9)
    cap.runs[0].font.color.rgb = RGBColor(89, 89, 89)


def add_note(doc, text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_shading(cell, "F4F6F9")
    set_cell_text(cell, text)
    doc.add_paragraph()


doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(0.75)
sec.bottom_margin = Inches(0.75)
sec.left_margin = Inches(0.75)
sec.right_margin = Inches(0.75)

styles = doc.styles
styles["Normal"].font.name = CN_FONT
styles["Normal"]._element.rPr.rFonts.set(qn("w:eastAsia"), CN_FONT)
styles["Normal"].font.size = Pt(10.5)
styles["Normal"].paragraph_format.space_after = Pt(6)
styles["Normal"].paragraph_format.line_spacing = 1.2
for name, size, color in [
    ("Heading 1", 16, "2E74B5"),
    ("Heading 2", 13, "2E74B5"),
    ("Heading 3", 11.5, "1F4D78"),
    ("List Number", 10.5, "000000"),
    ("List Bullet", 10.5, "000000"),
]:
    st = styles[name]
    st.font.name = CN_FONT
    st._element.rPr.rFonts.set(qn("w:eastAsia"), CN_FONT)
    st.font.size = Pt(size)
    st.font.color.rgb = RGBColor.from_string(color)
    st.paragraph_format.space_before = Pt(10)
    st.paragraph_format.space_after = Pt(5)

title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title.add_run("Partner Web 控制台简易操作手册")
apply_run_font(run, size=20, bold=True, color="1F4D78")

subtitle = doc.add_paragraph()
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
apply_run_font(subtitle.add_run("适用于代理/合伙人查看经营数据、客户、团队与结算信息"), size=10)

doc.add_heading("使用前先知道", level=1)
add_table(doc, [
    ["规则", "说明"],
    ["统计时区", "页面内涉及时间统计与列表时间，默认按 GMT+0 展示。"],
    ["金额精度", "佣金、金额字段保留 2 位小数；无数据时显示 “-” 或 0.00。"],
    ["常用时间筛选", "常见选项为今日、7D、30D、180D；切换后页面数据会按所选周期刷新。"],
    ["左上角三横线", "用于展开/收起菜单。需要切换页面时，先点左上角三横线，再选择菜单。"],
], widths=(1.35, 5.15))

doc.add_heading("1. 登录与切换菜单", level=1)
add_steps(doc, [
    "打开产品地址：https://partner.ginfx-inc.net/workbench-overview。",
    "如出现登录页，点击“继续”，按系统要求完成登录。",
    "进入控制台后，点击左上角三横线图标展开菜单。",
    "在菜单里选择：工作台总览、直客明细、子代理网络、财务与结算。",
])
add_note(doc, "申请成为专家：用于进入专家/带单员申请入口，本手册仅做入口说明，不展开后续申请流程。")

doc.add_heading("2. 工作台总览", level=1)
add_screenshot(doc, f"{ASSET}/01_workbench.png", "截图：工作台总览")
doc.add_heading("怎么操作", level=2)
add_steps(doc, [
    "进入后先看顶部月份，确认当前查看的是哪个月份的数据。",
    "需要下载经营数据时，点击“导出月报”。",
    "需要看提现和资金明细时，点击“资金流水”，进入财务与结算。",
    "需要给客户邀请链接时，在“默认跟踪链接”区域复制 Web 地址或 Miniapp 地址，也可以查看二维码。",
    "下方趋势图可切换返佣、持仓量、活跃客户，并可选择 7D 等时间范围。",
])
doc.add_heading("字段说明", level=2)
add_table(doc, [
    ["字段", "代表什么"],
    ["可结算余额", "Funding Account 中当前可提现的佣金余额，T+1 结算后更新。"],
    ["待结算", "已经产生但还未完成 T+1 结算的佣金。"],
    ["累计已结", "历史所有已结算进入账户的佣金总额。"],
    ["累计持仓量", "代理网络内客户历史产生的总持仓量；可拆分看直客和子代理团队。"],
    ["新增客户/共邀", "所选周期内新增有效客户数 / 历史累计邀请成功客户数。"],
    ["营销激励比例", "当前等级对应的附加营销返佣比例。"],
    ["跟单分成", "作为带单员时，跟随者盈利后形成的累计分成收入。"],
    ["子代理网络", "下线网络内所有层级的子代理人数，并显示最大层级深度。"],
    ["当前等级", "当前代理等级、可获返佣比例、营销激励比例和下一等级进度。"],
    ["收入构成", "把周期内收入拆成直客返佣、营销激励、跟单分成。"],
    ["交易产品分布", "展示所选周期内各交易品种的持仓分布和 Top 5。"],
    ["返佣贡献", "各交易品种为代理产生的佣金金额 Top 10。"],
])

doc.add_heading("3. 直客明细", level=1)
add_screenshot(doc, f"{ASSET}/02_direct_customers.png", "截图：直客明细")
doc.add_heading("怎么操作", level=2)
add_steps(doc, [
    "点击左上角三横线，选择“直客明细”。",
    "顶部先看直客总数、当前活跃直客、直客净入金。",
    "需要找某个客户时，在搜索框输入用户昵称或用户 ID。",
    "可按全部状态/新注册/活跃/沉睡筛选，也可按注册时间、最近活跃日期筛选。",
    "设置好条件后点击“查询”；想恢复默认条件点击“重置”。",
    "需要表格数据时点击“导出直客明细”，导出内容会按当前筛选条件生成。",
])
doc.add_heading("字段说明", level=2)
add_table(doc, [
    ["字段", "代表什么"],
    ["直客总数", "我直接邀请注册并绑定成功的一级直属客户总人数。"],
    ["当前活跃直客", "近 3 天内产生开仓交易的直属客户数量。"],
    ["直客净入金", "直客历史真实总入金减去真实总出金，剔除内部划转。"],
    ["直客交易产品分布", "只统计直属客户的交易品种偏好。"],
    ["代理返佣标准速览", "当前等级规则表，包含代理等级、考核规则、保底佣金比例、营销激励比例。"],
    ["用户昵称/用户 ID", "客户名称和 UID，用于识别客户。"],
    ["用户类型", "交易客户/子代理；直客升级为子代理后会同步变化。"],
    ["注册时间", "客户注册时间，按 GMT+0 展示。"],
    ["净入金", "该客户真实入金减出金后的净额，单位 USDT。"],
    ["持仓量", "该客户产生的持仓量，单位 USDT。"],
    ["佣金贡献", "该客户为当前代理产生的佣金，单位 USDT。"],
    ["最近活跃时间", "客户最近一次有效交易活动时间，按 GMT+0 展示。"],
    ["状态", "新注册：近 3 天注册且未开仓；活跃：近 3 天有开仓；沉睡：连续 3 天以上没有开仓活动。"],
])

doc.add_heading("4. 子代理网络", level=1)
add_screenshot(doc, f"{ASSET}/03_sub_partner_network.png", "截图：子代理网络")
doc.add_heading("怎么操作", level=2)
add_steps(doc, [
    "点击左上角三横线，选择“子代理网络”。",
    "顶部查看子代理人数、活跃子代理数、团队总人数。",
    "需要看全部团队成员时，点击“查看团队客户”。",
    "在“子代理关系树”中点击展开/收起，查看上下级关系。",
    "在“全部子代理”表格中，可按代理 ID/昵称、层级、状态查询。",
    "需要下载数据时点击“导出子代理”，导出会按当前查询条件生成。",
])
doc.add_heading("字段说明", level=2)
add_table(doc, [
    ["字段", "代表什么"],
    ["子代理人数", "名下所有层级的子代理总人数。"],
    ["活跃子代理数", "考核周期内，其团队下至少有有效交易产生的子代理数量。"],
    ["团队总人数", "直属 Trader 加下方所有代理网络名下客户总人数。"],
    ["层级", "代理所在层级，如 L1、L2。"],
    ["昵称/代理 ID", "子代理名称和代理编号。"],
    ["直属上级", "该子代理的上级代理。"],
    ["代理等级", "该子代理当前等级。"],
    ["团队人数", "该代理团队内人员数量。"],
    ["团队净入金", "该代理团队真实净入金，剔除内部划转，单位 USDT。"],
    ["团队持仓量", "该代理团队产生的持仓量，单位 USDT。"],
    ["佣金贡献", "该代理团队为当前代理产生的佣金金额，单位 USDT。"],
    ["最近活跃", "该代理团队最近产生有效交易活动的时间，按 GMT+0 展示。"],
    ["状态", "新注册、活跃、沉睡。"],
])

doc.add_heading("5. 财务与结算", level=1)
add_screenshot(doc, f"{ASSET}/04_finance.png", "截图：财务与结算")
doc.add_heading("怎么操作", level=2)
add_steps(doc, [
    "点击左上角三横线，选择“财务与结算”。",
    "顶部查看待结算佣金和累计已结算金额。",
    "默认查看“交易流水”，用于核对每笔订单产生的佣金。",
    "切换到“结算记录”，用于核对每次结算单。",
    "可按订单 ID、用户 ID、交易品种、状态、时间段查询交易流水。",
    "需要下载时点击页面右上角导出按钮；导出内容按当前页签和筛选条件生成。",
])
doc.add_heading("字段说明", level=2)
add_table(doc, [
    ["字段", "代表什么"],
    ["待结算佣金", "已经产生但尚未到次日 GMT+0 10:00 结算时间的佣金。"],
    ["累计已结算", "已实际结算入账的资金，可按周期查看。"],
    ["订单 ID", "交易订单编号。"],
    ["交易用户 ID", "产生该笔交易的用户 UID。"],
    ["代理 ID", "佣金归属或相关代理编号；页面未展示时以导出/详情为准。"],
    ["交易品种", "客户交易的产品，如 BTCUSD、AUDCAD。"],
    ["方向", "买入或卖出。"],
    ["开仓/平仓时间", "订单开仓和平仓时间，按 GMT+0 展示。"],
    ["持仓量", "该订单对应持仓规模，单位 USDT。"],
    ["佣金金额", "该订单产生的佣金，单位 USDT。"],
    ["佣金来源", "说明佣金来自哪一层级，例如 L1 直属贡献、L2 下级贡献。"],
    ["结算状态", "待结算或已结算。"],
])
doc.add_heading("结算记录字段", level=2)
add_table(doc, [
    ["字段", "代表什么"],
    ["结算单号", "每次结算生成的单据编号。"],
    ["代理 ID", "本次结算发放到的代理。"],
    ["结算日期", "单个结算时间点，不是时间范围。"],
    ["订单数量", "该结算单包含的订单数量，可点击查看关联订单明细。"],
    ["结算类型", "例如 IB 返佣、营销激励。"],
    ["结算金额", "该结算单对应金额，单位 USDT。"],
    ["预计/实际结算时间", "待结算显示预计时间，已结算显示实际时间，按 GMT+0 展示。"],
])

doc.add_heading("6. 团队客户明细（从子代理网络进入）", level=1)
doc.add_paragraph("入口：在“子代理网络”页面顶部的“团队总人数/团队客户”区域点击“查看团队客户”。")
doc.add_heading("怎么操作", level=2)
add_steps(doc, [
    "进入后可查看团队总人数、子代理人数、Trader 人数。",
    "可按用户昵称、用户 ID 或代理 ID 搜索。",
    "可按人员类型（全部、Trader、子代理）和状态筛选。",
    "点击“查询”刷新列表；点击“返回子代理网络”回到上一页。",
])
doc.add_heading("主要字段", level=2)
add_table(doc, [
    ["字段", "代表什么"],
    ["人员类型", "Trader 或子代理。"],
    ["用户 ID/代理 ID", "Trader 显示用户 ID，子代理显示代理 ID。"],
    ["层级", "子代理显示 L1、L2 等；不适用显示 “-”。"],
    ["直属上级", "该人员所属上级代理，无数据显示 “-”。"],
    ["等级", "子代理展示代理等级；Trader 不适用显示 “-”。"],
    ["净入金/持仓量/佣金贡献", "该人员或其团队产生的关键经营数据，单位 USDT。"],
    ["累计贡献", "历史累计产生的佣金金额。"],
    ["有效客户", "仅对子代理展示名下有效客户数量；Trader 不适用显示 “-”。"],
    ["最近活跃时间", "最近一次有效交易活动时间，按 GMT+0 展示。"],
])

doc.add_heading("7. 带单员/专家相关说明", level=1)
doc.add_paragraph("该入口用于申请成为专家/带单员，成为后可查看跟单人数、跟单金额、胜率、分润比例和分润佣金等信息。本手册不展开申请流程。")
add_table(doc, [
    ["字段", "代表什么"],
    ["当前高手数", "当前已成为带单员的高手总人数。"],
    ["总跟单人数", "所有带单员名下跟单者总人数。"],
    ["累计跟单金额", "所有跟单账户当前投入跟单的金额合计，单位 USDT。"],
    ["分润比例", "带单员默认或单个带单员配置的分润比例。"],
    ["佣金", "跟单者产生可分配盈利后，按分润比例计算并结算给带单员的金额。"],
    ["计算公式", "带单员佣金 = 跟单者可分配盈利 × 带单员分润比例。"],
])

doc.add_heading("8. 最常用操作速查", level=1)
add_table(doc, [
    ["想做什么", "点哪里"],
    ["切换页面", "左上角三横线 → 选择菜单。"],
    ["看整体经营数据", "工作台总览。"],
    ["复制邀请链接", "工作台总览 → 默认跟踪链接 → 复制 Web 地址/Miniapp 地址。"],
    ["看直属客户", "直客明细。"],
    ["导出直属客户", "直客明细 → 设置筛选条件 → 导出直客明细。"],
    ["看下级代理", "子代理网络。"],
    ["看团队全部人员", "子代理网络 → 查看团队客户。"],
    ["核对佣金订单", "财务与结算 → 交易流水。"],
    ["核对结算单", "财务与结算 → 结算记录。"],
])

doc.save(OUT)
print(OUT)
