import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

export interface CallPlaylist {
  id: string;
  name: string;
  description: string | null;
  playlist_type: "manual" | "auto";
  auto_query: Record<string, unknown> | null;
  is_shared: boolean;
  shared_with: string[];
  owner_agent_name: string | null;
  created_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  call_session_id: string;
  notes: string | null;
  display_order: number;
}

export function useCallPlaylists() {
  const [playlists, setPlaylists] = useState<CallPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("call_playlists").select("*").order("created_at", { ascending: false });
    if (error) logger.error("useCallPlaylists", error);
    else setPlaylists((data ?? []) as CallPlaylist[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createPlaylist = useCallback(async (p: Partial<CallPlaylist>) => {
    const { error } = await supabase.from("call_playlists").insert(p as never);
    if (error) { toast.error("Erro ao criar playlist"); return false; }
    toast.success("Playlist criada");
    refresh();
    return true;
  }, [refresh]);

  const addItem = useCallback(async (playlistId: string, callSessionId: string, notes?: string) => {
    const { error } = await supabase.from("playlist_items").insert({
      playlist_id: playlistId, call_session_id: callSessionId, notes: notes ?? null,
    } as never);
    if (error) { toast.error("Erro ao adicionar à playlist"); return false; }
    toast.success("Adicionado à playlist");
    return true;
  }, []);

  return { playlists, loading, refresh, createPlaylist, addItem };
}

export function usePlaylistItems(playlistId?: string) {
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playlistId) { setItems([]); setLoading(false); return; }
    supabase.from("playlist_items").select("*").eq("playlist_id", playlistId).order("display_order")
      .then(({ data, error }) => {
        if (error) logger.error("usePlaylistItems", error);
        else setItems((data ?? []) as PlaylistItem[]);
        setLoading(false);
      });
  }, [playlistId]);

  return { items, loading };
}
