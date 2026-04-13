import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
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

export interface DailyStats {
  date: string;
  count: number;
}

export interface ReasonStats {
  reason: string;
  count: number;
}

export interface CountryStats {
  country: string;
  count: number;
}

export function useBlockedAccessLogs() {
  const [logs, setLogs] = useState<BlockedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [reasonStats, setReasonStats] = useState<ReasonStats[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);

  const uniqueCountriesList = Array.from(new Set(logs.map(l => l.country).filter(Boolean))) as string[];
  const uniqueReasonsList = Array.from(new Set(logs.map(l => l.reason).filter(Boolean))) as string[];

  const processStats = useCallback((data: BlockedLog[], startDate: Date) => {
    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    const dailyMap = new Map<string, number>();
    days.forEach(day => dailyMap.set(format(day, 'yyyy-MM-dd'), 0));
    data.forEach(log => {
      const dateKey = format(parseISO(log.created_at), 'yyyy-MM-dd');
      if (dailyMap.has(dateKey)) dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
    });
    setDailyStats(Array.from(dailyMap.entries()).map(([date, count]) => ({
      date: format(parseISO(date), 'dd/MM', { locale: ptBR }), count
    })));

    const reasonMap = new Map<string, number>();
    data.forEach(log => {
      const reason = log.reason || 'Desconhecido';
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    });
    setReasonStats(Array.from(reasonMap.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count));

    const countryMap = new Map<string, number>();
    data.forEach(log => {
      const country = log.country || 'Desconhecido';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    setCountryStats(Array.from(countryMap.entries()).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 5));
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), parseInt(dateRange));
      const { data, error } = await supabase
        .from('blocked_access_logs')
        .select('*')
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
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      log.ip_address?.toLowerCase().includes(searchLower) ||
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.reason?.toLowerCase().includes(searchLower) ||
      log.country?.toLowerCase().includes(searchLower) ||
      log.city?.toLowerCase().includes(searchLower)
    );
    const matchesCountry = countryFilter === 'all' || log.country === countryFilter;
    const matchesReason = reasonFilter === 'all' || log.reason === reasonFilter;
    return matchesSearch && matchesCountry && matchesReason;
  });

  const clearFilters = () => { setSearchTerm(''); setCountryFilter('all'); setReasonFilter('all'); };
  const hasActiveFilters = searchTerm || countryFilter !== 'all' || reasonFilter !== 'all';
  const totalBlocks = logs.length;
  const uniqueIPs = new Set(logs.map(l => l.ip_address)).size;
  const uniqueCountries = new Set(logs.map(l => l.country).filter(Boolean)).size;

  return {
    logs, loading, searchTerm, setSearchTerm, dateRange, setDateRange,
    countryFilter, setCountryFilter, reasonFilter, setReasonFilter,
    dailyStats, reasonStats, countryStats, uniqueCountriesList, uniqueReasonsList,
    filteredLogs, clearFilters, hasActiveFilters, totalBlocks, uniqueIPs, uniqueCountries,
    fetchLogs,
  };
}
