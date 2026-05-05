"""
Pulsefy Diploma Thesis — skeleton builder.

Produces docs/Pulsefy_Diploma_Thesis.docx with:
- Three title pages (English bare, English with logo placeholders, Romanian with logo placeholders)
- Diploma Project Theme form (8 fields, Pulsefy-adapted)
- Academic Honesty Statement
- TOC + Table of Figures placeholders
- All 6 body chapters with full heading hierarchy
- Chapter 1 prose written and humanizer-audited
- Other chapters: heading + figure placeholder + [TODO: prose] markers
- Page header on body pages, arabic page numbers
"""

from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.section import WD_SECTION_START, WD_ORIENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


# ----------------------------------------------------------------------
# CONFIG  --  edit here when supervisor confirms details
# ----------------------------------------------------------------------
STUDENT_NAME = "Vlad DUMITRU"  # TODO: confirm exact spelling and capitalization
COORDINATOR = "Conf. dr. ing. Iuliana MARIN"
TITLE_EN = "Pulsefy: AI Music Discovery and Creation Platform"
TITLE_RO = "Pulsefy: Platformă de descoperire și creație muzicală asistată de AI"
YEAR = "2026"
SUBMISSION_MONTH = "June 2026"
DEPARTMENT_DIRECTOR = "Prof. dr. ing. Georg DRAGOI"  # TODO: verify still current
HEADER_TEXT = (
    f"Diploma Thesis, {STUDENT_NAME}, Faculty of Engineering "
    f"in Foreign Languages, UPB, {YEAR}"
)

OUTPUT_PATH = (
    "/Users/dumitruvlad/Documents/Facultate/Licenta/Pulsefy/"
    ".claude/worktrees/friendly-shockley-28309b/docs/"
    "Pulsefy_Diploma_Thesis.docx"
)


# ----------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------
def add_centered(doc, text, size=11, bold=False, italic=False, space_after=6):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    p.paragraph_format.space_after = Pt(space_after)
    return p


def add_blank_lines(doc, n=1):
    for _ in range(n):
        doc.add_paragraph()


def add_para(doc, text, size=11, bold=False, italic=False,
             alignment=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6):
    p = doc.add_paragraph()
    p.alignment = alignment
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    p.paragraph_format.space_after = Pt(space_after)
    return p


def add_heading_styled(doc, text, level=1):
    """Use python-docx Heading 1/2/3 styles so TOC auto-populates later."""
    h = doc.add_heading(text, level=level)
    # Force black text on headings (Word default Heading styles are blue).
    for run in h.runs:
        run.font.color.rgb = RGBColor(0, 0, 0)
    return h


def add_figure_placeholder(doc, number, caption):
    """Centered placeholder block: [FIGURE N: caption — to be drawn]."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(f"[FIGURE {number}: {caption} — to be drawn]")
    run.italic = True
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(0x80, 0x80, 0x80)
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)

    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = cap.add_run(f"Figure {number}: {caption}")
    run.font.size = Pt(10)
    cap.paragraph_format.space_after = Pt(12)


def add_table_placeholder(doc, number, caption):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(f"[TABLE {number}: {caption} — to be filled]")
    run.italic = True
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(0x80, 0x80, 0x80)
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)

    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = cap.add_run(f"Table {number}: {caption}")
    run.font.size = Pt(10)
    cap.paragraph_format.space_after = Pt(12)


def add_todo(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(f"[TODO: {text}]")
    run.italic = True
    run.font.color.rgb = RGBColor(0xC0, 0x39, 0x2B)
    run.font.size = Pt(10)
    p.paragraph_format.space_after = Pt(6)


def page_break(doc):
    doc.add_page_break()


def set_default_font(doc, name="Times New Roman", size=12):
    style = doc.styles["Normal"]
    style.font.name = name
    style.font.size = Pt(size)


def set_section_margins(section, top=2.5, bottom=2.5, left=2.5, right=2.5):
    section.top_margin = Cm(top)
    section.bottom_margin = Cm(bottom)
    section.left_margin = Cm(left)
    section.right_margin = Cm(right)


def add_uc_table(doc, name, scope, actor, preconditions, postconditions,
                 main_steps, extension=None, table_number=None):
    """Builds a 7-field UC description table per the canonical IARCA template."""
    rows = 6 if extension is None else 7
    table = doc.add_table(rows=rows, cols=2)
    table.style = "Table Grid"
    table.autofit = False

    fields = [
        ("Use Case Name:", name),
        ("Scope:", scope),
        ("Actor:", actor),
        ("Preconditions:", preconditions),
        ("Post-conditions:", postconditions),
        ("Main success scenario:", "[Main success scenario — see nested table below or fill in steps]"),
    ]
    if extension:
        fields.append(("Extension:", extension))

    for i, (label, value) in enumerate(fields):
        row = table.rows[i]
        row.cells[0].text = label
        for p in row.cells[0].paragraphs:
            for r in p.runs:
                r.bold = True
        row.cells[1].text = value

    if table_number:
        cap = doc.add_paragraph()
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = cap.add_run(f"Table {table_number}: {name} Description")
        run.font.size = Pt(10)
        cap.paragraph_format.space_after = Pt(12)


def add_page_number_field(paragraph):
    """Inserts a Word PAGE field into the given paragraph."""
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = "PAGE"
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")

    run = paragraph.add_run()
    run._r.append(fld_char1)
    run._r.append(instr)
    run._r.append(fld_char2)


def add_toc_field(paragraph, switches='\\o "1-3" \\h \\z \\u'):
    """Inserts a Word TOC field. User must Update Field (F9) in Word."""
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = f"TOC {switches}"
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "separate")
    fld_char3 = OxmlElement("w:t")
    fld_char3.text = "Right-click and Update Field in Word to populate."
    fld_char4 = OxmlElement("w:fldChar")
    fld_char4.set(qn("w:fldCharType"), "end")

    run = paragraph.add_run()
    run._r.append(fld_char1)
    run._r.append(instr)
    run._r.append(fld_char2)
    run._r.append(fld_char3)
    run._r.append(fld_char4)


def add_tof_field(paragraph):
    """Insert Word TOC field configured for figures (\\h table of figures)."""
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = 'TOC \\h \\z \\c "Figure"'
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "separate")
    fld_text = OxmlElement("w:t")
    fld_text.text = "Right-click and Update Field in Word to populate."
    fld_char3 = OxmlElement("w:fldChar")
    fld_char3.set(qn("w:fldCharType"), "end")

    run = paragraph.add_run()
    run._r.append(fld_char1)
    run._r.append(instr)
    run._r.append(fld_char2)
    run._r.append(fld_text)
    run._r.append(fld_char3)


# ----------------------------------------------------------------------
# build the document
# ----------------------------------------------------------------------
doc = Document()
set_default_font(doc, "Times New Roman", 12)

# Style up the heading defaults: sentence case is Vlad's responsibility
# in the heading text itself; we just make them black + serif here.
for level in (1, 2, 3):
    style = doc.styles[f"Heading {level}"]
    style.font.name = "Times New Roman"
    style.font.color.rgb = RGBColor(0, 0, 0)
    if level == 1:
        style.font.size = Pt(18)
    elif level == 2:
        style.font.size = Pt(14)
    else:
        style.font.size = Pt(12)

# Configure section margins for the first (front matter) section.
section = doc.sections[0]
set_section_margins(section)

# ======================================================================
# TITLE PAGE 1  --  English, no logos
# ======================================================================
add_centered(doc, 'UNIVERSITY "POLITEHNICA" OF BUCHAREST', size=12, bold=True)
add_centered(doc, "FACULTY OF ENGINEERING IN FOREIGN LANGUAGES", size=12, bold=True)
add_centered(doc, "COMPUTERS AND INFORMATION TECHNOLOGY - INFORMATION ENGINEERING",
             size=12, bold=True)
add_blank_lines(doc, 8)

add_centered(doc, "DIPLOMA PROJECT", size=28, bold=True)
add_blank_lines(doc, 8)

# Coordinator block left-aligned
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.LEFT
p.add_run("Project coordinator:\n").font.size = Pt(11)
p.add_run(COORDINATOR + "\n").font.size = Pt(11)

# Student block right-aligned
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
p.add_run("Student:\n").font.size = Pt(11)
p.add_run(STUDENT_NAME).font.size = Pt(11)

add_blank_lines(doc, 4)
add_centered(doc, "Bucharest", size=11)
add_centered(doc, YEAR, size=11)
page_break(doc)


# ======================================================================
# TITLE PAGE 2  --  English with logo placeholders
# ======================================================================
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("[Politehnica seal — left]    [FILS logo — right]")
run.italic = True
run.font.color.rgb = RGBColor(0x80, 0x80, 0x80)

add_centered(doc, 'UNIVERSITY "POLITEHNICA" OF BUCHAREST', size=12, bold=True)
add_centered(doc, "FACULTY OF ENGINEERING", size=12, bold=True)
add_centered(doc, "IN FOREIGN LANGUAGES", size=12, bold=True)
add_centered(doc, "COMPUTERS AND INFORMATION TECHNOLOGY", size=12, bold=True)
add_blank_lines(doc, 8)

add_centered(doc, TITLE_EN, size=24, bold=False)
add_blank_lines(doc, 14)

# Coordinator + Student two-column block (centered pair)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run("Project coordinator                    Student:\n").font.size = Pt(11)
p.add_run(f"{COORDINATOR}                {STUDENT_NAME}").font.size = Pt(11)

add_blank_lines(doc, 2)
add_centered(doc, "Bucharest", size=11)
add_centered(doc, YEAR, size=11)
page_break(doc)


# ======================================================================
# TITLE PAGE 3  --  Romanian with logo placeholders
# ======================================================================
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("[Politehnica seal — left]    [FILS logo — right]")
run.italic = True
run.font.color.rgb = RGBColor(0x80, 0x80, 0x80)

add_centered(doc, 'UNIVERSITY "POLITEHNICA" OF BUCHAREST', size=12, bold=True)
add_centered(doc, "FACULTY OF ENGINEERING", size=12, bold=True)
add_centered(doc, "IN FOREIGN LANGUAGES", size=12, bold=True)
add_centered(doc, "COMPUTERS AND INFORMATION TECHNOLOGY", size=12, bold=True)
add_blank_lines(doc, 8)

add_centered(doc, TITLE_RO, size=24)
add_blank_lines(doc, 14)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run("Project coordinator                    Student:\n").font.size = Pt(11)
p.add_run(f"{COORDINATOR}                {STUDENT_NAME}").font.size = Pt(11)

add_blank_lines(doc, 2)
add_centered(doc, "Bucharest", size=11)
add_centered(doc, YEAR, size=11)
page_break(doc)


# ======================================================================
# DIPLOMA PROJECT THEME FORM
# ======================================================================
add_centered(doc, '"POLITEHNICA" UNIVERSITY OF BUCHAREST', size=12, bold=True)
add_centered(doc, "FACULTY OF ENGINEERING IN FOREIGN LANGUAGES", size=12, bold=True)
add_centered(doc, "COMPUTERS AND INFORMATION TECHNOLOGY", size=12, bold=True)

# Approval block right
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
p.add_run("Approved\n").font.size = Pt(10)
p.add_run("Director of department:\n").font.size = Pt(10)
p.add_run(f"{DEPARTMENT_DIRECTOR}\n").font.size = Pt(10)
p.add_run("[Signature]").italic = True

add_blank_lines(doc, 2)
add_centered(doc, "DIPLOMA PROJECT THEME FOR:", size=14, bold=True)
add_centered(doc, STUDENT_NAME, size=14, bold=True)
add_blank_lines(doc, 1)

theme_fields = [
    ("1. Theme title:",
     [(TITLE_EN, True), (TITLE_RO, True)]),
    ("2. Initial design data:",
     [("The project consists of designing and implementing a web platform that combines "
       "music streaming with AI-assisted music creation. The application integrates an "
       "external Creative-Commons catalog (Jamendo), a personalized recommendation flow "
       "based on listening history, and a generation pipeline that uses Meta's MusicGen "
       "model together with a custom procedural fallback for users without premium access. "
       "Voice synthesis (gTTS) and cover-image generation (Pollinations.ai) extend the "
       "creation toolkit. The platform is delivered as a single web application with role-"
       "based access for visitors, authenticated users, and administrators.", True)]),
    ("3. Student contribution:",
     [("Bibliographical research", True),
      ("Project analysis", True),
      ("AI generation pipeline implementation", True),
      ("Web application development", True)]),
    ("4. Compulsory graphical material:",
     [("Block scheme, functioning diagram, graphs", True)]),
    ("5. The paper is based on the knowledge obtained at the following study courses:",
     [("Programming Languages, Databases, Object Oriented Programming, Software "
       "Development Methods, Web Applications Development, Artificial Intelligence", True)]),
    ("6. Paper development environment:",
     [("Visual Studio Code, DataGrip, Postman, Microsoft Word, draw.io, Canva, "
       "Visual Paradigm", True)]),
    ("7. The paper serves as:",
     [("Didactic purposes", True)]),
    ("8. Paper preparation date:",
     [(SUBMISSION_MONTH, True)]),
]

for label, items in theme_fields:
    p = doc.add_paragraph()
    run = p.add_run(label)
    run.bold = True
    run.font.size = Pt(11)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    for text, italic in items:
        para = doc.add_paragraph()
        para.paragraph_format.left_indent = Cm(1)
        run = para.add_run(text)
        run.italic = italic
        run.font.size = Pt(11)

add_blank_lines(doc, 2)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.LEFT
p.add_run("Project coordinator                                                          "
         "Student:\n").bold = True
p.add_run(f"{COORDINATOR}                                                            "
          f"{STUDENT_NAME}\n")
p.add_run("[Signature]").italic = True
p.add_run("                                                                                                         "
          "[Signature]").italic = True
page_break(doc)


# ======================================================================
# ACADEMIC HONESTY STATEMENT
# ======================================================================
add_centered(doc, "Academic Honesty Statement", size=18, bold=True)
add_blank_lines(doc, 2)

honesty_paragraphs = [
    f'I, {STUDENT_NAME}, hereby declare that the work with the title '
    f'"{TITLE_EN}", to be openly defended in front of the diploma theses '
    f'examination commission at the Faculty of Engineering in Foreign '
    f'Languages, University "Politehnica" of Bucharest, as partial requirement '
    f'for obtaining the title of Engineer is the result of my own work, based '
    f'on my work.',

    "The thesis, simulations, experiments and measurements that are presented "
    "are made entirely by me under the guidance of the scientific adviser, "
    "without the implication of persons that are not cited by name and "
    "contribution in the Acknowledgements part.",

    "The thesis has never been presented to a higher education institution or "
    "research board in the country or abroad.",

    "All the information used, including the Internet, is obtained from sources "
    "that were cited and indicated in the notes and in the bibliography, "
    "according to ethical standards. I understand that plagiarism is an offense "
    "and is punishable under law.",

    "The results from the simulations, experiments and measurements are "
    "genuine. I understand that the falsification of data and results "
    "constitutes fraud and is punished according to regulations.",
]
for para in honesty_paragraphs:
    add_para(doc, para, size=11, alignment=WD_ALIGN_PARAGRAPH.JUSTIFY,
             space_after=12)

add_blank_lines(doc, 4)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.LEFT
p.add_run(f"{STUDENT_NAME}                                                              "
          f"[Date]\n")
p.add_run("[Signature]").italic = True
page_break(doc)


# ======================================================================
# TABLE OF CONTENTS
# ======================================================================
add_centered(doc, "Table of Contents", size=18, bold=True)
add_blank_lines(doc, 1)
toc_para = doc.add_paragraph()
add_toc_field(toc_para)
page_break(doc)


# ======================================================================
# TABLE OF FIGURES
# ======================================================================
add_centered(doc, "Table of Figures", size=18, bold=True)
add_blank_lines(doc, 1)
tof_para = doc.add_paragraph()
add_tof_field(tof_para)
page_break(doc)


# ======================================================================
# BODY  --  new section so we can attach a page header + page numbering
# ======================================================================
new_section = doc.add_section(WD_SECTION_START.NEW_PAGE)
new_section.different_first_page_header_footer = False
set_section_margins(new_section)

# Detach from the front-matter section so it has its own header/footer.
new_section.header.is_linked_to_previous = False
new_section.footer.is_linked_to_previous = False

# Page header text
header = new_section.header
header_para = header.paragraphs[0]
header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
header_run = header_para.add_run(HEADER_TEXT)
header_run.font.size = Pt(10)
# Add a separator rule via bottom border on the header paragraph
pPr = header_para._p.get_or_add_pPr()
pBdr = OxmlElement("w:pBdr")
bottom = OxmlElement("w:bottom")
bottom.set(qn("w:val"), "single")
bottom.set(qn("w:sz"), "6")
bottom.set(qn("w:space"), "1")
bottom.set(qn("w:color"), "auto")
pBdr.append(bottom)
pPr.append(pBdr)

# Footer with arabic page number, centered
footer = new_section.footer
footer_para = footer.paragraphs[0]
footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
add_page_number_field(footer_para)


# ======================================================================
# CHAPTER 1  --  INTRODUCTION  (full prose, humanizer-audited)
# ======================================================================
add_heading_styled(doc, "1 Introduction", level=1)

add_heading_styled(doc, "1.1 Music everywhere", level=2)
add_para(doc,
    "Music is one of the most consumed forms of media. Major streaming "
    "platforms report large amounts of daily user activity, with Spotify "
    "reporting over 600 million monthly active users in early 2024.",
)
add_todo(doc, "cite the specific Spotify quarterly investor report — see references")
add_para(doc,
    "The catalog grows constantly. New tracks reach streaming services every "
    "day, and any user with a laptop and free recording software can publish "
    "music that previously required a record label or studio access.",
)
add_para(doc,
    "This widespread access produced two parallel changes. On one side, "
    "listeners face an overwhelming amount of choice and rely on platforms to "
    "surface what they will enjoy. On the other side, creators compete for "
    "attention in a catalog that grows constantly, and increasingly use AI "
    "tools to produce, mix, or arrange tracks faster than traditional "
    "production allows.",
)
add_para(doc,
    "Most existing products focus on only one of these two sides. Spotify and "
    "Apple Music are built for listening and do not offer creation tools "
    "inside the app. Suno and Udio generate music from text prompts but do "
    "not provide a streaming catalog or a social layer. Listening and "
    "creating are treated as separate categories, even though many users now "
    "move between the two activities daily.",
)
add_para(doc,
    "This paper presents Pulsefy, a web application that brings both "
    "activities into one product. The application lets users browse a real "
    "music catalog provided by the Jamendo Creative Commons API, build "
    "playlists, follow other users, and play tracks through a global player. "
    "At the same time, the same account can generate short original tracks "
    "through an integrated AI generator built on Meta's MusicGen model and a "
    "custom procedural fallback. The two flows share the same library and "
    "the same interface.",
)
add_figure_placeholder(doc, 1, "Listening and creation flows in Pulsefy")

add_heading_styled(doc, "1.2 Motives for using an AI music platform", level=2)
add_para(doc,
    "Listeners want both more relevant content and more variety from the "
    "platforms they use. Recommendation features have become a primary "
    "reason users stay subscribed to a service rather than rotate between "
    "platforms or return to manually curated playlists.",
)
add_todo(doc, "cite a Spotify or Apple Music engagement report supporting this")
add_para(doc,
    "Creators have a different motivation. The cost of producing a single "
    "original track, even a short one, is high in time and skill. A creator "
    "without piano training cannot quickly sketch a melody. A creator "
    "without a vocalist cannot demo a vocal idea. AI tools lower the entry "
    "barrier in both cases: a text prompt can return an instrumental sketch "
    "in under a minute on a typical CPU, and a voice synthesis model can "
    "read a draft lyric in any of several supported languages.",
)
add_para(doc,
    "Combining both functions in a single product has its own motivation. "
    "Users who discover music tend to also have ideas they want to test. "
    "Users who create tracks need a place where their work can be heard and "
    "where they can listen to references. Splitting the two activities "
    "across separate apps adds friction to a workflow where, for many users, "
    "listening and creating are part of the same creative session.",
)
add_para(doc,
    "Pulsefy targets this combined motivation. The application accepts both "
    "kinds of users with no separate account types and no different home "
    "screen, and tries to make the transition between listening and "
    "creating as low-friction as possible.",
)

add_heading_styled(doc, "1.3 Advantages of AI-assisted music discovery and creation",
                   level=2)
add_para(doc,
    "AI-assisted music platforms offer concrete advantages for both "
    "listeners and creators. The first advantage is personalization at "
    "scale. A platform with millions of tracks cannot be browsed manually "
    "by any single user, and traditional editorial curation reaches only a "
    "small fraction of the catalog. Recommendation algorithms read each "
    "user's listening history and surface tracks that the user has not yet "
    "played but is likely to enjoy.",
)
add_para(doc,
    "Another advantage is reduced production cost for creators. A short "
    "instrumental sketch generated by MusicGen costs no studio time and "
    "almost no money, since the inference can be run on a CPU. For a "
    "student or hobbyist creator, this lowers the entry threshold for "
    "making music significantly. The same applies to text-to-speech: a "
    "vocal demo using a synthetic voice costs nothing and can be "
    "regenerated in different languages.",
)
add_para(doc,
    "A third advantage is faster iteration. Both for listeners and "
    "creators, the time between an idea and its evaluation drops. A "
    "listener no longer needs a weekly editorial drop to discover new "
    "music; the recommendations refresh on demand. A creator no longer "
    "needs to wait for a session musician or learn an instrument to test a "
    "track idea; the prompt can be tried, adjusted, and tried again in the "
    "same session.",
)
add_para(doc,
    "Combined together, these advantages support a continuous workflow "
    "rather than a series of separate steps. The user opens the "
    "application, browses for inspiration, follows a recommendation that "
    "triggers a creative idea, generates a draft based on that idea, plays "
    "the draft alongside the source track, and refines the prompt. None of "
    "these steps require switching applications or context.",
)
add_para(doc,
    "The trade-off, which Pulsefy acknowledges and partially addresses, is "
    "that AI-generated music remains lower in quality than studio-produced "
    "content, and that recommendation systems can amplify content the user "
    "already likes rather than expanding their taste. Both limits are real "
    "and discussed in the validation chapter.",
)
add_figure_placeholder(doc, 2,
    "Manual versus AI-assisted music discovery and creation timelines")

add_heading_styled(doc, "1.4 Structure of the paper", level=2)
add_para(doc,
    "The aim of this paper is to present Pulsefy, a web application for "
    "AI-assisted music discovery and creation, and to document the design, "
    "implementation, and validation of its components.",
)
add_para(doc,
    "The paper is organized in six chapters, plus the conclusions and "
    "supporting back matter:",
)
chapters_list = [
    "Chapter 1 introduces the motivation behind the project and the context in which it sits.",
    "Chapter 2 reviews scientific work on music information retrieval and generative audio models, "
        "and compares four commercial products with a similar focus.",
    "Chapter 3 specifies the functional and non-functional requirements of the application.",
    "Chapter 4 describes the architectural and detailed design, including class diagrams, sequence "
        "diagrams, and database structure.",
    "Chapter 5 documents the implementation, including the technologies used, the AI generation "
        "pipeline, and a walkthrough of the web interface.",
    "Chapter 6 presents the validation methodology and results.",
]
for item in chapters_list:
    p = doc.add_paragraph(item, style="List Bullet")
add_para(doc,
    "The diagrams in this paper were created using draw.io "
    "(https://www.diagrams.net/) and Visual Paradigm "
    "(https://www.visual-paradigm.com/). The decorative figures were created "
    "using Canva (https://www.canva.com/). The application source code was "
    "written using Visual Studio Code, and the database scripts in DataGrip.",
)
page_break(doc)


# ======================================================================
# CHAPTER 2  --  STATE OF THE ART  (skeleton)
# ======================================================================
add_heading_styled(doc, "2 State of the art", level=1)
add_todo(doc, "intro paragraph framing scientific vs commercial split")

add_heading_styled(doc, "2.1 Scientific state of the art", level=2)
add_todo(doc, "intro paragraph anchoring the project's two ML domains")

add_heading_styled(doc, "2.1.1 Music information retrieval", level=3)
add_todo(doc, "prose: definition, audio embeddings, classification, retrieval. "
         "Cite Lerch MIR textbook + survey papers.")
add_figure_placeholder(doc, 3, "Existing music information retrieval methods")

add_heading_styled(doc, "2.1.2 Generative audio models", level=3)
add_todo(doc, "prose: MusicGen, AudioLDM, transformer-based audio generation. "
         "Cite Copet et al. 2023 MusicGen paper.")

add_heading_styled(doc, "2.2 Commercial state of the art", level=2)
add_todo(doc, "Open with concrete industry case-study hook plus bulleted result stats. "
         "Then bulleted list of the four tools to be analyzed.")

add_heading_styled(doc, "2.2.1 Spotify", level=3)
add_todo(doc, "identity sentence; recommendation workflow; quantitative outcomes; API/pricing")
add_figure_placeholder(doc, 4, "Spotify recommendation workflow")

add_heading_styled(doc, "2.2.2 Suno", level=3)
add_todo(doc, "identity sentence; generation workflow; quantitative outcomes; API/pricing")
add_figure_placeholder(doc, 5, "Suno music generation flow")

add_heading_styled(doc, "2.2.3 ElevenLabs", level=3)
add_todo(doc, "identity sentence; voice and music API workflow; outcomes; pricing")
add_figure_placeholder(doc, 6, "ElevenLabs voice and music model overview")

add_heading_styled(doc, "2.2.4 Splice", level=3)
add_todo(doc, "identity sentence; sample/AI workflow; outcomes; pricing")
add_figure_placeholder(doc, 7, "Splice sample search and SongStarter workflow")

add_heading_styled(doc, "2.3 Summary and comparison of existing approaches", level=2)
add_todo(doc, "summary prose pointing at the comparison table")
add_table_placeholder(doc, 1, "Comparison of commercial AI music platforms")
page_break(doc)


# ======================================================================
# CHAPTER 3  --  REQUIREMENTS ANALYSIS  (skeleton with UC scaffolding)
# ======================================================================
add_heading_styled(doc, "3 Requirements analysis", level=1)

add_heading_styled(doc, "3.1 Functional requirements", level=2)

add_heading_styled(doc, "3.1.1 Actors and agents", level=3)
add_todo(doc, "two short prose paragraphs: Visitor + Authenticated User as actors; "
         "Administrator as agent. Premium tier handled as precondition.")

add_heading_styled(doc, "3.1.2 Software use case diagram", level=3)
add_figure_placeholder(doc, 8, "Software use case diagram")

add_heading_styled(doc, "3.1.3 Use case functional requirements", level=3)
add_todo(doc, "list every UC as 3.1.3.X with lettered system-does-X bullet list. "
         "If using priority weights, add explanatory paragraph at the start.")

add_heading_styled(doc, "3.1.4 Use case descriptions and system sequence diagrams", level=3)
ucs = [
    ("UC1 Register", "Visitor", "The visitor accesses the registration form.",
     "The user account is created and the visitor is logged in."),
    ("UC2 Log in", "Visitor", "The user has a registered account.",
     "The user is logged in and the home page is displayed."),
    ("UC3 Browse catalog", "Authenticated User", "The user is logged in.",
     "The user sees a paginated list of catalog tracks."),
    ("UC4 Play track", "Authenticated User", "The user has selected a track.",
     "The track is playing and a listening event is recorded."),
    ("UC5 Refresh recommendations", "Authenticated User", "The user is logged in.",
     "A new set of personalized recommendations is displayed."),
    ("UC6 Generate AI music", "Authenticated User",
     "The user is logged in and has typed a prompt.",
     "The track is generated and added to the user's library."),
    ("UC7 Upload video and overlay audio", "Authenticated User",
     "The user has a video file and an audio source.",
     "The processed video is stored and a download link is shown."),
    ("UC8 Follow user", "Authenticated User",
     "The user is viewing another user's profile.",
     "The follow relationship is created."),
    ("UC9 Update profile", "Authenticated User", "The user is logged in.",
     "The user's profile is updated."),
    ("UC10 Manage subscription tier", "Authenticated User", "The user is logged in.",
     "The user's subscription tier is updated and persisted."),
    ("UC11 Manage users and catalog", "Administrator",
     "The administrator is logged in.",
     "The catalog or user roster is updated."),
]
for i, (uc_name, actor, pre, post) in enumerate(ucs, start=1):
    add_heading_styled(doc, f"3.1.4.{i} {uc_name}", level=3)
    add_uc_table(
        doc,
        name=uc_name,
        scope="System",
        actor=actor,
        preconditions=pre,
        postconditions=post,
        main_steps=None,
        extension=None,
        table_number=i + 1,  # Table 1 was the comparison table
    )
    add_todo(doc, f"fill in main success scenario steps; add Extension row if alt flow exists")
    add_figure_placeholder(doc, 8 + i, f"{uc_name} system sequence diagram")

add_heading_styled(doc, "3.1.5 Activity diagrams", level=3)
add_todo(doc, "build activity diagrams for the 2-3 most branching use cases")
add_figure_placeholder(doc, 20, "Generate AI music activity diagram")
add_figure_placeholder(doc, 21, "Upload video and overlay audio activity diagram")

add_heading_styled(doc, "3.1.6 Operation contracts", level=3)
add_todo(doc, "3-4 contract tables for: GenerateTrack, OverlayAudioOnVideo, "
         "FetchRecommendations, ChargeSubscription. Same field labels as IARCA.")

add_heading_styled(doc, "3.2 Non-functional requirements", level=2)
nfr_list = ["Performance", "Security", "Usability", "Reliability",
            "Scalability", "Maintainability", "Portability"]
for nfr in nfr_list:
    add_heading_styled(doc, f"3.2.{nfr_list.index(nfr) + 1} {nfr}", level=3)
    add_todo(doc, f"2-4 sentences defending the {nfr.lower()} target")
page_break(doc)


# ======================================================================
# CHAPTER 4  --  DESIGN  (skeleton)
# ======================================================================
add_heading_styled(doc, "4 Design", level=1)

add_heading_styled(doc, "4.1 Architecture", level=2)
add_heading_styled(doc, "4.1.1 Architecture choice", level=3)
add_todo(doc, "3 short paragraphs: definition of client-server with separate Python "
         "ML services, drawback, then 'fits because…' rationale.")
add_figure_placeholder(doc, 22, "Pulsefy architecture block diagram")

add_heading_styled(doc, "4.1.2 Package diagrams", level=3)
add_figure_placeholder(doc, 23, "pulsefy.server package diagram")
add_figure_placeholder(doc, 24, "pulsefy.client package diagram")

add_heading_styled(doc, "4.1.3 Deployment", level=3)
add_todo(doc, "describe local dev deployment (Vite :8080, Node :4000, Postgres). "
         "Cloud target if planned.")
add_figure_placeholder(doc, 25, "Deployment configuration screenshot")

add_heading_styled(doc, "4.2 Detailed design", level=2)
add_heading_styled(doc, "4.2.1 Design class diagrams and design sequence diagrams", level=3)
fig_idx = 26
for i, (uc_name, *_) in enumerate(ucs, start=1):
    add_heading_styled(doc, f"4.2.1.{i} {uc_name}", level=3)
    add_figure_placeholder(doc, fig_idx,
                           f"{uc_name} design class diagram")
    fig_idx += 1
    add_figure_placeholder(doc, fig_idx,
                           f"{uc_name} design sequence diagram")
    fig_idx += 1

add_heading_styled(doc, "4.2.2 Database structure", level=3)
add_todo(doc, "open with the IARCA-style 'three points of view' framing")
add_figure_placeholder(doc, fig_idx, "Pulsefy AI subsystem ERD")
fig_idx += 1
add_figure_placeholder(doc, fig_idx, "Pulsefy web app ERD at deployment")
fig_idx += 1
add_figure_placeholder(doc, fig_idx, "Pulsefy web app ERD at runtime with example rows")
fig_idx += 1
page_break(doc)


# ======================================================================
# CHAPTER 5  --  IMPLEMENTATION  (skeleton)
# ======================================================================
add_heading_styled(doc, "5 Implementation", level=1)

add_heading_styled(doc, "5.1 Technologies", level=2)
add_heading_styled(doc, "5.1.1 Development", level=3)
add_todo(doc, "three running paragraphs: front-end stack, back-end stack, AI/ML services")
add_figure_placeholder(doc, fig_idx, "Technologies used (logo ribbon)")
fig_idx += 1

add_heading_styled(doc, "5.1.2 External services", level=3)
add_todo(doc, "Pollinations.ai, Jamendo Catalog API, Hugging Face MusicGen — "
         "describe endpoints, quotas, retry strategy")

add_heading_styled(doc, "5.2 AI generation pipeline", level=2)
add_todo(doc, "intro sentence + 4-column matrix table of phase functions")
add_table_placeholder(doc, 2, "AI generation pipeline functions per phase")

add_heading_styled(doc, "5.2.1 Prompt preparation phase", level=3)
add_todo(doc, "structure of the prompt object; tier branch; pseudocode block")
add_figure_placeholder(doc, fig_idx, "Pseudocode: prompt preparation phase")
fig_idx += 1

add_heading_styled(doc, "5.2.2 Conditioning phase", level=3)
add_todo(doc, "tokenization, model conditioning, env var bullet list")
add_figure_placeholder(doc, fig_idx, "App settings structure (.env example)")
fig_idx += 1

add_heading_styled(doc, "5.2.3 Generation phase", level=3)
add_todo(doc, "Python subprocess spawn, stream loop, retry path, pseudocode")
add_figure_placeholder(doc, fig_idx, "JSON example of an ai_generations row")
fig_idx += 1

add_heading_styled(doc, "5.2.4 Post-processing phase", level=3)
add_todo(doc, "loudness normalization (or note that it isn't implemented), "
         "metadata attachment, side-effect tasks")

add_heading_styled(doc, "5.3 Web application walkthrough", level=2)

add_heading_styled(doc, "5.3.1 Walkthrough for listeners", level=3)
listener_flows = [
    "Login and signup popups",
    "Home and discovery feed",
    "Browse catalog with search and filters",
    "Track player and queue",
    "Playlist creation",
    "Follow user",
    "Export listening history",
]
for flow in listener_flows:
    add_figure_placeholder(doc, fig_idx, f"Pulsefy – {flow}")
    fig_idx += 1
    add_todo(doc, f"3 paragraphs describing the {flow.lower()} flow")

add_heading_styled(doc, "5.3.2 Walkthrough for creators", level=3)
creator_flows = [
    "Generate AI track (Pulsefy AI vs MusicGen selector)",
    "Generate voiceover",
    "Upload video and overlay audio",
    "Track publish and cover art generation",
]
for flow in creator_flows:
    add_figure_placeholder(doc, fig_idx, f"Pulsefy – {flow}")
    fig_idx += 1
    add_todo(doc, f"3 paragraphs describing the {flow.lower()} flow")

add_heading_styled(doc, "5.3.3 Walkthrough for administrators", level=3)
admin_flows = [
    "User management",
    "Subscription tier moderation",
    "Catalog moderation",
]
for flow in admin_flows:
    add_figure_placeholder(doc, fig_idx, f"Pulsefy – {flow}")
    fig_idx += 1
    add_todo(doc, f"2 paragraphs describing the {flow.lower()} flow")
page_break(doc)


# ======================================================================
# CHAPTER 6  --  VALIDATION
# ======================================================================
add_heading_styled(doc, "6 Validation", level=1)
add_todo(doc,
    "one-page validation chapter combining: latency benchmarks (real measurements), "
    "small N=15 listening study (real measurements), system capacity metrics. "
    "DO NOT INVENT NUMBERS. Each metric needs a documented formula or measurement protocol.")
add_figure_placeholder(doc, fig_idx, "Pulsefy validation summary infographic")
fig_idx += 1
page_break(doc)


# ======================================================================
# CONCLUSIONS
# ======================================================================
add_heading_styled(doc, "Conclusions", level=1)
add_todo(doc,
    "five-block structure: (1) recap thesis claim, (2) bullet list of design "
    "constraints, (3) one personal first-person sentence, (4) limitations + "
    "future work, (5) short generic outro.")
page_break(doc)


# ======================================================================
# REFERENCES
# ======================================================================
add_heading_styled(doc, "References", level=1)
add_todo(doc, "25-35 numbered [N] entries with hanging indent. "
         "APA-hybrid format: [N] Author(s). (Year, Month Day). Title. Source. URL.")
page_break(doc)


# ======================================================================
# GLOSSARY
# ======================================================================
add_heading_styled(doc, "Glossary", level=1)
add_todo(doc, "two-column term/definition table with 35-45 abbreviation expansions")


# ======================================================================
# save
# ======================================================================
doc.save(OUTPUT_PATH)
print(f"Saved: {OUTPUT_PATH}")
