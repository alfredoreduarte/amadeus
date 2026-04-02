FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY contact.html /usr/share/nginx/html/
COPY terms.html /usr/share/nginx/html/
COPY privacy.html /usr/share/nginx/html/
COPY og.jpg /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/

EXPOSE 80
