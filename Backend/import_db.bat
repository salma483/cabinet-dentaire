@echo off
echo Importation de la base de donnees...
mysql -u root -p < dentist_dashboard.sql
pause