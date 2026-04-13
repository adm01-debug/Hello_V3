import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';

export interface BlockedLog {
  id: string;
  ip_address: string;
  reason: string;
  user_email: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  country_code: string | null;
  created_at: string;
}

export interface DailyStats { date: string; count: number; }
export interface ReasonStats { reason: string; count: number; }
export interface CountryStats { country: string; count: number; }

export function useBlockedAccessLogs() {
  const [logs, setLogs] = useState<BlockedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7');
  const [countryFilter, setCountryFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [reasonStats, setReasonStats] = useState<ReasonStats[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);

  const uniqueCountriesList = Array.from(new Set(logs.map(l => l.country).filter(Boolean))) as string[];
  const uniqueReasonsList = Array.from(new Set(logs.map(l => l.reason).filter(Boolean))) as string[];

  const processStats = useCallback((data: BlockedLog[], startDate: Date) => {
    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    const dailyMap = new Map<string, number>();
    days.forEach(day => dailyMap.set(format(day, 'yyyy-MM-dd'), 0));
    data.forEach(log => { const k = format(parseISO(log.created_at), 'yyyy-MM-dd'); if (dailyMap.has(k)) dailyMap.set(k, (dailyMap.get(k) || 0) + 1); });
    setDailyStats(Array.from(dailyMap.entries()).map(([date, count]) => ({ date: format(parseISO(date), 'dd/MM', { locale: ptBR }), count })));

    const reasonMap = new Map<string, number>();
    data.forEach(log => { const r = log.reason || 'Desconhecido'; reasonMap.set(r, (reasonMap.get(r) || 0) + 1); });
    setReasonStats(Array.from(reasonMap.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count));

    const countryMap = new Map<string, number>();
    data.forEach(log => { const c = log.country || 'Desconhecido'; countryMap.set(c, (countryMap.get(c) || 0) + 1); });
    setCountryStats(Array.from(countryMap.entries()).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 5));
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), parseInt(dateRange));
      const { data, error } = await supabase.from('blocked_access_logs').select('*')
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(new Date()).toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLogs(data || []);
      processStats(data || [], startDate);
    } catch (error) {
      logger.error('Error fetching blocked logs:', error);
      toast.error('Erro ao carregar histórico de bloqueios');
    } finally {
      setLoading(false);
    }
  }, [dateRange, processStats]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || log.ip_address?.toLowerCase().includes(s) || log.user_email?.toLowerCase().includes(s) || log.reason?.toLowerCase().includes(s) || log.country?.toLowerCase().includes(s) || log.city?.toLowerCase().includes(s);
    return matchesSearch && (countryFilter === 'all' || log.country === countryFilter) && (reasonFilter === 'all' || log.reason === reasonFilter);
  });

  const clearFilters = () => { setSearchTerm(''); setCountryFilter('all'); setReasonFilter('all'); };
  const hasActiveFilters = searchTerm || countryFilter !== 'all' || reasonFilter !== 'all';
  const totalBlocks = logs.length;
  const uniqueIPs = new Set(logs.map(l => l.ip_address)).size;
  const uniqueCountries = new Set(logs.map(l => l.country).filter(Boolean)).size;

  return {
    logs, loading, filteredLogs,
    searchTerm, setSearchTerm, dateRange, setDateRange,
    countryFilter, setCountryFilter, reasonFilter, setReasonFilter,
    dailyStats, reasonStats, countryStats,
    uniqueCountriesList, uniqueReasonsList,
    clearFilters, hasActiveFilters,
    totalBlocks, uniqueIPs, uniqueCountries,
    fetchLogs,
  };
}
