# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: yohan <yohan@student.42.fr>                +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/09/26 11:23:58 by ycantin           #+#    #+#              #
#    Updated: 2025/11/06 19:32:11 by yohan            ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM node:18

WORKDIR /app

COPY . .

# RUN npm install && npm install -g http-server && tsc
RUN npm install && npm install -g typescript http-server && tsc


CMD ["http-server", "-p", "8080"]