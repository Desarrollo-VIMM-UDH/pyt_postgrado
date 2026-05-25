!include LogicLib.nsh
!include nsDialogs.nsh

Name "Sistema Docentes UDH"
OutFile "Sistema_Docentes_UDH_Setup.exe"
InstallDir "$LOCALAPPDATA\SistemaDocentesUDH"
RequestExecutionLevel user

Section "Instalacion"
  SetOutPath "$INSTDIR"
  
  ; Extraer archivos de la aplicacion
  File /r "..\src\*.*"
  File /r "..\database\*.*"
  File /r "..\assets\*.*"
  File "..\package.json"
  
  ; Instalar Node.js silenciosamente si no existe
  IfFileExists "$INSTDIR\nodejs\node.exe" NodeExiste 0
    SetOutPath "$INSTDIR\temp"
    File "..\installer\node-installer.msi"
    ExecWait 'msiexec /i "$INSTDIR\temp\node-installer.msi" /qn INSTALLDIR="$INSTDIR\nodejs"'
    Delete "$INSTDIR\temp\node-installer.msi"
    RMDir "$INSTDIR\temp"
  NodeExiste:
  
  ; Instalar dependencias de Node
  nsExec::ExecToLog '"$INSTDIR\nodejs\npm" install --prefix "$INSTDIR"'
  
  ; Recompilar better-sqlite3 para Electron
  nsExec::ExecToLog '"$INSTDIR\nodejs\npm" run postinstall --prefix "$INSTDIR"'
  
  ; Crear acceso directo en escritorio
  CreateShortcut "$DESKTOP\Sistema Docentes UDH.lnk" "$INSTDIR\node_modules\.bin\electron.cmd" "." "$INSTDIR\assets\icon.ico"
  
  ; Crear acceso directo en menu inicio
  CreateDirectory "$STARTMENU\Programs\Sistema Docentes UDH"
  CreateShortcut "$STARTMENU\Programs\Sistema Docentes UDH\Sistema Docentes UDH.lnk" "$INSTDIR\node_modules\.bin\electron.cmd" "." "$INSTDIR\assets\icon.ico"
  
  ; Crear script de lanzamiento
  FileOpen $0 "$INSTDIR\Iniciar.bat" w
  FileWrite $0 "@echo off$\n"
  FileWrite $0 "cd /d \"%~dp0\"$\n"
  FileWrite $0 "start \"\" \"%~dp0node_modules\\.bin\\electron.cmd\" \".\"$\n"
  FileClose $0
  
  ; Mensaje de finalizacion
  MessageBox MB_OK "Instalacion completada.$\nAcceso directo creado en el escritorio."
SectionEnd

Section "Desinstalar"
  Delete "$DESKTOP\Sistema Docentes UDH.lnk"
  Delete "$STARTMENU\Programs\Sistema Docentes UDH\Sistema Docentes UDH.lnk"
  RMDir "$STARTMENU\Programs\Sistema Docentes UDH"
  RMDir /r "$INSTDIR"
SectionEnd
