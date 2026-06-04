// ==========================================================================
// moji-quest - ひらがなカードアプリ ロジック
// ==========================================================================

// 1. ひらがなデータの定義
const KANA_DATA = {
  a: { name: 'あ行', chars: ['あ', 'い', 'う', 'え', 'お'] },
  ka: { name: 'か行', chars: ['か', 'き', 'く', 'け', 'こ'] },
  sa: { name: 'さ行', chars: ['さ', 'し', 'す', 'せ', 'そ'] },
  ta: { name: 'た行', chars: ['た', 'ち', 'つ', 'て', 'と'] },
  na: { name: 'な行', chars: ['な', 'に', 'ぬ', 'ね', 'の'] },
  ha: { name: 'は行', chars: ['は', 'ひ', 'ふ', 'へ', 'ほ'] },
  ma: { name: 'ま行', chars: ['ま', 'み', 'む', 'め', 'も'] },
  ya: { name: 'や行', chars: ['や', 'ゆ', 'よ'] },
  ra: { name: 'ら行', chars: ['ら', 'り', 'る', 'れ', 'ろ'] },
  wa: { name: 'わ行', chars: ['わ', 'を', 'ん'] },
  dakuon: { 
    name: 'だくおん', 
    chars: [
      'が', 'ぎ', 'ぐ', 'げ', 'ご', 
      'ざ', 'じ', 'ず', 'ぜ', 'ぞ', 
      'だ', 'ぢ', 'づ', 'で', 'ど', 
      'ば', 'び', 'ぶ', 'べ', 'ぼ',
      'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'
    ] 
  }
};

// 行ごとのテーマカラー定義
const ROW_THEMES = {
  a: { main: '#ff6b6b', light: '#ffebee' },
  ka: { main: '#ffa136', light: '#fff3e0' },
  sa: { main: '#e9ba00', light: '#fffde7' },
  ta: { main: '#4ecdc4', light: '#e0f7fa' },
  na: { main: '#3bb273', light: '#e8f5e9' },
  ha: { main: '#45b7d1', light: '#e1f5fe' },
  ma: { main: '#b983ff', light: '#f3e5f5' },
  ya: { main: '#ff6bbb', light: '#fce4ec' },
  ra: { main: '#1abc9c', light: '#e0f2f1' },
  wa: { main: '#d35400', light: '#fbe9e7' },
  dakuon: { main: '#7f8c8d', light: '#f5f5f5' }
};

// 2. アプリの状態 (State)
let state = {
  selectedRows: ['a', 'ka'], // 初期値はあ行・か行
  sessionCharacters: [],      // 今回プレイするシャッフルされた文字リスト
  currentIndex: 0,            // 現在のカード位置
  charType: 'hiragana',       // 文字モード: hiragana / katakana
  voiceEnabled: false,        // 音声読み上げON/OFF（初期OFFに変更）
  voiceOnTapEnabled: true     // タップ時の音声読み上げ（初期ON）
};

// 3. DOM要素
const screenSetup = document.getElementById('screen-setup');
const screenPlay = document.getElementById('screen-play');
const screenClear = document.getElementById('screen-clear');

const gridJapaneseRows = document.getElementById('grid-japanese-rows');
const checkBoxes = document.querySelectorAll('input[name="kana-row"]');
const radioCharTypes = document.querySelectorAll('input[name="char-type"]');
const btnSelectAll = document.getElementById('btn-select-all');
const btnClearAll = document.getElementById('btn-clear-all');
const settingVoiceRead = document.getElementById('setting-voice-read');
const settingVoiceTap = document.getElementById('setting-voice-tap');
const btnStart = document.getElementById('btn-start');

const btnBackToSetup = document.getElementById('btn-back-to-setup');
const progressIndicator = document.getElementById('progress-indicator');
const progressBar = document.getElementById('progress-bar');
const displayCharacter = document.getElementById('display-character');
const cardElement = document.getElementById('card-element');
const cardTriggerArea = document.getElementById('card-trigger-area');
const voiceHint = document.getElementById('voice-hint');
const btnNext = document.getElementById('btn-next');

const clearCount = document.getElementById('clear-count');
const btnRestart = document.getElementById('btn-restart');
const btnSetup = document.getElementById('btn-setup');

// 4. 初期化処理
function init() {
  setupEventListeners();
  syncSettingsFromDOM();
  
  // iOS等でWeb Speech APIをアクティベートするためのダミー発声準備
  window.addEventListener('touchstart', initSpeechSynthesis, { once: true });
  window.addEventListener('click', initSpeechSynthesis, { once: true });
}

// 5. イベントリスナーの設定
function setupEventListeners() {
  // すべて選ぶ・リセット
  btnSelectAll.addEventListener('click', () => {
    checkBoxes.forEach(cb => cb.checked = true);
    syncSettingsFromDOM();
  });
  
  btnClearAll.addEventListener('click', () => {
    checkBoxes.forEach(cb => cb.checked = false);
    syncSettingsFromDOM();
  });

  // 各種チェックボックスの変更同期
  checkBoxes.forEach(cb => {
    cb.addEventListener('change', syncSettingsFromDOM);
  });

  // もじのしゅるいラジオボタンの変更同期
  radioCharTypes.forEach(radio => {
    radio.addEventListener('change', syncSettingsFromDOM);
  });

  // 音声設定の同期
  settingVoiceRead.addEventListener('change', () => {
    state.voiceEnabled = settingVoiceRead.checked;
  });
  settingVoiceTap.addEventListener('change', () => {
    state.voiceOnTapEnabled = settingVoiceTap.checked;
  });

  // スタートボタン
  btnStart.addEventListener('click', startSession);

  // 次へボタン
  btnNext.addEventListener('click', showNextCard);

  // もどるボタン
  btnBackToSetup.addEventListener('click', () => {
    showScreen('setup');
  });

  // カードタップで再発音 & アニメーション
  cardTriggerArea.addEventListener('click', () => {
    triggerCardAnimation();
    if (state.voiceOnTapEnabled) {
      speakCurrentCharacter(true); // タップ時はバイパストグルをtrueにする
    }
  });

  // クリア画面のアクション
  btnRestart.addEventListener('click', () => {
    startSession();
  });
  btnSetup.addEventListener('click', () => {
    showScreen('setup');
  });
}

// 設定をDOMから読み込み
function syncSettingsFromDOM() {
  const activeRows = [];
  checkBoxes.forEach(cb => {
    if (cb.checked) {
      activeRows.push(cb.value);
    }
  });
  state.selectedRows = activeRows;
  state.voiceEnabled = settingVoiceRead.checked;
  state.voiceOnTapEnabled = settingVoiceTap.checked;

  const selectedRadio = document.querySelector('input[name="char-type"]:checked');
  state.charType = selectedRadio ? selectedRadio.value : 'hiragana';

  // ラジオボタンの見た目（activeクラス）を更新
  radioCharTypes.forEach(radio => {
    const label = radio.closest('.btn-toggle-label');
    if (label) {
      if (radio.checked) {
        label.classList.add('active');
      } else {
        label.classList.remove('active');
      }
    }
  });

  // プレビューテキストのカタカナ化/ひらがな化
  const rowPreviewEls = document.querySelectorAll('.row-preview');
  rowPreviewEls.forEach(el => {
    const originalText = el.getAttribute('data-original') || el.innerText;
    if (!el.getAttribute('data-original')) {
      el.setAttribute('data-original', originalText);
    }
    if (state.charType === 'katakana') {
      el.innerText = toKatakana(originalText);
    } else {
      el.innerText = originalText;
    }
  });

  // スタートボタンの有効化/無効化
  if (state.selectedRows.length === 0) {
    btnStart.disabled = true;
    btnStart.style.opacity = 0.5;
    btnStart.innerText = 'ぎょうを えらんでね！';
  } else {
    btnStart.disabled = false;
    btnStart.style.opacity = 1;
    btnStart.innerText = 'はじめる！ 🚀';
  }
}

// 6. 音声合成 (Web Speech API)
let speechVoice = null;
let speechActivated = false;

function initSpeechSynthesis() {
  if (speechActivated) return;
  
  // ダミー発声をしてブラウザの制限を解除
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(u);
    loadVoice();
  }
  speechActivated = true;
}

function loadVoice() {
  if (!('speechSynthesis' in window)) return;
  
  // 日本語かつ、より子ども向けに適したキュートな音声を探す
  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // 日本語の音声を優先
    speechVoice = voices.find(v => v.lang === 'ja-JP' || v.lang.includes('ja')) || null;
  };

  setVoice();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = setVoice;
  }
}

function speakCharacter(char, bypassToggle = false) {
  if (!('speechSynthesis' in window)) return;
  if (!bypassToggle && !state.voiceEnabled) return;

  // すでに喋っているのをキャンセル
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(char);
  if (speechVoice) {
    utterance.voice = speechVoice;
  }
  
  // 子供が聞き取りやすい設定 (高めで少しゆっくり)
  utterance.pitch = 1.35; // 高めのキュートな声
  utterance.rate = 0.85;  // 少しゆっくり

  window.speechSynthesis.speak(utterance);
}

function speakCurrentCharacter(bypassToggle = false) {
  if (state.sessionCharacters.length > 0) {
    const currentCharObj = state.sessionCharacters[state.currentIndex];
    speakCharacter(currentCharObj.char, bypassToggle);
  }
}

// 7. セッション制御
function startSession() {
  if (state.selectedRows.length === 0) return;

  // 1. 文字リストの構築
  let charsToPlay = [];
  state.selectedRows.forEach(rowKey => {
    if (KANA_DATA[rowKey]) {
      KANA_DATA[rowKey].chars.forEach(c => {
        charsToPlay.push({
          char: c,
          row: rowKey
        });
      });
    }
  });

  // 2. シャッフル (Fisher-Yates)
  shuffleArray(charsToPlay);
  state.sessionCharacters = charsToPlay;
  state.currentIndex = 0;

  // 3. 画面の更新と表示
  showScreen('play');
  updateCardUI();

  // 最初の文字を発音
  // 短いタイムアウトを入れることで、画面遷移アニメーションと重ならないようにする
  setTimeout(() => {
    speakCurrentCharacter();
  }, 400);
}

function showNextCard() {
  triggerCelebrationConfetti(); // 読めたお祝いに軽い紙吹雪

  state.currentIndex++;
  if (state.currentIndex >= state.sessionCharacters.length) {
    // すべて終了！クリア画面へ
    setTimeout(() => {
      showClearScreen();
    }, 500);
  } else {
    updateCardUI();
    // 次の文字を発音
    setTimeout(() => {
      speakCurrentCharacter();
    }, 300);
  }
}

function updateCardUI() {
  const currentObj = state.sessionCharacters[state.currentIndex];
  
  let charToShow = currentObj.char;
  if (state.charType === 'katakana') {
    charToShow = toKatakana(charToShow);
  }
  displayCharacter.innerText = charToShow;
  
  // 残り枚数の更新
  progressIndicator.innerText = `${state.currentIndex + 1} / ${state.sessionCharacters.length}`;
  const progressPercent = ((state.currentIndex) / state.sessionCharacters.length) * 100;
  progressBar.style.width = `${progressPercent}%`;

  // タップ音声設定に応じてヒントの表示・非表示を切り替え
  if (state.voiceOnTapEnabled) {
    voiceHint.style.display = 'flex';
  } else {
    voiceHint.style.display = 'none';
  }

  // テーマカラーの動的変更
  const theme = ROW_THEMES[currentObj.row] || ROW_THEMES.a;
  document.documentElement.style.setProperty('--theme-color', theme.main);
  document.documentElement.style.setProperty('--theme-color-light', theme.light);
  
  // カードを切り替える際のソフトなふわっとアニメーション
  cardElement.style.transform = 'scale(0.8) rotate(-5deg)';
  cardElement.style.opacity = '0';
  
  setTimeout(() => {
    cardElement.style.transform = 'scale(1) rotate(0deg)';
    cardElement.style.opacity = '1';
  }, 100);
}

// 8. 演出 (アニメーション & 紙吹雪)
function triggerCardAnimation() {
  cardElement.classList.remove('card-animate');
  // リフローを起こしてアニメーションを再トリガー
  void cardElement.offsetWidth;
  cardElement.classList.add('card-animate');
}

// カードクリア時の軽い紙吹雪
function triggerCelebrationConfetti() {
  if (typeof confetti === 'undefined') return;
  
  confetti({
    particleCount: 25,
    spread: 40,
    origin: { y: 0.8 },
    colors: ['#ff6b6b', '#ffa136', '#e9ba00', '#4ecdc4', '#45b7d1', '#b983ff']
  });
}

// 全クリ時の豪華な紙吹雪
function triggerFullClearConfetti() {
  if (typeof confetti === 'undefined') return;

  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // 左右から紙吹雪を発射
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
}

// 9. 画面切り替え
function showScreen(screenName) {
  screenSetup.classList.remove('active');
  screenPlay.classList.remove('active');
  screenClear.classList.remove('active');

  if (screenName === 'setup') {
    screenSetup.classList.add('active');
  } else if (screenName === 'play') {
    screenPlay.classList.add('active');
  } else if (screenName === 'clear') {
    screenClear.classList.add('active');
  }
}

function showClearScreen() {
  clearCount.innerText = state.sessionCharacters.length;
  showScreen('clear');
  triggerFullClearConfetti();
  
  // クリアしたよ！のファンファーレボイス（Web Speech）- 設定にかかわらず発音させる
  setTimeout(() => {
    speakCharacter('できたね！すごーい！がんばりました！', true);
  }, 500);
}

// 10. ヘルパー関数
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ひらがなからカタカナへの自動変換
function toKatakana(str) {
  return str.replace(/[\u3041-\u3096]/g, function(match) {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
}

// 起動
window.addEventListener('DOMContentLoaded', init);
