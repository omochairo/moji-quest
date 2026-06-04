// ==========================================================================
// moji-quest - ひらがな・カタカナ・えいごカードアプリ ロジック
// ==========================================================================

// 1. 文字データの定義
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

const ENG_DATA = {
  a: { name: 'A〜G', chars: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  ka: { name: 'H〜N', chars: ['H', 'I', 'J', 'K', 'L', 'M', 'N'] },
  sa: { name: 'O〜T', chars: ['O', 'P', 'Q', 'R', 'S', 'T'] },
  ta: { name: 'U〜Z', chars: ['U', 'V', 'W', 'X', 'Y', 'Z'] }
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
  charType: 'hiragana',       // 文字モード: hiragana / katakana / english_upper / english_lower
  playMode: '5',              // プレイモード: 5 (5問で終了) / all (全部) / endless (無限)
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
const radioPlayModes = document.querySelectorAll('input[name="play-mode"]');
const gridExtraRows = document.getElementById('grid-extra-rows');
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
    checkBoxes.forEach(cb => {
      const parentLabel = cb.closest('.row-checkbox-label');
      if (parentLabel && parentLabel.style.display !== 'none') {
        cb.checked = true;
      }
    });
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

  // もんだい数ラジオボタンの変更同期
  radioPlayModes.forEach(radio => {
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
  // 1. もじのしゅるい同期
  const selectedRadio = document.querySelector('input[name="char-type"]:checked');
  state.charType = selectedRadio ? selectedRadio.value : 'hiragana';

  // もじのしゅるいアクティブクラス更新
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

  // 2. もんだい数同期
  const selectedPlayMode = document.querySelector('input[name="play-mode"]:checked');
  state.playMode = selectedPlayMode ? selectedPlayMode.value : '5';

  // もんだい数アクティブクラス更新
  radioPlayModes.forEach(radio => {
    const label = radio.closest('.btn-toggle-label');
    if (label) {
      if (radio.checked) {
        label.classList.add('active');
      } else {
        label.classList.remove('active');
      }
    }
  });

  // 3. 音声設定の同期
  state.voiceEnabled = settingVoiceRead.checked;
  state.voiceOnTapEnabled = settingVoiceTap.checked;

  // 4. 文字の種類に応じたチェックボックスと表示名の動的書き換え
  const isEnglish = state.charType.startsWith('english');
  
  if (isEnglish) {
    if (gridExtraRows) gridExtraRows.style.display = 'none';

    checkBoxes.forEach(cb => {
      const parentLabel = cb.closest('.row-checkbox-label');
      if (!parentLabel) return;

      const rowKey = cb.value;
      if (ENG_DATA[rowKey]) {
        parentLabel.style.display = 'flex';
        const nameEl = parentLabel.querySelector('.row-name');
        const previewEl = parentLabel.querySelector('.row-preview');
        
        let nameText = ENG_DATA[rowKey].name;
        let previewText = ENG_DATA[rowKey].chars.join('');

        if (state.charType === 'english_lower') {
          nameText = nameText.toLowerCase();
          previewText = previewText.toLowerCase();
        }
        
        if (nameEl) nameEl.innerText = nameText;
        if (previewEl) {
          previewEl.setAttribute('data-original', previewText);
          previewEl.innerText = previewText;
        }
      } else {
        parentLabel.style.display = 'none';
        cb.checked = false;
      }
    });
  } else {
    if (gridExtraRows) gridExtraRows.style.display = 'block';

    checkBoxes.forEach(cb => {
      const parentLabel = cb.closest('.row-checkbox-label');
      if (!parentLabel) return;

      const rowKey = cb.value;
      parentLabel.style.display = 'flex';

      if (KANA_DATA[rowKey]) {
        const nameEl = parentLabel.querySelector('.row-name');
        const previewEl = parentLabel.querySelector('.row-preview');
        
        let nameText = KANA_DATA[rowKey].name;
        let previewText = KANA_DATA[rowKey].chars.join('');

        if (state.charType === 'katakana') {
          previewText = toKatakana(previewText);
        }

        if (nameEl) nameEl.innerText = nameText;
        if (previewEl) {
          previewEl.setAttribute('data-original', previewText);
          previewEl.innerText = previewText;
        }
      }
    });
  }

  // 選択された行の集計
  const activeRows = [];
  checkBoxes.forEach(cb => {
    if (cb.checked) {
      activeRows.push(cb.value);
    }
  });
  state.selectedRows = activeRows;

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
let speechVoiceJa = null;
let speechVoiceEn = null;
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
  
  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    speechVoiceJa = voices.find(v => v.lang === 'ja-JP' || v.lang.includes('ja')) || null;
    speechVoiceEn = voices.find(v => v.lang === 'en-US' || v.lang.startsWith('en')) || null;
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

  // 英語モードの時は大文字読み（capital A等）を避けるため、すべて小文字に変換して発音させる
  const isEnglish = state.charType.startsWith('english');
  const textToSpeak = isEnglish ? char.toLowerCase() : char;

  const utterance = new SpeechSynthesisUtterance(textToSpeak);

  if (isEnglish) {
    if (speechVoiceEn) utterance.voice = speechVoiceEn;
    utterance.lang = 'en-US';
    utterance.pitch = 1.15;
    utterance.rate = 0.85;
  } else {
    if (speechVoiceJa) utterance.voice = speechVoiceJa;
    utterance.lang = 'ja-JP';
    utterance.pitch = 1.35;
    utterance.rate = 0.85;
  }

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

  const isEnglish = state.charType.startsWith('english');
  const dataSource = isEnglish ? ENG_DATA : KANA_DATA;

  // 1. 文字リストの構築
  let charsToPlay = [];
  state.selectedRows.forEach(rowKey => {
    if (dataSource[rowKey]) {
      dataSource[rowKey].chars.forEach(c => {
        let charValue = c;
        if (state.charType === 'english_lower') {
          charValue = c.toLowerCase();
        }
        charsToPlay.push({
          char: charValue,
          row: rowKey
        });
      });
    }
  });

  // 2. シャッフル (Fisher-Yates)
  shuffleArray(charsToPlay);
  
  // 3. プレイモードに応じた切り出し (無限モード時は全件をループベースとして使用)
  if (state.playMode === '5') {
    state.sessionCharacters = charsToPlay.slice(0, 5);
  } else {
    state.sessionCharacters = charsToPlay;
  }
  
  state.currentIndex = 0;

  // 4. 画面の更新と表示
  showScreen('play');
  updateCardUI();

  // 最初の文字を発音
  setTimeout(() => {
    speakCurrentCharacter();
  }, 400);
}

function showNextCard() {
  triggerCelebrationConfetti();

  state.currentIndex++;
  
  if (state.playMode === 'endless') {
    if (state.currentIndex >= state.sessionCharacters.length) {
      shuffleArray(state.sessionCharacters);
      state.currentIndex = 0;
    }
    updateCardUI();
    setTimeout(() => {
      speakCurrentCharacter();
    }, 300);
  } else {
    if (state.currentIndex >= state.sessionCharacters.length) {
      setTimeout(() => {
        showClearScreen();
      }, 500);
    } else {
      updateCardUI();
      setTimeout(() => {
        speakCurrentCharacter();
      }, 300);
    }
  }
}

function updateCardUI() {
  const currentObj = state.sessionCharacters[state.currentIndex];
  
  let charToShow = currentObj.char;
  if (state.charType === 'katakana') {
    charToShow = toKatakana(charToShow);
  }
  displayCharacter.innerText = charToShow;

  // 英語は文字幅が広めなので、はみ出し防止のためフォントサイズをやや小さく(12rem)
  const isEnglish = state.charType.startsWith('english');
  if (isEnglish) {
    displayCharacter.style.fontSize = '12rem';
  } else {
    displayCharacter.style.fontSize = '15rem';
  }
  
  // 残り枚数の更新
  if (state.playMode === 'endless') {
    progressIndicator.innerText = `よんだかず: ${state.currentIndex + 1}もん`;
    progressBar.style.width = `100%`;
  } else {
    progressIndicator.innerText = `${state.currentIndex + 1} / ${state.sessionCharacters.length}`;
    const progressPercent = ((state.currentIndex) / state.sessionCharacters.length) * 100;
    progressBar.style.width = `${progressPercent}%`;
  }

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
