import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { loadMoreMock, useRecordingsMock } = vi.hoisted(() => ({
  loadMoreMock: vi.fn(),
  useRecordingsMock: vi.fn(),
}));

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/hooks/useDebouncedSearchParam', () => ({
  useDebouncedSearchParam: () => ({ inputValue: '', debouncedValue: '', setValue: vi.fn(), clear: vi.fn() }),
}));
vi.mock('@/hooks/useRecordings', () => ({ useRecordings: useRecordingsMock }));
vi.mock('@/components/recordings/TranscriptionDialog', () => ({ TranscriptionDialog: () => <div /> }));

import Recordings from '../Recordings';

const gravacao = {
  id: 'r1', file_path: 'a/b.webm', conference_id: null, call_session_id: 'cs1',
  duration_seconds: 30, file_size_bytes: 1024, participant_count: 2,
  recorded_at: '2024-01-01T10:00:00Z', created_at: '2024-01-01T10:00:00Z',
};

const base = {
  recordings: [gravacao], allRecordingsCount: 50, totalCount: 120, loading: false, loadingMore: false,
  hasMore: true, loadMore: loadMoreMock, searchTerm: '', setSearchTerm: vi.fn(),
  playingId: null, isPlaying: false, currentTime: 0, duration: 0, volume: 1, setVolume: vi.fn(),
  isMuted: false, setIsMuted: vi.fn(), transcribing: null, analyzingSentiment: false,
  transcriptionDialog: false, setTranscriptionDialog: vi.fn(), currentTranscription: null,
  currentRecording: undefined, handlePlay: vi.fn(), handleSeek: vi.fn(), handleSkip: vi.fn(),
  handleDownload: vi.fn(), handleDelete: vi.fn(), handleTranscribe: vi.fn(), handleAnalyzeSentiment: vi.fn(),
};

describe('Recordings (paginacao)', () => {
  beforeEach(() => { vi.clearAllMocks(); useRecordingsMock.mockReturnValue(base); });

  it('mostra o total real do banco e carrega a proxima pagina ao clicar', () => {
    // Etapa 236: sem .range() o PostgREST cortava em 1000 linhas e o cracha dizia
    // "50 gravações" como se fosse o total da conta.
    render(<Recordings />);

    expect(screen.getByText('50 de 120 gravações')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /carregar mais/i }));
    expect(loadMoreMock).toHaveBeenCalledTimes(1);
  });

  it('esconde o botao quando nao ha mais paginas', () => {
    useRecordingsMock.mockReturnValue({ ...base, hasMore: false, allRecordingsCount: 120, totalCount: 120 });
    render(<Recordings />);

    expect(screen.queryByRole('button', { name: /carregar mais/i })).toBeNull();
    expect(screen.getByText('120 gravações')).toBeTruthy();
  });
});
