# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ycantin <ycantin@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/09/26 11:23:58 by ycantin           #+#    #+#              #
#    Updated: 2025/10/01 23:35:32 by ycantin          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM node:18

WORKDIR /app

COPY . .

RUN npm install && npm install -g http-server && tsc

CMD ["http-server", "-p", "8080"]