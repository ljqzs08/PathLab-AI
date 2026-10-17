/** Canvas operations and actual pixel samples stay in browser memory; no screenshots are saved. */
import { test, expect, type Page } from '@playwright/test';
import levels from '../../fixtures/levels.json' with { type: 'json' };
import { appUrl, answer } from './helpers';

type DrawProbe = { rectangles: number[][]; arcs: number[][]; points: number[][] };
type ProbedCanvas = HTMLCanvasElement & { __probe?: DrawProbe };
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const proto=CanvasRenderingContext2D.prototype;
    const clear=proto.clearRect,rect=proto.strokeRect,arc=proto.arc;
    proto.clearRect=function(x,y,w,h){const c=this.canvas as ProbedCanvas;if(c.dataset.testid==='search-canvas')c.__probe={rectangles:[],arcs:[],points:[]};return clear.call(this,x,y,w,h);};
    proto.strokeRect=function(x,y,w,h){(this.canvas as ProbedCanvas).__probe?.rectangles.push([x,y,w,h]);return rect.call(this,x,y,w,h);};
    proto.arc=function(x,y,r,start,end,ccw){(this.canvas as ProbedCanvas).__probe?.arcs.push([x,y,r]);return arc.call(this,x,y,r,start,end,ccw);};
    for(const method of ['moveTo','lineTo'] as const){const original=proto[method];proto[method]=function(x,y){(this.canvas as ProbedCanvas).__probe?.points.push([x,y]);return original.call(this,x,y);};}
  });
}
async function verifyDrawing(page: Page, dpr: number) {
  await expect.poll(()=>page.getByTestId('search-canvas').evaluate(c=>{const grid=c.parentElement!,canvas=c as ProbedCanvas;return !!canvas.__probe?.rectangles.length&&canvas.width===Math.round(grid.clientWidth*Math.min(devicePixelRatio,2))&&canvas.height===Math.round(grid.clientHeight*Math.min(devicePixelRatio,2));})).toBe(true);
  const drawing=await page.evaluate(()=>{
    const canvas=document.querySelector<ProbedCanvas>('[data-testid="search-canvas"]')!,grid=document.querySelector<HTMLElement>('[data-testid="map-grid"]')!;
    const box=canvas.getBoundingClientRect(),gridBox=grid.getBoundingClientRect();
    const cell=grid.querySelector<HTMLElement>('[data-search="当前选中"]')!.getBoundingClientRect();
    const cells=(selector:string)=>Array.from(grid.querySelectorAll<HTMLElement>(selector),e=>{const b=e.getBoundingClientRect();return {x:b.x+b.width/2-box.x,y:b.y+b.height/2-box.y};});
    const context=canvas.getContext('2d')!,pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
    let count=0,minX=canvas.width,maxX=-1,minY=canvas.height,maxY=-1;
    for(let i=0;i<pixels.length;i+=4)if(pixels[i]!>200&&pixels[i+1]!>100&&pixels[i+1]!<210&&pixels[i+2]!<180&&pixels[i+3]!>100){const x=(i/4)%canvas.width,y=Math.floor(i/4/canvas.width);count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    return {width:canvas.width,height:canvas.height,clientWidth:grid.clientWidth,clientHeight:grid.clientHeight,scale:context.getTransform().a,box:{x:box.x,y:box.y,width:box.width,height:box.height},grid:{x:gridBox.x,y:gridBox.y,width:gridBox.width,height:gridBox.height},cell:{x:cell.x+cell.width/2-box.x,y:cell.y+cell.height/2-box.y,width:cell.width,height:cell.height},probe:canvas.__probe!,frontier:cells('[data-search="有效前沿"]'),path:cells('[data-on-path="true"]'),orange:{count,x:(minX+maxX+1)/2*box.width/canvas.width,y:(minY+maxY+1)/2*box.height/canvas.height}};
  });
  const scale=Math.min(dpr,2);expect(drawing.width).toBe(Math.round(drawing.clientWidth*scale));expect(drawing.height).toBe(Math.round(drawing.clientHeight*scale));expect(drawing.scale).toBe(scale);
  for(const dimension of ['x','y','width','height'] as const)expect(Math.abs(drawing.box[dimension]-drawing.grid[dimension])).toBeLessThan(1);
  const rect=drawing.probe.rectangles.at(-1)!;
  expect(Math.abs(rect[0]!+rect[2]!/2-drawing.cell.x)).toBeLessThan(1);
  expect(Math.abs(rect[1]!+rect[3]!/2-drawing.cell.y)).toBeLessThan(1);
  expect(Math.abs(rect[2]!-drawing.cell.width*.74)).toBeLessThan(1);
  expect(Math.abs(rect[3]!-drawing.cell.height*.74)).toBeLessThan(1);
  expect(drawing.probe.arcs.length).toBe(drawing.frontier.length);
  for(const point of drawing.probe.arcs)expect(drawing.frontier.some(cell=>Math.hypot(cell.x-point[0]!,cell.y-point[1]!)<1)).toBe(true);
  expect(drawing.probe.points.length).toBe(drawing.path.length>1?drawing.path.length:0);
  for(const point of drawing.probe.points)expect(drawing.path.some(cell=>Math.hypot(cell.x-point[0]!,cell.y-point[1]!)<1)).toBe(true);
  expect(drawing.orange.count).toBeGreaterThan(20);
  expect(Math.abs(drawing.orange.x-drawing.cell.x)).toBeLessThan(1.6);expect(Math.abs(drawing.orange.y-drawing.cell.y)).toBeLessThan(1.6);
}
for(const dpr of [1,2,3])test('Canvas matches DOM cells and actual current-node pixels at DPR '+dpr+' including responsive resize',async({browser,page},testInfo)=>{
  const context=await browser.newContext({offline:!!process.env.PATHLAB_TEST_URL,viewport:page.viewportSize()!,deviceScaleFactor:dpr,locale:'zh-CN',reducedMotion:'reduce',isMobile:testInfo.project.use.isMobile??false,hasTouch:testInfo.project.use.hasTouch??false});
  try{
    const probe=await context.newPage();await instrument(probe);await probe.goto(appUrl === '/' ? 'http://127.0.0.1:3210' : appUrl);
    await expect.poll(()=>probe.getByTestId('search-canvas').evaluate(c=>!!(c as ProbedCanvas).__probe)).toBe(true);
    expect(await probe.getByTestId('search-canvas').evaluate(c=>{const canvas=c as HTMLCanvasElement;const data=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;return data.some((value,index)=>index%4===3&&value!==0);})).toBe(false);
    await probe.getByRole('button',{name:'开始预测'}).click();await verifyDrawing(probe,dpr);
    await answer(probe,levels[0]!,'bfs');await verifyDrawing(probe,dpr);
    await probe.setViewportSize({width:517,height:910});await verifyDrawing(probe,dpr);
    await probe.setViewportSize({width:320,height:860});await verifyDrawing(probe,dpr);
  }finally{await context.close();}
});
