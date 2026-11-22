import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { AuthResult } from '../core/auth';
import {
  completeGoogleRedirect, createEmailAccount, observeAuth, sendPasswordReset,
  signInWithEmail, signInWithGoogle, signOut, updateDisplayName
} from '../core/auth';
import { collectPrincipiaData, downloadPrincipiaBackup, restorePrincipiaBackup } from '../core/backup';
import type { PrincipiaBackup } from '../core/backup';
import { deleteLibraryBlob, getLibraryBlob, listLibraryItems, saveLibraryFiles } from '../core/library';
import type { PrincipiaLibraryItem } from '../core/library';
import { calculateMotion, calculateKineticEnergy, calculateProjectile } from '../core/physics';
import type { MotionResult, ProjectileResult } from '../core/physics';
import { restorePrincipiaDataFromCloud, syncPrincipiaDataToCloud, restoreProgressFromCloud, syncProgressToCloud, publishPrincipiaContentToCloud, restorePublishedPrincipiaContentFromCloud } from '../core/cloud-data';
import { getCorrectOptionIndexes, isQuestionCorrect, validateQuizQuestions, gradeQuiz } from '../core/quiz';
import type { QuizQuestion as Question } from '../core/quiz';
import { LearningSuite } from '../features/learning/LearningSuite';
import { AdvancedPhysicsLab } from '../features/physics/AdvancedPhysicsLab';
import { BottomNavigation } from '../features/navigation/BottomNavigation';
import { summarizeText } from '../core/text-tools';
import { sections } from './navigation';
import { parseArray, countNodes, hasNode, countQuestions } from './tree-utils';
import type { Section, AuthMode as Mode, QuizEditorState, CustomAIProvider, LearningNode } from './types';

export function App() {
  const [account, setAccount] = useState<AuthResult | null>(null);
  const [section, setSection] = useState<Section>('home');
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [chatProvider, setChatProvider] = useState(() => localStorage.getItem('principia_v2_ai_selected') || 'chatgpt');
  const [customAIProviders, setCustomAIProviders] = useState<CustomAIProvider[]>(() => { try { const data = JSON.parse(localStorage.getItem('principia_v2_ai_custom') || '[]'); return Array.isArray(data) ? data.filter((item: any) => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.url === 'string') : []; } catch { return []; } });
  const [chatDraft, setChatDraft] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user'; text: string; at: string }>>([]);
  const [chatNotice, setChatNotice] = useState('');
  const [libraryItems, setLibraryItems] = useState<PrincipiaLibraryItem[]>([]);
  const [libraryNotice, setLibraryNotice] = useState('');
  const [libraryPreview, setLibraryPreview] = useState<PrincipiaLibraryItem | null>(null);
  const [libraryPreviewUrl, setLibraryPreviewUrl] = useState('');
  const [musicSource, setMusicSource] = useState(() => { try { return JSON.parse(localStorage.getItem('principia_v2_music_island') || '{}').source || 'spotify'; } catch { return 'spotify'; } });
  const [musicUrl, setMusicUrl] = useState(() => { try { return JSON.parse(localStorage.getItem('principia_v2_music_island') || '{}').url || 'https://open.spotify.com/'; } catch { return 'https://open.spotify.com/'; } });
  const [musicTrack, setMusicTrack] = useState(() => { try { return JSON.parse(localStorage.getItem('principia_v2_music_island') || '{}').track || ''; } catch { return ''; } });
  const [musicFocus, setMusicFocus] = useState(() => { try { return !!JSON.parse(localStorage.getItem('principia_v2_music_island') || '{}').focus; } catch { return false; } });
  const [musicCustomSources, setMusicCustomSources] = useState<Array<{name:string;url:string}>>(() => { try { const list=JSON.parse(localStorage.getItem('principia_v2_music_island') || '{}').customSources; return Array.isArray(list)?list:[]; } catch { return []; } });
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [browserAddress, setBrowserAddress] = useState('https://www.google.com/');
  const [browserUrl, setBrowserUrl] = useState('');
  const [browserHistory, setBrowserHistory] = useState<string[]>([]);
  const [browserIndex, setBrowserIndex] = useState(-1);
  const [browserReload, setBrowserReload] = useState(0);
  const [browserNotice, setBrowserNotice] = useState('');
  const [motionInput, setMotionInput] = useState({ u: '0', a: '9.8', t: '2' });
  const [motionResult, setMotionResult] = useState<MotionResult | null>(null);
  const [energyInput, setEnergyInput] = useState({ mass: '1', speed: '10' });
  const [energyResult, setEnergyResult] = useState<number | null>(null);
  const [projectileInput, setProjectileInput] = useState({ speed: '20', angle: '45', gravity: '9.80665' });
  const [projectileResult, setProjectileResult] = useState<ProjectileResult | null>(null);
  const [physicsNotice, setPhysicsNotice] = useState('');
  const [physicsBusy, setPhysicsBusy] = useState(false);

  const [gamePlatforms, setGamePlatforms] = useState<Array<{id:string;name:string;icon:string;url:string;custom?:boolean}>>(() => {
    const defaults = [{id:'chesscom',name:'Chess.com',icon:'♟️',url:'https://www.chess.com/'},{id:'lichess',name:'Lichess',icon:'♜',url:'https://lichess.org/'},{id:'sudoku',name:'Sudoku',icon:'🔢',url:'https://www.sudoku.com/'},{id:'geoguessr',name:'GeoGuessr',icon:'🌍',url:'https://www.geoguessr.com/'}];
    try { const saved = JSON.parse(localStorage.getItem('principia_game_platforms') || 'null'); return Array.isArray(saved) ? saved : defaults; } catch { return defaults; }
  });
  const [activeGameId, setActiveGameId] = useState(() => localStorage.getItem('principia_active_game_tab') || 'chesscom');



  const chatStorageKey = `principia_v2_chat:${account?.user.uid || 'guest'}:${chatProvider}`;
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(chatStorageKey) || '[]');
      setChatMessages(Array.isArray(parsed) ? parsed.filter((item: any) => item && item.role === 'user' && typeof item.text === 'string' && typeof item.at === 'string').slice(-100) : []);
    } catch { setChatMessages([]); }
    setChatNotice('');
  }, [chatStorageKey]);

  const [status, setStatus] = useState('');
  const [profileName, setProfileName] = useState('');
  const [lightTheme, setLightTheme] = useState(() => localStorage.getItem('principia_v2_theme') === 'light');
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [backupVersion, setBackupVersion] = useState(0);
  const [lessonPath, setLessonPath] = useState<LearningNode[]>([]);
  const [activeLesson, setActiveLesson] = useState<LearningNode | null>(null);
  const [lessonEditor, setLessonEditor] = useState<{ id?: string; name: string; icon: string; type: 'lesson' | 'folder'; content: string; note: string; video: string } | null>(null);
  const [quizPath, setQuizPath] = useState<LearningNode[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<LearningNode | null>(null);
  const [quizEditor, setQuizEditor] = useState<QuizEditorState | null>(null);
  const [answers, setAnswers] = useState<Record<number, number | number[] | string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [lessonTool, setLessonTool] = useState<'note' | 'files' | 'submit' | 'simulation' | 'media'>('note');
  const [privateNote, setPrivateNote] = useState('');
  const [assignmentText, setAssignmentText] = useState('');
  const [lessonFiles, setLessonFiles] = useState<Array<{ name: string; type: string; size: number; dataUrl: string; addedAt: string }>>([]);
  const [simulationSubject, setSimulationSubject] = useState('physics');
  const [workspaceNotice, setWorkspaceNotice] = useState('');
  const [mediaVideoUrl, setMediaVideoUrl] = useState('');
  const [mediaOcrStatus, setMediaOcrStatus] = useState('');
  const [mediaOcrBusy, setMediaOcrBusy] = useState(false);
  const [mediaSourceLang, setMediaSourceLang] = useState('en');
  const [mediaListening, setMediaListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);
  const mediaVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => () => { if (mediaVideoUrl) URL.revokeObjectURL(mediaVideoUrl); }, [mediaVideoUrl]);
  useEffect(() => () => { speechRecognitionRef.current?.stop?.(); }, []);
  const currentLessonStorageKey = activeLesson ? `principia_v2_lesson_workspace:${account?.user.uid || 'guest'}:${[...lessonPath, activeLesson].map(item => item.id || item.name).join('::')}` : '';
  useEffect(() => {
    if (!currentLessonStorageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(currentLessonStorageKey) || '{}');
      setPrivateNote(typeof saved.note === 'string' ? saved.note : '');
      setAssignmentText(typeof saved.submission === 'string' ? saved.submission : '');
      setLessonFiles(Array.isArray(saved.files) ? saved.files.filter((file: any) => file && typeof file.name === 'string' && typeof file.dataUrl === 'string') : []);
      setActiveLesson(current => current ? { ...current, transcript: saved.transcript ?? current.transcript, translatedTranscript: saved.translatedTranscript ?? current.translatedTranscript, videoOcr: saved.videoOcr ?? current.videoOcr, summary: saved.summary ?? current.summary, dubLang: saved.dubLang ?? current.dubLang } : current);
      setLessonTool('note');
      setWorkspaceNotice('');
    } catch {
      setPrivateNote('');
      setAssignmentText('');
      setLessonFiles([]);
    }
  }, [currentLessonStorageKey]);
  useEffect(() => {
    if (!account) return;
    let active = true;
    setLibraryItems([]); setLibraryPreview(null); setLibraryPreviewUrl('');
    listLibraryItems(account.user.uid).then(items => { if (active) setLibraryItems(items); })
      .catch(error => { if (active) setLibraryNotice(error?.message || 'Không tải được thư viện tài liệu.'); });
    return () => { active = false; };
  }, [account?.user.uid]);
  useEffect(() => () => { if (libraryPreviewUrl) URL.revokeObjectURL(libraryPreviewUrl); }, [libraryPreviewUrl]);
  useEffect(() => {
    try { localStorage.setItem('principia_v2_music_island', JSON.stringify({ source: musicSource, url: musicUrl, track: musicTrack, focus: musicFocus, customSources: musicCustomSources })); } catch {}
    document.body.classList.toggle('principia-focus-mode', musicFocus);
    return () => document.body.classList.remove('principia-focus-mode');
  }, [musicSource, musicUrl, musicTrack, musicFocus, musicCustomSources]);
  useEffect(() => { try { localStorage.setItem('principia_game_platforms', JSON.stringify(gamePlatforms)); } catch {} }, [gamePlatforms]);
  useEffect(() => { localStorage.setItem('principia_active_game_tab', activeGameId); }, [activeGameId]);
  useEffect(() => {
    if (!focusRunning) return;
    const timer = window.setInterval(() => setFocusSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [focusRunning]);
  useEffect(() => { if (focusSeconds === 0) setFocusRunning(false); }, [focusSeconds]);

  const musicEmbedUrl = (() => {
    try {
      const url = new URL(musicUrl);
      if (musicSource === 'spotify' && url.hostname.endsWith('spotify.com')) return 'https://open.spotify.com/embed' + url.pathname.replace(/^\/embed/, '') + url.search;
      if (musicSource === 'youtube') {
        const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || (url.pathname.match(/\/(?:shorts|live|embed)\/([^/]+)/) || [])[1];
        return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) : '';
      }
      if (musicSource === 'soundcloud' && url.hostname.endsWith('soundcloud.com')) return 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url.href) + '&visual=true';
      return '';
    } catch { return ''; }
  })();
  const addMusicSource = () => {
    const name = prompt('Tên nền tảng nhạc:')?.trim();
    if (!name) return;
    const raw = prompt('Địa chỉ website (https://…):')?.trim();
    if (!raw) return;
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
      const next = [...musicCustomSources, { name: name.slice(0, 35), url: url.href }];
      setMusicCustomSources(next); setMusicSource('custom:' + (next.length - 1)); setMusicUrl(url.href);
    } catch { setLibraryNotice('Địa chỉ nền tảng không hợp lệ.'); }
  };
  const formatFocusTime = (seconds: number) => String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  const runMotionCalculation = async () => {
    setPhysicsBusy(true); setPhysicsNotice('');
    try { setMotionResult(await calculateMotion(Number(motionInput.u), Number(motionInput.a), Number(motionInput.t))); }
    catch (error: any) { setPhysicsNotice(error?.message || 'Không tính được chuyển động.'); }
    finally { setPhysicsBusy(false); }
  };
  const runEnergyCalculation = async () => {
    setPhysicsBusy(true); setPhysicsNotice('');
    try { setEnergyResult(await calculateKineticEnergy(Number(energyInput.mass), Number(energyInput.speed))); }
    catch (error: any) { setPhysicsNotice(error?.message || 'Không tính được động năng.'); }
    finally { setPhysicsBusy(false); }
  };
  const runProjectileCalculation = async () => {
    setPhysicsBusy(true); setPhysicsNotice('');
    try { setProjectileResult(await calculateProjectile(Number(projectileInput.speed), Number(projectileInput.angle), Number(projectileInput.gravity))); }
    catch (error: any) { setPhysicsNotice(error?.message || 'Không tính được chuyển động ném xiên.'); }
    finally { setPhysicsBusy(false); }
  };
  const addGamePlatform = () => {
    const name = prompt('Tên nền tảng (ví dụ: Cờ vua):')?.trim();
    if (!name) return;
    const raw = prompt('Địa chỉ website (https://…):')?.trim();
    if (!raw) return;
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
      const id = 'custom-' + Date.now();
      setGamePlatforms(current => [...current, { id, name: name.slice(0, 40), icon: '🎮', url: url.href, custom: true }]);
      setActiveGameId(id);
    } catch { setBrowserNotice('URL trò chơi không hợp lệ.'); }
  };
  const removeGamePlatform = (id: string) => {
    const item = gamePlatforms.find(game => game.id === id);
    if (!item?.custom || !confirm('Xóa nền tảng ' + item.name + '?')) return;
    const next = gamePlatforms.filter(game => game.id !== id);
    setGamePlatforms(next); if (activeGameId === id) setActiveGameId(next[0]?.id || '');
  };
  const navigateMiniBrowser = (raw = browserAddress) => {
    try {
      const url = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : 'https://' + raw.trim());
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      const next = [...browserHistory.slice(0, browserIndex + 1), url.href].slice(-30);
      setBrowserHistory(next); setBrowserIndex(next.length - 1); setBrowserUrl(url.href); setBrowserAddress(url.href); setBrowserNotice('');
    } catch { setBrowserNotice('Địa chỉ không hợp lệ. Chỉ hỗ trợ website http hoặc https.'); }
  };

  const handleLibraryUpload = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length || !account) return;
    const accepted = files.filter(file => file.size <= 100_000_000);
    if (accepted.length !== files.length) setLibraryNotice('Đã bỏ qua tệp vượt quá 100 MB.');
    try {
      const items = await saveLibraryFiles(accepted, account.user.uid);
      setLibraryItems(items); setLibraryNotice(`Đã lưu ${accepted.length} tài liệu ngoại tuyến trên thiết bị này.`);
    } catch (error: any) { setLibraryNotice(error?.message || 'Không thể lưu tài liệu.'); }
    finally { input.value = ''; }
  };
  const openLibraryPreview = async (item: PrincipiaLibraryItem) => {
    if (!account) return;
    try {
      const blob = await getLibraryBlob(item.id, account.user.uid);
      if (!blob) throw new Error('Không tìm thấy tệp trong kho tài liệu.');
      if (libraryPreviewUrl) URL.revokeObjectURL(libraryPreviewUrl);
      setLibraryPreviewUrl(URL.createObjectURL(blob)); setLibraryPreview(item);
    } catch (error: any) { setLibraryNotice(error?.message || 'Không mở được tài liệu.'); }
  };
  const removeLibraryItem = async (item: PrincipiaLibraryItem) => {
    if (!account || !confirm(`Xóa “${item.name}” khỏi thư viện trên thiết bị này?`)) return;
    try {
      await deleteLibraryBlob(item.id, account.user.uid);
      setLibraryItems(await listLibraryItems(account.user.uid));
      if (libraryPreview?.id === item.id) { setLibraryPreview(null); setLibraryPreviewUrl(''); }
      setLibraryNotice('Đã xóa tài liệu.');
    } catch (error: any) { setLibraryNotice(error?.message || 'Không xóa được tài liệu.'); }
  };

  const handleLessonFiles = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const selected = Array.from(input.files || []);
    if (!selected.length) return;
    const maxFileBytes = 250_000;
    const accepted = selected.filter(file => file.size <= maxFileBytes);
    if (accepted.length !== selected.length) setWorkspaceNotice('Một số tệp vượt quá giới hạn 250 KB nên không được thêm.');
    try {
      const added = await Promise.all(accepted.map(file => new Promise<{ name: string; type: string; size: number; dataUrl: string; addedAt: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
          ? resolve({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: reader.result, addedAt: new Date().toISOString() })
          : reject(new Error('Không đọc được tệp.'));
        reader.onerror = () => reject(new Error('Không đọc được tệp.'));
        reader.readAsDataURL(file);
      })));
      const next = [...lessonFiles, ...added].slice(-8);
      setLessonFiles(next);
      saveLessonWorkspace({ files: next });
      setWorkspaceNotice('Đã thêm tệp vào tài liệu bài học trên thiết bị này.');
    } catch (error: any) {
      setWorkspaceNotice(error?.message || 'Không thể thêm tệp.');
    } finally { input.value = ''; }
  };
  const removeLessonFile = (name: string, addedAt: string) => {
    const next = lessonFiles.filter(file => !(file.name === name && file.addedAt === addedAt));
    setLessonFiles(next);
    saveLessonWorkspace({ files: next });
  };
  const saveLessonWorkspace = (patch: { note?: string; submission?: string; files?: typeof lessonFiles; transcript?: string; translatedTranscript?: string; videoOcr?: string; summary?: string; dubLang?: string }) => {
    if (!currentLessonStorageKey) return;
    try {
      const current = JSON.parse(localStorage.getItem(currentLessonStorageKey) || '{}');
      localStorage.setItem(currentLessonStorageKey, JSON.stringify({ ...current, ...patch, updatedAt: new Date().toISOString() }));
      setWorkspaceNotice('Đã lưu trên tài khoản của thiết bị này.');
    } catch {
      setWorkspaceNotice('Không lưu được. Bộ nhớ trình duyệt có thể đã đầy.');
    }
  };

  const startLiveTranscript = () => {
    const browser = window as any;
    const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Recognition) { setMediaOcrStatus('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói trực tiếp. Hãy dùng Chrome hoặc Edge bản mới.'); return; }
    if (speechRecognitionRef.current) { speechRecognitionRef.current.stop(); speechRecognitionRef.current = null; }
    const recognition = new Recognition();
    recognition.lang = mediaSourceLang === 'auto' ? 'en-US' : mediaSourceLang === 'vi' ? 'vi-VN' : mediaSourceLang === 'ja' ? 'ja-JP' : mediaSourceLang === 'ko' ? 'ko-KR' : mediaSourceLang === 'fr' ? 'fr-FR' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => { setMediaListening(true); setMediaOcrStatus('Đang nghe và nhận dạng lời nói…'); };
    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const segment = String(event.results[index][0]?.transcript || '').trim();
        if (event.results[index].isFinal) finalText += segment + ' ';
        else interimText += segment + ' ';
      }
      if (finalText) setActiveLesson(current => {
        if (!current) return current;
        const transcript = [current.transcript?.trim(), finalText.trim()].filter(Boolean).join(' ');
        return { ...current, transcript };
      });
      if (interimText) setMediaOcrStatus('Đang nhận dạng: ' + interimText.trim());
      else if (finalText) setMediaOcrStatus('Đã nhận dạng thêm lời thoại. Bấm Dừng và lưu transcript khi hoàn tất.');
    };
    recognition.onerror = (event: any) => setMediaOcrStatus(event.error === 'not-allowed' ? 'Bạn chưa cấp quyền micro cho trình duyệt.' : 'Nhận dạng giọng nói gặp lỗi: ' + String(event.error || 'unknown'));
    recognition.onend = () => { setMediaListening(false); speechRecognitionRef.current = null; };
    speechRecognitionRef.current = recognition;
    try { recognition.start(); } catch (error: any) { setMediaListening(false); setMediaOcrStatus(error?.message || 'Không thể bắt đầu nhận dạng giọng nói.'); }
  };
  const stopLiveTranscript = () => {
    speechRecognitionRef.current?.stop?.();
    speechRecognitionRef.current = null;
    setMediaListening(false);
    setMediaOcrStatus('Đã dừng nhận dạng giọng nói. Hãy lưu transcript để giữ nội dung.');
  };
  const translateMediaTranscript = async () => {
    const sourceText = (activeLesson?.transcript || '').trim();
    if (!sourceText) { setMediaOcrStatus('Hãy nhập transcript trước khi dịch.'); return; }
    const targetMap: Record<string,string> = { 'vi-VN':'vi', 'en-US':'en', 'ja-JP':'ja', 'ko-KR':'ko', 'fr-FR':'fr' };
    const target = targetMap[activeLesson?.dubLang || 'vi-VN'] || 'vi';
    if (mediaSourceLang === target) { setMediaOcrStatus('Ngôn ngữ nguồn và đích đang giống nhau.'); return; }
    setMediaOcrBusy(true); setMediaOcrStatus('Đang dịch transcript qua MyMemory…');
    try {
      const chunks = sourceText.match(/[\s\S]{1,430}(?:\s|$)/g) || [sourceText];
      const translated: string[] = [];
      for (let index = 0; index < chunks.length; index++) {
        const query = chunks[index].trim();
        if (!query) continue;
        const pair = (mediaSourceLang === 'auto' ? 'en' : mediaSourceLang) + '|' + target;
        const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(query) + '&langpair=' + encodeURIComponent(pair);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Dịch vụ dịch đang bận (' + response.status + ').');
        const json = await response.json();
        if (json.responseStatus !== 200) throw new Error(json.responseDetails || 'Không dịch được đoạn văn.');
        translated.push(String(json.responseData?.translatedText || ''));
        setMediaOcrStatus('Đã dịch ' + (index + 1) + '/' + chunks.length + ' đoạn…');
      }
      const result = translated.join(' ');
      setActiveLesson(current => current ? { ...current, translatedTranscript: result } : current);
      saveLessonMedia({ translatedTranscript: result });
      setMediaOcrStatus('Đã dịch xong transcript.');
    } catch (error: any) { setMediaOcrStatus(error?.message || 'Dịch transcript thất bại.'); }
    finally { setMediaOcrBusy(false); }
  };

  const saveLessonMedia = (patch: Partial<Pick<LearningNode, 'transcript' | 'translatedTranscript' | 'videoOcr' | 'summary' | 'dubLang'>>) => {
    if (!activeLesson) return;
    if (!account?.isAdmin) {
      saveLessonWorkspace(patch);
      setActiveLesson(current => current ? { ...current, ...patch } : current);
      setWorkspaceNotice('Đã lưu ghi chú media cá nhân trên thiết bị này; nội dung khóa học chung không bị thay đổi.');
      return;
    }
    try {
      const tree = JSON.parse(localStorage.getItem('principia_v2_lessons') || 'null') as LearningNode[] | null;
      if (!tree) throw new Error('Không tìm thấy dữ liệu bài học.');
      const update = (nodes: LearningNode[]): boolean => {
        for (const node of nodes) {
          if (node.id === activeLesson.id) { Object.assign(node, patch); return true; }
          if (node.children && update(node.children)) return true;
        }
        return false;
      };
      if (!update(tree)) throw new Error('Không tìm thấy bài học trong dữ liệu cục bộ.');
      localStorage.setItem('principia_v2_lessons', JSON.stringify(tree));
      setBackupVersion(value => value + 1);
      setActiveLesson(current => current ? { ...current, ...patch } : current);
      setWorkspaceNotice('Đã lưu dữ liệu media vào kho bài học trên thiết bị này.');
    } catch (error: any) { setWorkspaceNotice(error?.message || 'Không thể lưu dữ liệu media.'); }
  };
  const handleMediaVideo = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { setMediaOcrStatus('Hãy chọn một tệp video hợp lệ.'); return; }
    if (file.size > 250_000_000) { setMediaOcrStatus('Video vượt quá giới hạn 250 MB.'); return; }
    setMediaVideoUrl(URL.createObjectURL(file));
    setMediaOcrStatus('Đã tải video. Chờ video sẵn sàng để quét OCR.');
    input.value = '';
  };
  const runMediaOcr = async () => {
    const video = mediaVideoRef.current;
    if (!video || !video.videoWidth || !Number.isFinite(video.duration) || !video.duration) {
      setMediaOcrStatus('Hãy chọn video và đợi video tải xong trước.'); return;
    }
    setMediaOcrBusy(true); setMediaOcrStatus('Đang tải bộ nhận dạng OCR…');
    let worker: any;
    try {
      const w = window as any;
      if (!w.Tesseract) await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.onload = () => resolve(); script.onerror = () => reject(new Error('Không tải được thư viện OCR.'));
        document.head.appendChild(script);
      });
      worker = await w.Tesseract.createWorker('eng+vie');
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1280 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Không tạo được vùng xử lý hình ảnh.');
      const duration = Math.max(0, video.duration - 0.2);
      const samples = Math.min(12, Math.max(1, Math.ceil(duration / 12)));
      const chunks: string[] = [];
      for (let i = 0; i < samples; i++) {
        const targetTime = samples === 1 ? 0 : duration * i / (samples - 1);
        if (Math.abs(video.currentTime - targetTime) > 0.05) {
          await new Promise<void>((resolve, reject) => {
            const timeout = window.setTimeout(() => { video.removeEventListener('seeked', onSeeked); reject(new Error('Video không tua được tới khung hình cần quét.')); }, 10000);
            const onSeeked = () => { window.clearTimeout(timeout); resolve(); };
            video.addEventListener('seeked', onSeeked, { once: true });
            video.currentTime = targetTime;
          });
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const result = await worker.recognize(canvas);
        const text = String(result.data.text || '').trim();
        if (text && !chunks.includes(text)) chunks.push(text);
        setMediaOcrStatus(`Đã quét ${i + 1}/${samples} khung hình…`);
      }
      const extracted = chunks.join('\n\n');
      if (extracted) {
        setActiveLesson(current => current ? { ...current, videoOcr: extracted } : current);
        saveLessonMedia({ videoOcr: extracted });
      }
      setMediaOcrStatus(extracted ? `Hoàn tất OCR: nhận được ${extracted.length.toLocaleString('vi-VN')} ký tự.` : 'Không nhận dạng được chữ trong các khung hình đã quét.');
    } catch (error: any) { setMediaOcrStatus(error?.message || 'OCR chưa thực hiện được.'); }
    finally { if (worker) await worker.terminate(); setMediaOcrBusy(false); }
  };
  const summarizeMediaTranscript = () => {
    const source = (activeLesson?.transcript || '').trim();
    if (!source) { setMediaOcrStatus('Hãy nhập transcript trước khi tóm tắt.'); return; }
    const summary = summarizeText(source, 5);
    setActiveLesson(current => current ? { ...current, summary } : current);
    saveLessonMedia({ summary });
    setMediaOcrStatus('Đã tạo tóm tắt trích xuất từ các câu có nhiều thông tin; bạn có thể chỉnh sửa trước khi lưu.');
  };
  const speakMediaText = (source: string, lang: string) => {
    if (!('speechSynthesis' in window)) { setMediaOcrStatus('Thiết bị chưa hỗ trợ đọc văn bản.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(source); utterance.lang = lang || 'vi-VN';
    window.speechSynthesis.speak(utterance);
  };

  const [localProgress, setLocalProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('principia_v2_progress:guest') || '{"completed":[],"attempts":[],"xp":0,"streak":0,"lastStudyDate":""}') as { completed: string[]; attempts: Array<{ title: string; score: number; total: number; at: string }>; xp: number; streak: number; lastStudyDate: string }; }
    catch { return { completed: [] as string[], attempts: [] as Array<{ title: string; score: number; total: number; at: string }>, xp: 0, streak: 0, lastStudyDate: '' }; }
  });
  const localProgressRef = useRef(localProgress);
  const progressStorageKey = account ? `principia_v2_progress:${account.user.uid}` : 'principia_v2_progress:guest';
  useEffect(() => {
    let active = true;
    const key = account ? `principia_v2_progress:${account.user.uid}` : 'principia_v2_progress:guest';
    let safe = { completed: [] as string[], attempts: [] as Array<{ title: string; score: number; total: number; at: string }>, xp: 0, streak: 0, lastStudyDate: '' };
    try {
      const raw = localStorage.getItem(key) || (!account ? localStorage.getItem('principia_v2_progress') : null);
      const parsed = raw ? JSON.parse(raw) : {};
      safe = {
        completed: Array.isArray(parsed.completed) ? parsed.completed.filter((value: unknown) => typeof value === 'string') : [],
        attempts: Array.isArray(parsed.attempts) ? parsed.attempts.filter((value: any) => value && typeof value.title === 'string' && typeof value.score === 'number' && typeof value.total === 'number' && typeof value.at === 'string').slice(0, 100) : [],
        xp: Number.isFinite(parsed.xp) ? Math.max(0, parsed.xp) : 0,
        streak: Number.isFinite(parsed.streak) ? Math.max(0, parsed.streak) : 0,
        lastStudyDate: typeof parsed.lastStudyDate === 'string' ? parsed.lastStudyDate : ''
      };
      localStorage.setItem(key, JSON.stringify(safe));
    } catch {}
    localProgressRef.current = safe;
    setLocalProgress(safe);
    if (!account) return () => { active = false; };
    restoreProgressFromCloud(account.user.uid).then(cloud => {
      if (!active) return;
      const current = localProgressRef.current;
      if (!cloud) {
        if (account.isAdmin && (current.completed.length || current.attempts.length || current.xp)) void syncProgressToCloud(account.user.uid, current).catch(() => {});
        return;
      }
      const merged = {
        completed: [...new Set([...current.completed, ...cloud.completed])],
        attempts: [...new Map([...current.attempts, ...cloud.attempts].map(item => [item.at, item])).values()].sort((left, right) => right.at.localeCompare(left.at)).slice(0, 100),
        xp: Math.max(current.xp, cloud.xp),
        streak: cloud.lastStudyDate >= current.lastStudyDate ? cloud.streak : current.streak,
        lastStudyDate: cloud.lastStudyDate >= current.lastStudyDate ? cloud.lastStudyDate : current.lastStudyDate
      };
      localProgressRef.current = merged;
      setLocalProgress(merged);
      try { localStorage.setItem(key, JSON.stringify(merged)); } catch {}
      if (account.isAdmin) void syncProgressToCloud(account.user.uid, merged).catch(() => {});
    }).catch(() => {});
    return () => { active = false; };
  }, [account?.user.uid]);
  const saveProgress = (next: typeof localProgress) => {
    localProgressRef.current = next;
    setLocalProgress(next);
    try { localStorage.setItem(progressStorageKey, JSON.stringify(next)); } catch { setStatus('Không thể lưu tiến độ: bộ nhớ trình duyệt đã đầy hoặc bị chặn.'); }
    if (account?.isAdmin) void syncProgressToCloud(account.user.uid, next).catch(() => setStatus('Tiến độ đã lưu trên thiết bị; cloud chưa đồng bộ được. Hãy thử lại khi kết nối ổn định.'));
  };
  const lessonKey = (node: LearningNode) => [...lessonPath, node].map(item => item.id || item.name).join('::');
  const withStudyActivity = (current: typeof localProgress, xpGain: number) => {
    const today = new Date().toLocaleDateString('sv-SE');
    if (current.lastStudyDate === today) return { ...current, xp: current.xp + xpGain };
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE');
    return { ...current, xp: current.xp + xpGain, streak: current.lastStudyDate === yesterday ? current.streak + 1 : 1, lastStudyDate: today };
  };
  const markLessonComplete = (node: LearningNode) => {
    const key = lessonKey(node);
    if (localProgress.completed.includes(key)) return;
    saveProgress({ ...withStudyActivity(localProgress, 10), completed: [...localProgress.completed, key] });
    setStatus('Đã hoàn thành bài học · +10 EXP.');
  };
  const submitQuiz = () => {
    const grade = gradeQuiz(questions, answers);
    const attempt = { title: activeQuiz?.name || 'Bài luyện tập', score: grade.score, total: grade.total, at: new Date().toISOString() };
    try {
      const mistakeKey = 'principia_v2_suite:' + (account?.user.uid || 'guest') + ':mistakes';
      const existing = JSON.parse(localStorage.getItem(mistakeKey) || '[]');
      const captured = questions.flatMap((question, index) => {
        if (question.type === 'long_answer' || isQuestionCorrect(question, answers[index])) return [];
        const correctIndexes = getCorrectOptionIndexes(question);
        const correctText = question.type === 'short_answer' ? (question.expected || 'Đáp án trong đề') : correctIndexes.map(i => question.a[i]).join(' / ');
        const answerValue = answers[index];
        const answerText = Array.isArray(answerValue) ? answerValue.map(i => question.a[i]).join(' / ') : typeof answerValue === 'number' ? (question.a[answerValue] || 'Chưa trả lời') : (answerValue || 'Chưa trả lời');
        return [{ id: String(Date.now()) + '-' + index, question: question.q, answer: answerText, correct: correctText, explanation: question.explanation || 'Hãy xem lại lời giải hoặc hỏi gia sư AI để hiểu nguyên nhân.', source: activeQuiz?.name || 'Bài luyện tập', at: new Date().toISOString() }];
      });
      localStorage.setItem(mistakeKey, JSON.stringify([...captured, ...(Array.isArray(existing) ? existing : [])].slice(0, 300)));
    } catch {}
    saveProgress({ ...withStudyActivity(localProgress, grade.score * 5), attempts: [attempt, ...localProgress.attempts].slice(0, 100) });
    if (grade.pendingReview > 0) {
      setStatus(`Đã chấm ${grade.total} câu trắc nghiệm/tự động; ${grade.pendingReview} câu tự luận cần giáo viên chấm.`);
    }
    setQuizSubmitted(true);
  };

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    completeGoogleRedirect().catch(error => {
      if (active) setStatus(error?.message || 'Không thể hoàn tất đăng nhập Google.');
    });
    observeAuth(next => {
      if (!active) return;
      setAccount(next);
      if (next) setWelcome(true);
    }).then(stop => {
      if (active) unsubscribe = stop;
      else stop();
    }).catch(error => {
      if (active) setStatus(error?.message || 'Không thể kết nối dịch vụ đăng nhập.');
    });
    return () => { active = false; unsubscribe?.(); };
  }, []);

  useEffect(() => { if (account) setProfileName(account.user.displayName || ''); }, [account?.user.uid]);
  useEffect(() => { try { localStorage.setItem('principia_v2_theme', lightTheme ? 'light' : 'dark'); } catch {} }, [lightTheme]);
  useEffect(() => {
    if (!account) return;
    let active = true;
    restorePublishedPrincipiaContentFromCloud().then(count => {
      if (active && count) {
        setBackupVersion(value => value + 1);
        setStatus(`Đã tải ${count} mục nội dung học tập được quản trị viên xuất bản.`);
      }
    }).catch(error => {
      if (active) setStatus(error?.message || 'Chưa tải được nội dung học tập từ cloud.');
    });
    return () => { active = false; };
  }, [account?.user.uid]);

  const appBackup = useMemo<PrincipiaBackup>(() => {
    try { return collectPrincipiaData(); }
    catch { return { entries: {} as Record<string, string>, format: 'principia-v2-backup' as const, version: 2 as const, app: 'PRINCIPIA' as const, createdAt: '' }; }
  }, [backupVersion]);
  const lessons = useMemo(() => parseArray<LearningNode>(appBackup.entries['principia_v2_lessons']), [appBackup]);
  const quizzes = useMemo(() => parseArray<LearningNode>(appBackup.entries['principia_v2_quizzes']), [appBackup]);
  const fun = useMemo(() => parseArray<LearningNode>(appBackup.entries['principia_v2_games']), [appBackup]);
  const learningNodes = lessonPath.length ? lessonPath[lessonPath.length - 1].children || [] : lessons;
  const quizNodes = quizPath.length ? quizPath[quizPath.length - 1].children || [] : [...quizzes, ...fun.map(node => ({ ...node, name: node.name || 'Thử thách' }))];
  const questions = activeQuiz?.questions || activeQuiz?.quiz || [];
  const xp = Number(appBackup.entries['principia_v2_xp'] || 0);
  const streak = Number(appBackup.entries['principia_v2_streak'] || 0);
  const completed = parseArray<string>(appBackup.entries['principia_v2_completed']);
  const achievementList = [
    { id: 'first-lesson', title: 'Bước đầu tiên', description: 'Hoàn thành bài học đầu tiên', unlocked: completed.length + localProgress.completed.length >= 1, icon: '🌱' },
    { id: 'five-lessons', title: 'Chăm chỉ', description: 'Hoàn thành 5 bài học', unlocked: completed.length + localProgress.completed.length >= 5, icon: '📚' },
    { id: 'first-quiz', title: 'Thử sức', description: 'Nộp bài luyện tập đầu tiên', unlocked: localProgress.attempts.length >= 1, icon: '🎯' },
    { id: 'streak-three', title: 'Giữ nhịp', description: 'Học liên tiếp 3 ngày', unlocked: localProgress.streak >= 3, icon: '🔥' },
    { id: 'xp-hundred', title: 'Nhà chinh phục', description: 'Tích lũy 100 EXP', unlocked: localProgress.xp + xp >= 100, icon: '🏆' }
  ];

  function addCustomAIProvider() {
    const name = prompt('Tên AI muốn thêm (ví dụ: Perplexity):')?.trim();
    if (!name) return;
    const raw = prompt('Địa chỉ trang AI (https://…):')?.trim();
    if (!raw) return;
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      const next = [...customAIProviders, { id: 'custom-' + Date.now(), name: name.slice(0, 40), url: url.href }];
      setCustomAIProviders(next); localStorage.setItem('principia_v2_ai_custom', JSON.stringify(next));
      setChatProvider(next[next.length - 1].id);
      localStorage.setItem('principia_v2_ai_selected', next[next.length - 1].id);
      setChatNotice('Đã thêm AI tùy chỉnh.');
    } catch { setChatNotice('Địa chỉ AI không hợp lệ. Chỉ chấp nhận http hoặc https.'); }
  }

  async function saveProfile() {
    if (!account) return;
    setBusy(true);
    try {
      const next = await updateDisplayName(profileName);
      setAccount(next);
      setStatus('Đã cập nhật tên hiển thị.');
    } catch (error: any) { setStatus(error?.message || 'Không cập nhật được hồ sơ.'); }
    finally { setBusy(false); }
  }

  async function runAuth(action: () => Promise<AuthResult>) {
    setBusy(true); setStatus('');
    try {
      const result = await action();
      setAccount(result); setWelcome(true); setPassword('');
    } catch (error: any) {
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'Email hoặc mật khẩu chưa chính xác.',
        'auth/email-already-in-use': 'Email này đã có tài khoản. Hãy đăng nhập.',
        'auth/weak-password': 'Mật khẩu cần tối thiểu 6 ký tự.',
        'auth/invalid-email': 'Địa chỉ email chưa hợp lệ.',
        'auth/unauthorized-domain': 'Tên miền chưa được cho phép trong Firebase Authentication.',
        'auth/too-many-requests': 'Bạn thao tác quá nhanh. Hãy thử lại sau.'
      };
      setStatus(messages[error?.code] || error?.message || 'Đăng nhập chưa thành công.');
    } finally { setBusy(false); }
  }

  async function handleGoogle() {
    setBusy(true); setStatus('Đang mở Google để xác thực…');
    try { await signInWithGoogle(); }
    catch (error: any) { setStatus(error?.message || 'Không thể mở đăng nhập Google.'); setBusy(false); }
  }

  async function handleReset() {
    if (!email.trim()) { setStatus('Nhập email trước, sau đó chọn Quên mật khẩu.'); return; }
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setStatus('Đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư mục Spam.');
    } catch (error: any) { setStatus(error?.message || 'Không gửi được email đặt lại mật khẩu.'); }
    finally { setBusy(false); }
  }

  async function handleRestore(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const count = restorePrincipiaBackup(await file.text());
      setBackupVersion(value => value + 1);
      setStatus(`Đã khôi phục ${count} mục dữ liệu. Hãy tải lại ứng dụng để nạp lại nội dung V2.`);
    } catch (error: any) { setStatus(error?.message || 'Không thể đọc tệp sao lưu.'); }
    finally { input.value = ''; }
  }

  async function handleCloudSync() {
    if (!account?.isAdmin) { setStatus('Tài khoản này chỉ có quyền xem; chỉ quản trị viên được ghi dữ liệu cloud.'); return; }
    setBusy(true); setStatus('Đang đồng bộ dữ liệu lên tài khoản PRINCIPIA…');
    try {
      const count = await syncPrincipiaDataToCloud(account!.user.uid);
      const published = account!.isAdmin ? await publishPrincipiaContentToCloud(account!.user.uid) : 0;
      await syncProgressToCloud(account!.user.uid, localProgress);
      setStatus(`Đã sao lưu ${count} mục dữ liệu cá nhân${account!.isAdmin ? `, xuất bản ${published} mục nội dung học tập` : ''} và đồng bộ tiến độ.`);
    } catch (error: any) {
      setStatus(error?.message || 'Đồng bộ thất bại. Hãy kiểm tra kết nối và Firestore Security Rules.');
    } finally { setBusy(false); }
  }

  async function handleCloudRestore() {
    if (!account?.isAdmin) { setStatus('Tài khoản này chỉ có quyền xem; chức năng khôi phục cloud dành cho quản trị viên.'); return; }
    if (!confirm('Khôi phục dữ liệu đám mây sẽ ghi đè các mục trùng tên trên thiết bị này. Bạn muốn tiếp tục?')) return;
    setBusy(true); setStatus('Đang tải dữ liệu từ đám mây…');
    try {
      const count = await restorePrincipiaDataFromCloud(account!.user.uid);
      const published = await restorePublishedPrincipiaContentFromCloud();
      const cloudProgress = await restoreProgressFromCloud(account!.user.uid);
      if (cloudProgress) saveProgress(cloudProgress);
      setBackupVersion(value => value + 1);
      setStatus(`Đã khôi phục ${count} mục dữ liệu cá nhân, ${published} mục nội dung học tập${cloudProgress ? ' và tiến độ học tập' : ''}.`);
    } catch (error: any) {
      setStatus(error?.message || 'Khôi phục thất bại. Hãy kiểm tra kết nối và Firestore Security Rules.');
    } finally { setBusy(false); }
  }

  function chooseSection(next: Section) {
    setSection(next);
    setLessonPath([]); setActiveLesson(null);
    setQuizPath([]); setActiveQuiz(null);
    setAnswers({}); setQuizSubmitted(false);
    setStatus('');
  }

  function openLearningNode(node: LearningNode) {
    if (node.type === 'lesson' || node.content) setActiveLesson(node);
    else setLessonPath(path => [...path, node]);
  }

  function startLessonEditor(node?: Partial<LearningNode>) {
    if (!account?.isAdmin) return;
    setLessonEditor({
      id: node?.id, name: node?.name || '', icon: node?.icon || '📘',
      type: node ? (node.type === 'lesson' || !!node.content || !!node.video ? 'lesson' : 'folder') : 'lesson',
      content: node?.content || '', note: node?.note || '', video: node?.video || ''
    });
  }

  function saveLessonEditor() {
    if (!account?.isAdmin || !lessonEditor || !lessonEditor.name.trim()) return;
    try {
      const tree = JSON.parse(localStorage.getItem('principia_v2_lessons') || '[]') as LearningNode[];
      const nextNode: LearningNode = {
        id: lessonEditor.id || (crypto.randomUUID?.() || `lesson-${Date.now()}-${Math.random().toString(36).slice(2,7)}`),
        name: lessonEditor.name.trim(), icon: lessonEditor.icon.trim() || '📘',
        type: lessonEditor.type,
        ...(lessonEditor.type === 'lesson' ? {
          content: lessonEditor.content, note: lessonEditor.note, video: lessonEditor.video,
          ...(lessonEditor.id ? {} : { quiz: [] })
        } : { children: [] })
      };
      let saved = false;
      if (lessonEditor.id) {
        const update = (nodes: LearningNode[]): boolean => {
          for (const node of nodes) {
            if (node.id === lessonEditor.id) {
              Object.assign(node, { name: nextNode.name, icon: nextNode.icon, type: nextNode.type });
              if (lessonEditor.type === 'lesson') Object.assign(node, { content: nextNode.content, note: nextNode.note, video: nextNode.video });
              if (lessonEditor.type === 'folder' && !node.children) node.children = [];
              saved = true; return true;
            }
            if (node.children && update(node.children)) return true;
          }
          return false;
        };
        update(tree);
      } else {
        const parent = lessonPath.length ? lessonPath[lessonPath.length - 1] : null;
        if (parent) {
          const findParent = (nodes: LearningNode[]): LearningNode | null => {
            for (const node of nodes) {
              if (node.id === parent.id) return node;
              const found = node.children ? findParent(node.children) : null;
              if (found) return found;
            }
            return null;
          };
          const target = findParent(tree);
          if (!target) throw new Error('Không tìm thấy thư mục hiện tại.');
          target.children = [...(target.children || []), nextNode];
        } else tree.push(nextNode);
        saved = true;
      }
      if (!saved) throw new Error('Không tìm thấy mục cần chỉnh sửa.');
      localStorage.setItem('principia_v2_lessons', JSON.stringify(tree));
      setBackupVersion(value => value + 1);
      if (activeLesson && lessonEditor.id === activeLesson.id) setActiveLesson(current => current ? { ...current, name: nextNode.name, icon: nextNode.icon, content: nextNode.content, note: nextNode.note, video: nextNode.video } : current);
      setLessonEditor(null);
      setStatus('Đã lưu nội dung vào kho bài học trên thiết bị. Hãy đồng bộ cloud để sao lưu bản quản trị.');
    } catch (error: any) { setStatus(error?.message || 'Không thể lưu nội dung bài học.'); }
  }

  function deleteActiveLesson() {
    if (!account?.isAdmin || !activeLesson || !confirm(`Xóa bài học “${activeLesson.name}” khỏi dữ liệu trên thiết bị này?`)) return;
    try {
      const tree = JSON.parse(localStorage.getItem('principia_v2_lessons') || '[]') as LearningNode[];
      const remove = (nodes: LearningNode[]): boolean => {
        const index = nodes.findIndex(node => node.id === activeLesson.id);
        if (index >= 0) { nodes.splice(index, 1); return true; }
        return nodes.some(node => node.children ? remove(node.children) : false);
      };
      if (!remove(tree)) throw new Error('Không tìm thấy bài học cần xóa.');
      localStorage.setItem('principia_v2_lessons', JSON.stringify(tree));
      setBackupVersion(value => value + 1); setActiveLesson(null);
      setStatus('Đã xóa bài học khỏi dữ liệu cục bộ.');
    } catch (error: any) { setStatus(error?.message || 'Không thể xóa bài học.'); }
  }

  function startQuizEditor(node?: LearningNode) {
    if (!account?.isAdmin) return;
    if (node && !hasNode(quizzes, node.id)) { setStatus('Thử thách này không nằm trong ngân hàng đề do quản trị viên quản lý.'); return; }
    setQuizEditor({
      id: node?.id, name: node?.name || '',
      questionsText: JSON.stringify(node?.questions || node?.quiz || [{ q: '', type: 'single_select', a: ['', '', '', ''], correct: 0, explanation: '' }], null, 2)
    });
  }

  function saveQuizEditor() {
    if (!account?.isAdmin || !quizEditor || !quizEditor.name.trim()) return;
    try {
      const parsed = validateQuizQuestions(JSON.parse(quizEditor.questionsText));
      const bank = parseArray<LearningNode>(localStorage.getItem('principia_v2_quizzes') || '[]');
      const node: LearningNode = {
        id: quizEditor.id || ('quiz-' + Date.now() + '-' + Math.random().toString(36).slice(2,7)),
        name: quizEditor.name.trim(), type: 'quiz', questions: parsed
      };
      if (quizEditor.id) {
        const update = (nodes: LearningNode[]): boolean => {
          for (const item of nodes) {
            if (item.id === quizEditor.id) { item.name = node.name; item.questions = parsed; item.type = 'quiz'; return true; }
            if (item.children && update(item.children)) return true;
          }
          return false;
        };
        if (!update(bank)) throw new Error('Không tìm thấy đề thi cần chỉnh sửa.');
      } else {
        const parent = quizPath.length ? quizPath[quizPath.length - 1] : null;
        if (parent) {
          const findParent = (nodes: LearningNode[]): LearningNode | null => {
            for (const item of nodes) {
              if (item.id === parent.id) return item;
              const found = item.children ? findParent(item.children) : null;
              if (found) return found;
            }
            return null;
          };
          const target = findParent(bank);
          if (!target) throw new Error('Chỉ có thể tạo đề trong thư mục ngân hàng đề của admin.');
          target.children = [...(target.children || []), node];
        } else bank.push(node);
      }
      localStorage.setItem('principia_v2_quizzes', JSON.stringify(bank));
      setBackupVersion(value => value + 1);
      if (quizEditor.id) setActiveQuiz(node);
      setQuizEditor(null);
      setStatus('Đã lưu ngân hàng đề trên thiết bị. Hãy đồng bộ cloud để xuất bản cho học viên.');
    } catch (error: any) { setStatus(error?.message || 'Không thể lưu ngân hàng đề.'); }
  }

  function openQuizNode(node: LearningNode) {
    const items = node.questions || node.quiz || [];
    if (items.length) { setActiveQuiz(node); setAnswers({}); setQuizSubmitted(false); }
    else setQuizPath(path => [...path, node]);
  }

  if (!account) {
    return (
      <div class="auth-screen">
        <div class="auth-glow" />
        <section class="auth-card">
          <img class="principia-logo" src="/assets/images/principia-logo-round.svg" alt="PRINCIPIA" />
          <p class="eyebrow">PHYSICS OLYMPIAD · PRO</p>
          <h1>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h1>
          <p class="auth-subtitle">Không gian học tập khoa học của PRINCIPIA.</p>
          <button class="google-button" type="button" disabled={busy} onClick={handleGoogle}>
            <span class="google-g">G</span> Tiếp tục với Google
          </button>
          <div class="auth-divider"><span>hoặc dùng email</span></div>
          <form class="auth-form" onSubmit={event => {
            event.preventDefault();
            if (mode === 'login') void runAuth(() => signInWithEmail(email, password));
            else void runAuth(() => createEmailAccount(email, password, displayName));
          }}>
            {mode === 'signup' && (
              <label>Tên hiển thị
                <input value={displayName} onInput={event => setDisplayName(event.currentTarget.value)} placeholder="Tên của bạn" autocomplete="name" />
              </label>
            )}
            <label>Email
              <input type="email" required value={email} onInput={event => setEmail(event.currentTarget.value)} placeholder="you@example.com" autocomplete="email" />
            </label>
            <label>Mật khẩu
              <div class="password-field">
                <input type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onInput={event => setPassword(event.currentTarget.value)} placeholder="Tối thiểu 6 ký tự" autocomplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" class="password-toggle" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Ẩn' : 'Hiện'}</button>
              </div>
            </label>
            <button class="primary-button" type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
          </form>
          <div class="auth-links">
            <button type="button" onClick={handleReset}>Quên mật khẩu?</button>
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setStatus(''); }}>
              {mode === 'login' ? 'Tạo tài khoản mới' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
          {status && <p class="auth-status" role="status">{status}</p>}
          <p class="auth-footnote">Tài khoản ngoài quản trị chỉ có quyền xem nội dung học tập.</p>
        </section>
      </div>
    );
  }

  if (welcome) {
    return (
      <div class="welcome-screen">
        <section class="welcome-card">
          <img class="principia-logo welcome-logo" src="/assets/images/principia-logo-round.svg" alt="PRINCIPIA" />
          <p class="eyebrow">PRINCIPIA · PHYSICS OLYMPIAD</p>
          <h1>Chào mừng, {account.user.displayName || account.user.email?.split('@')[0] || 'bạn'}!</h1>
          <p>Không gian học tập của bạn đã sẵn sàng.</p>
          <button class="primary-button" onClick={() => setWelcome(false)}>Vào học ngay <span>→</span></button>
          <button class="quiet-button" onClick={() => void signOut()}>Đăng xuất</button>
        </section>
      </div>
    );
  }

  return (
    <div class={(musicFocus ? "app-shell focus-mode" : "app-shell") + (lightTheme ? " light-theme" : "")}>
      <header class="topbar">
        <img class="topbar-logo" src="/assets/images/principia-logo-round.svg" alt="" />
        <div class="brand-copy"><strong>PRINCIPIA</strong><span>PHYSICS OLYMPIAD · PRO</span></div>
        <div class="account-chip"><span>{account.isAdmin ? 'ADMIN' : 'LEARNER'}</span><b>{account.user.displayName || account.user.email}</b></div>
      </header>
      <main class="main-content">
        <p class="eyebrow">LEARNING WORKSPACE</p>
        <h1>{sections.find(item => item.id === section)?.label}</h1>
        {section === 'home' && <>
          <p class="intro">Xin chào {account.user.displayName || 'bạn'}. PRINCIPIA V2 đang chuyển các mô-đun học tập sang kiến trúc mới.</p>
          <section class="stats-grid">
            <article><strong>{countNodes(lessons, 'lesson')}</strong><span>Bài học</span></article>
            <article><strong>{countQuestions(quizzes) + countQuestions(fun)}</strong><span>Câu hỏi</span></article>
            <article><strong>{completed.length}</strong><span>Mục đã hoàn thành</span></article>
          </section>
          <section class="migration-card"><span class="status-dot" /><div><strong>Dữ liệu PRINCIPIA V2</strong><p>Đang lưu trữ {Object.keys(appBackup.entries).length} mục dữ liệu trên thiết bị này. Sao lưu trước khi chuyển thiết bị hoặc đổi phiên bản.</p></div></section>
          <section class="backup-panel">
            <div><strong>Sao lưu & khôi phục</strong><p>Xuất dữ liệu bài học, câu hỏi, tiến độ và cài đặt đang lưu trên thiết bị thành tệp JSON.</p></div>
            <div class="backup-actions">
              <button class="secondary-button" onClick={downloadPrincipiaBackup}>Tải bản sao lưu</button>
              <label class="secondary-button file-button">Khôi phục tệp<input type="file" accept="application/json,.json" onChange={handleRestore} /></label>
              {account.isAdmin ? <>
                <button class="secondary-button" disabled={busy} onClick={() => void handleCloudSync()}>Đồng bộ cloud</button>
                <button class="secondary-button" disabled={busy} onClick={() => void handleCloudRestore()}>Khôi phục cloud</button>
              </> : <p class="permission-note">Tài khoản học viên có quyền xem. Tiến độ và dữ liệu cá nhân được lưu trên thiết bị; thao tác ghi và đồng bộ cloud do quản trị viên quản lý.</p>}
            </div>
          </section>
        </>}
        {section === 'learn' && <>
          {activeLesson ? <section class="content-panel">
            <button class="back-link" onClick={() => setActiveLesson(null)}>← Quay lại danh sách</button>
            <div class="lesson-content-layout">
              <div class="lesson-main-pane">
            <h2>{activeLesson.icon || '📘'} {activeLesson.name}</h2>
            {account.isAdmin && <div class="admin-lesson-actions"><button class="secondary-button" type="button" onClick={() => startLessonEditor(activeLesson)}>Chỉnh sửa bài học</button><button class="quiet-button" type="button" onClick={deleteActiveLesson}>Xóa bài học</button></div>}
            {lessonEditor && <section class="lesson-editor">
              <h3>{lessonEditor.id ? 'Chỉnh sửa nội dung' : 'Tạo nội dung mới'}</h3>
              <label>Tên mục<input value={lessonEditor.name} onInput={event => setLessonEditor(current => current ? { ...current, name: event.currentTarget.value } : current)} /></label>
              <label>Biểu tượng<input value={lessonEditor.icon} onInput={event => setLessonEditor(current => current ? { ...current, icon: event.currentTarget.value } : current)} /></label>
              <label>Loại mục<select value={lessonEditor.type} onChange={event => setLessonEditor(current => current ? { ...current, type: event.currentTarget.value as 'lesson' | 'folder' } : current)}><option value="lesson">Bài học</option><option value="folder">Thư mục</option></select></label>
              {lessonEditor.type === 'lesson' && <>
                <label>Nội dung bài học<textarea rows={8} value={lessonEditor.content} onInput={event => setLessonEditor(current => current ? { ...current, content: event.currentTarget.value } : current)} /></label>
                <label>Ghi chú hiển thị<textarea rows={4} value={lessonEditor.note} onInput={event => setLessonEditor(current => current ? { ...current, note: event.currentTarget.value } : current)} /></label>
                <label>Link video<input value={lessonEditor.video} onInput={event => setLessonEditor(current => current ? { ...current, video: event.currentTarget.value } : current)} placeholder="https://…" /></label>
              </>}
              <div class="chat-actions"><button class="primary-button" type="button" onClick={saveLessonEditor}>Lưu nội dung</button><button class="quiet-button" type="button" onClick={() => setLessonEditor(null)}>Hủy</button></div>
            </section>}
            {activeLesson.video && /^https?:\/\//i.test(activeLesson.video) && <div class="lesson-video">
              <a href={activeLesson.video} target="_blank" rel="noreferrer">Mở video bài học ↗</a>
              {(() => {
                const match = activeLesson.video!.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
                return match ? <iframe title="Video bài học" src={`https://www.youtube-nocookie.com/embed/${match[1]}`} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : null;
              })()}
            </div>}
            {activeLesson.content && <><h3>Nội dung bài học</h3><pre class="lesson-content">{activeLesson.content}</pre></>}
            {activeLesson.note && <><h3>Ghi chú</h3><pre class="lesson-content">{activeLesson.note}</pre></>}
              </div>
              <div class="lesson-tools">
              <div class="lesson-tool-tabs" role="tablist" aria-label="Công cụ bài học">
                <button type="button" class={lessonTool === 'note' ? 'active' : ''} onClick={() => setLessonTool('note')}>✎ Ghi chép</button>
                <button type="button" class={lessonTool === 'files' ? 'active' : ''} onClick={() => setLessonTool('files')}>▧ Tài liệu</button>
                <button type="button" class={lessonTool === 'submit' ? 'active' : ''} onClick={() => setLessonTool('submit')}>⇧ Nộp bài</button>
                <button type="button" class={lessonTool === 'media' ? 'active' : ''} onClick={() => setLessonTool('media')}>▤ Transcript & OCR</button>
                <button type="button" class={lessonTool === 'simulation' ? 'active' : ''} onClick={() => setLessonTool('simulation')}>⚛ Mô phỏng</button>
              </div>
              {lessonTool === 'note' && <div class="lesson-tool-panel">
                <h3>Ghi chép cá nhân</h3>
                <textarea value={privateNote} onInput={event => setPrivateNote(event.currentTarget.value)} placeholder="Ghi lại công thức, ý tưởng và điều cần nhớ…" rows={7} />
                <button class="secondary-button" onClick={() => saveLessonWorkspace({ note: privateNote })}>Lưu ghi chép</button>
              </div>}
              {lessonTool === 'files' && <div class="lesson-tool-panel">
                <h3>Tài liệu bài học</h3>
                <p class="empty-state">Tệp đính kèm nhỏ được lưu cùng bản nháp trên thiết bị này (tối đa 250 KB/tệp, 8 tệp/bài). Dùng Thư viện tài liệu cho PDF hoặc tệp lớn.</p>
                <label class="secondary-button file-button">＋ Thêm tài liệu<input type="file" multiple onChange={handleLessonFiles} /></label>
                {lessonFiles.length ? <div class="lesson-file-list">{lessonFiles.map(file => <article><div><b>{file.name}</b><small>{(file.size / 1024).toFixed(1)} KB · {new Date(file.addedAt).toLocaleDateString('vi-VN')}</small></div><a href={file.dataUrl} download={file.name}>Tải / mở</a><button type="button" onClick={() => removeLessonFile(file.name, file.addedAt)}>Xóa</button></article>)}</div> : <p class="empty-state">Chưa có tài liệu đính kèm.</p>}
              </div>}
              {lessonTool === 'submit' && <div class="lesson-tool-panel">
                <h3>Bài làm / câu hỏi gửi giáo viên</h3>
                <p class="empty-state">Phần trả lời được lưu riêng trên thiết bị hiện tại. Chức năng gửi bài lên hệ thống giáo viên sẽ được nối với quyền và dữ liệu cloud ở bước tiếp theo.</p>
                <textarea value={assignmentText} onInput={event => setAssignmentText(event.currentTarget.value)} placeholder="Nhập lời giải, kết quả hoặc câu hỏi của bạn…" rows={7} />
                <button class="secondary-button" onClick={() => saveLessonWorkspace({ submission: assignmentText })}>Lưu bài làm nháp</button>
              </div>}
              {lessonTool === 'media' && <div class="lesson-tool-panel media-reference-panel">
                <h3>Nội dung video & nhận dạng</h3>
                <label class="secondary-button file-button">Chọn video để OCR<input type="file" accept="video/*" onChange={handleMediaVideo} /></label>
                {mediaVideoUrl && <><video ref={mediaVideoRef} class="media-ocr-video" src={mediaVideoUrl} controls playsInline /><button class="secondary-button" type="button" disabled={mediaOcrBusy} onClick={() => void runMediaOcr()}>{mediaOcrBusy ? 'Đang nhận dạng…' : 'Quét chữ trong video (OCR)'}</button></>}
                {mediaOcrStatus && <p class="workspace-notice" role="status">{mediaOcrStatus}</p>}
                <label>Transcript<textarea rows={6} value={activeLesson.transcript || ''} onInput={event => setActiveLesson(current => current ? { ...current, transcript: event.currentTarget.value } : current)} placeholder="Dán hoặc nhập lời thoại video…" /></label>
                <div class="chat-actions"><button class="secondary-button" type="button" disabled={mediaListening} onClick={startLiveTranscript}>● Bắt đầu ghi lời thoại trực tiếp</button><button class="secondary-button" type="button" disabled={!mediaListening} onClick={stopLiveTranscript}>Dừng ghi</button></div>
                <div class="chat-actions"><button class="secondary-button" type="button" onClick={() => saveLessonMedia({ transcript: activeLesson.transcript || '' })}>Lưu transcript</button>{activeLesson.transcript && <button class="quiet-button" type="button" onClick={() => speakMediaText(activeLesson.transcript || '', 'vi-VN')}>▶ Đọc transcript</button>}</div>
                {activeLesson.transcript && <button class="secondary-button" type="button" onClick={() => { setChatDraft('Hãy dịch transcript sau sang tiếng Việt tự nhiên, giữ nguyên thuật ngữ vật lý và công thức. Chỉ trả về bản dịch theo từng đoạn:\\n\\n' + (activeLesson.transcript || '')); chooseSection('chat'); }}>Soạn yêu cầu dịch bằng AI ↗</button>}
                <label>Bản dịch transcript<textarea rows={5} value={activeLesson.translatedTranscript || ''} onInput={event => setActiveLesson(current => current ? { ...current, translatedTranscript: event.currentTarget.value } : current)} placeholder="Nhập bản dịch hoặc chỉnh sửa tại đây…" /></label>
                <div class="chat-actions"><button class="secondary-button" type="button" onClick={() => saveLessonMedia({ translatedTranscript: activeLesson.translatedTranscript || '' })}>Lưu bản dịch</button>{activeLesson.translatedTranscript && <button class="quiet-button" type="button" onClick={() => speakMediaText(activeLesson.translatedTranscript || '', activeLesson.dubLang || 'vi-VN')}>▶ Đọc bản dịch</button>}</div>
                <label>Văn bản OCR<textarea rows={6} value={activeLesson.videoOcr || ''} onInput={event => setActiveLesson(current => current ? { ...current, videoOcr: event.currentTarget.value } : current)} placeholder="Kết quả OCR sẽ xuất hiện tại đây…" /></label>
                <button class="secondary-button" type="button" onClick={() => saveLessonMedia({ videoOcr: activeLesson.videoOcr || '' })}>Lưu kết quả OCR</button>
                <label>Tóm tắt bài học<textarea rows={4} value={activeLesson.summary || ''} onInput={event => setActiveLesson(current => current ? { ...current, summary: event.currentTarget.value } : current)} placeholder="Tóm tắt nội dung…" /></label>
                <div class="chat-actions"><button class="secondary-button" type="button" onClick={summarizeMediaTranscript}>Tạo tóm tắt nhanh từ transcript</button><button class="secondary-button" type="button" onClick={() => saveLessonMedia({ summary: activeLesson.summary || '' })}>Lưu tóm tắt</button></div>
                <label>Ngôn ngữ nguồn<select value={mediaSourceLang} onChange={event => setMediaSourceLang(event.currentTarget.value)}><option value="en">English</option><option value="vi">Tiếng Việt</option><option value="ja">日本語</option><option value="ko">한국어</option><option value="fr">Français</option><option value="auto">Tự đoán (mặc định English)</option></select></label>
                <label>Ngôn ngữ đọc / dịch đích<select value={activeLesson.dubLang || 'vi-VN'} onChange={event => saveLessonMedia({ dubLang: event.currentTarget.value })}><option value="vi-VN">Tiếng Việt</option><option value="en-US">English</option><option value="ja-JP">日本語</option><option value="ko-KR">한국어</option><option value="fr-FR">Français</option></select></label>
                <p class="empty-state">Khi bấm dịch, transcript sẽ được gửi tới dịch vụ MyMemory bên ngoài để xử lý. Có thể bị giới hạn lượt miễn phí.</p>
                <button class="secondary-button" type="button" disabled={mediaOcrBusy} onClick={() => void translateMediaTranscript()}>{mediaOcrBusy ? 'Đang xử lý…' : '✦ Dịch transcript tự động'}</button>
              </div>}
              {lessonTool === 'simulation' && <div class="lesson-tool-panel">
                <h3>PhET Interactive Simulations</h3>
                <select value={simulationSubject} onChange={event => setSimulationSubject(event.currentTarget.value)}>
                  <option value="physics">Vật lý</option><option value="math">Toán học</option><option value="chemistry">Hóa học</option><option value="biology">Sinh học</option>
                </select>
                <iframe class="phet-frame" title="PhET simulations" src={`https://phet.colorado.edu/vi/simulations/filter?subjects=${simulationSubject}&type=html`} loading="lazy" allow="fullscreen" />
                <a href={`https://phet.colorado.edu/vi/simulations/filter?subjects=${simulationSubject}&type=html`} target="_blank" rel="noreferrer">Mở PhET trong tab mới ↗</a>
              </div>}
              {workspaceNotice && <p class="workspace-notice" role="status">{workspaceNotice}</p>}
            </div>
              </div>
            <div class="lesson-completion"><span>{localProgress.completed.includes(lessonKey(activeLesson)) ? '✓ Đã hoàn thành' : 'Hoàn thành bài học để lưu tiến độ'}</span><button class="secondary-button" disabled={localProgress.completed.includes(lessonKey(activeLesson))} onClick={() => markLessonComplete(activeLesson)}>{localProgress.completed.includes(lessonKey(activeLesson)) ? 'Đã ghi nhận' : 'Đánh dấu hoàn thành · +10 EXP'}</button></div>
            {!activeLesson.content && !activeLesson.note && !activeLesson.video && <p class="empty-state">Bài học chưa có nội dung.</p>}
            {(activeLesson.quiz?.length || activeLesson.questions?.length) ? <button class="primary-button quiz-submit" onClick={() => openQuizNode(activeLesson)}>Làm câu hỏi bài học ({(activeLesson.quiz || activeLesson.questions || []).length})</button> : null}
          </section> : <section class="content-panel">
            <div class="section-toolbar">
              <button class="back-link" disabled={!lessonPath.length} onClick={() => setLessonPath(path => path.slice(0, -1))}>← Quay lại</button>
              <span>{lessonPath.map(node => node.name).join(' / ') || 'Tất cả môn học'}</span>
              {account.isAdmin && <div class="chat-actions"><button class="secondary-button" type="button" onClick={() => startLessonEditor()}>＋ Bài học</button><button class="secondary-button" type="button" onClick={() => startLessonEditor({ type: 'folder', name: '', icon: '📂' })}>＋ Thư mục</button></div>}
            </div>
            <div class="node-grid">
              {learningNodes.map(node => <button class="node-card" onClick={() => openLearningNode(node)}>
                <span>{node.icon || (node.type === 'lesson' ? '📘' : '📂')}</span><b>{node.name}</b><small>{node.type === 'lesson' ? 'Mở bài học' : `${node.children?.length || 0} mục`}</small>
              </button>)}
            </div>
            {!learningNodes.length && <p class="empty-state">Chưa tìm thấy dữ liệu bài học trên thiết bị này. Hãy tạo nội dung mới hoặc chờ quản trị viên xuất bản ngân hàng câu hỏi.</p>}
          </section>}
        </>}
        {section === 'suite' && <LearningSuite
          userId={account.user.uid}
          lessons={lessons}
          quizzes={[...quizzes, ...fun]}
          progress={localProgress}
          onAttempt={(title, score, total) => {
            const attempt = { title, score, total, at: new Date().toISOString() };
            saveProgress({ ...withStudyActivity(localProgress, score * 5), attempts: [attempt, ...localProgress.attempts].slice(0, 100) });
          }}
          onTaskComplete={(xpGain) => saveProgress(withStudyActivity(localProgress, xpGain))}
        />}
        {section === 'quiz' && <>
          {activeQuiz ? <section class="content-panel">
            <button class="back-link" onClick={() => { setActiveQuiz(null); setQuizSubmitted(false); }}>← Quay lại danh sách</button>
            <h2>{activeQuiz.name}</h2>
            {account.isAdmin && hasNode(quizzes, activeQuiz.id) && <button class="secondary-button" type="button" onClick={() => startQuizEditor(activeQuiz)}>Chỉnh sửa ngân hàng đề (JSON)</button>}
            {quizEditor && <section class="lesson-editor">
              <h3>{quizEditor.id ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}</h3>
              <label>Tên đề thi<input value={quizEditor.name} onInput={event => setQuizEditor(current => current ? { ...current, name: event.currentTarget.value } : current)} /></label>
              <label>Danh sách câu hỏi (JSON)<textarea rows={16} spellcheck={false} value={quizEditor.questionsText} onInput={event => setQuizEditor(current => current ? { ...current, questionsText: event.currentTarget.value } : current)} /></label>
              <p class="empty-state">Hỗ trợ single_select, true_false, multi_select, short_answer và long_answer. Mẫu câu hỏi: <code>{'{"q":"...","type":"single_select","a":["A","B"],"correct":0}'}</code></p>
              <div class="chat-actions"><button class="primary-button" type="button" onClick={saveQuizEditor}>Lưu đề thi</button><button class="quiet-button" type="button" onClick={() => setQuizEditor(null)}>Hủy</button></div>
            </section>}
            {questions.map((question, index) => <article class="question-card">
              <b>{index + 1}. {question.q}</b>
              {(question.type === 'short_answer' || question.type === 'long_answer') ? <label class="written-answer">
                <span>{question.type === 'long_answer' ? 'Câu trả lời tự luận' : 'Nhập đáp án ngắn'}</span>
                {question.type === 'long_answer' ? <textarea rows={5} value={typeof answers[index] === 'string' ? answers[index] as string : ''} disabled={quizSubmitted} onInput={event => setAnswers(current => ({ ...current, [index]: event.currentTarget.value }))} /> : <input value={typeof answers[index] === 'string' ? answers[index] as string : ''} disabled={quizSubmitted} onInput={event => setAnswers(current => ({ ...current, [index]: event.currentTarget.value }))} />}
                {question.type === 'long_answer' && <small>Bài tự luận được lưu trong lượt làm bài; cần giáo viên chấm theo rubric.</small>}
              </label> : <div class="answer-list">{question.a.map((answer, answerIndex) => <label class={quizSubmitted && getCorrectOptionIndexes(question).includes(answerIndex) ? 'correct-answer' : ''}>
                <input type={question.type === 'multi_select' ? 'checkbox' : 'radio'} name={`q-${index}`} checked={question.type === 'multi_select' ? Array.isArray(answers[index]) && (answers[index] as number[]).includes(answerIndex) : answers[index] === answerIndex} disabled={quizSubmitted} onChange={event => setAnswers(current => ({ ...current, [index]: question.type === 'multi_select' ? (event.currentTarget.checked ? [...(Array.isArray(current[index]) ? current[index] as number[] : []), answerIndex] : (Array.isArray(current[index]) ? current[index] as number[] : []).filter(value => value !== answerIndex)) : answerIndex }))} />
                {answer}
              </label>)}</div>}
              {quizSubmitted && question.explanation && <p class="question-explanation">{question.explanation}</p>}
            </article>)}
            {!quizSubmitted ? <button class="primary-button quiz-submit" disabled={!questions.length || Object.keys(answers).filter(key => typeof answers[Number(key)] === 'string' ? String(answers[Number(key)]).trim().length > 0 : Array.isArray(answers[Number(key)]) ? (answers[Number(key)] as number[]).length > 0 : true).length !== questions.length} onClick={submitQuiz}>Nộp bài</button> :
              <><p class="quiz-result">Kết quả chấm tự động: {gradeQuiz(questions, answers).score}/{gradeQuiz(questions, answers).total} câu đúng · {gradeQuiz(questions, answers).correct} đúng · {gradeQuiz(questions, answers).incorrect} chưa đúng · +{gradeQuiz(questions, answers).score * 5} EXP.{gradeQuiz(questions, answers).pendingReview ? ` ${gradeQuiz(questions, answers).pendingReview} câu tự luận đang chờ giáo viên chấm, chưa tính vào điểm.` : ''}</p><p class="empty-state">Lần làm bài đã được lưu trong tiến độ tài khoản; nếu đã đăng nhập, tiến độ sẽ được đồng bộ cloud.</p></>}
          </section> : <section class="content-panel">
            <div class="section-toolbar">
              <button class="back-link" disabled={!quizPath.length} onClick={() => setQuizPath(path => path.slice(0, -1))}>← Quay lại</button>
              <span>{quizPath.map(node => node.name).join(' / ') || 'Ngân hàng đề & thử thách'}</span>
              {account.isAdmin && (!quizPath.length || hasNode(quizzes, quizPath[quizPath.length - 1]?.id)) && <button class="secondary-button" type="button" onClick={() => startQuizEditor()}>＋ Tạo đề thi</button>}
            </div>
            <div class="node-grid">
              {quizNodes.map(node => <button class="node-card" onClick={() => openQuizNode(node)}>
                <span>{node.icon || '📝'}</span><b>{node.name}</b><small>{(node.questions || node.quiz || []).length ? `${(node.questions || node.quiz || []).length} câu hỏi` : `${node.children?.length || 0} mục`}</small>
              </button>)}
            </div>
            {!quizNodes.length && <p class="empty-state">Chưa tìm thấy ngân hàng câu hỏi. Hãy nhập bản sao lưu từ phiên bản cũ.</p>}
          </section>}
        </>}
        {section === 'games' && <section class="content-panel games-workspace">
          <div class="games-heading"><div><h2>Khu vực giải trí</h2><p>Mở các nền tảng trò chơi và rèn luyện tư duy.</p></div><button class="secondary-button" type="button" onClick={addGamePlatform}>＋ Thêm nền tảng</button></div>
          <div class="game-tabs">{gamePlatforms.map(game => <button type="button" class={activeGameId === game.id ? 'active' : ''} onClick={() => setActiveGameId(game.id)}><span>{game.icon}</span>{game.name}{game.custom && <i onClick={event => { event.stopPropagation(); removeGamePlatform(game.id); }}>×</i>}</button>)}</div>
          {(() => { const game = gamePlatforms.find(item => item.id === activeGameId); return game ? <><div class="games-frame-toolbar"><b>{game.name}</b><button class="secondary-button" type="button" onClick={() => window.open(game.url,'_blank')}>Mở trang gốc ↗</button></div><iframe class="games-frame" title={game.name} src={game.url} loading="lazy" sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" /></> : <p class="empty-state">Chưa có nền tảng trò chơi.</p>; })()}
          <p class="empty-state">Một số website không cho phép nhúng hoặc yêu cầu đăng nhập riêng. Khi đó hãy dùng nút Mở trang gốc.</p>
        </section>}
        {section === 'browser' && <section class="content-panel browser-workspace">
          <div class="browser-heading"><div><h2>Trình duyệt mini</h2><p>Mở website trong PRINCIPIA nếu trang đó cho phép nhúng.</p></div><button class="secondary-button" type="button" disabled={!browserUrl} onClick={() => window.open(browserUrl, '_blank')}>Mở tab ngoài ↗</button></div>
          <form class="browser-toolbar" onSubmit={event => { event.preventDefault(); navigateMiniBrowser(); }}>
            <button type="button" class="secondary-button" disabled={browserIndex <= 0} onClick={() => { const next = browserIndex - 1; setBrowserIndex(next); setBrowserUrl(browserHistory[next]); setBrowserAddress(browserHistory[next]); }}>←</button>
            <button type="button" class="secondary-button" disabled={browserIndex < 0 || browserIndex >= browserHistory.length - 1} onClick={() => { const next = browserIndex + 1; setBrowserIndex(next); setBrowserUrl(browserHistory[next]); setBrowserAddress(browserHistory[next]); }}>→</button>
            <input value={browserAddress} onInput={event => setBrowserAddress(event.currentTarget.value)} placeholder="https://example.com" />
            <button class="primary-button" type="submit">Đi</button>
            <button class="secondary-button" type="button" disabled={!browserUrl} onClick={() => setBrowserReload(value => value + 1)}>↻</button>
          </form>
          {browserNotice && <p class="workspace-notice" role="status">{browserNotice}</p>}
          {browserUrl ? <iframe key={browserUrl + ':' + browserReload} class="mini-browser-frame" title="Trình duyệt mini PRINCIPIA" src={browserUrl} referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" /> : <div class="music-external-note"><b>Chưa mở website</b><p>Nhập địa chỉ vào thanh công cụ phía trên. Một số trang sẽ từ chối hiển thị trong khung nhúng; khi đó hãy chọn Mở tab ngoài.</p></div>}
        </section>}
        {section === 'music' && <section class="content-panel music-workspace">
          <div class="music-heading"><div><h2>♫ Music & Focus</h2><p>Không gian âm nhạc và bộ hẹn giờ tập trung.</p></div><button class={musicFocus ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setMusicFocus(value => !value)}>{musicFocus ? 'Tắt Focus mode' : 'Bật Focus mode'}</button></div>
          <div class="music-controls">
            <label>Nền tảng<select value={musicSource} onChange={event => {
              const value = event.currentTarget.value; setMusicSource(value);
              const homes: Record<string,string> = { spotify:'https://open.spotify.com/', youtube:'https://www.youtube.com/', soundcloud:'https://soundcloud.com/', cloudmusic:'https://music.163.com/', other:'' };
              setMusicUrl(value.startsWith('custom:') ? musicCustomSources[Number(value.split(':')[1])]?.url || '' : homes[value] || '');
            }}>
              <option value="spotify">Spotify</option><option value="youtube">YouTube</option><option value="soundcloud">SoundCloud</option><option value="cloudmusic">CloudMusic · NetEase</option><option value="other">Website khác</option>
              {musicCustomSources.map((source,index) => <option value={'custom:'+index}>{source.name}</option>)}
            </select></label>
            <button class="secondary-button" type="button" onClick={addMusicSource}>＋ Thêm nền tảng</button>
            <label>Link bài hát / playlist<input value={musicUrl} onInput={event => setMusicUrl(event.currentTarget.value)} placeholder="Dán link Spotify, YouTube, SoundCloud…" /></label>
            <label>Tên bài hát / playlist<input value={musicTrack} onInput={event => setMusicTrack(event.currentTarget.value)} placeholder="Tuỳ chọn" /></label>
          </div>
          {musicEmbedUrl ? <iframe class="music-player-frame" title="Music player" src={musicEmbedUrl} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /> : <div class="music-external-note"><b>Website này không hỗ trợ trình phát nhúng.</b><p>Mở nguồn nhạc trong trình duyệt ngoài để tiếp tục nghe.</p><button class="primary-button" type="button" onClick={() => { try { const url = new URL(musicUrl); if (['http:','https:'].includes(url.protocol)) window.open(url.href,'_blank'); } catch { setLibraryNotice('Link nhạc chưa hợp lệ.'); } }}>Mở nguồn nhạc ↗</button></div>}
          <div class="focus-timer">
            <div><span>POMODORO · THỜI GIAN TẬP TRUNG</span><strong>{formatFocusTime(focusSeconds)}</strong><small>{focusSeconds === 0 ? 'Hoàn thành phiên tập trung!' : focusRunning ? 'Đang tập trung' : 'Sẵn sàng bắt đầu'}</small></div>
            <div class="focus-timer-actions"><button class="primary-button" type="button" disabled={focusSeconds === 0} onClick={() => setFocusRunning(value => !value)}>{focusRunning ? 'Tạm dừng' : 'Bắt đầu'}</button><button class="secondary-button" type="button" onClick={() => { setFocusRunning(false); setFocusSeconds(25*60); }}>Đặt lại 25 phút</button></div>
          </div>
        </section>}
        {section === 'physics' && <section class="physics-workspace">
          <div class="physics-intro"><h2>Máy tính Vật lý</h2><p>Các phép tính cơ học dùng Rust trong ứng dụng Tauri và TypeScript khi chạy trên web.</p></div>
          <div class="physics-grid">
            <article class="physics-card"><h3>Chuyển động thẳng biến đổi đều</h3><div class="physics-inputs">
              <label>Vận tốc đầu u (m/s)<input type="number" value={motionInput.u} onInput={event => setMotionInput(v => ({...v,u:event.currentTarget.value}))} /></label>
              <label>Gia tốc a (m/s²)<input type="number" value={motionInput.a} onInput={event => setMotionInput(v => ({...v,a:event.currentTarget.value}))} /></label>
              <label>Thời gian t (s)<input type="number" value={motionInput.t} onInput={event => setMotionInput(v => ({...v,t:event.currentTarget.value}))} /></label>
            </div><button class="primary-button" type="button" disabled={physicsBusy} onClick={() => void runMotionCalculation()}>Tính chuyển động</button>
            {motionResult && <div class="physics-result"><span>Quãng dời: <b>{motionResult.position.toFixed(4)} m</b></span><span>Vận tốc cuối: <b>{motionResult.velocity.toFixed(4)} m/s</b></span><span>Gia tốc: <b>{motionResult.acceleration.toFixed(4)} m/s²</b></span></div>}</article>
            <article class="physics-card"><h3>Động năng</h3><div class="physics-inputs">
              <label>Khối lượng m (kg)<input type="number" min="0" value={energyInput.mass} onInput={event => setEnergyInput(v => ({...v,mass:event.currentTarget.value}))} /></label>
              <label>Tốc độ v (m/s)<input type="number" min="0" value={energyInput.speed} onInput={event => setEnergyInput(v => ({...v,speed:event.currentTarget.value}))} /></label>
            </div><button class="primary-button" type="button" disabled={physicsBusy} onClick={() => void runEnergyCalculation()}>Tính động năng</button>
            {energyResult !== null && <div class="physics-result"><span>Wđ = <b>{energyResult.toFixed(4)} J</b></span></div>}</article>
            <article class="physics-card"><h3>Ném xiên (bỏ qua lực cản)</h3><div class="physics-inputs">
              <label>Tốc độ đầu v₀ (m/s)<input type="number" min="0" value={projectileInput.speed} onInput={event => setProjectileInput(v => ({...v,speed:event.currentTarget.value}))} /></label>
              <label>Góc ném α (°)<input type="number" min="0" max="90" value={projectileInput.angle} onInput={event => setProjectileInput(v => ({...v,angle:event.currentTarget.value}))} /></label>
              <label>Gia tốc trọng trường g (m/s²)<input type="number" min="0.0001" value={projectileInput.gravity} onInput={event => setProjectileInput(v => ({...v,gravity:event.currentTarget.value}))} /></label>
            </div><button class="primary-button" type="button" disabled={physicsBusy} onClick={() => void runProjectileCalculation()}>Tính ném xiên</button>
            {projectileResult && <div class="physics-result"><span>Tầm xa: <b>{projectileResult.range.toFixed(4)} m</b></span><span>Thời gian bay: <b>{projectileResult.flight_time.toFixed(4)} s</b></span><span>Độ cao cực đại: <b>{projectileResult.max_height.toFixed(4)} m</b></span><span>Tốc độ chạm đất: <b>{projectileResult.impact_speed.toFixed(4)} m/s</b></span></div>}</article>
          </div>
          <AdvancedPhysicsLab />
          {physicsNotice && <p class="workspace-notice" role="status">{physicsNotice}</p>}
          <section class="content-panel formula-reference">
            <h2>📚 Cơ sở công thức</h2>
            <p>Tra cứu nhanh các công thức cốt lõi, kèm điều kiện áp dụng và đơn vị.</p>
            <div class="formula-grid">
              {[
                ['Động học','v = v₀ + at','s = v₀t + ½at²','Gia tốc không đổi; chọn chiều dương trước khi thay số.'],
                ['Chuyển động tròn','v = ωr','a hướng tâm = v²/r = ω²r','Vật chuyển động tròn bán kính r; ω tính bằng rad/s.'],
                ['Định luật II Newton','ΣF = ma','F (N), m (kg), a (m/s²)','Áp dụng trong hệ quy chiếu quán tính.'],
                ['Công – công suất','A = Fs cos α','P = A/t = Fv','α là góc giữa lực và độ dời; công đo bằng J.'],
                ['Động năng','Wđ = ½mv²','ΔWđ = A tổng','Định lý động năng: tổng công bằng độ biến thiên động năng.'],
                ['Thế năng trọng trường','Wt = mgh','ΔWt = mgΔh','Chọn mốc độ cao tùy ý; gần mặt đất g ≈ 9,81 m/s².'],
                ['Bảo toàn cơ năng','Wđ₁ + Wt₁ = Wđ₂ + Wt₂','W = hằng số','Khi chỉ có lực thế sinh công, bỏ qua lực cản.'],
                ['Động lượng – xung lượng','p = mv','I = FΔt = Δp','Xung lượng bằng độ biến thiên động lượng.'],
                ['Va chạm','m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′','Bảo toàn động lượng','Hệ kín, tổng ngoại lực trong thời gian va chạm không đáng kể.'],
                ['Áp suất','p = F/S','p chất lỏng = ρgh','Áp suất đo bằng Pa; S là diện tích chịu lực.'],
                ['Nhiệt lượng','Q = mcΔT','Q nóng chảy = λm','Không có chuyển thể: Q = mcΔT.'],
                ['Khí lý tưởng','pV = nRT','p₁V₁/T₁ = p₂V₂/T₂','Nhiệt độ tuyệt đối T tính bằng kelvin.'],
                ['Điện học – Ohm','U = IR','P = UI = I²R = U²/R','Đoạn mạch thuần trở.'],
                ['Điện năng','A = Pt = UIt','Q = I²Rt','A tính bằng J; kWh là đơn vị điện năng thương mại.'],
                ['Tụ điện','Q = CU','W = ½CU²','C tính bằng farad; U tính bằng volt.'],
                ['Từ trường','F = BIl sin α','F = qvB sin α','Lực từ; α giữa vectơ dòng/vận tốc và B.'],
                ['Sóng','v = λf','T = 1/f','v là tốc độ truyền sóng, không phải tốc độ dao động phần tử.'],
                ['Quang học','1/f = 1/d + 1/d′','k = −d′/d','Thấu kính mỏng; thống nhất quy ước dấu.'],
                ['Dao động điều hòa','x = A cos(ωt + φ)','v = −ωA sin(ωt + φ)','ω = 2πf; gia tốc a = −ω²x.'],
                ['Con lắc lò xo','T = 2π√(m/k)','W = ½kA²','Lý tưởng, bỏ qua ma sát.'],
                ['Con lắc đơn','T = 2π√(l/g)','ω = √(g/l)','Dao động góc nhỏ.'],
                ['Lực hấp dẫn','F = Gm₁m₂/r²','g = GM/r²','r là khoảng cách giữa tâm hai vật.']
              ].map(([name, formula, secondary, detail]) => <article class="physics-card formula-card">
                <small>{name}</small><h3>{formula}</h3><b>{secondary}</b><p>{detail}</p>
              </article>)}
            </div>
          </section>
        </section>}
        {section === 'library' && <section class="content-panel library-workspace">
          <div class="library-heading"><div><h2>Thư viện tài liệu</h2><p>Tệp được lưu ngoại tuyến trong kho riêng của tài khoản trên thiết bị này.</p></div><label class="primary-button file-button">＋ Thêm tài liệu<input type="file" multiple accept=".pdf,.epub,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,image/*,video/*,audio/*" onChange={handleLibraryUpload} /></label></div>
          <p class="empty-state">Hỗ trợ PDF, hình ảnh, video, âm thanh và tài liệu phổ biến. Mỗi tệp tối đa 100 MB. Thư viện chưa đồng bộ giữa các thiết bị.</p>
          {libraryNotice && <p class="workspace-notice" role="status">{libraryNotice}</p>}
          <div class="library-list">{libraryItems.map(item => <article key={item.id}>
            <span class="library-file-icon">{item.type.includes('pdf') ? 'PDF' : item.type.startsWith('image/') ? 'IMG' : item.type.startsWith('video/') ? 'VID' : item.type.startsWith('audio/') ? 'AUD' : 'FILE'}</span>
            <div><b>{item.name}</b><small>{(item.size / 1024 / 1024).toFixed(2)} MB · {new Date(item.addedAt).toLocaleDateString('vi-VN')}</small></div>
            <button class="secondary-button" type="button" onClick={() => void openLibraryPreview(item)}>Mở</button>
            <button class="quiet-button" type="button" onClick={() => void removeLibraryItem(item)}>Xóa</button>
          </article>)}</div>
          {!libraryItems.length && <p class="empty-state">Thư viện đang trống. Thêm tài liệu để bắt đầu.</p>}
          {libraryPreview && libraryPreviewUrl && <section class="library-preview">
            <div class="library-preview-heading"><b>{libraryPreview.name}</b><button class="quiet-button" type="button" onClick={() => { setLibraryPreview(null); setLibraryPreviewUrl(''); }}>Đóng</button></div>
            {libraryPreview.type === 'application/pdf' || libraryPreview.name.toLowerCase().endsWith('.pdf') ? <iframe title={libraryPreview.name} src={libraryPreviewUrl} /> : libraryPreview.type.startsWith('image/') ? <img src={libraryPreviewUrl} alt={libraryPreview.name} /> : libraryPreview.type.startsWith('video/') ? <video src={libraryPreviewUrl} controls /> : libraryPreview.type.startsWith('audio/') ? <audio src={libraryPreviewUrl} controls /> : <p class="empty-state">Định dạng này không có trình xem trực tiếp. Tải tệp xuống để mở bằng ứng dụng phù hợp.</p>}
            <a href={libraryPreviewUrl} download={libraryPreview.name}>Tải tài liệu xuống</a>
          </section>}
        </section>}
        {section === 'chat' && <section class="content-panel chat-workspace">
          <div class="chat-heading"><div><h2>AI Study Assistant</h2><p>Soạn câu hỏi, lưu lịch sử và mở AI đã chọn trong trình duyệt.</p></div>
            <div class="chat-provider-controls"><select value={chatProvider} onChange={event => { localStorage.setItem('principia_v2_ai_selected', event.currentTarget.value); setChatProvider(event.currentTarget.value); }}>
              <option value="chatgpt">ChatGPT</option><option value="gemini">Google Gemini</option><option value="claude">Claude</option><option value="deepseek">DeepSeek</option><option value="copilot">Microsoft Copilot</option>
              {customAIProviders.map(provider => <option value={provider.id}>{provider.name}</option>)}
            </select><button class="secondary-button" type="button" onClick={addCustomAIProvider}>＋ Thêm AI</button></div>
            <button class="secondary-button download-chat-link" type="button" onClick={() => chooseSection('downloads')}>⇩ Tải ứng dụng</button>
          </div>
          <div class="chat-provider-note">PRINCIPIA lưu lịch sử lời nhắc trên thiết bị. Khi mở AI, bạn cần đăng nhập và gửi nội dung ở trang của nhà cung cấp; V2 chưa giả lập phản hồi AI hoặc tự gửi dữ liệu của bạn.</div>
          <div class="chat-history">
            {chatMessages.length ? chatMessages.map((message, index) => <article class="chat-user-message" key={message.at + index}><small>BẠN · {new Date(message.at).toLocaleString('vi-VN')}</small><p>{message.text}</p></article>) : <div class="empty-state">Chưa có lời nhắc nào. Hãy nhập câu hỏi để bắt đầu.</div>}
          </div>
          <form class="chat-composer" onSubmit={event => {
            event.preventDefault();
            const text = chatDraft.trim();
            if (!text) return;
            const next = [...chatMessages, { role: 'user' as const, text, at: new Date().toISOString() }].slice(-100);
            setChatMessages(next);
            try { localStorage.setItem(chatStorageKey, JSON.stringify(next)); setChatNotice('Đã lưu lời nhắc vào lịch sử PRINCIPIA.'); }
            catch { setChatNotice('Bộ nhớ trình duyệt đầy; lời nhắc chỉ còn trong phiên này.'); }
            setChatDraft('');
          }}>
            <textarea value={chatDraft} onInput={event => setChatDraft(event.currentTarget.value)} placeholder="Hỏi về vật lý, toán học hoặc nội dung bài học…" rows={4} />
            <div class="chat-actions"><button class="secondary-button" type="submit" disabled={!chatDraft.trim()}>Lưu lời nhắc</button>
              <button class="primary-button" type="button" disabled={!chatDraft.trim()} onClick={() => {
                const urls: Record<string, string> = { chatgpt: 'https://chatgpt.com/', gemini: 'https://gemini.google.com/app', claude: 'https://claude.ai/new', deepseek: 'https://chat.deepseek.com/', copilot: 'https://copilot.microsoft.com/' };
                const targetUrl = customAIProviders.find(provider => provider.id === chatProvider)?.url || urls[chatProvider] || urls.chatgpt;
                const text = chatDraft.trim();
                const opened = window.open(targetUrl, '_blank');
                if (opened) {
                  void navigator.clipboard?.writeText(text).then(() => setChatNotice('Đã mở AI và sao chép câu hỏi. Dán vào khung chat của AI để gửi.'));
                  setChatNotice('Đã mở AI. Nếu chưa tự sao chép được, hãy dùng nút Sao chép câu hỏi.');
                } else setChatNotice('Trình duyệt chặn cửa sổ bật lên. Hãy cho phép pop-up rồi thử lại.');
              }}>Mở AI ↗</button>
              <button class="secondary-button" type="button" disabled={!chatDraft.trim()} onClick={() => { void navigator.clipboard?.writeText(chatDraft.trim()); setChatNotice('Đã sao chép câu hỏi.'); }}>Sao chép câu hỏi</button>
              <button class="quiet-button" type="button" disabled={!chatMessages.length} onClick={() => { if (confirm('Xóa toàn bộ lịch sử lời nhắc của AI này?')) { setChatMessages([]); localStorage.removeItem(chatStorageKey); } }}>Xóa lịch sử</button>
            </div>
          </form>
          {chatNotice && <p class="workspace-notice" role="status">{chatNotice}</p>}
        </section>}
        {section === 'downloads' && <section class="content-panel downloads-panel">
          <div class="downloads-heading"><div><h2>Tải ứng dụng PRINCIPIA</h2><p>Bản V2 đang được hoàn thiện và chưa phát hành bộ cài chính thức.</p></div><span class="release-status">V2 · Đang phát triển</span></div>
          <div class="download-platform-grid">
            {['Windows 10/11','macOS','Linux','Android','iOS'].map((platform,index) => <article><span>{['⊞','','🐧','◉',''][index]}</span><div><b>{platform}</b><small>{index < 3 ? 'Bộ cài desktop V2 chưa được ký và kiểm thử.' : 'Bản mobile V2 chưa được ký và phát hành.'}</small></div><em>Chưa phát hành</em></article>)}
          </div>
          <p class="empty-state">Không dùng các bộ cài cũ làm bản V2. Khi V2 hoàn tất, trang này sẽ có đúng bộ cài theo từng nền tảng và hướng dẫn cập nhật.</p>
          <button class="secondary-button" type="button" onClick={() => window.open('https://github.com/nguyen-quoc-huy0304/PRINCIPIA-PHYSICS-OLYMPIAD.ghithub.io/releases/latest','_blank')}>Xem lịch sử phát hành ↗</button>
        </section>}
        {section === 'profile' && <section class="content-panel profile-panel">
          <div class="profile-heading"><div><h2>Hồ sơ tài khoản</h2><p>Thông tin đăng nhập và tuỳ chỉnh riêng của bạn.</p></div><span class="profile-role">{account.isAdmin ? 'ADMIN' : 'LEARNER'}</span></div>
          <div class="profile-avatar">{(account.user.displayName || account.user.email || 'P').slice(0,1).toUpperCase()}</div>
          <label>Tên hiển thị<input value={profileName} onInput={event => setProfileName(event.currentTarget.value)} placeholder="Tên của bạn" /></label>
          <label>Email<input value={account.user.email || ''} readOnly /></label>
          <p class="empty-state">Trạng thái email: {account.user.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}.</p>
          <button class="primary-button" type="button" disabled={busy || !profileName.trim()} onClick={() => void saveProfile()}>Lưu hồ sơ</button>
          <div class="profile-theme"><div><b>Giao diện</b><small>Chọn chế độ hiển thị cho thiết bị này.</small></div><button class="secondary-button" type="button" onClick={() => setLightTheme(value => !value)}>{lightTheme ? 'Chuyển sang tối' : 'Chuyển sang sáng'}</button></div>
          <button class="quiet-button" type="button" onClick={() => void signOut()}>Đăng xuất tài khoản</button>
        </section>}
        {section === 'progress' && <section class="content-panel progress-panel">
          <div><strong>{(Number.isFinite(xp) ? xp : 0) + localProgress.xp}</strong><span>EXP tích lũy</span></div>
          <div><strong>{Math.max(Number.isFinite(streak) ? streak : 0, localProgress.streak)}</strong><span>Chuỗi ngày học</span></div>
          <div><strong>{completed.length + localProgress.completed.length}</strong><span>Bài/mục hoàn thành</span></div>
          <div class="achievement-panel"><h3>Thành tựu</h3><div class="achievement-grid">{achievementList.map(item => <article class={item.unlocked ? 'unlocked' : 'locked'}><span>{item.icon}</span><div><b>{item.title}</b><small>{item.description}</small></div><em>{item.unlocked ? 'Đã mở' : 'Chưa mở'}</em></article>)}</div></div>
          <div class="progress-history"><h3>Lịch sử làm bài</h3>{localProgress.attempts.length ? localProgress.attempts.map((attempt, index) => <article key={`${attempt.at}-${index}`}><b>{attempt.title}</b><span>{attempt.score}/{attempt.total} câu đúng · {new Date(attempt.at).toLocaleString('vi-VN')}</span></article>) : <p class="empty-state">Chưa có lần làm đề nào được lưu trong V2.</p>}</div>
          <p class="empty-state">Tiến độ V2 được lưu theo tài khoản trên thiết bị. Chuỗi ngày học tăng khi hoàn thành bài học hoặc nộp bài luyện tập; quản trị viên có thể sao lưu tiến độ qua cloud.</p>
        </section>}
        <div class="account-footer"><span>{account.user.email}</span><button class="quiet-button" onClick={() => void signOut()}>Đăng xuất</button></div>
        {status && <p class="auth-status" role="status">{status}</p>}
      </main>
      <BottomNavigation section={section} activeLesson={!!activeLesson} lessonTool={lessonTool} onLessonToolChange={setLessonTool} onSectionChange={chooseSection} onClearLesson={() => setActiveLesson(null)} />
    </div>
  );
}
