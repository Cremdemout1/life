/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   map.ts                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: yohan <yohan@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/29 15:58:48 by ycantin           #+#    #+#             */
/*   Updated: 2025/11/06 19:23:10 by yohan            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
import { createFeeders, createHeatPoints } from "./random_gen.js";
import { Cell } from "./cell.js";
function getColor(value) {
    const cold = [180, 200, 255]; // R,G,B for light blue
    const hot = [255, 0, 0]; // R,G,B for red
    const r = Math.floor(cold[0] + (hot[0] - cold[0]) * value);
    const g = Math.floor(cold[1] + (hot[1] - cold[1]) * value);
    const b = Math.floor(cold[2] + (hot[2] - cold[2]) * value);
    return [r, g, b];
}
// this.grid[y][x][0, 1, 2] -> 0 = heat(danger) | 1 = food source amplitude | 2 = pheremone layer
export class mapClass {
    constructor(canvas) {
        this.width = 600;
        this.height = 600;
        this.canvasMap = canvas;
        if (!this.canvasMap)
            throw ("Canvas not found");
        this.context = this.canvasMap.getContext("2d");
        if (!this.context)
            throw ("Context of canvas not found");
        this.heatPoints = createHeatPoints();
        this.feederCenters = createFeeders();
        this.grid = Array.from({ length: 600 }, () => Array.from({ length: 600 }, () => [0, 0, 0]));
        this.background = Array.from({ length: 600 }, () => Array.from({ length: 600 }, () => [0, 0, 0]));
        for (const [x, y, A] of this.heatPoints) //adds heat center points
            this.grid[y][x][0] = A;
        for (const [x, y, F] of this.feederCenters) //adds feeder center points
            this.grid[y][x][1] = F;
        this.cellId = new Map();
        this.deadCells = new Map();
        this.cellNum = 0;
    }
    static create(canvasId = "map") {
        const canvas = document.getElementById(canvasId);
        if (!canvas)
            return null;
        return new mapClass(canvas);
    }
    gaussianDistribution() {
        const sigma = 50;
        for (const [cx, cy, A] of this.heatPoints) {
            const r = sigma * 3;
            //clamp inside of grid
            const minX = Math.max(0, Math.floor(cx - r));
            const maxX = Math.min(this.width - 1, Math.ceil(cx + r));
            const minY = Math.max(0, Math.floor(cy - r));
            const maxY = Math.min(this.height - 1, Math.ceil(cy + r));
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const distanceToX = x - cx;
                    const distanceToY = y - cy;
                    this.grid[y][x][0] += A * Math.exp(-((distanceToX * distanceToX) + (distanceToY * distanceToY)) / (2 * sigma * sigma));
                }
            }
        }
        // console.log(this.grid);
    }
    fillFeeders() {
        for (const [cx, cy, F] of this.feederCenters) {
            const r = 5 * F;
            const minX = Math.max(0, Math.floor(cx - r));
            const maxX = Math.min(this.width - 1, Math.ceil(cx + r));
            const minY = Math.max(0, Math.floor(cy - r));
            const maxY = Math.min(this.height - 1, Math.ceil(cy + r));
            for (let y = minY; y <= maxY; y++)
                for (let x = minX; x <= maxX; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    if (dx * dx + dy * dy <= r * r) { // inside circle
                        this.grid[y][x][1] = F;
                    }
                }
        }
    }
    // Draw a cell at position [x, y] as black
    drawCell(id, x, y) {
        const ctx = this.context;
        ctx.fillStyle = "black";
        const cell = this.cellId.get(id);
        if (!cell)
            ctx.fillRect(x, y, 1, 1);
        else
            ctx.fillRect(x, y, cell.size, cell.size);
    }
    redrawCellBackground(x, y) {
        const ctx = this.context;
        let r, g, b;
        r = this.background[y][x][0];
        g = this.background[y][x][1];
        b = this.background[y][x][2];
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
    }
    colorMap() {
        let maxHeat = 0;
        for (let y = 0; y < 600; y++)
            for (let x = 0; x < 600; x++) {
                if (this.grid[y][x][0] > maxHeat)
                    maxHeat = this.grid[y][x][0];
            }
        // Normalize values to 0–1
        const normalizedGrid = this.grid.map(row => row.map(([heat, feeder, pheromone]) => [heat / maxHeat, feeder, 0]));
        const imageData = this.context.createImageData(this.width, this.height);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const idx = (y * this.width + x) * 4;
                if (this.grid[y][x][1] != 0) {
                    imageData.data[idx] = 204;
                    imageData.data[idx + 1] = 255;
                    imageData.data[idx + 2] = 153;
                    imageData.data[idx + 3] = 255; // fully opaque
                    this.background[y][x][0] = 204;
                    this.background[y][x][1] = 255;
                    this.background[y][x][2] = 153;
                }
                else {
                    const [r, g, b] = getColor(normalizedGrid[y][x][0]);
                    imageData.data[idx] = r;
                    imageData.data[idx + 1] = g;
                    imageData.data[idx + 2] = b;
                    imageData.data[idx + 3] = 255; // fully opaque
                    this.background[y][x][0] = r;
                    this.background[y][x][1] = g;
                    this.background[y][x][2] = b;
                }
            }
        }
        this.context.putImageData(imageData, 0, 0);
    }
    createCell(x, y, id, brain, parent) {
        if (this.cellNum > 300)
            return false;
        this.cellNum++;
        // Auto-generate new ID if none is given
        const newId = id !== null && id !== void 0 ? id : Math.max(0, ...Array.from(this.cellId.keys())) + 1;
        // Determine which brain to use
        let cell;
        if (!brain) {
            if (parent) {
                brain = parent.brain.clone(null, true);
                cell = new Cell(newId, x, y, this, brain);
            }
            else
                cell = new Cell(newId, x, y, this);
        }
        if (!cell)
            throw ("Error: cell not created");
        this.cellId.set(newId, cell);
        if (brain) {
            brain.cell = cell;
            brain.policyNetwork.cell = cell;
        }
        this.drawCell(newId, x, y);
        const step = () => {
            cell.decideAndAct();
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        return true;
    }
    updateControlPanel() {
        var _a, _b;
        const avgEnergy = (Array.from(this.cellId.values()).reduce((acc, val) => acc + val.energy, 0) / this.cellNum);
        const countElem = document.getElementById('cell-count');
        const energyElem = document.getElementById('avg-energy');
        // Make sure both elements exist
        if (!countElem || !energyElem)
            return;
        countElem.textContent = (_a = this.cellNum.toString()) !== null && _a !== void 0 ? _a : undefined;
        energyElem.textContent = (_b = avgEnergy.toString()) !== null && _b !== void 0 ? _b : undefined;
    }
}
const myMap = mapClass.create("map");
if (myMap) {
    //   console.log("Map created", myMap);
    myMap.gaussianDistribution();
    myMap.fillFeeders();
    myMap.colorMap();
    myMap.createCell(300, 300, 1, undefined, undefined);
    myMap.createCell(300, 300, 2, undefined, undefined);
    myMap.createCell(300, 300, 3, undefined, undefined);
    setInterval(() => {
        myMap.updateControlPanel();
    });
}
else {
    console.warn("Canvas not found");
}
// const addCellBtn = document.getElementById('add-cell-btn');
// if (addCellBtn && myMap) {
//     addCellBtn.addEventListener('click', () => {
//         // Pick a random position on the map
//         const x = Math.floor(Math.random() * myMap.width);
//         const y = Math.floor(Math.random() * myMap.height);
//         // Create a new cell at that position
//         const success = myMap.createCell(x, y);
//         if (!success) {
//             console.log("Could not create cell: population limit reached");
//         } else {
//             console.log(`Cell added at (${x}, ${y})`);
//         }
//     });
// }
