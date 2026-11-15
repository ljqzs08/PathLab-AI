"""Native-size H264 viewing derivatives. Originals remain untouched in the packet."""
from pathlib import Path
import hashlib, json, subprocess, os, shutil
ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/'.cache/submission-latest-20261115';os.environ['TEMP']=os.environ['TMP']=str(TMP)
FULL=ROOT/'delivery/PathLab-AI-参赛文件-最新版-20261115/04-完整材料解压版'
candidates=list((TMP/'tools/imageio_ffmpeg/binaries').glob('ffmpeg*.exe'))
FF=Path(os.environ.get('PATHLAB_FFMPEG') or shutil.which('ffmpeg') or (candidates[0] if candidates else ''))
if not FF.is_file():raise SystemExit('Set PATHLAB_FFMPEG to an existing D-drive ffmpeg.exe; no auto-install is performed.')
media=json.loads((ROOT/'docs/evidence/latest-submission-media-20261115.json').read_text(encoding='utf-8'))
results=[]
for name in ['183595fb6fa9eb107ab392f73ca80aa4.mp4','ee88b0dd110e97bb568bd819e5fa5f5f.mp4','新版本mp4.mp4']:
 src=FULL/'09-演示视频/作者视频原件'/name
 dst=FULL/'09-演示视频/H264兼容播放'/(src.stem+'-H264.mp4')
 cmd=[str(FF),'-nostdin','-y','-i',str(src),'-map','0:v:0','-map','0:a:0?','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',str(dst)]
 r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');assert r.returncode==0,r.stderr[-2000:]
 r=subprocess.run([str(FF),'-v','error','-xerror','-i',str(dst),'-map','0:v:0','-map','0:a:0?','-f','null','-'],capture_output=True,text=True,encoding='utf-8');assert r.returncode==0,r.stderr
 results.append({'original':name,'derivative':dst.relative_to(FULL).as_posix(),'bytes':dst.stat().st_size,'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'codec':'H264/AAC','resize':False,'trim':False,'speedChange':False,'fullDecodePassed':True})
 print(name,'converted and decoded',flush=True)
p=ROOT/'docs/evidence/latest-submission-h264-20261115.json';p.write_text(json.dumps({'date':'2026-11-15','executor':'AI tool operation','method':'ffmpeg libx264 CRF20 yuv420p AAC160k faststart; no resize/cut/concatenation/speed alteration','files':results},ensure_ascii=False,indent=2),encoding='utf-8')
