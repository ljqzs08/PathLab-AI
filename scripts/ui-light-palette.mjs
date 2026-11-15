/** Derive a color-only light skin for the user's dark-only legacy styles. */
import postcss from '../PathLab-AI/node_modules/postcss/lib/postcss.mjs';
function toHsl(hex) {
 let h = hex.slice(1); if(h.length===3)h=[...h].map(c=>c+c).join('');
 if(h.length!==6)return null;
 const [r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255);
 const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
 let hue=0,s=0;
 if(d){s=d/(1-Math.abs(2*l-1));hue=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;hue=(hue*60+360)%360;}
 return {h:hue,s,l};
}
function color(hex,kind) {
 const v=toHsl(hex);if(!v)return hex;
 let {h,s,l}=v;
 if(kind==='background') {if(l>.65)return hex;l=.96-l*.2;s=Math.min(s*.6,.6);}
 else if(kind==='text'){if(l<.32)return hex;l=.23;s=Math.min(s*.8,.8);}
 else {l=.63;s=Math.min(s*.5,.35);}
 return 'hsl('+Math.round(h)+' '+Math.round(s*100)+'% '+Math.round(l*100)+'%)';
}
export function lightPalette(css) {
 const ast=postcss.parse(css);
 ast.walkAtRules(rule=>{if(!['media','supports'].includes(rule.name))rule.remove();});
 ast.walkComments(c=>c.remove());
 ast.walkRules(rule=>{
   if(rule.selectors.some(s=>s.includes(':root')||s==='html'||s==='body'||s.includes('light-theme'))){rule.remove();return;}
   rule.walkDecls(d=>{
     const p=d.prop;
     let kind=p==='color'||p==='fill'?'text':p.startsWith('background')?'background':/^(border|outline|stroke|box-shadow)/.test(p)?'border':null;
     if(!kind){d.remove();return;}
     let value=d.value;
     if(kind==='text')value=value.replaceAll('var(--naiwa)',' #785900').replaceAll('var(--naiwa-deep)','#8a5c00');
     else if(kind==='background')value=value.replaceAll('var(--naiwa)','#ffe28a').replaceAll('var(--naiwa-deep)','#ffd56b');
     else value=value.replaceAll('var(--naiwa)','#aa7b0c');
     value=value.replace(/#[0-9a-fA-F]{3,8}\b/g,h=>color(h,kind));
     if(value===d.value){d.remove();return;}
     d.value=value;
   });
   if(!rule.nodes.length){rule.remove();return;}
   rule.selectors=rule.selectors.map(s=>s.startsWith('body ')?'body.light-theme '+s.slice(5):'body.light-theme '+s);
 });
 ast.walkAtRules(r=>{if(!r.nodes?.length)r.remove();});
 return '/* Automatically derived COLOR-ONLY adaptation; original dimensions/behavior unchanged. */\n'+ast.toString();
}
