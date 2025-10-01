/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   map.ts                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: yohan <yohan@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/29 15:58:48 by ycantin           #+#    #+#             */
/*   Updated: 2025/10/01 14:13:09 by yohan            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { createFeeders, createHeatPoints } from "./random_gen.js";

function getColor(value: number): [number, number, number] {

    const cold = [180, 200, 255];  // R,G,B for light blue
    const hot = [255, 0, 0];       // R,G,B for red

    const r = Math.floor(cold[0] + (hot[0] - cold[0]) * value);
    const g = Math.floor(cold[1] + (hot[1] - cold[1]) * value);
    const b = Math.floor(cold[2] + (hot[2] - cold[2]) * value);

    return [r, g, b];
}

// this.grid[y][x][0, 1, 2] -> 0 = heat(danger) | 1 = food source amplitude | 2 = pheremone layer

export class mapClass {

    width: number = 400;
    height: number = 400;
    canvasMap: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    heatPoints: Array<[number, number, number]>;
    feederCenters: Array<[number, number, number]>;
    grid: Array<Array<[number, number, number]>>;

    constructor(canvas: HTMLCanvasElement) {
        this.canvasMap = canvas;
        if (!this.canvasMap)
            throw ("Canvas not found");
        this.context = this.canvasMap.getContext("2d") as CanvasRenderingContext2D;
        if (!this.context)
            throw ("Context of canvas not found");
        
        this.heatPoints = createHeatPoints();
        this.feederCenters = createFeeders();
        this.grid = Array.from({ length: 400 }, () =>
            Array.from({ length: 400 }, () => [0, 0, 0])
        );        
        for (const[x, y, A] of this.heatPoints) //adds heat center points
            this.grid[y][x][0] = A;
        for (const[x, y, F] of this.feederCenters) //adds feeder center points
            this.grid[y][x][1] = F;
    }
    
    static create(canvasId: string = "map"): mapClass | null {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (!canvas) return null;
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

            for (let y = minY; y < maxY; y++) {
                for (let x = minX; x < maxX; x++) {
                    const distanceToX = x - cx;
                    const distanceToY = y - cy;
                    this.grid[y][x][0] += A * Math.exp(-((distanceToX * distanceToX) + (distanceToY * distanceToY))/ (2 * sigma * sigma));
                }
            }
        }
        console.log(this.grid);
    }

    fillFeeders() {
        for (const [cx, cy, F] of this.feederCenters) {
            const r = 5 * F;
            const minX = Math.max(0, Math.floor(cx - r));
            const maxX = Math.min(this.width - 1, Math.ceil(cx + r));
            const minY = Math.max(0, Math.floor(cy - r));
            const maxY = Math.min(this.height - 1, Math.ceil(cy + r));

            for (let y = minY; y < maxY; y++)
                for (let x = minX; x < maxX; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    if (dx*dx + dy*dy <= r*r) { // inside circle
                        this.grid[y][x][1] = F;
                    }
                }
        }
    }

    colorMap() {
        let maxHeat = 0;
        for (let y = 0; y < 400; y++)
            for (let x = 0; x < 400; x++) {
                if (this.grid[y][x][0] > maxHeat)
                    maxHeat = this.grid[y][x][0];
            }

        // Normalize values to 0–1
        const normalizedGrid = this.grid.map(row =>
            row.map(([heat, feeder, pheremone]) => [heat / maxHeat, feeder, 0] as [number, number, number])
          );
        const imageData = this.context.createImageData(this.width, this.height);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const idx = (y * this.width + x) * 4;
                
                if (this.grid[y][x][1] != 0)
                {
                    imageData.data[idx] = 204;
                    imageData.data[idx + 1] = 255;
                    imageData.data[idx + 2] = 153;
                    imageData.data[idx + 3] = 255; // fully opaque
                }
                else {
                    const [r, g, b] = getColor(normalizedGrid[y][x][0]);
                    imageData.data[idx] = r;
                    imageData.data[idx + 1] = g;
                    imageData.data[idx + 2] = b;
                    imageData.data[idx + 3] = 255; // fully opaque
                }
            }
        }

        this.context.putImageData(imageData, 0, 0);
    }


    drawPoints(cellSize: number = 2) {
        this.context.fillStyle = "red";
        for (const [x, y] of this.heatPoints) {
            const px = x * cellSize;
            const py = y * cellSize;
            this.context.fillRect(px, py, cellSize, cellSize);
        }
    }
}

const myMap = mapClass.create("map");

if (myMap) {
  console.log("Map created", myMap);
  myMap.gaussianDistribution();
  myMap.fillFeeders();
  myMap.colorMap();
} else {
  console.warn("Canvas not found");
}
