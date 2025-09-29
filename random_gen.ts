/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   random_gen.ts                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ycantin <ycantin@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/29 16:54:01 by ycantin           #+#    #+#             */
/*   Updated: 2025/09/29 17:50:36 by ycantin          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const width = 400;
const length = 400;

function getRandInt(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function get_rand_coords(minAmount: number, maxAmount: number): Array<[number, number]> { // returns array of coords
    const points: Array<[number, number]> = [];
    const amountOfPoints: number = getRandInt(minAmount, maxAmount);
    for (let i = 0; i < amountOfPoints; i++)
        points.push([getRandInt(0, width), getRandInt(0, length)]);
    console.log(points);
    return (points);
}

get_rand_coords(5, 10)