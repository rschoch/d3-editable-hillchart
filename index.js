import { select, event } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { axisBottom, axisLeft } from 'd3-axis'
import { line } from 'd3-shape'
import { drag } from 'd3-drag'
import { range } from 'd3-array'

export default class HillChart {

  constructor() {
    this.width = 1000;
    this.height = 300;
    this.margin = {};
    this.margin.top = 15;
    this.margin.right = 200;
    this.margin.bottom = 35;
    this.margin.left = 60;
    this.target = 'svg'
    this.w = this.width - this.margin.left - this.margin.right
    this.h = this.height - this.margin.top - this.margin.bottom
    this.items = [];
    this.fn = x => 50 * Math.sin((Math.PI / 50) * x - (1 / 2) * Math.PI) + 50;
    this.init();
  }

  resetChart() {
    const group = this.svg
      .selectAll('.group')
      .data([])
      .exit()
      .remove()
  }

  renderChart() {
    this.svg = select(this.target)
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

    this.xScale = scaleLinear()
      .domain([0, 100])
      .range([0, this.w])

    this.xAxis = axisBottom(this.xScale).ticks(0)

    this.svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${this.h})`)
      .call(this.xAxis)

    this.yScale = scaleLinear()
      .domain([0, 100])
      .range([this.h, 0])

    this.yAxis = axisLeft(this.yScale).ticks(0)

    this.svg
      .append('g')
      .attr('class', 'y axis')
      .call(this.yAxis)


    const lineData = range(0, 100, 0.1).map(i => ({
      x: i,
      y: this.fn(i)
    }))

    this.line = line()
      .x(d => this.xScale(d.x))
      .y(d => this.yScale(d.y))

    this.svg
      .append('path')
      .attr('class', 'line')
      .datum(lineData)
      .attr('d', this.line)

    this.svg
      .append('line')
      .attr('class', 'middle')
      .attr('x1', this.xScale(50))
      .attr('y1', this.yScale(0))
      .attr('x2', this.xScale(50))
      .attr('y2', this.yScale(100))
  }

  renderLabels() {
    this.svg
      .append('text')
      .attr('class', 'text')
      .text('Figuring things out')
      .attr('x', this.xScale(25))
      .attr('y', this.h + 25)

    this.svg
      .append('text')
      .attr('class', 'text')
      .text('Making it happen')
      .attr('x', this.xScale(75))
      .attr('y', this.h + 25)
  }

  renderDot(item) {
    this.items.push(item);
    this.renderDots(this.items, false)
  }

  renderDots(items, loadFromSave) {
    const that = this

    const dragIt = drag().on('drag', function (d) {
      let x = event.x
      if (x < 0) {
        x = 0
      } else if (x > that.w) {
        x = that.w
      }
      const inverted = that.xScale.invert(x)
      d.x = x
      d.y = that.yScale(that.fn(inverted))
      select(this).attr('transform', `translate(${d.x}, ${d.y})`)
      select(this).attr('xValue', d.x)
      select(this).attr('yValue', d.y)
    })

    const group = this.svg
      .selectAll('.group')
      .data(items)
      .enter()
      .append('g')
      .attr('class', 'group')
    if (loadFromSave) {
      group
        .attr('transform', d => {
          d.x = d.x
          d.y = d.y
          return `translate(${d.x}, ${d.y})`
        })
    } else {
      group
        .attr('transform', d => {
          d.x = this.xScale(d.x)
          d.y = this.yScale(d.y)
          return `translate(${d.x}, ${d.y})`
        })
    }
    group
      .attr('xValue', d => d.x)
      .attr('yValue', d => d.y)
      .call(dragIt)

    group
      .append('circle')
      .attr('fill', d => d.color)
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 8)

    group
      .append('text')
      .text(d => d.desc)
      .attr('x', 10)
      .attr('y', 5)
  }

  init() {
    this.renderChart();
    this.renderLabels();
  }
}