"""Audit author inputs and preserve their exact-byte provenance. All writes stay in D workspace."""
from pathlib import Path
import hashlib, json, importlib.util, subprocess, sys, os
ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/'.cache/submission-latest-20261115'; TMP.mkdir(parents=True,exist_ok=True)
os.environ['TEMP']=os.environ['TMP']=str(TMP); sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('packet_video', ROOT/'scripts/build-video-material-packet.py')
media=importlib.util.module_from_spec(spec); spec.loader.exec_module(media)
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1<<20),b''): h.update(b)
 return h.hexdigest()
def item(p): return {'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
if __name__=='__main__':
 videos=[ROOT/x for x in ['183595fb6fa9eb107ab392f73ca80aa4.mp4','ee88b0dd110e97bb568bd819e5fa5f5f.mp4','新版本mp4.mp4']]
 photos=sorted(ROOT.glob('微信图片_202611151006*.jpg'))
 old=ROOT/'delivery/PathLab-AI-参赛文件-v3'
 baseline={'date':'2026-11-15','executor':'AI','authoritativeHtml':item(ROOT/'PathLab_AI_v4_optimized_final.html'),'photos':[item(p) for p in photos],'videos':[item(p) for p in videos], 'v3Files':[dict(item(p),oldRelative=p.relative_to(old).as_posix()) for p in sorted(old.rglob('*')) if p.is_file()]}
 out=ROOT/'docs/evidence/latest-submission-inputs-20261115.json'; out.write_text(json.dumps(baseline,ensure_ascii=False,indent=2),encoding='utf-8')
 ff=next((TMP/'tools/imageio_ffmpeg/binaries').glob('ffmpeg*.exe'))
 facts=[]
 from PIL import Image,ImageDraw,ImageFont
 for p in videos:
  data=media.parse_mp4(p); data.pop('requirements',None)
  d={**item(p),**data}; n=videos.index(p)+1
  log=TMP/f'video-{n}-decode.log'
  with log.open('wb') as f:
   result=subprocess.run([str(ff),'-v','error','-i',str(p),'-map','0:v:0','-map','0:a:0?','-f','null','-'],stdout=f,stderr=f)
  d['fullDecode']={'returnCode':result.returncode,'errorLogBytes':log.stat().st_size}; assert result.returncode==0 and log.stat().st_size==0
  frames=[]; duration=data['durationSeconds']
  for j,t in enumerate([duration*x for x in [.03,.20,.40,.60,.80,.95]]):
   frame=TMP/f'video-{n}-{j}.jpg'
   subprocess.run([str(ff),'-v','error','-ss',str(t),'-i',str(p),'-frames:v','1','-q:v','2',str(frame)],check=True)
   im=Image.open(frame).convert('RGB'); im.thumbnail((640,360)); tile=Image.new('RGB',(660,400),'white');tile.paste(im,((660-im.width)//2,26)); ImageDraw.Draw(tile).text((10,380),f'{p.name} | {t:.2f} s',fill='black'); frames.append(tile)
  board=Image.new('RGB',(1320,1200),'#ddd')
  for j,im in enumerate(frames):board.paste(im,((j%2)*660,(j//2)*400))
  board.save(TMP/f'video-{n}-contact.jpg')
  facts.append(d)
 (ROOT/'docs/evidence/latest-submission-media-20261115.json').write_text(json.dumps({'executor':'AI','date':'2026-11-15','scope':'MP4 metadata, full audio/video decode and six sampled visual frames per clip; no human viewing or speech transcription','videos':facts},ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'oldFiles':len(baseline['v3Files']),'photos':len(photos),'videos':[{k:v for k,v in x.items() if k in ['path','duration','video','fullDecode']} for x in facts]},ensure_ascii=True))
