// pages/ChinaVis/lib/interaction.ts
// 新增：overlay 上的最近邻 tooltip & 点击选中（与 Pinia 集成）

import * as d3 from 'd3';
import type { StudentPoint } from '../types';
import { useVisStore } from '../stores/useVisStore';

export function buildQuadtree(
  points: StudentPoint[],
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>
) {
  return d3.quadtree<StudentPoint>()
    .x(d => xScale(d.x))
    .y(d => yScale(d.y))
    .addAll(points);
}

// 新增：安装 hover tooltip（绑在 overlay 上）
export function installHoverTooltip(
  overlay: d3.Selection<Element, unknown, any, any>,
  tree: d3.Quadtree<StudentPoint>
) {
  const tipId = 'scatter-tip';
  let tip = d3.select<HTMLDivElement, unknown>('#' + tipId);
  if (tip.empty()) {
    tip = d3.select('body').append('div')
      .attr('id', tipId)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('padding', '6px 8px')
      .style('background', 'rgba(0,0,0,.75)')
      .style('color', '#fff')
      .style('font', '12px sans-serif')
      .style('border-radius', '6px')
      .style('opacity', '0');
  }

  overlay
    .on('mousemove.tooltip', (event: MouseEvent) => {
      const [mx, my] = d3.pointer(event);
      const found = tree.find(mx, my, 24);            // 半径 24px
      if (!found) return tip.style('opacity', '0');
      tip
        .style('left', `${event.pageX + 12}px`)
        .style('top', `${event.pageY + 12}px`)
        .style('opacity', '1')
        .html(`学生：${found.student_ID}<br/>班级：${found.class}
               <br/>掌握：${found.acc_last.toFixed(2)}
               <br/>重做：${(found.redo_rate*100).toFixed(0)}%`);
    })
    .on('mouseleave.tooltip', () => tip.style('opacity', '0'));
}

// 新增：安装点击选中（单选/多选）
export function installClickSelect(
  overlay: d3.Selection<Element, unknown, any, any>,
  tree: d3.Quadtree<StudentPoint>
) {
  const store = useVisStore();
  overlay.on('click.select', (event: MouseEvent) => {
    const [mx, my] = d3.pointer(event);
    const target = tree.find(mx, my, 16);
    if (!target) return;
    const multi = event.metaKey || event.ctrlKey;     // ⌘/Ctrl 多选
    if (!multi) store.clearSelection();
    if (store.selectedStudents.has(target.student_ID)) {
      store.removeStudent(target.student_ID);
    } else {
      store.addStudent(target.student_ID);
    }
  });
}
