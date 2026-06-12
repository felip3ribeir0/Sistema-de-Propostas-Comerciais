@echo off
title Sistema de Propostas Comerciais
cd /d "%~dp0"
if not exist "node_modules\electron" (
  echo Instalando dependencias pela primeira vez...
  call npm install
)
echo Abrindo Sistema de Propostas Comerciais...
call npm start
