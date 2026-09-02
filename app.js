/**
 * app.js - 초등학교 쉬는시간 알람 및 학급 안내판 메인 스크립트
 * - 연보라(Lavender) & 블루 하모니 테마
 * - 마지막 1분 짹깍짹깍(Tick-Tock) 시계 초침 소리
 * - 두꺼운 대형 원형 타이머 & 귀여운 토끼 캐릭터 연동
 */

document.addEventListener('DOMContentLoaded', () => {
  // ================= 1. 상태 및 기본 설정 =================
  const state = {
    // 기본 정보
    className: '즐거운 수업',
    periodTag: '1차시 쉬는시간',
    
    // 타이머 상태
    totalSeconds: 10 * 60,
    remainingSeconds: 10 * 60,
    isRunning: false,
    timerInterval: null,
    endTime: null,
    hasWarned1Min: false,
    lastTickedSecond: null,

    // 공지사항 기본값 (3줄 분할 - 연보라/블루 톤)
    notices: [
      { tag: '쉬는 시간 수칙', text: '화장실 다녀오기, 물 마시기', color: '#8B5CF6' },
      { tag: '안전 약속', text: '뛰지 않기', color: '#0284C7' },
      { tag: '바른 생활', text: '매너있게 말하고 행동하기', color: '#6366F1' }
    ],

    // 미디어 설정 (사진 / 영상 - 기본값은 비어있음 ➔ 알림판이 넓게 표시됨)
    activeMediaTab: 'image',
    customImageUrl: '',
    customVideoUrl: '',

    // 테마 및 소리 (기본 테마: 연보라 lavender)
    theme: 'lavender', // 'lavender', 'dark'
    soundType: 'school_bell',
    volume: 1.0, // 교실용 최대 볼륨 기본값
    isSoundMuted: false,
    warningSoundEnabled: true
  };

  // 빠른 공지사항 프리셋 데이터
  const noticePresets = {
    default: [
      { tag: '쉬는 시간 수칙', text: '화장실 다녀오기, 물 마시기', color: '#8B5CF6' },
      { tag: '안전 약속', text: '뛰지 않기', color: '#0284C7' },
      { tag: '바른 생활', text: '매너있게 말하고 행동하기', color: '#6366F1' }
    ],
    art: [
      { tag: '쉬는 시간', text: '화장실 다녀오고 손 깨끗이 씻기 💧', color: '#8B5CF6' },
      { tag: '미술 시간 준비', text: '미술: 스케치북, 색연필, 가위, 풀 준비하기 🎨', color: '#0284C7' },
      { tag: '책상 정리', text: '작품 활동을 위해 책상 위를 넓게 정돈해요 ✨', color: '#6366F1' }
    ],
    pe: [
      { tag: '이동 안내', text: '체육: 운동화 끈을 단단히 묶고 체육관으로 이동해요 👟', color: '#0284C7' },
      { tag: '수분 보충', text: '개인 물병 챙겨서 줄 서기 💧', color: '#8B5CF6' },
      { tag: '안전 주의', text: '장난치지 않고 안전하고 질서 있게 이동해요 🏃', color: '#EF4444' }
    ],
    lunch: [
      { tag: '위생 수칙', text: '비누로 30초 동안 꼼꼼하게 손 씻기! 🧼', color: '#8B5CF6' },
      { tag: '급식 질서', text: '급식실로 차례차례 이동하고 골고루 맛있게 먹어요 🍱', color: '#0284C7' },
      { tag: '양치 약속', text: '식사 후에는 깨끗하게 양치질하기 🪥', color: '#6366F1' }
    ],
    clean: [
      { tag: '청소 시간', text: '내가 맡은 청소 구역 깨끗하게 정리하기 🧹', color: '#8B5CF6' },
      { tag: '분리수거', text: '종이와 플라스틱 바르게 분리수거하기 ♻️', color: '#0284C7' },
      { tag: '환기하기', text: '창문 활짝 열어 교실 공기 맑게 환기하기 🍃', color: '#6366F1' }
    ]
  };

  // ================= 2. DOM 요소 캐싱 =================
  const el = {
    // 헤더
    classNameDisplay: document.getElementById('class-name-display'),
    periodTagDisplay: document.getElementById('period-tag-display'),
    liveDate: document.getElementById('live-date'),
    liveClock: document.getElementById('live-clock'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    soundIcon: document.getElementById('sound-icon'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    btnOpenSettings: document.getElementById('btn-open-settings'),

    // 타이머
    timerDisplay: document.getElementById('timer-display'),
    timerStatusBadge: document.getElementById('timer-status-badge'),
    timerTotalSub: document.getElementById('timer-total-sub'),
    timerProgressRing: document.getElementById('timer-progress-ring'),
    timerCard: document.getElementById('timer-card'),
    btnTimerToggle: document.getElementById('btn-timer-toggle'),
    btnToggleIcon: document.getElementById('btn-toggle-icon'),
    btnToggleLabel: document.getElementById('btn-toggle-label'),
    btnTimerReset: document.getElementById('btn-timer-reset'),
    timerBunny: document.getElementById('timer-bunny'),
    timerChasingPuppy: document.getElementById('timer-chasing-puppy'),
    
    // 빠른 시간 버튼
    btnAdd1m: document.getElementById('btn-add-1m'),
    btnAdd3m: document.getElementById('btn-add-3m'),
    btnAdd5m: document.getElementById('btn-add-5m'),
    btnSub1m: document.getElementById('btn-sub-1m'),
    quickSet5: document.getElementById('quick-set-5'),
    quickSet10: document.getElementById('quick-set-10'),
    quickSet15: document.getElementById('quick-set-15'),
    quickSet20: document.getElementById('quick-set-20'),

    // 우측 레이아웃 및 공지사항
    rightColumnContainer: document.getElementById('right-column-container'),
    noticeListContainer: document.getElementById('notice-list-container'),
    btnEditNoticeQuick: document.getElementById('btn-edit-notice-quick'),

    // 미디어 영역
    mediaCardBox: document.getElementById('media-card-box'),
    mediaTabs: document.querySelectorAll('.media-tab'),
    viewImage: document.getElementById('view-image'),
    viewVideo: document.getElementById('view-video'),
    customImageDisplay: document.getElementById('custom-image-display'),
    videoFrameContainer: document.getElementById('video-frame-container'),

    // 하단 액션 버튼
    btnLuckyDraw: document.getElementById('btn-lucky-draw'),
    btnLadderGame: document.getElementById('btn-ladder-game'),

    // 설정 모달
    settingsModal: document.getElementById('settings-modal'),
    btnModalClose: document.getElementById('btn-modal-close'),
    btnModalCancel: document.getElementById('btn-modal-cancel'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    settingsNavBtns: document.querySelectorAll('.settings-nav-btn'),
    settingsTabPanes: document.querySelectorAll('.settings-tab-pane'),

    // 설정 폼 입력필드
    settingClassName: document.getElementById('setting-class-name'),
    settingPeriodTag: document.getElementById('setting-period-tag'),
    settingTimerMinutes: document.getElementById('setting-timer-minutes'),
    setting1minWarning: document.getElementById('setting-1min-warning'),
    settingNotice1: document.getElementById('setting-notice-1'),
    settingNotice2: document.getElementById('setting-notice-2'),
    settingNotice3: document.getElementById('setting-notice-3'),
    settingImageFile: document.getElementById('setting-image-file'),
    settingImageUrl: document.getElementById('setting-image-url'),
    settingVideoUrl: document.getElementById('setting-video-url'),
    btnClearMedia: document.getElementById('btn-clear-media'),
    themeCardOptions: document.querySelectorAll('.theme-card-option'),
    settingSoundType: document.getElementById('setting-sound-type'),
    btnPreviewSound: document.getElementById('btn-preview-sound'),
    settingVolume: document.getElementById('setting-volume'),
    setDefaultMinBtns: document.querySelectorAll('.set-default-min'),
    noticePresetBtns: document.querySelectorAll('.notice-preset-btn'),

    // 룰렛 모달
    rouletteModal: document.getElementById('roulette-modal'),

    // 사다리 모달
    ladderModal: document.getElementById('ladder-modal')
  };

  // ================= 3. 로컬 스토리지 불러오기 / 저장 =================
  function loadSavedSettings() {
    try {
      const saved = localStorage.getItem('elementary_break_alarm_settings_v8');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.className) state.className = data.className;
        if (data.periodTag) state.periodTag = data.periodTag;
        if (data.totalSeconds) {
          state.totalSeconds = data.totalSeconds;
          state.remainingSeconds = data.totalSeconds;
        }
        if (data.notices && Array.isArray(data.notices)) state.notices = data.notices;
        if (data.activeMediaTab) state.activeMediaTab = data.activeMediaTab;
        if (data.customImageUrl !== undefined) state.customImageUrl = data.customImageUrl;
        if (data.customVideoUrl !== undefined) state.customVideoUrl = data.customVideoUrl;
        if (data.theme) state.theme = data.theme;
        if (data.soundType) state.soundType = data.soundType;
        if (data.volume !== undefined) state.volume = data.volume;
        if (data.warningSoundEnabled !== undefined) state.warningSoundEnabled = data.warningSoundEnabled;
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }

  function saveSettings() {
    try {
      const data = {
        className: state.className,
        periodTag: state.periodTag,
        totalSeconds: state.totalSeconds,
        notices: state.notices,
        activeMediaTab: state.activeMediaTab,
        customImageUrl: state.customImageUrl,
        customVideoUrl: state.customVideoUrl,
        theme: state.theme,
        soundType: state.soundType,
        volume: state.volume,
        warningSoundEnabled: state.warningSoundEnabled
      };
      localStorage.setItem('elementary_break_alarm_settings_v8', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  // ================= 4. 시계 및 날짜 업데이트 로직 =================
  function updateLiveClock() {
    const now = new Date();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const day = days[now.getDay()];
    el.liveDate.textContent = `${year}년 ${month}월 ${date}일 ${day}`;

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;

    el.liveClock.textContent = `${ampm} ${displayHours}:${minutes}:${seconds}`;
  }

  // ================= 5. 타이머 제어 및 렌더링 =================
  // 반지름 r=136 일 때 원 둘레 길이: 2 * Math.PI * 136 = 854.513
  const RING_CIRCUMFERENCE = 2 * Math.PI * 136;

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateChasingPuppy(progress) {
    if (!el.timerChasingPuppy) return;
    // 12시 방향(-PI/2)에서 시작하여 원형 게이지 끝부분 위치와 1:1 일치 계산
    const angleRad = -Math.PI / 2 + progress * 2 * Math.PI;
    const r = 136;
    const cx = 160;
    const cy = 160;
    const x = cx + r * Math.cos(angleRad);
    const y = cy + r * Math.sin(angleRad);

    el.timerChasingPuppy.setAttribute('transform', `translate(${x.toFixed(2)}, ${y.toFixed(2)})`);
  }

  function updateTimerDisplay() {
    el.timerDisplay.textContent = formatTime(state.remainingSeconds);
    el.timerTotalSub.textContent = `총 설정: ${Math.round(state.totalSeconds / 60)}분`;

    const progress = state.totalSeconds > 0 ? (state.remainingSeconds / state.totalSeconds) : 0;
    const offset = RING_CIRCUMFERENCE * (1 - progress);
    el.timerProgressRing.style.strokeDashoffset = offset;

    // 시간을 쫓아 달리는 귀여운 강아지 위치 업데이트
    updateChasingPuppy(progress);

    document.title = state.isRunning 
      ? `(${formatTime(state.remainingSeconds)}) 쉬는 시간 - ${state.className}`
      : `쉬는 시간 알람 - ${state.className}`;
  }

  function startTimer() {
    if (state.remainingSeconds <= 0) {
      state.remainingSeconds = state.totalSeconds;
      state.hasWarned1Min = false;
    }

    state.isRunning = true;
    state.lastTickedSecond = null;
    state.endTime = Date.now() + state.remainingSeconds * 1000;
    el.btnToggleIcon.textContent = '⏸';
    el.btnToggleLabel.textContent = '일시정지';
    el.btnTimerToggle.className = 'big-btn btn-pause';
    el.timerCard.classList.add('timer-running');
    el.timerStatusBadge.textContent = '쉬는 시간 진행 중 🎈';

    if (window.soundEngine) window.soundEngine.playStart();

    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      const now = Date.now();
      const remainingMs = state.endTime - now;
      state.remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

      // 마지막 1분(60초 이하, 0초 초과) 동안 1초마다 짹깍짹깍(Tick-Tock) 소리 재생
      if (state.remainingSeconds <= 60 && state.remainingSeconds > 0) {
        if (state.lastTickedSecond !== state.remainingSeconds) {
          state.lastTickedSecond = state.remainingSeconds;
          if (window.soundEngine && !state.isSoundMuted && state.warningSoundEnabled) {
            window.soundEngine.playTickTock(state.remainingSeconds % 2 === 0);
          }
        }
      }

      // 60초 도달 시 1회 예고 알림음 울림
      if (state.remainingSeconds === 60 && !state.hasWarned1Min) {
        state.hasWarned1Min = true;
        if (window.soundEngine && !state.isSoundMuted && state.warningSoundEnabled) {
          window.soundEngine.play1MinWarning();
        }
        el.timerStatusBadge.textContent = '쉬는 시간 1분 전! 🔔';
      }

      updateTimerDisplay();

      if (state.remainingSeconds <= 0) {
        finishTimer();
      }
    }, 200);
  }

  function pauseTimer() {
    state.isRunning = false;
    state.lastTickedSecond = null;
    clearInterval(state.timerInterval);
    el.btnToggleIcon.textContent = '▶';
    el.btnToggleLabel.textContent = '계속하기';
    el.btnTimerToggle.className = 'big-btn btn-start';
    el.timerCard.classList.remove('timer-running');
    el.timerStatusBadge.textContent = '잠시 멈춤 ⏸';
  }

  function resetTimer(newMinutes = null) {
    pauseTimer();
    if (newMinutes !== null) {
      state.totalSeconds = newMinutes * 60;
    }
    state.remainingSeconds = state.totalSeconds;
    state.hasWarned1Min = false;
    state.lastTickedSecond = null;
    el.btnToggleIcon.textContent = '▶';
    el.btnToggleLabel.textContent = '시작하기';
    el.timerStatusBadge.textContent = '쉬는 시간 준비 ✨';
    updateTimerDisplay();
    if (window.soundEngine) window.soundEngine.playClick();
  }

  function finishTimer() {
    pauseTimer();
    state.remainingSeconds = 0;
    updateTimerDisplay();
    el.timerStatusBadge.textContent = '쉬는 시간 끝! 수업 준비 🔔';
    el.btnToggleLabel.textContent = '다시 시작';

    if (window.confettiEngine) {
      window.confettiEngine.start(5000);
    }
    if (window.soundEngine && !state.isSoundMuted) {
      window.soundEngine.playAlarmEnd();
    }
  }

  function adjustTimer(deltaSeconds) {
    if (window.soundEngine) window.soundEngine.playClick();
    state.remainingSeconds = Math.max(0, Math.min(3600, state.remainingSeconds + deltaSeconds));
    if (state.remainingSeconds > state.totalSeconds) {
      state.totalSeconds = state.remainingSeconds;
    }
    if (state.isRunning) {
      state.endTime = Date.now() + state.remainingSeconds * 1000;
    }
    updateTimerDisplay();
  }

  // ================= 6. 공지사항 렌더링 =================
  function renderNotices() {
    el.noticeListContainer.innerHTML = '';
    const icons = ['💧', '🏃', '🤝'];

    state.notices.forEach((n, idx) => {
      if (!n.text || n.text.trim() === '') return;
      const item = document.createElement('div');
      item.className = 'notice-item';
      const icon = icons[idx % icons.length];

      item.innerHTML = `
        <span class="notice-pin-icon">${icon}</span>
        <div class="notice-text-content">
          <span class="notice-tag">${escapeHtml(n.tag || '안내')}</span>
          <div class="notice-main-text">${escapeHtml(n.text)}</div>
        </div>
      `;
      el.noticeListContainer.appendChild(item);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ================= 7. 미디어 영역 조건부 표시 / 숨김 =================
  function updateMediaVisibility() {
    const hasImage = Boolean(state.customImageUrl && state.customImageUrl.trim());
    const hasVideo = Boolean(state.customVideoUrl && state.customVideoUrl.trim());
    const hasMedia = hasImage || hasVideo;

    if (hasMedia) {
      el.rightColumnContainer.classList.remove('no-media');
      if (hasImage && !hasVideo) {
        setMediaTab('image');
      } else if (!hasImage && hasVideo) {
        setMediaTab('video');
      } else {
        setMediaTab(state.activeMediaTab || 'image');
      }
    } else {
      el.rightColumnContainer.classList.add('no-media');
    }
  }

  function setMediaTab(tabName) {
    state.activeMediaTab = tabName;
    el.mediaTabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    el.viewImage.style.display = tabName === 'image' ? 'flex' : 'none';
    el.viewVideo.style.display = tabName === 'video' ? 'flex' : 'none';

    if (tabName === 'image') renderImageView();
    if (tabName === 'video') renderVideoView();
  }

  function renderImageView() {
    if (state.customImageUrl) {
      el.customImageDisplay.src = state.customImageUrl;
      el.customImageDisplay.style.display = 'block';
    } else {
      el.customImageDisplay.style.display = 'none';
    }
  }

  function parseYouTubeEmbedUrl(input) {
    if (!input) return null;
    let url = input.trim();

    // 1) 사용자가 <iframe> 태그 전체를 붙여넣은 경우 src 속성 추출
    const iframeMatch = url.match(/src=["']([^"']+)["']/i);
    if (iframeMatch) {
      url = iframeMatch[1];
    }

    // 2) 모든 유튜브 URL 형식(watch?v=, youtu.be/, shorts/, live/, embed/ 등)을 지원하는 정규식
    const ytRegExp = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(ytRegExp);

    if (match && match[1]) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&playsinline=1&enablejsapi=1`;
    }

    return url;
  }

  function renderVideoView() {
    if (state.customVideoUrl && state.customVideoUrl.trim()) {
      const rawUrl = state.customVideoUrl.trim();
      const embedUrl = parseYouTubeEmbedUrl(rawUrl);

      if (embedUrl && (embedUrl.includes('youtube.com/embed') || embedUrl.includes('youtube-nocookie.com/embed') || embedUrl.includes('embed'))) {
        el.videoFrameContainer.innerHTML = `
          <div style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; background:#000; border-radius:12px; overflow:hidden;">
            <iframe 
              src="${embedUrl}" 
              title="교실 영상 플레이어" 
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
              style="width: 100%; height: 100%; border: none; flex: 1;">
            </iframe>
            <div style="position:absolute; bottom:8px; right:8px; z-index:10; background:rgba(0,0,0,0.7); padding:3px 10px; border-radius:8px; backdrop-filter:blur(4px);">
              <a href="${rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl}" target="_blank" rel="noopener noreferrer" style="color:#FFF; font-size:0.8rem; text-decoration:none; display:flex; align-items:center; gap:4px;">
                <span>▶</span> 유튜브에서 직접 보기
              </a>
            </div>
          </div>
        `;
      } else {
        el.videoFrameContainer.innerHTML = `
          <video controls autoplay playsinline src="${rawUrl}" style="width:100%; height:100%; border-radius:12px; object-fit:contain; background:#000;"></video>
        `;
      }
    } else {
      el.videoFrameContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#94A3B8; font-size:1.05rem; gap:6px;">
          <span>🎬 등록된 영상이 없습니다.</span>
          <span style="font-size:0.85rem;">[⚙️ 교실 설정]에서 유튜브 링크를 등록해주세요.</span>
        </div>
      `;
    }
  }

  // ================= 8. 테마 및 사운드 제어 =================
  function applyTheme(themeName) {
    state.theme = themeName || 'lavender';
    document.documentElement.setAttribute('data-theme', state.theme);
    el.themeCardOptions.forEach(opt => {
      if (opt.dataset.themeVal === state.theme) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  }

  function updateSoundSettings() {
    if (window.soundEngine) {
      window.soundEngine.setSoundType(state.soundType);
      window.soundEngine.setVolume(state.volume);
      window.soundEngine.warningSoundEnabled = state.warningSoundEnabled;
    }
    if (state.isSoundMuted) {
      el.soundIcon.textContent = '🔇';
      el.btnSoundToggle.innerHTML = `<span>🔇</span> 소리 꺼짐`;
      if (window.soundEngine) window.soundEngine.setVolume(0);
    } else {
      el.soundIcon.textContent = '🔔';
      el.btnSoundToggle.innerHTML = `<span>🔔</span> 소리 켜짐`;
      if (window.soundEngine) window.soundEngine.setVolume(state.volume);
    }
  }

  // ================= 9. 설정 모달 제어 =================
  function openSettingsModal(defaultTab = 'tab-timer') {
    el.settingClassName.value = state.className;
    el.settingPeriodTag.value = state.periodTag;
    el.settingTimerMinutes.value = Math.round(state.totalSeconds / 60);
    el.setting1minWarning.checked = state.warningSoundEnabled;

    el.settingNotice1.value = state.notices[0]?.text || '';
    el.settingNotice2.value = state.notices[1]?.text || '';
    el.settingNotice3.value = state.notices[2]?.text || '';

    el.settingImageUrl.value = state.customImageUrl;
    el.settingVideoUrl.value = state.customVideoUrl;

    el.settingSoundType.value = state.soundType;
    el.settingVolume.value = state.volume;

    applyTheme(state.theme);
    switchSettingsTab(defaultTab);

    el.settingsModal.classList.add('open');
    if (window.soundEngine) window.soundEngine.playClick();
  }

  function closeSettingsModal() {
    el.settingsModal.classList.remove('open');
  }

  function switchSettingsTab(targetId) {
    el.settingsNavBtns.forEach(btn => {
      if (btn.dataset.target === targetId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    el.settingsTabPanes.forEach(pane => {
      if (pane.id === targetId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  function saveSettingsFromForm() {
    state.className = el.settingClassName.value.trim() || '즐거운 수업';
    state.periodTag = el.settingPeriodTag.value.trim() || '1차시 쉬는시간';

    const min = parseInt(el.settingTimerMinutes.value, 10) || 10;
    const clampedMin = Math.max(1, Math.min(60, min));
    
    if (state.totalSeconds !== clampedMin * 60 && !state.isRunning) {
      state.totalSeconds = clampedMin * 60;
      state.remainingSeconds = state.totalSeconds;
    } else {
      state.totalSeconds = clampedMin * 60;
    }

    state.warningSoundEnabled = el.setting1minWarning.checked;

    state.notices = [
      { tag: '쉬는 시간 수칙', text: el.settingNotice1.value.trim() || '화장실 다녀오기, 물 마시기', color: '#8B5CF6' },
      { tag: '안전 약속', text: el.settingNotice2.value.trim() || '뛰지 않기', color: '#0284C7' },
      { tag: '바른 생활', text: el.settingNotice3.value.trim() || '매너있게 말하고 행동하기', color: '#6366F1' }
    ];

    state.customImageUrl = el.settingImageUrl.value.trim();
    state.customVideoUrl = el.settingVideoUrl.value.trim();
    state.soundType = el.settingSoundType.value;
    state.volume = parseFloat(el.settingVolume.value);

    el.classNameDisplay.textContent = state.className;
    el.periodTagDisplay.textContent = state.periodTag;
    renderNotices();
    updateMediaVisibility();
    updateSoundSettings();
    updateTimerDisplay();

    saveSettings();
    closeSettingsModal();
    if (window.soundEngine) window.soundEngine.playStart();
  }

  // ================= 10. 전체 화면 토글 =================
  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`전체화면 전환 중 오류: ${err.message}`);
      });
      el.btnFullscreen.innerHTML = `<span>⛶</span> 전체화면 해제`;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        el.btnFullscreen.innerHTML = `<span>⛶</span> 전체화면`;
      }
    }
  }

  // ================= 11. 이벤트 바인딩 =================
  function bindEvents() {
    setInterval(updateLiveClock, 1000);
    updateLiveClock();

    el.btnTimerToggle.addEventListener('click', () => {
      if (state.isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });

    el.btnTimerReset.addEventListener('click', () => resetTimer());

    el.btnAdd1m.addEventListener('click', () => adjustTimer(60));
    el.btnAdd3m.addEventListener('click', () => adjustTimer(180));
    el.btnAdd5m.addEventListener('click', () => adjustTimer(300));
    el.btnSub1m.addEventListener('click', () => adjustTimer(-60));

    el.quickSet5.addEventListener('click', () => resetTimer(5));
    el.quickSet10.addEventListener('click', () => resetTimer(10));
    el.quickSet15.addEventListener('click', () => resetTimer(15));
    el.quickSet20.addEventListener('click', () => resetTimer(20));

    el.mediaTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.tab;
        setMediaTab(targetTab);
        if (window.soundEngine) window.soundEngine.playClick();
      });
    });

    el.btnSoundToggle.addEventListener('click', () => {
      state.isSoundMuted = !state.isSoundMuted;
      updateSoundSettings();
    });

    el.btnFullscreen.addEventListener('click', toggleFullScreen);

    // 교실 설정 모달
    el.btnOpenSettings.addEventListener('click', () => openSettingsModal('tab-timer'));
    el.btnEditNoticeQuick.addEventListener('click', () => openSettingsModal('tab-notice'));
    el.btnModalClose.addEventListener('click', closeSettingsModal);
    el.btnModalCancel.addEventListener('click', closeSettingsModal);
    el.btnSaveSettings.addEventListener('click', saveSettingsFromForm);

    // 미디어 비우기 버튼
    if (el.btnClearMedia) {
      el.btnClearMedia.addEventListener('click', () => {
        el.settingImageUrl.value = '';
        el.settingVideoUrl.value = '';
        el.settingImageFile.value = '';
        state.customImageUrl = '';
        state.customVideoUrl = '';
        if (window.soundEngine) window.soundEngine.playClick();
      });
    }

    // 배경 클릭 시 모달 닫기
    el.settingsModal.addEventListener('click', (e) => {
      if (e.target === el.settingsModal) closeSettingsModal();
    });
    if (el.rouletteModal) {
      el.rouletteModal.addEventListener('click', (e) => {
        if (e.target === el.rouletteModal && window.rouletteGame) window.rouletteGame.closeModal();
      });
    }
    if (el.ladderModal) {
      el.ladderModal.addEventListener('click', (e) => {
        if (e.target === el.ladderModal && window.ladderGame) window.ladderGame.closeModal();
      });
    }

    el.settingsNavBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        switchSettingsTab(e.target.dataset.target);
      });
    });

    el.setDefaultMinBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        el.settingTimerMinutes.value = e.target.dataset.min;
      });
    });

    el.themeCardOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const themeVal = opt.dataset.themeVal;
        applyTheme(themeVal);
        if (window.soundEngine) window.soundEngine.playClick();
      });
    });

    el.btnPreviewSound.addEventListener('click', () => {
      if (window.soundEngine) {
        window.soundEngine.setSoundType(el.settingSoundType.value);
        window.soundEngine.setVolume(parseFloat(el.settingVolume.value));
        window.soundEngine.playAlarmEnd();
      }
    });

    el.noticePresetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        const preset = noticePresets[type];
        if (preset) {
          el.settingNotice1.value = preset[0]?.text || '';
          el.settingNotice2.value = preset[1]?.text || '';
          el.settingNotice3.value = preset[2]?.text || '';
          if (window.soundEngine) window.soundEngine.playClick();
        }
      });
    });

    el.settingImageFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          el.settingImageUrl.value = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // ================= 13. 초기화 =================
  function initApp() {
    loadSavedSettings();

    el.classNameDisplay.textContent = state.className;
    el.periodTagDisplay.textContent = state.periodTag;
    applyTheme(state.theme);
    updateSoundSettings();
    renderNotices();
    updateMediaVisibility();
    updateTimerDisplay();

    if (window.confettiEngine) {
      window.confettiEngine.init('confetti-canvas');
    }

    if (window.ladderGame) {
      window.ladderGame.init('ladder-modal');
    }

    if (window.rouletteGame) {
      window.rouletteGame.init('roulette-modal');
    }

    bindEvents();
  }

  initApp();
});
