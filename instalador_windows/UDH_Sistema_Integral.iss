#define AppName "Sistema Integral UDH"
#define AppVersion "4.0"
#define Publisher "Universidad de Defensa de Honduras"
#define Author "RODOLFO DAVID ZUNIGA RIVERA"
#define TechnicalLead "Suboficial Orlin Gomez Lopez"

[Setup]
AppId={{7D8BB917-8D7E-4FCB-9F7E-8C4E6F5E4C21}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#Publisher}
AppContact={#Author}
AppComments=Sistema Integral de Gestion Academica - Facultad de Ingenieria Mecatronica
AppCopyright=Desarrollado por {#Author}
DefaultDirName={commonappdata}\UDH\SISTEMA_MECA
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputDir=dist
OutputBaseFilename=Instalador_UDH_Sistema_Integral
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
WizardImageFile=assets\wizard-large.bmp
WizardSmallImageFile=assets\wizard-small.bmp

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Messages]
WelcomeLabel1=Bienvenido al instalador de [name]
WelcomeLabel2=Universidad de Defensa de Honduras%nl%"Soberana del saber militar, primeros en Centro America"%nl%%nl%Sistema Integral de Gestion Academica%nl%Facultad de Ingenieria Mecatronica%nl%%nl%Desarrollado por: {#Author}%nl%Soporte tecnico: {#TechnicalLead}
FinishedHeadingLabel=Instalacion finalizada
FinishedLabel=El asistente termino de configurar [name].%nl%%nl%Si selecciono Host/Servidor, continue en la ventana de consola para instalar dependencias y configurar servicios.%nl%Si selecciono Cliente/Esclavo, revise los accesos directos creados en el Escritorio.

[Files]
Source: "..\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Check: IsHostMode; Excludes: ".git\*,node_modules\*,SISTEMA_MECA\*,server\uploads\*,server\*.db*,sistema_docentes\node_modules\*,sistema_docentes\database\*.db*,sistema_reportes\node_modules\*,instalador_windows\dist\*,*.log"

[Dirs]
Name: "{app}"; Permissions: users-modify
Name: "{app}\server\uploads"; Permissions: users-modify; Check: IsHostMode
Name: "{app}\sistema_docentes\database"; Permissions: users-modify; Check: IsHostMode

[Icons]
Name: "{group}\Instalador Unificado UDH"; Filename: "{app}\instalador_tecnologia\Instalar_Sistema_Completo.bat"; WorkingDir: "{app}"; Check: IsHostMode
Name: "{group}\Arrancar Sistema UDH"; Filename: "{cmd}"; Parameters: "/K node arrancar.js"; WorkingDir: "{app}"; Check: IsHostMode
Name: "{group}\Ver IP del Servidor"; Filename: "{cmd}"; Parameters: "/K node ver_ip.js"; WorkingDir: "{app}"; Check: IsHostMode
Name: "{commondesktop}\Iniciar Sistema UDH"; Filename: "{cmd}"; Parameters: "/K ""set PATH=%ProgramFiles%\nodejs;%PATH% && node arrancar.js"""; WorkingDir: "{app}"; Check: IsHostMode

[UninstallDelete]
Type: filesandordirs; Name: "{app}\node_modules"
Type: filesandordirs; Name: "{app}\sistema_docentes\node_modules"
Type: filesandordirs; Name: "{app}\sistema_reportes\node_modules"
Type: filesandordirs; Name: "{app}\instalador_windows"
Type: files; Name: "{commondesktop}\Iniciar Sistema UDH.lnk"
Type: files; Name: "{commondesktop}\UDH - Dashboard Admin.url"
Type: files; Name: "{commondesktop}\UDH - Portal Coordinadores.url"
Type: files; Name: "{commondesktop}\UDH - Portal Estudiantil.url"
Type: dirifempty; Name: "{app}"
Type: dirifempty; Name: "{commonappdata}\UDH"

[Code]
var
  ModePage: TInputOptionWizardPage;
  HostPage: TInputQueryWizardPage;

function IsHostMode(): Boolean;
begin
  Result := ModePage.Values[0];
end;

function IsClientMode(): Boolean;
begin
  Result := ModePage.Values[1];
end;

function NodeInstalled(): Boolean;
var
  ResultCode: Integer;
begin
  Result := (
    Exec(
      ExpandConstant('{cmd}'),
      '/C node -v',
      '',
      SW_HIDE,
      ewWaitUntilTerminated,
      ResultCode
    ) and (ResultCode = 0)
  ) or FileExists(ExpandConstant('{pf}\nodejs\node.exe'))
    or FileExists(ExpandConstant('{pf32}\nodejs\node.exe'))
    or FileExists(ExpandConstant('{commonpf}\nodejs\node.exe'))
    or FileExists(ExpandConstant('{commonpf32}\nodejs\node.exe'));
end;

procedure TryInstallNode();
var
  ResultCode: Integer;
begin
  if NodeInstalled() then
    Exit;

  MsgBox(
    'Node.js no esta instalado. El instalador descargara el MSI oficial Node.js LTS desde nodejs.org y lo instalara automaticamente.' + #13#10#13#10 +
    'Se requiere conexion a Internet.',
    mbInformation,
    MB_OK
  );

  Exec(
    'powershell.exe',
    '-NoProfile -ExecutionPolicy Bypass -File "' + ExpandConstant('{app}\instalador_windows\scripts\install_node_lts.ps1') + '"',
    ExpandConstant('{app}'),
    SW_SHOW,
    ewWaitUntilTerminated,
    ResultCode
  );

  if (ResultCode <> 0) or (not NodeInstalled()) then begin
    MsgBox(
      'No se pudo confirmar Node.js.' + #13#10#13#10 +
      'Instale Node.js LTS manualmente desde https://nodejs.org y luego ejecute:' + #13#10 +
      'node instalador.js --modo=host',
      mbError,
      MB_OK
    );
  end;
end;

procedure CreateUrlShortcut(FileName: String; Url: String);
begin
  SaveStringToFile(
    ExpandConstant('{commondesktop}\' + FileName + '.url'),
    '[InternetShortcut]' + #13#10 + 'URL=' + Url + #13#10,
    False
  );
end;

procedure ConfigureClientShortcuts();
var
  Host: String;
begin
  Host := Trim(HostPage.Values[0]);
  if Host = '' then
    Exit;

  CreateUrlShortcut('UDH - Dashboard Admin', 'http://' + Host + ':5173');
  CreateUrlShortcut('UDH - Portal Coordinadores', 'http://' + Host + ':3002');
  CreateUrlShortcut('UDH - Portal Estudiantil', 'http://' + Host + ':3003');

  MsgBox(
    'Cliente configurado.' + #13#10#13#10 +
    'Se crearon accesos directos en el Escritorio apuntando al servidor: ' + Host,
    mbInformation,
    MB_OK
  );
end;

procedure RunHostInstaller();
var
  ResultCode: Integer;
  CommandLine: String;
begin
  TryInstallNode();

  if NodeInstalled() then begin
    CommandLine := '/K "set PATH=%ProgramFiles%\nodejs;%PATH% && node instalador.js --modo=host"';
    Exec(
      ExpandConstant('{cmd}'),
      CommandLine,
      ExpandConstant('{app}'),
      SW_SHOW,
      ewNoWait,
      ResultCode
    );
  end else begin
    MsgBox('No se pueden instalar dependencias porque Node.js no esta disponible.', mbError, MB_OK);
  end;
end;

procedure InitializeWizard();
begin
  ModePage := CreateInputOptionPage(
    wpWelcome,
    'Tipo de instalacion',
    'Seleccione como se usara esta computadora',
    'El Host/Servidor ejecuta el sistema completo. El Cliente/Esclavo solo crea accesos al servidor.',
    True,
    False
  );

  ModePage.Add('Host / Servidor');
  ModePage.Add('Cliente / Esclavo');
  ModePage.Values[0] := True;

  HostPage := CreateInputQueryPage(
    ModePage.ID,
    'Servidor del sistema',
    'Indique la IP o nombre del Host/Servidor',
    'Ejemplo: 192.168.1.10'
  );
  HostPage.Add('IP o nombre del servidor:', False);
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := False;

  if PageID = HostPage.ID then
    Result := not IsClientMode();
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;

  if (CurPageID = HostPage.ID) and IsClientMode() and (Trim(HostPage.Values[0]) = '') then begin
    MsgBox('Debe indicar la IP o nombre del servidor.', mbError, MB_OK);
    Result := False;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then begin
    if IsClientMode() then
      ConfigureClientShortcuts()
    else
      RunHostInstaller();
  end;
end;
