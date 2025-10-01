/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   random_gen.ts                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: yohan <yohan@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/29 16:54:01 by ycantin           #+#    #+#             */
/*   Updated: 2025/09/30 15:27:23 by yohan            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
const width = 400;
const length = 400;
function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
export function get_rand_coords(minAmount, maxAmount) {
    const points = [];
    const amountOfPoints = getRandInt(minAmount, maxAmount);
    for (let i = 0; i < amountOfPoints; i++)
        points.push([getRandInt(0, width), getRandInt(0, length)]);
    console.log(points);
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
