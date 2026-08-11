//+------------------------------------------------------------------+
//|                                              LicenseTestEA.mq5   |
//|                        Copyright 2026, EA License Management System |
//|                                       https://ea-license-system  |
//+------------------------------------------------------------------+
#property copyright "EA License Management System"
#property link      "https://ea-license-system"
#property version   "1.00"
#property description "Expert Advisor Client with Remote REST API License Verification"

//--- Input Parameters
input group "=== LICENSE CONFIGURATION ==="
input string   InpServerURL            = "http://localhost:3000"; // License Server URL (e.g. https://your-app.vercel.app)
input string   InpProductCode          = "EA_STRADDLE";           // Product Code
input string   InpEAVersion            = "1.0.0";                 // EA Version
input int      InpCheckIntervalMinutes = 60;                      // License Re-verification Interval (Minutes)
input int      InpGracePeriodHours     = 24;                      // Grace Period when server offline (Hours)

//--- Global Variables
bool     g_IsLicenseValid        = false;
datetime g_LastValidCheckTime    = 0;
string   g_LicenseStatusMessage  = "UNVERIFIED";
string   g_ExpiresAt             = "N/A";
int      g_DaysRemaining         = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   Print("=================================================");
   Print("   EA LICENSE SYSTEM - INITIALIZING CLIENT EA    ");
   Print("=================================================");

   // Check timer interval
   int intervalSeconds = InpCheckIntervalMinutes * 60;
   if(intervalSeconds < 60) intervalSeconds = 60; // Minimum 1 minute

   // Set timer for periodic verification (NOT on tick)
   EventSetTimer(intervalSeconds);

   // Perform initial verification immediately
   VerifyLicense();

   if(!g_IsLicenseValid)
     {
      Print("[LICENSE ERROR] Initial verification failed: ", g_LicenseStatusMessage);
      Print("[LICENSE NOTICE] Trading disabled. Please register your Account ID: ", AccountInfoInteger(ACCOUNT_LOGIN));
     }
   else
     {
      Print("[LICENSE SUCCESS] EA License active until: ", g_ExpiresAt, " (", g_DaysRemaining, " days remaining)");
     }

   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
   Print("EA License Test Client Deinitialized. Reason code: ", reason);
  }

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
   // STRICT CONTROL: EA MUST NOT TRADE IF LICENSE IS INVALID
   if(!g_IsLicenseValid)
     {
      // Check grace period fallback
      if(IsGracePeriodActive())
        {
         // Allowed to continue trading temporarily during grace period
        }
      else
        {
         // Block all trading
         static datetime lastWarnTime = 0;
         if(TimeCurrent() - lastWarnTime > 300) // Warn every 5 minutes
           {
            Print("[TRADING BLOCKED] License invalid or expired. Account ID: ", AccountInfoInteger(ACCOUNT_LOGIN), " Status: ", g_LicenseStatusMessage);
            lastWarnTime = TimeCurrent();
           }
         return;
        }
     }

   // --- TRADING LOGIC GOES HERE ---
   // (Example: Straddle orders, indicators, execution, etc.)
  }

//+------------------------------------------------------------------+
//| Timer event function for periodic license verification           |
//+------------------------------------------------------------------+
void OnTimer()
  {
   Print("[LICENSE TIMER] Running scheduled license verification check...");
   VerifyLicense();
  }

//+------------------------------------------------------------------+
//| Perform WebRequest HTTP POST verification to License Server      |
//+------------------------------------------------------------------+
void VerifyLicense()
  {
   long accountLogin = AccountInfoInteger(ACCOUNT_LOGIN);
   string accountStr = IntegerToString(accountLogin);

   // Construct JSON payload
   string jsonPayload = StringFormat(
      "{\"mt5AccountId\":\"%s\",\"productCode\":\"%s\",\"eaVersion\":\"%s\"}",
      accountStr,
      InpProductCode,
      InpEAVersion
   );

   // Build request URL
   string url = InpServerURL;
   // Ensure no trailing slash
   if(StringSubstr(url, StringLen(url)-1, 1) == "/")
     url = StringSubstr(url, 0, StringLen(url)-1);
   url = url + "/api/license/verify";

   string headers = "Content-Type: application/json\r\nUser-Agent: MT5-EA-LicenseClient/1.0\r\n";
   char postData[];
   char resultData[];
   string resultHeaders;

   StringToCharArray(jsonPayload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   // Remove trailing null byte from string to char conversion
   if(ArraySize(postData) > 0 && postData[ArraySize(postData)-1] == 0)
     ArrayResize(postData, ArraySize(postData)-1);

   ResetLastError();
   int responseCode = WebRequest("POST", url, headers, 10000, postData, resultData, resultHeaders);

   if(responseCode == 200)
     {
      string responseText = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
      Print("[LICENSE API RESPONSE] HTTP 200 OK: ", responseText);

      // Parse JSON response
      bool isValid = false;
      if(StringFind(responseText, "\"valid\":true") >= 0 || StringFind(responseText, "\"valid\": true") >= 0)
        {
         isValid = true;
        }

      string status = ExtractJsonValue(responseText, "status");
      string expiresAt = ExtractJsonValue(responseText, "expiresAt");
      string daysRemainingStr = ExtractJsonValue(responseText, "daysRemaining");
      string reason = ExtractJsonValue(responseText, "reason");

      if(isValid && status == "ACTIVE")
        {
         g_IsLicenseValid = true;
         g_LastValidCheckTime = TimeCurrent();
         g_ExpiresAt = expiresAt;
         g_DaysRemaining = (int)StringToInteger(daysRemainingStr);
         g_LicenseStatusMessage = "ACTIVE";

         Print(StringFormat("[LICENSE VALID] Account %s | Product: %s | Status: ACTIVE | Expiry: %s | Days Left: %d",
            accountStr, InpProductCode, g_ExpiresAt, g_DaysRemaining));
        }
      else
        {
         g_IsLicenseValid = false;
         g_LicenseStatusMessage = (reason != "") ? reason : status;
         Print(StringFormat("[LICENSE INVALID] Account %s | Product: %s | Status: %s | Reason: %s",
            accountStr, InpProductCode, status, g_LicenseStatusMessage));
        }
     }
   else
     {
      int err = GetLastError();
      Print(StringFormat("[LICENSE ERROR] WebRequest failed. HTTP Code: %d, MQL5 Error: %d", responseCode, err));

      if(err == 4014) // ERR_WEBREQUEST_INVALID_URL
        {
         Print("==========================================================================");
         Print("[CRITICAL] WebRequest URL not allowed in MetaTrader 5!");
         Print("Please add the following URL to MT5 WebRequest whitelist:");
         Print("MT5 -> Tools -> Options -> Expert Advisors -> Check 'Allow WebRequest for listed URL'");
         Print("Add URL: ", InpServerURL);
         Print("==========================================================================");
        }

      // Handle server offline fallback via grace period
      if(IsGracePeriodActive())
        {
         Print(StringFormat("[GRACE PERIOD ACTIVE] Server offline/unreachable, but previous verification was valid within %d hours grace period.", InpGracePeriodHours));
        }
      else
        {
         g_IsLicenseValid = false;
         g_LicenseStatusMessage = "SERVER_UNREACHABLE";
         Print("[LICENSE BLOCKED] Server unreachable and grace period expired or unavailable.");
        }
     }
  }

//+------------------------------------------------------------------+
//| Check if Grace Period is active during server connection outage |
//+------------------------------------------------------------------+
bool IsGracePeriodActive()
  {
   if(g_LastValidCheckTime == 0) return false;

   datetime now = TimeCurrent();
   long secondsSinceLastValid = now - g_LastValidCheckTime;
   long maxGraceSeconds = InpGracePeriodHours * 3600;

   return (secondsSinceLastValid <= maxGraceSeconds);
  }

//+------------------------------------------------------------------+
//| Helper: Extract simple String/Number value from JSON key         |
//+------------------------------------------------------------------+
string ExtractJsonValue(string json, string key)
  {
   string searchPattern = "\"" + key + "\":";
   int pos = StringFind(json, searchPattern);
   if(pos < 0)
     {
      searchPattern = "\"" + key + "\" :";
      pos = StringFind(json, searchPattern);
     }
   if(pos < 0) return "";

   int start = pos + StringLen(searchPattern);
   // Skip whitespace
   while(start < StringLen(json) && (StringGetCharacter(json, start) == ' ' || StringGetCharacter(json, start) == '\t'))
      start++;

   // Check if quoted string or raw value
   ushort firstChar = StringGetCharacter(json, start);
   if(firstChar == '"')
     {
      start++;
      int end = StringFind(json, "\"", start);
      if(end > start)
         return StringSubstr(json, start, end - start);
     }
   else
     {
      int end = start;
      while(end < StringLen(json))
        {
         ushort c = StringGetCharacter(json, end);
         if(c == ',' || c == '}' || c == ']' || c == '\n' || c == '\r' || c == ' ')
            break;
         end++;
        }
      return StringSubstr(json, start, end - start);
     }

   return "";
  }
//+------------------------------------------------------------------+
