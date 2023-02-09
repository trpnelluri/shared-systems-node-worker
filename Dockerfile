FROM node:12-alpine

RUN mkdir -p /opt/nodejs/shared_systems_node_worker

WORKDIR /opt/nodejs/shared_systems_node_worker/

COPY . /opt/nodejs/shared_systems_node_worker/

RUN cd /opt/nodejs/shared_systems_node_worker

RUN npm install

RUN mkdir -p /efs

#RUN npm test

CMD [ "node", "app.js" ]
