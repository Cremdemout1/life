/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   map.ts                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ycantin <ycantin@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/29 15:58:48 by ycantin           #+#    #+#             */
/*   Updated: 2025/09/29 17:51:33 by ycantin          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { get_rand_coords } from "./random_gen";

class map {

    canvasMap: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    
    heatPoints: Array<[number, number]>;

    constructor(canvasName: string = "map") {
        this.canvasMap = document.getElementById(canvasName) as HTMLCanvasElement;
        if (!this.canvasMap)
            throw ("Canvas not found");
        this.context = this.canvasMap.getContext("2d") as CanvasRenderingContext2D;
        if (!this.context)
            throw ("Context of canvas not found");
        
        this.heatPoints = get_rand_coords(3, 8);
    }
}