
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
}

interface LocationInfo {
  ip: string;
  country?: string;
  city?: string;
  countryCode?: string;
}

function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera')) browser = 'Opera';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // Detect device type
  let device = 'Desktop';
  if (/Mobile|Android|iPhone/.test(ua)) device = 'Mobile';
  else if (/iPad|Tablet/.test(ua)) device = 'Tablet';
  
  return { browser, os, device };
}

async function getLocationInfo(): Promise<LocationInfo> {
  try {
    const response = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(5000) 
    });
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.ip,
        country: data.country_name,
        city: data.city,
        countryCode: data.country_code,
      };
    }
  } catch (error) {
    console.warn('[DeviceDetection] Erro ao obter localização:', error);
  }
  
  return { ip: 'Unknown' };
}

function generateDeviceFingerprint(deviceInfo: DeviceInfo): string {
  const components = [
    deviceInfo.browser,
    deviceInfo.os,
    deviceInfo.device,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
  ];
  return btoa(components.join('|'));
}

export function useDeviceDetection() {
  const checkAndNotifyNewDevice = useCallback(async (userId: string, userEmail: string, userName?: string) => {
    try {
      const deviceInfo = getDeviceInfo();
      const locationInfo = await getLocationInfo();
      const fingerprint = generateDeviceFingerprint(deviceInfo);
      
      // Check existing sessions for this user
      const { data: existingSessions, error } = await supabase
        .from('active_sessions')
        .select('ip_address, device_info')
        .eq('user_id', userId);
      
      if (error) {
        console.error('[DeviceDetection] Erro ao verificar sessões:', error);
        return { isNewDevice: false, deviceInfo, locationInfo };
      }
      
      // Check if this is a new IP or device
      const existingIPs = new Set(existingSessions?.map(s => s.ip_address) || []);
      const existingFingerprints = new Set(
        existingSessions?.map(s => {
          const info = s.device_info as DeviceInfo | null;
          if (info) {
            return generateDeviceFingerprint(info);
          }
          return null;
        }).filter(Boolean) || []
      );
      
      const isNewIP = !existingIPs.has(locationInfo.ip) && locationInfo.ip !== 'Unknown';
      const isNewBrowser = !existingFingerprints.has(fingerprint);
      const isNewDevice = isNewIP || isNewBrowser;
      
      console.log('[DeviceDetection] Verificação:', {
        isNewIP,
        isNewBrowser,
        isNewDevice,
        currentIP: locationInfo.ip,
        existingIPs: Array.from(existingIPs),
      });
      
      // If new device/IP, send notification
      if (isNewDevice && existingSessions && existingSessions.length > 0) {
        try {
          const { error: notifyError } = await supabase.functions.invoke('notify-new-device', {
            body: {
              email: userEmail,
              userName,
              ip: locationInfo.ip,
              country: locationInfo.country,
              city: locationInfo.city,
              browser: deviceInfo.browser,
              os: deviceInfo.os,
              device: deviceInfo.device,
              timestamp: new Date().toISOString(),
              isNewIP,
              isNewBrowser,
            },
          });
          
          if (notifyError) {
            console.error('[DeviceDetection] Erro ao enviar notificação:', notifyError);
          } else {
            console.log('[DeviceDetection] Notificação enviada com sucesso');
          }
        } catch (invokeError) {
          console.error('[DeviceDetection] Erro ao invocar função:', invokeError);
        }
      }
      
      return { isNewDevice, deviceInfo, locationInfo, fingerprint };
    } catch (error) {
      console.error('[DeviceDetection] Erro geral:', error);
      return { isNewDevice: false };
    }
  }, []);
  
  return { checkAndNotifyNewDevice, getDeviceInfo, getLocationInfo };
}
