from PIL import Image, ImageDraw, ImageFont
import imageio.v2 as imageio
import numpy as np
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO_DIR = os.path.join(ROOT, "public", "videos")
IMAGE_DIR = os.path.join(ROOT, "public", "images")
os.makedirs(VIDEO_DIR, exist_ok=True)
os.makedirs(IMAGE_DIR, exist_ok=True)

VIDEO_PATH = os.path.join(VIDEO_DIR, "conceptkid-demo.mp4")
POSTER_PATH = os.path.join(IMAGE_DIR, "conceptkid-demo-poster.png")

W, H = 1280, 720
FPS = 12


def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


FONT_H1 = font(58, True)
FONT_H2 = font(38, True)
FONT_H3 = font(28, True)
FONT_BODY = font(26)
FONT_SMALL = font(20)

PURPLE = (128, 28, 245)
BLUE = (36, 92, 255)
DARK = (18, 24, 38)
MUTED = (86, 101, 125)
BG = (248, 245, 255)
CARD = (255, 255, 255)
SOFT = (242, 236, 255)
GREEN = (24, 166, 94)
AMBER = (224, 146, 12)
RED = (214, 70, 70)


def rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_text_box(draw, text, xy, max_width, fnt, fill=DARK, line_spacing=8):
    x, y = xy
    lines = []
    for paragraph in text.split("\n"):
        line = ""
        for word in paragraph.split():
            test = (line + " " + word).strip()
            bbox = draw.textbbox((0, 0), test, font=fnt)
            if bbox[2] - bbox[0] <= max_width:
                line = test
            else:
                if line:
                    lines.append(line)
                line = word
        if line:
            lines.append(line)
    cur = y
    for line in lines:
        draw.text((x, cur), line, font=fnt, fill=fill)
        cur += fnt.size + line_spacing
    return cur


def gradient_rect(img, xy, c1, c2, radius=28):
    x1, y1, x2, y2 = xy
    w, h = x2 - x1, y2 - y1
    grad = Image.new("RGB", (w, h), c1)
    pix = grad.load()
    for x in range(w):
        t = x / max(1, w - 1)
        col = tuple(int(c1[i] * (1 - t) + c2[i] * t) for i in range(3))
        for y in range(h):
            pix[x, y] = col
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
    img.paste(grad, (x1, y1), mask)


def draw_header(draw):
    rounded_rect(draw, (70, 48, 1210, 108), 26, CARD)
    draw.text((104, 65), "ConceptKid", font=FONT_H3, fill=PURPLE)
    draw.text((940, 66), "Parent Login", font=FONT_SMALL, fill=DARK)
    rounded_rect(draw, (1055, 58, 1175, 98), 20, PURPLE)
    draw.text((1075, 68), "Register", font=FONT_SMALL, fill=(255, 255, 255))


def base_frame():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw_header(draw)
    return img, draw


def draw_progress(draw, idx, total):
    x, y, w, h = 160, 665, 960, 8
    rounded_rect(draw, (x, y, x + w, y + h), 4, (226, 221, 238))
    rounded_rect(draw, (x, y, x + int(w * idx / total), y + h), 4, PURPLE)


def slide_1(_):
    img, draw = base_frame()
    rounded_rect(draw, (90, 145, 650, 610), 36, CARD)
    draw.text((125, 205), "See How", font=FONT_H1, fill=DARK)
    draw.text((125, 275), "ConceptKid", font=FONT_H1, fill=PURPLE)
    draw.text((125, 345), "Teaches Your Child", font=FONT_H1, fill=DARK)
    draw_text_box(draw, "Grade-wise visual learning, textbook-based teaching, strict CBSE-style evaluation, and parent progress tracking.", (125, 440), 480, FONT_BODY, MUTED)
    rounded_rect(draw, (125, 530, 345, 584), 24, PURPLE)
    draw.text((156, 545), "Register for Access", font=FONT_SMALL, fill=(255, 255, 255))
    gradient_rect(img, (700, 145, 1190, 610), (12, 18, 38), (106, 34, 240), 36)
    draw = ImageDraw.Draw(img)
    draw.text((755, 210), "Parent-safe preview", font=FONT_SMALL, fill=(220, 210, 255))
    draw.text((755, 250), "No uploads. No saved progress.", font=FONT_H2, fill=(255, 255, 255))
    for i, item in enumerate(["Child-specific after registration", "Textbook-grounded after upload", "95% mastery target"]):
        y = 340 + i * 82
        rounded_rect(draw, (750, y, 1145, y + 58), 18, (31, 38, 58))
        draw.text((778, y + 16), "✓", font=FONT_H3, fill=(100, 255, 180))
        draw.text((820, y + 18), item, font=FONT_SMALL, fill=(255, 255, 255))
    return img


def slide_2(_):
    img, draw = base_frame()
    draw.text((90, 145), "From registration to mastery", font=FONT_H1, fill=DARK)
    steps = [
        ("1", "Parent registers child", "Grade, board, subjects and books"),
        ("2", "App checks level", "Diagnostic shows strengths and weak areas"),
        ("3", "Student learns visually", "Real-life examples and simple steps"),
        ("4", "Practice and quiz", "Short questions after every topic"),
        ("5", "Chapter exam", "CBSE-style test checks mastery"),
        ("6", "Parent tracks progress", "Clear next action and weak-area plan"),
    ]
    for i, (num, title, desc) in enumerate(steps):
        x = 90 + (i % 3) * 390
        y = 245 + (i // 3) * 175
        rounded_rect(draw, (x, y, x + 350, y + 125), 24, CARD)
        rounded_rect(draw, (x + 22, y + 22, x + 62, y + 62), 20, SOFT)
        draw.text((x + 35, y + 29), num, font=FONT_SMALL, fill=PURPLE)
        draw.text((x + 82, y + 24), title, font=FONT_H3, fill=DARK)
        draw_text_box(draw, desc, (x + 82, y + 64), 235, FONT_SMALL, MUTED, 5)
    return img


def slide_3(_):
    img, draw = base_frame()
    draw.text((90, 145), "Sample Class 2 Visual Lesson", font=FONT_H1, fill=DARK)
    draw.text((90, 210), "EVS: Animals Around Us", font=FONT_H2, fill=PURPLE)
    rounded_rect(draw, (90, 280, 600, 595), 30, CARD)
    draw.text((130, 320), "Simple explanation", font=FONT_H3, fill=DARK)
    draw_text_box(draw, "Animals live in different places. A cow lives on a farm, a fish lives in water, and a bird lives in a nest.", (130, 370), 420, FONT_BODY, MUTED)
    rounded_rect(draw, (670, 280, 1190, 595), 30, CARD)
    draw.text((710, 320), "Visual memory card", font=FONT_H3, fill=DARK)
    for i, (a, b) in enumerate([("Cow", "Farm"), ("Fish", "Water"), ("Bird", "Nest")]):
        y = 385 + i * 55
        rounded_rect(draw, (720, y, 875, y + 40), 18, SOFT)
        rounded_rect(draw, (940, y, 1100, y + 40), 18, (232, 248, 238))
        draw.text((748, y + 9), a, font=FONT_SMALL, fill=DARK)
        draw.text((890, y + 9), "->", font=FONT_SMALL, fill=PURPLE)
        draw.text((975, y + 9), b, font=FONT_SMALL, fill=GREEN)
    draw.text((720, 552), "Animal + Home = Easy to remember", font=FONT_SMALL, fill=AMBER)
    return img


def slide_4(_):
    img, draw = base_frame()
    draw.text((90, 145), "Practice happens immediately", font=FONT_H1, fill=DARK)
    for i, (q, a) in enumerate([("Where does a fish live?", "In water"), ("Which animal gives us milk?", "Cow"), ("Where does a bird live?", "In a nest")]):
        y = 240 + i * 125
        rounded_rect(draw, (140, y, 1140, y + 92), 24, CARD)
        draw.text((175, y + 18), f"Practice {i + 1}", font=FONT_SMALL, fill=PURPLE)
        draw.text((315, y + 18), q, font=FONT_H3, fill=DARK)
        rounded_rect(draw, (880, y + 22, 1085, y + 66), 20, (233, 248, 240))
        draw.text((910, y + 33), f"Answer: {a}", font=FONT_SMALL, fill=GREEN)
    rounded_rect(draw, (140, 610, 1140, 655), 22, (232, 248, 238))
    draw.text((165, 622), "Registered users get saved scores, weak-area detection and retest plans.", font=FONT_SMALL, fill=GREEN)
    return img


def slide_5(_):
    img, draw = base_frame()
    draw.text((90, 145), "Chapter exam checks real mastery", font=FONT_H1, fill=DARK)
    rounded_rect(draw, (90, 225, 1190, 575), 30, CARD)
    exam = [
        ("MCQ", "Where does a fish live?  A) Tree  B) Water  C) Farm"),
        ("Short Answer", "Write two animals that live on a farm."),
        ("Competency", "Ravi saw a bird collecting grass. Why is the bird doing this?"),
    ]
    for i, (label, q) in enumerate(exam):
        y = 265 + i * 90
        rounded_rect(draw, (130, y, 1080, y + 62), 18, (249, 249, 252))
        draw.text((155, y + 18), label, font=FONT_SMALL, fill=PURPLE)
        draw.text((310, y + 18), q, font=FONT_SMALL, fill=DARK)
    draw.text((130, 525), "Target mastery: 95% before moving to the next chapter.", font=FONT_H3, fill=GREEN)
    return img


def slide_6(_):
    img, draw = base_frame()
    draw.text((90, 145), "If score is low, we strengthen weak areas", font=FONT_H1, fill=DARK)
    rounded_rect(draw, (90, 240, 575, 585), 30, CARD)
    draw.text((130, 280), "Weak area found", font=FONT_H2, fill=RED)
    draw.text((130, 335), "Animal homes", font=FONT_H3, fill=DARK)
    draw_text_box(draw, "The student confused where animals live. The app gives visual revision before retest.", (130, 385), 380, FONT_BODY, MUTED)
    rounded_rect(draw, (650, 240, 1190, 585), 30, CARD)
    draw.text((690, 280), "Revision plan", font=FONT_H2, fill=PURPLE)
    for i, p in enumerate(["Watch visual lesson again", "Practice 5 focused questions", "Take mini quiz", "Retry chapter exam"]):
        y = 345 + i * 48
        draw.text((710, y), "✓", font=FONT_H3, fill=GREEN)
        draw.text((755, y + 5), p, font=FONT_BODY, fill=DARK)
    return img


def slide_7(_):
    img, draw = base_frame()
    draw.text((90, 145), "Works with your child's actual school books", font=FONT_H1, fill=DARK)
    draw_text_box(draw, "If an official source is available, ConceptKid can try to import it. For private publisher or school-provided books, the parent uploads PDF, scanned pages, or chapter photos.", (90, 220), 760, FONT_BODY, MUTED)
    cards = [
        ("NCERT Official", "Official import can be attempted", GREEN),
        ("State Board Official", "Official source link required", BLUE),
        ("Private Publisher", "Parent upload required", AMBER),
        ("School Worksheet", "Parent upload required", PURPLE),
    ]
    for i, (title, status, color) in enumerate(cards):
        x = 90 + (i % 2) * 570
        y = 350 + (i // 2) * 120
        rounded_rect(draw, (x, y, x + 510, y + 85), 22, CARD)
        draw.text((x + 28, y + 20), title, font=FONT_H3, fill=DARK)
        draw.text((x + 28, y + 54), status, font=FONT_SMALL, fill=color)
    return img


def slide_8(_):
    img, draw = base_frame()
    draw.text((90, 145), "Parent knows what to do today", font=FONT_H1, fill=DARK)
    rounded_rect(draw, (90, 240, 1190, 590), 30, CARD)
    columns = [
        ("Today's Plan", ["10 min visual lesson", "5 practice questions", "1 homework check"]),
        ("Progress", ["EVS 70%", "Maths 60%", "English 75%"]),
        ("Next Action", ["Practice 10 questions", "Retake quiz", "Target: 95% mastery"]),
    ]
    for i, (title, items) in enumerate(columns):
        x = 130 + i * 345
        rounded_rect(draw, (x, 300, x + 300, 490), 24, (249, 249, 252))
        draw.text((x + 24, 325), title, font=FONT_H3, fill=PURPLE if i != 2 else AMBER)
        for j, it in enumerate(items):
            draw.text((x + 32, 380 + j * 42), "*", font=FONT_H3, fill=GREEN)
            draw.text((x + 58, 386 + j * 42), it, font=FONT_SMALL, fill=DARK)
    rounded_rect(draw, (130, 530, 1125, 565), 18, PURPLE)
    draw.text((160, 539), "Start with your child's grade and textbooks at conceptkid.in", font=FONT_SMALL, fill=(255, 255, 255))
    return img


slides = [slide_1, slide_2, slide_3, slide_4, slide_5, slide_6, slide_7, slide_8]
durations = [7, 7, 8, 7, 8, 7, 7, 7]

poster = slide_1(0)
poster.save(POSTER_PATH)

writer = imageio.get_writer(VIDEO_PATH, fps=FPS, codec="libx264", quality=7, macro_block_size=16)
for slide_index, (fn, duration) in enumerate(zip(slides, durations), start=1):
    frames = int(duration * FPS)
    for f in range(frames):
        img = fn(f / frames).convert("RGB")
        draw = ImageDraw.Draw(img)
        draw_progress(draw, slide_index, len(slides))
        fade_len = int(0.5 * FPS)
        alpha = 1.0
        if f < fade_len:
            alpha = f / fade_len
        elif frames - f < fade_len:
            alpha = (frames - f) / fade_len
        if alpha < 1:
            img = Image.blend(Image.new("RGB", (W, H), BG), img, alpha)
        writer.append_data(np.array(img))
writer.close()

print(VIDEO_PATH)
print(POSTER_PATH)
