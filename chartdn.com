
server {
	server_name chartdn.com;
	location / {
			proxy_pass https://127.0.0.1:12312;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}
	location /login {
			proxy_pass https://127.0.0.1:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}
	location /logout {
			proxy_pass https://127.0.0.1:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}
	location /register {
			proxy_pass https://127.0.0.1:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}
	location /account {
			proxy_pass https://127.0.0.1:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}
	location /settings {
			proxy_pass https://127.0.0.1:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}
	location /new {
			proxy_pass https://127.0.0.1:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}
	location /browse {
			proxy_pass https://127.0.0.1:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}
	location ~ /charts/* {
			proxy_pass https://127.0.0.1:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}
	location ~ /edit/* {
			proxy_pass https://127.0.0.1:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}
	location ~ /fork/* {
			proxy_pass https://127.0.0.1:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}
	location ~ /user/* {
			proxy_pass https://127.0.0.1:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "Upgrade";
	}



}

server {
    if ($host = chartdn.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


        listen 80 default_server;
        listen [::]:80 default_server;
        server_name chartdn.com;
    return 404; # managed by Certbot


}