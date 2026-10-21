from pathlib import Path
import subprocess, json
import numpy as np
root=Path(__file__).resolve().parent
path=root/'kailor-cloud-infrastructure-1080p.mp4'
p=subprocess.Popen(['ffmpeg','-v','error','-i',str(path),'-f','rawvideo','-pix_fmt','rgb24','pipe:1'],stdout=subprocess.PIPE)
size=1920*1080*3
first=None
colors=set()
fixed=[]
frames=0
max_border_error=0
while True:
    data=p.stdout.read(size)
    if not data: break
    assert len(data)==size
    a=np.frombuffer(data,dtype=np.uint8).reshape(1080,1920,3)
    if first is None: first=a.copy()
    colors.add(tuple(int(v) for v in a[0,0]))
    border=np.concatenate([a[:250].reshape(-1,3),a[800:].reshape(-1,3),a[:,:350].reshape(-1,3),a[:,1600:].reshape(-1,3)])
    max_border_error=max(max_border_error,int(np.abs(border.astype(int)-26).max()))
    fixed.append(a[365:480,460:900].copy())
    last=a.copy()
    frames+=1
assert p.wait()==0
fixed_variation=max(int(np.abs(a.astype(int)-fixed[0].astype(int)).max()) for a in fixed)
report={'frames':frames,'duration_seconds':frames/24,'background_corner_rgb':sorted(colors),'maximum_background_border_error':max_border_error,'fixed_prefix_maximum_decoded_variation':fixed_variation,'loop_boundary_maximum_rgb_difference':int(np.abs(first.astype(int)-last.astype(int)).max()),'loop_boundary_mean_rgb_difference':float(np.abs(first.astype(int)-last.astype(int)).mean())}
(root/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
