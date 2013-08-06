#!/bin/sh
#
# Script to install graphical-facebook-client server
#
REP=${PWD%/*}
sed -i -e 's/install-path/'$REP'/g' ./wsgi/fb.wsgi
sed -i -e 's/install-path/'$REP'/g' ./fb
sudo apt-get install python-pip
sudo pip install flask
sudo apt-get install mongodb
sudo pip install mongoalchemy
sudo pip install flask-mongoalchemy
sudo apt-get install apache2
sudo apt-get install libapache2-mod-wsgi
sudo cp ./public_html/wsgi/fb.wsgi /etc/apache2/sites-available
sudo echo "NameVirtualHost *:8081
Listen 8081" >> /etc/apache2/ports.conf
a2ensite fb
/etc/init.d/apache2 reload
