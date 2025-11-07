/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   random_gen.ts                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: yohan <yohan@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/29 16:54:01 by ycantin           #+#    #+#             */
/*   Updated: 2025/11/07 12:47:08 by yohan            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
const width = 600;
const length = 600;
export function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
function randomWeight() {
    return Math.random() * 2 - 1;
}
function randUniform(a = 0, b = 1) {
    return Math.random() * (b - a) + a;
}
// export function createWeightMatrix(rowNum: number, columnNum: number): number[][] {
//     const W: number[][] = [];
//     for (let y = 0; y < rowNum; y++) {
//         const row: number[] = [];
//         for(let x = 0; x < columnNum; x++) {
//             row.push(randomWeight());
//         }
//         W.push(row);
//     }
//     return W;
// }
// export function createBias(size: number) {
//     const vect: number[] = [];
//     for (let x = 0; x < size; x++)
//         vect.push(0.01);
//     return vect;
// }
export function createWeightMatrix(rows, cols, fanIn, fanOut) {
    // If fanIn/fanOut not provided, fall back to cols/rows
    const nIn = fanIn !== null && fanIn !== void 0 ? fanIn : cols;
    const nOut = fanOut !== null && fanOut !== void 0 ? fanOut : rows;
    const limit = Math.sqrt(2 / nIn); // Xavier|He (Glorot) uniform
    const W = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push(randUniform(-limit, limit));
        }
        W.push(row);
    }
    return W;
}
export function createBias(size, init = 0.0) {
    const vect = new Array(size).fill(init);
    return vect;
}
export function get_rand_coords(minAmount, maxAmount) {
    const points = [];
    const amountOfPoints = getRandInt(minAmount, maxAmount);
    for (let i = 0; i < amountOfPoints; i++)
        points.push([getRandInt(0, width), getRandInt(0, length)]);
    return (points);
}
export function createHeatPoints(min = 3, max = 8) {
    let heats = [];
    let temp = get_rand_coords(min, max);
    for (let i = 0; i < temp.length; i++) {
        const [x, y] = temp[i];
        const Amplitude = getRandInt(min * 2, max * 2);
        const heat = [x, y, Amplitude];
        heats.push(heat);
    }
    return heats;
}
export function createFeeders(min = 3, max = 8) {
    let feeders = [];
    let temp = get_rand_coords(min, max);
    for (let i = 0; i < temp.length; i++) {
        const [x, y] = temp[i];
        const FoodAmount = getRandInt(min, max);
        const feederCenter = [x, y, FoodAmount];
        feeders.push(feederCenter);
    }
    return feeders;
}
