/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   random_gen.ts                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: yohan <yohan@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/29 16:54:01 by ycantin           #+#    #+#             */
/*   Updated: 2025/11/06 18:38:34 by yohan            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const width = 600;
const length = 600;

export function getRandInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

function randomWeight(): number {
    return Math.random() * 2 - 1;
}

export function createWeightMatrix(rowNum: number, columnNum: number): number[][] {
    const W: number[][] = [];
    for (let y = 0; y < rowNum; y++) {
        const row: number[] = [];
        for(let x = 0; x < columnNum; x++) {
            row.push(randomWeight());
        }
        W.push(row);
    }
    return W;
}

export function createBias(size: number) {
    const vect: number[] = [];
    for (let x = 0; x < size; x++)
        vect.push(0.01);
    return vect;
}

export function get_rand_coords(minAmount: number, maxAmount: number): Array<[number, number]> { // returns array of coords
    const points: Array<[number, number]> = [];
    const amountOfPoints: number = getRandInt(minAmount, maxAmount);
    for (let i = 0; i < amountOfPoints; i++)
        points.push([getRandInt(0, width), getRandInt(0, length)]);
    return (points);
}

export function createHeatPoints(min: number = 3, max: number = 8): Array<[number, number, number]> {
    let heats: Array<[number, number, number]> = [];
    let temp: Array<[number, number]> = get_rand_coords(min, max);
    for (let i = 0; i < temp.length; i++) {
        const [x, y] = temp[i];
        const Amplitude = getRandInt(min * 2, max * 2);
        const heat: [number, number, number] = [x, y, Amplitude];
        heats.push(heat);
    }
    return heats;
}

export function createFeeders(min: number = 3, max: number = 8): Array<[number, number, number]> {
    let feeders: Array<[number, number, number]> = [];
    let temp: Array<[number, number]> = get_rand_coords(min, max);
    for (let i = 0; i < temp.length; i++) {
        const [x, y] = temp[i];
        const FoodAmount = getRandInt(min, max);
        const feederCenter: [number, number, number] =  [x, y, FoodAmount];
        feeders.push(feederCenter);
    }
    return feeders;
}