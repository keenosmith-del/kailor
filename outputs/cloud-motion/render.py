from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import subprocess, math, json

ROOT = Path(__file__).resolve().parent
W, H, FPS, N, S = 1920, 1080, 24, 238, 3
BG, PRIMARY, SECONDARY = (26,26,26), (244,244,244), (189,189,189)
FONT = '/System/Library/Fonts/HelveticaNeue.ttc'
WORDS = ['clarity.', 'growth.', 'momentum.', 'automation.', 'scale.', 'change.']
# Common baseline and optical left edge, independent of word length.
X, PREFIX_BASELINE, WORD_BASELINE = 478, 464, 674
prefix_font = ImageFont.truetype(FONT, 110*S, index=7)
word_font = ImageFont.truetype(FONT, 184*S, index=7)
base_hi = Image.new('RGB', (W*S,H*S), BG)
ImageDraw.Draw(base_hi).text((X*S,PREFIX_BASELINE*S), 'Built for', font=prefix_font, fill=SECONDARY, anchor='ls')
base = base_hi.resize((W,H), Image.Resampling.LANCZOS)
# Local masks keep the uniform background entirely untouched outside the type.
MASK_W, MASK_H, MASK_TOP = 1100, 300, 458
masks = []
for word in WORDS:
    mask = Image.new('L',(MASK_W*S,MASK_H*S),0)
    ImageDraw.Draw(mask).text((0,(WORD_BASELINE-MASK_TOP)*S),word,font=word_font,fill=255,anchor='ls')
    masks.append(mask)

def smooth(t):
    return t*t*t*(10+t*(-15+6*t))

def pose(i):
    # Six equal conceptual intervals distributed across an integer frame count.
    segment = min(5, int(i*6/N))
    end = round((segment+1)*N/6)
    transition_start = end-9
    if i < transition_start:
        return segment, 1., 0., 0.
    u = (i-transition_start)/8
    if u < .5:
        p = smooth(u*2)
        return segment, 1-p, -14*p, .65*math.sin(math.pi*p)
    p = smooth((u-.5)*2)
    return (segment+1)%6, p, 14*(1-p), .65*math.sin(math.pi*p)

def frame(i):
    word, opacity, dy, blur = pose(i)
    mask = masks[word]
    if blur > .01:
        mask = mask.filter(ImageFilter.GaussianBlur(blur*S))
    mask = mask.transform(mask.size,Image.Transform.AFFINE,(1,0,0,0,1,-dy*S),resample=Image.Resampling.BICUBIC)
    mask = mask.resize((MASK_W,MASK_H),Image.Resampling.LANCZOS)
    if opacity < 1:
        mask = mask.point(lambda v: round(v*opacity))
    img = base.copy()
    img.paste(PRIMARY,(X,MASK_TOP,X+MASK_W,MASK_TOP+MASK_H),mask)
    return img

out = ROOT/'kailor-cloud-infrastructure-1080p.mp4'
command = ['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','4','-profile:v','high','-pix_fmt','yuv420p','-vf','scale=in_range=full:out_range=limited:out_color_matrix=bt709','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart','-g',str(N),'-keyint_min',str(N),'-sc_threshold','0',str(out)]
proc = subprocess.Popen(command,stdin=subprocess.PIPE)
for i in range(N):
    im = frame(i)
    proc.stdin.write(im.tobytes())
    if i == 0:
        im.save(ROOT/'kailor-cloud-infrastructure-poster.png')
proc.stdin.close()
if proc.wait():
    raise SystemExit('Video encoding failed')
# Six unadorned actual frames, for visual review only.
thumbs = []
for i in [15,55,95,135,175,215]:
    thumbs.append(frame(i).resize((640,360),Image.Resampling.LANCZOS))
contact = Image.new('RGB',(1280,1080),BG)
for j, im in enumerate(thumbs):
    contact.paste(im,((j%2)*640,(j//2)*360))
contact.save(ROOT/'review.png')
print(out)
print('Rendered 238 frames at 24 fps (9.916667 seconds).')
