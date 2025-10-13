import * as d3 from "d3";

export type ScatterRow = {
  danceability: number;
  energy: number;
  popularity: number;
  year: number;
  [k: string]: any;
};

type InitOpts = {
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

export function initScatter(
  container: HTMLElement,
  data: ScatterRow[],
  opts: InitOpts = {}
) {
  const margin = opts.margin ?? { top: 20, right: 20, bottom: 44, left: 56 };
  const width = opts.width ?? 860;
  const height = opts.height ?? 560;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const x = d3.scaleLinear().domain([0, 1]).nice().range([0, innerW]);
  const y = d3.scaleLinear().domain([0, 1]).nice().range([innerH, 0]);
  const r = d3.scaleSqrt<number, number>().range([1.5, 8]);
  const color = d3.scaleSequential(d3.interpolatePlasma);

  const svg = d3.select(container).append("svg").attr("width", width).attr("height", height);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("clipPath").attr("id", "clip").append("rect").attr("width", innerW).attr("height", innerH);

  g.append("g").attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(10))
    .append("text").attr("x", innerW).attr("y", 34).attr("text-anchor", "end").attr("fill", "currentColor").text("Danceability");

  g.append("g")
    .call(d3.axisLeft(y).ticks(10))
    .append("text").attr("transform", "rotate(-90)").attr("x", -10).attr("y", -44).attr("text-anchor", "end").attr("fill", "currentColor").text("Energy");

  const dotsLayer = g.append("g").attr("clip-path", "url(#clip)");

  const brush = d3.brush().extent([[0, 0], [innerW, innerH]]).on("start brush end", brushed);
  const brushLayer = g.append("g").attr("class", "brush").attr("clip-path", "url(#clip)").call(brush as any);

  const selCountEl = document.getElementById("sel-count")!;
  const resetBtn = document.getElementById("reset")!;

  function brushed(event: d3.D3BrushEvent<unknown>) {
    const s = event.selection as [[number, number], [number, number]] | null;
    let count = 0;
    const circles = dotsLayer.selectAll<SVGCircleElement, ScatterRow>("circle");
    if (s) {
      const [[x0, y0], [x1, y1]] = s;
      circles.classed("selected", function (d) {
        const cx = x(d.danceability), cy = y(d.energy);
        const sel = x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
        if (sel) count++;
        return sel;
      });
    } else {
      circles.classed("selected", false);
    }
    selCountEl.textContent = String(count);
  }

  function render(points: ScatterRow[]) {
    const extent = d3.extent(points, d => d.popularity) as [number, number];
    const lo = Number.isFinite(extent[0]) ? extent[0] : 0;
    const hi = Number.isFinite(extent[1]) ? extent[1] : 1;
    r.domain([lo, hi]);
    color.domain([hi, lo]); // reverse

    const dots = dotsLayer.selectAll<SVGCircleElement, ScatterRow>("circle")
      .data(points, (d: any) => d.id ?? `${d.danceability}-${d.energy}-${d.popularity}-${d.year}`);

    const enter = dots.enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.danceability))
      .attr("cy", d => y(d.energy))
      .attr("r", 0)
      .attr("fill", d => color(d.popularity))
      .call(sel => sel.transition().duration(250).attr("r", d => r(d.popularity)));

    enter.append("title")
      .text(d => `year: ${d.year}\ndanceability: ${d.danceability}\nenergy: ${d.energy}\npopularity: ${d.popularity}`);

    dots.transition().duration(200)
      .attr("cx", d => x(d.danceability))
      .attr("cy", d => y(d.energy))
      .attr("r", d => r(d.popularity))
      .attr("fill", d => color(d.popularity));

    dots.exit().transition().duration(150).attr("r", 0).remove();

    (brushLayer as any).call(brush.move, null);
    selCountEl.textContent = "0";
  }

  resetBtn.addEventListener("click", () => (brushLayer as any).call(brush.move, null));
  svg.on("dblclick", () => (brushLayer as any).call(brush.move, null));

  return { render }; // retourne une API simple
}
