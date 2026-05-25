(() => {
  const display = document.getElementById('display');
  const keyboard = document.querySelector('.keyboard.calc');

  // Theme handling
  const THEME_KEY = 'theme_pref';
  const themeToggle = document.getElementById('themeToggle');
  function applyTheme(theme){
    if(theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    if(themeToggle) themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  const savedTheme = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);
  if(themeToggle){
    themeToggle.addEventListener('click', ()=>{
      const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  let firstValue = null;
  let operator = null;
  let waitingForSecond = false;
  let currentInput = '0';
  let secondInput = '';

  const operations = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '×': (a, b) => a * b,
    '÷': (a, b) => b === 0 ? NaN : a / b,
  };

  function renderDisplay() {
    if (operator && waitingForSecond) {
      display.value = `${trimNumberForDisplay(firstValue)} ${operator} ${secondInput || ''}`;
    } else {
      display.value = currentInput;
    }
  }

  function trimNumberForDisplay(n) {
    if (n === null || n === undefined) return '';
    return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(10)));
  }

  function inputDigit(digit) {
    if (waitingForSecond) {
      secondInput = (secondInput === '0') ? digit : secondInput + digit;
    } else {
      currentInput = (currentInput === '0') ? digit : currentInput + digit;
    }
    renderDisplay();
  }

  function inputDecimal() {
    if (waitingForSecond) {
      if (!secondInput.includes('.')) secondInput = secondInput ? secondInput + '.' : '0.';
    } else {
      if (!currentInput.includes('.')) currentInput = currentInput ? currentInput + '.' : '0.';
    }
    renderDisplay();
  }

  function clearAll() {
    firstValue = null; operator = null; waitingForSecond = false; currentInput = '0'; secondInput = '';
    renderDisplay();
  }

  function backspace() {
    if (waitingForSecond) {
      if (secondInput.length <= 1) secondInput = '';
      else secondInput = secondInput.slice(0, -1);
    } else {
      if (currentInput.length <= 1) currentInput = '0';
      else currentInput = currentInput.slice(0, -1);
    }
    renderDisplay();
  }

  function togglePlusMinus() {
    if (waitingForSecond) {
      if (!secondInput) return;
      secondInput = secondInput.startsWith('-') ? secondInput.slice(1) : '-' + secondInput;
    } else {
      currentInput = currentInput === '0' ? '0' : (currentInput.startsWith('-') ? currentInput.slice(1) : '-' + currentInput);
    }
    renderDisplay();
  }

  function percent() {
    if (waitingForSecond) {
      const v = parseFloat(secondInput || '0');
      secondInput = String(v / 100);
    } else {
      const v = parseFloat(currentInput || '0');
      currentInput = String(v / 100);
    }
    renderDisplay();
  }

  function handleOperator(nextOp) {
    if (operator && waitingForSecond && secondInput) {
      // chain calculation
      const a = firstValue;
      const b = parseFloat(secondInput);
      const res = operations[operator](a, b);
      firstValue = isNaN(res) ? null : res;
      secondInput = '';
      operator = nextOp;
      waitingForSecond = true;
      renderDisplay();
      return;
    }

    firstValue = parseFloat(currentInput);
    operator = nextOp;
    waitingForSecond = true;
    secondInput = '';
    renderDisplay();
  }

  // History handling with localStorage persistence
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const STORAGE_KEY = 'calc_history_v1';
  let history = [];

  function timeNow() { return new Date().toLocaleTimeString(); }

  function saveHistory() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch (e) {} }

  function renderHistory() {
    historyList.innerHTML = '';
    history.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="val">${item.text}</span><span class="time">${item.time}</span>`;
      historyList.appendChild(li);
    });
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) history = parsed;
    } catch (e) { history = []; }
    renderHistory();
  }

  function logDisplay(action) {
    const entry = { text: (operator && waitingForSecond && secondInput) ? `${trimNumberForDisplay(firstValue)} ${operator} ${secondInput}` : (operator && waitingForSecond ? `${trimNumberForDisplay(firstValue)} ${operator}` : currentInput), time: timeNow() };
    history.unshift(entry);
    saveHistory();
    renderHistory();
  }

  function logCalculation(a, op, b, result) {
    const entry = { text: `${trimNumberForDisplay(a)} ${op} ${b} = ${result}`, time: timeNow() };
    history.unshift(entry);
    saveHistory();
    renderHistory();
  }

  clearHistoryBtn.addEventListener('click', () => { history = []; saveHistory(); renderHistory(); });

  // allow clicking history items to reuse the value/result
  historyList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const valSpan = li.querySelector('.val');
    if (!valSpan) return;
    const text = valSpan.textContent.trim();
    const eq = text.lastIndexOf('=');
    let toSet = eq !== -1 ? text.slice(eq + 1).trim() : text;
    const num = parseFloat(toSet.replace(',', '.'));
    if (!isNaN(num)) {
      currentInput = String(num);
      firstValue = null; operator = null; waitingForSecond = false; secondInput = '';
      renderDisplay();
    } else {
      currentInput = toSet; firstValue = null; operator = null; waitingForSecond = false; secondInput = '';
      renderDisplay();
    }
  });

  // load saved history on start
  loadHistory();

  function calculate() {
    if (!operator || firstValue === null) return;
    const second = secondInput ? parseFloat(secondInput) : parseFloat(currentInput);
    const result = operations[operator](firstValue, second);
    const final = isNaN(result) ? 'Error' : trimNumberForDisplay(result);
    // log calculation via history function
    logCalculation(firstValue, operator, second, final);
    // set result as current input
    currentInput = final;
    firstValue = null; operator = null; waitingForSecond = false; secondInput = '';
    renderDisplay();
  }

  keyboard.addEventListener('click', (e) => {
    const btn = e.target.closest('.key');
    if (!btn) return;
    const key = btn.dataset.key;
    const action = btn.dataset.action;

    if (action) {
      switch (action) {
        case 'clear': clearAll(); break;
        case 'backspace': backspace(); break;
        case 'equals': calculate(); break;
        case 'plusminus': togglePlusMinus(); break;
        case 'percent': percent(); break;
      }
      if (action !== 'equals' && action !== 'clear') logDisplay(action);
      return;
    }

    if (btn.classList.contains('operator')) {
      handleOperator(key);
      return;
    }

    if (key === '.') { inputDecimal(); return; }
    if (/^\d$/.test(key)) { inputDigit(key); return; }
  });

  clearAll();
})();