# lozl-auto-contests  
<pre style="overflow: visible">  
             ('-.                     
            ( OO ).-.                 
 ,--.       / . --. /      .-----.    
 |  |.-')   | \-.  \      '  .--./    
 |  | OO ).-'-'  |  |     |  |('-.    
 |  |`-' | \| |_.'  |    /_) |OO  )   
(|  '---.'  |  .-.  |    ||  |`-'|    
 |      |.-.|  | |  |.-.(_'  '--'\.-. 
 `------'`-'`--' `--'`-'   `-----'`-'
lozl-auto-contests © sirok1  
</pre>  
  
<img src = 'https://cdn.discordapp.com/attachments/937406998201397278/1106851699479547915/image.png'>  
  
## Table of contents  
- [Installation and startup](#installation-and-startup)  
- - [Debian](#debian)  
- - [Windows](#windows)  
- [Logging](#logging)  
- [Integration with Discord](#integration-with-discord)  
- [Integration with the bot in Telegram](#integration-with-the-bot-in-telegram)  
- [Available scripts](#available-scripts)  
- - [Clearing saved cookies and user agent](#clearing-saved-cookies-and-user-agent)  
- - [Clearing logs in files](#clearing-logs-in-files)  
- [Configuration file](#configuration-file)  
- - [Description of the configuration file fields](#description-of-the-configuration-file-fields)  
- - [Example of a completed configuration file](#example-of-a-completed-configuration-file)  
- [License](#license)  
  
## Installation and startup  
### Debian  
To begin with, it is necessary to establish dependencies  
```  
npm i  
```  
Running the application:  
```  
node .  
```  
### Windows  
Go to scripts/win and run "run.bat"  
  
## Logging  
Available logging methods  
- Direct output to the console (with "alwaysOn" off)  
- Logging to the combined.log and error.log files (enabled by default)  
- Logging via webhook in Discord, if this option is enabled in the configuration file  
- Logging via a bot in Telegram, if this option is enabled in the configuration file  
## Integration with Discord  
The app will send messages about its status and draw participation status to your webhook,  
just fill in the discord_webhook_url field  
  
<img src="https://cdn.discordapp.com/attachments/937406998201397278/1106861868758347836/image.png">  
  
## Integration with the bot in Telegram  
If the integration with the bot in Telegram is enabled, the two-factor authentication code will be requested through it,  
if necessary.  
  
! The application will not start until you send the bot the command /start  
  
<img src="https://cdn.discordapp.com/attachments/937406998201397278/1106862468912914442/image.png">  
  
## Available scripts  
### Clearing saved cookies and user agent  
Go to the application directory and type  
```  
npm run flush_settings  
```  
### Clearing logs in files  
```  
npm run flush_logs  
```  
  
## Configuration file  
### Description of the configuration file fields  
```json  
{
  "lolz_url": "link to the main domain lolz, the setting was added due to the frequent blocking of the resource, for example:https://zelenka.guru",
  "alwaysOn": "This setting shows the application that it is running as a process. true, or false",
  "license_token": "",
  "login": "Forum login",
  "password": "Your account password",
  "profile_url": "Link to your profile, for example: https://zelenka.guru/members/3603915/",
  "discord_webhook_url": "If you want to add webhook logging in discord, enter a link to it here, otherwise enter null",
  "telegram_bot_token": "Integration with bots in Telegram, enter either your token obtained from @BotFather here, or enter null",
  "ParseContestInterval": "Time in minutes in which to recheck draws, for the presence of new, enter a number here",
  "twoAuth": "Whether you have two factor authentication enabled on your account, either true or false"
}
```  
### Example of a completed configuration file  
In this configuration:  
- Disabled the integration with Discord and Telegram  
- Two factor authentication enabled  
- AlwaysOn mode disabled  
  
! For security purposes, the password has been replaced by asterisks  
  
```json  
{  
"lolz_url": "https://zelenka.guru",  
"alwaysOn": false,  
"license_token": "",  
"login": "mute0_O",  
"password": "********",  
"profile_url": "https://zelenka.guru/members/3603915/",  
"discord_webhook_url": null,  
"telegram_bot_token": null,  
"ParseContestInterval": 5,  
"twoAuth": true  
}  
```  
  
## License  
GNU GENERAL PUBLIC LICENSE Version 3
