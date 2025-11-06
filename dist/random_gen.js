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
export function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
function randomWeight() {
    return Math.random() * 2 - 1;
}
export function createWeightMatrix(rowNum, columnNum) {
    const W = [];
    for (let y = 0; y < rowNum; y++) {
        const row = [];
        for (let x = 0; x < columnNum; x++) {
            row.push(randomWeight());
        }
        W.push(row);
    }
    return W;
}
export function createBias(size) {
    const vect = [];
    for (let x = 0; x < size; x++)
        vect.push(0.01);
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
